import { ResumeItem } from '../types';
import seoDefaults from './seo-defaults.json' with { type: 'json' };

export interface HeaderLink { label: string; url: string }
export interface SocialLink { platform: string; url: string }
/** One logo in the home page's "Teams I have worked with" strip. */
export interface ClientLogo { name: string; image: string; url: string; hidden: boolean }
/** One person in the home page's team section (stored under site_settings.global). */
export interface TeamMember { name: string; role: string; photo: string; quote: string; hidden: boolean }
export const TEAM_QUOTE_MAX = 100;
/** One card of the "Work with me" section (stored under site_settings.global). */
/** One small fact line on a hire card, e.g. "Starting at" / "25k BDT". */
export interface HireDetail { label: string; value: string }
export interface HireOffer { name: string; tag: string; description: string; features: string[]; details?: HireDetail[]; buttonText: string; buttonUrl: string; dark: boolean; hidden: boolean }
export const DEFAULT_HIRE_OFFERS: HireOffer[] = [];
/** One tab of the "What I can do" card: a category name (and a shorter name for phones) with its small service chips. */
export interface CapabilityGroup { name: string; short: string; items: string[] }
export const DEFAULT_CAPABILITY_GROUPS: CapabilityGroup[] = [];
export interface HeroStat { value: string; unit: string; label: string }
/** One step of a service's "how it works" list. */
export interface ServiceStep { title: string; text: string }
/** One service with its own page at /services/<slug> (stored under site_settings.global.servicePages). */
export interface ServicePage {
  /** A fixed id (uuid): the service's search settings are saved under "service:<id>", so renaming it never loses them. */
  id: string;
  slug: string;
  name: string;
  /** The text of the matching chip in the home page's "What I can do" card, so that chip links here. */
  chip: string;
  summary: string;
  headline: string;
  intro: string;
  image: string;
  included: string[];
  steps: ServiceStep[];
  ctaTitle: string;
  ctaButton: string;
  ctaUrl: string;
  hidden: boolean;
}
export const DEFAULT_SERVICE_PAGES: ServicePage[] = [];

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
  /** The founder card in the footer: small label, quote, name, role, button text, and the story shown in the popup (blank line = new paragraph). */
  founderLabel: string;
  founderQuote: string;
  founderName: string;
  founderRole: string;
  founderButton: string;
  founderStory: string;
  founderCtaText: string;
  founderCtaUrl: string;
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
  /** Hero buttons: the main one (falls back to the header button text) and a quieter one that scrolls to the projects. */
  heroCtaText: string;
  heroSecondaryText: string;
  aboutText: string;
  aboutTags: string[];
  heroStats: HeroStat[];
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
  aboutVideoUrl: string;
  /** Headings and short texts of the home page, editable in the admin. */
  sectionTitles: Record<string, string>;
  /** Home page only: the brand colour of buttons, dots and highlights. */
  homeAccent: string;
  /** Home page header wordmark: the light part and the highlighted part. */
  wordmarkLight: string;
  wordmarkAccent: string;
  /** The "Current focus" cards on the home page (leave the title empty to hide them). */
  currentFocusTitle: string;
  currentFocusText: string;
  /** Logos of the businesses he has worked with (stored under site_settings.global). */
  clientLogos: ClientLogo[];
  /** While on, the home page and project pages show the "not available in your region" notice instead of the projects. */
  projectsHidden: boolean;
  /** The people shown in the team section under the testimonials. */
  teamMembers: TeamMember[];
  /** The cards in the "Work with me" section (replaces the old pricing plans). */
  hireOffers: HireOffer[];
  /** The "What I can do" card: its tabs and chips, and the small label at its top right. */
  capabilityGroups: CapabilityGroup[];
  capabilitiesEyebrow: string;
  /** The services that have their own pages, plus the heading and intro of the /services page. */
  servicePages: ServicePage[];
  servicesHeading: string;
  servicesIntro: string;
}

/** Home-page hero and CV (stored under site_settings.hero). */
export interface HeroConfig {
  /** Optional replacement for the built-in animated portrait on the home page. */
  heroPortrait: string;
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
  { label: 'About', url: '/#about' },
  { label: 'Services', url: '/#services' },
  { label: 'Pricing', url: '/#hire' },
  { label: 'Blog', url: '/articles' },
  { label: 'Resources', url: '/#resources' },
];

export const DEFAULT_PRIVACY_POLICY = `This website is operated by its owner, whose contact details are shown in the Contact section.

What we collect
If you send a message through the contact form, we store the name, e-mail address, subject and message you type, so that we can reply to you. To limit spam, we also keep a one-way scrambled code derived from your connection address (the address itself is not stored).

Analytics and cookies
This site may use an analytics or tag-management service, which can set cookies and collect anonymous usage statistics (pages visited, device type, approximate location) to help improve the site.

How your data is used
Messages are used only to answer you. They are not sold or shared with third parties. Data is stored with our hosting and database providers.

Your choices
You can ask us to delete a message you sent at any time by e-mailing the address shown in the Contact section.`;

export const DEFAULT_TERMS = 'The terms of service for this website are being prepared. If you have any question in the meantime, please get in touch through the contact form.';
export const DEFAULT_REFUND = 'The refund policy for digital products is being prepared. If you have a question about an order, please get in touch through the contact form.';

export const DEFAULT_SECTION_TITLES: Record<string, string> = {
  heroGreeting: 'Hello, I\'m',
  heroName: '',
  teams: 'Teams I have worked with',
  about: 'About',
  resume: 'Journey',
  whatIDo: 'What I Can Do',
  testimonials: 'Testimonials',
  teamEyebrow: 'Team',
  team: 'The people behind the work',
  hire: 'Work With Me',
  hireLead: '',
  projectsEyebrow: 'Portfolio',
  projects: 'Projects',
  blog: 'Blog',
  resources: 'Resources',
  contactEyebrow: 'Contact',
  contact: 'Get in touch',
  contactLead: '',
};

/** [key, label in the admin] — in the order they appear on the home page. */
export const SECTION_TITLE_LABELS: [string, string][] = [
  ['heroGreeting', 'Hero: greeting (before your name)'], ['heroName', 'Hero: your name (typed out)'], ['teams', 'Line above the client names'],
  ['about', 'About section'], ['resume', 'Resume / journey'],
  ['whatIDo', 'What I can do: heading'], ['testimonials', 'Testimonials'], ['teamEyebrow', 'Team: small label'], ['team', 'Team: heading'], ['hire', 'Work with me: heading'], ['hireLead', 'Work with me: short line'],
  ['projectsEyebrow', 'Projects: small label'], ['projects', 'Projects: heading'], ['blog', 'Blog'], ['resources', 'Digital products'],
  ['contactEyebrow', 'Contact: small label'], ['contact', 'Contact: heading'], ['contactLead', 'Contact: short line'],
];

export const DEFAULT_CONFIG: SiteConfig = {
  siteTitle: '',
  siteLogo: '',
  footerLogo: '',
  favicon: '',
  headerLinks: DEFAULT_HEADER_LINKS,
  socialLinks: [],
  copyrightText: '',
  footerPortrait: '',
  founderLabel: '',
  founderQuote: '',
  founderName: '',
  founderRole: '',
  founderButton: '',
  founderStory: '',
  founderCtaText: '',
  founderCtaUrl: '/#contact',
  officeAddress: '',
  contactEmail: '',
  officePhone: '',
  primaryColor: '#f45901',
  secondaryColor: '#00c6ff',
  accentMode: 'solid',
  gradientFrom: '#f45901',
  gradientVia: '',
  gradientTo: '#ff9a3c',
  gradientAngle: 135,
  brandTagline: '',
  globalCtaText: 'Contact',
  globalCtaUrl: '',
  heroCtaText: '',
  heroSecondaryText: '',
  aboutText: '',
  aboutTags: [],
  heroStats: [],
  termsOfService: DEFAULT_TERMS,
  privacyPolicy: DEFAULT_PRIVACY_POLICY,
  refundPolicy: DEFAULT_REFUND,
  aboutVideoUrl: '',
  sectionTitles: DEFAULT_SECTION_TITLES,
  homeAccent: '#c3ed3a',
  wordmarkLight: '',
  wordmarkAccent: '',
  currentFocusTitle: '',
  currentFocusText: '',
  clientLogos: [],
  projectsHidden: true,
  teamMembers: [],
  hireOffers: DEFAULT_HIRE_OFFERS,
  capabilityGroups: DEFAULT_CAPABILITY_GROUPS,
  capabilitiesEyebrow: '',
  servicePages: DEFAULT_SERVICE_PAGES,
  servicesHeading: '',
  servicesIntro: '',
};

export const DEFAULT_HERO: HeroConfig = {
  heroPortrait: '',
  cvUrl: '',
  resumeImage: '',
};

/** Built-in search/share defaults: one shared file, also read by api/page-meta.js (see src/lib/seo-defaults.json). */
export const DEFAULT_SEO: SeoConfig = {
  defaultTitle: seoDefaults.defaultTitle,
  titleTemplate: seoDefaults.titleTemplate,
  defaultDescription: seoDefaults.defaultDescription,
  keywords: seoDefaults.keywords,
  siteName: seoDefaults.siteName,
  siteUrl: seoDefaults.siteUrl,
  twitterHandle: seoDefaults.twitterHandle,
  ogImage: seoDefaults.ogImage,
  robotsIndex: seoDefaults.robotsIndex,
};

/** Shown only when no backend is connected / reachable. The repo holds no content, so there is nothing to show. */
export const FALLBACK_RESUME: ResumeItem[] = [];
