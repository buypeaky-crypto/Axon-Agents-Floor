create table if not exists security_events (
  id text primary key,
  severity text not null,
  kind text not null,
  lane text not null default '',
  actor text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists security_events_created_idx on security_events (created_at desc);
