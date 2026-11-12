-- First-admin assignment template.
-- Run only with the trusted SQL connector / Supabase SQL Editor, never from browser app code.
-- Replace the three placeholders below with values looked up privately in the
-- Supabase dashboard. Do not commit real emails, user IDs or organisation IDs.
-- Fails closed if the resolved identity or active organisation no longer matches.
begin;
do $$
declare
  admin_email constant text := '<ADMIN_EMAIL>';
  admin_user_id constant uuid := '<ADMIN_USER_UUID>';
  org_id constant uuid := '<ORGANISATION_UUID>';
  target_user uuid;
  target_org uuid;
begin
  select u.id into strict target_user
  from auth.users u join public.profiles p on p.id = u.id
  where lower(u.email) = lower(admin_email)
    and u.id = admin_user_id;

  select id into strict target_org
  from public.organisations
  where slug = 'rccg-fountain-of-prayer-hull'
    and is_active = true
    and id = org_id;

  insert into public.organisation_memberships
    (organisation_id, profile_id, role, status)
  values (target_org, target_user, 'admin', 'active')
  on conflict (organisation_id, profile_id) do update
    set role = 'admin', status = 'active'
    where organisation_memberships.role is distinct from 'admin'::public.app_role
       or organisation_memberships.status is distinct from 'active'::public.membership_status;
end $$;
commit;

-- Verify (replace placeholders):
-- select id, organisation_id, profile_id, role, status, created_at, updated_at
-- from public.organisation_memberships
-- where organisation_id = '<ORGANISATION_UUID>' and profile_id = '<ADMIN_USER_UUID>';
