import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import handler, { requestedPath, routeOf } from '../../api/render.js';

// A tiny stand-in for the database, so the page renderer can be run end to end. Made-up data only.
const POST_ID = '11111111-1111-4111-8111-111111111111';
const PROJECT_ID = '22222222-2222-4222-8222-222222222222';
const SHELL = new URL('../../index.html', import.meta.url).pathname;

type Rows = Record<string, any[]>;
const base: () => Rows = () => ({
  site_settings: [
    { key: 'seo', value: { siteName: 'Acme Studio', siteUrl: 'https://acme.test', defaultDescription: 'Acme builds brands.' } },
    { key: 'global', value: { projectsHidden: false, contactEmail: 'hello@acme.test', founderName: 'Jane Doe' } },
  ],
  blog_posts: [{ id: POST_ID, slug: 'hello', title: 'Hello', excerpt: 'A first post.', image: '', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z', author: '' }],
  projects: [{ id: PROJECT_ID, slug: 'case', title: 'Case', summary: 'A case study.', content: '', hero_image: '', image: '' }],
  url_redirects: [
    { source_path: '/old', destination_path: '/articles', status_code: 301, is_active: true },
    { source_path: '/temp', destination_path: 'https://example.org/x', status_code: 302, is_active: true },
    { source_path: '/gone', destination_path: '', status_code: 410, is_active: true },
    { source_path: '/off', destination_path: '/articles', status_code: 301, is_active: false },
  ],
  page_discovery_meta: [
    { route_key: `blog:${POST_ID}`, meta_title: 'Custom post title', faq_items: [{ question: 'Why?', answer: 'Because.' }] },
    { route_key: 'home', tldr_summary: 'We build brands.' },
    { route_key: 'resources', meta_title: 'Our resources' },
  ],
  author_profiles: [],
});

let rows: Rows;
let calls: string[];
let realFetch: typeof fetch;
let failDatabase = false;

beforeEach(() => {
  rows = base();
  calls = [];
  failDatabase = false;
  process.env.APP_SHELL_FILE = SHELL;
  process.env.VITE_SUPABASE_URL = 'http://db.test';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = new URL(String(input));
    const table = url.pathname.split('/').pop() as string;
    calls.push(`${init?.method || 'GET'} ${table}`);
    if (failDatabase) return new Response('down', { status: 503 });
    if (init?.method === 'POST') return new Response(null, { status: 204 });
    let out = rows[table] || [];
    for (const [k, v] of url.searchParams) {
      const m = /^eq\.(.*)$/.exec(v);
      if (m) out = out.filter((r) => String(r[k]) === m[1]);
    }
    return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
});
afterEach(() => { globalThis.fetch = realFetch; });

async function run(path: string) {
  const out = { status: 200, headers: {} as Record<string, string>, body: '' };
  const res: any = {
    setHeader: (k: string, v: string) => { out.headers[k] = v; },
    status(c: number) { out.status = c; return this; },
    send(b: string) { out.body = String(b); return this; },
    end() { return this; },
  };
  await handler({ method: 'GET', query: { path }, url: '/api/render' } as any, res);
  return Object.assign(out, {
    title: /<title>([^<]*)<\/title>/.exec(out.body)?.[1],
    canonical: /rel="canonical" href="([^"]*)"/.exec(out.body)?.[1],
    robots: /name="robots" content="([^"]*)"/.exec(out.body)?.[1],
  });
}

describe('page renderer', () => {
  it('knows which addresses exist', () => {
    expect(routeOf('/').kind).toBe('home');
    expect(routeOf('/articles').kind).toBe('fixed');
    expect(routeOf('/blog/hello')).toEqual({ kind: 'blog', key: 'hello' });
    expect(routeOf('/projects/case')).toEqual({ kind: 'project', key: 'case' });
    expect(routeOf('/checkout/english').kind).toBe('private');
    expect(routeOf('/admin').kind).toBe('private');
    expect(routeOf('/nothing-here').kind).toBe('unknown');
  });

  it('reads the address from the rewrite, falling back to the request address', () => {
    expect(requestedPath({ query: { path: '/a/b' }, url: '/api/render?path=/a/b' } as any)).toBe('/a/b');
    expect(requestedPath({ query: {}, url: '/api/render' } as any)).toBe('/');
    expect(requestedPath({ query: {}, url: '/articles?x=1' } as any)).toBe('/articles');
  });

  it('serves the home page with the saved brand, the saved summary and one structured-data graph', async () => {
    const r = await run('/');
    expect(r.status).toBe(200);
    expect(r.canonical).toBe('https://acme.test/');
    expect(r.body).toContain('data-ssr-path="/"');
    expect(r.body).toContain('<h1>Acme Studio</h1>');
    expect(r.body).toContain('<p>We build brands.</p>');
    expect(r.body).toContain('#entity');
    expect((r.body.match(/application\/ld\+json/g) || []).length).toBe(1);
    expect(r.headers['Cache-Control']).toContain('s-maxage=300');
  });

  it('serves a blog post with its own tags, its SEO row and its FAQ', async () => {
    const r = await run('/blog/hello');
    expect(r.status).toBe(200);
    expect(r.title).toBe('Custom post title');
    expect(r.canonical).toBe('https://acme.test/blog/hello');
    expect(r.body).toContain('"FAQPage"');
    expect(r.body).toContain('"BreadcrumbList"');
  });

  it('serves a project with its own tags', async () => {
    const r = await run('/projects/case');
    expect(r.status).toBe(200);
    expect(r.body).toContain('A case study.');
    expect(r.body).toContain('data-ssr-path="/projects/case"');
  });

  it('hides projects (and does not index them) while the admin switch is on', async () => {
    rows.site_settings[1].value.projectsHidden = true;
    const r = await run('/projects/case');
    expect(r.status).toBe(200);
    expect(r.robots).toBe('noindex, nofollow');
    expect(r.headers['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(r.body).not.toContain('A case study.');
  });

  it('answers a real 404, not indexed, for addresses that do not exist', async () => {
    for (const p of ['/nothing-here', '/blog/missing', '/projects/missing']) {
      const r = await run(p);
      expect(r.status).toBe(404);
      expect(r.robots).toBe('noindex, nofollow');
    }
    expect((await run('/assets/old.js')).status).toBe(404);
    expect((await run('/api/anything')).status).toBe(404);
  });

  it('keeps private pages out of search and out of the cache', async () => {
    for (const p of ['/admin', '/thank-you', '/checkout/english']) {
      const r = await run(p);
      expect(r.status).toBe(200);
      expect(r.robots).toBe('noindex, nofollow');
      expect(r.headers['Cache-Control']).toBe('no-store');
    }
  });

  it('applies redirects the admin saved', async () => {
    const moved = await run('/old');
    expect(moved.status).toBe(301);
    expect(moved.headers.Location).toBe('/articles');
    const temp = await run('/temp');
    expect(temp.status).toBe(302);
    expect(temp.headers.Location).toBe('https://example.org/x');
    const gone = await run('/gone');
    expect(gone.status).toBe(410);
    expect(gone.headers['X-Robots-Tag']).toBe('noindex');
    expect(calls).toContain('POST record_redirect_hit');
  });

  it('ignores a switched-off redirect, and never redirects the home page', async () => {
    expect((await run('/off')).status).toBe(404);
    rows.url_redirects.push({ source_path: '/', destination_path: '/articles', status_code: 301, is_active: true });
    expect((await run('/')).status).toBe(200);
  });

  it('sends /blog to the articles page, like the app does', async () => {
    const r = await run('/blog');
    expect(r.status).toBe(301);
    expect(r.headers.Location).toBe('/articles');
  });

  it('treats a trailing slash and tracking parameters as the same page', async () => {
    const r = await run('/articles/?utm_source=x&fbclid=1');
    expect(r.canonical).toBe('https://acme.test/articles');
  });

  it('leaves other fixed pages to the app unless the admin wrote their tags', async () => {
    expect((await run('/articles')).body).not.toContain('data-ssr-path');
    const owned = await run('/resources');
    expect(owned.title).toBe('Our resources');
    expect(owned.body).toContain('data-ssr-path="/resources"');
  });

  it('serves the plain shell, uncached, when the database cannot be reached', async () => {
    failDatabase = true;
    const r = await run('/blog/hello');
    expect(r.status).toBe(200);
    expect(r.headers['Cache-Control']).toBe('no-store');
    expect(r.body).toContain('<div id="root">');
  });

  it('answers 405 to anything but GET and HEAD', async () => {
    const out: any = { headers: {} };
    const res: any = { setHeader: (k: string, v: string) => { out.headers[k] = v; }, status(c: number) { out.status = c; return this; }, end() { return this; } };
    await handler({ method: 'POST', query: {}, url: '/' } as any, res);
    expect(out.status).toBe(405);
  });
});
