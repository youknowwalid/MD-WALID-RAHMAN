// Serves /sitemap.xml (see the rewrite in vercel.json). Lists the fixed pages plus
// every project and blog post currently published in the database.
import config from '../public-config.json' with { type: 'json' };

const SITE = 'https://walidrahman.com';
const PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/resources', priority: '0.6' },
  { path: '/privacy-policy', priority: '0.2' },
  { path: '/terms-of-service', priority: '0.2' },
  { path: '/refund-policy', priority: '0.2' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

export function buildSitemap(entries) {
  const urls = entries
    .map((e) => `  <url><loc>${esc(SITE + e.path)}</loc>${e.lastmod ? `<lastmod>${esc(e.lastmod.slice(0, 10))}</lastmod>` : ''}<priority>${e.priority}</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export default async function handler(req, res) {
  const [projects, posts] = await Promise.all([fetchRows('projects'), fetchRows('blog_posts')]);
  const dynamic = [
    ...projects.map((r) => ({ path: `/projects/${encodeURIComponent(r.slug || r.id)}`, lastmod: r.updated_at, priority: '0.7' })),
    ...posts.map((r) => ({ path: `/blog/${encodeURIComponent(r.slug || r.id)}`, lastmod: r.updated_at, priority: '0.6' })),
  ];
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(buildSitemap([...PAGES, ...dynamic]));
}
