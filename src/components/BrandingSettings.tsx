import React, { useEffect, useState } from 'react';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { patchSettings } from '../lib/admin';
import { AccentSettings, applyAccent, buildGradient, validHex } from '../lib/gradient';
import { friendlyError } from './admin/forms';
import { inputCls, labelCls } from './admin/fields';

type Form = AccentSettings & { secondaryColor: string };

const PRESETS: { name: string; from: string; via: string; to: string; angle: number }[] = [
  { name: 'Sunrise', from: '#f45901', via: '', to: '#ffb347', angle: 135 },
  { name: 'Ember', from: '#f45901', via: '#ff2e63', to: '#8e2de2', angle: 135 },
  { name: 'Ocean', from: '#00c6ff', via: '', to: '#0072ff', angle: 135 },
  { name: 'Aurora', from: '#00e5a0', via: '#00c6ff', to: '#7b61ff', angle: 120 },
  { name: 'Violet', from: '#a855f7', via: '', to: '#ec4899', angle: 135 },
  { name: 'Gold', from: '#f7971e', via: '', to: '#ffd200', angle: 90 },
];

const ColorInput = ({ label, value, onChange, optional, onClear }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean; onClear?: () => void }) => (
  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
    <span className="block text-[11px] font-black uppercase text-slate-300 tracking-wider">{label}{optional && ' (optional)'}</span>
    <div className="flex items-center gap-3">
      <label className="relative w-14 h-11 rounded-lg border border-white/10 overflow-hidden cursor-pointer shrink-0 focus-within:outline focus-within:outline-2 focus-within:outline-white" style={{ backgroundColor: value || 'transparent' }}>
        <input type="color" value={validHex(value, '#000000')} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" aria-label={`${label} picker`} />
      </label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={optional ? 'None' : '#f45901'} maxLength={7} className={`${inputCls} font-mono`} aria-label={`${label} (hex code)`} />
      {optional && value && <button type="button" onClick={onClear} className="text-xs text-gray-300 underline shrink-0">Remove</button>}
    </div>
  </div>
);

export const BrandingSettings: React.FC<{ onBack?: () => void; onToast?: (type: 'success' | 'error', message: string) => void }> = ({ onToast }) => {
  const { config, refresh } = useSiteConfig();
  const [f, setF] = useState<Form>(() => ({ ...config }));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Start from the saved values (and show them live on the page).
  useEffect(() => {
    refresh().then(({ config: c }) => { setF({ ...c }); setDirty(false); });
  }, [refresh]);

  const update = (patch: Partial<Form>) => {
    const next = { ...f, ...patch };
    setF(next);
    setDirty(true);
    applyAccent(next, next.secondaryColor); // live preview across the whole page
  };

  const discard = () => {
    setF({ ...config });
    applyAccent(config, config.secondaryColor);
    setDirty(false);
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await patchSettings('global', {
        accentMode: f.accentMode,
        primaryColor: validHex(f.primaryColor, '#f45901'),
        secondaryColor: validHex(f.secondaryColor, '#00c6ff'),
        gradientFrom: validHex(f.gradientFrom, '#f45901'),
        gradientVia: f.gradientVia ? validHex(f.gradientVia, '') : '',
        gradientTo: validHex(f.gradientTo, '#ff9a3c'),
        gradientAngle: Math.min(360, Math.max(0, Math.round(Number(f.gradientAngle) || 0))),
      });
      await refresh();
      setDirty(false);
      onToast?.('success', 'Brand colors published.');
    } catch (err: any) {
      onToast?.('error', `Could not save: ${friendlyError(err.message)}`);
    } finally {
      setSaving(false);
    }
  };

  const gradient = buildGradient(f);
  const isGradient = f.accentMode === 'gradient';

  return (
    <form onSubmit={save} className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center gap-4 bg-bg-card p-4 sm:p-6 rounded-2xl border border-white/5 flex-wrap">
        <p className="text-sm text-gray-300">Choose a solid color or a gradient. Changes preview live on this page; click Save to publish.</p>
        <div className="flex gap-3">
          {dirty && <button type="button" onClick={discard} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-300 hover:bg-white/5">Discard</button>}
          <button type="submit" disabled={saving || !dirty} className="bg-accent text-white font-black px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save &amp; Publish
          </button>
        </div>
      </div>

      <section className="bg-bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-8">
        <h2 className="text-xl font-black flex items-center gap-2.5"><Sparkles className="text-accent w-5 h-5" aria-hidden="true" /> Accent style</h2>

        <div role="radiogroup" aria-label="Accent style" className="grid grid-cols-2 gap-3 max-w-md">
          {(['solid', 'gradient'] as const).map((mode) => (
            <button key={mode} type="button" role="radio" aria-checked={f.accentMode === mode} onClick={() => update({ accentMode: mode })}
              className={`py-3 rounded-xl border font-bold capitalize ${f.accentMode === mode ? 'border-accent text-white bg-white/10' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}>
              {mode}
            </button>
          ))}
        </div>

        {!isGradient ? (
          <div className="max-w-md">
            <ColorInput label="Accent color" value={f.primaryColor} onChange={(v) => update({ primaryColor: v })} />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <span className={labelCls}>Quick presets</span>
              <div className="flex flex-wrap gap-3">
                {PRESETS.map((p) => (
                  <button key={p.name} type="button" onClick={() => update({ gradientFrom: p.from, gradientVia: p.via, gradientTo: p.to, gradientAngle: p.angle })}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-sm text-gray-200">
                    <span className="w-6 h-6 rounded-full" style={{ backgroundImage: buildGradient({ gradientFrom: p.from, gradientVia: p.via, gradientTo: p.to, gradientAngle: p.angle }) }} aria-hidden="true" />{p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ColorInput label="Start color" value={f.gradientFrom} onChange={(v) => update({ gradientFrom: v })} />
              <ColorInput label="Middle color" optional value={f.gradientVia} onChange={(v) => update({ gradientVia: v })} onClear={() => update({ gradientVia: '' })} />
              <ColorInput label="End color" value={f.gradientTo} onChange={(v) => update({ gradientTo: v })} />
            </div>

            <div className="max-w-md">
              <label htmlFor="g-angle" className={labelCls}>Direction: {Math.round(f.gradientAngle)}°</label>
              <input id="g-angle" type="range" min={0} max={360} step={5} value={f.gradientAngle} onChange={(e) => update({ gradientAngle: Number(e.target.value) })} className="w-full accent-[var(--color-accent)]" />
            </div>
          </div>
        )}

        <div>
          <span className={labelCls}>Preview</span>
          <div className="rounded-2xl border border-white/10 p-6 flex flex-wrap items-center gap-6 bg-bg-dark">
            <span className="px-8 py-3 rounded-lg text-white font-black" style={isGradient ? { backgroundImage: gradient } : { backgroundColor: validHex(f.primaryColor, '#f45901') }}>Button</span>
            <span className="text-4xl font-black uppercase" style={isGradient ? { backgroundImage: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: validHex(f.primaryColor, '#f45901') }}>Walid Rahman.</span>
            <span className="h-1.5 w-40 rounded-full" style={isGradient ? { backgroundImage: gradient } : { backgroundColor: validHex(f.primaryColor, '#f45901') }} />
          </div>
          {isGradient && <p className="text-xs text-gray-400 mt-3">Gradients are used on buttons, bars, badges, underlines and the big name in the hero. Small text, icons and thin borders use the start color so they stay readable.</p>}
        </div>
      </section>

      <section className="bg-bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 max-w-md">
        <h2 className="text-xl font-black">Secondary color</h2>
        <ColorInput label="Secondary accent" value={f.secondaryColor} onChange={(v) => update({ secondaryColor: v })} />
      </section>
    </form>
  );
};
