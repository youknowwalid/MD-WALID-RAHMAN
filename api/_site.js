// Shared by the small server functions that publish site-wide text (llms.txt, sitemap.xml).
// The point: they read what the admin saved (site_settings) at request time, so nothing about the
// brand, the contact e-mail, the numbers or the web address is retyped in code and can go out of date.
import config from '../public-config.json' with { type: 'json' };
import seoDefaults from '../src/lib/seo-defaults.json' with { type: 'json' };

/** The built-in web address, used only while the database has no saved SEO settings (or cannot be reached). */
export const DEFAULT_SITE_URL = seoDefaults.siteUrl.replace(/\/+$/, '');

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

/** The site's web address without a trailing slash: the saved one if there is one, else the built-in one. */
export const siteUrlOf = (settings) => (text(settings?.seo?.siteUrl) || DEFAULT_SITE_URL).replace(/\/+$/, '');
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
