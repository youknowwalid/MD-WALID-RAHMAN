// Made-up sample content ("Acme Studio") for the browser tests. The app itself holds no content, so every test that
// needs a name, a tagline or an offer gets it from here, through the sample database in mock-server.mjs.
export const FIXTURE_SEO = {
  defaultTitle: 'Acme Studio | Brand Design',
  titleTemplate: '%s | Acme Studio',
  defaultDescription: 'Acme Studio is a small brand design studio.',
  keywords: 'acme, brand design',
  siteName: 'Acme Studio',
  siteUrl: 'https://acme.example',
  twitterHandle: '',
  ogImage: '',
  robotsIndex: true,
};

export const FIXTURE_HIRE_OFFERS = [
  {
    name: 'Fixed Project', tag: 'Fixed Cost',
    description: 'Best for one-off builds with a clear scope.',
    features: ['Defined scope & timeline', 'Milestone-based delivery', 'Custom quote per project', 'Ideal for one-time builds'],
    buttonText: 'Request Proposal', buttonUrl: '/#contact', dark: false, hidden: false,
  },
  {
    name: 'Monthly Retainer', tag: 'Fixed Monthly Fee',
    description: 'Best for teams that need ongoing help.',
    features: ['Strategic leadership', 'Weekly collaboration', 'Monthly fixed engagement', 'Ideal for ongoing growth'],
    buttonText: 'Book a Call', buttonUrl: '/#contact', dark: true, hidden: false,
  },
];

export const FIXTURE_CAPABILITY_GROUPS = [
  { name: 'Brand & Business', short: 'Brand', items: ['Brand Identity & Development', 'Brand & Business Strategy', 'Digital Marketing & Growth', 'Business Operations & Optimization'] },
  { name: 'Technology & Product', short: 'Technology', items: ['Web & Software Development', 'UI/UX & Product Design', 'Product Strategy & Management', 'AI & Business Automation', 'Business & Web Analytics'] },
  { name: 'Creative & Content', short: 'Creative', items: ['Content Strategy & Production', 'Creative Design & Visual Communication', 'Digital Workflow & Productivity Solutions'] },
];

export const FIXTURE_GLOBAL = {
  siteTitle: 'Acme Studio',
  wordmarkLight: 'acme',
  wordmarkAccent: 'studio',
  brandTagline: 'A small studio making brands people remember.',
  contactEmail: 'hello@acme.example',
  officePhone: '+1 555 010 0199',
  globalCtaText: "Let's Discuss",
  founderLabel: 'A word from the founder',
  founderQuote: 'We only ship work we would be proud to show our own family.',
  founderName: 'Alex Acme',
  founderRole: 'Founder',
  founderButton: 'Read my story',
  founderStory: ["I'm Alex, a designer running Acme Studio.", 'We make brands, websites and campaigns.'].join('\n\n'),
  founderCtaText: "Let's work together",
  founderCtaUrl: '/#contact',
  heroStats: [
    { value: '8+', unit: 'Yrs', label: 'Experience' },
    { value: '1K+', unit: '', label: 'Clients Met' },
    { value: '97%', unit: '', label: 'Success Rate' },
  ],
  sectionTitles: { heroName: 'Alex Acme.', whatIDo: 'What I Can Do for Your Business' },
  hireOffers: FIXTURE_HIRE_OFFERS,
  capabilityGroups: FIXTURE_CAPABILITY_GROUPS,
};

export const FIXTURE_PAYMENTS = {
  wallets: [
    { id: 'bkash', name: 'bKash', number: '01700000001' },
    { id: 'nagad', name: 'Nagad', number: '01700000002' },
  ],
  supportEmail: 'help@acme.example',
};
export const FIXTURE_PRODUCT = { key: 'acme-guide', name: 'The Acme Guide', price: 500 };
