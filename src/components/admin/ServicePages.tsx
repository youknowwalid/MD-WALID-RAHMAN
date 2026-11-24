import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import type { ServicePage } from '../../lib/defaults';
import { patchSettings } from '../../lib/admin';
import { SLUG_RE, cleanServices, emptyService, slugify } from '../../lib/services';
import { ImageField, inputCls, labelCls } from './fields';
import { friendlyError } from './forms';

interface Props { onToast: (type: 'success' | 'error', message: string) => void }

const newId = () => crypto.randomUUID();

/** The services that have their own page (/services/...): text, picture, what is included, steps. Search settings live under Search & AI. */
export default function ServicePages({ onToast }: Props) {
  const { config, refresh } = useSiteConfig();
  const [rows, setRows] = useState<ServicePage[] | null>(null);
  const [heading, setHeading] = useState('');
  const [intro, setIntro] = useState('');
  const [saving, setSaving] = useState(false);
  // Which slugs were typed by hand: those stop following the name.
  const [custom, setCustom] = useState<Set<string>>(new Set());

  useEffect(() => {
    refresh().then(({ config: c }) => {
      const saved = cleanServices(c.servicePages, { includeHidden: true });
      setRows(saved);
      setCustom(new Set(saved.map((s) => s.id)));
      setHeading(c.servicesHeading || '');
      setIntro(c.servicesIntro || '');
    });
  }, [refresh]);

  const chips = useMemo(() => (config.capabilityGroups || []).flatMap((g) => g.items || []).map((x) => x.trim()).filter(Boolean), [config.capabilityGroups]);

  if (!rows) return <div className="flex justify-center p-20" role="status" aria-label="Loading"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  const patch = (i: number, p: Partial<ServicePage>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const rename = (i: number, name: string) => {
    const r = rows[i];
    patch(i, custom.has(r.id) ? { name } : { name, slug: slugify(name) });
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const [i, r] of rows.entries()) {
      if (!r.name.trim()) return onToast('error', `Please type a name for service ${i + 1}, or delete the empty one.`);
      if (!SLUG_RE.test(r.slug.trim())) return onToast('error', `Service ${i + 1}: the page address can only use small letters, numbers and dashes (for example web-development).`);
    }
    const slugs = rows.map((r) => r.slug.trim());
    if (new Set(slugs).size !== slugs.length) return onToast('error', 'Two services have the same page address. Please make each one different.');
    setSaving(true);
    try {
      await patchSettings('global', {
        servicesHeading: heading.trim(),
        servicesIntro: intro.trim(),
        servicePages: rows.map((r) => ({
          id: r.id, slug: r.slug.trim(), name: r.name.trim(), chip: r.chip.trim(), summary: r.summary.trim(), headline: r.headline.trim(),
          intro: r.intro.trim(), image: r.image.trim(), included: r.included.map((x) => x.trim()).filter(Boolean),
          steps: r.steps.map((s) => ({ title: s.title.trim(), text: s.text.trim() })).filter((s) => s.title && s.text),
          ctaTitle: r.ctaTitle.trim(), ctaButton: r.ctaButton.trim(), ctaUrl: r.ctaUrl.trim(), hidden: r.hidden,
        })),
      });
      await refresh();
      onToast('success', 'Services saved and published.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message || 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="sticky top-0 z-20 flex justify-between items-center gap-4 bg-bg-card/95 backdrop-blur p-4 sm:p-6 rounded-2xl border border-white/5">
        <p className="text-sm text-gray-300">Each service gets its own page. Add its page title, summary, short answer and questions under Search &amp; AI &gt; Pages &gt; Services after saving.</p>
        <button type="submit" disabled={saving} className="shrink-0 bg-accent text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save &amp; Publish
        </button>
      </div>

      <div className="bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4">
        <h2 className="font-black">The Services page</h2>
        <div>
          <label htmlFor="svc-heading" className={labelCls}>Heading</label>
          <input id="svc-heading" value={heading} onChange={(e) => setHeading(e.target.value)} className={inputCls} maxLength={80} placeholder="Services" />
        </div>
        <div>
          <label htmlFor="svc-intro" className={labelCls}>Short introduction (plain text, a blank line starts a new paragraph)</label>
          <textarea id="svc-intro" rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} className={inputCls} maxLength={1000} />
        </div>
      </div>

      <datalist id="svc-chips">{chips.map((c) => <option key={c} value={c} />)}</datalist>

      <ul className="space-y-4">
        {rows.map((row, i) => (
          <li key={row.id} className="bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-gray-300">Service {i + 1}{row.name ? `: ${row.name}` : ''}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move service ${i + 1} up`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move service ${i + 1} down`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => { if (window.confirm('Delete this service page? Its address will stop working.')) setRows(rows.filter((_, j) => j !== i)); }} aria-label={`Delete service ${i + 1}`} className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`svc-name-${i}`} className={labelCls}>Service name (shown on cards)</label>
                <input id={`svc-name-${i}`} value={row.name} onChange={(e) => rename(i, e.target.value)} className={inputCls} maxLength={80} placeholder="Web development" />
              </div>
              <div>
                <label htmlFor={`svc-slug-${i}`} className={labelCls}>Page address</label>
                <input id={`svc-slug-${i}`} value={row.slug} onChange={(e) => { setCustom(new Set(custom).add(row.id)); patch(i, { slug: e.target.value.toLowerCase() }); }} className={inputCls} maxLength={60} placeholder="web-development" />
                <p className="mt-1 text-xs text-gray-400">/services/{row.slug || '…'}. Do not change it after the page is live.</p>
              </div>
            </div>

            <div>
              <label htmlFor={`svc-headline-${i}`} className={labelCls}>Big headline on the page</label>
              <input id={`svc-headline-${i}`} value={row.headline} onChange={(e) => patch(i, { headline: e.target.value })} className={inputCls} maxLength={120} />
            </div>
            <div>
              <label htmlFor={`svc-summary-${i}`} className={labelCls}>One line for the cards and sharing</label>
              <input id={`svc-summary-${i}`} value={row.summary} onChange={(e) => patch(i, { summary: e.target.value })} className={inputCls} maxLength={200} />
            </div>
            <div>
              <label htmlFor={`svc-intro-${i}`} className={labelCls}>Introduction (plain text, a blank line starts a new paragraph)</label>
              <textarea id={`svc-intro-${i}`} rows={5} value={row.intro} onChange={(e) => patch(i, { intro: e.target.value })} className={inputCls} maxLength={3000} />
            </div>

            <ImageField label="Service picture (landscape, 1600 x 1000)" value={row.image} onChange={(url) => patch(i, { image: url })} hint="Shown on the page and the Services cards. It is also the picture used when the page is shared." />

            <div>
              <label htmlFor={`svc-chip-${i}`} className={labelCls}>Matching chip on the home page (that chip then links to this page)</label>
              <input id={`svc-chip-${i}`} list="svc-chips" value={row.chip} onChange={(e) => patch(i, { chip: e.target.value })} className={inputCls} maxLength={80} />
            </div>

            <div>
              <label htmlFor={`svc-included-${i}`} className={labelCls}>What is included (one line per item)</label>
              <textarea id={`svc-included-${i}`} rows={5} value={row.included.join('\n')} onChange={(e) => patch(i, { included: e.target.value.split('\n') })} className={inputCls} />
            </div>

            <fieldset className="space-y-3">
              <legend className={labelCls}>How it works (steps)</legend>
              {row.steps.map((st, k) => (
                <div key={k} className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-start">
                  <input aria-label={`Step ${k + 1} title`} value={st.title} onChange={(e) => patch(i, { steps: row.steps.map((x, n) => (n === k ? { ...x, title: e.target.value } : x)) })} className={inputCls} maxLength={60} placeholder="Title" />
                  <input aria-label={`Step ${k + 1} text`} value={st.text} onChange={(e) => patch(i, { steps: row.steps.map((x, n) => (n === k ? { ...x, text: e.target.value } : x)) })} className={inputCls} maxLength={240} placeholder="One or two short sentences" />
                  <button type="button" onClick={() => patch(i, { steps: row.steps.filter((_, n) => n !== k) })} aria-label={`Delete step ${k + 1}`} className="p-3 rounded-xl border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </div>
              ))}
              {row.steps.length < 8 && (
                <button type="button" onClick={() => patch(i, { steps: [...row.steps, { title: '', text: '' }] })} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-4 py-2.5 rounded-xl text-sm"><Plus className="w-4 h-4" aria-hidden="true" />Add a step</button>
              )}
            </fieldset>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor={`svc-cta-title-${i}`} className={labelCls}>Bottom bar text (leave empty to hide it)</label>
                <input id={`svc-cta-title-${i}`} value={row.ctaTitle} onChange={(e) => patch(i, { ctaTitle: e.target.value })} className={inputCls} maxLength={120} />
              </div>
              <div>
                <label htmlFor={`svc-cta-btn-${i}`} className={labelCls}>Button text</label>
                <input id={`svc-cta-btn-${i}`} value={row.ctaButton} onChange={(e) => patch(i, { ctaButton: e.target.value })} className={inputCls} maxLength={40} placeholder="Get in touch" />
              </div>
              <div>
                <label htmlFor={`svc-cta-url-${i}`} className={labelCls}>Button link (empty = your main contact button)</label>
                <input id={`svc-cta-url-${i}`} value={row.ctaUrl} onChange={(e) => patch(i, { ctaUrl: e.target.value })} className={inputCls} maxLength={300} placeholder="/#contact" />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={row.hidden} onChange={(e) => patch(i, { hidden: e.target.checked })} className="h-5 w-5 accent-[#c3ed3a]" />
              Hide this page for now (visitors and search engines will not see it)
            </label>
          </li>
        ))}
      </ul>

      {rows.length < 12 && (
        <button type="button" onClick={() => { const s = { ...emptyService(), id: newId() }; setRows([...rows, s]); }} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" aria-hidden="true" />Add a service</button>
      )}
    </form>
  );
}
