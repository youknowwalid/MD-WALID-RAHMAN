// Runs the real migration on an in-memory Postgres (PGlite) with a minimal
// imitation of Supabase's auth/storage plumbing, then tries to break the rules.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const ADMIN_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ID = '22222222-2222-2222-2222-222222222222';
const UNCONFIRMED_ID = '33333333-3333-3333-3333-333333333333';

let db: PGlite;

async function as(role: 'anon' | 'authenticated', claims: Record<string, unknown> | null, fn: () => Promise<void>) {
  await db.exec(`set role ${role}`);
  await db.exec(`select set_config('request.jwt.claims', '${JSON.stringify(claims ?? {})}', false)`);
  try {
    await fn();
  } finally {
    await db.exec('reset role');
  }
}
const adminClaims = { sub: ADMIN_ID, role: 'authenticated', email: 'walidxdxdxd@gmail.com' };

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    grant usage on schema auth, storage to anon, authenticated;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid $$;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated;
  `);
  await db.exec(readFileSync('supabase/migrations/20261004000000_initial_schema.sql', 'utf8'));
  // A project that exists before the case-study upgrade must survive it as published.
  await db.exec(`insert into public.projects (title, slug) values ('Legacy', 'legacy')`);
  await db.exec(readFileSync('supabase/migrations/20261005000000_project_case_study.sql', 'utf8'));
  await db.exec(`
    grant usage on schema public to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public to anon, authenticated;
    alter table auth.users disable trigger restrict_signups;
    insert into auth.users values
      ('${ADMIN_ID}', 'WalidXdXdXd@gmail.com', now()),
      ('${OTHER_ID}', 'stranger@example.com', now()),
      ('${UNCONFIRMED_ID}', 'walidxdxdxd@gmail.com', null);
    alter table auth.users enable trigger restrict_signups;
  `);
});

describe('public visitors', () => {
  it('can read content', async () => {
    await as('anon', null, async () => {
      const r = await db.query('select count(*)::int as n from public.services');
      expect((r.rows[0] as any).n).toBe(6);
    });
  });

  it('cannot write content', async () => {
    await as('anon', null, async () => {
      await expect(db.query(`insert into public.projects (title) values ('hack')`)).rejects.toThrow();
      const upd = await db.query(`update public.services set title = 'x' returning id`);
      expect(upd.rows.length).toBe(0);
      const del = await db.query(`delete from public.services returning id`);
      expect(del.rows.length).toBe(0);
    });
  });

  it('cannot read contact messages, the admin list, or unpublished products', async () => {
    await db.exec(`insert into public.products (title, published) values ('Draft', false), ('Live', true)`);
    await as('anon', null, async () => {
      await db.query(`insert into public.contact_submissions (name, email, message) values ('A','a@b.co','hi')`);
      expect((await db.query('select * from public.contact_submissions')).rows.length).toBe(0);
      expect((await db.query('select * from public.admin_emails')).rows.length).toBe(0);
      const p = await db.query('select title from public.products');
      expect(p.rows).toEqual([{ title: 'Live' }]);
    });
  });
});

describe('project drafts and case-study fields', () => {
  it('keeps existing projects published and defaults new ones to published', async () => {
    const legacy = await db.query(`select published from public.projects where slug = 'legacy'`);
    expect(legacy.rows).toEqual([{ published: true }]);
    await db.exec(`insert into public.projects (title, slug) values ('Fresh', 'fresh')`);
    const fresh = await db.query(`select published, summary, feedback_quote, cta_button_url from public.projects where slug = 'fresh'`);
    expect(fresh.rows).toEqual([{ published: true, summary: '', feedback_quote: '', cta_button_url: '' }]);
  });

  it('shows visitors only published projects, and the admin everything', async () => {
    await db.exec(`insert into public.projects (title, slug, published) values ('Hidden draft', 'hidden-draft', false)`);
    await as('anon', null, async () => {
      const slugs = (await db.query('select slug from public.projects')).rows.map((r: any) => r.slug);
      expect(slugs).toContain('legacy');
      expect(slugs).not.toContain('hidden-draft');
      expect((await db.query(`select 1 from public.projects where slug = 'hidden-draft'`)).rows.length).toBe(0);
    });
    await as('authenticated', adminClaims, async () => {
      const slugs = (await db.query('select slug from public.projects')).rows.map((r: any) => r.slug);
      expect(slugs).toContain('hidden-draft');
    });
    await as('authenticated', { sub: OTHER_ID, role: 'authenticated', email: 'stranger@example.com' }, async () => {
      const slugs = (await db.query('select slug from public.projects')).rows.map((r: any) => r.slug);
      expect(slugs).not.toContain('hidden-draft');
    });
    await db.exec(`delete from public.projects where slug in ('hidden-draft', 'fresh')`);
  });

  it('rejects oversized values', async () => {
    const limits: Record<string, number> = {
      summary: 500, industry: 200, services: 300, feedback_quote: 2000, feedback_name: 200,
      feedback_role: 200, cta_title: 200, cta_button_text: 50, cta_button_url: 2000,
    };
    for (const [col, max] of Object.entries(limits)) {
      await expect(db.query(`insert into public.projects (title, ${col}) values ('x', '${'a'.repeat(max + 1)}')`)).rejects.toThrow();
      await db.query(`insert into public.projects (title, ${col}) values ('limit-ok', '${'a'.repeat(max)}')`);
    }
    await db.exec(`delete from public.projects where title = 'limit-ok'`);
  });
});

describe('contact form', () => {
  it('rejects bad input', async () => {
    await as('anon', null, async () => {
      await expect(db.query(`insert into public.contact_submissions (name, email, message) values ('A','not-an-email','hi')`)).rejects.toThrow();
      await expect(db.query(`insert into public.contact_submissions (name, email, message) values ('','a@b.co','hi')`)).rejects.toThrow();
      await expect(db.query(`insert into public.contact_submissions (name, email, message) values ('A','a@b.co','${'x'.repeat(5001)}')`)).rejects.toThrow();
    });
  });

  it('blocks floods from one visitor (5 per hour) and ignores a forged is_read', async () => {
    await db.exec(`delete from public.contact_submissions`);
    await as('anon', null, async () => {
      await db.exec(`select set_config('request.headers', '{"x-forwarded-for":"203.0.113.9, 10.0.0.1"}', false)`);
      for (let i = 0; i < 5; i++) {
        await db.query(`insert into public.contact_submissions (name, email, message, is_read) values ('A','a@b.co','m${i}', true)`);
      }
      await expect(db.query(`insert into public.contact_submissions (name, email, message) values ('A','a@b.co','sixth')`)).rejects.toThrow(/Too many/);
      // a different visitor is unaffected
      await db.exec(`select set_config('request.headers', '{"x-forwarded-for":"198.51.100.7"}', false)`);
      await db.query(`insert into public.contact_submissions (name, email, message) values ('B','b@b.co','ok')`);
    });
    await as('authenticated', adminClaims, async () => {
      const r = await db.query('select is_read, sender_hash from public.contact_submissions');
      expect(r.rows.length).toBe(6);
      expect(r.rows.every((x: any) => x.is_read === false)).toBe(true);
      expect(r.rows.some((x: any) => x.sender_hash.includes('203.0.113.9'))).toBe(false);
    });
  });
});

describe('admin rules', () => {
  it('allows the confirmed admin to manage content and read messages', async () => {
    await as('authenticated', adminClaims, async () => {
      const ins = await db.query(`insert into public.projects (title, slug) values ('Mine','mine') returning id`);
      expect(ins.rows.length).toBe(1);
      await db.query(`update public.projects set category = 'Branding' where slug = 'mine'`);
      expect((await db.query('select count(*)::int n from public.contact_submissions')).rows[0]).toEqual({ n: 6 });
      await db.query(`insert into public.site_settings (key, value) values ('hero', '{"heroStatus":"hi"}')`);
      await db.query(`insert into storage.objects (bucket_id, name) values ('site-media', 'a.png')`);
      expect((await db.query(`delete from public.projects where slug = 'mine' returning id`)).rows.length).toBe(1);
    });
  });

  it('refuses a signed-in stranger', async () => {
    await as('authenticated', { sub: OTHER_ID, role: 'authenticated', email: 'stranger@example.com' }, async () => {
      await expect(db.query(`insert into public.projects (title) values ('nope')`)).rejects.toThrow();
      await expect(db.query(`insert into storage.objects (bucket_id, name) values ('site-media', 'x.png')`)).rejects.toThrow();
      expect((await db.query('select * from public.contact_submissions')).rows.length).toBe(0);
    });
  });

  it('refuses an allow-listed e-mail that has not been confirmed', async () => {
    await as('authenticated', { sub: UNCONFIRMED_ID, role: 'authenticated', email: 'walidxdxdxd@gmail.com' }, async () => {
      await expect(db.query(`insert into public.projects (title) values ('nope')`)).rejects.toThrow();
    });
  });

  it('cannot be tricked by forging the e-mail inside the token', async () => {
    await as('authenticated', { sub: OTHER_ID, role: 'authenticated', email: 'walidxdxdxd@gmail.com' }, async () => {
      await expect(db.query(`insert into public.projects (title) values ('nope')`)).rejects.toThrow();
    });
  });

  it('closes public sign-ups', async () => {
    await expect(db.query(`insert into auth.users values (gen_random_uuid(), 'attacker@example.com', now())`)).rejects.toThrow(/closed/);
    await db.query(`insert into auth.users values (gen_random_uuid(), 'WALIDXDXDXD@gmail.com', null)`);
  });

  it('enforces data limits', async () => {
    await as('authenticated', adminClaims, async () => {
      await expect(db.query(`insert into public.skills (name, level) values ('x', 101)`)).rejects.toThrow();
      await expect(db.query(`insert into public.site_settings (key, value) values ('other', '{}')`)).rejects.toThrow();
    });
  });
});

it('limits uploads to 5 MB images and PDFs in a public bucket', async () => {
  const r = await db.query('select public, file_size_limit, allowed_mime_types from storage.buckets where id = $1', ['site-media']);
  const b = r.rows[0] as any;
  expect(b.public).toBe(true);
  expect(Number(b.file_size_limit)).toBe(5242880);
  expect(b.allowed_mime_types).not.toContain('image/svg+xml');
});
