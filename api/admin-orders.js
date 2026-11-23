// POST /api/admin-orders  { action: 'approve' | 'reject' | 'resend', orderId }
// Used by the Orders tab in /admin. The caller must be signed in as the website administrator:
// we ask the database itself (the same is_admin() rule the admin panel uses) before doing anything.
import { isConfigured, makeContext } from './_context.js';
import { adminAction, publicOrder, sendJson } from './_orders.js';
import { bearer, isAdmin } from './_admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method' });
  if (!isConfigured()) return sendJson(res, 503, { error: 'unconfigured' });
  const jwt = bearer(req);
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
