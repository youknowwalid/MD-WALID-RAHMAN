import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// The sandbox ships its own Chromium; elsewhere Playwright's own download is used.
const sandboxChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const executablePath = process.env.PW_CHROMIUM || (existsSync(sandboxChromium) ? sandboxChromium : undefined);

const mockEnv = 'VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=test-anon-key';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [['list']],
  use: { launchOptions: { executablePath }, trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: { executablePath } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent, launchOptions: { executablePath } } },
  ],
  webServer: [
    { command: 'node tests/e2e/mock-server.mjs', url: 'http://127.0.0.1:54321/__db', reuseExistingServer: true },
    // Site connected to the fake backend
    { command: `${mockEnv} npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port 4174 --strictPort`, url: 'http://127.0.0.1:4174', timeout: 120_000, reuseExistingServer: true },
    // Site with no backend connected (zero-configuration mode)
    { command: 'npx vite build --outDir dist-e2e-plain --emptyOutDir && npx vite preview --outDir dist-e2e-plain --port 4175 --strictPort', url: 'http://127.0.0.1:4175', timeout: 120_000, reuseExistingServer: true },
  ],
});
