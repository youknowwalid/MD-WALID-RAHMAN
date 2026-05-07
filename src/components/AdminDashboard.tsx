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
  Users
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
  ]
};
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'blogPosts', label: 'Blog', icon: FileText },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'testimonials', label: 'Feedback', icon: Users },
];

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const checkAdminStatus = async (currentUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setIsAdmin(userDoc.data()?.isAdmin || false);
      } else {
        // If doc doesn't exist yet, it might be being created
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
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
    const data = await getCollection(activeTab);
    setItems(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    if (editingItem) {
      await updateDocument(activeTab, editingItem.id, data);
    } else {
      await addDocument(activeTab, data);
    }
    
    setEditingItem(null);
    setIsAdding(false);
    loadItems();
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
            className="w-full bg-accent text-black font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
    <div className="min-h-screen bg-bg-dark text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-card border-r border-white/5 p-6 flex flex-col">
        <div className="text-xl font-black mb-10 tracking-tighter">
          Admin<span className="text-accent">Panel</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsAdding(false); setEditingItem(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-accent text-black font-bold' : 'text-gray-400 hover:bg-white/5'
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
            <h2 className="text-3xl font-black">{TABS.find(t => t.id === activeTab)?.label} Management</h2>
            <p className="text-gray-400">Total items: {items.length}</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleSeedData}
              className="flex items-center gap-2 border border-white/10 text-gray-400 font-bold px-6 py-3 rounded-xl hover:bg-white/5 transition-all"
              title="Import Default Data"
            >
              <Database className="w-5 h-5" />
              Seed Default
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-accent text-black font-black px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.4)] transition-all"
            >
              <Plus className="w-5 h-5" />
              Add New
            </button>
          </div>
        </div>

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
                className="bg-bg-card w-full max-w-2xl rounded-3xl border border-white/10 p-8 relative"
              >
                <button 
                  onClick={() => { setIsAdding(false); setEditingItem(null); }}
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
                        <input name="title" defaultValue={editingItem?.title} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Category</label>
                        <input name="category" defaultValue={editingItem?.category} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Link</label>
                        <input name="link" defaultValue={editingItem?.link} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Image URL</label>
                        <input name="image" defaultValue={editingItem?.image} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
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
                        <input name="title" defaultValue={editingItem?.title} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Date String</label>
                        <input name="date" defaultValue={editingItem?.date} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Image URL</label>
                        <input name="image" defaultValue={editingItem?.image} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Excerpt</label>
                        <textarea name="excerpt" defaultValue={editingItem?.excerpt} required rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
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
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Avatar URL</label>
                        <input name="avatar" defaultValue={editingItem?.avatar} required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Feedback Content</label>
                        <textarea name="content" defaultValue={editingItem?.content} required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-accent outline-none resize-none" />
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
                      className="bg-accent text-black font-black px-10 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.4)] transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {editingItem ? 'Update' : 'Save'} Item
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
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-1">{item.title || item.name || item.role}</h4>
                <div className="flex gap-4 text-sm text-gray-500">
                  {item.category && <span>{item.category}</span>}
                  {item.id && activeTab === 'services' && <span>ID: {item.id}</span>}
                  {item.date && <span>{item.date}</span>}
                  {item.year && <span>{item.year}</span>}
                  {item.company && <span>{item.company}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingItem(item)}
                  className="p-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
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
