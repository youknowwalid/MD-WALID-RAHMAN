import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { useProducts } from '../lib/products';
import { Product } from '../types';
import ProductModal from './ProductModal';

export default function ResourcesSection() {
  const { products, loading } = useProducts();
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // Carousel scroll ref and state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Touch Swipe state
  const touchStartRef = useRef<number | null>(null);
  const scrollLeftStartRef = useRef<number>(0);

  // Update arrows based on scroll position
  const updateScrollArrows = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 10);
      // Give a little threshold (5px) for accuracy
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollArrows);
      // Also listen on window resize in case viewport changes
      window.addEventListener('resize', updateScrollArrows);
      
      // Delay initial check slightly for layout mounting
      const timer = setTimeout(updateScrollArrows, 300);
      return () => {
        container.removeEventListener('scroll', updateScrollArrows);
        window.removeEventListener('resize', updateScrollArrows);
        clearTimeout(timer);
      };
    }
  }, [products]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (container) {
      touchStartRef.current = e.touches[0].clientX;
      scrollLeftStartRef.current = container.scrollLeft;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null || !scrollContainerRef.current) return;
    const currentX = e.touches[0].clientX;
    const diffX = touchStartRef.current - currentX;
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current + diffX;
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  if (loading || products.length === 0) {
    return null; // Nothing is shown on the homepage until a product is published
  }

  return (
    <section id="resources" className="py-20 md:py-32 bg-bg-dark border-t border-white/5 relative overflow-hidden transition-all duration-300">
      
      {/* Background Ambience */}
      <div 
        className="absolute rounded-full pointer-events-none -z-10 w-[400px] h-[400px] top-1/4 -right-20 opacity-[0.05]" 
        style={{ 
          background: 'radial-gradient(circle, #f45901 0%, transparent 70%)',
          filter: 'blur(100px)' 
        }} 
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* Header Block with navigation controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#f45901] mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Premium Resources</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight text-white leading-tight">
              Curated Digital Products
            </h2>
          </div>
          
          {/* Slider Controls (Hidden if container doesn't overflow) */}
          <div className="flex items-center gap-3 self-end">
            <button
              id="slider-btn-prev"
              onClick={() => handleScroll('left')}
              disabled={!showLeftArrow}
              className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${
                showLeftArrow 
                  ? 'bg-neutral-900/80 text-white hover:border-[#f45901] hover:text-[#f45901]' 
                  : 'bg-neutral-900/20 text-white/30 cursor-not-allowed'
              }`}
              aria-label="Previous Products"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="slider-btn-next"
              onClick={() => handleScroll('right')}
              disabled={!showRightArrow}
              className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${
                showRightArrow 
                  ? 'bg-neutral-900/80 text-white hover:border-[#f45901] hover:text-[#f45901]' 
                  : 'bg-neutral-900/20 text-white/30 cursor-not-allowed'
              }`}
              aria-label="Next Products"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative w-full overflow-hidden">
          
          {/* Scroll Container */}
          <div
            id="resources-slider-container"
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {products.map((product) => (
              <m.div
                key={product.id}
                id={`home-product-card-${product.id}`}
                whileHover={{ y: -6 }}
                className="w-[280px] sm:w-[320px] md:w-[360px] flex-shrink-0 snap-start bg-neutral-950 rounded-2xl border border-white/5 overflow-hidden group cursor-pointer flex flex-col justify-between"
                onClick={() => setActiveProduct(product)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${product.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveProduct(product); } }}
              >
                {/* Image aspect ratio container to prevent layout shift */}
                <div className="aspect-[4/3] w-full bg-neutral-900 overflow-hidden relative">
                  <img
                    src={product.thumbnail}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Accent Glow & Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-60" />
                  
                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="bg-[#f45901] text-black font-semibold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-xl">
                      <Eye className="w-3.5 h-3.5" />
                      Quick View
                    </span>
                  </div>

                  {/* Price Tag Badge */}
                  <div className="absolute top-4 right-4 bg-neutral-950/90 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-[#f45901]">
                    {product.price}
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-[#f45901] transition-colors duration-300 line-clamp-1 mb-2">
                    {product.shortTitle || product.title}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
          
        </div>

        {/* See All Button Under the Carousel */}
        <div className="mt-12 flex justify-center">
          <Link
            id="resources-see-all-btn"
            to="/resources"
            className="group inline-flex items-center gap-2.5 bg-neutral-900 border border-white/10 hover:border-[#f45901] px-8 py-4 rounded-full transition-all text-sm font-semibold text-white hover:text-[#f45901]"
          >
            <span>See All Digital Products</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {activeProduct && (
          <ProductModal 
            product={activeProduct} 
            onClose={() => setActiveProduct(null)} 
          />
        )}
      </AnimatePresence>

    </section>
  );
}
