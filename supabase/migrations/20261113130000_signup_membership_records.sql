-- New sign-ups appear for the church admin as "awaiting a role".
--
-- Before this migration a new email sign-up got a profile (from the existing
-- auth.users trigger in the baseline) but NO organisation membership, so it
-- never appeared on /admin/users and the admin could not assign a role.
--
-- This migration is additive and idempotent:
--   1. organisation_memberships.awaiting_role (boolean, default false).
--   2. When a profile is created, a membership is created for the Hull church
--      with the LOWEST role ('member') and status 'inactive' (production's
--      membership_status enum is active/inactive only), awaiting_role = true.
--      Inactive memberships grant nothing: every access helper, policy and page
--      requires status = 'active'. So a new sign-up has exactly the access an
--      unassigned person had before (none beyond their own profile).
--   3. awaiting_role is cleared automatically the first time the role or status
--      is changed (by the admin on /admin/users, or in SQL).
--   4. Backfill: existing profiles with no Hull membership get the same
--      inactive, awaiting record. Existing memberships are never changed.
--   5. Membership statistics leave "awaiting a role" records out of the
--      registered totals and report them separately.
-- No RLS policy is created, changed or relaxed. No grants are added.

-- 1. Column ---------------------------------------------------------------------
alter table public.organisation_memberships
  add column if not exists awaiting_role boolean not null default false;

comment on column public.organisation_memberships.awaiting_role is
  'True for a self sign-up that the church admin has not yet given a role. Cleared automatically when role or status first changes.';

-- 2. Create the record when a profile is created ----------------------------
create or replace function public.create_signup_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  church uuid;
begin
  select o.id into church
  from public.organisations o
  where o.slug = 'rccg-fountain-of-prayer-hull' and o.is_active
  limit 1;

  if church is not null then
    insert into public.organisation_memberships
      (organisation_id, profile_id, role, status, awaiting_role)
    values
      (church, new.id, 'member'::public.app_role, 'inactive'::public.membership_status, true)
    on conflict (organisation_id, profile_id) do nothing;
  end if;

  return new;
exception when others then
  -- Never block a sign-up. The admin can still link the person manually.
  raise warning 'create_signup_membership skipped for profile %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function public.create_signup_membership() from public, anon, authenticated;

drop trigger if exists create_signup_membership on public.profiles;
create trigger create_signup_membership
after insert on public.profiles
for each row execute function public.create_signup_membership();

-- 3. Clear the flag once the admin assigns a role or status ------------------
create or replace function public.clear_awaiting_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role or new.status is distinct from old.status then
    new.awaiting_role := false;
  end if;
  return new;
end;
$$;

revoke all on function public.clear_awaiting_role() from public, anon, authenticated;

drop trigger if exists clear_awaiting_role on public.organisation_memberships;
create trigger clear_awaiting_role
before update on public.organisation_memberships
for each row execute function public.clear_awaiting_role();

-- 4. Backfill existing profiles without a Hull membership -------------------
insert into public.organisation_memberships
  (organisation_id, profile_id, role, status, awaiting_role)
select o.id, p.id, 'member'::public.app_role, 'inactive'::public.membership_status, true
from public.profiles p
cross join public.organisations o
where o.slug = 'rccg-fountain-of-prayer-hull' and o.is_active
  and not exists (
    select 1 from public.organisation_memberships om
    where om.organisation_id = o.id and om.profile_id = p.id)
on conflict (organisation_id, profile_id) do nothing;

-- 5. Statistics: registered totals exclude people still awaiting a role -----
create or replace function public.church_membership_stats(org uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  result jsonb;
begin
  if not (
    public.is_org_pastor_or_admin(org)
    or exists (
      select 1 from public.department_leadership dl
      join public.church_departments d on d.id = dl.department_id
      join public.department_memberships m
        on m.department_id = d.id and m.profile_id = dl.profile_id and m.status = 'active'
      where d.organisation_id = org and d.slug = 'ushering-and-hospitality' and d.is_active
        and dl.profile_id = auth.uid() and dl.is_active)
  ) then
    raise exception 'Not authorised to view membership statistics' using errcode = '42501';
  end if;

  with reg as (
    select om.profile_id, om.status::text as status
    from public.organisation_memberships om
    where om.organisation_id = org and not om.awaiting_role
  ),
  active_dept as (
    select distinct m.department_id, m.profile_id
    from public.department_memberships m
    join public.church_departments d on d.id = m.department_id
    where d.organisation_id = org and m.status = 'active'
  )
  select jsonb_build_object(
    'registered_total', (select count(distinct profile_id) from reg),
    'by_status', coalesce((select jsonb_object_agg(status, n) from (
        select status, count(distinct profile_id) as n from reg group by status) s), '{}'::jsonb),
    'awaiting_role_total', (select count(*) from public.organisation_memberships om
        where om.organisation_id = org and om.awaiting_role),
    'family_members_total', (select count(*) from public.family_members fm where fm.organisation_id = org),
    'gender_recorded', false,
    'age_recorded', false,
    'assigned_active_members', (select count(distinct a.profile_id) from active_dept a
        join reg r on r.profile_id = a.profile_id and r.status = 'active'),
    'not_assigned_active_members', (select count(*) from reg r where r.status = 'active'
        and not exists (select 1 from active_dept a where a.profile_id = r.profile_id)),
    'departments', coalesce((select jsonb_agg(jsonb_build_object(
          'id', d.id, 'name', d.name, 'is_active', d.is_active,
          'active_members', (select count(*) from active_dept a where a.department_id = d.id))
        order by d.name)
      from public.church_departments d where d.organisation_id = org and d.archived_at is null), '[]'::jsonb),
    'calculated_at', now()
  ) into result;
  return result;
end;
$$;

revoke all on function public.church_membership_stats(uuid) from public, anon;
grant execute on function public.church_membership_stats(uuid) to authenticated;
