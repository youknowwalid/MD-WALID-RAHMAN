import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Seo from './Seo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-main flex flex-col">
      <Seo title="Page not found" noindex />
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 pt-32 pb-20 text-center">
        <p className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Error 404</p>
        <h1 className="text-4xl md:text-6xl font-black">Page not found</h1>
        <p className="text-text-muted max-w-md">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="bg-accent text-white font-black px-8 py-3 rounded-lg">Back to the homepage</Link>
      </main>
      <Footer />
    </div>
  );
}
