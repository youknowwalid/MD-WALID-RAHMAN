import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { fetchPageExtras, listRows, type PageExtras } from '../lib/api';
import Seo from './Seo';
import Navbar from './Navbar';
import Footer from './Footer';
import Photo from './Photo';
import ProjectsHiddenPage from './ProjectsHiddenPage';

interface Card { id: string; slug: string | null; title: string; summary: string; image: string; heroImage: string }

/** Every project as a card (/projects). While the admin's projects switch is on it shows the same notice as the project pages. */
function ProjectsList() {
  const [rows, setRows] = useState<Card[] | null>(null);
  const [extras, setExtras] = useState<PageExtras | null>(null);
  useEffect(() => {
    listRows<Card>('projects', ['id', 'slug', 'title', 'summary', 'image', 'hero_image']).then((r) => setRows(r ?? []));
    fetchPageExtras('projects').then(setExtras);
  }, []);

  return (
    <div className="home-v2 min-h-screen overflow-x-clip bg-bg-dark text-text-main relative z-10">
      <Seo title={extras?.title || 'Projects'} description={extras?.description || extras?.tldr || undefined} noindex={rows !== null && rows.length === 0} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:pb-32 md:pt-40">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="inline-flex min-h-11 items-center hover:text-text-main">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text-main">Projects</li>
          </ol>
        </nav>
        <h1 className="mb-10 text-4xl font-semibold leading-tight tracking-tight text-text-main md:text-6xl">Projects</h1>
        {rows === null ? (
          <div role="status" aria-label="Loading projects" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} aria-hidden="true" className="h-64 animate-pulse rounded-3xl bg-bg-card motion-reduce:animate-none" />)}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-24 text-center text-text-muted">New projects are on their way.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((p, i) => {
              const img = p.heroImage || p.image;
              return (
                <li key={p.id}>
                  <Link to={`/projects/${p.slug || p.id}`} className="home-on-dark group flex h-full flex-col rounded-[28px] bg-[#0d1117] p-2 text-white transition-transform hover:-translate-y-1">
                    {img && <Photo src={img} widths={[640, 1080]} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" alt={p.title} width={1600} height={1000} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" className="aspect-[16/10] w-full rounded-[22px] object-cover" />}
                    <span className="flex flex-1 flex-col px-3 pb-4 pt-4">
                      <h2 className="text-lg font-medium tracking-tight">{p.title}</h2>
                      {p.summary && <span className="mt-1.5 line-clamp-3 text-sm leading-snug text-white/80">{p.summary}</span>}
                      <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-accent">View project <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ProjectsPage() {
  const { config } = useSiteConfig();
  return config.projectsHidden ? <ProjectsHiddenPage /> : <ProjectsList />;
}
