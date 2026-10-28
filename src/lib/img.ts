import { useEffect, useState } from 'react';
import { SUPABASE_URL } from './config';

/**
 * Pictures uploaded in the admin are stored in the database's file storage (far away from most visitors) at up to
 * 1600 px wide. Vercel's image service can hand out a smaller, lighter copy from a server near the visitor, so
 * cards and covers use that instead. If the lighter copy ever fails to load, the original picture is used.
 *
 * The widths below must match "images.sizes" in vercel.json.
 */
export const IMAGE_WIDTHS = [256, 384, 640, 828, 1080, 1600, 1920];

const STORAGE_PREFIX = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/` : '';

/** Only pictures from this site's own file storage are resized (never animated GIFs, SVGs or other sites' images). */
export const canOptimize = (url?: string): url is string =>
  Boolean(import.meta.env.PROD && STORAGE_PREFIX && url && url.startsWith(STORAGE_PREFIX) && !/\.(gif|svg)(\?|#|$)/i.test(url));

const sized = (url: string, width: number) => `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;

/**
 * Attributes for an <img> that shows `url`. `widths` are the sizes to offer the browser and `sizes` says how wide
 * the picture is on screen, so the browser downloads only as much as it needs.
 */
export function useOptimizedImage(url: string | undefined, widths: number[], sizes: string) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const optimize = canOptimize(url) && !failed;
  if (!optimize || !url) return { src: url, srcSet: undefined, sizes: undefined, onError: undefined };
  return {
    src: sized(url, widths[Math.floor(widths.length / 2)]),
    srcSet: widths.map((w) => `${sized(url, w)} ${w}w`).join(', '),
    sizes,
    onError: () => setFailed(true),
  };
}
