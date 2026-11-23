// Serves /robots.txt (see the rewrite in vercel.json), built from the admin's saved settings:
//   - the web address for the Sitemap line comes from the saved SEO settings,
//   - "Let search engines find this site" off => everything is blocked,
//   - each AI crawler can be allowed or blocked in the admin (Search & AI Discovery > Crawlers).
// By default every crawler is allowed and only the private areas are blocked.
import { loadSettings, siteUrlOf } from './_site.js';

/** Well-known crawlers of AI search and assistants. The admin chooses allow / block for each; the default is allow. */
export const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot',
];
/** Private areas, never crawled. */
export const PRIVATE_PATHS = ['/admin', '/thank-you', '/checkout/', '/api/'];

const isBlocked = (settings, bot) => String(settings?.discovery?.crawlers?.[bot] || '').toLowerCase() === 'block';

export function buildRobotsTxt(settings, req) {
  const site = siteUrlOf(settings, req);
  if (settings?.seo?.robotsIndex === false) {
    return `User-agent: *\nDisallow: /\n\nSitemap: ${site}/sitemap.xml\n`;
  }
  const extra = (Array.isArray(settings?.discovery?.extraDisallow) ? settings.discovery.extraDisallow : [])
    .map((p) => String(p).trim())
    .filter((p) => /^\/[^\s#]*$/.test(p) && p !== '/');
  const rules = ['Allow: /', ...[...PRIVATE_PATHS, ...extra].map((p) => `Disallow: ${p}`)];
  const allowed = AI_CRAWLERS.filter((b) => !isBlocked(settings, b));
  const blocked = AI_CRAWLERS.filter((b) => isBlocked(settings, b));
  const groups = [[['*', ...allowed].map((u) => `User-agent: ${u}`).join('\n'), ...rules].join('\n')];
  for (const b of blocked) groups.push(`User-agent: ${b}\nDisallow: /`);
  return `${groups.join('\n\n')}\n\nSitemap: ${site}/sitemap.xml\n`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const settings = await loadSettings();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.status(200).send(buildRobotsTxt(settings, req));
}
