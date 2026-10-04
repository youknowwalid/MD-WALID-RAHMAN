import { useEffect, useState } from 'react';
import { listRows } from './api';
import { normalizeProduct } from './schema-defaults';
import { Product } from '../types';

let cache: Promise<Product[] | null> | null = null;

/** Published products, fetched once and shared by every component. null = backend unavailable. */
export const loadProducts = (): Promise<Product[] | null> => {
  cache ??= listRows('products').then((rows) => (rows ? rows.map(normalizeProduct).filter((p) => p.published) : null));
  return cache;
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    loadProducts().then((p) => { if (live) { setProducts(p || []); setLoading(false); } });
    return () => { live = false; };
  }, []);
  return { products, loading };
}
