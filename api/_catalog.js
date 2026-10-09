// What each edition is, what it costs, and which PRIVATE file it unlocks. The files live in the
// private Supabase Storage bucket `paid-downloads` and are only ever handed out through
// /api/download after an order is confirmed as paid.
export const BUCKET = 'paid-downloads';

// Price of one book in Bangladeshi taka. Keep in sync with src/lib/payments.ts (a unit test checks this).
export const PRICE_BDT = 2999;

export const EDITIONS = {
  english: {
    name: 'Automate Your Facebook Business with AI (English edition)',
    path: 'English.pdf',
    filename: 'Automate-Your-Facebook-Business-with-AI-English.pdf',
    price: PRICE_BDT,
  },
  bangla: {
    name: 'Automate Your Facebook Business with AI (Bangla edition)',
    path: 'Bangla.pdf',
    filename: 'Automate-Your-Facebook-Business-with-AI-Bangla.pdf',
    price: PRICE_BDT,
  },
};

export const WALLETS = ['bkash', 'nagad', 'rocket'];

export const isEdition = (value) => typeof value === 'string' && Object.hasOwn(EDITIONS, value);
