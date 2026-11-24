import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { useSiteConfig } from '../context/SiteConfigContext';
import { stripFormatting } from '../lib/richtext';
import { ResumeItem } from '../types';
import {
  AXIS_Y, CANVAS_H, CANVAS_W, FIXED, SLOTS, SlotId,
  badgeLines, chronological, layoutFor, pctX, pctY,
} from '../lib/careerTimeline';
import { DEMO } from '../lib/careerTimelineDemo';
import Photo from './Photo';
import '../career-timeline.css';

const SLOT_IDS = Object.keys(SLOTS) as SlotId[];
const css = (vars: Record<string, string | number>) => vars as unknown as React.CSSProperties;
const box = (b: { x: number; y: number; w: number; h: number }) =>
  css({ '--x': pctX(b.x), '--y': pctY(b.y), '--w': pctX(b.w), '--h': pctY(b.h) });

/** Runs `onSeen` once, the first time the element is on screen (straight away where that cannot be detected). */
function useSeenOnce(ref: React.RefObject<HTMLElement | null>): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen]);
  return seen;
}

/**
 * The home page's career timeline: an editorial, non-linear timeline. Wide screens show one composition
 * (portrait in the middle, seven career collages above and below a dotted axis); smaller screens show a
 * vertical timeline. Everything comes from the résumé entries and the "Career timeline" settings in the admin;
 * until pictures are uploaded there, the placeholders in lib/careerTimelineDemo.ts are shown.
 */
export default function CareerTimeline({ items, title }: { items: ResumeItem[]; title: string }) {
  const { config, hero } = useSiteConfig();
  const rootRef = useRef<HTMLElement>(null);
  const seen = useSeenOnce(rootRef);

  const entries = useMemo(() => chronological(items), [items]);
  const placed = useMemo(() => layoutFor(entries.length), [entries.length]);
  const canvasMode = Boolean(placed);

  const name = (config.founderName || config.siteTitle || '').trim();
  const portrait = hero.timelinePortrait || DEMO.portrait;
  const signature = hero.timelineSignature || DEMO.signature;
  const skyline = hero.timelineSkyline || DEMO.skyline;
  const maps = hero.timelineMaps || DEMO.maps;

  return (
    <section
      id="resume"
      ref={rootRef}
      aria-labelledby="career-timeline-title"
      className={cn('ct ct-armed', seen && 'is-in', !canvasMode && 'ct--list')}
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
          <img
            src={signature}
            alt={name ? `${name}, signature` : 'Signature'}
            width={FIXED.signature.w}
            height={FIXED.signature.h}
            loading="lazy"
            decoding="async"
            className="ct-sign ct-rise-portrait"
            style={box(FIXED.signature)}
          />

          <ol className="ct-list">
            {entries.map((item, i) => {
              const slot = placed ? placed[i].slot : null;
              const lines = badgeLines(item.year);
              const desc = stripFormatting(item.desc || '').trim();
              const src = item.image || DEMO.collage[slot ? slot.id : SLOT_IDS[i % SLOT_IDS.length]];
              const alt = [item.role, item.company].filter(Boolean).join(', ');
              return (
                <li
                  key={item.id || i}
                  className="ct-item"
                  style={css({ '--i': i, gridRow: Math.floor(i / 2) + 1 })}
                  data-side={slot ? slot.side : undefined}
                >
                  <Photo
                    src={src}
                    widths={[384, 640, 828]}
                    sizes="(min-width: 1180px) 22vw, (min-width: 768px) 44vw, 92vw"
                    alt={alt}
                    width={slot ? slot.photo.w : 1200}
                    height={slot ? slot.photo.h : 800}
                    loading={i < 2 ? 'eager' : 'lazy'}
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
            })}
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

