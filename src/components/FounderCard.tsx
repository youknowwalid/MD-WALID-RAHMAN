import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { safeUrl } from '../lib/text';
import { RichText } from './RichText';

/** The founder's photo, or his first initial while no photo has been uploaded. It fills whatever box it is put in. */
function Portrait({ src, name }: { src: string; name: string }) {
  if (src) {
    return <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" referrerPolicy="no-referrer" />;
  }
  return (
    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-accent/80">
      {(name.trim()[0] || 'W').toUpperCase()}
    </span>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function StoryPopup({ onClose }: { onClose: () => void }) {
  const { config } = useSiteConfig();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The popup is drawn straight into <body>, outside the home page wrapper, so it brings its own font and accent there.
  const onHome = typeof document !== 'undefined' && !!document.querySelector('.home-v2');
  const ctaUrl = safeUrl(config.founderCtaUrl);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const items: HTMLElement[] = [];
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((el) => items.push(el));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ctaCls = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-black transition-opacity hover:opacity-90 sm:w-auto';

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-8 ${onHome ? 'font-tight [--accent-gradient:none]' : ''}`}
      style={onHome ? ({ '--color-accent': config.homeAccent } as React.CSSProperties) : undefined}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="founder-story-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0d1117] text-white md:max-h-[85vh] md:flex-row md:rounded-3xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 transition-colors hover:text-accent"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative h-52 shrink-0 bg-white/[0.04] md:h-auto md:w-72">
          <Portrait src={config.footerPortrait} name={config.founderName} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">{config.founderLabel}</p>
          <h2 id="founder-story-title" className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{config.founderName}</h2>
          {config.founderRole && <p className="mt-1 text-sm text-white/60">{config.founderRole}</p>}
          <RichText text={config.founderStory} className="mt-5 text-[15px] leading-relaxed text-white/75" />
          {ctaUrl && config.founderCtaText && (
            <div className="mt-7">
              {ctaUrl.startsWith('/') ? (
                <Link to={ctaUrl} onClick={onClose} className={ctaCls}>{config.founderCtaText}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              ) : (
                <a href={ctaUrl} onClick={onClose} className={ctaCls}>{config.founderCtaText}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * The founder message card of the footer. On a phone it stacks (photo and name on top, quote, button); on a wide
 * screen the photo fills the full height of the card and the card stretches to match the columns beside it.
 */
export default function FounderCard({ className = '' }: { className?: string }) {
  const { config } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const hasStory = config.founderStory.trim() !== '';

  return (
    <section
      aria-label={config.founderLabel}
      data-testid="founder-card"
      className={`grid grid-cols-[84px_1fr] gap-x-3 gap-y-3 rounded-2xl border border-white/10 bg-bg-card p-3 md:flex md:items-stretch md:gap-4 md:p-3.5 ${className}`}
    >
      <div className="relative row-span-2 min-h-24 overflow-hidden rounded-xl bg-white/[0.06] md:row-auto md:min-h-0 md:w-32 md:shrink-0">
        <Portrait src={config.footerPortrait} name={config.founderName} />
      </div>

      {/* On a phone these sit directly in the card's grid; on a wide screen they form one column beside the photo. */}
      <div className="contents md:flex md:min-w-0 md:flex-1 md:flex-col md:justify-center md:gap-2">
        <p className="self-end text-[11px] font-medium uppercase tracking-[0.14em] text-accent md:order-1 md:self-auto">{config.founderLabel}</p>
        <p className="self-start text-sm text-text-main md:order-3 md:self-auto">
          <span className="font-medium">{config.founderName}</span>
          {config.founderRole && <span className="text-text-muted"> · {config.founderRole}</span>}
        </p>
        <blockquote className="col-span-2 text-[15px] font-medium leading-snug tracking-tight text-text-main md:order-2 md:col-span-1">
          “{config.founderQuote}”
        </blockquote>
        {hasStory && (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className="col-span-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/50 px-4 text-sm font-medium text-text-main transition-colors hover:bg-white hover:text-black md:order-4 md:min-h-9 md:w-auto md:self-start"
          >
            {config.founderButton}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && <StoryPopup onClose={() => setOpen(false)} />}
    </section>
  );
}
