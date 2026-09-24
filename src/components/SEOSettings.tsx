import React, { useState, useEffect } from 'react';
import { Save, Loader2, Globe, Image as ImageIcon, Upload } from 'lucide-react';
import { getDocument, setDocument, handleDatabaseError, OperationType } from '../services/supabase';

const SeoImageUpload = ({ label, value, onChange, recommendation }: { label: string; value: string; onChange: (val: string) => void; recommendation?: string; }) => {
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
          let width = img.width; let height = img.height;
          const MAX_SIZE = 1200;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          onChange(canvas.toDataURL('image/jpeg', 0.8));
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) { setIsUploading(false); }
  };
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400">{label}</label>
      <div className="flex gap-4 items-start">
        <div className="relative group shrink-0">
          {value ? (
            <img src={value} alt="Preview" className="w-32 h-20 object-cover rounded-xl border border-white/10" />
          ) : (
            <div className="w-32 h-20 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-600" /></div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
            <Upload className="w-5 h-5 text-white" />
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste an image URL..." className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-accent outline-none text-white transition-all" />
            {value && <button type="button" onClick={() => onChange('')} className="px-3 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/15">Clear</button>}
          </div>
          {recommendation && <p className="text-xs text-accent italic">{recommendation}</p>}
          {isUploading && <div className="flex items-center gap-2 text-xs text-accent"><Loader2 className="w-3 h-3 animate-spin" /> Processing image...</div>}
        </div>
      </div>
    </div>
  );
};

export function SEOSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultTitle, setDefaultTitle] = useState('');
  const [titleTemplate, setTitleTemplate] = useState('');
  const [defaultDescription, setDefaultDescription] = useState('');
  const [siteName, setSiteName] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const docSnap = await getDocument('siteConfig', 'seo');
        if (docSnap) {
          const data = docSnap.data || docSnap;
          setDefaultTitle(data.defaultTitle || '');
          setTitleTemplate(data.titleTemplate || '');
          setDefaultDescription(data.defaultDescription || '');
          setSiteName(data.siteName || '');
          setTwitterHandle(data.twitterHandle || '');
          setOgImage(data.ogImage || '');
          setKeywords(data.keywords || '');
        }
      } catch (error) {
        handleDatabaseError(error, OperationType.GET, 'siteConfig/seo');
      } finally {
        setLoading(false);
      }
    };
    fetchSEO();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        defaultTitle,
        titleTemplate,
        defaultDescription,
        siteName,
        twitterHandle,
        ogImage,
        keywords,
        updatedAt: new Date().toISOString()
      };
      await setDocument('siteConfig', 'seo', payload);
      alert('SEO Settings successfully updated!');
    } catch (error) {
      handleDatabaseError(error, OperationType.UPDATE, 'siteConfig/seo');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-bg-card p-6 rounded-2xl border border-white/5 w-full">
        <div>
          <h2 className="text-3xl font-black text-text-main">SEO Management</h2>
          <p className="text-gray-400 text-sm mt-1">Control how your site appears on Google and social media.</p>
        </div>
        <button type="submit" disabled={isSaving} className="bg-accent text-white font-black px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="max-w-4xl space-y-10">
        <div className="bg-bg-card p-10 rounded-3xl border border-white/5 space-y-8">
          <h3 className="text-2xl font-black flex items-center gap-3"><Globe className="text-accent w-6 h-6" /> Global Meta Tags</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Default Site Title</label>
              <input type="text" value={defaultTitle} onChange={(e) => setDefaultTitle(e.target.value)} placeholder="e.g. Walid Rahman | Brand Developer" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Title Template (Optional)</label>
              <input type="text" value={titleTemplate} onChange={(e) => setTitleTemplate(e.target.value)} placeholder="e.g. %s | Walid Rahman" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none transition-colors" />
              <p className="text-xs text-gray-500 mt-2">Used for sub-pages. The <span className="text-accent">%s</span> will be replaced by the specific page name.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Default Meta Description</label>
              <textarea value={defaultDescription} onChange={(e) => setDefaultDescription(e.target.value)} rows={3} placeholder="A brief description of your portfolio for search engine results..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none resize-y transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Keywords (Comma Separated)</label>
              <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} rows={2} placeholder="brand developer, web design, digital marketing, dhaka..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none resize-y transition-colors" />
            </div>
          </div>
        </div>

        <div className="bg-bg-card p-10 rounded-3xl border border-white/5 space-y-8">
          <h3 className="text-2xl font-black flex items-center gap-3"><ImageIcon className="text-accent w-6 h-6" /> Social Media Sharing</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Site Name</label>
                <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. Walid Rahman Portfolio" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Twitter Handle</label>
                <input type="text" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} placeholder="e.g. @yourhandle" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none transition-colors" />
              </div>
            </div>
            <div className="pt-6 border-t border-white/5">
              <SeoImageUpload label="Default Social Share Image (og:image)" value={ogImage} onChange={setOgImage} recommendation="Recommended size: 1200 x 630 pixels." />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
