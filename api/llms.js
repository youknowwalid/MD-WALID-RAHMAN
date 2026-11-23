// Serves /llms.txt and /llms-full.txt (see the rewrites in vercel.json): the plain-text summary AI assistants read.
// Built from the admin's saved content at request time, so it always agrees with the site.
// Only things the admin has actually saved are listed; nothing is written here by hand.
//   /llms.txt       short index: summary, pages, articles, projects
//   /llms-full.txt  the same with the answers: about text, key facts, FAQs, article and project summaries
// Both are Markdown, and both ask search engines not to index the file itself (the pages are what should rank).
import { cleanFaq } from './_graph.js';
import { descriptionOf, loadSettings, rest, siteNameOf, siteUrlOf, statText } from './_site.js';

const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const paragraphs = (v) => (typeof v === 'string' ? v.split(/\n\s*\n/).map(clean).filter(Boolean) : []);

/**
 * @param {object} settings site_settings by key
 * @param {{ posts?: object[], projects?: object[], meta?: Record<string, object> }} [data] published content and the pages' SEO rows
 * @param {boolean} [full] include the answers (llms-full.txt)
 */
export function buildLlmsTxt(settings, data = {}, full = false) {
  const site = siteUrlOf(settings);
  const global = settings?.global || {};
  const meta = data.meta || {};
  const home = meta.home || {};
  const stats = (Array.isArray(global.heroStats) ? global.heroStats : []).map(statText).filter(Boolean);
  const specialities = (Array.isArray(global.capabilityGroups) ? global.capabilityGroups : [])
    .flatMap((g) => (Array.isArray(g?.items) ? g.items : []))
    .map(clean)
    .filter(Boolean);
  const email = clean(global.contactEmail);
  const listed = (kind, rows) =>
    (rows || []).filter((r) => meta[`${kind}:${r.id}`]?.robots_index !== false);
  const posts = listed('blog', data.posts);
  const projects = listed('project', data.projects);

  const lead = clean(home.tldr_summary) || descriptionOf(settings);
  const lines = [`# ${siteNameOf(settings)}`, '', `> ${lead}${stats.length ? ` ${stats.join(', ')}.` : ''}`, ''];

  if (full) {
    const about = paragraphs(global.aboutText);
    if (about.length) lines.push('## About', '', ...about.flatMap((p) => [p, '']));
    const facts = (Array.isArray(home.quotable_facts) ? home.quotable_facts : []).map((f) => clean(typeof f === 'string' ? f : f?.text)).filter(Boolean);
    if (facts.length) lines.push('## Key facts', ...facts.map((f) => `- ${f}`), '');
  }

  lines.push('## Pages', `- [Home](${site}/): about, specialities, journey, featured work and contact`);
  if (posts.length) lines.push(`- [Articles](${site}/articles): all articles`);
  lines.push(`- [Sitemap](${site}/sitemap.xml): every page`);
  if (!full) lines.push(`- [Full version](${site}/llms-full.txt): the same with answers and summaries`);
  lines.push('');

  if (specialities.length) lines.push('## Specialities', ...specialities.map((s) => `- ${s}`), '');

  if (full) {
    const faq = cleanFaq(home.faq_items);
    if (faq.length) lines.push('## Frequently asked questions', '', ...faq.flatMap((f) => [`### ${f.question}`, f.answer, '']));
  }

  if (posts.length) {
    lines.push('## Articles');
    for (const p of posts) {
      const m = meta[`blog:${p.id}`] || {};
      const summary = clean(m.tldr_summary) || clean(m.meta_description) || clean(p.social_description) || clean(p.excerpt);
      lines.push(`- [${clean(p.title)}](${site}/blog/${encodeURIComponent(p.slug || p.id)})${summary ? `: ${summary}` : ''}`);
    }
    lines.push('');
  }
  if (projects.length) {
    lines.push('## Projects');
    for (const p of projects) {
      const m = meta[`project:${p.id}`] || {};
      const summary = clean(m.tldr_summary) || clean(m.meta_description) || clean(p.summary);
      lines.push(`- [${clean(p.title)}](${site}/projects/${encodeURIComponent(p.slug || p.id)})${summary ? `: ${summary}` : ''}`);
    }
    lines.push('');
  }
  if (email) lines.push('## Contact', `- ${email}`, '');
  return lines.join('\n');
}

const safe = async (p, fallback) => { try { return await p; } catch { return fallback; } };

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const full = req.query?.full === '1';
  const settings = await loadSettings();
  const projectsVisible = settings?.global?.projectsHidden === false;
  const [posts, projects, metaRows] = await Promise.all([
    safe(rest('blog_posts?select=id,slug,title,excerpt,social_description&order=created_at.desc&limit=200'), []),
    projectsVisible ? safe(rest('projects?select=id,slug,title,summary&order=created_at.desc&limit=200'), []) : [],
    safe(rest('page_discovery_meta?select=route_key,tldr_summary,meta_description,faq_items,quotable_facts,robots_index&limit=1000'), []),
  ]);
  const meta = {};
  for (const row of metaRows) if (row?.route_key) meta[row.route_key] = row;
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, follow');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.status(200).send(buildLlmsTxt(settings, { posts, projects, meta }, full));
}
