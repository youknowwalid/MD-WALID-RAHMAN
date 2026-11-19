import React from 'react';
import { Align, parseInline, splitAlign, splitParagraphs } from '../lib/richtext';

/** Bold and italic pieces of one line of text, as normal elements (no HTML is ever injected). */
export function RichInline({ text }: { text: string }) {
  const parts = parseInline(text);
  return (
    <>
      {parts.map((p, i) =>
        p.bold || p.italic ? (
          <span key={i} className={`${p.bold ? 'font-bold' : ''} ${p.italic ? 'italic' : ''}`.trim()}>{p.text}</span>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ),
      )}
    </>
  );
}

const alignStyle = (align?: Align): React.CSSProperties | undefined => (align ? { textAlign: align } : undefined);

/**
 * A formatted text: one paragraph per blank-line-separated block, each with its own alignment.
 * `className` styles the wrapper (spacing, colour, size); `paraClassName` styles every paragraph.
 */
export function RichText({ text, className = '', paraClassName = '', as: Tag = 'div' }: {
  text: string; className?: string; paraClassName?: string; as?: 'div' | 'article' | 'section' | 'blockquote';
}) {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return null;
  return (
    <Tag className={`space-y-4 ${className}`.trim()}>
      {paragraphs.map((p, i) => {
        const { align, text: body } = splitAlign(p);
        return <p key={i} style={alignStyle(align)} className={`whitespace-pre-wrap ${paraClassName}`.trim()}><RichInline text={body} /></p>;
      })}
    </Tag>
  );
}

/**
 * The same text as ONE element, for cards that clip it to a few lines: paragraphs run on after each other,
 * bold and italic are kept, and the alignment of the first paragraph is used.
 */
export function RichClamp({ text, as: Tag = 'p', className = '' }: { text: string; as?: 'p' | 'blockquote' | 'div'; className?: string }) {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return null;
  const first = splitAlign(paragraphs[0]);
  return (
    <Tag style={alignStyle(first.align)} className={className}>
      {paragraphs.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' '}
          <RichInline text={i === 0 ? first.text : splitAlign(p).text} />
        </React.Fragment>
      ))}
    </Tag>
  );
}
