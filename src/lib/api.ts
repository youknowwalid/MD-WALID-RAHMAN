/**
 * Lightweight read/write access for visitors (no SDK needed, keeps the public
 * bundle small). Everything here is protected by Row Level Security in the database.
 */
import { SUPABASE_ANON_KEY, SUPABASE_URL, backendConfigured } from './config';
import { Collection, ORDER, TABLES, fromRow } from './rows';
import { isUuid } from './text';

const headers = (extra?: Record<string, string>) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  ...extra,
});

async function request(path: string, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Returns null when no backend is connected or it can't be reached (callers then show built-in content). */
export async function listRows<T = any>(collection: Collection): Promise<T[] | null> {
  if (!backendConfigured) return null;
  try {
    const res = await request(`${TABLES[collection]}?select=*&order=${ORDER[collection]}`, { headers: headers() });
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, any>[];
    return rows.map((r) => fromRow<T>(collection, r));
  } catch {
    return null;
  }
}

/** Finds one row by its permalink (slug) or, failing that, by id. */
export async function getRow<T = any>(collection: Collection, key: string): Promise<T | null | undefined> {
  if (!backendConfigured) return undefined;
  try {
    const q = async (filter: string) => {
      const res = await request(`${TABLES[collection]}?select=*&${filter}&limit=1`, { headers: headers() });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Record<string, any>[];
    };
    let rows = await q(`slug=eq.${encodeURIComponent(key)}`);
    if (!rows.length && isUuid(key)) rows = await q(`id=eq.${key}`);
    return rows.length ? fromRow<T>(collection, rows[0]) : null;
  } catch {
    return undefined; // couldn't reach the backend
  }
}

export type SettingsKey = 'global' | 'hero' | 'seo';

export async function fetchSettings(): Promise<Partial<Record<SettingsKey, any>> | null> {
  if (!backendConfigured) return null;
  try {
    const res = await request('site_settings?select=key,value', { headers: headers() });
    if (!res.ok) return null;
    const rows = (await res.json()) as { key: SettingsKey; value: any }[];
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return null;
  }
}

export interface ContactMessage { name: string; email: string; subject: string; message: string }

export type ContactResult = 'sent' | 'rate-limited' | 'error' | 'unavailable';

export async function submitContact(msg: ContactMessage): Promise<ContactResult> {
  if (!backendConfigured) return 'unavailable';
  try {
    const res = await request('contact_submissions', {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify(msg),
    });
    if (res.ok) return 'sent';
    const body = await res.text();
    return /too many|temporarily full/i.test(body) ? 'rate-limited' : 'error';
  } catch {
    return 'error';
  }
}
