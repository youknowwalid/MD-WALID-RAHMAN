import { PricingPlan, Project, BlogPost, Service, Testimonial, ResumeItem, Product } from '../types';

export const normalizePricingPlan = (data: any): PricingPlan => ({
  id: String(data.id || ''),
  name: String(data.name || 'Standard Plan'),
  price: String(data.price || '$0'),
  features: Array.isArray(data.features) ? data.features.map(String) : [],
  unavailableFeatures: Array.isArray(data.unavailableFeatures) ? data.unavailableFeatures.map(String) : [],
  showPriorityBox: Boolean(data.showPriorityBox),
  priorityTitle: String(data.priorityTitle || ''),
  prioritySubtitle: String(data.prioritySubtitle || ''),
  buttonText: String(data.buttonText || 'Get Started'),
  buttonUrl: String(data.buttonUrl || ''),
  accent: Boolean(data.accent),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

export const normalizeProject = (data: any): Project => ({
  id: String(data.id || ''),
  title: String(data.title || 'Untitled Project'),
  category: String(data.category || 'General'),
  image: String(data.image || 'https://picsum.photos/800/600'),
  link: String(data.link || ''),
  slug: String(data.slug || ''),
  tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  content: String(data.content || ''),
  socialTitle: String(data.socialTitle || ''),
  socialDescription: String(data.socialDescription || ''),
  socialImage: String(data.socialImage || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

export const normalizeService = (data: any): Service => ({
  id: String(data.id || ''),
  displayId: String(data.displayId || '01'),
  title: String(data.title || 'Service'),
  iconName: String(data.iconName || 'Palette'),
  description: String(data.description || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

export const normalizeTestimonial = (data: any): Testimonial => ({
  id: String(data.id || ''),
  name: String(data.name || 'Anonymous'),
  role: String(data.role || 'Client'),
  avatar: String(data.avatar || 'https://i.pravatar.cc/150'),
  content: String(data.content || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

export const normalizeResumeItem = (data: any): ResumeItem => ({
  id: String(data.id || ''),
  year: String(data.year || 'N/A'),
  role: String(data.role || 'Professional'),
  company: String(data.company || 'Company'),
  desc: String(data.desc || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

export const normalizeBlogPost = (data: any): BlogPost => ({
  id: String(data.id || ''),
  title: String(data.title || 'Untitled Post'),
  slug: String(data.slug || ''),
  date: String(data.date || new Date().toLocaleDateString()),
  author: String(data.author || 'Walid Rahman'),
  image: String(data.image || 'https://picsum.photos/800/500'),
  excerpt: String(data.excerpt || ''),
  content: String(data.content || ''),
  tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  socialTitle: String(data.socialTitle || ''),
  socialDescription: String(data.socialDescription || ''),
  socialImage: String(data.socialImage || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

export const normalizeProduct = (data: any): Product => ({
  id: String(data.id || ''),
  title: String(data.title || 'Untitled Product'),
  shortTitle: String(data.shortTitle || 'Digital Resource'),
  description: String(data.description || ''),
  price: String(data.price || '$0.00'),
  thumbnail: String(data.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'),
  image: String(data.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'),
  gumroadUrl: String(data.gumroadUrl || 'https://gumroad.com'),
  order: Number(data.order !== undefined ? data.order : 0),
  featured: Boolean(data.featured !== undefined ? data.featured : true),
  published: Boolean(data.published !== undefined ? data.published : true),
  gallery1: String(data.gallery1 || ''),
  gallery2: String(data.gallery2 || ''),
  gallery3: String(data.gallery3 || ''),
  gallery4: String(data.gallery4 || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});
