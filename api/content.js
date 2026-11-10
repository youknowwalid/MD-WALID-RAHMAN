// Serves /api/content?p=<database request> (read-only, public data only).
//
// Why this exists: the database lives in the US, so every visitor's browser used to talk to it directly,
// one slow trip across the world per request (the home page makes 8). This function asks the database
// from the server (right next to it, so it is fast) and Vercel keeps a copy of the answer near the
// visitor for a minute. Later requests, from anyone, are then answered from that nearby copy.
// If this function ever fails, the browser quietly falls back to asking the database directly
// (see src/lib/api.ts).
//
// Safety: only the public tables the site already reads, only GET, and only simple, strictly checked
// query shapes. It uses the same public key as the browser, so the database's Row Level Security
// still decides what is visible (drafts and private data stay hidden).
import config from '../public-config.json' with { type: 'json' };

const TABLES = new Set([
  'projects', 'blog_posts', 'services', 'resume_items', 'skills',
  'testimonials', 'pricing_plans', 'products', 'site_settings',
]);

// Allowed query parameters and the exact shape of each value.
const PARAMS = {
  select: /^(\*|[a-z0-9_]+(,[a-z0-9_]+)*)$/,
  order: /^[a-z_]+\.(asc|desc)(,[a-z_]+\.(asc|desc))*$/,
  limit: /^[0-9]{1,4}$/,
  slug: /^eq\.(?:[A-Za-z0-9_.~-]|%[0-9A-Fa-f]{2}){1,300}$/,
  id: /^eq\.[0-9a-fA-F-]{36}$/,
};

/** Returns the checked request path, or null if it is not one of the allowed shapes. */
export function validate(p) {
  if (typeof p !== 'string' || p.length > 600) return null;
  const q = p.indexOf('?');
  if (q < 1) return null;
  const table = p.slice(0, q);
  if (!TABLES.has(table)) return null;
  const seen = new Set();
  for (const part of p.slice(q + 1).split('&')) {
    const eq = part.indexOf('=');
    if (eq < 1) return null;
    const name = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (seen.has(name) || !PARAMS[name] || !PARAMS[name].test(value)) return null;
    seen.add(name);
  }
  if (!seen.has('select')) return null;
  return p;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const path = validate(req.query?.p);
  if (!path) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'bad request' });
  }
  const url = (process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!url || !key) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'backend not configured' });
  }
  try {
    const upstream = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (!upstream.ok) {
      res.setHeader('Cache-Control', 'no-store');
    } else if (body.trim() === '[]') {
      // Nothing found (e.g. a project that does not exist yet): keep this short so a new page appears quickly.
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60');
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
    }
    return res.status(upstream.status).send(body);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'database unreachable' });
  }
}
