-- Case-study project page: extra content fields, and a "published" switch so a
-- project can be kept as a hidden draft.
-- Additive and safe on live data: every new column has a default, so existing
-- projects keep working and stay published.
-- Run this BEFORE deploying the matching site code (saving a project from the
-- admin writes these columns).

alter table public.projects
  add column summary         text not null default '' check (char_length(summary) <= 500),
  add column industry        text not null default '' check (char_length(industry) <= 200),
  add column services        text not null default '' check (char_length(services) <= 300),
  add column feedback_quote  text not null default '' check (char_length(feedback_quote) <= 2000),
  add column feedback_name   text not null default '' check (char_length(feedback_name) <= 200),
  add column feedback_role   text not null default '' check (char_length(feedback_role) <= 200),
  add column cta_title       text not null default '' check (char_length(cta_title) <= 200),
  add column cta_button_text text not null default '' check (char_length(cta_button_text) <= 50),
  add column cta_button_url  text not null default '' check (char_length(cta_button_url) <= 2000),
  add column published       boolean not null default true;

-- Visitors only see published projects; the admin sees everything (drafts included).
drop policy "Anyone can read" on public.projects;
create policy "Anyone can read published" on public.projects for select to anon, authenticated
  using (published or (select public.is_admin()));
