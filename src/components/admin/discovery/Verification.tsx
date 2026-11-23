import React, { useState } from 'react';
import { BadgeCheck, Send } from 'lucide-react';
import { patchSettings, submitIndexNow, listAll } from '../../../lib/admin';
import { DiscoverySettings, FIXED_PAGES, generateIndexNowKey, isIndexNowKey } from '../../../lib/discovery';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { friendlyError } from '../forms';
import { Card, GhostButton, SaveButton, TextField, Toaster } from './parts';

/** Site-ownership codes for Google and Bing, and the IndexNow key that lets Bing and others hear about changes at once. */
export default function Verification({ value, onSaved, onToast }: { value: DiscoverySettings; onSaved: () => Promise<void>; onToast: Toaster }) {
  const { seoConfig } = useSiteConfig();
  const [google, setGoogle] = useState(value.verification.google);
  const [bing, setBing] = useState(value.verification.bing);
  const [key, setKey] = useState(value.indexnow.key);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const site = seoConfig.siteUrl.replace(/\/+$/, '');
  const keySaved = isIndexNowKey(value.indexnow.key) && value.indexnow.key === key;

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (key && !isIndexNowKey(key)) return onToast('error', 'The IndexNow key must be 32 letters and numbers (a-f, 0-9). Use “Create a key”.');
    if (/[<>"']/.test(google + bing)) return onToast('error', 'Paste only the code itself, not the whole tag.');
    setSaving(true);
    try {
      await patchSettings('discovery', { verification: { google: google.trim(), bing: bing.trim() }, indexnow: { key } });
      await onSaved();
      onToast('success', 'Saved. The key file goes live within a few minutes.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally { setSaving(false); }
  };

  const sendAll = async () => {
    setSending(true);
    try {
      const [posts, projects] = await Promise.all([listAll('blogPosts'), listAll('projects')]);
      const urls = [
        ...FIXED_PAGES.map((p) => `${site}${p.path}`),
        ...posts.filter((p: any) => p.slug).map((p: any) => `${site}/blog/${p.slug}`),
        ...projects.filter((p: any) => p.slug && p.published !== false).map((p: any) => `${site}/projects/${p.slug}`),
      ];
      const { submitted } = await submitIndexNow(urls);
      onToast('success', `Sent ${submitted} addresses to the search engines.`);
    } catch (err: any) {
      onToast('error', friendlyError(err.message));
    } finally { setSending(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      <Card title="Prove the site is yours" icon={<BadgeCheck className="text-accent w-6 h-6" aria-hidden="true" />}
        hint="Google Search Console and Bing Webmaster Tools each give you a code. Paste only the code (the long text inside content="…").">
        <TextField id="ver-google" label="Google verification code" value={google} onChange={setGoogle} />
        <TextField id="ver-bing" label="Bing verification code" value={bing} onChange={setBing} />
      </Card>
      <Card title="Tell search engines the moment something changes (IndexNow)"
        hint="Bing, Yandex and others use IndexNow. Google does not, so Google still finds changes through your sitemap.">
        <TextField id="in-key" label="Your IndexNow key" value={key} onChange={setKey} hint={key ? `The proof file will be at ${site}/${key}.txt` : 'Press “Create a key”, then Save.'} />
        <div className="flex gap-3 flex-wrap">
          <GhostButton onClick={() => setKey(generateIndexNowKey())}>Create a key</GhostButton>
          <GhostButton onClick={sendAll} disabled={!keySaved || sending}><span className="inline-flex items-center gap-2"><Send className="w-4 h-4" aria-hidden="true" />{sending ? 'Sending…' : 'Send all pages now'}</span></GhostButton>
        </div>
        {!keySaved && <p className="text-xs text-gray-400">Save the key first. Then you can send your pages.</p>}
      </Card>
      <div className="flex justify-end"><SaveButton saving={saving} /></div>
    </form>
  );
}
