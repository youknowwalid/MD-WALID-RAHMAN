// GET /api/download?txn=txn_...&price=pri_...
// Confirms with Paddle that the transaction was paid AND contained this price, then redirects
// to a private file link that stops working after 60 seconds.
import { deliverable, getPaidItems, PRICE_RE, query, sendJson, signedDownloadUrl } from './_paddle.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { status: 'error' });
  const txn = query(req, 'txn');
  const price = query(req, 'price');
  if (!PRICE_RE.test(price || '')) return sendJson(res, 400, { status: 'invalid' });

  const result = await getPaidItems(txn);
  if (result.status !== 'paid') {
    const code = { invalid: 400, not_found: 404, unpaid: 402, unconfigured: 503, error: 502 }[result.status] ?? 500;
    return sendJson(res, code, { status: result.status });
  }
  if (!deliverable(result.priceIds).includes(price)) return sendJson(res, 403, { status: 'not_in_order' });

  let url = null;
  try {
    url = await signedDownloadUrl(price);
  } catch {
    url = null;
  }
  if (!url) return sendJson(res, 502, { status: 'error' });

  res.statusCode = 302;
  res.setHeader('Location', url);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end();
}
