import React from 'react';
import { useOptimizedImage } from '../lib/img';

type PhotoProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & {
  src: string;
  /** Widths (px) to offer; each must be one of IMAGE_WIDTHS in src/lib/img.ts. */
  widths: number[];
  /** How wide the picture is on screen, e.g. "(min-width: 768px) 50vw, 100vw". */
  sizes: string;
};

/** An <img> that is served as a smaller, lighter copy from a nearby server, and falls back to the original picture. */
export default function Photo({ src, widths, sizes, ...rest }: PhotoProps) {
  const img = useOptimizedImage(src, widths, sizes);
  return <img {...rest} src={img.src} srcSet={img.srcSet} sizes={img.sizes} onError={img.onError} />;
}
