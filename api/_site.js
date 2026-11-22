// Shared by the small server functions that publish site-wide text (llms.txt, sitemap.xml).
// The point: they read what the admin saved (site_settings) at request time, so nothing about the
// brand, the contact e-mail, the numbers or the web address is retyped in code and can go out of date.
import config from '../public-config.json' with { type: 'json' };
import seoDefaults from '../src/lib/seo-defaults.json' with { type: 'json' };

/** The built-in web address, used only while the database has no saved SEO settings (or cannot be reached). */
export const DEFAULT_SITE_URL = seoDefaults.siteUrl.replace(/\/+$/, '');

/** The saved settings as { global, hero, seo } (each possibly missing). Never throws: {} when the database is unreachable. */
export async function loadSettings() {
  const url = (process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!url || !key) return {};
  try {
    const res = await fetch(`${url}/rest/v1/site_settings?select=key,value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const out = {};
    for (const row of await res.json()) if (row && typeof row.key === 'string') out[row.key] = row.value;
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
