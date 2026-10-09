-- Project: tosnqfrcxfbkjkfdoqyk. Existing first-admin assignment only.
-- Run with the trusted SQL connector/SQL Editor, never from browser app code.
-- Fail closed if the resolved identity or active organisation no longer matches.
begin;
do $$
declare
  target_user uuid;
  target_org uuid;
begin
  select u.id into strict target_user
  from auth.users u join public.profiles p on p.id = u.id
  where lower(u.email) = 'aboladeanuoluwapo@gmail.com'
    and u.id = '89778640-cc3f-4d32-bb75-ebed216055b7';

  select id into strict target_org
  from public.organisations
  where slug = 'rccg-fountain-of-prayer-hull'
    and is_active = true
    and id = '6fdc1e56-af12-441b-a543-62545d5cfaf1';

  insert into public.organisation_memberships
    (organisation_id, profile_id, role, status)
  values (target_org, target_user, 'admin', 'active')
  on conflict (organisation_id, profile_id) do update
    set role = 'admin', status = 'active'
    where organisation_memberships.role is distinct from 'admin'::public.app_role
       or organisation_memberships.status is distinct from 'active'::public.membership_status;
end $$;
commit;

select id, organisation_id, profile_id, role, status, created_at, updated_at
from public.organisation_memberships
where organisation_id = '6fdc1e56-af12-441b-a543-62545d5cfaf1'
  and profile_id = '89778640-cc3f-4d32-bb75-ebed216055b7';
