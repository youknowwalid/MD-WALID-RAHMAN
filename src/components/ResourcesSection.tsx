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
    <section id="resources" className="relative overflow-hidden py-16 md:py-24">

      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* Header Block with navigation controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-border-subtle bg-white px-4 py-2 text-[13px] font-medium text-text-main">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Premium Resources
            </span>
            <h2 className="mt-5 text-[2.3rem] font-medium leading-[1.05] tracking-[-0.045em] text-text-main md:text-6xl">
              Curated Digital Products
            </h2>
          </div>
          
          {/* Slider Controls (Hidden if container doesn't overflow) */}
          <div className="flex items-center gap-3 self-end">
            <button
              id="slider-btn-prev"
              onClick={() => handleScroll('left')}
              disabled={!showLeftArrow}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                showLeftArrow
                  ? 'border-[#0d1117]/15 bg-white text-[#0d1117] hover:-translate-y-0.5 hover:border-[#0d1117]'
                  : 'cursor-not-allowed border-[#0d1117]/10 bg-bg-card text-[#0d1117]/25'
              }`}
              aria-label="Previous Products"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="slider-btn-next"
              onClick={() => handleScroll('right')}
              disabled={!showRightArrow}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                showRightArrow
                  ? 'border-[#0d1117]/15 bg-white text-[#0d1117] hover:-translate-y-0.5 hover:border-[#0d1117]'
                  : 'cursor-not-allowed border-[#0d1117]/10 bg-bg-card text-[#0d1117]/25'
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
                className="group flex w-[280px] flex-shrink-0 cursor-pointer snap-start flex-col justify-between overflow-hidden rounded-[30px] border border-border-subtle bg-white transition-shadow duration-500 hover:shadow-[0_34px_56px_-34px_rgba(13,17,23,0.4)] sm:w-[320px] md:w-[380px]"
                onClick={() => setActiveProduct(product)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${product.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveProduct(product); } }}
              >
                {/* Image aspect ratio container to prevent layout shift */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-card">
                  <img
                    src={product.thumbnail}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Hover action overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#0d1117]/45 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-[#0d1117] shadow-xl">
                      <Eye className="h-3.5 w-3.5" />
                      Quick View
                    </span>
                  </div>

                  {/* Price Tag Badge */}
                  <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0d1117] backdrop-blur">
                    {product.price}
                  </div>
                </div>

                {/* Info Area */}
                <div className="flex flex-grow flex-col justify-between p-6">
                  <h3 className="mb-2 line-clamp-1 text-[19px] font-semibold tracking-[-0.02em] text-text-main">
                    {product.shortTitle || product.title}
                  </h3>
                  <p className="line-clamp-2 text-[15px] leading-relaxed text-text-muted">
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
            className="home-btn home-mag group border border-[#0d1117]/15 px-8 py-4 text-[16px] text-text-main hover:bg-[#0d1117] hover:text-white"
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
