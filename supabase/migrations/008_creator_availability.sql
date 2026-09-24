-- Ensure every creator has one canonical availability record.
insert into public.creator_profiles (user_id, availability)
select p.id, 'available'
from public.profiles p
where p.role = 'creator'
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text := case when new.raw_user_meta_data ->> 'role' = 'creator' then 'creator' else 'client' end;
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1), ''),
    coalesce(new.email, ''),
    user_role
  )
  on conflict (id) do update set email = excluded.email, updated_at = now();

  if user_role = 'creator' then
    insert into public.creator_profiles (user_id, availability)
    values (new.id, 'available')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';