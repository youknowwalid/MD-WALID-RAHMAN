import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MotionConfig, m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight } from 'lucide-react';
import { getRow, listRows } from '../lib/api';
import { normalizeProject } from '../lib/schema-defaults';
import { safeUrl } from '../lib/text';
import { Project } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import NotFound from './NotFound';
import Seo from './Seo';
import ScrollFillText from './ScrollFillText';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CONTAINER = 'mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12';
const SECTION_TITLE = 'text-[clamp(2.4rem,5.2vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-text-main';

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: EASE },
};

const paragraphs = (text?: string) => (text || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);

/** Big title: every word slides up out of a mask. Only a transform is animated, so the text is painted at once. */
const Title = ({ text }: { text: string }) => {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <h1 className="text-[clamp(2.6rem,8.4vw,8rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-text-main break-words">
      {words.map((word, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' '}
          <span className="inline-block overflow-hidden align-bottom px-[0.05em] -mx-[0.05em] pb-[0.14em] -mb-[0.14em]">
            <m.span
              className="inline-block"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.08 * i }}
            >
              {word}
            </m.span>
          </span>
        </React.Fragment>
      ))}
    </h1>
  );
};

/** Cover image: paints at once, zooms in on load, then drifts slowly while scrolling. */
const Cover = ({ src, alt }: { src: string; alt: string }) => {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-7%', '7%']);
  return (
    <div ref={box} className="relative overflow-hidden rounded-[28px] md:rounded-[44px] aspect-[4/3] sm:aspect-[16/10] bg-bg-card">
      <m.div className="absolute inset-0" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: EASE }}>
        <m.img
          src={src}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          style={reduce ? undefined : { y, scale: 1.16 }}
        />
      </m.div>
    </div>
  );
};

/** Big title on the left, text on the right (lead sentence first, then body copy). */
const TextSection = ({ title, lead, body, titleClass }: { title: string; lead?: string; body: string[]; titleClass?: string }) => (
  <m.section {...fadeUp} className="grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16">
    <h2 className={`${SECTION_TITLE} ${titleClass ?? ''}`}>{title}</h2>
    <div className="max-w-3xl">
      {lead && <p className="text-xl sm:text-2xl lg:text-[1.75rem] leading-[1.45] font-medium text-text-main">{lead}</p>}
      {body.map((t, i) => (
        <p key={i} className={`whitespace-pre-line text-lg leading-[1.75] text-text-muted ${lead || i > 0 ? 'mt-6' : ''}`}>{t}</p>
      ))}
    </div>
  </m.section>
);

/** Rows of two images, alternating wide/narrow; an odd last image spans the full width. */
const ImageGrid = ({ images, title }: { images: string[]; title: string }) => {
  const rows: string[][] = [];
  for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2));
  const cell = 'group relative overflow-hidden rounded-[24px] md:rounded-[32px] bg-bg-card';
  const height = 'aspect-[4/5] md:aspect-auto md:h-[clamp(300px,36vw,620px)]';
  return (
    <div className="grid gap-5 md:gap-6">
      {rows.map((row, r) =>
        row.length === 1 ? (
          <m.div key={r} {...fadeUp} className={`${cell} aspect-[16/10]`}>
            <img src={row[0]} alt={`${title} ${r * 2 + 1}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
          </m.div>
        ) : (
          <div key={r} className={`grid gap-5 md:gap-6 ${r % 2 === 0 ? 'md:grid-cols-[1fr_1.4fr]' : 'md:grid-cols-[1.4fr_1fr]'}`}>
            {row.map((src, c) => (
              <m.div
                key={c}
                initial={fadeUp.initial}
                whileInView={fadeUp.whileInView}
                viewport={fadeUp.viewport}
                transition={{ ...fadeUp.transition, delay: c * 0.12 }}
                className={`${cell} ${height}`}
              >
                <img src={src} alt={`${title} ${r * 2 + c + 1}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              </m.div>
            ))}
          </div>
        ),
      )}
    </div>
  );
};

const BackToTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-black/40 transition-all duration-300 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Sibling projects (same ordering as the listing) for prev / next navigation
  useEffect(() => {
    listRows('projects').then((rows) => { if (rows) setAllProjects(rows.map(normalizeProject)); });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const row = projectId ? await getRow('projects', projectId) : null;
      if (cancelled) return;
      setProject(row ? normalizeProject(row) : null);
      setLoading(false);
    })();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center" role="status" aria-label="Loading">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!project) return <NotFound />;

  const projectPath = (p: Project) => `/projects/${p.slug || p.id}`;

  const [lead, ...introRest] = paragraphs(project.content);
  const solution = paragraphs(project.detailsContent);
  const cover = project.heroImage || project.image;
  const gallery = (project.gallery || []).filter(Boolean);
  const tags = (project.tags || []).filter(Boolean);
  const liveSite = safeUrl(project.link) && project.link !== '#' ? safeUrl(project.link) : '';

  const details = [
    { label: 'Client', value: project.client },
    { label: 'Industries', value: project.industry || project.category },
    { label: 'Services', value: project.services },
    { label: 'Date', value: project.startDate },
    { label: 'Designer', value: project.designer },
    { label: 'Live site', value: liveSite ? 'Visit website' : '', href: liveSite },
  ].filter((d) => d.value);

  const hasFeedback = Boolean(project.feedbackQuote?.trim());
  const ctaUrl = safeUrl(project.ctaButtonUrl) || '/#contact';
  const ctaText = project.ctaButtonText || 'Contact Us';
  const ctaClass = 'group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
  const ctaInner = (
    <>
      {ctaText}
      <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </>
  );

  const currentIndex = allProjects.findIndex((p) => p.id === project.id || (!!p.slug && p.slug === project.slug));
  const hasSiblings = currentIndex !== -1 && allProjects.length > 1;
  const prev = hasSiblings ? allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length] : null;
  const next = hasSiblings ? allProjects[(currentIndex + 1) % allProjects.length] : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-bg-dark overflow-x-clip selection:bg-accent/30">
        <Seo
          title={project.socialTitle || project.title}
          description={project.socialDescription || project.summary || lead}
          image={project.socialImage || project.heroImage || project.image}
        />
        <Navbar />

        <main className="relative z-10">
          <div className={`${CONTAINER} pt-28 sm:pt-32`}>
            {/* 1. Back link */}
            <Link to="/#projects" className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              All Projects <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {/* 2. Title */}
            <div className="mt-6 sm:mt-8"><Title text={project.title} /></div>

            {/* Intro, details, tags and cover share one block so the tag column can stay in view beside them */}
            <div className="relative mt-8 sm:mt-12">
              {tags.length > 0 && (
                <aside aria-label="Tags" className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full lg:block">
                  <ul className="sticky top-28 flex flex-col items-end gap-3">
                    {tags.map((t) => (
                      <li key={t} className="rounded-full border border-white/25 bg-bg-dark/70 px-4 py-1.5 text-sm text-text-main backdrop-blur-md">{t}</li>
                    ))}
                  </ul>
                </aside>
              )}

              {/* 3. Intro */}
              {project.summary && <p className="max-w-xl text-lg leading-relaxed text-text-muted sm:text-xl">{project.summary}</p>}

              {/* 4. Details */}
              {details.length > 0 && (
                <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-7">
                  {details.map((d) => (
                    <div key={d.label}>
                      <dt className="text-sm text-text-muted">{d.label}</dt>
                      <dd className="mt-1 text-base font-medium text-text-main sm:text-lg [overflow-wrap:anywhere]">
                        {d.href ? <a href={d.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-accent">{d.value}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a> : d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {/* 5. Tags on small screens */}
              {tags.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-2.5 lg:hidden" aria-label="Tags">
                  {tags.map((t) => (
                    <li key={t} className="rounded-full border border-white/25 px-4 py-1.5 text-sm text-text-main">{t}</li>
                  ))}
                </ul>
              )}

              {/* 6. Cover */}
              {cover && (
                <div className="mt-10 sm:mt-14">
                  <Cover src={cover} alt={project.title} />
                </div>
              )}
            </div>
          </div>

          <div className={`${CONTAINER} mt-20 sm:mt-28 grid gap-20 sm:gap-28`}>
            {/* 7. Challenge */}
            {lead && <TextSection title={project.introTitle || 'Challenge'} lead={lead} body={introRest} />}

            {/* 8. Image grid */}
            {gallery.length > 0 && <ImageGrid images={gallery} title={project.title} />}

            {/* 9. Solution */}
            {solution.length > 0 && <TextSection title={project.detailsTitle || 'Solution'} body={solution} />}

            {/* 10. Feedback */}
            {hasFeedback && (
              <m.section {...fadeUp} className="grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16">
                <h2 className={`${SECTION_TITLE} max-w-[9ch]`}>Client&apos;s feedback</h2>
                <div className="max-w-3xl">
                  <blockquote className="whitespace-pre-line text-xl leading-[1.5] text-text-main sm:text-2xl lg:text-[1.75rem]">{project.feedbackQuote}</blockquote>
                  {(project.feedbackName || project.feedbackRole) && (
                    <div className="mt-8">
                      {project.feedbackName && <p className="text-xl font-semibold text-text-main">{project.feedbackName}</p>}
                      {project.feedbackRole && <p className="mt-1 text-sm text-text-muted">{project.feedbackRole}</p>}
                    </div>
                  )}
                </div>
              </m.section>
            )}
          </div>

          {/* 11. Prev / next */}
          {prev && next && (
            <div className={`${CONTAINER} mt-20 sm:mt-28`}>
              <nav aria-label="Project navigation" className="grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2 sm:gap-8">
                <Link to={projectPath(prev)} className="group min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                  <span className="flex items-center gap-2 text-sm text-text-muted"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />Prev</span>
                  <span className="mt-3 block text-[clamp(1.5rem,3vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em] text-text-main transition-colors group-hover:text-accent">{prev.title}</span>
                </Link>
                <Link to={projectPath(next)} className="group min-w-0 sm:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                  <span className="flex items-center gap-2 text-sm text-text-muted sm:justify-end">Next<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                  <span className="mt-3 block text-[clamp(1.5rem,3vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em] text-text-main transition-colors group-hover:text-accent">{next.title}</span>
                </Link>
              </nav>
            </div>
          )}

          {/* 12. Closing call to action */}
          <div className={`${CONTAINER} mt-20 sm:mt-28 pb-20 sm:pb-28`}>
            <m.section {...fadeUp} className="relative isolate overflow-hidden rounded-[32px] bg-bg-card px-6 py-16 sm:rounded-[44px] sm:px-14 sm:py-24 lg:py-28">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[url('/bg-grid.svg')] bg-cover bg-center opacity-60" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[420px] w-[420px] rounded-full bg-accent opacity-40 blur-[110px]" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-[360px] w-[360px] rounded-full bg-white opacity-[0.07] blur-[100px]" />
              <ScrollFillText
                as="h2"
                text={project.ctaTitle || "Let's talk about your project!"}
                className="max-w-4xl text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-text-main"
              />
              <div className="mt-10">
                {ctaUrl.startsWith('/') ? (
                  <Link to={ctaUrl} className={ctaClass}>{ctaInner}</Link>
                ) : (
                  <a href={ctaUrl} className={ctaClass}>{ctaInner}</a>
                )}
              </div>
            </m.section>
          </div>
        </main>

        <Footer />
        <BackToTop />
      </div>
    </MotionConfig>
  );
}
