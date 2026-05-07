import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence, useInView } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Laptop, 
  Braces, 
  Palette, 
  Megaphone, 
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
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, handleFirestoreError, OperationType, addDocument } from './services/firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import AdminDashboard from './components/AdminDashboard';
import ProjectDetail from './components/ProjectDetail';
import BlogDetail from './components/BlogDetail';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

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

// --- Icons Mapping ---
const ICON_MAP: Record<string, any> = {
  Palette,
  Braces,
  Megaphone,
  Laptop
};

// --- Constants ---
const NAV_LINKS = [
  { name: 'Home', href: '/#home' },
  { name: 'About', href: '/#about' },
  { name: 'Resume', href: '/#resume' },
  { name: 'Services', href: '/#services' },
  { name: 'Projects', href: '/#projects' },
  { name: 'Contact', href: '/#contact' },
  { name: 'Blog', href: '/#blog' },
];

const STATS: Stat[] = [
  { label: 'Years Experience', value: '8+', number: 8 },
  { label: 'Projects Complete', value: '1K+', number: 1000 },
  { label: 'Client Satisfactions', value: '97%', number: 97 },
];

const DEFAULT_SERVICES: Service[] = [
  { id: '01', title: 'Brand Identity', description: 'Crafting unique visual identities that resonate with your target audience.', icon: Palette },
  { id: '02', title: 'Web Development', description: 'Building fast, responsive, and modern websites using the latest technologies.', icon: Braces },
  { id: '03', title: 'Digital Marketing', description: 'Strategic marketing campaigns to grow your brand and reach new customers.', icon: Megaphone },
  { id: '04', title: 'Product Strategy', description: 'Defining the roadmap and vision for your digital products.', icon: Laptop },
  { id: '05', title: 'UI/UX Design', description: 'Designing intuitive and beautiful user experiences.', icon: Palette },
  { id: '06', title: 'Content Creation', description: 'Engaging content that tells your brands story across all platforms.', icon: Megaphone },
];

const SKILLS: Skill[] = [
  { name: 'Canva', level: 98 },
  { name: 'Meta Ads', level: 96 },
  { name: 'MS Office', level: 95 },
  { name: 'GA4 / GTM', level: 94 },
  { name: 'WordPress', level: 85 },
  { name: 'Trello', level: 84 },
  { name: 'Adobe Creative Suite', level: 83 },
  { name: 'Google Ads', level: 76 },
];

const DEFAULT_PROJECTS: Project[] = [
  { 
    id: 'nexus-brand',
    title: 'Nexus Brand Identity', 
    category: 'Branding', 
    image: 'https://picsum.photos/seed/nexus/800/600', 
    link: '/projects/nexus-brand',
    content: 'Nexus is a revolutionary brand identity project that focused on bridging the gap between corporate rigidity and creative fluidity. We developed a comprehensive design system that includes a dynamic logo, custom typography, and a vibrant color palette that scales across multi-channel touchpoints.',
    tags: ['Branding', 'Identity', 'Strategy']
  },
  { 
    id: 'volt-ecommerce',
    title: 'Volt E-Commerce', 
    category: 'Web App', 
    image: 'https://picsum.photos/seed/volt/800/600', 
    link: '/projects/volt-ecommerce',
    content: 'The Volt E-Commerce platform was built to solve the performance bottlenecks of traditional online stores. Using a headless architecture, we achieved sub-second page loads and a conversion rate increase of 45%. The project involved complex integrations with inventory systems and custom payment gateways.',
    tags: ['E-Commerce', 'Next.js', 'Headless']
  },
  { 
    id: 'lumina-dashboard',
    title: 'Lumina Dashboard', 
    category: 'UI/UX', 
    image: 'https://picsum.photos/seed/lumina/800/600', 
    link: '/projects/lumina-dashboard',
    content: 'Lumina is a data visualization dashboard designed for energy sector executives. The challenge was to transform massive amounts of real-time data into actionable insights through an intuitive and aesthetically pleasing interface. We utilized D3.js for custom visualizations and focused heavily on user centered design principles.',
    tags: ['UI/UX', 'Dashboard', 'Data Viz']
  },
  { 
    id: 'orbit-marketing',
    title: 'Orbit Marketing', 
    category: 'Social Media', 
    image: 'https://picsum.photos/seed/orbit/800/600', 
    link: '/projects/orbit-marketing',
    content: 'Orbit is a social media marketing campaign that leveraged the power of community and storytelling. We created a series of high-impact visuals and videos that resulted in a 300% increase in engagement for our client. The strategy focused on cross-platform consistency and authentic brand voice.',
    tags: ['Marketing', 'Social', 'Campaign']
  },
];

const TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Johnson', role: 'CEO, TechBase', content: 'Walid transform our brand completely. His attention to detail and creative vision are unmatched.', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { name: 'Michael Chen', role: 'Founder, EcoStream', content: 'Working with Walid was a game-changer for our digital presence. He truly understands modern brand development.', avatar: 'https://i.pravatar.cc/150?u=michael' },
  { name: 'Elena Rodriguez', role: 'Marketing Director, Vora', content: 'The website Walid built for us exceeded all expectations. Fast, beautiful, and highly functional.', avatar: 'https://i.pravatar.cc/150?u=elena' },
];

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  { 
    id: 'future-minimalism',
    title: 'The Future of Minimalism', 
    date: 'May 10, 2024', 
    excerpt: 'Exploring how minimalist design is evolving in the age of AI.', 
    image: 'https://picsum.photos/seed/blog1/800/500',
    content: 'Minimalism has long been a staple of modern design, but as we enter the age of Artificial Intelligence, the philosophy is undergoing a significant transformation. No longer just about "less is more," minimalism today is about "intentionality" and "relevance." AI allows designers to create interfaces that are hyper-personalized, removing unnecessary elements based on specific user contexts. In this post, we explore how cognitive load and data-driven design are shaping the next generation of minimalist aesthetics.',
    author: 'Walid Rahman',
    tags: ['Design', 'AI', 'Minimalism']
  },
  { 
    id: 'building-scalable-brands',
    title: 'Building Scalable Brands', 
    date: 'Apr 28, 2024', 
    excerpt: 'Key strategies for creating a brand that grows with your business.', 
    image: 'https://picsum.photos/seed/blog2/800/500',
    content: 'Scaling a brand requires more than just a great logo; it requires a modular system that can adapt to different markets, languages, and products without losing its core identity. We call this "Brand Elasticity." In this article, we break down the five pillars of brand scalability: Consistency, Adaptability, Documentation, Authenticity, and Scalable Visual Language. Learn how top tech brands manage to feel the same whether you are using their app on an iPhone or seeing a billboard in Tokyo.',
    author: 'Walid Rahman',
    tags: ['Marketing', 'Branding', 'Business']
  },
  { 
    id: 'ux-patterns-watch',
    title: 'UX Patterns to Watch', 
    date: 'Apr 15, 2024', 
    excerpt: 'Current trends in user experience that are shaping digital products.', 
    image: 'https://picsum.photos/seed/blog3/800/500',
    content: 'The way users interact with digital products is changing rapidly. From micro-interactions to voice interfaces, the expectations for a "good" experience are higher than ever. Some of the patterns we are seeing emerge include: Micro-animations that provide immediate feedback, conversational UI for complex tasks, and "invisible" interfaces that anticipate user needs. We dive deep into why these patterns are gaining traction and how you can implement them in your next project to increase user delight and retention.',
    author: 'Walid Rahman',
    tags: ['UX', 'UI', 'Trends']
  },
  { 
    id: 'brand-consistency',
    title: 'Brand Consistency', 
    date: 'Mar 30, 2024', 
    excerpt: 'Why maintaining a consistent voice is crucial for long-term success.', 
    image: 'https://picsum.photos/seed/blog4/800/500',
    content: 'Trust is built through consistency. When a brand speaks with one voice across all departments—from customer support to social media—it creates a sense of reliability that consumers crave. In this post, we explore how consistency impacts customer loyalty and brand equity. We also provide a checklist for maintaining your brand voice, including tips on creating a comprehensive style guide and training your team to embody the brand values in every interaction.',
    author: 'Walid Rahman',
    tags: ['Branding', 'Strategy', 'Trust']
  },
];

const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  { name: 'Basic Plan', price: '$19.95', features: ['Website Design', 'Mobile Apps Design', 'Product Design', 'Digital Marketing', 'Custom Support'], accent: false },
  { name: 'Standard Plan', price: '$39.95', features: ['Website Design', 'Mobile Apps Design', 'Product Design', 'Digital Marketing', 'Custom Support'], accent: true },
  { name: 'Premium Plan', price: '$99.95', features: ['Website Design', 'Mobile Apps Design', 'Product Design', 'Digital Marketing', 'Custom Support'], accent: false },
];

// --- Components ---

const SpotlightCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      animate={{ 
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(214, 255, 65, 0.05), transparent 80%)` 
      }}
    />
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
          transition={{ duration: 0.8, ease: "circOut" }}
          className="text-3xl md:text-5xl font-black text-white"
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
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [resume, setResume] = useState<any[]>([]); // Initialize empty then use defaults if none from DB
  const [testimonials, setTestimonials] = useState<Testimonial[]>(TESTIMONIALS);

  const [hasResumeData, setHasResumeData] = useState(false);
  const [hasTestimonialData, setHasTestimonialData] = useState(false);
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
      const sections = NAV_LINKS.map(link => document.getElementById(link.href.replace('#', '')));
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

  // Real-time Firestore Updates
  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        if (!snapshot.empty) {
          setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'projects'));

    const unsubServices = onSnapshot(query(collection(db, 'services'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        if (!snapshot.empty) {
          setServices(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() as any,
            icon: ICON_MAP[doc.data().iconName] || Palette
          })));
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'services'));

    const unsubBlog = onSnapshot(query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        if (!snapshot.empty) {
          setBlogPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'blogPosts'));

    const unsubResume = onSnapshot(query(collection(db, 'resume'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        if (!snapshot.empty) {
          setResume(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
          setHasResumeData(true);
        } else {
          setHasResumeData(false);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'resume'));

    const unsubTestimonials = onSnapshot(query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        if (!snapshot.empty) {
          setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
          setHasTestimonialData(true);
        } else {
          setHasTestimonialData(false);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'testimonials'));

    const unsubHero = onSnapshot(doc(db, 'siteConfig', 'hero'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setHeroImage(data.heroImage || '/input_file_0.png');
        setHeroStatus(data.heroStatus || 'Active Now');
        setHeroAvailability(data.heroAvailability || 'Available for new projects');
        setCvUrl(data.cvUrl || '#');
        setResumeImage(data.resumeImage || '');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'siteConfig/hero'));

    const unsubPricing = onSnapshot(query(collection(db, 'pricingPlans'), orderBy('createdAt', 'asc')), 
      (snapshot) => {
        if (!snapshot.empty) {
          setPricingPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'pricingPlans'));

    return () => {
      unsubProjects();
      unsubServices();
      unsubBlog();
      unsubResume();
      unsubTestimonials();
      unsubHero();
      unsubPricing();
    };
  }, []);


  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus('idle');
    
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
      console.error("Form error:", error);
      setFormStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-dark overflow-x-hidden selection:bg-accent/30 selection:text-white">
      {/* --- Immersive Background Elements --- */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent rounded-full blur-[150px] opacity-10 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent rounded-full blur-[120px] opacity-5 pointer-events-none z-0" />
      
      <Navbar />
      <SpotlightCursor />

      {/* --- Sections --- */}
        <main className="relative z-10">
          {/* Hero Section */}
          <section id="home" className="min-h-screen flex items-center relative overflow-hidden px-6 pt-20 pb-12 md:py-20">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
              <div className="z-10 text-center lg:text-left">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-accent text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4"
                >
                  Brand Developer
                </motion.p>
                <h1 className="text-3xl md:text-8xl font-black mb-4 md:mb-6 leading-tight tracking-tighter uppercase">
                  Hello, I'm <br />
                  <span className="text-accent text-glow">
                    <Typewriter text="Walid Rahman." />
                  </span>
                </h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm md:text-2xl text-gray-400 mb-8 md:mb-10 max-w-lg mx-auto lg:mx-0"
                >
                  A <span className="text-white font-bold underline decoration-accent underline-offset-4">Brand Developer</span> crafting premium digital experiences.
                </motion.div>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-6">
                  <motion.a 
                    href="https://wa.me/+8801744588644"
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.05 }}
                    className="bg-accent px-6 md:px-10 py-3 md:py-4 rounded-lg text-black font-black flex items-center gap-2 accent-shadow transition-all text-xs md:text-base"
                  >
                    Start Project
                  </motion.a>
                  <motion.a 
                    href={cvUrl}
                    download="Walid_Rahman_CV.pdf"
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.05 }}
                    className="border border-white/20 px-6 md:px-10 py-3 md:py-4 rounded-lg font-black flex items-center gap-2 hover:bg-white/5 transition-all text-white text-xs md:text-base"
                  >
                    Download CV
                  </motion.a>
                </div>

                <div className="mt-12 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 border-t border-white/5 pt-8 md:pt-12">
                  <div className="space-y-1">
                    <div className="text-2xl md:text-3xl font-bold text-white">8+ <span className="text-accent text-lg">Yrs</span></div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Experience</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl md:text-3xl font-bold text-white">1K+</div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Clients Met</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl md:text-3xl font-bold text-white">97%</div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Success Rate</div>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center order-first lg:order-last">
                <div className="relative w-full max-w-[320px] md:max-w-[420px] aspect-square">
                  {/* Abstract Background Element */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/20 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-4 md:inset-6 rounded-full border border-accent/40 shadow-[0_0_50px_rgba(214, 255, 65, 0.1)]" />

                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [1, 2, 1]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute inset-8 md:inset-12 rounded-3xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-2xl z-10"
                  >
                  <img 
                    src={heroImage} 
                    alt="Walid Rahman"
                    className="w-full h-full object-cover transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Overlay Card UI */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1">{heroStatus}</div>
                    <div className="text-xs text-white/80">{heroAvailability}</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Section Peek / Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 hidden md:flex">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.4em]">Scroll to explore</div>
            <motion.div 
              animate={{ height: [24, 48, 24] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-px bg-gradient-to-b from-accent to-transparent" 
            />
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 md:py-32 px-6 bg-card-dark">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="About Me" title="Crafting Digital Excellence" />
            <div className="grid lg:grid-cols-2 gap-10 md:gap-16">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-8">
                  As a Team Leader with extensive expertise in digital marketing, ed-tech, e-commerce, and brand management, I drive strategic growth and innovation across diverse industries. With a background that spans art direction, product design, sales, and more, I bring a multifaceted perspective to every project.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['Project Management', 'Web Development', 'Digital Marketing', 'Brand Development'].map((tag, i) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-bold"
                    >
                      {tag}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="grid sm:grid-cols-2 gap-6"
              >
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5 hover:border-accent/40 transition-all cursor-default accent-glow-hover">
                  <Mail className="text-accent mb-4" />
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="font-bold underline decoration-accent/30"><a href="mailto:info@walidrahman.com">info@walidrahman.com</a></div>
                </div>
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5 hover:border-accent/40 transition-all cursor-default">
                  <Phone className="text-accent mb-4" />
                  <div className="text-sm text-gray-400">Phone</div>
                  <div className="font-bold underline decoration-accent/30"><a href="https://wa.me/+8801744588644" target="_blank" rel="noreferrer">+880 1744 588 644</a></div>
                </div>
                <div className="p-6 bg-bg-card rounded-2xl border border-white/5 hover:border-accent/40 transition-all cursor-default col-span-full">
                  <MapPin className="text-accent mb-4" />
                  <div className="text-sm text-gray-400">Location</div>
                  <div className="font-bold">Nikunja 2, Dhaka 1229, Bangladesh</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Resume Section */}
        <section id="resume" className="py-16 md:py-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Resume" title="My Journey" />
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-start">
              <div className="space-y-8 md:space-y-12">
                {resumeImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="lg:hidden w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 mb-8"
                  >
                    <img src={resumeImage} alt="Journey" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </motion.div>
                )}
                {(hasResumeData ? resume : [
                  { year: '2024 - Present', role: 'Executive Director', company: 'De Jure Academy', desc: '' },
                  { year: '2023 - 2024', role: 'Creative Director', company: 'Arani Advertising Ltd.', desc: '' },
                  { year: '2023 - 2024', role: 'Manager', company: 'PMUK', desc: '' },
                  { year: '2022 - 2023', role: 'Manager', company: 'Restoreit AB', desc: '' },
                  { year: '2020 - 2022', role: 'Project Manager', company: 'JBL Bangladesh / EDISON Group', desc: '' },
                  { year: '2019 - 2020', role: 'Creative Lead', company: 'Jadroo Group', desc: '' },
                ]).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative pl-8 border-l border-white/10 hover:border-accent transition-colors"
                  >
                    <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-accent group-hover:shadow-[0_0_10px_rgba(214, 255, 65, 1)] transition-all" />
                      <div className="mb-2">
                        <span className="text-xs font-bold text-accent uppercase tracking-tighter">{item.year}</span>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">{item.role}</h3>
                        <div className="text-gray-400 font-bold mb-4">{item.company}</div>
                        {item.desc && <p className="text-gray-500 max-w-2xl">{item.desc}</p>}
                      </div>
                  </motion.div>
                ))}
              </div>

              {resumeImage && (
                <div className="relative sticky top-32 hidden lg:flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="relative w-full max-w-[450px] aspect-[3/4]"
                  >
                    {/* Decorative items */}
                    <div className="absolute -inset-4 border border-accent/20 rounded-[40px] -z-10 animate-pulse" />
                    <div className="absolute -inset-8 border border-white/5 rounded-[60px] -z-20" />
                    
                    <motion.div
                      animate={{ 
                        y: [0, -15, 0],
                        rotate: [0, 2, 0]
                      }}
                      transition={{ 
                        duration: 6, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="w-full h-full rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative"
                    >
                      <img 
                        src={resumeImage} 
                        alt="Walid Rahman Journey" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent" />
                      
                      {/* Info Tag */}
                      <div className="absolute bottom-8 left-8 right-8 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                        <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1">Current Focus</div>
                        <div className="text-lg font-black text-white">Strategic Brand Evolution</div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-32 px-6 bg-bg-card/30">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="What I Do" title="My Specialities" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="p-8 bg-bg-card rounded-3xl border border-white/5 hover:border-accent/30 transition-all relative overflow-hidden group"
                >
                  <div className="absolute -top-4 -right-4 text-6xl font-black text-white/5 group-hover:text-accent/10 transition-colors">
                    {service.id}
                  </div>
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

        {/* Skills Section */}
        <section id="skills" className="py-16 md:py-32 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <SectionHeader label="Excellence" title="Technical Arsenal" />
              <p className="text-gray-400 text-base md:text-lg mb-10">
                My skills are refined through years of practical application in demanding environments. I focus on technologies that deliver performance and scalability.
              </p>
              <button className="flex items-center gap-2 font-bold text-accent group">
                Explore Full Tech Stack
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            <div className="space-y-8">
              {SKILLS.map((skill, i) => (
                <div key={skill.name}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">{skill.name}</span>
                    <span className="text-accent">{skill.level}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: i * 0.1 }}
                      className="h-full bg-accent relative"
                    >
                      <div className="absolute right-0 top-0 h-full w-2 bg-white blur-sm opacity-50" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-16 md:py-32 px-6 bg-bg-card/50">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Portfolio" title="Featured Work" />
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id || project.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative aspect-video rounded-3xl overflow-hidden group cursor-pointer"
                >
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                    <span className="text-accent text-sm font-bold uppercase mb-2 tracking-widest">{project.category}</span>
                    <h3 className="text-3xl font-black mb-4">{project.title}</h3>
                    <div className="flex gap-4">
                      <Link 
                        to={`/projects/${project.id || project.title.toLowerCase().replace(/\s+/g, '-')}`} 
                        className="p-3 bg-accent rounded-full text-black hover:scale-110 transition-transform"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <button className="border-2 border-accent text-accent px-10 py-4 rounded-xl font-black hover:bg-accent hover:text-black transition-all group">
                View All Projects
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-32 bg-bg-card/20 overflow-hidden relative">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10" />
          
          <div className="max-w-7xl mx-auto px-6 mb-16">
            <SectionHeader label="Clients" title="Kind Words" />
          </div>

          <div className="relative flex overflow-hidden group/marquee">
            <div 
              className="flex gap-6 py-4 px-3 animate-marquee group-hover/marquee:[animation-play-state:paused]"
              style={{ 
                animationDuration: `${Math.max(20, testimonials.length * 4)}s` 
              }}
            >
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={`${t.id}-${i}`}
                  className="w-[320px] md:w-[400px] h-[200px] p-5 md:p-6 bg-bg-card rounded-2xl border border-white/5 relative group hover:border-accent/30 transition-all flex flex-col shrink-0"
                >
                  <div className="absolute top-4 right-4 text-accent/10 opacity-40">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-2 h-2 md:w-2.5 md:h-2.5 fill-accent text-accent" />)}
                  </div>

                  <p className="text-[11px] md:text-[13px] text-gray-400 leading-snug italic mb-4 flex-grow line-clamp-3">
                    "{t.content}"
                  </p>

                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-accent to-transparent rounded-full opacity-30" />
                      <img 
                        src={t.avatar} 
                        alt={t.name} 
                        className="w-full h-full rounded-full object-cover relative z-10 border-2 border-bg-card" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-[22px] font-black text-white leading-none mb-1">{t.name}</h4>
                      <p className="text-[10px] md:text-[12px] text-accent font-bold uppercase tracking-wider">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-32 px-6 bg-card-dark">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Investment" title="Pricing Plans" />
            <div className="grid lg:grid-cols-3 gap-8 md:gap-10">
              {pricingPlans.map((plan, i) => (
                <motion.div
                  key={plan.id || plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-10 bg-bg-card rounded-3xl border border-white/5 relative",
                    plan.accent && "scale-105 z-10 border-accent/40 shadow-[0_0_40px_rgba(214, 255, 65, 0.2)]"
                  )}
                >
                  {plan.accent && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-black text-xs font-black uppercase px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-black mb-4">{plan.name}</h3>
                  <div className="text-5xl font-black mb-8">{plan.price}<span className="text-lg text-gray-500 font-normal">/month</span></div>
                  <ul className="space-y-4 mb-10">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-gray-400 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={cn(
                    "w-full py-4 rounded-xl font-black transition-all overflow-hidden relative group",
                    plan.accent ? "bg-accent text-black" : "border border-white/20 hover:bg-white/5"
                  )}>
                    <span className="relative z-10">Choose Plan</span>
                    <div className="absolute inset-0 shimmer animate-[shimmer_2s_infinite] opacity-0 group-hover:opacity-100" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section id="blog" className="py-16 md:py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Journal" title="Latest Insights" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogPosts.map((post, i) => (
                <motion.div
                  key={post.id || post.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                >
                  <Link to={`/blog/${post.id || post.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 border border-white/5 group-hover:border-accent/40 transition-all">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" referrerPolicy="no-referrer" />
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

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-32 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <SectionHeader label="Contact" title="Let's Build Something" />
              <p className="text-gray-400 text-base md:text-lg mb-12">
                Have a project in mind or just want to say hi? I'm always open to discussing new opportunities and creative ideas.
              </p>
              <div className="space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: 'info@walidrahman.com', href: 'mailto:info@walidrahman.com' },
                  { icon: Phone, label: 'Phone', value: '+880 1744 588 644', href: 'https://wa.me/+8801744588644' },
                  { icon: MapPin, label: 'Office', value: 'Nikunja 2, Dhaka 1229, Bangladesh', href: '#' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-6"
                  >
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 uppercase font-black tracking-widest">{item.label}</div>
                      <a href={item.href} target="_blank" rel="noreferrer" className="text-lg font-bold hover:text-accent transition-colors">{item.value}</a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onSubmit={handleContactSubmit}
              className="p-10 bg-bg-card rounded-3xl border border-white/5"
            >
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Name</label>
                  <input name="name" type="text" required className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <input name="email" type="email" required className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Subject</label>
                <input name="subject" type="text" className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all" placeholder="Project Inquiry" />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-bold mb-2">Message</label>
                <textarea name="message" rows={4} required className="w-full bg-white/5 border-b-2 border-white/10 p-3 focus:outline-none focus:border-accent transition-all resize-none" placeholder="Tell me about your project..."></textarea>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-black font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(214, 255, 65, 0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Message"}
              </button>
              
              {formStatus === 'success' && (
                <p className="mt-4 text-accent text-center font-bold">Thank you! Your message has been sent.</p>
              )}
              {formStatus === 'error' && (
                <p className="mt-4 text-red-400 text-center font-bold">Something went wrong. Please try again.</p>
              )}
            </motion.form>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-sm">
            <div className="text-2xl font-black mb-6 tracking-tighter">
              youknowwalid<span className="text-accent">.</span>
            </div>
            <p className="text-gray-500 mb-8">
              A Brand Developer crafting premium digital experiences that bridge the gap between creative vision and technical excellence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 sm:gap-24">
            <div>
              <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-accent">Sitemap</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                {NAV_LINKS.slice(0, 4).map(l => <li key={l.name}><a href={l.href} className="hover:text-white transition-colors">{l.name}</a></li>)}
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-accent">Contact</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Nikunja 2, Dhaka 1229</li>
                <li>info@walidrahman.com</li>
                <li>+880 1744 588 644</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-accent">Admin</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/admin" className="hover:text-accent transition-colors flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Management Panel</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex gap-4">
            <a href="https://facebook.com/youknowwalid" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-black transition-all hover:-translate-y-1">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://linkedin.com/in/youknowwalid" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-black transition-all hover:-translate-y-1">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://twitter.com/youknowwalid" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-black transition-all hover:-translate-y-1">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm1.161 17.52h1.833L7.045 4.126H5.078z"/></svg>
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
          youknowwalid &copy; 2025 All Rights Reserved by Walid Rahman Swapnil
        </div>
      </footer>
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
      </Routes>
    </BrowserRouter>
  );
}
