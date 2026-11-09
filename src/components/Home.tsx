import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Laptop, Braces, Palette, Megaphone, Check, X, ArrowUpRight,
  Mail, Phone, MapPin, Clock, Loader2,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { listRows, submitContact } from '../lib/api';
import { backendConfigured } from '../lib/config';
import { FALLBACK_RESUME, FALLBACK_SERVICES } from '../lib/defaults';
import {
  normalizePricingPlan, normalizeProject, normalizeBlogPost, normalizeService,
  normalizeTestimonial, normalizeResumeItem,
} from '../lib/schema-defaults';
import { safeUrl } from '../lib/text';
import { useSiteConfig } from '../context/SiteConfigContext';
import { Project, BlogPost, Service, Skill, Testimonial, PricingPlan, ResumeItem } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import Photo from './Photo';
import ResourcesSection from './ResourcesSection';
import Seo from './Seo';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = { Palette, Braces, Megaphone, Laptop };

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
      <div className="w-full aspect-video rounded-[36px] overflow-hidden shadow-[0_40px_70px_-35px_rgba(13,17,23,0.5)] bg-neutral-900">
        <iframe
          className="w-full h-full"
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
    <div className="relative w-full aspect-video rounded-[36px] overflow-hidden shadow-[0_40px_70px_-35px_rgba(13,17,23,0.5)] bg-neutral-900">
      <video
        className="w-full h-full object-contain bg-black"
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
        <p role="alert" className="absolute inset-x-4 top-4 rounded-xl bg-black/80 p-3 text-center text-xs text-white">
          This browser can&apos;t display this video&apos;s picture (unsupported video format).
        </p>
      )}
    </div>
  );
};

/** Fades a block up into place the first time it is scrolled into view.
    Several of these sit in lists, so the props are intersected with React.Attributes,
    which is where React declares `key` (the same shape NavItem uses). */
const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string } & React.Attributes) => (
  <m.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
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

const SectionHead = ({ label, title, lead, onDark = false }: { label: string; title: string; lead?: string; onDark?: boolean }) => (
  <div className="mb-12 md:mb-16">
    <Reveal><Eyebrow onDark={onDark}>{label}</Eyebrow></Reveal>
    <Reveal delay={0.07}>
      <h2 className="mt-5 max-w-4xl text-[2.3rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-6xl">{title}</h2>
    </Reveal>
    {lead && (
      <Reveal delay={0.13}>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl">{lead}</p>
      </Reveal>
    )}
  </div>
);

const EmptyNote = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[36px] border border-dashed border-border-subtle py-16 px-6 text-center text-text-muted">{children}</div>
);

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
          className={cn('inline-block w-[3px] h-[0.9em] bg-accent ml-1 -mr-[7px] -mb-1', isComplete && 'hidden')}
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
    <div className={cn('rounded-full bg-[#0d1117] text-white font-semibold flex items-center justify-center', className)} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );

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

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineFillRef = useRef<HTMLDivElement>(null);

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
    meta?.setAttribute('content', '#2f6ea6');
    return () => {
      root.removeAttribute('data-home');
      if (meta && previousColor) meta.setAttribute('content', previousColor);
    };
  }, []);

  // The résumé line fills as the reader moves down it.
  useEffect(() => {
    const update = () => {
      const rail = timelineRef.current;
      const fill = timelineFillRef.current;
      if (!rail || !fill) return;
      const box = rail.getBoundingClientRect();
      const filled = Math.min(Math.max(window.innerHeight * 0.62 - box.top, 0), Math.max(box.height - 16, 0));
      fill.style.height = `${filled}px`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [resume.length]);

  // A soft light follows the pointer across the cards, and the main buttons lean towards it.
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

  const heroImage = hero.heroImage || '/portrait-placeholder.svg';
  const aboutVideo = config.aboutVideoUrl.trim();
  const statusMessages: Record<string, { text: string; cls: string }> = {
    success: { text: 'Thank you! Your message has been sent.', cls: 'text-[#15803d]' },
    mailto: { text: 'Your e-mail app should open with your message ready to send.', cls: 'text-[#15803d]' },
    limited: { text: 'You have sent several messages recently. Please try again in a little while.', cls: 'text-[#b91c1c]' },
    error: { text: 'Something went wrong. Please try again, or e-mail me directly.', cls: 'text-[#b91c1c]' },
  };

  const contactDetails = [
    config.contactEmail && { icon: Mail, label: 'Email', value: config.contactEmail, href: `mailto:${config.contactEmail}` },
    config.officePhone && { icon: Phone, label: 'Phone', value: config.officePhone, href: `tel:${phoneDigits}` },
    config.officeAddress && { icon: MapPin, label: 'Office', value: config.officeAddress, href: '' },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string }[];

  return (
    <div className="home-v2 relative min-h-screen bg-bg-dark overflow-x-hidden selection:bg-accent/50 selection:text-[#0d1117]">
      <Seo />
      <Navbar />
      <main className="relative z-10">

        {/* HERO SECTION */}
        <section id="home" className="home-hero relative flex min-h-screen items-center overflow-hidden px-6 pt-28 pb-14 md:pt-32 md:pb-20">
          <div className="home-cloud home-cloud--a h-[220px] w-[680px] left-[-140px] bottom-[16%]" aria-hidden="true" />
          <div className="home-cloud home-cloud--b h-[260px] w-[820px] right-[-180px] bottom-[26%]" aria-hidden="true" />
          <div className="home-cloud home-cloud--c h-[150px] w-[460px] left-[36%] top-[28%] opacity-40" aria-hidden="true" />

          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="relative z-10 text-center lg:text-left">
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                <Eyebrow onDark>Brand Developer</Eyebrow>
              </m.div>

              <h1 className="mt-7 text-[clamp(2.6rem,8vw,6.2rem)] font-medium leading-[1.03] tracking-[-0.045em] text-white">
                Hello, I&apos;m <br />
                <span className="text-white/65">
                  <Typewriter text="Walid Rahman." />
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
                className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start"
              >
                <a
                  href={ctaHref}
                  {...(ctaExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="home-btn home-mag bg-accent px-7 py-4 text-[16px] text-[#0d1117] shadow-[0_14px_24px_-12px_rgba(0,0,0,0.55)] md:text-[17px]"
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
                    className="home-btn home-mag bg-white px-7 py-4 text-[16px] text-[#0d1117] md:text-[17px]"
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
                  className="mt-12 grid grid-cols-3 gap-5 border-t border-white/25 pt-8 md:mt-14 md:gap-8"
                >
                  {config.heroStats.map((stat, i) => (
                    <div key={i}>
                      <dd className="text-[26px] font-semibold tracking-[-0.03em] text-white md:text-[42px]">
                        {stat.value}{stat.unit && <> <span className="text-[0.55em] font-medium text-white/80">{stat.unit}</span></>}
                      </dd>
                      <dt className="mt-2 text-[9px] uppercase tracking-[0.16em] leading-tight text-white/70 md:text-[11px]">{stat.label}</dt>
                    </div>
                  ))}
                </m.dl>
              )}
            </div>

            <m.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.8, ease: EASE }}
              className="relative order-first flex justify-center lg:order-last"
            >
              <div className="relative aspect-[4/5] w-full max-w-[300px] md:max-w-[400px]">
                <div className="home-spin pointer-events-none absolute left-1/2 top-1/2 h-[116%] w-[116%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/45" aria-hidden="true" />
                <div className="home-spin--rev pointer-events-none absolute left-1/2 top-1/2 h-[132%] w-[132%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" aria-hidden="true" />

                <div className="home-float relative h-full w-full overflow-hidden rounded-[40px] bg-[#1b2433] shadow-[0_50px_80px_-30px_rgba(8,26,48,0.75)]">
                  <Photo
                    src={heroImage}
                    widths={[640]}
                    sizes="(min-width: 768px) 400px, 300px"
                    alt="Portrait of Walid Rahman"
                    width={400}
                    height={500}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    decoding="async"
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-[22px] border border-white/15 bg-[#0d1117]/60 p-4 backdrop-blur-md">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{hero.heroStatus}</div>
                    <div className="text-[15px] text-white">{hero.heroAvailability}</div>
                  </div>
                </div>

                {config.aboutTags.slice(0, 2).map((tag, i) => (
                  <div
                    key={tag}
                    aria-hidden="true"
                    className={cn(
                      'absolute hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium text-[#0d1117] shadow-[0_18px_30px_-14px_rgba(8,26,48,0.6)] xl:flex',
                      i === 0 ? 'home-float -left-10 top-[18%]' : 'home-float--slow -right-8 bottom-[26%]',
                    )}
                  >
                    <i className="h-2 w-2 rounded-full bg-[#16a34a]" />
                    {tag}
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className={cn('grid items-center gap-12 md:gap-16', aboutVideo && 'lg:grid-cols-2')}>
              <div>
                <SectionHead label="About me" title="Crafting Digital Excellence" />
                <Reveal delay={0.05}>
                  <p className="-mt-6 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl">{config.aboutText}</p>
                </Reveal>
                <Reveal delay={0.12}>
                  <ul className="mt-9 flex flex-wrap gap-3">
                    {config.aboutTags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-bg-card px-5 py-2.5 text-[15px] font-medium text-text-main transition-transform duration-300 hover:-translate-y-1 hover:bg-accent"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>

              {aboutVideo && (
                <Reveal delay={0.1} className="w-full">
                  <VideoPlayer url={aboutVideo} />
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* RESUME SECTION */}
        <section id="resume" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHead label="Resume" title="My Journey" />
            <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
              <div>
                {hero.resumeImage && (
                  <Reveal className="mb-12 lg:hidden">
                    <div className="aspect-[4/5] w-full overflow-hidden rounded-[36px]">
                      <img src={hero.resumeImage} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    </div>
                  </Reveal>
                )}
                {loaded && resume.length === 0 && <EmptyNote>Experience will be listed here soon.</EmptyNote>}
                {resume.length > 0 && (
                  <div className="home-tl" ref={timelineRef}>
                    <div className="home-tl-rail" aria-hidden="true" />
                    <div className="home-tl-fill" ref={timelineFillRef} aria-hidden="true" />
                    {resume.map((item, i) => (
                      <Reveal key={item.id || i} delay={Math.min(i * 0.06, 0.3)}>
                        <div className={cn('home-tl-item relative', i === resume.length - 1 ? 'pb-0' : 'pb-12')}>
                          <span className="home-tl-dot" aria-hidden="true" />
                          <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-text-muted">{item.year}</span>
                          <h3 className="mt-2 text-[26px] font-semibold uppercase leading-tight tracking-[-0.03em] text-text-main md:text-3xl">{item.role}</h3>
                          <div className="mt-1 text-[17px] font-medium text-text-main/80">{item.company}</div>
                          {item.desc && <p className="mt-2.5 max-w-xl text-[17px] leading-relaxed text-text-muted">{item.desc}</p>}
                        </div>
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>

              {hero.resumeImage && (
                <div className="hidden lg:block">
                  <Reveal delay={0.1}>
                    <div className="group sticky top-28 overflow-hidden rounded-[44px] shadow-[0_40px_70px_-35px_rgba(13,17,23,0.5)]">
                      <div className="aspect-[3/4] w-full">
                        <img
                          src={hero.resumeImage}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute inset-x-5 bottom-5 rounded-[24px] border border-white/15 bg-[#0d1117]/60 p-5 backdrop-blur-md">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Current Focus</div>
                        <div className="text-[22px] font-semibold tracking-[-0.02em] text-white">Strategic Brand Evolution</div>
                      </div>
                    </div>
                  </Reveal>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        {services.length > 0 && (
          <section id="services" className="px-6 py-16 md:py-24">
            <div className="mx-auto max-w-7xl">
              <SectionHead label="What I do" title="My Specialities" />
              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service, i) => {
                  const Icon = ICON_MAP[service.iconName || 'Palette'] || Palette;
                  return (
                    <Reveal key={service.id} delay={Math.min((i % 3) * 0.08, 0.2)}>
                      <div className="home-card group h-full rounded-[34px] border border-border-subtle bg-bg-card p-9 transition-[transform,box-shadow] duration-500 hover:-translate-y-2 hover:shadow-[0_36px_60px_-34px_rgba(13,17,23,0.4)]">
                        <span className="pointer-events-none absolute right-6 top-3 text-[84px] font-semibold leading-none tracking-[-0.05em] text-[#0d1117]/5" aria-hidden="true">
                          {service.displayId || String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="relative mb-14 grid h-[52px] w-[52px] place-items-center rounded-[17px] bg-[#0d1117] text-white transition-[transform,background-color,color] duration-500 group-hover:-rotate-6 group-hover:bg-accent group-hover:text-[#0d1117]">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="relative text-[27px] font-semibold tracking-[-0.03em] text-text-main">{service.title}</h3>
                        <p className="relative mt-3 text-[17px] leading-relaxed text-text-muted">{service.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SKILLS SECTION */}
        {skills.length > 0 && (
          <section id="skills" className="px-4 py-10 md:px-6 md:py-16">
            <div className="home-on-dark mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-[#0d1117] px-7 py-16 md:rounded-[56px] md:px-16 md:py-24">
              <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                <div>
                  <SectionHead
                    label="Excellence"
                    title="Technical Arsenal"
                    lead="My skills are refined through years of practical application in demanding environments. I focus on technologies that deliver performance and scalability."
                    onDark
                  />
                </div>
                <div className="-mt-6 lg:mt-2">
                  {skills.map((skill, i) => (
                    <Reveal key={skill.id || skill.name} delay={Math.min(i * 0.05, 0.3)}>
                      <div className="py-4">
                        <div className="mb-3 flex items-baseline justify-between gap-4">
                          <span className="text-[17px] font-medium text-white md:text-lg">{skill.name}</span>
                          <span className="text-[17px] font-medium tabular-nums text-accent">{skill.level}%</span>
                        </div>
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-white/10"
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
                            transition={{ duration: 1.4, delay: Math.min(i * 0.06, 0.4), ease: EASE }}
                            className="h-full rounded-full bg-[linear-gradient(90deg,#8db4d8,#c3ed3a)]"
                          />
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PROJECTS SECTION */}
        <section id="projects" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHead label="Portfolio" title="Featured Work" />
            {projects.length === 0 ? (
              loaded && <EmptyNote>Selected projects will be shown here soon.</EmptyNote>
            ) : (
              <div className="grid gap-7 md:grid-cols-2">
                {projects.map((project, i) => (
                  <Reveal
                    key={project.id || project.title}
                    delay={Math.min((i % 2) * 0.1, 0.2)}
                    className={cn(i === 0 && 'md:col-span-2')}
                  >
                    <article className="group relative h-full overflow-hidden rounded-[40px] bg-bg-card">
                      <Link to={`/projects/${project.slug || project.id}`} className="block h-full w-full">
                        <div className={cn('w-full', i === 0 ? 'aspect-[4/3] md:aspect-[2.3/1]' : 'aspect-[4/3]')}>
                          {project.image && (
                            <Photo
                              src={project.image}
                              widths={i === 0 ? [640, 1080, 1600] : [640, 1080]}
                              sizes={i === 0 ? '(min-width: 768px) 1200px, 100vw' : '(min-width: 768px) 50vw, 100vw'}
                              alt={project.title}
                              width={i === 0 ? 1400 : 800}
                              height={i === 0 ? 610 : 600}
                              loading={i < 2 ? 'eager' : 'lazy'}
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,32,0)_42%,rgba(10,18,32,0.86)_100%)]" aria-hidden="true" />
                        <div className="absolute inset-x-7 bottom-7">
                          <span className="inline-block rounded-xl bg-white/20 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                            {project.category}
                          </span>
                          <h3 className={cn('mt-4 font-medium tracking-[-0.035em] text-white', i === 0 ? 'text-[32px] md:text-[54px]' : 'text-[28px] md:text-[34px]')}>
                            {project.title}
                          </h3>
                        </div>
                        <span
                          className="absolute right-7 top-7 grid h-[54px] w-[54px] place-items-center rounded-full bg-accent text-[#0d1117] transition-transform duration-500 group-hover:rotate-45 group-hover:scale-105"
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
          </div>
        </section>

        {/* TESTIMONIALS */}
        {testimonials.length > 0 && (
          <section className="overflow-hidden bg-bg-card py-16 md:py-24" aria-label="Client testimonials">
            <div className="mx-auto mb-14 max-w-7xl px-6 md:mb-20">
              <SectionHead label="Clients" title="Kind Words" />
            </div>
            <div className="home-marquee space-y-6">
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="flex w-max gap-6 px-3"
                  {...(row === 1 ? { 'aria-hidden': 'true' } : {})}
                >
                  <div className={cn('flex w-max gap-6', row === 0 ? 'home-marquee-row' : 'home-marquee-row--rev')}>
                    {[...testimonials, ...testimonials].map((t, i) => (
                      <figure
                        key={`${row}-${t.id}-${i}`}
                        aria-hidden={row === 0 && i >= testimonials.length ? 'true' : undefined}
                        className="m-0 flex w-[330px] shrink-0 flex-col rounded-[30px] border border-border-subtle bg-white p-7 transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-30px_rgba(13,17,23,0.35)] md:w-[420px]"
                      >
                        <div className="h-6 text-[52px] font-bold leading-[0.6] text-accent" aria-hidden="true">&ldquo;</div>
                        <blockquote className="m-0 flex-grow text-[17px] leading-relaxed text-[#2d3440]">{t.content}</blockquote>
                        <figcaption className="mt-6 flex items-center gap-3.5">
                          <Avatar src={t.avatar} name={t.name} className="h-11 w-11 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[16px] font-semibold text-text-main">{t.name}</div>
                            <div className="truncate text-[11px] uppercase tracking-[0.1em] text-text-muted">{t.role}</div>
                          </div>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PRICING SECTION */}
        {pricingPlans.length > 0 && (
          <section id="pricing" className="px-6 py-16 md:py-24">
            <div className="mx-auto max-w-7xl">
              <SectionHead label="Investment" title="Pricing Plans" />
              <div className="grid items-stretch gap-7 lg:grid-cols-3">
                {pricingPlans.map((plan, i) => (
                  <Reveal key={plan.id || plan.name} delay={Math.min(i * 0.1, 0.25)} className="h-full">
                    <div
                      className={cn(
                        'relative flex h-full flex-col rounded-[38px] p-9 md:p-10',
                        plan.accent
                          ? 'home-plan-pop home-on-dark'
                          : 'border border-border-subtle bg-bg-card transition-[transform,box-shadow] duration-500 hover:-translate-y-2 hover:shadow-[0_44px_70px_-40px_rgba(13,17,23,0.45)]',
                      )}
                    >
                      {plan.accent && (
                        <span className="absolute right-7 top-7 rounded-xl bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0d1117]">
                          Most Popular
                        </span>
                      )}
                      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-text-muted">{plan.name}</div>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-[58px] font-semibold leading-[0.9] tracking-[-0.045em] text-text-main md:text-[66px]">{plan.price}</span>
                        {plan.period && <span className="mb-2 text-[17px] text-text-muted">{plan.period}</span>}
                      </div>

                      {plan.showPriorityBox && (
                        <div className="mt-6 flex items-center gap-4">
                          <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', plan.accent ? 'bg-white/10' : 'bg-white')}>
                            <Clock className="h-5 w-5 text-text-main" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-[17px] font-medium text-text-main">{plan.priorityTitle || 'N/A'}</div>
                            <div className={cn('text-[11px] font-semibold uppercase tracking-[0.12em]', plan.accent ? 'text-accent' : 'text-[#15803d]')}>
                              {plan.prioritySubtitle || 'Daily Priority Access'}
                            </div>
                          </div>
                        </div>
                      )}

                      <hr className={cn('my-7 border-0 h-px', plan.accent ? 'bg-white/15' : 'bg-[#0d1117]/10')} />

                      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">What&apos;s included</h3>
                      <ul className="flex-grow space-y-3">
                        {(plan.features || []).map((f) => (
                          <li key={f} className="flex items-start gap-3 text-[16px] leading-snug text-text-main">
                            <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.accent ? 'text-accent' : 'text-[#15803d]')} aria-hidden="true" />
                            <span>{f}</span>
                          </li>
                        ))}
                        {(plan.unavailableFeatures || []).map((f) => (
                          <li key={f} className="flex items-start gap-3 text-[16px] leading-snug text-text-muted/70">
                            <X className="mt-0.5 h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
                            <span className="line-through"><span className="sr-only">Not included: </span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href={safeUrl(plan.buttonUrl) || '/#contact'}
                        {...(/^https?:/i.test(plan.buttonUrl || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className={cn(
                          'home-btn home-mag mt-9 w-full px-7 py-4 text-[16px]',
                          plan.accent ? 'bg-accent text-[#0d1117]' : 'border border-[#0d1117]/15 text-text-main hover:bg-[#0d1117] hover:text-white',
                        )}
                      >
                        {plan.buttonText || 'Get Started'}
                      </a>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* BLOG SECTION */}
        <section id="blog" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHead label="Journal" title="Latest Insights" />
            {blogPosts.length === 0 ? (
              loaded && <EmptyNote>New articles are on their way.</EmptyNote>
            ) : (
              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {blogPosts.map((post, i) => (
                  <Reveal key={post.id || post.title} delay={Math.min((i % 3) * 0.08, 0.2)}>
                    <article className="group h-full">
                      <Link to={`/blog/${post.slug || post.id}`} className="flex h-full flex-col">
                        {post.image && (
                          <div className="mb-6 aspect-[16/10] overflow-hidden rounded-[28px] bg-bg-card">
                            <Photo
                              src={post.image}
                              widths={[384, 640, 828]}
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              alt=""
                              width={640}
                              height={400}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )}
                        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-muted">{post.date}</div>
                        <h3 className="mt-3 text-[23px] font-semibold leading-[1.18] tracking-[-0.025em] text-text-main">{post.title}</h3>
                        <p className="mt-3 flex-grow text-[16px] leading-relaxed text-text-muted">{post.excerpt}</p>
                        <span className="mt-5 inline-flex items-center gap-2.5 text-[15px] font-medium text-text-main">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-[#0d1117] transition-transform duration-500 group-hover:translate-x-1.5" aria-hidden="true">
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                          Read article
                        </span>
                      </Link>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RESOURCES SECTION */}
        <ResourcesSection />

        {/* CONTACT SECTION */}
        <section id="contact" className="px-4 pb-16 pt-6 md:px-6 md:pb-24">
          <div className="mx-auto max-w-[1400px]">
            <div className="home-on-dark relative overflow-hidden rounded-[40px] bg-[linear-gradient(180deg,#3f78ad_0%,#5f93c4_55%,#8fb6d9_100%)] px-7 py-16 md:rounded-[56px] md:px-16 md:py-24">
              <div className="home-cloud home-cloud--a h-[200px] w-[620px] left-[-120px] bottom-[-60px]" aria-hidden="true" />
              <div className="home-cloud home-cloud--b h-[220px] w-[720px] right-[-160px] top-[-70px]" aria-hidden="true" />

              <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-20">
                <div>
                  <SectionHead
                    label="Contact"
                    title="Let's Build Something"
                    lead="Have a project in mind or just want to say hi? I'm always open to discussing new opportunities and creative ideas."
                    onDark
                  />
                  <div className="-mt-6 space-y-4">
                    {contactDetails.map((item, i) => (
                      <Reveal key={item.label} delay={Math.min(i * 0.08, 0.2)}>
                        <div className="flex items-center gap-4 rounded-[24px] border border-white/25 bg-white/15 p-5 backdrop-blur-sm transition-transform duration-500 hover:translate-x-2">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-[#0d1117]" aria-hidden="true">
                            <item.icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">{item.label}</div>
                            {item.href ? (
                              <a href={item.href} className="break-words text-[19px] font-medium text-white underline-offset-4 hover:underline">{item.value}</a>
                            ) : (
                              <span className="break-words text-[19px] font-medium text-white">{item.value}</span>
                            )}
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>

                <Reveal delay={0.1}>
                  <form
                    onSubmit={handleContactSubmit}
                    aria-label="Contact form"
                    className="grid gap-4 rounded-[34px] bg-white p-7 text-[#0d1117] shadow-[0_40px_60px_-30px_rgba(8,26,48,0.6)] md:p-9"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
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
                      <textarea id="contact-message" name="message" rows={5} required maxLength={5000} placeholder=" "></textarea>
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
                      className="home-btn home-mag mt-1 w-full bg-accent px-7 py-4 text-[16px] text-[#0d1117] disabled:opacity-60"
                    >
                      {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="sr-only">Sending…</span></> : <>Send Message <span className="home-arrow" aria-hidden="true">↗</span></>}
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

      </main>

      <Footer />
    </div>
  );
}
