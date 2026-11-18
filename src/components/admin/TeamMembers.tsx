import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { TEAM_QUOTE_MAX, TeamMember } from '../../lib/defaults';
import { patchSettings } from '../../lib/admin';
import { ImageField, inputCls, labelCls } from './fields';
import { friendlyError } from './forms';

interface Props { onToast: (type: 'success' | 'error', message: string) => void }

const blank = (): TeamMember => ({ name: '', role: '', photo: '', quote: '', hidden: false });

export default function TeamMembers({ onToast }: Props) {
  const { refresh } = useSiteConfig();
  const [rows, setRows] = useState<TeamMember[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh().then(({ config }) => setRows((config.teamMembers || []).map((m) => ({ ...blank(), ...m }))));
  }, [refresh]);

  if (!rows) return <div className="flex justify-center p-20" role="status" aria-label="Loading team"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  const patch = (i: number, p: Partial<TeamMember>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
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
    if (missing >= 0) { onToast('error', `Please type a name for member ${missing + 1}, or delete the empty card.`); return; }
    setSaving(true);
    try {
      await patchSettings('global', {
        teamMembers: rows.map((r) => ({ name: r.name.trim(), role: r.role.trim(), photo: r.photo.trim(), quote: r.quote.trim().slice(0, TEAM_QUOTE_MAX), hidden: r.hidden })),
      });
      await refresh();
      onToast('success', 'Team saved and published.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message || 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="sticky top-0 z-20 flex justify-between items-center gap-4 bg-bg-card/95 backdrop-blur p-4 sm:p-6 rounded-2xl border border-white/5">
        <p className="text-sm text-gray-300">The team section under your testimonials. Add people in the order you want them shown. With no members, the section stays hidden.</p>
        <button type="submit" disabled={saving} className="shrink-0 bg-accent text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save &amp; Publish
        </button>
      </div>

      <p className="text-xs text-amber-300">Best results: a portrait photo, taller than wide (4:5), with the face in the upper half. Without a photo, the person's first letter is shown. Each file can be up to 5 MB and is resized automatically.</p>

      {rows.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl"><p className="text-gray-400">No team members yet. Click “Add a member” to start.</p></div>
      )}

      <ul className="space-y-4">
        {rows.map((row, i) => (
          <li key={i} className={`bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4 ${row.hidden ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-gray-300">Member {i + 1}{row.hidden ? ' (hidden)' : ''}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move member ${i + 1} up`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move member ${i + 1} down`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Delete member ${i + 1}`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </div>
            <ImageField label={`Member ${i + 1} photo`} value={row.photo} onChange={(url) => patch(i, { photo: url })} maxSide={900} compact />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`team-name-${i}`} className={labelCls}>Name</label>
                <input id={`team-name-${i}`} value={row.name} onChange={(e) => patch(i, { name: e.target.value })} className={inputCls} maxLength={80} placeholder="Full name" />
              </div>
              <div>
                <label htmlFor={`team-role-${i}`} className={labelCls}>Role</label>
                <input id={`team-role-${i}`} value={row.role} onChange={(e) => patch(i, { role: e.target.value })} className={inputCls} maxLength={80} placeholder="Creative Director" />
              </div>
            </div>
            <div>
              <label htmlFor={`team-quote-${i}`} className={labelCls}>Short line (shown in up to 3 lines)</label>
              <textarea id={`team-quote-${i}`} rows={3} value={row.quote} onChange={(e) => patch(i, { quote: e.target.value })} className={inputCls} maxLength={TEAM_QUOTE_MAX} placeholder="What this person does and how they help your clients." />
              <p className="text-xs text-gray-400 mt-1">{row.quote.length}/{TEAM_QUOTE_MAX} characters</p>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
              <input type="checkbox" checked={row.hidden} onChange={(e) => patch(i, { hidden: e.target.checked })} className="w-5 h-5 accent-accent" />Hide this person for now (keeps them saved)
            </label>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => setRows([...rows, blank()])} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" aria-hidden="true" />Add a member</button>
    </form>
  );
}
