
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink, Calendar, Tag, User } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
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
        <h1 className="text-4xl font-black text-white">Project Not Found</h1>
        <Link to="/" className="text-accent hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
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
          <Link to="/#projects" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent transition-colors mb-12 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </Link>

          {/* Hero Section */}
          <div className="mb-16">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-accent text-sm font-bold uppercase tracking-[0.3em] mb-4 block"
            >
              {project.category}
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tight uppercase"
            >
              {project.title}
            </motion.h1>
          </div>

          {/* Main Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-[40px] overflow-hidden border border-white/10 mb-16 shadow-2xl relative aspect-[16/9]"
          >
            <img src={project.image} alt={project.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6 text-accent">Overview</h2>
              <div className="text-gray-400 text-lg leading-relaxed mb-12 whitespace-pre-wrap">
                {project.content || "Detailed description coming soon..."}
              </div>

              {project.gallery && project.gallery.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold mb-6 text-accent">Project Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.gallery.map((img, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="rounded-2xl overflow-hidden border border-white/5 aspect-square"
                      >
                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-10">
              <div className="p-8 bg-bg-card rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Project Info</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-black">Category</div>
                      <div className="font-bold">{project.category}</div>
                    </div>
                  </div>
                  {project.tags && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase font-black">Tech Stack</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {project.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-1 bg-white/5 rounded-md text-gray-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {project.link !== '#' && (
                    <motion.a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.05 }}
                      className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-accent text-black font-black rounded-xl accent-shadow transition-all text-sm"
                    >
                      Visit Site <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  )}
                </div>
              </div>

              {/* Promo Card */}
              <div className="p-8 bg-gradient-to-tr from-accent/20 to-transparent rounded-3xl border border-accent/20">
                <h3 className="text-xl font-black mb-4">Have a similar project?</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Let's collaborate to build something extraordinary tailored to your brand's unique mission.
                </p>
                <Link to="/#contact" className="text-accent font-bold flex items-center gap-2 hover:underline">
                  Let's Talk <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
