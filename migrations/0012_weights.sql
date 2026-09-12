alter table agents add column if not exists weights_id text not null default '';
alter table agents add column if not exists runtime_model text not null default 'grok-4.6';
alter table agents add column if not exists temperature double precision not null default 0.7;
alter table agents add column if not exists evals text not null default '';
alter table agents add column if not exists sample_user text not null default '';
alter table agents add column if not exists sample_reply text not null default '';
alter table agents add column if not exists seller_btc text not null default '';

alter table profiles add column if not exists btc_address text not null default '';

create table if not exists studio_payouts (
  id text primary key,
  seller_id text not null,
  purchase_id text,
  amount_cents integer not null,
  btc_address text not null default '',
  status text not null default 'owed',
  created_at timestamptz not null default now()
);

create index if not exists studio_payouts_seller_idx on studio_payouts (seller_id);
