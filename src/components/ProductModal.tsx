import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle, Shield } from 'lucide-react';
import { Product } from '../types';
import { safeUrl } from '../lib/text';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Helper to safely serialize the Paddle Checkout Link
  const checkoutHref = /^https?:/i.test(product.paddleUrl || '') ? safeUrl(product.paddleUrl) : '';
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // Compile valid truthy gallery images
  const images = [
    product.thumbnail,
    product.image && product.image !== product.thumbnail ? product.image : '',
    product.gallery1,
    product.gallery2,
    product.gallery3,
    product.gallery4
  ].filter((img): img is string => typeof img === 'string' && img.trim() !== '');

  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Keyboard controls for image sliders
  useEffect(() => {
    if (images.length <= 1) return;
    const handleSliderKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleSliderKeys);
    return () => window.removeEventListener('keydown', handleSliderKeys);
  }, [images.length]);

  // Mobile swipe states & handlers
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto" role="dialog" aria-modal="true" aria-label={product.title}>
      {/* Backdrop with Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
      />

      {/* Modal Main Content Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        id={`product-modal-card-${product.id}`}
        className="relative w-full max-w-5xl bg-neutral-950 rounded-3xl border border-white/10 shadow-[0_0_50px_var(--color-accent)]/15 z-50 overflow-hidden text-white flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
      >
        
        {/* Close Button */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-neutral-900 border border-white/10 flex items-center justify-center transition-all hover:scale-110 hover:text-accent"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Modern Responsive Image Gallery Slider */}
        <div className="w-full md:w-1/2 bg-neutral-900 border-b md:border-b-0 md:border-r border-white/5 relative flex flex-col max-h-[45vh] md:max-h-none">
          {/* Main Display Port */}
          <div 
            className="relative flex-1 bg-black flex items-center justify-center overflow-hidden group select-none min-h-[180px] md:min-h-[300px]"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Main Image */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.img
                key={activeIndex}
                src={images[activeIndex]}
                alt={`${product.title} - Preview ${activeIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-full max-h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Left/Right Navigation Arrows (Only if more than 1 image) */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/10 hover:bg-accent hover:border-transparent text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-105"
                  aria-label="Previous Image"
                >
                  <span className="text-xl font-bold font-mono">‹</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/10 hover:bg-accent hover:border-transparent text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-105"
                  aria-label="Next Image"
                >
                  <span className="text-xl font-bold font-mono">›</span>
                </button>
              </>
            )}

            {/* Counter Badge */}
            {images.length > 1 && (
              <span className="absolute top-4 left-4 bg-black/75 border border-white/10 text-[10px] font-mono px-2 py-0.5 rounded-md text-gray-300">
                {activeIndex + 1} / {images.length}
              </span>
            )}

            {/* Secure File Badge */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className="bg-black/80 border border-white/10 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-gray-300 flex items-center gap-1.5 backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5 text-accent" />
                Secure Digital File
              </span>
            </div>
          </div>

          {/* Thumbnails strip (Only if more than 1 image) */}
          {images.length > 1 && (
            <div className="bg-[#050505] p-3 flex gap-2 justify-center items-center overflow-x-auto border-t border-white/5 h-[75px] shrink-0 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Show image ${idx + 1} of ${images.length}`}
                  aria-current={idx === activeIndex}
                  className={`relative w-11 h-11 rounded-lg overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                    idx === activeIndex
                      ? 'border-accent scale-105 shadow-[0_0_10px_var(--color-accent)]/30'
                      : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Purchase Trigger */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
          
          <div>
            {/* Tag / Category Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest px-2.5 py-1 bg-accent/10 rounded border border-accent/20">
                Digital Resource
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Instant Access
              </span>
            </div>

            {/* Product Title */}
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight mb-4 text-white hover:text-accent transition-colors leading-tight">
              {product.title}
            </h2>

            {/* Price Box */}
            <div className="flex items-baseline gap-2 mb-6 bg-neutral-900/40 p-3 rounded-xl border border-white/5 w-fit">
              <span className="text-xs text-neutral-400 font-medium">INVESTMENT:</span>
              <span className="text-2xl font-black text-accent font-mono">{product.price}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 w-full mb-6" />

            {/* Description Area */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Overview & Value
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans max-w-md">
                {product.description}
              </p>
            </div>

            {/* Benefits list (Premium aesthetic addition) */}
            <div className="space-y-2 mb-8 bg-neutral-900/20 p-4 rounded-xl border border-white/5">
              <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Format: Secured High-Quality PDF File</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Secured 256-bit SSL Checkout via Paddle</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Instant access sent directly to your email inbox</span>
              </div>
            </div>
          </div>

          {/* Call-to-Action & Terms Footer */}
          <div className="space-y-4">
            
            {/* Paddle Checkout Button */}
            {checkoutHref ? (
              <a
                id={`buy-now-btn-${product.id}`}
                href={checkoutHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 w-full bg-accent hover:opacity-90 text-black font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
              >
                Buy Now
              </a>
            ) : (
              <p className="text-center text-sm text-neutral-300 border border-white/10 rounded-2xl py-4 px-6">Checkout link coming soon.</p>
            )}

            {/* Dynamic Checkout note */}
            <p className="text-[10px] text-center text-neutral-400 uppercase tracking-widest leading-relaxed">
              Processed securely via Paddle • Instant email delivery
            </p>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
