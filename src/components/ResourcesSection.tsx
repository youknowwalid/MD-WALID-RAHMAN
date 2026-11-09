import React, { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Eye, Sparkles } from 'lucide-react';
import { useProducts } from '../lib/products';
import { Product } from '../types';
import ProductModal from './ProductModal';

export default function ResourcesSection() {
  const { products, loading } = useProducts();
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  if (loading || products.length === 0) {
    return null; // Nothing is shown on the homepage until a product is published
  }

  return (
    <section id="resources" className="bg-[linear-gradient(180deg,#ffffff,#eef4fb)] px-6 py-20 md:py-[120px]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 md:mb-[70px]">
          <m.span
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="inline-flex items-center gap-2.5 rounded-full border border-border-subtle bg-white px-4 py-2 text-[13px] font-medium text-text-main"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Premium Resources
          </m.span>
          <m.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.07, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-5 text-[2.3rem] font-medium leading-[1.04] tracking-[-0.045em] text-text-main md:text-6xl"
          >
            Curated Digital Products
          </m.h2>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          {products.map((product, i) => (
            <m.article
              key={product.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: Math.min(i * 0.1, 0.2), ease: [0.2, 0.8, 0.2, 1] }}
              className="home-prod grid grid-cols-1 gap-8 rounded-[44px] border border-border-subtle bg-white p-9 transition-[transform,box-shadow] duration-500 hover:-translate-y-2 hover:shadow-[0_44px_70px_-40px_rgba(13,17,23,0.4)] sm:grid-cols-[150px_1fr] md:p-11"
            >
              <div className="home-book relative h-[210px] w-[150px] shrink-0 overflow-hidden rounded-[6px_16px_16px_6px] bg-bg-card shadow-[12px_18px_30px_-10px_rgba(10,30,60,0.5)]">
                <img
                  src={product.thumbnail}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <h3 className="text-[26px] font-semibold leading-[1.14] tracking-[-0.03em] text-text-main">
                  {product.shortTitle || product.title}
                </h3>
                <p className="mt-3 line-clamp-4 flex-grow text-[16px] leading-relaxed text-text-muted">
                  {product.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-5">
                  <span className="text-[28px] font-semibold tracking-[-0.03em] text-text-main">{product.price}</span>
                  <button
                    type="button"
                    onClick={() => setActiveProduct(product)}
                    className="home-btn home-mag bg-[#0d1117] px-6 py-3.5 text-[15px] text-white"
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

        <div className="mt-14 flex justify-center">
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
