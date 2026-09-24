-- Public, isolated demo data for hackathon evaluation. This does not touch
-- authenticated production profiles, requests, projects, or messages.
create table if not exists public.demo_gigs (
  id uuid primary key default gen_random_uuid(),
  creator_name text not null,
  creator_username text not null,
  title text not null,
  category text not null,
  rate numeric(12,2) not null check (rate >= 0),
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_bookings (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.demo_gigs(id) on delete cascade,
  client_id text not null,
  client_name text not null,
  requirements text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.demo_gigs enable row level security;
alter table public.demo_bookings enable row level security;

drop policy if exists "public demo gigs are readable" on public.demo_gigs;
create policy "public demo gigs are readable" on public.demo_gigs for select to anon, authenticated using (true);
drop policy if exists "public demo bookings are readable" on public.demo_bookings;
create policy "public demo bookings are readable" on public.demo_bookings for select to anon, authenticated using (true);
drop policy if exists "public demo bookings can be created" on public.demo_bookings;
create policy "public demo bookings can be created" on public.demo_bookings for insert to anon, authenticated with check (length(trim(client_id)) > 0 and length(trim(client_name)) > 0);
drop policy if exists "public demo bookings can be updated" on public.demo_bookings;
create policy "public demo bookings can be updated" on public.demo_bookings for update to anon, authenticated using (true) with check (status in ('pending','accepted','declined'));

insert into public.demo_gigs (id, creator_name, creator_username, title, category, rate, description)
values
  ('10000000-0000-4000-8000-000000000001', 'Maya Iyer', '@mayaiyer', 'Brand identity starter kit', 'Design', 8500, 'A focused visual identity with logo direction, color system, and launch-ready assets.'),
  ('10000000-0000-4000-8000-000000000002', 'Rahul Mehta', '@rahulmehta', 'Landing page development', 'Web Development', 15000, 'A responsive conversion-focused landing page built around your product story.'),
  ('10000000-0000-4000-8000-000000000003', 'Neha Patel', '@nehapatel', 'Short-form video editing', 'Video Editing', 5000, 'Polished social edits with captions, pacing, sound design, and platform-ready exports.'),
  ('10000000-0000-4000-8000-000000000004', 'Arjun Rao', '@arjunrao', 'Product copy sprint', 'Writing', 6500, 'Clear product messaging for your homepage, launch email, and core feature pages.')
on conflict (id) do nothing;

create index if not exists demo_bookings_status_idx on public.demo_bookings (status, created_at desc);
create index if not exists demo_bookings_client_idx on public.demo_bookings (client_id, created_at desc);

notify pgrst, 'reload schema';