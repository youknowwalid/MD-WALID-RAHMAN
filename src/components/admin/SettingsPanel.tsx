import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { DEFAULT_HEADER_LINKS, DEFAULT_REFUND, DEFAULT_TERMS, DEFAULT_PRIVACY_POLICY, HeaderLink, HeroStat, SocialLink } from '../../lib/defaults';
import { changePassword, patchSettings } from '../../lib/admin';
import { ImageField, PdfField, inputCls, labelCls } from './fields';
import { friendlyError } from './forms';

interface Props { onToast: (type: 'success' | 'error', message: string) => void }

type Form = {
  siteTitle: string; siteLogo: string; footerLogo: string; favicon: string;
  heroImage: string; resumeImage: string; heroStatus: string; heroAvailability: string; cvUrl: string;
  brandTagline: string; globalCtaText: string; globalCtaUrl: string;
  heroStats: HeroStat[];
  aboutText: string; aboutTags: string; aboutVideoUrl: string;
  contactEmail: string; officePhone: string; officeAddress: string;
  socialLinks: SocialLink[]; headerLinks: HeaderLink[];
  footerPortrait: string; copyrightText: string;
  termsOfService: string; privacyPolicy: string; refundPolicy: string;
};

const Card = ({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) => (
  <section className="bg-bg-card p-6 sm:p-10 rounded-3xl border border-white/5 space-y-6">
    <div>
      <h3 className="text-xl sm:text-2xl font-black">{title}</h3>
      {hint && <p className="text-sm text-gray-400 mt-1">{hint}</p>}
    </div>
    {children}
  </section>
);

const Text = ({ id, label, value, onChange, ...rest }: { id: string; label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'id'>) => (
  <div>
    <label htmlFor={id} className={labelCls}>{label}</label>
    <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} {...rest} />
  </div>
);

function Rows<T extends Record<string, string>>({ rows, onChange, columns, blank, addLabel }: {
  rows: T[]; onChange: (rows: T[]) => void; columns: { key: keyof T & string; label: string; placeholder?: string }[]; blank: T; addLabel: string;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="grid gap-3 items-end" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}>
          {columns.map((c) => (
            <div key={c.key}>
              {i === 0 && <span className="block text-xs text-gray-400 mb-1">{c.label}</span>}
              <input aria-label={`${c.label} ${i + 1}`} value={row[c.key]} placeholder={c.placeholder} onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))} className={inputCls} />
            </div>
          ))}
          <button type="button" aria-label={`Remove row ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))} className="p-3 rounded-xl border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { ...blank }])} className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"><Plus className="w-4 h-4" aria-hidden="true" />{addLabel}</button>
    </div>
  );
}

export default function SettingsPanel({ onToast }: Props) {
  const { refresh } = useSiteConfig();
  const [f, setF] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    refresh().then(({ config: c, hero: h }) =>
      setF({
        siteTitle: c.siteTitle, siteLogo: c.siteLogo, footerLogo: c.footerLogo, favicon: c.favicon,
        heroImage: h.heroImage, resumeImage: h.resumeImage, heroStatus: h.heroStatus, heroAvailability: h.heroAvailability, cvUrl: h.cvUrl,
        brandTagline: c.brandTagline, globalCtaText: c.globalCtaText, globalCtaUrl: c.globalCtaUrl,
        heroStats: c.heroStats,
        aboutText: c.aboutText, aboutTags: c.aboutTags.join(', '), aboutVideoUrl: c.aboutVideoUrl,
        contactEmail: c.contactEmail, officePhone: c.officePhone, officeAddress: c.officeAddress,
        socialLinks: c.socialLinks, headerLinks: c.headerLinks,
        footerPortrait: c.footerPortrait, copyrightText: c.copyrightText,
        termsOfService: c.termsOfService, privacyPolicy: c.privacyPolicy, refundPolicy: c.refundPolicy,
      }),
    );
  }, [refresh]);

  if (!f) return <div className="flex justify-center p-20" role="status" aria-label="Loading settings"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setF((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patchSettings('hero', {
        heroImage: f.heroImage, resumeImage: f.resumeImage, heroStatus: f.heroStatus.trim(),
        heroAvailability: f.heroAvailability.trim(), cvUrl: f.cvUrl.trim(),
      });
      await patchSettings('global', {
        siteTitle: f.siteTitle.trim(), siteLogo: f.siteLogo, footerLogo: f.footerLogo, favicon: f.favicon,
        brandTagline: f.brandTagline.trim(), globalCtaText: f.globalCtaText.trim(), globalCtaUrl: f.globalCtaUrl.trim(),
        heroStats: f.heroStats.filter((s) => s.value.trim() || s.label.trim()),
        aboutText: f.aboutText.trim(), aboutTags: f.aboutTags.split(',').map((t) => t.trim()).filter(Boolean), aboutVideoUrl: f.aboutVideoUrl.trim(),
        contactEmail: f.contactEmail.trim(), officePhone: f.officePhone.trim(), officeAddress: f.officeAddress.trim(),
        socialLinks: f.socialLinks.filter((s) => s.url.trim()).map((s) => ({ platform: s.platform.trim() || 'Link', url: s.url.trim() })),
        headerLinks: f.headerLinks.filter((l) => l.label.trim() && l.url.trim()),
        footerPortrait: f.footerPortrait, copyrightText: f.copyrightText.trim(),
        termsOfService: f.termsOfService, privacyPolicy: f.privacyPolicy, refundPolicy: f.refundPolicy,
      });
      await refresh();
      onToast('success', 'Settings saved and published.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message || 'Unknown error')}`);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) { onToast('error', 'Please choose a password with at least 10 characters.'); return; }
    setPwBusy(true);
    try { await changePassword(newPassword); setNewPassword(''); onToast('success', 'Password changed.'); }
    catch (err: any) { onToast('error', err.message || 'Could not change the password.'); }
    finally { setPwBusy(false); }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <form onSubmit={save} className="space-y-8">
        <div className="sticky top-0 z-20 flex justify-between items-center gap-4 bg-bg-card/95 backdrop-blur p-4 sm:p-6 rounded-2xl border border-white/5">
          <p className="text-sm sm:text-lg font-black">Publish settings</p>
          <button type="submit" disabled={saving} className="bg-accent text-white font-black px-6 sm:px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}Save &amp; Publish
          </button>
        </div>

        <Card title="Logos" hint="The website has exactly two logos: one in the header and one in the footer. No text name is shown next to them.">
          <ImageField label="Header logo" value={f.siteLogo} onChange={set('siteLogo')} maxSide={600} />
          <ImageField label="Footer logo" value={f.footerLogo} onChange={set('footerLogo')} maxSide={600} />
          <ImageField label="Browser tab icon (favicon)" value={f.favicon} onChange={set('favicon')} maxSide={256} compact />
          <Text id="s-title" label="Site name (not shown on the page — only used by screen readers and as the logo's link description)" value={f.siteTitle} onChange={set('siteTitle')} />
        </Card>

        <Card title="Home page: hero">
          <ImageField label="Your portrait photo" value={f.heroImage} onChange={set('heroImage')} maxSide={1000} hint="Square photos work best." />
          <Text id="s-tag" label="Line under your name" value={f.brandTagline} onChange={set('brandTagline')} />
          <div className="grid sm:grid-cols-2 gap-6">
            <Text id="s-status" label="Status badge (e.g. Active Now)" value={f.heroStatus} onChange={set('heroStatus')} />
            <Text id="s-avail" label="Availability text" value={f.heroAvailability} onChange={set('heroAvailability')} />
            <Text id="s-cta" label="Main button text" value={f.globalCtaText} onChange={set('globalCtaText')} />
            <Text id="s-ctaurl" label="Main button link (blank = WhatsApp using your phone number)" value={f.globalCtaUrl} onChange={set('globalCtaUrl')} placeholder="https://…" />
          </div>
          <PdfField label="CV / resume (PDF) — the Download CV button appears once this is set" value={f.cvUrl} onChange={set('cvUrl')} />
          <div>
            <span className={labelCls}>Numbers under the buttons (leave all empty to hide)</span>
            <Rows rows={f.heroStats} onChange={set('heroStats')} blank={{ value: '', unit: '', label: '' }} addLabel="Add a number"
              columns={[{ key: 'value', label: 'Number', placeholder: '8+' }, { key: 'unit', label: 'Unit (optional)', placeholder: 'Yrs' }, { key: 'label', label: 'Label', placeholder: 'Experience' }]} />
            <p className="text-xs text-amber-300 mt-3">Please make sure these figures are accurate — they are shown to every visitor.</p>
          </div>
        </Card>

        <Card title="About section">
          <div>
            <label htmlFor="s-about" className={labelCls}>About text</label>
            <textarea id="s-about" rows={5} value={f.aboutText} onChange={(e) => set('aboutText')(e.target.value)} className={inputCls} />
          </div>
          <Text id="s-tags" label="Skill pills (comma separated)" value={f.aboutTags} onChange={set('aboutTags')} />
          <div>
            <Text id="s-video" label="Intro video (YouTube link or direct .mp4 link — optional)" value={f.aboutVideoUrl} onChange={set('aboutVideoUrl')} placeholder="https://www.youtube.com/watch?v=…" />
            <p className="text-xs text-amber-300 mt-2">For an .mp4 file, export it as H.264 video + AAC audio. Other formats (for example H.265/HEVC from some phones and screen recorders) may play only the sound in many browsers.</p>
          </div>
          <ImageField label="Picture beside your resume (optional)" value={f.resumeImage} onChange={set('resumeImage')} maxSide={1200} />
        </Card>

        <Card title="Contact details" hint="Shown in the Contact section and the footer.">
          <div className="grid sm:grid-cols-2 gap-6">
            <Text id="s-email" type="email" label="Public e-mail" value={f.contactEmail} onChange={set('contactEmail')} />
            <Text id="s-phone" label="Phone / WhatsApp number" value={f.officePhone} onChange={set('officePhone')} />
          </div>
          <Text id="s-addr" label="Address" value={f.officeAddress} onChange={set('officeAddress')} />
        </Card>

        <Card title="Social media links" hint="Icons appear in the footer for every link you add (LinkedIn, Facebook, Instagram, YouTube, GitHub, X/Twitter…).">
          <Rows rows={f.socialLinks} onChange={set('socialLinks')} blank={{ platform: '', url: '' }} addLabel="Add a social link"
            columns={[{ key: 'platform', label: 'Network', placeholder: 'LinkedIn' }, { key: 'url', label: 'Link', placeholder: 'https://linkedin.com/in/…' }]} />
        </Card>

        <Card title="Menu links">
          <Rows rows={f.headerLinks} onChange={set('headerLinks')} blank={{ label: '', url: '' }} addLabel="Add a menu link"
            columns={[{ key: 'label', label: 'Name', placeholder: 'About' }, { key: 'url', label: 'Link', placeholder: '/#about' }]} />
          <button type="button" onClick={() => set('headerLinks')(DEFAULT_HEADER_LINKS)} className="text-sm text-gray-300 underline">Reset to the standard menu</button>
        </Card>

        <Card title="Footer">
          <Text id="s-copy" label="Copyright line" value={f.copyrightText} onChange={set('copyrightText')} />
          <ImageField label="Footer portrait (transparent PNG, optional)" value={f.footerPortrait} onChange={set('footerPortrait')} maxSide={900} />
        </Card>

        <Card title="Legal pages" hint="Plain text. The Privacy Policy starts from a short, accurate description of what this site collects — please review it.">
          {([['termsOfService', 'Terms of Service', DEFAULT_TERMS], ['privacyPolicy', 'Privacy Policy', DEFAULT_PRIVACY_POLICY], ['refundPolicy', 'Refund Policy', DEFAULT_REFUND]] as const).map(([key, label, fallback]) => (
            <div key={key}>
              <label htmlFor={`s-${key}`} className={labelCls}>{label}</label>
              <textarea id={`s-${key}`} rows={7} value={f[key]} onChange={(e) => set(key)(e.target.value)} className={inputCls} />
              <button type="button" className="text-xs text-gray-400 underline mt-1" onClick={() => set(key)(fallback)}>Restore the starting text</button>
            </div>
          ))}
        </Card>
      </form>

      <Card title="Change my password">
        <form onSubmit={updatePassword} className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="new-password" className={labelCls}>New password (at least 10 characters)</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
          </div>
          <button type="submit" disabled={pwBusy} className="bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-60">{pwBusy ? 'Saving…' : 'Change password'}</button>
        </form>
      </Card>
    </div>
  );
}
