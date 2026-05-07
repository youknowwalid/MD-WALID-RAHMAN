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
  ChevronLeft
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
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'blogPosts', label: 'Blog', icon: FileText },
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
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-accent text-black font-black px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.4)] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
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
                <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-xl border border-white/10" referrerPolicy="no-referrer" />
              )}
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                <div className="flex gap-4 text-sm text-gray-500">
                  {item.category && <span>{item.category}</span>}
                  {item.id && activeTab === 'services' && <span>ID: {item.id}</span>}
                  {item.date && <span>{item.date}</span>}
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
