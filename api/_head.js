// Turns the built app shell (index.html) into a finished page: the page's own title, description,
// canonical address, share tags and structured data are put into the HTML itself, so crawlers that never
// run JavaScript (Google's first pass, Bing, Facebook, LinkedIn, WhatsApp, X, AI search bots) see the right
// thing. Browsers then carry on exactly as before. Pure functions only; api/render.js does the fetching.
//
// Everything written here comes from the admin's saved content. The built-in defaults (src/lib/seo-defaults.json)
// are used only where the admin has saved nothing yet.
import seoDefaults from '../src/lib/seo-defaults.json' with { type: 'json' };
import { statText } from './_site.js';
import { buildGraph, canonicalPath, toScriptJson } from './_graph.js';
import { buildProjectsHubMain, buildServiceMain, buildServicesHubMain, chipKey, chipLinks } from './_services.js';

// The built-in defaults are the same file the app uses (src/lib/defaults.ts), so the two can never drift apart.
const DEFAULT_SEO = {
  defaultTitle: seoDefaults.defaultTitle,
  titleTemplate: seoDefaults.titleTemplate,
  defaultDescription: seoDefaults.defaultDescription,
  keywords: seoDefaults.keywords,
  siteName: seoDefaults.siteName,
  siteUrl: seoDefaults.siteUrl,
  twitterHandle: seoDefaults.twitterHandle,
  ogImage: seoDefaults.ogImage,
  robotsIndex: seoDefaults.robotsIndex,
};
// Same rule as the browser (SiteConfigContext): an empty saved value falls back to the default, except for these.
const SEO_ALLOW_EMPTY = ['ogImage', 'twitterHandle', 'titleTemplate'];

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function mergeSeo(saved) {
  const out = { ...DEFAULT_SEO };
  if (!saved || typeof saved !== 'object') return out;
  for (const key of Object.keys(DEFAULT_SEO)) {
    const v = saved[key];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '' && !SEO_ALLOW_EMPTY.includes(key)) continue;
    if (typeof v !== typeof DEFAULT_SEO[key]) continue;
    out[key] = v;
  }
  return out;
}

/** Which title, description and image a page shares with. Same choices as ProjectDetail.tsx / BlogDetail.tsx. */
export function pickPage(kind, row) {
  if (kind === 'blog') {
    return {
      title: row.social_title || row.title,
      description: row.social_description || row.excerpt,
      image: row.social_image || row.image,
      type: 'article',
      published: row.created_at,
      modified: row.updated_at,
      author: row.author,
      content: row.content,
    };
  }
  // The admin's bold / italic / alignment marks (see src/lib/richtext.ts) must not show up in a shared description.
  const plain = (t) => t
    .replace(/^\s*\[(?:left|justify|right)\][ \t]?/, '')
    .replace(LINK_RE, '$1')
    .replace(/\*\*\*(\S(?:[^*\n]*?\S)?)\*\*\*|\*\*(\S(?:[\s\S]*?\S)?)\*\*|\*(\S(?:[^*\n]*?\S)?)\*/g, (m, a, b, c) => a ?? b ?? c);
  const lead = (row.content || '').split(/\n\s*\n/).map((t) => plain(t.trim())).filter(Boolean)[0];
  return {
    title: row.social_title || row.title,
    description: row.social_description || row.summary || lead,
    image: row.social_image || row.hero_image || row.image,
    type: 'website',
  };
}

const absoluteImage = (url, base) => {
  const u = String(url || '').trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/') && !u.startsWith('//')) return base + u;
  return '';
};


const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const paragraphs = (v) => (typeof v === 'string' ? v.split(/\n\s*\n/).map(clean).filter(Boolean) : []);


/** [text](address): a page of this site ("/…") or an https:// address. Mirrors src/lib/richtext.ts. */
const LINK_RE = /\[([^\]\n]+)\]\((?:\/(?!\/)[^\s)]*|https:\/\/[^\s)]+)\)/g;

/** The admin's bold / italic / alignment / link marks removed: plain words only. */
export const stripMarks = (t) => String(t || '')
  .replace(/^\s*\[(?:left|justify|right|center)\][ \t]?/, '')
  .replace(LINK_RE, '$1')
  .replace(/\*\*\*(\S(?:[^*\n]*?\S)?)\*\*\*|\*\*(\S(?:[\s\S]*?\S)?)\*\*|\*(\S(?:[^*\n]*?\S)?)\*/g, (_m, a, b, c) => a ?? b ?? c);

/** An article's text as plain paragraphs (built only from the saved article). */
export const articleParagraphs = (content) => paragraphs(content).map((p) => clean(stripMarks(p))).filter(Boolean);

/** One paragraph as safe HTML: marks removed, and each [text](address) written as a real link. */
const linkedText = (p) => {
  const links = [];
  // Links are set aside first, so bold and italic marks around them are still removed cleanly.
  const marked = clean(String(p || '')).replace(new RegExp(LINK_RE.source, 'g'), (m, text) => {
    links.push({ text, url: /\]\(([^)]*)\)$/.exec(m)[1] });
    return `\u0001${links.length - 1}\u0001`;
  });
  return esc(stripMarks(marked))
    .replace(/\u0001(\d+)\u0001/g, (_m, i) => `<a href="${esc(links[+i].url)}">${esc(stripMarks(links[+i].text))}</a>`)
    .replace(/\s+/g, ' ').trim();
};

/** The plain-HTML copy of an article page for crawlers without JavaScript. */
export function buildArticleMain({ title, description, content, published }) {
  const out = [`<h1>${esc(clean(title))}</h1>`];
  const lead = clean(description);
  if (lead) out.push(`<p>${esc(lead)}</p>`);
  if (published) out.push(`<p><time datetime="${esc(String(published))}">${esc(String(published).slice(0, 10))}</time></p>`);
  for (const p of paragraphs(content)) out.push(`<p>${linkedText(p)}</p>`);
  return `<main id="static-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">\n      ${out.join('\n      ')}\n    </main>`;
}

/**
 * The plain-HTML copy of a page that crawlers without JavaScript read (the app replaces it when it starts).
 * Built only from saved content: a heading with nothing saved under it is not written.
 */
export function buildStaticMain({ seo, global, meta, description, faq = /** @type {{ question: string, answer: string }[]} */ ([]), services = /** @type {Record<string, any>[]} */ ([]) }) {
  const out = [];
  const name = clean(global?.sectionTitles?.heroName).replace(/[.\s]+$/, '') || seo.siteName;
  out.push(`<h1>${esc(name)}</h1>`);
  const lead = clean(meta?.tldr_summary) || description;
  if (lead) out.push(`<p>${esc(lead)}</p>`);

  const about = paragraphs(global?.aboutText);
  if (about.length) out.push(`<h2>About</h2>`, ...about.map((p) => `<p>${esc(p)}</p>`));

  const stats = (Array.isArray(global?.heroStats) ? global.heroStats : []).map(statText).filter(Boolean);
  if (stats.length) out.push('<h2>Key numbers</h2>', `<ul>${stats.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`);

  const groups = (Array.isArray(global?.capabilityGroups) ? global.capabilityGroups : [])
    .map((g) => ({ name: clean(g?.name), items: (Array.isArray(g?.items) ? g.items : []).map(clean).filter(Boolean) }))
    .filter((g) => g.items.length);
  if (groups.length) {
    out.push('<h2>What we do</h2>');
    // A chip that has a page of its own links to it (the same rule as the home page's chips).
    const links = chipLinks(services);
    const chip = (i) => (links[chipKey(i)] ? `<a href="${esc(links[chipKey(i)])}">${esc(i)}</a>` : esc(i));
    for (const g of groups) out.push(g.name ? `<h3>${esc(g.name)}</h3>` : '', `<ul>${g.items.map((i) => `<li>${chip(i)}</li>`).join('')}</ul>`);
  }

  const facts = (Array.isArray(meta?.quotable_facts) ? meta.quotable_facts : []).map((f) => clean(typeof f === 'string' ? f : f?.text)).filter(Boolean);
  if (facts.length) out.push('<h2>Key facts</h2>', `<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`);

  if (faq.length) {
    out.push('<h2>Frequently asked questions</h2>');
    for (const f of faq) out.push(`<h3>${esc(f.question)}</h3>`, `<p>${esc(f.answer)}</p>`);
  }

  const email = clean(global?.contactEmail);
  if (email) out.push('<h2>Contact</h2>', `<p>Email <a href="mailto:${esc(email)}">${esc(email)}</a>.</p>`);

  return `<main id="static-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">\n      ${out.filter(Boolean).join('\n      ')}\n    </main>`;
}

/** What a visitor with JavaScript switched off sees. */
export function buildNoscriptMain({ seo, global, description, heading = '' }) {
  const email = clean(global?.contactEmail);
  return `<main style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:96px 24px;line-height:1.6">
        <h1>${esc(heading || seo.siteName)}</h1>
        ${description ? `<p>${esc(description)}</p>` : ''}
        <p>This website needs JavaScript to display its full content.${email ? ` You can reach us at <a href="mailto:${esc(email)}">${esc(email)}</a>.` : ''}</p>
      </main>`;
}

/**
 * Returns the page's HTML: the template with this page's own head tags and structured data.
 *
 * @param {string} template the built app shell
 * @param {Record<string, any> | null | undefined} seoSettings site_settings.seo
 * @param {Record<string, any>} page { title, description, image, type, published, modified, author }
 * @param {string} path the page's path ("/" for home, "/blog/my-post", ...)
 * @param {{
 *   kind?: 'home' | 'blog' | 'project' | 'page' | 'service' | 'services' | 'projects',
 *   global?: Record<string, any>,
 *   discovery?: Record<string, any>,
 *   meta?: Record<string, any> | null,
 *   author?: Record<string, any> | null,
 *   noindex?: boolean,
 *   owned?: boolean,
 *   withBody?: boolean,
 *   services?: Record<string, any>[],
 *   service?: Record<string, any> | null,
 *   projects?: Record<string, any>[],
 * }} [extra]
 *   kind: what the page is; global / discovery: saved site settings; meta / author: the page's SEO row and author profile;
 *   noindex: keep this page out of search (private pages); owned: this head is final, the app must not rewrite it when it starts;
 *   withBody: also write the plain-HTML copy of the page (home).
 */
export function buildPageHtml(template, seoSettings, page, path, extra = {}) {
  if (!/<\/head>/i.test(template)) return template;
  const { global, discovery, meta, author, noindex = false, owned = false, withBody = false, services = [], service = null, projects = [] } = extra;
  const route0 = canonicalPath(path);
  const kind = extra.kind || (page.type === 'article' ? 'blog' : route0.startsWith('/projects/') ? 'project' : route0 === '/' ? 'home' : 'page');
  const seo = mergeSeo(seoSettings);
  const base = seo.siteUrl.replace(/\/+$/, '');
  const route = canonicalPath(path);
  const title = clean(meta?.meta_title)
    || (page.title
      ? (seo.titleTemplate.includes('%s') ? seo.titleTemplate.replace('%s', () => page.title) : `${page.title} | ${seo.siteName}`)
      : seo.defaultTitle);
  const description = String(clean(meta?.meta_description) || page.description || seo.defaultDescription).replace(/\s+/g, ' ').trim().slice(0, 300);
  const defaultImage = `${base}/og-image.png`;
  const image = absoluteImage(meta?.og_image_url, base) || absoluteImage(page.image, base) || absoluteImage(seo.ogImage, base) || defaultImage;
  const url = base + route;
  const canonical = /^https:\/\//i.test(clean(meta?.canonical_override)) ? clean(meta.canonical_override) : url;
  const closed = !seo.robotsIndex || noindex; // the whole site (or this private page) is kept out of search
  const index = !closed && meta?.robots_index !== false;
  const follow = !closed && meta?.robots_follow !== false;
  const robots = `${index ? 'index' : 'noindex'}, ${follow ? 'follow' : 'nofollow'}${index ? ', max-image-preview:large' : ''}`;
  const ogTitle = clean(meta?.og_title) || title;
  const ogDescription = clean(meta?.og_description) || description;
  const card = meta?.twitter_card === 'summary' ? 'summary' : 'summary_large_image';
  const language = clean(discovery?.entity?.language) || 'en';

  const meta_ = (attr, key, content) => `<meta ${attr}="${key}" content="${esc(content)}" />`;
  const verification = discovery?.verification || {};
  const hreflang = (Array.isArray(meta?.hreflang_alternates) ? meta.hreflang_alternates : [])
    .filter((a) => /^[a-zA-Z-]{2,12}$/.test(clean(a?.lang)) && /^https:\/\//i.test(clean(a?.url)))
    .map((a) => `<link rel="alternate" hreflang="${esc(clean(a.lang))}" href="${esc(clean(a.url))}" />`);
  const authorName = clean(author?.name) || clean(page.author) || seo.siteName;

  const tags = [
    `<title>${esc(title)}</title>`,
    meta_('name', 'description', description),
    meta_('name', 'robots', robots),
    meta_('name', 'author', authorName),
    ...(seo.keywords ? [meta_('name', 'keywords', seo.keywords)] : []),
    ...(clean(verification.google) ? [meta_('name', 'google-site-verification', clean(verification.google))] : []),
    ...(clean(verification.bing) ? [meta_('name', 'msvalidate.01', clean(verification.bing))] : []),
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${esc(seo.siteName)}" href="${esc(base)}/feed.xml" />`,
    ...hreflang,
    meta_('property', 'og:type', page.type || 'website'),
    meta_('property', 'og:site_name', seo.siteName),
    meta_('property', 'og:title', ogTitle),
    meta_('property', 'og:description', ogDescription),
    meta_('property', 'og:url', canonical),
    meta_('property', 'og:image', image),
    // Only the built-in image has known dimensions; for uploaded images the crawler measures them itself.
    ...(image === defaultImage
      ? [meta_('property', 'og:image:width', '1200'), meta_('property', 'og:image:height', '630')]
      : []),
    meta_('property', 'og:image:alt', ogTitle),
    meta_('name', 'twitter:card', card),
    meta_('name', 'twitter:title', ogTitle),
    meta_('name', 'twitter:description', ogDescription),
    meta_('name', 'twitter:image', image),
    ...(seo.twitterHandle ? [meta_('name', 'twitter:site', seo.twitterHandle)] : []),
  ].join('\n    ');

  const graph = buildGraph({
    site: base, seo, global, discovery, page, meta, author, url: canonical, path: route, kind, description, imageUrl: image, language,
  });
  // Pages kept out of search (private pages, 404s, a site switched off for search) get no structured data.
  const ldTag = closed ? '' : `<script type="application/ld+json" id="seo-jsonld-schema">${toScriptJson(graph)}</script>`;

  const faq = (Array.isArray(meta?.faq_items) ? meta.faq_items : [])
    .map((i) => ({ question: clean(i?.question), answer: clean(i?.answer) }))
    .filter((i) => i.question && i.answer);
  const staticMain = !withBody ? ''
    : kind === 'blog' ? buildArticleMain({ title: page.title, description, content: page.content, published: page.published })
    : kind === 'service' && service ? buildServiceMain({ service, tldr: meta?.tldr_summary, faq })
    : kind === 'services' ? buildServicesHubMain({ heading: page.title, intro: page.intro || '', services })
    : kind === 'projects' ? buildProjectsHubMain({ heading: page.title, projects })
    : buildStaticMain({ seo, global, meta, description, faq, services });
  // A page's own heading in the no-JavaScript view; with a plain copy of the page present, no second top heading.
  const ownHeading = ['blog', 'service', 'services', 'projects'].includes(kind) ? page.title : '';
  const noscriptMain = buildNoscriptMain({ seo, global, description, heading: ownHeading }).replace(staticMain ? /<h1>([\s\S]*?)<\/h1>/ : /$^/, '<p><strong>$1</strong></p>');

  let html = template
    .replace(/<script\b[^>]*\bid\s*=\s*["']aeo-jsonld-home[^"']*["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<main\b[^>]*\bid\s*=\s*["']static-content["'][^>]*>[\s\S]*?<\/main>\s*/i, () => (staticMain ? `${staticMain}\n    ` : ''))
    .replace(/(<noscript>[\s\S]*?)<main\b[\s\S]*?<\/main>/i, (_m, head) => `${head}${noscriptMain}`)
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\b[^>]*\b(?:name|property)\s*=\s*["'](?:description|robots|author|keywords|google-site-verification|msvalidate\.01|og:[^"']*|twitter:[^"']*)["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*\brel\s*=\s*["'](?:canonical|alternate)["'][^>]*>\s*/gi, '')
    // The template's own structured data describes the old home page; the graph below replaces it.
    .replace(/<script\b[^>]*\bid\s*=\s*["']seo-jsonld-schema["'][^>]*>[\s\S]*?<\/script>\s*/i, '')
    .replace(/<\/head>/i, () => `    ${tags}\n${ldTag ? `    ${ldTag}\n` : ''}  </head>`);
  if (owned) html = html.replace(/<html\b([^>]*)>/i, (_m, attrs) => `<html${attrs} data-ssr-path="${esc(route)}">`);
  return html;
}
