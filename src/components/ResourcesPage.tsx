import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, LayoutGrid, Search, Eye, Filter, ShieldCheck, HelpCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import ProductModal from './ProductModal';

// Static fallbacks in case Firestore collection is not yet populated
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'design-system-kit',
    title: 'The Ultimate Design System Kit',
    shortTitle: 'Design System Kit',
    description: 'A comprehensive toolkit containing everything you need to kickstart, design, and style premium digital brands with high-performance layouts, UI assets, typography presets, and a consistent modular grid structure. Optimized for modern branding projects.',
    price: '$29.00',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    paddleUrl: '#',
    published: true,
    featured: true,
    order: 1
  },
  {
    id: 'brand-playbook',
    title: 'Master Brand Identity Playbook',
    shortTitle: 'Brand Identity Playbook',
    description: 'An editorial-quality PDF guide outlining the step-by-step branding strategy, positioning frameworks, style rules, client collaboration systems, and dynamic launch workflows used for building premium digital presences.',
    price: '$19.00',
    thumbnail: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=800&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=1200&auto=format&fit=crop&q=80',
    paddleUrl: '#',
    published: true,
    featured: true,
    order: 2
  },
  {
    id: 'minimal-portfolio-figma',
    title: 'Premium Minimal Portfolio Template',
    shortTitle: 'Minimal Portfolio Template',
    description: 'A pristine interactive portfolio design template configured with highly organized Figma variables, responsive spacing scales, custom layout grids, and visual style directions. Ideal for developers and designers.',
    price: '$15.00',
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&auto=format&fit=crop&q=80',
    paddleUrl: '#',
    published: true,
    featured: true,
    order: 3
  }
];

export default function ResourcesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Listen to firestore products in real-time
    const q = query(
      collection(db, 'products'),
      where('published', '==', true),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbProducts: Product[] = [];
      snapshot.forEach((doc) => {
        dbProducts.push({ ...doc.data(), id: doc.id } as Product);
      });
      
      // If none found in DB, use our premium defaults as starting point
      if (dbProducts.length === 0) {
        setProducts(DEFAULT_PRODUCTS);
      } else {
        setProducts(dbProducts);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore products fetch failed or empty (falling back to default resources):", error);
      setProducts(DEFAULT_PRODUCTS);
      setLoading(false);
    });

    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, []);

  // Filter based on search query
  const filteredProducts = products.filter(product => {
    const titleMatch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const shortTitleMatch = product.shortTitle && product.shortTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || descMatch || shortTitleMatch;
  });

  return (
    <div className="min-h-screen bg-bg-dark text-white relative z-10 font-sans transition-colors duration-300">
      
      {/* Top Navbar */}
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
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <a 
              href="/#resources" 
              className="text-xs font-semibold uppercase tracking-widest text-neutral-400 hover:text-[#f45901] transition-colors flex items-center gap-2 w-fit"
            >
              <span>← Back to Portfolio</span>
            </a>
          </motion.div>
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
              <span className="absolute inset-y-0 left-4 flex items-center text-neutral-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="resources-search-input"
                type="text"
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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-neutral-950/30 rounded-3xl border border-white/5 p-8">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-4 text-neutral-500">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No products found</h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
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
                <motion.div
                  key={product.id}
                  id={`resource-grid-item-${product.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-neutral-950 rounded-3xl border border-white/5 hover:border-white/10 overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xl transition-all"
                  onClick={() => setActiveProduct(product)}
                >
                  <div className="aspect-[4/3] w-full bg-neutral-900 overflow-hidden relative">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
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
                      <h3 className="text-lg md:text-xl font-sans font-black tracking-tight text-white mb-3 group-hover:text-[#f45901] transition-colors duration-300 leading-tight">
                        {product.title}
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm line-clamp-3 leading-relaxed mb-6">
                        {product.description}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#f45901]" /> Secure Delivery
                      </span>
                      <span className="text-xs font-bold text-[#f45901] flex items-center gap-1 group-hover:underline">
                        Invest Now →
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom FAQ Banner (Premium Touch to complete page scope) */}
            <div className="mt-24 border-t border-white/10 pt-16 grid md:grid-cols-3 gap-8 text-neutral-400">
              <div className="bg-neutral-950/20 p-6 rounded-2xl border border-white/5">
                <HelpCircle className="w-6 h-6 text-[#f45901] mb-3" />
                <h4 className="text-sm font-bold text-white mb-2">How do I access/receive files?</h4>
                <p className="text-xs leading-relaxed">
                  Upon purchase completion, Paddle will securely process the payment and instantly direct you to high-quality PDF downloads. Backups are also emailed immediately to your inbox.
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
