alter table agents add column if not exists weight_card text not null default '';
alter table agents add column if not exists max_tokens integer not null default 480;
