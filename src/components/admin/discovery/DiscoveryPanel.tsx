import React, { useCallback, useEffect, useState } from 'react';
import { loadSettings } from '../../../lib/admin';
import { DiscoverySettings, normalizeDiscovery } from '../../../lib/discovery';
import { friendlyError } from '../forms';
import Authors from './Authors';
import BrandEntity from './BrandEntity';
import Crawlers from './Crawlers';
import LiveCheck from './LiveCheck';
import Pages from './Pages';
import Redirects from './Redirects';
import Verification from './Verification';
import { Loading, Toaster } from './parts';

const SECTIONS = [
  { id: 'pages', label: 'Pages' },
  { id: 'brand', label: 'Brand & AI' },
  { id: 'authors', label: 'Authors' },
  { id: 'redirects', label: 'Redirects' },
  { id: 'crawlers', label: 'Crawlers' },
  { id: 'verify', label: 'Verification' },
  { id: 'live', label: 'Live check' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

/** Search & AI Discovery: everything that tells Google and AI assistants who you are, from your own words. */
export default function DiscoveryPanel({ onToast }: { onToast: Toaster }) {
  const [section, setSection] = useState<SectionId>('pages');
  const [value, setValue] = useState<DiscoverySettings | null>(null);

  const load = useCallback(async () => {
    try { setValue(normalizeDiscovery((await loadSettings()).discovery)); }
    catch (err: any) { onToast('error', `Could not load: ${friendlyError(err.message)}`); setValue(normalizeDiscovery(null)); }
  }, [onToast]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <nav aria-label="Search and AI sections" className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" onClick={() => setSection(s.id)} aria-current={section === s.id ? 'page' : undefined}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap ${section === s.id ? 'bg-accent text-[#0d1117]' : 'border border-white/10 text-gray-300 hover:bg-white/5'}`}>{s.label}</button>
        ))}
      </nav>
      {!value ? <Loading /> : (
        <>
          {section === 'pages' && <Pages discovery={value} onToast={onToast} />}
          {section === 'brand' && <BrandEntity key={JSON.stringify(value.entity)} value={value} onSaved={load} onToast={onToast} />}
          {section === 'authors' && <Authors onToast={onToast} />}
          {section === 'redirects' && <Redirects onToast={onToast} />}
          {section === 'crawlers' && <Crawlers key={JSON.stringify([value.crawlers, value.extraDisallow])} value={value} onSaved={load} onToast={onToast} />}
          {section === 'verify' && <Verification key={JSON.stringify([value.verification, value.indexnow])} value={value} onSaved={load} onToast={onToast} />}
          {section === 'live' && <LiveCheck onToast={onToast} />}
        </>
      )}
    </div>
  );
}
