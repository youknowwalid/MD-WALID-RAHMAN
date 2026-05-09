
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, User, Clock, Share2, Facebook, Linkedin, Twitter } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BlogPost } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  { 
    id: 'future-minimalism',
    title: 'The Future of Minimalism', 
    date: 'May 10, 2024', 
    excerpt: 'Exploring how minimalist design is evolving in the age of AI.', 
    image: 'https://picsum.photos/seed/blog1/800/500',
    content: 'Minimalism has long been a staple of modern design, but as we enter the age of Artificial Intelligence, the philosophy is undergoing a significant transformation. No longer just about "less is more," minimalism today is about "intentionality" and "relevance." AI allows designers to create interfaces that are hyper-personalized, removing unnecessary elements based on specific user contexts. In this post, we explore how cognitive load and data-driven design are shaping the next generation of minimalist aesthetics.\n\n### The Shift to Dynamic Interfaces\n\nUnlike static minimalism, where the designer makes a single set of choices for all users, dynamic minimalism uses real-time data to simplify what is currently onscreen. If a user is searching for a flight, the interface strips away promotions and secondary news to focus purely on the search filters and results.\n\n### Anticipatory Design\n\nThe most extreme form of AI minimalism is anticipatory design, where the interface almost disappears entirely because it predicts what you want to do next. This requires a deep understanding of user behavior and a brand that feels trustworthy and helpful rather than intrusive.',
    author: 'Walid Rahman',
    tags: ['Design', 'AI', 'Minimalism']
  },
  { 
    id: 'building-scalable-brands',
    title: 'Building Scalable Brands', 
    date: 'Apr 28, 2024', 
    excerpt: 'Key strategies for creating a brand that grows with your business.', 
    image: 'https://picsum.photos/seed/blog2/800/500',
    content: 'Scaling a brand requires more than just a great logo; it requires a modular system that can adapt to different markets, languages, and products without losing its core identity. We call this "Brand Elasticity." In this article, we break down the five pillars of brand scalability: Consistency, Adaptability, Documentation, Authenticity, and Scalable Visual Language. Learn how top tech brands manage to feel the same whether you are using their app on an iPhone or seeing a billboard in Tokyo.\n\n### Consistency is Key\n\nConsistency doesn\'t mean being identical everywhere. It means having a recognizable core—a "thread" that ties everything together. This thread could be a specific tone of voice, a unique motion pattern, or a specific way of using whitespace.',
    author: 'Walid Rahman',
    tags: ['Marketing', 'Branding', 'Business']
  },
];

export default function BlogDetail() {
  const { blogId } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!blogId) return;
        
        // Try Firestore by ID first
        const docRef = doc(db, 'blogPosts', blogId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
        } else {
          // Try looking up by slug
          const postsRef = collection(db, 'blogPosts');
          const q = query(postsRef, where('slug', '==', blogId), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            setPost({ id: firstDoc.id, ...firstDoc.data() } as BlogPost);
          } else {
            const localPost = DEFAULT_BLOG_POSTS.find(p => p.id === blogId || p.slug === blogId);
            setPost(localPost || null);
          }
        }
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [blogId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-6 p-6 text-white">
        <h1 className="text-4xl font-black">Article Not Found</h1>
        <Link to="/" className="text-accent hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white selection:bg-accent/30 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
           {/* Back link */}
           <Link to="/#blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent transition-colors mb-12 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Journal
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 uppercase font-black mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                {post.author || 'Admin'}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                5 min read
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-8">
              {post.title}
            </h1>
            <p className="text-xl text-gray-400 italic border-l-4 border-accent pl-6 mb-12">
              {post.excerpt}
            </p>
          </div>

          {/* Featured Image */}
          <div className="rounded-[40px] overflow-hidden border border-white/10 mb-16 shadow-2xl relative aspect-[16/9]">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              <article className="prose prose-invert prose-accent max-w-none">
                <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content || "Content coming soon..."}
                </div>
              </article>
              
              {/* Tags */}
              {post.tags && (
                <div className="flex flex-wrap gap-2 mt-12 pt-12 border-t border-white/5">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-4 py-1 bg-white/5 rounded-full text-xs text-gray-400 hover:text-accent transition-colors cursor-default">
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
                  <button className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-accent hover:text-black transition-all group w-full">
                    <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold hidden lg:inline">Twitter</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-accent hover:text-black transition-all group w-full">
                    <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold hidden lg:inline">Facebook</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-accent hover:text-black transition-all group w-full">
                    <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold hidden lg:inline">LinkedIn</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-accent hover:text-black transition-all group w-full">
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold hidden lg:inline">Copy Link</span>
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
