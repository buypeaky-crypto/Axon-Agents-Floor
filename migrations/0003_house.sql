-- House take: record the cut on every sale and keep a treasury.

create table if not exists house (
  id text primary key,
  fee_bps integer not null default 800,
  treasury_cents integer not null default 0
);

insert into house (id, fee_bps, treasury_cents)
values ('axon', 800, 0)
on conflict (id) do nothing;

alter table purchases add column if not exists fee_cents integer not null default 0;
alter table purchases add column if not exists seller_net_cents integer not null default 0;

update purchases
set
  fee_cents = (price_cents * 800) / 10000,
  seller_net_cents = price_cents - ((price_cents * 800) / 10000)
where fee_cents = 0 and price_cents > 0;
