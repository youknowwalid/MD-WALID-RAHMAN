# Project Architecture: Walid Rahman Portfolio

Single-page portfolio for Walid Rahman. The design is open to change; nothing here freezes it.

- **Home page** (`src/components/Home.tsx`): light, sky-and-lime, set in Inter Tight. Its look lives
  behind the `.home-v2` class in `src/index.css`, which re-declares the site's colour variables for that
  page only, so the shared header and footer follow it without a change of their own.
- **Every other page** (project, blog, resources, checkout, policies, admin): dark, Poppins, with the
  brand accent the admin chooses.

## Principles
- **Deterministic rendering**: the UI renders from explicit fields; no keyword/regex logic on content.
- **Schema first**: change `supabase/migrations/*.sql` (add a *new* migration file), `src/types.ts`,
  `src/lib/schema-defaults.ts`, `src/lib/rows.ts` and the form definition in `src/components/admin/forms.ts` together.
- **Graceful fallbacks**: the site must render with no database (`backendConfigured === false`) or when it is unreachable.
- **No invented content**: defaults are limited to text that already existed on the site; empty sections are hidden or show a neutral note.
- **One source of truth for site text**: brand name, tagline, numbers, contact e-mail, web address and SEO text are
  edited in the admin and stored in `site_settings`. Code must read them (`useSiteConfig()` in the app, `api/_site.js`
  on the server); never retype them in a component, a test or a server file. The only built-in copy is
  `src/lib/defaults.ts` plus `src/lib/seo-defaults.json`, which the app and `api/_head.js` both import. Tests import
  these defaults too, and a unit test checks `index.html`'s static head against them.
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
- Fonts are self-hosted (`@fontsource/poppins` 400–900; Inter Tight 400/500/600/700 in `src/fonts`, latin
  subset) with metric-matched fallbacks. No third-party font requests: `vercel.json` allows styles and fonts
  only from this site, so a Google Fonts link would be refused by the browser.
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

## SEO, AI search and link previews
**Every public address is rendered by one function, `api/render.js`** (catch-all rewrite in `vercel.json`). It takes the built app shell and
writes the page's own head tags, one linked JSON-LD graph (`api/_graph.js`) and a plain-HTML copy of the page into it, all from saved content:
`site_settings` (global, seo, discovery), the page itself, its row in `page_discovery_meta` (SEO / AEO / GEO fields) and its `author_profiles` row.
Data that has no saved source is left out, never invented. The same function applies the admin's redirects (`url_redirects`: 301 / 302 / 410, loops
and chains are blocked by a database trigger), answers a real 404 for addresses that do not exist, and marks private pages (`/admin`, `/thank-you`,
`/checkout/*`) noindex. If the database is unreachable it serves the plain shell, so the site always loads.
- **Why the shell is renamed**: Vercel serves a real file before it looks at rewrites. On Vercel only (`VERCEL=1`), `appShell()` in `vite.config.ts`
  renames `dist/index.html` to `dist/app-shell.html` so even `/` reaches the function. Local preview and the e2e tests are unchanged.
- **Who owns the head**: for the home page, projects, articles and any page whose tags the admin wrote, the function marks the page `data-ssr-path`
  and `src/components/Seo.tsx` leaves those tags alone. For other fixed pages (articles list, resources, policies) the app still sets its own titles.
- `api/_head.js` builds the head (`buildPageHtml`; `pickPage` chooses the fields like `ProjectDetail.tsx` / `BlogDetail.tsx`; same SEO settings rules as
  `SiteConfigContext.tsx`). `/sitemap.xml`, `/robots.txt`, `/llms.txt` and `/llms-full.txt` are generated live from the database and the saved settings
  (`api/sitemap.js`, `api/robots.js`, `api/llms.js`). Pages switched off for search in `page_discovery_meta` are left out of the sitemap and llms files.
  Results are cached at the edge for 5 minutes, so admin edits show within that time.
- `index.html` still carries a fallback head and hidden text for local development and for the no-database case; the renderer replaces them on every page.
After changing a page's share image, ask Facebook to re-read it at developers.facebook.com/tools/debug (it keeps its own copy of old previews).

## Workflow
1. `npm run check` and `npm run test:e2e` must pass.
2. Verify create/edit/delete in the admin for the section you touched, on desktop and mobile.
3. Open a PR; Vercel builds a preview automatically.
