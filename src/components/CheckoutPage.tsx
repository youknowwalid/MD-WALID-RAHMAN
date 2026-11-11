import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Check, Copy, Loader2, ShieldCheck } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import Seo from './Seo';
import { useProducts } from '../lib/products';
import {
  EDITIONS, PRICE_BDT, SUPPORT_EMAIL, WALLETS, WalletId, editionOf, formatBdt, isEdition, submitErrorMessage, submitOrder,
} from '../lib/payments';

const field = 'w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 text-base text-text-main placeholder:text-text-muted focus:border-accent outline-none transition-colors';
const label = 'block text-sm font-semibold text-text-main mb-2';

function CopyButton({ value, name }: { value: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const box = document.createElement('textarea');
      box.value = value;
      box.setAttribute('readonly', '');
      box.style.position = 'fixed';
      box.style.opacity = '0';
      document.body.appendChild(box);
      box.select();
      try { document.execCommand('copy'); } catch { /* the number is shown on screen as well */ }
      document.body.removeChild(box);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 flex items-center gap-2 bg-accent text-black font-semibold text-sm px-4 min-h-11 rounded-xl hover:opacity-90 transition-opacity"
      aria-label={`Copy ${name} number`}
    >
      {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/** Pay by bKash / Nagad "Send Money", then enter the transaction ID to get the download. */
export default function CheckoutPage() {
  const { edition: editionParam } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const edition = isEdition(editionParam) ? editionParam : null;

  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState<WalletId>('bkash');
  const [sender, setSender] = useState('');
  const [trxId, setTrxId] = useState('');
  const [spamTrap, setSpamTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!edition) {
    return (
      <div className="home-v2 min-h-screen bg-bg-dark text-text-main">
        <Seo title="Checkout" noindex />
        <Navbar />
        <main className="pt-32 pb-20 px-6 max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-semibold mb-4">We couldn&apos;t find that book</h1>
          <Link to="/resources" className="inline-block bg-accent text-black font-semibold py-3 px-6 rounded-2xl">Back to the books</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const product = products.find((p) => editionOf(p.paddleUrl) === edition);
  const title = product?.title || EDITIONS[edition].title;
  const selected = WALLETS.find((w) => w.id === wallet)!;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const result = await submitOrder({ edition, email, wallet, trxId, sender, website: spamTrap });
    if (result.ok && result.order) {
      navigate(`/thank-you?order=${encodeURIComponent(result.order.id)}&t=${encodeURIComponent(result.order.token || '')}`, { replace: true });
      return;
    }
    setError(submitErrorMessage(result.error || 'server', result.field));
    setBusy(false);
  };

  return (
    <div className="home-v2 min-h-screen bg-bg-dark text-text-main selection:bg-accent/30 selection:text-text-main">
      <Seo title="Checkout" description="Pay with bKash or Nagad and download your book." noindex />
      <Navbar />
      <main className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">Checkout</h1>
        <p className="text-text-muted mb-8">{title}</p>

        <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 sm:p-8 mb-6">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <span className="text-sm font-semibold text-text-main">Amount to send</span>
            <span className="text-3xl font-semibold text-accent font-mono">{formatBdt(PRICE_BDT)}</span>
          </div>

          <h2 className="text-lg font-semibold mb-1"><span className="text-accent">1.</span> Send the money</h2>
          <p className="text-sm text-text-muted mb-5">
            Open your bKash or Nagad app, choose <strong className="text-text-main">Send Money</strong> (not Payment or Cash Out), and send exactly{' '}
            <strong className="text-text-main">{formatBdt(PRICE_BDT)}</strong> to one of these numbers.
          </p>
          <ul className="space-y-3 mb-2">
            {WALLETS.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 bg-bg-card border border-border-subtle rounded-2xl p-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-text-muted font-bold">{w.name} · Send Money</p>
                  <p className="text-xl sm:text-2xl font-semibold font-mono tracking-wide text-text-main select-all" data-testid={`wallet-${w.id}`}>{w.number}</p>
                </div>
                <CopyButton value={w.number} name={w.name} />
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-muted">After sending, you will get an SMS from the app with a <strong className="text-text-main">Transaction ID (TrxID)</strong>. You need it for the next step.</p>
        </div>

        <form onSubmit={submit} className="bg-bg-card border border-border-subtle rounded-3xl p-6 sm:p-8" noValidate>
          <h2 className="text-lg font-semibold mb-1"><span className="text-accent">2.</span> Confirm your payment</h2>
          <p className="text-sm text-text-muted mb-6">We check your payment automatically, usually within a minute, and you can download the book right away.</p>

          <div className="space-y-5">
            <div>
              <label htmlFor="co-email" className={label}>Your email (we send the download link here)</label>
              <input id="co-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
            </div>

            <fieldset>
              <legend className={label}>Which wallet did you pay with?</legend>
              <div className="grid grid-cols-2 gap-3">
                {WALLETS.map((w) => (
                  <label key={w.id} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${wallet === w.id ? 'border-accent bg-accent/10 text-text-main' : 'border-border-subtle text-text-main hover:border-white/30'}`}>
                    <input type="radio" name="wallet" value={w.id} checked={wallet === w.id} onChange={() => setWallet(w.id)} className="h-5 w-5 accent-accent" />
                    {w.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="co-sender" className={label}>The number you paid from</label>
              <input id="co-sender" inputMode="numeric" autoComplete="tel" required value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX" className={field} />
            </div>

            <div>
              <label htmlFor="co-trx" className={label}>Transaction ID (TrxID) from the {selected.name} SMS</label>
              <input id="co-trx" autoCapitalize="characters" autoCorrect="off" spellCheck={false} autoComplete="off" required value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="e.g. 8N7A6D5CQ" className={`${field} font-mono uppercase`} />
            </div>

            {/* Spam trap: invisible to people, tempting to bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" value={spamTrap} onChange={(e) => setSpamTrap(e.target.value)} /></label>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-rose-800 bg-rose-950/60 p-4 text-sm text-rose-200">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex items-center justify-center gap-3 w-full bg-accent hover:opacity-90 disabled:opacity-60 text-black font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all"
          >
            {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
            {busy ? 'Checking…' : "I've paid, verify my payment"}
          </button>

          <p className="mt-5 flex items-start gap-2 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 shrink-0 text-accent" aria-hidden="true" />
            <span>Your payment is matched with the SMS from the {selected.name} app. If something does not match, we confirm it by hand and email you. Questions? <a className="underline hover:text-text-main" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></span>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
