import { describe, expect, it } from 'vitest';
import { badgeLines, chronological, layoutFor, MAX_CANVAS_ITEMS, startYear } from '../../src/lib/careerTimeline';

describe('career timeline layout', () => {
  it('places 1 to 7 entries on the canvas with dots running left to right', () => {
    for (let n = 1; n <= MAX_CANVAS_ITEMS; n++) {
      const placed = layoutFor(n);
      expect(placed).not.toBeNull();
      expect(placed).toHaveLength(n);
      const dots = placed!.map((p) => p.dotX);
      expect([...dots].sort((a, b) => a - b)).toEqual(dots);
    }
  });
  it('falls back to the vertical list when there are none or too many', () => {
    expect(layoutFor(0)).toBeNull();
    expect(layoutFor(MAX_CANVAS_ITEMS + 1)).toBeNull();
  });
});

describe('career timeline order', () => {
  it('reads the newest-first résumé oldest to newest', () => {
    const items = [{ year: '2024 - Present' }, { year: '2023 - 2024' }, { year: '2020 - 2022' }, { year: '2019 - 2020' }];
    expect(chronological(items).map((i) => i.year)).toEqual(['2019 - 2020', '2020 - 2022', '2023 - 2024', '2024 - Present']);
  });
  it('keeps same-year entries in reversed admin order and puts undated ones last', () => {
    const items = [{ year: '', id: 'new' }, { year: '2023 - 2024', id: 'a' }, { year: '2023 - 2024', id: 'b' }];
    expect(chronological(items).map((i) => i.id)).toEqual(['b', 'a', 'new']);
  });
  it('reads the first year of a period', () => {
    expect(startYear('2022 - 2023')).toBe(2022);
    expect(startYear('Present')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('career timeline badge', () => {
  it('splits a period over two lines', () => {
    expect(badgeLines('2019 - 2020')).toEqual(['2019 –', '2020']);
    expect(badgeLines('2024 – Present')).toEqual(['2024 –', 'Present']);
    expect(badgeLines('2021')).toEqual(['2021']);
    expect(badgeLines('')).toEqual([]);
  });
});
