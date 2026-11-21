import React, { useState } from 'react';
import { Briefcase, Code, Compass, Layers, Palette, Rocket, Target, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { CapabilityGroup } from '../lib/defaults';

const ICONS: LucideIcon[] = [Briefcase, Code, Palette, Layers, Target, Rocket, Compass];

/** "What I can do": the categories as tabs, and the small services of the chosen category as chips.
    The card keeps the same height on every tab, so the page never jumps. Tapping a chip only highlights it. */
export default function Capabilities({ heading, eyebrow, groups }: { heading: string; eyebrow: string; groups: CapabilityGroup[] }) {
  const [tab, setTab] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const active = Math.min(tab, groups.length - 1);
  const group = groups[active];

  const choose = (i: number) => { setTab(i); setPicked(null); };
  const onKey = (e: React.KeyboardEvent) => {
    if (groups.length < 2 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? groups.length - 1 : (active + (e.key === 'ArrowRight' ? 1 : -1) + groups.length) % groups.length;
    choose(next);
    document.getElementById(`cap-tab-${next}`)?.focus();
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mx-auto mb-5 flex max-w-7xl items-baseline justify-between gap-4 md:mb-6">
        <h2 className="text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.6rem]">{heading}</h2>
        {eyebrow && <span className="hidden text-[14px] tracking-[0.02em] text-text-muted md:block">{eyebrow}</span>}
      </div>
    <div className="home-on-dark relative overflow-hidden rounded-[28px] bg-[#0d1117] px-3.5 py-3.5 text-white md:rounded-[36px] md:px-6 md:py-5">
      <div className="home-skills-glow" aria-hidden="true" />

      <div role="tablist" aria-label={heading} onKeyDown={onKey} className="relative flex gap-1 rounded-full bg-white/[0.08] p-1">
        {groups.map((g, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <button
              key={`${g.name}-${i}`}
              id={`cap-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls="cap-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => choose(i)}
              className={cn(
                'flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-1 text-[13.5px] font-medium transition-colors md:h-11 md:gap-2 md:text-[15px]',
                i === active ? 'bg-accent text-[#0d1117]' : 'text-white/80 hover:text-white',
              )}
            >
              <Icon className="h-[15px] w-[15px] shrink-0 md:h-[17px] md:w-[17px]" aria-hidden="true" />
              <span className="truncate md:hidden">{g.short || g.name}</span>
              <span className="hidden truncate md:inline">{g.name}</span>
            </button>
          );
        })}
      </div>

      <div id="cap-panel" role="tabpanel" aria-labelledby={`cap-tab-${active}`} className="relative mt-3 flex min-h-[108px] flex-wrap content-start gap-1.5 md:mt-3.5 md:min-h-0 md:gap-2">
        {group.items.map((item) => {
          const on = picked === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={on}
              onClick={() => setPicked(on ? null : item)}
              className={cn(
                'inline-flex h-8 items-center rounded-full border px-2.5 text-[12px] font-medium transition-colors md:h-10 md:gap-2 md:px-4 md:text-[14.5px]',
                on ? 'border-accent bg-accent/15 text-accent' : 'border-white/[0.14] bg-white/[0.06] text-white hover:border-white/30',
              )}
            >
              <span className={cn('hidden h-1.5 w-1.5 rounded-full bg-accent md:block')} aria-hidden="true" />
              {item}
            </button>
          );
        })}
      </div>
    </div>
    </div>
  );
}
