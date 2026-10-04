import { ResumeItem, Service } from '../types';

export interface HeaderLink { label: string; url: string }
export interface SocialLink { platform: string; url: string }
export interface HeroStat { value: string; unit: string; label: string }

/** Branding, contact details and page texts (stored under site_settings.global). */
export interface SiteConfig {
  siteTitle: string;
  siteLogo: string; // header logo
  footerLogo: string;
  favicon: string;
  headerLinks: HeaderLink[];
  socialLinks: SocialLink[];
  copyrightText: string;
  footerPortrait: string;
  officeAddress: string;
  contactEmail: string;
  officePhone: string;
  primaryColor: string;
  secondaryColor: string;
  accentMode: 'solid' | 'gradient';
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  gradientAngle: number;
  brandTagline: string;
  globalCtaText: string;
  globalCtaUrl: string;
  aboutText: string;
  aboutTags: string[];
  heroStats: HeroStat[];
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
  aboutVideoUrl: string;
}

/** Home-page hero and CV (stored under site_settings.hero). */
export interface HeroConfig {
  heroImage: string;
  heroStatus: string;
  heroAvailability: string;
  cvUrl: string;
  resumeImage: string;
}

/** Search / social-sharing settings (stored under site_settings.seo). */
export interface SeoConfig {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  keywords: string;
  siteName: string;
  siteUrl: string;
  twitterHandle: string;
  ogImage: string;
  robotsIndex: boolean;
}

export const DEFAULT_HEADER_LINKS: HeaderLink[] = [
  { label: 'Home', url: '/#home' },
  { label: 'About', url: '/#about' },
  { label: 'Resume', url: '/#resume' },
  { label: 'Services', url: '/#services' },
  { label: 'Projects', url: '/#projects' },
  { label: 'Resources', url: '/#resources' },
  { label: 'Contact', url: '/#contact' },
  { label: 'Blog', url: '/#blog' },
];

export const DEFAULT_PRIVACY_POLICY = `This site is the personal portfolio of Md. Walid Rahman (walidrahman.com).

What we collect
If you send a message through the contact form, we store the name, e-mail address, subject and message you type, so that I can reply to you. To limit spam, we also keep a one-way scrambled code derived from your connection address (the address itself is not stored).

Analytics and cookies
This site uses Google Tag Manager, which may set cookies and collect anonymous usage statistics (pages visited, device type, approximate location) to help improve the site.

How your data is used
Messages are used only to answer you. They are not sold or shared with third parties. Data is stored with our hosting and database providers (Vercel and Supabase).

Your choices
You can ask me to delete a message you sent at any time by e-mailing the address shown in the Contact section.`;

export const DEFAULT_TERMS = 'The terms of service for this website are being prepared. If you have any question in the meantime, please get in touch through the contact form.';
export const DEFAULT_REFUND = 'The refund policy for digital products is being prepared. If you have a question about an order, please get in touch through the contact form.';

export const DEFAULT_CONFIG: SiteConfig = {
  siteTitle: 'youknowwalid',
  siteLogo: '',
  footerLogo: '',
  favicon: '',
  headerLinks: DEFAULT_HEADER_LINKS,
  socialLinks: [],
  copyrightText: '© 2026 Md. Walid Rahman Swapnil. All rights reserved.',
  footerPortrait: '',
  officeAddress: 'Nikunja 2, Dhaka 1229',
  contactEmail: 'info@walidrahman.com',
  officePhone: '+880 1744 588 644',
  primaryColor: '#f45901',
  secondaryColor: '#00c6ff',
  accentMode: 'solid',
  gradientFrom: '#f45901',
  gradientVia: '',
  gradientTo: '#ff9a3c',
  gradientAngle: 135,
  brandTagline: 'A Brand Developer crafting premium digital experiences.',
  globalCtaText: "Let's Discuss",
  globalCtaUrl: '',
  aboutText:
    'As a Team Leader with extensive expertise in digital marketing, ed-tech, e-commerce, and brand management, I drive strategic growth and innovation across diverse industries. With a background that spans art direction, product design, sales, and more, I bring a multifaceted perspective to every project.',
  aboutTags: ['Project Management', 'Web Development', 'Digital Marketing', 'Brand Development'],
  heroStats: [
    { value: '8+', unit: 'Yrs', label: 'Experience' },
    { value: '1K+', unit: '', label: 'Clients Met' },
    { value: '97%', unit: '', label: 'Success Rate' },
  ],
  termsOfService: DEFAULT_TERMS,
  privacyPolicy: DEFAULT_PRIVACY_POLICY,
  refundPolicy: DEFAULT_REFUND,
  aboutVideoUrl: '',
};

export const DEFAULT_HERO: HeroConfig = {
  heroImage: '',
  heroStatus: 'Active Now',
  heroAvailability: 'Available for new projects',
  cvUrl: '',
  resumeImage: '',
};

export const DEFAULT_SEO: SeoConfig = {
  defaultTitle: 'Walid Rahman | Brand Developer',
  titleTemplate: '%s | Walid Rahman',
  defaultDescription:
    'Walid Rahman is a Dhaka-based Brand Developer and team leader with expertise in digital marketing, ed-tech, e-commerce and brand management.',
  keywords: 'Walid Rahman, brand developer, digital marketing, brand management, web development, Dhaka, Bangladesh',
  siteName: 'Walid Rahman',
  siteUrl: 'https://walidrahman.com',
  twitterHandle: '',
  ogImage: '',
  robotsIndex: true,
};

/** Content used only when no backend is connected / reachable. Nothing here is invented. */
export const FALLBACK_SERVICES: Service[] = [
  { id: 'fb-1', displayId: '01', title: 'Brand Identity', iconName: 'Palette', description: 'Crafting unique visual identities that resonate with your target audience.' },
  { id: 'fb-2', displayId: '02', title: 'Web Development', iconName: 'Braces', description: 'Building fast, responsive, and modern websites using the latest technologies.' },
  { id: 'fb-3', displayId: '03', title: 'Digital Marketing', iconName: 'Megaphone', description: 'Strategic marketing campaigns to grow your brand and reach new customers.' },
  { id: 'fb-4', displayId: '04', title: 'Product Strategy', iconName: 'Laptop', description: 'Defining the roadmap and vision for your digital products.' },
  { id: 'fb-5', displayId: '05', title: 'UI/UX Design', iconName: 'Palette', description: 'Designing intuitive and beautiful user experiences.' },
  { id: 'fb-6', displayId: '06', title: 'Content Creation', iconName: 'Megaphone', description: "Engaging content that tells your brand's story across all platforms." },
];

export const FALLBACK_RESUME: ResumeItem[] = [
  { id: 'fb-r1', year: '2024 - Present', role: 'Executive Director', company: 'De Jure Academy', desc: '' },
  { id: 'fb-r2', year: '2020 - 2022', role: 'Project Manager', company: 'JBL Bangladesh', desc: '' },
];
