import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { m, useInView, useReducedMotion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUpRight, ArrowUp, Loader2,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { fetchHomeFaq, listRows, submitContact } from '../lib/api';
import { backendConfigured } from '../lib/config';
import { DEFAULT_SECTION_TITLES, FALLBACK_RESUME } from '../lib/defaults';
import {
  normalizeProject, normalizeBlogPost,
  normalizeTestimonial, normalizeResumeItem,
} from '../lib/schema-defaults';
import { safeUrl } from '../lib/text';
import { useProducts } from '../lib/products';
import { useSiteConfig } from '../context/SiteConfigContext';
import { Project, BlogPost, Testimonial, ResumeItem } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import { RichClamp, RichText } from './RichText';
import Photo from './Photo';
import CareerTimeline from './CareerTimeline';
import ResourcesSection from './ResourcesSection';
import Seo from './Seo';
import ProjectsLocked from './ProjectsLocked';
import TeamDeck from './TeamDeck';
import AutoCarousel from './AutoCarousel';
import Capabilities from './Capabilities';
import { chipLinks, cleanServices } from '../lib/services';
import WorkWithMe from './WorkWithMe';
import ContactFaq from './ContactFaq';
import type { FaqItem } from '../lib/discovery';

const EASE = [0.2, 0.8, 0.2, 1] as const;

const youtubeId = (url: string): string => {
  const m =
    /youtu\.be\/([\w-]{11})/.exec(url) ||
    /youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)([\w-]{11})/.exec(url);
  return m ? m[1] : '';
};

const VideoPlayer = ({ url }: { url: string }) => {
  const id = youtubeId(url);
  if (id) {
    return (
      <div className="home-sheen relative aspect-video w-full overflow-hidden rounded-[32px] bg-neutral-900 shadow-[0_40px_70px_-35px_rgba(13,17,23,0.5)]">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
          title="Introductory video"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <FileVideo url={url} />;
};

/** Plays an uploaded video file and tells the visitor if the browser can only play its sound (unsupported video format). */
const FileVideo = ({ url }: { url: string }) => {
  const src = safeUrl(url);
  const [noPicture, setNoPicture] = useState(false);
  if (!src) return null;
  return (
    <div className="home-sheen relative aspect-video w-full overflow-hidden rounded-[32px] bg-neutral-900 shadow-[0_40px_70px_-35px_rgba(13,17,23,0.5)]">
      <video
        className="h-full w-full bg-black object-contain"
        src={src}
        controls
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => setNoPicture(e.currentTarget.videoWidth === 0)}
        onError={() => setNoPicture(true)}
      >
        Your browser does not support the video tag.
      </video>
      {noPicture && (
        <p role="alert" className="absolute inset-x-4 top-4 z-10 rounded-xl bg-black/80 p-3 text-center text-xs text-white">
          This browser can&apos;t display this video&apos;s picture (unsupported video format).
        </p>
      )}
    </div>
  );
};

type RevealFrom = 'up' | 'left' | 'right' | 'zoom';
const OFFSET: Record<RevealFrom, { opacity: number; x?: number; y?: number; scale?: number }> = {
  up: { opacity: 0, y: 28 },
  left: { opacity: 0, x: -40 },
  right: { opacity: 0, x: 40 },
  zoom: { opacity: 0, scale: 0.94 },
};

/** Brings a block into place the first time it is scrolled into view.
    `key` is declared through React.Attributes because several of these sit in lists. */
const Reveal = ({ children, delay = 0, className, from = 'up' }: {
  children: React.ReactNode; delay?: number; className?: string; from?: RevealFrom;
} & React.Attributes) => (
  <m.div
    initial={OFFSET[from]}
    whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.7, delay, ease: EASE }}
    className={className}
  >
    {children}
  </m.div>
);

/** The unit ("Yrs") belongs with the label underneath, so every number is the same size. */
const statLabel = (stat: { unit?: string; label: string }) => {
  const unit = (stat.unit || '').trim();
  if (!unit) return stat.label;
  return `${/^yrs?\.?$/i.test(unit) ? 'Years' : unit} ${stat.label}`;
};

const EmptyNote = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[32px] border border-dashed border-border-subtle px-6 py-16 text-center text-text-muted">{children}</div>
);

/** Counts a figure up the first time it is seen. The written value stays in the page for
    screen readers, so nobody has to listen to it climb. */
const CountText = ({ raw, duration = 1500 }: { raw: string; duration?: number }) => {
  const parsed = /^(\d[\d,]*)([\s\S]*)$/.exec(String(raw).trim());
  const target = parsed ? Number(parsed[1].replace(/,/g, '')) : 0;
  const suffix = parsed ? parsed[2] : '';
  // Counting 0, 1 is not worth watching, so small figures simply appear.
  const animated = Boolean(parsed) && target >= 3;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);

  // Every dependency here is a primitive on purpose: the match object is rebuilt on each
  // render, so holding it would restart the count every time the figure ticked over.
  useEffect(() => {
    if (!animated || reduceMotion) { setShown(target); return; }
    if (!inView) return;
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 4))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration, reduceMotion, animated]);

  if (!parsed) return <>{raw}</>;
  return (
    <>
      <span className="sr-only">{raw}</span>
      <span ref={ref} aria-hidden="true">{shown.toLocaleString('en-US')}{suffix}</span>
    </>
  );
};

const Typewriter = ({ text }: { text: string }) => {
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(reduceMotion ? text : '');
  const [isComplete, setIsComplete] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) { setDisplayText(text); setIsComplete(true); return; }
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [text, reduceMotion]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText}
        {/* The cursor takes no net width (-mr cancels ml + w), and the not-yet-typed letters are laid out but invisible,
            so the heading has its final size and line breaks from the first paint and nothing below it jumps. */}
        <m.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'steps(2)' }}
          className={cn('-mb-1 -mr-[7px] ml-1 inline-block h-[0.9em] w-[3px] bg-accent', isComplete && 'hidden')}
        />
        <span className="invisible">{text.slice(displayText.length)}</span>
      </span>
    </>
  );
};

const Avatar = ({ src, name, className }: { src: string; name: string; className?: string }) =>
  src ? (
    <img src={src} alt="" className={cn('rounded-full object-cover', className)} referrerPolicy="no-referrer" loading="lazy" />
  ) : (
    <div className={cn('flex items-center justify-center rounded-full bg-[#0d1117] font-semibold text-white', className)} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );

const MIN_FILL_MS = 3000;

/** Home-page lists. Cards only need a few columns, so the long article/case-study text is not downloaded here. */
const loadHomeData = () => Promise.all([
  listRows('projects', ['id', 'slug', 'title', 'category', 'image', 'published']),
  // Only the newest few: the full list lives on the /articles page, so the home page stays small however many are published.
  listRows('blogPosts', ['id', 'slug', 'title', 'date', 'excerpt', 'image'], 5),
  listRows('resume'),
  listRows('testimonials'),
]);

// Started as soon as the script loads (when the visit begins on the home page), in parallel with the settings
// request, instead of waiting for the page to render first.
const prefetched: { at: number; data: ReturnType<typeof loadHomeData> } | null =
  typeof window !== 'undefined' && window.location.pathname === '/' ? { at: Date.now(), data: loadHomeData() } : null;
const takeHomeData = () => (prefetched && Date.now() - prefetched.at < 10_000 ? prefetched.data : loadHomeData());

export default function Home() {
  const { config, hero, seoConfig } = useSiteConfig();
  const { products } = useProducts();
  const reduceMotion = useReducedMotion();

  const [projects, setProjects] = useState<Project[]>([]);
  // Built-in content is only for sites with no database; with one, nothing is shown until the real content arrives.
  const [loaded, setLoaded] = useState(!backendConfigured);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [resume, setResume] = useState<ResumeItem[]>(backendConfigured ? [] : FALLBACK_RESUME);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [faq, setFaq] = useState<FaqItem[]>([]);
  useEffect(() => { fetchHomeFaq().then(setFaq); }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error' | 'limited' | 'mailto'>('idle');
  const formShownAt = useRef(Date.now());

  // The first screen is drawn first; the sections below it are added in three quick steps right afterwards
  // (all at once if the visitor scrolls or taps, or arrives at a #section link). Same page, same look: it only
  // keeps the browser from building the whole long page before it can show the first screen.
  const { hash } = useLocation();
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= 3) return;
    if (hash) { setStage(3); return; }
    const later: (cb: () => void, o?: { timeout: number }) => number =
      window.requestIdleCallback ? (cb, o) => window.requestIdleCallback(cb, o) : (cb) => window.setTimeout(cb, 150);
    const id = later(() => setStage((n) => Math.min(3, n + 1)), { timeout: 600 });
    const all = () => setStage(3);
    const events = ['scroll', 'touchstart', 'pointerdown', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, all, { once: true, passive: true }));
    return () => {
      (window.cancelIdleCallback || window.clearTimeout)(id);
      events.forEach((e) => window.removeEventListener(e, all));
    };
  }, [stage, hash]);

  const progressRef = useRef<HTMLDivElement>(null);
  const toTopRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [proj, blog, res, test] = await takeHomeData();
      if (cancelled) return;
      // null = no backend / unreachable: show built-in content. [] = the owner removed everything on purpose.
      if (proj) setProjects(proj.map(normalizeProject));
      if (blog) setBlogPosts(blog.map(normalizeBlogPost));
      setResume(res ? res.map(normalizeResumeItem) : FALLBACK_RESUME);
      if (test) setTestimonials(test.map(normalizeTestimonial));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // The home page is the one light page. The marker is also set in index.html before the first paint;
  // setting it here as well covers arriving from another page without a reload, and clears it on the way out.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const previousColor = meta?.getAttribute('content') ?? '';
    root.setAttribute('data-home', '');
    meta?.setAttribute('content', '#2a6aa3');
    return () => {
      root.removeAttribute('data-home');
      if (meta && previousColor) meta.setAttribute('content', previousColor);
    };
  }, []);

  // Everything that follows the scroll position: the progress bar, the back-to-top button,
  // the résumé line filling, and the clouds drifting a little slower than the page.
  useEffect(() => {
    const clouds = Array.from(document.querySelectorAll<HTMLElement>('.home-hero .home-cloud'));
    const update = () => {
      const y = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;

      if (progressRef.current) progressRef.current.style.width = `${scrollable > 0 ? (y / scrollable) * 100 : 0}%`;
      toTopRef.current?.classList.toggle('is-on', y > 900);

      // `translate` rather than `transform`, so the clouds keep their own drifting animation.
      if (!reduceMotion && y < window.innerHeight * 1.5) {
        for (const cloud of clouds) {
          const depth = Number(cloud.dataset.depth || 0);
          cloud.style.translate = `0 ${((y * depth) / 100).toFixed(1)}px`;
        }
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [reduceMotion]);

  // A soft light follows the pointer across the cards, the main buttons lean towards it,
  // and nothing else moves with it.
  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const target = e.target as HTMLElement | null;

      const card = target?.closest?.('.home-card') as HTMLElement | null;
      if (card) {
        const box = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - box.left}px`);
        card.style.setProperty('--my', `${e.clientY - box.top}px`);
      }

      const magnet = target?.closest?.('.home-mag') as HTMLElement | null;
      if (magnet) {
        const box = magnet.getBoundingClientRect();
        const x = (e.clientX - box.left - box.width / 2) * 0.16;
        const y = (e.clientY - box.top - box.height / 2) * 0.26 - 2;
        magnet.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    };
    const onOut = (e: PointerEvent) => {
      const magnet = (e.target as HTMLElement | null)?.closest?.('.home-mag') as HTMLElement | null;
      if (magnet && !magnet.contains(e.relatedTarget as Node)) magnet.style.transform = '';
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onOut);
    };
  }, [reduceMotion]);

  const title = (key: string) => (config.sectionTitles?.[key] || '').trim() || DEFAULT_SECTION_TITLES[key] || '';
  // A long headline (a full sentence) is set smaller so the line under it and the buttons stay on the first screen.
  const heroLong = `${title('heroGreeting')} ${title('heroName')}`.length > 32;
  const capabilityGroups = (config.capabilityGroups || [])
    .map((g) => ({ name: (g.name || '').trim(), short: (g.short || '').trim(), items: (g.items || []).map((x) => (x || '').trim()).filter(Boolean) }))
    .filter((g) => g.name && g.items.length > 0);
  const homeAccent = /^#[0-9a-fA-F]{6}$/.test(config.homeAccent || '') ? config.homeAccent : '';
  const phoneDigits = config.officePhone.replace(/[^0-9+]/g, '');
  const ctaHref = safeUrl(config.globalCtaUrl) || (phoneDigits ? `https://wa.me/${phoneDigits.replace(/^\+/, '')}` : '/#contact');
  const ctaExternal = /^https?:/i.test(ctaHref);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    // Spam traps: a hidden field real people never fill in, and a form that was submitted too fast.
    if (fd.get('website') || Date.now() - formShownAt.current < MIN_FILL_MS) {
      setFormStatus('success');
      form.reset();
      return;
    }
    const data = {
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      subject: String(fd.get('subject') || '').trim(),
      message: String(fd.get('message') || '').trim(),
    };
    setIsSubmitting(true);
    setFormStatus('idle');
    const result = await submitContact(data);
    setIsSubmitting(false);
    if (result === 'sent') {
      setFormStatus('success');
      form.reset();
      formShownAt.current = Date.now();
    } else if (result === 'unavailable') {
      // No database connected: fall back to the visitor's e-mail app.
      const body = `${data.message}\n\n— ${data.name} (${data.email})`;
      setFormStatus('mailto');
      window.location.href = `mailto:${config.contactEmail}?subject=${encodeURIComponent(data.subject || 'Website enquiry')}&body=${encodeURIComponent(body)}`;
    } else {
      setFormStatus(result === 'rate-limited' ? 'limited' : 'error');
    }
  };

  const aboutVideo = config.aboutVideoUrl.trim();
  const statusMessages: Record<string, { text: string; cls: string }> = {
    success: { text: 'Thank you! Your message has been sent.', cls: 'text-[#15803d]' },
    mailto: { text: 'Your e-mail app should open with your message ready to send.', cls: 'text-[#15803d]' },
    limited: { text: 'You have sent several messages recently. Please try again in a little while.', cls: 'text-[#b91c1c]' },
    error: { text: 'Something went wrong. Please try again, or e-mail me directly.', cls: 'text-[#b91c1c]' },
  };

  // The places he has worked, taken from the résumé he keeps in the admin.
  const workedWith = Array.from(new Set(resume.map((r) => r.company).filter(Boolean)));
  // Real logos uploaded in the admin replace the plain names. Each half of the loop is repeated until it
  // is wider than any screen, so the strip never shows a gap.
  const clientLogos = (config.clientLogos || []).filter((l) => l && l.image && !l.hidden);
  const logoHalf = clientLogos.length ? Array.from({ length: Math.ceil(14 / clientLogos.length) }, () => clientLogos).flat() : [];

  const featuredProject = projects[0];
  const guide = products[0];
  // The side column holds the premium guide and the current focus, as in the design. With no
  // products published, the next project takes the guide's place so the column is never half empty.
  const sideProject = guide ? undefined : projects[1];
  const remainingProjects = projects.slice(guide ? 1 : 2);

  return (
    <div
      className="home-v2 relative min-h-screen overflow-x-hidden bg-bg-dark selection:bg-accent/50 selection:text-[#0d1117]"
      style={homeAccent ? ({ '--color-accent': homeAccent } as React.CSSProperties) : undefined}
    >
      <Seo />
      <div className="home-progress" ref={progressRef} aria-hidden="true" />
      <Navbar />
      <main className="relative z-10">

        {/* HERO SECTION */}
        <section
          id="home"
          className="home-hero relative flex min-h-[760px] items-end overflow-hidden px-6 pt-28 md:pt-32 lg:min-h-[max(900px,100vh)]"
        >
          <div className="home-cloud home-cloud--a bottom-[20%] left-[-140px] h-[220px] w-[680px]" data-depth="26" aria-hidden="true" />
          <div className="home-cloud home-cloud--b bottom-[30%] right-[-180px] h-[260px] w-[820px]" data-depth="-34" aria-hidden="true" />
          <div className="home-cloud home-cloud--c left-[36%] top-[26%] h-[150px] w-[460px] opacity-40" data-depth="18" aria-hidden="true" />

          <div className="mx-auto grid w-full max-w-7xl items-end gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
            <div className="relative z-10 min-w-0 pb-4 text-center lg:pb-44 lg:text-left">
              <h1 className={`${heroLong ? 'text-[clamp(1.9rem,5vw,3.9rem)]' : 'text-[clamp(2.6rem,8vw,6.2rem)]'} font-medium leading-[1.06] tracking-[-0.04em] text-white`}>
                {title('heroGreeting')} <br />
                <span className="text-white/65">
                  <Typewriter text={title('heroName')} />
                </span>
              </h1>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="mx-auto mt-7 max-w-xl text-lg font-light leading-relaxed text-text-muted md:text-[21px] lg:mx-0"
              >
                {config.brandTagline}
              </m.p>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58, duration: 0.6, ease: EASE }}
                className="mx-auto mt-9 flex max-w-[22rem] flex-col items-stretch justify-center gap-3 min-[480px]:max-w-none min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:gap-4 lg:mx-0 lg:justify-start"
              >
                <a
                  href={ctaHref}
                  {...(ctaExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="home-btn home-mag bg-accent min-h-[52px] px-7 py-3.5 text-[16px] text-[#0d1117] shadow-[0_14px_24px_-12px_rgba(0,0,0,0.55)] md:text-[17px]"
                >
                  {config.heroCtaText || config.globalCtaText}
                  <span className="home-arrow" aria-hidden="true">↗</span>
                </a>
                {config.heroSecondaryText && (
                  <a
                    href="/#projects"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/40 px-7 py-3.5 text-[16px] font-medium text-white transition-colors hover:bg-white/15 md:text-[17px]"
                  >
                    {config.heroSecondaryText}
                  </a>
                )}
              </m.div>

              {config.heroStats.length > 0 && (
                <m.dl
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.72, duration: 0.6, ease: EASE }}
                  className="mt-12 hidden grid-cols-3 gap-5 border-t border-white/25 pt-8 md:mt-14 md:gap-8 lg:grid"
                >
                  {config.heroStats.map((stat, i) => (
                    <div key={i}>
                      <dd className="text-[26px] font-semibold tracking-[-0.03em] text-white md:text-[42px]">
                        <CountText raw={stat.value} />
                      </dd>
                      <dt className="mt-2 text-[9px] uppercase leading-tight tracking-[0.16em] text-white/85 md:text-[11px]">{statLabel(stat)}</dt>
                    </div>
                  ))}
                </m.dl>
              )}
            </div>

            <m.div
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative z-[1] flex min-w-0 justify-center lg:justify-end"
            >
              <div className="relative aspect-[4/5] w-[min(100%,440px)] md:w-[540px] lg:w-[min(108%,620px)]">
                {/* The cut-out stands straight on the sky; the clouds in front of the lower body
                    (home-cloud-front) are what blend it in. */}
                <picture>
                  {/* Visitors who ask their device for less motion get the still portrait (built-in portrait only). */}
                  {!hero.heroPortrait && <source media="(prefers-reduced-motion: reduce)" srcSet="/walid-cutout.webp" />}
                  <img
                    src={hero.heroPortrait || '/walid-hero-animated-v2.webp'}
                    alt={`Portrait of ${seoConfig.siteName}`}
                    width={362}
                    height={482}
                    fetchPriority="high"
                    decoding="async"
                    className="home-cutout absolute inset-0 h-full w-full object-contain object-bottom"
                  />
                </picture>

              </div>
            </m.div>
          </div>

          {/* Clouds in front of the figure's lower body, melting into the white below the hero. */}
          <div className="home-cloud-front" aria-hidden="true">
            <i className="home-cloud-front__a" />
            <i className="home-cloud-front__b" />
            <i className="home-cloud-front__c" />
          </div>

          {config.heroStats.length > 0 && (
            <div className="absolute inset-x-6 bottom-[84px] z-[3] md:bottom-[112px] lg:hidden">
              <dl className="mx-auto grid max-w-md grid-cols-3 gap-3 text-center">
                {config.heroStats.map((stat, i) => (
                  <div key={i}>
                    <dd className="text-[24px] font-semibold tracking-[-0.03em] text-[#0d1117]">
                      <CountText raw={stat.value} />
                    </dd>
                    <dt className="mt-0.5 text-[12px] leading-tight text-[#4a5361]">{statLabel(stat)}</dt>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {(logoHalf.length > 0 || workedWith.length > 2) && (
            <div className="absolute inset-x-0 bottom-3 z-[3] md:bottom-7">
              <p className="text-center text-[13px] text-[#4a5361] md:text-[15px]">{title('teams')}</p>
              <div className="home-marquee mt-2 md:mt-4">
                {logoHalf.length > 0 ? (
                  <div className="home-marquee-row flex w-max items-center gap-10 md:gap-14" style={{ animationDuration: `${Math.max(24, Math.round(logoHalf.length * 4.3))}s` }}>
                    {[...logoHalf, ...logoHalf].map((logo, i) => {
                      const copy = i >= logoHalf.length;
                      const link = safeUrl(logo.url);
                      const img = (
                        <img
                          src={logo.image}
                          alt={copy ? '' : logo.name}
                          decoding="async"
                          draggable={false}
                          className="block h-6 w-auto max-w-[132px] object-contain md:h-[28.5px] md:max-w-[150px]"
                          referrerPolicy="no-referrer"
                        />
                      );
                      return link ? (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" aria-label={logo.name} aria-hidden={copy ? 'true' : undefined} tabIndex={copy ? -1 : undefined} className="shrink-0">{img}</a>
                      ) : (
                        <span key={i} className="shrink-0" aria-hidden={copy ? 'true' : undefined}>{img}</span>
                      );
                    })}
                  </div>
                ) : (
                <div className="home-marquee-row flex w-max gap-10 md:gap-14" style={{ animationDuration: '34s' }}>
                  {[...workedWith, ...workedWith].map((name, i) => (
                    <span
                      key={`${name}-${i}`}
                      aria-hidden={i >= workedWith.length ? 'true' : undefined}
                      className="whitespace-nowrap text-[16px] font-semibold tracking-[-0.02em] text-[#1f2733]/80 md:text-[19px]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}
        </section>

        {stage >= 1 && (<>
        {/* ABOUT SECTION */}
        <section id="about" className="px-6 py-10 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className={cn('grid items-center gap-8 md:gap-12', aboutVideo && 'lg:grid-cols-2')}>
              <Reveal from="left">
                <h2 className="text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{title('about')}</h2>
                <RichText text={config.aboutText} className="mt-4 max-w-2xl text-[17px] leading-relaxed text-text-muted" />
              </Reveal>

              {aboutVideo && (
                <Reveal from="right" delay={0.1} className="w-full">
                  <VideoPlayer url={aboutVideo} />
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* RESUME SECTION */}
        {resume.length > 0 ? (
          <CareerTimeline items={resume} title={title('resume')} />
        ) : (
          loaded && (
            <section id="resume" className="px-6 py-10 md:py-14" aria-label={title('resume')}>
              <div className="mx-auto max-w-7xl">
                <EmptyNote>Experience will be listed here soon.</EmptyNote>
              </div>
            </section>
          )
        )}

        {/* WHAT I CAN DO: categories as tabs, services as chips */}
        {capabilityGroups.length > 0 && (
          <section id="services" className="px-3 py-6 md:px-6 md:py-10">
            <Capabilities heading={(() => { const t = title('whatIDo'); return t === 'What I do' ? DEFAULT_SECTION_TITLES.whatIDo : t; })()} eyebrow={(config.capabilitiesEyebrow || '').trim()} groups={capabilityGroups} links={chipLinks(cleanServices(config.servicePages))} />
          </section>
        )}

        </>)}

        {stage >= 2 && (<>
        {/* PROJECTS SECTION */}
        <section id="projects" className="px-6 py-12 md:py-[120px]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-[70px]">
              <div>
                <Reveal delay={0.07}>
                  <h2 className="text-[2.3rem] font-medium leading-[1.04] tracking-[-0.045em] md:text-6xl">{title('projects')}</h2>
                </Reveal>
              </div>
            </div>

            {config.projectsHidden ? (
              <Reveal><ProjectsLocked /></Reveal>
            ) : projects.length === 0 ? (
              loaded && <EmptyNote>Selected projects will be shown here soon.</EmptyNote>
            ) : (
              <>
                <div className="grid gap-5 md:gap-7 lg:grid-cols-[1.25fr_0.75fr]">
                  <Reveal from="zoom">
                    <article className="group relative h-full min-h-[340px] overflow-hidden rounded-[28px] bg-bg-card md:min-h-[420px] md:rounded-[44px] lg:min-h-[560px]">
                      <Link to={`/projects/${featuredProject.slug || featuredProject.id}`} className="block h-full w-full">
                        {featuredProject.image && (
                          <Photo
                            src={featuredProject.image}
                            widths={[640, 1080, 1600]}
                            sizes="(min-width: 1024px) 60vw, 100vw"
                            alt={featuredProject.title}
                            width={1200}
                            height={900}
                            loading="eager"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,32,0)_42%,rgba(10,18,32,0.86)_100%)]" aria-hidden="true" />
                        <div className="absolute inset-x-5 bottom-5 md:inset-x-8 md:bottom-8">
                          <span className="inline-block rounded-xl bg-white/20 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                            {featuredProject.category}
                          </span>
                          <h3 className="mt-4 text-[32px] font-medium tracking-[-0.035em] text-white md:text-[50px]">{featuredProject.title}</h3>
                        </div>
                        <span
                          className="absolute right-5 top-5 grid h-[46px] w-[46px] place-items-center md:right-8 md:top-8 md:h-[58px] md:w-[58px] rounded-full bg-accent text-[#0d1117] transition-transform duration-500 group-hover:rotate-45 group-hover:scale-105"
                          aria-hidden="true"
                        >
                          <ArrowUpRight className="h-6 w-6" />
                        </span>
                      </Link>
                    </article>
                  </Reveal>

                  <div className="grid gap-7">
                    {guide ? (
                      <Reveal delay={0.12} className="hidden h-full lg:block">
                        <div className="flex h-full flex-col justify-between rounded-[44px] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--color-accent)_28%,white),var(--color-accent))] p-9">
                          <div>
                            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0d1117]/60">Premium resource</span>
                            <h3 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0d1117] md:text-[32px]">
                              {guide.shortTitle || guide.title}
                            </h3>
                            <RichClamp text={guide.description} className="mt-3 line-clamp-3 text-[16px] leading-relaxed text-[#0d1117]/75" />
                          </div>
                          <a href="#resources" className="home-btn home-mag mt-7 self-start bg-[#0d1117] px-6 py-3.5 text-[15px] text-white">
                            See the guide <span className="home-arrow" aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </Reveal>
                    ) : sideProject ? (
                      <Reveal delay={0.12} className="h-full">
                        <article className="group relative h-full min-h-[260px] overflow-hidden rounded-[44px] bg-bg-card">
                          <Link to={`/projects/${sideProject.slug || sideProject.id}`} className="block h-full w-full">
                            {sideProject.image && (
                              <Photo
                                src={sideProject.image}
                                widths={[640, 1080]}
                                sizes="(min-width: 1024px) 30vw, 100vw"
                                alt={sideProject.title}
                                width={800}
                                height={600}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,32,0)_40%,rgba(10,18,32,0.86)_100%)]" aria-hidden="true" />
                            <div className="absolute inset-x-7 bottom-7">
                              <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/80">{sideProject.category}</span>
                              <h3 className="mt-2 text-[28px] font-medium tracking-[-0.03em] text-white">{sideProject.title}</h3>
                            </div>
                          </Link>
                        </article>
                      </Reveal>
                    ) : null}

                  </div>
                </div>

                {remainingProjects.length > 0 && (
                  <div className="mt-5 grid gap-5 md:mt-7 md:gap-7 md:grid-cols-2">
                    {remainingProjects.map((project, i) => (
                      <Reveal key={project.id || project.title} delay={Math.min((i % 2) * 0.1, 0.2)}>
                        <article className="group relative aspect-[4/3] overflow-hidden rounded-[44px] bg-bg-card">
                          <Link to={`/projects/${project.slug || project.id}`} className="block h-full w-full">
                            {project.image && (
                              <Photo
                                src={project.image}
                                widths={[640, 1080]}
                                sizes="(min-width: 768px) 50vw, 100vw"
                                alt={project.title}
                                width={800}
                                height={600}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,32,0)_42%,rgba(10,18,32,0.86)_100%)]" aria-hidden="true" />
                            <div className="absolute inset-x-7 bottom-7">
                              <span className="inline-block rounded-xl bg-white/20 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                                {project.category}
                              </span>
                              <h3 className="mt-3 text-[28px] font-medium tracking-[-0.03em] text-white md:text-[34px]">{project.title}</h3>
                            </div>
                            <span
                              className="absolute right-7 top-7 grid h-[54px] w-[54px] place-items-center rounded-full bg-accent text-[#0d1117] transition-transform duration-500 group-hover:rotate-45"
                              aria-hidden="true"
                            >
                              <ArrowUpRight className="h-6 w-6" />
                            </span>
                          </Link>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* TESTIMONIALS */}
        {testimonials.length > 0 && (() => {
          const card = (t: (typeof testimonials)[number], key: string, cls: string, hidden?: boolean) => (
            <figure
              key={key}
              aria-hidden={hidden ? 'true' : undefined}
              className={cn('m-0 flex shrink-0 flex-col rounded-[22px] border border-border-subtle bg-white p-5', cls)}
            >
              <div className="h-4 text-[38px] font-bold leading-[0.6] text-accent" aria-hidden="true">&ldquo;</div>
              <RichClamp as="blockquote" text={t.content} className="m-0 line-clamp-4 text-[15px] leading-relaxed text-[#2d3440] md:line-clamp-3" />
              <figcaption className="mt-4 flex items-center gap-3">
                <Avatar src={t.avatar} name={t.name} className="h-9 w-9 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold leading-tight text-text-main">{t.name}</div>
                  <div className="truncate text-[12px] tracking-[0.02em] text-text-muted md:text-[10px] md:uppercase md:tracking-[0.1em]">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          );
          // The looping strip is for larger screens; on a phone the cards are swiped by hand.
          const half = Array.from({ length: Math.max(1, Math.ceil(8 / testimonials.length)) }, () => testimonials).flat();
          return (
            <section className="overflow-hidden bg-bg-card py-8 md:py-12" aria-label="Client testimonials">
              <div className="mx-auto mb-5 max-w-7xl px-6">
                <h2 className="text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{title('testimonials')}</h2>
              </div>
              <div className="md:hidden">
                <AutoCarousel label="Testimonials" className="gap-3 px-6 pb-1">
                  {testimonials.map((t, i) => card(t, `m-${t.id}-${i}`, 'w-[82%] snap-center'))}
                </AutoCarousel>
              </div>
              <div className="home-marquee hidden md:block">
                <div className="home-marquee-row flex w-max gap-5 px-2.5" style={{ animationDuration: '90s' }}>
                  {[...half, ...half].map((t, i) => card(t, `${t.id}-${i}`, 'w-[350px]', i >= half.length))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* TEAM */}
        {(() => {
          const team = (config.teamMembers || []).filter((m) => m && m.name && !m.hidden);
          if (!team.length) return null;
          return (
            <section id="team" className="px-6 py-10 md:py-14" aria-label="Team">
              <div className="mx-auto max-w-7xl">
                <Reveal>
                  <h2 className="mb-6 text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{title('team')}</h2>
                  <div className="rounded-[28px] bg-bg-card px-5 py-8 md:rounded-[44px] md:px-12 md:py-12"><TeamDeck members={team} /></div>
                </Reveal>
              </div>
            </section>
          );
        })()}

        {/* WORK WITH ME */}
        <WorkWithMe offers={config.hireOffers || []} heading={title('hire')} lead={title('hireLead')} />

        </>)}

        {stage >= 3 && (<>
        {/* BLOG SECTION */}
        <section id="blog" className="px-6 py-10 md:py-14">
          <div className="mx-auto max-w-7xl">
            <Reveal><h2 className="mb-6 text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{title('blog')}</h2></Reveal>
            {blogPosts.length === 0 ? (
              loaded && <EmptyNote>New articles are on their way.</EmptyNote>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {blogPosts.slice(0, 4).map((post, i) => (
                    <Reveal key={post.id || post.title} delay={Math.min((i % 4) * 0.05, 0.15)}>
                      <article className="group h-full">
                        <Link
                          to={`/blog/${post.slug || post.id}`}
                          className="flex h-full flex-col justify-between rounded-[22px] bg-bg-card p-5 transition-[transform,background-color] duration-300 hover:-translate-y-1 hover:bg-[#0d1117]"
                        >
                          <div>
                            <span className="hidden text-[12px] font-semibold uppercase tracking-[0.14em] text-text-muted transition-colors duration-300 group-hover:text-white/50 md:inline">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <h3 className="mt-2 line-clamp-3 text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] text-text-main transition-colors duration-300 group-hover:text-white">
                              {post.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-[14px] leading-snug text-text-muted transition-colors duration-300 group-hover:text-white/65">
                              {post.excerpt}
                            </p>
                          </div>
                          <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-text-main transition-colors duration-300 group-hover:text-white">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[#0d1117]" aria-hidden="true">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                            Read article
                          </span>
                        </Link>
                      </article>
                    </Reveal>
                  ))}
                </div>
                {blogPosts.length > 4 && (
                  <div className="mt-6 text-center">
                    <Link
                      to="/articles"
                      className="home-btn inline-flex border border-[#0d1117]/15 px-6 py-3 text-[15px] text-text-main hover:bg-[#0d1117] hover:text-white"
                    >
                      See more
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* RESOURCES SECTION */}
        <ResourcesSection />

        {/* CONTACT SECTION */}
        <section id="contact" className="px-3 pb-10 pt-4 md:px-6 md:pb-16 md:pt-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="home-on-dark relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#3f78ad_0%,#5f93c4_55%,#8fb6d9_100%)] px-4 py-5 md:rounded-[36px] md:px-10 md:py-8">
              <div className="home-cloud home-cloud--a bottom-[-60px] left-[-120px] h-[200px] w-[620px]" aria-hidden="true" />
              <div className="home-cloud home-cloud--b right-[-160px] top-[-70px] h-[220px] w-[720px]" aria-hidden="true" />

              <div className="relative grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-stretch lg:gap-10">
                <div className="flex flex-col">
                  <div className={faq.length ? 'mb-4 md:mb-5' : ''}>
                    <Reveal delay={0.07}>
                      <h2 className="max-w-2xl text-[1.6rem] font-medium leading-[1.1] tracking-[-0.04em] md:text-[2.1rem]">{title('contact')}</h2>
                    </Reveal>
                    {title('contactLead') && (
                      <Reveal delay={0.13}>
                        <p className="mt-2.5 max-w-xl text-[14px] leading-snug text-white/90 md:text-[15px]">{title('contactLead')}</p>
                      </Reveal>
                    )}
                  </div>
                  <div className="mt-auto"><ContactFaq items={faq} /></div>
                </div>

                <Reveal from="right" delay={0.1} className="h-full">
                  <form
                    onSubmit={handleContactSubmit}
                    aria-label="Contact form"
                    className="flex h-full flex-col gap-2.5 rounded-[20px] bg-white p-4 text-[#0d1117] shadow-[0_40px_60px_-30px_rgba(8,26,48,0.6)] md:p-5"
                  >
                    <h3 className="text-[17px] font-medium tracking-[-0.02em]">Send me a message</h3>
                    <div className="grid gap-2.5 md:grid-cols-2">
                      <div className="home-field">
                        <input id="contact-name" name="name" type="text" required maxLength={120} autoComplete="name" placeholder=" " />
                        <label htmlFor="contact-name">Name</label>
                      </div>
                      <div className="home-field">
                        <input id="contact-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder=" " />
                        <label htmlFor="contact-email">Email</label>
                      </div>
                    </div>
                    <div className="home-field flex flex-1 flex-col">
                      <textarea id="contact-message" name="message" rows={3} required maxLength={5000} placeholder=" " className="h-full min-h-[84px] flex-1"></textarea>
                      <label htmlFor="contact-message">Message</label>
                    </div>

                    {/* Honeypot: invisible to people, tempting to bots */}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                      <label htmlFor="contact-website">Leave this field empty</label>
                      <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="home-btn home-mag w-full bg-accent px-7 py-3 text-[15px] text-[#0d1117] disabled:opacity-60"
                    >
                      {isSubmitting
                        ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="sr-only">Sending…</span></>
                        : <>Send Message <span className="home-arrow" aria-hidden="true">↗</span></>}
                    </button>
                    <p role="status" aria-live="polite" className={cn('text-center font-medium', formStatus === 'idle' ? 'sr-only' : 'text-[14px]', statusMessages[formStatus]?.cls)}>
                      {statusMessages[formStatus]?.text}
                    </p>
                  </form>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
        </>)}

        {/* Holds the place of the sections that are still to come, so the footer stays below the first screen. */}
        {stage < 3 && <div aria-hidden="true" style={{ minHeight: '150vh' }} />}

      </main>

      <Footer />

      <button
        type="button"
        ref={toTopRef}
        className="home-totop"
        onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Back to top</span>
      </button>
    </div>
  );
}
