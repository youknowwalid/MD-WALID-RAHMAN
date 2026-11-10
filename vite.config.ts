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
 * and preconnects to the picture host. The app picks the result up from window.__settings, so the first
 * paint already has the real colours/texts (no flash of defaults) and no request waits for the bundle.
 * Nothing is baked in at build time: the data is always the live data.
 */
function earlySettings(): Plugin {
  return {
    name: 'early-settings',
    transformIndexHtml(_html, ctx) {
      const url = pick(process.env.VITE_SUPABASE_URL, publicConfig.supabaseUrl);
      const key = pick(process.env.VITE_SUPABASE_ANON_KEY, publicConfig.supabaseAnonKey);
      if (!url || !key) return;
      // The settings come from /api/content (a copy kept near the visitor; see api/content.js). If that is not
      // available (local development, or it fails), the database is asked directly, as before.
      const js = `(function(){try{var u=${JSON.stringify(url)},k=${JSON.stringify(key)},q='site_settings?select=key,value';` +
        `function direct(){return fetch(u+'/rest/v1/'+q,{headers:{apikey:k,Authorization:'Bearer '+k}})` +
        `.then(function(r){return r.ok?r.json():null}).catch(function(){return null})}` +
        `window.__settings=fetch('/api/content?p='+encodeURIComponent(q))` +
        `.then(function(r){return r.ok&&(r.headers.get('content-type')||'').indexOf('json')>-1?r.json():null})` +
        `.catch(function(){return null}).then(function(rows){return rows||direct()});` +
        // Preload the portrait the home page really shows (hero.heroPortrait, else the built-in animated one) so it does not
        // wait for the JavaScript. A returning visitor's saved settings decide at once; a first-time visitor gets the
        // built-in portrait started now and the custom one (if the owner set one) as soon as the settings arrive.
        `function pre(h,motion){var l=document.createElement('link');l.rel='preload';l.as='image';l.href=h;l.setAttribute('fetchpriority','high');` +
        `if(motion)l.media='(prefers-reduced-motion: no-preference)';document.head.appendChild(l);}` +
        `var DEF='/walid-hero-animated-v2.webp',home=location.pathname==='/',done='';` +
        `try{var c=JSON.parse(localStorage.getItem('site_settings_cache_v2')||'null');if(home){var cp=c&&c.hero&&c.hero.heroPortrait;` +
        `if(typeof cp==='string'&&/^https?:\\/\\//i.test(cp)){done=cp;pre(cp,false)}else{done=DEF;pre(DEF,true)}}}catch(e){}` +
        `window.__settings.then(function(rows){if(!rows||!home)return;for(var i=0;i<rows.length;i++){if(rows[i].key==='hero'){` +
        `var h=rows[i].value&&rows[i].value.heroPortrait;if(typeof h==='string'&&/^https?:\\/\\//i.test(h)&&h.trim()!==done){pre(h.trim(),false)}}}});` +
        `}catch(e){}})();`;
      const fonts = Object.keys(ctx.bundle || {}).filter((f) => /poppins-latin-(400|600|700)-normal.*\.woff2$/.test(f));
      const fontJs = fonts.length
        ? `if(location.pathname!=='/'){${JSON.stringify(fonts)}.forEach(function(f){var l=document.createElement('link');l.rel='preload';l.as='font';l.type='font/woff2';l.crossOrigin='anonymous';l.href='/'+f;document.head.appendChild(l)})}`
        : '';
      return [
        ...(fontJs ? [{ tag: 'script', children: fontJs, injectTo: 'head-prepend' as const }] : []),
        // Pictures come from Cloudinary: open that connection while the page is still loading.
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://res.cloudinary.com' }, injectTo: 'head-prepend' },
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
