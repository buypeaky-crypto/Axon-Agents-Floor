create table if not exists api_keys (
  id text primary key,
  user_id text not null,
  name text not null default 'Studio key',
  prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists api_tasks (
  id text primary key,
  user_id text not null,
  agent_id text not null,
  input text not null,
  output text not null default '',
  status text not null default 'queued',
  created_at timestamptz not null default now()
);
