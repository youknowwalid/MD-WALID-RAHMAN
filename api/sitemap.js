// Serves /sitemap.xml (see the rewrite in vercel.json). Lists the fixed pages plus
// every project and blog post currently published in the database.
import config from '../public-config.json' with { type: 'json' };
import { DEFAULT_SITE_URL, loadSettings, rest, siteUrlOf } from './_site.js';
// The fixed pages and the key their SEO row (page_discovery_meta.route_key) is saved under.
const PAGES = [
  { path: '/', key: 'home', priority: '1.0' },
  { path: '/articles', key: 'articles', priority: '0.7' },
  { path: '/resources', key: 'resources', priority: '0.6' },
  { path: '/privacy-policy', key: 'privacy-policy', priority: '0.2' },
  { path: '/terms-of-service', key: 'terms-of-service', priority: '0.2' },
  { path: '/refund-policy', key: 'refund-policy', priority: '0.2' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function projectsHidden() {
  const url = (process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!url || !key) return true;
  try {
    const res = await fetch(`${url}/rest/v1/site_settings?select=value&key=eq.global&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true;
    const rows = await res.json();
    return rows[0]?.value?.projectsHidden !== false;
  } catch {
    return true;
  }
}

async function fetchRows(table) {
  const url = (process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id,slug,updated_at&order=created_at.desc&limit=1000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

/** Pages the admin switched off for search (page_discovery_meta.robots_index = false) are left out. */
export function withoutNoindex(entries, metaRows) {
  const off = new Set((metaRows || []).filter((m) => m?.robots_index === false).map((m) => m.route_key));
  return entries.filter((e) => !e.key || !off.has(e.key));
}

export function buildSitemap(entries, site = DEFAULT_SITE_URL) {
  const urls = entries
    .map((e) => `  <url><loc>${esc(site + e.path)}</loc>${e.lastmod ? `<lastmod>${esc(e.lastmod.slice(0, 10))}</lastmod>` : ''}<priority>${e.priority}</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export default async function handler(req, res) {
  const [hidden, projects, posts, settings, metaRows] = await Promise.all([
    projectsHidden(), fetchRows('projects'), fetchRows('blog_posts'), loadSettings(),
    rest('page_discovery_meta?select=route_key,robots_index&limit=1000').catch(() => []),
  ]);
  const dynamic = [
    // While the admin's projects switch is on, projects are left out of the sitemap.
    ...(hidden ? [] : projects).map((r) => ({ path: `/projects/${encodeURIComponent(r.slug || r.id)}`, key: `project:${r.id}`, lastmod: r.updated_at, priority: '0.7' })),
    ...posts.map((r) => ({ path: `/blog/${encodeURIComponent(r.slug || r.id)}`, key: `blog:${r.id}`, lastmod: r.updated_at, priority: '0.6' })),
  ];
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(buildSitemap(withoutNoindex([...PAGES, ...dynamic], metaRows), siteUrlOf(settings)));
}
