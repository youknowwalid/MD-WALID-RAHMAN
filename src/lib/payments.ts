/** Pay by mobile wallet ("Send Money") and get the PDF once the payment is verified. */

export type WalletId = string;

/** A product's short code, e.g. "my-book". A product's "checkout" field set to one of these opens this checkout; a normal link keeps working as before. */
export const PRODUCT_KEY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const editionOf = (value: string | undefined): string | null => {
  const key = (value || '').trim().toLowerCase();
  return PRODUCT_KEY_RE.test(key) ? key : null;
};

/** What the checkout page shows. It all comes from the admin (Store setup) through /api/checkout?config=1: nothing is typed in code. */
export interface CheckoutProduct { key: string; name: string; price: number }
export interface CheckoutWallet { id: string; name: string; number: string }
export interface CheckoutConfig { products: CheckoutProduct[]; wallets: CheckoutWallet[]; supportEmail: string }

/** null = could not reach the server. */
export async function fetchCheckoutConfig(): Promise<CheckoutConfig | null> {
  try {
    const res = await fetch('/api/checkout?config=1');
    if (!res.ok) return null;
    const body = await res.json();
    return {
      products: Array.isArray(body?.products) ? body.products : [],
      wallets: Array.isArray(body?.wallets) ? body.wallets : [],
      supportEmail: typeof body?.supportEmail === 'string' ? body.supportEmail : '',
    };
  } catch {
    return null;
  }
}

export const formatBdt = (amount: number) => `৳${amount.toLocaleString('en-US')}`;

export interface OrderState {
  id: string;
  status: 'pending' | 'paid' | 'rejected';
  edition: string;
  name: string;
  amount: number;
  downloadUrl: string | null;
  emailed: boolean;
  token?: string;
}

export interface OrderInput {
  edition: string;
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

/** Plain-language message for a failed submission. `supportEmail` is the one saved in the admin (may be empty). */
export function submitErrorMessage(error: string, field?: string, supportEmail = ''): string {
  const fieldNames: Record<string, string> = {
    email: 'your email address',
    wallet: 'the wallet you paid with',
    trxId: 'the transaction ID (TrxID), usually 8–12 letters and numbers',
    sender: 'the number you paid from (11 digits, starting with 01)',
  };
  const help = supportEmail ? `email ${supportEmail}` : 'contact us';
  switch (error) {
    case 'invalid': return `Please check ${fieldNames[field || ''] || 'the form'} and try again.`;
    case 'duplicate': return `This transaction ID has already been submitted. If it was you, ${help} and we will sort it out.`;
    case 'rate_limited':
    case 'busy': return 'Too many attempts just now. Please wait a few minutes and try again.';
    case 'unconfigured': return `Checkout is not available right now. Please ${help}.`;
    case 'network': return 'We could not reach the server. Please check your internet and try again.';
    default: return `Something went wrong on our side. Please try again, or ${help}.`;
  }
}
