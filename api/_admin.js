// Asks the database whether the caller is the website administrator (the same is_admin() rule the admin panel uses).
// Shared by the server functions that only the signed-in admin may call.
import config from '../public-config.json' with { type: 'json' };

/**
 * @param {string} jwt the caller's sign-in token
 * @returns {Promise<boolean>}
 */
export async function isAdmin(jwt) {
  const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || '';
  if (!base || !anon || !jwt) return false;
  try {
    const res = await fetch(`${base}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: { apikey: anon, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    return res.ok && (await res.json()) === true;
  } catch {
    return false;
  }
}

/** The bearer token of a request, or ''. */
export const bearer = (req) => String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
