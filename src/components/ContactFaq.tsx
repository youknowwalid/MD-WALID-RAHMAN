import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import type { FaqItem } from '../lib/discovery';
import { RichText } from './RichText';

/** Questions and answers from the admin (Search & AI > Home page), shown beside the contact form. One answer is open at a time. */
export default function ContactFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);
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
                className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-[17px] font-medium leading-snug text-white md:text-[19px]"
              >
                <span>{item.question}</span>
                {isOpen ? <Minus className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" /> : <Plus className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />}
              </button>
            </h3>
            <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className={cn(isOpen ? 'block' : 'hidden')}>
              <RichText text={item.answer} className="max-w-xl pb-5 text-[15px] leading-relaxed text-white/85 md:text-[16px]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
