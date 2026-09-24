create table if not exists public.saved_creators (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_creators_unique_pair unique (client_id, creator_id),
  constraint saved_creators_not_self check (client_id <> creator_id)
);

alter table public.saved_creators enable row level security;
create policy "clients manage own saved creators" on public.saved_creators
  for all to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());
