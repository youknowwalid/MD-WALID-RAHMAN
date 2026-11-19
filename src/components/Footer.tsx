import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Github, Twitter, Linkedin, Facebook, Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { safeUrl } from '../lib/text';
import Photo from './Photo';
import FounderCard from './FounderCard';

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

export default function Footer() {
  const { config } = useSiteConfig();
  const phoneDigits = config.officePhone.replace(/[^0-9+]/g, '');
  const socials = config.socialLinks.filter((s) => safeUrl(s.url));

  return (
    <footer className="bg-bg-dark border-t border-border-subtle relative z-10 pt-8 pb-20 md:pb-4 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 mb-5 relative z-10">
          <div className="flex flex-col gap-3 md:col-span-6 md:justify-between lg:col-span-4">
            <div>
              {config.footerLogo && (
                <Link to="/" className="inline-flex min-h-11 items-center mb-1 hover:opacity-80 transition-opacity md:mb-0 md:min-h-8" aria-label={`${config.siteTitle} – home`}>
                  <Photo src={config.footerLogo} widths={[256]} sizes="100px" alt="" width={100} height={32} loading="lazy" decoding="async" className="h-8 w-auto" />
                </Link>
              )}
              <p className="text-text-muted text-sm max-w-sm leading-relaxed md:[&:not(:first-child)]:mt-2">{config.brandTagline}</p>
            </div>

            {socials.length > 0 && (
              <ul className="flex gap-3">
                {socials.map((social, index) => (
                  <li key={index}>
                    <a
                      href={safeUrl(social.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.platform} (opens in a new tab)`}
                      className="w-11 h-11 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-all hover:-translate-y-1 bg-bg-card"
                    >
                      {getSocialIcon(social.platform)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col md:col-span-6 lg:col-span-3">
            <h2 className="text-text-main font-bold mb-3 text-base">Contact Info</h2>
            <ul className="flex flex-col md:flex-1 md:justify-between md:gap-2.5">
              {config.officeAddress && (
                <li className="text-text-muted flex min-h-11 items-center gap-3 text-sm lg:min-h-0">
                  <MapPin className="w-4 h-4 text-accent/70 shrink-0" aria-hidden="true" />
                  {config.officeAddress}
                </li>
              )}
              {config.contactEmail && (
                <li>
                  <a href={`mailto:${config.contactEmail}`} className="text-text-muted hover:text-accent transition-colors flex items-center gap-3 text-sm group min-h-11 lg:min-h-0">
                    <Mail className="w-4 h-4 text-accent/70 group-hover:text-accent shrink-0" aria-hidden="true" />
                    {config.contactEmail}
                  </a>
                </li>
              )}
              {config.officePhone && (
                <li>
                  <a href={`tel:${phoneDigits}`} className="text-text-muted hover:text-accent transition-colors flex items-center gap-3 text-sm group min-h-11 lg:min-h-0">
                    <Phone className="w-4 h-4 text-accent/70 group-hover:text-accent shrink-0" aria-hidden="true" />
                    {config.officePhone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <FounderCard className="md:col-span-12 lg:col-span-5" />
        </div>

        <div className="pt-4 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-text-muted text-sm text-center md:text-left">{config.copyrightText}</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-0 text-sm font-medium">
            <li><Link to="/terms-of-service" className="inline-flex min-h-11 items-center lg:min-h-0 text-text-muted hover:text-accent transition-colors">Terms of Service</Link></li>
            <li aria-hidden="true" className="hidden text-text-muted/40 sm:block">•</li>
            <li><Link to="/privacy-policy" className="inline-flex min-h-11 items-center lg:min-h-0 text-text-muted hover:text-accent transition-colors">Privacy Policy</Link></li>
            <li aria-hidden="true" className="hidden text-text-muted/40 sm:block">•</li>
            <li><Link to="/refund-policy" className="inline-flex min-h-11 items-center lg:min-h-0 text-text-muted hover:text-accent transition-colors">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
