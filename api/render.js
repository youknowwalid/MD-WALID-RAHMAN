// Serves every page of the site (see the catch-all rewrite in vercel.json).
//
// The site is a single-page app: without this function every address returns the same shell and a page's
// own title, description, canonical address and structured data exist only after JavaScript has run.
// Search crawlers and AI bots often do not run it. This function takes the built shell (dist/app-shell.html,
// see appShell() in vite.config.ts) and writes the page's own head tags, structured data and a plain-HTML
// copy of the page into it. Browsers then carry on exactly as before.
//
// Everything is built from what the admin saved. It also:
//   - applies the admin's redirects (301 / 302 / 410, with loop protection in the database),
//   - answers a real 404 for addresses that do not exist (the app still shows its own "not found" page),
//   - keeps private pages out of search.
// If anything goes wrong it serves the plain shell, so the site always loads.
//
// Only published projects and blog posts can be read: the database's Row Level Security hides drafts
// from the public key this function uses, so a draft never gets a page.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildPageHtml, pickPage } from './_head.js';
import { canonicalPath } from './_graph.js';
import { rest, rpc } from './_site.js';

const COLUMNS = {
  project: 'id,slug,title,social_title,social_description,social_image,summary,content,hero_image,image',
  blog: 'id,slug,title,social_title,social_description,social_image,excerpt,image,created_at,updated_at,author',
};
const TABLES = { project: 'projects', blog: 'blog_posts' };
const PATHS = { project: '/projects/', blog: '/blog/' };

/** Pages with a fixed address -> the key their SEO row is saved under. */
const FIXED = {
  '/': 'home',
  '/articles': 'articles',
  '/resources': 'resources',
  '/products': 'resources',
  '/terms-of-service': 'terms-of-service',
  '/privacy-policy': 'privacy-policy',
  '/refund-policy': 'refund-policy',
};
/** Pages that exist but must never be searched for. */
const isPrivate = (route) => route === '/admin' || route === '/thank-you' || /^\/checkout\/[^/]+$/.test(route);

const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** What an address is: { kind, key } (key = permalink for items). */
export function routeOf(route) {
  if (FIXED[route]) return { kind: route === '/' ? 'home' : 'fixed', key: FIXED[route] };
  if (isPrivate(route)) return { kind: 'private' };
  if (route === '/blog') return { kind: 'redirect', to: '/articles' };
  let m = /^\/projects\/([^/]+)$/.exec(route);
  if (m) return { kind: 'project', key: m[1] };
  m = /^\/blog\/([^/]+)$/.exec(route);
  if (m) return { kind: 'blog', key: m[1] };
  return { kind: 'unknown' };
}

async function fetchItem(kind, key) {
  try {
    const select = COLUMNS[kind];
    const table = TABLES[kind];
    let rows = await rest(`${table}?select=${select}&slug=eq.${encodeURIComponent(key)}&limit=1`);
    if (!rows.length && isUuid(key)) rows = await rest(`${table}?select=${select}&id=eq.${key}&limit=1`);
    return rows[0] ?? null;
  } catch {
    return undefined; // database unreachable (null = really not found)
  }
}

const safe = async (promise, fallback) => {
  try { return await promise; } catch { return fallback; }
};

/** The built app shell: bundled with this function (see "functions" in vercel.json), else fetched from this deployment. */
async function loadTemplate() {
  // Tests (and local checks) can point at any shell file.
  if (process.env.APP_SHELL_FILE) {
    try { return await readFile(process.env.APP_SHELL_FILE, 'utf8'); } catch { return ''; }
  }
  for (const name of ['app-shell.html', 'index.html']) {
    try { return await readFile(join(process.cwd(), 'dist', name), 'utf8'); } catch { /* try the next */ }
  }
  const host = process.env.VERCEL_URL;
  if (host) {
    for (const name of ['app-shell.html', 'index.html']) {
      try {
        const res = await fetch(`https://${host}/${name}`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) return await res.text();
      } catch { /* try the next */ }
    }
  }
  return '';
}

/** Where the request is for: the rewrite passes it as ?path=, else it is the request's own address. */
export function requestedPath(req) {
  const q = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;
  if (typeof q === 'string' && q) return q;
  const url = typeof req.url === 'string' ? req.url.split('?')[0] : '/';
  return url.startsWith('/api/render') ? '/' : url;
}

const CACHE = 'public, s-maxage=300, stale-while-revalidate=86400';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const raw = requestedPath(req);
  const route = canonicalPath(raw);
  if (route.length > 300 || /^\/(api|assets|_vercel)(\/|$)/.test(route)) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(404).send('Not found');
  }

  const template = await loadTemplate();
  if (!template) {
    console.error('render: could not load the app shell');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).send('Temporarily unavailable');
  }

  const plain = (status = 200) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).send(template);
  };

  try {
    const info = routeOf(route);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    // One round of reads, all at once: the saved settings, a redirect for this address, and the page itself.
    const [settingRows, redirects, item] = await Promise.all([
      rest('site_settings?select=key,value'),
      route === '/' ? [] : safe(rest(`url_redirects?select=destination_path,status_code&source_path=eq.${encodeURIComponent(route)}&is_active=eq.true&limit=1`), []),
      info.kind === 'project' || info.kind === 'blog' ? fetchItem(info.kind, info.key) : Promise.resolve(null),
    ]);
    const settings = {};
    for (const row of settingRows) if (row && typeof row.key === 'string') settings[row.key] = row.value;

    const hit = redirects[0];
    if (hit) {
      // Count the visit (best effort, short wait: the function may be frozen once it has answered).
      await safe(rpc('record_redirect_hit', { p_source: route }), null);
      if (hit.status_code === 410) {
        res.setHeader('X-Robots-Tag', 'noindex');
        res.setHeader('Cache-Control', CACHE);
        return res.status(410).send(buildPageHtml(template, settings.seo, {}, route, { noindex: true, global: settings.global, discovery: settings.discovery }));
      }
      res.setHeader('Location', hit.destination_path);
      res.setHeader('Cache-Control', CACHE);
      return res.status(hit.status_code === 302 ? 302 : 301).end();
    }
    if (info.kind === 'redirect') {
      res.setHeader('Location', info.to);
      res.setHeader('Cache-Control', CACHE);
      return res.status(301).end();
    }

    const common = { global: settings.global, discovery: settings.discovery };

    if (info.kind === 'private') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(buildPageHtml(template, settings.seo, {}, route, { ...common, noindex: true }));
    }

    if (info.kind === 'unknown' || (item === null && (info.kind === 'project' || info.kind === 'blog'))) {
      res.setHeader('X-Robots-Tag', 'noindex');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(404).send(buildPageHtml(template, settings.seo, {}, route, { ...common, noindex: true }));
    }
    if (item === undefined) return plain(); // the database did not answer: the app loads and asks for itself

    if (info.kind === 'project' && settings.global?.projectsHidden !== false) {
      // The admin's projects switch is on: no project details in the page, and not indexed.
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(200).send(buildPageHtml(template, settings.seo, {}, route, { ...common, noindex: true }));
    }

    // The page's own SEO / AEO / GEO row, then its author.
    const routeKey = info.kind === 'project' || info.kind === 'blog' ? `${info.kind}:${item.id}` : info.key;
    const metaRows = await safe(rest(`page_discovery_meta?select=*&route_key=eq.${encodeURIComponent(routeKey)}&limit=1`), []);
    const meta = metaRows[0] || null;
    const authorRows = meta?.author_id && isUuid(meta.author_id)
      ? await safe(rest(`author_profiles?select=*&id=eq.${meta.author_id}&limit=1`), [])
      : [];
    const author = authorRows[0] || null;

    let page = {};
    let path = route;
    let kind = 'page';
    if (item) {
      page = pickPage(info.kind, item);
      path = PATHS[info.kind] + encodeURIComponent(info.key);
      kind = info.kind;
    } else if (info.kind === 'home') {
      kind = 'home';
    }
    // The app only steps back from the head when this page's tags are complete: home, projects, articles,
    // and any page whose tags the admin wrote. Other fixed pages keep the app's own titles.
    const owned = Boolean(item) || info.kind === 'home' || Boolean(meta);

    res.setHeader('Cache-Control', CACHE);
    return res.status(200).send(
      buildPageHtml(template, settings.seo, page, path, { ...common, kind, meta, author, owned, withBody: info.kind === 'home' }),
    );
  } catch (err) {
    console.error('render failed, serving the plain shell:', err);
    return plain();
  }
}
