create table if not exists conduit_sources (
  source_id text primary key,
  name text not null,
  category text not null default 'ops',
  auth text not null default 'none',
  license text not null default '',
  endpoint text not null,
  method text not null default 'GET',
  docs text not null default '',
  note text not null default ''
);

create table if not exists conduit_binds (
  source_id text not null,
  agent_slug text not null,
  bound_at timestamptz not null default now(),
  primary key (source_id, agent_slug)
);
