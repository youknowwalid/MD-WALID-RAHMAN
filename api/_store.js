// The only file that talks to the database for orders. It uses Supabase's REST API with the
// server-only service key, which the browser never sees. Tests replace it with an in-memory copy.
import config from '../public-config.json' with { type: 'json' };

const baseUrl = () => (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

export const storeConfigured = () => Boolean(baseUrl() && serviceKey());

const q = encodeURIComponent;

async function rest(path, { method = 'GET', body, prefer, extra = {}, fetchImpl = fetch } = {}) {
  const key = serviceKey();
  const res = await fetchImpl(`${baseUrl()}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { ok: res.ok, status: res.status, data, res };
}

const must = (r, what) => {
  if (!r.ok) throw new Error(`${what} failed (${r.status})`);
  return r.data;
};
const firstOrNull = (rows) => (Array.isArray(rows) && rows.length ? rows[0] : null);
const isDuplicate = (r) => r.status === 409 && String(r.data?.code) === '23505';

/** Builds "col=eq.value&col2=is.null" from { col: value | null }. */
const conditions = (cond = {}) =>
  Object.entries(cond).map(([col, value]) => (value === null ? `${col}=is.null` : `${col}=eq.${q(value)}`)).join('&');

export function createStore({ fetchImpl = fetch } = {}) {
  return {
    async countOrders({ since, ipHash, email }) {
      let path = `orders?select=id&created_at=gte.${q(since)}`;
      if (ipHash) path += `&ip_hash=eq.${q(ipHash)}`;
      if (email) path += `&email=eq.${q(email)}`;
      const r = await rest(path, { prefer: 'count=exact', extra: { 'Range-Unit': 'items', Range: '0-0' }, fetchImpl });
      if (!r.ok && r.status !== 206) throw new Error(`count failed (${r.status})`);
      const total = r.res.headers.get('content-range')?.split('/')[1];
      return Number(total) || 0;
    },
    async getOrder(id) {
      return firstOrNull(must(await rest(`orders?id=eq.${q(id)}&select=*&limit=1`, { fetchImpl }), 'getOrder'));
    },
    async findOrderByTrx(trxId) {
      return firstOrNull(must(await rest(`orders?trx_id=eq.${q(trxId)}&status=neq.rejected&select=*&limit=1`, { fetchImpl }), 'findOrderByTrx'));
    },
    async insertOrder(order) {
      const r = await rest('orders', { method: 'POST', body: order, prefer: 'return=representation', fetchImpl });
      if (isDuplicate(r)) { const e = new Error('duplicate'); e.code = 'duplicate'; throw e; }
      return firstOrNull(must(r, 'insertOrder'));
    },
    /** Updates an order only if every condition holds (e.g. still pending). Returns the new row, or null. */
    async updateOrder(id, patch, cond = {}) {
      const extra = conditions(cond);
      const path = `orders?id=eq.${q(id)}${extra ? `&${extra}` : ''}`;
      return firstOrNull(must(await rest(path, { method: 'PATCH', body: patch, prefer: 'return=representation', fetchImpl }), 'updateOrder'));
    },
    async findSmsByTrx(trxId) {
      return firstOrNull(must(await rest(`payment_sms?trx_id=eq.${q(trxId)}&select=*&limit=1`, { fetchImpl }), 'findSmsByTrx'));
    },
    /** Saves a message once. Returns { sms, duplicate }. */
    async insertSms(sms) {
      const r = await rest('payment_sms', { method: 'POST', body: sms, prefer: 'return=representation', fetchImpl });
      if (isDuplicate(r)) return { sms: await this.findSmsByTrx(sms.trx_id), duplicate: true };
      return { sms: firstOrNull(must(r, 'insertSms')), duplicate: false };
    },
    /** Marks a message as used by one order. Only one order can ever win. */
    async claimSms(smsId, orderId) {
      const r = await rest(`payment_sms?id=eq.${q(smsId)}&claimed_by=is.null`, { method: 'PATCH', body: { claimed_by: orderId }, prefer: 'return=representation', fetchImpl });
      return Boolean(firstOrNull(must(r, 'claimSms')));
    },
    async releaseSms(smsId, orderId) {
      must(await rest(`payment_sms?id=eq.${q(smsId)}&claimed_by=eq.${q(orderId)}`, { method: 'PATCH', body: { claimed_by: null }, fetchImpl }), 'releaseSms');
    },
  };
}
