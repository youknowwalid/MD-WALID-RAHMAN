
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react';
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
  const paragraphs = (text?: string) => (text || '').split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);

  // Section 01: first paragraph is the lead, the rest is body copy. Section 02: body copy only.
  const [lead, ...introRest] = paragraphs(project.content);
  const detailsParagraphs = paragraphs(project.detailsContent);

  // Image slots: hero banner, side-by-side pair (gallery 1-2), wide images (gallery 3+)
  const heroImage = project.heroImage || project.image;
  const gallery = (project.gallery || []).filter(Boolean);
  const images = gallery.length > 0 ? gallery : [project.image];
  const pair = images.length >= 2 ? images.slice(0, 2) : [];
  const wide = images.length >= 2 ? images.slice(2) : images;

  // Metadata row: only fields that have data, filled left to right
  const meta = [
    { label: 'Category', value: project.category },
    { label: 'Client', value: project.client },
    { label: 'Start Date', value: project.startDate },
    { label: 'Designer', value: project.designer },
    { label: 'Technologies', value: (project.tags || []).join(', ') },
    { label: 'Live Site', value: project.link && project.link !== '#' ? 'Visit Site' : '', href: project.link },
  ].filter(m => m.value);

  const currentIndex = allProjects.findIndex(p => p.id === project.id || (!!p.slug && p.slug === project.slug));
  const hasSiblings = currentIndex !== -1 && allProjects.length > 1;
  const prev = hasSiblings ? allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length] : null;
  const next = hasSiblings ? allProjects[(currentIndex + 1) % allProjects.length] : null;

  const fade = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.6, ease: 'easeOut' as const },
  };

  return (
    <div className="pd-root min-h-screen">
      <style>{PROJECT_PAGE_CSS}</style>
      <Navbar />

      <main>
        {/* Hero: dimmed banner image, title inside it */}
        <header className="pd-hero">
          <img src={heroImage} alt="" aria-hidden="true" className="pd-hero-img" referrerPolicy="no-referrer" />
          <div className="pd-wrap pd-hero-inner">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="pd-title">
              {project.title}
            </motion.h1>
          </div>
        </header>

        <div className="pd-wrap">
          {/* Metadata row + divider */}
          <dl className="pd-meta">
            {meta.map(m => (
              <div key={m.label} className="pd-meta-item">
                <dt>{m.label} :</dt>
                <dd>
                  {m.href ? <a href={m.href} target="_blank" rel="noreferrer">{m.value}</a> : m.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* 01 . Section: label left, text right */}
          <motion.section {...fade} className="pd-sec pd-sec-first">
            <h2 className="pd-sec-label">01 . {project.introTitle || 'Overview'}</h2>
            <div className="pd-sec-text">
              <p className="pd-lead">{lead || 'Detailed description coming soon...'}</p>
              {introRest.map((t, i) => <p key={i} className="pd-body">{t}</p>)}
            </div>
          </motion.section>

          {/* Two images side by side */}
          {pair.length === 2 && (
            <motion.div {...fade} className="pd-pair">
              {pair.map((img, i) => (
                <div key={i} className="pd-pair-img">
                  <img src={img} alt={`${project.title} ${i + 1}`} referrerPolicy="no-referrer" loading="lazy" />
                </div>
              ))}
            </motion.div>
          )}

          {/* 02 . Section */}
          {detailsParagraphs.length > 0 && (
            <motion.section {...fade} className="pd-sec pd-sec-second">
              <h2 className="pd-sec-label">02 . {project.detailsTitle || 'Details'}</h2>
              <div className="pd-sec-text">
                {detailsParagraphs.map((t, i) => <p key={i} className="pd-body">{t}</p>)}
              </div>
            </motion.section>
          )}

          {/* Wide image(s) */}
          {wide.map((img, i) => (
            <motion.div key={i} {...fade} className="pd-wide">
              <img src={img} alt={`${project.title} ${pair.length + i + 1}`} referrerPolicy="no-referrer" loading="lazy" />
            </motion.div>
          ))}
        </div>

        {/* All projects */}
        <div className="pd-all">
          <Link to="/#projects" className="pd-all-btn">
            <LayoutGrid strokeWidth={1.25} />
            <span>All Projects</span>
          </Link>
        </div>

        {/* Prev / next project */}
        {prev && next && (
          <nav className="pd-nav" aria-label="Project navigation">
            <Link to={projectPath(prev)} className="pd-nav-link pd-nav-prev">
              <ArrowLeft strokeWidth={1} />
              <span className="pd-nav-text">
                <span className="pd-nav-label">Prev Project</span>
                <span className="pd-nav-title">{prev.title}</span>
              </span>
            </Link>
            <Link to={projectPath(next)} className="pd-nav-link pd-nav-next">
              <span className="pd-nav-text">
                <span className="pd-nav-label">Next Project</span>
                <span className="pd-nav-title">{next.title}</span>
              </span>
              <ArrowRight strokeWidth={1} />
            </Link>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  );
}

/*
 * Project page styles, scoped to .pd-root.
 * Desktop is built from a 1440px-wide reference: 1u = 1px at 1440, scaling
 * proportionally below that (and capped above it). Below 1024px the same
 * composition is recomposed with fixed sizes.
 */
const PROJECT_PAGE_CSS = `
.pd-root{
  --u:calc(min(100vw,1440px)/1440);
  --pd-bg:#0f0f0f; --pd-hero-top:#030303; --pd-text:#fff; --pd-body:#b9bbba; --pd-label:#b3b3b3;
  --pd-line:rgba(255,255,255,.09); --pd-fill:#3b3b3b; --pd-stroke:#8f8f8f; --pd-btn:rgba(255,255,255,.015);
  background:var(--pd-bg); color:var(--pd-text); overflow-x:hidden;
}
.light-mode .pd-root{
  --pd-bg:#f8f9fa; --pd-hero-top:#e9ecef; --pd-text:#1a1a1a; --pd-body:#4a4a4a; --pd-label:#6b6b6b;
  --pd-line:rgba(0,0,0,.1); --pd-fill:#d6d6d6; --pd-stroke:#8a8a8a; --pd-btn:rgba(0,0,0,.03);
}
.light-mode .pd-hero-img{opacity:.3}
.pd-root a{color:inherit;text-decoration:none}
.pd-wrap{width:calc(972*var(--u));margin-inline:auto;position:relative}

/* Hero */
.pd-hero{position:relative;height:calc(408*var(--u));background:linear-gradient(to bottom,var(--pd-hero-top),var(--pd-bg))}
.pd-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85;
  -webkit-mask-image:linear-gradient(to bottom,transparent 12%,#000 34%,#000 52%,transparent 100%);
  mask-image:linear-gradient(to bottom,transparent 12%,#000 34%,#000 52%,transparent 100%)}
.pd-hero-inner{height:100%}
.pd-title{position:absolute;left:0;right:0;top:calc(267*var(--u));margin:0;
  font-size:calc(53*var(--u));line-height:1.12;font-weight:600;letter-spacing:-.03em}

/* Metadata */
.pd-meta{display:grid;grid-template-columns:repeat(4,1fr);column-gap:calc(18*var(--u));row-gap:calc(24*var(--u));
  margin:calc(114*var(--u)) 0 0;padding-bottom:calc(34*var(--u));border-bottom:1px solid var(--pd-line)}
.pd-meta-item{min-width:0}
.pd-meta dt{font-size:max(11px,calc(12*var(--u)));line-height:1.5;color:var(--pd-label);font-weight:400}
.pd-meta dd{margin:calc(4*var(--u)) 0 0;font-size:max(13px,calc(15.5*var(--u)));line-height:1.4;font-weight:500;overflow-wrap:anywhere}
.pd-meta dd a:hover{color:#f45901}

/* Sections */
.pd-sec{display:grid;grid-template-columns:calc(422*var(--u)) minmax(0,1fr)}
.pd-sec-first{padding-top:calc(63*var(--u))}
.pd-sec-second{padding-top:calc(108*var(--u))}
.pd-sec-label{margin:0;padding-left:calc(47*var(--u));font-size:max(17px,calc(22*var(--u)));line-height:1.3;font-weight:500;letter-spacing:-.01em}
.pd-sec-text{max-width:calc(530*var(--u))}
.pd-lead{margin:0;font-size:max(16px,calc(19.5*var(--u)));line-height:calc(30*var(--u));font-weight:400;letter-spacing:-.02em;white-space:pre-wrap}
.pd-body{max-width:calc(500*var(--u));margin:calc(24*var(--u)) 0 0;font-size:max(12.5px,calc(14*var(--u)));line-height:1.73;color:var(--pd-body);white-space:pre-wrap}
.pd-sec-second .pd-body{margin:0}
.pd-sec-second .pd-body + .pd-body{margin-top:calc(14*var(--u))}

/* Images */
.pd-pair{display:grid;grid-template-columns:1fr 1fr;gap:calc(24*var(--u));margin:calc(104*var(--u)) calc(3*var(--u)) 0}
.pd-pair-img,.pd-wide{overflow:hidden;background:#151515}
.pd-pair-img{aspect-ratio:2/3}
.pd-wide{aspect-ratio:643/381;margin-top:calc(110*var(--u))}
.pd-sec + .pd-wide{margin-top:calc(104*var(--u))}
.pd-wide + .pd-wide{margin-top:calc(24*var(--u))}
.pd-pair-img img,.pd-wide img{display:block;width:100%;height:100%;object-fit:cover}

/* All projects */
.pd-all{display:flex;justify-content:center;margin-top:calc(103*var(--u))}
.pd-all-btn{display:flex;flex-direction:column;align-items:center;gap:calc(2*var(--u));width:calc(109*var(--u));padding:calc(20*var(--u)) 0;
  background:var(--pd-btn);border-radius:calc(4*var(--u));transition:color .2s}
.pd-all-btn svg{width:calc(24*var(--u));height:calc(24*var(--u));min-width:18px;min-height:18px}
.pd-all-btn span{font-size:max(9px,calc(10*var(--u)));letter-spacing:.04em;text-transform:uppercase;font-weight:500;color:var(--pd-label)}
.pd-all-btn:hover{color:#f45901}
.pd-all-btn:hover span{color:#f45901}

/* Prev / next */
.pd-nav{display:flex;justify-content:space-between;align-items:flex-end;gap:calc(24*var(--u));padding:calc(69*var(--u)) calc(44*var(--u)) calc(29*var(--u))}
.pd-nav-link{display:flex;align-items:center;gap:calc(14*var(--u));min-width:0;color:var(--pd-text)}
.pd-nav-next{text-align:right;justify-content:flex-end}
.pd-nav-link svg{width:calc(36*var(--u));height:calc(36*var(--u));min-width:22px;min-height:22px;flex:none;transition:transform .25s}
.pd-nav-prev:hover svg{transform:translateX(-4px)}
.pd-nav-next:hover svg{transform:translateX(4px)}
.pd-nav-text{display:flex;flex-direction:column;min-width:0}
.pd-nav-label{font-size:max(9px,calc(11*var(--u)));letter-spacing:.1em;text-transform:uppercase;font-weight:600;line-height:1.4}
.pd-nav-title{margin-top:calc(8*var(--u));font-size:max(16px,calc(32*var(--u)));line-height:1.2;font-weight:600;letter-spacing:-.025em;
  color:var(--pd-fill);-webkit-text-stroke:.6px var(--pd-stroke);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s}
.pd-nav-link:hover .pd-nav-title{color:var(--pd-text)}

/* Tablet: same composition, fixed sizes */
@media (max-width:1023px){
  .pd-root{--u:1px}
  .pd-wrap{width:calc(100% - 64px)}
  .pd-hero{height:340px}
  .pd-title{top:auto;bottom:56px;font-size:44px}
  .pd-meta{margin-top:48px;padding-bottom:32px;column-gap:16px}
  .pd-sec{grid-template-columns:34% minmax(0,1fr)}
  .pd-sec-label{padding-left:0;font-size:20px}
  .pd-sec-text{max-width:none}
  .pd-lead{font-size:19px}
  .pd-body{font-size:14px;margin-top:20px}
  .pd-sec-first{padding-top:48px}
  .pd-sec-second{padding-top:72px}
  .pd-pair{gap:16px;margin:72px 0 0}
  .pd-wide{margin-top:72px}
  .pd-sec + .pd-wide{margin-top:72px}
  .pd-all{margin-top:72px}
  .pd-all-btn{width:109px}
  .pd-all-btn svg{width:24px;height:24px}
  .pd-nav-link svg{width:30px;height:30px}
  .pd-nav{padding:56px 32px 28px}
  .pd-nav-title{font-size:26px}
  .pd-nav-label{font-size:10px}
  .pd-nav-link{gap:16px}
}

/* Mobile: stacked sections, pair stays side by side */
@media (max-width:639px){
  .pd-wrap{width:calc(100% - 40px)}
  .pd-hero{height:280px}
  .pd-title{bottom:36px;font-size:32px;line-height:1.15}
  .pd-meta{grid-template-columns:repeat(2,1fr);margin-top:32px;padding-bottom:26px;row-gap:20px}
  .pd-meta dt{font-size:11px}
  .pd-meta dd{font-size:14px}
  .pd-sec{grid-template-columns:1fr}
  .pd-sec-first{padding-top:36px}
  .pd-sec-second{padding-top:56px}
  .pd-sec-label{font-size:18px;margin-bottom:16px}
  .pd-lead{font-size:17px;line-height:1.55}
  .pd-body{font-size:13.5px;margin-top:18px}
  .pd-pair{gap:10px;margin:48px 0 0}
  .pd-wide,.pd-sec + .pd-wide{margin-top:56px}
  .pd-wide + .pd-wide{margin-top:10px}
  .pd-all{margin-top:56px}
  .pd-nav{padding:40px 20px 24px;gap:12px}
  .pd-nav-link{flex:1 1 0;gap:10px}
  .pd-nav-link svg{width:24px;height:24px;min-width:0;min-height:0}
  .pd-nav-title{font-size:16px;-webkit-text-stroke-width:.4px}
  .pd-nav-label{font-size:9px}
}
`;
