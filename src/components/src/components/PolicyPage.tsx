import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, BadgePercent } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import Navbar from './Navbar';
import Footer from './Footer';

interface PolicyPageProps {
  type: 'terms' | 'privacy' | 'refund';
}

export default function PolicyPage({ type }: PolicyPageProps) {
  const { config } = useSiteConfig();

  const details = {
    terms: {
      title: 'Terms of Service',
      icon: <FileText className="w-8 h-8 text-accent" />,
      text: config.termsOfService || 'Terms of Service content is currently being updated.'
    },
    privacy: {
      title: 'Privacy Policy',
      icon: <ShieldCheck className="w-8 h-8 text-accent" />,
      text: config.privacyPolicy || 'Privacy Policy content is currently being updated.'
    },
    refund: {
      title: 'Refund Policy',
      icon: <BadgePercent className="w-8 h-8 text-accent" />,
      text: config.refundPolicy || 'Refund Policy content is currently being updated.'
    }
  };

  const currentPolicy = details[type];

  return (
    <div className="min-h-screen bg-bg-dark text-text-main selection:bg-accent/30 selection:text-text-main">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* Back navigation anchor */}
        <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-12 group text-sm font-bold">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Portfolio
        </Link>

        {/* Content Header Card */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="p-4 bg-accent/10 rounded-2xl">
            {currentPolicy.icon}
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{currentPolicy.title}</h1>
            <p className="text-xs text-text-muted uppercase tracking-widest mt-1">Official Document</p>
          </div>
        </div>

        {/* Dynamic Spacing Policy Block */}
        <div className="bg-bg-card border border-white/5 rounded-3xl p-8 md:p-10 shadow-xl">
          <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
            {currentPolicy.text}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
