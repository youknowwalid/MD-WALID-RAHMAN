// POST /api/admin-orders  { action: 'approve' | 'reject' | 'resend', orderId }
// Used by the Orders tab in /admin. The caller must be signed in as the website administrator:
// we ask the database itself (the same is_admin() rule the admin panel uses) before doing anything.
import config from '../public-config.json' with { type: 'json' };
import { isConfigured, makeContext } from './_context.js';
import { adminAction, publicOrder, sendJson } from './_orders.js';

async function isAdmin(jwt) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method' });
  if (!isConfigured()) return sendJson(res, 503, { error: 'unconfigured' });
  const jwt = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
  if (!(await isAdmin(jwt))) return sendJson(res, 401, { error: 'unauthorized' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  try {
    const result = await adminAction(body?.action, body?.orderId, makeContext());
    if (result.error) return sendJson(res, { invalid: 400, not_found: 404, conflict: 409 }[result.error] ?? 500, { error: result.error });
    return sendJson(res, 200, { order: publicOrder(result.order), email: result.email ?? null });
  } catch {
    return sendJson(res, 502, { error: 'server' });
  }
}
