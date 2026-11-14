import React from 'react';
import Seo from './Seo';
import Navbar from './Navbar';
import Footer from './Footer';
import ProjectsLocked from './ProjectsLocked';

/** What every /projects/... address shows while the projects are hidden. Not indexed. */
export default function ProjectsHiddenPage() {
  return (
    <div className="home-v2 min-h-screen overflow-x-clip bg-bg-dark text-text-main">
      <Seo title="Projects" description="Projects are not available in your region." noindex />
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:pt-44">
        <ProjectsLocked />
      </main>
      <Footer />
    </div>
  );
}
