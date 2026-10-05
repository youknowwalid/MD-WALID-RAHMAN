import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, Edit2, Save, X, LogOut, LayoutDashboard, FolderKanban, Briefcase, FileText,
  Loader2, ChevronLeft, Users, Settings, DollarSign, MessageSquare, Cpu, ShoppingCart, Palette, Globe,
} from 'lucide-react';
import { SEOSettings } from './SEOSettings';
import { BrandingSettings } from './BrandingSettings';
import AdminLogin from './admin/AdminLogin';
import SettingsPanel from './admin/SettingsPanel';
import Inquiries from './admin/Inquiries';
import { GalleryField, ImageField, Toast, inputCls, labelCls, useToast } from './admin/fields';
import { FORMS, FormCollection, friendlyError, toFormValues, toPayload } from './admin/forms';
import { backendConfigured } from '../lib/config';
import * as admin from '../lib/admin';
import { Collection } from '../lib/rows';
import { useSiteConfig } from '../context/SiteConfigContext';
import Seo from './Seo';

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'blogPosts', label: 'Blog', icon: FileText },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'skills', label: 'Skills', icon: Cpu },
  { id: 'testimonials', label: 'Feedback', icon: Users },
  { id: 'pricingPlans', label: 'Pricing', icon: DollarSign },
  { id: 'products', label: 'Products', icon: ShoppingCart },
  { id: 'contactSubmissions', label: 'Inquiries', icon: MessageSquare },
  { id: 'seoSettings', label: 'SEO Settings', icon: Globe },
  { id: 'branding', label: 'Branding Colors', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = (typeof TABS)[number]['id'];
const isFormTab = (t: string): t is FormCollection => t in FORMS;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-dark text-text-main flex items-center justify-center p-6">
      <Seo title="Admin" noindex />
      <main className="bg-bg-card p-8 sm:p-10 rounded-3xl border border-white/5 max-w-md w-full text-center space-y-4">{children}</main>
    </div>
  );
}

export default function AdminDashboard() {
  const [auth, setAuth] = useState<'checking' | 'out' | 'denied' | 'admin'>('checking');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!backendConfigured) return;
    let live = true;
    const apply = async (user: admin.User | null) => {
      if (!user) { if (live) setAuth('out'); return; }
      const ok = await admin.isAdmin();
      if (live) { setEmail(user.email || ''); setAuth(ok ? 'admin' : 'denied'); }
    };
    admin.getUser().then(apply);
    const off = admin.onAuthChange((u) => { setTimeout(() => apply(u), 0); });
    return () => { live = false; off(); };
  }, []);

  if (!backendConfigured) {
    return (
      <Shell>
        <LayoutDashboard className="w-14 h-14 text-accent mx-auto" aria-hidden="true" />
        <h1 className="text-2xl font-black">Database not connected yet</h1>
        <p className="text-text-muted text-sm">The admin panel needs the website&apos;s Supabase database. Until it is connected, the site shows its built-in content and the contact form opens the visitor&apos;s e-mail app.</p>
        <a href="/" className="inline-block text-accent hover:underline text-sm">← Back to the website</a>
      </Shell>
    );
  }
  if (auth === 'checking') return <Shell><Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" aria-label="Loading" /></Shell>;
  if (auth === 'out') return <><Seo title="Admin" noindex /><AdminLogin /></>;
  if (auth === 'denied') {
    return (
      <Shell>
        <h1 className="text-2xl font-black">No admin access</h1>
        <p className="text-text-muted text-sm">{email} is signed in, but this e-mail address is not the website administrator.</p>
        <button onClick={() => admin.signOut()} className="bg-accent text-white font-black px-6 py-3 rounded-xl">Sign out</button>
      </Shell>
    );
  }
  return <Dashboard email={email} />;
}

function Dashboard({ email }: { email: string }) {
  const { refresh } = useSiteConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'projects') as TabId;
  const setActiveTab = (tab: string) => { setSearchParams({ tab }); setEditing(null); };

  const { toast, show } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, any> } | null>(null);
  const [saving, setSaving] = useState(false);

  const isListTab = isFormTab(activeTab) || activeTab === 'contactSubmissions';

  const load = useCallback(async () => {
    if (!isListTab) return;
    setLoading(true);
    try { setItems(await admin.listAll(activeTab as Collection)); }
    catch (err: any) { show('error', `Could not load: ${friendlyError(err.message)}`); setItems([]); }
    finally { setLoading(false); }
  }, [activeTab, isListTab, show]);

  useEffect(() => { setItems([]); load(); }, [load]);

  const openEditor = (item: any | null) => {
    if (!isFormTab(activeTab)) return;
    setEditing({ id: item?.id ?? null, values: toFormValues(activeTab, item) });
  };
  const setValue = (name: string, value: any) => setEditing((e) => (e ? { ...e, values: { ...e.values, [name]: value } } : e));

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editing || !isFormTab(activeTab)) return;
    setSaving(true);
    try {
      const data = toPayload(activeTab, editing.values);
      if (editing.id) await admin.updateRow(activeTab, editing.id, data);
      else await admin.addRow(activeTab, data);
      show('success', editing.id ? 'Changes saved.' : 'Item created.');
      setEditing(null);
      await load();
    } catch (err: any) {
      show('error', friendlyError(err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this? This cannot be undone.')) return;
    try { await admin.removeRow(activeTab as Collection, id); show('success', 'Deleted.'); await load(); }
    catch (err: any) { show('error', `Delete failed: ${friendlyError(err.message)}`); }
  };

  const handleMarkRead = async (id: string, read: boolean) => {
    setItems((list) => list.map((m) => (m.id === id ? { ...m, isRead: read } : m)));
    try { await admin.markRead(id, read); } catch (err: any) { show('error', friendlyError(err.message)); load(); }
  };

  const tab = TABS.find((t) => t.id === activeTab)!;
  const form = isFormTab(activeTab) ? FORMS[activeTab] : null;
  const unread = activeTab === 'contactSubmissions' ? items.filter((m) => !m.isRead).length : 0;

  return (
    <div className="min-h-screen bg-bg-dark text-text-main flex flex-col lg:flex-row">
      <Seo title="Admin" noindex />
      <Toast toast={toast} />

      <aside className="lg:w-64 bg-bg-card border-b lg:border-b-0 lg:border-r border-border-subtle p-4 lg:p-6 flex flex-col shrink-0 lg:min-h-screen">
        <div className="flex items-center justify-between lg:block">
          <div className="text-xl font-black lg:mb-10 tracking-tighter">Admin<span className="text-accent">Panel</span></div>
          <div className="flex lg:hidden items-center gap-3 text-sm">
            <a href="/" className="text-gray-300 hover:text-white">View site</a>
            <button onClick={() => admin.signOut()} className="text-red-300 font-bold">Log out</button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible mt-4 lg:mt-0 lg:flex-1 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              aria-current={activeTab === t.id ? 'page' : undefined}
              className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-sm lg:text-base whitespace-nowrap ${activeTab === t.id ? 'bg-accent text-white font-bold' : 'text-text-muted hover:bg-white/5'}`}
            >
              <t.icon className="w-5 h-5" aria-hidden="true" />{t.label}
            </button>
          ))}
        </nav>
        <div className="hidden lg:block pt-6 border-t border-white/5 space-y-4">
          <p className="text-xs text-gray-400 truncate" title={email}>Signed in as {email}</p>
          <a href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ChevronLeft className="w-4 h-4" aria-hidden="true" /> View Site</a>
          <button onClick={() => admin.signOut()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-400/10 font-bold"><LogOut className="w-5 h-5" aria-hidden="true" />Log out</button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
        <div className="flex justify-between items-center gap-4 mb-8 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black">{tab.label}{unread > 0 && <span className="ml-3 text-sm bg-accent rounded-full px-3 py-1 align-middle">{unread} new</span>}</h1>
          {form && (
            <button onClick={() => openEditor(null)} className="flex items-center gap-2 bg-accent text-white font-black px-6 py-3 rounded-xl"><Plus className="w-5 h-5" aria-hidden="true" />Add new</button>
          )}
        </div>

        {activeTab === 'settings' && <SettingsPanel onToast={show} />}
        {activeTab === 'seoSettings' && <SEOSettings onToast={show} />}
        {activeTab === 'branding' && <BrandingSettings onToast={show} />}

        {loading && isListTab && <div className="flex justify-center py-16" role="status" aria-label="Loading"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}

        {activeTab === 'contactSubmissions' && !loading && (
          <Inquiries items={items} onMarkRead={handleMarkRead} onDelete={handleDelete} />
        )}

        {form && !loading && (
          <ul className="grid gap-4">
            {items.map((item) => {
              const img = item.image || item.thumbnail || item.avatar;
              return (
                <li key={item.id} className="bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 flex items-center gap-4 sm:gap-6 hover:border-accent/30 transition-all">
                  {img && <img src={img} alt="" className={`w-16 h-16 sm:w-20 sm:h-20 object-cover border border-white/10 shrink-0 ${item.avatar && !item.image ? 'rounded-full' : 'rounded-xl'}`} />}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold mb-1 truncate text-white">{item.title || item.name || item.role}</h2>
                    <p className="text-sm text-gray-400 truncate">
                      {[item.category, item.company && `${item.company}${item.year ? ` (${item.year})` : ''}`, item.price, item.role && item.name ? item.role : '', typeof item.level === 'number' ? `${item.level}%` : '', item.date, item.displayId && `#${item.displayId}`, item.published === false ? 'Hidden (draft)' : '']
                        .filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEditor(item)} className="p-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white" aria-label={`Edit ${item.title || item.name || item.role}`}><Edit2 className="w-5 h-5" aria-hidden="true" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-3 rounded-xl border border-white/10 hover:bg-red-400/10 text-gray-300 hover:text-red-300" aria-label={`Delete ${item.title || item.name || item.role}`}><Trash2 className="w-5 h-5" aria-hidden="true" /></button>
                  </div>
                </li>
              );
            })}
            {items.length === 0 && (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl"><p className="text-gray-400">Nothing here yet. Click “Add new” to create the first {form.singular}.</p></div>
            )}
          </ul>
        )}
      </main>

      <AnimatePresence>
        {editing && form && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${editing.id ? 'Edit' : 'Add'} ${form.singular}`}>
            <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-bg-card w-full max-w-3xl rounded-3xl border border-white/10 p-5 sm:p-8 relative overflow-y-auto max-h-[94vh]">
              <button type="button" onClick={() => setEditing(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-white p-2" aria-label="Close"><X className="w-6 h-6" aria-hidden="true" /></button>
              <h2 className="text-2xl font-black mb-8 pr-10">{editing.id ? 'Edit' : 'Add'} {form.singular}</h2>

              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {form.fields.map((f) => {
                  const v = editing.values[f.name];
                  const id = `f-${f.name}`;
                  const span = f.half ? '' : 'sm:col-span-2';
                  return (
                    <React.Fragment key={f.name}>
                      {f.section && <h3 className="sm:col-span-2 pt-4 border-t border-white/5 text-xs uppercase tracking-widest text-accent">{f.section}</h3>}
                      <div className={span}>
                        {f.type === 'image' ? (
                          <ImageField label={f.label} value={v} onChange={(u) => setValue(f.name, u)} hint={f.hint} maxSide={f.maxSide} compact={f.name.startsWith('gallery')} />
                        ) : f.type === 'gallery' ? (
                          <GalleryField label={f.label} value={v} onChange={(u) => setValue(f.name, u)} hint={f.hint} />
                        ) : f.type === 'checkbox' ? (
                          <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
                            <input type="checkbox" checked={Boolean(v)} onChange={(e) => setValue(f.name, e.target.checked)} className="w-5 h-5 accent-accent" />{f.label}
                          </label>
                        ) : (
                          <>
                            <label htmlFor={id} className={labelCls}>{f.label}{f.required && <span aria-hidden="true"> *</span>}</label>
                            {f.type === 'textarea' || f.type === 'lines' ? (
                              <textarea id={id} rows={f.rows ?? 4} value={v} onChange={(e) => setValue(f.name, e.target.value)} required={f.required} className={`${inputCls} resize-y ${f.mono ? 'font-mono' : ''}`} />
                            ) : f.type === 'select' ? (
                              <select id={id} value={v} onChange={(e) => setValue(f.name, e.target.value)} className={inputCls}>{f.options!.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                            ) : (
                              <input id={id} type={f.type === 'number' ? 'number' : 'text'} value={v} onChange={(e) => setValue(f.name, e.target.value)} required={f.required} placeholder={f.placeholder} min={f.type === 'number' ? (f.name === 'level' ? 0 : undefined) : undefined} max={f.name === 'level' ? 100 : undefined} className={inputCls} />
                            )}
                            {f.hint && <p className="text-xs text-accent mt-2">{f.hint}</p>}
                          </>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                <div className="sm:col-span-2 flex justify-end gap-4 mt-4 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setEditing(null)} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium">Cancel</button>
                  <button type="submit" disabled={saving} className="bg-accent text-white font-black px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Save className="w-5 h-5" aria-hidden="true" />}
                    {editing.id ? 'Save changes' : 'Create'}
                  </button>
                </div>
              </form>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
