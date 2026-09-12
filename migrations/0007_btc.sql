create table if not exists btc_invoices (
  id text primary key,
  user_id text not null,
  kind text not null,
  amount_cents integer not null,
  agent_id text,
  address text not null,
  expected_sats bigint not null,
  status text not null default 'pending',
  tx_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
