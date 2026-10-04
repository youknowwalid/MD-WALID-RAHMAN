/** Small pure helpers (unit-tested). */

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const readingMinutes = (text: string) => Math.max(1, Math.round((text.trim().split(/\s+/).filter(Boolean).length || 0) / 200));

/** Only http(s), mailto, tel, relative and #anchor links are allowed; anything else becomes ''. */
export const safeUrl = (url: string | undefined | null): string => {
  const u = (url || '').trim();
  if (!u) return '';
  if (/^(https?:|mailto:|tel:)/i.test(u) || u.startsWith('/') || u.startsWith('#')) return u;
  return '';
};

export type Block =
  | { type: 'h'; level: 2 | 3 | 4; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

/** Turns plain text with "### Heading" and "- bullet" lines into safe renderable blocks (no HTML is ever injected). */
export const parseContent = (text: string): Block[] => {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => { if (para.length) { blocks.push({ type: 'p', text: para.join('\n') }); para = []; } };
  const flushList = () => { if (list.length) { blocks.push({ type: 'ul', items: list }); list = []; } };
  for (const raw of (text || '').replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (h) { flushPara(); flushList(); blocks.push({ type: 'h', level: h[1].length as 2 | 3 | 4, text: h[2] }); }
    else if (li) { flushPara(); list.push(li[1]); }
    else if (!line.trim()) { flushPara(); flushList(); }
    else { flushList(); para.push(line); }
  }
  flushPara(); flushList();
  return blocks;
};
