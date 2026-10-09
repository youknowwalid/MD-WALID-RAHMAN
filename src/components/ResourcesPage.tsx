import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Sparkles, LayoutGrid, Search, Eye, Filter, ShieldCheck, HelpCircle } from 'lucide-react';
import { useProducts } from '../lib/products';
import Seo from './Seo';
import { Product } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import ProductModal from './ProductModal';

export default function ResourcesPage() {
  const { products, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Filter based on search query
  const filteredProducts = products.filter(product => {
    const q = searchQuery.toLowerCase();
    return product.title.toLowerCase().includes(q) || product.description.toLowerCase().includes(q) || (product.shortTitle || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-bg-dark text-text-main relative z-10 font-sans transition-colors duration-300">
      
      <Seo title="Digital Resources" description="Digital products, templates and PDF guides by Walid Rahman." noindex={!loading && products.length === 0} />
      <Navbar />

      {/* Decorative Top Accent Glow */}
      <div 
        className="absolute rounded-full pointer-events-none -z-10 w-[600px] h-[600px] -top-[10%] left-[20%] opacity-10" 
        style={{ 
          background: 'radial-gradient(circle, #f45901 0%, transparent 70%)',
          filter: 'blur(130px)' 
        }} 
      />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32 relative">
        
        {/* Breadcrumb back navigation link */}
        <div className="mb-8">
          <m.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <a 
              href="/#resources" 
              className="text-xs font-semibold uppercase tracking-widest text-neutral-400 hover:text-[#f45901] transition-colors flex items-center gap-2 w-fit"
            >
              <span>← Back to Portfolio</span>
            </a>
          </m.div>
        </div>

        {/* Page Title Header block */}
        <div className="border-b border-white/10 pb-12 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#f45901] mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Premium Curations</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-sans font-black tracking-tight text-white mb-4 leading-tight">
                Modern Digital <br className="hidden md:inline" />Resources & PDF Guides
              </h1>
              <p className="text-sm md:text-base text-neutral-400 max-w-2xl leading-relaxed">
                Elevate your productivity and design strategy. Invest in high-performance assets, brand identities guides, and structured PDF blueprints built by Md. Walid Rahman.
              </p>
            </div>
            
            {/* Search inputs */}
            <div className="relative w-full lg:max-w-sm">
              <span className="absolute inset-y-0 left-4 flex items-center text-neutral-400">
                <Search className="w-4 h-4" aria-hidden="true" />
              </span>
              <input
                id="resources-search-input"
                type="search"
                aria-label="Search products"
                placeholder="Search products or guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-neutral-900/50 hover:bg-neutral-900 border border-white/10 focus:border-[#f45901] transition-all outline-none text-sm text-white placeholder-neutral-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Main Content View List */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-neutral-950/30 rounded-3xl border border-white/5 p-8">
            <h2 className="text-lg font-bold text-white mb-2">New resources are on their way</h2>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">Nothing is published here yet. Please check back soon.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-neutral-950/30 rounded-3xl border border-white/5 p-8">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <Filter className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No products found</h2>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              We couldn't find any digital resources matching "{searchQuery}". Try revising your search details or clear filter terms.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 text-xs text-[#f45901] font-bold uppercase tracking-wider underline hover:opacity-85"
            >
              Clear Search Query
            </button>
          </div>
        ) : (
          <div>
            {/* Grid Layout of products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <m.div
                  key={product.id}
                  id={`resource-grid-item-${product.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-neutral-950 rounded-3xl border border-white/5 hover:border-white/10 overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xl transition-all"
                  onClick={() => setActiveProduct(product)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${product.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveProduct(product); } }}
                >
                  <div className="aspect-[4/3] w-full bg-neutral-900 overflow-hidden relative">
                    <img
                      src={product.thumbnail}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Shadow & Hover Action Indicators */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-[#f45901] text-black font-extrabold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-2xl">
                        <Eye className="w-4 h-4" />
                        View Resources
                      </span>
                    </div>

                    {/* Price tag in modern style */}
                    <div className="absolute top-4 right-4 bg-neutral-950/90 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-[#f45901]">
                      {product.price}
                    </div>
                  </div>

                  {/* Info details blocks */}
                  <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg md:text-xl font-sans font-black tracking-tight text-white mb-3 group-hover:text-[#f45901] transition-colors duration-300 leading-tight">
                        {product.title}
                      </h2>
                      <p className="text-gray-400 text-xs md:text-sm line-clamp-3 leading-relaxed mb-6">
                        {product.description}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#f45901]" /> Secure Delivery
                      </span>
                      <span className="text-xs font-bold text-[#f45901] flex items-center gap-1 group-hover:underline">
                        Invest Now →
                      </span>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>

            {/* Bottom FAQ Banner (Premium Touch to complete page scope) */}
            <div className="mt-24 border-t border-white/10 pt-16 grid md:grid-cols-3 gap-8 text-neutral-400">
              <div className="bg-neutral-950/20 p-6 rounded-2xl border border-white/5">
                <HelpCircle className="w-6 h-6 text-[#f45901] mb-3" />
                <h4 className="text-sm font-bold text-white mb-2">How do I access/receive files?</h4>
                <p className="text-xs leading-relaxed">
                  Upon purchase completion, Paddle will securely process the payment and instantly direct you to a confirmation page with your PDF download button. Paddle also emails you a receipt. If you ever lose your download, contact us with your receipt and we will resend it.
                </p>
              </div>
              <div className="bg-neutral-950/20 p-6 rounded-2xl border border-white/5">
                <LayoutGrid className="w-6 h-6 text-[#f45901] mb-3" />
                <h4 className="text-sm font-bold text-white mb-2">Can these be updated?</h4>
                <p className="text-xs leading-relaxed">
                  Absolutely! All active templates, manuals, or kits are continuously refined. Free lifetime revisions are synced directly to your email via Paddle as they go live.
                </p>
              </div>
              <div className="bg-neutral-950/20 p-6 rounded-2xl border border-white/5">
                <ShieldCheck className="w-6 h-6 text-[#f45901] mb-3" />
                <h4 className="text-sm font-bold text-white mb-2">Secured Payments?</h4>
                <p className="text-xs leading-relaxed">
                  Yes, fully. Checkout processing systems are completely operated through safe 256-bit encrypted Paddle gateways, handling secure transaction safety globally.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Pop-up Product Modal Detail */}
      <AnimatePresence>
        {activeProduct && (
          <ProductModal 
            product={activeProduct} 
            onClose={() => setActiveProduct(null)} 
          />
        )}
      </AnimatePresence>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
