-- Membership statistics (aggregate counts only, no personal data).
-- Additive: two read-only SECURITY DEFINER functions, no tables, no stored totals.
-- Figures are calculated live from existing records on every call, so they
-- reconcile automatically when members, family members or department
-- memberships are added, changed or removed.
-- Staging / isolated lab only until the owner approves production.
--
-- Counting rules
--  * Registered member = a row in organisation_memberships for the organisation.
--    unique (organisation_id, profile_id) means each person is counted once.
--    Visitors (public.visitors) are never counted.
--  * Status breakdown comes from organisation_memberships.status.
--  * Family members (public.family_members) are dependants recorded by a member
--    household; reported separately, never added to the registered total.
--  * Gender, child/adult: the schema has NO sex/gender, date-of-birth (only
--    birth_month/birth_day, no year) or child flag, so these are reported as
--    unspecified / age unknown. Nothing is inferred from names or relationships.
--  * Department totals = distinct profiles with an ACTIVE department membership.
--    People can belong to several departments, so department totals overlap.
--  * Not assigned = active registered members with no active department membership.
--
-- Access: organisation admin or pastor (existing helpers), or the active leader /
-- deputy of the organisation's Ushering and Hospitality department (church-wide
-- aggregates only). Department-level counts: admin/pastor or that department's
-- active leader/deputy. No new global roles.

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
    where om.organisation_id = org
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

create or replace function public.department_membership_stats(p_department uuid)
returns table (active_members bigint, pending_members bigint, upcoming_events bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  dept_org uuid;
begin
  select organisation_id into dept_org from public.church_departments where id = p_department;
  if dept_org is null or not (
    public.is_org_pastor_or_admin(dept_org)
    or exists (select 1 from public.department_leadership dl
      where dl.department_id = p_department and dl.profile_id = auth.uid() and dl.is_active)
  ) then
    raise exception 'Not authorised to view department statistics' using errcode = '42501';
  end if;
  return query
    select
      (select count(distinct m.profile_id) from public.department_memberships m
        where m.department_id = p_department and m.status = 'active'),
      (select count(distinct m.profile_id) from public.department_memberships m
        where m.department_id = p_department and m.status = 'pending'),
      (select count(*) from public.department_events e
        where e.department_id = p_department and e.status <> 'cancelled' and e.ends_at > now());
end;
$$;

revoke all on function public.church_membership_stats(uuid) from public, anon;
revoke all on function public.department_membership_stats(uuid) from public, anon;
grant execute on function public.church_membership_stats(uuid) to authenticated;
grant execute on function public.department_membership_stats(uuid) to authenticated;
