/**
 * Everything the admin panel needs from Supabase (sign-in, saving, uploads).
 * This file is only loaded on /admin, so visitors never download the SDK.
 */
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, backendConfigured } from './config';
import { Collection, ORDER, TABLES, fromRow, toRow } from './rows';
import { prepareImage } from './image';
import type { SettingsKey } from './api';

export type { User };

let client: SupabaseClient | null = null;
export const getClient = (): SupabaseClient => {
  if (!backendConfigured) throw new Error('The database is not connected yet.');
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
};

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// ── Authentication ──
export const signIn = async (email: string, password: string) => {
  const { error } = await getClient().auth.signInWithPassword({ email: email.trim(), password });
  fail(error);
};
export const signUp = async (email: string, password: string) => {
  const { data, error } = await getClient().auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${window.location.origin}/admin` },
  });
  if (error) throw new Error(/closed|not allowed|database error/i.test(error.message) ? 'This e-mail address is not allowed to create an admin account.' : error.message);
  return { needsConfirmation: !data.session };
};
export const sendMagicLink = async (email: string) => {
  const { error } = await getClient().auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
  });
  fail(error);
};
export const signOut = async () => { fail((await getClient().auth.signOut()).error); };
export const changePassword = async (password: string) => {
  fail((await getClient().auth.updateUser({ password })).error);
};
export const getUser = async (): Promise<User | null> => (await getClient().auth.getSession()).data.session?.user ?? null;
export const onAuthChange = (cb: (user: User | null) => void) => {
  const { data } = getClient().auth.onAuthStateChange((_event, session) => cb(session?.user ?? null));
  return () => data.subscription.unsubscribe();
};
/** Asks the database whether this signed-in user is on the admin allow-list. */
export const isAdmin = async (): Promise<boolean> => {
  const { data, error } = await getClient().rpc('is_admin');
  return !error && data === true;
};

// ── Content ──
export const listAll = async (collection: Collection): Promise<any[]> => {
  const query = getClient().from(TABLES[collection]).select('*');
  for (const part of ORDER[collection].split(',')) {
    const [col, dir] = part.split('.');
    query.order(col, { ascending: dir === 'asc' });
  }
  const { data, error } = await query;
  fail(error);
  return (data ?? []).map((r) => fromRow(collection, r));
};
export const addRow = async (collection: Collection, data: Record<string, any>) => {
  fail((await getClient().from(TABLES[collection]).insert(toRow(collection, data))).error);
};
export const updateRow = async (collection: Collection, id: string, data: Record<string, any>) => {
  if (!id) throw new Error('Missing item id.');
  const { data: rows, error } = await getClient().from(TABLES[collection]).update(toRow(collection, data)).eq('id', id).select('id');
  fail(error);
  if (!rows?.length) throw new Error('Nothing was saved. Your session may have expired — please sign in again.');
};
export const removeRow = async (collection: Collection, id: string) => {
  const { data, error } = await getClient().from(TABLES[collection]).delete().eq('id', id).select('id');
  fail(error);
  if (!data?.length) throw new Error('Nothing was deleted. Your session may have expired — please sign in again.');
};
export const markRead = (id: string, isRead: boolean) => updateRow('contactSubmissions', id, { isRead });

// ── Settings ──
export const loadSettings = async (): Promise<Partial<Record<SettingsKey, any>>> => {
  const { data, error } = await getClient().from('site_settings').select('key,value');
  fail(error);
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
};
export const saveSettings = async (key: SettingsKey, value: Record<string, any>) => {
  fail((await getClient().from('site_settings').upsert({ key, value }, { onConflict: 'key' })).error);
};

/** Updates only the given fields of a settings group, keeping everything else that is already saved. */
export const patchSettings = async (key: SettingsKey, patch: Record<string, any>) => {
  const current = (await loadSettings())[key] ?? {};
  await saveSettings(key, { ...current, ...patch });
};

// ── Files ──
const MAX_BYTES = 5 * 1024 * 1024;
const extFor = (type: string) => ({ 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'application/pdf': 'pdf' } as Record<string, string>)[type] || 'bin';

async function upload(blob: Blob, folder: string): Promise<string> {
  if (blob.size > MAX_BYTES) throw new Error('This file is larger than 5 MB. Please choose a smaller one.');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(blob.type)}`;
  const bucket = getClient().storage.from('site-media');
  const { error } = await bucket.upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  fail(error);
  return bucket.getPublicUrl(path).data.publicUrl;
}
export const uploadImage = async (file: File, maxSide = 1600) => upload(await prepareImage(file, maxSide), 'images');
export const uploadPdf = async (file: File) => {
  if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed.');
  return upload(file, 'documents');
};
