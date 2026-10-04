import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useProducts } from '../lib/products';

const THEME_KEY = 'theme';

const ThemeToggle = () => {
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light-mode'));

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle('light-mode', next);
    try { localStorage.setItem(THEME_KEY, next ? 'light' : 'dark'); } catch { /* ignore */ }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-accent/10 overflow-hidden"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isLight ? 'sun' : 'moon'}
          initial={{ rotate: isLight ? -90 : 90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: isLight ? 90 : -90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3, ease: 'circOut' }}
          className="flex"
        >
          {isLight ? <Sun className="w-6 h-6 text-accent" aria-hidden="true" /> : <Moon className="w-6 h-6 text-accent" aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

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
        <Link to="/" className="flex items-center gap-2 hover:text-accent transition-all" aria-label={`${config.siteTitle} – home`}>
          {config.siteLogo ? (
            <img src={config.siteLogo} alt="" className="h-10 w-auto" />
          ) : (
            <span className="font-black text-xl tracking-tighter text-text-main">{config.siteTitle}</span>
          )}
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
                {isActive && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />}
              </NavItem>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
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
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
