-- Explicit Data API grants for the department tables.
--
-- Why: since 30 Oct 2026 Supabase no longer grants new public-schema tables to
-- anon / authenticated / service_role automatically. The department tables
-- (20261110150000_add_departments) were created after that change in
-- production, so every supabase-js query from a signed-in user fails with
-- 42501 "permission denied for table ...", and pages that throw on a query
-- error (e.g. /admin/departments) crash with a Next.js error digest.
--
-- What: grants only. RLS stays enabled and every existing policy still
-- decides which rows each signed-in user may see or change. Nothing is
-- granted to anon. Idempotent: safe to run more than once.

-- Signed-in users (RLS decides rows) ----------------------------------------
grant select, insert, update on table public.church_departments      to authenticated;
grant select, insert, update on table public.department_memberships  to authenticated;
grant select, insert, update on table public.department_leadership   to authenticated;
grant select, insert, update on table public.department_events       to authenticated;
grant select, insert, update, delete on table public.department_event_rsvps     to authenticated;
grant select, insert, update, delete on table public.member_scripture_bookmarks to authenticated;
grant select, insert, update, delete on table public.member_hymn_favourites     to authenticated;

-- Audit log is written only by SECURITY DEFINER triggers; users may only read
-- (RLS: admins). 20261110150000 already revokes insert/update/delete.
grant select on table public.department_assignment_audit to authenticated;
revoke insert, update, delete, truncate on table public.department_assignment_audit from authenticated;

-- Server-side service role (bypasses RLS; never shipped to browsers) ----------
grant select, insert, update, delete on table
  public.church_departments,
  public.department_memberships,
  public.department_leadership,
  public.department_events,
  public.department_event_rsvps,
  public.department_assignment_audit,
  public.member_scripture_bookmarks,
  public.member_hymn_favourites
to service_role;

-- Make sure the public (anon) key cannot read any of these tables.
revoke all on table
  public.church_departments,
  public.department_memberships,
  public.department_leadership,
  public.department_events,
  public.department_event_rsvps,
  public.department_assignment_audit,
  public.member_scripture_bookmarks,
  public.member_hymn_favourites
from anon;

-- Ask PostgREST to reload its schema cache so the grants apply immediately.
notify pgrst, 'reload schema';
