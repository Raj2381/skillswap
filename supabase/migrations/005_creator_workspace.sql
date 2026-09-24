-- Additive creator workspace schema. Existing project_requests remains the shared booking table.

alter table public.creator_profiles add column if not exists skills text[] not null default '{}';
alter table public.creator_profiles add column if not exists basic_charge numeric(12,2) check (basic_charge is null or basic_charge >= 0);
alter table public.creator_profiles add column if not exists standard_charge numeric(12,2) check (standard_charge is null or standard_charge >= 0);
alter table public.creator_profiles add column if not exists premium_charge numeric(12,2) check (premium_charge is null or premium_charge >= 0);
alter table public.creator_profiles add column if not exists rating numeric(3,2) check (rating is null or rating between 0 and 5);

alter table public.project_requests add column if not exists decline_reason text;
alter table public.projects add column if not exists completed_at timestamptz;

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  skills text[] not null default '{}',
  basic_charge numeric(12,2) not null check (basic_charge >= 0),
  standard_charge numeric(12,2),
  premium_charge numeric(12,2),
  delivery_days integer check (delivery_days is null or delivery_days > 0),
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete cascade,
  payee_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'failed')),
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gigs_creator_idx on public.gigs (creator_id, published, created_at desc);
create index if not exists payments_project_idx on public.payments (project_id, created_at desc);

alter table public.gigs enable row level security;
alter table public.payments enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gigs' and policyname = 'authenticated users view published gigs') then
    create policy "authenticated users view published gigs" on public.gigs for select to authenticated using (published or creator_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gigs' and policyname = 'creators manage own gigs') then
    create policy "creators manage own gigs" on public.gigs for all to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payments' and policyname = 'payment participants view payments') then
    create policy "payment participants view payments" on public.payments for select to authenticated using (payer_id = auth.uid() or payee_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payments' and policyname = 'payers create payments') then
    create policy "payers create payments" on public.payments for insert to authenticated with check (payer_id = auth.uid());
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'projects_status_check') then
    alter table public.projects drop constraint projects_status_check;
  end if;
  alter table public.projects add constraint projects_status_check check (status in ('accepted', 'in_progress', 'delivered', 'completed', 'cancelled'));
exception when duplicate_object then null;
end;
$$;

create or replace function public.accept_project_request(request_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.project_requests;
  project_row public.projects;
  active_count integer;
  overlap_exists boolean;
begin
  select * into request_row from public.project_requests where id = request_id and creator_id = auth.uid() for update;
  if not found then raise exception 'Project request not found'; end if;
  if request_row.status <> 'pending' then raise exception 'Project request is no longer pending'; end if;
  select count(*) into active_count from public.projects where creator_id = auth.uid() and status in ('accepted', 'in_progress', 'delivered');
  if active_count >= 5 then raise exception 'Creator has reached the five active project limit'; end if;
  select exists(select 1 from public.projects where creator_id = auth.uid() and status in ('accepted', 'in_progress', 'delivered') and deadline >= coalesce(request_row.start_date, current_date)) into overlap_exists;
  if overlap_exists then raise exception 'Creator has an active project overlapping this request'; end if;
  update public.project_requests set status = 'accepted' where id = request_row.id;
  insert into public.projects (request_id, client_id, creator_id, title, description, requirements, category, budget, budget_type, deadline, start_date)
  values (request_row.id, request_row.client_id, request_row.creator_id, request_row.title, request_row.description, request_row.requirements, request_row.category, request_row.budget, request_row.budget_type, request_row.deadline, request_row.start_date)
  returning * into project_row;
  update public.creator_profiles set availability = case when active_count + 1 >= 5 then 'busy' else availability end where user_id = auth.uid();
  insert into public.notifications (user_id, type, title, message, project_id, request_id)
  values (request_row.client_id, 'request_accepted', 'Project request accepted', 'Your project request was accepted.', project_row.id, request_row.id);
  return project_row;
end;
$$;

notify pgrst, 'reload schema';
