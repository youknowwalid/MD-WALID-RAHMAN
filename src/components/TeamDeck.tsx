import React, { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Photo from './Photo';
import { RichClamp } from './RichText';
import { TeamMember } from '../lib/defaults';

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

/** A member's picture, or (with no photo) their initial on the brand colour. */
function Portrait({ m, big }: { m: TeamMember; big?: boolean }) {
  return m.photo ? (
    <Photo src={m.photo} alt="" widths={[384, 640]} sizes="(min-width: 768px) 260px, 200px" className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="relative h-full w-full bg-accent" aria-hidden="true">
      <span className={`absolute inset-x-0 text-center font-medium text-[#0d1117] ${big ? 'top-[30%] text-6xl' : 'top-[26%] text-5xl'}`}>{initial(m.name)}</span>
      <span className="absolute bottom-0 left-[18%] right-[18%] h-[38%] rounded-t-full bg-[#0d1117]/15" />
    </div>
  );
}

/** Name, role and a short line (at most three lines, on every screen size). */
function Details({ m }: { m: TeamMember }) {
  return (
    <>
      <div className="text-[1.5rem] font-medium leading-tight tracking-[-0.03em] text-text-main md:text-[1.75rem]">{m.name}</div>
      {m.role && <div className="mt-0.5 text-[14px] text-text-muted">{m.role}</div>}
      {m.quote && <RichClamp text={m.quote} className="mt-4 line-clamp-3 min-h-[4.5rem] text-[15px] leading-[1.6] text-[#2d3440]" />}
    </>
  );
}

/** Stacked, slightly tilted portraits that loop with the arrows. With reduced motion it is a plain list instead. */
export default function TeamDeck({ members }: { members: TeamMember[] }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const n = members.length;

  if (reduceMotion || n === 1) {
    return (
      <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m, i) => (
          <li key={i} className="flex items-center gap-4">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl"><Portrait m={m} /></div>
            <div className="min-w-0"><Details m={m} /></div>
          </li>
        ))}
      </ul>
    );
  }

  const go = (d: number) => setActive((a) => (a + d + n) % n);
  // Distance from the active card, wrapped so the deck is a loop rather than a line.
  const dist = (i: number) => { let d = (i - active + n) % n; if (d > n / 2) d -= n; return d; };
  const POS = [
    { r: 0, x: 0, y: 0 },
    { r: 5, x: 14, y: 6 },
    { r: 10, x: 26, y: 10 },
  ];

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Team members"
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); }}
      className="grid items-center gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:gap-14"
    >
      <div className="relative mx-auto aspect-[4/5] w-[min(62vw,230px)] md:w-[240px]" aria-hidden="true">
        {members.map((m, i) => {
          const d = Math.abs(dist(i));
          const p = POS[Math.min(d, 2)];
          return (
            <div
              key={i}
              className="absolute inset-0 overflow-hidden rounded-[20px] border border-black/5 bg-[#dfe5ec] transition-[transform,opacity] duration-500 ease-out"
              style={{ transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`, opacity: d > 2 ? 0 : 1, zIndex: n - d, boxShadow: d === 0 ? '0 18px 40px -18px rgba(13,17,23,.45)' : undefined }}
            >
              {d === 0 || d === 1 ? <Portrait m={m} big /> : <div className="h-full w-full bg-[#0d1117]" />}
              {d !== 0 && <div className="absolute inset-0 bg-[#0d1117]/70" />}
            </div>
          );
        })}
      </div>
      <div className="text-center md:text-left">
        <div aria-live="polite"><Details m={members[active]} /></div>
        <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
          <button type="button" onClick={() => go(-1)} aria-label="Previous team member" className="grid h-11 w-11 place-items-center rounded-full border border-border-subtle bg-white text-text-main transition hover:bg-accent"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next team member" className="grid h-11 w-11 place-items-center rounded-full border border-border-subtle bg-white text-text-main transition hover:bg-accent"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
          <span className="ml-1 text-[13px] text-text-muted" aria-hidden="true">{active + 1} / {n}</span>
        </div>
      </div>
    </div>
  );
}
