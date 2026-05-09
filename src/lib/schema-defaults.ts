/**
 * CENTRALIZED SCHEMA DEFAULTS & NORMALIZATION
 * 
 * This file is the single source of truth for safe default values and 
 * data normalization logic. Any new field added to the database MUST
 * be registered here.
 */

import { PricingPlan, Project, BlogPost, Service, Testimonial, ResumeItem } from '../types';

/**
 * Normalizes a Pricing Plan object to ensure no undefined fields and full schema compliance.
 */
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

/**
 * Normalizes a Project object.
 */
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

/**
 * Normalizes a Service object.
 */
export const normalizeService = (data: any): Service => ({
  id: String(data.id || ''),
  title: String(data.title || 'Service'),
  iconName: String(data.iconName || 'Palette'),
  description: String(data.description || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

/**
 * Normalizes a Testimonial object.
 */
export const normalizeTestimonial = (data: any): Testimonial => ({
  id: String(data.id || ''),
  name: String(data.name || 'Anonymous'),
  role: String(data.role || 'Client'),
  avatar: String(data.avatar || 'https://i.pravatar.cc/150'),
  content: String(data.content || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

/**
 * Normalizes a Resume item.
 */
export const normalizeResumeItem = (data: any): ResumeItem => ({
  id: String(data.id || ''),
  year: String(data.year || 'N/A'),
  role: String(data.role || 'Professional'),
  company: String(data.company || 'Company'),
  desc: String(data.desc || ''),
  createdAt: data.createdAt,
  updatedAt: data.updatedAt
});

/**
 * Normalizes a Blog Post object.
 */
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
