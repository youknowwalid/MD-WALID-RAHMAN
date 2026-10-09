// GET /api/download?id=...&t=...
// Only a PAID order with the right secret code gets the file: we redirect to a private link that stops working after 60 seconds.
import { isConfigured, makeContext } from './_context.js';
import { paidOrderForDownload, query, sendJson, signedDownloadUrl } from './_orders.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method' });
  if (!isConfigured()) return sendJson(res, 503, { error: 'unconfigured' });
  try {
    const result = await paidOrderForDownload(query(req, 'id'), query(req, 't'), makeContext());
    if (result.error) return sendJson(res, { invalid: 400, not_found: 404, unpaid: 402 }[result.error] ?? 500, { error: result.error });
    const url = await signedDownloadUrl(result.order.edition);
    if (!url) return sendJson(res, 502, { error: 'server' });
    res.statusCode = 302;
    res.setHeader('Location', url);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.end();
  } catch {
    return sendJson(res, 502, { error: 'server' });
  }
}
