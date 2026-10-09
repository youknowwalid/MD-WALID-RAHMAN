-- Private bucket for the paid PDF files. There are deliberately NO storage policies on it:
-- only the server (service role, used by api/download.js once an order is confirmed as paid)
-- can read it. Safe to run more than once. (The bucket was already created in the dashboard.)
insert into storage.buckets (id, name, public)
values ('paid-downloads', 'paid-downloads', false)
on conflict (id) do nothing;
