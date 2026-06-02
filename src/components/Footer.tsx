import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MapPin, Phone, Github, Twitter, Linkedin, Facebook, ArrowUpRight, X } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('github')) return <Github className="w-4 h-4" />;
  if (p.includes('twitter') || p.includes('x.com')) return <Twitter className="w-4 h-4" />;
  if (p.includes('linkedin')) return <Linkedin className="w-4 h-4" />;
  if (p.includes('facebook')) return <Facebook className="w-4 h-4" />;
  return <ArrowUpRight className="w-4 h-4" />;
};

export default function Footer() {
  const { config } = useSiteConfig();
  
  // State for the legal popups
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  // Content for the modals pulled directly from SiteConfig
  const policyContent = {
    terms: { title: 'Terms of Service', text: config.termsOfService || 'No Terms of Service have been provided yet.' },
    privacy: { title: 'Privacy Policy', text: config.privacyPolicy || 'No Privacy Policy has been provided yet.' },
    refund: { title: 'Refund Policy', text: config.refundPolicy || 'No Refund Policy has been provided yet.' },
  };

  return (
    <>
      <footer className="bg-bg-dark border-t border-border-subtle relative z-10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            
            {/* Left Column: Brand & Tagline */}
            <div className="md:col-span-5">
              <a href="#home" className="text-2xl font-black tracking-tighter text-text-main inline-block mb-4 hover:opacity-80 transition-opacity">
                {config.siteLogo ? (
                  <img src={config.siteLogo} alt={config.siteTitle} className="h-8 w-auto" />
                ) : (
                  <>
                    {config.siteTitle.replace('walid', '')}<span className="text-accent">walid</span>
                  </>
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

            {/* Right Column: Dynamic Footer Columns (Navigation & Contact) */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {config.footerColumns?.map((col, idx) => (
                <div key={idx}>
                  <h4 className="text-text-main font-bold mb-6">{col.title}</h4>
                  
                  {/* If it's the Navigation column, arrange items in a 2-column grid */}
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

          </div>

          {/* Bottom Bar: Copyright & Legal Policies */}
          <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              {config.copyrightText}
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
              <button onClick={() => setActivePolicy('terms')} className="text-text-muted hover:text-accent transition-colors">
                Terms of Service
              </button>
              <span className="text-white/10">•</span>
              <button onClick={() => setActivePolicy('privacy')} className="text-text-muted hover:text-accent transition-colors">
                Privacy Policy
              </button>
              <span className="text-white/10">•</span>
              <button onClick={() => setActivePolicy('refund')} className="text-text-muted hover:text-accent transition-colors">
                Refund Policy
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Popup Modal */}
      <AnimatePresence>
        {activePolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Dark Blur Overlay */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setActivePolicy(null)}
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-bg-card rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5">
                <h3 className="text-2xl font-black text-white">
                  {policyContent[activePolicy].title}
                </h3>
                <button
                  onClick={() => setActivePolicy(null)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="p-6 md:p-8 overflow-y-auto">
                <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
                  {policyContent[activePolicy].text}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
