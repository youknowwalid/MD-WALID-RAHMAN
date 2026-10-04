import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import publicConfig from './public-config.json';
import { imageSrcSet, optimizeMedia } from './src/lib/image';

/**
 * At build time, reads the public site settings once and bakes them into index.html:
 * the first visit then paints the real hero straight away (no wait for the database),
 * and the portrait is preloaded. The live settings are still fetched after load, so
 * edits made in the admin appear without a redeploy. Any failure just skips this.
 */
function seedSettings(): Plugin {
  return {
    name: 'seed-site-settings',
    apply: 'build',
    async transformIndexHtml() {
      const url = (process.env.VITE_SUPABASE_URL ?? publicConfig.supabaseUrl ?? '').trim().replace(/\/+$/, '');
      const key = (process.env.VITE_SUPABASE_ANON_KEY ?? publicConfig.supabaseAnonKey ?? '').trim();
      if (!url || !key) return;
      try {
        const res = await fetch(`${url}/rest/v1/site_settings?select=key,value`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const rows = (await res.json()) as { key: string; value: unknown }[];
        const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        const tags: { tag: string; attrs?: Record<string, string | boolean>; children?: string; injectTo: 'head-prepend' | 'head' }[] = [
          { tag: 'script', children: `window.__SITE_SETTINGS__=${JSON.stringify(settings).replace(/</g, '\\u003c')};`, injectTo: 'head-prepend' },
        ];
        const hero = (settings as any).hero?.heroImage;
        if (typeof hero === 'string' && /^https?:\/\//i.test(hero.trim())) {
          const img = hero.trim();
          const srcset = imageSrcSet(img);
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'preload', as: 'image', href: optimizeMedia(img, { width: 840 }), fetchpriority: 'high',
              ...(srcset ? { imagesrcset: srcset, imagesizes: '(min-width: 768px) 420px, 320px' } : {}),
            },
            injectTo: 'head',
          });
        }
        return tags;
      } catch {
        return;
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seedSettings()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['motion/react'],
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    allowedHosts: true,
  },
});
