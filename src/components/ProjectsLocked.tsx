import React from 'react';
import { Link } from 'react-router-dom';
import { GlobeLock } from 'lucide-react';

/** Stands in for the projects while they are hidden (the admin's projects switch). Light, casual, one clear way to reach out. */
export default function ProjectsLocked() {
  return (
    <div className="rounded-[28px] border border-border-subtle bg-bg-card px-5 py-10 text-center md:rounded-[44px] md:px-10 md:py-16">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-accent text-[#0d1117] md:h-14 md:w-14" aria-hidden="true">
        <GlobeLock className="h-6 w-6" />
      </div>
      <h3 className="text-[1.5rem] font-medium leading-[1.1] tracking-[-0.035em] text-text-main md:text-4xl">Not available in your region</h3>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-text-muted md:mt-4 md:text-base">
        My project work sits behind client confidentiality, so it's locked for visitors from your location right now. Want a private walkthrough instead? Just ask.
      </p>
      <Link
        to="/#contact"
        className="home-btn mt-6 flex w-full justify-center bg-accent px-7 py-3.5 text-[15px] text-[#0d1117] sm:inline-flex sm:w-auto md:mt-8"
      >
        Request a private look
      </Link>
    </div>
  );
}
