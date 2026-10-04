import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { uploadImage, uploadPdf } from '../../lib/admin';

export const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:border-accent outline-none transition-colors';
export const labelCls = 'block text-sm text-gray-300 mb-2';

// ── Toast ──
export interface ToastState { type: 'success' | 'error'; message: string }

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number>();
  const show = useCallback((type: ToastState['type'], message: string) => {
    window.clearTimeout(timer.current);
    setToast({ type, message });
    timer.current = window.setTimeout(() => setToast(null), type === 'error' ? 8000 : 4000);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { toast, show, dismiss: () => setToast(null) };
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-[100] flex items-start gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold ${
        ok ? 'bg-emerald-950 text-emerald-200 border-emerald-800' : 'bg-rose-950 text-rose-200 border-rose-800'
      }`}
    >
      {ok ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />}
      <span>{toast.message}</span>
    </div>
  );
}

// ── Image upload (stored in Supabase Storage, the database keeps only the link) ──
export function ImageField({
  label, value, onChange, hint, maxSide = 1600, compact,
}: { label: string; value: string; onChange: (url: string) => void; hint?: string; maxSide?: number; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(file, maxSide));
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const size = compact ? 'w-20 h-20' : 'w-32 h-32';
  return (
    <div className="space-y-2">
      <span className={labelCls}>{label}</span>
      <div className="flex gap-4 items-start flex-wrap sm:flex-nowrap">
        {value ? (
          <img src={value} alt="" className={`${size} object-cover rounded-xl border border-white/10 shrink-0`} />
        ) : (
          <div className={`${size} bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center shrink-0`}><ImageIcon className="w-8 h-8 text-gray-600" aria-hidden="true" /></div>
        )}
        <div className="flex-1 min-w-[200px] space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-white">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
              {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pick} className="sr-only" disabled={busy} aria-label={`${label}: choose an image to upload`} />
            </label>
            {value && <button type="button" onClick={() => onChange('')} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-sm font-bold border border-red-500/20">Remove</button>}
          </div>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image link (https://…)" aria-label={`${label}: image link`} className={inputCls} />
          {hint && <p className="text-xs text-accent">{hint}</p>}
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ── PDF upload ──
export function PdfField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try { onChange(await uploadPdf(file)); } catch (err: any) { setError(err.message || 'Upload failed.'); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <label htmlFor="pdf-link" className={labelCls}>{label}</label>
      <div className="flex gap-3 items-center flex-wrap">
        <input id="pdf-link" type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Upload a PDF or paste a link" className={`${inputCls} flex-1 min-w-[200px]`} />
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-white">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
          {busy ? 'Uploading…' : 'Upload PDF'}
          <input type="file" accept="application/pdf" onChange={pick} className="sr-only" disabled={busy} aria-label={`${label}: choose a PDF to upload`} />
        </label>
        {value && <button type="button" onClick={() => onChange('')} className="px-4 py-2.5 bg-red-500/10 text-red-300 rounded-xl text-sm font-bold border border-red-500/20">Remove</button>}
      </div>
      <p className="text-xs text-gray-400">PDF files up to 5 MB.</p>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </div>
  );
}

// ── Several images, one link per line ──
export function GalleryField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const urls = value.split('\n').map((u) => u.trim()).filter(Boolean);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setError('');
    const added: string[] = [];
    try {
      for (const f of files) added.push(await uploadImage(f, 1800));
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    }
    if (added.length) onChange([...urls, ...added].join('\n'));
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <label htmlFor="gallery-links" className={labelCls}>{label}</label>
      {hint && <p className="text-xs text-accent">{hint}</p>}
      {urls.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {urls.map((u, i) => (
            <li key={u + i} className="relative">
              <img src={u} alt="" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
              <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(urls.filter((_, j) => j !== i).join('\n'))} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-black">×</button>
            </li>
          ))}
        </ul>
      )}
      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-bold cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-white">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
        {busy ? 'Uploading…' : 'Upload images'}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={pick} className="sr-only" disabled={busy} aria-label={`${label}: choose images to upload`} />
      </label>
      <textarea id="gallery-links" value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="…or paste image links, one per line" className={`${inputCls} font-mono`} />
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
