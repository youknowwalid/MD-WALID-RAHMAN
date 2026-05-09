
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, FileText } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { NavLink } from '../types';

const NAV_LINKS: NavLink[] = [
  { name: 'Home', href: '/#home' },
  { name: 'About', href: '/#about' },
  { name: 'Resume', href: '/#resume' },
  { name: 'Services', href: '/#services' },
  { name: 'Projects', href: '/#projects' },
  { name: 'Contact', href: '/#contact' },
  { name: 'Blog', href: '/#blog' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      if (location.pathname === '/') {
        const sections = NAV_LINKS.map(link => document.getElementById(link.href.replace('/#', '')));
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
  }, [location]);

  return (
    <nav className={cn(
      "fixed top-0 left-0 w-full z-40 transition-all duration-300 px-6 md:px-12 py-4",
      isScrolled ? "bg-black/80 backdrop-blur-xl py-3 border-b border-white/5" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-black tracking-tighter hover:text-accent transition-colors">
          youknowwalid<span className="text-accent">.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-all hover:text-accent relative py-1",
                (location.pathname === '/' && activeSection === link.href.replace('/#', '')) ? "text-accent" : "text-gray-400"
              )}
            >
              {link.name}
              {(location.pathname === '/' && activeSection === link.href.replace('/#', '')) && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />
              )}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a 
            href="https://calendly.com/youknowwalid/30min" 
            target="_blank" 
            rel="noreferrer"
            className="hidden lg:block px-6 py-2.5 bg-transparent border border-accent text-accent rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255, 26, 26, 0.3)] hover:bg-accent hover:text-white transition-all text-center"
          >
            Let's Talk
          </a>
          <Link to="/admin" className="text-white/10 hover:text-accent p-2 transition-colors">
            <FileText className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
            className="lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-2xl border-b border-white/5 p-8 flex flex-col gap-6 z-50 shadow-2xl"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "text-2xl font-black uppercase tracking-tighter transition-all text-gray-400 hover:text-accent"
                )}
              >
                {link.name}
              </a>
            ))}
            <a 
              href="https://calendly.com/youknowwalid/30min" 
              target="_blank" 
              rel="noreferrer"
              className="mt-4 px-8 py-4 bg-accent text-white rounded-xl text-sm font-bold uppercase tracking-widest text-center"
            >
              Let's Talk
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
