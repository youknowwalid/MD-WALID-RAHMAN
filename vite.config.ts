import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import publicConfig from './public-config.json';

const clean = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\/+$/, '') : '');
// Same rule as src/lib/config.ts: an environment variable that is set (even empty) wins.
const pick = (env: unknown, fallback: unknown) => (typeof env === 'string' ? clean(env) : clean(fallback));

/**
 * Starts the site-settings request from index.html, before the JavaScript has even downloaded,
 * and preconnects to the database. The app picks the result up from window.__settings, so the first
 * paint already has the real colours/texts (no flash of defaults) and no request waits for the bundle.
 * Nothing is baked in at build time: the data is always the live data.
 */
function earlySettings(): Plugin {
  return {
    name: 'early-settings',
    transformIndexHtml() {
      const url = pick(process.env.VITE_SUPABASE_URL, publicConfig.supabaseUrl);
      const key = pick(process.env.VITE_SUPABASE_ANON_KEY, publicConfig.supabaseAnonKey);
      if (!url || !key) return;
      const js = `(function(){try{var u=${JSON.stringify(url)},k=${JSON.stringify(key)};` +
        `window.__settings=fetch(u+'/rest/v1/site_settings?select=key,value',{headers:{apikey:k,Authorization:'Bearer '+k}})` +
        `.then(function(r){return r.ok?r.json():null}).catch(function(){return null});` +
        // Preload the portrait as soon as its address is known (matches the <img>: no-referrer).
        `window.__settings.then(function(rows){if(!rows)return;for(var i=0;i<rows.length;i++){if(rows[i].key==='hero'){` +
        `var h=rows[i].value&&rows[i].value.heroImage;if(typeof h==='string'&&/^https?:\\/\\//i.test(h)){` +
        `var l=document.createElement('link');l.rel='preload';l.as='image';l.href=h.trim();l.referrerPolicy='no-referrer';l.setAttribute('fetchpriority','high');document.head.appendChild(l);}}}});` +
        `}catch(e){}})();`;
      return [
        { tag: 'link', attrs: { rel: 'preconnect', href: url, crossorigin: true }, injectTo: 'head-prepend' },
        { tag: 'script', children: js, injectTo: 'head-prepend' },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), earlySettings()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries change rarely, so they get their own files and stay cached in the visitor's browser across site updates.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    allowedHosts: true,
  },
});
