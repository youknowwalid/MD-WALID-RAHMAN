// IndexNow lets Bing, Yandex and other search engines hear about new or changed pages right away.
//   GET  /<key>.txt  (see the rewrite in vercel.json)  proves the site owns the key: it answers with the key
//                    saved in the admin (Search & AI Discovery > Verification) and nothing else.
//   POST /api/indexnow  { urls: [...] }  admin only: sends those addresses to the search engines.
// Only addresses on the site's own domain are ever sent.
import { isAdmin, bearer } from './_admin.js';
import { loadSettings, siteUrlOf } from './_site.js';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY = /^[a-f0-9]{32}$/;
const MAX_URLS = 500;

const json = (res, status, body) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).send(JSON.stringify(body));
};

/** Keeps only distinct, valid addresses on the site's own host. */
export function ownUrls(urls, site) {
  let host;
  try { host = new URL(site).host; } catch { return []; }
  const out = new Set();
  for (const u of Array.isArray(urls) ? urls : []) {
    try {
      const x = new URL(String(u));
      if (x.protocol === 'https:' && x.host === host) { x.hash = ''; out.add(x.toString()); }
    } catch { /* not an address */ }
  }
  return [...out].slice(0, MAX_URLS);
}

export default async function handler(req, res) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    const asked = String(req.query?.key || '');
    const settings = await loadSettings();
    const saved = String(settings?.discovery?.indexnow?.key || '');
    if (!KEY.test(asked) || asked !== saved) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(404).send('Not found');
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).send(saved);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    return res.status(405).end();
  }
  if (!(await isAdmin(bearer(req)))) return json(res, 401, { error: 'unauthorized' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const settings = await loadSettings();
  const key = String(settings?.discovery?.indexnow?.key || '');
  if (!KEY.test(key)) return json(res, 400, { error: 'no_key' });
  const site = siteUrlOf(settings, req);
  const urls = ownUrls(body?.urls, site);
  if (!urls.length) return json(res, 400, { error: 'no_urls' });

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(10000),
    });
    // 200 and 202 mean accepted. Anything else is the search engine saying no.
    if (r.status !== 200 && r.status !== 202) return json(res, 502, { error: 'rejected', status: r.status });
    return json(res, 200, { submitted: urls.length });
  } catch {
    return json(res, 502, { error: 'unreachable' });
  }
}
