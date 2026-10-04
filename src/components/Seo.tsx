import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { safeUrl } from '../lib/text';

interface SeoProps {
  /** Page title. Omit on the home page to use the site's default title. */
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const absolute = (url: string, base: string) => {
  const u = safeUrl(url);
  if (!u) return '';
  return u.startsWith('/') ? base + u : u;
};

/** Sets the title, description, canonical URL, social-share tags and structured data for the current page. */
export default function Seo({ title, description, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const { seoConfig: seo, config } = useSiteConfig();
  const { pathname } = useLocation();

  const base = seo.siteUrl.replace(/\/+$/, '');
  const fullTitle = title
    ? (seo.titleTemplate.includes('%s') ? seo.titleTemplate.replace('%s', title) : `${title} | ${seo.siteName}`)
    : seo.defaultTitle;
  const desc = (description || seo.defaultDescription).replace(/\s+/g, ' ').trim().slice(0, 300);
  const img = absolute(image || seo.ogImage, base) || `${base}/og-image.png`;
  const url = base + (pathname === '/' ? '/' : pathname.replace(/\/+$/, ''));
  const robots = noindex || !seo.robotsIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const ld = JSON.stringify(jsonLd);
  const socials = JSON.stringify(config.socialLinks.map((s) => s.url));

  useEffect(() => {
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'keywords', seo.keywords);
    setMeta('name', 'robots', robots);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', seo.siteName);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);
    setMeta('name', 'twitter:site', seo.twitterHandle);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    document.getElementById('seo-jsonld-schema')?.remove();
    const data = ld
      ? JSON.parse(ld)
      : pathname === '/'
        ? {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Walid Rahman',
            jobTitle: 'Brand Developer',
            description: desc,
            url: base + '/',
            image: img,
            ...(JSON.parse(socials).length ? { sameAs: JSON.parse(socials) } : {}),
          }
        : null;
    if (data) {
      const script = document.createElement('script');
      script.id = 'seo-jsonld-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }, [fullTitle, desc, img, url, robots, type, ld, socials, pathname, seo.keywords, seo.siteName, seo.twitterHandle]);

  return null;
}
