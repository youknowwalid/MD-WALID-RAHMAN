import { LucideIcon } from 'lucide-react';

export interface Project {
  order?: number;
  id?: string;
  slug?: string;
  title: string;
  category: string;
  image: string;
  link: string;
  content?: string;
  gallery?: string[];
  tags?: string[];
  heroImage?: string;
  client?: string;
  designer?: string;
  startDate?: string;
  introTitle?: string;
  detailsTitle?: string;
  detailsContent?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialImage?: string;
  // Case-study page fields
  summary?: string;
  industry?: string;
  services?: string;
  feedbackQuote?: string;
  feedbackName?: string;
  feedbackRole?: string;
  ctaTitle?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  /** False keeps the project hidden from visitors (a draft). Missing means published. */
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPost {
  order?: number;
  id?: string;
  slug?: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  content?: string;
  author?: string;
  tags?: string[];
  socialTitle?: string;
  socialDescription?: string;
  socialImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  order?: number;
  id: string;
  displayId?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavLink {
  name: string;
  href: string;
}

export interface Stat {
  label: string;
  value: string;
  number: number;
}

export interface Skill {
  id?: string;
  name: string;
  level: number;
  order?: number;
}

export interface Testimonial {
  order?: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResumeItem {
  order?: number;
  id: string;
  year: string;
  role: string;
  company: string;
  desc: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingPlan {
  order?: number;
  id?: string;
  name: string;
  price: string;
  features: string[];
  unavailableFeatures?: string[];
  showPriorityBox?: boolean;
  priorityTitle?: string;
  prioritySubtitle?: string;
  period?: string;
  buttonText?: string;
  buttonUrl?: string;
  accent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id?: string;
  title: string;
  shortTitle: string;
  description: string;
  price: string;
  thumbnail: string;
  image: string;
  paddleUrl: string;
  order?: number;
  featured?: boolean;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
  gallery1?: string;
  gallery2?: string;
  gallery3?: string;
  gallery4?: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
