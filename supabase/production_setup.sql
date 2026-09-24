-- SkillSwap production database initializer
-- Consolidated effective order: 000 -> 001/002/003 absorbed -> 004 -> 005.
-- Safe for the currently empty public schema. No credentials or seed users are included.

create extension if not exists pgcrypto;

-- 000: auth-linked profiles and marketplace base tables.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '', email text not null default '', username text,
  bio text, location text, phone text, preferences jsonb not null default '{}'::jsonb,
  avatar_url text, role text not null default 'client' check (role in ('client','creator')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_key on public.profiles (lower(username)) where username is not null;

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), name text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.creator_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  username text unique, experience_years integer not null default 0 check (experience_years >= 0),
  availability text not null default 'available' check (availability in ('available','busy','unavailable')),
  bio text, location text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.creator_skills (
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade, primary key (creator_id, skill_id)
);
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  name text not null, description text, price numeric(12,2) not null check (price >= 0),
  pricing_type text not null default 'fixed' check (pricing_type in ('fixed','hourly')),
  delivery_days integer check (delivery_days is null or delivery_days > 0), created_at timestamptz not null default now()
);
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  title text not null, description text, media_url text, external_url text, category text, created_at timestamptz not null default now()
);
create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade, service_id uuid references public.services(id) on delete set null,
  title text not null, description text not null, requirements text, category text, budget numeric(12,2) not null check (budget >= 0),
  budget_type text not null default 'fixed' check (budget_type in ('fixed','hourly')), deadline date not null, start_date date,
  reference_links text, attachments jsonb not null default '[]'::jsonb,
  communication_preference text not null default 'chat' check (communication_preference in ('chat','email','both')),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  decline_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint project_requests_different_users check (client_id <> creator_id)
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), request_id uuid unique references public.project_requests(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade, creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text not null, requirements text, category text, budget numeric(12,2) not null check (budget >= 0),
  budget_type text not null default 'fixed' check (budget_type in ('fixed','hourly')), deadline date not null, start_date date,
  status text not null default 'accepted' check (status in ('accepted','in_progress','delivered','completed','cancelled')),
  progress integer not null default 0 check (progress between 0 and 100), completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint projects_different_users check (client_id <> creator_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, title text not null, message text not null, project_id uuid references public.projects(id) on delete cascade,
  request_id uuid references public.project_requests(id) on delete cascade, is_read boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.saved_creators (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(),
  constraint saved_creators_unique_pair unique (client_id, creator_id), constraint saved_creators_not_self check (client_id <> creator_id)
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade, project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint conversations_unique_pair unique (client_id, creator_id, project_id), constraint conversations_different_users check (client_id <> creator_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade, body text not null check (length(trim(body)) > 0),
  attachment_url text, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), project_id uuid not null unique references public.projects(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade, creator_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5), comment text, created_at timestamptz not null default now()
);

-- 004: client profile fields and avatar storage.
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists linkedin text;
alter table public.profiles add column if not exists instagram text;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists languages text[] not null default '{}';
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists budget_range text;
alter table public.profiles add column if not exists preferred_contact text;
alter table public.profiles add column if not exists best_time_to_reach text;
insert into storage.buckets (id,name,public) values ('avatars','avatars',true) on conflict (id) do nothing;

-- 005: creator workspace fields, gigs, payments.
alter table public.creator_profiles add column if not exists skills text[] not null default '{}';
alter table public.creator_profiles add column if not exists basic_charge numeric(12,2) check (basic_charge is null or basic_charge >= 0);
alter table public.creator_profiles add column if not exists standard_charge numeric(12,2) check (standard_charge is null or standard_charge >= 0);
alter table public.creator_profiles add column if not exists premium_charge numeric(12,2) check (premium_charge is null or premium_charge >= 0);
alter table public.creator_profiles add column if not exists rating numeric(3,2) check (rating is null or rating between 0 and 5);
create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  title text not null, description text not null, category text, skills text[] not null default '{}',
  basic_charge numeric(12,2) not null check (basic_charge >= 0), standard_charge numeric(12,2), premium_charge numeric(12,2),
  delivery_days integer, cover_url text, published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete cascade, payee_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0), status text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  provider_reference text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

insert into storage.buckets (id,name,public) values ('avatars','avatars',true) on conflict (id) do nothing;

create unique index if not exists one_pending_request_per_pair_and_title on public.project_requests (client_id,creator_id,lower(title)) where status = 'pending';
create index if not exists project_requests_client_idx on public.project_requests (client_id,created_at desc);
create index if not exists project_requests_creator_idx on public.project_requests (creator_id,status,created_at desc);
create index if not exists projects_client_idx on public.projects (client_id,created_at desc);
create index if not exists projects_creator_idx on public.projects (creator_id,status,created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id,is_read,created_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id,created_at desc);
create index if not exists gigs_creator_idx on public.gigs (creator_id,published,created_at desc);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,name,email,role) values (new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),split_part(new.email,'@',1),''),coalesce(new.email,''),case when new.raw_user_meta_data->>'role'='creator' then 'creator' else 'client' end) on conflict(id) do update set email=excluded.email,updated_at=now(); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='projects_status_check') then alter table public.projects add constraint projects_status_check check (status in ('accepted','in_progress','delivered','completed','cancelled')); end if;
exception when duplicate_object then null; end $$;

create or replace function public.accept_project_request(request_id uuid) returns public.projects language plpgsql security definer set search_path=public as $$
declare request_row public.project_requests; project_row public.projects; active_count integer; overlap_exists boolean;
begin
 select * into request_row from public.project_requests where id=request_id and creator_id=auth.uid() for update;
 if not found then raise exception 'Project request not found'; end if;
 if request_row.status<>'pending' then raise exception 'Project request is no longer pending'; end if;
 select count(*) into active_count from public.projects where creator_id=auth.uid() and status in ('accepted','in_progress','delivered');
 if active_count>=5 then raise exception 'Creator has reached the five active project limit'; end if;
 select exists(select 1 from public.projects where creator_id=auth.uid() and status in ('accepted','in_progress','delivered') and deadline>=coalesce(request_row.start_date,current_date)) into overlap_exists;
 if overlap_exists then raise exception 'Creator has an active project overlapping this request'; end if;
 update public.project_requests set status='accepted',updated_at=now() where id=request_row.id;
 insert into public.projects(request_id,client_id,creator_id,title,description,requirements,category,budget,budget_type,deadline,start_date) values(request_row.id,request_row.client_id,request_row.creator_id,request_row.title,request_row.description,request_row.requirements,request_row.category,request_row.budget,request_row.budget_type,request_row.deadline,request_row.start_date) returning * into project_row;
 update public.creator_profiles set availability=case when active_count+1>=5 then 'busy' else availability end where user_id=auth.uid();
 insert into public.notifications(user_id,type,title,message,project_id,request_id) values(request_row.client_id,'request_accepted','Project request accepted','Your project request was accepted.',project_row.id,request_row.id);
 return project_row;
end; $$;
create or replace function public.decline_project_request(request_id uuid) returns public.project_requests language plpgsql security definer set search_path=public as $$
declare request_row public.project_requests; begin select * into request_row from public.project_requests where id=request_id and creator_id=auth.uid() for update; if not found then raise exception 'Project request not found'; end if; if request_row.status<>'pending' then raise exception 'Project request is no longer pending'; end if; update public.project_requests set status='declined',updated_at=now() where id=request_row.id returning * into request_row; insert into public.notifications(user_id,type,title,message,request_id) values(request_row.client_id,'request_declined','Project request declined','Your project request was declined.',request_row.id); return request_row; end; $$;
revoke all on function public.accept_project_request(uuid) from public; grant execute on function public.accept_project_request(uuid) to authenticated;
revoke all on function public.decline_project_request(uuid) from public; grant execute on function public.decline_project_request(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.creator_skills enable row level security;
alter table public.skills enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.project_requests enable row level security;
alter table public.projects enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_creators enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.gigs enable row level security;
alter table public.payments enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='users view own profile or public creator profile') then create policy "users view own profile or public creator profile" on public.profiles for select to authenticated using(id=auth.uid() or role='creator'); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='users insert own profile') then create policy "users insert own profile" on public.profiles for insert to authenticated with check(id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='users update own profile') then create policy "users update own profile" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='creator_profiles' and policyname='authenticated users view creator profiles') then create policy "authenticated users view creator profiles" on public.creator_profiles for select to authenticated using(true); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='creator_profiles' and policyname='creators manage own creator profile') then create policy "creators manage own creator profile" on public.creator_profiles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='skills' and policyname='authenticated users view skills') then create policy "authenticated users view skills" on public.skills for select to authenticated using(true); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='creator_skills' and policyname='authenticated users view creator skills') then create policy "authenticated users view creator skills" on public.creator_skills for select to authenticated using(true); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='creator_skills' and policyname='creators manage own skills') then create policy "creators manage own skills" on public.creator_skills for all to authenticated using(creator_id=auth.uid()) with check(creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='services' and policyname='authenticated users view services') then create policy "authenticated users view services" on public.services for select to authenticated using(true); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='services' and policyname='creators manage own services') then create policy "creators manage own services" on public.services for all to authenticated using(creator_id=auth.uid()) with check(creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='portfolio_items' and policyname='authenticated users view portfolio') then create policy "authenticated users view portfolio" on public.portfolio_items for select to authenticated using(true); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='portfolio_items' and policyname='creators manage own portfolio') then create policy "creators manage own portfolio" on public.portfolio_items for all to authenticated using(creator_id=auth.uid()) with check(creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='project_requests' and policyname='participants view project requests') then create policy "participants view project requests" on public.project_requests for select to authenticated using(client_id=auth.uid() or creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='project_requests' and policyname='clients create own project requests') then create policy "clients create own project requests" on public.project_requests for insert to authenticated with check(client_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='project_requests' and policyname='clients cancel own pending requests') then create policy "clients cancel own pending requests" on public.project_requests for update to authenticated using(client_id=auth.uid() and status='pending') with check(client_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='project_requests' and policyname='creators update assigned pending requests') then create policy "creators update assigned pending requests" on public.project_requests for update to authenticated using(creator_id=auth.uid() and status='pending') with check(creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='participants view projects') then create policy "participants view projects" on public.projects for select to authenticated using(client_id=auth.uid() or creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='participants update projects') then create policy "participants update projects" on public.projects for update to authenticated using(client_id=auth.uid() or creator_id=auth.uid()) with check(client_id=auth.uid() or creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='users view own notifications') then create policy "users view own notifications" on public.notifications for select to authenticated using(user_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='users update own notifications') then create policy "users update own notifications" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='saved_creators' and policyname='clients manage own saved creators') then create policy "clients manage own saved creators" on public.saved_creators for all to authenticated using(client_id=auth.uid()) with check(client_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='participants view conversations') then create policy "participants view conversations" on public.conversations for select to authenticated using(client_id=auth.uid() or creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='participants create conversations') then create policy "participants create conversations" on public.conversations for insert to authenticated with check(client_id=auth.uid() or creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='participants view messages') then create policy "participants view messages" on public.messages for select to authenticated using(exists(select 1 from public.conversations c where c.id=conversation_id and (c.client_id=auth.uid() or c.creator_id=auth.uid()))); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='participants send messages') then create policy "participants send messages" on public.messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.conversations c where c.id=conversation_id and (c.client_id=auth.uid() or c.creator_id=auth.uid()))); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='authenticated users view reviews') then create policy "authenticated users view reviews" on public.reviews for select to authenticated using(true); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='clients review own completed projects') then create policy "clients review own completed projects" on public.reviews for insert to authenticated with check(client_id=auth.uid() and exists(select 1 from public.projects p where p.id=project_id and p.client_id=auth.uid() and p.status='completed')); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='gigs' and policyname='authenticated users view published gigs') then create policy "authenticated users view published gigs" on public.gigs for select to authenticated using(published or creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='gigs' and policyname='creators manage own gigs') then create policy "creators manage own gigs" on public.gigs for all to authenticated using(creator_id=auth.uid()) with check(creator_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='payment participants view payments') then create policy "payment participants view payments" on public.payments for select to authenticated using(payer_id=auth.uid() or payee_id=auth.uid()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='payers create payments') then create policy "payers create payments" on public.payments for insert to authenticated with check(payer_id=auth.uid()); end if;
end $$;

insert into public.profiles(id,name,email,role) select u.id,coalesce(nullif(trim(u.raw_user_meta_data->>'name'),''),split_part(u.email,'@',1),''),coalesce(u.email,''),case when u.raw_user_meta_data->>'role'='creator' then 'creator' else 'client' end from auth.users u on conflict(id) do nothing;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can upload own avatars') then create policy "Users can upload own avatars" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text); end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can update own avatars') then create policy "Users can update own avatars" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text); end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can delete own avatars') then create policy "Users can delete own avatars" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text); end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Anyone can view avatars') then create policy "Anyone can view avatars" on storage.objects for select to public using(bucket_id='avatars'); end if;
end $$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
do $$ begin
  if not exists(select 1 from pg_trigger where tgname='profiles_set_updated_at') then create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='creator_profiles_set_updated_at') then create trigger creator_profiles_set_updated_at before update on public.creator_profiles for each row execute function public.set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='project_requests_set_updated_at') then create trigger project_requests_set_updated_at before update on public.project_requests for each row execute function public.set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='projects_set_updated_at') then create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at(); end if;
end $$;

notify pgrst, 'reload schema';
