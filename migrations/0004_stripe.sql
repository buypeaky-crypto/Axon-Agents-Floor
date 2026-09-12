-- Stripe: card top-ups and paid acquisitions. Idempotent on session id.

create table if not exists credit_orders (
  id text primary key,
  user_id text not null,
  session_id text not null unique,
  kind text not null,
  amount_cents integer not null,
  agent_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists credit_orders_user_idx on credit_orders (user_id);

create table if not exists stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

alter table purchases add column if not exists stripe_session_id text;
alter table purchases add column if not exists payment_source text not null default 'ledger';
