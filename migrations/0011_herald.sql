create table if not exists sales_campaigns (
  agent_id text primary key,
  seller_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists sale_offers (
  code text primary key,
  agent_id text not null,
  seller_id text not null,
  pitch text not null,
  created_at timestamptz not null default now()
);

create table if not exists sale_closes (
  id text primary key,
  code text not null,
  agent_id text not null,
  buyer_id text not null,
  amount_cents integer not null,
  source text not null default 'ledger',
  created_at timestamptz not null default now()
);
