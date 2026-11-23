// Technical constants for the store. WHAT is sold (names, prices, private files), the wallet numbers and the
// support e-mail are NOT here: they live in the admin (Store setup) and are read from the database.

// The private Supabase Storage bucket that holds the paid files. Files are only ever handed out through
// /api/download after an order is confirmed as paid.
export const BUCKET = 'paid-downloads';

// Wallets the SMS reader understands (see _sms.js). Which of them a shop offers, and the numbers, are set in the admin.
export const WALLETS = ['bkash', 'nagad', 'rocket'];

// A product's short code, e.g. "my-book". Used in the checkout address and on orders.
export const PRODUCT_KEY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const isProductKey = (value) => typeof value === 'string' && PRODUCT_KEY_RE.test(value);
