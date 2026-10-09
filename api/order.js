// GET /api/order?txn=txn_...  ->  what this paid transaction lets the buyer download.
import { CATALOG } from './_catalog.js';
import { deliverable, getPaidItems, query, sendJson } from './_paddle.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { status: 'error' });
  const txn = query(req, 'txn');
  const result = await getPaidItems(txn);
  if (result.status !== 'paid') {
    const code = { invalid: 400, not_found: 404, unpaid: 200, unconfigured: 503, error: 502 }[result.status] ?? 500;
    return sendJson(res, code, { status: result.status });
  }
  const items = deliverable(result.priceIds).map((priceId) => ({
    priceId,
    name: CATALOG[priceId].name,
    downloadUrl: `/api/download?txn=${encodeURIComponent(txn)}&price=${encodeURIComponent(priceId)}`,
  }));
  return sendJson(res, 200, { status: 'paid', items });
}
