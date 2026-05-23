import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart } from 'lucide-react';
import { Resource } from '../types';

interface ProductModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export default function ProductModal({ resource, onClose }: ProductModalProps) {
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

  const handleBuyNow = useCallback(() => {
    if (!resource?.gumroadUrl) return;

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
            <div className="relative aspect-square md:aspect-auto md:min-h-[400px] bg-black/20">
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
                onClick={handleBuyNow}
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
}
