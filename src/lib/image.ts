export interface PrepareOptions {
  /** Treat maxSide as a maximum WIDTH (height is free). For tall full-page screenshots. */
  fitWidth?: boolean;
  /** Re-encode at lower quality until the file is no bigger than this many bytes. */
  maxBytes?: number;
}

/** True when a WebP file is an animation (re-encoding it on a canvas would flatten it to one frame). */
async function isAnimatedWebp(file: File): Promise<boolean> {
  const b = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const tag = (o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  return b.length >= 21 && tag(0) === 'RIFF' && tag(8) === 'WEBP' && tag(12) === 'VP8X' && (b[20] & 0x02) !== 0;
}

// Browsers cannot encode WebP larger than 16383 px on a side.
const MAX_ENCODE_SIDE = 16000;

/** Shrinks a picked image in the browser (max side, WebP) before it is uploaded. */
export async function prepareImage(file: File, maxSide = 1600, opts: PrepareOptions = {}): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.type === 'image/gif') return file; // keep animation
  if (file.type === 'image/webp' && (await isAnimatedWebp(file))) return file; // keep animation
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / (opts.fitWidth ? bitmap.width : Math.max(bitmap.width, bitmap.height)));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  if (Math.max(w, h) > MAX_ENCODE_SIDE) {
    bitmap.close?.();
    throw new Error(`This image would be ${h.toLocaleString()} px tall. Please keep it under ${MAX_ENCODE_SIDE.toLocaleString()} px tall (at 1920 px wide), or split it into two images.`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const encode = (q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', q));
  let blob = await encode(0.85);
  if (opts.maxBytes) {
    for (const q of [0.75, 0.65, 0.55]) {
      if (!blob || blob.size <= opts.maxBytes) break;
      blob = await encode(q);
    }
  }
  if (!blob) throw new Error('Could not process this image.');
  return blob;
}
