import type { SlotId } from './careerTimeline';

/**
 * PLACEHOLDER pictures for the career timeline, cut from the approved design mockup so the section can be
 * reviewed before the real photographs exist. Each one is used only where the admin has not uploaded its own:
 *   - the portrait, signature, skyline and map: Admin > Settings > "Career timeline"
 *   - a collage: Admin > Resume > the entry's "Collage picture"
 * The people in these pictures are illustrations, not real colleagues. Once everything is uploaded, delete this
 * file, the folder /public/career-demo and the `DEMO` fallbacks in components/CareerTimeline.tsx.
 */
export const DEMO = {
  portrait: '/career-demo/portrait.webp',
  signature: '/career-demo/signature.webp',
  skyline: '/career-demo/skyline.webp',
  maps: '/career-demo/maps.webp',
  /** One collage per place in the composition (not per person), so any entry that has no picture still looks finished. */
  collage: {
    u1: '/career-demo/c1.webp',
    d1: '/career-demo/c3.webp',
    u2: '/career-demo/c2.webp',
    d2: '/career-demo/c4.webp',
    d3: '/career-demo/c5.webp',
    u3: '/career-demo/c6.webp',
    u4: '/career-demo/c7.webp',
  } as Record<SlotId, string>,
};
