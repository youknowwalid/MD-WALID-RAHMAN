-- walidrahman.com : complete backend setup (tables, security rules, file storage).
-- Safe to run once on a brand-new, dedicated Supabase project.
--
-- BEFORE YOU RUN IT: change the admin e-mail address below if needed.
-- Only the e-mail addresses listed in public.admin_emails can ever create an
-- account or edit the site. Everybody else can only read public content and
-- send contact-form messages.

-- ───────────────────────── Admin allow-list ─────────────────────────
create table public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security;
-- (no policies and no grants: nobody can read or change this list through the public API)
revoke all on public.admin_emails from anon, authenticated;

insert into public.admin_emails (email) values ('walidxdxdxd@gmail.com');

-- True only for a signed-in user whose CONFIRMED e-mail is on the allow-list.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
-- Visitors' policies (e.g. "published or admin") also call it, so anon needs execute too; it simply returns false for them.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Close public sign-ups: only allow-listed e-mails may create an account.
create function public.restrict_signups() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null
     or not exists (select 1 from public.admin_emails where email = lower(new.email)) then
    raise exception 'Sign-ups are closed.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger restrict_signups before insert on auth.users
  for each row execute function public.restrict_signups();

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

-- ───────────────────────── Content tables ─────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text,
  title text not null check (char_length(title) between 1 and 200),
  category text not null default '' check (char_length(category) <= 100),
  image text not null default '' check (char_length(image) <= 2000),
  link text not null default '' check (char_length(link) <= 2000),
  content text not null default '' check (char_length(content) <= 50000),
  tags text[] not null default '{}' check (cardinality(tags) <= 30),
  gallery text[] not null default '{}' check (cardinality(gallery) <= 30),
  hero_image text not null default '' check (char_length(hero_image) <= 2000),
  client text not null default '' check (char_length(client) <= 200),
  designer text not null default '' check (char_length(designer) <= 200),
  start_date text not null default '' check (char_length(start_date) <= 100),
  intro_title text not null default '' check (char_length(intro_title) <= 100),
  details_title text not null default '' check (char_length(details_title) <= 100),
  details_content text not null default '' check (char_length(details_content) <= 50000),
  social_title text not null default '' check (char_length(social_title) <= 200),
  social_description text not null default '' check (char_length(social_description) <= 500),
  social_image text not null default '' check (char_length(social_image) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index projects_slug_key on public.projects (slug) where slug is not null;

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text,
  title text not null check (char_length(title) between 1 and 200),
  date text not null default '' check (char_length(date) <= 50),
  excerpt text not null default '' check (char_length(excerpt) <= 1000),
  image text not null default '' check (char_length(image) <= 2000),
  content text not null default '' check (char_length(content) <= 100000),
  author text not null default '' check (char_length(author) <= 100),
  tags text[] not null default '{}' check (cardinality(tags) <= 30),
  social_title text not null default '' check (char_length(social_title) <= 200),
  social_description text not null default '' check (char_length(social_description) <= 500),
  social_image text not null default '' check (char_length(social_image) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index blog_posts_slug_key on public.blog_posts (slug) where slug is not null;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  display_id text not null default '' check (char_length(display_id) <= 10),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  icon_name text not null default 'Palette' check (char_length(icon_name) <= 50),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resume_items (
  id uuid primary key default gen_random_uuid(),
  year text not null default '' check (char_length(year) <= 50),
  role text not null check (char_length(role) between 1 and 200),
  company text not null default '' check (char_length(company) <= 200),
  description text not null default '' check (char_length(description) <= 3000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  level int not null default 80 check (level between 0 and 100),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  role text not null default '' check (char_length(role) <= 200),
  content text not null default '' check (char_length(content) <= 3000),
  avatar text not null default '' check (char_length(avatar) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  price text not null default '' check (char_length(price) <= 50),
  period text not null default '/month' check (char_length(period) <= 30),
  features text[] not null default '{}' check (cardinality(features) <= 50),
  unavailable_features text[] not null default '{}' check (cardinality(unavailable_features) <= 50),
  show_priority_box boolean not null default false,
  priority_title text not null default '' check (char_length(priority_title) <= 100),
  priority_subtitle text not null default '' check (char_length(priority_subtitle) <= 100),
  button_text text not null default 'Get Started' check (char_length(button_text) <= 50),
  button_url text not null default '' check (char_length(button_url) <= 2000),
  accent boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  short_title text not null default '' check (char_length(short_title) <= 100),
  description text not null default '' check (char_length(description) <= 5000),
  price text not null default '' check (char_length(price) <= 50),
  thumbnail text not null default '' check (char_length(thumbnail) <= 2000),
  image text not null default '' check (char_length(image) <= 2000),
  paddle_url text not null default '' check (char_length(paddle_url) <= 2000),
  gallery1 text not null default '' check (char_length(gallery1) <= 2000),
  gallery2 text not null default '' check (char_length(gallery2) <= 2000),
  gallery3 text not null default '' check (char_length(gallery3) <= 2000),
  gallery4 text not null default '' check (char_length(gallery4) <= 2000),
  featured boolean not null default true,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Site-wide settings (branding, hero, SEO), one row per group.
create table public.site_settings (
  key text primary key check (key in ('global', 'hero', 'seo')),
  value jsonb not null default '{}'::jsonb check (pg_column_size(value) < 200000),
  updated_at timestamptz not null default now()
);

-- Messages from the contact form.
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text not null default '' check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  is_read boolean not null default false,
  sender_hash text not null default '',
  created_at timestamptz not null default now()
);
create index contact_submissions_created_idx on public.contact_submissions (created_at desc);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['projects','blog_posts','services','resume_items','skills',
                           'testimonials','pricing_plans','products','site_settings'] loop
    execute format('create trigger touch_updated_at before update on public.%I
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Spam protection for the contact form: at most 5 messages per visitor per hour
-- and 100 per hour in total. (The visitor is identified by a one-way hash of the
-- connection address; the address itself is never stored.)
create function public.limit_contact_submissions() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  hdrs json;
  who text;
  recent_same int;
  recent_all int;
begin
  begin
    hdrs := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    hdrs := null;
  end;
  who := coalesce(
    nullif(trim(split_part(coalesce(hdrs ->> 'cf-connecting-ip', hdrs ->> 'x-forwarded-for', ''), ',', 1)), ''),
    'unknown');
  new.sender_hash := md5('walidrahman-salt:' || who);
  new.is_read := false;

  select count(*) into recent_same from public.contact_submissions
    where sender_hash = new.sender_hash and created_at > now() - interval '1 hour';
  if recent_same >= 5 then
    raise exception 'Too many messages sent. Please try again later.' using errcode = 'P0001';
  end if;

  select count(*) into recent_all from public.contact_submissions
    where created_at > now() - interval '1 hour';
  if recent_all >= 100 then
    raise exception 'The inbox is temporarily full. Please try again later.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger limit_contact_submissions before insert on public.contact_submissions
  for each row execute function public.limit_contact_submissions();

-- ───────────────────────── Row Level Security ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['projects','blog_posts','services','resume_items','skills',
                           'testimonials','pricing_plans','site_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Anyone can read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "Admin can add" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "Admin can edit" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "Admin can delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

-- Products: visitors only see published ones; the admin sees everything.
alter table public.products enable row level security;
create policy "Anyone can read published" on public.products for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "Admin can add" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "Admin can edit" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin can delete" on public.products for delete to authenticated using ((select public.is_admin()));

-- Contact messages: anyone may send one, only the admin can read or manage them.
alter table public.contact_submissions enable row level security;
create policy "Anyone can send a message" on public.contact_submissions for insert to anon, authenticated with check (true);
create policy "Admin can read" on public.contact_submissions for select to authenticated using ((select public.is_admin()));
create policy "Admin can mark read" on public.contact_submissions for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin can delete" on public.contact_submissions for delete to authenticated using ((select public.is_admin()));

-- ───────────────────────── File storage (images, CV) ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

create policy "Admin can upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (select public.is_admin()));
create policy "Admin can replace media" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()))
  with check (bucket_id = 'site-media' and (select public.is_admin()));
create policy "Admin can list media" on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()));
create policy "Admin can delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()));

-- ───────────────────────── Starter content ─────────────────────────
-- Only text that already existed on the site. Edit or delete it in the admin panel.
insert into public.services (display_id, title, description, icon_name, sort_order) values
  ('01', 'Brand Identity',    'Crafting unique visual identities that resonate with your target audience.', 'Palette',   1),
  ('02', 'Web Development',   'Building fast, responsive, and modern websites using the latest technologies.', 'Braces',    2),
  ('03', 'Digital Marketing', 'Strategic marketing campaigns to grow your brand and reach new customers.', 'Megaphone', 3),
  ('04', 'Product Strategy',  'Defining the roadmap and vision for your digital products.', 'Laptop',    4),
  ('05', 'UI/UX Design',      'Designing intuitive and beautiful user experiences.', 'Palette',   5),
  ('06', 'Content Creation',  'Engaging content that tells your brand''s story across all platforms.', 'Megaphone', 6);

insert into public.resume_items (year, role, company, description, sort_order) values
  ('2024 - Present', 'Executive Director', 'De Jure Academy', '', 1),
  ('2020 - 2022',    'Project Manager',    'JBL Bangladesh',  '', 2);
