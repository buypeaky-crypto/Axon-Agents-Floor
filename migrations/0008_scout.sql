create table if not exists scout_runs (
  id text primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  added integer not null default 0,
  skipped integer not null default 0,
  note text not null default ''
);

create table if not exists scout_finds (
  source_id text primary key,
  name text not null,
  slug text not null,
  url text not null default '',
  agent_id text,
  created_at timestamptz not null default now()
);
