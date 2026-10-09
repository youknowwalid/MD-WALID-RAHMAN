import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Download, Loader2, Mail } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import Seo from './Seo';
import { OrderState, SUPPORT_EMAIL, fetchOrder, formatBdt } from '../lib/payments';

type State =
  | { kind: 'loading' }
  | { kind: 'checking'; order: OrderState; slow: boolean }
  | { kind: 'paid'; order: OrderState }
  | { kind: 'problem'; reason: 'invalid' | 'rejected' };

const POLL_MS = 4000;
const SLOW_AFTER = 15; // about a minute
const GIVE_UP_AFTER = 60; // about four minutes; the order stays safe and we e-mail when it is confirmed

/** Shows the state of one order. The secret code in the address is what proves it is the buyer's order. */
export default function ThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('order') || '';
  const token = params.get('t') || '';
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!orderId || !token) { setState({ kind: 'problem', reason: 'invalid' }); return; }
    let live = true;
    let tries = 0;
    let timer: number | undefined;
    const check = async () => {
      tries += 1;
      const result = await fetchOrder(orderId, token);
      if (!live) return;
      if (result === 'gone') { setState({ kind: 'problem', reason: 'invalid' }); return; }
      if (result?.status === 'paid') { setState({ kind: 'paid', order: result }); return; }
      if (result?.status === 'rejected') { setState({ kind: 'problem', reason: 'rejected' }); return; }
      if (result) setState({ kind: 'checking', order: result, slow: tries >= SLOW_AFTER });
      if (tries < GIVE_UP_AFTER) timer = window.setTimeout(check, POLL_MS);
    };
    check();
    return () => { live = false; window.clearTimeout(timer); };
  }, [orderId, token]);

  return (
    <div className="min-h-screen bg-bg-dark text-text-main selection:bg-accent/30 selection:text-text-main">
      <Seo title="Your order" description="Your order status and download." noindex />
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <div className="bg-bg-card border border-white/5 rounded-3xl p-8 md:p-10 shadow-xl text-center">
          {state.kind === 'loading' && (
            <div role="status" aria-live="polite">
              <Loader2 className="w-10 h-10 text-accent mx-auto mb-5 animate-spin" aria-hidden="true" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">Loading your order…</h1>
            </div>
          )}

          {state.kind === 'checking' && (
            <div role="status" aria-live="polite">
              <Loader2 className="w-10 h-10 text-accent mx-auto mb-5 animate-spin" aria-hidden="true" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">Verifying your payment…</h1>
              <p className="text-text-muted text-sm mb-2">{state.order.name}</p>
              {!state.slow ? (
                <p className="text-text-muted text-sm">This usually takes less than a minute. Please keep this page open.</p>
              ) : (
                <p className="text-text-muted text-sm">
                  This is taking a little longer than usual. Your order is saved, and we will email you the download link as soon as your payment is confirmed. You can also bookmark this page and come back to it.
                </p>
              )}
            </div>
          )}

          {state.kind === 'paid' && (
            <div>
              <CheckCircle className="w-12 h-12 text-accent mx-auto mb-5" aria-hidden="true" />
              <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-3">Payment confirmed. Thank you!</h1>
              <p className="text-text-muted text-sm mb-8">
                {formatBdt(state.order.amount)} received. Your download is ready below.
              </p>
              <a
                href={state.order.downloadUrl || '#'}
                className="flex items-center justify-center gap-3 w-full bg-accent hover:opacity-90 text-black font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all"
              >
                <Download className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Download: {state.order.name}</span>
              </a>
              <p className="flex items-start justify-center gap-2 text-text-muted text-xs mt-8">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {state.order.emailed
                    ? 'We also emailed you a link, so you can download again any time.'
                    : `Bookmark this page: it is your download link. If you ever lose it, email ${SUPPORT_EMAIL}.`}
                </span>
              </p>
            </div>
          )}

          {state.kind === 'problem' && (
            <div>
              <AlertTriangle className="w-10 h-10 text-accent mx-auto mb-5" aria-hidden="true" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                {state.reason === 'rejected' ? "We couldn't confirm this payment" : "We couldn't find this order"}
              </h1>
              <p className="text-text-muted text-sm mb-6">
                {state.reason === 'rejected'
                  ? `Your transaction did not match a payment we received. If you did pay, email ${SUPPORT_EMAIL} with your transaction ID and we will fix it right away.`
                  : `The link looks incomplete or has expired. Use the link from your email, or contact ${SUPPORT_EMAIL} and we will help.`}
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
