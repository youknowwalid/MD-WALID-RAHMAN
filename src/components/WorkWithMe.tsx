import { ArrowUpRight, Check, Handshake, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { safeUrl } from '../lib/text';
import type { HireOffer } from '../lib/defaults';

/** "Work with me": two ways to hire, edited from the admin "Hire" tab. */
export default function WorkWithMe({ offers, heading, lead }: { offers: HireOffer[]; heading: string; lead: string }) {
  const shown = offers.filter((o) => !o.hidden && o.name.trim());
  if (!shown.length) return null;

  return (
    <section id="hire" className="px-6 py-10 md:py-14" aria-labelledby="hire-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 md:mb-12">
          <h2
            id="hire-heading"
            className="flex items-center gap-4 text-[2rem] font-medium leading-[1.05] tracking-[-0.045em] md:text-[2.8rem]"
          >
            <span className="hidden h-9 w-1.5 rounded-full bg-accent md:block" aria-hidden="true" />
            {heading}
          </h2>
          {lead && <p className="mt-3 max-w-xl text-[15px] text-text-muted md:text-[17px]">{lead}</p>}
        </div>

        <div className={cn('grid gap-5 md:gap-7', shown.length > 1 && 'md:grid-cols-2')}>
          {shown.map((o, i) => {
            const href = safeUrl(o.buttonUrl) || '/#contact';
            const features = o.features.map((f) => f.trim()).filter(Boolean);
            return (
              <article
                key={`${o.name}-${i}`}
                className={cn(
                  'flex flex-col rounded-[28px] p-6 md:rounded-[36px] md:p-10',
                  o.dark ? 'home-plan-pop home-on-dark text-white' : 'border border-border-subtle bg-bg-card text-text-main',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl md:h-14 md:w-14',
                      o.dark ? 'bg-accent text-[#0d1117]' : 'bg-white text-text-main shadow-sm',
                    )}
                    aria-hidden="true"
                  >
                    {o.dark ? <Handshake className="h-6 w-6" /> : <Layers className="h-6 w-6" />}
                  </span>
                  {o.tag && (
                    <span
                      className={cn(
                        'rounded-full px-4 py-1.5 text-[12px] font-medium md:text-[13px]',
                        o.dark ? 'bg-white/15 text-white' : 'bg-white text-text-main',
                      )}
                    >
                      {o.tag}
                    </span>
                  )}
                </div>

                <h3 className="mt-6 text-[1.6rem] font-medium leading-tight tracking-[-0.03em] md:text-[2rem]">{o.name}</h3>
                {o.description && <p className="mt-3 text-[15px] leading-relaxed text-text-muted md:text-[16px]">{o.description}</p>}

                {features.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-[15px]">
                        <span
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                            o.dark ? 'bg-accent text-[#0d1117]' : 'bg-[#0d1117] text-white',
                          )}
                          aria-hidden="true"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {o.buttonText && (
                  <div className="mt-auto pt-9">
                    <a
                      href={href}
                      className={cn(
                        'home-btn flex min-h-[56px] w-full items-center justify-center gap-2.5 whitespace-nowrap px-8 py-4 text-[16px] font-semibold',
                        o.dark ? 'bg-accent text-[#0d1117]' : 'bg-[#0d1117] text-white',
                      )}
                    >
                      {o.buttonText}
                      <ArrowUpRight className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
