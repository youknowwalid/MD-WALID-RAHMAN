import React from 'react';
import { SeoConfig } from '../context/SiteConfigContext';
import { Globe, Heart, MessageSquare, Share2, MoreHorizontal, ShieldCheck } from 'lucide-react';

interface SEOPreviewCardProps {
  activeTab: 'global' | 'og' | 'twitter' | 'linkedin' | 'facebook';
  data: SeoConfig;
}

export const SEOPreviewCard: React.FC<SEOPreviewCardProps> = ({ activeTab, data }) => {
  // Helper to fallback to robust placeholders
  const getImageUrl = (url?: string) => {
    if (!url || !url.trim().startsWith('http')) {
      return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40';
    }
    return url;
  };

  const getDomain = (urlStr?: string) => {
    if (!urlStr) return 'walidrahman.com';
    try {
      const url = new URL(urlStr);
      return url.hostname.replace('www.', '');
    } catch {
      return 'walidrahman.com';
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-3">
        <span className="text-[10px] font-sans font-black tracking-widest text-neutral-400 uppercase">
          {activeTab} Feed Snippet Preview
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Preview
        </span>
      </div>

      <div className="min-h-[290px] flex flex-col justify-center">
        {activeTab === 'global' && (
          <div className="space-y-2 p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50">
            {/* Google SearchResult Layout */}
            <div className="text-xs font-mono text-neutral-500 flex items-center gap-1">
              www.google.com &gt; search &gt; results
            </div>
            <div className="text-sm font-sans text-neutral-400 truncate">
              {data.canonicalUrl || 'https://walidrahman.com'}
            </div>
            <h4 className="text-xl font-sans font-semibold text-blue-800 hover:underline cursor-pointer leading-tight">
              {data.metaTitle || 'Md. Walid Rahman Swapnil | Portfolio'}
            </h4>
            <p className="text-sm font-sans text-neutral-600 leading-relaxed max-w-xl">
              {data.metaDescription || 'Brand Developer and Product Designer crafting custom high performance web apps.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.focusKeywords.split(',').slice(0, 4).map((kw, i) => (
                <span key={i} className="text-[10px] font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {kw.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'og' && (
          <div className="p-4 bg-emerald-950/5 rounded-2xl border border-emerald-600/10 space-y-3">
            <div className="bg-emerald-800/10 text-emerald-800 border border-emerald-800/20 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>WhatsApp / Meta OpenGraph Rich Link Snippet</span>
            </div>
            <div className="bg-neutral-900 text-white rounded-xl shadow-lg border border-white/5 overflow-hidden flex max-w-sm">
              <div className="p-3.5 space-y-1.5 flex-1 min-w-0">
                <div className="text-[10px] font-mono text-neutral-400 tracking-wider truncate">
                  {getDomain(data.canonicalUrl)}
                </div>
                <h5 className="text-sm font-sans font-extrabold truncate text-neutral-100">
                  {data.ogTitle || 'Portfolio OpenGraph Identity'}
                </h5>
                <p className="text-xs font-sans text-neutral-300 line-clamp-2">
                  {data.ogDescription || 'High performance branding, products, and full-stack portfolio integrations.'}
                </p>
              </div>
              <div className="w-24 shrink-0 bg-neutral-800 border-l border-white/5 relative">
                <img 
                  src={getImageUrl(data.ogImageUrl)} 
                  alt="OG Image Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'facebook' && (
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden shadow-sm max-w-md mx-auto">
            {/* Replicating facebook post card */}
            <div className="p-4 flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-sans font-black text-sm">
                  {getDomain(data.canonicalUrl).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-sm font-sans font-bold text-neutral-900 flex items-center gap-1">
                    {data.ogSiteName || 'youknowwalid'}
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 rounded">Admin</span>
                  </h5>
                  <p className="text-[10px] font-sans font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-1">
                    Sponsored • <Globe className="w-3 h-3 text-neutral-400" />
                  </p>
                </div>
              </div>
              <button type="button" className="text-neutral-400 hover:text-neutral-700">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated text */}
            <div className="px-4 pb-3">
              <p className="text-xs text-neutral-800 leading-relaxed font-sans line-clamp-2">
                {data.facebookSubtitleSnippet || 'Statutory compliance advisory, double tax treaties planning, and global fund auditing.'}
              </p>
            </div>

            {/* Big shared preview cover */}
            <div className="aspect-video bg-neutral-200 border-y border-neutral-200 relative overflow-hidden">
              <img 
                src={getImageUrl(data.facebookSharedImageCover || data.ogImageUrl)}
                alt="Facebook Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom meta snippet inside postcard */}
            <div className="p-4 bg-neutral-100 border-t border-neutral-200/50">
              <span className="text-[10px] font-sans font-extrabold tracking-widest text-neutral-400 uppercase">
                {getDomain(data.canonicalUrl).toUpperCase()}
              </span>
              <h4 className="text-base font-sans font-black tracking-tight text-neutral-900 mt-1 truncate">
                {data.facebookPostTitle || 'Nisa Idrisi Advisory Services'}
              </h4>
              <p className="text-xs font-sans text-neutral-500 line-clamp-1 mt-1">
                {data.facebookSubtitleSnippet || 'Statutory compliance advisory, double tax treaties planning, and global fund auditing.'}
              </p>
            </div>

            {/* Meta interactions footer */}
            <div className="px-4 py-2 border-t border-neutral-200 flex items-center justify-between text-neutral-500 text-xs font-semibold">
              <span className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-800"><Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> 164 Likes</span>
              <span className="flex items-center gap-1 cursor-pointer hover:text-neutral-800"><MessageSquare className="w-4 h-4" /> 18 Comments</span>
              <span className="flex items-center gap-1 cursor-pointer hover:text-neutral-800"><Share2 className="w-4 h-4" /> Share</span>
            </div>
          </div>
        )}

        {activeTab === 'twitter' && (
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden max-w-md mx-auto">
            {/* Header info */}
            <div className="p-4 flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-sans font-black text-xs">
                  X
                </div>
                <div>
                  <h5 className="text-xs font-sans font-extrabold text-neutral-900">
                    Md. Walid Rahman Swapnil
                  </h5>
                  <p className="text-[10px] font-sans font-medium text-neutral-400">
                    {data.twitterHandle || '@youknowwalid'}
                  </p>
                </div>
              </div>
              <button type="button" className="text-neutral-400"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

            {/* Card preview body */}
            <div className="px-4 pb-3">
              <p className="text-xs font-sans text-neutral-800 leading-relaxed">
                {data.twitterDescription || 'Check out my portfolio for customized brand and full-stack services.'}
              </p>
            </div>

            {/* Real X Post Preview Card Container */}
            <div className="mx-4 mb-4 border border-neutral-200 rounded-xl overflow-hidden hover:bg-neutral-50 transition cursor-pointer">
              <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                <img 
                  src={getImageUrl(data.twitterImageUrl || data.ogImageUrl)}
                  alt="X Preview Banner"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3 font-sans border-t border-neutral-200/50">
                <span className="text-[10px] font-mono text-neutral-400">
                  {getDomain(data.canonicalUrl)}
                </span>
                <h4 className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                  {data.twitterTitle || data.metaTitle}
                </h4>
                <p className="text-[10px] font-sans text-neutral-500 line-clamp-2 mt-0.5">
                  {data.twitterDescription || data.metaDescription}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm max-w-md mx-auto overflow-hidden">
            {/* Top poster profile info */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0077b5] text-white flex items-center justify-center font-sans font-black text-sm">
                  in
                </div>
                <div>
                  <h5 className="text-xs font-sans font-extrabold text-neutral-900">
                    {data.linkedinHeadline || 'Md. Walid Rahman Swapnil'}
                  </h5>
                  <p className="text-[10px] font-sans text-neutral-400">
                    Brand Developer & Fullstack Engineer • Sponsored
                  </p>
                </div>
              </div>
              <button type="button" className="text-neutral-400"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

            {/* Post text */}
            <div className="px-4 pb-3">
              <p className="text-xs text-neutral-800 font-sans leading-relaxed">
                {data.linkedinSnippet || 'A dynamic brand portfolio delivering elite development performance.'}
              </p>
            </div>

            {/* Premium Post Card Preview */}
            <div className="border-t border-neutral-200 bg-neutral-100">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={getImageUrl(data.linkedinImageUrl || data.ogImageUrl)}
                  alt="LinkedIn Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3.5 bg-neutral-100 border-t border-neutral-200/50">
                <h4 className="text-xs font-bold text-neutral-800 truncate uppercase tracking-wider">
                  {data.linkedinHeadline}
                </h4>
                <p className="text-[10px] text-neutral-500 font-sans line-clamp-1 mt-0.5">
                  {data.linkedinSnippet || 'Centralized SaaS CMS identity system.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
