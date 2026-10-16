import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPageHtml, mergeSeo, pickPage } from '../../api/page-meta.js';

const template = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const count = (html: string, re: RegExp) => (html.match(re) || []).length;
const content = (html: string, attr: 'property' | 'name', key: string) =>
  new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`).exec(html)?.[1];

describe('page meta: project and blog link previews', () => {
  const project = {
    title: 'ReplyMe',
    social_title: '',
    social_description: '',
    social_image: 'https://cdn.example.com/replyme-share.jpg',
    summary: 'An AI sales and support chatbot for businesses.',
    content: 'First paragraph.\n\nSecond paragraph.',
    hero_image: 'https://cdn.example.com/hero.jpg',
    image: 'https://cdn.example.com/card.jpg',
  };

  it('puts the project\'s own tags in the HTML, not the home page\'s', () => {
    const html = buildPageHtml(template, null, pickPage('project', project), '/projects/replyme-io');
    expect(html).toContain('<title>ReplyMe | Walid Rahman</title>');
    expect(content(html, 'property', 'og:title')).toBe('ReplyMe | Walid Rahman');
    expect(content(html, 'property', 'og:description')).toBe('An AI sales and support chatbot for businesses.');
    expect(content(html, 'property', 'og:image')).toBe('https://cdn.example.com/replyme-share.jpg');
    expect(content(html, 'name', 'twitter:image')).toBe('https://cdn.example.com/replyme-share.jpg');
    expect(content(html, 'property', 'og:url')).toBe('https://walidrahman.com/projects/replyme-io');
    expect(html).toContain('<link rel="canonical" href="https://walidrahman.com/projects/replyme-io" />');
    expect(html).not.toContain('og-image.png'); // neither in a tag nor in the home page's structured data
    expect(html).not.toContain('seo-jsonld-schema');
  });

  it('leaves exactly one of each tag, so a crawler cannot pick the old home-page one', () => {
    const html = buildPageHtml(template, null, pickPage('project', project), '/projects/replyme-io');
    expect(count(html, /<title>/g)).toBe(1);
    expect(count(html, /<link rel="canonical"/g)).toBe(1);
    expect(count(html, /property="og:image"/g)).toBe(1);
    expect(count(html, /property="og:title"/g)).toBe(1);
    expect(count(html, /name="twitter:image"/g)).toBe(1);
    expect(count(html, /name="description"/g)).toBe(1);
    expect(count(html, /name="robots"/g)).toBe(1);
  });

  it('keeps everything else in the page (app root, scripts, favicon, theme colour)', () => {
    const html = buildPageHtml(template, null, pickPage('project', project), '/projects/replyme-io');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(html).toContain('rel="icon"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('name="viewport"');
  });

  it('chooses the share image like the page does: share image, then cover, then card image', () => {
    expect(pickPage('project', project).image).toBe(project.social_image);
    expect(pickPage('project', { ...project, social_image: '' }).image).toBe(project.hero_image);
    expect(pickPage('project', { ...project, social_image: '', hero_image: '' }).image).toBe(project.image);
  });

  it('chooses the description like the page does: share text, then summary, then first paragraph', () => {
    expect(pickPage('project', { ...project, social_description: 'Custom' }).description).toBe('Custom');
    expect(pickPage('project', project).description).toBe(project.summary);
    expect(pickPage('project', { ...project, summary: '' }).description).toBe('First paragraph.');
  });

  it('falls back to the built-in share image (with its size) when a page has none', () => {
    const html = buildPageHtml(template, null, pickPage('project', { title: 'Bare' }), '/projects/bare');
    expect(content(html, 'property', 'og:image')).toBe('https://walidrahman.com/og-image.png');
    expect(content(html, 'property', 'og:image:width')).toBe('1200');
    expect(content(html, 'property', 'og:image:height')).toBe('630');
  });

  it('does not claim a size for an uploaded image', () => {
    const html = buildPageHtml(template, null, pickPage('project', project), '/projects/replyme-io');
    expect(html).not.toContain('og:image:width');
    expect(html).not.toContain('og:image:height');
  });

  it('marks blog posts as articles and uses their own fields', () => {
    const post = { title: 'Hello', excerpt: 'A short post.', image: '/uploads/post.png', social_image: '', social_title: '', social_description: '' };
    const html = buildPageHtml(template, null, pickPage('blog', post), '/blog/hello');
    expect(content(html, 'property', 'og:type')).toBe('article');
    expect(content(html, 'property', 'og:description')).toBe('A short post.');
    expect(content(html, 'property', 'og:image')).toBe('https://walidrahman.com/uploads/post.png');
    expect(content(html, 'property', 'og:url')).toBe('https://walidrahman.com/blog/hello');
  });

  it('cannot be used to inject markup, and keeps "$" characters as typed', () => {
    const html = buildPageHtml(template, null, pickPage('project', {
      title: '"><script>alert(1)</script> $& $1',
      summary: '<img src=x onerror=alert(1)> & more',
      social_image: 'javascript:alert(1)',
    }), '/projects/x');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('$&amp; $1');
    expect(content(html, 'property', 'og:image')).toBe('https://walidrahman.com/og-image.png');
  });

  it('uses the SEO settings saved in the admin (template, site name, default image, noindex, twitter)', () => {
    const saved = { titleTemplate: '%s — Walid', siteName: 'W', ogImage: 'https://cdn.example.com/default.png', twitterHandle: '@walid', robotsIndex: false };
    const html = buildPageHtml(template, saved, pickPage('project', { title: 'Bare' }), '/projects/bare');
    expect(html).toContain('<title>Bare — Walid</title>');
    expect(content(html, 'property', 'og:site_name')).toBe('W');
    expect(content(html, 'property', 'og:image')).toBe('https://cdn.example.com/default.png');
    expect(content(html, 'name', 'twitter:site')).toBe('@walid');
    expect(content(html, 'name', 'robots')).toBe('noindex, nofollow');
  });

  it('merges saved SEO settings the same way the browser does', () => {
    expect(mergeSeo(null).siteName).toBe('Walid Rahman');
    expect(mergeSeo({ siteName: '   ' }).siteName).toBe('Walid Rahman'); // blank falls back
    expect(mergeSeo({ ogImage: '' }).ogImage).toBe(''); // these may be blank on purpose
    expect(mergeSeo({ robotsIndex: 'no' }).robotsIndex).toBe(true); // wrong type ignored
  });

  it('returns the template untouched if it has no <head>', () => {
    expect(buildPageHtml('<p>x</p>', null, pickPage('project', project), '/projects/a')).toBe('<p>x</p>');
  });
});
