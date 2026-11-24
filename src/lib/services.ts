/**
 * Service pages: reads what the admin saved (site_settings.global.servicePages) and turns it into safe,
 * ready-to-show values. Nothing about any service is written here; with nothing saved there are no service pages.
 * (The server reads the same data in api/_services.js, which follows the same rules.)
 */
import type { ServicePage } from './defaults';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const lines = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** "Web & Software Development" -> "web-and-software-development". */
export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');

/** Splits text on blank lines into plain paragraphs. */
export const paragraphsOf = (v: string) => v.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

/** A chip's text as a lookup key: case and spacing do not matter. */
export const chipKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export const emptyService = (): ServicePage => ({
  id: '', slug: '', name: '', chip: '', summary: '', headline: '', intro: '', image: '',
  included: [], steps: [], ctaTitle: '', ctaButton: '', ctaUrl: '', hidden: false,
});

/** Saved list -> clean list. Entries without a valid id, a web-address name and a title are dropped; hidden ones too unless asked. */
export function cleanServices(raw: unknown, { includeHidden = false }: { includeHidden?: boolean } = {}): ServicePage[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ServicePage[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const s: ServicePage = {
      id: str(o.id), slug: str(o.slug), name: str(o.name), chip: str(o.chip), summary: str(o.summary), headline: str(o.headline),
      intro: str(o.intro), image: str(o.image), included: lines(o.included),
      steps: (Array.isArray(o.steps) ? o.steps : []).map((x: any) => ({ title: str(x?.title), text: str(x?.text) })).filter((x) => x.title && x.text),
      ctaTitle: str(o.ctaTitle), ctaButton: str(o.ctaButton), ctaUrl: str(o.ctaUrl), hidden: o.hidden === true,
    };
    if (!isUuid(s.id) || !SLUG_RE.test(s.slug) || !s.name || seen.has(s.slug)) continue;
    if (s.hidden && !includeHidden) continue;
    seen.add(s.slug);
    out.push(s);
  }
  return out;
}

/** chip text -> page address, for the chips of the home page that have a page of their own. */
export function chipLinks(services: ServicePage[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of services) if (s.chip) out[chipKey(s.chip)] = `/services/${s.slug}`;
  return out;
}
