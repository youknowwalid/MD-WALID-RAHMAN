import { describe, expect, it, vi } from 'vitest';
import { getPaidItems, deliverable, signedDownloadUrl } from '../../api/_paddle.js';
import { CATALOG } from '../../api/_catalog.js';

const TXN = 'txn_01hv8wptq8987qeady4xvk1hy3';
const ENGLISH = 'pri_01m4fppbkfzqnbdk9sggyy03kk';
const BANGLA = 'pri_01m4fprynt2xpb82ef5zmpzfbd';

const paddleReturns = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('getPaidItems', () => {
  it('rejects malformed transaction ids without calling Paddle', async () => {
    const fetchImpl = vi.fn();
    expect(await getPaidItems('../../etc/passwd', { apiKey: 'k', fetchImpl })).toEqual({ status: 'invalid' });
    expect(await getPaidItems('', { apiKey: 'k', fetchImpl })).toEqual({ status: 'invalid' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports when the API key is missing', async () => {
    expect(await getPaidItems(TXN, { apiKey: '', fetchImpl: vi.fn() })).toEqual({ status: 'unconfigured' });
  });

  it('returns the purchased price ids for a completed transaction', async () => {
    const fetchImpl = paddleReturns(200, { data: { status: 'completed', items: [{ price: { id: ENGLISH } }] } });
    const result = await getPaidItems(TXN, { apiKey: 'secret', fetchImpl });
    expect(result).toEqual({ status: 'paid', priceIds: [ENGLISH] });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(url).toBe(`https://api.paddle.com/transactions/${TXN}`);
    expect(init.headers.Authorization).toBe('Bearer secret');
  });

  it.each(['draft', 'ready', 'billed', 'canceled', 'past_due'])('does not treat "%s" as paid', async (status) => {
    const fetchImpl = paddleReturns(200, { data: { status, items: [{ price: { id: ENGLISH } }] } });
    expect(await getPaidItems(TXN, { apiKey: 'k', fetchImpl })).toEqual({ status: 'unpaid' });
  });

  it('maps Paddle errors', async () => {
    expect(await getPaidItems(TXN, { apiKey: 'k', fetchImpl: paddleReturns(404, {}) })).toEqual({ status: 'not_found' });
    expect(await getPaidItems(TXN, { apiKey: 'k', fetchImpl: paddleReturns(500, {}) })).toEqual({ status: 'error' });
    expect(await getPaidItems(TXN, { apiKey: 'k', fetchImpl: vi.fn(async () => { throw new Error('boom'); }) })).toEqual({ status: 'error' });
  });
});

describe('deliverable / catalog', () => {
  it('only delivers prices that exist in the catalog', () => {
    expect(deliverable([ENGLISH, 'pri_01zzzzzzzzzzzzzzzzzzzzzzzz', '__proto__'])).toEqual([ENGLISH]);
    expect(Object.keys(CATALOG)).toEqual([ENGLISH, BANGLA]);
  });
});

describe('signedDownloadUrl', () => {
  it('asks Supabase for a 60 second link to the private file', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    const fetchImpl = paddleReturns(200, { signedURL: '/object/sign/paid-downloads/Bangla.pdf?token=abc' });
    const url = await signedDownloadUrl(BANGLA, { fetchImpl });
    expect(url).toBe('https://example.supabase.co/storage/v1/object/sign/paid-downloads/Bangla.pdf?token=abc&download=Automate-Your-Facebook-Business-with-AI-Bangla.pdf');
    const [target, init] = fetchImpl.mock.calls[0] as unknown as [string, { body: string }];
    expect(target).toBe('https://example.supabase.co/storage/v1/object/sign/paid-downloads/Bangla.pdf');
    expect(JSON.parse(init.body)).toEqual({ expiresIn: 60 });
    vi.unstubAllEnvs();
  });

  it('returns null for unknown prices or storage failures', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    expect(await signedDownloadUrl('pri_unknown', { fetchImpl: vi.fn() })).toBeNull();
    expect(await signedDownloadUrl(ENGLISH, { fetchImpl: paddleReturns(400, {}) })).toBeNull();
    vi.unstubAllEnvs();
  });
});
