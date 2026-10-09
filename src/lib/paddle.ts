import { PADDLE_CLIENT_TOKEN } from './config';

/** A Paddle price ID (pri_…) in the product's "checkout link" field opens the on-site checkout. */
export const isPaddlePriceId = (value: string | undefined): value is string => /^pri_[a-z0-9]{20,40}$/i.test((value || '').trim());

type PaddleEvent = { name?: string; data?: { transaction_id?: string } };
interface PaddleGlobal {
  Initialize: (options: { token: string; eventCallback?: (event: PaddleEvent) => void }) => void;
  Checkout: { open: (options: Record<string, unknown>) => void };
}
declare global {
  interface Window { Paddle?: PaddleGlobal }
}

let loading: Promise<PaddleGlobal> | null = null;

/** Loads Paddle.js once, only when a visitor actually clicks Buy. */
function loadPaddle(): Promise<PaddleGlobal> {
  if (loading) return loading;
  loading = new Promise<PaddleGlobal>((resolve, reject) => {
    if (!PADDLE_CLIENT_TOKEN) return reject(new Error('Paddle is not configured'));
    const done = () => {
      const paddle = window.Paddle;
      if (!paddle) return reject(new Error('Paddle failed to load'));
      paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (event) => {
          // After a successful payment, send the buyer to the download page.
          if (event.name === 'checkout.completed' && event.data?.transaction_id) {
            window.location.assign(`/thank-you?txn=${encodeURIComponent(event.data.transaction_id)}`);
          }
        },
      });
      resolve(paddle);
    };
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = done;
    script.onerror = () => reject(new Error('Paddle failed to load'));
    document.head.appendChild(script);
  });
  loading.catch(() => { loading = null; }); // allow a retry on the next click
  return loading;
}

export async function openCheckout(priceId: string): Promise<void> {
  const paddle = await loadPaddle();
  paddle.Checkout.open({
    items: [{ priceId: priceId.trim(), quantity: 1 }],
    settings: { displayMode: 'overlay', theme: 'dark', locale: 'en', allowLogout: false },
  });
}
