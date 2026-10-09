import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { buildMessage, parseAddress, sendMail } from '../../api/_mail.js';
import smsWebhook from '../../api/sms-webhook.js';
import checkout from '../../api/checkout.js';

// A pretend Gmail server that follows the SMTP rules and records what it was told.
function fakeGmail({ acceptLogin = true } = {}) {
  const log: string[] = [];
  const socket: any = new EventEmitter();
  let inData = false;
  let buffer = '';
  const reply = (text: string) => setImmediate(() => socket.emit('data', Buffer.from(text)));
  socket.setTimeout = () => {};
  socket.destroy = () => {};
  socket.end = () => {};
  socket.write = (chunk: string) => {
    buffer += chunk;
    if (inData) {
      if (buffer.endsWith('\r\n.\r\n')) { log.push(`DATA:${buffer}`); buffer = ''; inData = false; reply('250 2.0.0 OK\r\n'); }
      return true;
    }
    while (buffer.includes('\r\n')) {
      const line = buffer.slice(0, buffer.indexOf('\r\n'));
      buffer = buffer.slice(buffer.indexOf('\r\n') + 2);
      log.push(line);
      if (line.startsWith('EHLO')) reply('250-smtp.gmail.com at your service\r\n250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n');
      else if (line.startsWith('AUTH PLAIN')) reply(acceptLogin ? '235 2.7.0 Accepted\r\n' : '535 5.7.8 Username and Password not accepted\r\n');
      else if (line.startsWith('MAIL FROM') || line.startsWith('RCPT TO')) reply('250 2.1.0 OK\r\n');
      else if (line === 'DATA') { inData = true; reply('354 Go ahead\r\n'); }
      else if (line === 'QUIT') reply('221 2.0.0 closing\r\n');
    }
    return true;
  };
  setImmediate(() => socket.emit('data', Buffer.from('220 smtp.gmail.com ESMTP ready\r\n')));
  return { socket, log };
}

const MAIL = { to: 'buyer@example.com', subject: 'Your download is ready', text: 'Hello ৳2,999', html: '<p>Hello ৳2,999</p>' };
const ENV = { SMTP_USER: 'walidxdxdxd@gmail.com', SMTP_PASS: 'abcd efgh ijkl mnop' };

describe('sendMail', () => {
  it('logs in to Gmail and sends from hello@walidrahman.com', async () => {
    const server = fakeGmail();
    const connect = vi.fn(() => server.socket);
    const result = await sendMail(MAIL, { env: ENV, connect });
    expect(result).toEqual({ ok: true });
    expect(connect).toHaveBeenCalledWith({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com' });
    const auth = server.log.find((l) => l.startsWith('AUTH PLAIN'))!;
    expect(Buffer.from(auth.slice(11), 'base64').toString()).toBe('\0walidxdxdxd@gmail.com\0abcdefghijklmnop'); // spaces in the app password are ignored
    expect(server.log).toContain('MAIL FROM:<hello@walidrahman.com>');
    expect(server.log).toContain('RCPT TO:<buyer@example.com>');
    const data = server.log.find((l) => l.startsWith('DATA:'))!;
    expect(data).toContain('From: Walid Rahman Swapnil <hello@walidrahman.com>');
    expect(data).toContain('To: buyer@example.com');
    expect(data).toContain(Buffer.from('Hello ৳2,999').toString('base64'));
    expect(server.log.at(-1)).toBe('QUIT');
  });

  it('reports a rejected login instead of throwing', async () => {
    const server = fakeGmail({ acceptLogin: false });
    const result = await sendMail(MAIL, { env: ENV, connect: () => server.socket });
    expect(result.ok).toBe(false);
    expect((result as any).reason).toContain('535');
  });

  it('says so when e-mail is not set up or the address is bad', async () => {
    expect((await sendMail(MAIL, { env: {}, connect: vi.fn() })).ok).toBe(false);
    expect((await sendMail({ ...MAIL, to: 'not-an-email' }, { env: ENV, connect: vi.fn() })).ok).toBe(false);
    const connect = vi.fn(() => { throw new Error('network down'); });
    expect(await sendMail(MAIL, { env: ENV, connect })).toEqual({ ok: false, reason: 'network down' });
  });

  it('cannot be tricked into adding headers', () => {
    const message = buildMessage({ from: 'Walid <hello@walidrahman.com>', to: 'a@b.co\r\nBcc: evil@x.co', subject: 'Hi\r\nBcc: evil@x.co', text: 't', html: 'h' });
    expect(message.split('\r\n').some((line) => line.startsWith('Bcc:'))).toBe(false);
    expect(parseAddress('Walid Rahman <hello@walidrahman.com>')).toEqual({ name: 'Walid Rahman', address: 'hello@walidrahman.com' });
  });
});

const response = () => {
  const res: any = { headers: {} as Record<string, string>, statusCode: 0, body: '' };
  res.setHeader = (k: string, v: string) => { res.headers[k] = v; };
  res.end = (b?: string) => { res.body = b ?? ''; };
  return res;
};
const call = async (handler: any, req: any) => {
  const res = response();
  await handler({ method: 'POST', headers: {}, url: '/x', ...req }, res);
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null };
};

describe('/api/sms-webhook', () => {
  const secretEnv = () => {
    vi.stubEnv('SMS_WEBHOOK_SECRET', 'right-secret');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
  };

  it('is switched off until a secret is configured', async () => {
    vi.stubEnv('SMS_WEBHOOK_SECRET', '');
    expect((await call(smsWebhook, { body: { from: 'bKash', text: 'x' } })).status).toBe(503);
    vi.unstubAllEnvs();
  });

  it('refuses a wrong or missing secret', async () => {
    secretEnv();
    expect((await call(smsWebhook, { body: { from: 'bKash', text: 'x' } })).status).toBe(401);
    expect((await call(smsWebhook, { headers: { 'x-webhook-secret': 'wrong' }, body: { from: 'bKash', text: 'x' } })).status).toBe(401);
    vi.unstubAllEnvs();
  });

  it('ignores messages that are not incoming wallet payments, without touching the database', async () => {
    secretEnv();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const otp = await call(smsWebhook, { headers: { 'x-webhook-secret': 'right-secret' }, body: { from: 'bKash', text: 'Your bKash verification code is 123456' } });
    expect(otp).toEqual({ status: 200, json: { ok: true, ignored: true } });
    const viaQuery = await call(smsWebhook, { query: { key: 'right-secret' }, body: JSON.stringify({ from: '01711111111', text: 'See you at 5' }) });
    expect(viaQuery.json).toEqual({ ok: true, ignored: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

describe('/api/checkout', () => {
  it('rejects bad submissions and bots before touching the database', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect((await call(checkout, { method: 'DELETE' })).status).toBe(405);
    expect((await call(checkout, { body: null })).status).toBe(400);
    expect((await call(checkout, { body: { website: 'http://spam.example' } })).status).toBe(400);
    expect((await call(checkout, { method: 'GET', query: { id: 'x', t: 'y' } })).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
