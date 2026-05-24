import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  FileText,
  ChevronLeft,
  Users,
  Settings,
  DollarSign,
  MessageSquare,
  Cpu,
  ShoppingCart,
  Palette,
  Globe
} from 'lucide-react';
import { logout } from '../services/firebase';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
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

interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'projects';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const currentTab = useMemo(
    () => TABS.find(t => t.id === activeTab) || TABS[0],
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-bg-dark text-text-main flex transition-colors duration-300">
      {/* Persistent Sidebar - Mounts Once */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border-subtle bg-bg-card/50 backdrop-blur-sm sticky top-0 z-40 h-16 flex items-center px-10">
          <h2 className="text-2xl font-black text-text-main">{currentTab.label} Management</h2>
        </div>

        {/* Content Outlet with Smooth Transitions */}
        <ContentOutlet activeTab={activeTab}>{children}</ContentOutlet>
      </main>
    </div>
  );
};

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: Tab[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <aside className="w-64 bg-bg-card border-r border-border-subtle p-6 flex flex-col h-screen sticky top-0 z-50">
      {/* Logo - Never re-renders */}
      <div className="text-xl font-black mb-10 tracking-tighter">
        Admin<span className="text-accent">Panel</span>
      </div>

      {/* Navigation - No re-renders on content change */}
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id ? 'bg-accent text-white font-bold' : 'text-text-muted hover:bg-white/5'
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-5 h-5 shrink-0" />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
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
  );
};

interface ContentOutletProps {
  activeTab: string;
  children: React.ReactNode;
}

const ContentOutlet: React.FC<ContentOutletProps> = ({ activeTab, children }) => {
  return (
    <div className="flex-1 overflow-y-auto p-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut',
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
