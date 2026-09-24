-- Create a request and its private conversation in one transaction.
create or replace function public.create_project_request(
  p_creator_id uuid,
  p_service_id uuid,
  p_title text,
  p_description text,
  p_requirements text,
  p_category text,
  p_budget numeric,
  p_budget_type text,
  p_deadline date,
  p_start_date date,
  p_reference_links text,
  p_communication_preference text
)
returns public.project_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.project_requests;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'client') then
    raise exception 'Only clients can create project requests';
  end if;
  if not exists (
    select 1 from public.profiles p
    join public.creator_profiles cp on cp.user_id = p.id
    where p.id = p_creator_id and p.role = 'creator' and cp.availability = 'available'
  ) then
    raise exception 'Creator not found or unavailable';
  end if;

  insert into public.project_requests (
    client_id, creator_id, service_id, title, description, requirements, category,
    budget, budget_type, deadline, start_date, reference_links, communication_preference
  ) values (
    auth.uid(), p_creator_id, p_service_id, p_title, p_description, p_requirements, p_category,
    p_budget, p_budget_type, p_deadline, p_start_date, p_reference_links, p_communication_preference
  ) returning * into request_row;

  insert into public.conversations (client_id, creator_id)
  values (auth.uid(), p_creator_id)
  on conflict (client_id, creator_id, project_id) do nothing;

  insert into public.notifications (user_id, type, title, message, request_id)
  values (
    p_creator_id,
    'new_request',
    'New service request',
    'You have received a new service request.',
    request_row.id
  );

  return request_row;
end;
$$;

revoke all on function public.create_project_request(uuid, uuid, text, text, text, text, numeric, text, date, date, text, text) from public;
grant execute on function public.create_project_request(uuid, uuid, text, text, text, text, numeric, text, date, date, text, text) to authenticated;

do $$
declare
  _table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach _table in array array['project_requests', 'projects', 'conversations', 'messages'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = _table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', _table);
      end if;
    end loop;
  end if;
end;
$$;

notify pgrst, 'reload schema';