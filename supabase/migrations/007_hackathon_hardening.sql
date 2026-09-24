-- Keep profile ownership and conversation membership enforced in the database.
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed by the client';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

drop policy if exists "participants create conversations" on public.conversations;
create policy "participants create conversations"
on public.conversations
for insert to authenticated
with check (
  client_id = auth.uid()
  and client_id <> creator_id
  and exists (select 1 from public.profiles p where p.id = creator_id and p.role = 'creator')
);

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['project_requests', 'projects', 'conversations', 'messages', 'notifications'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;

notify pgrst, 'reload schema';