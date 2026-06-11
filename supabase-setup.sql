create extension if not exists pgcrypto;

create table if not exists public.date_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  location text not null,
  coordinates jsonb,
  map_link text,
  note text default '',
  photos jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  completion_note text default '',
  completion_photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_date_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_date_events_updated_at on public.date_events;

create trigger trg_date_events_updated_at
before update on public.date_events
for each row
execute function public.set_date_events_updated_at();

alter table public.date_events enable row level security;

drop policy if exists "anon can read date events" on public.date_events;
create policy "anon can read date events"
on public.date_events
for select
to anon
using (true);

drop policy if exists "anon can insert date events" on public.date_events;
create policy "anon can insert date events"
on public.date_events
for insert
to anon
with check (true);

drop policy if exists "anon can update date events" on public.date_events;
create policy "anon can update date events"
on public.date_events
for update
to anon
using (true)
with check (true);

drop policy if exists "anon can delete date events" on public.date_events;
create policy "anon can delete date events"
on public.date_events
for delete
to anon
using (true);

insert into storage.buckets (id, name, public)
values ('date-memories', 'date-memories', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "anon can read date memories" on storage.objects;
create policy "anon can read date memories"
on storage.objects
for select
to anon
using (bucket_id = 'date-memories');

drop policy if exists "anon can upload date memories" on storage.objects;
create policy "anon can upload date memories"
on storage.objects
for insert
to anon
with check (bucket_id = 'date-memories');

drop policy if exists "anon can update date memories" on storage.objects;
create policy "anon can update date memories"
on storage.objects
for update
to anon
using (bucket_id = 'date-memories')
with check (bucket_id = 'date-memories');

drop policy if exists "anon can delete date memories" on storage.objects;
create policy "anon can delete date memories"
on storage.objects
for delete
to anon
using (bucket_id = 'date-memories');
