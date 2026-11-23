// Wires the order rules to the real database and the real mail server.
import { sendMail } from './_mail.js';
import { createStore, storeConfigured } from './_store.js';
import { originOf } from './_site.js';

export const isConfigured = storeConfigured;

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** Who the shop is: name and web address from Settings > SEO, support e-mail and wallets from Store setup. Nothing is typed in code. */
export async function brandOf(store, req) {
  const [seo, payments] = await Promise.all([store.getSetting('seo').catch(() => null), store.getSetting('payments').catch(() => null)]);
  const wallets = (Array.isArray(payments?.wallets) ? payments.wallets : [])
    .map((w) => ({ id: text(w?.id).toLowerCase(), name: text(w?.name), number: text(w?.number) }))
    .filter((w) => w.id && w.number);
  return {
    name: text(seo?.siteName),
    siteUrl: (text(seo?.siteUrl) || text(process.env.SITE_URL) || originOf(req)).replace(/\/+$/, ''),
    supportEmail: text(payments?.supportEmail),
    wallets,
  };
}

export function makeContext(req) {
  const store = createStore();
  return { store, mailer: sendMail, now: () => new Date(), brand: () => brandOf(store, req) };
}
