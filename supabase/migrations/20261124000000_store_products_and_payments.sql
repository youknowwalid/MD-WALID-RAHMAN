-- What the shop sells now lives in the database (edited in the admin: "Store setup"), not in the code.
--   store_products   one row per product: its code, name, price and the PRIVATE file it unlocks.
--                    Visitors cannot read it (the file path must stay private); only the admin can,
--                    and the website's server (service role) reads it to price orders and hand out files.
--   site_settings    gets one more group, "payments" (wallet numbers and support e-mail), which is public by nature.
--   orders.edition   may now be any product code, not just the two that used to be built in.
-- Safe to run more than once. It contains no business data: add the products in the admin.

create table if not exists public.store_products (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  name text not null check (char_length(name) between 1 and 200),
  price_bdt integer not null check (price_bdt > 0 and price_bdt < 10000000),
  file_path text not null check (char_length(file_path) between 1 and 300 and position('..' in file_path) = 0),
  download_name text not null default '' check (char_length(download_name) <= 200),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.store_products enable row level security;
revoke all on public.store_products from anon, authenticated;
grant select, insert, update, delete on public.store_products to authenticated;

drop policy if exists "Admin can read products" on public.store_products;
create policy "Admin can read products" on public.store_products for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin can add products" on public.store_products;
create policy "Admin can add products" on public.store_products for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Admin can edit products" on public.store_products;
create policy "Admin can edit products" on public.store_products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admin can delete products" on public.store_products;
create policy "Admin can delete products" on public.store_products for delete to authenticated using ((select public.is_admin()));

drop trigger if exists touch_updated_at on public.store_products;
create trigger touch_updated_at before update on public.store_products
  for each row execute function public.touch_updated_at();

alter table public.orders drop constraint if exists orders_edition_check;
alter table public.orders add constraint orders_edition_check check (edition ~ '^[a-z0-9][a-z0-9-]{0,39}$');

alter table public.site_settings drop constraint if exists site_settings_key_check;
alter table public.site_settings
  add constraint site_settings_key_check check (key in ('global', 'hero', 'seo', 'discovery', 'payments'));
