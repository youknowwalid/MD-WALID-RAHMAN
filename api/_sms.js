// Reads the "money received" text messages that bKash / Nagad / Rocket send to the owner's phone.
// The parser is deliberately forgiving: wording differs slightly between wallets and over time.
// Anything that is not a "received" message (OTP codes, sent money, bills) is ignored and never stored.

/** "+8801712345678", "8801712345678", "01712-345678" -> "01712345678" ('' when it is not a valid mobile number). */
export function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) digits = `0${digits.slice(3)}`;
  else if (digits.length === 10 && digits.startsWith('1')) digits = `0${digits}`;
  return /^01[3-9]\d{8}$/.test(digits) ? digits : '';
}

/** Transaction ids are compared in upper case without spaces or dashes. */
export const normalizeTrx = (value) => String(value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const WALLET_HINTS = [
  ['bkash', /bkash/i],
  ['nagad', /nagad/i],
  ['rocket', /rocket|dbbl|\b16216\b/i],
];
const RECEIVED = /\b(received|credited|cash[\s-]?in)\b/i;
const OUTGOING = /\b(sent|cash[\s-]?out|payment to|paid to|send money to|bill|recharge|withdraw|verification|otp|pin)\b/i;
const AMOUNT = /(?:tk\.?|bdt|৳)\s*([\d,]+(?:\.\d{1,2})?)/i;
const TRX = /\b(?:trx\s?id|txn\s?id|transaction\s?id)\b\s*[:#-]?\s*([A-Za-z0-9]{6,20})/i;
const PHONE = /(?<!\d)(?:\+?88)?(01[3-9]\d{8})(?!\d)/;

export function detectWallet(text, from = '') {
  const haystack = `${from} ${text}`;
  for (const [wallet, pattern] of WALLET_HINTS) if (pattern.test(haystack)) return wallet;
  return 'unknown';
}

/**
 * Returns null when the message is not an incoming wallet payment, otherwise
 * { wallet, trxId, amount, sender } where trxId / amount / sender may be null if the wording was unfamiliar
 * (the raw text is still saved so the admin can see it).
 */
export function parseSms(text, from = '') {
  const body = String(text ?? '').trim();
  if (!body) return null;
  const wallet = detectWallet(body, from);
  const incoming = RECEIVED.test(body) && !OUTGOING.test(body);
  const trxMatch = body.match(TRX);
  const amountMatch = body.match(AMOUNT);
  if (!incoming) return null;
  if (wallet === 'unknown' && !(trxMatch && amountMatch)) return null;
  return {
    wallet,
    trxId: trxMatch ? normalizeTrx(trxMatch[1]) : null,
    amount: amountMatch ? Number.parseFloat(amountMatch[1].replace(/,/g, '')) : null,
    sender: body.match(PHONE)?.[1] ?? null,
  };
}
