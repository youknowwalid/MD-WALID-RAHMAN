import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'motion/react';

import Home from './components/Home';

// Everything except the home page is loaded on demand to keep the first load small.
const ProjectDetail = lazy(() => import('./components/ProjectDetail'));
const BlogDetail = lazy(() => import('./components/BlogDetail'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ResourcesPage = lazy(() => import('./components/ResourcesPage'));
const PolicyPage = lazy(() => import('./components/PolicyPage'));
const ThankYou = lazy(() => import('./components/ThankYou'));
const NotFound = lazy(() => import('./components/NotFound'));

/** Scrolls to the top on page changes, or to the section named in the URL (e.g. /#contact). */
const ScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 20) {
        window.clearInterval(timer);
        el?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);
  return null;
};

const Loading = () => (
  <div className="min-h-screen bg-bg-dark flex items-center justify-center" role="status" aria-label="Loading">
    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    // Animations use the light "m" component with the standard feature set (about a third of the full library's size).
    <LazyMotion features={domAnimation} strict>
      <BrowserRouter>
        <ScrollManager />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/blog/:blogId" element={<BlogDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/products" element={<ResourcesPage />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/terms-of-service" element={<PolicyPage kind="termsOfService" />} />
            <Route path="/privacy-policy" element={<PolicyPage kind="privacyPolicy" />} />
            <Route path="/refund-policy" element={<PolicyPage kind="refundPolicy" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LazyMotion>
  );
}
