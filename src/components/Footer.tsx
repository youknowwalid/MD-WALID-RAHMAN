import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Github, Twitter, Linkedin, Facebook, Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useProducts } from '../lib/products';
import { safeUrl } from '../lib/text';

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  const cls = 'w-4 h-4';
  if (p.includes('github')) return <Github className={cls} aria-hidden="true" />;
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return <Twitter className={cls} aria-hidden="true" />;
  if (p.includes('linkedin')) return <Linkedin className={cls} aria-hidden="true" />;
  if (p.includes('facebook')) return <Facebook className={cls} aria-hidden="true" />;
  if (p.includes('instagram')) return <Instagram className={cls} aria-hidden="true" />;
  if (p.includes('youtube')) return <Youtube className={cls} aria-hidden="true" />;
  return <ArrowUpRight className={cls} aria-hidden="true" />;
};

const sectionOf = (url: string) => url.replace('/#', '').replace('#', '');

export default function Footer() {
  const { config } = useSiteConfig();
  const { products } = useProducts();
  const navLinks = config.headerLinks.filter((l) => products.length > 0 || sectionOf(l.url) !== 'resources');
  const phoneDigits = config.officePhone.replace(/[^0-9+]/g, '');
  const socials = config.socialLinks.filter((s) => safeUrl(s.url));

  return (
    <footer className="bg-bg-dark border-t border-border-subtle relative z-10 pt-16 pb-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16 relative z-10">
          <div className="md:col-span-4">
            {config.footerLogo && (
              <Link to="/" className="inline-block mb-4 hover:opacity-80 transition-opacity" aria-label={`${config.siteTitle} – home`}>
                <img src={config.footerLogo} alt="" className="h-8 w-auto" />
              </Link>
            )}
            <p className="text-text-muted text-sm max-w-sm mb-6 leading-relaxed">{config.brandTagline}</p>

            {socials.length > 0 && (
              <ul className="flex gap-3">
                {socials.map((social, index) => (
                  <li key={index}>
                    <a
                      href={safeUrl(social.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.platform} (opens in a new tab)`}
                      className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-all hover:-translate-y-1 bg-bg-card"
                    >
                      {getSocialIcon(social.platform)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <nav aria-label="Footer">
              <h2 className="text-text-main font-bold mb-6 text-base">Navigation</h2>
              <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    {link.url.startsWith('/') ? (
                      <Link to={link.url} className="text-text-muted hover:text-accent transition-colors text-sm">{link.label}</Link>
                    ) : (
                      <a href={link.url} className="text-text-muted hover:text-accent transition-colors text-sm">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h2 className="text-text-main font-bold mb-6 text-base">Contact Info</h2>
              <ul className="space-y-4">
                {config.officeAddress && (
                  <li className="text-text-muted flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-accent/70 shrink-0" aria-hidden="true" />
                    {config.officeAddress}
                  </li>
                )}
                {config.contactEmail && (
                  <li>
                    <a href={`mailto:${config.contactEmail}`} className="text-text-muted hover:text-accent transition-colors flex items-center gap-3 text-sm group">
                      <Mail className="w-4 h-4 text-accent/70 group-hover:text-accent shrink-0" aria-hidden="true" />
                      {config.contactEmail}
                    </a>
                  </li>
                )}
                {config.officePhone && (
                  <li>
                    <a href={`tel:${phoneDigits}`} className="text-text-muted hover:text-accent transition-colors flex items-center gap-3 text-sm group">
                      <Phone className="w-4 h-4 text-accent/70 group-hover:text-accent shrink-0" aria-hidden="true" />
                      {config.officePhone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {config.footerPortrait && (
            <div className="hidden md:flex md:col-span-3 justify-end items-end relative">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/10 blur-[60px] rounded-full pointer-events-none" />
              <img src={config.footerPortrait} alt="" className="w-full max-w-[260px] h-auto object-contain object-bottom drop-shadow-2xl relative z-10" style={{ maxHeight: '280px' }} loading="lazy" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-text-muted text-sm">{config.copyrightText}</p>
          <ul className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
            <li><Link to="/terms-of-service" className="text-text-muted hover:text-accent transition-colors">Terms of Service</Link></li>
            <li aria-hidden="true" className="text-text-muted/40">•</li>
            <li><Link to="/privacy-policy" className="text-text-muted hover:text-accent transition-colors">Privacy Policy</Link></li>
            <li aria-hidden="true" className="text-text-muted/40">•</li>
            <li><Link to="/refund-policy" className="text-text-muted hover:text-accent transition-colors">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
