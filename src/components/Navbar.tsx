import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useProducts } from '../lib/products';

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

  // Hide the Resources link until there is something to show.
  const headerLinks = config.headerLinks.filter((l) => products.length > 0 || sectionOf(l.url) !== 'resources');

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
        'fixed top-0 left-0 w-full z-40 transition-all duration-300 px-6 md:px-12 py-4',
        isScrolled || isMenuOpen ? 'bg-bg-dark/80 backdrop-blur-xl py-3 border-b border-border-subtle' : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-h-10 min-w-10" aria-label={`${config.siteTitle} – home`}>
          {config.siteLogo && <img src={config.siteLogo} alt="" className="h-10 w-auto" />}
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {headerLinks.map((link) => {
            const isActive = location.pathname === '/' && activeSection === sectionOf(link.url);
            return (
              <NavItem
                key={link.label}
                url={link.url}
                aria-current={isActive ? 'true' : undefined}
                className={cn('text-sm font-medium transition-all hover:text-accent relative py-1', isActive ? 'text-accent' : 'text-text-muted')}
              >
                {link.label}
                {isActive && <m.div layoutId="nav-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />}
              </NavItem>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            ref={menuButton}
            className="lg:hidden w-11 h-11 flex items-center justify-center text-text-main"
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
            className="lg:hidden absolute top-full left-0 w-full bg-bg-dark/95 backdrop-blur-2xl border-b border-border-subtle p-8 flex flex-col gap-6 z-50 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {headerLinks.map((link) => (
              <NavItem
                key={link.label}
                url={link.url}
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-black uppercase tracking-tighter transition-all text-text-muted hover:text-accent"
              >
                {link.label}
              </NavItem>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
