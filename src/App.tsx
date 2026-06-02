import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence, useInView } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Laptop, 
  Braces, 
  Palette, 
  Megaphone, 
  Check, 
  CheckCircle2, 
  ExternalLink, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight, 
  Download, 
  MessageSquare, 
  Star, 
  ArrowRight, 
  Menu, 
  X, 
  FileText, 
  Clock, 
  Loader2, 
  Facebook, 
  Github, 
  Globe 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, handleFirestoreError, OperationType, addDocument, getCollection } from './services/firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import AdminDashboard from './components/AdminDashboard';
import ProjectDetail from './components/ProjectDetail';
import BlogDetail from './components/BlogDetail';
import PolicyPage from './components/PolicyPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ResourcesSection from './components/ResourcesSection';
import ResourcesPage from './components/ResourcesPage';
import { useSiteConfig } from './context/SiteConfigContext';
import { 
  normalizePricingPlan, 
  normalizeProject, 
  normalizeBlogPost, 
  normalizeService, 
  normalizeTestimonial, 
  normalizeResumeItem 
} from './lib/schema-defaults';
import { 
  Project, 
  BlogPost, 
  Service, 
  NavLink, 
  Stat, 
  Skill, 
  Testimonial, 
  PricingPlan 
} from './types';

const ICON_MAP: Record<string, any> = { Palette, Braces, Megaphone, Laptop };

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
    content: 'Nexus is a revolutionary brand identity project...',
    tags: ['Branding', 'Identity', 'Strategy']
  }
];

const TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Johnson', role: 'CEO, TechBase', content: 'Walid transform our brand completely...', avatar: 'https://i.pravatar.cc/150?u=sarah' }
];

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  { 
    id: 'future-minimalism',
    title: 'The Future of Minimalism', 
    date: 'May 10, 2024', 
    excerpt: 'Exploring how minimalist design is evolving in the age of AI.', 
    image: 'https://picsum.photos/seed/blog1/800/500',
    content: 'Minimalism has long been a staple of modern design...',
    author: 'Walid Rahman',
    tags: ['Design', 'AI', 'Minimalism']
  }
];

const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  { 
    name: 'Basic Plan', 
    price: '$350', 
    features: ['Website Design (up to 3 pages)'],
    unavailableFeatures: ['Mobile App Design'],
    buttonText: "Let's Talk",
    buttonUrl: "#",
    accent: false 
  }
];

const SectionHeader = ({ label, title }: { label: string; title: string }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });
  return (
    <div ref={containerRef} className="mb-16">
      <motion.span initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">{label}</motion.span>
      <div className="relative inline-block">
        <motion.h2 initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={isInView ? { clipPath: 'inset(0 0 0 0)' } : {}} transition={{ duration: 0.8, ease: "circOut" }} className="text-3xl md:text-5xl font-black text-text-main">{title}</motion.h2>
        <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}} transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }} className="absolute -bottom-2 left-0 h-1 w-20 bg-accent origin-left" />
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
      if (i === text.length) { getDocs; clearInterval(interval); setIsComplete(true); }
    }, 150);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span className="relative">
      {displayText}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "steps(2)" }} className={cn("inline-block w-[3px] h-[0.9em] bg-accent ml-1 -mb-1", isComplete && "hidden")} />
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
  
  const [heroImage, setHeroImage] = useState('/input_file_0.png');
  const [heroStatus, setHeroStatus] = useState('Active Now');
  const [heroAvailability, setHeroAvailability] = useState('Available for new projects');
  const [cvUrl, setCvUrl] = useState('#');
  const [resumeImage, setResumeImage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const sections = DEFAULT_HEADER_LINKS.map(link => document.getElementById(link.url.replace('/#', '').replace('#', '')));
      const scrollPos = window.scrollY + 100;
      sections.forEach(section => {
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) { setActiveSection(section.id); }
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [projSnap, servSnap, blogSnap, resSnap, testSnap, pricSnap, skillSnap] = await Promise.all([
          getCollection('projects'), getCollection('services'), getCollection('blogPosts'),
          getCollection('resume'), getCollection('testimonials'), getCollection('pricingPlans'), getCollection('skills')
        ]);
        if (projSnap) setProjects(projSnap.map(normalizeProject));
        if (servSnap) setServices(servSnap.map(s => ({ ...normalizeService(s), icon: ICON_MAP[(s as any).iconName] || Palette })));
        if (blogSnap) setBlogPosts(blogSnap.map(normalizeBlogPost));
        if (resSnap && resSnap.length > 0) { setResume(resSnap.map(normalizeResumeItem)); setHasResumeData(true); }
        if (skillSnap && skillSnap.length > 0) { setSkills(skillSnap as any); }
        if (testSnap && testSnap.length > 0) setTestimonials(testSnap.map(normalizeTestimonial));
        if (pricSnap) setPricingPlans(pricSnap.map(normalizePricingPlan));
      } catch (error) {
        console.error("Initial fetch error:", error);
      }
    };
    fetchAllData();

    const unsubscribeHero = onSnapshot(doc(db, 'siteConfig', 'hero'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setHeroImage(data.heroImage || '/input_file_0.png');
        setHeroStatus(data.heroStatus || 'Active Now');
        setHeroAvailability(data.heroAvailability || 'Available for new projects');
        setCvUrl(data.cvUrl || '#');
        setResumeImage(data.resumeImage || '');
      }
    });
    return () => unsubscribeHero();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };
    try {
      await addDocument('contactSubmissions', data);
      setFormStatus('success');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      setFormStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-dark overflow-x-hidden selection:bg-accent/30 selection:text-text-main">
      <Navbar />
      <main className="relative z-10">
        {/* Hero Section */}
        <section id="home" className="min-h-screen flex items-center relative overflow-hidden px-6 pt-20 pb-12 md:py-20">
          <div className="absolute rounded-full pointer-events-none -z-10 w-[300px] h-[300px] md:w-[600px] md:h-[600px] top-[-10%] left-[-10%]" style={{ background: 'radial-gradient(circle, #f45901 0%, transparent 70%)', opacity: 0.18, filter: 'blur(150px)' }} />
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
            <div className="z-10 text-center lg:text-left">
              <p className="text-accent text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4">Brand Developer</p>
              <h1 className="text-3xl md:text-8xl font-black mb-4 md:mb-6 leading-tight tracking-tighter uppercase">Hello, I'm <br /><span className="text-accent text-glow"><Typewriter text="Walid Rahman." /></span></h1>
              <div className="text-sm md:text-2xl text-text-muted mb-8 md:mb-10 max-w-lg mx-auto lg:mx-0">A Brand Developer crafting premium digital experiences.</div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-6">
                <a href="https://wa.me/+8801744588644" target="_blank" rel="noreferrer" className="bg-accent px-6 md:px-10 py-3 md:py-4 rounded-lg text-white font-black flex items-center gap-2 accent-shadow transition-all text-xs md:text-base border border-accent">Start Project</a>
                <a href={cvUrl} download target="_blank" rel="noreferrer" className="border border-border-subtle px-6 md:px-10 py-3 md:py-4 rounded-lg font-black flex items-center gap-2 hover:bg-white/5 transition-all text-text-main text-xs md:text-base">Download CV</a>
              </div>
            </div>
            <div className="relative flex justify-center order-first lg:order-last">
              <div className="relative w-full max-w-[320px] md:max-w-[420px] aspect-square">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/20 animate-[spin_20s_linear_infinite]" />
                <motion.div animate={{ y: [0, -10, 0], rotate: [1, 2, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-8 md:inset-12 rounded-3xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-2xl z-10">
                  <img src={heroImage} alt="Walid Rahman" className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 right-4 bg-bg-card/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1">{heroStatus}</div>
                    <div className="text-xs text-text-main/80">{heroAvailability}</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 md:py-32 px-6 bg-card-dark">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="About Me" title="Crafting Digital Excellence" />
            <div className="grid lg:grid-cols-2 gap-10 md:gap-16">
              <div>
                <p className="text-lg md:text-xl text-text-muted leading-relaxed mb-8">As a Team Leader with extensive expertise in digital marketing, ed-tech, e-commerce, and brand management, I drive strategic growth and innovation across diverse industries.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5"><div className="text-sm text-text-muted">Email</div><div className="font-bold underline decoration-accent/30"><a href="mailto:info@walidrahman.com">info@walidrahman.com</a></div></div>
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5"><div className="text-sm text-text-muted">Phone</div><div className="font-bold underline decoration-accent/30"><a href="tel:+8801744588644">+880 1744 588 644</a></div></div>
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5 col-span-full"><div className="text-sm text-text-muted">Location</div><div className="font-bold">Nikunja 2, Dhaka 1229, Bangladesh</div></div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/blog/:blogId" element={<BlogDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/products" element={<ResourcesPage />} />
        
        {/* NEW EXPLICIT POLICY CHANNELS */}
        <Route path="/terms-of-service" element={<PolicyPage type="terms" />} />
        <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />
        <Route path="/refund-policy" element={<PolicyPage type="refund" />} />
      </Routes>
    </BrowserRouter>
  );
}
