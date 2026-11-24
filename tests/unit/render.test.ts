import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import handler, { requestedPath, routeOf } from '../../api/render.js';
import sitemapHandler from '../../api/sitemap.js';
import llmsHandler from '../../api/llms.js';
import { cleanServices as cleanServicesServer } from '../../api/_services.js';
import { cleanServices } from '../../src/lib/services';

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
    expect(routeOf('/products')).toEqual({ kind: 'redirect', to: '/resources' });
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

// ───────────────────────── Service pages and the Projects page ─────────────────────────
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const HIDDEN_ID = '44444444-4444-4444-8444-444444444444';
const savedServices = () => [
  {
    id: SERVICE_ID, slug: 'web-development', name: 'Web development', chip: 'Web & Software Development', summary: 'Fast custom websites.',
    headline: 'Web development agency in Dhaka', intro: 'First paragraph.\n\nSecond paragraph.', image: 'https://acme.test/web.jpg',
    included: ['Custom build', 'Launch support'], steps: [{ title: 'Talk', text: 'We talk first.' }],
  },
  { id: HIDDEN_ID, slug: 'hidden-one', name: 'Hidden one', hidden: true },
];

describe('service pages', () => {
  const globalRow = () => rows.site_settings.find((r) => r.key === 'global').value;
  beforeEach(() => {
    Object.assign(globalRow(), {
      servicesHeading: 'Our services', servicesIntro: 'What we do.',
      capabilityGroups: [{ name: 'Tech', short: 'T', items: ['Web & Software Development', 'Another chip'] }],
      servicePages: savedServices(),
    });
    rows.page_discovery_meta.push({
      route_key: `service:${SERVICE_ID}`, meta_title: 'Web development agency in Dhaka | Acme', tldr_summary: 'A short answer.',
      faq_items: [{ question: 'How long?', answer: 'It depends on the project.' }], schema_type: 'WebPage',
    });
  });

  it('knows the service addresses', () => {
    expect(routeOf('/services')).toEqual({ kind: 'services', key: 'services' });
    expect(routeOf('/services/web-development')).toEqual({ kind: 'service', key: 'web-development' });
    expect(routeOf('/projects')).toEqual({ kind: 'projects', key: 'projects' });
  });

  it('serves a service page with its own tags, text, questions and a Service in the structured data', async () => {
    const r = await run('/services/web-development');
    expect(r.status).toBe(200);
    expect(r.title).toBe('Web development agency in Dhaka | Acme');
    expect(r.canonical).toBe('https://acme.test/services/web-development');
    expect(r.body).toContain('data-ssr-path="/services/web-development"');
    expect(r.body).toContain('<h1>Web development agency in Dhaka</h1>');
    expect(r.body).toContain('<p>A short answer.</p>');
    expect(r.body).toContain('<p>First paragraph.</p>');
    expect(r.body).toContain('<li>Custom build</li>');
    expect(r.body).toContain('<h3>How long?</h3>');
    expect(r.body).toContain('"@type":"Service"');
    expect(r.body).toContain('"@type":"FAQPage"');
    expect(r.body).toContain('https://acme.test/services');
    expect(r.body).toContain('https://acme.test/web.jpg');
  });

  it('gives hidden and unknown services a real 404 that stays out of search', async () => {
    for (const path of ['/services/hidden-one', '/services/nothing']) {
      const r = await run(path);
      expect(r.status).toBe(404);
      expect(r.robots).toContain('noindex');
    }
  });

  it('serves the services list with a linked list of every visible service', async () => {
    const r = await run('/services');
    expect(r.status).toBe(200);
    expect(r.body).toContain('<h1>Our services</h1>');
    expect(r.body).toContain('<a href="/services/web-development">Web development</a>');
    expect(r.body).not.toContain('Hidden one');
    expect(r.body).toContain('"@type":"ItemList"');
    expect(r.body).toContain('"@type":"CollectionPage"');
  });

  it('has no services page at all while nothing is saved', async () => {
    globalRow().servicePages = [];
    expect((await run('/services')).status).toBe(404);
    expect((await run('/services/web-development')).status).toBe(404);
  });

  it('links the home page chip that has a page of its own', async () => {
    const r = await run('/');
    expect(r.body).toContain('<a href="/services/web-development">Web &amp; Software Development</a>');
    expect(r.body).toContain('<li>Another chip</li>');
  });

  it('keeps the services page and Projects page rules apart: projects stay hidden until the switch is off', async () => {
    globalRow().projectsHidden = true;
    const hidden = await run('/projects');
    expect(hidden.robots).toContain('noindex');
    globalRow().projectsHidden = false;
    const shown = await run('/projects');
    expect(shown.robots).toMatch(/^index/);
    expect(shown.canonical).toBe('https://acme.test/projects');
    expect(shown.body).toContain('<a href="/projects/case">Case</a>');
    expect(shown.body).toContain('"@type":"CollectionPage"');
  });

  it('breadcrumbs a project through the Projects page, not a section of the home page', async () => {
    const r = await run('/projects/case');
    expect(r.body).toContain('https://acme.test/projects');
    expect(r.body).not.toContain('/#projects');
  });

  async function fetchText(h: any, query: any = {}) {
    const out = { body: '' };
    const res: any = { setHeader() {}, status() { return this; }, send(b: string) { out.body = String(b); return this; }, end() { return this; } };
    await h({ method: 'GET', query, url: '/x', headers: { host: 'acme.test' } } as any, res);
    return out.body;
  }

  it('lists the services in the sitemap, and the projects page only while projects are shown', async () => {
    globalRow().projectsHidden = true;
    let xml = await fetchText(sitemapHandler);
    expect(xml).toContain('<loc>https://acme.test/services</loc>');
    expect(xml).toContain('<loc>https://acme.test/services/web-development</loc>');
    expect(xml).not.toContain('hidden-one');
    expect(xml).not.toContain('<loc>https://acme.test/projects</loc>');
    globalRow().projectsHidden = false;
    xml = await fetchText(sitemapHandler);
    expect(xml).toContain('<loc>https://acme.test/projects</loc>');
  });

  it('leaves a service out of the sitemap when the admin switched it off for search', async () => {
    rows.page_discovery_meta.find((m) => m.route_key === `service:${SERVICE_ID}`).robots_index = false;
    const xml = await fetchText(sitemapHandler);
    expect(xml).not.toContain('/services/web-development');
  });

  it('links every service in llms.txt', async () => {
    const txt = await fetchText(llmsHandler);
    expect(txt).toContain('## Services');
    expect(txt).toContain('[Web development](https://acme.test/services/web-development): A short answer.');
    const full = await fetchText(llmsHandler, { full: '1' });
    expect(full).toContain('How long?');
  });

  it('reads the saved services the same way in the app and on the server', () => {
    const saved = [...savedServices(), { id: 'not-a-uuid', slug: 'x', name: 'X' }, { id: SERVICE_ID, slug: 'web-development', name: 'Duplicate' }, null, 'text'];
    expect(cleanServicesServer(saved)).toEqual(cleanServices(saved));
    expect(cleanServices(saved).map((x) => x.slug)).toEqual(['web-development']);
    expect(cleanServices(saved, { includeHidden: true }).map((x) => x.slug)).toEqual(['web-development', 'hidden-one']);
  });
});
