import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence, useInView } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Laptop, Braces, Palette, Megaphone, Check, CheckCircle2, ExternalLink, 
  Linkedin, Mail, Phone, MapPin, ChevronRight, Download, MessageSquare, 
  Star, ArrowRight, Menu, X, FileText, Clock, Loader2, Facebook, Github, Globe 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, handleFirestoreError, OperationType, addDocument, getCollection } from './services/firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import AdminDashboard from './components/AdminDashboard';
import ProjectDetail from './components/ProjectDetail';
import BlogDetail from './components/BlogDetail';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ResourcesSection from './components/ResourcesSection';
import ResourcesPage from './components/ResourcesPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import RefundPolicy from './components/RefundPolicy';
import { useSiteConfig } from './context/SiteConfigContext';
import { 
  normalizePricingPlan, normalizeProject, normalizeBlogPost, normalizeService, 
  normalizeTestimonial, normalizeResumeItem 
} from './lib/schema-defaults';

import { 
  Project, BlogPost, Service, NavLink, Stat, Skill, Testimonial, PricingPlan 
} from './types';

// --- Icons Mapping ---
const ICON_MAP: Record<string, any> = {
  Palette, Braces, Megaphone, Laptop
};

// --- Constants ---
const DEFAULT_HEADER_LINKS = [
  { label: 'Home', url: '/#home' },
  { label: 'About', url: '/#about' },
  { label: 'Resume', url: '/#resume' },
  { label: 'Services', url: '/#services' },
  { label: 'Projects', url: '/#projects' },
  { label: 'Resources', url: '/#resources' },
  { label: 'Contact', url: '/#contact' },
  { label: 'Blog', url: '/#blog' },
];

const DEFAULT_SERVICES: Service[] = [
  { id: '01', title: 'Brand Identity', description: 'Crafting unique visual identities that resonate with your target audience.', icon: Palette },
  { id: '02', title: 'Web Development', description: 'Building fast, responsive, and modern websites using the latest technologies.', icon: Braces },
  { id: '03', title: 'Digital Marketing', description: 'Strategic marketing campaigns to grow your brand and reach new customers.', icon: Megaphone },
  { id: '04', title: 'Product Strategy', description: 'Defining the roadmap and vision for your digital products.', icon: Laptop },
  { id: '05', title: 'UI/UX Design', description: 'Designing intuitive and beautiful user experiences.', icon: Palette },
  { id: '06', title: 'Content Creation', description: 'Engaging content that tells your brands story across all platforms.', icon: Megaphone },
];

const DEFAULT_PROJECTS: Project[] = [
  { 
    id: 'nexus-brand',
    title: 'Nexus Brand Identity', 
    category: 'Branding', 
    image: 'https://picsum.photos/seed/nexus/800/600', 
    link: '/projects/nexus-brand',
    content: 'Nexus is a revolutionary brand identity project that focused on bridging the gap between corporate rigidity and creative fluidity.',
    tags: ['Branding', 'Identity', 'Strategy']
  }
];

const TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Johnson', role: 'CEO, TechBase', content: 'Walid transform our brand completely. His attention to detail and creative vision are unmatched.', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { name: 'Michael Chen', role: 'Founder, EcoStream', content: 'Working with Walid was a game-changer for our digital presence.', avatar: 'https://i.pravatar.cc/150?u=michael' },
];

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  { 
    id: 'future-minimalism',
    title: 'The Future of Minimalism', 
    date: 'May 10, 2024', 
    excerpt: 'Exploring how minimalist design is evolving in the age of AI.', 
    image: 'https://picsum.photos/seed/blog1/800/500',
    content: 'Minimalism has long been a staple of modern design, but as we enter the age of Artificial Intelligence, the philosophy is undergoing a significant transformation.',
    author: 'Walid Rahman',
    tags: ['Design', 'AI', 'Minimalism']
  }
];

const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  { 
    name: 'Basic Plan', 
    price: '$350', 
    features: ['Website Design (up to 3 pages)', 'Basic Brand Identity & Logo'],
    unavailableFeatures: ['Mobile App Design', 'Product Design'],
    buttonText: "Let's Talk",
    buttonUrl: "#",
    accent: false 
  }
];

// --- Components ---

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
          transition={{ duration: 0.8, ease: "circOut" }}
          className="text-3xl md:text-5xl font-black text-text-main"
        >
          {title}
        </motion.h2>
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
          className="absolute -bottom-2 left-0 h-1 w-20 bg-accent origin-left"
        />
      </div>
    </div>
  );
};

const Typewriter = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="relative">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "steps(2)" }}
        className={cn(
          "inline-block w-[3px] h-[0.9em] bg-accent ml-1 -mb-1",
          isComplete && "hidden"
        )}
      />
    </span>
  );
};
function Portfolio() {
  const { config } = useSiteConfig();
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [resume, setResume] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(TESTIMONIALS);

  const [hasResumeData, setHasResumeData] = useState(false);
  
  const [heroImage, setHeroImage] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) return JSON.parse(cached).heroImage || '/input_file_0.png';
    } catch (e) {}
    return '/input_file_0.png';
  });

  const [heroStatus, setHeroStatus] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) return JSON.parse(cached).heroStatus || 'Active Now';
    } catch (e) {}
    return 'Active Now';
  });

  const [heroAvailability, setHeroAvailability] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) return JSON.parse(cached).heroAvailability || 'Available for new projects';
    } catch (e) {}
    return 'Available for new projects';
  });

  const [cvUrl, setCvUrl] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) return JSON.parse(cached).cvUrl || '#';
    } catch (e) {}
    return '#';
  });

  const [resumeImage, setResumeImage] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) return JSON.parse(cached).resumeImage || '';
    } catch (e) {}
    return '';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const sections = DEFAULT_HEADER_LINKS.map(link => 
        document.getElementById(link.url.replace('/#', '').replace('#', ''))
      );
      const scrollPos = window.scrollY + 100;

      sections.forEach(section => {
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const results = await Promise.allSettled([
          getCollection('projects'),
          getCollection('services'),
          getCollection('blogPosts'),
          getCollection('resume'),
          getCollection('testimonials'),
          getCollection('pricingPlans'),
          getCollection('skills')
        ]);

        const projSnap = results[0].status === 'fulfilled' ? results[0].value : null;
        const servSnap = results[1].status === 'fulfilled' ? results[1].value : null;
        const blogSnap = results[2].status === 'fulfilled' ? results[2].value : null;
        const resSnap = results[3].status === 'fulfilled' ? results[3].value : null;
        const testSnap = results[4].status === 'fulfilled' ? results[4].value : null;
        const pricSnap = results[5].status === 'fulfilled' ? results[5].value : null;
        const skillSnap = results[6].status === 'fulfilled' ? results[6].value : null;

        if (projSnap && projSnap.length > 0) setProjects(projSnap.map(normalizeProject));
        if (servSnap && servSnap.length > 0) setServices(servSnap.map(s => ({ ...normalizeService(s), icon: ICON_MAP[(s as any).iconName] || Palette })));
        if (blogSnap && blogSnap.length > 0) setBlogPosts(blogSnap.map(normalizeBlogPost));
        if (resSnap && resSnap.length > 0) { setResume(resSnap.map(normalizeResumeItem)); setHasResumeData(true); }
        if (skillSnap && skillSnap.length > 0) setSkills(skillSnap as any);
        if (testSnap && testSnap.length > 0) setTestimonials(testSnap.map(normalizeTestimonial));
        if (pricSnap && pricSnap.length > 0) setPricingPlans(pricSnap.map(normalizePricingPlan));
      } catch (error) {
        console.error("Fetch isolated error:", error);
      }
    };
    fetchAllData();

    const unsubscribeHero = onSnapshot(doc(db, 'siteConfig', 'hero'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setHeroImage(data.heroImage || '/input_file_0.png'); setHeroStatus(data.heroStatus || 'Active Now');
        setHeroAvailability(data.heroAvailability || 'Available for new projects'); setCvUrl(data.cvUrl || '#'); setResumeImage(data.resumeImage || '');
      }
    });
    return () => unsubscribeHero();
    // This automatically handles the Browser Tab and Favicon for you
useEffect(() => {
  if (config.siteTitle) {
    document.title = config.siteTitle;
  }
  if (config.favicon) {
    let link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = config.favicon;
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}, [config.siteTitle, config.favicon]);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setIsSubmitting(true); setFormStatus('idle');
    const formData = new FormData(e.currentTarget);
    const data = { name: formData.get('name') as string, email: formData.get('email') as string, subject: formData.get('subject') as string, message: formData.get('message') as string };
    try { await addDocument('contactSubmissions', data); setFormStatus('success'); (e.target as HTMLFormElement).reset(); } 
    catch (error) { setFormStatus('error'); } finally { setIsSubmitting(false); setTimeout(() => setFormStatus('idle'), 5000); }
  };

  return (
    <div className="relative min-h-screen bg-bg-dark overflow-x-hidden selection:bg-accent/30 selection:text-text-main">
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
                Hello, I'm <br />
                <span className="text-accent text-glow">
                  <Typewriter text="Walid Rahman." />
                </span>
              </h1>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm md:text-2xl text-text-muted mb-8 md:mb-10 max-w-lg mx-auto lg:mx-0">
                {config.brandTagline || 'A Brand Developer crafting premium digital experiences.'}
              </motion.div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-6">
                <motion.a href="https://wa.me/+8801744588644" target="_blank" rel="noreferrer" whileHover={{ scale: 1.05 }} className="bg-accent px-6 md:px-10 py-3 md:py-4 rounded-lg text-white font-black flex items-center gap-2 accent-shadow transition-all text-xs md:text-base border border-accent">
                  {config.globalCtaText || "Start Project"}
                </motion.a>
                <motion.a href={cvUrl} download="Walid_Rahman_CV.pdf" target="_blank" rel="noreferrer" whileHover={{ scale: 1.05 }} className="border border-border-subtle px-6 md:px-10 py-3 md:py-4 rounded-lg font-black flex items-center gap-2 hover:bg-white/5 transition-all text-text-main text-xs md:text-base">
                  Download CV
                </motion.a>
              </div>

              <div className="mt-12 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 border-t border-white/5 pt-8 md:pt-12">
                <div className="space-y-1">
                  <div className="text-2xl md:text-3xl font-bold text-text-main">8+ <span className="text-accent text-lg">Yrs</span></div>
                  <div className="text-[8px] md:text-[10px] text-text-muted uppercase tracking-widest leading-tight">Experience</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl md:text-3xl font-bold text-text-main">1K+</div>
                  <div className="text-[8px] md:text-[10px] text-text-muted uppercase tracking-widest leading-tight">Clients Met</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl md:text-3xl font-bold text-text-main">97%</div>
                  <div className="text-[8px] md:text-[10px] text-text-muted uppercase tracking-widest leading-tight">Success Rate</div>
                </div>
              </div>
            </div>
            
            <div className="relative flex justify-center order-first lg:order-last">
              <div className="relative w-full max-w-[320px] md:max-w-[420px] aspect-square">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 md:inset-6 rounded-full border border-accent/40" />
                <motion.div animate={{ y: [0, -10, 0], rotate: [1, 2, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-8 md:inset-12 rounded-3xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-2xl z-10">
                  <img src={heroImage} alt="Walid Rahman" className="w-full h-full object-cover transition-all duration-700" referrerPolicy="no-referrer" loading="lazy" />
                  <div className="absolute bottom-4 left-4 right-4 bg-bg-card/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1">{heroStatus}</div>
                    <div className="text-xs text-text-main/80">{heroAvailability}</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-16 md:py-32 px-6 bg-card-dark">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="About Me" title="Crafting Digital Excellence" />
            <div className="grid lg:grid-cols-2 gap-10 md:gap-16">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <p className="text-lg md:text-xl text-text-muted leading-relaxed mb-8">
                  As a Team Leader with extensive expertise in digital marketing, ed-tech, e-commerce, and brand management, I drive strategic growth and innovation across diverse industries. With a background that spans art direction, product design, sales, and more, I bring a multifaceted perspective to every project.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['Project Management', 'Web Development', 'Digital Marketing', 'Brand Development'].map((tag, i) => (
                    <motion.div key={tag} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-bold">
                      {tag}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5 hover:border-accent/40 transition-all cursor-default">
                  <Mail className="text-accent mb-4" />
                  <div className="text-sm text-text-muted">Email</div>
                  <div className="font-bold underline decoration-accent/30"><a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></div>
                </div>
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5 hover:border-accent/40 transition-all cursor-default">
                  <Phone className="text-accent mb-4" />
                  <div className="text-sm text-text-muted">Phone</div>
                  <div className="font-bold underline decoration-accent/30"><a href={`tel:${config.officePhone}`}>{config.officePhone}</a></div>
                </div>
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5 hover:border-accent/40 transition-all cursor-default col-span-full">
                  <MapPin className="text-accent mb-4" />
                  <div className="text-sm text-text-muted">Location</div>
                  <div className="font-bold">{config.officeAddress}</div>
                </div>
              </motion.div>
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
                {resumeImage && (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:hidden w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 mb-8">
                    <img src={resumeImage} alt="Journey" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </motion.div>
                )}
                {(hasResumeData ? resume : [
                  { year: '2024 - Present', role: 'Executive Director', company: 'De Jure Academy', desc: '' },
                  { year: '2020 - 2022', role: 'Project Manager', company: 'JBL Bangladesh', desc: '' }
                ]).map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative pl-8 border-l border-white/10 hover:border-accent transition-colors">
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
              {resumeImage && (
                <div className="relative sticky top-32 hidden lg:flex justify-center">
                  <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut' }} className="relative w-full max-w-[450px] aspect-[3/4]">
                    <div className="absolute -inset-4 border border-accent/20 rounded-[40px] -z-10 animate-pulse" />
                    <motion.div animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="w-full h-full rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                      <img src={resumeImage} alt="Journey" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
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
        <section id="services" className="py-16 md:py-32 px-6 bg-bg-card/30">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="What I Do" title="My Specialities" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {services.map((service, i) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -10 }} className="p-8 bg-bg-card rounded-3xl border border-white/5 hover:border-accent/30 transition-all relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 text-6xl font-black text-text-main/5 group-hover:text-accent/10 transition-colors">{service.displayId || '00'}</div>
                  <div className="mb-6 w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                    {service.icon && <service.icon className="w-6 h-6" />}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                  <p className="text-gray-400">{service.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SKILLS SECTION */}
        <section id="skills" className="py-16 md:py-32 px-6 relative overflow-hidden">
          <div className="absolute rounded-full pointer-events-none -z-10 w-[300px] h-[300px] md:w-[650px] md:h-[650px] top-[15%] left-[-15%]" style={{ background: 'radial-gradient(circle, #f45901 0%, transparent 70%)', opacity: 0.15, filter: 'blur(150px)' }} />
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SectionHeader label="Excellence" title="Technical Arsenal" />
              <p className="text-gray-400 text-base md:text-lg mb-10">My skills are refined through years of practical application in demanding environments. I focus on technologies that deliver performance and scalability.</p>
            </motion.div>
            <div className="space-y-8">
              {skills.map((skill, i) => (
                <div key={skill.name}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-text-main">{skill.name}</span>
                    <span className="text-accent">{skill.level}%</span>
                  </div>
                  <div className="h-2 w-full bg-border-subtle rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${skill.level}%` }} viewport={{ once: true }} transition={{ duration: 1.5, delay: i * 0.1 }} className="h-full bg-accent relative">
                      <div className="absolute right-0 top-0 h-full w-2 bg-text-main blur-sm opacity-50" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROJECTS SECTION */}
        <section id="projects" className="py-16 md:py-32 px-6 bg-bg-card/50">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Portfolio" title="Featured Work" />
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {projects.map((project, i) => (
                <motion.div key={project.id || project.title} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative aspect-video rounded-3xl overflow-hidden group">
                  <Link to={`/projects/${project.slug || project.id || project.title.toLowerCase().replace(/\s+/g, '-')}`} className="block w-full h-full relative">
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                      <span className="text-accent text-sm font-bold uppercase mb-2 tracking-widest">{project.category}</span>
                      <h3 className="text-3xl font-black mb-4 text-text-main">{project.title}</h3>
                      <div className="flex gap-4">
                        <div className="p-3 bg-accent rounded-full text-black hover:scale-110 transition-transform">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 md:py-32 bg-bg-card/20 overflow-hidden relative">
          <div className="absolute rounded-full pointer-events-none -z-10 w-[350px] h-[350px] md:w-[700px] md:h-[700px] top-[10%] right-[-15%]" style={{ background: 'radial-gradient(circle, #f45901 0%, transparent 70%)', opacity: 0.16, filter: 'blur(150px)' }} />
          <div className="max-w-7xl mx-auto px-6 mb-16">
            <SectionHeader label="Clients" title="Kind Words" />
          </div>
          <div className="relative flex overflow-hidden group/marquee">
            <div className="flex gap-6 py-4 px-3 animate-marquee group-hover/marquee:[animation-play-state:paused]" style={{ animationDuration: `${Math.max(20, testimonials.length * 4)}s` }}>
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={`${t.id}-${i}`} className="w-[320px] md:w-[400px] h-[200px] p-5 md:p-6 bg-bg-card rounded-2xl border border-white/5 relative group hover:border-accent/30 transition-all flex flex-col shrink-0">
                  <div className="absolute top-4 right-4 text-accent/10 opacity-40"><MessageSquare className="w-5 h-5" /></div>
                  <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(s => <Star key={s} className="w-2 h-2 md:w-2.5 md:h-2.5 fill-accent text-accent" />)}</div>
                  <p className="text-[11px] md:text-[13px] text-gray-400 leading-snug italic mb-4 flex-grow line-clamp-3">"{t.content}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
                      <img src={t.avatar} alt={t.name} className="w-full h-full rounded-full object-cover relative z-10 border-2 border-bg-card" referrerPolicy="no-referrer" loading="lazy" />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-[22px] font-black text-text-main leading-none mb-1">{t.name}</h4>
                      <p className="text-[10px] md:text-[12px] text-accent font-bold uppercase tracking-wider">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-16 md:py-32 px-6 bg-bg-dark transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Investment" title="Pricing Plans" />
            <div className="grid lg:grid-cols-3 gap-8 md:gap-10">
              {pricingPlans.map((plan, i) => (
                <motion.div key={plan.id || plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={cn("p-10 bg-bg-card rounded-3xl border border-border-subtle relative transition-all duration-300 hover:border-accent/30 group", plan.accent && "scale-105 z-10 shadow-[0_0_50px_rgba(244,89,1,0.1)] border-accent/40")}>
                  {plan.accent && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-black uppercase px-6 py-1.5 rounded-full tracking-widest shadow-lg z-20">Most Popular</div>}
                  <div className="mb-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-accent mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-text-main tracking-tighter">{plan.price}</span>
                      <span className="text-text-muted/60 font-medium text-sm">/month</span>
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
                      <h4 className="text-[10px] font-black text-text-main/40 uppercase tracking-[0.3em] mb-2">Technical Arsenal</h4>
                      <ul className="space-y-4">
                        {(plan.features || []).map(f => (
                          <li key={f} className="flex items-start gap-3 text-text-main text-sm font-medium leading-tight group/item">
                            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-accent/20 transition-colors"><Check className="w-3 h-3 text-accent" /></div>
                            <span className="opacity-90">{f}</span>
                          </li>
                        ))}
                        {(plan.unavailableFeatures || []).map(f => (
                          <li key={f} className="flex items-start gap-3 text-text-muted/40 text-sm font-medium leading-tight select-none">
                            <div className="w-5 h-5 rounded-full bg-border-subtle flex items-center justify-center shrink-0 mt-0.5 opacity-50"><X className="w-3 h-3 text-text-muted" /></div>
                            <span className="line-through decoration-text-muted/20">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <a href={plan.buttonUrl || "#"} target="_blank" rel="noreferrer" className={cn("flex items-center justify-center w-full py-4 rounded-xl font-black transition-all overflow-hidden relative group text-xs uppercase tracking-[0.2em]", plan.accent ? "bg-accent text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20" : "border border-border-subtle hover:border-accent hover:text-accent text-text-main bg-transparent")}>
                    <span className="relative z-10">{plan.buttonText || "Get Started"}</span>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* BLOG SECTION */}
        <section id="blog" className="py-16 md:py-32 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Journal" title="Latest Insights" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogPosts.map((post, i) => (
                <motion.div key={post.id || post.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group cursor-pointer">
                  <Link to={`/blog/${post.slug || post.id || post.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 border border-white/5 group-hover:border-accent/40 transition-all">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" referrerPolicy="no-referrer" loading="lazy" />
                    </div>
                    <div className="text-xs text-accent font-bold uppercase mb-2">{post.date}</div>
                    <h4 className="text-lg font-bold group-hover:text-accent transition-colors mb-2 line-clamp-2">{post.title}</h4>
                    <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* RESOURCES SECTION */}
        <ResourcesSection />

        {/* CONTACT SECTION */}
        <section id="contact" className="py-16 md:py-32 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 md:gap-16">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SectionHeader label="Contact" title="Let's Build Something" />
              <p className="text-gray-400 text-base md:text-lg mb-12">Have a project in mind or just want to say hi? I'm always open to discussing new opportunities and creative ideas.</p>
              <div className="space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: config.contactEmail || 'info@walidrahman.com', href: `mailto:${config.contactEmail || 'info@walidrahman.com'}` },
                  { icon: Phone, label: 'Phone', value: config.officePhone || '+880 1744 588 644', href: `tel:${config.officePhone || '+8801744588644'}` },
                  { icon: MapPin, label: 'Office', value: config.officeAddress || 'Nikunja 2, Dhaka 1229', href: '#' },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent"><item.icon className="w-5 h-5" /></div>
                    <div>
                      <div className="text-sm text-gray-500 uppercase font-black tracking-widest">{item.label}</div>
                      <a href={item.href} target="_blank" rel="noreferrer" className="text-lg font-bold hover:text-accent transition-colors">{item.value}</a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.form initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} onSubmit={handleContactSubmit} className="p-10 bg-bg-card rounded-3xl border border-white/5">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div><label className="block text-sm font-bold mb-2">Name</label><input name="name" type="text" required className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="John Doe" /></div>
                <div><label className="block text-sm font-bold mb-2">Email</label><input name="email" type="email" required className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="john@example.com" /></div>
              </div>
              <div className="mb-6"><label className="block text-sm font-bold mb-2">Subject</label><input name="subject" type="text" className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="Project Inquiry" /></div>
              <div className="mb-8"><label className="block text-sm font-bold mb-2">Message</label><textarea name="message" rows={4} required className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all resize-none" placeholder="Tell me about your project..."></textarea></div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-accent text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Message"}
              </button>
              {formStatus === 'success' && <p className="mt-4 text-accent text-center font-bold">Thank you! Your message has been sent.</p>}
              {formStatus === 'error' && <p className="mt-4 text-red-400 text-center font-bold">Something went wrong. Please try again.</p>}
            </motion.form>
          </div>
        </section>

      </main>
      
      {/* FOOTER */}
      <Footer />
    </div>
  );
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/blog/:blogId" element={<BlogDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/products" element={<ResourcesPage />} />
        
        {/* NEW EXPLICIT POLICY CHANNELS */}
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}
