import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Package, Plus, Trash2 } from 'lucide-react';
import * as admin from '../../lib/admin';
import { friendlyError } from './forms';
import { PRODUCT_KEY_RE } from '../../lib/payments';
import { Card, Check, GhostButton, Loading, SaveButton, TextField, Toaster } from './discovery/parts';

const WALLET_LIST = [
  { id: 'bkash', name: 'bKash' },
  { id: 'nagad', name: 'Nagad' },
  { id: 'rocket', name: 'Rocket' },
] as const;

type Row = { key: string; name: string; price: string; file_path: string; download_name: string; is_active: boolean; isNew: boolean };
const toRow = (p: admin.StoreProductRow): Row => ({ key: p.key, name: p.name, price: String(p.price_bdt), file_path: p.file_path, download_name: p.download_name, is_active: p.is_active, isNew: false });
const blank = (): Row => ({ key: '', name: '', price: '', file_path: '', download_name: '', is_active: true, isNew: true });
const NUMBER_RE = /^[0-9+ -]{6,20}$/;

/** What you sell with mobile-wallet checkout, where buyers send the money, and who they contact. Nothing about it lives in the code. */
export default function StoreSetup({ onToast }: { onToast: Toaster }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [supportEmail, setSupportEmail] = useState('');
  const [savingKey, setSavingKey] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  const load = useCallback(async () => {
    try {
      const [products, settings] = await Promise.all([admin.listStoreProducts(), admin.loadSettings()]);
      setRows(products.map(toRow));
      const saved: { id: string; number: string }[] = Array.isArray(settings.payments?.wallets) ? settings.payments.wallets : [];
      setNumbers(Object.fromEntries(saved.map((w) => [String(w.id), String(w.number ?? '')])));
      setSupportEmail(String(settings.payments?.supportEmail ?? ''));
    } catch (err: any) {
      onToast('error', `Could not load: ${friendlyError(err.message)}`);
      setRows([]);
    }
  }, [onToast]);
  useEffect(() => { load(); }, [load]);

  const patch = (index: number, change: Partial<Row>) => setRows((r) => (r ? r.map((x, i) => (i === index ? { ...x, ...change } : x)) : r));

  const saveRow = async (index: number) => {
    const row = rows?.[index];
    if (!row) return;
    const key = row.key.trim().toLowerCase();
    const price = Number(row.price);
    if (!PRODUCT_KEY_RE.test(key)) return onToast('error', 'The product code must be 1–40 letters, numbers or dashes, e.g. my-book.');
    if (!row.name.trim()) return onToast('error', 'Give the product a name.');
    if (!Number.isInteger(price) || price <= 0) return onToast('error', 'The price must be a whole number of taka, e.g. 500.');
    if (!row.file_path.trim() || row.file_path.includes('..')) return onToast('error', 'Enter the file name exactly as it is stored in the private paid-downloads storage.');
    setSavingKey(key);
    try {
      await admin.saveStoreProduct(row.isNew, { key, name: row.name.trim(), price_bdt: price, file_path: row.file_path.trim(), download_name: row.download_name.trim(), is_active: row.is_active, sort_order: index });
      onToast('success', 'Product saved.');
      await load();
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally { setSavingKey(''); }
  };

  const removeRow = async (index: number) => {
    const row = rows?.[index];
    if (!row) return;
    if (row.isNew) return setRows((r) => (r ? r.filter((_, i) => i !== index) : r));
    if (!window.confirm(`Delete "${row.name}"? Past orders keep working only if you add a product with the same code again.`)) return;
    try { await admin.deleteStoreProduct(row.key); onToast('success', 'Product deleted.'); await load(); }
    catch (err: any) { onToast('error', `Delete failed: ${friendlyError(err.message)}`); }
  };

  const savePayments = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const wallets = WALLET_LIST.map((w) => ({ id: w.id, name: w.name, number: (numbers[w.id] || '').trim() })).filter((w) => w.number);
    const bad = wallets.find((w) => !NUMBER_RE.test(w.number));
    if (bad) return onToast('error', `${bad.name}: enter just the number, e.g. 01XXXXXXXXX.`);
    const mail = supportEmail.trim();
    if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return onToast('error', 'That support e-mail does not look right.');
    setSavingPay(true);
    try {
      await admin.patchSettings('payments', { wallets, supportEmail: mail });
      onToast('success', 'Payment details saved.');
    } catch (err: any) {
      onToast('error', `Could not save: ${friendlyError(err.message)}`);
    } finally { setSavingPay(false); }
  };

  if (!rows) return <Loading />;
  return (
    <div className="space-y-8 max-w-4xl">
      <form onSubmit={savePayments} className="space-y-6">
        <Card title="Where buyers send the money" icon={<CreditCard className="text-accent w-6 h-6" aria-hidden="true" />} hint="Leave a wallet empty to hide it from checkout. Buyers use Send Money to these numbers.">
          <div className="grid sm:grid-cols-3 gap-5">
            {WALLET_LIST.map((w) => (
              <TextField key={w.id} id={`wallet-${w.id}`} label={`${w.name} number`} value={numbers[w.id] || ''} onChange={(v) => setNumbers((n) => ({ ...n, [w.id]: v }))} placeholder="01XXXXXXXXX" />
            ))}
          </div>
          <div className="mt-5 max-w-md">
            <TextField id="support-email" label="Support e-mail" type="email" value={supportEmail} onChange={setSupportEmail} hint="Shown to buyers when something goes wrong, and used as the sender of the download e-mail (together with your site name)." />
          </div>
        </Card>
        <SaveButton saving={savingPay} label="Save payment details" />
      </form>

      <Card title="Products you sell" icon={<Package className="text-accent w-6 h-6" aria-hidden="true" />} hint="The price is checked on the server, so nobody can change it from their browser. In the Products tab, put the product code in the product's checkout field to open this checkout.">
        <div className="space-y-6">
          {rows.length === 0 && <p className="text-sm text-gray-400">No products yet. Add one below.</p>}
          {rows.map((row, i) => (
            <div key={row.isNew ? `new-${i}` : row.key} className="rounded-2xl border border-white/10 p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-5">
                <TextField id={`p-key-${i}`} label="Product code" value={row.key} onChange={(v) => patch(i, { key: v })} placeholder="my-book" hint={row.isNew ? 'Letters, numbers and dashes. Cannot be changed later.' : 'Cannot be changed.'} maxLength={40} />
                <TextField id={`p-name-${i}`} label="Name buyers see" value={row.name} onChange={(v) => patch(i, { name: v })} maxLength={200} />
                <TextField id={`p-price-${i}`} label="Price (taka)" value={row.price} onChange={(v) => patch(i, { price: v.replace(/[^0-9]/g, '') })} placeholder="500" />
                <TextField id={`p-file-${i}`} label="File in private storage" value={row.file_path} onChange={(v) => patch(i, { file_path: v })} placeholder="my-book.pdf" hint="The exact file name inside the private “paid-downloads” bucket in Supabase Storage." />
                <TextField id={`p-dl-${i}`} label="Name of the downloaded file (optional)" value={row.download_name} onChange={(v) => patch(i, { download_name: v })} placeholder="My-Book.pdf" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Check label="On sale (untick to stop new orders)" checked={row.is_active} onChange={(v) => patch(i, { is_active: v })} />
                <div className="flex gap-2">
                  <GhostButton danger onClick={() => removeRow(i)}><Trash2 className="w-4 h-4 inline mr-1" aria-hidden="true" />{row.isNew ? 'Remove' : 'Delete'}</GhostButton>
                  <GhostButton onClick={() => saveRow(i)} disabled={savingKey !== ''}>{savingKey && savingKey === row.key.trim().toLowerCase() ? 'Saving…' : 'Save product'}</GhostButton>
                </div>
              </div>
            </div>
          ))}
          <GhostButton onClick={() => setRows((r) => [...(r ?? []), blank()])}><Plus className="w-4 h-4 inline mr-1" aria-hidden="true" />Add product</GhostButton>
        </div>
      </Card>
    </div>
  );
}
