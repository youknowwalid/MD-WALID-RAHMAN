import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface WhatIDoService { title: string; description: string; Icon: React.ComponentType<{ className?: string }> }
export interface WhatIDoSkill { name: string; level: number }

const SHOWN = 3;
const ROW = 'flex h-[60px] shrink-0 items-center rounded-2xl border border-white/10 bg-white/[0.08] px-3';

/** Phones only: the specialities and the skills in one small card, three items each, with a dropdown for the rest.
    Both tabs have the same rows, so the card is exactly the same height on either tab. */
export default function WhatIDo({ heading, services, skills }: { heading: string; services: WhatIDoService[]; skills: WhatIDoSkill[] }) {
  const tabs = ([
    services.length > 0 && 'services',
    skills.length > 0 && 'skills',
  ].filter(Boolean)) as Array<'services' | 'skills'>;
  const [tab, setTab] = useState<'services' | 'skills'>(tabs[0] || 'services');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (!tabs.length) return null;

  const active = tabs.includes(tab) ? tab : tabs[0];
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level);
  const total = active === 'services' ? services.length : sortedSkills.length;
  const expanded = !!open[active];
  const noun = active === 'services' ? 'specialities' : 'skills';
  const label = (t: string) => (t === 'services' ? 'Specialities' : 'Skills');

  const onKey = (e: React.KeyboardEvent) => {
    if (tabs.length < 2 || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const next = tabs[(tabs.indexOf(active) + 1) % tabs.length];
    setTab(next);
    document.getElementById(`whatido-tab-${next}`)?.focus();
  };

  return (
    <div className={cn('home-on-dark overflow-hidden rounded-[28px] bg-[#0d1117] px-4 pb-5 pt-5 text-white', !expanded && 'h-[384px]')}>
      <h2 className="truncate text-[1.75rem] font-medium leading-none tracking-[-0.045em]">{heading}</h2>

      {tabs.length > 1 ? (
        <div role="tablist" aria-label={heading} onKeyDown={onKey} className="my-3 flex rounded-full bg-white/10 p-[3px]">
          {tabs.map((t) => (
            <button
              key={t}
              id={`whatido-tab-${t}`}
              type="button"
              role="tab"
              aria-selected={t === active}
              aria-controls="whatido-panel"
              tabIndex={t === active ? 0 : -1}
              onClick={() => setTab(t)}
              className={cn('min-h-10 flex-1 rounded-full text-[14px] font-medium transition-colors', t === active ? 'bg-accent text-[#0d1117]' : 'text-white/80')}
            >
              {label(t)}
            </button>
          ))}
        </div>
      ) : <div className="h-3" />}

      <div id="whatido-panel" role="tabpanel" aria-labelledby={`whatido-tab-${active}`} className="flex flex-col gap-2">
        {active === 'services'
          ? services.slice(0, expanded ? undefined : SHOWN).map((s, i) => (
              <div key={`${s.title}-${i}`} className={cn(ROW, 'gap-3')}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-accent text-[#0d1117]" aria-hidden="true">
                  <s.Icon className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="m-0 truncate text-[14px] font-medium leading-tight">{s.title}</h3>
                  <div className="mt-0.5 truncate text-[12px] leading-tight text-white/70">{s.description}</div>
                </div>
              </div>
            ))
          : sortedSkills.slice(0, expanded ? undefined : SHOWN).map((s, i) => (
              <div key={`${s.name}-${i}`} className={cn(ROW, 'flex-col items-stretch justify-center')}>
                <div className="mb-2 flex items-baseline justify-between gap-3 text-[14px] font-medium leading-tight">
                  <span className="truncate">{s.name}</span>
                  <span className="tabular-nums text-accent" aria-hidden="true">{s.level}%</span>
                </div>
                <div
                  className="h-1 w-full overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-label={s.name}
                  aria-valuenow={s.level}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#8db4d8,var(--color-accent))]" style={{ width: `${s.level}%` }} />
                </div>
              </div>
            ))}
      </div>

      {total > SHOWN && (
        <button
          type="button"
          onClick={() => setOpen((o) => ({ ...o, [active]: !o[active] }))}
          aria-expanded={expanded}
          className="home-btn mt-2 flex h-[46px] w-full gap-1.5 border border-white/30 text-[14px] font-medium text-white"
        >
          {expanded ? `Show fewer ${noun}` : `Show all ${total} ${noun}`}
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
