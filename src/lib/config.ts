import publicConfig from '../../public-config.json';

/**
 * Public connection settings for the site's Supabase project. Both values are
 * designed to be public (access is controlled by Row Level Security in the
 * database), so they live in public-config.json. Environment variables win if set.
 */
const clean = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\/+$/, '') : '');

// An environment variable that is set (even to an empty value) wins over public-config.json.
const pick = (env: unknown, fallback: unknown) => (typeof env === 'string' ? clean(env) : clean(fallback));

export const SUPABASE_URL = pick(import.meta.env.VITE_SUPABASE_URL, publicConfig.supabaseUrl);
export const SUPABASE_ANON_KEY = pick(import.meta.env.VITE_SUPABASE_ANON_KEY, publicConfig.supabaseAnonKey);

/** False until a Supabase project is connected; the site then runs on built-in content. */
export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SITE_URL = 'https://walidrahman.com';
