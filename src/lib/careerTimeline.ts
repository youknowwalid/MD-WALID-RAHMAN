/**
 * Layout of the home page's career timeline (the editorial "collage" composition).
 *
 * On wide screens the timeline is a fixed composition drawn on a virtual canvas that is
 * CANVAS_W x CANVAS_H units; every position below is in those units and is turned into a
 * percentage by the component, so the whole picture scales with the screen. Narrower screens
 * switch to a vertical timeline and ignore these numbers.
 *
 * Nothing here is content: the words and pictures come from the résumé entries and settings
 * the owner edits in the admin. This file only says WHERE seven entries can sit.
 */

export const CANVAS_W = 1774;
export const CANVAS_H = 960;
/** The dotted axis that runs through the middle of the composition. */
export const AXIS_Y = 571;
/** Radius of the lime date circle. */
export const BADGE_R = 43.5;
/** The composition has room for this many entries; more than that falls back to the vertical timeline. */
export const MAX_CANVAS_ITEMS = 7;

export type SlotId = 'u1' | 'd1' | 'u2' | 'd2' | 'd3' | 'u3' | 'u4';

export interface Box { x: number; y: number; w: number; h: number }

export interface Slot {
  id: SlotId;
  /** Above or below the axis. */
  side: 'up' | 'down';
  /** Where the collage picture sits (the picture is fitted inside this box). */
  photo: Box;
  /** Centre of the lime date circle. */
  badge: { cx: number; cy: number };
  /** Top-left and width of the designation / organisation / description block. */
  text: { x: number; y: number; w: number };
  /** Where this slot's line would naturally meet the axis. */
  dotX: number;
}

/** The seven places in the approved composition, named by side and left-to-right order. */
export const SLOTS: Record<SlotId, Slot> = {
  u1: { id: 'u1', side: 'up',   photo: { x: 35,   y: 189, w: 321, h: 193 }, badge: { cx: 90.5,   cy: 406.5 }, text: { x: 147,  y: 386, w: 215 }, dotX: 147 },
  d1: { id: 'd1', side: 'down', photo: { x: 179,  y: 584, w: 388, h: 152 }, badge: { cx: 255,    cy: 729.5 }, text: { x: 323,  y: 714, w: 255 }, dotX: 232 },
  u2: { id: 'u2', side: 'up',   photo: { x: 368,  y: 190, w: 324, h: 196 }, badge: { cx: 442.5,  cy: 406.5 }, text: { x: 503,  y: 386, w: 195 }, dotX: 320 },
  d2: { id: 'd2', side: 'down', photo: { x: 662,  y: 588, w: 384, h: 150 }, badge: { cx: 703.5,  cy: 729.5 }, text: { x: 770,  y: 714, w: 300 }, dotX: 615 },
  d3: { id: 'd3', side: 'down', photo: { x: 1166, y: 591, w: 376, h: 141 }, badge: { cx: 1214.5, cy: 729.5 }, text: { x: 1289, y: 714, w: 300 }, dotX: 1140 },
  u3: { id: 'u3', side: 'up',   photo: { x: 1120, y: 174, w: 254, h: 217 }, badge: { cx: 1157,   cy: 404.5 }, text: { x: 1219, y: 386, w: 180 }, dotX: 1015 },
  u4: { id: 'u4', side: 'up',   photo: { x: 1399, y: 208, w: 335, h: 193 }, badge: { cx: 1499,   cy: 406 },   text: { x: 1559, y: 386, w: 195 }, dotX: 1411 },
};

/** The fixed pieces around the entries, with the box each one is fitted into. */
export const FIXED = {
  portrait:  { x: 690,  y: 13,  w: 415,  h: 463 } as Box,
  signature: { x: 550,  y: 70,  w: 194,  h: 114 } as Box,
  /** A wide strip that stands on the axis. */
  skyline:   { x: 157,  y: 407, w: 1536, h: 160 } as Box,
  maps:      { x: 597,  y: 830, w: 520,  h: 120 } as Box,
};

/** Which slots are used for N entries, in the order of the entries (oldest first). */
const SLOT_TABLE: Record<number, SlotId[]> = {
  1: ['u2'],
  2: ['u1', 'd2'],
  3: ['u1', 'd2', 'u4'],
  4: ['u1', 'd1', 'd2', 'u4'],
  5: ['u1', 'd1', 'u2', 'd2', 'u4'],
  6: ['u1', 'd1', 'u2', 'd2', 'd3', 'u4'],
  7: ['u1', 'd1', 'u2', 'd2', 'd3', 'u3', 'u4'],
};

export interface Placed { slot: Slot; /** Where this entry's line meets the axis. */ dotX: number }

/**
 * Places `count` entries (oldest first) on the canvas, or returns null when they do not fit
 * (then the component uses the vertical timeline). The dots on the axis always run left to
 * right in the order of the entries, so the axis never misstates the order; a line may slant
 * a little further for that, but it never changes which entry comes first.
 */
export function layoutFor(count: number): Placed[] | null {
  const ids = SLOT_TABLE[count];
  if (!ids) return null;
  const slots = ids.map((id) => SLOTS[id]);
  const dots = slots.map((s) => s.dotX).sort((a, b) => a - b);
  return slots.map((slot, i) => ({ slot, dotX: dots[i] }));
}

/** The first four-digit year in an entry's period, e.g. "2022 - 2023" -> 2022. */
export const startYear = (period: string): number => {
  const m = /(?:19|20)\d{2}/.exec(period || '');
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
};

/**
 * The admin keeps the résumé newest first. The timeline reads oldest to newest, so the list is
 * reversed and then ordered by starting year; entries that start the same year (or have no year yet)
 * keep their reversed order, so an entry with no year yet sits at the end.
 */
export function chronological<T extends { year: string }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index: items.length - 1 - index }))
    .sort((a, b) => (startYear(a.item.year) - startYear(b.item.year)) || (a.index - b.index))
    .map((x) => x.item);
}

/** "2019 - 2020" -> ["2019 –", "2020"] so the date fits the round badge on two lines. */
export function badgeLines(period: string): string[] {
  const t = (period || '').trim();
  if (!t) return [];
  const parts = t.split(/\s*[-–—]\s*/).filter(Boolean);
  return parts.length === 2 ? [`${parts[0]} –`, parts[1]] : [t];
}

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;
export const pctX = (v: number) => pct(v, CANVAS_W);
export const pctY = (v: number) => pct(v, CANVAS_H);
