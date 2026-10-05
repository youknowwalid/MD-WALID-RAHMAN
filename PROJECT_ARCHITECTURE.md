# Project Architecture: Walid Rahman Portfolio

Dark, premium, single-page portfolio (Poppins, accent `#f45901`). **The look and feel is fixed — see `AGENTS.md`.**

## Principles
- **Deterministic rendering**: the UI renders from explicit fields; no keyword/regex logic on content.
- **Schema first**: change `supabase/migrations/*.sql` (add a *new* migration file), `src/types.ts`,
  `src/lib/schema-defaults.ts`, `src/lib/rows.ts` and the form definition in `src/components/admin/forms.ts` together.
- **Graceful fallbacks**: the site must render with no database (`backendConfigured === false`) or when it is unreachable.
- **No invented content**: defaults are limited to text that already existed on the site; empty sections are hidden or show a neutral note.
- **Minimal change**: prefer the smallest diff.

## Data flow
1. `src/lib/api.ts` — visitors read via the Supabase REST API with the public key (small, no SDK).
2. `src/lib/rows.ts` — maps database `snake_case` rows ⇄ app `camelCase` objects and whitelists writable columns.
3. `src/lib/schema-defaults.ts` — normalizers fill missing fields with neutral values.
4. `src/context/SiteConfigContext.tsx` — loads `site_settings` (`global`, `hero`, `seo`), merged over `src/lib/defaults.ts`, cached in localStorage for instant first paint.
   A first-time visitor has no cache, so the page is held back (dark background only, max 2.5 s) until the real settings arrive — it never paints the built-in defaults and then swaps them.
   The request itself is started from `index.html` by the `early-settings` plugin in `vite.config.ts` (`window.__settings`), before the JavaScript bundle has downloaded; the home-page lists are also requested at script load (`Home.tsx`).
   Built-in services/experience are shown only when no database is connected or reachable.
5. `src/lib/admin.ts` — the only file that uses `@supabase/supabase-js` (sign-in, saving, uploads); loaded only on `/admin`.

## Performance rules
- Fonts are self-hosted (`@fontsource/poppins`, weights 400–900) with a metric-matched fallback; no third-party font requests.
- Animations use `<m.*>` inside `<LazyMotion>` (see `App.tsx`); do not import the full `motion` component (`strict` mode throws).
- List queries on the home page ask only for the columns the cards show (`listRows(collection, columns)`).
- Google Tag Manager starts after the page has loaded and the browser is idle.
- Reserve space for anything that appears later (no layout shift); `tests/e2e` checks the hero heading does not change size while typing.

## Security model (enforced in the database, not in the browser)
- Row Level Security on every table; public can only `select` (products: published only).
- Writes need a signed-in user whose **confirmed** e-mail is in `admin_emails` (`public.is_admin()`).
- Sign-ups are closed for any other e-mail (trigger on `auth.users`).
- Contact form: anyone may insert; length/format checks, honeypot + timer in the form, and a per-visitor rate limit trigger.
- Storage bucket `site-media`: public read; admin-only write; 5 MB limit; images + PDF only (no SVG).
- Headers (CSP, HSTS, frame-ancestors none…) in `vercel.json`. If a Supabase custom domain is ever used, add it to `connect-src`.

## SEO
Static tags + JSON-LD in `index.html`; `src/components/Seo.tsx` sets per-page title/description/canonical/Open Graph/structured data;
`/sitemap.xml` is generated live from the database (`api/sitemap.js`); `robots.txt` blocks `/admin`.

## Workflow
1. `npm run check` and `npm run test:e2e` must pass.
2. Verify create/edit/delete in the admin for the section you touched, on desktop and mobile.
3. Open a PR; Vercel builds a preview automatically.
