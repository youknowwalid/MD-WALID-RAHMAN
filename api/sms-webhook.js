// POST /api/sms-webhook  -- the Android "SMS Forwarder" app on the owner's phone sends every wallet
// "money received" message here. The message is saved and, if a buyer is waiting for it, that order is
// approved and the download e-mail goes out at once.
//
// The phone must send the secret (Vercel setting SMS_WEBHOOK_SECRET) in one of these ways:
//   header  X-Webhook-Secret: <secret>     (best)    or    Authorization: Bearer <secret>
//   or the address  /api/sms-webhook?key=<secret>
// and a JSON body like  {"from":"%from%","text":"%text%"}  (form fields work too).
import { timingSafeEqual } from 'node:crypto';
import { isConfigured, makeContext } from './_context.js';
import { onSmsStored, query, sendJson } from './_orders.js';
import { parseSms } from './_sms.js';

const first = (obj, keys) => {
  for (const key of keys) if (typeof obj?.[key] === 'string' && obj[key].trim()) return obj[key];
  return '';
};

function secretMatches(given, expected) {
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  const expected = process.env.SMS_WEBHOOK_SECRET;
  if (!expected || !isConfigured()) return sendJson(res, 503, { error: 'unconfigured' });
  if (req.method !== 'POST' && req.method !== 'GET') return sendJson(res, 405, { error: 'method' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }
  body = body && typeof body === 'object' ? body : {};
  const bearer = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
  const given = req.headers?.['x-webhook-secret'] || bearer || query(req, 'key') || body.secret || '';
  if (!secretMatches(given, expected)) return sendJson(res, 401, { error: 'unauthorized' });

  const text = (first(body, ['text', 'message', 'body', 'msg', 'content', 'sms']) || query(req, 'text') || '').slice(0, 1000);
  const from = (first(body, ['from', 'sender', 'address', 'number', 'phone']) || query(req, 'from') || '').slice(0, 60);
  const parsed = parseSms(text, from);
  if (!parsed) return sendJson(res, 200, { ok: true, ignored: true }); // OTPs, sent money, anything else: not stored

  try {
    const ctx = makeContext();
    const { sms, duplicate } = await ctx.store.insertSms({
      wallet: parsed.wallet,
      trx_id: parsed.trxId,
      amount: parsed.amount,
      sender: parsed.sender,
      raw: text,
    });
    const paid = sms ? await onSmsStored(sms, ctx) : null;
    return sendJson(res, 200, { ok: true, stored: !duplicate, matched: Boolean(paid && paid.status === 'paid') });
  } catch {
    return sendJson(res, 502, { error: 'server' });
  }
}
