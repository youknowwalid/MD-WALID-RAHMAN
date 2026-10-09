/** Pay by mobile wallet ("Send Money") and get the PDF once the payment is verified. */

/** Price of one book in Bangladeshi taka. Keep in sync with api/_catalog.js (a unit test checks this). */
export const PRICE_BDT = 2999;

/** The wallet numbers buyers send money to. */
export const WALLETS = [
  { id: 'bkash', name: 'bKash', number: '01756520701' },
  { id: 'nagad', name: 'Nagad', number: '01744588644' },
] as const;
export type WalletId = (typeof WALLETS)[number]['id'];

export const SUPPORT_EMAIL = 'hello@walidrahman.com';

export type Edition = 'english' | 'bangla';
export const EDITIONS: Record<Edition, { title: string }> = {
  english: { title: 'Automate Your Facebook Business with AI (English Edition)' },
  bangla: { title: 'Automate Your Facebook Business with AI (Bangla Edition)' },
};

export const isEdition = (value: unknown): value is Edition => value === 'english' || value === 'bangla';

/** A product's "checkout" field set to `english` or `bangla` opens this checkout; a normal link keeps working as before. */
export const editionOf = (value: string | undefined): Edition | null => {
  const key = (value || '').trim().toLowerCase();
  return isEdition(key) ? key : null;
};

export const formatBdt = (amount: number) => `৳${amount.toLocaleString('en-US')}`;

export interface OrderState {
  id: string;
  status: 'pending' | 'paid' | 'rejected';
  edition: Edition;
  name: string;
  amount: number;
  downloadUrl: string | null;
  emailed: boolean;
  token?: string;
}

export interface OrderInput {
  edition: Edition;
  email: string;
  wallet: WalletId;
  trxId: string;
  sender: string;
  website?: string; // hidden spam trap, always empty for real visitors
}

export interface SubmitResult { ok: boolean; order?: OrderState; error?: string; field?: string }

export async function submitOrder(input: OrderInput): Promise<SubmitResult> {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body?.id && body?.token) return { ok: true, order: body as OrderState };
    return { ok: false, error: String(body?.error || 'server'), field: body?.field };
  } catch {
    return { ok: false, error: 'network' };
  }
}

/** Current state of an order. null = could not reach the server (try again), 'gone' = unknown order or secret. */
export async function fetchOrder(id: string, token: string): Promise<OrderState | null | 'gone'> {
  try {
    const res = await fetch(`/api/checkout?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (res.status === 400 || res.status === 404) return 'gone';
    if (!res.ok) return null;
    return (await res.json()) as OrderState;
  } catch {
    return null;
  }
}

/** Plain-language message for a failed submission. */
export function submitErrorMessage(error: string, field?: string): string {
  const fieldNames: Record<string, string> = {
    email: 'your email address',
    wallet: 'the wallet you paid with',
    trxId: 'the transaction ID (TrxID), usually 8–12 letters and numbers',
    sender: 'the number you paid from (11 digits, starting with 01)',
  };
  switch (error) {
    case 'invalid': return `Please check ${fieldNames[field || ''] || 'the form'} and try again.`;
    case 'duplicate': return `This transaction ID has already been submitted. If it was you, email ${SUPPORT_EMAIL} and we will sort it out.`;
    case 'rate_limited':
    case 'busy': return 'Too many attempts just now. Please wait a few minutes and try again.';
    case 'unconfigured': return `Checkout is not available right now. Please email ${SUPPORT_EMAIL}.`;
    case 'network': return 'We could not reach the server. Please check your internet and try again.';
    default: return `Something went wrong on our side. Please try again, or email ${SUPPORT_EMAIL}.`;
  }
}
