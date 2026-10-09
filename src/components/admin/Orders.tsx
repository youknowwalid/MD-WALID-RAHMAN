import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Loader2, Mail, RefreshCw, XCircle } from 'lucide-react';
import * as admin from '../../lib/admin';
import { OrderRow, PaymentSmsRow } from '../../types';
import { formatBdt } from '../../lib/payments';

type Filter = 'pending' | 'paid' | 'rejected' | 'all';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'pending', label: 'Waiting' },
  { id: 'paid', label: 'Paid' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];
const WALLET: Record<string, string> = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', unknown: 'Unknown' };
const STATUS_STYLE: Record<OrderRow['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};
const STATUS_LABEL: Record<OrderRow['status'], string> = { pending: 'Waiting for payment', paid: 'Paid', rejected: 'Rejected' };

interface Props { onToast: (type: 'success' | 'error', message: string) => void }

export default function Orders({ onToast }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [messages, setMessages] = useState<PaymentSmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [showMessages, setShowMessages] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, m] = await Promise.all([admin.listOrders(), admin.listPaymentSms()]);
      setOrders(o);
      setMessages(m);
    } catch (err: any) {
      onToast('error', `Could not load orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [onToast]);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
    all: orders.length,
  }), [orders]);
  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const act = async (action: 'approve' | 'reject' | 'resend', order: OrderRow) => {
    if (action === 'reject' && !window.confirm('Reject this order? Use this only if no matching payment arrived.')) return;
    if (action === 'approve' && !window.confirm(`Approve this order? Only do it if you can see ${formatBdt(order.amount_due)} from ${order.sender} in your ${WALLET[order.wallet]} history. The buyer gets the download link by email right away.`)) return;
    setBusyId(order.id);
    try {
      const { email } = await admin.orderAction(action, order.id);
      if (action === 'reject') onToast('success', 'Order rejected.');
      else if (email && !email.sent) onToast('error', `Saved, but the email could not be sent: ${email.reason || 'unknown reason'}. The buyer can still download on their screen.`);
      else onToast('success', action === 'resend' ? 'Email sent again.' : 'Approved. The download email is on its way.');
      await load();
    } catch (err: any) {
      onToast('error', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const lastMessage = messages[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Order status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${filter === f.id ? 'bg-accent text-white border-transparent' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}
            >
              {f.label} <span className="opacity-70">({counts[f.id]})</span>
            </button>
          ))}
        </div>
        <button onClick={load} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5" aria-label="Refresh orders">
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {loading && <div className="flex justify-center py-16" role="status" aria-label="Loading"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}

      {!loading && shown.length === 0 && (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
          <p className="text-gray-400">{filter === 'pending' ? 'No orders are waiting. New orders appear here.' : 'Nothing here yet.'}</p>
        </div>
      )}

      {!loading && (
        <ul className="grid gap-4">
          {shown.map((o) => (
            <li key={o.id} className="bg-bg-card rounded-2xl border border-white/5 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-wide rounded-full border px-3 py-1 ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{o.edition === 'bangla' ? 'Bangla edition' : 'English edition'}</span>
                    {o.status === 'paid' && o.paid_how && <span className="text-xs text-gray-500">({o.paid_how === 'auto' ? 'matched automatically' : 'approved by hand'})</span>}
                  </div>
                  <p className="text-lg font-bold text-white break-all">{o.email}</p>
                  <p className="text-sm text-gray-300">
                    {formatBdt(o.amount_due)} via <strong>{WALLET[o.wallet]}</strong> from <span className="font-mono">{o.sender}</span>
                  </p>
                  <p className="text-sm text-gray-300">TrxID <span className="font-mono font-bold text-white select-all">{o.trx_id}</span></p>
                  <p className="text-xs text-gray-500">
                    Submitted {new Date(o.created_at).toLocaleString()}
                    {o.status === 'paid' && (o.emailed_at ? ` · email sent ${new Date(o.emailed_at).toLocaleString()}` : ' · email NOT sent yet')}
                  </p>
                  {o.status === 'paid' && !o.emailed_at && o.email_error && <p className="text-xs text-rose-300 break-words">Email problem: {o.email_error}</p>}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {o.status === 'pending' && (
                    <>
                      <button disabled={busyId === o.id} onClick={() => act('approve', o)} className="flex items-center gap-2 bg-accent text-white font-black px-4 py-3 rounded-xl disabled:opacity-60">
                        {busyId === o.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle className="w-4 h-4" aria-hidden="true" />} Approve &amp; email
                      </button>
                      <button disabled={busyId === o.id} onClick={() => act('reject', o)} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-60">
                        <XCircle className="w-4 h-4" aria-hidden="true" /> Reject
                      </button>
                    </>
                  )}
                  {o.status === 'paid' && (
                    <button disabled={busyId === o.id} onClick={() => act('resend', o)} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-60">
                      {busyId === o.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Mail className="w-4 h-4" aria-hidden="true" />} Resend email
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="sms-heading" className="border-t border-white/5 pt-6">
        <button onClick={() => setShowMessages((v) => !v)} aria-expanded={showMessages} className="w-full text-left flex flex-wrap items-center justify-between gap-2">
          <h2 id="sms-heading" className="text-lg font-black text-white">Payment messages from your phone</h2>
          <span className="text-xs text-gray-400">
            {lastMessage ? `Last one received ${new Date(lastMessage.received_at).toLocaleString()}` : 'None received yet. Set up the SMS forwarder on your phone.'}
          </span>
        </button>
        {showMessages && (
          <ul className="grid gap-3 mt-4">
            {messages.length === 0 && <li className="text-sm text-gray-400">Nothing yet.</li>}
            {messages.map((m) => (
              <li key={m.id} className="bg-bg-card rounded-xl border border-white/5 p-4 text-sm">
                <p className="text-white font-bold">
                  {WALLET[m.wallet]} · {m.amount !== null ? formatBdt(m.amount) : 'amount not read'} · from <span className="font-mono">{m.sender || '?'}</span> · TrxID <span className="font-mono">{m.trx_id || '?'}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{new Date(m.received_at).toLocaleString()} · {m.claimed_by ? 'used by an order' : 'not used yet'}</p>
                <p className="text-xs text-gray-400 mt-2 break-words font-mono">{m.raw}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
