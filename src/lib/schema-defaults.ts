import { PricingPlan, Project, BlogPost, Service, Testimonial, ResumeItem, Product } from '../types';

/** Every normalizer fills missing fields with safe, neutral values (never invented content). */
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const list = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const num = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) && v !== '' && v !== null && v !== undefined ? Number(v) : fallback);

export const normalizePricingPlan = (data: any): PricingPlan => ({
  id: str(data.id),
  name: str(data.name) || 'Plan',
  price: str(data.price),
  period: data.period === undefined || data.period === null ? '/month' : str(data.period),
  features: list(data.features),
  unavailableFeatures: list(data.unavailableFeatures),
  showPriorityBox: Boolean(data.showPriorityBox),
  priorityTitle: str(data.priorityTitle),
  prioritySubtitle: str(data.prioritySubtitle),
  buttonText: str(data.buttonText) || 'Get Started',
  buttonUrl: str(data.buttonUrl),
  accent: Boolean(data.accent),
  order: num(data.order),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const normalizeProject = (data: any): Project => ({
  id: str(data.id),
  title: str(data.title) || 'Untitled Project',
  category: str(data.category),
  image: str(data.image),
  link: str(data.link),
  slug: str(data.slug),
  tags: list(data.tags),
  gallery: list(data.gallery),
  content: str(data.content),
  heroImage: str(data.heroImage),
  client: str(data.client),
  designer: str(data.designer),
  startDate: str(data.startDate),
  introTitle: str(data.introTitle),
  detailsTitle: str(data.detailsTitle),
  detailsContent: str(data.detailsContent),
  socialTitle: str(data.socialTitle),
  socialDescription: str(data.socialDescription),
  socialImage: str(data.socialImage),
  summary: str(data.summary),
  industry: str(data.industry),
  services: str(data.services),
  feedbackQuote: str(data.feedbackQuote),
  feedbackName: str(data.feedbackName),
  feedbackRole: str(data.feedbackRole),
  ctaTitle: str(data.ctaTitle),
  ctaButtonText: str(data.ctaButtonText),
  ctaButtonUrl: str(data.ctaButtonUrl),
  // Projects saved before the upgrade have no value: they stay visible.
  published: data.published === undefined ? true : Boolean(data.published),
  order: num(data.order),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const normalizeService = (data: any): Service => ({
  id: str(data.id),
  displayId: str(data.displayId),
  title: str(data.title) || 'Service',
  iconName: str(data.iconName) || 'Palette',
  description: str(data.description),
  order: num(data.order),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const normalizeTestimonial = (data: any): Testimonial => ({
  id: str(data.id),
  name: str(data.name) || 'Anonymous',
  role: str(data.role),
  avatar: str(data.avatar),
  content: str(data.content),
  order: num(data.order),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const normalizeResumeItem = (data: any): ResumeItem => ({
  id: str(data.id),
  year: str(data.year),
  role: str(data.role) || 'Role',
  company: str(data.company),
  desc: str(data.desc),
  order: num(data.order),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const normalizeBlogPost = (data: any): BlogPost => ({
  id: str(data.id),
  title: str(data.title) || 'Untitled Post',
  slug: str(data.slug),
  date: str(data.date),
  author: str(data.author) || 'Walid Rahman',
  image: str(data.image),
  excerpt: str(data.excerpt),
  content: str(data.content),
  tags: list(data.tags),
  socialTitle: str(data.socialTitle),
  socialDescription: str(data.socialDescription),
  socialImage: str(data.socialImage),
  order: num(data.order),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const normalizeProduct = (data: any): Product => ({
  id: str(data.id),
  title: str(data.title) || 'Untitled Product',
  shortTitle: str(data.shortTitle),
  description: str(data.description),
  price: str(data.price),
  thumbnail: str(data.thumbnail),
  image: str(data.image),
  paddleUrl: str(data.paddleUrl),
  order: num(data.order),
  featured: data.featured === undefined ? true : Boolean(data.featured),
  published: data.published === undefined ? true : Boolean(data.published),
  gallery1: str(data.gallery1),
  gallery2: str(data.gallery2),
  gallery3: str(data.gallery3),
  gallery4: str(data.gallery4),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});
