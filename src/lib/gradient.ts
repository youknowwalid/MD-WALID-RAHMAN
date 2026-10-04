export interface AccentSettings {
  accentMode: 'solid' | 'gradient';
  primaryColor: string;
  gradientFrom: string;
  gradientVia: string; // optional middle colour ('' = none)
  gradientTo: string;
  gradientAngle: number;
}

const HEX = /^#[0-9a-f]{6}$/i;
export const validHex = (v: unknown, fallback: string) => (typeof v === 'string' && HEX.test(v) ? v : fallback);

/** CSS gradient for the accent (always valid, even if saved values are odd). */
export function buildGradient(s: Pick<AccentSettings, 'gradientFrom' | 'gradientVia' | 'gradientTo' | 'gradientAngle'>): string {
  const angle = Number.isFinite(Number(s.gradientAngle)) ? Math.round(Number(s.gradientAngle)) % 360 : 135;
  const stops = [validHex(s.gradientFrom, '#f45901'), s.gradientVia && validHex(s.gradientVia, ''), validHex(s.gradientTo, '#ff9a3c')].filter(Boolean);
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
}

/** Applies the accent (solid or gradient) to the page. Text/borders use the first colour; backgrounds use the gradient. */
export function applyAccent(s: AccentSettings, secondary: string) {
  const root = document.documentElement;
  const gradient = s.accentMode === 'gradient';
  root.style.setProperty('--color-accent', gradient ? validHex(s.gradientFrom, '#f45901') : validHex(s.primaryColor, '#f45901'));
  root.style.setProperty('--color-accent-secondary', validHex(secondary, '#00c6ff'));
  root.style.setProperty('--accent-gradient', gradient ? buildGradient(s) : 'none');
  if (gradient) root.dataset.accent = 'gradient'; else delete root.dataset.accent;
  try {
    localStorage.setItem('brand_colors', JSON.stringify({
      p: root.style.getPropertyValue('--color-accent'), s: validHex(secondary, '#00c6ff'),
      g: gradient ? buildGradient(s) : '',
    }));
  } catch { /* storage unavailable */ }
}
