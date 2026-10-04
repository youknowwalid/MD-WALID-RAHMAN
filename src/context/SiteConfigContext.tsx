import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSettings } from '../lib/api';
import {
  DEFAULT_CONFIG, DEFAULT_HERO, DEFAULT_SEO, HeroConfig, SeoConfig, SiteConfig,
} from '../lib/defaults';

export type { SiteConfig, SeoConfig, HeroConfig } from '../lib/defaults';

interface SiteConfigContextType {
  config: SiteConfig;
  hero: HeroConfig;
  seoConfig: SeoConfig;
  loading: boolean;
  /** Re-reads settings from the database (used after the admin saves). */
  refresh: () => Promise<{ config: SiteConfig; hero: HeroConfig; seoConfig: SeoConfig }>;
}

const CACHE_KEY = 'site_settings_cache_v2';

type Raw = { global?: any; hero?: any; seo?: any };

/** Merge saved values over defaults, ignoring empty strings so a blank field falls back to the default. */
function merge<T extends object>(defaults: T, saved: any, allowEmpty: (keyof T)[] = []): T {
  const out: any = { ...defaults };
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = saved[key];
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '' && !allowEmpty.includes(key)) continue;
      if (Array.isArray(defaults[key]) && !Array.isArray(v)) continue;
      out[key] = v;
    }
  }
  return out;
}

const GLOBAL_ALLOW_EMPTY: (keyof SiteConfig)[] = [
  'siteLogo', 'footerLogo', 'favicon', 'footerPortrait', 'copyrightText', 'aboutVideoUrl', 'globalCtaUrl',
  'officeAddress', 'contactEmail', 'officePhone', 'aboutText',
];
const HERO_ALLOW_EMPTY: (keyof HeroConfig)[] = ['heroImage', 'cvUrl', 'resumeImage'];
const SEO_ALLOW_EMPTY: (keyof SeoConfig)[] = ['ogImage', 'twitterHandle', 'titleTemplate'];

const build = (raw: Raw) => ({
  config: merge(DEFAULT_CONFIG, raw.global, GLOBAL_ALLOW_EMPTY),
  hero: merge(DEFAULT_HERO, raw.hero, HERO_ALLOW_EMPTY),
  seoConfig: merge(DEFAULT_SEO, raw.seo, SEO_ALLOW_EMPTY),
});

function readCache(): Raw {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* storage unavailable */ }
  return {};
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [raw, setRaw] = useState<Raw>(readCache);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const fresh = await fetchSettings();
    if (fresh) {
      setRaw(fresh);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
    }
    setLoading(false);
    return build(fresh ?? readCache());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const { config, hero, seoConfig } = useMemo(() => build(raw), [raw]);

  // Brand colours + favicon
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', config.primaryColor);
    root.style.setProperty('--color-accent-secondary', config.secondaryColor);
    try { localStorage.setItem('brand_colors', JSON.stringify({ p: config.primaryColor, s: config.secondaryColor })); } catch { /* ignore */ }
  }, [config.primaryColor, config.secondaryColor]);

  useEffect(() => {
    if (!config.favicon) return;
    document.querySelectorAll("link[rel~='icon']").forEach((l) => l.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = config.favicon;
    document.head.appendChild(link);
  }, [config.favicon]);

  return (
    <SiteConfigContext.Provider value={{ config, hero, seoConfig, loading, refresh }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  return context;
};
