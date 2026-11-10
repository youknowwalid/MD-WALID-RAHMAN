import React, { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { DEFAULT_SECTION_TITLES } from '../lib/defaults';
import { useProducts } from '../lib/products';
import { Product } from '../types';
import ProductModal from './ProductModal';

/** Product text may carry list/markdown marks; the card shows it as plain prose. */
const plain = (text: string) => String(text || '').replace(/[#*_`>]/g, '').replace(/\s*\n\s*/g, ' ').replace(/(^|\s)[-•]\s+/g, '$1').trim();

export default function ResourcesSection() {
  const { products, loading } = useProducts();
  const { config } = useSiteConfig();
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  if (loading || products.length === 0) {
    return null; // Nothing is shown on the homepage until a product is published
  }

  return (
    <section id="resources" className="bg-[linear-gradient(180deg,#ffffff,#eef4fb)] px-6 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        <m.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-8 text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] text-text-main md:text-[2.6rem]"
        >
          {(config.sectionTitles?.resources || '').trim() || DEFAULT_SECTION_TITLES.resources}
        </m.h2>

        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-7 lg:overflow-visible lg:px-0 lg:pb-0">
          {products.map((product, i) => (
            <m.article
              key={product.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: Math.min(i * 0.1, 0.2), ease: [0.2, 0.8, 0.2, 1] }}
              className="home-prod grid w-[88%] shrink-0 snap-center grid-cols-[96px_1fr] gap-4 rounded-[28px] border border-border-subtle bg-white p-4 transition-[transform,box-shadow] duration-500 hover:-translate-y-2 hover:shadow-[0_44px_70px_-40px_rgba(13,17,23,0.4)] sm:w-[78%] sm:grid-cols-[150px_1fr] sm:gap-8 sm:rounded-[44px] sm:p-9 md:p-11 lg:w-auto"
            >
              <div className="home-book relative h-[134px] w-[96px] shrink-0 sm:h-[210px] sm:w-[150px] overflow-hidden rounded-[6px_16px_16px_6px] bg-bg-card shadow-[12px_18px_30px_-10px_rgba(10,30,60,0.5)]">
                <img
                  src={product.thumbnail}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <h3 className="text-[19px] font-semibold leading-[1.14] sm:text-[26px] tracking-[-0.03em] text-text-main">
                  {product.shortTitle || product.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-grow text-[14px] leading-snug text-text-muted sm:mt-3 sm:line-clamp-4 sm:text-[16px] sm:leading-relaxed">
                  {plain(product.description)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-6 sm:gap-5">
                  <span className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.03em] text-text-main">{product.price}</span>
                  <button
                    type="button"
                    onClick={() => setActiveProduct(product)}
                    className="home-btn home-mag bg-[#0d1117] px-5 py-3 text-[15px] text-white sm:px-6 sm:py-3.5"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Quick View
                    <span className="sr-only">: {product.shortTitle || product.title}</span>
                  </button>
                </div>
              </div>
            </m.article>
          ))}
        </div>

        <div className="mt-6 flex justify-center md:mt-14">
          <Link
            id="resources-see-all-btn"
            to="/resources"
            className="home-btn home-mag border border-[#0d1117]/15 px-8 py-4 text-[16px] text-text-main hover:bg-[#0d1117] hover:text-white"
          >
            See All Digital Products
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {activeProduct && (
          <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
