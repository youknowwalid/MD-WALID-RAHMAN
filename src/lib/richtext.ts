/**
 * Light text formatting for the texts typed in the admin (articles, stories, policies, descriptions…).
 *
 * The saved text stays plain text, so every existing text keeps working:
 *   **bold**   *italic*   ***bold and italic***
 *   [left] / [justify] / [right] at the very start of a paragraph sets that paragraph's alignment.
 *   [link text](/services/web-development)   a link: only a page of this site (starts with /) or an https:// address.
 * Nothing here ever produces HTML: the page turns the result into normal React elements.
 */

export type Align = 'left' | 'justify' | 'right';
export type InlineFormat = 'bold' | 'italic' | 'regular';

export interface Inline { text: string; bold: boolean; italic: boolean; href?: string; raw?: string }

const ALIGN_MARK = /^\[(left|justify|right)\][ \t]?/;
/** bold+italic, bold, italic — in that order. A mark must touch the word (so "5 * 3 * 4" stays as typed). */
const INLINE_SRC = '\\*\\*\\*(\\S(?:[^*\\n]*?\\S)?)\\*\\*\\*|\\*\\*(\\S(?:[\\s\\S]*?\\S)?)\\*\\*|\\*(\\S(?:[^*\\n]*?\\S)?)\\*';

/** [text](address): the address is a page of this site ("/…", not "//…") or an https:// address. Nothing else is a link. */
const LINK_SRC = '\\[([^\\]\\n]+)\\]\\((\\/(?!\\/)[^\\s)]*|https:\\/\\/[^\\s)]+)\\)';
const PARSE_SRC = `${INLINE_SRC}|${LINK_SRC}`;

/** Splits a paragraph into its alignment (if any) and the rest of the text. */
export const splitAlign = (paragraph: string): { align?: Align; text: string } => {
  const t = paragraph.replace(/^\s+/, '');
  const m = ALIGN_MARK.exec(t);
  return m ? { align: m[1] as Align, text: t.slice(m[0].length) } : { text: paragraph };
};

/** Paragraphs are separated by a blank line. */
export const splitParagraphs = (text: string): string[] =>
  (text || '').replace(/\r\n/g, '\n').split(/\n[ \t]*\n/).map((p) => p.replace(/^\s+|\s+$/g, '')).filter(Boolean);

export function parseInline(src: string, bold = false, italic = false): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    const m = new RegExp(PARSE_SRC).exec(rest);
    if (!m) { out.push({ text: rest, bold, italic }); break; }
    if (m.index > 0) out.push({ text: rest.slice(0, m.index), bold, italic });
    if (m[4] !== undefined) out.push({ text: m[4], bold, italic, href: m[5], raw: m[0] });
    else if (m[1] !== undefined) out.push({ text: m[1], bold: true, italic: true });
    else if (m[2] !== undefined) out.push(...parseInline(m[2], true, italic));
    else out.push(...parseInline(m[3], bold, true));
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

/** The text without any formatting marks (for search results, meta tags and one-line cards). */
export const stripFormatting = (text: string): string =>
  (text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => parseInline(splitAlign(line).text).map((s) => s.text).join(''))
    .join('\n');

// ───────────────────────── toolbar helpers (used by the admin editor) ─────────────────────────

export interface Edit { value: string; start: number; end: number }

/** Every marked-up stretch of the text, as [start, end) positions. */
const markedRuns = (value: string): [number, number][] => {
  const runs: [number, number][] = [];
  const re = new RegExp(INLINE_SRC, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(value))) runs.push([m.index, m.index + m[0].length]);
  return runs;
};

const LINE_PREFIX = /^(\s*(?:#{2,4}\s+|[-*]\s+|\[(?:left|justify|right)\][ \t]?))?/;

/** Bold / italic / regular on the selected text. With nothing selected, the word under the cursor is used. */
export function applyInlineFormat(value: string, start: number, end: number, fmt: InlineFormat): Edit {
  let s = Math.min(start, end);
  let e = Math.max(start, end);
  if (s === e) {
    // Cursor only: take the word around it.
    while (s > 0 && !/\s/.test(value[s - 1])) s--;
    while (e < value.length && !/\s/.test(value[e])) e++;
    if (s === e) return { value, start, end };
  }
  // A selection that touches part of a marked stretch takes the whole stretch, so no stray marks are left behind.
  for (const [rs, re] of markedRuns(value)) {
    if (rs < e && re > s) { s = Math.min(s, rs); e = Math.max(e, re); }
  }
  const sel = value.slice(s, e);
  if (new RegExp(LINK_SRC).test(sel)) return { value, start, end }; // a link keeps its address: bold and italic leave it alone
  const lead = /^\s*/.exec(sel)![0];
  const trail = sel.length > lead.length ? /\s*$/.exec(sel)![0] : '';
  const core = sel.slice(lead.length, sel.length - trail.length);
  if (!core) return { value, start, end };

  const lines = core.split('\n').map((line) => {
    const prefix = LINE_PREFIX.exec(line)![0];
    return { prefix, body: line.slice(prefix.length) };
  });
  const segs = parseInline(lines.map((l) => l.body).join('\n')).filter((x) => x.text.trim());
  const allBold = segs.length > 0 && segs.every((x) => x.bold);
  const allItalic = segs.length > 0 && segs.every((x) => x.italic);
  const bold = fmt === 'bold' ? !allBold : fmt === 'italic' ? allBold : false;
  const italic = fmt === 'italic' ? !allItalic : fmt === 'bold' ? allItalic : false;
  const mark = bold && italic ? '***' : bold ? '**' : italic ? '*' : '';

  const rebuilt = lines
    .map(({ prefix, body }) => {
      const plain = parseInline(body).map((x) => x.text).join('');
      if (!plain.trim()) return prefix + plain;
      const l = /^\s*/.exec(plain)![0];
      const t = /\s*$/.exec(plain)![0];
      return prefix + l + mark + plain.slice(l.length, plain.length - t.length) + mark + t;
    })
    .join('\n');

  const next = value.slice(0, s) + lead + rebuilt + trail + value.slice(e);
  return { value: next, start: s + lead.length, end: s + lead.length + rebuilt.length };
}

/** Sets the alignment of every paragraph the selection touches (headings and bullet lines are left alone). */
export function applyAlign(value: string, start: number, end: number, align: Align): Edit {
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  // Paragraph ranges, separated by blank lines.
  const ranges: [number, number][] = [];
  let from = 0;
  const sep = /\n[ \t]*\n/g;
  let m: RegExpExecArray | null;
  while ((m = sep.exec(value))) { ranges.push([from, m.index]); from = m.index + m[0].length; }
  ranges.push([from, value.length]);

  let out = '';
  let cursor = 0;
  let newStart = lo;
  let newEnd = hi;
  for (const [ps, pe] of ranges) {
    if (!(ps <= hi && pe >= lo) || ps === pe) continue;
    const para = value.slice(ps, pe);
    const lead = /^\s*/.exec(para)![0];
    const body = para.slice(lead.length);
    if (/^(#{2,4}\s|[-*]\s)/.test(body)) continue;
    const old = ALIGN_MARK.exec(body);
    const replaced = `[${align}] `;
    const delta = replaced.length - (old ? old[0].length : 0);
    out += value.slice(cursor, ps + lead.length) + replaced;
    cursor = ps + lead.length + (old ? old[0].length : 0);
    if (ps + lead.length <= lo) newStart += delta;
    if (ps + lead.length <= hi) newEnd += delta;
  }
  out += value.slice(cursor);
  return { value: out, start: newStart, end: newEnd };
}
