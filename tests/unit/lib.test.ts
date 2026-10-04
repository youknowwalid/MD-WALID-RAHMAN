import { describe, expect, it } from 'vitest';
import { fromRow, toRow } from '../../src/lib/rows';
import { isUuid, parseContent, readingMinutes, safeUrl, slugify } from '../../src/lib/text';
import { imageSrcSet, optimizeMedia, videoPoster } from '../../src/lib/image';
import { normalizePricingPlan, normalizeProject } from '../../src/lib/schema-defaults';
import { toFormValues, toPayload } from '../../src/components/admin/forms';
import { buildSitemap } from '../../api/sitemap.js';

describe('rows mapping', () => {
  it('converts database rows to app objects', () => {
    expect(fromRow('projects', { hero_image: 'x', sort_order: 3, start_date: 'now' })).toEqual({ heroImage: 'x', order: 3, startDate: 'now' });
    expect(fromRow('resume', { description: 'hello', role: 'r' })).toEqual({ desc: 'hello', role: 'r' });
  });
  it('only writes known columns and blanks empty slugs', () => {
    const row = toRow('projects', { id: 'abc', title: 'T', heroImage: 'h', slug: '', createdAt: 'x', evil: 1, order: 2 });
    expect(row).toEqual({ title: 'T', hero_image: 'h', slug: null, sort_order: 2 });
    expect(toRow('resume', { desc: 'd' })).toEqual({ description: 'd' });
  });
});

describe('text helpers', () => {
  it('slugifies', () => {
    expect(slugify('  Hello, World! Ünïcode  ')).toBe('hello-world-unicode');
    expect(slugify('---')).toBe('');
  });
  it('detects uuids', () => {
    expect(isUuid('11111111-1111-1111-1111-111111111111')).toBe(true);
    expect(isUuid('my-project')).toBe(false);
  });
  it('estimates reading time', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('word '.repeat(1000))).toBe(5);
  });
  it('blocks dangerous links', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl(' data:text/html,x')).toBe('');
    expect(safeUrl('https://a.b')).toBe('https://a.b');
    expect(safeUrl('/#contact')).toBe('/#contact');
    expect(safeUrl('mailto:a@b.co')).toBe('mailto:a@b.co');
  });
  it('parses article text without ever producing HTML', () => {
    const blocks = parseContent('Intro line\nstill intro\n\n### Heading\n- one\n- two\n\n<script>alert(1)</script>');
    expect(blocks).toEqual([
      { type: 'p', text: 'Intro line\nstill intro' },
      { type: 'h', level: 3, text: 'Heading' },
      { type: 'ul', items: ['one', 'two'] },
      { type: 'p', text: '<script>alert(1)</script>' },
    ]);
  });
});

describe('normalizers', () => {
  it('never invent images or content', () => {
    const p = normalizeProject({ title: 'A' });
    expect(p.image).toBe('');
    expect(p.category).toBe('');
    expect(normalizePricingPlan({ name: 'X' }).period).toBe('/month');
    expect(normalizePricingPlan({ name: 'X', period: '' }).period).toBe('');
  });
});

describe('admin forms', () => {
  it('round-trips a project', () => {
    const values = toFormValues('projects', { title: 'T', tags: ['a', 'b'], gallery: ['u1', 'u2'], order: 4 });
    expect(values.tags).toBe('a, b');
    expect(values.gallery).toBe('u1\nu2');
    const payload = toPayload('projects', { ...values, title: 'My Project' });
    expect(payload).toMatchObject({ title: 'My Project', slug: 'my-project', tags: ['a', 'b'], gallery: ['u1', 'u2'], order: 4 });
  });
  it('requires required fields and valid skill levels', () => {
    expect(() => toPayload('projects', { ...toFormValues('projects', null), title: '  ' })).toThrow(/Project title/);
    expect(() => toPayload('skills', { name: 'x', level: '150', order: '' })).toThrow(/0 to 100/);
    expect(toPayload('skills', { name: 'x', level: '90', order: '' })).toMatchObject({ name: 'x', level: 90 });
  });
});

describe('sitemap', () => {
  it('escapes and lists urls', () => {
    const xml = buildSitemap([{ path: '/blog/a&b', lastmod: '2026-01-02T00:00:00Z', priority: '0.6' }]);
    expect(xml).toContain('<loc>https://walidrahman.com/blog/a&amp;b</loc>');
    expect(xml).toContain('<lastmod>2026-01-02</lastmod>');
  });
});

describe('Cloudinary media helpers', () => {
  const img = 'https://res.cloudinary.com/demo/image/upload/v123/me.png';
  const vid = 'https://res.cloudinary.com/demo/video/upload/v123/intro.mp4';

  it('asks Cloudinary for auto format/quality and a max width', () => {
    expect(optimizeMedia(img, { width: 480 })).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480,c_limit/v123/me.png');
  });
  it('leaves other hosts and already-optimized links alone', () => {
    expect(optimizeMedia('https://example.com/a.png', { width: 480 })).toBe('https://example.com/a.png');
    const done = optimizeMedia(img, { width: 480 });
    expect(optimizeMedia(done, { width: 480 })).toBe(done);
  });
  it('builds a srcset only for Cloudinary images', () => {
    expect(imageSrcSet(img)).toContain('480w');
    expect(imageSrcSet(img)).toContain('840w');
    expect(imageSrcSet('https://example.com/a.png')).toBe('');
  });
  it('makes a JPEG poster from a Cloudinary video only', () => {
    expect(videoPoster(vid)).toBe('https://res.cloudinary.com/demo/video/upload/so_0,f_jpg,q_auto,w_1280,c_limit/v123/intro.jpg');
    expect(videoPoster(img)).toBe('');
    expect(videoPoster('https://example.com/a.mp4')).toBe('');
  });
});
