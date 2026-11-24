import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { useSiteConfig } from '../context/SiteConfigContext';
import { stripFormatting } from '../lib/richtext';
import { ResumeItem } from '../types';
import {
  AXIS_Y, CANVAS_H, CANVAS_W, FIXED, Placed, SLOTS, SlotId,
  badgeLines, chronological, layoutFor, pctX, pctY,
} from '../lib/careerTimeline';
import { DEMO } from '../lib/careerTimelineDemo';
import Photo from './Photo';
import '../career-timeline.css';

const SLOT_IDS = Object.keys(SLOTS) as SlotId[];
const WIDE = '(min-width: 1180px)';
const css = (vars: Record<string, string | number>) => vars as unknown as React.CSSProperties;
const box = (b: { x: number; y: number; w: number; h: number }) =>
  css({ '--x': pctX(b.x), '--y': pctY(b.y), '--w': pctX(b.w), '--h': pctY(b.h) });

/** True the first time the element is on screen (straight away where that cannot be detected). */
function useSeenOnce(ref: React.RefObject<HTMLElement | null>, threshold = 0.08): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); }
    }, { threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, threshold]);
  return seen;
}

function useMedia(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false);
  const [on, setOn] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return on;
}

/**
 * Scroll-linked motion that only sets two CSS variables: --ct-p (how far the section is from the middle of the
 * screen, -1 to 1: the portrait and skyline drift with it) and --ct-fill (how much of the compact timeline's
 * dotted line has been "filled" in lime). Does nothing when the visitor asks for reduced motion.
 */
function useScrollVars(rootRef: React.RefObject<HTMLElement | null>, listRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const r = root.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / vh));
      root.style.setProperty('--ct-p', p.toFixed(3));
      const list = listRef.current;
      if (list) {
        const lb = list.getBoundingClientRect();
        const fill = Math.max(0, Math.min(vh * 0.62 - lb.top, lb.height - 8));
        root.style.setProperty('--ct-fill', `${fill.toFixed(0)}px`);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef, listRef]);
}

interface EntryProps { item: ResumeItem; index: number; placed: Placed | null; src: string }

function Entry({ item, index, placed, src }: EntryProps & React.Attributes) {
  const ref = useRef<HTMLLIElement>(null);
  const seen = useSeenOnce(ref, 0.2);
  const slot = placed ? placed.slot : null;
  const lines = badgeLines(item.year);
  const desc = stripFormatting(item.desc || '').trim();
  const alt = [item.role, item.company].filter(Boolean).join(', ');
  return (
    <li
      ref={ref}
      className={cn('ct-item', seen && 'is-in')}
      style={css({ '--i': index })}
      data-side={slot ? slot.side : undefined}
    >
      <Photo
        src={src}
        widths={[384, 640, 828]}
        sizes="(min-width: 1180px) 22vw, (min-width: 768px) 30vw, 46vw"
        alt={alt}
        width={slot ? slot.photo.w : 1200}
        height={slot ? slot.photo.h : 520}
        loading={index < 2 ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        className="ct-photo ct-rise"
        style={slot ? box(slot.photo) : undefined}
      />
      <span
        className="ct-badge ct-pop"
        style={slot ? css({ '--cx': pctX(slot.badge.cx), '--cy': pctY(slot.badge.cy) }) : undefined}
      >
        {lines.map((l, k) => <span key={k}>{l}</span>)}
      </span>
      <div
        className="ct-text ct-rise"
        style={slot ? css({ '--tx': pctX(slot.text.x), '--ty': pctY(slot.text.y), '--tw': pctX(slot.text.w) }) : undefined}
      >
        <h3 className="ct-role">{item.role}</h3>
        {item.company && <p className="ct-org">{item.company}</p>}
        {desc && <p className="ct-desc">{desc}</p>}
      </div>
    </li>
  );
}

/**
 * The home page's career timeline: an editorial, non-linear timeline. Wide screens show one compact composition
 * (portrait in the middle, up to seven career collages above and below a dotted axis); smaller screens show two
 * staggered columns either side of a dotted line. Everything comes from the résumé entries and the "Career
 * timeline" settings in the admin; until pictures are uploaded there, the placeholders in
 * lib/careerTimelineDemo.ts are shown.
 */
export default function CareerTimeline({ items, title }: { items: ResumeItem[]; title: string }) {
  const { config, hero } = useSiteConfig();
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const seen = useSeenOnce(rootRef);
  const wide = useMedia(WIDE);
  useScrollVars(rootRef, listRef);

  const entries = useMemo(() => chronological(items), [items]);
  const placed = useMemo(() => layoutFor(entries.length), [entries.length]);
  const canvasMode = Boolean(placed);
  /** Pictures and text reveal with the whole section on the canvas, and one by one as they arrive in the compact list. */
  const cards = !(canvasMode && wide);

  const name = (config.founderName || config.siteTitle || '').trim();
  const portrait = hero.timelinePortrait || DEMO.portrait;
  const skyline = hero.timelineSkyline || DEMO.skyline;
  const maps = hero.timelineMaps || DEMO.maps;

  return (
    <section
      id="resume"
      ref={rootRef}
      aria-labelledby="career-timeline-title"
      className={cn('ct ct-armed', seen && 'is-in', !canvasMode && 'ct--list', cards && 'ct--cards')}
    >
      <h2 id="career-timeline-title" className="sr-only">{title}</h2>
      <div className="ct-stage">
        <div className="ct-canvas">
          {canvasMode && placed && (
            <>
              {/* The dotted axis, and the thin lines that tie each entry to it */}
              <svg className="ct-axis" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <line x1="0" y1={AXIS_Y} x2={CANVAS_W} y2={AXIS_Y} className="ct-axis-line" />
              </svg>
              <svg className="ct-links" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                {placed.map(({ slot, dotX }, i) => (
                  <g key={slot.id} style={css({ '--i': i })}>
                    <line x1={dotX} y1={AXIS_Y} x2={slot.badge.cx} y2={slot.badge.cy} pathLength={1} className="ct-link" />
                    <circle cx={dotX} cy={AXIS_Y} r="8.5" className="ct-dot" />
                    <circle cx={dotX} cy={AXIS_Y} r="3.6" className="ct-dot-core" />
                  </g>
                ))}
              </svg>
            </>
          )}

          <img
            src={skyline}
            alt=""
            aria-hidden="true"
            width={FIXED.skyline.w}
            height={FIXED.skyline.h}
            loading="lazy"
            decoding="async"
            className="ct-skyline ct-fade-slow"
            style={box(FIXED.skyline)}
          />

          <img
            src={portrait}
            alt={name}
            width={FIXED.portrait.w}
            height={FIXED.portrait.h}
            decoding="async"
            className="ct-portrait ct-rise-portrait"
            style={box(FIXED.portrait)}
          />

          <ol className="ct-list" ref={listRef}>
            {entries.map((item, i) => (
              <Entry
                key={item.id || i}
                item={item}
                index={i}
                placed={placed ? placed[i] : null}
                src={item.image || DEMO.collage[placed ? placed[i].slot.id : SLOT_IDS[i % SLOT_IDS.length]]}
              />
            ))}
          </ol>

          <img
            src={maps}
            alt=""
            aria-hidden="true"
            width={FIXED.maps.w}
            height={FIXED.maps.h}
            loading="lazy"
            decoding="async"
            className="ct-maps ct-fade-late"
            style={box(FIXED.maps)}
          />
        </div>
      </div>
    </section>
  );
}
