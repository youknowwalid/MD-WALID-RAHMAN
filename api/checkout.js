// POST /api/checkout  { edition, email, wallet, trxId, sender }  ->  creates an order from a buyer's transaction id
// GET  /api/checkout?id=...&t=...                                ->  the current state of that order (for the thank-you page)
import { makeContext, isConfigured } from './_context.js';
import { clientIp, createOrder, lookupOrder, publicOrder, query, sendJson } from './_orders.js';

const STATUS = { invalid: 400, not_found: 404, duplicate: 409, rate_limited: 429, busy: 429 };

export default async function handler(req, res) {
  if (!isConfigured()) return sendJson(res, 503, { error: 'unconfigured' });
  try {
    const ctx = makeContext();
    if (req.method === 'GET') {
      const result = await lookupOrder(query(req, 'id'), query(req, 't'), ctx);
      if (result.error) return sendJson(res, STATUS[result.error] ?? 500, { error: result.error });
      return sendJson(res, 200, publicOrder(result.order));
    }
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'method' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body || typeof body !== 'object' || body.website) return sendJson(res, 400, { error: 'invalid' });
    const result = await createOrder(body, ctx, { ip: clientIp(req) });
    if (result.error) return sendJson(res, STATUS[result.error] ?? 500, { error: result.error, field: result.field });
    return sendJson(res, 200, { ...publicOrder(result.order), token: result.token });
  } catch {
    return sendJson(res, 502, { error: 'server' });
  }
}
