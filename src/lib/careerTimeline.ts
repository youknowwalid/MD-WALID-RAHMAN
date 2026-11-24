/**
 * Layout of the home page's career timeline (the editorial "collage" composition).
 *
 * On wide screens the timeline is a fixed composition drawn on a virtual canvas that is
 * CANVAS_W x CANVAS_H units; every position below is in those units and is turned into a
 * percentage by the component, so the whole picture scales with the screen. Narrower screens
 * switch to a compact two-column timeline and ignore these numbers.
 *
 * Nothing here is content: the words and pictures come from the résumé entries and settings
 * the owner edits in the admin. This file only says WHERE seven entries can sit.
 */

export const CANVAS_W = 1774;
export const CANVAS_H = 640;
/** The dotted axis that runs through the middle of the composition. */
export const AXIS_Y = 340;
/** Radius of the lime date circle. */
export const BADGE_R = 34;
/** The composition has room for this many entries; more than that falls back to the compact two-column list. */
export const MAX_CANVAS_ITEMS = 7;

export type SlotId = 'u1' | 'd1' | 'u2' | 'd2' | 'd3' | 'u3' | 'u4';

export interface Box { x: number; y: number; w: number; h: number }

export interface Slot {
  id: SlotId;
  /** Above or below the axis. */
  side: 'up' | 'down';
  /** Where the collage picture sits (the picture is fitted inside this box, against the edge that faces the text). */
  photo: Box;
  /** Centre of the lime date circle. */
  badge: { cx: number; cy: number };
  /** Top-left and width of the designation / organisation / description block. */
  text: { x: number; y: number; w: number };
  /** Where this slot's line would naturally meet the axis. */
  dotX: number;
}

/** Pictures above the axis end at this line and the text starts under it. */
const UP_BOTTOM = 178;
/** Pictures below the axis start here. */
const DOWN_TOP = 362;

const up = (id: SlotId, x: number, w: number, textW: number, dotX: number): Slot => ({
  id, side: 'up',
  photo: { x, y: UP_BOTTOM - 172, w, h: 172 },
  badge: { cx: x + 52, cy: UP_BOTTOM + 24 },
  text: { x: x + 96, y: UP_BOTTOM, w: textW },
  dotX,
});
const down = (id: SlotId, x: number, w: number, textW: number, dotX: number): Slot => ({
  id, side: 'down',
  photo: { x, y: DOWN_TOP, w, h: 128 },
  badge: { cx: x + 52, cy: DOWN_TOP + 152 },
  text: { x: x + 96, y: DOWN_TOP + 128, w: textW },
  dotX,
});

/** The seven places in the compact composition, named by side and left-to-right order. */
export const SLOTS: Record<SlotId, Slot> = {
  u1: up('u1', 36, 268, 240, 150),
  d1: down('d1', 182, 300, 290, 240),
  u2: up('u2', 372, 268, 250, 335),
  d2: down('d2', 700, 300, 290, 640),
  u3: up('u3', 1050, 200, 195, 1000),
  d3: down('d3', 1210, 310, 290, 1110),
  u4: up('u4', 1360, 300, 290, 1420),
};

/** The fixed pieces around the entries, with the box each one is fitted into. */
export const FIXED = {
  portrait: { x: 775, y: 0,   w: 235,  h: 262 } as Box,
  /** A wide strip that stands on the axis. */
  skyline:  { x: 300, y: 238, w: 1180, h: 104 } as Box,
  maps:     { x: 762, y: 590, w: 250,  h: 52 } as Box,
};

/** Which slots are used for N entries, in the order of the entries (oldest first, so left to right). */
const SLOT_TABLE: Record<number, SlotId[]> = {
  1: ['u2'],
  2: ['u1', 'd2'],
  3: ['u1', 'd2', 'u4'],
  4: ['u1', 'd1', 'd2', 'u4'],
  5: ['u1', 'd1', 'u2', 'd2', 'u4'],
  6: ['u1', 'd1', 'u2', 'd2', 'd3', 'u4'],
  7: ['u1', 'd1', 'u2', 'd2', 'u3', 'd3', 'u4'],
};

export interface Placed { slot: Slot; /** Where this entry's line meets the axis. */ dotX: number }

/**
 * Places `count` entries (oldest first) on the canvas, or returns null when they do not fit
 * (then the component uses the compact two-column list). The dots on the axis always run left to
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
