import { describe, expect, it } from 'vitest';
import { applyAlign, applyInlineFormat, parseInline, splitAlign, splitParagraphs, stripFormatting } from '../../src/lib/richtext';

describe('text formatting marks', () => {
  it('reads bold, italic and both, and leaves loose asterisks alone', () => {
    const segs = parseInline('a **b *c* d** e *f* ***g*** 5 * 3 * 4');
    expect(segs.filter((s) => s.bold && !s.italic).map((s) => s.text.trim())).toEqual(['b', 'd']);
    expect(segs.filter((s) => s.italic && !s.bold).map((s) => s.text)).toEqual(['f']);
    expect(segs.filter((s) => s.bold && s.italic).map((s) => s.text)).toEqual(['c', 'g']);
    expect(segs[segs.length - 1].text).toBe(' 5 * 3 * 4');
  });

  it('reads the alignment of a paragraph and splits paragraphs on blank lines', () => {
    expect(splitAlign('[justify] hello')).toEqual({ align: 'justify', text: 'hello' });
    expect(splitAlign('plain text')).toEqual({ text: 'plain text' });
    expect(splitParagraphs('one\n\n\ntwo\nstill two\n \nthree')).toEqual(['one', 'two\nstill two', 'three']);
  });

  it('strips every mark for plain-text places', () => {
    expect(stripFormatting('[right] hi **x** and *y*\nz')).toBe('hi x and y\nz');
    expect(stripFormatting('')).toBe('');
  });
});

describe('toolbar: bold, italic, regular', () => {
  it('bolds a selection, adds italic, switches bold off, and back to regular', () => {
    let r = applyInlineFormat('Hello brave new world', 6, 11, 'bold');
    expect(r.value).toBe('Hello **brave** new world');
    r = applyInlineFormat(r.value, r.start, r.end, 'italic');
    expect(r.value).toBe('Hello ***brave*** new world');
    r = applyInlineFormat(r.value, r.start, r.end, 'bold');
    expect(r.value).toBe('Hello *brave* new world');
    r = applyInlineFormat(r.value, r.start + 1, r.start + 2, 'regular'); // a selection inside the marks still clears them
    expect(r.value).toBe('Hello brave new world');
  });

  it('uses the word under the cursor when nothing is selected', () => {
    expect(applyInlineFormat('one two', 2, 2, 'bold').value).toBe('**one** two');
  });

  it('keeps headings and bullets working when a block is made bold', () => {
    const r = applyInlineFormat('### Title\n- item one\n- item two', 0, 31, 'bold');
    expect(r.value).toBe('### **Title**\n- **item one**\n- **item two**');
  });
});

describe('toolbar: alignment', () => {
  it('aligns the paragraph under the cursor and replaces an earlier alignment', () => {
    const a = applyAlign('First para\n\nSecond para\n\n### Head', 3, 3, 'right');
    expect(a.value).toBe('[right] First para\n\nSecond para\n\n### Head');
    const b = applyAlign(a.value, 0, a.value.length, 'justify');
    expect(b.value).toBe('[justify] First para\n\n[justify] Second para\n\n### Head'); // headings are left alone
  });
});
