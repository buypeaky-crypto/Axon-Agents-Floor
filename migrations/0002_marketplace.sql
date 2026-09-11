-- Axon marketplace: listed agents, purchases, reviews, wallets.

create table if not exists profiles (
  user_id text primary key,
  display_name text not null default '',
  studio_name text not null default '',
  bio text not null default '',
  credits integer not null default 10000,
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id text primary key,
  slug text not null unique,
  seller_id text not null,
  seller_name text not null,
  name text not null,
  tagline text not null,
  description text not null,
  body text not null,
  category text not null,
  price_cents integer not null,
  version text not null default '1.0',
  hours_trained integer not null default 0,
  model_label text not null default 'House mix',
  capabilities text not null default '[]',
  training_notes text not null default '',
  sigil text not null default 'A',
  featured boolean not null default false,
  listed boolean not null default true,
  rating_avg double precision not null default 0,
  review_count integer not null default 0,
  sales_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists agents_listed_idx on agents (listed);
create index if not exists agents_category_idx on agents (category);
create index if not exists agents_seller_idx on agents (seller_id);
create index if not exists agents_featured_idx on agents (featured);

create table if not exists purchases (
  id text primary key,
  buyer_id text not null,
  agent_id text not null,
  price_cents integer not null,
  created_at timestamptz not null default now(),
  unique (buyer_id, agent_id)
);

create index if not exists purchases_buyer_idx on purchases (buyer_id);
create index if not exists purchases_agent_idx on purchases (agent_id);

create table if not exists reviews (
  id serial primary key,
  agent_id text not null,
  author_id text not null,
  author_name text not null,
  rating integer not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (agent_id, author_id)
);

create index if not exists reviews_agent_idx on reviews (agent_id);

create table if not exists trials (
  user_id text not null,
  agent_id text not null,
  turns integer not null default 0,
  primary key (user_id, agent_id)
);
