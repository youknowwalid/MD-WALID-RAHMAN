import { Collection } from '../../lib/rows';
import { slugify } from '../../lib/text';
import {
  normalizeBlogPost, normalizePricingPlan, normalizeProduct, normalizeProject,
  normalizeResumeItem, normalizeService, normalizeTestimonial,
} from '../../lib/schema-defaults';

export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'image' | 'tags' | 'lines' | 'select' | 'gallery';

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  rows?: number;
  hint?: string;
  placeholder?: string;
  options?: string[];
  half?: boolean;
  maxSide?: number;
  section?: string; // renders a heading before this field
  mono?: boolean;
}

const order: Field = { name: 'order', label: 'Display order (lower numbers come first)', type: 'number', half: true };

export const FORMS: Record<Exclude<Collection, 'contactSubmissions'>, { singular: string; fields: Field[] }> = {
  projects: {
    singular: 'project',
    fields: [
      // Fields follow the order of the public project page, top to bottom.
      { section: 'Basics', name: 'title', label: 'Project title', required: true },
      { name: 'category', label: 'Category', half: true },
      { name: 'slug', label: 'Page address (leave blank to create from the title)', half: true, placeholder: 'my-project' },
      { name: 'published', label: 'Published (untick to keep this project hidden as a draft)', type: 'checkbox' },
      { name: 'image', label: 'Main project image (shown on the home page)', type: 'image', hint: 'Recommended: landscape, about 1600 × 900 px.' },
      { name: 'link', label: 'Live website link (optional, shown as “Live site” on the page)', placeholder: 'https://…' },
      { section: 'Top of the page: intro and details', name: 'summary', label: 'Intro line under the title', type: 'textarea', rows: 3, hint: 'One or two sentences, up to 500 characters.' },
      { name: 'client', label: 'Client', half: true },
      { name: 'industry', label: 'Industries', half: true, hint: 'Leave blank to show the category instead.' },
      { name: 'services', label: 'Services', half: true, placeholder: 'e.g. Branding, UI design' },
      { name: 'startDate', label: 'Date', placeholder: 'e.g. 7 August 2021', half: true },
      { name: 'designer', label: 'Designer', half: true },
      { name: 'tags', label: 'Tags shown as pills (comma separated)', type: 'tags' },
      { section: 'Cover image', name: 'heroImage', label: 'Large cover image at the top (defaults to the main image)', type: 'image', hint: 'Recommended: landscape, about 1920 × 1200 px.' },
      { section: 'Challenge section', name: 'introTitle', label: 'Challenge section title (default: Challenge)' },
      { name: 'content', label: 'Challenge text (the first paragraph becomes the large lead sentence; separate paragraphs with a blank line)', type: 'textarea', rows: 8 },
      { section: 'Image grid', name: 'gallery', label: 'Grid images (shown two per row, alternating wide and narrow; an odd last image is shown full width)', type: 'gallery' },
      { section: 'Solution section', name: 'detailsTitle', label: 'Solution section title (default: Solution)' },
      { name: 'detailsContent', label: 'Solution text (separate paragraphs with a blank line)', type: 'textarea', rows: 6 },
      { section: 'Client feedback (hidden when the quote is empty)', name: 'feedbackQuote', label: 'Quote', type: 'textarea', rows: 4 },
      { name: 'feedbackName', label: 'Name of the person', half: true },
      { name: 'feedbackRole', label: 'Their role / company', half: true },
      { section: 'Closing call-to-action card (optional)', name: 'ctaTitle', label: "Heading (default: Let's talk about your project!)" },
      { name: 'ctaButtonText', label: 'Button text (default: Contact Us)', half: true },
      { name: 'ctaButtonUrl', label: 'Button link (blank = contact form)', half: true, placeholder: '/#contact or https://…' },
      { section: 'Social sharing (optional)', name: 'socialTitle', label: 'Title when shared' },
      { name: 'socialDescription', label: 'Description when shared', type: 'textarea', rows: 2 },
      { name: 'socialImage', label: 'Image when shared', type: 'image', hint: 'Recommended: 1200 × 630 px.' },
      order,
    ],
  },
  services: {
    singular: 'service',
    fields: [
      { name: 'title', label: 'Service title', required: true },
      { name: 'displayId', label: 'Number shown on the card (e.g. 01)', half: true },
      { name: 'iconName', label: 'Icon', type: 'select', options: ['Palette', 'Braces', 'Megaphone', 'Laptop'], half: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4, required: true },
      order,
    ],
  },
  blogPosts: {
    singular: 'blog post',
    fields: [
      { name: 'title', label: 'Post title', required: true },
      { name: 'date', label: 'Date shown', placeholder: 'e.g. May 10, 2026', half: true },
      { name: 'author', label: 'Author', half: true },
      { name: 'slug', label: 'Page address (leave blank to create from the title)', placeholder: 'my-post' },
      { name: 'excerpt', label: 'Short summary', type: 'textarea', rows: 3, required: true },
      { name: 'content', label: 'Full article', type: 'textarea', rows: 12, mono: true, hint: 'Tip: start a line with ### for a heading and with - for a bullet. Leave a blank line between paragraphs.' },
      { name: 'tags', label: 'Tags (comma separated)', type: 'tags' },
      { name: 'image', label: 'Main image', type: 'image', hint: 'Recommended: landscape, about 1600 × 900 px.' },
      { section: 'Social sharing (optional)', name: 'socialTitle', label: 'Title when shared' },
      { name: 'socialDescription', label: 'Description when shared', type: 'textarea', rows: 2 },
      { name: 'socialImage', label: 'Image when shared', type: 'image', hint: 'Recommended: 1200 × 630 px.' },
      order,
    ],
  },
  resume: {
    singular: 'resume entry',
    fields: [
      { name: 'role', label: 'Role / title', required: true },
      { name: 'company', label: 'Company', required: true, half: true },
      { name: 'year', label: 'Years', required: true, half: true, placeholder: '2020 - 2022' },
      { name: 'desc', label: 'Description', type: 'textarea', rows: 4 },
      order,
    ],
  },
  skills: {
    singular: 'skill',
    fields: [
      { name: 'name', label: 'Skill name', required: true },
      { name: 'level', label: 'Level (0 – 100)', type: 'number', required: true, half: true },
      order,
    ],
  },
  testimonials: {
    singular: 'testimonial',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'role', label: 'Role / company', required: true },
      { name: 'content', label: 'What they said', type: 'textarea', rows: 4, required: true },
      { name: 'avatar', label: 'Photo (optional)', type: 'image', maxSide: 400 },
      order,
    ],
  },
  pricingPlans: {
    singular: 'pricing plan',
    fields: [
      { name: 'name', label: 'Plan name', required: true, half: true },
      { name: 'price', label: 'Price', placeholder: '$350', half: true },
      { name: 'period', label: 'Shown after the price (e.g. /month — leave empty for none)', half: true },
      { name: 'features', label: 'Included features (one per line)', type: 'lines' },
      { name: 'unavailableFeatures', label: 'Not included (one per line)', type: 'lines' },
      { name: 'showPriorityBox', label: 'Show the highlighted box', type: 'checkbox' },
      { name: 'priorityTitle', label: 'Highlighted box title', half: true },
      { name: 'prioritySubtitle', label: 'Highlighted box subtitle', half: true },
      { name: 'buttonText', label: 'Button text', half: true },
      { name: 'buttonUrl', label: 'Button link (blank = contact form)', half: true },
      { name: 'accent', label: 'Highlight as the "Most Popular" plan', type: 'checkbox' },
      order,
    ],
  },
  products: {
    singular: 'product',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'shortTitle', label: 'Short title', half: true },
      { name: 'price', label: 'Price', half: true, placeholder: '$29.00' },
      { name: 'paddleUrl', label: 'Checkout link (Paddle)', required: true, placeholder: 'https://…' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { name: 'thumbnail', label: 'Thumbnail (square / list view)', type: 'image', maxSide: 900 },
      { name: 'image', label: 'Main product image', type: 'image' },
      { name: 'gallery1', label: 'Extra image 1', type: 'image', maxSide: 1400 },
      { name: 'gallery2', label: 'Extra image 2', type: 'image', maxSide: 1400 },
      { name: 'gallery3', label: 'Extra image 3', type: 'image', maxSide: 1400 },
      { name: 'gallery4', label: 'Extra image 4', type: 'image', maxSide: 1400 },
      { name: 'published', label: 'Published (visible on the website)', type: 'checkbox' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      order,
    ],
  },
};

export type FormCollection = keyof typeof FORMS;

const NEW_DEFAULTS: Partial<Record<FormCollection, Record<string, any>>> = {
  projects: { published: true },
  skills: { level: 80 },
  products: { published: true, featured: true },
  pricingPlans: { period: '/month', buttonText: 'Get Started' },
  services: { iconName: 'Palette' },
};

/** Database item -> string values for the form inputs. */
export function toFormValues(tab: FormCollection, item: Record<string, any> | null): Record<string, any> {
  const out: Record<string, any> = {};
  const src = item ?? NEW_DEFAULTS[tab] ?? {};
  for (const f of FORMS[tab].fields) {
    const v = src[f.name];
    // "published" counts as ticked unless it is explicitly false (rows saved before the upgrade have no value)
    if (f.type === 'checkbox') out[f.name] = f.name === 'published' ? v !== false : Boolean(v);
    else if (f.type === 'tags') out[f.name] = Array.isArray(v) ? v.join(', ') : '';
    else if (f.type === 'lines' || f.type === 'gallery') out[f.name] = Array.isArray(v) ? v.join('\n') : '';
    else out[f.name] = v === undefined || v === null ? '' : String(v);
  }
  return out;
}

const fromValues = (tab: FormCollection, values: Record<string, any>) => {
  const raw: Record<string, any> = {};
  for (const f of FORMS[tab].fields) {
    const v = values[f.name];
    if (f.type === 'checkbox') raw[f.name] = Boolean(v);
    else if (f.type === 'tags') raw[f.name] = String(v).split(',').map((t) => t.trim()).filter(Boolean);
    else if (f.type === 'lines' || f.type === 'gallery') raw[f.name] = String(v).split('\n').map((t) => t.trim()).filter(Boolean);
    else if (f.type === 'number') raw[f.name] = v === '' || v === undefined ? undefined : Number(v);
    else raw[f.name] = typeof v === 'string' ? v.trim() : v;
  }
  return raw;
};

/** Form values -> validated row data (throws a readable Error). */
export function toPayload(tab: FormCollection, values: Record<string, any>): Record<string, any> {
  for (const f of FORMS[tab].fields) {
    if (f.required && !String(values[f.name] ?? '').trim()) throw new Error(`Please fill in “${f.label.replace(/\s*\(.*\)$/, '')}”.`);
  }
  const raw = fromValues(tab, values);
  if ((tab === 'projects' || tab === 'blogPosts')) {
    raw.slug = slugify(String(raw.slug || raw.title || ''));
  }
  switch (tab) {
    case 'projects': return normalizeProject(raw);
    case 'services': return normalizeService(raw);
    case 'blogPosts': return normalizeBlogPost(raw);
    case 'resume': return normalizeResumeItem(raw);
    case 'testimonials': return normalizeTestimonial(raw);
    case 'pricingPlans': return normalizePricingPlan(raw);
    case 'products': return normalizeProduct(raw);
    case 'skills': {
      const level = Number(raw.level);
      if (!Number.isFinite(level) || level < 0 || level > 100) throw new Error('Skill level must be a number from 0 to 100.');
      return { name: raw.name, level: Math.round(level), order: raw.order ?? 0 };
    }
  }
}

export const friendlyError = (message: string) => {
  if (/duplicate key|unique/i.test(message)) return 'That page address is already used by another item. Please choose a different one.';
  if (/row-level security|permission denied|jwt/i.test(message)) return 'You are not allowed to do that. Please sign in again.';
  if (/violates check constraint/i.test(message)) return 'One of the values is too long or not allowed. Please shorten it and try again.';
  return message;
};
