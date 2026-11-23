import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Edit2, Plus, Trash2 } from 'lucide-react';
import * as admin from '../../../lib/admin';
import { RedirectDraft, redirectProblem } from '../../../lib/discovery';
import { inputCls, labelCls } from '../fields';
import { friendlyError } from '../forms';
import { Card, Check, GhostButton, Loading, SaveButton, Toaster } from './parts';

const blank: RedirectDraft = { source_path: '', destination_path: '', status_code: 301, is_active: true };
const KINDS: { code: RedirectDraft['status_code']; label: string; hint: string }[] = [
  { code: 301, label: 'Moved for good (301)', hint: 'Search engines move the old address’s ranking to the new one. Use this for most changes.' },
  { code: 302, label: 'Moved for now (302)', hint: 'Temporary. Search engines keep the old address.' },
  { code: 410, label: 'Removed for good (410)', hint: 'The page is gone and will not come back. Search engines drop it quickly.' },
];

/** Old addresses that send visitors (and search engines) somewhere else. The database stops loops and shortens chains. */
export default function Redirects({ onToast }: { onToast: Toaster }) {
  const [rows, setRows] = useState<admin.RedirectRow[] | null>(null);
  const [form, setForm] = useState<(RedirectDraft & { id: string | null }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setRows(await admin.listRedirects()); } catch (err: any) { onToast('error', `Could not load: ${friendlyError(err.message)}`); setRows([]); }
  }, [onToast]);
  useEffect(() => { load(); }, [load]);

  const problem = form ? redirectProblem(form) : '';
  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form) return;
    if (problem) return onToast('error', problem);
    setSaving(true);
    try {
      await admin.saveRedirect(form.id, form);
      onToast('success', 'Redirect saved. It starts working within a few minutes.');
      setForm(null);
      await load();
    } catch (err: any) {
      onToast('error', /duplicate key|unique/i.test(err.message) ? 'There is already a redirect for that old address. Edit it instead.' : friendlyError(err.message));
    } finally { setSaving(false); }
  };

  const toggle = async (r: admin.RedirectRow) => {
    try { await admin.saveRedirect(r.id, { ...r, is_active: !r.is_active }); await load(); }
    catch (err: any) { onToast('error', friendlyError(err.message)); }
  };
  const remove = async (r: admin.RedirectRow) => {
    if (!window.confirm(`Delete the redirect from ${r.source_path}? Visitors to that address will see a “page not found” again.`)) return;
    try { await admin.deleteRedirect(r.id); onToast('success', 'Redirect deleted.'); await load(); }
    catch (err: any) { onToast('error', `Delete failed: ${friendlyError(err.message)}`); }
  };

  if (!rows) return <Loading />;
  if (form) {
    const kind = KINDS.find((k) => k.code === form.status_code)!;
    return (
      <form onSubmit={save} className="space-y-6 max-w-3xl">
        <Card title={form.id ? 'Edit redirect' : 'New redirect'}>
          <div>
            <label htmlFor="rd-src" className={labelCls}>Old address</label>
            <input id="rd-src" value={form.source_path} onChange={(e) => setForm({ ...form, source_path: e.target.value })} placeholder="/old-page" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Only the part after your domain, starting with /.</p>
          </div>
          <div>
            <label htmlFor="rd-kind" className={labelCls}>What should happen</label>
            <select id="rd-kind" value={form.status_code} onChange={(e) => setForm({ ...form, status_code: Number(e.target.value) as RedirectDraft['status_code'] })} className={inputCls}>
              {KINDS.map((k) => <option key={k.code} value={k.code}>{k.label}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">{kind.hint}</p>
          </div>
          {form.status_code !== 410 && (
            <div>
              <label htmlFor="rd-dest" className={labelCls}>New address</label>
              <input id="rd-dest" value={form.destination_path} onChange={(e) => setForm({ ...form, destination_path: e.target.value })} placeholder="/new-page or https://…" className={inputCls} />
            </div>
          )}
          <Check label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          {problem && form.source_path && <p role="alert" className="text-sm text-amber-300">{problem}</p>}
        </Card>
        <div className="flex justify-end gap-3"><GhostButton onClick={() => setForm(null)}>Cancel</GhostButton><SaveButton saving={saving} label="Save redirect" disabled={Boolean(problem)} /></div>
      </form>
    );
  }
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-gray-400">When you change or remove a page address, add a redirect so visitors and search rankings are not lost.</p>
        <button type="button" onClick={() => setForm({ ...blank, id: null })} className="flex items-center gap-2 bg-accent text-[#0d1117] font-black px-5 py-3 rounded-xl"><Plus className="w-5 h-5" aria-hidden="true" />Add redirect</button>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className={`bg-bg-card p-4 rounded-2xl border border-white/5 flex items-center gap-3 flex-wrap ${r.is_active ? '' : 'opacity-60'}`}>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-mono flex items-center gap-2 flex-wrap break-all">{r.source_path}<ArrowRight className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />{r.status_code === 410 ? <span className="text-rose-300">gone (410)</span> : r.destination_path}</p>
              <p className="text-xs text-gray-400 mt-1">{r.status_code} · {r.hit_count} visit{r.hit_count === 1 ? '' : 's'}{r.last_hit_at ? ` · last ${new Date(r.last_hit_at).toLocaleDateString()}` : ''}{r.is_active ? '' : ' · off'}</p>
            </div>
            <GhostButton onClick={() => toggle(r)}>{r.is_active ? 'Turn off' : 'Turn on'}</GhostButton>
            <button type="button" onClick={() => setForm({ id: r.id, source_path: r.source_path, destination_path: r.destination_path, status_code: r.status_code, is_active: r.is_active })} className="p-3 rounded-xl border border-white/10 hover:bg-white/5" aria-label={`Edit redirect from ${r.source_path}`}><Edit2 className="w-5 h-5" aria-hidden="true" /></button>
            <button type="button" onClick={() => remove(r)} className="p-3 rounded-xl border border-white/10 hover:bg-red-400/10 text-gray-300 hover:text-red-300" aria-label={`Delete redirect from ${r.source_path}`}><Trash2 className="w-5 h-5" aria-hidden="true" /></button>
          </li>
        ))}
        {rows.length === 0 && <li className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-gray-400">No redirects yet.</li>}
      </ul>
    </div>
  );
}
