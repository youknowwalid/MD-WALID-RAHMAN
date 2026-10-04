import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, RotateCcw } from 'lucide-react';
import { useSiteConfig, SiteConfig } from '../context/SiteConfigContext';
import Navbar from './Navbar';
import Footer from './Footer';
import Seo from './Seo';
import { DEFAULT_REFUND, DEFAULT_TERMS } from '../lib/defaults';

type PolicyKind = 'privacyPolicy' | 'termsOfService' | 'refundPolicy';

const META: Record<PolicyKind, { title: string; Icon: typeof ShieldCheck }> = {
  privacyPolicy: { title: 'Privacy Policy', Icon: ShieldCheck },
  termsOfService: { title: 'Terms of Service', Icon: FileText },
  refundPolicy: { title: 'Refund Policy', Icon: RotateCcw },
};

export default function PolicyPage({ kind }: { kind: PolicyKind }) {
  const { config } = useSiteConfig();
  const { title, Icon } = META[kind];
  const text = config[kind as keyof SiteConfig] as string;

  return (
    <div className="min-h-screen bg-bg-dark text-text-main selection:bg-accent/30 selection:text-text-main">
      <Seo title={title} description={`${title} for walidrahman.com.`} noindex={text === DEFAULT_TERMS || text === DEFAULT_REFUND} />
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-12 group text-sm font-bold">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          Back to Portfolio
        </Link>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="p-4 bg-accent/10 rounded-2xl"><Icon className="w-8 h-8 text-accent" aria-hidden="true" /></div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{title}</h1>
        </div>

        <div className="bg-bg-card border border-white/5 rounded-3xl p-6 md:p-10 shadow-xl">
          <div className="text-text-muted text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">{text}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
