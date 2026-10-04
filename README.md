# walidrahman.com

Personal portfolio of Md. Walid Rahman — React + Vite + Tailwind, hosted on Vercel, with a Supabase backend
(content, contact-form inbox, admin panel, image storage).

## How it works

| Part | Where |
| --- | --- |
| Public site | `src/` (React). Deploys automatically on Vercel from `main`. |
| Admin panel | `/admin` — sign in with the administrator e-mail. Edit projects, blog, services, resume, skills, feedback, pricing, products, SEO, social links, contact details, colours. Read contact-form messages. |
| Database, security rules, storage | `supabase/migrations/20261004000000_initial_schema.sql` |
| Connection settings (public values only) | `public-config.json` — Supabase project URL + public `anon` key |
| Sitemap | `api/sitemap.js` → served at `/sitemap.xml` |
| Security headers, routing | `vercel.json` |

**Zero-configuration mode:** while `public-config.json` is empty the site still works: it shows its built-in
content, and the contact form opens the visitor's e-mail app. Fill in the two values and everything switches to the database.

## Connecting a Supabase project (one time)

1. Create a project on supabase.com (free plan is fine).
2. Open **SQL Editor**, paste the whole of `supabase/migrations/20261004000000_initial_schema.sql`
   (change the e-mail on the `insert into public.admin_emails` line first if needed) and press **Run**.
3. In **Project Settings → API** copy the **Project URL** and the **anon / publishable** key into `public-config.json`.
   (Never use the `service_role` key anywhere in this repository.)
4. In **Authentication → URL Configuration** set *Site URL* to `https://walidrahman.com`
   and add `https://walidrahman.com/admin` to *Redirect URLs*. Keep **Confirm email** switched on.
5. Visit `/admin` → *First time? Create the admin account* with the administrator e-mail, confirm the e-mail, sign in.

Only e-mail addresses listed in `public.admin_emails` can create an account or edit anything; everyone
else can only read public content and send contact-form messages (max 5 per hour per visitor).

## Development

```
npm install
npm run dev        # local site
npm run check      # type-check + unit/database tests + build
npm run test:e2e   # browser tests (desktop + mobile) against a built-in fake backend
```

Tests: `tests/unit` (helpers), `tests/db` (runs the real SQL on an in-memory Postgres and tries to break the security rules),
`tests/e2e` (Playwright: every page, the contact form, and the whole admin panel).
