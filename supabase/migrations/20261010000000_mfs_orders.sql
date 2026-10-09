-- Orders paid by bKash / Nagad "send money", plus the payment SMS messages that the owner's
-- phone forwards to the website. Both tables are PRIVATE: visitors can neither read nor write
-- them. The website's server (service role, in /api) writes them; only the admin can read them
-- in the Orders tab. Safe to run more than once.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  edition text not null check (edition in ('english', 'bangla')),
  email text not null check (char_length(email) between 3 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  wallet text not null check (wallet in ('bkash', 'nagad', 'rocket')),
  trx_id text not null check (trx_id ~ '^[A-Z0-9]{6,20}$'),
  sender text not null check (sender ~ '^01[3-9][0-9]{8}$'),
  amount_due integer not null check (amount_due > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  paid_how text check (paid_how in ('auto', 'manual')),
  access_token text not null check (char_length(access_token) >= 32),
  payment_sms_id uuid,
  ip_hash text not null default '',
  emailed_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.payment_sms (
  id uuid primary key default gen_random_uuid(),
  wallet text not null default 'unknown' check (wallet in ('bkash', 'nagad', 'rocket', 'unknown')),
  trx_id text,
  amount numeric(12, 2),
  sender text,
  raw text not null check (char_length(raw) <= 1000),
  claimed_by uuid references public.orders (id) on delete set null,
  received_at timestamptz not null default now()
);

do $$ begin
  alter table public.orders add constraint orders_payment_sms_fk
    foreign key (payment_sms_id) references public.payment_sms (id) on delete set null;
exception when duplicate_object then null;
end $$;

-- One live order per transaction id (a rejected order frees the id again), and each SMS is stored once.
create unique index if not exists orders_open_trx_idx on public.orders (trx_id) where status <> 'rejected';
create unique index if not exists payment_sms_trx_idx on public.payment_sms (trx_id) where trx_id is not null;
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_ip_idx on public.orders (ip_hash, created_at desc);

alter table public.orders enable row level security;
alter table public.payment_sms enable row level security;
revoke all on public.orders, public.payment_sms from anon, authenticated;
grant select on public.orders, public.payment_sms to authenticated;

drop policy if exists "Admin can read orders" on public.orders;
create policy "Admin can read orders" on public.orders for select to authenticated
  using ((select public.is_admin()));
drop policy if exists "Admin can read payment sms" on public.payment_sms;
create policy "Admin can read payment sms" on public.payment_sms for select to authenticated
  using ((select public.is_admin()));
