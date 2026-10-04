import { describe, expect, it } from 'vitest';
import { fromRow, toRow } from '../../src/lib/rows';
import { isUuid, parseContent, readingMinutes, safeUrl, slugify } from '../../src/lib/text';
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

describe('project case-study columns', () => {
  const columns: Record<string, string> = {
    summary: 'summary', industry: 'industry', services: 'services',
    feedbackQuote: 'feedback_quote', feedbackName: 'feedback_name', feedbackRole: 'feedback_role',
    ctaTitle: 'cta_title', ctaButtonText: 'cta_button_text', ctaButtonUrl: 'cta_button_url', published: 'published',
  };
  it('maps new database columns to camelCase and back', () => {
    const row = Object.fromEntries(Object.values(columns).map((c) => [c, c === 'published' ? false : `v-${c}`]));
    const item = fromRow('projects', row);
    for (const [camel, col] of Object.entries(columns)) expect(item[camel]).toBe(row[col]);
    const back = toRow('projects', item);
    for (const col of Object.values(columns)) expect(back[col]).toBe(row[col]);
  });
  it('keeps projects saved before the upgrade visible', () => {
    expect(normalizeProject({ title: 'Old' }).published).toBe(true);
    expect(normalizeProject({ title: 'Draft', published: false }).published).toBe(false);
    expect(toFormValues('projects', { title: 'Old' }).published).toBe(true);
    expect(toFormValues('projects', null).published).toBe(true);
    expect(toFormValues('projects', { title: 'D', published: false }).published).toBe(false);
  });
  it('defaults new text fields to empty strings', () => {
    const p = normalizeProject({ title: 'A' }) as Record<string, any>;
    for (const camel of Object.keys(columns).filter((c) => c !== 'published')) expect(p[camel]).toBe('');
  });
  it('round-trips every new field through the admin form', () => {
    const item: Record<string, any> = { title: 'T', published: false };
    for (const camel of Object.keys(columns).filter((c) => c !== 'published')) item[camel] = `value of ${camel}`;
    const values = toFormValues('projects', item);
    for (const camel of Object.keys(columns)) expect(values[camel]).toBe(camel === 'published' ? false : item[camel]);
    expect(toPayload('projects', values)).toMatchObject(item);
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
