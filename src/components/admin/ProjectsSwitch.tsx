import React, { useEffect, useState } from 'react';
import { EyeOff, Eye, Loader2 } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { patchSettings } from '../../lib/admin';
import { friendlyError } from './forms';

/** The on/off switch at the top of the Projects tab: while on, visitors see "not available in your region" instead of the projects. */
export default function ProjectsSwitch({ onToast }: { onToast: (type: 'success' | 'error', message: string) => void }) {
  const { config, refresh } = useSiteConfig();
  const [hidden, setHidden] = useState<boolean>(config.projectsHidden);
  const [busy, setBusy] = useState(false);

  useEffect(() => { refresh().then(({ config: c }) => setHidden(c.projectsHidden)); }, [refresh]);

  const toggle = async () => {
    const next = !hidden;
    setBusy(true);
    try {
      await patchSettings('global', { projectsHidden: next });
      setHidden(next);
      await refresh();
      onToast('success', next ? 'Projects are now hidden on your site.' : 'Projects are now visible on your site.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally {
      setBusy(false);
    }
  };

  const Icon = hidden ? EyeOff : Eye;
  return (
    <div className="flex items-center justify-between gap-4 bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 mb-6">
      <div className="flex items-start gap-4 min-w-0">
        <Icon className="w-6 h-6 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p id="projects-switch-label" className="font-bold">Hide projects from visitors</p>
          <p className="text-sm text-gray-400 mt-1">
            {hidden
              ? 'On: your homepage shows "Not available in your region" instead of the projects.'
              : 'Off: your projects are visible on your homepage and have their own pages.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={hidden}
        aria-labelledby="projects-switch-label"
        disabled={busy}
        onClick={toggle}
        className={`relative shrink-0 w-14 h-8 rounded-full transition-colors disabled:opacity-60 ${hidden ? 'bg-accent' : 'bg-white/20'}`}
      >
        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform grid place-items-center ${hidden ? 'translate-x-6' : ''}`}>
          {busy && <Loader2 className="w-4 h-4 text-gray-700 animate-spin" aria-hidden="true" />}
        </span>
      </button>
    </div>
  );
}
