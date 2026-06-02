import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface HeaderLink {
  label: string;
  url: string;
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteConfig {
  siteTitle: string;
  siteLogo: string;
  favicon: string;
  headerLinks: HeaderLink[];
  footerColumns: FooterColumn[];
  socialLinks: SocialLink[];
  copyrightText: string;
  footerPortrait?: string;
  officeAddress?: string;
  contactEmail?: string;
  officePhone?: string;
  primaryColor?: string;
  secondaryColor?: string;
  brandTagline?: string;
  globalCtaText?: string;
  globalCtaUrl?: string;
  termsOfService?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  sitemapUrl: string;
  focusKeywords: string;

  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogType: string;
  ogSiteName: string;
  ogLocale: string;

  twitterCardType: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  twitterHandle: string;

  linkedinHeadline: string;
  linkedinSnippet: string;
  linkedinImageUrl: string;

  facebookPostTitle: string;
  facebookSubtitleSnippet: string;
  facebookSharedImageCover: string;
}

interface SiteConfigContextType {
  config: SiteConfig;
  updateConfig: (newConfig: Partial<SiteConfig>) => Promise<void>;
  seoConfig: SeoConfig;
  updateSeoConfig: (newSeo: Partial<SeoConfig>) => Promise<void>;
  loading: boolean;
}

const DEFAULT_SEO_CONFIG: SeoConfig = {
  metaTitle: 'youknowwalid | Portfolio & Brand Developer',
  metaDescription: 'Brand Developer and Product Designer crafting custom premium digital identity and custom high performance software.',
  canonicalUrl: 'https://walidrahman.com',
  robotsIndex: true,
  sitemapUrl: 'https://walidrahman.com/sitemap.xml',
  focusKeywords: 'walid, youknowwalid, swapnil, portfolio, brand, designer, web',
  ogTitle: 'youknowwalid | Portfolio',
  ogDescription: 'Brand Developer and Product Designer crafting custom premium digital identity and software.',
  ogImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
  ogType: 'website',
  ogSiteName: 'youknowwalid',
  ogLocale: 'en_US',
  twitterCardType: 'summary_large_image',
  twitterTitle: 'youknowwalid | Portfolio',
  twitterDescription: 'Brand Developer and Product Designer crafting custom premium digital identity and software.',
  twitterImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
  twitterHandle: '@youknowwalid',
  linkedinHeadline: 'Md. Walid Rahman Swapnil - Developer',
  linkedinSnippet: 'Designing and developing premium digital brands.',
  linkedinImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
  facebookPostTitle: 'youknowwalid | Advisory Services',
  facebookSubtitleSnippet: 'Statutory compliance advisory, double tax treaties planning, and global fund auditing pipelines.',
  facebookSharedImageCover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40'
};

const DEFAULT_CONFIG: SiteConfig = {
  siteTitle: 'youknowwalid',
  siteLogo: '',
  favicon: '',
  headerLinks: [
    { label: 'Home', url: '/#home' },
    { label: 'About', url: '/#about' },
    { label: 'Resume', url: '/#resume' },
    { label: 'Services', url: '/#services' },
    { label: 'Projects', url: '/#projects' },
    { label: 'Contact', url: '/#contact' },
    { label: 'Blog', url: '/#blog' },
  ],
  footerColumns: [
    {
      title: 'Navigation',
      links: [
        { label: 'Home', url: '/#home' },
        { label: 'About', url: '/#about' },
        { label: 'Resume', url: '/#resume' },
        { label: 'Services', url: '/#services' },
        { label: 'Projects', url: '/#projects' },
        { label: 'Contact', url: '/#contact' },
        { label: 'Blog', url: '/#blog' },
      ]
    },
    {
      title: 'Contact Info',
      links: [
        { label: 'Nikunja 2, Dhaka 1229', url: '#' },
        { label: 'info@walidrahman.com', url: 'mailto:info@walidrahman.com' },
        { label: '+880 1744 588 644', url: 'tel:+8801744588644' }
      ]
    }
  ],
  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com/youknowwalid' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/youknowwalid' },
    { platform: 'twitter', url: 'https://twitter.com/youknowwalid' }
  ],
  copyrightText: '© 2026 Md. Walid Rahman Swapnil. All rights reserved.',
  footerPortrait: '',
  officeAddress: 'Nikunja 2, Dhaka 1229',
  contactEmail: 'info@walidrahman.com',
  officePhone: '+880 1744 588 644',
  primaryColor: '#f45901',
  secondaryColor: '#00c6ff',
  brandTagline: 'A Brand Developer crafting premium digital experiences.',
  globalCtaText: 'Let\'s Discuss',
  globalCtaUrl: '/#contact',
  termsOfService: 'Terms of Service will appear here...',
  privacyPolicy: 'Privacy Policy will appear here...',
  refundPolicy: 'Refund Policy will appear here...',
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(() => {
    const cached = localStorage.getItem('site_config_global');
    if (cached) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
      } catch (e) {}
    }
    return DEFAULT_CONFIG;
  });
  const [seoConfig, setSeoConfig] = useState<SeoConfig>(() => {
    const cached = localStorage.getItem('site_config_seo');
    if (cached) {
      try {
        return { ...DEFAULT_SEO_CONFIG, ...JSON.parse(cached) };
      } catch (e) {}
    }
    return DEFAULT_SEO_CONFIG;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribeGlobal = onSnapshot(doc(db, 'siteConfig', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        let loadedHeaderLinks = Array.isArray(data.headerLinks) ? data.headerLinks : DEFAULT_CONFIG.headerLinks;
        let loadedFooterColumns = Array.isArray(data.footerColumns) ? data.footerColumns : DEFAULT_CONFIG.footerColumns;

        const nextConfig = {
          siteTitle: data.siteTitle || DEFAULT_CONFIG.siteTitle,
          siteLogo: data.siteLogo || DEFAULT_CONFIG.siteLogo,
          favicon: data.favicon || DEFAULT_CONFIG.favicon,
          footerPortrait: data.footerPortrait || DEFAULT_CONFIG.footerPortrait || '',
          headerLinks: loadedHeaderLinks,
          footerColumns: loadedFooterColumns,
          socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : DEFAULT_CONFIG.socialLinks,
          copyrightText: data.copyrightText !== undefined ? data.copyrightText : DEFAULT_CONFIG.copyrightText,
          officeAddress: data.officeAddress || DEFAULT_CONFIG.officeAddress,
          contactEmail: data.contactEmail || DEFAULT_CONFIG.contactEmail,
          officePhone: data.officePhone || DEFAULT_CONFIG.officePhone,
          primaryColor: data.primaryColor || DEFAULT_CONFIG.primaryColor,
          secondaryColor: data.secondaryColor || DEFAULT_CONFIG.secondaryColor,
          brandTagline: data.brandTagline || DEFAULT_CONFIG.brandTagline,
          globalCtaText: data.globalCtaText || DEFAULT_CONFIG.globalCtaText,
          globalCtaUrl: data.globalCtaUrl || DEFAULT_CONFIG.globalCtaUrl,
          termsOfService: data.termsOfService || DEFAULT_CONFIG.termsOfService,
          privacyPolicy: data.privacyPolicy || DEFAULT_CONFIG.privacyPolicy,
          refundPolicy: data.refundPolicy || DEFAULT_CONFIG.refundPolicy,
        };

        setConfig(nextConfig);
        localStorage.setItem('site_config_global', JSON.stringify(nextConfig));
      } else {
        setDoc(doc(db, 'siteConfig', 'global'), DEFAULT_CONFIG).catch(err => {
          console.warn("Bootstrap initial global config failed:", err);
        });
      }
    }, (error) => {
      console.error("Failed to load site config:", error);
    });

    const unsubscribeSeo = onSnapshot(doc(db, 'siteConfig', 'seo'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const nextSeo = {
          metaTitle: data.metaTitle || DEFAULT_SEO_CONFIG.metaTitle,
          metaDescription: data.metaDescription || DEFAULT_SEO_CONFIG.metaDescription,
          canonicalUrl: data.canonicalUrl || DEFAULT_SEO_CONFIG.canonicalUrl,
          robotsIndex: data.robotsIndex !== undefined ? data.robotsIndex : DEFAULT_SEO_CONFIG.robotsIndex,
          sitemapUrl: data.sitemapUrl || DEFAULT_SEO_CONFIG.sitemapUrl,
          focusKeywords: data.focusKeywords || DEFAULT_SEO_CONFIG.focusKeywords,
          ogTitle: data.ogTitle || DEFAULT_SEO_CONFIG.ogTitle,
          ogDescription: data.ogDescription || DEFAULT_SEO_CONFIG.ogDescription,
          ogImageUrl: data.ogImageUrl || DEFAULT_SEO_CONFIG.ogImageUrl,
          ogType: data.ogType || DEFAULT_SEO_CONFIG.ogType,
          ogSiteName: data.ogSiteName || DEFAULT_SEO_CONFIG.ogSiteName,
          ogLocale: data.ogLocale || DEFAULT_SEO_CONFIG.ogLocale,
          twitterCardType: data.twitterCardType || DEFAULT_SEO_CONFIG.twitterCardType,
          twitterTitle: data.twitterTitle || DEFAULT_SEO_CONFIG.twitterTitle,
          twitterDescription: data.twitterDescription || DEFAULT_SEO_CONFIG.twitterDescription,
          twitterImageUrl: data.twitterImageUrl || DEFAULT_SEO_CONFIG.twitterImageUrl,
          twitterHandle: data.twitterHandle || DEFAULT_SEO_CONFIG.twitterHandle,
          linkedinHeadline: data.linkedinHeadline || DEFAULT_SEO_CONFIG.linkedinHeadline,
          linkedinSnippet: data.linkedinSnippet || DEFAULT_SEO_CONFIG.linkedinSnippet,
          linkedinImageUrl: data.linkedinImageUrl || DEFAULT_SEO_CONFIG.linkedinImageUrl,
          facebookPostTitle: data.facebookPostTitle || DEFAULT_SEO_CONFIG.facebookPostTitle,
          facebookSubtitleSnippet: data.facebookSubtitleSnippet || DEFAULT_SEO_CONFIG.facebookSubtitleSnippet,
          facebookSharedImageCover: data.facebookSharedImageCover || DEFAULT_SEO_CONFIG.facebookSharedImageCover,
        };

        setSeoConfig(nextSeo);
        localStorage.setItem('site_config_seo', JSON.stringify(nextSeo));
      } else {
        setDoc(doc(db, 'siteConfig', 'seo'), DEFAULT_SEO_CONFIG).catch(err => {
          console.warn("Bootstrap initial SEO site config failed:", err);
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Failed to load SEO site config:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeGlobal();
      unsubscribeSeo();
    };
  }, []);

  useEffect(() => {
    const primary = config.primaryColor || '#f45901';
    const secondary = config.secondaryColor || '#00c6ff';
    document.documentElement.style.setProperty('--color-accent', primary);
    document.documentElement.style.setProperty('--color-accent-secondary', secondary);
  }, [config.primaryColor, config.secondaryColor]);

  useEffect(() => {
    if (config.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.favicon;
    }
  }, [config.favicon]);

  useEffect(() => {
    if (!seoConfig) return;

    if (seoConfig.metaTitle) {
      document.title = seoConfig.metaTitle;
    }

    let descMeta = document.querySelector("meta[name='description']");
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seoConfig.metaDescription || '');

    let keywordsMeta = document.querySelector("meta[name='keywords']");
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.setAttribute('name', 'keywords');
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.setAttribute('content', seoConfig.focusKeywords || '');

    if (seoConfig.canonicalUrl) {
      let canonicalLink = document.querySelector("link[rel='canonical']");
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', seoConfig.canonicalUrl);
    }

    let robotsMeta = document.querySelector("meta[name='robots']");
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', seoConfig.robotsIndex ? 'index, follow' : 'noindex, nofollow');

    const ogTags = {
      'og:title': seoConfig.ogTitle,
      'og:description': seoConfig.ogDescription,
      'og:image': seoConfig.ogImageUrl,
      'og:type': seoConfig.ogType,
      'og:site_name': seoConfig.ogSiteName,
      'og:locale': seoConfig.ogLocale,
    };
    Object.entries(ogTags).forEach(([key, val]) => {
      let tag = document.querySelector(`meta[property='${key}']`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', val || '');
    });

    const twitterTags = {
      'twitter:card': seoConfig.twitterCardType,
      'twitter:title': seoConfig.twitterTitle,
      'twitter:description': seoConfig.twitterDescription,
      'twitter:image': seoConfig.twitterImageUrl,
      'twitter:site': seoConfig.twitterHandle,
    };
    Object.entries(twitterTags).forEach(([key, val]) => {
      let tag = document.querySelector(`meta[name='${key}']`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', val || '');
    });

    let schemaScript = document.getElementById('seo-jsonld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'seo-jsonld-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    const schemaObj = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": seoConfig.metaTitle || "Md. Walid Rahman Swapnil",
      "description": seoConfig.metaDescription || "Brand Developer & Product Strategist",
      "url": seoConfig.canonicalUrl || "https://walidrahman.com",
      "sameAs": [
        "https://facebook.com/youknowwalid",
        "https://linkedin.com/in/youknowwalid",
        "https://twitter.com/youknowwalid"
      ]
    };
    schemaScript.innerHTML = JSON.stringify(schemaObj, null, 2);

  }, [seoConfig]);

  const updateConfig = async (newConfig: Partial<SiteConfig>) => {
    const updated = {
      ...config,
      ...newConfig,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
    localStorage.setItem('site_config_global', JSON.stringify(updated));
    await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
  };

  const updateSeoConfig = async (newSeo: Partial<SeoConfig>) => {
    const updated = {
      ...seoConfig,
      ...newSeo,
      updatedAt: new Date().toISOString()
    };
    setSeoConfig(updated);
    localStorage.setItem('site_config_seo', JSON.stringify(updated));
    await setDoc(doc(db, 'siteConfig', 'seo'), updated, { merge: true });
  };

  return (
    <SiteConfigContext.Provider value={{ config, updateConfig, seoConfig, updateSeoConfig, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};
