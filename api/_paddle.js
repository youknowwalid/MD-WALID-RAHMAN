// Shared helpers for the paid-download endpoints. Files starting with "_" are not routes on Vercel.
import config from '../public-config.json' with { type: 'json' };
import { BUCKET, CATALOG } from './_catalog.js';

const PADDLE_API = 'https://api.paddle.com';
// Paddle transaction IDs look like txn_01hv8wptq8987qeady4xvk1hy3.
export const TXN_RE = /^txn_[a-z0-9]{20,40}$/;
export const PRICE_RE = /^pri_[a-z0-9]{20,40}$/;

/**
 * Asks Paddle (server to server, read-only key) whether a transaction was really paid.
 * Returns { status: 'paid', priceIds } | { status: 'unpaid' | 'not_found' | 'invalid' | 'error' | 'unconfigured' }.
 */
export async function getPaidItems(txnId, { apiKey = process.env.PADDLE_API_KEY, fetchImpl = fetch } = {}) {
  if (!TXN_RE.test(txnId || '')) return { status: 'invalid' };
  if (!apiKey) return { status: 'unconfigured' };
  let res;
  try {
    res = await fetchImpl(`${PADDLE_API}/transactions/${txnId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { status: 'error' };
  }
  if (res.status === 404) return { status: 'not_found' };
  if (!res.ok) return { status: 'error' };
  const txn = (await res.json())?.data;
  if (!txn || !['paid', 'completed'].includes(txn.status)) return { status: 'unpaid' };
  const priceIds = (txn.items || []).map((i) => i?.price?.id ?? i?.price_id).filter((id) => typeof id === 'string');
  return { status: 'paid', priceIds };
}

/** Items from a paid transaction that we know how to deliver. */
export const deliverable = (priceIds) => priceIds.filter((id) => Object.hasOwn(CATALOG, id));

/** A 60-second download link for one private file. */
export async function signedDownloadUrl(priceId, { fetchImpl = fetch } = {}) {
  const item = Object.hasOwn(CATALOG, priceId) ? CATALOG[priceId] : null;
  if (!item) return null;
  const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || config.supabaseUrl || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) return null;
  const res = await fetchImpl(`${base}/storage/v1/object/sign/${BUCKET}/${encodeURIComponent(item.path)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 60 }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const signed = (await res.json())?.signedURL;
  if (typeof signed !== 'string') return null;
  const path = signed.startsWith('/storage/v1') ? signed : `/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`;
  return `${base}${path}&download=${encodeURIComponent(item.filename)}`;
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(JSON.stringify(body));
}

export const query = (req, name) => {
  const raw = req.query?.[name] ?? new URL(req.url, 'http://x').searchParams.get(name);
  return Array.isArray(raw) ? raw[0] : raw;
};
