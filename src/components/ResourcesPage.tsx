import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Resource } from '../types';
import { normalizeResource } from '../lib/schema-defaults';
import { getCollection } from '../services/firebase';
import Navbar from './Navbar';
import Footer from './Footer';

// Product Modal Component
const ProductModal = ({ 
  resource, 
  onClose, 
  onBuyNow 
}: { 
  resource: Resource | null; 
  onClose: () => void;
  onBuyNow: (resource: Resource) => void;
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (resource) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [resource]);

  if (!resource) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-bg-card rounded-3xl border border-white/10 shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-text-main hover:bg-accent hover:text-white transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Image */}
            <div className="relative aspect-square md:aspect-auto md:h-full bg-black/20">
              <img
                src={resource.previewImage || resource.thumbnail}
                alt={resource.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Price Badge */}
              <div className="absolute top-4 left-4 bg-accent text-white text-lg font-black px-4 py-2 rounded-xl shadow-lg">
                {resource.price}
              </div>
            </div>

            {/* Right Side - Details */}
            <div className="p-8 md:p-10 flex flex-col">
              <h2 className="text-2xl md:text-3xl font-black text-text-main mb-4 leading-tight">
                {resource.title}
              </h2>
              
              <p className="text-gray-400 text-base leading-relaxed mb-8 flex-grow">
                {resource.description || 'A premium digital resource to help you achieve your goals.'}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => onBuyNow(resource)}
                className="w-full bg-accent text-white font-black py-4 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now - {resource.price}
              </button>

              {/* Secure checkout note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by Gumroad
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Resources Page Component
export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getCollection('resources');
        if (data) {
          setResources(data.map(normalizeResource));
        }
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleBuyNow = useCallback((resource: Resource) => {
    if (resource.gumroadUrl) {
      // Check if Gumroad script is loaded
      if (typeof (window as any).Gumroad !== 'undefined') {
        // Trigger Gumroad overlay popup
        const gumroadLink = document.createElement('a');
        gumroadLink.className = 'gumroad-button';
        gumroadLink.href = resource.gumroadUrl;
        gumroadLink.dataset.gumroadOverlay = 'true';
        document.body.appendChild(gumroadLink);
        gumroadLink.click();
        document.body.removeChild(gumroadLink);
      } else {
        // Fallback: open in new tab
        window.open(resource.gumroadUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  // Filter and sort published resources
  const publishedResources = resources
    .filter(r => r.published !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-bg-dark text-text-main">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-accent font-bold mb-8 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-accent text-xs font-bold uppercase tracking-widest mb-4 block">
              Resources
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Digital Products
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl">
              Premium digital resources, templates, and guides designed to help you elevate your brand and grow your business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : publishedResources.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {publishedResources.map((resource, i) => (
                <motion.div
                  key={resource.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedResource(resource)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/5 group-hover:border-accent/40 transition-all mb-4">
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <span className="text-white font-bold flex items-center gap-2">
                        View Details <ExternalLink className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-accent text-white text-sm font-black px-3 py-1.5 rounded-lg shadow-lg">
                      {resource.price}
                    </div>

                    {/* Featured Badge */}
                    {resource.featured && (
                      <div className="absolute top-4 left-4 bg-bg-dark/80 backdrop-blur-sm text-accent text-xs font-bold px-3 py-1.5 rounded-lg border border-accent/30">
                        Featured
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-text-main group-hover:text-accent transition-colors mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {resource.description}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Modal */}
      <ProductModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onBuyNow={handleBuyNow}
      />

      <Footer />
    </div>
  );
}
