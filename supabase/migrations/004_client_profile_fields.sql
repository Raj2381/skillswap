-- Additive client profile fields and avatar storage.
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

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can upload own avatars') then
    create policy "Users can upload own avatars" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can update own avatars') then
    create policy "Users can update own avatars" on storage.objects for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own avatars') then
    create policy "Users can delete own avatars" on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Anyone can view avatars') then
    create policy "Anyone can view avatars" on storage.objects for select to public
      using (bucket_id = 'avatars');
  end if;
end;
$$;

notify pgrst, 'reload schema';
