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
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ResourcesSection from './components/ResourcesSection';
import ResourcesPage from './components/ResourcesPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import RefundPolicy from './components/RefundPolicy';
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
  { 
    name: 'Basic Plan', 
    price: '$350', 
    features: ['Website Design (up to 3 pages)', 'Basic Brand Identity & Logo', 'Social Media Management (2 platforms)', 'Copywriting (4 posts/month)', '1 Revision Round', '3 Hours / Day Consultation'],
    unavailableFeatures: ['Mobile App Design', 'Product Design', 'Paid Ads / Campaigns', 'SEO & Analytics', 'UI/UX Design'],
    buttonText: "Let's Talk",
    buttonUrl: "https://wa.me/8801744588644?text=Hi!%20I%20was%20looking%20at%20your%20portfolio%20and%20I'm%20interested%20in%20the%20$350%20Basic%20Plan.%20Can%20we%20discuss%20my%20project?",
    accent: false 
  },
  { 
    name: 'Standard Plan', 
    price: '$500', 
    features: ['Website Design (up to 8 pages)', 'Mobile App Design', 'Full Brand Identity & Logo Kit', 'Social Media Management (4 platforms)', 'Copywriting (12 posts/month)', 'Paid Ads / Campaigns (1 campaign)', 'Basic SEO & Monthly Report', '3 Revision Rounds', '6 Hours / Day Consultation'],
    unavailableFeatures: ['Product Design', 'UI/UX Design & Prototyping'],
    buttonText: 'Get Started',
    buttonUrl: "https://wa.me/8801744588644?text=Hi!%20I%20was%20looking%20at%20your%20portfolio%20and%20I'd%20like%20to%20get%20started%20with%20the%20$500%20Standard%20Plan.%20Let's%20talk!",
    accent: true 
  },
  { 
    name: 'Premium Plan', 
    price: '$1200', 
    features: ['Website Design (Unlimited pages)', 'Mobile App & Product Design', 'Full Brand Identity + Style Guide', 'UI/UX Design & Prototyping', 'Social Media Management (All platforms)', 'Unlimited Paid Ads / Campaigns', 'Unlimited Copywriting', 'Full SEO, Analytics & Growth Strategy', 'Dedicated Account Manager', 'Unlimited Revision Rounds', '9 Hours / Day Consultation'],
    unavailableFeatures: [],
    buttonText: 'Inquire Now',
    buttonUrl: "https://wa.me/8801744588644?text=Hi!%20I%20was%20looking%20at%20your%20portfolio%20and%20I%20need%20the%20$1200%20Premium%20Plan%20for%20my%20project.",
    accent: false 
  },
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

function Portfolio() {
  const { config } = useSiteConfig();
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [resume, setResume] = useState<any[]>([]); // Initialize empty then use defaults if none from DB
  const [testimonials, setTestimonials] = useState<Testimonial[]>(TESTIMONIALS);

  const [hasResumeData, setHasResumeData] = useState(false);
  const [hasTestimonialData, setHasTestimonialData] = useState(false);
  
  const [heroImage, setHeroImage] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) {
        return JSON.parse(cached).heroImage || '/input_file_0.png';
      }
    } catch (e) {}
    return '/input_file_0.png';
  });

  const [heroStatus, setHeroStatus] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) {
        return JSON.parse(cached).heroStatus || 'Active Now';
      }
    } catch (e) {}
    return 'Active Now';
  });

  const [heroAvailability, setHeroAvailability] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) {
        return JSON.parse(cached).heroAvailability || 'Available for new projects';
      }
    } catch (e) {}
    return 'Available for new projects';
  });

  const [cvUrl, setCvUrl] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) {
        return JSON.parse(cached).cvUrl || '#';
      }
    } catch (e) {}
    return '#';
  });

  const [resumeImage, setResumeImage] = useState(() => {
    try {
      const cached = localStorage.getItem('site_config_hero');
      if (cached) {
        return JSON.parse(cached).resumeImage || '';
      }
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

  // Data Fetching
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Use parallel fetching for speed
        const [projSnap, servSnap, blogSnap, resSnap, testSnap, pricSnap, skillSnap] = await Promise.all([
          getCollection('projects'),
          getCollection('services'),
          getCollection('blogPosts'),
          getCollection('resume'),
          getCollection('testimonials'),
          getCollection('pricingPlans'),
          getCollection('skills')
        ]);

        if (projSnap) setProjects(projSnap.map(normalizeProject));
        
        if (servSnap) setServices(servSnap.map(s => ({ 
          ...normalizeService(s), 
          icon: ICON_MAP[(s as any).iconName] || Palette,
        })));
        
        if (blogSnap) setBlogPosts(blogSnap.map(normalizeBlogPost));
        
        if (resSnap && resSnap.length > 0) {
          setResume(resSnap.map(normalizeResumeItem));
          setHasResumeData(true);
        }

        if (skillSnap && skillSnap.length > 0) {
          setSkills(skillSnap as any);
        } else {
          // Fallback to defaults if none in DB
          setSkills([
            { name: 'Canva', level: 98 },
            { name: 'Meta Ads', level: 96 },
            { name: 'MS Office', level: 95 },
            { name: 'GA4 / GTM', level: 94 },
            { name: 'WordPress', level: 85 },
            { name: 'Trello', level: 84 },
            { name: 'Adobe Creative Suite', level: 83 },
            { name: 'Google Ads', level: 76 },
          ]);
        }
        
        if (testSnap && testSnap.
