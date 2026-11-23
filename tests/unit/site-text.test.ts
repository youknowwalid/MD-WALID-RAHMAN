import { describe, expect, it } from 'vitest';
import { buildLlmsTxt } from '../../api/llms.js';
import { buildSitemap } from '../../api/sitemap.js';
import { DEFAULT_SITE_URL, descriptionOf, siteNameOf, siteUrlOf } from '../../api/_site.js';
import seoDefaults from '../../src/lib/seo-defaults.json';

describe('site-wide text is read from the saved settings, not retyped in code', () => {
  it('falls back to the shared defaults when nothing is saved', () => {
    expect(siteNameOf({})).toBe(seoDefaults.siteName);
    expect(descriptionOf({})).toBe(seoDefaults.defaultDescription);
    expect(siteUrlOf({})).toBe(DEFAULT_SITE_URL);
    const txt = buildLlmsTxt({});
    expect(txt).toContain(`# ${seoDefaults.siteName}`);
    expect(txt).toContain(`${DEFAULT_SITE_URL}/sitemap.xml`);
    expect(txt).not.toContain('## Contact'); // nothing saved, nothing invented
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
