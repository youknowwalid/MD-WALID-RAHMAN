-- Each résumé entry can carry its own picture for the career timeline on the home page.
-- Additive and safe to re-run: existing rows keep working and simply show the built-in demo picture.
alter table public.resume_items
  add column if not exists image text not null default '' check (char_length(image) <= 2000);
