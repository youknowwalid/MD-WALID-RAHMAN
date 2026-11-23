// POST /api/checkout  { edition, email, wallet, trxId, sender }  ->  creates an order from a buyer's transaction id
// GET  /api/checkout?id=...&t=...                                ->  the current state of that order (for the thank-you page)
// GET  /api/checkout?config=1                                    ->  what the checkout page shows: products, prices, wallets, support e-mail
import { makeContext, isConfigured } from './_context.js';
import { clientIp, createOrder, lookupOrder, publicOrder, query, sendJson } from './_orders.js';

const STATUS = { invalid: 400, not_found: 404, duplicate: 409, rate_limited: 429, busy: 429 };

/** Everything the checkout page needs, all of it public by nature (the buyer must see the price and where to send money). */
export async function checkoutConfig(ctx) {
  const [products, brand] = await Promise.all([ctx.store.listProducts(), ctx.brand()]);
  return {
    products: products.map((p) => ({ key: p.key, name: p.name, price: p.price_bdt })),
    wallets: brand.wallets,
    supportEmail: brand.supportEmail,
  };
}

export default async function handler(req, res) {
  if (!isConfigured()) return sendJson(res, 503, { error: 'unconfigured' });
  try {
    const ctx = makeContext(req);
    if (req.method === 'GET') {
      if (query(req, 'config')) {
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify(await checkoutConfig(ctx)));
      }
      const result = await lookupOrder(query(req, 'id'), query(req, 't'), ctx);
      if (result.error) return sendJson(res, STATUS[result.error] ?? 500, { error: result.error });
      return sendJson(res, 200, publicOrder(result.order, await ctx.store.getProduct(result.order.edition)));
    }
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'method' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body || typeof body !== 'object' || body.website) return sendJson(res, 400, { error: 'invalid' });
    const result = await createOrder(body, ctx, { ip: clientIp(req) });
    if (result.error) return sendJson(res, STATUS[result.error] ?? 500, { error: result.error, field: result.field });
    return sendJson(res, 200, { ...publicOrder(result.order, await ctx.store.getProduct(result.order.edition)), token: result.token });
  } catch {
    return sendJson(res, 502, { error: 'server' });
  }
}
