// Sends the "your download is ready" e-mail from hello@walidrahman.com through Gmail's SMTP server
// (the same "Send mail as" setup the owner already uses). No extra service or package is needed:
// this is a small SMTP client over an encrypted connection (port 465).
//
// Server settings (Vercel, Production):
//   SMTP_USER  the Gmail address that owns the alias, e.g. walidxdxdxd@gmail.com
//   SMTP_PASS  a Google "App password" for that account (NOT the normal Gmail password)
//   MAIL_FROM  optional, default: Walid Rahman Swapnil <hello@walidrahman.com>
import { randomUUID } from 'node:crypto';
import tls from 'node:tls';

const DEFAULT_FROM = 'Walid Rahman Swapnil <hello@walidrahman.com>';

const clean = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
const b64 = (value) => Buffer.from(value, 'utf8').toString('base64');
const wrap = (value) => b64(value).replace(/.{1,76}/g, '$&\r\n').trimEnd();
const encodeWord = (value) => (/^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${b64(value)}?=`);

/** "Name <a@b.c>" -> { name, address } */
export function parseAddress(value) {
  const text = clean(value);
  const match = text.match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  if (match) return { name: match[1].replace(/^"|"$/g, ''), address: match[2] };
  return { name: '', address: text };
}

const formatAddress = ({ name, address }) => (name ? `${encodeWord(name)} <${address}>` : address);

/** The full message text: headers plus a plain-text and an HTML version. */
export function buildMessage({ from, to, subject, text, html, date = new Date(), messageId = `<${randomUUID()}@walidrahman.com>` }) {
  const boundary = `b_${randomUUID().replace(/-/g, '')}`;
  const sender = parseAddress(from);
  const headers = [
    `From: ${formatAddress(sender)}`,
    `To: ${clean(to)}`,
    `Reply-To: ${sender.address}`,
    `Subject: ${encodeWord(clean(subject))}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const part = (type, body) => [`--${boundary}`, `Content-Type: ${type}; charset=utf-8`, 'Content-Transfer-Encoding: base64', '', wrap(body)].join('\r\n');
  return `${headers.join('\r\n')}\r\n\r\n${part('text/plain', text)}\r\n${part('text/html', html)}\r\n--${boundary}--\r\n`;
}

/** Minimal SMTP conversation over an already connected, encrypted stream. */
async function converse(socket, { user, pass, from, to, message, heloName = 'walidrahman.com' }) {
  let buffer = '';
  let waiting = null;
  let failure = null;
  const flush = () => {
    if (!waiting) return;
    const lines = buffer.split('\r\n');
    // A reply is complete once a line has the form "250 text" (code + space).
    const last = lines.findIndex((line) => /^\d{3} /.test(line));
    if (last === -1) return;
    const reply = lines.slice(0, last + 1);
    buffer = lines.slice(last + 1).join('\r\n');
    const resolve = waiting;
    waiting = null;
    resolve({ code: Number(reply[last].slice(0, 3)), text: reply.join('\n') });
  };
  socket.on('data', (chunk) => { buffer += chunk.toString('utf8'); flush(); });
  const fail = (error) => {
    failure = error;
    if (waiting) { const resolve = waiting; waiting = null; resolve({ code: 0, text: error.message }); }
  };
  socket.on('error', fail);
  socket.on('timeout', () => fail(new Error('SMTP connection timed out')));
  socket.on('close', () => fail(new Error('SMTP connection closed')));

  const read = () => (failure ? Promise.resolve({ code: 0, text: failure.message }) : new Promise((resolve) => { waiting = resolve; flush(); }));
  const expect = async (codes, label) => {
    const reply = await read();
    if (!codes.includes(reply.code)) throw new Error(`SMTP ${label} failed (${reply.code || 'no reply'}): ${reply.text.slice(0, 160)}`);
    return reply;
  };
  const send = (line) => socket.write(`${line}\r\n`);

  await expect([220], 'greeting');
  send(`EHLO ${heloName}`);
  await expect([250], 'EHLO');
  send(`AUTH PLAIN ${b64(`\0${user}\0${pass}`)}`);
  await expect([235], 'login');
  send(`MAIL FROM:<${from}>`);
  await expect([250], 'MAIL FROM');
  send(`RCPT TO:<${to}>`);
  await expect([250, 251], 'RCPT TO');
  send('DATA');
  await expect([354], 'DATA');
  // Dot-stuffing: a line that starts with "." must be doubled.
  socket.write(`${message.replace(/^\./gm, '..')}\r\n.\r\n`);
  await expect([250], 'message');
  send('QUIT');
}

/**
 * Sends one e-mail. Never throws: returns { ok: true } or { ok: false, reason }.
 * `connect` can be replaced in tests.
 */
export async function sendMail({ to, subject, text, html }, { env = process.env, connect = tls.connect, timeoutMs = 15000 } = {}) {
  const user = clean(env.SMTP_USER);
  const pass = clean(env.SMTP_PASS).replace(/\s+/g, '');
  if (!user || !pass) return { ok: false, reason: 'E-mail sending is not set up yet (SMTP_USER / SMTP_PASS).' };
  const recipient = clean(to);
  if (!/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(recipient)) return { ok: false, reason: 'Invalid recipient address.' };
  const fromHeader = clean(env.MAIL_FROM) || DEFAULT_FROM;
  const sender = parseAddress(fromHeader);
  const message = buildMessage({ from: fromHeader, to: recipient, subject, text, html });
  const host = clean(env.SMTP_HOST) || 'smtp.gmail.com';
  const port = Number(env.SMTP_PORT) || 465;

  let socket;
  try {
    socket = connect({ host, port, servername: host });
    socket.setTimeout?.(timeoutMs);
    await converse(socket, { user, pass, from: sender.address, to: recipient, message });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: String(error?.message || error).slice(0, 300) };
  } finally {
    try { socket?.end?.(); socket?.destroy?.(); } catch { /* already closed */ }
  }
}
