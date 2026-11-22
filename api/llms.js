// Serves /llms.txt (see the rewrite in vercel.json): the plain-text summary AI assistants read.
// Built from the admin's saved settings at request time, so it always agrees with the site.
// Only values the admin has actually saved are listed; nothing is written here by hand.
import { descriptionOf, loadSettings, siteNameOf, siteUrlOf } from './_site.js';

const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

export function buildLlmsTxt(settings) {
  const site = siteUrlOf(settings);
  const global = settings?.global || {};
  const stats = (Array.isArray(global.heroStats) ? global.heroStats : [])
    .map((s) => [clean(s?.value) + (clean(s?.unit) ? ` ${clean(s.unit)}` : ''), clean(s?.label)].filter(Boolean).join(' '))
    .filter(Boolean);
  const specialities = (Array.isArray(global.capabilityGroups) ? global.capabilityGroups : [])
    .flatMap((g) => (Array.isArray(g?.items) ? g.items : []))
    .map(clean)
    .filter(Boolean);
  const email = clean(global.contactEmail);

  const lines = [`# ${siteNameOf(settings)}`, '', `> ${descriptionOf(settings)}${stats.length ? ` ${stats.join(', ')}.` : ''}`, ''];
  lines.push('## Pages', `- [Home](${site}/): about, specialities, journey, featured work and contact`, `- [Sitemap](${site}/sitemap.xml): all projects and blog posts`, '');
  if (specialities.length) lines.push('## Specialities', ...specialities.map((s) => `- ${s}`), '');
  if (email) lines.push('## Contact', `- ${email}`, '');
  return lines.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const settings = await loadSettings();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.status(200).send(buildLlmsTxt(settings));
}
