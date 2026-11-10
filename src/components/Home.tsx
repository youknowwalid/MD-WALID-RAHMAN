import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { m, useInView, useReducedMotion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import {
  Laptop, Braces, Palette, Megaphone, Check, X, ArrowUpRight, ArrowUp,
  Mail, Phone, MapPin, Clock, Loader2, Layers, PenTool, Compass, Sparkles,
  Camera, Code, Globe, LineChart, Rocket, Target, Video, ShoppingBag, Smartphone, Search, Briefcase, Lightbulb,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { listRows, submitContact } from '../lib/api';
import { backendConfigured } from '../lib/config';
import { DEFAULT_SECTION_TITLES, FALLBACK_RESUME, FALLBACK_SERVICES } from '../lib/defaults';
import {
  normalizePricingPlan, normalizeProject, normalizeBlogPost, normalizeService,
  normalizeTestimonial, normalizeResumeItem,
} from '../lib/schema-defaults';
import { safeUrl } from '../lib/text';
import { useProducts } from '../lib/products';
import { useSiteConfig } from '../context/SiteConfigContext';
import { Project, BlogPost, Service, Skill, Testimonial, PricingPlan, ResumeItem } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import Photo from './Photo';
import ResourcesSection from './ResourcesSection';
import Seo from './Seo';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, Braces, Megaphone, Laptop, Layers, PenTool, Compass, Sparkles,
  Camera, Code, Globe, LineChart, Rocket, Target, Video, ShoppingBag, Smartphone, Search, Briefcase, Lightbulb,
};
// Used when two services would otherwise share the same icon.
const ICON_POOL = [Palette, Braces, Megaphone, Laptop, Layers, PenTool, Compass, Sparkles];

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

const Eyebrow = ({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) => (
  <span
    className={cn(
      'inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[13px] font-medium',
      onDark ? 'border-white/30 bg-white/15 text-white backdrop-blur-sm' : 'border-border-subtle bg-white text-text-main',
    )}
  >
    <i className="home-dot h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
    {children}
  </span>
);

const SectionHead = ({ label, title, lead, onDark = false }: {
  label: string; title: React.ReactNode; lead?: string; onDark?: boolean;
}) => (
  <div className="mb-14 md:mb-[70px]">
    <Reveal><Eyebrow onDark={onDark}>{label}</Eyebrow></Reveal>
    <Reveal delay={0.07}>
      <h2 className="mt-5 max-w-4xl text-[2.3rem] font-medium leading-[1.04] tracking-[-0.045em] md:text-6xl">{title}</h2>
    </Reveal>
    {lead && (
      <Reveal delay={0.13}>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl">{lead}</p>
      </Reveal>
    )}
  </div>
);

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

/** One entry in the résumé. Its dot lights up as the entry arrives. */
const TimelineItem = ({ item, last, delay }: { item: ResumeItem; last: boolean; delay: number } & React.Attributes) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={cn('home-tl-item relative', inView && 'is-in', last ? 'pb-0' : 'pb-5')}
    >
      <span className="home-tl-dot" aria-hidden="true" />
      <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-text-muted">{item.year}</span>
      <h3 className="mt-0.5 text-[19px] font-semibold uppercase leading-tight tracking-[-0.02em] text-text-main md:text-[21px]">{item.role}</h3>
      <div className="mt-0.5 text-[15px] font-medium text-text-main/80">{item.company}</div>
      {item.desc && <p className="mt-1 max-w-xl text-[14px] leading-snug text-text-muted">{item.desc}</p>}
    </m.div>
  );
};

const MIN_FILL_MS = 3000;

/** Home-page lists. Cards only need a few columns, so the long article/case-study text is not downloaded here. */
const loadHomeData = () => Promise.all([
  listRows('projects', ['id', 'slug', 'title', 'category', 'image', 'published']),
  listRows('services'),
  listRows('blogPosts', ['id', 'slug', 'title', 'date', 'excerpt', 'image']),
  listRows('resume'),
  listRows('testimonials'),
  listRows('pricingPlans'),
  listRows('skills'),
]);

// Started as soon as the script loads (when the visit begins on the home page), in parallel with the settings
// request, instead of waiting for the page to render first.
const prefetched: { at: number; data: ReturnType<typeof loadHomeData> } | null =
  typeof window !== 'undefined' && window.location.pathname === '/' ? { at: Date.now(), data: loadHomeData() } : null;
const takeHomeData = () => (prefetched && Date.now() - prefetched.at < 10_000 ? prefetched.data : loadHomeData());

export default function Home() {
  const { config, hero } = useSiteConfig();
  const { products } = useProducts();
  const reduceMotion = useReducedMotion();

  const [projects, setProjects] = useState<Project[]>([]);
  // Built-in content is only for sites with no database; with one, nothing is shown until the real content arrives.
  const [loaded, setLoaded] = useState(!backendConfigured);
  const [services, setServices] = useState<Service[]>(backendConfigured ? [] : FALLBACK_SERVICES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [resume, setResume] = useState<ResumeItem[]>(backendConfigured ? [] : FALLBACK_RESUME);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error' | 'limited' | 'mailto'>('idle');
  const formShownAt = useRef(Date.now());
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [openPlans, setOpenPlans] = useState<Record<string, boolean>>({});

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

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineFillRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const toTopRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [proj, serv, blog, res, test, pric, skill] = await takeHomeData();
      if (cancelled) return;
      // null = no backend / unreachable: show built-in content. [] = the owner removed everything on purpose.
      if (proj) setProjects(proj.map(normalizeProject));
      setServices(serv ? serv.map(normalizeService) : FALLBACK_SERVICES);
      if (blog) setBlogPosts(blog.map(normalizeBlogPost));
      setResume(res ? res.map(normalizeResumeItem) : FALLBACK_RESUME);
      if (test) setTestimonials(test.map(normalizeTestimonial));
      if (pric) setPricingPlans(pric.map(normalizePricingPlan));
      if (skill) setSkills(skill as Skill[]);
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

      const rail = timelineRef.current;
      const fill = timelineFillRef.current;
      if (rail && fill) {
        const box = rail.getBoundingClientRect();
        const filled = Math.min(Math.max(window.innerHeight * 0.62 - box.top, 0), Math.max(box.height - 16, 0));
        fill.style.height = `${filled}px`;
      }

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
  }, [resume.length, reduceMotion]);

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
  const homeAccent = /^#[0-9a-fA-F]{6}$/.test(config.homeAccent || '') ? config.homeAccent : '';
  const focusTitle = (config.currentFocusTitle || '').trim();
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

  const contactDetails = [
    config.contactEmail && { icon: Mail, label: 'Email', value: config.contactEmail, href: `mailto:${config.contactEmail}` },
    config.officePhone && { icon: Phone, label: 'Phone', value: config.officePhone, href: `tel:${phoneDigits}` },
    config.officeAddress && { icon: MapPin, label: 'Office', value: config.officeAddress, href: '' },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string }[];

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
              <h1 className="text-[clamp(2.6rem,8vw,6.2rem)] font-medium leading-[1.03] tracking-[-0.045em] text-white">
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
                  {config.globalCtaText}
                  <span className="home-arrow" aria-hidden="true">↗</span>
                </a>
                {hero.cvUrl && (
                  <a
                    href={hero.cvUrl}
                    download="Walid_Rahman_CV.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-btn home-mag min-h-[52px] bg-white px-7 py-3.5 text-[16px] text-[#0d1117] md:text-[17px]"
                  >
                    Download CV
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
                        {stat.unit && <> <span className="text-[0.55em] font-medium text-white/80">{stat.unit}</span></>}
                      </dd>
                      <dt className="mt-2 text-[9px] uppercase leading-tight tracking-[0.16em] text-white/85 md:text-[11px]">{stat.label}</dt>
                    </div>
                  ))}
                </m.dl>
              )}
            </div>

            <m.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8, ease: EASE }}
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
                    alt="Portrait of Walid Rahman"
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
                      {stat.unit && <> <span className="text-[0.55em] font-medium text-[#4a5361]">{stat.unit}</span></>}
                    </dd>
                    <dt className="mt-0.5 text-[12px] leading-tight text-[#4a5361]">{stat.label}</dt>
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
                <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-text-muted">{config.aboutText}</p>
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
        <section id="resume" className="bg-[linear-gradient(180deg,#ffffff,#f5f8fc)] px-6 py-10 md:py-14">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="mb-6 text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{title('resume')}</h2>
            </Reveal>
            <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_400px] lg:gap-14">
              <div>
                {loaded && resume.length === 0 && <EmptyNote>Experience will be listed here soon.</EmptyNote>}
                {resume.length > 0 && (
                  <div className="home-tl" ref={timelineRef}>
                    <div className="home-tl-rail" aria-hidden="true" />
                    <div className="home-tl-fill" ref={timelineFillRef} aria-hidden="true" />
                    {resume.map((item, i) => (
                      <TimelineItem key={item.id || i} item={item} last={i === resume.length - 1} delay={Math.min(i * 0.05, 0.2)} />
                    ))}
                  </div>
                )}
              </div>

              {hero.resumeImage && (
                <Reveal from="right" delay={0.1} className="order-first lg:order-last">
                  <div className="relative h-[260px] overflow-hidden rounded-[32px] sm:h-[360px] shadow-[0_30px_55px_-32px_rgba(13,17,23,0.5)] lg:h-full lg:min-h-[420px]">
                    <Photo
                      src={hero.resumeImage}
                      widths={[640, 828, 1080]}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                    {focusTitle && (
                      <div className="absolute inset-x-4 bottom-4 rounded-[16px] border border-white/15 bg-[#0d1117]/60 px-4 py-3 backdrop-blur-md">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">Current Focus</div>
                        <div className="text-[17px] font-semibold tracking-[-0.02em] text-white">{focusTitle}</div>
                      </div>
                    )}
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        {services.length > 0 && (
          <section id="services" className="px-6 py-10 md:py-14">
            <div className="mx-auto max-w-7xl">
              <Reveal>
                <h2 className="mb-6 text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{title('services')}</h2>
              </Reveal>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  const used = new Set<React.ComponentType<{ className?: string }>>();
                  return services.map((service, i) => {
                    let Icon = ICON_MAP[service.iconName || ''] || ICON_POOL[i % ICON_POOL.length];
                    if (used.has(Icon)) Icon = ICON_POOL.find((c) => !used.has(c)) || Icon;
                    used.add(Icon);
                    return (
                      <Reveal key={service.id} delay={Math.min((i % 3) * 0.05, 0.12)}>
                        <div className="home-card group flex h-full items-center gap-4 rounded-[20px] border border-border-subtle bg-bg-card px-4 py-3.5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-22px_rgba(13,17,23,0.4)]">
                          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#0d1117] text-white transition-colors duration-300 group-hover:bg-accent group-hover:text-[#0d1117]">
                            <Icon className="h-[18px] w-[18px]" />
                          </div>
                          <div className="relative min-w-0">
                            <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.02em] text-text-main">{service.title}</h3>
                            <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-text-muted">{service.description}</p>
                          </div>
                        </div>
                      </Reveal>
                    );
                  });
                })()}
              </div>
            </div>
          </section>
        )}

        {/* SKILLS SECTION */}
        {skills.length > 0 && (
          <section id="skills" className="px-3 py-6 md:px-6 md:py-8">
            <div className="home-on-dark relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-[#0d1117] px-5 py-8 md:rounded-[36px] md:px-12 md:py-10">
              <div className="home-skills-glow" aria-hidden="true" />
              <div className="relative grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-14">
                <div>
                  <h2 className="text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.4rem]">
                    {(() => {
                      const words = title('skills').split(' ');
                      const last = words.length > 1 ? words.pop() : '';
                      return <>{words.join(' ')}{last && <> <span className="text-white/45">{last}</span></>}</>;
                    })()}
                  </h2>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-text-muted">
                    {title('skillsIntro')}
                  </p>
                </div>
                <div className="grid gap-x-10 gap-y-3.5 sm:grid-cols-2">
                  {skills.map((skill, i) => (
                    <div key={skill.id || skill.name}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-[14px] font-medium text-white">{skill.name}</span>
                        <span className="text-[13px] font-medium tabular-nums text-accent" aria-hidden="true">{skill.level}%</span>
                      </div>
                      <div
                        className="h-1 w-full overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-label={skill.name}
                        aria-valuenow={skill.level}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <m.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.1, delay: Math.min(i * 0.04, 0.3), ease: EASE }}
                          className="h-full rounded-full bg-[linear-gradient(90deg,#8db4d8,var(--color-accent))]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        </>)}

        {stage >= 2 && (<>
        {/* PROJECTS SECTION */}
        <section id="projects" className="px-6 py-12 md:py-[120px]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-[70px]">
              <div>
                <Reveal><Eyebrow>{title('projectsEyebrow')}</Eyebrow></Reveal>
                <Reveal delay={0.07}>
                  <h2 className="mt-5 text-[2.3rem] font-medium leading-[1.04] tracking-[-0.045em] md:text-6xl">{title('projects')}</h2>
                </Reveal>
              </div>
            </div>

            {projects.length === 0 ? (
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
                            <p className="mt-3 line-clamp-3 text-[16px] leading-relaxed text-[#0d1117]/75">{guide.description}</p>
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

                    {focusTitle && (
                      <Reveal delay={0.22} className="hidden h-full lg:block">
                        <div className="flex h-full flex-col justify-between rounded-[44px] bg-[linear-gradient(150deg,#e9e3fb,#c9d9fb)] p-9">
                          <div>
                            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0d1117]/60">Current focus</span>
                            <h3 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0d1117] md:text-[32px]">
                              {focusTitle}
                            </h3>
                            <p className="mt-3 text-[16px] leading-relaxed text-[#0d1117]/75">
                              {(config.currentFocusText || '').trim() || (resume[0] ? `${resume[0].role} at ${resume[0].company}. ${resume[0].desc || ''}`.trim() : config.brandTagline)}
                            </p>
                          </div>
                        </div>
                      </Reveal>
                    )}
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
              <blockquote className="m-0 line-clamp-4 text-[15px] leading-relaxed text-[#2d3440] md:line-clamp-3">{t.content}</blockquote>
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
              <div tabIndex={0} role="region" aria-label="Testimonials, scroll sideways" className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:hidden">
                {testimonials.map((t, i) => card(t, `m-${t.id}-${i}`, 'w-[82%] snap-center'))}
              </div>
              <div className="home-marquee hidden md:block">
                <div className="home-marquee-row flex w-max gap-5 px-2.5" style={{ animationDuration: '90s' }}>
                  {[...half, ...half].map((t, i) => card(t, `${t.id}-${i}`, 'w-[350px]', i >= half.length))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* PRICING SECTION */}
        {pricingPlans.length > 0 && (
          <section id="pricing" className="px-6 py-10 md:py-14">
            <div className="mx-auto max-w-7xl">
              <Reveal><h2 className="mb-6 text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{title('pricing')}</h2></Reveal>
              <div className="grid items-stretch gap-4 lg:grid-cols-3">
                {pricingPlans.map((plan, i) => {
                  const rawPrice = String(plan.price ?? '').trim();
                  const needsCurrency = /^\d/.test(rawPrice);
                  const planKey = String(plan.id || plan.name);
                  const open = !!openPlans[planKey];
                  const canCollapse = (plan.features || []).length > 5 || (plan.unavailableFeatures || []).length > 0;
                  return (
                    <Reveal key={plan.id || plan.name} delay={Math.min(i * 0.1, 0.25)} className={cn('h-full', plan.accent && 'order-first lg:order-none')}>
                      <div
                        className={cn(
                          'relative flex h-full flex-col rounded-[24px] p-6',
                          plan.accent
                            ? 'home-plan-pop home-on-dark'
                            : 'border border-border-subtle bg-bg-card transition-[transform,box-shadow] duration-500 hover:-translate-y-2 hover:shadow-[0_44px_70px_-40px_rgba(13,17,23,0.45)]',
                        )}
                      >
                        {plan.accent && (
                          <span className="absolute right-5 top-5 rounded-lg bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#0d1117]">
                            Most Popular
                          </span>
                        )}
                        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-text-muted">{plan.name}</div>
                        <div className="mt-2 flex items-start gap-1">
                          {needsCurrency && <span className="mt-1 text-[20px] font-medium text-text-main">$</span>}
                          <span className="text-[40px] font-semibold leading-[0.95] tracking-[-0.045em] text-text-main">
                            <CountText raw={rawPrice} />
                          </span>
                          {plan.period && <span className="mt-auto mb-1 text-[15px] text-text-muted">{plan.period}</span>}
                        </div>

                        {plan.showPriorityBox && (
                          <div className="mt-4 flex items-center gap-3">
                            <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', plan.accent ? 'bg-white/10' : 'bg-white')}>
                              <Clock className="h-5 w-5 text-text-main" aria-hidden="true" />
                            </div>
                            <div>
                              <div className="text-[15px] font-medium text-text-main">{plan.priorityTitle || 'N/A'}</div>
                              <div className={cn('text-xs font-semibold uppercase tracking-[0.12em]', plan.accent ? 'text-accent' : 'text-[#15803d]')}>
                                {plan.prioritySubtitle || 'Daily Priority Access'}
                              </div>
                            </div>
                          </div>
                        )}

                        <hr className={cn('my-4 h-px border-0', plan.accent ? 'bg-white/15' : 'bg-[#0d1117]/10')} />

                        <h3 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted md:text-[10px] md:tracking-[0.18em]">What&apos;s included</h3>
                        <ul className="flex-grow space-y-1.5">
                          {(plan.features || []).map((f, fi) => (
                            <li key={f} className={cn('items-start gap-3 text-[14px] leading-snug text-text-main', open || fi < 5 ? 'flex' : 'hidden lg:flex')}>
                              <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', plan.accent ? 'text-accent' : 'text-[#15803d]')} aria-hidden="true" />
                              <span>{f}</span>
                            </li>
                          ))}
                          {(plan.unavailableFeatures || []).map((f) => (
                            <li key={f} className={cn('items-start gap-3 text-[14px] leading-snug text-text-muted/70', open ? 'flex' : 'hidden lg:flex')}>
                              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                              <span className="line-through"><span className="sr-only">Not included: </span>{f}</span>
                            </li>
                          ))}
                        </ul>

                        {canCollapse && (
                          <button
                            type="button"
                            onClick={() => setOpenPlans((o) => ({ ...o, [planKey]: !o[planKey] }))}
                            aria-expanded={open}
                            className="mt-3 inline-flex min-h-11 items-center self-start text-[14px] font-medium text-text-main underline underline-offset-4 lg:hidden"
                          >
                            {open ? 'Show fewer features' : 'See all features'}
                          </button>
                        )}
                        <a
                          href={safeUrl(plan.buttonUrl) || '/#contact'}
                          {...(/^https?:/i.test(plan.buttonUrl || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className={cn(
                            'home-btn home-mag mt-5 w-full px-6 py-3 text-[15px]',
                            plan.accent ? 'bg-accent text-[#0d1117]' : 'border border-[#0d1117]/15 text-text-main hover:bg-[#0d1117] hover:text-white',
                          )}
                        >
                          {plan.buttonText || 'Get Started'}
                        </a>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

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
                  {(showAllPosts ? blogPosts : blogPosts.slice(0, 4)).map((post, i) => (
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
                    <button
                      type="button"
                      onClick={() => setShowAllPosts((v) => !v)}
                      aria-expanded={showAllPosts}
                      className="home-btn border border-[#0d1117]/15 px-6 py-3 text-[15px] text-text-main hover:bg-[#0d1117] hover:text-white"
                    >
                      {showAllPosts ? 'Show less' : 'See more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* RESOURCES SECTION */}
        <ResourcesSection />

        {/* CONTACT SECTION */}
        <section id="contact" className="px-3 pb-12 pt-6 md:px-6 md:pb-[120px]">
          <div className="mx-auto max-w-[1400px]">
            <div className="home-on-dark relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,#3f78ad_0%,#5f93c4_55%,#8fb6d9_100%)] px-4 py-8 md:rounded-[40px] md:px-12 md:py-12">
              <div className="home-cloud home-cloud--a bottom-[-60px] left-[-120px] h-[200px] w-[620px]" aria-hidden="true" />
              <div className="home-cloud home-cloud--b right-[-160px] top-[-70px] h-[220px] w-[720px]" aria-hidden="true" />

              <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-12">
                <div>
                  <SectionHead
                    label={title('contactEyebrow')}
                    title={title('contact')}
                    lead={title('contactLead')}
                    onDark
                  />
                  <div className="-mt-10 space-y-4">
                    {contactDetails.map((item, i) => (
                      <Reveal key={item.label} delay={Math.min(i * 0.08, 0.2)}>
                        <div className="relative flex items-center gap-4 rounded-[20px] border border-white/25 bg-white/15 p-4 md:p-5 backdrop-blur-sm transition-transform duration-500 hover:translate-x-2">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-[#0d1117]" aria-hidden="true">
                            <item.icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/85 md:text-[10px] md:tracking-[0.18em]">{item.label}</div>
                            {item.href ? (
                              <a href={item.href} className="break-words text-[19px] font-medium text-white underline-offset-4 after:absolute after:inset-0 after:rounded-[20px] hover:underline">{item.value}</a>
                            ) : (
                              <span className="break-words text-[19px] font-medium text-white">{item.value}</span>
                            )}
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>

                <Reveal from="right" delay={0.1}>
                  <form
                    onSubmit={handleContactSubmit}
                    aria-label="Contact form"
                    className="grid gap-3 rounded-[24px] bg-white p-4 text-[#0d1117] sm:rounded-[28px] sm:p-5 shadow-[0_40px_60px_-30px_rgba(8,26,48,0.6)] md:p-6"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="home-field">
                        <input id="contact-name" name="name" type="text" required maxLength={120} autoComplete="name" placeholder=" " />
                        <label htmlFor="contact-name">Name</label>
                      </div>
                      <div className="home-field">
                        <input id="contact-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder=" " />
                        <label htmlFor="contact-email">Email</label>
                      </div>
                    </div>
                    <div className="home-field">
                      <input id="contact-subject" name="subject" type="text" maxLength={200} placeholder=" " />
                      <label htmlFor="contact-subject">Subject</label>
                    </div>
                    <div className="home-field">
                      <textarea id="contact-message" name="message" rows={4} required maxLength={5000} placeholder=" "></textarea>
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
                      className="home-btn home-mag w-full bg-accent px-7 py-3.5 text-[16px] text-[#0d1117] disabled:opacity-60"
                    >
                      {isSubmitting
                        ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="sr-only">Sending…</span></>
                        : <>Send Message <span className="home-arrow" aria-hidden="true">↗</span></>}
                    </button>
                    <p role="status" aria-live="polite" className={cn('mt-1 text-center font-medium', statusMessages[formStatus]?.cls)}>
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
