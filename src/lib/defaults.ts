import { ResumeItem, Service } from '../types';

export interface HeaderLink { label: string; url: string }
export interface SocialLink { platform: string; url: string }
/** One logo in the home page's "Teams I have worked with" strip. */
export interface ClientLogo { name: string; image: string; url: string; hidden: boolean }
/** One person in the home page's team section (stored under site_settings.global). */
export interface TeamMember { name: string; role: string; photo: string; quote: string; hidden: boolean }
export const TEAM_QUOTE_MAX = 100;
/** One card of the "Work with me" section (stored under site_settings.global). */
export interface HireOffer { name: string; tag: string; description: string; features: string[]; buttonText: string; buttonUrl: string; dark: boolean; hidden: boolean }
export const DEFAULT_HIRE_OFFERS: HireOffer[] = [
  {
    name: 'Project-Based', tag: 'Fixed Cost',
    description: 'Best for websites, brand systems, campaigns, funnels, and one-off growth projects.',
    features: ['Defined scope & timeline', 'Milestone-based delivery', 'Custom quote per project', 'Ideal for one-time builds'],
    buttonText: 'Request Proposal', buttonUrl: '/#contact', dark: false, hidden: false,
  },
  {
    name: 'Fractional CMO / CBO', tag: 'Fixed Monthly Salary',
    description: 'Best for founders who need ongoing marketing, brand, growth, and business leadership.',
    features: ['Strategic leadership', 'Weekly collaboration', 'Monthly fixed engagement', 'Ideal for ongoing growth'],
    buttonText: 'Book a Call', buttonUrl: '/#contact', dark: true, hidden: false,
  },
];
/** One tab of the "What I can do" card: a category name (and a shorter name for phones) with its small service chips. */
export interface CapabilityGroup { name: string; short: string; items: string[] }
export const DEFAULT_CAPABILITY_GROUPS: CapabilityGroup[] = [
  { name: 'Brand & Business', short: 'Brand', items: ['Brand Identity & Development', 'Brand & Business Strategy', 'Digital Marketing & Growth', 'Business Operations & Optimization'] },
  { name: 'Technology & Product', short: 'Technology', items: ['Web & Software Development', 'UI/UX & Product Design', 'Product Strategy & Management', 'AI & Business Automation', 'Business & Web Analytics'] },
  { name: 'Creative & Content', short: 'Creative', items: ['Content Strategy & Production', 'Creative Design & Visual Communication', 'Digital Workflow & Productivity Solutions'] },
];
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

export const DEFAULT_SECTION_TITLES: Record<string, string> = {
  heroGreeting: "Hello, I'm",
  heroName: 'Walid Rahman.',
  teams: 'Teams I have worked with',
  about: 'Crafting Digital Excellence',
  resume: 'My Journey',
  services: 'My Specialities',
  whatIDo: 'What I Can Do for Your Business',
  skills: 'Technical Arsenal',
  skillsIntro: 'Skills refined through years of practical application in demanding environments.',
  testimonials: 'Kind Words',
  teamEyebrow: 'Team',
  team: 'The people behind the work',
  hire: 'Work With Me',
  hireLead: 'Two ways to engage, based on what you need right now.',
  projectsEyebrow: 'Portfolio',
  projects: 'Featured Work',
  blog: 'Latest Insights',
  resources: 'Premium Resources',
  contactEyebrow: 'Contact',
  contact: "Let's Build Something",
  contactLead: "Have a project in mind or just want to say hi? I'm always open to discussing new opportunities and creative ideas.",
};

/** [key, label in the admin] — in the order they appear on the home page. */
export const SECTION_TITLE_LABELS: [string, string][] = [
  ['heroGreeting', 'Hero: greeting (before your name)'], ['heroName', 'Hero: your name (typed out)'], ['teams', 'Line above the client names'],
  ['about', 'About section'], ['resume', 'Resume / journey'], ['services', 'Services'], ['skills', 'Skills (last word is dimmed)'],
  ['skillsIntro', 'Skills: short line'], ['whatIDo', 'What I can do: heading'], ['testimonials', 'Testimonials'], ['teamEyebrow', 'Team: small label'], ['team', 'Team: heading'], ['hire', 'Work with me: heading'], ['hireLead', 'Work with me: short line'],
  ['projectsEyebrow', 'Projects: small label'], ['projects', 'Projects: heading'], ['blog', 'Blog'], ['resources', 'Digital products'],
  ['contactEyebrow', 'Contact: small label'], ['contact', 'Contact: heading'], ['contactLead', 'Contact: short line'],
];

export const DEFAULT_CONFIG: SiteConfig = {
  siteTitle: 'youknowwalid',
  siteLogo: '',
  footerLogo: '',
  favicon: '',
  headerLinks: DEFAULT_HEADER_LINKS,
  socialLinks: [],
  copyrightText: '© 2026 Md. Walid Rahman Swapnil. All rights reserved.',
  footerPortrait: '',
  founderLabel: 'A word from the founder',
  founderQuote: 'I only put my name on work I would be proud to show my own family.',
  founderName: 'Md. Walid Rahman Swapnil',
  founderRole: 'Founder',
  founderButton: 'Read my story',
  founderStory: [
    "I'm Walid, a brand developer and designer working from Dhaka.",
    "I'm the founder and CEO of De Jure Academy, where I design the book covers, the branding and the app screens, lead the marketing, and teach our students technology, office software and how to use AI in their work.",
    'I also freelance for global brands like JBL, building digital campaigns made to convert, from a fully equipped home studio, and I am happy to work US Pacific hours.',
    "If you have a brand, a website or a growth plan that needs someone who treats it as their own, let's talk.",
  ].join('\n\n'),
  founderCtaText: "Let's work together",
  founderCtaUrl: '/#contact',
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
  sectionTitles: DEFAULT_SECTION_TITLES,
  homeAccent: '#c3ed3a',
  wordmarkLight: 'youknow',
  wordmarkAccent: 'walid',
  currentFocusTitle: 'Strategic Brand Evolution',
  currentFocusText: '',
  clientLogos: [],
  projectsHidden: true,
  teamMembers: [],
  hireOffers: DEFAULT_HIRE_OFFERS,
  capabilityGroups: DEFAULT_CAPABILITY_GROUPS,
  capabilitiesEyebrow: 'Services & Solutions',
};

export const DEFAULT_HERO: HeroConfig = {
  heroPortrait: '',
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
