-- Permanent fix: break the circular RLS dependency introduced in
-- 20261110150000_add_departments.sql.
--
-- Cycle being removed:
--   department_memberships.memberships_select
--     -> reads department_leadership (RLS: leadership_select)
--        -> reads department_memberships (RLS: memberships_select)  ...recursion
-- PostgreSQL rejects that with "infinite recursion detected in policy for
-- relation ...", which made member assignment fail.
--
-- The replacement leadership_select policy does NOT read any other
-- RLS-protected department table. It allows only:
--   (a) organisation administrators (public.is_org_admin, security definer
--       helper from the baseline) to read leadership records, and
--   (b) a person to read their OWN leadership record.
-- That is strictly narrower than before (ordinary members can no longer list
-- every leader in their department), so RLS is not weakened.
--
-- Staging / isolated local lab only until the owner approves production.
-- Rollback: see docs/departments-migrations.md (restoring the old policy
-- reintroduces the recursion, so rollback is only safe together with
-- rolling back 20261110150000).

drop policy if exists leadership_select on public.department_leadership;

create policy leadership_select on public.department_leadership
  for select to authenticated
  using (
    public.is_org_admin(organisation_id)
    or profile_id = auth.uid()
  );
