import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  LogOut, 
  LayoutDashboard, 
  FolderKanban, 
  Briefcase, 
  FileText,
  Loader2,
  ChevronLeft,
  Database,
  Users,
  Settings,
  Upload,
  Image as ImageIcon,
  DollarSign,
  MessageSquare,
  Cpu
} from 'lucide-react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  getCollection, 
  addDocument, 
  updateDocument, 
  removeDocument 
} from '../services/firebase';
import { 
  normalizePricingPlan, 
  normalizeProject, 
  normalizeBlogPost, 
  normalizeService, 
  normalizeTestimonial, 
  normalizeResumeItem 
} from '../lib/schema-defaults';

// Default data to seed if empty
const SEED_DATA: Record<string, any[]> = {
  projects: [
    { title: 'Nexus Brand Identity', category: 'Branding', image: 'https://picsum.photos/seed/nexus/800/600', link: '#' },
    { title: 'Volt E-Commerce', category: 'Web App', image: 'https://picsum.photos/seed/volt/800/600', link: '#' },
    { title: 'Lumina Dashboard', category: 'UI/UX', image: 'https://picsum.photos/seed/lumina/800/600', link: '#' },
    { title: 'Orbit Marketing', category: 'Social Media', image: 'https://picsum.photos/seed/orbit/800/600', link: '#' },
  ],
  services: [
    { id: '01', title: 'Brand Identity', description: 'Crafting unique visual identities that resonate with your target audience.', iconName: 'Palette' },
    { id: '02', title: 'Web Development', description: 'Building fast, responsive, and modern websites using the latest technologies.', iconName: 'Braces' },
    { id: '03', title: 'Digital Marketing', description: 'Strategic marketing campaigns to grow your brand and reach new customers.', iconName: 'Megaphone' },
    { id: '04', title: 'Product Strategy', description: 'Defining the roadmap and vision for your digital products.', iconName: 'Laptop' },
    { id: '05', title: 'UI/UX Design', description: 'Designing intuitive and beautiful user experiences.', iconName: 'Palette' },
    { id: '06', title: 'Content Creation', description: 'Engaging content that tells your brands story across all platforms.', iconName: 'Megaphone' },
  ],
  blogPosts: [
    { title: 'The Future of Minimalism', date: 'May 10, 2024', excerpt: 'Exploring how minimalist design is evolving in the age of AI.', image: 'https://picsum.photos/seed/blog1/800/500' },
    { title: 'Building Scalable Brands', date: 'Apr 28, 2024', excerpt: 'Key strategies for creating a brand that grows with your business.', image: 'https://picsum.photos/seed/blog2/800/500' },
    { title: 'UX Patterns to Watch', date: 'Apr 15, 2024', excerpt: 'Current trends in user experience that are shaping digital products.', image: 'https://picsum.photos/seed/blog3/800/500' },
    { title: 'Brand Consistency', date: 'Mar 30, 2024', excerpt: 'Why maintaining a consistent voice is crucial for long-term success.', image: 'https://picsum.photos/seed/blog4/800/500' },
  ],
  resume: [
    { year: '2024 - Present', role: 'Executive Director', company: 'De Jure Academy', desc: 'Directing strategic vision and growth.' },
    { year: '2023 - 2024', role: 'Creative Director', company: 'Arani Advertising Ltd.', desc: 'Leading creative campaigns.' },
    { year: '2023 - 2024', role: 'Manager', company: 'PMUK', desc: 'Managing operational workflows.' },
    { year: '2022 - 2023', role: 'Manager', company: 'Restoreit AB', desc: 'Overseeing service quality.' },
    { year: '2020 - 2022', role: 'Project Manager', company: 'JBL Bangladesh / EDISON Group', desc: 'Coordinating high-profile projects.' },
    { year: '2019 - 2020', role: 'Creative Lead', company: 'Jadroo Group', desc: 'Conceptualizing brand stories.' },
  ],
  testimonials: [
    { name: 'Sarah Johnson', role: 'CEO, TechBase', content: 'Walid transform our brand completely. His attention to detail and creative vision are unmatched.', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { name: 'Michael Chen', role: 'Founder, EcoStream', content: 'Working with Walid was a game-changer for our digital presence. He truly understands modern brand development.', avatar: 'https://i.pravatar.cc/150?u=michael' },
    { name: 'Elena Rodriguez', role: 'Marketing Director, Vora', content: 'The website Walid built for us exceeded all expectations. Fast, beautiful, and highly functional.', avatar: 'https://i.pravatar.cc/150?u=elena' },
  ],
  pricingPlans: [
    { 
      name: 'Basic Plan', 
      price: '$350', 
      features: ['Website Design (up to 3 pages)', 'Basic Brand Identity & Logo', 'Social Media Management (2 platforms)', 'Copywriting (4 posts/month)', '1 Revision Round'],
      unavailableFeatures: ['Mobile App Design', 'Product Design', 'Paid Ads / Campaigns', 'SEO & Analytics', 'UI/UX Design'],
      showPriorityBox: true,
      priorityTitle: '3 Hours / Day',
      prioritySubtitle: 'Daily Priority Access',
      buttonText: "Let's Talk",
      accent: false 
    },
    { 
      name: 'Standard Plan', 
      price: '$500', 
      features: ['Website Design (up to 8 pages)', 'Mobile App Design', 'Full Brand Identity & Logo Kit', 'Social Media Management (4 platforms)', 'Copywriting (12 posts/month)', 'Paid Ads / Campaigns (1 campaign)', 'Basic SEO & Monthly Report', '3 Revision Rounds'],
      unavailableFeatures: ['Product Design', 'UI/UX Design & Prototyping'],
      showPriorityBox: true,
      priorityTitle: '6 Hours / Day',
      prioritySubtitle: 'Daily Priority Access',
      buttonText: 'Get Started',
      accent: true 
    },
    { 
      name: 'Premium Plan', 
      price: '$1200', 
      features: ['Website Design (Unlimited pages)', 'Mobile App & Product Design', 'Full Brand Identity + Style Guide', 'UI/UX Design & Prototyping', 'Social Media Management (All platforms)', 'Unlimited Paid Ads / Campaigns', 'Unlimited Copywriting', 'Full SEO, Analytics & Growth Strategy', 'Dedicated Account Manager', 'Unlimited Revision Rounds'],
      unavailableFeatures: [],
      showPriorityBox: true,
      priorityTitle: '9 Hours / Day',
      prioritySubtitle: 'Dedicated Priority Support',
      buttonText: 'Inquire Now',
      accent: false 
    },
  ],
  skills: [
    { name: 'Canva', level: 98 },
    { name: 'Meta Ads', level: 96 },
    { name: 'MS Office', level: 95 },
    { name: 'GA4 / GTM', level: 94 },
    { name: 'WordPress', level: 85 },
    { name: 'Trello', level: 84 },
    { name: 'Adobe Creative Suite', level: 83 },
    { name: 'Google Ads', level: 76 },
  ],
  contactSubmissions: []
};
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'blogPosts', label: 'Blog', icon: FileText },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'skills', label: 'Skills', icon: Cpu },
  { id: 'testimonials', label: 'Feedback', icon: Users },
  { id: 'pricingPlans', label: 'Pricing', icon: DollarSign },
  { id: 'contactSubmissions', label: 'Inquiries', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  recommendation 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  recommendation?: string;
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Resize image using canvas to keep Base64 size reasonable (< 1MB)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Use low quality for jpg to save space
          const base64 = canvas.toDataURL('image/jpeg', 0.6);
          onChange(base64);
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400">{label}</label>
      <div className="flex gap-4 items-start">
        <div className="relative group">
          {value ? (
            <img src={value} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-white/10" />
          ) : (
            <div className="w-32 h-32 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-600" />
            </div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
            <Upload className="w-6 h-6" />
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste an image URL..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none"
          />
          {recommendation && (
            <p className="text-xs text-accent italic">{recommendation}</p>
          )}
          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-accent">
              <Loader2 className="w-3 h-3 animate-spin" /> Processing image...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.body.classList.contains('light-mode'));
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains('light-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [heroImage, setHeroImage] = useState('');
  const [heroStatus, setHeroStatus] = useState('');
  const [heroAvailability, setHeroAvailability] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [resumeImage, setResumeImage] = useState('');
  const [uploadValue, setUploadValue] = useState('');
  const [socialUploadValue, setSocialUploadValue] = useState('');
  const [currentSocialData, setCurrentSocialData] = useState({
    title: '',
    description: '',
    image: '',
    slug: ''
  });

  useEffect(() => {
    if (editingItem && (activeTab === 'projects' || activeTab === 'blogPosts')) {
      setCurrentSocialData({
        title: editingItem.socialTitle || editingItem.title || '',
        description: editingItem.socialDescription || editingItem.excerpt || editingItem.content?.slice(0, 160) || '',
        image: editingItem.socialImage || editingItem.image || '',
        slug: editingItem.slug || ''
      });
      setSocialUploadValue(editingItem.socialImage || '');
    } else if (isAdding) {
      setCurrentSocialData({ title: '', description: '', image: '', slug: '' });
      setSocialUploadValue('');
    }
  }, [editingItem, isAdding, activeTab]);

  const SocialPreview = ({ data }: { data: typeof currentSocialData }) => (
    <div className="mt-10 border-t border-white/10 pt-10">
      <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">Live Social Preview (Facebook)</h4>
      <div className="bg-white rounded-lg overflow-hidden max-w-md border border-gray-200 text-black">
        <div className="aspect-[1200/630] bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-200">
          {data.image || socialUploadValue ? (
            <img src={socialUploadValue || data.image} alt="Social" className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 text-xs text-center p-4">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Upload social image to preview
            </div>
          )}
        </div>
        <div className="p-4 bg-[#f2f3f5]">
          <div className="text-[12px] text-gray-500 uppercase font-medium truncate mb-1">
            YOUKNOWWALID.PRO / {data.slug || 'your-slug'}
          </div>
          <div className="text-lg font-bold leading-tight line-clamp-2 mb-1">
            {data.title || 'Your Social Title Will Appear Here'}
          </div>
          <div className="text-[14px] text-gray-600 line-clamp-2 leading-relaxed">
            {data.description || 'Provide a compelling description for social media users to click through to your site.'}
          </div>
        </div>
      </div>
    </div>
  );

  const [isUploadingCV, setIsUploadingCV] = useState(false);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size too large. Please upload a PDF under 2MB.');
      return;
    }

    setIsUploadingCV(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCvUrl(event.target?.result as string);
      setIsUploadingCV(false);
    };
    reader.readAsDataURL(file);
  };

  const checkAdminStatus = async (currentUser: User) => {
    try {
      // Local check first for immediate feedback
      const isSystemAdmin = currentUser.email?.toLowerCase() === 'walidxdxdxd@gmail.com';
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setIsAdmin(userDoc.data()?.isAdmin || isSystemAdmin);
      } else {
        // If doc doesn't exist yet, we trust the email for now
        setIsAdmin(isSystemAdmin);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Fallback to email check if Firestore read fails
      setIsAdmin(currentUser.email?.toLowerCase() === 'walidxdxdxd@gmail.com');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await checkAdminStatus(user);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        // Wait a small bit for Firestore to propagate if repair happened
        setTimeout(async () => {
          await checkAdminStatus(loggedInUser);
        }, 500);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      setAuthError(error.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadItems();
    }
  }, [activeTab, isAdmin]);

  const loadItems = async () => {
    setLoading(true);
    if (activeTab === 'settings') {
      const configDoc = await getDoc(doc(db, 'siteConfig', 'hero'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setHeroImage(data.heroImage || '');
        setHeroStatus(data.heroStatus || '');
        setHeroAvailability(data.heroAvailability || '');
        setCvUrl(data.cvUrl || '');
        setResumeImage(data.resumeImage || '');
      }
      setItems([]);
    } else {
      const data = await getCollection(activeTab);
      setItems(data || []);
    }
    setLoading(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  // --- Normalization Helpers ---
  const str = (v: any) => (v === undefined || v === null) ? "" : String(v);
  const bool = (v: any) => v === true || v === 'true';
  const arr = (v: any) => Array.isArray(v) ? v.filter(i => i !== undefined && i !== null).map(str) : [];
  const num = (v: any, fallback = 0) => {
    const parsed = parseInt(v, 10);
    return isNaN(parsed) ? fallback : parsed;
  };

  /**
   * Deeply sanitizes and normalizes data based on the active tab's schema.
   * This ensures NO undefined values reach Firestore and all types are deterministic.
   */
  const normalizePayload = (tab: string, rawData: any) => {
    switch (tab) {
      case 'projects': return normalizeProject(rawData);
      case 'services': return normalizeService(rawData);
      case 'blogPosts': return normalizeBlogPost(rawData);
      case 'resume': return normalizeResumeItem(rawData);
      case 'testimonials': return normalizeTestimonial(rawData);
      case 'pricingPlans': return normalizePricingPlan(rawData);
      case 'skills':
        return {
          name: str(rawData.name),
          level: num(rawData.level, 80),
          updatedAt: new Date().toISOString()
        };
      default:
        // For settings or unknown tabs, keep everything but ensure no undefineds
        const payload: any = { updatedAt: new Date().toISOString() };
        Object.keys(rawData).forEach(key => {
          if (rawData[key] !== undefined) payload[key] = rawData[key];
        });
        return payload;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const rawData: any = Object.fromEntries(formData.entries());

      // Inject images explicitly to the raw data before normalization
      if (activeTab === 'projects' || activeTab === 'blogPosts') {
        rawData.image = uploadValue || editingItem?.image || "";
        rawData.socialImage = socialUploadValue || editingItem?.socialImage || "";
      }
      if (activeTab === 'testimonials') {
        rawData.avatar = uploadValue || editingItem?.avatar || "";
      }

      // Pre-process arrays/bools in raw data for simpler normalization
      if (rawData.tags) {
        rawData.tags = (rawData.tags as string).split(',').map(t => t.trim()).filter(t => t !== '');
      }
      if (activeTab === 'pricingPlans') {
        rawData.features = (rawData.features as string).split(',').map(f => f.trim()).filter(f => f !== '');
        rawData.unavailableFeatures = (rawData.unavailableFeatures as string || '').split(',').map(f => f.trim()).filter(f => f !== '');
      }

      // STEP 1: Normalize and Sanitize (Eliminate undefineds)
      const data = normalizePayload(activeTab, rawData);

      // STEP 2: Validate
      if (activeTab === 'pricingPlans' && !data.name) throw new Error("Plan name is required");
      if (activeTab === 'projects' && !data.title) throw new Error("Project title is required");
      if (activeTab === 'services' && !data.title) throw new Error("Service title is required");

      if (activeTab === 'settings') {
        const settingsPayload = {
          heroImage: str(heroImage), 
          heroStatus: str(heroStatus) || "Active Now",
          heroAvailability: str(heroAvailability) || "Available for projects",
          cvUrl: str(cvUrl),
          resumeImage: str(resumeImage),
          updatedAt: new Date().toISOString() 
        };
        await updateDocument('siteConfig', 'hero', settingsPayload);
        alert('Settings saved!');
      } else if (editingItem) {
        await updateDocument(activeTab, editingItem.id, data);
      } else {
        await addDocument(activeTab, data);
      }
      
      setEditingItem(null);
      setIsAdding(false);
      setUploadValue('');
      loadItems();
    } catch (error: any) {
      console.error("Save error details:", error);
      const errorMessage = error.message || "Unknown error";
      alert(`[DB-ERROR] Failed to save change: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await removeDocument(activeTab, id);
      loadItems();
    }
  };

  const handleSeedData = async () => {
    if (items.length > 0) {
      if (!window.confirm('This collection already has items. Do you want to add default items anyway?')) return;
    }
    
    setLoading(true);
    const dataToSeed = SEED_DATA[activeTab];
    if (dataToSeed) {
      for (const item of dataToSeed) {
        await addDocument(activeTab, item);
      }
      alert(`Imported ${dataToSeed.length} items into ${activeTab}.`);
      loadItems();
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card p-10 rounded-3xl border border-white/5 text-center max-w-md w-full"
        >
          <LayoutDashboard className="w-16 h-16 text-accent mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-4">Admin Access</h1>
          <p className="text-gray-400 mb-8">Please sign in with your authorized admin account to manage the portfolio.</p>
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-accent text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in with Google"}
          </button>
          {authError && (
            <p className="mt-4 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{authError}</p>
          )}
          {!isAdmin && user && (
            <p className="mt-4 text-red-400 text-sm">Access denied. Your account does not have admin privileges.</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-text-main flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-card border-r border-border-subtle p-6 flex flex-col">
        <div className="text-xl font-black mb-10 tracking-tighter">
          Admin<span className="text-accent">Panel</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsAdding(false); setEditingItem(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-accent text-white font-bold' : 'text-text-muted hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <a href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> View Site
          </a>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-text-main">{TABS.find(t => t.id === activeTab)?.label} Management</h2>
            {activeTab !== 'settings' && <p className="text-text-muted">Total items: {items.length}</p>}
          </div>
          <div className="flex gap-4">
            {activeTab !== 'settings' && (
              <button 
                onClick={handleSeedData}
                className="flex items-center gap-2 border border-white/10 text-gray-400 font-bold px-6 py-3 rounded-xl hover:bg-white/5 transition-all"
                title="Import Default Data"
              >
                <Database className="w-5 h-5" />
                Seed Default
              </button>
            )}
            {activeTab !== 'settings' && (
              <button 
                onClick={() => { setIsAdding(true); setUploadValue(''); }}
                className="flex items-center gap-2 bg-accent text-white font-black px-6 py-3 rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add New
              </button>
            )}
          </div>
        </div>

        {activeTab === 'settings' && (
          <div className="bg-bg-card p-10 rounded-3xl border border-white/5 max-w-2xl">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <ImageIcon className="text-accent" /> Hero Section Settings
            </h3>
            <form onSubmit={handleSave} className="space-y-8">
              <ImageUpload 
                label="Hero Profile Photo" 
                value={heroImage} 
                onChange={setHeroImage} 
                recommendation="This is the main image in the floating frame. Recommended: 800x800px or larger."
              />

              <ImageUpload 
                label="Resume Side Image" 
                value={resumeImage} 
                onChange={setResumeImage} 
                recommendation="This image will appear next to your resume journey. Recommended: 800x1200px (Portrait)."
              />
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status Badge (e.g. Active Now)</label>
                  <input 
                    value={heroStatus} 
                    onChange={(e) => setHeroStatus(e.target.value)}
                    placeholder="Active Now"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Availability Text</label>
                  <input 
                    value={heroAvailability} 
                    onChange={(e) => setHeroAvailability(e.target.value)}
                    placeholder="Available for projects"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Download CV (PDF)</label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={cvUrl} 
                      onChange={(e) => setCvUrl(e.target.value)}
                      placeholder="Paste PDF URL or upload below..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none" 
                    />
                  </div>
                  <label className="bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload PDF</span>
                    <input type="file" accept="application/pdf" onChange={handleCVUpload} className="hidden" />
                  </label>
                </div>
                {isUploadingCV && <p className="text-xs text-accent animate-pulse">Processing PDF...</p>}
                {cvUrl && cvUrl.startsWith('data:') && (
                  <p className="text-xs text-green-400">PDF successfully loaded from local file.</p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-accent text-white font-black px-10 py-4 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        )}

        {/* Form Overlay */}
        <AnimatePresence>
          {(isAdding || editingItem) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-bg-card w-full max-w-2xl rounded-3xl border border-white/10 p-8 relative overflow-y-auto max-h-[90vh]"
              >
                <button 
                  onClick={() => { setIsAdding(false); setEditingItem(null); setUploadValue(''); }}
                  className="absolute top-6 right-6 text-gray-500 hover:text-white"
                >
                  <X />
                </button>
                <h3 className="text-2xl font-black mb-8">
                  {editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}
                </h3>
                
                <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                  {activeTab === 'projects' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Project Title</label>
                        <input name="title" defaultValue={editingItem?.title} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" onChange={(e) => setCurrentSocialData(prev => ({ ...prev, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Category</label>
                        <input name="category" defaultValue={editingItem?.category} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Permalink / Slug</label>
                        <input name="slug" defaultValue={editingItem?.slug} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="e.g. project-awesome" onChange={(e) => setCurrentSocialData(prev => ({ ...prev, slug: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Link</label>
                        <input name="link" defaultValue={editingItem?.link} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="External URL (optional)" />
                      </div>
                      <div className="col-span-2">
                        <ImageUpload 
                          label="Project Image" 
                          value={uploadValue || editingItem?.image} 
                          onChange={setUploadValue} 
                          recommendation="Recommended: 800x600px JPG/PNG."
                        />
                      </div>
                      <div className="col-span-2 pt-6 border-t border-white/5">
                        <h4 className="text-accent font-bold uppercase text-xs tracking-widest mb-4">Social Media SEO</h4>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Social Title</label>
                        <input name="socialTitle" defaultValue={editingItem?.socialTitle} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="Catchy title for FB/LinkedIn" onChange={(e) => setCurrentSocialData(prev => ({ ...prev, title: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Social Description</label>
                        <textarea name="socialDescription" defaultValue={editingItem?.socialDescription} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" placeholder="Hook users from their feed..." onChange={(e) => setCurrentSocialData(prev => ({ ...prev, description: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <ImageUpload 
                          label="Social Image (1200x630)" 
                          value={socialUploadValue || editingItem?.socialImage} 
                          onChange={setSocialUploadValue} 
                          recommendation="Recommended: 1200x630px for optimal social sharing."
                        />
                      </div>
                      <div className="col-span-2">
                        <SocialPreview data={currentSocialData} />
                      </div>
                      <div className="col-span-2 pt-6 border-t border-white/5">
                        <h4 className="text-accent font-bold uppercase text-xs tracking-widest mb-4">Content</h4>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Detailed Content (Markdown supported)</label>
                        <textarea name="content" defaultValue={editingItem?.content} rows={6} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" placeholder="Explain the project challenge, solution, and results..." />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Tags (Comma separated)</label>
                        <input name="tags" defaultValue={editingItem?.tags?.join(', ')} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="React, UI/UX, Design System" />
                      </div>
                    </>
                  )}

                  {activeTab === 'services' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Service Title</label>
                        <input name="title" defaultValue={editingItem?.title} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">ID (e.g., 01)</label>
                        <input name="id" defaultValue={editingItem?.id} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Icon Name (lucide)</label>
                        <input name="iconName" defaultValue={editingItem?.iconName} placeholder="Palette, Braces, etc." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea name="description" defaultValue={editingItem?.description} required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                    </>
                  )}

                  {activeTab === 'blogPosts' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Post Title</label>
                        <input name="title" defaultValue={editingItem?.title} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" onChange={(e) => setCurrentSocialData(prev => ({ ...prev, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Permalink / Slug</label>
                        <input name="slug" defaultValue={editingItem?.slug} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="e.g. future-of-minimalism" onChange={(e) => setCurrentSocialData(prev => ({ ...prev, slug: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Date String</label>
                        <input name="date" defaultValue={editingItem?.date} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Author</label>
                        <input name="author" defaultValue={editingItem?.author} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="Walid Rahman" />
                      </div>
                      <div className="col-span-2">
                        <ImageUpload 
                          label="Post Header Image" 
                          value={uploadValue || editingItem?.image} 
                          onChange={setUploadValue} 
                          recommendation="Recommended: 800x500px JPG/PNG."
                        />
                      </div>
                      <div className="col-span-2 pt-6 border-t border-white/5">
                        <h4 className="text-accent font-bold uppercase text-xs tracking-widest mb-4">Social Media SEO</h4>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Social Title</label>
                        <input name="socialTitle" defaultValue={editingItem?.socialTitle} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="SEO optimized title" onChange={(e) => setCurrentSocialData(prev => ({ ...prev, title: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Social Description</label>
                        <textarea name="socialDescription" defaultValue={editingItem?.socialDescription} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" placeholder="Short summary for social feeds..." onChange={(e) => setCurrentSocialData(prev => ({ ...prev, description: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <ImageUpload 
                          label="Social Image (1200x630)" 
                          value={socialUploadValue || editingItem?.socialImage} 
                          onChange={setSocialUploadValue} 
                          recommendation="Recommended: 1200x630px for optimal social sharing."
                        />
                      </div>
                      <div className="col-span-2">
                        <SocialPreview data={currentSocialData} />
                      </div>
                      <div className="col-span-2 pt-6 border-t border-white/5">
                        <h4 className="text-accent font-bold uppercase text-xs tracking-widest mb-4">Content</h4>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Excerpt</label>
                        <textarea name="excerpt" defaultValue={editingItem?.excerpt} required rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Full Story / Content (Markdown supported)</label>
                        <textarea name="content" defaultValue={editingItem?.content} rows={10} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Tags (Comma separated)</label>
                        <input name="tags" defaultValue={editingItem?.tags?.join(', ')} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="Design, AI, Innovation" />
                      </div>
                    </>
                  )}

                  {activeTab === 'resume' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Role / Title</label>
                        <input name="role" defaultValue={editingItem?.role} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Company / Institution</label>
                        <input name="company" defaultValue={editingItem?.company} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Year / Duration</label>
                        <input name="year" defaultValue={editingItem?.year} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
                        <textarea name="desc" defaultValue={editingItem?.desc} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                    </>
                  )}

                  {activeTab === 'testimonials' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Client Name</label>
                        <input name="name" defaultValue={editingItem?.name} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Role / Position</label>
                        <input name="role" defaultValue={editingItem?.role} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <ImageUpload 
                          label="Client Avatar" 
                          value={uploadValue || editingItem?.avatar} 
                          onChange={setUploadValue} 
                          recommendation="Recommended: 150x150px circle avatar."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Feedback Content</label>
                        <textarea name="content" defaultValue={editingItem?.content} required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                    </>
                  )}

                  {activeTab === 'pricingPlans' && (
                    <>
                      <div className="col-span-2 grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Plan Name</label>
                          <input name="name" defaultValue={editingItem?.name} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Price String (e.g. $19.95)</label>
                          <input name="price" defaultValue={editingItem?.price} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        </div>
                      </div>

                      <div className="col-span-2 grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Button Text</label>
                          <input name="buttonText" defaultValue={editingItem?.buttonText} placeholder="e.g. Choose Plan" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Make Accent/Featured?</label>
                          <select name="accent" defaultValue={String(!!editingItem?.accent)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none">
                            <option value="false" className="bg-bg-dark">Normal</option>
                            <option value="true" className="bg-bg-dark">Accent (Highlighted)</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Button URL (WhatsApp/Link)</label>
                        <input name="buttonUrl" defaultValue={editingItem?.buttonUrl} placeholder="https://wa.me/..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>

                      <div className="col-span-2 p-6 bg-accent/5 rounded-2xl border border-accent/10 space-y-4">
                        <h4 className="text-xs font-black uppercase text-accent tracking-widest flex items-center gap-2">
                          <DollarSign className="w-3 h-3" /> Priority Access / Availability Box
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Show Box?</label>
                            <select name="showPriorityBox" defaultValue={String(!!editingItem?.showPriorityBox)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none">
                              <option value="false" className="bg-bg-dark">Hidden</option>
                              <option value="true" className="bg-bg-dark">Visible</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Box Title (e.g. 6 Hours / Day)</label>
                            <input name="priorityTitle" defaultValue={editingItem?.priorityTitle} placeholder="6 Hours / Day" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-2">Box Subtitle (e.g. Daily Priority Access)</label>
                            <input name="prioritySubtitle" defaultValue={editingItem?.prioritySubtitle} placeholder="Daily Priority Access" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Included Services (Comma separated)</label>
                        <textarea name="features" defaultValue={editingItem?.features?.join(', ')} required rows={4} placeholder="Feature 1, Feature 2, Feature 3" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Excludes / Unavailable (Comma separated)</label>
                        <textarea name="unavailableFeatures" defaultValue={editingItem?.unavailableFeatures?.join(', ')} rows={4} placeholder="Service 1, Service 2" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                    </>
                  )}

                  {activeTab === 'skills' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Skill Name</label>
                        <input name="name" defaultValue={editingItem?.name} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" placeholder="e.g. Photoshop, Meta Ads" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Skill Rating (%)</label>
                        <input name="level" type="number" min="0" max="100" defaultValue={editingItem?.level || 80} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        <div className="mt-4 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${editingItem?.level || 80}%` }} />
                        </div>
                      </div>
                    </>
                  )}


                  <div className="col-span-2 flex justify-end gap-4 mt-4">
                    <button 
                      type="button" 
                      onClick={() => { setIsAdding(false); setEditingItem(null); }}
                      className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-accent text-white font-black px-10 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {isSaving ? 'Processing...' : (editingItem ? 'Update Item' : 'Save Item')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items List */}
        <div className="grid gap-4">
          {items.map((item) => (
            <motion.div 
              layout
              key={item.id}
              className="bg-bg-card p-6 rounded-2xl border border-white/5 flex items-center gap-6 group hover:border-accent/30 transition-all"
            >
              {item.image && (
                <img src={item.image} alt={item.title || item.name} className="w-20 h-20 object-cover rounded-xl border border-white/10" referrerPolicy="no-referrer" />
              )}
              {item.avatar && (
                <img src={item.avatar} alt={item.name} className="w-20 h-20 object-cover rounded-full border border-white/10" referrerPolicy="no-referrer" />
              )}
              
              {activeTab === 'contactSubmissions' && (
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1">
                <h4 className="text-xl font-bold mb-1">
                  {activeTab === 'contactSubmissions' ? item.subject : (item.title || item.name || item.role)}
                </h4>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {item.category && <span>{item.category}</span>}
                  {item.id && activeTab === 'services' && <span>ID: {item.id}</span>}
                  {item.date && <span>{item.date}</span>}
                  {item.year && <span>{item.year}</span>}
                  {item.company && <span>{item.company}</span>}
                  
                  {activeTab === 'pricingPlans' && (
                    <>
                      <span className="text-accent font-bold">{item.price}</span>
                      <span>{item.features?.length} Features</span>
                    </>
                  )}

                  {activeTab === 'skills' && (
                    <div className="flex items-center gap-4 w-full max-w-xs">
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${item.level}%` }} />
                      </div>
                      <span className="text-accent font-black">{item.level}%</span>
                    </div>
                  )}

                  
                  {activeTab === 'contactSubmissions' && (
                    <>
                      <span className="text-white font-medium">From: {item.name} ({item.email})</span>
                    </>
                  )}
                </div>
                {activeTab === 'contactSubmissions' && (
                  <p className="mt-3 text-gray-400 text-sm italic border-l-2 border-accent/20 pl-4">
                    "{item.message}"
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {activeTab !== 'contactSubmissions' && (
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="p-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-3 rounded-xl border border-white/10 hover:bg-red-400/10 text-gray-400 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
          {items.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-500 bg-bg-card rounded-3xl border border-dashed border-white/10">
              No items found. Start by adding a new one!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
