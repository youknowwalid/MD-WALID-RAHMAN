import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Github, Twitter, Linkedin, Facebook, ArrowUpRight } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('github')) return <Github className="w-4 h-4" />;
  if (p.includes('twitter') || p.includes('x.com')) return <Twitter className="w-4 h-4" />;
  if (p.includes('linkedin')) return <Linkedin className="w-4 h-4" />;
  if (p.includes('facebook')) return <Facebook className="w-4 h-4" />;
  return <ArrowUpRight className="w-4 h-4" />;
};

interface FooterProps {
  portraitUrl?: string;
}

export default function Footer({ portraitUrl }: FooterProps) {
  const { config } = useSiteConfig();
  const finalPortraitUrl = config.footerPortrait;

  return (
    <footer className="bg-bg-dark border-t border-border-subtle relative z-10 pt-16 pb-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16 relative z-10">
          
          {/* Left Column: Brand & Tagline */}
          <div className="md:col-span-4">
            <a href="#home" className="text-2xl font-black tracking-tighter text-text-main inline-block mb-4 hover:opacity-80 transition-opacity">
              {config.siteLogo ? (
                <img src={config.siteLogo} alt={config.siteTitle} className="h-8 w-auto" />
              ) : (
                <span>{config.siteTitle || 'Portfolio'}</span>
              )}
            </a>
            <p className="text-text-muted text-sm max-w-sm mb-6 leading-relaxed">
              {config.brandTagline || 'Crafting premium digital experiences and software.'}
            </p>
            
            {/* Social Links inline */}
            {config.socialLinks && config.socialLinks.length > 0 && (
              <div className="flex gap-3">
                {config.socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-all hover:-translate-y-1 bg-bg-card"
                  >
                    {getSocialIcon(social.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Middle Column: Dynamic Footer Columns (Navigation & Contact) */}
          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {config.footerColumns?.map((col, idx) => (
              <div key={idx}>
                <h4 className="text-text-main font-bold mb-6">{col.title}</h4>
                
                <ul className={col.title.toLowerCase().includes('nav') ? "grid grid-cols-2 gap-y-3 gap-x-4" : "space-y-4"}>
                  {col.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      {link.url.startsWith('mailto:') ? (
                        <a href={link.url} className="text-text-muted hover:text-accent transition-colors flex items-center gap-3 text-sm group">
                          <Mail className="w-4 h-4 text-accent/50 group-hover:text-accent" />
                          {link.label}
                        </a>
                      ) : link.url.startsWith('tel:') ? (
                        <a href={link.url} className="text-text-muted hover:text-accent transition-colors flex items-center gap-3 text-sm group">
                          <Phone className="w-4 h-4 text-accent/50 group-hover:text-accent" />
                          {link.label}
                        </a>
                      ) : link.url === '#' && !col.title.toLowerCase().includes('nav') ? (
                        <span className="text-text-muted flex items-center gap-3 text-sm">
                          <MapPin className="w-4 h-4 text-accent/50" />
                          {link.label}
                        </span>
                      ) : (
                        <a href={link.url} className="text-text-muted hover:text-accent transition-colors text-sm">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right Column: Portrait (Desktop Only) */}
          {finalPortraitUrl && (
            <div className="hidden md:flex md:col-span-3 justify-end items-end relative">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/10 blur-[60px] rounded-full pointer-events-none" />
              <img 
                src={finalPortraitUrl} 
                alt="Brand Developer" 
                className="w-full max-w-[260px] h-auto object-contain object-bottom drop-shadow-2xl relative z-10"
                style={{ maxHeight: '280px' }}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Bottom Bar: Copyright & Legal Policies */}
        <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-text-muted text-sm">
            {config.copyrightText}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
            <Link to="/terms-of-service" className="text-text-muted hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/10">|</span>
            <Link to="/privacy-policy" className="text-text-muted hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/10">|</span>
            <Link to="/refund-policy" className="text-text-muted hover:text-accent transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
