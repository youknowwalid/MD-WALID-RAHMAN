import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import * as admin from '../../../lib/admin';
import { DiscoverySettings, FIXED_PAGES, PageMeta, auditPage, emptyMeta, normalizeMeta } from '../../../lib/discovery';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { friendlyError } from '../forms';
import PageEditor, { PageTarget } from './PageEditor';
import { Loading, ScoreBadge, Toaster } from './parts';

type Entry = PageTarget & { meta: PageMeta; hasRow: boolean };

/** Every page that can be edited, with its score. Click one to edit its search, social and AI settings. */
export default function Pages({ discovery, onToast }: { discovery: DiscoverySettings; onToast: Toaster }) {
  const { seoConfig } = useSiteConfig();
  const [data, setData] = useState<{ posts: any[]; projects: any[]; metas: Record<string, any>[]; authors: admin.AuthorRow[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [posts, projects, metas, authors] = await Promise.all([admin.listAll('blogPosts'), admin.listAll('projects'), admin.listPageMeta(), admin.listAuthors()]);
      setData({ posts, projects, metas, authors });
    } catch (err: any) { onToast('error', `Could not load: ${friendlyError(err.message)}`); setData({ posts: [], projects: [], metas: [], authors: [] }); }
  }, [onToast]);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    if (!data) return [];
    const byKey = new Map(data.metas.map((r) => [r.route_key as string, r]));
    const entry = (t: PageTarget): Entry => ({ ...t, meta: normalizeMeta(byKey.get(t.key)), hasRow: byKey.has(t.key) });
    const tmpl = (label: string) => (seoConfig.titleTemplate || '%s').replace('%s', label);
    return [
      { name: 'Main pages', items: FIXED_PAGES.map((p) => entry({
        key: p.key, label: p.label, path: p.path, kind: p.key === 'home' ? 'home' : 'page',
        fallbackTitle: p.key === 'home' ? seoConfig.defaultTitle : tmpl(p.label), fallbackDescription: seoConfig.defaultDescription, fallbackImage: seoConfig.ogImage, author: '',
      })) },
      { name: 'Articles', items: data.posts.filter((p) => p.slug).map((p) => entry({
        key: `blog:${p.id}`, label: p.title, path: `/blog/${p.slug}`, kind: 'blog',
        fallbackTitle: tmpl(p.socialTitle || p.title), fallbackDescription: p.socialDescription || p.excerpt || '', fallbackImage: p.socialImage || p.image || '', author: p.author || '',
      })) },
      { name: 'Projects', items: data.projects.filter((p) => p.slug).map((p) => entry({
        key: `project:${p.id}`, label: p.title, path: `/projects/${p.slug}`, kind: 'project',
        fallbackTitle: tmpl(p.socialTitle || p.title), fallbackDescription: p.socialDescription || p.summary || '', fallbackImage: p.socialImage || p.heroImage || p.image || '', author: '',
      })) },
    ];
  }, [data, seoConfig]);

  if (!data) return <Loading />;
  const current = groups.flatMap((g) => g.items).find((e) => e.key === open);
  if (current) {
    return <PageEditor key={current.key} target={current} initial={current.meta} hasRow={current.hasRow} authors={data.authors} discovery={discovery} onClose={() => setOpen(null)} onSaved={load} onToast={onToast} />;
  }
  return (
    <div className="space-y-8 max-w-4xl">
      <p className="text-sm text-gray-400">The score shows how well each page is set up for Google and for AI answers. A page with no custom settings still works. It just uses the automatic text.</p>
      {groups.map((g) => (
        <section key={g.name} aria-label={g.name}>
          <h2 className="text-xs uppercase tracking-widest text-accent mb-3">{g.name}</h2>
          <ul className="space-y-2">
            {g.items.map((e) => {
              const { score } = auditPage({ meta: e.meta ?? emptyMeta(), fallbackTitle: e.fallbackTitle, fallbackDescription: e.fallbackDescription, needsAuthor: e.kind === 'blog', hasDefaultShareImage: Boolean(e.fallbackImage) });
              return (
                <li key={e.key}>
                  <button type="button" onClick={() => setOpen(e.key)} className="w-full text-left bg-bg-card p-4 rounded-2xl border border-white/5 hover:border-accent/30 flex items-center gap-4">
                    <ScoreBadge score={score} />
                    <span className="min-w-0 flex-1"><span className="block font-bold truncate">{e.label}</span><span className="block text-xs text-gray-400 font-mono truncate">{e.path}{e.hasRow ? '' : ' · automatic'}{e.hasRow && !e.meta.robots_index ? ' · hidden from search' : ''}</span></span>
                    <Pencil className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
            {g.items.length === 0 && <li className="text-sm text-gray-500">Nothing here yet.</li>}
          </ul>
        </section>
      ))}
    </div>
  );
}
