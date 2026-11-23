// Shared by the small server functions that publish site-wide text (llms.txt, sitemap.xml).
// The point: they read what the admin saved (site_settings) at request time, so nothing about the
// brand, the contact e-mail, the numbers or the web address is retyped in code and can go out of date.
import config from '../public-config.json' with { type: 'json' };
import seoDefaults from '../src/lib/seo-defaults.json' with { type: 'json' };

/**
 * The address this request was made to, e.g. "https://example.com". Used only while the admin has not saved
 * a web address (Settings > SEO). Empty when the request carries no host.
 */
export function originOf(req) {
  const raw = req?.headers?.['x-forwarded-host'] || req?.headers?.host || '';
  const host = String(raw).split(',')[0].trim().toLowerCase();
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/.test(host)) return '';
  return `${/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https'}://${host}`;
}

/**
 * Reads from the database with the public key (Row Level Security decides what is visible, so drafts stay hidden).
 * Throws when the database cannot be reached; callers decide what that means for them.
 * @param {string} path e.g. "projects?select=id,slug&limit=5"
 * @param {number} [timeoutMs]
 * @returns {Promise<any>}
 */
export async function rest(path, timeoutMs = 5000) {
  const url = (process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!url || !key) throw new Error('backend not configured');
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/** Calls a database function with the public key. Throws when it fails. */
export async function rpc(name, args, timeoutMs = 2000) {
  const url = (process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!url || !key) throw new Error('backend not configured');
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(String(res.status));
}

/** The saved settings as { global, hero, seo, discovery } (each possibly missing). Never throws: {} when the database is unreachable. */
export async function loadSettings() {
  try {
    const out = {};
    for (const row of await rest('site_settings?select=key,value')) if (row && typeof row.key === 'string') out[row.key] = row.value;
    return out;
  } catch {
    return {};
  }
}

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** The site's web address without a trailing slash: the saved one, else the SITE_URL setting, else the address of this request. */
export const siteUrlOf = (settings, req) => (text(settings?.seo?.siteUrl) || text(process.env.SITE_URL) || originOf(req)).replace(/\/+$/, '');
export const siteNameOf = (settings) => text(settings?.seo?.siteName) || seoDefaults.siteName;
export const descriptionOf = (settings) => text(settings?.seo?.defaultDescription) || seoDefaults.defaultDescription;

const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

/** One "key number" as a line of text: "8+ Yrs Experience", "100% Satisfaction". Empty when nothing is saved. */
export function statText(s) {
  const value = clean(s?.value);
  const unit = clean(s?.unit);
  const number = value + (unit ? (/^[A-Za-z]/.test(unit) ? ' ' : '') + unit : '');
  return [number, clean(s?.label)].filter(Boolean).join(' ');
}
