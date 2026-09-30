
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, getCollection } from '../services/firebase';
import { Project } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';

// Fallback data if not in DB
const DEFAULT_PROJECTS: Project[] = [
  { 
    id: 'nexus-brand',
    title: 'Nexus Brand Identity', 
    category: 'Branding', 
    image: 'https://picsum.photos/seed/nexus/800/600', 
    link: '#',
    content: 'Nexus is a revolutionary brand identity project that focused on bridging the gap between corporate rigidity and creative fluidity. We developed a comprehensive design system that includes a dynamic logo, custom typography, and a vibrant color palette that scales across multi-channel touchpoints.',
    tags: ['Branding', 'Identity', 'Strategy']
  },
  { 
    id: 'volt-ecommerce',
    title: 'Volt E-Commerce', 
    category: 'Web App', 
    image: 'https://picsum.photos/seed/volt/800/600', 
    link: '#',
    content: 'The Volt E-Commerce platform was built to solve the performance bottlenecks of traditional online stores. Using a headless architecture, we achieved sub-second page loads and a conversion rate increase of 45%. The project involved complex integrations with inventory systems and custom payment gateways.',
    tags: ['E-Commerce', 'Next.js', 'Headless']
  },
  { 
    id: 'lumina-dashboard',
    title: 'Lumina Dashboard', 
    category: 'UI/UX', 
    image: 'https://picsum.photos/seed/lumina/800/600', 
    link: '#',
    content: 'Lumina is a data visualization dashboard designed for energy sector executives. The challenge was to transform massive amounts of real-time data into actionable insights through an intuitive and aesthetically pleasing interface. We utilized D3.js for custom visualizations and focused heavily on user centered design principles.',
    tags: ['UI/UX', 'Dashboard', 'Data Viz']
  },
  { 
    id: 'orbit-marketing',
    title: 'Orbit Marketing', 
    category: 'Social Media', 
    image: 'https://picsum.photos/seed/orbit/800/600', 
    link: '#',
    content: 'Orbit is a social media marketing campaign that leveraged the power of community and storytelling. We created a series of high-impact visuals and videos that resulted in a 300% increase in engagement for our client. The strategy focused on cross-platform consistency and authentic brand voice.',
    tags: ['Marketing', 'Social', 'Campaign']
  },
];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>(DEFAULT_PROJECTS);

  // Sibling projects (same ordering as the listing) for prev / next navigation
  useEffect(() => {
    getCollection('projects')
      .then(docs => { if (docs && docs.length > 0) setAllProjects(docs as Project[]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!projectId) return;
        
        // Try Firestore by ID first
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() } as Project);
        } else {
          // If not found by ID, try looking up by slug
          const projectsRef = collection(db, 'projects');
          const q = query(projectsRef, where('slug', '==', projectId), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            setProject({ id: firstDoc.id, ...firstDoc.data() } as Project);
          } else {
            // Fallback to local defaults
            const localProject = DEFAULT_PROJECTS.find(p => p.id === projectId || p.slug === projectId);
            setProject(localProject || null);
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    window.scrollTo(0, 0);
  }, [projectId]);

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

  if (!project) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-4xl font-black text-text-main">Project Not Found</h1>
        <Link to="/" className="text-accent hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const projectPath = (p: Project) => `/projects/${p.slug || p.id || p.title.toLowerCase().replace(/\s+/g, '-')}`;

  // Overview: first paragraph is the lead, the remainder is body copy
  const paragraphs = (project.content || '').split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
  const [lead, ...rest] = paragraphs;

  // Published date from existing createdAt field (Firestore Timestamp or string)
  const created = project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt ? new Date(project.createdAt) : null;
  const published = created && !isNaN(created.getTime())
    ? created.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const hasLink = !!project.link && project.link !== '#';
  const tags = project.tags || [];
  const gallery = (project.gallery || []).filter(Boolean);

  // Editorial rhythm: two-up, full-width, two-up, full-width...
  const galleryRows: { img: string; n: number }[][] = [];
  for (let i = 0, pair = true; i < gallery.length; pair = !pair) {
    const take = pair && i + 1 < gallery.length ? 2 : 1;
    galleryRows.push(gallery.slice(i, i + take).map((img, k) => ({ img, n: i + k + 1 })));
    i += take;
  }

  const currentIndex = allProjects.findIndex(p => p.id === project.id || (!!p.slug && p.slug === project.slug));
  const hasSiblings = currentIndex !== -1 && allProjects.length > 1;
  const prev = hasSiblings ? allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length] : null;
  const next = hasSiblings ? allProjects[(currentIndex + 1) % allProjects.length] : null;

  const meta = [
    { label: 'Category', value: project.category },
    tags.length > 0 ? { label: 'Tech Stack', value: tags.join(', ') } : null,
    published ? { label: 'Published', value: published } : null,
    hasLink ? { label: 'Live Site', href: project.link } : null,
  ].filter(Boolean) as { label: string; value?: string; href?: string }[];

  const reveal = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, ease: 'easeOut' as const },
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-main selection:bg-accent/30 selection:text-text-main overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero banner */}
        <header className="relative h-[52vh] min-h-[360px] md:h-[60vh] md:min-h-[440px] flex items-end">
          <img
            src={project.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/70 via-transparent to-bg-dark" />
          <div className="relative w-full max-w-6xl mx-auto px-6 pb-10 md:pb-16">
            <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-6 md:mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl break-words"
            >
              {project.title}
            </motion.h1>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6">
          {/* Project meta */}
          <motion.dl {...reveal} className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 py-10 md:py-14 border-b border-border-subtle mt-6 md:mt-10">
            {meta.map(m => (
              <div key={m.label} className="min-w-0">
                <dt className="text-xs text-text-muted mb-2">{m.label} :</dt>
                <dd className="text-sm md:text-base font-medium break-words">
                  {m.href ? (
                    <a href={m.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                      Visit Site <ArrowUpRight className="w-4 h-4" />
                    </a>
                  ) : m.value}
                </dd>
              </div>
            ))}
          </motion.dl>

          {/* 01 Overview */}
          <motion.section {...reveal} className="grid md:grid-cols-12 gap-6 md:gap-10 py-14 md:py-24">
            <h2 className="md:col-span-5 md:pl-8 text-xl md:text-2xl font-medium">
              <span className="text-accent">01</span> . Overview
            </h2>
            <div className="md:col-span-7 lg:col-span-6 lg:col-start-6 space-y-6">
              <p className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                {lead || 'Detailed description coming soon...'}
              </p>
              {rest.length > 0 && (
                <div className="space-y-4 text-sm md:text-[15px] leading-relaxed text-text-muted whitespace-pre-wrap">
                  {rest.map((t, i) => <p key={i}>{t}</p>)}
                </div>
              )}
            </div>
          </motion.section>

          {/* Featured image when no gallery has been added */}
          {gallery.length === 0 && (
            <motion.div {...reveal} className="overflow-hidden bg-bg-card aspect-[4/3] md:aspect-[5/3] mb-14 md:mb-24">
              <img src={project.image} alt={project.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            </motion.div>
          )}

          {/* 02 Gallery */}
          {gallery.length > 0 && (
            <section className="pb-14 md:pb-24">
              <motion.h2 {...reveal} className="text-xl md:text-2xl font-medium mb-8 md:mb-12 md:pl-8">
                <span className="text-accent">02</span> . Project Gallery
              </motion.h2>
              <div className="space-y-4 md:space-y-6">
                {galleryRows.map((row, r) => (
                  <motion.div
                    key={r}
                    {...reveal}
                    className={row.length === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6' : ''}
                  >
                    {row.map(({ img, n }) => (
                      <div
                        key={n}
                        className={`overflow-hidden bg-bg-card ${row.length === 2 ? 'aspect-[4/3] sm:aspect-[4/5]' : 'aspect-[4/3] md:aspect-[5/3]'}`}
                      >
                        <img src={img} alt={`${project.title} ${n}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Contact CTA */}
          <motion.section {...reveal} className="border-t border-border-subtle py-14 md:py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight">Have a similar project?</h3>
            <Link to="/#contact" className="inline-flex items-center gap-2 text-accent font-medium hover:underline">
              Let's Talk <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.section>

          {/* All projects */}
          <div className="flex justify-center py-8">
            <Link to="/#projects" className="flex flex-col items-center gap-2 px-6 py-4 text-text-muted hover:text-accent transition-colors">
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-widest">All Projects</span>
            </Link>
          </div>
        </div>

        {/* Prev / Next project */}
        {prev && next && (
          <nav className="max-w-7xl mx-auto px-6 py-10 md:py-16 grid grid-cols-2 gap-6 md:gap-10" aria-label="Project navigation">
            <Link to={projectPath(prev)} className="group flex items-center gap-3 md:gap-5 min-w-0">
              <ArrowLeft className="w-5 h-5 shrink-0 text-text-muted group-hover:text-accent group-hover:-translate-x-1 transition-all" />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Prev Project</span>
                <span className="block text-base sm:text-xl md:text-3xl font-semibold tracking-tight truncate text-text-muted group-hover:text-text-main transition-colors">{prev.title}</span>
              </span>
            </Link>
            <Link to={projectPath(next)} className="group flex items-center justify-end gap-3 md:gap-5 min-w-0 text-right">
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Next Project</span>
                <span className="block text-base sm:text-xl md:text-3xl font-semibold tracking-tight truncate text-text-muted group-hover:text-text-main transition-colors">{next.title}</span>
              </span>
              <ArrowRight className="w-5 h-5 shrink-0 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </Link>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  );
}
