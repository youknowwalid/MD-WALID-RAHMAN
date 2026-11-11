import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { listRows } from '../lib/api';
import { normalizeBlogPost } from '../lib/schema-defaults';
import { BlogPost } from '../types';
import Seo from './Seo';
import Navbar from './Navbar';
import Footer from './Footer';

/** How many articles show at first, and how many more each "Load more" adds, so a very long list never floods the page. */
const PAGE_SIZE = 12;

/** Every article, newest first, with search. Each card opens that article's own page (/blog/...). */
export default function ArticlesPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await listRows('blogPosts', ['id', 'slug', 'title', 'date', 'excerpt', 'image']);
      if (cancelled) return;
      setPosts((rows ?? []).map(normalizeBlogPost));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
  }, [posts, query]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [query]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="home-v2 min-h-screen overflow-x-clip bg-bg-dark text-text-main relative z-10 ">
      <Seo title="Articles" description="Articles and insights on brand, marketing, web and AI by Walid Rahman." noindex={!loading && posts.length === 0} />
      <Navbar />

      <main className="min-h-[100svh] max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <a href="/#blog" className="mb-8 flex min-h-11 w-fit items-center text-xs font-semibold uppercase tracking-widest text-text-muted transition-colors hover:text-[color-mix(in_srgb,var(--color-accent)_55%,#000)]">
          ← Back to Portfolio
        </a>

        <div className="mb-12 flex flex-col justify-between gap-8 border-b border-border-subtle pb-12 lg:flex-row lg:items-end">
          <div>
            <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight text-text-main md:text-6xl">Articles</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              Everything I have written on brand, marketing, web and AI, newest first.
            </p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <span className="absolute inset-y-0 left-4 flex items-center text-text-muted"><Search className="h-4 w-4" aria-hidden="true" /></span>
            <input
              type="search"
              aria-label="Search articles"
              placeholder="Search articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-border-subtle bg-bg-card py-3.5 pl-11 pr-4 text-base font-medium text-text-main placeholder-[#5b6270] outline-none transition-all hover:bg-white focus:border-accent md:text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div role="status" aria-label="Loading articles" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} aria-hidden="true" className="h-56 animate-pulse rounded-3xl bg-bg-card motion-reduce:animate-none" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="py-24 text-center text-text-muted">New articles are on their way.</p>
        ) : filtered.length === 0 ? (
          <p className="py-24 text-center text-text-muted">No articles match "{query}".</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-text-muted" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((post, i) => (
                <article key={post.id || post.slug || post.title} className="group h-full">
                  <Link
                    to={`/blog/${post.slug || post.id}`}
                    className="flex h-full min-h-56 flex-col justify-between rounded-3xl border border-border-subtle bg-bg-card p-6 transition-all hover:-translate-y-1 hover:border-[#0d1117]/15"
                  >
                    <div>
                      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                        {post.date || String(i + 1).padStart(2, '0')}
                      </span>
                      <h2 className="mt-2 line-clamp-3 text-xl font-semibold leading-tight tracking-tight text-text-main">{post.title}</h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-snug text-text-muted">{post.excerpt}</p>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-text-main">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[#0d1117]" aria-hidden="true"><ArrowUpRight className="h-3.5 w-3.5" /></span>
                      Read article
                    </span>
                  </Link>
                </article>
              ))}
            </div>
            {visible < filtered.length && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="min-h-11 rounded-full border border-[#0d1117]/15 px-8 py-3 text-sm font-medium text-text-main transition-colors hover:bg-white hover:text-black"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
