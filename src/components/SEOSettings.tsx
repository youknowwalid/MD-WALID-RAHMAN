import React, { useEffect, useState } from 'react';
import { Save, Loader2, Globe, Image as ImageIcon } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { SeoConfig } from '../lib/defaults';
import { patchSettings } from '../lib/admin';
import { ImageField, inputCls, labelCls } from './admin/fields';
import { friendlyError } from './admin/forms';

export function SEOSettings({ onToast }: { onToast: (type: 'success' | 'error', message: string) => void }) {
  const { refresh } = useSiteConfig();
  const [f, setF] = useState<SeoConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { refresh().then(({ seoConfig }) => setF(seoConfig)); }, [refresh]);

  if (!f) return <div className="flex items-center justify-center p-20" role="status" aria-label="Loading"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  const set = <K extends keyof SeoConfig>(k: K) => (v: SeoConfig[K]) => setF({ ...f, [k]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patchSettings('seo', { ...f, siteUrl: f.siteUrl.trim().replace(/\/+$/, '') });
      await refresh();
      onToast('success', 'SEO settings saved.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally {
      setSaving(false);
    }
  };

  const preview = f.defaultTitle;
  return (
    <form onSubmit={save} className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center gap-4 bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5">
        <p className="text-gray-300 text-sm">Control how your site appears on Google and when shared on social media.</p>
        <button type="submit" disabled={saving} className="bg-accent text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60 shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save
        </button>
      </div>

      <section className="bg-bg-card p-6 sm:p-10 rounded-3xl border border-white/5 space-y-6">
        <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3"><Globe className="text-accent w-6 h-6" aria-hidden="true" /> Search results (Google)</h2>
        <div className="rounded-xl bg-white p-4 text-left" aria-label="Google result preview">
          <div className="text-[#1a0dab] text-xl truncate">{preview}</div>
          <div className="text-[#006621] text-sm truncate">{f.siteUrl}</div>
          <div className="text-[#545454] text-sm line-clamp-2">{f.defaultDescription}</div>
        </div>
        <div>
          <label htmlFor="seo-title" className={labelCls}>Home page title</label>
          <input id="seo-title" value={f.defaultTitle} onChange={(e) => set('defaultTitle')(e.target.value)} maxLength={70} className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">{f.defaultTitle.length}/60 characters is ideal.</p>
        </div>
        <div>
          <label htmlFor="seo-template" className={labelCls}>Title for other pages (%s becomes the page name)</label>
          <input id="seo-template" value={f.titleTemplate} onChange={(e) => set('titleTemplate')(e.target.value)} placeholder="%s | Walid Rahman" className={inputCls} />
        </div>
        <div>
          <label htmlFor="seo-desc" className={labelCls}>Description</label>
          <textarea id="seo-desc" rows={3} maxLength={300} value={f.defaultDescription} onChange={(e) => set('defaultDescription')(e.target.value)} className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">{f.defaultDescription.length}/160 characters is ideal.</p>
        </div>
        <div>
          <label htmlFor="seo-keywords" className={labelCls}>Keywords (comma separated)</label>
          <input id="seo-keywords" value={f.keywords} onChange={(e) => set('keywords')(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="seo-url" className={labelCls}>Website address</label>
          <input id="seo-url" value={f.siteUrl} onChange={(e) => set('siteUrl')(e.target.value)} className={inputCls} />
        </div>
        <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
          <input type="checkbox" checked={f.robotsIndex} onChange={(e) => set('robotsIndex')(e.target.checked)} className="w-5 h-5 accent-accent" />
          Allow search engines to list this site
        </label>
      </section>

      <section className="bg-bg-card p-6 sm:p-10 rounded-3xl border border-white/5 space-y-6">
        <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3"><ImageIcon className="text-accent w-6 h-6" aria-hidden="true" /> Social sharing</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="seo-site" className={labelCls}>Site name</label>
            <input id="seo-site" value={f.siteName} onChange={(e) => set('siteName')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="seo-tw" className={labelCls}>Twitter / X handle (optional)</label>
            <input id="seo-tw" value={f.twitterHandle} onChange={(e) => set('twitterHandle')(e.target.value)} placeholder="@yourhandle" className={inputCls} />
          </div>
        </div>
        <ImageField label="Default share image (leave empty to use the built-in one)" value={f.ogImage} onChange={set('ogImage')} maxSide={1200} hint="Recommended size: 1200 × 630 pixels." />
      </section>
    </form>
  );
}
