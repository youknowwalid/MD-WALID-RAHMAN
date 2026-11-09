import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useProducts } from '../lib/products';
import { safeUrl } from '../lib/text';

/** In-site links use the router (no page reload); everything else is a normal link. */
const NavItem = ({ url, className, onClick, children, ...rest }: { url: string; className?: string; onClick?: () => void; children: React.ReactNode } & React.AriaAttributes) =>
  url.startsWith('/') ? (
    <Link to={url} className={className} onClick={onClick} {...rest}>{children}</Link>
  ) : (
    <a href={url} className={className} onClick={onClick} {...rest}>{children}</a>
  );

const sectionOf = (url: string) => url.replace('/#', '').replace('#', '');

export default function Navbar() {
  const { config } = useSiteConfig();
  const { products } = useProducts();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');
  const menuButton = useRef<HTMLButtonElement>(null);

  // The home page is light and the header floats over its sky: it gets its own treatment.
  // Every other page keeps the dark header.
  const isHome = location.pathname === '/';
  const onSky = isHome && !isScrolled && !isMenuOpen;

  // Hide the Resources link until there is something to show.
  const headerLinks = config.headerLinks.filter((l) => products.length > 0 || sectionOf(l.url) !== 'resources');

  const phoneDigits = config.officePhone.replace(/[^0-9+]/g, '');
  const ctaHref = safeUrl(config.globalCtaUrl) || (phoneDigits ? `https://wa.me/${phoneDigits.replace(/^\+/, '')}` : '/#contact');
  const ctaExternal = /^https?:/i.test(ctaHref);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (location.pathname !== '/') return;
      const scrollPos = window.scrollY + 120;
      for (const link of headerLinks) {
        const section = document.getElementById(sectionOf(link.url));
        if (section && scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
          setActiveSection(section.id);
        }
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, headerLinks.length]);

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsMenuOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed left-0 top-0 z-40 w-full transition-all duration-300',
        isHome ? 'px-4 pt-4 md:px-7 md:pt-5' : 'px-6 py-4 md:px-12',
        !isHome && (isScrolled || isMenuOpen) ? 'bg-bg-dark/80 backdrop-blur-xl py-3 border-b border-border-subtle' : '',
        !isHome && !(isScrolled || isMenuOpen) ? 'bg-transparent' : '',
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between transition-all duration-300',
          isHome && 'rounded-full border px-4 py-2.5 md:px-5 md:py-3',
          isHome && onSky && 'border-white/30 bg-white/15 text-white backdrop-blur-xl',
          isHome && !onSky && 'border-white/10 bg-[#0d1117]/90 text-white shadow-[0_16px_40px_-22px_rgba(13,17,23,0.6)] backdrop-blur-xl',
        )}
      >
        <Link to="/" className="flex min-h-10 min-w-10 items-center gap-2 transition-opacity hover:opacity-80" aria-label={`${config.siteTitle} – home`}>
          {config.siteLogo && (
            <img
              src={config.siteLogo}
              alt=""
              className={cn('h-10 w-auto transition-[filter] duration-300', isHome && onSky && 'brightness-0 invert')}
            />
          )}
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {headerLinks.map((link) => {
            const isActive = location.pathname === '/' && activeSection === sectionOf(link.url);
            return (
              <NavItem
                key={link.label}
                url={link.url}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'relative py-1 text-sm font-medium transition-all',
                  isHome
                    ? cn('rounded-full px-3.5 py-2 text-white', onSky ? 'hover:bg-white/15' : 'hover:bg-white/10', isActive && 'bg-white/20')
                    : cn('hover:text-accent', isActive ? 'text-accent' : 'text-text-muted'),
                )}
              >
                {link.label}
                {isActive && !isHome && <m.div layoutId="nav-underline" className="absolute bottom-0 left-0 h-0.5 w-full bg-accent" />}
              </NavItem>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {isHome && (
            <a
              href={ctaHref}
              {...(ctaExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="home-btn home-mag hidden bg-accent px-6 py-3 text-[15px] text-[#0d1117] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] lg:inline-flex"
            >
              {config.globalCtaText}
            </a>
          )}
          <button
            ref={menuButton}
            className={cn(
              'flex h-11 w-11 items-center justify-center lg:hidden',
              isHome ? 'rounded-full text-white' : 'text-text-main',
            )}
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'z-50 flex flex-col gap-6 overflow-y-auto p-8 shadow-2xl lg:hidden',
              isHome
                ? 'mx-auto mt-3 max-h-[calc(100vh-7rem)] max-w-7xl rounded-[32px] border border-white/10 bg-[#0d1117]/95 backdrop-blur-2xl'
                : 'absolute left-0 top-full max-h-[calc(100vh-4rem)] w-full border-b border-border-subtle bg-bg-dark/95 backdrop-blur-2xl',
            )}
          >
            {headerLinks.map((link) => (
              <NavItem
                key={link.label}
                url={link.url}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'transition-all',
                  isHome
                    ? 'text-[28px] font-medium tracking-[-0.035em] text-white'
                    : 'text-2xl font-black uppercase tracking-tighter text-text-muted hover:text-accent',
                )}
              >
                {link.label}
              </NavItem>
            ))}
            {isHome && (
              <a
                href={ctaHref}
                {...(ctaExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={() => setIsMenuOpen(false)}
                className="home-btn mt-2 w-full bg-accent px-7 py-4 text-[16px] text-[#0d1117]"
              >
                {config.globalCtaText}
              </a>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
