import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildGraph, canonicalPath, cleanFaq, parseCustom, toScriptJson } from '../../api/_graph.js';
import { buildNoscriptMain, buildPageHtml, buildStaticMain, mergeSeo } from '../../api/_head.js';
import { buildRobotsTxt } from '../../api/robots.js';
import { buildLlmsTxt } from '../../api/llms.js';
import { buildSitemap, withoutNoindex } from '../../api/sitemap.js';
import { statText } from '../../api/_site.js';

// All names below are made-up test data. The code under test must never supply its own.
const template = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const SEO = { siteName: 'Acme Studio', siteUrl: 'https://acme.test', defaultTitle: 'Acme Studio | Branding', defaultDescription: 'Acme builds brands.', keywords: 'branding, design' };
const GLOBAL = {
  contactEmail: 'hello@acme.test',
  founderName: 'Jane Doe',
  founderRole: 'Founder',
  socialLinks: [{ platform: 'x', url: 'https://x.com/acme' }],
  heroStats: [{ value: '8+', unit: 'Yrs', label: 'Experience' }, { value: '100', unit: '%', label: 'Delivered' }],
  capabilityGroups: [{ name: 'Brand', short: 'Brand', items: ['Identity', 'Strategy'] }],
  aboutText: 'First paragraph.\n\nSecond paragraph.',
  sectionTitles: { heroName: 'Acme Studio.' },
};
const nodes = (g: ReturnType<typeof buildGraph>) => g['@graph'];
const ofType = (g: ReturnType<typeof buildGraph>, t: string) => g['@graph'].filter((n: any) => n['@type'] === t || (Array.isArray(n['@type']) && n['@type'].includes(t)));
const base = { site: 'https://acme.test', seo: mergeSeo(SEO), url: 'https://acme.test/', path: '/', description: 'Acme builds brands.', imageUrl: 'https://acme.test/og-image.png' };

describe('structured data graph', () => {
  it('links the brand, website and page with stable ids', () => {
    const g = buildGraph({ ...base, global: GLOBAL, page: {}, kind: 'home' });
    const ids = nodes(g).map((n) => n['@id']);
    expect(ids).toContain('https://acme.test/#entity');
    expect(ids).toContain('https://acme.test/#website');
    expect(ids).toContain('https://acme.test/#webpage');
    const page: any = nodes(g).find((n: any) => n['@type'] === 'WebPage');
    expect(page.isPartOf['@id']).toBe('https://acme.test/#website');
    expect(page.about['@id']).toBe('https://acme.test/#entity');
  });

  it('takes the brand details from the saved settings only', () => {
    const g = buildGraph({ ...base, global: GLOBAL, page: {}, kind: 'home' });
    const org: any = ofType(g, 'Organization')[0];
    expect(org.name).toBe('Acme Studio');
    expect(org.email).toBe('hello@acme.test');
    expect(org.sameAs).toEqual(['https://x.com/acme']);
    const founder: any = ofType(g, 'Person')[0];
    expect(founder.name).toBe('Jane Doe');
    expect(founder.jobTitle).toBe('Founder');
  });

  it('writes no founder, contact or links when nothing is saved (nothing is invented)', () => {
    const g = buildGraph({ ...base, global: {}, page: {}, kind: 'home' });
    const json = JSON.stringify(g);
    expect(ofType(g, 'Person')).toHaveLength(0);
    expect(json).not.toContain('"email"');
    expect(json).not.toContain('"sameAs"');
    expect(json).not.toContain('FAQPage');
  });

  it('uses the brand type chosen in the admin', () => {
    const g = buildGraph({ ...base, discovery: { entity: { type: 'Person', legalName: 'Jane Doe', knowsAbout: ['Branding'] } }, global: {}, page: {}, kind: 'home' });
    const e: any = nodes(g)[0];
    expect(e['@type']).toBe('Person');
    expect(e.name).toBe('Jane Doe');
    expect(e.knowsAbout).toEqual(['Branding']);
  });

  it('builds the FAQ only from answers saved in the admin, and skips incomplete ones', () => {
    const meta = { faq_items: [{ question: 'What do you do?', answer: 'We build brands.' }, { question: 'No answer', answer: '' }] };
    const g = buildGraph({ ...base, global: {}, meta, page: {}, kind: 'home' });
    const faq: any = ofType(g, 'FAQPage')[0];
    expect(faq.mainEntity).toHaveLength(1);
    expect(faq.mainEntity[0].name).toBe('What do you do?');
    expect(cleanFaq([{ question: ' ', answer: 'x' }])).toEqual([]);
  });

  it('gives articles a breadcrumb trail, an author and dates', () => {
    const page = { title: 'Hello', type: 'article', published: '2026-01-01T00:00:00Z', modified: '2026-02-01T00:00:00Z', author: 'Sam Roe' };
    const g = buildGraph({ ...base, url: 'https://acme.test/blog/hello', path: '/blog/hello', global: {}, page, kind: 'blog' });
    const article: any = ofType(g, 'Article')[0];
    expect(article.headline).toBe('Hello');
    expect(article.author.name).toBe('Sam Roe');
    expect(article.datePublished).toBe('2026-01-01T00:00:00Z');
    expect(article.dateModified).toBe('2026-02-01T00:00:00Z');
    const crumbs: any = ofType(g, 'BreadcrumbList')[0];
    expect(crumbs.itemListElement.map((i: any) => i.name)).toEqual(['Home', 'Articles', 'Hello']);
  });

  it('prefers the saved author profile over the free-text author', () => {
    const author = { slug: 'sam-roe', name: 'Sam Roe', job_title: 'Editor', same_as: ['https://example.org/sam'], knows_about: ['Branding'] };
    const page = { title: 'Hello', type: 'article', author: 'ignored' };
    const g = buildGraph({ ...base, url: 'https://acme.test/blog/hello', path: '/blog/hello', global: {}, page, author, kind: 'blog' });
    const article: any = ofType(g, 'Article')[0];
    expect(article.author['@id']).toBe('https://acme.test/#author-sam-roe');
    const person: any = nodes(g).find((n) => n['@id'] === 'https://acme.test/#author-sam-roe');
    expect(person.jobTitle).toBe('Editor');
    expect(person.sameAs).toEqual(['https://example.org/sam']);
  });

  it('lets the admin choose the page type, and adds valid custom JSON-LD only', () => {
    const meta = { schema_type: 'Service', custom_json_ld: '{"@context":"https://schema.org","@type":"Offer","name":"Extra"}' };
    const g = buildGraph({ ...base, global: {}, meta, page: { title: 'Branding' }, kind: 'page', url: 'https://acme.test/x', path: '/x' });
    expect(ofType(g, 'Service')).toHaveLength(1);
    expect((ofType(g, 'Offer')[0] as any).name).toBe('Extra');
    expect(JSON.stringify(g)).not.toContain('"@context":"https://schema.org","@type":"Offer"');
    expect(parseCustom('{not json')).toEqual([]);
    expect(parseCustom('')).toEqual([]);
    expect(parseCustom('{"name":"no type"}')).toEqual([]);
  });

  it('can never close its own script tag', () => {
    expect(toScriptJson({ a: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});

describe('canonical address', () => {
  it('drops tracking parameters, fragments, repeated and trailing slashes', () => {
    expect(canonicalPath('/articles/?utm_source=x&fbclid=1')).toBe('/articles');
    expect(canonicalPath('/blog//hello/#top')).toBe('/blog/hello');
    expect(canonicalPath('/')).toBe('/');
    expect(canonicalPath('')).toBe('/');
  });
});

describe('page head from the page SEO row', () => {
  const meta = {
    meta_title: 'Custom Title',
    meta_description: 'Custom description.',
    canonical_override: 'https://acme.test/canonical-home',
    robots_index: true,
    robots_follow: false,
    og_title: 'Share title',
    og_image_url: 'https://cdn.example.com/share.jpg',
    twitter_card: 'summary',
    hreflang_alternates: [{ lang: 'bn', url: 'https://acme.test/bn' }, { lang: 'x', url: 'http://bad' }],
  };
  const html = buildPageHtml(template, SEO, {}, '/', { global: GLOBAL, discovery: { verification: { google: 'abc123' } }, meta, kind: 'home', owned: true, withBody: true });
  const tag = (re: RegExp) => re.exec(html)?.[1];

  it('uses what the admin wrote for the title, description, share tags and canonical', () => {
    expect(tag(/<title>([^<]*)<\/title>/)).toBe('Custom Title');
    expect(tag(/name="description" content="([^"]*)"/)).toBe('Custom description.');
    expect(tag(/rel="canonical" href="([^"]*)"/)).toBe('https://acme.test/canonical-home');
    expect(tag(/property="og:title" content="([^"]*)"/)).toBe('Share title');
    expect(tag(/property="og:image" content="([^"]*)"/)).toBe('https://cdn.example.com/share.jpg');
    expect(tag(/name="twitter:card" content="([^"]*)"/)).toBe('summary');
    expect(tag(/name="robots" content="([^"]*)"/)).toBe('index, nofollow, max-image-preview:large');
    expect(tag(/name="google-site-verification" content="([^"]*)"/)).toBe('abc123');
    expect(tag(/name="keywords" content="([^"]*)"/)).toBe('branding, design');
  });

  it('adds only valid language alternatives', () => {
    expect(html).toContain('<link rel="alternate" hreflang="bn" href="https://acme.test/bn" />');
    expect(html).not.toContain('http://bad');
  });

  it('marks the page as final for the app, and leaves one structured-data block', () => {
    expect(html).toContain('<html lang="en" data-ssr-path="/">');
    expect((html.match(/application\/ld\+json/g) || []).length).toBe(1);
    expect(html).not.toContain('aeo-jsonld-home');
  });

  it('does not mark a page as final unless asked', () => {
    expect(buildPageHtml(template, SEO, {}, '/articles', { kind: 'page' })).not.toContain('data-ssr-path');
  });

  it('keeps a whole-site noindex stronger than the page row', () => {
    const closed = buildPageHtml(template, { ...SEO, robotsIndex: false }, {}, '/', { meta: { robots_index: true } });
    expect(/name="robots" content="([^"]*)"/.exec(closed)?.[1]).toBe('noindex, nofollow');
  });

  it('keeps private pages out of search', () => {
    const priv = buildPageHtml(template, SEO, {}, '/admin', { noindex: true });
    expect(/name="robots" content="([^"]*)"/.exec(priv)?.[1]).toBe('noindex, nofollow');
  });
});

describe('plain-HTML copy of the page', () => {
  it('is written from saved content only', () => {
    const faq = [{ question: 'What do you do?', answer: 'We build brands.' }];
    const main = buildStaticMain({ seo: mergeSeo(SEO), global: GLOBAL, meta: { tldr_summary: 'Short answer.', quotable_facts: ['Founded by Jane Doe.'] }, description: 'Acme builds brands.', faq });
    expect(main).toContain('<h1>Acme Studio</h1>');
    expect(main).toContain('<p>Short answer.</p>');
    expect(main).toContain('<li>8+ Yrs Experience</li>');
    expect(main).toContain('<li>100% Delivered</li>');
    expect(main).toContain('<li>Identity</li>');
    expect(main).toContain('<h3>What do you do?</h3>');
    expect(main).toContain('mailto:hello@acme.test');
    expect(main).toContain('<li>Founded by Jane Doe.</li>');
  });

  it('writes no empty headings when little is saved', () => {
    const main = buildStaticMain({ seo: mergeSeo(SEO), global: {}, meta: null, description: 'Acme builds brands.', faq: [] });
    expect(main).not.toContain('<h2>');
    expect(main).toContain('<h1>Acme Studio</h1>');
  });

  it('escapes saved text', () => {
    const main = buildStaticMain({ seo: mergeSeo(SEO), global: { aboutText: '<img src=x onerror=1>' }, meta: null, description: '', faq: [] });
    expect(main).not.toContain('<img');
  });

  it('has a no-JavaScript message built from the saved name and email', () => {
    const html = buildNoscriptMain({ seo: mergeSeo(SEO), global: GLOBAL, description: 'Acme builds brands.' });
    expect(html).toContain('<h1>Acme Studio</h1>');
    expect(html).toContain('hello@acme.test');
  });
});

describe('robots.txt', () => {
  it('allows crawlers by default, blocks private areas and points to the saved sitemap address', () => {
    const txt = buildRobotsTxt({ seo: { siteUrl: 'https://acme.test/' } });
    expect(txt).toContain('User-agent: *');
    expect(txt).toContain('User-agent: GPTBot');
    expect(txt).toContain('Disallow: /admin');
    expect(txt).toContain('Disallow: /api/');
    expect(txt).toContain('Sitemap: https://acme.test/sitemap.xml');
  });

  it('blocks only the AI crawlers the admin chose', () => {
    const txt = buildRobotsTxt({ seo: { siteUrl: 'https://acme.test' }, discovery: { crawlers: { CCBot: 'block' } } });
    expect(txt).toContain('User-agent: CCBot\nDisallow: /');
    expect(txt.split('\n\n')[0]).not.toContain('CCBot');
    expect(txt).toContain('User-agent: GPTBot');
  });

  it('blocks everything when search engines are switched off', () => {
    expect(buildRobotsTxt({ seo: { robotsIndex: false, siteUrl: 'https://acme.test' } })).toContain('User-agent: *\nDisallow: /\n');
  });

  it('adds extra blocked paths, ignoring unsafe ones', () => {
    const txt = buildRobotsTxt({ discovery: { extraDisallow: ['/private', 'no-slash', '/'] } });
    expect(txt).toContain('Disallow: /private');
    expect(txt).not.toContain('no-slash');
  });
});

describe('llms.txt and llms-full.txt', () => {
  const settings = { seo: SEO, global: GLOBAL };
  const data = {
    posts: [{ id: 'p1', slug: 'hello', title: 'Hello', excerpt: 'A first post.' }, { id: 'p2', slug: 'hidden', title: 'Hidden', excerpt: 'x' }],
    projects: [{ id: 'j1', slug: 'case', title: 'Case', summary: 'A case study.' }],
    meta: { home: { tldr_summary: 'We build brands.', faq_items: [{ question: 'Q?', answer: 'A.' }], quotable_facts: ['Fact one.'] }, 'blog:p2': { robots_index: false } },
  };

  it('lists published pages and leaves out the ones switched off for search', () => {
    const txt = buildLlmsTxt(settings, data);
    expect(txt).toContain('> We build brands. 8+ Yrs Experience, 100% Delivered.');
    expect(txt).toContain('[Hello](https://acme.test/blog/hello): A first post.');
    expect(txt).not.toContain('Hidden');
    expect(txt).toContain('[Case](https://acme.test/projects/case): A case study.');
    expect(txt).toContain('llms-full.txt');
    expect(txt).not.toContain('Fact one.');
  });

  it('the full version adds the about text, key facts and answers', () => {
    const txt = buildLlmsTxt(settings, data, true);
    expect(txt).toContain('First paragraph.');
    expect(txt).toContain('- Fact one.');
    expect(txt).toContain('### Q?');
    expect(txt).not.toContain('llms-full.txt');
  });

  it('formats key numbers without stray spaces', () => {
    expect(statText({ value: '97', unit: '%', label: 'Rate' })).toBe('97% Rate');
    expect(statText({ value: '8+', unit: 'Yrs', label: 'Experience' })).toBe('8+ Yrs Experience');
    expect(statText({ value: '', unit: '', label: '' })).toBe('');
  });
});

describe('sitemap', () => {
  it('leaves out pages the admin switched off for search', () => {
    const entries = [{ path: '/', key: 'home', priority: '1.0' }, { path: '/blog/a', key: 'blog:a', priority: '0.6' }, { path: '/blog/b', key: 'blog:b', priority: '0.6' }];
    const xml = buildSitemap(withoutNoindex(entries, [{ route_key: 'blog:b', robots_index: false }]), 'https://acme.test');
    expect(xml).toContain('https://acme.test/blog/a');
    expect(xml).not.toContain('/blog/b');
  });
});
