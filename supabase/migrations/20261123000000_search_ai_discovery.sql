-- Search & AI Discovery: brand entity settings, author profiles, per-page SEO/AEO/GEO metadata,
-- and a redirect manager. Additive and safe to run more than once: nothing existing is dropped
-- or rewritten. Run this BEFORE deploying the matching site code.

-- ───────────────────────── Settings: allow the new "discovery" group ─────────────────────────
alter table public.site_settings drop constraint if exists site_settings_key_check;
alter table public.site_settings
  add constraint site_settings_key_check check (key in ('global', 'hero', 'seo', 'discovery'));

-- ───────────────────────── Authors (E-E-A-T profiles) ─────────────────────────
create table if not exists public.author_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  name text not null check (char_length(name) between 1 and 150),
  job_title text not null default '' check (char_length(job_title) <= 150),
  credentials text not null default '' check (char_length(credentials) <= 1000),
  short_bio text not null default '' check (char_length(short_bio) <= 500),
  avatar_url text not null default '' check (char_length(avatar_url) <= 2000),
  same_as text[] not null default '{}' check (cardinality(same_as) <= 20),
  knows_about text[] not null default '{}' check (cardinality(knows_about) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists author_profiles_slug_key on public.author_profiles (slug);

-- ───────────────────────── Per-page SEO / AEO / GEO metadata ─────────────────────────
-- route_key says what the row belongs to: a fixed page ("home", "articles", "resources"),
-- or an item ("blog:<id>", "project:<id>", "product:<id>", "service:<id>").
create table if not exists public.page_discovery_meta (
  id uuid primary key default gen_random_uuid(),
  route_key text not null check (route_key ~ '^[a-z0-9-]+(:[0-9a-fA-F-]{36})?$' and char_length(route_key) <= 80),
  -- SEO
  meta_title text not null default '' check (char_length(meta_title) <= 200),
  meta_description text not null default '' check (char_length(meta_description) <= 500),
  canonical_override text not null default '' check (char_length(canonical_override) <= 2000),
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  og_title text not null default '' check (char_length(og_title) <= 200),
  og_description text not null default '' check (char_length(og_description) <= 500),
  og_image_url text not null default '' check (char_length(og_image_url) <= 2000),
  twitter_card text not null default 'summary_large_image' check (twitter_card in ('summary_large_image', 'summary')),
  focus_keyword text not null default '' check (char_length(focus_keyword) <= 150),
  hreflang_alternates jsonb not null default '[]'::jsonb check (jsonb_typeof(hreflang_alternates) = 'array' and pg_column_size(hreflang_alternates) < 20000),
  -- AEO (answer engines)
  tldr_summary text not null default '' check (char_length(tldr_summary) <= 800),
  faq_items jsonb not null default '[]'::jsonb check (jsonb_typeof(faq_items) = 'array' and pg_column_size(faq_items) < 60000),
  howto_steps jsonb not null default '[]'::jsonb check (jsonb_typeof(howto_steps) = 'array' and pg_column_size(howto_steps) < 60000),
  -- GEO (AI citation and freshness)
  author_id uuid references public.author_profiles (id) on delete set null,
  quotable_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(quotable_facts) = 'array' and pg_column_size(quotable_facts) < 60000),
  last_reviewed_at timestamptz,
  -- Schema engine
  schema_type text not null default 'WebPage' check (schema_type in
    ('WebPage', 'Article', 'BlogPosting', 'Service', 'Product', 'CaseStudy', 'AboutPage', 'ContactPage')),
  custom_json_ld text not null default '' check (char_length(custom_json_ld) <= 30000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists page_discovery_meta_route_key on public.page_discovery_meta (route_key);

-- ───────────────────────── Redirect manager ─────────────────────────
create table if not exists public.url_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null check (
    source_path ~ '^/[^?#[:space:]]*$' and char_length(source_path) <= 500
    and source_path !~ '^/(api|admin)(/|$)'
  ),
  destination_path text not null default '' check (char_length(destination_path) <= 2000),
  status_code integer not null default 301 check (status_code in (301, 302, 410)),
  is_active boolean not null default true,
  hit_count bigint not null default 0 check (hit_count >= 0),
  last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists url_redirects_source_key on public.url_redirects (source_path);

-- Stops loops and flattens chains: A -> B plus B -> C is stored as A -> C.
create or replace function public.url_redirects_guard() returns trigger
language plpgsql set search_path = '' as $$
declare
  final text;
  nxt text;
  hops int := 0;
begin
  new.source_path := case when char_length(new.source_path) > 1 then regexp_replace(new.source_path, '/+$', '') else new.source_path end;
  if new.status_code = 410 then
    new.destination_path := '';
    return new;
  end if;
  if new.destination_path = '' then
    raise exception 'Choose where this address should send visitors.' using errcode = '23514';
  end if;
  if new.destination_path !~ '^(/|https?://)' then
    raise exception 'The destination must start with / or https://.' using errcode = '23514';
  end if;
  if new.source_path = new.destination_path then
    raise exception 'An address cannot redirect to itself.' using errcode = '23514';
  end if;
  final := new.destination_path;
  loop
    select r.destination_path into nxt
    from public.url_redirects r
    where r.source_path = final and r.is_active and r.status_code in (301, 302) and r.id is distinct from new.id
    limit 1;
    exit when nxt is null;
    hops := hops + 1;
    final := nxt;
    if final = new.source_path or hops > 10 then
      raise exception 'That redirect would create a loop.' using errcode = '23514';
    end if;
  end loop;
  new.destination_path := final;
  return new;
end;
$$;
drop trigger if exists url_redirects_guard on public.url_redirects;
create trigger url_redirects_guard before insert or update on public.url_redirects
  for each row execute function public.url_redirects_guard();

-- When a new redirect's source is already somebody's destination, point those at the final address too.
create or replace function public.url_redirects_flatten() returns trigger
language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() > 1 or not new.is_active or new.status_code = 410 then
    return null;
  end if;
  update public.url_redirects
     set destination_path = new.destination_path
   where destination_path = new.source_path and is_active and status_code in (301, 302) and id <> new.id;
  return null;
end;
$$;
drop trigger if exists url_redirects_flatten on public.url_redirects;
create trigger url_redirects_flatten after insert or update on public.url_redirects
  for each row execute function public.url_redirects_flatten();

-- Counts a visit to a redirect. Callable by anyone, and can only ever add 1 to an existing active row.
create or replace function public.record_redirect_hit(p_source text) returns void
language sql security definer set search_path = '' as $$
  update public.url_redirects
     set hit_count = hit_count + 1, last_hit_at = now()
   where source_path = p_source and is_active;
$$;
revoke all on function public.record_redirect_hit(text) from public;
grant execute on function public.record_redirect_hit(text) to anon, authenticated;

-- ───────────────────────── updated_at + security (same rules as the other content tables) ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['author_profiles', 'page_discovery_meta', 'url_redirects'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Anyone can read" on public.%I', t);
    execute format('create policy "Anyone can read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admin can add" on public.%I', t);
    execute format('create policy "Admin can add" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('drop policy if exists "Admin can edit" on public.%I', t);
    execute format('create policy "Admin can edit" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('drop policy if exists "Admin can delete" on public.%I', t);
    execute format('create policy "Admin can delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;
