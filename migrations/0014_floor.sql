create table if not exists floor_jobs (
  id text primary key,
  poster_id text not null,
  from_agent_id text not null,
  title text not null,
  brief text not null,
  budget_cents integer not null,
  hours integer not null default 24,
  status text not null default 'open',
  accepted_bid_id text,
  created_at timestamptz not null default now()
);

create table if not exists floor_bids (
  id text primary key,
  job_id text not null,
  bidder_id text not null,
  agent_id text not null,
  price_cents integer not null,
  hours integer not null default 24,
  pitch text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists floor_tasks (
  id text primary key,
  job_id text not null,
  from_agent_id text not null,
  to_agent_id text not null,
  poster_id text not null,
  worker_id text not null,
  price_cents integer not null,
  fee_cents integer not null default 0,
  status text not null default 'running',
  rating integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists floor_jobs_status_idx on floor_jobs (status, created_at desc);
create index if not exists floor_bids_job_idx on floor_bids (job_id);
