// Serves /projects/:slug and /blog/:slug (see the rewrites in vercel.json).
//
// The site is a single-page app: every address returns the same index.html, and a page's own title,
// description and share image are only set by JavaScript (src/components/Seo.tsx) after it has loaded.
// Facebook, LinkedIn, WhatsApp, X and other link-preview crawlers never run JavaScript, so every project
// and blog link was previewed with the home page's tags. This function returns the same index.html with
// the page's own tags already filled in. Browsers then carry on exactly as before (Seo.tsx still runs).
//
// Only published projects and blog posts can be read: the database's Row Level Security hides drafts
// from the public key this function uses, so a draft never gets a preview.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../public-config.json' with { type: 'json' };

// Mirrors DEFAULT_SEO in src/lib/defaults.ts (used when the database has no saved SEO settings).
const DEFAULT_SEO = {
  defaultTitle: 'Walid Rahman | Brand Developer',
  titleTemplate: '%s | Walid Rahman',
  defaultDescription:
    'Walid Rahman is a Dhaka-based Brand Developer and team leader with expertise in digital marketing, ed-tech, e-commerce and brand management.',
  siteName: 'Walid Rahman',
  siteUrl: 'https://walidrahman.com',
  twitterHandle: '',
  ogImage: '',
  robotsIndex: true,
};
// Same rule as the browser (SiteConfigContext): an empty saved value falls back to the default, except for these.
const SEO_ALLOW_EMPTY = ['ogImage', 'twitterHandle', 'titleTemplate'];

const COLUMNS = {
  project: 'id,slug,title,social_title,social_description,social_image,summary,content,hero_image,image',
  blog: 'id,slug,title,social_title,social_description,social_image,excerpt,image',
};
const TABLES = { project: 'projects', blog: 'blog_posts' };
const PATHS = { project: '/projects/', blog: '/blog/' };

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function mergeSeo(saved) {
  const out = { ...DEFAULT_SEO };
  if (!saved || typeof saved !== 'object') return out;
  for (const key of Object.keys(DEFAULT_SEO)) {
    const v = saved[key];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '' && !SEO_ALLOW_EMPTY.includes(key)) continue;
    if (typeof v !== typeof DEFAULT_SEO[key]) continue;
    out[key] = v;
  }
  return out;
}

/** Which title, description and image a page shares with. Same choices as ProjectDetail.tsx / BlogDetail.tsx. */
export function pickPage(kind, row) {
  if (kind === 'blog') {
    return {
      title: row.social_title || row.title,
      description: row.social_description || row.excerpt,
      image: row.social_image || row.image,
      type: 'article',
    };
  }
  const lead = (row.content || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)[0];
  return {
    title: row.social_title || row.title,
    description: row.social_description || row.summary || lead,
    image: row.social_image || row.hero_image || row.image,
    type: 'website',
  };
}

const absoluteImage = (url, base) => {
  const u = String(url || '').trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/') && !u.startsWith('//')) return base + u;
  return '';
};

/** Returns the page's HTML: the template with its own title, description, canonical and share tags swapped for this page's. */
export function buildPageHtml(template, seoSettings, page, path) {
  if (!/<\/head>/i.test(template)) return template;
  const seo = mergeSeo(seoSettings);
  const base = seo.siteUrl.replace(/\/+$/, '');
  const title = page.title
    ? (seo.titleTemplate.includes('%s') ? seo.titleTemplate.replace('%s', () => page.title) : `${page.title} | ${seo.siteName}`)
    : seo.defaultTitle;
  const description = String(page.description || seo.defaultDescription).replace(/\s+/g, ' ').trim().slice(0, 300);
  const defaultImage = `${base}/og-image.png`;
  const image = absoluteImage(page.image, base) || absoluteImage(seo.ogImage, base) || defaultImage;
  const url = base + path;
  const robots = seo.robotsIndex ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';

  const meta = (attr, key, content) => `<meta ${attr}="${key}" content="${esc(content)}" />`;
  const tags = [
    `<title>${esc(title)}</title>`,
    meta('name', 'description', description),
    meta('name', 'robots', robots),
    `<link rel="canonical" href="${esc(url)}" />`,
    meta('property', 'og:type', page.type || 'website'),
    meta('property', 'og:site_name', seo.siteName),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('property', 'og:url', url),
    meta('property', 'og:image', image),
    // Only the built-in image has known dimensions; for uploaded images the crawler measures them itself.
    ...(image === defaultImage
      ? [meta('property', 'og:image:width', '1200'), meta('property', 'og:image:height', '630')]
      : []),
    meta('property', 'og:image:alt', title),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
    meta('name', 'twitter:image', image),
    ...(seo.twitterHandle ? [meta('name', 'twitter:site', seo.twitterHandle)] : []),
  ].join('\n    ');

  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\b[^>]*\b(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>\s*/gi, '')
    // The home page's "Person" data does not describe this page; Seo.tsx removes it on these pages too.
    .replace(/<script\b[^>]*\bid\s*=\s*["']seo-jsonld-schema["'][^>]*>[\s\S]*?<\/script>\s*/i, '')
    .replace(/<\/head>/i, () => `    ${tags}\n  </head>`);
}

async function fetchRows(path) {
  const url = (process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!url || !key) throw new Error('backend not configured');
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/** The page's row by permalink (slug) or, failing that, by id. null = not found, undefined = database unreachable. */
async function fetchPage(kind, key) {
  try {
    const select = COLUMNS[kind];
    const table = TABLES[kind];
    let rows = await fetchRows(`${table}?select=${select}&slug=eq.${encodeURIComponent(key)}&limit=1`);
    if (!rows.length && isUuid(key)) rows = await fetchRows(`${table}?select=${select}&id=eq.${key}&limit=1`);
    return rows[0] ?? null;
  } catch {
    return undefined;
  }
}

async function fetchSeoSettings() {
  try {
    const rows = await fetchRows('site_settings?select=value&key=eq.seo&limit=1');
    return rows[0]?.value ?? null;
  } catch {
    return null; // fall back to the built-in defaults
  }
}

/** The built index.html: bundled with this function (see "functions" in vercel.json), else fetched from this deployment. */
async function loadTemplate() {
  try {
    return await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
  } catch { /* not bundled; try the deployment itself */ }
  try {
    const host = process.env.VERCEL_URL;
    if (host) {
      const res = await fetch(`https://${host}/index.html`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return await res.text();
    }
  } catch { /* handled below */ }
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const kind = req.query.type === 'blog' ? 'blog' : 'project';
  const key = String(Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug || '');

  const template = await loadTemplate();
  if (!template) {
    console.error('page-meta: could not load index.html');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).send('Temporarily unavailable');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!key || key.length > 200) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).send(template);
  }

  const [row, seoSettings] = await Promise.all([fetchPage(kind, key), fetchSeoSettings()]);
  if (!row) {
    // Unknown address or database unreachable: serve the page as before, so the app still loads (and shows its own "not found").
    res.setHeader('Cache-Control', row === null ? 'public, s-maxage=60' : 'no-store');
    return res.status(200).send(template);
  }

  // Edits made in the admin show in link previews within a few minutes.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  return res.status(200).send(buildPageHtml(template, seoSettings, pickPage(kind, row), PATHS[kind] + encodeURIComponent(key)));
}
