// Builds the structured data (JSON-LD) of a page as ONE linked graph.
//
// Rule: nothing here is written by hand about the owner. Every name, number, link and answer comes
// from what the admin saved (site settings, the page itself, the page's SEO/AEO/GEO row, the author
// profile). A piece of data that has no saved source is simply left out, never invented.
//
// Every node has a stable @id (site address + a fixed suffix) so search engines and AI systems can
// tell that the organisation on the home page and the publisher of an article are the same thing.

/** @typedef {Record<string, any>} Rec  a saved record: its fields are checked where they are read */

const text = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const isHttp = (v) => /^https?:\/\//i.test(v);
const unique = (list) => [...new Set(list.filter(Boolean))];

/** What the page is, as saved by the admin (page_discovery_meta.schema_type) -> schema.org type(s). */
const SCHEMA_TYPES = {
  WebPage: 'WebPage',
  AboutPage: 'AboutPage',
  ContactPage: 'ContactPage',
  Article: 'Article',
  BlogPosting: 'BlogPosting',
  Service: 'Service',
  Product: 'Product',
  CaseStudy: ['CreativeWork', 'WebPage'],
};

/** Ids of the nodes every page can point to. */
export const ids = (site) => ({
  entity: `${site}/#entity`,
  website: `${site}/#website`,
  founder: `${site}/#founder`,
  logo: `${site}/#logo`,
});

const image = (id, url) => (isHttp(url) ? { '@type': 'ImageObject', '@id': id, url } : null);

/** The brand itself: an Organization (default) or a Person, as chosen in the admin. */
function entityNode({ site, seo, global, discovery }) {
  const e = discovery?.entity || {};
  const type = ['Organization', 'Person', 'ProfessionalService', 'LocalBusiness'].includes(e.type) ? e.type : 'Organization';
  const links = unique([
    ...(Array.isArray(e.sameAs) ? e.sameAs.map(text) : []),
    ...(Array.isArray(global?.socialLinks) ? global.socialLinks.map((s) => text(s?.url)) : []),
  ]).filter(isHttp);
  const logoUrl = text(e.logo) || text(global?.siteLogo) || `${site}/apple-touch-icon.png`;
  const logo = image(ids(site).logo, logoUrl.startsWith('/') ? site + logoUrl : logoUrl);
  const email = text(global?.contactEmail);
  const knows = Array.isArray(e.knowsAbout) ? e.knowsAbout.map(text).filter(Boolean) : [];
  const founderName = text(global?.founderName);
  return {
    '@type': type,
    '@id': ids(site).entity,
    name: text(e.legalName) || seo.siteName,
    ...(text(e.alternateName) ? { alternateName: text(e.alternateName) } : {}),
    url: `${site}/`,
    ...(seo.defaultDescription ? { description: seo.defaultDescription } : {}),
    ...(logo ? { logo, image: logoUrl.startsWith('/') ? site + logoUrl : logoUrl } : {}),
    ...(email ? { email } : {}),
    ...(text(e.foundingDate) ? { foundingDate: text(e.foundingDate) } : {}),
    ...(links.length ? { sameAs: links } : {}),
    ...(knows.length ? { knowsAbout: knows } : {}),
    ...(Array.isArray(e.areaServed) && e.areaServed.length ? { areaServed: e.areaServed.map(text).filter(Boolean) } : {}),
    ...(type !== 'Person' && founderName ? { founder: { '@id': ids(site).founder } } : {}),
  };
}

function founderNode({ site, global }) {
  const name = text(global?.founderName);
  if (!name) return null;
  const role = text(global?.founderRole);
  return {
    '@type': 'Person',
    '@id': ids(site).founder,
    name,
    ...(role ? { jobTitle: role } : {}),
    worksFor: { '@id': ids(site).entity },
  };
}

/** [{question, answer}] saved in the admin. Entries missing either half are dropped. */
export function cleanFaq(items) {
  return (Array.isArray(items) ? items : [])
    .map((i) => ({ question: text(i?.question), answer: text(i?.answer) }))
    .filter((i) => i.question && i.answer);
}

/** [{name, text}] saved in the admin. */
export function cleanSteps(items) {
  return (Array.isArray(items) ? items : [])
    .map((i) => ({ name: text(i?.name), text: text(i?.text) }))
    .filter((i) => i.name && i.text);
}

/**
 * @param {object} a
 * @param {string} a.site       web address without a trailing slash
 * @param {Rec} a.seo           merged SEO settings (siteName, defaultDescription, ...)
 * @param {Rec} [a.global]      site_settings.global
 * @param {Rec} [a.discovery]   site_settings.discovery
 * @param {Rec} a.page          { title, description, image, type: 'website'|'article', published, modified, author }
 * @param {Rec | null} [a.meta]   the page's page_discovery_meta row
 * @param {Rec | null} [a.author] the page's author_profiles row
 * @param {string} a.url        the page's canonical address
 * @param {string} a.path       the page's path ("/" for home)
 * @param {'home'|'blog'|'project'|'page'} a.kind
 * @param {string} a.description the final meta description
 * @param {string} a.imageUrl   the final share image (absolute)
 * @param {string} [a.language]
 * @returns {{ '@context': string, '@graph': Rec[] }}
 */
export function buildGraph({ site, seo, global, discovery, page, meta, author, url, path, kind, description, imageUrl, language = 'en' }) {
  const id = ids(site);
  const graph = [entityNode({ site, seo, global, discovery })];
  const founder = founderNode({ site, global });
  // One person, one node: when the article's author is the founder (same name, in full or in short), the author
  // takes the founder's address and the separate founder node is not written.
  const norm = (v) => text(v).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const fName = norm(founder?.name);
  const aName = norm(author?.name);
  const authorIsFounder = Boolean(founder && author?.slug && fName && aName && (aName.includes(fName) || fName.includes(aName)));
  if (founder && !authorIsFounder && graph[0]['@type'] !== 'Person') graph.push(founder);

  graph.push({
    '@type': 'WebSite',
    '@id': id.website,
    url: `${site}/`,
    name: seo.siteName,
    ...(seo.defaultDescription ? { description: seo.defaultDescription } : {}),
    inLanguage: language,
    publisher: { '@id': id.entity },
  });

  const chosen = SCHEMA_TYPES[meta?.schema_type] ? meta.schema_type : null;
  const defaultType = kind === 'blog' ? 'Article' : kind === 'project' ? 'CreativeWork' : 'WebPage';
  const pageType = chosen ? SCHEMA_TYPES[chosen] : defaultType;
  const isArticle = pageType === 'Article' || pageType === 'BlogPosting';
  const pageId = `${url}#webpage`;
  const name = page.title || seo.siteName;
  const primaryImage = image(`${url}#primaryimage`, imageUrl);

  // Breadcrumbs: Home, the section the page lives in, the page.
  const crumbs = [{ name: 'Home', url: `${site}/` }];
  if (kind === 'blog') crumbs.push({ name: 'Articles', url: `${site}/articles` });
  if (kind === 'project') crumbs.push({ name: 'Projects', url: `${site}/#projects` });
  if (kind !== 'home') crumbs.push({ name, url });

  const authorId = authorIsFounder ? id.founder : author?.slug ? `${site}/#author-${author.slug}` : null;
  if (author?.slug && text(author.name)) {
    const same = Array.isArray(author.same_as) ? author.same_as.map(text).filter(isHttp) : [];
    const knows = Array.isArray(author.knows_about) ? author.knows_about.map(text).filter(Boolean) : [];
    graph.push({
      '@type': 'Person',
      '@id': authorId,
      name: text(author.name),
      ...(text(author.job_title) ? { jobTitle: text(author.job_title) } : {}),
      ...(text(author.short_bio) ? { description: text(author.short_bio) } : {}),
      ...(isHttp(text(author.avatar_url)) ? { image: text(author.avatar_url) } : {}),
      ...(same.length ? { sameAs: same } : {}),
      ...(knows.length ? { knowsAbout: knows } : {}),
      ...(authorIsFounder && fName !== aName ? { alternateName: text(founder.name) } : {}),
      worksFor: { '@id': id.entity },
    });
  }

  const articleText = isArticle && typeof page.content === 'string'
    ? page.content.replace(/\*\*\*|\*\*|\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 20000)
    : '';
  const reviewed = meta?.last_reviewed_at || null;
  const modified = page.modified || reviewed || page.published || null;
  const pageNode = {
    '@type': pageType,
    '@id': pageId,
    url,
    name,
    description,
    inLanguage: language,
    isPartOf: { '@id': id.website },
    ...(primaryImage ? { primaryImageOfPage: { '@id': primaryImage['@id'] }, image: { '@id': primaryImage['@id'] } } : {}),
    ...(kind === 'home' ? { about: { '@id': id.entity } } : {}),
    ...(page.published ? { datePublished: page.published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(kind !== 'home' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    ...(isArticle
      ? {
          headline: name,
          ...(articleText ? { articleBody: articleText, wordCount: articleText.split(/\s+/).length } : {}),
          mainEntityOfPage: { '@id': pageId },
          publisher: { '@id': id.entity },
          author: authorId ? { '@id': authorId } : { '@type': 'Person', name: text(page.author) || seo.siteName, url: `${site}/` },
        }
      : {}),
    ...(pageType === 'CreativeWork' ? { creator: { '@id': id.entity }, publisher: { '@id': id.entity } } : {}),
  };
  graph.push(pageNode);
  if (primaryImage) graph.push(primaryImage);

  if (kind !== 'home') {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
    });
  }

  const faq = cleanFaq(meta?.faq_items);
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      url,
      isPartOf: { '@id': pageId },
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    });
  }

  const steps = cleanSteps(meta?.howto_steps);
  if (steps.length) {
    graph.push({
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name,
      isPartOf: { '@id': pageId },
      step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
    });
  }

  // The admin's own extra JSON-LD: used only if it is valid JSON (an object, or a list of objects).
  const custom = parseCustom(meta?.custom_json_ld);
  graph.push(...custom);

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Parses the admin's custom JSON-LD. Returns a list of nodes; [] when empty or invalid. */
export function parseCustom(raw) {
  const t = text(typeof raw === 'string' ? raw.replace(/\s+/g, ' ') : '');
  if (!t) return [];
  try {
    const parsed = JSON.parse(t);
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
    return list
      .filter((n) => n && typeof n === 'object' && !Array.isArray(n) && typeof n['@type'] === 'string')
      .map((n) => {
        const { ['@context']: _ignored, ...rest } = n;
        return rest;
      });
  } catch {
    return [];
  }
}

/** JSON for a <script type="application/ld+json"> tag: "<" is escaped so the data can never close the tag. */
export const toScriptJson = (graph) => JSON.stringify(graph).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/** Removes tracking parameters and the trailing slash: the one address a page is known by. */
export function canonicalPath(pathname) {
  let p = String(pathname || '/').split(/[?#]/)[0];
  try { p = decodeURI(p); } catch { /* keep as is */ }
  p = ('/' + p).replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}
