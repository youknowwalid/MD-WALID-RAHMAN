import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlignJustify, AlignLeft, AlignRight, Bold, Italic, RemoveFormatting } from 'lucide-react';
import { Align, parseInline, splitAlign } from '../../lib/richtext';
import { parseContent } from '../../lib/text';
import { RichInline } from '../RichText';
import { inputCls, labelCls } from './fields';

/**
 * A "what you see is what you get" text box: bold, italic and alignment show inside the box the moment a button is pressed.
 *
 * The saved value is still plain text (see lib/richtext.ts):  **bold**  *italic*  and [right] / [justify] / [left]
 * at the start of a paragraph. Inside the box every line is one <div> and a blank line is an empty <div>,
 * so the box and the saved text always match line for line.
 */

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  mono?: boolean;
  placeholder?: string;
}

// ───────────────────────── saved text  →  lines in the box ─────────────────────────

function appendInline(parent: HTMLElement, text: string) {
  for (const seg of parseInline(text)) {
    let node: Node = document.createTextNode(seg.raw ?? seg.text); // a link stays as typed: [text](address)
    if (seg.italic) { const i = document.createElement('i'); i.appendChild(node); node = i; }
    if (seg.bold) { const b = document.createElement('b'); b.appendChild(node); node = b; }
    parent.appendChild(node);
  }
}

function buildDom(root: HTMLElement, value: string) {
  root.textContent = '';
  if (!value) return;
  let align: Align | undefined;
  let startOfParagraph = true;
  for (const line of value.replace(/\r\n/g, '\n').split('\n')) {
    const div = document.createElement('div');
    if (!line.trim()) {
      div.appendChild(document.createElement('br'));
      align = undefined;
      startOfParagraph = true;
    } else {
      let body = line;
      if (startOfParagraph) {
        const parsed = splitAlign(line);
        align = parsed.align;
        if (parsed.align) body = parsed.text;
      }
      startOfParagraph = false;
      if (align) div.style.textAlign = align;
      appendInline(div, body);
    }
    root.appendChild(div);
  }
}

// ───────────────────────── lines in the box  →  saved text ─────────────────────────

interface Run { text: string; bold: boolean; italic: boolean }
interface Line { align: string; runs: Run[] }

const alignOf = (el: HTMLElement): string => {
  const a = (el.style.textAlign || el.getAttribute('align') || '').toLowerCase();
  return a === 'left' || a === 'right' || a === 'justify' ? a : '';
};

function collectLines(root: HTMLElement): Line[] {
  const lines: Line[] = [];
  let open: Line | null = null;
  const ensure = (align: string): Line => {
    if (!open) { open = { align, runs: [] }; lines.push(open); }
    return open;
  };
  const walk = (node: Node, align: string, bold: boolean, italic: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.nodeValue || '').replace(/ /g, ' ').replace(/\n/g, ' ');
      if (t) ensure(align).runs.push({ text: t, bold, italic });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;
    if (tag === 'BR') {
      if (open) open = null; // a line break ends the line…
      else lines.push({ align, runs: [] }); // …and two in a row leave an empty line
      return;
    }
    const nextAlign = alignOf(el) || align;
    const isBold = bold || tag === 'B' || tag === 'STRONG' || /^(bold|[6-9]00)$/.test(el.style.fontWeight);
    const isItalic = italic || tag === 'I' || tag === 'EM' || el.style.fontStyle === 'italic';
    if (tag === 'DIV' || tag === 'P') {
      open = null;
      const before = lines.length;
      el.childNodes.forEach((c) => walk(c, nextAlign, isBold, isItalic));
      if (lines.length === before) lines.push({ align: nextAlign, runs: [] }); // an empty <div> is an empty line
      open = null;
      return;
    }
    el.childNodes.forEach((c) => walk(c, nextAlign, isBold, isItalic));
  };
  root.childNodes.forEach((c) => walk(c, '', false, false));
  return lines;
}

function runsToText(runs: Run[]): string {
  const merged: Run[] = [];
  for (const r of runs) {
    const last = merged[merged.length - 1];
    if (last && last.bold === r.bold && last.italic === r.italic) last.text += r.text;
    else merged.push({ ...r });
  }
  return merged
    .map(({ text, bold, italic }) => {
      if (!bold && !italic) return text;
      const lead = /^\s*/.exec(text)![0];
      const trail = /\s*$/.exec(text)![0];
      const core = text.slice(lead.length, text.length - trail.length);
      if (!core) return text;
      const mark = bold && italic ? '***' : bold ? '**' : '*';
      return lead + mark + core + mark + trail;
    })
    .join('');
}

function serialize(root: HTMLElement): string {
  const out: string[] = [];
  let startOfParagraph = true;
  for (const line of collectLines(root)) {
    const text = runsToText(line.runs);
    if (!text.trim()) { out.push(''); startOfParagraph = true; continue; }
    const isBlockLine = /^\s*(#{2,4}\s|[-*]\s)/.test(text); // headings and bullets cannot carry an alignment mark
    out.push(startOfParagraph && line.align && !isBlockLine ? `[${line.align}] ${text}` : text);
    startOfParagraph = false;
  }
  return out.join('\n').replace(/^\n+|\n+$/g, '');
}

// ───────────────────────── editing helpers ─────────────────────────

/** Makes every loose piece of text a line of its own, so each line is a direct child of the box. */
function normalizeLines(root: HTMLElement) {
  let group: HTMLElement | null = null;
  Array.from(root.childNodes).forEach((n) => {
    const isBlock = n.nodeType === Node.ELEMENT_NODE && ['DIV', 'P'].includes((n as HTMLElement).tagName);
    if (isBlock) { group = null; return; }
    if (!group) { group = document.createElement('div'); root.insertBefore(group, n); }
    group.appendChild(n);
  });
}

const isEmptyLine = (el: Element) => !(el.textContent || '').trim();

/** The lines of the paragraph(s) the selection touches (a paragraph ends at an empty line). */
function paragraphLines(root: HTMLElement, range: Range): HTMLElement[] {
  const lines = Array.from(root.children) as HTMLElement[];
  const touched = lines.map((l, i) => (range.intersectsNode(l) ? i : -1)).filter((i) => i >= 0);
  if (touched.length === 0) return [];
  let lo = touched[0];
  let hi = touched[touched.length - 1];
  while (lo > 0 && !isEmptyLine(lines[lo - 1])) lo--;
  while (hi < lines.length - 1 && !isEmptyLine(lines[hi + 1])) hi++;
  return lines.slice(lo, hi + 1).filter((l) => !isEmptyLine(l));
}

const btn =
  'inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-sm text-gray-200 transition-colors hover:border-accent hover:text-accent focus-visible:border-accent aria-pressed:border-accent aria-pressed:bg-accent/15 aria-pressed:text-accent';

function ToolButton({ title, pressed, onClick, children }: { title: string; pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} aria-pressed={pressed} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={btn}>
      {children}
    </button>
  );
}

/** Preview for articles: headings (### ), bullets (- ) and paragraphs, like the blog page. */
function ArticlePreview({ text }: { text: string }) {
  return (
    <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-bg-dark p-4 text-sm leading-relaxed text-gray-200">
      {parseContent(text).map((b, i) =>
        b.type === 'h' ? <p key={i} className="pt-2 text-base font-semibold text-white"><RichInline text={b.text} /></p>
        : b.type === 'ul' ? <ul key={i} className="list-disc space-y-1 pl-5">{b.items.map((it, j) => <li key={j}><RichInline text={it} /></li>)}</ul>
        : (() => { const { align, text: body } = splitAlign(b.text); return <p key={i} style={align ? { textAlign: align } : undefined} className="whitespace-pre-wrap"><RichInline text={body} /></p>; })(),
      )}
    </div>
  );
}

export default function RichTextArea({ id, label, value, onChange, rows = 4, maxLength, required, mono, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string | null>(null); // the text the box currently shows
  const [state, setState] = useState<{ bold: boolean; italic: boolean; align: string }>({ bold: false, italic: false, align: '' });

  // Show the saved text in the box whenever it was changed from outside (opening, "restore the starting text"…).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || value === lastValue.current) return;
    buildDom(el, value);
    lastValue.current = value;
  }, [value]);

  const caretToEnd = (el: HTMLElement) => {
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  };

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    let text = serialize(el);
    if (maxLength && text.length > maxLength) {
      text = text.slice(0, maxLength);
      buildDom(el, text);
      caretToEnd(el);
    } else if (!text && !el.textContent) {
      el.textContent = ''; // so the placeholder can show again
    }
    lastValue.current = text;
    onChange(text);
  }, [maxLength, onChange]);

  // Which buttons are "on" for the text under the cursor.
  useEffect(() => {
    const read = () => {
      const el = ref.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
      let line: Node | null = sel.anchorNode;
      while (line && line.parentNode !== el) line = line.parentNode;
      const align = line && line.nodeType === Node.ELEMENT_NODE ? alignOf(line as HTMLElement) : '';
      setState({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), align });
    };
    document.addEventListener('selectionchange', read);
    return () => document.removeEventListener('selectionchange', read);
  }, []);

  const focusBox = (): Range | null => {
    const el = ref.current;
    if (!el) return null;
    const sel = window.getSelection();
    if (!sel) return null;
    if (sel.rangeCount === 0 || !el.contains(sel.anchorNode)) { el.focus(); caretToEnd(el); }
    return sel.rangeCount ? sel.getRangeAt(0) : null;
  };

  const format = (command: 'bold' | 'italic' | 'removeFormat') => () => {
    if (!focusBox()) return;
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(command);
    emit();
  };

  const align = (a: Align) => () => {
    const el = ref.current;
    const range = focusBox();
    if (!el || !range) return;
    const sel = window.getSelection();
    if (!sel) return;
    if (!el.textContent && el.children.length <= 1) {
      // an empty box: start an aligned line, so what is typed next is aligned too
      el.textContent = '';
      const div = document.createElement('div');
      div.style.textAlign = a;
      div.appendChild(document.createElement('br'));
      el.appendChild(div);
      const r = document.createRange();
      r.setStart(div, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      setState((s) => ({ ...s, align: a }));
      return;
    }
    // Wrapping loose text into lines moves nodes, so remember the selection and put it back afterwards.
    const { startContainer: sc, startOffset: so, endContainer: ec, endOffset: eo } = range;
    normalizeLines(el);
    const live = document.createRange();
    try {
      live.setStart(sc, so);
      live.setEnd(ec, eo);
      sel.removeAllRanges();
      sel.addRange(live);
    } catch {
      /* keep whatever the browser selected */
    }
    const now = sel.rangeCount ? sel.getRangeAt(0) : live;
    for (const line of paragraphLines(el, now)) line.style.textAlign = a;
    setState((s) => ({ ...s, align: a }));
    emit();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain').replace(/\r\n/g, '\n');
    document.execCommand('insertText', false, text);
    emit();
  };

  const labelId = `${id}-label`;
  const showArticlePreview = Boolean(mono) && /^\s*(#{2,4}\s|[-*]\s)/m.test(value);

  return (
    <div>
      <label id={labelId} className={labelCls} onClick={() => ref.current?.focus()}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <div role="toolbar" aria-label="Text formatting buttons" className="mb-2 flex flex-wrap items-center gap-1.5">
        <ToolButton title="Bold" pressed={state.bold} onClick={format('bold')}><Bold className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Bold</span></ToolButton>
        <ToolButton title="Italic" pressed={state.italic} onClick={format('italic')}><Italic className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Italic</span></ToolButton>
        <ToolButton title="Regular (remove bold and italic)" onClick={format('removeFormat')}><RemoveFormatting className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Regular</span></ToolButton>
        <span className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />
        <ToolButton title="Align left" pressed={state.align === 'left'} onClick={align('left')}><AlignLeft className="h-4 w-4" aria-hidden="true" /></ToolButton>
        <ToolButton title="Align box (justified)" pressed={state.align === 'justify'} onClick={align('justify')}><AlignJustify className="h-4 w-4" aria-hidden="true" /></ToolButton>
        <ToolButton title="Align right" pressed={state.align === 'right'} onClick={align('right')}><AlignRight className="h-4 w-4" aria-hidden="true" /></ToolButton>
      </div>
      <div className="relative">
        <div
          ref={ref}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelId}
          aria-required={required || undefined}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          data-placeholder={placeholder}
          onInput={emit}
          onPaste={onPaste}
          onDrop={(e) => e.preventDefault()}
          style={{ minHeight: `${rows * 1.6 + 1.5}em` }}
          className={`${inputCls} max-h-[32rem] resize-y overflow-y-auto leading-relaxed whitespace-pre-wrap break-words empty:before:text-gray-500 empty:before:content-[attr(data-placeholder)] ${mono ? 'font-mono' : ''}`}
        />
        {/* Lets the browser's own "please fill this in" check work for required boxes, and mirrors the saved text. */}
        <textarea
          tabIndex={-1}
          aria-hidden="true"
          data-testid={`${id}-value`}
          required={required}
          value={value}
          onChange={() => {}}
          onFocus={() => ref.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px resize-none opacity-0"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-400">Select the words, then tap a button. Press Enter twice to start a new paragraph; alignment applies to the paragraph your cursor is in.</p>
      {showArticlePreview && (
        <div className="mt-3">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Preview (headings and lists)</span>
          <ArticlePreview text={value} />
        </div>
      )}
    </div>
  );
}
