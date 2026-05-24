import React, { useState, useEffect } from 'react';
import { useSiteConfig, SiteConfig, SocialLink } from '../context/SiteConfigContext';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle, 
  Palette, 
  Loader2,
  FileCode,
  Link as LinkIcon,
  Upload,
  RefreshCw,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Globe
} from 'lucide-react';

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const BrandingSettings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { config, updateConfig } = useSiteConfig();

  // Local form state representing the SiteConfig properties
  const [formData, setFormData] = useState<SiteConfig>({
    siteTitle: '',
    siteLogo: '',
    favicon: '',
    headerLinks: [],
    footerColumns: [],
    socialLinks: [],
    copyrightText: '',
    footerPortrait: '',
    officeAddress: '',
    contactEmail: '',
    officePhone: '',
    primaryColor: '#f45901',
    secondaryColor: '#00c6ff',
    brandTagline: '',
    globalCtaText: '',
    globalCtaUrl: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Sync state when database loads the central config record
  useEffect(() => {
    if (config) {
      setFormData({
        siteTitle: config.siteTitle || '',
        siteLogo: config.siteLogo || '',
        favicon: config.favicon || '',
        headerLinks: config.headerLinks || [],
        footerColumns: config.footerColumns || [],
        socialLinks: config.socialLinks || [],
        copyrightText: config.copyrightText || '',
        footerPortrait: config.footerPortrait || '',
        officeAddress: config.officeAddress || '',
        contactEmail: config.contactEmail || '',
        officePhone: config.officePhone || '',
        primaryColor: config.primaryColor || '#f45901',
        secondaryColor: config.secondaryColor || '#00c6ff',
        brandTagline: config.brandTagline || '',
        globalCtaText: config.globalCtaText || '',
        globalCtaUrl: config.globalCtaUrl || '',
      });
      setIsDirty(false);
    }
  }, [config]);

  // Handle toast timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Track dynamic changes
  const handleChange = (field: keyof SiteConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  // Helper to change platform URLs
  const handleSocialChange = (platformName: string, value: string) => {
    setFormData((prev) => {
      const cleaned = prev.socialLinks ? [...prev.socialLinks] : [];
      const index = cleaned.findIndex(s => s.platform.toLowerCase() === platformName.toLowerCase());
      
      if (index !== -1) {
        cleaned[index] = { platform: platformName.toLowerCase(), url: value };
      } else {
        cleaned.push({ platform: platformName.toLowerCase(), url: value });
      }

      return {
        ...prev,
        socialLinks: cleaned,
      };
    });
    setIsDirty(true);
  };

  const getSocialValue = (platformName: string) => {
    return formData.socialLinks?.find(s => s.platform.toLowerCase() === platformName.toLowerCase())?.url || '';
  };

  // Save changes atomically to firestore
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateConfig({
        siteTitle: formData.siteTitle,
        siteLogo: formData.siteLogo,
        favicon: formData.favicon,
        copyrightText: formData.copyrightText,
        officeAddress: formData.officeAddress,
        contactEmail: formData.contactEmail,
        officePhone: formData.officePhone,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        brandTagline: formData.brandTagline,
        globalCtaText: formData.globalCtaText,
        globalCtaUrl: formData.globalCtaUrl,
        socialLinks: formData.socialLinks,
      });
      
      setIsDirty(false);
      setToast({
        type: 'success',
        message: 'Branding identity successfully loaded and synchronized globally across the frontend!',
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err.message || 'Fatal error overwriting branding settings in Firestore.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes
  const handleReset = () => {
    if (window.confirm("Are you sure you want to discard your unsaved modifications?")) {
      if (config) {
        setFormData({
          siteTitle: config.siteTitle || '',
          siteLogo: config.siteLogo || '',
          favicon: config.favicon || '',
          headerLinks: config.headerLinks || [],
          footerColumns: config.footerColumns || [],
          socialLinks: config.socialLinks || [],
          copyrightText: config.copyrightText || '',
          footerPortrait: config.footerPortrait || '',
          officeAddress: config.officeAddress || '',
          contactEmail: config.contactEmail || '',
          officePhone: config.officePhone || '',
          primaryColor: config.primaryColor || '#f45901',
          secondaryColor: config.secondaryColor || '#00c6ff',
          brandTagline: config.brandTagline || '',
          globalCtaText: config.globalCtaText || '',
          globalCtaUrl: config.globalCtaUrl || '',
        });
        setIsDirty(false);
      }
    }
  };

  // Reset colors to brand baseline values
  const handleResetColors = () => {
    setFormData(prev => ({
      ...prev,
      primaryColor: '#f45901',
      secondaryColor: '#00c6ff'
    }));
    setIsDirty(true);
    
    // Preview dynamically in real-time
    document.documentElement.style.setProperty('--color-accent', '#f45901');
    document.documentElement.style.setProperty('--color-accent-secondary', '#00c6ff');
    
    setToast({
      type: 'info',
      message: 'Color palette reset to original brand presets. Click "Save & Publish" to update globally.'
    });
  };

  // Upload asset via compress block to restrict size
  const handleAssetUpload = (field: 'siteLogo' | 'favicon', file: File) => {
    // Validate File Size (max 2MB for safety)
    if (file.size > 2 * 1024 * 1024) {
      setToast({
        type: 'error',
        message: 'Maximum upload file size limit exceeded (2MB). Please select a compressed image.',
      });
      return;
    }

    // Validate Image Type
    if (!file.type.match('image.*')) {
      setToast({
        type: 'error',
        message: 'Invalid file type. Please select a valid image (PNG, JPG, SVG).',
      });
      return;
    }

    setIsUploading(field);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = field === 'favicon' ? 128 : 800; // favicons are small, logos are larger
        const scale = Math.min(MAX_DIMENSION / Math.max(img.width, img.height), 1);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL(field === 'favicon' ? 'image/png' : 'image/jpeg', 0.85);
          handleChange(field, compressed);
          setIsUploading(null);
          setToast({
            type: 'success',
            message: `Asset loaded successfully. Click "Save & Publish" to sync changes.`,
          });
        }
      };
      img.onerror = () => {
        setIsUploading(null);
        setToast({
          type: 'error',
          message: 'Error processing input image file structure.',
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 font-sans bg-neutral-950/20 p-4 md:p-8 rounded-3xl border border-white/5 transition-all duration-300">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all duration-300 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-blue-950 text-blue-200 border-blue-800'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          {toast.type === 'info' && <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Editor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
              Branding Settings Editor
            </h1>
            <p className="text-[10px] font-extrabold tracking-widest text-[#00c6ff]/85 uppercase">
              CMS / FRAMEWORK CONTROLS / STATIC AND LIVE UPDATES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 transition shadow-sm"
            >
              Discard Changes
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition duration-200 shadow-md ${
              isDirty 
                ? 'bg-accent text-white hover:bg-accent/90' 
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Publish Branding
          </button>
        </div>
      </div>

      {/* Unsaved changes alert banner */}
      {isDirty && (
        <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-amber-200 max-w-7xl">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs font-medium">
              You have unsaved identity or color scheme modifications. Protect your work by synchronizing.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => handleSave()}
            className="text-xs font-black underline hover:no-underline text-accent self-end sm:self-auto shrink-0"
          >
            Publish Now
          </button>
        </div>
      )}

      {/* Core Edit Panel */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl">
        
        {/* Left Side: Global Identity & Settings Form */}
        <div className="lg:col-span-7 bg-bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-8">
          
          <div>
            <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2.5">
              <Sparkles className="text-accent w-5 h-5" /> Global Identity & Branding Settings
            </h2>
            <p className="text-xs text-text-muted">Centrally manage and dynamically distribute company parameters, logos, and accent configurations.</p>
          </div>

          <div className="space-y-6">
            
            {/* Website Brand Name & Brand Tagline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Website Brand Name</label>
                <input
                  type="text"
                  value={formData.siteTitle}
                  onChange={(e) => handleChange('siteTitle', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition"
                  placeholder="e.g. youknowwalid"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Office Hotline Phone</label>
                <input
                  type="text"
                  value={formData.officePhone}
                  onChange={(e) => handleChange('officePhone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition"
                  placeholder="e.g. +880 1744 588 644"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Office Headquarters Address</label>
              <input
                type="text"
                value={formData.officeAddress}
                onChange={(e) => handleChange('officeAddress', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition"
                placeholder="e.g. 72 Mayfair Court, London, W1J 8DJ, United Kingdom"
              />
            </div>

            {/* Advising Contact Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Contact Advisory Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition"
                placeholder="e.g. info@walidrahman.com"
              />
            </div>

            {/* Dynamic Slogan/Tagline */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Brand Tagline / Pitch String</label>
              <textarea
                rows={2}
                value={formData.brandTagline}
                onChange={(e) => handleChange('brandTagline', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition resize-none"
                placeholder="A Brand Developer crafting premium digital experiences."
              />
            </div>

            {/* Colors System (As featured in the screenshot) */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-text-muted">Interactive Color Management</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Primary Color Picker */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">FCCA Sovereign Color</span>
                    <span className="text-[10px] text-text-muted">Primary accent buttons, solid glow elements</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-full h-11 rounded-lg border border-white/10 shadow flex items-center justify-center font-mono text-xs text-white bg-cover font-bold relative overflow-hidden transition-all duration-300 hover:scale-[1.02]" 
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <span className="bg-black/50 px-2.5 py-1 rounded text-[10px] tracking-tight text-white border border-white/5">
                        {formData.primaryColor || '#f45901'}
                      </span>
                      <input 
                        type="color" 
                        value={formData.primaryColor || '#f45901'} 
                        onChange={(e) => {
                          handleChange('primaryColor', e.target.value);
                          document.documentElement.style.setProperty('--color-accent', e.target.value);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Color Picker */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">Tactical Accent Color</span>
                    <span className="text-[10px] text-text-muted">Secondary glow elements, hover borders</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-full h-11 rounded-lg border border-white/10 shadow flex items-center justify-center font-mono text-xs text-white bg-cover font-bold relative overflow-hidden transition-all duration-300 hover:scale-[1.02]" 
                      style={{ backgroundColor: formData.secondaryColor }}
                    >
                      <span className="bg-black/50 px-2.5 py-1 rounded text-[10px] tracking-tight text-white border border-white/5">
                        {formData.secondaryColor || '#00c6ff'}
                      </span>
                      <input 
                        type="color" 
                        value={formData.secondaryColor || '#00c6ff'} 
                        onChange={(e) => {
                          handleChange('secondaryColor', e.target.value);
                          document.documentElement.style.setProperty('--color-accent-secondary', e.target.value);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Reset trigger */}
              <div className="flex justify-between items-center bg-white/5 px-4.5 py-3 rounded-xl border border-white/5 text-xs text-text-muted">
                <span>Wish to discard palette adjustments?</span>
                <button
                  type="button"
                  onClick={handleResetColors}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all"
                >
                  Reset Colors
                </button>
              </div>

            </div>

            {/* Global CTA Text & URL */}
            <div className="border-t border-white/5 pt-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-text-muted">Global Landing Calls-to-Action</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">CTA Button Label</label>
                  <input
                    type="text"
                    value={formData.globalCtaText}
                    onChange={(e) => handleChange('globalCtaText', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition"
                    placeholder="e.g. Start Project"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">CTA Nav Link URL</label>
                  <input
                    type="text"
                    value={formData.globalCtaUrl}
                    onChange={(e) => handleChange('globalCtaUrl', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition font-mono text-xs"
                    placeholder="e.g. /#contact"
                  />
                </div>
              </div>
            </div>

            {/* Footer Copyright Text */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Footer Copyright Text</label>
              <input
                type="text"
                value={formData.copyrightText}
                onChange={(e) => handleChange('copyrightText', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-accent focus:bg-white/10 outline-none transition"
                placeholder="e.g. © 2026 Md. Walid Rahman Swapnil. All rights reserved."
              />
            </div>

          </div>
        </div>

        {/* Right Side: Media Assets and Social Links */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Logo & Favicon Media Uploder */}
          <div className="bg-bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-black text-white border-b border-white/5 pb-3">
              Corporate Visual Assets
            </h3>

            {/* LOGO FILE */}
            <div className="space-y-3.5 bg-white/5 p-4 rounded-xl border border-white/5 animate-pulse-subtle">
              <div className="flex justify-between items-center">
                <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">Logo Image Graphic</span>
                <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">Logo Vector overrides Title</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/15 flex items-center justify-center shrink-0 overflow-hidden relative group">
                  {formData.siteLogo ? (
                    <img src={formData.siteLogo} alt="Logo preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                  )}
                  {isUploading === 'siteLogo' && (
                    <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2.5">
                  <div className="flex gap-2.5">
                    <label className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 border border-white/5">
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      Browse File
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleAssetUpload('siteLogo', e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {formData.siteLogo && (
                      <button
                        type="button"
                        onClick={() => handleChange('siteLogo', '')}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 p-2.5 rounded-lg transition"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={formData.siteLogo}
                    onChange={(e) => handleChange('siteLogo', e.target.value)}
                    placeholder="Or paste direct logo URL..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-lg text-xs text-white focus:border-accent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* FAVICON FILE */}
            <div className="space-y-3.5 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">Browser Favicon</span>
                <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">Square aspect PNG/ICO</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/15 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {formData.favicon ? (
                    <img src={formData.favicon} alt="Favicon preview" className="w-12 h-12 object-contain" />
                  ) : (
                    <Globe className="w-6 h-6 text-gray-500" />
                  )}
                  {isUploading === 'favicon' && (
                    <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2.5">
                  <div className="flex gap-2.5">
                    <label className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 border border-white/5">
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      Browse File
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleAssetUpload('favicon', e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {formData.favicon && (
                      <button
                        type="button"
                        onClick={() => handleChange('favicon', '')}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 p-2.5 rounded-lg transition"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={formData.favicon}
                    onChange={(e) => handleChange('favicon', e.target.value)}
                    placeholder="Or paste direct favicon URL..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-lg text-xs text-white focus:border-accent outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Social Media Link Connectors */}
          <div className="bg-bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-black text-white border-b border-white/5 pb-3">
              Social Media Distribution
            </h3>

            <div className="space-y-4">
              {['LinkedIn', 'Twitter', 'GitHub', 'Facebook'].map((plat) => {
                const urlVal = getSocialValue(plat);
                return (
                  <div key={plat} className="grid grid-cols-3 gap-3 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-xs font-black uppercase text-slate-300 tracking-wider pl-1.5">{plat} URL</span>
                    <input 
                      value={urlVal}
                      onChange={(e) => handleSocialChange(plat, e.target.value)}
                      placeholder={`https://${plat.toLowerCase()}.com/username`}
                      className="col-span-2 px-3 py-2 bg-neutral-950 border border-white/10 rounded-lg text-xs text-white focus:border-accent outline-none" 
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Previews Component */}
          <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-3.5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition duration-500">
              <FileCode className="w-24 h-24 text-white" />
            </div>
            
            <div className="flex items-center gap-2.5 text-accent">
              <CheckCircle className="w-5 h-5" />
              <h4 className="text-xs font-black tracking-widest uppercase font-sans">
                SYNC ARCHITECTURE READY
              </h4>
            </div>
            
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Updating these fields triggers atomic updates on Firebase Firestore `siteConfig/global`. All frontend structures, including the main hero title, navigation menus, and global CTAs will synchronize instantly.
            </p>
          </div>

        </div>

      </form>
    </div>
  );
};
