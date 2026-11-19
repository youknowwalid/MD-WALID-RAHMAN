import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '../lib/utils';

/** A swipeable strip whose cards also move on by themselves, looping back to the first.
    It waits while a finger is on it, while it has focus, and when the page is hidden or the
    strip is off screen; with "reduce motion" on it never moves unasked. */
export default function AutoCarousel({
  label, className, children, intervalMs = 4500,
}: { label: string; className?: string; children: React.ReactNode[]; intervalMs?: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const reduce = useReducedMotion();
  const [page, setPage] = useState(0);
  const count = React.Children.count(children);

  const leftFor = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return 0;
    return card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
  };
  const goTo = (i: number) => trackRef.current?.scrollTo({ left: leftFor(i), behavior: reduce ? 'auto' : 'smooth' });
  const hold = (ms = 8000) => { pausedUntil.current = Date.now() + ms; };

  const current = () => {
    const track = trackRef.current;
    if (!track) return 0;
    let best = 0;
    let gap = Infinity;
    for (let i = 0; i < count; i += 1) {
      const d = Math.abs(leftFor(i) - track.scrollLeft);
      if (d < gap) { gap = d; best = i; }
    }
    return best;
  };

  useEffect(() => {
    if (reduce || count < 2) return undefined;
    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || document.hidden || Date.now() < pausedUntil.current) return;
      const r = track.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // not on screen
      goTo((current() + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, count, intervalMs]);

  return (
    <div>
      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label={label}
        onScroll={() => setPage(current())}
        onTouchStart={() => hold()}
        onPointerDown={() => hold()}
        onFocus={() => hold(15000)}
        className={cn('relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]', className)}
      >
        {children}
      </div>
      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1" role="group" aria-label={`${label}: choose a card`}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { hold(); goTo(i); }}
              aria-label={`Show card ${i + 1} of ${count}`}
              aria-current={i === page}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span className={cn('h-2 rounded-full transition-all', i === page ? 'w-5 bg-[#0d1117]' : 'w-2 bg-[#0d1117]/25')} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
