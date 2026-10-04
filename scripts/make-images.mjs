// Regenerates /public/og-image.png and the PNG icons from scripts/og.html and public/favicon.svg.
// Run with: node scripts/make-images.mjs   (needs the Playwright browser that ships with the dev dependencies)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL('scripts/og.html').href);
await page.screenshot({ path: 'public/og-image.png' });

const svg = readFileSync('public/favicon.svg', 'utf8');
for (const [size, file] of [[48, 'favicon-48.png'], [180, 'apple-touch-icon.png']]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<body style="margin:0;background:#0a0a0a">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await p.screenshot({ path: `public/${file}` });
}
await browser.close();
