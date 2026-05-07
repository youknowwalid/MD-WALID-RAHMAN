
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
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: string;
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
}

export interface PricingPlan {
  id?: string;
  name: string;
  price: string;
  features: string[];
  accent: boolean;
}
