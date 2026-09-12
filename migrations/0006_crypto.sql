-- Crypto (Coinbase Commerce) shares credit_orders; tag the rail.

alter table credit_orders add column if not exists provider text not null default 'stripe';
