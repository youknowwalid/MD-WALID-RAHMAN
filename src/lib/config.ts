import publicConfig from '../../public-config.json';

/**
 * Public connection settings for the site's Supabase project. Both values are
 * designed to be public (access is controlled by Row Level Security in the
 * database), so they live in public-config.json. Environment variables win if set.
 */
const clean = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\/+$/, '') : '');

export const SUPABASE_URL = clean(import.meta.env.VITE_SUPABASE_URL) || clean(publicConfig.supabaseUrl);
export const SUPABASE_ANON_KEY = clean(import.meta.env.VITE_SUPABASE_ANON_KEY) || clean(publicConfig.supabaseAnonKey);

/** False until a Supabase project is connected; the site then runs on built-in content. */
export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SITE_URL = 'https://walidrahman.com';
