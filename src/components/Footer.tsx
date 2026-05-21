import React from 'react';
import { Linkedin, Facebook, Github, Globe } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function Footer() {
  const { config } = useSiteConfig();

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('facebook')) return <Facebook className="w-5 h-5" />;
    if (p.includes('linkedin')) return <Linkedin className="w-5 h-5" />;
    if (p.includes('twitter') || p.includes('x.com')) {
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm1.161 17.52h1.833L7.045 4.126H5.078z"/>
        </svg>
      );
    }
    if (p.includes('github')) return <Github className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  return (
    <footer className="py-20 px-6 bg-bg-dark relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div>
          {config.siteLogo ? (
            <img 
              src={config.siteLogo} 
              alt={config.siteTitle} 
              className="h-9 w-auto object-contain mb-4" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="text-2xl font-black tracking-tighter mb-4 text-text-main">
              {config.siteTitle === 'youknowwalid' ? (
                <>youknowwalid<span className="text-accent">.</span></>
              ) : (
                config.siteTitle
              )}
            </div>
          )}
          <p className="text-text-muted max-w-sm italic">
            Crafting premium digital experiences through strategic brand evolution and innovative web solutions.
          </p>
        </div>
        <div className="flex gap-4">
          {config.socialLinks.filter(s => s.url && s.url.trim() !== '').map((s, idx) => (
            <a 
              key={idx} 
              href={s.url} 
              target="_blank" 
              rel="noreferrer" 
              className="w-12 h-12 rounded-full bg-border-subtle flex items-center justify-center hover:bg-accent hover:text-black transition-all hover:-translate-y-1 text-text-main"
              title={s.platform}
            >
              {getSocialIcon(s.platform)}
            </a>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border-subtle text-center text-xs text-text-muted">
        {config.copyrightText}
      </div>
    </footer>
  );
}
