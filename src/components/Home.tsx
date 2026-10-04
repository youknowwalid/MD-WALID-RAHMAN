import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Laptop, Braces, Palette, Megaphone, Check, X, ExternalLink,
  Mail, Phone, MapPin, Clock, Loader2, MessageSquare, Star,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { listRows, submitContact } from '../lib/api';
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
import ResourcesSection from './ResourcesSection';
import Seo from './Seo';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = { Palette, Braces, Megaphone, Laptop };

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
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-neutral-900">
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
  const src = safeUrl(url);
  if (!src) return null;
  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-neutral-900">
      <video className="w-full h-full object-cover" controls playsInline preload="metadata">
        <source src={src} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

const SectionHeader = ({ label, title }: { label: string; title: string }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });

  return (
    <div ref={containerRef} className="mb-16">
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block"
      >
        {label}
      </motion.span>
      <div className="relative inline-block">
        <motion.h2
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={isInView ? { clipPath: 'inset(0 0 0 0)' } : {}}
          transition={{ duration: 0.8, ease: 'circOut' }}
          className="text-3xl md:text-5xl font-black text-text-main"
        >
          {title}
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: 'circOut' }}
          className="absolute -bottom-2 left-0 h-1 w-20 bg-accent origin-left"
        />
      </div>
    </div>
  );
};

const EmptyNote = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-3xl border border-dashed border-white/10 py-16 px-6 text-center text-text-muted">{children}</div>
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
      <span className="relative" aria-hidden="true">
        {displayText}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'steps(2)' }}
          className={cn('inline-block w-[3px] h-[0.9em] bg-accent ml-1 -mb-1', isComplete && 'hidden')}
        />
      </span>
    </>
  );
};

const Avatar = ({ src, name, className }: { src: string; name: string; className?: string }) =>
  src ? (
    <img src={src} alt="" className={cn('rounded-full object-cover', className)} referrerPolicy="no-referrer" loading="lazy" />
  ) : (
    <div className={cn('rounded-full bg-accent/15 text-accent font-black flex items-center justify-center', className)} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );

const MIN_FILL_MS = 3000;

export default function Home() {
  const { config, hero, seoConfig } = useSiteConfig();

  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [resume, setResume] = useState<ResumeItem[]>(FALLBACK_RESUME);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error' | 'limited' | 'mailto'>('idle');
  const formShownAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [proj, serv, blog, res, test, pric, skill] = await Promise.all([
        listRows('projects'), listRows('services'), listRows('blogPosts'), listRows('resume'),
        listRows('testimonials'), listRows('pricingPlans'), listRows('skills'),
      ]);
      if (cancelled) return;
      // null = no backend / unreachable: keep built-in content. [] = the owner removed everything on purpose.
      if (proj) setProjects(proj.map(normalizeProject));
      if (serv) setServices(serv.map(normalizeService));
      if (blog) setBlogPosts(blog.map(normalizeBlogPost));
      if (res) setResume(res.map(normalizeResumeItem));
      if (test) setTestimonials(test.map(normalizeTestimonial));
      if (pric) setPricingPlans(pric.map(normalizePricingPlan));
      if (skill) setSkills(skill as Skill[]);
    })();
    return () => { cancelled = true; };
  }, []);

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
    success: { text: 'Thank you! Your message has been sent.', cls: 'text-accent' },
    mailto: { text: 'Your e-mail app should open with your message ready to send.', cls: 'text-accent' },
    limited: { text: 'You have sent several messages recently. Please try again in a little while.', cls: 'text-red-400' },
    error: { text: 'Something went wrong. Please try again, or e-mail me directly.', cls: 'text-red-400' },
  };

  return (
    <div className="relative min-h-screen bg-bg-dark overflow-x-hidden selection:bg-accent/30 selection:text-text-main">
      <Seo />
      <Navbar />
      <main className="relative z-10">

        {/* HERO SECTION */}
        <section id="home" className="min-h-screen flex items-center relative overflow-hidden px-6 pt-20 pb-12 md:py-20">
          <div
            className="absolute rounded-full pointer-events-none -z-10 w-[300px] h-[300px] md:w-[600px] md:h-[600px] top-[-10%] left-[-10%]"
            style={{ background: 'radial-gradient(circle, #f45901 0%, transparent 70%)', opacity: 0.18, filter: 'blur(150px)' }}
          />
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
            <div className="z-10 text-center lg:text-left">
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-accent text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4">
                Brand Developer
              </motion.p>
              <h1 className="text-3xl md:text-8xl font-black mb-4 md:mb-6 leading-tight tracking-tighter uppercase">
                Hello, I&apos;m <br />
                <span className="text-accent text-glow">
                  <Typewriter text="Walid Rahman." />
                </span>
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm md:text-2xl text-text-muted mb-8 md:mb-10 max-w-lg mx-auto lg:mx-0">
                {config.brandTagline}
              </motion.p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-6">
                <motion.a
                  href={ctaHref}
                  {...(ctaExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  whileHover={{ scale: 1.05 }}
                  className="bg-accent px-6 md:px-10 py-3 md:py-4 rounded-lg text-white font-black flex items-center gap-2 accent-shadow transition-all text-xs md:text-base border border-accent"
                >
                  {config.globalCtaText}
                </motion.a>
                {hero.cvUrl && (
                  <motion.a
                    href={hero.cvUrl}
                    download="Walid_Rahman_CV.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    className="border border-border-subtle px-6 md:px-10 py-3 md:py-4 rounded-lg font-black flex items-center gap-2 hover:bg-white/5 transition-all text-text-main text-xs md:text-base"
                  >
                    Download CV
                  </motion.a>
                )}
              </div>

              {config.heroStats.length > 0 && (
                <dl className="mt-12 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 border-t border-white/5 pt-8 md:pt-12">
                  {config.heroStats.map((stat, i) => (
                    <div key={i} className="space-y-1">
                      <dd className="text-2xl md:text-3xl font-bold text-text-main order-1">
                        {stat.value}{stat.unit && <> <span className="text-accent text-lg">{stat.unit}</span></>}
                      </dd>
                      <dt className="text-[8px] md:text-[10px] text-text-muted uppercase tracking-widest leading-tight">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <div className="relative flex justify-center order-first lg:order-last">
              <div className="relative w-full max-w-[320px] md:max-w-[420px] aspect-square">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 md:inset-6 rounded-full border border-accent/40" />
                <motion.div animate={{ y: [0, -10, 0], rotate: [1, 2, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-8 md:inset-12 rounded-3xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-2xl z-10">
                  <img
                    src={heroImage}
                    alt="Portrait of Walid Rahman"
                    width={420}
                    height={420}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    decoding="async"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-bg-card/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1">{hero.heroStatus}</div>
                    <div className="text-xs text-text-main/80">{hero.heroAvailability}</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-16 md:py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="About Me" title="Crafting Digital Excellence" />
            <div className={cn('grid gap-10 md:gap-16 items-center', aboutVideo && 'lg:grid-cols-2')}>
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className={cn(!aboutVideo && 'max-w-3xl')}>
                <p className="text-lg md:text-xl text-text-muted leading-relaxed mb-8">{config.aboutText}</p>
                <ul className="flex flex-wrap gap-4">
                  {config.aboutTags.map((tag, i) => (
                    <motion.li key={tag} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-bold">
                      {tag}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {aboutVideo && (
                <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex items-center justify-center w-full h-full">
                  <VideoPlayer url={aboutVideo} />
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* RESUME SECTION */}
        <section id="resume" className="py-16 md:py-32 px-6 overflow-hidden relative">
          <div className="absolute rounded-full pointer-events-none -z-10 w-[350px] h-[350px] md:w-[700px] md:h-[700px] top-[20%] right-[-15%]" style={{ background: 'radial-gradient(circle, #f45901 0%, transparent 70%)', opacity: 0.16, filter: 'blur(150px)' }} />
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Resume" title="My Journey" />
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-start">
              <div className="space-y-8 md:space-y-12">
                {hero.resumeImage && (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:hidden w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 mb-8">
                    <img src={hero.resumeImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </motion.div>
                )}
                {resume.length === 0 && <EmptyNote>Experience will be listed here soon.</EmptyNote>}
                {resume.map((item, i) => (
                  <motion.div key={item.id || i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative pl-8 border-l border-white/10 hover:border-accent transition-colors">
                    <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-accent transition-all" />
                    <div className="mb-2">
                      <span className="text-xs font-bold text-accent uppercase tracking-tighter">{item.year}</span>
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-text-main">{item.role}</h3>
                      <div className="text-text-muted font-bold mb-4">{item.company}</div>
                      {item.desc && <p className="text-text-muted/80 max-w-2xl">{item.desc}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>

              {hero.resumeImage && (
                <div className="relative sticky top-32 hidden lg:flex justify-center">
                  <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut' }} className="relative w-full max-w-[450px] aspect-[3/4]">
                    <div className="absolute -inset-4 border border-accent/20 rounded-[40px] -z-10 animate-pulse" />
                    <motion.div animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="w-full h-full rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                      <img src={hero.resumeImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                      <div className="absolute bottom-8 left-8 right-8 p-4 bg-bg-card/40 backdrop-blur-md rounded-2xl border border-white/10">
                        <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1">Current Focus</div>
                        <div className="text-lg font-black text-text-main">Strategic Brand Evolution</div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        {services.length > 0 && (
          <section id="services" className="py-16 md:py-32 px-6 bg-bg-card/30">
            <div className="max-w-7xl mx-auto">
              <SectionHeader label="What I Do" title="My Specialities" />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {services.map((service, i) => {
                  const Icon = ICON_MAP[service.iconName || 'Palette'] || Palette;
                  return (
                    <motion.div key={service.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -10 }} className="p-8 bg-bg-card rounded-3xl border border-white/5 hover:border-accent/30 transition-all relative overflow-hidden group">
                      <div className="absolute -top-4 -right-4 text-6xl font-black text-text-main/5 group-hover:text-accent/10 transition-colors" aria-hidden="true">{service.displayId || String(i + 1).padStart(2, '0')}</div>
                      <div className="mb-6 w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                      <p className="text-text-muted">{service.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SKILLS SECTION */}
        {skills.length > 0 && (
          <section id="skills" className="py-16 md:py-32 px-6 relative overflow-hidden">
            <div className="absolute rounded-full pointer-events-none -z-10 w-[300px] h-[300px] md:w-[650px] md:h-[650px] top-[15%] left-[-15%]" style={{ background: 'radial-gradient(circle, #f45901 0%, transparent 70%)', opacity: 0.15, filter: 'blur(150px)' }} />
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <SectionHeader label="Excellence" title="Technical Arsenal" />
                <p className="text-text-muted text-base md:text-lg mb-10">My skills are refined through years of practical application in demanding environments. I focus on technologies that deliver performance and scalability.</p>
              </motion.div>
              <div className="space-y-8">
                {skills.map((skill, i) => (
                  <div key={skill.id || skill.name}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-text-main">{skill.name}</span>
                      <span className="text-accent">{skill.level}%</span>
                    </div>
                    <div className="h-2 w-full bg-border-subtle rounded-full overflow-hidden" role="progressbar" aria-label={skill.name} aria-valuenow={skill.level} aria-valuemin={0} aria-valuemax={100}>
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${skill.level}%` }} viewport={{ once: true }} transition={{ duration: 1.5, delay: i * 0.1 }} className="h-full bg-accent relative">
                        <div className="absolute right-0 top-0 h-full w-2 bg-text-main blur-sm opacity-50" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PROJECTS SECTION */}
        <section id="projects" className="py-16 md:py-32 px-6 bg-bg-card/50">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Portfolio" title="Featured Work" />
            {projects.length === 0 ? (
              <EmptyNote>Selected projects will be shown here soon.</EmptyNote>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {projects.map((project, i) => (
                  <motion.div key={project.id || project.title} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: (i % 2) * 0.15 }} className="relative aspect-video rounded-3xl overflow-hidden group bg-bg-card">
                    <Link to={`/projects/${project.slug || project.id}`} className="block w-full h-full relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                      {project.image && (
                        <img src={project.image} alt={project.title} width={800} height={450} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      )}
                      <div className="absolute inset-0 bg-bg-dark/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:bg-gradient-to-t [@media(hover:none)]:from-black/80 [@media(hover:none)]:to-transparent transition-opacity duration-300 flex flex-col justify-end p-8">
                        <span className="text-accent text-sm font-bold uppercase mb-2 tracking-widest">{project.category}</span>
                        <h3 className="text-3xl font-black mb-4 text-text-main">{project.title}</h3>
                        <div className="flex gap-4">
                          <div className="p-3 bg-accent rounded-full text-black hover:scale-110 transition-transform" aria-hidden="true">
                            <ExternalLink className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* TESTIMONIALS */}
        {testimonials.length > 0 && (
          <section className="py-16 md:py-32 bg-bg-card/20 overflow-hidden relative" aria-label="Client testimonials">
            <div className="absolute rounded-full pointer-events-none -z-10 w-[350px] h-[350px] md:w-[700px] md:h-[700px] top-[10%] right-[-15%]" style={{ background: 'radial-gradient(circle, #f45901 0%, transparent 70%)', opacity: 0.16, filter: 'blur(150px)' }} />
            <div className="max-w-7xl mx-auto px-6 mb-16">
              <SectionHeader label="Clients" title="Kind Words" />
            </div>
            <div className="relative flex overflow-hidden group/marquee">
              <div className="flex gap-6 py-4 px-3 animate-marquee group-hover/marquee:[animation-play-state:paused]" style={{ animationDuration: `${Math.max(20, testimonials.length * 4)}s` }}>
                {[...testimonials, ...testimonials].map((t, i) => (
                  <figure key={`${t.id}-${i}`} aria-hidden={i >= testimonials.length} className="w-[320px] md:w-[400px] h-[200px] p-5 md:p-6 bg-bg-card rounded-2xl border border-white/5 relative group hover:border-accent/30 transition-all flex flex-col shrink-0 m-0">
                    <div className="absolute top-4 right-4 text-accent/10 opacity-40" aria-hidden="true"><MessageSquare className="w-5 h-5" /></div>
                    <div className="flex gap-0.5 mb-2" aria-hidden="true">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-2 h-2 md:w-2.5 md:h-2.5 fill-accent text-accent" />)}</div>
                    <blockquote className="text-[11px] md:text-[13px] text-text-muted leading-snug italic mb-4 flex-grow line-clamp-3 m-0">&quot;{t.content}&quot;</blockquote>
                    <figcaption className="flex items-center gap-3 pt-3 border-t border-white/5">
                      <Avatar src={t.avatar} name={t.name} className="w-12 h-12 md:w-14 md:h-14 shrink-0 border-2 border-bg-card" />
                      <div>
                        <div className="text-lg md:text-[22px] font-black text-text-main leading-none mb-1">{t.name}</div>
                        <div className="text-[10px] md:text-[12px] text-accent font-bold uppercase tracking-wider">{t.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PRICING SECTION */}
        {pricingPlans.length > 0 && (
          <section id="pricing" className="py-16 md:py-32 px-6 bg-bg-dark transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
              <SectionHeader label="Investment" title="Pricing Plans" />
              <div className="grid lg:grid-cols-3 gap-8 md:gap-10">
                {pricingPlans.map((plan, i) => (
                  <motion.div key={plan.id || plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={cn('p-10 bg-bg-card rounded-3xl border border-border-subtle relative transition-all duration-300 hover:border-accent/30 group', plan.accent && 'scale-105 z-10 shadow-[0_0_50px_rgba(244,89,1,0.1)] border-accent/40')}>
                    {plan.accent && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-black uppercase px-6 py-1.5 rounded-full tracking-widest shadow-lg z-20">Most Popular</div>}
                    <div className="mb-8">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-accent mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-text-main tracking-tighter">{plan.price}</span>
                        {plan.period && <span className="text-text-muted font-medium text-sm">{plan.period}</span>}
                      </div>
                    </div>

                    <div className="space-y-8 mb-10 text-left">
                      {plan.showPriorityBox && (
                        <div className="p-5 bg-accent/5 border border-accent/10 rounded-2xl flex items-center gap-4 transition-all group-hover:bg-accent/10">
                          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center shrink-0"><Clock className="w-6 h-6 text-accent animate-pulse" /></div>
                          <div>
                            <div className="text-text-main font-black text-lg leading-tight">{plan.priorityTitle || 'N/A'}</div>
                            <div className="text-[10px] text-accent font-bold uppercase tracking-[0.1em]">{plan.prioritySubtitle || 'Daily Priority Access'}</div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-text-main/60 uppercase tracking-[0.3em] mb-2">What&apos;s included</h4>
                        <ul className="space-y-4">
                          {(plan.features || []).map((f) => (
                            <li key={f} className="flex items-start gap-3 text-text-main text-sm font-medium leading-tight group/item">
                              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-accent/20 transition-colors"><Check className="w-3 h-3 text-accent" /></div>
                              <span className="opacity-90">{f}</span>
                            </li>
                          ))}
                          {(plan.unavailableFeatures || []).map((f) => (
                            <li key={f} className="flex items-start gap-3 text-text-muted/60 text-sm font-medium leading-tight select-none">
                              <div className="w-5 h-5 rounded-full bg-border-subtle flex items-center justify-center shrink-0 mt-0.5 opacity-50"><X className="w-3 h-3 text-text-muted" /></div>
                              <span className="line-through decoration-text-muted/20"><span className="sr-only">Not included: </span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <a
                      href={safeUrl(plan.buttonUrl) || '/#contact'}
                      {...(/^https?:/i.test(plan.buttonUrl || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={cn('flex items-center justify-center w-full py-4 rounded-xl font-black transition-all overflow-hidden relative group text-xs uppercase tracking-[0.2em]', plan.accent ? 'bg-accent text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20' : 'border border-border-subtle hover:border-accent hover:text-accent text-text-main bg-transparent')}
                    >
                      <span className="relative z-10">{plan.buttonText || 'Get Started'}</span>
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* BLOG SECTION */}
        <section id="blog" className="py-16 md:py-32 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Journal" title="Latest Insights" />
            {blogPosts.length === 0 ? (
              <EmptyNote>New articles are on their way.</EmptyNote>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {blogPosts.map((post, i) => (
                  <motion.div key={post.id || post.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.1 }} className="group">
                    <Link to={`/blog/${post.slug || post.id}`}>
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 border border-white/5 group-hover:border-accent/40 transition-all bg-bg-card">
                        {post.image && <img src={post.image} alt="" width={640} height={480} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" referrerPolicy="no-referrer" loading="lazy" decoding="async" />}
                      </div>
                      <div className="text-xs text-accent font-bold uppercase mb-2">{post.date}</div>
                      <h3 className="text-lg font-bold group-hover:text-accent transition-colors mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-text-muted text-sm line-clamp-2">{post.excerpt}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RESOURCES SECTION */}
        <ResourcesSection />

        {/* CONTACT SECTION */}
        <section id="contact" className="py-16 md:py-32 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 md:gap-16">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SectionHeader label="Contact" title="Let's Build Something" />
              <p className="text-text-muted text-base md:text-lg mb-12">Have a project in mind or just want to say hi? I&apos;m always open to discussing new opportunities and creative ideas.</p>

              <div className="space-y-6">
                {[
                  config.contactEmail && { icon: Mail, label: 'Email', value: config.contactEmail, href: `mailto:${config.contactEmail}` },
                  config.officePhone && { icon: Phone, label: 'Phone', value: config.officePhone, href: `tel:${phoneDigits}` },
                  config.officeAddress && { icon: MapPin, label: 'Office', value: config.officeAddress, href: '' },
                ].filter(Boolean).map((item: any, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent shrink-0" aria-hidden="true"><item.icon className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <div className="text-sm text-text-muted uppercase font-black tracking-widest">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-lg font-bold hover:text-accent transition-colors break-words">{item.value}</a>
                      ) : (
                        <span className="text-lg font-bold">{item.value}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.form initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} onSubmit={handleContactSubmit} className="p-6 sm:p-10 bg-bg-card rounded-3xl border border-white/5" aria-label="Contact form">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div><label htmlFor="contact-name" className="block text-sm font-bold mb-2">Name</label><input id="contact-name" name="name" type="text" required maxLength={120} autoComplete="name" className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="John Doe" /></div>
                <div><label htmlFor="contact-email" className="block text-sm font-bold mb-2">Email</label><input id="contact-email" name="email" type="email" required maxLength={254} autoComplete="email" className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="john@example.com" /></div>
              </div>
              <div className="mb-6"><label htmlFor="contact-subject" className="block text-sm font-bold mb-2">Subject</label><input id="contact-subject" name="subject" type="text" maxLength={200} className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="Project Inquiry" /></div>
              <div className="mb-8"><label htmlFor="contact-message" className="block text-sm font-bold mb-2">Message</label><textarea id="contact-message" name="message" rows={4} required maxLength={5000} className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all resize-none" placeholder="Tell me about your project..."></textarea></div>
              {/* Honeypot: invisible to people, tempting to bots */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="contact-website">Leave this field empty</label>
                <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-accent text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {isSubmitting ? <><Loader2 className="animate-spin w-5 h-5" /><span className="sr-only">Sending…</span></> : 'Send Message'}
              </button>
              <p role="status" aria-live="polite" className={cn('mt-4 text-center font-bold', statusMessages[formStatus]?.cls)}>
                {statusMessages[formStatus]?.text}
              </p>
            </motion.form>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
