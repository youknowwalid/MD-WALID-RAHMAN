// Service pages on the server: reads what the admin saved (site_settings.global.servicePages) and writes the
// plain-HTML copy of the /services pages for crawlers. The same rules as src/lib/services.ts (a test keeps them equal).
// Nothing is written here by hand: no service, no wording. With nothing saved there are no service pages.

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const lines = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Splits text on blank lines into plain paragraphs. */
export const paragraphsOf = (v) => (typeof v === 'string' ? v.split(/\n\s*\n/).map(clean).filter(Boolean) : []);
export const chipKey = (s) => str(s).toLowerCase().replace(/\s+/g, ' ');

/**
 * Saved list -> clean list of visible services. Entries without a valid id, web-address name and title are dropped.
 * @param {unknown} raw
 * @returns {Record<string, any>[]}
 */
export function cleanServices(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const o of raw) {
    if (!o || typeof o !== 'object') continue;
    const s = {
      id: str(o.id), slug: str(o.slug), name: str(o.name), chip: str(o.chip), summary: str(o.summary), headline: str(o.headline),
      intro: str(o.intro), image: str(o.image), included: lines(o.included),
      steps: (Array.isArray(o.steps) ? o.steps : []).map((x) => ({ title: str(x?.title), text: str(x?.text) })).filter((x) => x.title && x.text),
      ctaTitle: str(o.ctaTitle), ctaButton: str(o.ctaButton), ctaUrl: str(o.ctaUrl), hidden: o.hidden === true,
    };
    if (!isUuid(s.id) || !SLUG_RE.test(s.slug) || !s.name || s.hidden || seen.has(s.slug)) continue;
    seen.add(s.slug);
    out.push(s);
  }
  return out;
}

/** chip text -> page address, for the home page's chips that have a page of their own. */
export function chipLinks(services) {
  const out = {};
  for (const s of services) if (s.chip) out[chipKey(s.chip)] = `/services/${s.slug}`;
  return out;
}

const HIDDEN_STYLE = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const wrap = (parts) => `<main id="static-content" style="${HIDDEN_STYLE}">\n      ${parts.filter(Boolean).join('\n      ')}\n    </main>`;

/** The plain-HTML copy of one service page. */
export function buildServiceMain({ service, tldr = '', faq = [] }) {
  const out = [`<h1>${esc(service.headline || service.name)}</h1>`];
  const lead = clean(tldr) || service.summary;
  if (lead) out.push(`<p>${esc(lead)}</p>`);
  for (const p of paragraphsOf(service.intro)) out.push(`<p>${esc(p)}</p>`);
  if (service.included.length) out.push(`<h2>What is included</h2>`, `<ul>${service.included.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  if (service.steps.length) {
    out.push('<h2>How it works</h2>', `<ol>${service.steps.map((s) => `<li><strong>${esc(s.title)}</strong> ${esc(s.text)}</li>`).join('')}</ol>`);
  }
  if (faq.length) {
    out.push('<h2>Questions and answers</h2>');
    for (const f of faq) out.push(`<h3>${esc(f.question)}</h3>`, `<p>${esc(f.answer)}</p>`);
  }
  out.push('<p><a href="/services">All services</a></p>');
  return wrap(out);
}

/** The plain-HTML copy of the /services page. */
export function buildServicesHubMain({ heading, intro, services }) {
  const out = [`<h1>${esc(heading)}</h1>`];
  for (const p of paragraphsOf(intro)) out.push(`<p>${esc(p)}</p>`);
  out.push(`<ul>${services.map((s) => `<li><a href="/services/${esc(s.slug)}">${esc(s.name)}</a>${s.summary ? `: ${esc(s.summary)}` : ''}</li>`).join('')}</ul>`);
  return wrap(out);
}

/** The plain-HTML copy of the /projects page. */
export function buildProjectsHubMain({ heading, projects }) {
  const out = [`<h1>${esc(heading)}</h1>`];
  if (projects.length) {
    out.push(`<ul>${projects.map((p) => `<li><a href="/projects/${esc(encodeURIComponent(p.slug || p.id))}">${esc(clean(p.title))}</a>${clean(p.summary) ? `: ${esc(clean(p.summary))}` : ''}</li>`).join('')}</ul>`);
  }
  return wrap(out);
}
