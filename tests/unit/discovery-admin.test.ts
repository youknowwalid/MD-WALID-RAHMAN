import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type AuditInput, type PageMeta, auditPage, emptyMeta, fromLines, generateIndexNowKey, inspectHtml, isIndexNowKey, jsonLdProblem, metaToRow,
  normalizeDiscovery, normalizeMeta, redirectProblem, toLines,
} from '../../src/lib/discovery';
import indexnow, { ownUrls } from '../../api/indexnow.js';

// All names are made-up test data: the code under test must never supply its own.
const NOW = new Date('2026-06-01T00:00:00Z');
const full = (): PageMeta => ({
  ...emptyMeta(),
  meta_title: 'Acme Studio: branding that sells',
  meta_description: 'Acme Studio does branding for small shops, from the name and logo to the shelf and the website.',
  focus_keyword: 'branding',
  tldr_summary: 'Acme Studio designs brand identities. Projects start with a short call and end with a full brand kit.',
  faq_items: [1, 2, 3].map((n) => ({ question: `Question ${n}?`, answer: `Answer ${n}.` })),
  quotable_facts: ['Founded in 2018.'],
  author_id: 'a1',
  last_reviewed_at: '2026-03-01T00:00:00.000Z',
});
const input = (meta: PageMeta = full(), extra: Partial<AuditInput> = {}) => ({ meta, fallbackTitle: '', fallbackDescription: '', needsAuthor: true, hasDefaultShareImage: true, now: NOW, ...extra });

describe('discovery settings', () => {
  it('fills blanks neutrally and never invents content', () => {
    const d = normalizeDiscovery(null);
    expect(d.entity.type).toBe('Organization');
    expect(d.entity.legalName).toBe('');
    expect(d.entity.sameAs).toEqual([]);
    expect(d.crawlers).toEqual({});
    expect(d.indexnow.key).toBe('');
  });
  it('keeps only real block decisions and trims text', () => {
    const d = normalizeDiscovery({ entity: { type: 'Person', legalName: '  Jane ', sameAs: [' https://x.test/j ', '', 3] }, crawlers: { GPTBot: 'block', CCBot: 'allow' }, extraDisallow: [' /p/ '] });
    expect(d.entity.type).toBe('Person');
    expect(d.entity.legalName).toBe('Jane');
    expect(d.entity.sameAs).toEqual(['https://x.test/j']);
    expect(d.crawlers).toEqual({ GPTBot: 'block' });
    expect(d.extraDisallow).toEqual(['/p/']);
  });
  it('rejects an unknown entity type', () => expect(normalizeDiscovery({ entity: { type: 'Spaceship' } }).entity.type).toBe('Organization'));
  it('turns lines into lists and back', () => {
    expect(fromLines(' a \n\n b ')).toEqual(['a', 'b']);
    expect(toLines(['a', 'b'])).toBe('a\nb');
  });
});

describe('page rows', () => {
  it('reads a saved row and tolerates garbage', () => {
    const m = normalizeMeta({ meta_title: ' T ', faq_items: [{ question: 'q', answer: 'a' }, null, 5], schema_type: 'Nope', robots_index: false, author_id: '' });
    expect(m.meta_title).toBe('T');
    expect(m.faq_items).toEqual([{ question: 'q', answer: 'a' }]);
    expect(m.schema_type).toBe('WebPage');
    expect(m.robots_index).toBe(false);
    expect(m.author_id).toBeNull();
    expect(normalizeMeta(undefined)).toEqual(emptyMeta());
  });
  it('drops half-filled questions, steps and languages before saving', () => {
    const row = metaToRow({ ...emptyMeta(), faq_items: [{ question: 'Q?', answer: '' }, { question: 'Q2?', answer: 'A2' }], howto_steps: [{ name: 'One', text: '' }, { name: 'Two', text: 'Do it' }], hreflang_alternates: [{ lang: '', url: '' }] });
    expect(row.faq_items).toEqual([{ question: 'Q2?', answer: 'A2' }]);
    expect(row.howto_steps).toEqual([{ name: 'Two', text: 'Do it' }]);
    expect(row.hreflang_alternates).toEqual([]);
  });
  it('refuses an insecure canonical address, a bad language code and broken JSON-LD', () => {
    expect(() => metaToRow({ ...emptyMeta(), canonical_override: 'http://acme.test/x' })).toThrow(/https/);
    expect(() => metaToRow({ ...emptyMeta(), hreflang_alternates: [{ lang: 'english please', url: 'https://acme.test' }] })).toThrow(/language code/);
    expect(() => metaToRow({ ...emptyMeta(), hreflang_alternates: [{ lang: 'bn', url: 'acme.test' }] })).toThrow(/https/);
    expect(() => metaToRow({ ...emptyMeta(), custom_json_ld: '{ nope' })).toThrow(/valid JSON/);
  });
  it('accepts extra JSON-LD as an object, a list or a graph', () => {
    expect(jsonLdProblem('')).toBe('');
    expect(jsonLdProblem('{"@type":"Service","name":"x"}')).toBe('');
    expect(jsonLdProblem('[{"@type":"Service"}]')).toBe('');
    expect(jsonLdProblem('{"@graph":[{"@type":"Service"}]}')).toBe('');
    expect(jsonLdProblem('{"name":"no type"}')).toMatch(/@type/);
  });
});

describe('page audit', () => {
  it('scores a bare page low and says what is missing', () => {
    const a = auditPage(input(emptyMeta()));
    expect(a.score).toBeLessThan(25);
    expect(a.checks.find((c) => c.id === 'faq')?.status).toBe('fail');
  });
  it('scores a complete page 100', () => expect(auditPage(input()).score).toBe(100));
  it('judges what visitors actually get when the admin left a field empty', () => {
    const m = { ...full(), meta_title: '', meta_description: '' };
    const a = auditPage(input(m, { fallbackTitle: 'Acme Studio | Branding for shops', fallbackDescription: 'A fallback description that is long enough to count as a real description for the page, ok.' }));
    expect(a.checks.find((c) => c.id === 'title')?.status).toBe('pass');
    expect(a.checks.find((c) => c.id === 'description')?.status).toBe('pass');
  });
  it('does not ask pages other than articles for an author', () => {
    const a = auditPage(input({ ...full(), author_id: null }, { needsAuthor: false }));
    expect(a.checks.find((c) => c.id === 'author')?.status).toBe('na');
    expect(a.score).toBe(100);
  });
  it('asks for a keyword check only when a keyword is set', () => {
    const a = auditPage(input({ ...full(), focus_keyword: '' }));
    expect(a.checks.find((c) => c.id === 'keyword-title')?.status).toBe('na');
    expect(a.checks.find((c) => c.id === 'keyword')?.status).toBe('fail');
  });
  it('marks a page not reviewed for over a year as due', () => {
    expect(auditPage(input({ ...full(), last_reviewed_at: '2025-01-01T00:00:00.000Z' })).checks.find((c) => c.id === 'fresh')?.status).toBe('warn');
    expect(auditPage(input({ ...full(), last_reviewed_at: null })).checks.find((c) => c.id === 'fresh')?.status).toBe('fail');
  });
  it('fails invalid extra structured data', () => expect(auditPage(input({ ...full(), custom_json_ld: '{' })).checks.find((c) => c.id === 'json')?.status).toBe('fail'));
});

describe('redirect rules', () => {
  const d = (over = {}) => ({ source_path: '/old', destination_path: '/new', status_code: 301 as const, is_active: true, ...over });
  it('accepts a normal redirect and a removal without a destination', () => {
    expect(redirectProblem(d())).toBe('');
    expect(redirectProblem(d({ status_code: 410, destination_path: '' }))).toBe('');
    expect(redirectProblem(d({ destination_path: 'https://other.test/page' }))).toBe('');
  });
  it('never allows the home page, the admin or the api', () => {
    expect(redirectProblem(d({ source_path: '/' }))).toMatch(/home page/);
    expect(redirectProblem(d({ source_path: '/admin' }))).toMatch(/cannot be redirected/);
    expect(redirectProblem(d({ source_path: '/api/x' }))).toMatch(/cannot be redirected/);
  });
  it('catches typos before saving', () => {
    expect(redirectProblem(d({ source_path: 'old' }))).toMatch(/start with/);
    expect(redirectProblem(d({ source_path: '/old page' }))).toMatch(/spaces/);
    expect(redirectProblem(d({ source_path: '/old?x=1' }))).toMatch(/spaces/);
    expect(redirectProblem(d({ destination_path: '' }))).toMatch(/where/i);
    expect(redirectProblem(d({ destination_path: 'new' }))).toMatch(/start with/);
    expect(redirectProblem(d({ destination_path: '/old/' }))).toMatch(/itself/);
  });
});

describe('live check parser', () => {
  const html = `<html><head><title>My &amp; Page</title><meta name="description" content="Desc here" /><meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://acme.test/p" /><meta property="og:image" content="https://acme.test/i.png" />
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":"WebPage"}]}</script></head>
    <body><h1>Hello</h1><p>${'word '.repeat(80)}</p></body></html>`;
  it('reads what a crawler reads', () => {
    const r = inspectHtml(html);
    expect(r).toMatchObject({ title: 'My & Page', description: 'Desc here', canonical: 'https://acme.test/p', robots: 'index, follow', ogImage: 'https://acme.test/i.png', h1Count: 1, jsonLdBlocks: 1, hasPageCopy: true });
    expect(r.jsonLdTypes).toEqual(['Organization', 'WebPage']);
  });
  it('reports broken structured data and an empty shell', () => {
    const r = inspectHtml('<title>x</title><script type="application/ld+json">{oops</script><div id="root"></div>');
    expect(r.jsonLdErrors).toHaveLength(1);
    expect(r.hasPageCopy).toBe(false);
  });
});

describe('IndexNow', () => {
  it('makes a valid 32-character key', () => {
    const k = generateIndexNowKey();
    expect(isIndexNowKey(k)).toBe(true);
    expect(generateIndexNowKey()).not.toBe(k);
    expect(isIndexNowKey('ABC')).toBe(false);
  });
  it('only ever sends addresses on the site itself', () => {
    expect(ownUrls(['https://acme.test/a', 'https://acme.test/a#x', 'https://evil.test/a', 'http://acme.test/b', 'nonsense', 5], 'https://acme.test')).toEqual(['https://acme.test/a']);
    expect(ownUrls('nope', 'https://acme.test')).toEqual([]);
  });

  const KEY = 'a'.repeat(32);
  const res = () => {
    const r: any = { headers: {} as Record<string, string>, code: 0, body: '' };
    r.setHeader = (k: string, v: string) => { r.headers[k] = v; };
    r.status = (c: number) => { r.code = c; return r; };
    r.send = (b: string) => { r.body = b; return r; };
    r.end = () => r;
    return r;
  };
  const fakeNet = (admin: boolean, engine = 200) => {
    const calls: { url: string; body?: string }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: any) => {
      calls.push({ url: String(url), body: init?.body });
      const u = String(url);
      if (u.includes('/rest/v1/site_settings')) return new Response(JSON.stringify([{ key: 'seo', value: { siteUrl: 'https://acme.test' } }, { key: 'discovery', value: { indexnow: { key: KEY } } }]), { status: 200 });
      if (u.includes('/rpc/is_admin')) return new Response(JSON.stringify(admin), { status: 200 });
      if (u.includes('indexnow.org')) return new Response('', { status: engine });
      return new Response('{}', { status: 404 });
    }));
    return calls;
  };
  afterEach(() => vi.unstubAllGlobals());

  it('serves the key file only for the saved key', async () => {
    fakeNet(false);
    const ok = res(); await indexnow({ method: 'GET', query: { key: KEY }, headers: {} }, ok);
    expect(ok.code).toBe(200); expect(ok.body).toBe(KEY);
    const wrong = res(); await indexnow({ method: 'GET', query: { key: 'b'.repeat(32) }, headers: {} }, wrong);
    expect(wrong.code).toBe(404);
    const junk = res(); await indexnow({ method: 'GET', query: { key: '../x' }, headers: {} }, junk);
    expect(junk.code).toBe(404);
  });
  it('refuses to send for anyone who is not the admin', async () => {
    const calls = fakeNet(false);
    const r = res(); await indexnow({ method: 'POST', headers: { authorization: 'Bearer t' }, body: { urls: ['https://acme.test/a'] } }, r);
    expect(r.code).toBe(401);
    expect(calls.some((c) => c.url.includes('indexnow.org'))).toBe(false);
  });
  it('sends only the site’s own addresses, with the key', async () => {
    const calls = fakeNet(true);
    const r = res(); await indexnow({ method: 'POST', headers: { authorization: 'Bearer t' }, body: { urls: ['https://acme.test/a', 'https://evil.test/b'] } }, r);
    expect(r.code).toBe(200);
    const sent = JSON.parse(calls.find((c) => c.url.includes('indexnow.org'))!.body!);
    expect(sent).toMatchObject({ host: 'acme.test', key: KEY, keyLocation: `https://acme.test/${KEY}.txt`, urlList: ['https://acme.test/a'] });
  });
  it('reports a refusal from the search engine', async () => {
    fakeNet(true, 429);
    const r = res(); await indexnow({ method: 'POST', headers: { authorization: 'Bearer t' }, body: { urls: ['https://acme.test/a'] } }, r);
    expect(r.code).toBe(502);
  });
  it('says so when there are no valid addresses', async () => {
    fakeNet(true);
    const r = res(); await indexnow({ method: 'POST', headers: { authorization: 'Bearer t' }, body: { urls: ['https://evil.test/b'] } }, r);
    expect(r.code).toBe(400);
  });
});
