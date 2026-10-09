import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Loader2, AlertTriangle } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import Seo from './Seo';

interface OrderItem { priceId: string; name: string; downloadUrl: string }
type State =
  | { kind: 'loading' }
  | { kind: 'ready'; items: OrderItem[] }
  | { kind: 'waiting' }
  | { kind: 'problem' };

const MAX_TRIES = 8;

/** Shown after a successful Paddle checkout. The server confirms the payment before any link is shown. */
export default function ThankYou() {
  const [params] = useSearchParams();
  const txn = params.get('txn') || '';
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!/^txn_[a-z0-9]{20,40}$/.test(txn)) { setState({ kind: 'problem' }); return; }
    let live = true;
    let tries = 0;
    const check = async () => {
      tries += 1;
      try {
        const res = await fetch(`/api/order?txn=${encodeURIComponent(txn)}`, { cache: 'no-store' });
        const body = await res.json().catch(() => ({}));
        if (!live) return;
        if (res.ok && body.status === 'paid' && Array.isArray(body.items) && body.items.length) {
          setState({ kind: 'ready', items: body.items });
          return;
        }
        // Paddle can take a few seconds to mark the payment as complete.
        if (res.ok && body.status === 'unpaid' && tries < MAX_TRIES) {
          setState({ kind: 'waiting' });
          setTimeout(check, 2500);
          return;
        }
      } catch { /* fall through to the retry / problem state */ }
      if (!live) return;
      if (tries < MAX_TRIES) { setTimeout(check, 2500); return; }
      setState({ kind: 'problem' });
    };
    check();
    return () => { live = false; };
  }, [txn]);

  return (
    <div className="min-h-screen bg-bg-dark text-text-main selection:bg-accent/30 selection:text-text-main">
      <Seo title="Thank you" description="Your purchase is confirmed." noindex />
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <div className="bg-bg-card border border-white/5 rounded-3xl p-8 md:p-10 shadow-xl text-center">
          {(state.kind === 'loading' || state.kind === 'waiting') && (
            <div role="status" aria-live="polite">
              <Loader2 className="w-10 h-10 text-accent mx-auto mb-5 animate-spin" aria-hidden="true" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">Confirming your payment…</h1>
              <p className="text-text-muted text-sm">This usually takes a few seconds. Please keep this page open.</p>
            </div>
          )}

          {state.kind === 'ready' && (
            <div>
              <CheckCircle className="w-12 h-12 text-accent mx-auto mb-5" aria-hidden="true" />
              <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-3">Thank you for your purchase!</h1>
              <p className="text-text-muted text-sm mb-8">Your payment is confirmed. Download your file below. Paddle has also emailed you a receipt.</p>
              <div className="space-y-3">
                {state.items.map((item) => (
                  <a
                    key={item.priceId}
                    href={item.downloadUrl}
                    className="flex items-center justify-center gap-3 w-full bg-accent hover:opacity-90 text-black font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all"
                  >
                    <Download className="w-5 h-5" aria-hidden="true" />
                    <span>Download: {item.name}</span>
                  </a>
                ))}
              </div>
              <p className="text-text-muted text-xs mt-8">
                Tip: save the PDF right away. If you ever need this page again, use the receipt email from Paddle or contact us.
              </p>
            </div>
          )}

          {state.kind === 'problem' && (
            <div>
              <AlertTriangle className="w-10 h-10 text-accent mx-auto mb-5" aria-hidden="true" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">We couldn't confirm this order yet</h1>
              <p className="text-text-muted text-sm mb-6">
                If you just paid, don't worry: your payment is safe. Wait a minute and refresh this page, or contact us with your Paddle receipt and we'll send your file right away.
              </p>
              <Link to="/#contact" className="inline-block bg-accent text-black font-extrabold py-3 px-6 rounded-2xl">Contact us</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
