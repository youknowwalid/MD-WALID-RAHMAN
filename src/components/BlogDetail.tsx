
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowLeft, Calendar, User, Clock, Share2, Facebook, Linkedin, Twitter } from 'lucide-react';
import { getRow } from '../lib/api';
import { normalizeBlogPost } from '../lib/schema-defaults';
import { parseContent, readingMinutes } from '../lib/text';
import { BlogPost } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';
import NotFound from './NotFound';
import Seo from './Seo';

export default function BlogDetail() {
  const { blogId } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const row = blogId ? await getRow('blogPosts', blogId) : null;
      if (cancelled) return;
      setPost(row ? normalizeBlogPost(row) : null);
      setLoading(false);
    })();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [blogId]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const share = (network: 'twitter' | 'facebook' | 'linkedin') => {
    const u = encodeURIComponent(pageUrl);
    const t = encodeURIComponent(post?.title || '');
    const target = {
      twitter: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    }[network];
    window.open(target, '_blank', 'noopener,noreferrer');
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <m.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!post) return <NotFound />;

  const blocks = parseContent(post.content || '');
  // Article headings sit under the page's h1, so the first heading level used becomes an h2.
  const baseLevel = Math.min(4, ...blocks.flatMap((b) => (b.type === 'h' ? [b.level] : [])));

  return (
    <div className="min-h-screen bg-bg-dark text-text-main selection:bg-accent/30 selection:text-text-main">
      <Seo
        title={post.socialTitle || post.title}
        description={post.socialDescription || post.excerpt}
        image={post.socialImage || post.image}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.image || undefined,
          author: { '@type': 'Person', name: post.author || 'Walid Rahman' },
          datePublished: post.createdAt || undefined,
          dateModified: post.updatedAt || post.createdAt || undefined,
        }}
      />
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
           {/* Back link */}
           <Link to="/#blog" className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-12 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Journal
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-6 text-xs text-text-muted uppercase font-black mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                {post.author || 'Walid Rahman'}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                {readingMinutes(post.content || post.excerpt)} min read
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-8">
              {post.title}
            </h1>
            <p className="text-xl text-text-muted italic border-l-4 border-accent pl-6 mb-12">
              {post.excerpt}
            </p>
          </div>

          {/* Featured Image */}
          {post.image && <div className="rounded-[40px] overflow-hidden border border-white/10 mb-16 shadow-2xl relative aspect-[16/9]">
            <img src={post.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" fetchPriority="high" />
          </div>}

          {/* Content */}
          <div className="grid lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              <article className="max-w-none text-text-main text-lg leading-relaxed space-y-6">
                {blocks.length === 0 && <p>Content coming soon...</p>}
                {blocks.map((b, i) =>
                  b.type === 'h' ? (
                    b.level - baseLevel + 2 <= 2 ? <h2 key={i} className="text-3xl font-black mt-10">{b.text}</h2>
                    : b.level - baseLevel + 2 === 3 ? <h3 key={i} className="text-2xl font-black mt-8">{b.text}</h3>
                    : <h4 key={i} className="text-xl font-bold mt-6">{b.text}</h4>
                  ) : b.type === 'ul' ? (
                    <ul key={i} className="list-disc pl-6 space-y-2">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                  ) : (
                    <p key={i} className="whitespace-pre-wrap">{b.text}</p>
                  ),
                )}
              </article>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-12 pt-12 border-t border-border-subtle">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-4 py-1 bg-border-subtle rounded-full text-xs text-text-muted hover:text-accent transition-colors cursor-default">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-10">
              <div className="p-8 bg-bg-card rounded-3xl border border-white/5 sticky top-32">
                <h3 className="text-lg font-black mb-6">Share Article</h3>
                <div className="flex lg:flex-col gap-4">
                  {([['twitter', Twitter, 'Twitter'], ['facebook', Facebook, 'Facebook'], ['linkedin', Linkedin, 'LinkedIn']] as const).map(([net, Icon, label]) => (
                    <button key={net} type="button" onClick={() => share(net)} aria-label={`Share on ${label}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-accent hover:text-black transition-all group w-full">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                      <span className="text-xs font-bold hidden lg:inline">{label}</span>
                    </button>
                  ))}
                  <button type="button" onClick={copyLink} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-accent hover:text-black transition-all group w-full" aria-label="Copy link">
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                    <span className="text-xs font-bold hidden lg:inline" role="status">{copied ? 'Link copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
