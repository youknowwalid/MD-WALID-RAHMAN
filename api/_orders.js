// The rules for orders paid by bKash / Nagad "send money". Everything here works on a `store`
// (see _store.js) and a `mailer`, so it can be tested without a database or a mail server.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import config from '../public-config.json' with { type: 'json' };
import { BUCKET, EDITIONS, WALLETS, isEdition } from './_catalog.js';
import { normalizePhone, normalizeTrx } from './_sms.js';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TOKEN_RE = /^[0-9a-f]{32,96}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TEN_MINUTES = 10 * 60 * 1000;

export const siteUrl = () => (process.env.SITE_URL || 'https://walidrahman.com').replace(/\/+$/, '');

export const hashIp = (ip) => createHash('sha256').update(`order-ip:${ip || 'unknown'}`).digest('hex').slice(0, 32);

const tokensMatch = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Checks what the buyer typed. Returns { value } or { error: 'invalid', field }. */
export function validateOrderInput(input) {
  const edition = input?.edition;
  if (!isEdition(edition)) return { error: 'invalid', field: 'edition' };
  const email = String(input?.email ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return { error: 'invalid', field: 'email' };
  const wallet = String(input?.wallet ?? '').toLowerCase();
  if (!WALLETS.includes(wallet)) return { error: 'invalid', field: 'wallet' };
  const trxId = normalizeTrx(input?.trxId);
  if (!/^[A-Z0-9]{6,20}$/.test(trxId)) return { error: 'invalid', field: 'trxId' };
  const sender = normalizePhone(input?.sender);
  if (!sender) return { error: 'invalid', field: 'sender' };
  return { value: { edition, email, wallet, trxId, sender } };
}

/** True when a saved SMS really pays this order. */
export function smsPaysOrder(order, sms) {
  if (!sms || !order) return false;
  if (sms.trx_id !== order.trx_id) return false;
  if (sms.amount === null || sms.amount === undefined || !(Number(sms.amount) >= order.amount_due)) return false;
  // The paying number must be known and must be the number the buyer typed.
  return Boolean(sms.sender) && normalizePhone(sms.sender) === order.sender;
}

/** What the buyer's browser is allowed to know about an order. */
export const publicOrder = (order) => ({
  id: order.id,
  status: order.status,
  edition: order.edition,
  name: EDITIONS[order.edition]?.name ?? 'Your purchase',
  amount: order.amount_due,
  downloadUrl: order.status === 'paid' ? `/api/download?id=${order.id}&t=${order.access_token}` : null,
  emailed: Boolean(order.emailed_at),
});

function deliveryEmail(order) {
  const book = EDITIONS[order.edition];
  const link = `${siteUrl()}/thank-you?order=${order.id}&t=${order.access_token}`;
  const subject = `Your download is ready: ${book.name}`;
  const text = [
    'Hello,',
    '',
    `Thank you! Your payment of ৳${order.amount_due.toLocaleString('en-US')} was confirmed (transaction ${order.trx_id}).`,
    '',
    `Download your book here: ${link}`,
    '',
    'Keep this email. The link works any time you need to download the file again, so please do not share it.',
    '',
    'If anything goes wrong, just reply to this email.',
    '',
    'Walid Rahman Swapnil',
    'walidrahman.com',
  ].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4e4e7">
<h1 style="font-size:22px;margin:0 0 12px">Your download is ready</h1>
<p style="margin:0 0 16px;line-height:1.55">Thank you! Your payment of <strong>৳${order.amount_due.toLocaleString('en-US')}</strong> was confirmed (transaction <strong>${order.trx_id}</strong>).</p>
<p style="margin:0 0 24px;line-height:1.55"><strong>${book.name}</strong></p>
<p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#f45901;color:#000000;font-weight:bold;text-decoration:none;padding:14px 24px;border-radius:12px">Download your book</a></p>
<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#52525b">Keep this email: the link works any time you need the file again. Please do not share it.</p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#52525b">Trouble? Just reply to this email.</p>
</div>
<p style="text-align:center;font-size:12px;color:#71717a;margin:16px 0 0">Walid Rahman Swapnil &middot; walidrahman.com</p>
</div></body></html>`;
  return { subject, text, html };
}

/**
 * Sends the download e-mail once (or again, with force). A failure never loses the order: the
 * buyer still gets the download on screen, and the admin can press "Resend".
 */
export async function deliverEmail(order, { store, mailer, now = () => new Date() }, { force = false } = {}) {
  if (order.status !== 'paid') return { sent: false, reason: 'not_paid' };
  if (!force) {
    const claimed = await store.updateOrder(order.id, { emailed_at: now().toISOString() }, { emailed_at: null });
    if (!claimed) return { sent: false, reason: 'already_sent' };
  }
  const result = await mailer({ to: order.email, ...deliveryEmail(order) });
  if (result.ok) {
    await store.updateOrder(order.id, { emailed_at: now().toISOString(), email_error: null });
    return { sent: true };
  }
  await store.updateOrder(order.id, { emailed_at: null, email_error: String(result.reason || 'unknown error').slice(0, 300) });
  return { sent: false, reason: result.reason };
}

async function markPaid(order, how, extra, ctx) {
  const patch = { status: 'paid', paid_how: how, paid_at: ctx.now().toISOString(), ...extra };
  const updated = await ctx.store.updateOrder(order.id, patch, { status: 'pending' });
  if (!updated) return null;
  await deliverEmail(updated, ctx);
  return (await ctx.store.getOrder(order.id)) ?? updated;
}

/** If a matching payment message has arrived, marks the order paid and e-mails the download. */
export async function tryAutoPay(order, ctx) {
  if (order.status !== 'pending') return order;
  const sms = await ctx.store.findSmsByTrx(order.trx_id);
  if (!sms || sms.claimed_by || !smsPaysOrder(order, sms)) return order;
  if (!(await ctx.store.claimSms(sms.id, order.id))) return order;
  const paid = await markPaid(order, 'auto', { payment_sms_id: sms.id }, ctx);
  if (!paid) {
    await ctx.store.releaseSms(sms.id, order.id);
    return (await ctx.store.getOrder(order.id)) ?? order;
  }
  return paid;
}

/** Called by the SMS webhook: a new payment message may complete a waiting order. */
export async function onSmsStored(sms, ctx) {
  if (!sms?.trx_id) return null;
  const waiting = await ctx.store.findOrderByTrx(sms.trx_id);
  return waiting && waiting.status === 'pending' ? tryAutoPay(waiting, ctx) : null;
}

/** A buyer submits their transaction id. Returns { order, token } or { error }. */
export async function createOrder(input, ctx, { ip = '' } = {}) {
  const checked = validateOrderInput(input);
  if (checked.error) return checked;
  const { edition, email, wallet, trxId, sender } = checked.value;

  const since = new Date(ctx.now().getTime() - TEN_MINUTES).toISOString();
  const ipHash = hashIp(ip);
  const [fromIp, fromEmail, overall] = await Promise.all([
    ctx.store.countOrders({ since, ipHash }),
    ctx.store.countOrders({ since, email }),
    ctx.store.countOrders({ since }),
  ]);
  if (fromIp >= 8 || fromEmail >= 5) return { error: 'rate_limited' };
  if (overall >= 60) return { error: 'busy' };

  const existing = await ctx.store.findOrderByTrx(trxId);
  if (existing) {
    // The same buyer pressing the button twice just gets their order back.
    if (existing.email === email && existing.sender === sender) return { order: await tryAutoPay(existing, ctx), token: existing.access_token };
    return { error: 'duplicate' };
  }

  let order;
  try {
    order = await ctx.store.insertOrder({
      edition, email, wallet, trx_id: trxId, sender,
      amount_due: EDITIONS[edition].price,
      access_token: randomBytes(24).toString('hex'),
      ip_hash: ipHash,
    });
  } catch (error) {
    if (error?.code === 'duplicate') return { error: 'duplicate' };
    throw error;
  }
  return { order: await tryAutoPay(order, ctx), token: order.access_token };
}

/** The buyer's page asks "is my order paid yet?". Checks again for a payment message each time. */
export async function lookupOrder(id, token, ctx) {
  if (!UUID_RE.test(id || '') || !TOKEN_RE.test(token || '')) return { error: 'invalid' };
  const order = await ctx.store.getOrder(id);
  if (!order || !tokensMatch(order.access_token, token)) return { error: 'not_found' };
  return { order: await tryAutoPay(order, ctx) };
}

/** For /api/download: no auto-pay, only a paid order with the right token gets a file. */
export async function paidOrderForDownload(id, token, ctx) {
  if (!UUID_RE.test(id || '') || !TOKEN_RE.test(token || '')) return { error: 'invalid' };
  const order = await ctx.store.getOrder(id);
  if (!order || !tokensMatch(order.access_token, token)) return { error: 'not_found' };
  if (order.status !== 'paid') return { error: 'unpaid' };
  return { order };
}

/** Admin actions from the Orders tab. */
export async function adminAction(action, orderId, ctx) {
  if (!UUID_RE.test(orderId || '')) return { error: 'invalid' };
  const order = await ctx.store.getOrder(orderId);
  if (!order) return { error: 'not_found' };
  if (action === 'approve') {
    if (order.status === 'paid') return { order };
    const paid = await markPaid(order, 'manual', {}, ctx);
    if (!paid) return { error: 'conflict' };
    return { order: paid };
  }
  if (action === 'reject') {
    if (order.status !== 'pending') return { error: 'conflict' };
    const updated = await ctx.store.updateOrder(order.id, { status: 'rejected' }, { status: 'pending' });
    return updated ? { order: updated } : { error: 'conflict' };
  }
  if (action === 'resend') {
    if (order.status !== 'paid') return { error: 'conflict' };
    const result = await deliverEmail(order, ctx, { force: true });
    return { order: (await ctx.store.getOrder(order.id)) ?? order, email: result };
  }
  return { error: 'invalid' };
}

/** A 60-second link to the private file for one edition. */
export async function signedDownloadUrl(edition, { fetchImpl = fetch } = {}) {
  const item = isEdition(edition) ? EDITIONS[edition] : null;
  if (!item) return null;
  const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) return null;
  const res = await fetchImpl(`${base}/storage/v1/object/sign/${BUCKET}/${encodeURIComponent(item.path)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 60 }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const signed = (await res.json())?.signedURL;
  if (typeof signed !== 'string') return null;
  const path = signed.startsWith('/storage/v1') ? signed : `/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`;
  return `${base}${path}&download=${encodeURIComponent(item.filename)}`;
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(JSON.stringify(body));
}

export const query = (req, name) => {
  const raw = req.query?.[name] ?? new URL(req.url, 'http://x').searchParams.get(name);
  return Array.isArray(raw) ? raw[0] : raw;
};

export const clientIp = (req) => String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '').split(',')[0].trim();
