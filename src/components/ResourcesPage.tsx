import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Sparkles, LayoutGrid, Search, Eye, Filter, ShieldCheck, HelpCircle } from 'lucide-react';
import { useProducts } from '../lib/products';
import Seo from './Seo';
import { Product } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import ProductModal from './ProductModal';
import Photo from './Photo';

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
    <div className="home-v2 min-h-screen overflow-x-clip bg-bg-dark text-text-main relative z-10 transition-colors duration-300">
      
      <Seo title="Digital Resources" description="Digital products, templates and PDF guides by Walid Rahman." noindex={!loading && products.length === 0} />
      <Navbar />

      <main className="min-h-[100svh] max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32 relative">
        
        {/* Breadcrumb back navigation link */}
        <div className="mb-8">
          <m.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <a 
              href="/#resources" 
              className="text-xs font-semibold uppercase tracking-widest text-text-muted hover:text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] transition-colors flex min-h-11 items-center gap-2 w-fit"
            >
              <span>← Back to Portfolio</span>
            </a>
          </m.div>
        </div>

        {/* Page Title Header block */}
        <div className="border-b border-border-subtle pb-12 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Premium Curations</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-text-main mb-4 leading-tight">
                Modern Digital <br className="hidden md:inline" />Resources & PDF Guides
              </h1>
              <p className="text-sm md:text-base text-text-muted max-w-2xl leading-relaxed">
                Elevate your productivity and design strategy. Invest in high-performance assets, brand identities guides, and structured PDF blueprints built by Md. Walid Rahman.
              </p>
            </div>
            
            {/* Search inputs */}
            <div className="relative w-full lg:max-w-sm">
              <span className="absolute inset-y-0 left-4 flex items-center text-text-muted">
                <Search className="w-4 h-4" aria-hidden="true" />
              </span>
              <input
                id="resources-search-input"
                type="search"
                aria-label="Search products"
                placeholder="Search products or guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-bg-card hover:bg-white border border-border-subtle focus:border-accent transition-all outline-none text-base md:text-sm text-text-main placeholder-[#5b6270] font-medium"
              />
            </div>
          </div>
        </div>

        {/* Main Content View List */}
        {loading ? (
          // Placeholder cards the size of the real ones, so the page does not jump when the products arrive.
          <div role="status" aria-label="Loading resources" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1].map((i) => (
              <div key={i} aria-hidden="true" className="min-h-[470px] animate-pulse rounded-3xl border border-border-subtle bg-bg-card motion-reduce:animate-none" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-bg-card rounded-3xl border border-border-subtle p-8">
            <h2 className="text-lg font-bold text-text-main mb-2">New resources are on their way</h2>
            <p className="text-sm text-text-muted max-w-md mx-auto">Nothing is published here yet. Please check back soon.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-bg-card rounded-3xl border border-border-subtle p-8">
            <div className="w-12 h-12 rounded-full border border-border-subtle flex items-center justify-center mx-auto mb-4 text-text-muted">
              <Filter className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-text-main mb-2">No products found</h2>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              We couldn't find any digital resources matching "{searchQuery}". Try revising your search details or clear filter terms.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 inline-flex min-h-11 items-center text-xs text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] font-bold uppercase tracking-wider underline hover:opacity-85"
            >
              Clear Search Query
            </button>
          </div>
        ) : (
          <div>
            {/* Grid Layout of products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product, index) => (
                <m.div
                  key={product.id}
                  id={`resource-grid-item-${product.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-bg-card rounded-3xl border border-border-subtle hover:border-[#0d1117]/20 overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xl transition-all"
                  onClick={() => setActiveProduct(product)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${product.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveProduct(product); } }}
                >
                  <div className="aspect-[4/3] w-full bg-bg-card overflow-hidden relative">
                    <Photo
                      src={product.thumbnail}
                      widths={[384, 640, 828]}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      alt=""
                      loading={index < 2 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : undefined}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Shadow & Hover Action Indicators */}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/20 to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-accent text-[#0d1117] font-semibold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-2xl">
                        <Eye className="w-4 h-4" />
                        View Resources
                      </span>
                    </div>

                    {/* Price tag in modern style */}
                    <div className="absolute top-4 right-4 bg-bg-card backdrop-blur border border-border-subtle px-3 py-1 rounded-full text-xs font-bold text-[color-mix(in_srgb,var(--color-accent)_55%,#000)]">
                      {product.price}
                    </div>
                  </div>

                  {/* Info details blocks */}
                  <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold tracking-tight text-text-main mb-3 group-hover:text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] transition-colors duration-300 leading-tight">
                        {product.title}
                      </h2>
                      <p className="text-gray-400 text-xs md:text-sm line-clamp-3 leading-relaxed mb-6">
                        {product.description}
                      </p>
                    </div>

                    <div className="border-t border-border-subtle pt-4 flex items-center justify-between">
                      <span className="text-xs text-text-muted uppercase font-semibold tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[color-mix(in_srgb,var(--color-accent)_55%,#000)]" /> Secure Delivery
                      </span>
                      <span className="text-xs font-bold text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] flex items-center gap-1 group-hover:underline">
                        Invest Now →
                      </span>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>

            {/* Bottom FAQ Banner (Premium Touch to complete page scope) */}
            <div className="mt-24 border-t border-border-subtle pt-16 grid md:grid-cols-3 gap-8 text-text-muted">
              <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
                <HelpCircle className="w-6 h-6 text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] mb-3" />
                <h3 className="text-sm font-bold text-text-main mb-2">How do I access/receive files?</h3>
                <p className="text-xs leading-relaxed">
                  Pay with bKash or Nagad (Send Money) and enter your transaction ID. Once your payment is verified, usually within a minute, you get a confirmation page with your PDF download button, and the link is emailed to you too. If you ever lose it, write to us and we will resend it.
                </p>
              </div>
              <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
                <LayoutGrid className="w-6 h-6 text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] mb-3" />
                <h3 className="text-sm font-bold text-text-main mb-2">Can these be updated?</h3>
                <p className="text-xs leading-relaxed">
                  Absolutely! All active templates, manuals, or kits are continuously refined. Updated versions are sent to the email you used at checkout as they go live.
                </p>
              </div>
              <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
                <ShieldCheck className="w-6 h-6 text-[color-mix(in_srgb,var(--color-accent)_55%,#000)] mb-3" />
                <h3 className="text-sm font-bold text-text-main mb-2">Secured Payments?</h3>
                <p className="text-xs leading-relaxed">
                  Yes. You pay from your own bKash or Nagad app using their PIN-protected Send Money, so we never see your PIN or card details. The file is only released after your payment is matched.
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
