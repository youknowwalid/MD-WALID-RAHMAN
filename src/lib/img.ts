import { useEffect, useState } from 'react';
import { SUPABASE_URL } from './config';

/**
 * Pictures on the site are stored far away from most visitors, at their original (large) size:
 *  - on Cloudinary, which can resize a picture on the fly when the width is added to its web address, or
 *  - in the database's file storage (uploads made in the admin), which Vercel's image service can resize.
 * Cards, covers and the portrait ask for a copy that is only as wide as they need. If the smaller copy ever
 * fails to load, the original picture is used instead.
 *
 * The Vercel widths below must match "images.sizes" in vercel.json.
 */
export const IMAGE_WIDTHS = [256, 384, 640, 828, 1080, 1600, 1920];

const STORAGE_PREFIX = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/` : '';

// https://res.cloudinary.com/<account>/image/upload/<version>/<file>   (pictures that already carry
// resize settings in their address are left alone, because the part after /upload/ then does not start with v123/)
export const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

const isStorage = (url: string) => Boolean(STORAGE_PREFIX) && url.startsWith(STORAGE_PREFIX) && !/\.(gif|svg)(\?|#|$)/i.test(url);

/** Only pictures from this site's own Cloudinary account or file storage are resized (never GIFs, SVGs or other sites). */
export const canOptimize = (url?: string): url is string =>
  Boolean(import.meta.env.PROD && url && (CLOUDINARY.test(url) || isStorage(url)));

/** The address of a copy of `url` that is at most `width` px wide. */
export const sizedUrl = (url: string, width: number) => {
  const cloud = CLOUDINARY.exec(url);
  // f_auto: newest format the browser understands; q_auto: smallest size that still looks the same; c_limit: never enlarge.
  if (cloud) return `${cloud[1]}f_auto,q_auto,w_${width},c_limit/${cloud[2]}`;
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
};

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
    src: sizedUrl(url, widths[Math.floor(widths.length / 2)]),
    srcSet: widths.map((w) => `${sizedUrl(url, w)} ${w}w`).join(', '),
    sizes,
    onError: () => setFailed(true),
  };
}
