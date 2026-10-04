/** Shrinks a picked image in the browser (max side, WebP) before it is uploaded. */
export async function prepareImage(file: File, maxSide = 1600): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.type === 'image/gif') return file; // keep animation
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.85));
  if (!blob) throw new Error('Could not process this image.');
  return blob;
}

const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/)(.+)$/i;

/**
 * Asks Cloudinary for a smaller, modern-format copy of an image or video
 * (automatic format + quality, optional max width). Any other host is returned unchanged.
 */
export function optimizeMedia(url: string, opts: { width?: number; extra?: string } = {}): string {
  const m = CLOUDINARY.exec(url);
  if (!m || /(^|\/)(f_auto|q_auto)/.test(m[3])) return url;
  const parts = [opts.extra, 'f_auto', 'q_auto', opts.width ? `w_${opts.width}` : '', opts.width ? 'c_limit' : ''].filter(Boolean);
  return `${m[1]}${parts.join(',')}/${m[3]}`;
}

/** Width-based srcset (480w / 840w) for a Cloudinary image; empty string for other hosts. */
export function imageSrcSet(url: string, widths: number[] = [480, 840]): string {
  if (!CLOUDINARY.test(url)) return '';
  return widths.map((w) => `${optimizeMedia(url, { width: w })} ${w}w`).join(', ');
}

/** A still frame (JPEG) taken from a Cloudinary video, to show before the visitor presses play. */
export function videoPoster(url: string, width = 1280): string {
  const m = CLOUDINARY.exec(url);
  if (!m || m[2].toLowerCase() !== 'video') return '';
  const frame = `${m[1]}so_0,f_jpg,q_auto,w_${width},c_limit/${m[3]}`;
  return frame.replace(/\.[a-z0-9]{2,4}(\?.*)?$/i, '.jpg$1');
}
