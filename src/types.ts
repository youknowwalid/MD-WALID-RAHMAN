import { LucideIcon } from 'lucide-react';

export interface Project {
  id?: string;
  slug?: string;
  title: string;
  category: string;
  image: string;
  link: string;
  content?: string;
  gallery?: string[];
  tags?: string[];
  socialTitle?: string;
  socialDescription?: string;
  socialImage?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface BlogPost {
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
  createdAt?: any;
  updatedAt?: any;
}

export interface Service {
  id: string;
  displayId?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: string;
  createdAt?: any;
  updatedAt?: any;
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
  name: string;
  level: number;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  id?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ResumeItem {
  id: string;
  year: string;
  role: string;
  company: string;
  desc: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PricingPlan {
  id?: string;
  name: string;
  price: string;
  features: string[];
  unavailableFeatures?: string[];
  showPriorityBox?: boolean;
  priorityTitle?: string;
  prioritySubtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  accent: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Product {
  id?: string;
  title: string;
  shortTitle: string;
  description: string;
  price: string;
  thumbnail: string;
  image: string;
  gumroadUrl: string;
  order?: number;
  featured?: boolean;
  published?: boolean;
  createdAt?: any;
  updatedAt?: any;
  gallery1?: string;
  gallery2?: string;
  gallery3?: string;
  gallery4?: string;
}
