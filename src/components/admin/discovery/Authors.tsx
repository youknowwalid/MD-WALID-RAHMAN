import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, UserRound } from 'lucide-react';
import * as admin from '../../../lib/admin';
import { fromLines, toLines } from '../../../lib/discovery';
import { slugify } from '../../../lib/text';
import { ImageField } from '../fields';
import { friendlyError } from '../forms';
import { AreaField, Card, GhostButton, Loading, SaveButton, TextField, Toaster } from './parts';

type Form = { id: string | null; slug: string; name: string; job_title: string; credentials: string; short_bio: string; avatar_url: string; same_as: string; knows_about: string };
const blank: Form = { id: null, slug: '', name: '', job_title: '', credentials: '', short_bio: '', avatar_url: '', same_as: '', knows_about: '' };

/** The real people behind your articles. Search engines and AI trust pages with a named, checkable author. */
export default function Authors({ onToast }: { onToast: Toaster }) {
  const [rows, setRows] = useState<admin.AuthorRow[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setRows(await admin.listAuthors()); } catch (err: any) { onToast('error', `Could not load: ${friendlyError(err.message)}`); setRows([]); }
  }, [onToast]);
  useEffect(() => { load(); }, [load]);

  const edit = (a: admin.AuthorRow) => setForm({ id: a.id, slug: a.slug, name: a.name, job_title: a.job_title, credentials: a.credentials, short_bio: a.short_bio, avatar_url: a.avatar_url, same_as: toLines(a.same_as), knows_about: toLines(a.knows_about) });
  const set = (k: keyof Form) => (v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form) return;
    const sameAs = fromLines(form.same_as);
    const bad = sameAs.find((u) => !/^https?:\/\//i.test(u));
    if (bad) return onToast('error', `"${bad}" is not a web address. Profile links must start with https://.`);
    const slug = slugify(form.slug || form.name);
    if (!form.name.trim() || !slug) return onToast('error', 'Give the author a name.');
    setSaving(true);
    try {
      await admin.saveAuthor(form.id, {
        slug, name: form.name.trim(), job_title: form.job_title.trim(), credentials: form.credentials.trim(), short_bio: form.short_bio.trim(),
        avatar_url: form.avatar_url.trim(), same_as: sameAs, knows_about: fromLines(form.knows_about),
      });
      onToast('success', 'Author saved.');
      setForm(null);
      await load();
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally { setSaving(false); }
  };

  const remove = async (a: admin.AuthorRow) => {
    if (!window.confirm(`Delete ${a.name}? Pages that used this author will have no author until you pick another.`)) return;
    try { await admin.deleteAuthor(a.id); onToast('success', 'Author deleted.'); await load(); }
    catch (err: any) { onToast('error', `Delete failed: ${friendlyError(err.message)}`); }
  };

  if (!rows) return <Loading />;
  if (form) {
    return (
      <form onSubmit={save} className="space-y-6 max-w-3xl">
        <Card title={form.id ? 'Edit author' : 'New author'} icon={<UserRound className="text-accent w-6 h-6" aria-hidden="true" />}>
          <div className="grid sm:grid-cols-2 gap-5">
            <TextField id="au-name" label="Name" value={form.name} onChange={set('name')} maxLength={150} />
            <TextField id="au-title" label="Job title" value={form.job_title} onChange={set('job_title')} maxLength={150} />
            <TextField id="au-slug" label="Short address name (blank = from the name)" value={form.slug} onChange={set('slug')} placeholder="jane-doe" maxLength={100} />
          </div>
          <AreaField id="au-bio" label="Short bio" value={form.short_bio} onChange={set('short_bio')} rows={3} maxLength={500} hint={`${form.short_bio.length}/500`} />
          <AreaField id="au-cred" label="Qualifications and experience (what makes this person worth trusting)" value={form.credentials} onChange={set('credentials')} rows={3} maxLength={1000} />
          <ImageField label="Photo" value={form.avatar_url} onChange={set('avatar_url')} maxSide={500} compact />
          <AreaField id="au-same" label="Profiles that prove who they are (one link per line)" value={form.same_as} onChange={set('same_as')} rows={3} mono />
          <AreaField id="au-knows" label="Topics they know (one per line)" value={form.knows_about} onChange={set('knows_about')} rows={3} />
        </Card>
        <div className="flex justify-end gap-3"><GhostButton onClick={() => setForm(null)}>Cancel</GhostButton><SaveButton saving={saving} label="Save author" /></div>
      </form>
    );
  }
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-400">Pick an author for each article in the Pages tab.</p>
        <button type="button" onClick={() => setForm(blank)} className="flex items-center gap-2 bg-accent text-[#0d1117] font-black px-5 py-3 rounded-xl"><Plus className="w-5 h-5" aria-hidden="true" />Add author</button>
      </div>
      <ul className="space-y-3">
        {rows.map((a) => (
          <li key={a.id} className="bg-bg-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full bg-white/5 grid place-items-center"><UserRound className="w-6 h-6 text-gray-500" aria-hidden="true" /></div>}
            <div className="min-w-0 flex-1"><p className="font-bold truncate">{a.name}</p><p className="text-sm text-gray-400 truncate">{a.job_title || 'No job title yet'}</p></div>
            <button type="button" onClick={() => edit(a)} className="p-3 rounded-xl border border-white/10 hover:bg-white/5" aria-label={`Edit ${a.name}`}><Edit2 className="w-5 h-5" aria-hidden="true" /></button>
            <button type="button" onClick={() => remove(a)} className="p-3 rounded-xl border border-white/10 hover:bg-red-400/10 text-gray-300 hover:text-red-300" aria-label={`Delete ${a.name}`}><Trash2 className="w-5 h-5" aria-hidden="true" /></button>
          </li>
        ))}
        {rows.length === 0 && <li className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-gray-400">No authors yet.</li>}
      </ul>
    </div>
  );
}
