import React, { useState, useEffect } from 'react';
import { Linkedin, Facebook, Github, Globe } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface FooterProps {
  portraitUrl?: string;
}

export default function Footer({ portraitUrl }: FooterProps) {
  const { config } = useSiteConfig();
  const [heroImage, setHeroImage] = useState('/input_file_0.png');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteConfig', 'hero'), (snapshot) => {
      if (snapshot.exists()) {
        setHeroImage(snapshot.data().heroImage || '/input_file_0.png');
      }
    });
    return () => unsub();
  }, []);

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('facebook')) return <Facebook className="w-4 h-4" />;
    if (p.includes('linkedin')) return <Linkedin className="w-4 h-4" />;
    if (p.includes('twitter') || p.includes('x.com')) {
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm1.161 17.52h1.833L7.045 4.126H5.078z"/>
        </svg>
      );
    }
    if (p.includes('github')) return <Github className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  // Get portrait path to use
  const activePortrait = config.footerPortrait || portraitUrl || heroImage;

  return (
    <footer className="w-full bg-bg-dark pt-12 pb-16 px-4 md:px-8 relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative rounded-3xl md:rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 p-8 sm:p-12 md:p-16 overflow-hidden">
        
        {/* Ambient Reddish-Orange Inner Background Glow */}
        <div 
          className="absolute rounded-full pointer-events-none -z-20 w-[300px] h-[300px] md:w-[600px] md:h-[600px] -bottom-[10%] -left-[10%] opacity-15" 
          style={{ 
            background: 'radial-gradient(circle, #f45901 0%, transparent 70%)',
            filter: 'blur(120px)' 
          }} 
        />
        <div 
          className="absolute rounded-full pointer-events-none -z-20 w-[250px] h-[250px] md:w-[450px] md:h-[450px] top-[-10%] right-[10%] opacity-[0.08]" 
          style={{ 
            background: 'radial-gradient(circle, #f45901 0%, transparent 70%)',
            filter: 'blur(100px)' 
          }} 
        />

        {/* Core Layout Grid */}
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch gap-12 lg:gap-20">
          
          {/* Left Column Complex: Headline & 3-Column Info Grid */}
          <div className="w-full lg:max-w-[65%] flex flex-col justify-between">
            
            {/* Top Left: Massive CTA Headline */}
            <div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-sans font-black tracking-tight text-white mb-12 md:mb-16 leading-[1.08]">
                Ready to Elevate <br />Your Brand?
              </h2>
            </div>

            {/* Bottom Left: 3-column Grid for existing info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-8 border-t border-white/10 pt-10 md:pt-12">
              
              {/* Column 1: Logo & Social Media platform circles */}
              <div className="flex flex-col justify-between gap-6 sm:gap-4">
                <div>
                  {config.siteLogo ? (
                    <img 
                      src={config.siteLogo} 
                      alt={config.siteTitle} 
                      className="h-8 w-auto object-contain mb-3" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="text-xl font-black tracking-tighter text-white mb-3">
                      {config.siteTitle === 'youknowwalid' ? (
                        <>youknowwalid<span className="text-[#f45901]">.</span></>
                      ) : (
                        config.siteTitle
                      )}
                    </div>
                  )}
                  <p className="text-xs text-text-muted italic max-w-[200px]">
                    Brand Developer & Designer crafting high-performance digital experiences.
                  </p>
                </div>
                
                {/* Social Icon Circles */}
                <div className="flex flex-wrap gap-2.5">
                  {config.socialLinks.filter(s => s.url && s.url.trim() !== '').map((s, idx) => (
                    <a 
                      key={idx} 
                      href={s.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#f45901] hover:text-black hover:border-[#f45901] transition-all hover:-translate-y-1 text-text-main"
                      title={s.platform}
                    >
                      {getSocialIcon(s.platform)}
                    </a>
                  ))}
                </div>
              </div>

              {/* Dynamic Columns 2 & 3 from config.footerColumns */}
              {config.footerColumns && config.footerColumns.map((col, idx) => (
                <div key={idx}>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#f45901] mb-5">
                    {col.title}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-text-muted">
                    {col.links && col.links.map((l, lIdx) => (
                      <li key={lIdx}>
                        {l.url && (l.url.startsWith('tel:') || l.url.startsWith('mailto:') || l.url === '#') ? (
                          <a href={l.url} className="hover:text-accent transition-colors block py-0.5 leading-relaxed break-all">
                            {l.label}
                          </a>
                        ) : (
                          <a href={l.url} className="hover:text-accent transition-colors block py-0.5 leading-relaxed">
                            {l.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            </div>

          </div>

          {/* Right Column Spacer for Portrait Visual Aspect */}
          <div className="hidden lg:block lg:w-[30%] shrink-0" />

        </div>

        {/* Absolute Bottom Right Portrait */}
        <div className="hidden lg:block absolute bottom-0 right-[4%] w-[32%] h-[112%] pointer-events-none z-10 overflow-hidden">
          <img 
            src={activePortrait} 
            alt="Walid Rahman Portrait" 
            className="absolute bottom-0 right-0 h-[100%] w-auto object-contain object-bottom select-none pointer-events-none filter drop-shadow-[0_15px_30px_rgba(244,89,1,0.12)] transition-transform duration-700 hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Tiny subtle copyright divider and footer text */}
        <div className="relative z-10 max-w-7xl mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[10px] uppercase tracking-widest text-text-muted/40 font-bold">
            {config.copyrightText}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-text-muted/20 font-bold">
            Designed to Inspire • Crafted to Perform
          </div>
        </div>

      </div>
    </footer>
  );
}
