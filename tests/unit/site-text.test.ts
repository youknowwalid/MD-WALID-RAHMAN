import { describe, expect, it } from 'vitest';
import { buildLlmsTxt } from '../../api/llms.js';
import { buildSitemap } from '../../api/sitemap.js';
import { descriptionOf, originOf, siteNameOf, siteUrlOf } from '../../api/_site.js';
import seoDefaults from '../../src/lib/seo-defaults.json';

describe('site-wide text is read from the saved settings, not retyped in code', () => {
  it('falls back to the neutral defaults when nothing is saved, and to the visited address for the web address', () => {
    const req = { headers: { host: 'shop.acme.example' } };
    expect(siteNameOf({})).toBe(seoDefaults.siteName);
    expect(descriptionOf({})).toBe(seoDefaults.defaultDescription);
    expect(siteUrlOf({}, req)).toBe('https://shop.acme.example');
    expect(siteUrlOf({ seo: { siteUrl: 'https://saved.example/' } }, req)).toBe('https://saved.example'); // saved wins
    const txt = buildLlmsTxt({}, {}, false, req);
    expect(txt).toContain(`# ${seoDefaults.siteName}`);
    expect(txt).toContain('https://shop.acme.example/sitemap.xml');
    expect(txt).not.toContain('## Contact'); // nothing saved, nothing invented
  });

  it('works out the address of a request safely', () => {
    expect(originOf({ headers: { 'x-forwarded-host': 'a.example, b.example' } })).toBe('https://a.example');
    expect(originOf({ headers: { host: 'localhost:3000' } })).toBe('http://localhost:3000');
    expect(originOf({ headers: { host: 'evil.example/<script>' } })).toBe('');
    expect(originOf({})).toBe('');
  });

  it('llms.txt follows what the admin saved', () => {
    const txt = buildLlmsTxt({
      seo: { siteName: 'Studio X', siteUrl: 'https://studio.example/', defaultDescription: 'A small studio.' },
      global: {
        heroStats: [{ value: '8+', unit: 'Yrs', label: 'Experience' }],
        contactEmail: 'hi@studio.example',
        capabilityGroups: [{ name: 'A', short: 'A', items: ['Branding', 'Web'] }],
      },
    });
    expect(txt).toContain('# Studio X');
    expect(txt).toContain('> A small studio. 8+ Yrs Experience.');
    expect(txt).toContain('(https://studio.example/sitemap.xml)');
    expect(txt).toContain('- Branding');
    expect(txt).toContain('- hi@studio.example');
  });

  it('the sitemap uses the saved web address', () => {
    expect(buildSitemap([{ path: '/', priority: '1.0' }], 'https://studio.example')).toContain('<loc>https://studio.example/</loc>');
  });
});
