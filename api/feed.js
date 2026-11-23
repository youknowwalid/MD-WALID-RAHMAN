// Serves /feed.xml (see the rewrite in vercel.json): an RSS 2.0 list of the published articles, newest first.
// Built only from what the admin saved. Feed readers, news aggregators and some AI tools read it to find new posts.
import { loadSettings, rest, siteNameOf, siteUrlOf, descriptionOf } from './_site.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const rfc822 = (d) => { const t = new Date(d); return Number.isNaN(t.getTime()) ? '' : t.toUTCString(); };

/** The feed's XML for the given posts (rows from blog_posts, newest first). */
export function buildFeed({ site, name, description, posts, authorName = '' }) {
  const items = posts
    .filter((p) => clean(p.slug) && clean(p.title))
    .map((p) => {
      const link = `${site}/blog/${encodeURIComponent(p.slug)}`;
      const pub = rfc822(p.created_at);
      const by = clean(authorName) || clean(p.author);
      return [
        '    <item>',
        `      <title>${esc(clean(p.title))}</title>`,
        `      <link>${esc(link)}</link>`,
        `      <guid isPermaLink="true">${esc(link)}</guid>`,
        pub ? `      <pubDate>${pub}</pubDate>` : '',
        clean(p.excerpt) ? `      <description>${esc(clean(p.excerpt))}</description>` : '',
        by ? `      <dc:creator>${esc(by)}</dc:creator>` : '',
        '    </item>',
      ].filter(Boolean).join('\n');
    })
    .join('\n');
  const newest = posts.map((p) => rfc822(p.updated_at || p.created_at)).find(Boolean);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(name)}</title>
    <link>${esc(site)}/articles</link>
    <description>${esc(description || name)}</description>
    <language>en</language>
${newest ? `    <lastBuildDate>${newest}</lastBuildDate>\n` : ''}    <atom:link href="${esc(site)}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  try {
    const settings = await loadSettings();
    const site = siteUrlOf(settings, req);
    const [posts, authors] = await Promise.all([
      rest('blog_posts?select=slug,title,excerpt,author,created_at,updated_at&order=created_at.desc&limit=50'),
      rest('author_profiles?select=name&order=created_at.asc&limit=1').catch(() => []),
    ]);
    const xml = buildFeed({ site, name: siteNameOf(settings), description: descriptionOf(settings), posts, authorName: authors[0]?.name || '' });
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('feed failed:', err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).send('Temporarily unavailable');
  }
}
