import React, { useState, useEffect } from 'react';
import { useSiteConfig, SeoConfig } from '../context/SiteConfigContext';
import { SEOTabs, SeoTabId } from './SEOTabs';
import { SEOPreviewCard } from './SEOPreviewCard';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle, 
  Globe, 
  Loader2,
  FileCode
} from 'lucide-react';

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const SEOSettings: React.FC = () => {
  const { seoConfig, updateSeoConfig } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<SeoTabId>('facebook'); // default to Facebook Feed Card like the screenshot

  // Local form state
  const [formData, setFormData] = useState<SeoConfig>(seoConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Sync state when DB loads
  useEffect(() => {
    if (seoConfig) {
      setFormData(seoConfig);
      setIsDirty(false);
    }
  }, [seoConfig]);

  // Show auto-expiring toasts
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle local changes
  const handleChange = (field: keyof SeoConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSeoConfig(formData);
      setIsDirty(false);
      setToast({
        type: 'success',
        message: 'SEO Settings successfully synchronized and written atomically to Firestore!',
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err.message || 'Fatal error syncing SEO config to Firestore database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to discard your unsaved changes?")) {
      setFormData(seoConfig);
      setIsDirty(false);
    }
  };

  // Safe client-side image upload via canvas compressor
  const handleImageUpload = (field: keyof SeoConfig, file: File) => {
    setIsUploading(String(field));
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(MAX_WIDTH / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          handleChange(field, compressedBase64);
          setIsUploading(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Simple image validator
  const isValidImageUrl = (url?: string) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
  };

  return (
    <div className="space-y-8 font-sans bg-neutral-50 min-h-screen p-6 md:p-10 rounded-3xl border border-neutral-100">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all duration-300 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-neutral-900 text-neutral-200 border-neutral-800'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-neutral-600 hover:bg-neutral-50 cursor-pointer shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight leading-none mb-1">
              SEO Settings Editor
            </h1>
            <p className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase">
              CMS / FRAMEWORK CONTROLS / STATIC AND LIVE UPDATES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {isDirty && (
            <button
              onClick={handleReset}
              className="px-4.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition shadow-sm"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition duration-200 shadow-md ${
              isDirty 
                ? 'bg-[#064e3b] text-white hover:bg-[#064e3b]/90' 
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save SEO Settings
          </button>
        </div>
      </div>

      {/* Unsaved Warning Bar */}
      {isDirty && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 px-4 py-3 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold">
              You have unsaved metadata modifications across these tabs. Don&apos;t forget to hit "Save SEO Settings" to apply.
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleSave}
            className="text-xs font-black underline hover:no-underline"
          >
            Apply Now
          </button>
        </div>
      )}

      {/* Tab Navigation Hub */}
      <SEOTabs activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* Main Two Column layout panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Forms container) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black tracking-tight text-neutral-900 border-b border-neutral-100 pb-3 uppercase">
            Manage {activeTab === 'global' ? 'Google Indexing' : 
                    activeTab === 'og' ? 'OpenGraph Headers' : 
                    activeTab === 'twitter' ? 'Twitter Card Layout' : 
                    activeTab === 'linkedin' ? 'LinkedIn Presentation' : 
                    'Facebook Shared Media'}
          </h3>

          <div className="space-y-5">
            {activeTab === 'global' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Meta Title</label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => handleChange('metaTitle', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Meta Description</label>
                  <textarea
                    rows={3}
                    value={formData.metaDescription}
                    onChange={(e) => handleChange('metaDescription', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Canonical URL</label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => handleChange('canonicalUrl', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Sitemap URL</label>
                    <input
                      type="url"
                      value={formData.sitemapUrl}
                      onChange={(e) => handleChange('sitemapUrl', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Focus Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.focusKeywords}
                    onChange={(e) => handleChange('focusKeywords', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-mono tracking-tight transition"
                    placeholder="portfolio, web app, custom brand, developer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-800">Robots Indexing</h5>
                    <p className="text-[10px] text-neutral-500">Enable search engines to crawl and index your web document</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('robotsIndex', !formData.robotsIndex)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.robotsIndex ? 'bg-[#064e3b]' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.robotsIndex ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'og' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">OG Title (WhatsApp Share)</label>
                  <input
                    type="text"
                    value={formData.ogTitle}
                    onChange={(e) => handleChange('ogTitle', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">OG Description</label>
                  <textarea
                    rows={3}
                    value={formData.ogDescription}
                    onChange={(e) => handleChange('ogDescription', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">OG Type</label>
                    <select
                      value={formData.ogType}
                      onChange={(e) => handleChange('ogType', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-bold text-neutral-700 transition"
                    >
                      <option value="website">website</option>
                      <option value="article">article</option>
                      <option value="profile">profile</option>
                      <option value="book">book</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Site Name</label>
                    <input
                      type="text"
                      value={formData.ogSiteName}
                      onChange={(e) => handleChange('ogSiteName', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Locale</label>
                    <input
                      type="text"
                      value={formData.ogLocale}
                      onChange={(e) => handleChange('ogLocale', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">OG Image URL</label>
                    <input
                      type="url"
                      value={formData.ogImageUrl}
                      onChange={(e) => handleChange('ogImageUrl', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'twitter' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Twitter Card Type</label>
                  <select
                    value={formData.twitterCardType}
                    onChange={(e) => handleChange('twitterCardType', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-bold text-neutral-700 transition"
                  >
                    <option value="summary_large_image">summary_large_image</option>
                    <option value="summary">summary</option>
                    <option value="app">app</option>
                    <option value="player">player</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Twitter Title</label>
                  <input
                    type="text"
                    value={formData.twitterTitle}
                    onChange={(e) => handleChange('twitterTitle', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Twitter Description</label>
                  <textarea
                    rows={3}
                    value={formData.twitterDescription}
                    onChange={(e) => handleChange('twitterDescription', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Twitter Handle (@username)</label>
                    <input
                      type="text"
                      value={formData.twitterHandle}
                      onChange={(e) => handleChange('twitterHandle', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Twitter Image URL</label>
                    <input
                      type="url"
                      value={formData.twitterImageUrl}
                      onChange={(e) => handleChange('twitterImageUrl', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'linkedin' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">LinkedIn Headline</label>
                  <input
                    type="text"
                    value={formData.linkedinHeadline}
                    onChange={(e) => handleChange('linkedinHeadline', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">LinkedIn snippet text / Intro Post</label>
                  <textarea
                    rows={4}
                    value={formData.linkedinSnippet}
                    onChange={(e) => handleChange('linkedinSnippet', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">LinkedIn Image URL</label>
                  <input
                    type="url"
                    value={formData.linkedinImageUrl}
                    onChange={(e) => handleChange('linkedinImageUrl', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                  />
                </div>
              </div>
            )}

            {activeTab === 'facebook' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Facebook Post Title</label>
                  <input
                    type="text"
                    value={formData.facebookPostTitle}
                    onChange={(e) => handleChange('facebookPostTitle', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    placeholder="Nisa Idrisi Advisory Services"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Facebook Subtitle Snippet</label>
                  <textarea
                    rows={4}
                    value={formData.facebookSubtitleSnippet}
                    onChange={(e) => handleChange('facebookSubtitleSnippet', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-medium transition"
                    placeholder="Statutory compliance advisory, double tax treaties planning, and global fund auditing pipelines."
                  />
                </div>

                {/* Cover Asset Upload Section - Matches design details */}
                <div className="space-y-1.5 p-5 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  <label className="text-[10px] font-black uppercase text-neutral-600 tracking-wider block mb-1">Facebook Shared Image Cover</label>
                  <p className="text-[11px] text-neutral-400 mb-3 leading-tight">Shared imagery landscape wallpaper URL optimized for Facebook timelines</p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={formData.facebookSharedImageCover}
                        onChange={(e) => handleChange('facebookSharedImageCover', e.target.value)}
                        className="w-full pl-10 pr-24 py-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 focus:bg-white focus:border-neutral-500 outline-none text-xs sm:text-sm font-sans tracking-tight transition"
                        placeholder="Paste image URL here..."
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-sans text-sm font-black">
                        🔗
                      </span>
                      {isValidImageUrl(formData.facebookSharedImageCover) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                          VALID IMAGE URL
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2.5">
                      <label className="px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 transition shadow-sm text-xs font-bold cursor-pointer flex items-center gap-1.5 self-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload('facebookSharedImageCover', e.target.files[0]);
                            }
                          }}
                        />
                        {isUploading === 'facebookSharedImageCover' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        Upload Image
                      </label>

                      {formData.facebookSharedImageCover && (
                        <button
                          type="button"
                          onClick={() => handleChange('facebookSharedImageCover', '')}
                          className="px-4.5 py-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {formData.facebookSharedImageCover && (
                    <div className="mt-4 flex gap-4 p-3 bg-white rounded-xl border border-neutral-200">
                      <div className="w-16 h-12 rounded overflow-hidden shadow border border-neutral-100 relative bg-neutral-100">
                        <img 
                          src={formData.facebookSharedImageCover} 
                          alt="Thumbnail Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-black">Live Image Preview</span>
                        <span className="text-xs text-neutral-500 font-sans truncate">{formData.facebookSharedImageCover}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Live Previews Layout) */}
        <div className="lg:col-span-5 space-y-6">
          <SEOPreviewCard activeTab={activeTab} data={formData} />

          {/* Bottom Success Card - Enterprise Schema Info */}
          <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 space-y-3.5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition duration-500">
              <FileCode className="w-24 h-24 text-white" />
            </div>
            
            <div className="flex items-center gap-2.5 text-emerald-400">
              <Sparkles className="w-5 h-5" />
              <h4 className="text-xs font-black tracking-widest uppercase font-sans">
                ENTERPRISE SCHEMA READY
              </h4>
            </div>
            
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Changes made across these tabs will automatically populate local OpenGraph meta header cards, standard search indices, and structural <strong className="text-neutral-200">Schema.org JSON-LD elements</strong> layout in live production builds.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
