import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { HireOffer } from '../../lib/defaults';
import { patchSettings } from '../../lib/admin';
import { inputCls, labelCls } from './fields';
import { friendlyError } from './forms';
import RichTextArea from './RichTextArea';

interface Props { onToast: (type: 'success' | 'error', message: string) => void }

const detailsToText = (d: HireOffer['details']) => (d || []).map((x) => `${x.label}: ${x.value}`).join('\n');
const textToDetails = (t: string) => t.split('\n').map((l) => { const k = l.indexOf(':'); return k > 0 ? { label: l.slice(0, k).trim(), value: l.slice(k + 1).trim() } : null; }).filter((d): d is { label: string; value: string } => !!d && !!d.label && !!d.value);

const blank = (): HireOffer => ({ name: '', tag: '', description: '', features: [], details: [], buttonText: 'Book a Call', buttonUrl: '/#contact', dark: false, hidden: false });

export default function HireOffers({ onToast }: Props) {
  const { refresh } = useSiteConfig();
  const [rows, setRows] = useState<HireOffer[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh().then(({ config }) => setRows((config.hireOffers || []).map((o) => ({ ...blank(), ...o }))));
  }, [refresh]);

  if (!rows) return <div className="flex justify-center p-20" role="status" aria-label="Loading offers"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  const patch = (i: number, p: Partial<HireOffer>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
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
    if (missing >= 0) { onToast('error', `Please type a title for offer ${missing + 1}, or delete the empty card.`); return; }
    setSaving(true);
    try {
      await patchSettings('global', {
        hireOffers: rows.map((r) => ({
          name: r.name.trim(), tag: r.tag.trim(), description: r.description.trim(),
          features: r.features.map((f) => f.trim()).filter(Boolean),
          details: (r.details || []).filter((d) => d.label.trim() && d.value.trim()),
          buttonText: r.buttonText.trim(), buttonUrl: r.buttonUrl.trim(), dark: r.dark, hidden: r.hidden,
        })),
      });
      await refresh();
      onToast('success', 'Work With Me saved and published.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message || 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="sticky top-0 z-20 flex justify-between items-center gap-4 bg-bg-card/95 backdrop-blur p-4 sm:p-6 rounded-2xl border border-white/5">
        <p className="text-sm text-gray-300">The “Work With Me” section. Each card is one way people can hire you. The heading is edited under Settings.</p>
        <button type="submit" disabled={saving} className="shrink-0 bg-accent text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save &amp; Publish
        </button>
      </div>

      <ul className="space-y-4">
        {rows.map((row, i) => (
          <li key={i} className={`bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4 ${row.hidden ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-gray-300">Offer {i + 1}{row.hidden ? ' (hidden)' : ''}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move offer ${i + 1} up`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move offer ${i + 1} down`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Delete offer ${i + 1}`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`hire-name-${i}`} className={labelCls}>Title</label>
                <input id={`hire-name-${i}`} value={row.name} onChange={(e) => patch(i, { name: e.target.value })} className={inputCls} maxLength={80} placeholder="Project-Based" />
              </div>
              <div>
                <label htmlFor={`hire-tag-${i}`} className={labelCls}>Small tag</label>
                <input id={`hire-tag-${i}`} value={row.tag} onChange={(e) => patch(i, { tag: e.target.value })} className={inputCls} maxLength={40} placeholder="Fixed Cost" />
              </div>
            </div>
            <div>
              <RichTextArea id={`hire-desc-${i}`} label="Description" rows={2} value={row.description} onChange={(t) => patch(i, { description: t })} maxLength={300} />
            </div>
            <div>
              <label htmlFor={`hire-features-${i}`} className={labelCls}>Checklist (one line per point)</label>
              <textarea id={`hire-features-${i}`} rows={4} value={row.features.join('\n')} onChange={(e) => patch(i, { features: e.target.value.split('\n') })} className={inputCls} />
            </div>
            <div>
              <label htmlFor={`hire-details-${i}`} className={labelCls}>Fact lines (one per line, written as “Label: value”)</label>
              <textarea key={`d-${i}-${row.name}`} id={`hire-details-${i}`} rows={3} defaultValue={detailsToText(row.details)} onBlur={(e) => patch(i, { details: textToDetails(e.target.value) })} className={inputCls} placeholder={'Starting at: 25k BDT\nTimeline: 2–3 weeks\nWho works on it: Me plus the team'} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`hire-btn-${i}`} className={labelCls}>Button text</label>
                <input id={`hire-btn-${i}`} value={row.buttonText} onChange={(e) => patch(i, { buttonText: e.target.value })} className={inputCls} maxLength={40} />
              </div>
              <div>
                <label htmlFor={`hire-url-${i}`} className={labelCls}>Button link</label>
                <input id={`hire-url-${i}`} value={row.buttonUrl} onChange={(e) => patch(i, { buttonUrl: e.target.value })} className={inputCls} placeholder="/#contact" />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                <input type="checkbox" checked={row.dark} onChange={(e) => patch(i, { dark: e.target.checked })} className="w-5 h-5 accent-accent" />Dark highlighted card
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                <input type="checkbox" checked={row.hidden} onChange={(e) => patch(i, { hidden: e.target.checked })} className="w-5 h-5 accent-accent" />Hide for now (keeps it saved)
              </label>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => setRows([...rows, blank()])} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" aria-hidden="true" />Add an offer</button>
    </form>
  );
}
