/**
 * Translates between the app's camelCase objects and the database's snake_case
 * columns, and whitelists the columns that may be written.
 */
export type Collection =
  | 'projects' | 'blogPosts' | 'services' | 'resume' | 'skills'
  | 'testimonials' | 'pricingPlans' | 'products' | 'contactSubmissions';

export const TABLES: Record<Collection, string> = {
  projects: 'projects',
  blogPosts: 'blog_posts',
  services: 'services',
  resume: 'resume_items',
  skills: 'skills',
  testimonials: 'testimonials',
  pricingPlans: 'pricing_plans',
  products: 'products',
  contactSubmissions: 'contact_submissions',
};

/** Sort order used when listing each collection. */
export const ORDER: Record<Collection, string> = {
  projects: 'sort_order.asc,created_at.desc',
  blogPosts: 'sort_order.asc,created_at.desc',
  testimonials: 'sort_order.asc,created_at.desc',
  products: 'sort_order.asc,created_at.desc',
  services: 'sort_order.asc,created_at.asc',
  resume: 'sort_order.asc,created_at.asc',
  skills: 'sort_order.asc,created_at.asc',
  pricingPlans: 'sort_order.asc,created_at.asc',
  contactSubmissions: 'created_at.desc',
};

const WRITABLE: Record<Collection, string[]> = {
  projects: ['slug','title','category','image','link','content','tags','gallery','hero_image','client','designer','start_date','intro_title','details_title','details_content','social_title','social_description','social_image','summary','industry','services','feedback_quote','feedback_name','feedback_role','cta_title','cta_button_text','cta_button_url','published','sort_order'],
  blogPosts: ['slug','title','date','excerpt','image','content','author','tags','social_title','social_description','social_image','sort_order'],
  services: ['display_id','title','description','icon_name','sort_order'],
  resume: ['year','role','company','description','sort_order'],
  skills: ['name','level','sort_order'],
  testimonials: ['name','role','content','avatar','sort_order'],
  pricingPlans: ['name','price','period','features','unavailable_features','show_priority_box','priority_title','priority_subtitle','button_text','button_url','accent','sort_order'],
  products: ['title','short_title','description','price','thumbnail','image','paddle_url','gallery1','gallery2','gallery3','gallery4','featured','published','sort_order'],
  contactSubmissions: ['is_read'],
};

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

export function fromRow<T = any>(collection: Collection, row: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'sort_order') out.order = value;
    else if (key === 'description' && collection === 'resume') out.desc = value;
    else out[toCamel(key)] = value;
  }
  return out as T;
}

export function toRow(collection: Collection, data: Record<string, any>): Record<string, any> {
  const allowed = new Set(WRITABLE[collection]);
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    let col = key === 'order' ? 'sort_order' : key === 'desc' && collection === 'resume' ? 'description' : toSnake(key);
    if (!allowed.has(col)) continue;
    if (col === 'slug' && (value === '' || value === null)) { out[col] = null; continue; }
    out[col] = value;
  }
  return out;
}
