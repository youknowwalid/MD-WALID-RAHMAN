import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleAlert, CircleMinus, XCircle } from 'lucide-react';
import * as admin from '../../../lib/admin';
import {
  AuditCheck, DiscoverySettings, PageMeta, SCHEMA_TYPES, auditPage, fromLines, isIndexNowKey, jsonLdProblem, metaToRow, toLines,
} from '../../../lib/discovery';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { buildGraph } from '../../../../api/_graph.js';
import { ImageField, inputCls, labelCls } from '../fields';
import { friendlyError } from '../forms';
import { AreaField, Card, Check, GhostButton, RowsEditor, SaveButton, ScoreBadge, TextField, Toaster } from './parts';

export interface PageTarget {
  key: string; label: string; path: string; kind: 'home' | 'blog' | 'project' | 'page';
  fallbackTitle: string; fallbackDescription: string; fallbackImage: string; author: string;
}

const ICON: Record<AuditCheck['status'], React.ReactNode> = {
  pass: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Good" />,
  warn: <CircleAlert className="w-4 h-4 text-amber-400 shrink-0" aria-label="Could be better" />,
  fail: <XCircle className="w-4 h-4 text-rose-400 shrink-0" aria-label="Missing" />,
  na: <CircleMinus className="w-4 h-4 text-gray-500 shrink-0" aria-label="Not needed" />,
};

/** The per-page editor: search results, social sharing, answers for AI, trust signals, with live previews and a score. */
export default function PageEditor({ target, initial, hasRow, authors, discovery, onClose, onSaved, onToast }: {
  target: PageTarget; initial: PageMeta; hasRow: boolean; authors: admin.AuthorRow[]; discovery: DiscoverySettings;
  onClose: () => void; onSaved: () => Promise<void>; onToast: Toaster;
}) {
  const { config, seoConfig } = useSiteConfig();
  const [m, setM] = useState<PageMeta>(initial);
  const [facts, setFacts] = useState(toLines(initial.quotable_facts));
  const [saving, setSaving] = useState(false);
  const [ping, setPing] = useState(true);
  const set = <K extends keyof PageMeta>(k: K) => (v: PageMeta[K]) => setM((x) => ({ ...x, [k]: v }));
  const site = seoConfig.siteUrl.replace(/\/+$/, '');
  const url = m.canonical_override.trim() || `${site}${target.path === '/' ? '/' : target.path}`;
  const canPing = isIndexNowKey(discovery.indexnow.key);

  const draft: PageMeta = { ...m, quotable_facts: fromLines(facts) };
  const audit = useMemo(() => auditPage({
    meta: draft, fallbackTitle: target.fallbackTitle, fallbackDescription: target.fallbackDescription,
    needsAuthor: target.kind === 'blog', hasDefaultShareImage: Boolean(target.fallbackImage),
  }), [draft, target]);

  const title = m.meta_title.trim() || target.fallbackTitle;
  const description = m.meta_description.trim() || target.fallbackDescription;
  const shareImage = m.og_image_url.trim() || target.fallbackImage;
  const author = authors.find((a) => a.id === m.author_id) || null;

  const graph = useMemo(() => {
    try {
      return buildGraph({
        site, seo: seoConfig, global: config, discovery, meta: draft, author,
        page: { title, description, type: target.kind === 'blog' ? 'article' : 'website', author: target.author },
        url, path: target.path, kind: target.kind, description, imageUrl: shareImage, language: discovery.entity.language || 'en',
      });
    } catch { return null; }
  }, [draft, author, title, description, shareImage, url, site, seoConfig, config, discovery, target]);

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    let row;
    try { row = metaToRow(draft); } catch (err: any) { return onToast('error', err.message); }
    setSaving(true);
    try {
      await admin.savePageMeta(target.key, row);
      let note = '';
      if (ping && canPing && row.robots_index) {
        try { await admin.submitIndexNow([url]); note = ' Search engines were told about it.'; } catch { note = ' (Could not notify search engines this time.)'; }
      }
      onToast('success', `Saved. Visitors and search engines see it within about five minutes.${note}`);
      await onSaved();
      onClose();
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally { setSaving(false); }
  };

  const reset = async () => {
    if (!window.confirm('Remove all the custom search settings for this page and go back to the automatic ones?')) return;
    try { await admin.deletePageMeta(target.key); onToast('success', 'Back to automatic settings.'); await onSaved(); onClose(); }
    catch (err: any) { onToast('error', `Could not reset: ${friendlyError(err.message)}`); }
  };

  const today = () => set('last_reviewed_at')(new Date().toISOString());
  const customProblem = jsonLdProblem(m.custom_json_ld);
  const host = (() => { try { return new URL(url).host; } catch { return site; } })();

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"><ArrowLeft className="w-4 h-4" aria-hidden="true" />All pages</button>
        <div className="flex gap-3 items-center flex-wrap">
          {canPing && <Check label="Tell search engines when I save" checked={ping} onChange={setPing} />}
          {hasRow && <GhostButton danger onClick={reset}>Reset to automatic</GhostButton>}
          <SaveButton saving={saving} />
        </div>
      </div>
      <h2 className="text-xl font-black">{target.label} <span className="text-sm font-normal text-gray-400 font-mono">{target.path}</span></h2>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Card title="Search results (Google)" hint="Leave a field empty to keep the automatic text shown in grey.">
            <TextField id="pm-title" label="Page title" value={m.meta_title} onChange={set('meta_title')} placeholder={target.fallbackTitle} maxLength={200} hint={`${title.length} characters. 20 to 65 is ideal.`} />
            <AreaField id="pm-desc" label="Description" value={m.meta_description} onChange={set('meta_description')} rows={3} maxLength={500} hint={`${description.length} characters. 70 to 170 is ideal.`} />
            <TextField id="pm-kw" label="Focus keyword (the phrase this page should be found for)" value={m.focus_keyword} onChange={set('focus_keyword')} maxLength={150} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Check label="Show in search results" checked={m.robots_index} onChange={set('robots_index')} />
              <Check label="Let search engines follow its links" checked={m.robots_follow} onChange={set('robots_follow')} />
            </div>
            <TextField id="pm-canon" label="Canonical address (only if another address is the main one)" value={m.canonical_override} onChange={set('canonical_override')} placeholder="https://…" />
            <RowsEditor<{ lang: string; url: string }> label="Other language versions" rows={m.hreflang_alternates} onChange={set('hreflang_alternates')} blank={() => ({ lang: '', url: '' })} addLabel="Add a language version"
              render={(r, up) => (<div className="grid sm:grid-cols-[120px_1fr] gap-3 pr-10"><input aria-label="Language code" placeholder="bn" value={r.lang} onChange={(e) => up({ lang: e.target.value })} className={inputCls} /><input aria-label="Address of this language version" placeholder="https://…" value={r.url} onChange={(e) => up({ url: e.target.value })} className={inputCls} /></div>)} />
          </Card>

          <Card title="Social sharing" hint="How the link looks on WhatsApp, Facebook, LinkedIn and X.">
            <TextField id="pm-ogt" label="Title when shared" value={m.og_title} onChange={set('og_title')} placeholder={title} maxLength={200} />
            <AreaField id="pm-ogd" label="Description when shared" value={m.og_description} onChange={set('og_description')} rows={2} maxLength={500} />
            <ImageField label="Image when shared" value={m.og_image_url} onChange={set('og_image_url')} maxSide={1200} hint="Recommended: 1200 × 630 pixels." />
            <div>
              <label htmlFor="pm-card" className={labelCls}>Card style</label>
              <select id="pm-card" value={m.twitter_card} onChange={(e) => set('twitter_card')(e.target.value as PageMeta['twitter_card'])} className={inputCls}>
                <option value="summary_large_image">Large image</option><option value="summary">Small image</option>
              </select>
            </div>
          </Card>

          <Card title="Answers for AI and answer engines" hint="Write these yourself, with facts you can stand behind. AI assistants quote clear, direct, honest answers.">
            <AreaField id="pm-tldr" label="Short answer (TL;DR)" value={m.tldr_summary} onChange={set('tldr_summary')} rows={3} maxLength={800} hint={`${m.tldr_summary.length}/800. Two or three plain sentences.`} />
            <RowsEditor<{ question: string; answer: string }> label="Questions and answers" rows={m.faq_items} onChange={set('faq_items')} blank={() => ({ question: '', answer: '' })} addLabel="Add a question"
              hint="Questions real visitors ask. Only complete pairs are published."
              render={(r, up) => (<div className="space-y-3 pr-10"><input aria-label="Question" placeholder="Question" value={r.question} onChange={(e) => up({ question: e.target.value })} className={inputCls} /><textarea aria-label="Answer" placeholder="Answer" rows={3} value={r.answer} onChange={(e) => up({ answer: e.target.value })} className={`${inputCls} resize-y`} /></div>)} />
            <RowsEditor<{ name: string; text: string }> label="How-to steps (only if this page teaches a process)" rows={m.howto_steps} onChange={set('howto_steps')} blank={() => ({ name: '', text: '' })} addLabel="Add a step"
              render={(r, up) => (<div className="space-y-3 pr-10"><input aria-label="Step name" placeholder="Step name" value={r.name} onChange={(e) => up({ name: e.target.value })} className={inputCls} /><textarea aria-label="Step details" placeholder="What to do" rows={2} value={r.text} onChange={(e) => up({ text: e.target.value })} className={`${inputCls} resize-y`} /></div>)} />
          </Card>

          <Card title="Trust and freshness">
            <AreaField id="pm-facts" label="Facts worth quoting (one per line)" value={facts} onChange={setFacts} rows={3} hint="Short, true, checkable statements about your work. Do not add numbers you cannot back up." />
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="pm-author" className={labelCls}>Author</label>
                <select id="pm-author" value={m.author_id ?? ''} onChange={(e) => set('author_id')(e.target.value || null)} className={inputCls}>
                  <option value="">{target.author ? `Automatic (${target.author})` : 'No named author'}</option>
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {authors.length === 0 && <p className="text-xs text-gray-400 mt-1">Add authors in the Authors tab.</p>}
              </div>
              <div>
                <label htmlFor="pm-rev" className={labelCls}>Last checked that this page is still true</label>
                <div className="flex gap-2">
                  <input id="pm-rev" type="date" value={m.last_reviewed_at?.slice(0, 10) ?? ''} onChange={(e) => set('last_reviewed_at')(e.target.value ? new Date(`${e.target.value}T00:00:00Z`).toISOString() : null)} className={inputCls} />
                  <GhostButton onClick={today}>Today</GhostButton>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Structured data" hint="Chosen automatically. Change it only if you know the page is a different kind of page.">
            <div>
              <label htmlFor="pm-schema" className={labelCls}>This page is a</label>
              <select id="pm-schema" value={m.schema_type} onChange={(e) => set('schema_type')(e.target.value as PageMeta['schema_type'])} className={inputCls}>
                {SCHEMA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <AreaField id="pm-json" label="Extra structured data (JSON, optional)" value={m.custom_json_ld} onChange={set('custom_json_ld')} rows={5} mono hint="For example a Service. It is added to the page only if it is valid." />
            {customProblem && <p role="alert" className="text-sm text-amber-300">{customProblem}</p>}
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 min-w-0" aria-label="Previews and score">
          <Card title="Score">
            <div className="flex items-center gap-3"><ScoreBadge score={audit.score} /><span className="text-sm text-gray-400">out of 100</span></div>
            <ul className="space-y-2">
              {audit.checks.map((c) => (
                <li key={c.id} className="flex gap-2 text-sm"><span className="mt-0.5">{ICON[c.status]}</span><span><span className={c.status === 'na' ? 'text-gray-500' : ''}>{c.label}</span>{(c.status === 'fail' || c.status === 'warn') && <span className="block text-xs text-gray-400">{c.tip}</span>}</span></li>
              ))}
            </ul>
          </Card>
          <Card title="Google">
            <div className="rounded-xl bg-white p-4 text-left">
              <div className="text-[#1a0dab] text-lg leading-snug line-clamp-2">{title}</div>
              <div className="text-[#006621] text-xs truncate">{url}</div>
              <div className="text-[#545454] text-sm line-clamp-3">{description}</div>
            </div>
          </Card>
          <Card title="When shared">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-white text-black">
              {shareImage ? <img src={shareImage} alt="" className={`w-full object-cover ${m.twitter_card === 'summary' ? 'h-24' : 'h-40'}`} /> : <div className="h-24 bg-gray-200 grid place-items-center text-xs text-gray-500">No image</div>}
              <div className="p-3"><p className="text-[11px] uppercase text-gray-500">{host}</p><p className="font-bold text-sm line-clamp-2">{m.og_title.trim() || title}</p><p className="text-xs text-gray-600 line-clamp-2">{m.og_description.trim() || description}</p></div>
            </div>
          </Card>
          <Card title="AI answer">
            {m.tldr_summary.trim() || m.faq_items.some((f) => f.question && f.answer) ? (
              <div className="text-sm space-y-2">
                {m.tldr_summary.trim() && <p>{m.tldr_summary.trim()}</p>}
                {m.faq_items.filter((f) => f.question && f.answer).slice(0, 1).map((f) => <p key={f.question} className="text-gray-300"><b>{f.question}</b><br />{f.answer}</p>)}
              </div>
            ) : <p className="text-sm text-gray-400">Nothing to quote yet. Add a short answer and a few questions.</p>}
          </Card>
          <Card title="Structured data preview">
            <pre className="text-[11px] bg-black/40 rounded-xl p-3 overflow-auto max-h-64 text-gray-300" aria-label="Structured data preview">{graph ? JSON.stringify(graph['@graph'].map((n: any) => n['@type']), null, 1) + '\n\n' + JSON.stringify(graph['@graph'].find((n: any) => String(n['@id']).endsWith('#webpage')) ?? {}, null, 1) : 'Could not be built.'}</pre>
          </Card>
        </aside>
      </div>
    </form>
  );
}
