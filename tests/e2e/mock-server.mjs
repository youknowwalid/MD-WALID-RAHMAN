// A tiny in-memory imitation of the Supabase endpoints the site uses (REST, auth, storage),
// so the whole site and admin panel can be tested in a real browser without a real database.
import http from 'node:http';

const PORT = 54321;
const ADMIN = { email: 'admin@test.local', password: 'correct-horse-battery' };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'u-1', role: 'authenticated', email: ADMIN.email, exp: 4102444800 })}.sig`;
const USER = { id: 'u-1', aud: 'authenticated', role: 'authenticated', email: ADMIN.email, email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };

let seq = 1;
const now = () => new Date().toISOString();
const row = (o) => ({ id: `00000000-0000-4000-8000-${String(seq++).padStart(12, '0')}`, sort_order: 0, created_at: now(), updated_at: now(), ...o });

const initial = () => ({
  projects: [row({ slug: 'brand-one', title: 'Brand One', category: 'Branding', image: 'http://127.0.0.1:54321/storage/v1/object/public/site-media/images/a.png', content: 'First paragraph of the case study.\n\nSecond paragraph.', tags: ['Logo'], gallery: [], link: '', hero_image: '', client: 'Acme', designer: '', start_date: '', intro_title: '', details_title: '', details_content: '', social_title: '', social_description: '', social_image: '', summary: 'A short intro line for Brand One.', industry: 'Retail', services: 'Branding, Logo design', feedback_quote: 'Walid delivered beyond our expectations.', feedback_name: 'Jane Doe', feedback_role: 'CEO, Acme', cta_title: '', cta_button_text: '', cta_button_url: '', published: true })],
  blog_posts: [row({ slug: 'hello-world', title: 'Hello World', date: 'May 1, 2026', excerpt: 'A first post.', image: '', content: '### A heading\n\nBody text here.\n\n- one\n- two', author: 'Walid Rahman', tags: ['Intro'], social_title: '', social_description: '', social_image: '' })],
  services: [row({ display_id: '01', title: 'Brand Identity', description: 'Identity work.', icon_name: 'Palette' })],
  resume_items: [row({ year: '2024 - Present', role: 'Executive Director', company: 'De Jure Academy', description: '' })],
  skills: [row({ name: 'Canva', level: 98 })],
  testimonials: [],
  pricing_plans: [],
  products: [],
  contact_submissions: [],
  site_settings: [],
});
let db = initial();
const buckets = new Map();
const hits = new Map();

const send = (res, status, body, extra = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...extra });
  res.end(body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => resolve(Buffer.concat(c))); });
const isAdmin = (req) => (req.headers.authorization || '') === `Bearer ${TOKEN}`;

function filterRows(rows, params) {
  let out = [...rows];
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'on_conflict', 'columns'].includes(k)) continue;
    const m = /^eq\.(.*)$/.exec(v);
    if (m) out = out.filter((r) => String(r[k]) === m[1]);
  }
  const order = params.get('order');
  if (order) {
    for (const part of order.split(',').reverse()) {
      const [col, dir] = part.split('.');
      out.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
    }
  }
  const limit = params.get('limit');
  return limit ? out.slice(0, Number(limit)) : out;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const cors = {
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Expose-Headers': 'Content-Range',
  };
  if (req.method === 'OPTIONS') return send(res, 204, undefined, cors);
  const reply = (s, b, h = {}) => send(res, s, b, { ...cors, ...h });
  const p = url.pathname;

  // test helpers
  if (p === '/__reset') { db = initial(); hits.clear(); buckets.clear(); return reply(200, { ok: true }); }
  if (p === '/__db') return reply(200, db);

  if (p === '/__audio.wav') { // 0.1s of silence: a file with sound but no picture
    const data = Buffer.alloc(1600), h = Buffer.alloc(44);
    h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
    h.writeUInt32LE(8000, 24); h.writeUInt32LE(16000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
    res.writeHead(200, { ...cors, 'Content-Type': 'audio/wav' });
    return res.end(Buffer.concat([h, data]));
  }

  if (p === '/__seed-settings') {
    const { key, value } = JSON.parse((await readBody(req)).toString());
    const existing = db.site_settings.find((r) => r.key === key);
    if (existing) existing.value = { ...existing.value, ...value }; else db.site_settings.push({ key, value, updated_at: now() });
    return reply(200, { ok: true });
  }

  // ── auth ──
  if (p === '/auth/v1/token') {
    const body = JSON.parse((await readBody(req)).toString() || '{}');
    if (url.searchParams.get('grant_type') === 'password' && body.email === ADMIN.email && body.password === ADMIN.password) {
      return reply(200, { access_token: TOKEN, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r', user: USER });
    }
    return reply(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
  }
  if (p === '/auth/v1/user') return isAdmin(req) ? reply(200, USER) : reply(401, { msg: 'no session' });
  if (p === '/auth/v1/logout') return reply(204, undefined);
  if (p === '/auth/v1/signup') return reply(400, { code: 400, msg: 'Sign-ups are closed.' });

  // ── storage ──
  if (p.startsWith('/storage/v1/object/public/')) {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    res.writeHead(200, { ...cors, 'Content-Type': 'image/png' });
    return res.end(png);
  }
  if (p.startsWith('/storage/v1/object/')) {
    if (!isAdmin(req)) return reply(403, { message: 'new row violates row-level security policy' });
    const body = await readBody(req);
    if (body.length > 5 * 1024 * 1024) return reply(413, { message: 'The object exceeded the maximum allowed size' });
    buckets.set(p, body.length);
    return reply(200, { Key: p.replace('/storage/v1/object/', '') });
  }

  // ── REST ──
  if (p === '/rest/v1/rpc/is_admin') return reply(200, isAdmin(req));
  const m = /^\/rest\/v1\/([a-z_]+)$/.exec(p);
  if (!m || !(m[1] in db)) return reply(404, { message: 'not found' });
  const table = m[1];
  const rows = db[table];

  if (req.method === 'GET') {
    if (table === 'contact_submissions' && !isAdmin(req)) return reply(200, []);
    let out = filterRows(rows, url.searchParams);
    if ((table === 'products' || table === 'projects') && !isAdmin(req)) out = out.filter((r) => r.published !== false);
    return reply(200, out);
  }

  const body = JSON.parse((await readBody(req)).toString() || 'null');
  const wantsRows = /return=representation/.test(req.headers.prefer || '');

  if (req.method === 'POST') {
    if (table === 'contact_submissions') {
      const who = req.headers['x-forwarded-for'] || 'same';
      hits.set(who, (hits.get(who) || 0) + 1);
      if (hits.get(who) > 5) return reply(400, { code: 'P0001', message: 'Too many messages sent. Please try again later.' });
      if (!body.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email || '') || !body.message) return reply(400, { code: '23514', message: 'violates check constraint' });
      rows.push(row({ is_read: false, subject: '', ...body }));
      return reply(201, undefined);
    }
    if (!isAdmin(req)) return reply(401, { code: '42501', message: 'new row violates row-level security policy' });
    const items = Array.isArray(body) ? body : [body];
    const saved = [];
    for (const item of items) {
      if (table === 'site_settings') {
        const existing = rows.find((r) => r.key === item.key);
        if (existing) { existing.value = item.value; existing.updated_at = now(); saved.push(existing); continue; }
        const r = { key: item.key, value: item.value, updated_at: now() };
        rows.push(r); saved.push(r); continue;
      }
      if (item.slug && rows.some((r) => r.slug === item.slug)) return reply(409, { code: '23505', message: 'duplicate key value violates unique constraint' });
      const r = row(item); rows.push(r); saved.push(r);
    }
    return wantsRows ? reply(201, saved) : reply(201, undefined);
  }

  if (!isAdmin(req)) return reply(wantsRows ? 200 : 204, wantsRows ? [] : undefined);

  if (req.method === 'PATCH') {
    const targets = filterRows(rows, url.searchParams);
    for (const t of targets) Object.assign(t, body, { updated_at: now() });
    return wantsRows ? reply(200, targets) : reply(204, undefined);
  }
  if (req.method === 'DELETE') {
    const targets = filterRows(rows, url.searchParams);
    db[table] = rows.filter((r) => !targets.includes(r));
    return wantsRows ? reply(200, targets) : reply(204, undefined);
  }
  return reply(405, { message: 'method not allowed' });
}).listen(PORT, '127.0.0.1', () => console.log(`mock supabase on :${PORT}`));
