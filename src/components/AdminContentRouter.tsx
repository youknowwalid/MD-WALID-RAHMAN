import React, { useMemo } from 'react';
import { User } from 'firebase/auth';
import ProjectDetail from './ProjectDetail';
import BlogDetail from './BlogDetail';
import { SEOSettings } from './SEOSettings';
import { BrandingSettings } from './BrandingSettings';
import ProductModal from './ProductModal';

interface AdminContentRouterProps {
  activeTab: string;
  user: User;
  isAdmin: boolean;
}

/**
 * Content Router Component
 * Routes to different admin panels based on activeTab without full page reloads.
 * The sidebar remains persistent and unmounts once.
 */
export const AdminContentRouter: React.FC<AdminContentRouterProps> = ({ 
  activeTab, 
  user, 
  isAdmin 
}) => {
  // Render the appropriate component based on activeTab
  // useMemo prevents unnecessary re-renders of content that hasn't changed
  const content = useMemo(() => {
    switch (activeTab) {
      case 'seoSettings':
        return <SEOSettings />;
      
      case 'branding':
        return <BrandingSettings />;
      
      case 'projects':
        return <ProjectDetail />;
      
      case 'blogPosts':
        return <BlogDetail />;
      
      case 'products':
        return <ProductModal />;
      
      // Add stubs for other sections that don't have dedicated components yet
      case 'services':
        return <AdminSectionStub title="Services Management" />;
      
      case 'resume':
        return <AdminSectionStub title="Resume Management" />;
      
      case 'skills':
        return <AdminSectionStub title="Skills Management" />;
      
      case 'testimonials':
        return <AdminSectionStub title="Testimonials Management" />;
      
      case 'pricingPlans':
        return <AdminSectionStub title="Pricing Plans Management" />;
      
      case 'contactSubmissions':
        return <AdminSectionStub title="Contact Submissions" />;
      
      case 'settings':
        return <AdminSectionStub title="General Settings" />;
      
      default:
        return <AdminSectionStub title="Dashboard" />;
    }
  }, [activeTab]);

  return content;
};

/**
 * Placeholder component for sections without dedicated management UI yet
 */
const AdminSectionStub: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-text-main mb-4">{title}</h3>
        <p className="text-text-muted">Coming soon...</p>
      </div>
    </div>
  );
};

export default AdminContentRouter;
