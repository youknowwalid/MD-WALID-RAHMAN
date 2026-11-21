import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { CapabilityGroup } from '../../lib/defaults';
import { patchSettings } from '../../lib/admin';
import { inputCls, labelCls } from './fields';
import { friendlyError } from './forms';

interface Props { onToast: (type: 'success' | 'error', message: string) => void }

const blank = (): CapabilityGroup => ({ name: '', short: '', items: [] });

/** The "What I can do" card on the home page: its tabs (categories) and the small chips under each tab. */
export default function CapabilityGroups({ onToast }: Props) {
  const { refresh } = useSiteConfig();
  const [rows, setRows] = useState<CapabilityGroup[] | null>(null);
  const [eyebrow, setEyebrow] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh().then(({ config }) => {
      setRows((config.capabilityGroups || []).map((g) => ({ ...blank(), ...g })));
      setEyebrow(config.capabilitiesEyebrow || '');
    });
  }, [refresh]);

  if (!rows) return <div className="flex justify-center p-20" role="status" aria-label="Loading"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  const patch = (i: number, p: Partial<CapabilityGroup>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = rows.findIndex((r) => !r.name.trim());
    if (missing >= 0) { onToast('error', `Please type a tab name for group ${missing + 1}, or delete the empty one.`); return; }
    setSaving(true);
    try {
      await patchSettings('global', {
        capabilitiesEyebrow: eyebrow.trim(),
        capabilityGroups: rows.map((r) => ({
          name: r.name.trim(), short: r.short.trim(),
          items: r.items.map((x) => x.trim()).filter(Boolean),
        })),
      });
      await refresh();
      onToast('success', 'What I Can Do saved and published.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message || 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="sticky top-0 z-20 flex justify-between items-center gap-4 bg-bg-card/95 backdrop-blur p-4 sm:p-6 rounded-2xl border border-white/5">
        <p className="text-sm text-gray-300">The “What I Can Do” card. Each group is one tab; its lines become the small chips under the tab. The heading is edited under Settings.</p>
        <button type="submit" disabled={saving} className="shrink-0 bg-accent text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save &amp; Publish
        </button>
      </div>

      <div className="bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5">
        <label htmlFor="cap-eyebrow" className={labelCls}>Small label at the top right (computers only)</label>
        <input id="cap-eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className={inputCls} maxLength={40} placeholder="Services & Solutions" />
      </div>

      <ul className="space-y-4">
        {rows.map((row, i) => (
          <li key={i} className="bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-gray-300">Group {i + 1}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move group ${i + 1} up`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move group ${i + 1} down`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Delete group ${i + 1}`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`cap-name-${i}`} className={labelCls}>Tab name</label>
                <input id={`cap-name-${i}`} value={row.name} onChange={(e) => patch(i, { name: e.target.value })} className={inputCls} maxLength={40} placeholder="Brand & Business" />
              </div>
              <div>
                <label htmlFor={`cap-short-${i}`} className={labelCls}>Short tab name for phones</label>
                <input id={`cap-short-${i}`} value={row.short} onChange={(e) => patch(i, { short: e.target.value })} className={inputCls} maxLength={14} placeholder="Brand" />
              </div>
            </div>
            <div>
              <label htmlFor={`cap-items-${i}`} className={labelCls}>Chips (one line per chip)</label>
              <textarea id={`cap-items-${i}`} rows={5} value={row.items.join('\n')} onChange={(e) => patch(i, { items: e.target.value.split('\n') })} className={inputCls} />
            </div>
          </li>
        ))}
      </ul>

      {rows.length < 6 && (
        <button type="button" onClick={() => setRows([...rows, blank()])} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" aria-hidden="true" />Add a group</button>
      )}
    </form>
  );
}
