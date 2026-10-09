import { describe, expect, it, vi } from 'vitest';
import {
  adminAction, createOrder, lookupOrder, onSmsStored, paidOrderForDownload, publicOrder, smsPaysOrder, validateOrderInput, deliverEmail,
} from '../../api/_orders.js';
import { normalizePhone, normalizeTrx, parseSms } from '../../api/_sms.js';
import { EDITIONS, PRICE_BDT } from '../../api/_catalog.js';

// ---- an in-memory copy of the database, same rules as the real one -------------------------------
function memoryStore() {
  const orders: any[] = [];
  const smsList: any[] = [];
  let n = 0;
  const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  return {
    orders, smsList,
    async countOrders({ since, ipHash, email }: any) {
      return orders.filter((o) => o.created_at >= since && (!ipHash || o.ip_hash === ipHash) && (!email || o.email === email)).length;
    },
    async getOrder(oid: string) { return orders.find((o) => o.id === oid) ?? null; },
    async findOrderByTrx(trx: string) { return orders.find((o) => o.trx_id === trx && o.status !== 'rejected') ?? null; },
    async insertOrder(o: any) {
      if (orders.some((x) => x.trx_id === o.trx_id && x.status !== 'rejected')) { const e: any = new Error('duplicate'); e.code = 'duplicate'; throw e; }
      const row = { id: id(), status: 'pending', paid_how: null, payment_sms_id: null, emailed_at: null, email_error: null, created_at: new Date().toISOString(), paid_at: null, ...o };
      orders.push(row);
      return { ...row };
    },
    async updateOrder(oid: string, patch: any, cond: any = {}) {
      const row = orders.find((o) => o.id === oid);
      if (!row) return null;
      for (const [k, v] of Object.entries(cond)) if (row[k] !== v) return null;
      Object.assign(row, patch);
      return { ...row };
    },
    async findSmsByTrx(trx: string) { return smsList.find((s) => s.trx_id === trx) ?? null; },
    async insertSms(s: any) {
      const existing = s.trx_id ? smsList.find((x) => x.trx_id === s.trx_id) : null;
      if (existing) return { sms: existing, duplicate: true };
      const row = { id: id(), claimed_by: null, received_at: new Date().toISOString(), ...s };
      smsList.push(row);
      return { sms: row, duplicate: false };
    },
    async claimSms(sid: string, oid: string) {
      const row = smsList.find((s) => s.id === sid);
      if (!row || row.claimed_by) return false;
      row.claimed_by = oid;
      return true;
    },
    async releaseSms(sid: string, oid: string) {
      const row = smsList.find((s) => s.id === sid);
      if (row && row.claimed_by === oid) row.claimed_by = null;
    },
  };
}

const setup = (mailOk = true) => {
  const store = memoryStore();
  const sent: any[] = [];
  const mailer = vi.fn(async (mail: any) => {
    if (!mailOk) return { ok: false, reason: 'smtp down' };
    sent.push(mail);
    return { ok: true };
  });
  return { store, sent, mailer, ctx: { store, mailer, now: () => new Date() } as any };
};

const BUYER = { edition: 'english', email: 'Buyer@Example.com', wallet: 'bkash', trxId: '8n7a6d5cq', sender: '+8801712345678' };
const bkashSms = (trx = '8N7A6D5CQ', amount = '2,999.00', sender = '01712345678') =>
  `You have received Tk ${amount} from ${sender}. Fee Tk 0.00. Balance Tk 3,512.34. TrxID ${trx} at 09/10/2026 14:30`;
const storeSms = async (store: any, text: string, from = 'bKash') => {
  const p = parseSms(text, from)!;
  return (await store.insertSms({ wallet: p.wallet, trx_id: p.trxId, amount: p.amount, sender: p.sender, raw: text })).sms;
};

describe('parseSms', () => {
  it('reads a bKash message', () => {
    expect(parseSms(bkashSms(), 'bKash')).toEqual({ wallet: 'bkash', trxId: '8N7A6D5CQ', amount: 2999, sender: '01712345678' });
  });
  it('reads a Nagad message', () => {
    const text = 'Money Received. Amount: Tk 2,999.00 Sender: 01812345678 Ref: N/A TxnID: 71ABCD12 Comm: Tk 0.00 Balance: Tk 3,000.00 09/10/2026 14:30';
    expect(parseSms(text, 'NAGAD')).toEqual({ wallet: 'nagad', trxId: '71ABCD12', amount: 2999, sender: '01812345678' });
  });
  it('reads a Rocket message', () => {
    const text = 'Tk2,999.00 received from A/C: 01912345678-4. Fee Tk0.00, Balance Tk3,000.00. TxnId: 1234567890 Date: 09/10/2026 14:30';
    expect(parseSms(text, '16216')).toEqual({ wallet: 'rocket', trxId: '1234567890', amount: 2999, sender: '01912345678' });
  });
  it('ignores codes, sent money and unrelated texts', () => {
    expect(parseSms('Your bKash verification code is 123456', 'bKash')).toBeNull();
    expect(parseSms('You have sent Tk 500.00 to 01712345678. TrxID AAAA1111BB', 'bKash')).toBeNull();
    expect(parseSms('Happy birthday! Lunch tomorrow?', '01712345678')).toBeNull();
    expect(parseSms('', 'bKash')).toBeNull();
  });
  it('keeps a wallet message with unfamiliar wording so the admin can see it', () => {
    expect(parseSms('bKash: you have received money today', 'bKash')).toEqual({ wallet: 'bkash', trxId: null, amount: null, sender: null });
  });
});

describe('helpers', () => {
  it('normalizes phone numbers and transaction ids', () => {
    expect(normalizePhone('+880 1712-345678')).toBe('01712345678');
    expect(normalizePhone('8801712345678')).toBe('01712345678');
    expect(normalizePhone('1712345678')).toBe('01712345678');
    expect(normalizePhone('12345')).toBe('');
    expect(normalizePhone('01212345678')).toBe('');
    expect(normalizeTrx(' 8n7a-6d5cq ')).toBe('8N7A6D5CQ');
  });
  it('validates what the buyer types', () => {
    expect(validateOrderInput(BUYER)).toEqual({ value: { edition: 'english', email: 'buyer@example.com', wallet: 'bkash', trxId: '8N7A6D5CQ', sender: '01712345678' } });
    expect(validateOrderInput({ ...BUYER, edition: '__proto__' })).toEqual({ error: 'invalid', field: 'edition' });
    expect(validateOrderInput({ ...BUYER, email: 'nope' })).toEqual({ error: 'invalid', field: 'email' });
    expect(validateOrderInput({ ...BUYER, wallet: 'paypal' })).toEqual({ error: 'invalid', field: 'wallet' });
    expect(validateOrderInput({ ...BUYER, trxId: 'abc' })).toEqual({ error: 'invalid', field: 'trxId' });
    expect(validateOrderInput({ ...BUYER, sender: '123' })).toEqual({ error: 'invalid', field: 'sender' });
  });
  it('charges the same price for both editions', () => {
    expect(EDITIONS.english.price).toBe(PRICE_BDT);
    expect(EDITIONS.bangla.price).toBe(PRICE_BDT);
    expect(PRICE_BDT).toBe(2999);
  });
});

describe('automatic approval', () => {
  it('approves at once when the SMS arrived before the buyer typed the id, and e-mails the link once', async () => {
    const { ctx, store, sent } = setup();
    await storeSms(store, bkashSms());
    const result: any = await createOrder(BUYER, ctx);
    expect(result.order.status).toBe('paid');
    expect(result.order.paid_how).toBe('auto');
    expect(result.token).toMatch(/^[0-9a-f]{48}$/);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('buyer@example.com');
    expect(sent[0].text).toContain(`/thank-you?order=${result.order.id}&t=${result.token}`);
    expect(sent[0].subject).toContain('English edition');
    expect(publicOrder(result.order).downloadUrl).toBe(`/api/download?id=${result.order.id}&t=${result.token}`);
  });

  it('approves when the SMS arrives after the buyer typed the id', async () => {
    const { ctx, store, sent } = setup();
    const created: any = await createOrder(BUYER, ctx);
    expect(created.order.status).toBe('pending');
    expect(publicOrder(created.order).downloadUrl).toBeNull();
    const sms = await storeSms(store, bkashSms());
    const paid: any = await onSmsStored(sms, ctx);
    expect(paid.status).toBe('paid');
    expect(sent).toHaveLength(1);
    // asking again does not send a second e-mail
    await lookupOrder(created.order.id, created.token, ctx);
    expect(sent).toHaveLength(1);
  });

  it('accepts a higher amount but never a lower one', async () => {
    const a = setup();
    await storeSms(a.store, bkashSms('AAAA1111BB', '3,500.00'));
    expect(((await createOrder({ ...BUYER, trxId: 'AAAA1111BB' }, a.ctx)) as any).order.status).toBe('paid');
    const b = setup();
    await storeSms(b.store, bkashSms('CCCC2222DD', '2,998.00'));
    expect(((await createOrder({ ...BUYER, trxId: 'CCCC2222DD' }, b.ctx)) as any).order.status).toBe('pending');
  });

  it('does not approve when the paying number differs from the one typed', async () => {
    const { ctx, store } = setup();
    await storeSms(store, bkashSms('8N7A6D5CQ', '2,999.00', '01999999999'));
    expect(((await createOrder(BUYER, ctx)) as any).order.status).toBe('pending');
  });

  it('does not approve when the message has no sender or amount', async () => {
    const { ctx, store } = setup();
    expect(smsPaysOrder({ trx_id: 'X', amount_due: 2999, sender: '01712345678' }, { trx_id: 'X', amount: 2999, sender: null })).toBe(false);
    expect(smsPaysOrder({ trx_id: 'X', amount_due: 2999, sender: '01712345678' }, { trx_id: 'X', amount: null, sender: '01712345678' })).toBe(false);
    expect(store.smsList).toHaveLength(0);
    expect(ctx).toBeTruthy();
  });

  it('lets one payment message unlock only one order', async () => {
    const { ctx, store } = setup();
    const sms = await storeSms(store, bkashSms());
    expect(await store.claimSms(sms.id, 'order-a')).toBe(true);
    expect(await store.claimSms(sms.id, 'order-b')).toBe(false);
    const result: any = await createOrder(BUYER, ctx);
    expect(result.order.status).toBe('pending'); // message already used
  });

  it('keeps the order paid and records the problem when the e-mail cannot be sent', async () => {
    const { ctx, store } = setup(false);
    await storeSms(store, bkashSms());
    const result: any = await createOrder(BUYER, ctx);
    expect(result.order.status).toBe('paid');
    expect(result.order.emailed_at).toBeNull();
    expect(result.order.email_error).toBe('smtp down');
    expect(publicOrder(result.order).downloadUrl).toBeTruthy();
  });
});

describe('orders and abuse limits', () => {
  it('gives the same buyer their order back, but refuses someone else using the same id', async () => {
    const { ctx } = setup();
    const first: any = await createOrder(BUYER, ctx);
    const again: any = await createOrder(BUYER, ctx);
    expect(again.order.id).toBe(first.order.id);
    expect(again.token).toBe(first.token);
    expect(await createOrder({ ...BUYER, email: 'other@example.com' }, ctx)).toEqual({ error: 'duplicate' });
    expect(await createOrder({ ...BUYER, sender: '01811111111' }, ctx)).toEqual({ error: 'duplicate' });
  });

  it('rate-limits one address and one e-mail', async () => {
    const { ctx } = setup();
    for (let i = 0; i < 8; i += 1) {
      const r: any = await createOrder({ ...BUYER, trxId: `TRX${String(i).padStart(6, '0')}`, email: `b${i}@example.com` }, ctx, { ip: '1.2.3.4' });
      expect(r.order).toBeTruthy();
    }
    expect(await createOrder({ ...BUYER, trxId: 'TRX999999', email: 'z@example.com' }, ctx, { ip: '1.2.3.4' })).toEqual({ error: 'rate_limited' });
    expect((await createOrder({ ...BUYER, trxId: 'TRX999999', email: 'z@example.com' }, ctx, { ip: '5.6.7.8' }) as any).order).toBeTruthy();
  });

  it('only shows an order to someone holding its secret code', async () => {
    const { ctx } = setup();
    const created: any = await createOrder(BUYER, ctx);
    expect(await lookupOrder(created.order.id, 'f'.repeat(48), ctx)).toEqual({ error: 'not_found' });
    expect(await lookupOrder('not-an-id', created.token, ctx)).toEqual({ error: 'invalid' });
    expect(await lookupOrder(created.order.id, 'zz', ctx)).toEqual({ error: 'invalid' });
    expect(((await lookupOrder(created.order.id, created.token, ctx)) as any).order.status).toBe('pending');
  });

  it('only releases files for paid orders', async () => {
    const { ctx } = setup();
    const created: any = await createOrder(BUYER, ctx);
    expect(await paidOrderForDownload(created.order.id, created.token, ctx)).toEqual({ error: 'unpaid' });
    expect(await paidOrderForDownload(created.order.id, 'a'.repeat(48), ctx)).toEqual({ error: 'not_found' });
    await adminAction('approve', created.order.id, ctx);
    expect(((await paidOrderForDownload(created.order.id, created.token, ctx)) as any).order.edition).toBe('english');
  });
});

describe('admin actions', () => {
  it('approves by hand, e-mails once, and can resend', async () => {
    const { ctx, sent } = setup();
    const created: any = await createOrder(BUYER, ctx);
    const approved: any = await adminAction('approve', created.order.id, ctx);
    expect(approved.order.status).toBe('paid');
    expect(approved.order.paid_how).toBe('manual');
    expect(sent).toHaveLength(1);
    expect(((await adminAction('approve', created.order.id, ctx)) as any).order.status).toBe('paid');
    expect(sent).toHaveLength(1);
    const resent: any = await adminAction('resend', created.order.id, ctx);
    expect(resent.email).toEqual({ sent: true });
    expect(sent).toHaveLength(2);
  });

  it('rejects a pending order and frees its transaction id', async () => {
    const { ctx } = setup();
    const created: any = await createOrder(BUYER, ctx);
    expect(((await adminAction('reject', created.order.id, ctx)) as any).order.status).toBe('rejected');
    expect(await adminAction('reject', created.order.id, ctx)).toEqual({ error: 'conflict' });
    expect(((await createOrder({ ...BUYER, email: 'other@example.com' }, ctx)) as any).order.status).toBe('pending');
  });

  it('refuses unknown actions and ids', async () => {
    const { ctx } = setup();
    expect(await adminAction('delete', '00000000-0000-4000-8000-000000000001', ctx)).toEqual({ error: 'not_found' });
    expect(await adminAction('approve', 'nope', ctx)).toEqual({ error: 'invalid' });
  });

  it('does not e-mail an unpaid order', async () => {
    const { ctx } = setup();
    const created: any = await createOrder(BUYER, ctx);
    expect(await deliverEmail(created.order, ctx)).toEqual({ sent: false, reason: 'not_paid' });
  });
});
