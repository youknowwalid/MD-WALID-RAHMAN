import React, { useLayoutEffect, useRef } from 'react';
import { AlignJustify, AlignLeft, AlignRight, Bold, Italic, RemoveFormatting } from 'lucide-react';
import { Align, Edit, InlineFormat, applyAlign, applyInlineFormat, splitAlign } from '../../lib/richtext';
import { RichInline, RichText } from '../RichText';
import { parseContent } from '../../lib/text';
import { inputCls, labelCls } from './fields';

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

const btn =
  'inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-sm text-gray-200 transition-colors hover:border-accent hover:text-accent focus-visible:border-accent';

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={btn}>
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

/** A text box with Bold / Italic / Regular and three alignment buttons. The text stays plain text (see lib/richtext.ts). */
export default function RichTextArea({ id, label, value, onChange, rows = 4, maxLength, required, mono, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<{ start: number; end: number } | null>(null);

  // Put the selection back after the text has been replaced, so several buttons can be pressed in a row.
  useLayoutEffect(() => {
    const p = pending.current;
    const ta = ref.current;
    if (!p || !ta) return;
    pending.current = null;
    ta.focus();
    ta.setSelectionRange(p.start, p.end);
  }, [value]);

  const run = (edit: (v: string, s: number, e: number) => Edit) => {
    const ta = ref.current;
    if (!ta) return;
    const next = edit(ta.value, ta.selectionStart, ta.selectionEnd);
    if (next.value === ta.value) { ta.focus(); return; }
    if (maxLength && next.value.length > maxLength) return;
    pending.current = { start: next.start, end: next.end };
    onChange(next.value);
  };
  const inline = (fmt: InlineFormat) => () => run((v, s, e) => applyInlineFormat(v, s, e, fmt));
  const align = (a: Align) => () => run((v, s, e) => applyAlign(v, s, e, a));

  const formatted = /\*[^\s*]|^\s*\[(left|justify|right)\]|\n\s*\[(left|justify|right)\]/.test(value);

  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <div role="toolbar" aria-label="Text formatting buttons" className="mb-2 flex flex-wrap items-center gap-1.5">
        <ToolButton title="Bold" onClick={inline('bold')}><Bold className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Bold</span></ToolButton>
        <ToolButton title="Italic" onClick={inline('italic')}><Italic className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Italic</span></ToolButton>
        <ToolButton title="Regular (remove bold and italic)" onClick={inline('regular')}><RemoveFormatting className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Regular</span></ToolButton>
        <span className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />
        <ToolButton title="Align left" onClick={align('left')}><AlignLeft className="h-4 w-4" aria-hidden="true" /></ToolButton>
        <ToolButton title="Align box (justified)" onClick={align('justify')}><AlignJustify className="h-4 w-4" aria-hidden="true" /></ToolButton>
        <ToolButton title="Align right" onClick={align('right')}><AlignRight className="h-4 w-4" aria-hidden="true" /></ToolButton>
      </div>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} resize-y ${mono ? 'font-mono' : ''}`}
      />
      <p className="mt-1.5 text-xs text-gray-400">Select the words, then tap a button. Alignment applies to the paragraph your cursor is in.</p>
      {formatted && (
        <div className="mt-3">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Preview</span>
          {mono
            ? <ArticlePreview text={value} />
            : <RichText text={value} className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-bg-dark p-4 text-sm leading-relaxed text-gray-200" />}
        </div>
      )}
    </div>
  );
}
