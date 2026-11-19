import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { m } from 'motion/react';
import { cn } from '../lib/utils';
import { X, CheckCircle, Shield, ChevronDown, ZoomIn } from 'lucide-react';
import { Product } from '../types';
import { safeUrl } from '../lib/text';
import { Link } from 'react-router-dom';
import { editionOf } from '../lib/payments';
import { RichText } from './RichText';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [zoomed, setZoomed] = useState(false);
  const [zoomFull, setZoomFull] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Escape closes the zoomed picture first, then the popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (zoomed) { setZoomed(false); setZoomFull(false); } else onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomed]);

  // "english" / "bangla" in the checkout field opens our own bKash / Nagad checkout page; a normal link keeps working as before.
  const edition = editionOf(product.paddleUrl);
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
      if (zoomed) return;
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleSliderKeys);
    return () => window.removeEventListener('keydown', handleSliderKeys);
  }, [images.length, zoomed]);

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
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
  };

  const buyCls = 'group flex min-h-14 flex-1 items-center justify-center gap-3 w-full bg-accent hover:opacity-90 text-black font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all md:hover:-translate-y-0.5';

  // Drawn straight into <body>: inside the page sections the popup was trapped beneath the navbar and the contact block.
  return createPortal(
    <div className="font-tight [--color-accent:#c3ed3a] [--accent-gradient:none] fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-0 md:items-center md:p-10" role="dialog" aria-modal="true" aria-label={product.title}>
      {/* Backdrop with Blur */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
      />

      {/* Modal Main Content Container: a full-height sheet on phones, a two-column card on desktop */}
      <m.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        id={`product-modal-card-${product.id}`}
        className="relative z-[101] flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-neutral-950 text-white md:h-[85vh] md:flex-row md:rounded-3xl md:border md:border-white/10"
      >
        {/* Close Button */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-neutral-900 border border-white/15 flex items-center justify-center transition-all hover:text-accent"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* The product itself: about 70% of the phone screen */}
        <div className="relative flex min-h-[28dvh] flex-1 flex-col bg-black md:w-3/5 md:flex-none md:border-r md:border-white/5">
          <div
            className="group relative flex-1 min-h-0 select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label="Zoom in on this picture"
              className="absolute inset-0 flex items-center justify-center p-3 pt-14 md:p-6"
            >
              <m.img
                key={activeIndex}
                src={images[activeIndex]}
                alt={`${product.title} - Preview ${activeIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
                draggable={false}
              />
            </button>

            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white/90">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              Tap to zoom
            </span>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 border border-white/10 hover:bg-accent hover:text-black text-white flex items-center justify-center transition-all"
                  aria-label="Previous Image"
                >
                  <span className="text-xl font-bold">‹</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 border border-white/10 hover:bg-accent hover:text-black text-white flex items-center justify-center transition-all"
                  aria-label="Next Image"
                >
                  <span className="text-xl font-bold">›</span>
                </button>
                <span className="pointer-events-none absolute top-4 left-4 rounded-md bg-black/75 border border-white/10 px-2 py-0.5 text-xs tabular-nums text-gray-300">
                  {activeIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {/* Dots on phones, thumbnails on larger screens */}
          {images.length > 1 && (
            <>
              <div className="flex justify-center gap-1 pb-2 md:hidden" role="group" aria-label="Choose a picture">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Show image ${idx + 1} of ${images.length}`}
                    aria-current={idx === activeIndex}
                    className="flex h-6 w-6 items-center justify-center"
                  >
                    <span className={cn('h-2 rounded-full transition-all', idx === activeIndex ? 'w-5 bg-accent' : 'w-2 bg-white/30')} />
                  </button>
                ))}
              </div>
              <div className="hidden h-[84px] shrink-0 items-center justify-center gap-2 overflow-x-auto border-t border-white/5 bg-[#050505] p-3 md:flex no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Show image ${idx + 1} of ${images.length}`}
                    aria-current={idx === activeIndex}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                      idx === activeIndex ? 'border-accent' : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" aria-hidden="true" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Title, price and the buy button */}
        <div className="flex max-h-[60dvh] min-h-0 flex-none flex-col md:max-h-none md:w-2/5">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 md:p-10 md:pb-6">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-xs font-bold text-accent uppercase tracking-widest px-2.5 py-1 bg-accent/10 rounded border border-accent/20">
                Digital Resource
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-300">
                <Shield className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                Secure file · Instant access
              </span>
            </div>

            <h2 className="mb-3 text-xl font-semibold leading-tight tracking-tight text-white md:mb-5 md:text-3xl">
              {product.title}
            </h2>

            <div className="mb-5 hidden w-fit items-baseline gap-2 rounded-xl border border-white/5 bg-neutral-900/40 p-3 md:flex">
              <span className="text-xs font-medium text-neutral-400">PRICE:</span>
              <span className="text-2xl font-semibold text-accent tabular-nums">{product.price}</span>
            </div>

            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              aria-expanded={detailsOpen}
              aria-controls={`product-details-${product.id}`}
              className="mb-3 flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 px-4 text-sm font-semibold text-white md:hidden"
            >
              Details
              <ChevronDown className={cn('h-4 w-4 transition-transform', detailsOpen && 'rotate-180')} aria-hidden="true" />
            </button>

            <div id={`product-details-${product.id}`} className={cn(detailsOpen ? 'block' : 'hidden', 'pb-2 md:block')}>
              <h3 className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-neutral-400 md:block">Overview & Value</h3>
              <RichText text={product.description} className="mb-5 text-sm leading-relaxed text-neutral-300" />
              <div className="space-y-2 rounded-xl border border-white/5 bg-neutral-900/20 p-4">
                <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Format: Secured High-Quality PDF File</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Pay with bKash or Nagad (Send Money)</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Download starts on the confirmation page as soon as your payment is verified; the link is also emailed to you</span>
                </div>
              </div>
            </div>
          </div>

          {/* Always visible: price and Buy Now */}
          <div className="shrink-0 border-t border-white/10 bg-neutral-950 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:border-0 md:px-10 md:pb-10 md:pt-2">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-semibold text-accent tabular-nums md:hidden">{product.price}</span>
              {edition ? (
                <Link id={`buy-now-btn-${product.id}`} to={`/checkout/${edition}`} className={buyCls}>
                  Buy Now
                </Link>
              ) : checkoutHref ? (
                <a id={`buy-now-btn-${product.id}`} href={checkoutHref} target="_blank" rel="noopener noreferrer" className={buyCls}>
                  Buy Now
                </a>
              ) : (
                <p className="flex-1 rounded-2xl border border-white/10 px-6 py-4 text-center text-sm text-neutral-300">Checkout link coming soon.</p>
              )}
            </div>
            <p className="mt-3 hidden text-center text-xs uppercase leading-relaxed tracking-widest text-neutral-400 md:block">
              bKash • Nagad • Verified in minutes
            </p>
          </div>
        </div>
      </m.div>

      {/* Full-screen zoom: tap the picture again to see it at full size and pan around */}
      {zoomed && (
        <div className="fixed inset-0 z-[110] bg-black" role="dialog" aria-modal="true" aria-label="Zoomed preview">
          <button
            type="button"
            onClick={() => { setZoomed(false); setZoomFull(false); }}
            className="fixed top-3 right-3 z-[111] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white"
            aria-label="Close zoom"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="h-full w-full overflow-auto">
            <button
              type="button"
              onClick={() => setZoomFull((v) => !v)}
              aria-label={zoomFull ? 'Fit the picture to the screen' : 'Show the picture at full size'}
              className={cn('block', zoomFull ? 'w-[260%] md:w-[170%]' : 'flex h-full w-full items-center justify-center')}
            >
              <img
                src={images[activeIndex]}
                alt={`${product.title} - Preview ${activeIndex + 1}, enlarged`}
                className={zoomFull ? 'h-auto w-full' : 'max-h-full max-w-full object-contain'}
                referrerPolicy="no-referrer"
                draggable={false}
              />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
