import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Helper to check if a value is a base64 string or asset url
const preloadAsset = (url: string) => {
  if (!url) return;
  // If it is a base64 string or already preloaded, we don't need link preload, 
  // but prefetching it keeps a browser cache reference.
  const img = new Image();
  img.src = url;

  // Also add regular preload link for standard URLs
  if (url.startsWith('http')) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  }
};

// Apply CSS Variables instantly to dynamic document node
export const applyThemeVariables = (primaryColor: string, secondaryColor: string) => {
  const root = document.documentElement;
  const primary = primaryColor || '#f45901';
  const secondary = secondaryColor || '#00c6ff';
  
  root.style.setProperty('--color-accent', primary);
  root.style.setProperty('--color-accent-secondary', secondary);
  
  // Inject a style block for smooth changes if not already present
  let transitionStyle = document.getElementById('smooth-color-transitions');
  if (!transitionStyle) {
    transitionStyle = document.createElement('style');
    transitionStyle.id = 'smooth-color-transitions';
    transitionStyle.innerHTML = `
      body, header, footer, button, a, div, span, img, svg {
        transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
      }
    `;
    document.head.appendChild(transitionStyle);
  }
};

// Apply SEO elements synchronously
export const applySEOElements = (seo: any) => {
  if (!seo) return;
  if (seo.metaTitle) {
    document.title = seo.metaTitle;
  }
  
  const setMetaContent = (name: string, content: string, isProperty = false) => {
    if (!content) return;
    const selector = isProperty ? `meta[property='${name}']` : `meta[name='${name}']`;
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      if (isProperty) {
        element.setAttribute('property', name);
      } else {
        element.setAttribute('name', name);
      }
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  setMetaContent('description', seo.metaDescription || '');
  setMetaContent('keywords', seo.focusKeywords || '');
  setMetaContent('robots', seo.robotsIndex ? 'index, follow' : 'noindex, nofollow');
  
  // OpenGraph tags
  setMetaContent('og:title', seo.ogTitle || seo.metaTitle, true);
  setMetaContent('og:description', seo.ogDescription || seo.metaDescription, true);
  setMetaContent('og:image', seo.ogImageUrl, true);
  
  // Twitter tags
  setMetaContent('twitter:card', seo.twitterCardType || 'summary_large_image');
  setMetaContent('twitter:title', seo.twitterTitle || seo.metaTitle);
  setMetaContent('twitter:description', seo.twitterDescription || seo.metaDescription);
  setMetaContent('twitter:image', seo.twitterImageUrl);
};

// Initialize settings synchronously from local cache, then execute fetch
export async function initializeAppSettings(): Promise<void> {
  // 1. Synchronously try to load cached copy from LocalStorage for 0ms render latency.
  const cachedGlobal = localStorage.getItem('site_config_global');
  const cachedSeo = localStorage.getItem('site_config_seo');
  const cachedHero = localStorage.getItem('site_config_hero');

  if (cachedGlobal) {
    try {
      const global = JSON.parse(cachedGlobal);
      applyThemeVariables(global.primaryColor, global.secondaryColor);
      if (global.favicon) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
        link.rel = 'icon';
        link.href = global.favicon;
        document.head.appendChild(link);
      }
      if (global.siteLogo) {
        preloadAsset(global.siteLogo);
      }
    } catch (e) {
      console.warn("Error parsing cached global configs:", e);
    }
  } else {
    // If absolutely no colors exist, let's write baseline defaults temporarily so we don't flash
    applyThemeVariables('#f45901', '#00c6ff');
  }

  if (cachedSeo) {
    try {
      applySEOElements(JSON.parse(cachedSeo));
    } catch (e) {
      console.warn("Error parsing cached SEO settings:", e);
    }
  }

  if (cachedHero) {
    try {
      const hero = JSON.parse(cachedHero);
      if (hero.heroImage) preloadAsset(hero.heroImage);
      if (hero.resumeImage) preloadAsset(hero.resumeImage);
    } catch (e) {
      console.warn("Error parsing cached Hero settings:", e);
    }
  }

  // Preload primary fonts to make them native-fast
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
  fontPreload.crossOrigin = 'anonymous';
  document.head.appendChild(fontPreload);

  // If we already have cached configs, we resolve right away so the user goes straight to 
  // the app with 0ms interruption. We can sync fresh data in the background inside context.
  if (cachedGlobal && cachedSeo && cachedHero) {
    // Trigger background sync silently to update cache if necessary
    triggerSilentBackgroundSync();
    return;
  }

  // Otherwise, if first initial paint (no cache matches), block for network fetch to prevent default flash
  try {
    const [globalSnap, seoSnap, heroSnap] = await Promise.all([
      getDoc(doc(db, 'siteConfig', 'global')),
      getDoc(doc(db, 'siteConfig', 'seo')),
      getDoc(doc(db, 'siteConfig', 'hero'))
    ]);

    if (globalSnap.exists()) {
      const global = globalSnap.data();
      localStorage.setItem('site_config_global', JSON.stringify(global));
      applyThemeVariables(global.primaryColor, global.secondaryColor);
      if (global.siteLogo) preloadAsset(global.siteLogo);
    }
    if (seoSnap.exists()) {
      const seo = seoSnap.data();
      localStorage.setItem('site_config_seo', JSON.stringify(seo));
      applySEOElements(seo);
    }
    if (heroSnap.exists()) {
      const hero = heroSnap.data();
      localStorage.setItem('site_config_hero', JSON.stringify(hero));
      if (hero.heroImage) preloadAsset(hero.heroImage);
      if (hero.resumeImage) preloadAsset(hero.resumeImage);
    }
  } catch (err) {
    console.error("Critical fail loading pre-flight admin config settings:", err);
  }
}

// Quietly fetch data in the background and rewrite clean local cache
const triggerSilentBackgroundSync = async () => {
  try {
    const [globalSnap, seoSnap, heroSnap] = await Promise.all([
      getDoc(doc(db, 'siteConfig', 'global')),
      getDoc(doc(db, 'siteConfig', 'seo')),
      getDoc(doc(db, 'siteConfig', 'hero'))
    ]);

    if (globalSnap.exists()) {
      localStorage.setItem('site_config_global', JSON.stringify(globalSnap.data()));
    }
    if (seoSnap.exists()) {
      localStorage.setItem('site_config_seo', JSON.stringify(seoSnap.data()));
    }
    if (heroSnap.exists()) {
      localStorage.setItem('site_config_hero', JSON.stringify(heroSnap.data()));
    }
  } catch (err) {
    console.warn("Background admin presets cache sync failed:", err);
  }
};
