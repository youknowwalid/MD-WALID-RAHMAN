import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { fetchSettings } from '../lib/api';
import { backendConfigured } from '../lib/config';
import { applyAccent } from '../lib/gradient';
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
  'officeAddress', 'contactEmail', 'officePhone', 'aboutText', 'gradientVia',
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

/** How long a first-time visitor waits for the saved settings before the page shows the built-in ones. */
const FIRST_VISIT_WAIT_MS = 2500;

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [raw, setRaw] = useState<Raw>(readCache);
  const [loading, setLoading] = useState(true);
  // A returning visitor paints from the saved copy straight away. A first-time visitor has nothing saved,
  // so the page waits (a blank dark screen, matching the site background) for the real settings instead of
  // flashing the built-in defaults (old colours/texts) and then swapping them.
  const [ready, setReady] = useState(() => !backendConfigured || Object.keys(raw).length > 0);

  const refresh = useCallback(async () => {
    const fresh = await fetchSettings();
    if (fresh) {
      setRaw(fresh);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
    }
    setLoading(false);
    setReady(true);
    return build(fresh ?? readCache());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setReady(true), FIRST_VISIT_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [ready]);

  const { config, hero, seoConfig } = useMemo(() => build(raw), [raw]);

  // Brand colours (solid or gradient) + favicon. A layout effect, so the colours are set before the browser paints.
  useLayoutEffect(() => {
    applyAccent(config, config.secondaryColor);
  }, [config.accentMode, config.primaryColor, config.secondaryColor, config.gradientFrom, config.gradientVia, config.gradientTo, config.gradientAngle]);

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
      {ready ? children : null}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  return context;
};
