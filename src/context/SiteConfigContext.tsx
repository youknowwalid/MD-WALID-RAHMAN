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
}

interface SiteConfigContextType {
  config: SiteConfig;
  updateConfig: (newConfig: Partial<SiteConfig>) => Promise<void>;
  loading: boolean;
}

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
  copyrightText: '© 2026 Md. Walid Rahman Swapnil. All rights reserved.'
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to changes in real-time
    const unsubscribe = onSnapshot(doc(db, 'siteConfig', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConfig({
          siteTitle: data.siteTitle || DEFAULT_CONFIG.siteTitle,
          siteLogo: data.siteLogo || DEFAULT_CONFIG.siteLogo,
          favicon: data.favicon || DEFAULT_CONFIG.favicon,
          headerLinks: Array.isArray(data.headerLinks) ? data.headerLinks : DEFAULT_CONFIG.headerLinks,
          footerColumns: Array.isArray(data.footerColumns) ? data.footerColumns : DEFAULT_CONFIG.footerColumns,
          socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : DEFAULT_CONFIG.socialLinks,
          copyrightText: data.copyrightText !== undefined ? data.copyrightText : DEFAULT_CONFIG.copyrightText,
        });
      } else {
        // Automatically bootstrap global site config record if empty
        setDoc(doc(db, 'siteConfig', 'global'), DEFAULT_CONFIG).catch(err => {
          console.warn("Bootstrap initial global config failed (may require admin login):", err);
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Failed to load site config:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync favicon with dynamic config value
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

  // Sync index.html browser title with dynamic siteTitle value
  useEffect(() => {
    if (config.siteTitle && config.siteTitle !== 'youknowwalid') {
      document.title = `${config.siteTitle} | Portfolio`;
    } else {
      document.title = "youknowwalid | Portfolio";
    }
  }, [config.siteTitle]);

  const updateConfig = async (newConfig: Partial<SiteConfig>) => {
    const updated = {
      ...config,
      ...newConfig,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'siteConfig', 'global'), updated, { merge: true });
  };

  return (
    <SiteConfigContext.Provider value={{ config, updateConfig, loading }}>
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
