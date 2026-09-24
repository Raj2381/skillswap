create extension if not exists "pgcrypto";

create table if not exists public.creator_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  username text unique,
  experience_years integer not null default 0 check (experience_years >= 0),
  availability text not null default 'available',
  bio text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.creator_skills (
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (creator_id, skill_id)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  pricing_type text not null default 'fixed' check (pricing_type in ('fixed', 'hourly')),
  delivery_days integer check (delivery_days is null or delivery_days > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  title text not null,
  description text,
  media_url text,
  external_url text,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  description text not null,
  requirements text,
  category text,
  budget numeric(12,2) not null check (budget >= 0),
  budget_type text not null default 'fixed' check (budget_type in ('fixed', 'hourly')),
  deadline date not null,
  start_date date,
  reference_links text,
  attachments jsonb not null default '[]'::jsonb,
  communication_preference text not null default 'chat' check (communication_preference in ('chat', 'email', 'both')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_requests_different_users check (client_id <> creator_id)
);

create unique index if not exists one_pending_request_per_pair_and_title
  on public.project_requests (client_id, creator_id, lower(title))
  where status = 'pending';

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique references public.project_requests(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  requirements text,
  category text,
  budget numeric(12,2) not null check (budget >= 0),
  budget_type text not null default 'fixed' check (budget_type in ('fixed', 'hourly')),
  deadline date not null,
  start_date date,
  status text not null default 'accepted' check (status in ('accepted', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_different_users check (client_id <> creator_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  project_id uuid references public.projects(id) on delete cascade,
  request_id uuid references public.project_requests(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.accept_project_request(request_id uuid)
returns public.projects
language plpgsql
 security definer
set search_path = public
as $$
declare
  request_row public.project_requests;
  project_row public.projects;
begin
  select * into request_row from public.project_requests
  where id = request_id and creator_id = auth.uid() for update;
  if not found then raise exception 'Project request not found'; end if;
  if request_row.status <> 'pending' then raise exception 'Project request is no longer pending'; end if;
  update public.project_requests set status = 'accepted', updated_at = now() where id = request_row.id;
  insert into public.projects (request_id, client_id, creator_id, title, description, requirements, category, budget, budget_type, deadline, start_date)
  values (request_row.id, request_row.client_id, request_row.creator_id, request_row.title, request_row.description, request_row.requirements, request_row.category, request_row.budget, request_row.budget_type, request_row.deadline, request_row.start_date)
  returning * into project_row;
  insert into public.notifications (user_id, type, title, message, project_id, request_id)
  values (request_row.client_id, 'request_accepted', 'Project request accepted', 'Your project request was accepted.', project_row.id, request_row.id);
  return project_row;
end;
$$;

create or replace function public.decline_project_request(request_id uuid)
returns public.project_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.project_requests;
begin
  select * into request_row from public.project_requests
  where id = request_id and creator_id = auth.uid() for update;
  if not found then raise exception 'Project request not found'; end if;
  if request_row.status <> 'pending' then raise exception 'Project request is no longer pending'; end if;
  update public.project_requests set status = 'declined', updated_at = now() where id = request_row.id returning * into request_row;
  insert into public.notifications (user_id, type, title, message, request_id)
  values (request_row.client_id, 'request_declined', 'Project request declined', 'Your project request was declined.', request_row.id);
  return request_row;
end;
$$;

revoke all on function public.accept_project_request(uuid) from public;
grant execute on function public.accept_project_request(uuid) to authenticated;
revoke all on function public.decline_project_request(uuid) from public;
grant execute on function public.decline_project_request(uuid) to authenticated;

alter table public.creator_profiles enable row level security;
alter table public.creator_skills enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.project_requests enable row level security;
alter table public.projects enable row level security;
alter table public.notifications enable row level security;

create policy "authenticated users can view creator profiles" on public.creator_profiles for select to authenticated using (true);
create policy "creators manage own creator profile" on public.creator_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "authenticated users can view creator skills" on public.creator_skills for select to authenticated using (true);
create policy "creators manage own skills" on public.creator_skills for all to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "authenticated users can view services" on public.services for select to authenticated using (true);
create policy "creators manage own services" on public.services for all to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "authenticated users can view portfolio" on public.portfolio_items for select to authenticated using (true);
create policy "creators manage own portfolio" on public.portfolio_items for all to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "clients and creators view related requests" on public.project_requests for select to authenticated using (client_id = auth.uid() or creator_id = auth.uid());
create policy "clients create own requests" on public.project_requests for insert to authenticated with check (client_id = auth.uid());
create policy "clients cancel own requests" on public.project_requests for update to authenticated using (client_id = auth.uid() and status = 'pending') with check (client_id = auth.uid());
create policy "creators update assigned requests" on public.project_requests for update to authenticated using (creator_id = auth.uid() and status = 'pending') with check (creator_id = auth.uid());
create policy "participants view projects" on public.projects for select to authenticated using (client_id = auth.uid() or creator_id = auth.uid());
create policy "participants update projects" on public.projects for update to authenticated using (creator_id = auth.uid() or client_id = auth.uid()) with check (creator_id = auth.uid() or client_id = auth.uid());
create policy "users view own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
