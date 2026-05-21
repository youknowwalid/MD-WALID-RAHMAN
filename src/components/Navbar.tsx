
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useSiteConfig } from '../context/SiteConfigContext';

const ThemeToggle = () => {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const isLightMode = document.body.classList.contains('light-mode');
    setIsLight(isLightMode);
  }, []);

  const toggleTheme = () => {
    const newMode = !isLight;
    setIsLight(newMode);
    if (newMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  return (
    <div className="relative w-11 h-11 flex items-center justify-center">
      <button
        onClick={toggleTheme}
        className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-accent/10 group overflow-hidden"
        aria-label="Toggle Theme"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isLight ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "circOut" }}
              >
                <Sun className="w-6 h-6 text-accent" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "circOut" }}
              >
                <Moon className="w-6 h-6 text-accent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </div>
  );
};

export default function Navbar() {
  const { config } = useSiteConfig();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      if (location.pathname === '/') {
        const sections = config.headerLinks.map(link => 
          document.getElementById(link.url.replace('/#', '').replace('#', ''))
        );
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
          if (section) {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
              setActiveSection(section.id);
            }
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location, config.headerLinks]);

  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-40 transition-all duration-300 px-6 md:px-12 py-4",
      isScrolled ? "bg-bg-dark/80 backdrop-blur-xl py-3 border-b border-border-subtle" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:text-accent transition-all">
          {config.siteLogo ? (
            <img 
              src={config.siteLogo} 
              alt={config.siteTitle} 
              className="h-9 w-auto object-contain" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <span className="text-xl font-black tracking-tighter text-text-main">
              {config.siteTitle === 'youknowwalid' ? (
                <>youknowwalid<span className="text-accent">.</span></>
              ) : (
                config.siteTitle
              )}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {config.headerLinks.map((link) => {
            const sectionId = link.url.replace('/#', '').replace('#', '');
            const isActive = location.pathname === '/' && activeSection === sectionId;
            return (
              <a
                key={link.label}
                href={link.url}
                className={cn(
                  "text-sm font-medium transition-all hover:text-accent relative py-1",
                  isActive ? "text-accent" : "text-gray-400"
                )}
              >
                {link.label}
                {isActive && (
                  <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />
                )}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-text-main" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-bg-dark/95 backdrop-blur-2xl border-b border-border-subtle p-8 flex flex-col gap-6 z-50 shadow-2xl"
          >
            {config.headerLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "text-2xl font-black uppercase tracking-tighter transition-all text-text-muted hover:text-accent"
                )}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
