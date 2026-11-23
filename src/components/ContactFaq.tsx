import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import type { FaqItem } from '../lib/discovery';
import { RichText } from './RichText';

/** Questions and answers from the admin (Search & AI > Home page), shown beside the contact form. One answer is open at a time. */
export default function ContactFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(-1);
  if (!items.length) return null;
  return (
    <div className="border-b border-white/25" role="list">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} role="listitem" className="border-t border-white/25">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-btn-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex min-h-11 w-full items-center justify-between gap-4 py-2.5 text-left text-[15px] font-medium leading-snug text-white md:text-[16px]"
              >
                <span>{item.question}</span>
                {isOpen ? <Minus className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" /> : <Plus className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />}
              </button>
            </h3>
            <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className={cn(isOpen ? 'block' : 'hidden')}>
              <RichText text={item.answer} className="max-w-xl pb-3.5 text-[14px] leading-relaxed text-white/90 md:text-[15px]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
