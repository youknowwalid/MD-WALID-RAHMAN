import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Resource } from '../types';

interface ResourcesSliderProps {
  resources: Resource[];
  onOpenModal?: (resource: Resource) => void;
}

export default function ResourcesSlider({ resources, onOpenModal }: ResourcesSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Filter only published resources and sort by order
  const publishedResources = resources
    .filter(r => r.published !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const checkScrollButtons = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScrollButtons);
      return () => slider.removeEventListener('scroll', checkScrollButtons);
    }
  }, [publishedResources]);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 320;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Touch/Mouse drag support
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (publishedResources.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-bg-card/90 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-text-main hover:bg-accent hover:text-white hover:border-accent transition-all shadow-xl -ml-4 md:-ml-6"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-bg-card/90 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-text-main hover:bg-accent hover:text-white hover:border-accent transition-all shadow-xl -mr-4 md:-mr-6"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slider Container */}
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex gap-6 overflow-x-auto hide-scrollbar py-4 px-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {publishedResources.map((resource, i) => (
          <motion.div
            key={resource.id || i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            onClick={() => !isDragging && onOpenModal?.(resource)}
            className="flex-shrink-0 w-[280px] md:w-[320px] group cursor-pointer"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/5 group-hover:border-accent/40 transition-all mb-4">
              <img
                src={resource.thumbnail}
                alt={resource.shortTitle || resource.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Price Badge */}
              <div className="absolute top-4 right-4 bg-accent text-white text-sm font-black px-3 py-1.5 rounded-lg shadow-lg">
                {resource.price}
              </div>
            </div>
            <h4 className="text-lg font-bold text-text-main group-hover:text-accent transition-colors line-clamp-2">
              {resource.shortTitle || resource.title}
            </h4>
          </motion.div>
        ))}
      </div>

      {/* See All Button */}
      <div className="mt-10 text-center">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-accent font-bold hover:underline underline-offset-4 group"
        >
          See All Resources
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
