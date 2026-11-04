-- Run once in Supabase → SQL Editor. Stores card game orders and pre-orders.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  stripe_session_id text unique not null,
  order_type text,
  status text,
  email text,
  name text,
  items jsonb,
  decks int,
  amount_total int,
  currency text,
  shipping_address jsonb,
  shipped_at timestamptz,
  tracking text
);
create index if not exists idx_orders_status on orders(status, created_at);
alter table orders enable row level security;
