import React from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { inputCls, labelCls } from '../fields';

export type Toaster = (type: 'success' | 'error', message: string) => void;

export const Card = ({ title, icon, children, hint }: { title: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode }) => (
  <section className="bg-bg-card p-5 sm:p-8 rounded-3xl border border-white/5 space-y-5">
    <div>
      <h2 className="text-lg sm:text-xl font-black flex items-center gap-3">{icon}{title}</h2>
      {hint && <p className="text-sm text-gray-400 mt-1">{hint}</p>}
    </div>
    {children}
  </section>
);

export function TextField({ id, label, value, onChange, hint, placeholder, maxLength, type = 'text' }: {
  id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; maxLength?: number; type?: string;
} & React.Attributes) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className={inputCls} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function AreaField({ id, label, value, onChange, hint, rows = 3, maxLength, mono }: {
  id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number; maxLength?: number; mono?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} className={`${inputCls} resize-y ${mono ? 'font-mono' : ''}`} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 accent-accent" />{label}
    </label>
  );
}

export function SaveButton({ saving, label = 'Save', disabled }: { saving: boolean; label?: string; disabled?: boolean }) {
  return (
    <button type="submit" disabled={saving || disabled} className="bg-accent text-[#0d1117] font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60 shrink-0">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}{label}
    </button>
  );
}

export const GhostButton = ({ children, onClick, danger, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean; type?: 'button' | 'submit' }) => (
  <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2.5 rounded-xl border text-sm font-bold disabled:opacity-60 ${danger ? 'border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'border-white/10 text-white hover:bg-white/5'}`}>{children}</button>
);

/** A list of editable rows (FAQ, steps, languages): add, edit, remove. */
export function RowsEditor<T>({ label, rows, onChange, blank, addLabel, render, hint }: {
  label: string; rows: T[]; onChange: (rows: T[]) => void; blank: () => T; addLabel: string; hint?: string;
  render: (row: T, set: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <span className={labelCls}>{label}</span>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
      {rows.map((row, i) => (
        <div key={i} className="rounded-2xl border border-white/10 p-4 space-y-3 relative">
          {render(row, (patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))), i)}
          <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-400/10" aria-label={`Remove ${label} ${i + 1}`}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      ))}
      <GhostButton onClick={() => onChange([...rows, blank()])}><span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" aria-hidden="true" />{addLabel}</span></GhostButton>
    </div>
  );
}

export const Loading = () => (
  <div className="flex justify-center py-16" role="status" aria-label="Loading"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
);

/** A small coloured number: red below 50, amber below 80, green from 80. */
export const ScoreBadge = ({ score }: { score: number }) => (
  <span className={`inline-flex min-w-12 justify-center rounded-full px-3 py-1 text-sm font-black ${score >= 80 ? 'bg-emerald-500/20 text-emerald-300' : score >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`} aria-label={`Score ${score} out of 100`}>{score}</span>
);
