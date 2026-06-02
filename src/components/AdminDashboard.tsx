import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
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
  Cpu,
  ShoppingCart,
  Palette,
  Globe
} from 'lucide-react';
import { SEOSettings } from './SEOSettings';
import { BrandingSettings } from './BrandingSettings';
import { useSiteConfig } from '../context/SiteConfigContext';
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
  normalizeResumeItem,
  normalizeProduct
} from '../lib/schema-defaults';
import { 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Default data to seed if empty
const SEED_DATA: Record<string, any[]> = {
  projects: [
    { title: 'Nexus Brand Identity', category: 'Branding', image: 'https://picsum.photos/seed/nexus/800/600', link: '#' },
    { title: 'Volt E-Commerce', category: 'Web App', image: 'https://picsum.photos/seed/volt/800/600', link: '#' },
  ],
  services: [
    { id: '01', title: 'Brand Identity', description: 'Crafting unique visual identities that resonate with your target audience.', iconName: 'Palette' },
    { id: '02', title: 'Web Development', description: 'Building fast, responsive, and modern websites using the latest technologies.', iconName: 'Braces' },
  ],
  blogPosts: [
    { title: 'The Future of Minimalism', date: 'May 10, 2024', excerpt: 'Exploring how minimalist design is evolving in the age of AI.', image: 'https://picsum.photos/seed/blog1/800/500' },
  ],
  resume: [
    { year: '2024 - Present', role: 'Executive Director', company: 'De Jure Academy', desc: 'Directing strategic vision and growth.' },
  ],
  testimonials: [
    { name: 'Sarah Johnson', role: 'CEO, TechBase', content: 'Walid transformed our brand completely. His attention to detail and creative vision are unmatched.', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  ],
  pricingPlans: [
    { 
      name: 'Basic Plan', 
      price: '$350', 
      features: ['Website Design (up to 3 pages)', 'Basic Brand Identity & Logo'],
      unavailableFeatures: ['Mobile App Design'],
      buttonText: "Let's Talk",
      accent: false 
    },
  ],
  skills: [
    { name: 'Canva', level: 98 },
    { name: 'Meta Ads', level: 96 },
  ],
  products: [
    {
      title: 'The Ultimate Design System Kit',
      shortTitle: 'Design System Kit',
      description: 'A comprehensive toolkit for premium digital brands.',
      price: '$29.00',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      gumroadUrl: 'https://gumroad.com',
      order: 1,
      featured: true,
      published: true
    },
  ],
  contactSubmissions: []
};

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'seoSettings', label: 'SEO Settings', icon: Globe },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'blogPosts', label: 'Blog', icon: FileText },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'skills', label: 'Skills', icon: Cpu },
  { id: 'testimonials', label: 'Feedback', icon: Users },
  { id: 'pricingPlans', label: 'Pricing', icon: DollarSign },
  { id: 'products', label: 'Products', icon: ShoppingCart },
  { id: 'contactSubmissions', label: 'Inquiries', icon: MessageSquare },
  { id: 'branding', label: 'Branding Settings', icon: Palette },
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or paste an image URL..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none"
            />
            {value && (
              <button 
                type="button" 
                onClick={() => onChange('')} 
                className="px-3 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/15"
                title="Clear / Delete Image"
              >
                Clear
              </button>
            )}
          </div>
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
  const { updateConfig } = useSiteConfig();
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.body.classList.contains('light-mode'));
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains('light-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'projects';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [heroImage, setHeroImage] = useState('');
  const [heroStatus, setHeroStatus] = useState('');
  const [heroAvailability, setHeroAvailability] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [resumeImage, setResumeImage] = useState('');
  
  // Global brand identity & custom config states
  const [siteTitle, setSiteTitle] = useState('youknowwalid');
  const [siteLogo, setSiteLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [footerPortrait, setFooterPortrait] = useState('');
  const [headerLinks, setHeaderLinks] = useState<{label: string, url: string}[]>([]);
  const [footerColumns, setFooterColumns] = useState<{title: string, links: {label: string, url: string}[]}[]>([]);
  const [socialLinks, setSocialLinks] = useState<{platform: string, url: string}[]>([]);
  const [copyrightText, setCopyrightText] = useState('© 2026 Md. Walid Rahman Swapnil. All rights reserved.');

  // Global Brand setting variables
  const [officeAddress, setOfficeAddress] = useState('Nikunja 2, Dhaka 1229');
  const [contactEmail, setContactEmail] = useState('info@walidrahman.com');
  const [officePhone, setOfficePhone] = useState('+880 1744 588 644');
  const [primaryColor, setPrimaryColor] = useState('#f45901');
  const [secondaryColor, setSecondaryColor] = useState('#00c6ff');
  const [brandTagline, setBrandTagline] = useState('A Brand Developer crafting premium digital experiences.');
  const [globalCtaText, setGlobalCtaText] = useState("Let's Discuss");
  const [globalCtaUrl, setGlobalCtaUrl] = useState('/#contact');

  const [uploadValue, setUploadValue] = useState('');
  const [socialUploadValue, setSocialUploadValue] = useState('');
  const [gallery1, setGallery1] = useState('');
  const [gallery2, setGallery2] = useState('');
  const [gallery3, setGallery3] = useState('');
  const [gallery4, setGallery4] = useState('');
  const [isUploadingCV, setIsUploadingCV] = useState(false);

  const handleCVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
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

  const checkAdminStatus = useCallback(async (currentUser: User) => {
    try {
      const isSystemAdmin = currentUser.email?.toLowerCase() === 'walidxdxdxd@gmail.com';
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setIsAdmin(userDoc.data()?.isAdmin || isSystemAdmin);
      } else {
        setIsAdmin(isSystemAdmin);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(currentUser.email?.toLowerCase() === 'walidxdxdxd@gmail.com');
    }
  }, []);

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
  }, [checkAdminStatus]);

  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = useCallback(async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
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
  }, [checkAdminStatus]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'settings' || activeTab === 'branding' || activeTab === 'seoSettings') {
      try {
        const configDoc = await getDoc(doc(db, 'siteConfig', 'hero'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setHeroImage(data.heroImage || '');
          setHeroStatus(data.heroStatus || '');
          setHeroAvailability(data.heroAvailability || '');
          setCvUrl(data.cvUrl || '');
          setResumeImage(data.resumeImage || '');
        }

        const globalDoc = await getDoc(doc(db, 'siteConfig', 'global'));
        if (globalDoc.exists()) {
          const data = globalDoc.data();
          setSiteTitle(data.siteTitle || 'youknowwalid');
          setSiteLogo(data.siteLogo || '');
          setFavicon(data.favicon || '');
          setFooterPortrait(data.footerPortrait || '');
          setHeaderLinks(data.headerLinks || [
            { label: 'Home', url: '/#home' },
            { label: 'About', url: '/#about' },
            { label: 'Resume', url: '/#resume' },
            { label: 'Services', url: '/#services' },
            { label: 'Projects', url: '/#projects' },
            { label: 'Contact', url: '/#contact' },
            { label: 'Blog', url: '/#blog' },
          ]);
          setFooterColumns(data.footerColumns || []);
          setSocialLinks(data.socialLinks || []);
          setCopyrightText(data.copyrightText || '');
          setOfficeAddress(data.officeAddress || '');
          setContactEmail(data.contactEmail || '');
          setOfficePhone(data.officePhone || '');
          setPrimaryColor(data.primaryColor || '#f45901');
          setSecondaryColor(data.secondaryColor || '#00c6ff');
          setBrandTagline(data.brandTagline || '');
          setGlobalCtaText(data.globalCtaText || '');
          setGlobalCtaUrl(data.globalCtaUrl || '');
        }
      } catch (err) {
        console.error("Failed to load settings from DB:", err);
      }
      setItems([]);
    } else {
      const data = await getCollection(activeTab);
      console.log(`[DEBUG] Loaded ${activeTab}:`, data);
      setItems(data || []);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin) {
      loadItems();
    }
  }, [activeTab, isAdmin, loadItems]);

  const [isSaving, setIsSaving] = useState(false);

  const str = (v: any) => (v === undefined || v === null) ? "" : String(v);
  const bool = (v: any) => v === true || v === 'true';
  const arr = (v: any) => Array.isArray(v) ? v.filter(i => i !== undefined && i !== null).map(str) : [];
  const num = (v: any, fallback = 0) => {
    const parsed = parseInt(v, 10);
    return isNaN(parsed) ? fallback : parsed;
  };

  const normalizePayload = (tab: string, rawData: any) => {
    switch (tab) {
      case 'projects': return normalizeProject(rawData);
      case 'services': return normalizeService(rawData);
      case 'blogPosts': return normalizeBlogPost(rawData);
      case 'resume': return normalizeResumeItem(rawData);
      case 'testimonials': return normalizeTestimonial(rawData);
      case 'pricingPlans': return normalizePricingPlan(rawData);
      case 'products': return normalizeProduct(rawData);
      case 'skills':
        return {
          name: str(rawData.name),
          level: num(rawData.level, 80),
          updatedAt: new Date().toISOString()
        };
      default:
        const payload: any = { updatedAt: new Date().toISOString() };
        Object.keys(rawData).forEach(key => {
          if (rawData[key] !== undefined) payload[key] = rawData[key];
        });
        return payload;
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;
    try {
      new URL(trimmed);
      return true;
    } catch (e) {
      return false;
    }
  };

  const getLinkUrl = (label: string, defaultUrl: string) => {
    const found = headerLinks.find(l => l.label.toLowerCase() === label.toLowerCase());
    return found ? found.url : defaultUrl;
  };

  const handleLinkUrlChange = (label: string, newUrl: string) => {
    const updated = [...headerLinks];
    const idx = updated.findIndex(l => l.label.toLowerCase() === label.toLowerCase());
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], url: newUrl };
    } else {
      updated.push({ label, url: newUrl });
    }
    setHeaderLinks(updated);
  };

  const getSocialUrl = (platform: string, defaultUrl: string) => {
    const found = socialLinks.find(s => s.platform.toLowerCase() === platform.toLowerCase());
    return found ? found.url : defaultUrl;
  };

  const handleSocialUrlChange = (platform: string, newUrl: string) => {
    const updated = [...socialLinks];
    const idx = updated.findIndex(s => s.platform.toLowerCase() === platform.toLowerCase());
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], url: newUrl };
    } else {
      updated.push({ platform, url: newUrl });
    }
    setSocialLinks(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const rawData: any = Object.fromEntries(formData.entries());

      console.log(`[DEBUG] handleSave for ${activeTab}:`, rawData, 'editingItem:', editingItem);

      if (activeTab === 'projects' || activeTab === 'blogPosts') {
        rawData.image = uploadValue || editingItem?.image || "";
        rawData.socialImage = socialUploadValue || editingItem?.socialImage || "";
      }
      if (activeTab === 'testimonials') {
        rawData.avatar = uploadValue || editingItem?.avatar || "";
      }
      if (activeTab === 'products') {
        rawData.thumbnail = uploadValue || editingItem?.thumbnail || "";
        rawData.image = socialUploadValue || editingItem?.image || "";
        rawData.gallery1 = gallery1 || editingItem?.gallery1 || "";
        rawData.gallery2 = gallery2 || editingItem?.gallery2 || "";
        rawData.gallery3 = gallery3 || editingItem?.gallery3 || "";
        rawData.gallery4 = gallery4 || editingItem?.gallery4 || "";
        rawData.featured = rawData.featured === 'true' || rawData.featured === true;
        rawData.published = rawData.published === 'true' || rawData.published === true;
        rawData.order = num(rawData.order, 0);
      }

      if (rawData.tags) {
        rawData.tags = (rawData.tags as string).split(',').map(t => t.trim()).filter(t => t !== '');
      }
      if (activeTab === 'pricingPlans') {
        rawData.features = (rawData.features as string).split(',').map(f => f.trim()).filter(f => f !== '');
        rawData.unavailableFeatures = (rawData.unavailableFeatures as string || '').split(',').map(f => f.trim()).filter(f => f !== '');
      }

      const data = normalizePayload(activeTab, rawData);

      if (activeTab === 'pricingPlans' && !data.name) throw new Error("Plan name is required");
      if (activeTab === 'projects' && !data.title) throw new Error("Project title is required");
      if (activeTab === 'services' && !data.title) throw new Error("Service title is required");
      if (activeTab === 'products') {
        if (!data.title) throw new Error("Product title is required");
        if (!data.gumroadUrl) throw new Error("Gumroad Product link is required");
        
        const urlStr = String(data.gumroadUrl).trim().toLowerCase();
        if (!urlStr.includes('gumroad.com') && !urlStr.includes('gum.co')) {
          throw new Error("Invalid Gumroad link. Must be a secure link from gumroad.com or gum.co.");
        }
      }

      if (activeTab === 'settings') {
        const navLabels = ['Home', 'About', 'Resume', 'Services', 'Projects', 'Resources', 'Contact', 'Blog'];
        for (const label of navLabels) {
          const u = getLinkUrl(label, '');
          if (u && !validateUrl(u)) {
            throw new Error(`Invalid URL for Navigation Link: ${label}.`);
          }
        }

        const platforms = ['Facebook', 'LinkedIn', 'GitHub'];
        for (const platform of platforms) {
          const url = getSocialUrl(platform, '');
          if (url && !validateUrl(url)) {
            throw new Error(`Invalid URL for Social Link: ${platform}.`);
          }
        }

        const settingsPayload = {
          heroImage: str(heroImage), 
          heroStatus: str(heroStatus) || "Active Now",
          heroAvailability: str(heroAvailability) || "Available for projects",
          cvUrl: str(cvUrl),
          resumeImage: str(resumeImage),
          updatedAt: new Date().toISOString() 
        };
        await updateDocument('siteConfig', 'hero', settingsPayload);

        const globalSettingsPayload = {
          siteTitle: str(siteTitle),
          siteLogo: str(siteLogo),
          favicon: str(favicon),
          footerPortrait: str(footerPortrait),
          brandTagline: str(brandTagline),
          headerLinks,
          footerColumns,
          socialLinks,
          copyrightText: str(copyrightText),
          officeAddress: str(officeAddress),
          contactEmail: str(contactEmail),
          officePhone: str(officePhone),
          primaryColor: str(primaryColor),
          secondaryColor: str(secondaryColor),
          globalCtaText: str(globalCtaText),
          globalCtaUrl: str(globalCtaUrl),
          updatedAt: new Date().toISOString()
        };
        await updateDocument('siteConfig', 'global', globalSettingsPayload);
        await updateConfig(globalSettingsPayload);
        
        alert('All configurations & settings successfully saved!');
      } else if (editingItem) {
        console.log(`[DEBUG] Updating ${activeTab} item:`, editingItem.id, data);
        await updateDocument(activeTab, editingItem.id, data);
        alert(`${activeTab} item updated!`);
      } else {
        console.log(`[DEBUG] Adding new ${activeTab} item:`, data);
        await addDocument(activeTab, data);
        alert(`New ${activeTab} item created!`);
      }
      
      setEditingItem(null);
      setIsAdding(false);
      setUploadValue('');
      setSocialUploadValue('');
      setGallery1('');
      setGallery2('');
      setGallery3('');
      setGallery4('');
      await loadItems();
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
      try {
        console.log(`[DEBUG] Deleting ${activeTab} item:`, id);
        await removeDocument(activeTab, id);
        alert('Item deleted!');
        await loadItems();
      } catch (error: any) {
        console.error("Delete error:", error);
        alert(`Delete failed: ${error.message}`);
      }
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
      await loadItems();
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
        {activeTab !== 'seoSettings' && (
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-text-main">{TABS.find(t => t.id === activeTab)?.label} Management</h2>
              {activeTab !== 'settings' && activeTab !== 'branding' && <p className="text-text-muted">Total items: {items.length}</p>}
            </div>
            <div className="flex gap-4">
              {activeTab !== 'settings' && activeTab !== 'branding' && activeTab !== 'contactSubmissions' && (
                <button 
                  onClick={handleSeedData}
                  className="flex items-center gap-2 border border-white/10 text-gray-400 font-bold px-6 py-3 rounded-xl hover:bg-white/5 transition-all"
                  title="Import Default Data"
                >
                  <Database className="w-5 h-5" />
                  Seed Default
                </button>
              )}
              {activeTab !== 'settings' && activeTab !== 'branding' && activeTab !== 'contactSubmissions' && activeTab !== 'seoSettings' && (
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
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSave} className="space-y-10">
            <div className="flex justify-between items-center bg-bg-card p-6 rounded-2xl border border-white/5 w-full">
              <div>
                <h3 className="text-lg font-black">Publish Settings</h3>
                <p className="text-xs text-text-muted">Save and publish hero and resume configurations atomically to Firestore.</p>
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-accent hover:bg-accent/90 text-white font-black px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Publishing...' : 'Save & Publish Changes'}
              </button>
            </div>

            <div className="max-w-4xl">
              <div className="bg-bg-card p-10 rounded-3xl border border-white/5 space-y-8">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <ImageIcon className="text-accent w-6 h-6" /> Hero Settings
                </h3>
                <div className="space-y-6">
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
                      <label className="block text-sm text-gray-400 mb-2">Status Badge</label>
                      <input 
                        value={heroStatus} 
                        onChange={(e) => setHeroStatus(e.target.value)}
                        placeholder="Active Now"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none text-white focus:ring-1 focus:ring-accent" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Availability Text</label>
                      <input 
                        value={heroAvailability} 
                        onChange={(e) => setHeroAvailability(e.target.value)}
                        placeholder="Available for projects"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none text-white focus:ring-1 focus:ring-accent" 
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
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none text-white" 
                        />
                      </div>
                      <label className="bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2 text-sm shrink-0 text-white">
                        <Upload className="w-4 h-4 text-accent" />
                        <span>Upload PDF</span>
                        <input type="file" accept="application/pdf" onChange={handleCVUpload} className="hidden" />
                      </label>
                    </div>
                    {isUploadingCV && <p className="text-xs text-accent animate-pulse">Processing PDF...</p>}
                    {cvUrl && cvUrl.startsWith('data:') && (
                      <p className="text-xs text-green-400">PDF successfully loaded from local file.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'seoSettings' && <SEOSettings />}

        {activeTab === 'branding' && <BrandingSettings onBack={() => setActiveTab('projects')} />}

        {/* Form Overlay */}
        <AnimatePresence>
          {(isAdding || editingItem) && activeTab !== 'settings' && activeTab !== 'branding' && activeTab !== 'seoSettings' && (
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
                  {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
                </h3>
                
                <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                  {/* PROJECTS */}
                  {activeTab === 'projects' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Project Title *</label>
                        <input name="title" defaultValue={editingItem?.title || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Category</label>
                        <input name="category" defaultValue={editingItem?.category || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Permalink / Slug</label>
                        <input name="slug" defaultValue={editingItem?.slug || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                    </>
                  )}

                  {/* SERVICES */}
                  {activeTab === 'services' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Service Title *</label>
                        <input name="title" defaultValue={editingItem?.title || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">ID (e.g., 01) *</label>
                        <input name="id" defaultValue={editingItem?.id || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Icon Name (lucide)</label>
                        <input name="iconName" defaultValue={editingItem?.iconName || 'Palette'} placeholder="Palette, Braces, etc." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Description *</label>
                        <textarea name="description" defaultValue={editingItem?.description || ''} required rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                    </>
                  )}

                  {/* BLOG POSTS */}
                  {activeTab === 'blogPosts' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Post Title *</label>
                        <input name="title" defaultValue={editingItem?.title || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Date</label>
                        <input name="date" defaultValue={editingItem?.date || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Author</label>
                        <input name="author" defaultValue={editingItem?.author || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Slug</label>
                        <input name="slug" defaultValue={editingItem?.slug || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Excerpt *</label>
                        <textarea name="excerpt" defaultValue={editingItem?.excerpt || ''} required rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Full Content</label>
                        <textarea name="content" defaultValue={editingItem?.content || ''} rows={6} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Tags (comma separated)</label>
                        <input name="tags" defaultValue={editingItem?.tags?.join(', ') || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                    </>
                  )}

                  {/* RESUME */}
                  {activeTab === 'resume' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Role / Title *</label>
                        <input name="role" defaultValue={editingItem?.role || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Company / Institution *</label>
                        <input name="company" defaultValue={editingItem?.company || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Year / Duration *</label>
                        <input name="year" defaultValue={editingItem?.year || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea name="desc" defaultValue={editingItem?.desc || ''} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                    </>
                  )}

                  {/* SKILLS */}
                  {activeTab === 'skills' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Skill Name *</label>
                        <input name="name" defaultValue={editingItem?.name || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Proficiency Level (0-100) *</label>
                        <input name="level" type="number" min="0" max="100" defaultValue={editingItem?.level || 80} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        <div className="mt-4 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${editingItem?.level || 80}%` }} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* TESTIMONIALS */}
                  {activeTab === 'testimonials' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Client Name *</label>
                        <input name="name" defaultValue={editingItem?.name || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Role / Position *</label>
                        <input name="role" defaultValue={editingItem?.role || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Feedback Content *</label>
                        <textarea name="content" defaultValue={editingItem?.content || ''} required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      <div className="col-span-2">
                        <ImageUpload 
                          label="Client Avatar" 
                          value={uploadValue || editingItem?.avatar || ''} 
                          onChange={setUploadValue} 
                          recommendation="Recommended: 150x150px circle avatar."
                        />
                      </div>
                    </>
                  )}

                  {/* PRICING PLANS */}
                  {activeTab === 'pricingPlans' && (
                    <>
                      <div className="col-span-2 grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Plan Name *</label>
                          <input name="name" defaultValue={editingItem?.name || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Price (e.g. $350)</label>
                          <input name="price" defaultValue={editingItem?.price || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        </div>
                      </div>

                      <div className="col-span-2 grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Button Text</label>
                          <input name="buttonText" defaultValue={editingItem?.buttonText || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Featured / Accent?</label>
                          <select name="accent" defaultValue={String(editingItem?.accent === true)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none">
                            <option value="false">Normal</option>
                            <option value="true">Accent (Highlighted)</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Included Features (comma separated)</label>
                        <textarea name="features" defaultValue={editingItem?.features?.join(', ') || ''} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Excluded Features (comma separated)</label>
                        <textarea name="unavailableFeatures" defaultValue={editingItem?.unavailableFeatures?.join(', ') || ''} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                    </>
                  )}

                  {/* PRODUCTS */}
                  {activeTab === 'products' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Product Title *</label>
                        <input name="title" defaultValue={editingItem?.title || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Short Title</label>
                        <input name="shortTitle" defaultValue={editingItem?.shortTitle || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Price</label>
                        <input name="price" defaultValue={editingItem?.price || ''} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Gumroad URL *</label>
                        <input name="gumroadUrl" defaultValue={editingItem?.gumroadUrl || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea name="description" defaultValue={editingItem?.description || ''} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
                      </div>
                      
                      {/* NEW FIELDS ADDED HERE TO PREVENT DATA LOSS */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Display Order</label>
                        <input name="order" type="number" defaultValue={editingItem?.order || 0} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Publish Status</label>
                        <select name="published" defaultValue={String(editingItem?.published !== false)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none">
                          <option value="true">Published</option>
                          <option value="false">Hidden</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Featured Status</label>
                        <select name="featured" defaultValue={String(editingItem?.featured !== false)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none">
                          <option value="true">Featured</option>
                          <option value="false">Not Featured</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="col-span-2 flex justify-end gap-4 mt-4 pt-6 border-t border-white/5">
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
        {activeTab !== 'settings' && activeTab !== 'branding' && activeTab !== 'seoSettings' && (
        <div className="grid gap-4">
          {items.map((item) => (
            <motion.div 
              layout
              key={item.id}
              className="bg-bg-card p-6 rounded-2xl border border-white/5 flex items-center gap-6 group hover:border-accent/30 transition-all"
            >
              {(item.image || item.thumbnail) && (
                <img src={item.thumbnail || item.image} alt={item.title || item.name} className="w-20 h-20 object-cover rounded-xl border border-white/10" referrerPolicy="no-referrer" />
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
                      <span>{item.features?.length || 0} Features</span>
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
                </div>
              </div>
              <div className="flex gap-2">
                {activeTab !== 'contactSubmissions' && (
                  <button 
                    onClick={() => {
                      console.log(`[DEBUG] Editing item:`, item);
                      setEditingItem(item);
                      // NEW LOGIC: This stops the image state from bleeding into the new edit
                      setUploadValue('');
                      setSocialUploadValue('');
                      setGallery1('');
                      setGallery2('');
                      setGallery3('');
                      setGallery4('');
                    }}
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
        )}
      </main>
    </div>
  );
}
