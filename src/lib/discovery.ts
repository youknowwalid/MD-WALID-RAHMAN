/**
 * Search & AI Discovery: the shapes the admin edits, the checks it shows, and the rules it enforces
 * before anything is saved. No names, claims or services are written here: every value comes from the admin.
 * (The server reads the same saved data in api/_graph.js, api/_head.js, api/robots.js and api/llms.js.)
 */

export const ENTITY_TYPES = ['Organization', 'Person', 'ProfessionalService', 'LocalBusiness'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** Saved under site_settings.discovery. */
export interface DiscoverySettings {
  entity: {
    type: EntityType;
    legalName: string;
    alternateName: string;
    foundingDate: string;
    logo: string;
    language: string;
    sameAs: string[];
    knowsAbout: string[];
    areaServed: string[];
  };
  /** Per AI crawler: 'allow' (default) or 'block'. */
  crawlers: Record<string, 'allow' | 'block'>;
  extraDisallow: string[];
  verification: { google: string; bing: string };
  indexnow: { key: string };
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const strList = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

export function normalizeDiscovery(raw: any): DiscoverySettings {
  const e = raw?.entity ?? {};
  const crawlers: DiscoverySettings['crawlers'] = {};
  for (const [bot, v] of Object.entries(raw?.crawlers ?? {})) if (String(v).toLowerCase() === 'block') crawlers[bot] = 'block';
  return {
    entity: {
      type: (ENTITY_TYPES as readonly string[]).includes(e.type) ? e.type : 'Organization',
      legalName: str(e.legalName),
      alternateName: str(e.alternateName),
      foundingDate: str(e.foundingDate),
      logo: str(e.logo),
      language: str(e.language),
      sameAs: strList(e.sameAs),
      knowsAbout: strList(e.knowsAbout),
      areaServed: strList(e.areaServed),
    },
    crawlers,
    extraDisallow: strList(raw?.extraDisallow),
    verification: { google: str(raw?.verification?.google), bing: str(raw?.verification?.bing) },
    indexnow: { key: str(raw?.indexnow?.key) },
  };
}

/** Textarea text <-> list: one item per line, blanks dropped. */
export const toLines = (list: string[]) => list.join('\n');
export const fromLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

// ───────────────────────── Pages ─────────────────────────

/** Pages that exist without an item behind them. The route key is what page_discovery_meta stores. */
export const FIXED_PAGES = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'services', label: 'Services', path: '/services' },
  { key: 'projects', label: 'Projects', path: '/projects' },
  { key: 'articles', label: 'Articles', path: '/articles' },
  { key: 'resources', label: 'Resources', path: '/resources' },
  { key: 'terms-of-service', label: 'Terms of Service', path: '/terms-of-service' },
  { key: 'privacy-policy', label: 'Privacy Policy', path: '/privacy-policy' },
  { key: 'refund-policy', label: 'Refund Policy', path: '/refund-policy' },
] as const;

export const SCHEMA_TYPES = ['WebPage', 'Article', 'BlogPosting', 'Service', 'Product', 'CaseStudy', 'AboutPage', 'ContactPage'] as const;
export type SchemaType = (typeof SCHEMA_TYPES)[number];

export interface FaqItem { question: string; answer: string }
export interface HowToStep { name: string; text: string }
export interface Hreflang { lang: string; url: string }

/** One row of page_discovery_meta, as the editor holds it. */
export interface PageMeta {
  meta_title: string;
  meta_description: string;
  canonical_override: string;
  robots_index: boolean;
  robots_follow: boolean;
  og_title: string;
  og_description: string;
  og_image_url: string;
  twitter_card: 'summary_large_image' | 'summary';
  focus_keyword: string;
  hreflang_alternates: Hreflang[];
  tldr_summary: string;
  faq_items: FaqItem[];
  howto_steps: HowToStep[];
  author_id: string | null;
  quotable_facts: string[];
  last_reviewed_at: string | null;
  schema_type: SchemaType;
  custom_json_ld: string;
}

export const emptyMeta = (): PageMeta => ({
  meta_title: '', meta_description: '', canonical_override: '', robots_index: true, robots_follow: true,
  og_title: '', og_description: '', og_image_url: '', twitter_card: 'summary_large_image', focus_keyword: '',
  hreflang_alternates: [], tldr_summary: '', faq_items: [], howto_steps: [], author_id: null,
  quotable_facts: [], last_reviewed_at: null, schema_type: 'WebPage', custom_json_ld: '',
});

/** Turns a saved row (or nothing) into editor values, filling blanks safely. */
export function normalizeMeta(row: any): PageMeta {
  const d = emptyMeta();
  if (!row || typeof row !== 'object') return d;
  const rows = <T,>(v: unknown, keep: (x: any) => T | null): T[] => (Array.isArray(v) ? v.map(keep).filter((x): x is T => x !== null) : []);
  return {
    ...d,
    meta_title: str(row.meta_title),
    meta_description: str(row.meta_description),
    canonical_override: str(row.canonical_override),
    robots_index: row.robots_index !== false,
    robots_follow: row.robots_follow !== false,
    og_title: str(row.og_title),
    og_description: str(row.og_description),
    og_image_url: str(row.og_image_url),
    twitter_card: row.twitter_card === 'summary' ? 'summary' : 'summary_large_image',
    focus_keyword: str(row.focus_keyword),
    hreflang_alternates: rows(row.hreflang_alternates, (x) => (x && typeof x === 'object' ? { lang: str(x.lang), url: str(x.url) } : null)),
    tldr_summary: str(row.tldr_summary),
    faq_items: rows(row.faq_items, (x) => (x && typeof x === 'object' ? { question: str(x.question), answer: str(x.answer) } : null)),
    howto_steps: rows(row.howto_steps, (x) => (x && typeof x === 'object' ? { name: str(x.name), text: str(x.text) } : null)),
    author_id: typeof row.author_id === 'string' && row.author_id ? row.author_id : null,
    quotable_facts: strList(row.quotable_facts),
    last_reviewed_at: typeof row.last_reviewed_at === 'string' && row.last_reviewed_at ? row.last_reviewed_at : null,
    schema_type: (SCHEMA_TYPES as readonly string[]).includes(row.schema_type) ? row.schema_type : 'WebPage',
    custom_json_ld: typeof row.custom_json_ld === 'string' ? row.custom_json_ld : '',
  };
}

/** What gets saved: half-filled FAQ / step / language rows are dropped, text is trimmed. Throws a plain-language message when something is not allowed. */
export function metaToRow(meta: PageMeta): Record<string, any> {
  const canonical = meta.canonical_override.trim();
  if (canonical && !/^https:\/\//i.test(canonical)) throw new Error('The canonical address must start with https://.');
  const custom = meta.custom_json_ld.trim();
  if (custom) {
    const problem = jsonLdProblem(custom);
    if (problem) throw new Error(problem);
  }
  const hreflang = meta.hreflang_alternates.map((a) => ({ lang: a.lang.trim(), url: a.url.trim() })).filter((a) => a.lang || a.url);
  for (const a of hreflang) {
    if (!/^[a-zA-Z-]{2,12}$/.test(a.lang)) throw new Error(`"${a.lang || '(empty)'}" is not a language code. Use something like en or bn-BD.`);
    if (!/^https:\/\//i.test(a.url)) throw new Error('Every language version needs a full address starting with https://.');
  }
  return {
    meta_title: meta.meta_title.trim(),
    meta_description: meta.meta_description.trim(),
    canonical_override: canonical,
    robots_index: meta.robots_index,
    robots_follow: meta.robots_follow,
    og_title: meta.og_title.trim(),
    og_description: meta.og_description.trim(),
    og_image_url: meta.og_image_url.trim(),
    twitter_card: meta.twitter_card,
    focus_keyword: meta.focus_keyword.trim(),
    hreflang_alternates: hreflang,
    tldr_summary: meta.tldr_summary.trim(),
    faq_items: meta.faq_items.map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })).filter((f) => f.question && f.answer),
    howto_steps: meta.howto_steps.map((s) => ({ name: s.name.trim(), text: s.text.trim() })).filter((s) => s.name && s.text),
    author_id: meta.author_id || null,
    quotable_facts: meta.quotable_facts.map((f) => f.trim()).filter(Boolean),
    last_reviewed_at: meta.last_reviewed_at || null,
    schema_type: meta.schema_type,
    custom_json_ld: custom,
  };
}

/** Plain-language reason the extra JSON-LD cannot be used, or '' when it is fine. */
export function jsonLdProblem(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  let parsed: unknown;
  try { parsed = JSON.parse(t); } catch { return 'The extra structured data is not valid JSON. Check the commas and quotation marks.'; }
  const list = Array.isArray(parsed) ? parsed : Array.isArray((parsed as any)?.['@graph']) ? (parsed as any)['@graph'] : [parsed];
  const usable = list.filter((n: any) => n && typeof n === 'object' && !Array.isArray(n) && typeof n['@type'] === 'string');
  if (!usable.length) return 'The extra structured data needs at least one item with an "@type" (for example "Service").';
  return '';
}

// ───────────────────────── The 0–100 audit ─────────────────────────

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'na';
export interface AuditCheck { id: string; label: string; status: CheckStatus; points: number; max: number; tip: string }
export interface AuditInput {
  meta: PageMeta;
  /** What the page would show without the admin's overrides (so the checks judge what visitors and crawlers really get). */
  fallbackTitle: string;
  fallbackDescription: string;
  /** Article pages need an author; other pages do not. */
  needsAuthor: boolean;
  hasDefaultShareImage: boolean;
  now?: Date;
}

const within = (n: number, lo: number, hi: number) => n >= lo && n <= hi;
const has = (hay: string, needle: string) => !!needle && hay.toLowerCase().includes(needle.toLowerCase());

export function auditPage({ meta, fallbackTitle, fallbackDescription, needsAuthor, hasDefaultShareImage, now = new Date() }: AuditInput): { score: number; checks: AuditCheck[] } {
  const title = meta.meta_title.trim() || fallbackTitle.trim();
  const description = meta.meta_description.trim() || fallbackDescription.trim();
  const keyword = meta.focus_keyword.trim();
  const faq = meta.faq_items.filter((f) => f.question.trim() && f.answer.trim());
  const tldr = meta.tldr_summary.trim();
  const facts = meta.quotable_facts.filter((f) => f.trim());
  const checks: AuditCheck[] = [];
  const add = (id: string, label: string, max: number, status: CheckStatus, tip: string, partial = 0) =>
    checks.push({ id, label, status, max: status === 'na' ? 0 : max, points: status === 'pass' ? max : status === 'warn' ? partial : 0, tip });

  add('title', 'Page title length', 10, within(title.length, 20, 65) ? 'pass' : title ? 'warn' : 'fail',
    title ? `${title.length} characters. Aim for 20 to 65 so Google shows it whole.` : 'No title yet.', 5);
  add('description', 'Description length', 10, within(description.length, 70, 170) ? 'pass' : description ? 'warn' : 'fail',
    description ? `${description.length} characters. Aim for 70 to 170.` : 'No description yet.', 5);
  add('keyword', 'Focus keyword chosen', 5, keyword ? 'pass' : 'fail', 'Pick the one phrase this page should be found for.');
  add('keyword-title', 'Keyword is in the title', 5, !keyword ? 'na' : has(title, keyword) ? 'pass' : 'fail', 'Use the focus keyword in the page title.');
  add('keyword-desc', 'Keyword is in the description', 5, !keyword ? 'na' : has(description, keyword) ? 'pass' : 'fail', 'Use the focus keyword in the description.');
  add('tldr', 'Short answer for AI (TL;DR)', 10, within(tldr.length, 40, 400) ? 'pass' : tldr ? 'warn' : 'fail',
    tldr ? `${tldr.length} characters. Two or three plain sentences (40 to 400 characters) are easiest for AI to quote.` : 'AI answers lean on a short, direct summary. Write one in your own words.', 5);
  add('faq', 'Questions and answers (FAQ)', 10, faq.length >= 3 ? 'pass' : faq.length >= 1 ? 'warn' : 'fail',
    faq.length ? `${faq.length} question${faq.length === 1 ? '' : 's'}. Three or more real questions your visitors ask work best.` : 'Add the questions visitors really ask, with honest answers.', 5);
  add('facts', 'Facts worth quoting', 5, facts.length >= 1 ? 'pass' : 'fail', 'One-line facts about your work that an AI can quote. Only add what is true and provable.');
  add('author', 'Named author', 10, !needsAuthor ? 'na' : meta.author_id ? 'pass' : 'fail', 'Articles with a real, named author earn more trust.');
  const reviewed = meta.last_reviewed_at ? new Date(meta.last_reviewed_at) : null;
  const ageDays = reviewed && !Number.isNaN(reviewed.getTime()) ? (now.getTime() - reviewed.getTime()) / 86_400_000 : Infinity;
  add('fresh', 'Reviewed in the last 12 months', 10, ageDays <= 365 ? 'pass' : reviewed ? 'warn' : 'fail',
    reviewed ? 'This page is due for a re-check. Update it, then set today as the review date.' : 'Set the date you last checked this page is still true.', 5);
  add('image', 'Share image', 5, meta.og_image_url.trim() || hasDefaultShareImage ? 'pass' : 'fail', 'Add an image so shared links look good.');
  add('json', 'Extra structured data is valid', 5, !meta.custom_json_ld.trim() ? 'na' : jsonLdProblem(meta.custom_json_ld) ? 'fail' : 'pass', 'Fix the extra structured data, or empty it.');
  add('index', 'Visible to search engines', 5, meta.robots_index ? 'pass' : 'warn', 'This page is set to stay out of search results.', 0);

  const max = checks.reduce((s, c) => s + c.max, 0);
  const got = checks.reduce((s, c) => s + c.points, 0);
  return { score: max ? Math.round((got / max) * 100) : 0, checks };
}

// ───────────────────────── Redirects ─────────────────────────

export interface RedirectDraft { source_path: string; destination_path: string; status_code: 301 | 302 | 410; is_active: boolean }

/**
 * The same rules the database enforces, so mistakes show up before saving.
 * Returns a plain-language problem, or '' when the redirect is fine.
 */
export function redirectProblem(d: RedirectDraft): string {
  const source = d.source_path.trim();
  const dest = d.destination_path.trim();
  if (!source) return 'Enter the old address, for example /old-page.';
  if (!source.startsWith('/')) return 'The old address must start with /.';
  if (source === '/') return 'The home page cannot be redirected.';
  if (/[?#\s]/.test(source)) return 'The old address cannot contain spaces, ? or #.';
  if (/^\/(api|admin)(\/|$)/.test(source)) return 'Addresses under /api and /admin cannot be redirected.';
  if (d.status_code === 410) return '';
  if (!dest) return 'Choose where visitors should be sent.';
  if (!/^(\/|https?:\/\/)/.test(dest)) return 'The new address must start with / or https://.';
  const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
  if (norm(source) === norm(dest)) return 'An address cannot redirect to itself.';
  return '';
}

// ───────────────────────── Live check ─────────────────────────

export interface HtmlReport {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogImage: string;
  h1Count: number;
  jsonLdBlocks: number;
  jsonLdTypes: string[];
  jsonLdErrors: string[];
  hasPageCopy: boolean;
}

/** Reads the tags a crawler sees in a page's HTML. */
export function inspectHtml(html: string): HtmlReport {
  const pick = (re: RegExp) => (html.match(re)?.[1] ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  const types: string[] = [];
  const errors: string[] = [];
  let blocks = 0;
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks += 1;
    try {
      const data = JSON.parse(m[1]);
      for (const node of Array.isArray(data?.['@graph']) ? data['@graph'] : [data]) {
        const t = node?.['@type'];
        if (t) types.push(Array.isArray(t) ? t.join('/') : String(t));
      }
    } catch {
      errors.push(`Structured data block ${blocks} is not valid JSON.`);
    }
  }
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  return {
    title: pick(/<title>([^<]*)<\/title>/i),
    description: pick(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i),
    canonical: pick(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
    robots: pick(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/i),
    ogImage: pick(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i),
    h1Count: (body.match(/<h1[\s>]/gi) ?? []).length,
    jsonLdBlocks: blocks,
    jsonLdTypes: types,
    jsonLdErrors: errors,
    hasPageCopy: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length > 200,
  };
}

// ───────────────────────── IndexNow ─────────────────────────

/** A new random IndexNow key: 32 lowercase hex characters (the file /<key>.txt must contain exactly this). */
export function generateIndexNowKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
export const isIndexNowKey = (k: string) => /^[a-f0-9]{32}$/.test(k);
