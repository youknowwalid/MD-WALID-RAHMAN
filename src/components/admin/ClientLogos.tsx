import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { ClientLogo } from '../../lib/defaults';
import { patchSettings } from '../../lib/admin';
import { ImageField, inputCls, labelCls } from './fields';
import { friendlyError } from './forms';

interface Props { onToast: (type: 'success' | 'error', message: string) => void }

const blank = (): ClientLogo => ({ name: '', image: '', url: '', hidden: false });

export default function ClientLogos({ onToast }: Props) {
  const { refresh } = useSiteConfig();
  const [rows, setRows] = useState<ClientLogo[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh().then(({ config }) => setRows((config.clientLogos || []).map((l) => ({ ...blank(), ...l }))));
  }, [refresh]);

  if (!rows) return <div className="flex justify-center p-20" role="status" aria-label="Loading logos"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  const patch = (i: number, p: Partial<ClientLogo>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = rows.findIndex((r) => r.image && !r.name.trim());
    if (missing >= 0) { onToast('error', `Please type the company name for logo ${missing + 1}. It is read aloud for visitors who cannot see the picture.`); return; }
    setSaving(true);
    try {
      await patchSettings('global', {
        clientLogos: rows.filter((r) => r.image.trim()).map((r) => ({ name: r.name.trim(), image: r.image.trim(), url: r.url.trim(), hidden: r.hidden })),
      });
      await refresh();
      onToast('success', 'Client logos saved and published.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message || 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="sticky top-0 z-20 flex justify-between items-center gap-4 bg-bg-card/95 backdrop-blur p-4 sm:p-6 rounded-2xl border border-white/5">
        <p className="text-sm text-gray-300">The moving strip under your name on the home page. Add logos in the order you want them shown. With no logos, your resume company names are shown instead.</p>
        <button type="submit" disabled={saving} className="shrink-0 bg-accent text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save &amp; Publish
        </button>
      </div>

      <p className="text-xs text-amber-300">Best results: a WebP (or PNG) logo with a transparent background, in full color. Wide and square logos both fit; they are shown at the same height with equal spacing. Each file can be up to 5 MB and is resized automatically.</p>

      {rows.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl"><p className="text-gray-400">No logos yet. Click “Add a logo” to start.</p></div>
      )}

      <ul className="space-y-4">
        {rows.map((row, i) => (
          <li key={i} className={`bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4 ${row.hidden ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-gray-300">Logo {i + 1}{row.hidden ? ' (hidden)' : ''}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move logo ${i + 1} up`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move logo ${i + 1} down`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Delete logo ${i + 1}`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </div>
            <ImageField label={`Logo ${i + 1} image`} value={row.image} onChange={(url) => patch(i, { image: url })} maxSide={480} compact />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`logo-name-${i}`} className={labelCls}>Company name</label>
                <input id={`logo-name-${i}`} value={row.name} onChange={(e) => patch(i, { name: e.target.value })} className={inputCls} maxLength={80} placeholder="Company name" />
              </div>
              <div>
                <label htmlFor={`logo-url-${i}`} className={labelCls}>Website link (optional)</label>
                <input id={`logo-url-${i}`} value={row.url} onChange={(e) => patch(i, { url: e.target.value })} className={inputCls} placeholder="https://…" />
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
              <input type="checkbox" checked={row.hidden} onChange={(e) => patch(i, { hidden: e.target.checked })} className="w-5 h-5 accent-accent" />Hide this logo for now (keeps it saved)
            </label>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => setRows([...rows, blank()])} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" aria-hidden="true" />Add a logo</button>
    </form>
  );
}
