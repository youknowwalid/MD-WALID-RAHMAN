import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { fetchPageExtras, type PageExtras } from '../lib/api';
import { cleanServices, paragraphsOf } from '../lib/services';
import { safeUrl } from '../lib/text';
import Seo from './Seo';
import Navbar from './Navbar';
import Footer from './Footer';
import Photo from './Photo';
import NotFound from './NotFound';

const Cta = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) =>
  href.startsWith('/') && !href.startsWith('/#')
    ? <Link to={href} className={className}>{children}</Link>
    : <a href={href} className={className} {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;

/** One service's own page (/services/<name>): headline, intro, picture, what is included, how it works, questions and answers. */
export default function ServiceDetail() {
  const { slug = '' } = useParams();
  const { config } = useSiteConfig();
  const service = useMemo(() => cleanServices(config.servicePages).find((s) => s.slug === slug) || null, [config.servicePages, slug]);
  const [extras, setExtras] = useState<PageExtras | null>(null);
  useEffect(() => { setExtras(null); if (service) fetchPageExtras(`service:${service.id}`).then(setExtras); }, [service?.id]);

  if (!service) return <NotFound />;

  const phoneDigits = config.officePhone.replace(/[^0-9+]/g, '');
  const ctaHref = safeUrl(service.ctaUrl) || safeUrl(config.globalCtaUrl) || (phoneDigits ? `https://wa.me/${phoneDigits.replace(/^\+/, '')}` : '/#contact');
  const ctaText = service.ctaButton || 'Get in touch';
  const intro = paragraphsOf(service.intro);
  const heading = config.servicesHeading.trim() || 'Services';
  const showWork = config.projectsHidden === false;

  return (
    <div className="home-v2 min-h-screen overflow-x-clip bg-bg-dark text-text-main relative z-10">
      <Seo
        title={extras?.title || service.headline || service.name}
        description={extras?.description || service.summary || intro[0]}
        image={service.image}
      />
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:pb-32 md:pt-40">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="inline-flex min-h-11 items-center hover:text-text-main">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/services" className="inline-flex min-h-11 items-center hover:text-text-main">{heading}</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text-main">{service.name}</li>
          </ol>
        </nav>

        <div className={`grid items-center gap-10 ${service.image ? 'lg:grid-cols-2' : ''}`}>
          <div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-text-main md:text-6xl">{service.headline || service.name}</h1>
            <div className="mt-5 space-y-3">
              {intro.map((p, i) => <p key={i} className="max-w-xl text-base leading-relaxed text-text-muted">{p}</p>)}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Cta href={ctaHref} className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-[#0d1117] transition-transform hover:-translate-y-0.5">{ctaText}</Cta>
              {showWork && <Link to="/projects" className="inline-flex min-h-11 items-center rounded-full border border-[#0d1117]/30 px-6 text-sm font-medium text-text-main transition-colors hover:bg-white">See related work</Link>}
            </div>
          </div>
          {service.image && (
            <Photo
              src={service.image}
              widths={[640, 1080, 1600]}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt={service.name}
              width={1600}
              height={1000}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="aspect-[16/10] w-full rounded-[28px] object-cover"
            />
          )}
        </div>

        {extras?.tldr && (
          <p className="mt-12 max-w-3xl rounded-3xl border border-border-subtle bg-bg-card p-6 text-base leading-relaxed text-text-main">{extras.tldr}</p>
        )}

        {service.included.length > 0 && (
          <section aria-labelledby="included" className="home-on-dark mt-12 rounded-[28px] bg-[#0d1117] p-6 md:rounded-[36px] md:p-10">
            <h2 id="included" className="text-2xl font-medium tracking-tight md:text-3xl">What is included</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {service.included.map((item) => (
                <li key={item} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {service.steps.length > 0 && (
          <section aria-labelledby="how" className="mt-14">
            <h2 id="how" className="text-2xl font-medium tracking-tight text-text-main md:text-3xl">How it works</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {service.steps.map((st, i) => (
                <li key={st.title} className="rounded-3xl border border-border-subtle bg-white p-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Step {i + 1}</span>
                  <h3 className="mt-2 text-lg font-medium tracking-tight text-text-main">{st.title}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-text-muted">{st.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {extras && extras.faq.length > 0 && (
          <section aria-labelledby="faq" className="mt-14 max-w-3xl">
            <h2 id="faq" className="text-2xl font-medium tracking-tight text-text-main md:text-3xl">Questions and answers</h2>
            <div className="mt-5 border-b border-border-subtle">
              {extras.faq.map((f) => (
                <details key={f.question} className="group border-t border-border-subtle">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium text-text-main [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-5 text-sm leading-relaxed text-text-muted">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {service.ctaTitle && (
          <section className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[28px] bg-accent p-6 text-[#0d1117] md:flex-row md:items-center md:p-8">
            <h2 className="text-xl font-medium tracking-tight md:text-2xl">{service.ctaTitle}</h2>
            <Cta href={ctaHref} className="inline-flex min-h-11 items-center rounded-full bg-[#0d1117] px-6 text-sm font-medium text-white">{ctaText}</Cta>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
