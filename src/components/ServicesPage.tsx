import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { fetchPageExtras, type PageExtras } from '../lib/api';
import { cleanServices, paragraphsOf } from '../lib/services';
import Seo from './Seo';
import Navbar from './Navbar';
import Footer from './Footer';
import Photo from './Photo';
import NotFound from './NotFound';

/** Every service, each as a card with its picture that opens the service's own page (/services/...). All text comes from the admin. */
export default function ServicesPage() {
  const { config } = useSiteConfig();
  const services = useMemo(() => cleanServices(config.servicePages), [config.servicePages]);
  const [extras, setExtras] = useState<PageExtras | null>(null);
  useEffect(() => { fetchPageExtras('services').then(setExtras); }, []);

  if (services.length === 0) return <NotFound />;
  const heading = config.servicesHeading.trim() || 'Services';
  const intro = paragraphsOf(config.servicesIntro);

  return (
    <div className="home-v2 min-h-screen overflow-x-clip bg-bg-dark text-text-main relative z-10">
      <Seo title={extras?.title || heading} description={extras?.description || intro[0]} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:pb-32 md:pt-40">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="inline-flex min-h-11 items-center hover:text-text-main">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text-main">{heading}</li>
          </ol>
        </nav>

        <div className="mb-12 border-b border-border-subtle pb-12">
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight text-text-main md:text-6xl">{heading}</h1>
          {intro.map((p, i) => <p key={i} className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base [&:not(:first-of-type)]:mt-3">{p}</p>)}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <li key={s.id}>
              <Link
                to={`/services/${s.slug}`}
                className="home-on-dark group flex h-full flex-col rounded-[28px] bg-[#0d1117] p-2 text-white transition-transform hover:-translate-y-1"
              >
                {s.image && (
                  <Photo
                    src={s.image}
                    widths={[640, 1080]}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    alt={s.name}
                    width={1600}
                    height={1000}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="aspect-[16/10] w-full rounded-[22px] object-cover"
                  />
                )}
                <span className="flex flex-1 flex-col px-3 pb-4 pt-4">
                  <h2 className="text-lg font-medium tracking-tight">{s.name}</h2>
                  {s.summary && <span className="mt-1.5 block text-sm leading-snug text-white/80">{s.summary}</span>}
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-accent">
                    View service <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
