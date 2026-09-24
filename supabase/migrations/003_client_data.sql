alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_unique_pair unique (client_id, creator_id, project_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
create policy "participants view conversations" on public.conversations for select to authenticated using (client_id = auth.uid() or creator_id = auth.uid());
create policy "clients create conversations" on public.conversations for insert to authenticated with check (client_id = auth.uid());
create policy "participants view messages" on public.messages for select to authenticated using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.creator_id = auth.uid())));
create policy "participants send messages" on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.creator_id = auth.uid())));
create policy "clients view reviews" on public.reviews for select to authenticated using (true);
create policy "clients review owned completed projects" on public.reviews for insert to authenticated with check (client_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.client_id = auth.uid() and p.status = 'completed'));
