import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { patchSettings } from '../../../lib/admin';
import { DiscoverySettings, ENTITY_TYPES, fromLines, toLines } from '../../../lib/discovery';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { buildGraph } from '../../../../api/_graph.js';
import { ImageField, inputCls, labelCls } from '../fields';
import { friendlyError } from '../forms';
import { AreaField, Card, SaveButton, TextField, Toaster } from './parts';

/** Who the brand is, in the words an AI or a search engine will repeat. Saved under site_settings.discovery.entity. */
export default function BrandEntity({ value, onSaved, onToast }: { value: DiscoverySettings; onSaved: () => Promise<void>; onToast: Toaster }) {
  const { config, seoConfig } = useSiteConfig();
  const [e, setE] = useState(value.entity);
  const [sameAs, setSameAs] = useState(toLines(value.entity.sameAs));
  const [knows, setKnows] = useState(toLines(value.entity.knowsAbout));
  const [area, setArea] = useState(toLines(value.entity.areaServed));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof e>(k: K) => (v: (typeof e)[K]) => setE((x) => ({ ...x, [k]: v }));

  const draft = { ...e, sameAs: fromLines(sameAs), knowsAbout: fromLines(knows), areaServed: fromLines(area) };
  const site = seoConfig.siteUrl.replace(/\/+$/, '');
  const preview = buildGraph({
    site, seo: seoConfig, global: config, discovery: { entity: draft }, page: {}, meta: null, author: null,
    url: `${site}/`, path: '/', kind: 'home', description: seoConfig.defaultDescription, imageUrl: '', language: draft.language || 'en',
  })['@graph'][0];

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const bad = draft.sameAs.find((u) => !/^https?:\/\//i.test(u));
    if (bad) return onToast('error', `"${bad}" is not a web address. Profile links must start with https://.`);
    if (draft.foundingDate && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(draft.foundingDate)) return onToast('error', 'Use a year, or a date like 2018-04-12, for the founding date.');
    setSaving(true);
    try {
      await patchSettings('discovery', { entity: draft });
      await onSaved();
      onToast('success', 'Brand details saved. Search engines pick them up within a few minutes.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6 max-w-4xl">
      <Card title="Brand identity for search and AI" icon={<Fingerprint className="text-accent w-6 h-6" aria-hidden="true" />}
        hint="This is how Google and AI assistants learn who is behind the site. Only fill in what is true. Anything left empty is simply left out.">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ent-type" className={labelCls}>The site belongs to</label>
            <select id="ent-type" value={e.type} onChange={(ev) => set('type')(ev.target.value as typeof e.type)} className={inputCls}>
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{{ Organization: 'An organization or brand', Person: 'A person', ProfessionalService: 'A professional service', LocalBusiness: 'A local business' }[t]}</option>)}
            </select>
          </div>
          <TextField id="ent-name" label="Official name (blank = the site name)" value={e.legalName} onChange={set('legalName')} />
          <TextField id="ent-alt" label="Other name people know it by" value={e.alternateName} onChange={set('alternateName')} />
          <TextField id="ent-founded" label="Founded (year or date)" value={e.foundingDate} onChange={set('foundingDate')} placeholder="2018" />
          <TextField id="ent-lang" label="Main language of the site" value={e.language} onChange={set('language')} placeholder="en" hint="A language code such as en or bn." />
        </div>
        <ImageField label="Logo (blank = the header logo)" value={e.logo} onChange={set('logo')} maxSide={600} />
        <AreaField id="ent-same" label="Your profiles elsewhere (one link per line)" value={sameAs} onChange={setSameAs} rows={4} mono hint="LinkedIn, Facebook page, YouTube, Wikipedia: pages that prove these are really you. Your social links from Settings are added automatically." />
        <AreaField id="ent-knows" label="What you are known for (one topic per line)" value={knows} onChange={setKnows} rows={4} hint="Short topics, in your own words." />
        <AreaField id="ent-area" label="Places you serve (one per line, optional)" value={area} onChange={setArea} rows={2} />
      </Card>
      <Card title="What search engines will read" hint="Built from the fields above plus your Settings. Nothing here is typed into the website's code.">
        <pre className="text-xs bg-black/40 rounded-xl p-4 overflow-x-auto max-h-72 text-gray-300" aria-label="Structured data preview">{JSON.stringify(preview, null, 2)}</pre>
      </Card>
      <div className="flex justify-end"><SaveButton saving={saving} label="Save brand details" /></div>
    </form>
  );
}
