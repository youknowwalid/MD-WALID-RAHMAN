import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { patchSettings } from '../../../lib/admin';
import { DiscoverySettings, fromLines, toLines } from '../../../lib/discovery';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { AI_CRAWLERS, buildRobotsTxt } from '../../../../api/robots.js';
import { friendlyError } from '../forms';
import { AreaField, Card, SaveButton, Toaster } from './parts';

const WHO: Record<string, string> = {
  GPTBot: 'OpenAI: collects pages to train its models',
  'ChatGPT-User': 'ChatGPT: opens a page when a person asks it to',
  'OAI-SearchBot': 'ChatGPT search results',
  ClaudeBot: 'Anthropic: collects pages to train Claude',
  'Claude-Web': 'Claude: opens pages for people',
  PerplexityBot: 'Perplexity search answers',
  'Google-Extended': 'Google: use of your pages for Gemini (does not affect Google Search)',
  'Applebot-Extended': 'Apple: use of your pages for Apple AI',
  CCBot: 'Common Crawl: open dataset many AI models learn from',
};

/** Which AI crawlers may read the site, and which private addresses stay closed. Saved under site_settings.discovery. */
export default function Crawlers({ value, onSaved, onToast }: { value: DiscoverySettings; onSaved: () => Promise<void>; onToast: Toaster } & React.Attributes) {
  const { seoConfig } = useSiteConfig();
  const [crawlers, setCrawlers] = useState(value.crawlers);
  const [extra, setExtra] = useState(toLines(value.extraDisallow));
  const [saving, setSaving] = useState(false);

  const toggle = (bot: string) => setCrawlers((c) => {
    const next = { ...c };
    if (next[bot] === 'block') delete next[bot]; else next[bot] = 'block';
    return next;
  });
  const extraList = fromLines(extra);
  const preview = buildRobotsTxt({ seo: { siteUrl: seoConfig.siteUrl, robotsIndex: seoConfig.robotsIndex }, discovery: { crawlers, extraDisallow: extraList } });

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const bad = extraList.find((p) => !/^\/[^\s#]*$/.test(p) || p === '/');
    if (bad) return onToast('error', `"${bad}" is not allowed here. Start with / and use a section such as /private/ (the whole site cannot be blocked from here).`);
    setSaving(true);
    try {
      await patchSettings('discovery', { crawlers, extraDisallow: extraList });
      await onSaved();
      onToast('success', 'Crawler rules saved. /robots.txt updates within a few minutes.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6 max-w-4xl">
      {!seoConfig.robotsIndex && (
        <p role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm p-4">
          Search engines are currently told to stay away from the whole site (SEO Settings &gt; “Allow search engines to list this site” is off). The rules below do not apply until you turn that on.
        </p>
      )}
      <Card title="AI crawlers" icon={<Bot className="text-accent w-6 h-6" aria-hidden="true" />}
        hint="Allowed is the default, and it is what lets AI assistants know your work and mention it. Blocking one stops that crawler from reading your pages. It cannot hide anything already copied.">
        <ul className="divide-y divide-white/5">
          {AI_CRAWLERS.map((bot) => {
            const blocked = crawlers[bot] === 'block';
            return (
              <li key={bot} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm">{bot}</p>
                  <p className="text-xs text-gray-400">{WHO[bot] || ''}</p>
                </div>
                <button type="button" role="switch" aria-checked={!blocked} aria-label={`${bot}: ${blocked ? 'blocked' : 'allowed'}`} onClick={() => toggle(bot)}
                  className={`shrink-0 min-w-24 rounded-full px-4 py-2 text-sm font-black ${blocked ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {blocked ? 'Blocked' : 'Allowed'}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card title="Extra private sections" hint="Always closed already: /admin, /thank-you, /checkout/ and /api/. Add more here if you need them.">
        <AreaField id="robots-extra" label="Addresses to keep out of search (one per line)" value={extra} onChange={setExtra} rows={3} mono hint="Example: /private/" />
      </Card>
      <Card title="Your robots.txt, as it will be served">
        <pre className="text-xs bg-black/40 rounded-xl p-4 overflow-x-auto max-h-72 text-gray-300" aria-label="robots.txt preview">{preview}</pre>
      </Card>
      <div className="flex justify-end"><SaveButton saving={saving} label="Save crawler rules" /></div>
    </form>
  );
}
