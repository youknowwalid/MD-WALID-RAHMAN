import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SiteConfigProvider } from './context/SiteConfigContext.tsx';
import { initializeAppSettings } from './core/settingsBootstrap.ts';

async function start() {
  // Synchronously hydrates critical settings from local storage, preloads images / assets, and fetches DB updates 
  await initializeAppSettings();

  // Dynamically theme loader element instantly matching hydrated accent variables before fade out
  const loader = document.getElementById('bootstrap-loader');
  if (loader) {
    try {
      const cachedGlobal = localStorage.getItem('site_config_global');
      if (cachedGlobal) {
        const global = JSON.parse(cachedGlobal);
        const primary = global.primaryColor || '#f45901';
        const dot = document.getElementById('loader-dot');
        const bar = document.getElementById('loader-bar');
        if (dot) dot.style.color = primary;
        if (bar) bar.style.backgroundColor = primary;
      }
    } catch (e) {}

    // Delay fadeout slightly to guarantee fully painted UI 
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      setTimeout(() => loader.remove(), 250);
    }, 150);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SiteConfigProvider>
        <App />
      </SiteConfigProvider>
    </StrictMode>,
  );
}

start();

