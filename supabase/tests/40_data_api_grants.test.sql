-- TEST-ONLY. Run by run-local.sh after 20_department_rls.test.sql (needs tests.*).
-- Since 30 Oct 2026 hosted Supabase gives new public tables NO automatic grants.
-- Note: has_table_privilege with a comma list is true if ANY privilege is held,
-- so positive checks test each privilege separately.
-- The shim (00_...) emulates that, so these checks prove the repository
-- migrations themselves grant exactly what the app needs - no more.
do $$
declare
  t text;
  rw text[] := array['church_departments','department_memberships','department_leadership','department_events'];
  own text[] := array['department_event_rsvps','member_scripture_bookmarks','member_hymn_favourites'];
  all_t text[] := rw || own || array['department_assignment_audit'];
begin
  foreach t in array rw loop
    perform tests.ok(has_table_privilege('authenticated', 'public.'||t, 'SELECT')
      and has_table_privilege('authenticated', 'public.'||t, 'INSERT')
      and has_table_privilege('authenticated', 'public.'||t, 'UPDATE'), 'authenticated may select/insert/update '||t||' (RLS decides rows)');
    perform tests.ok(not has_table_privilege('authenticated', 'public.'||t, 'DELETE'), 'authenticated has no DELETE on '||t);
  end loop;
  foreach t in array own loop
    perform tests.ok(has_table_privilege('authenticated', 'public.'||t, 'SELECT') and has_table_privilege('authenticated', 'public.'||t, 'INSERT')
      and has_table_privilege('authenticated', 'public.'||t, 'UPDATE') and has_table_privilege('authenticated', 'public.'||t, 'DELETE'), 'authenticated may manage own rows in '||t);
  end loop;
  perform tests.ok(has_table_privilege('authenticated', 'public.department_assignment_audit', 'SELECT')
    and not has_table_privilege('authenticated', 'public.department_assignment_audit', 'INSERT,UPDATE,DELETE,TRUNCATE'), 'audit log is read-only for authenticated');
  foreach t in array all_t loop
    perform tests.ok(not has_table_privilege('anon', 'public.'||t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'), 'anon has no privilege on '||t);
    perform tests.ok(has_table_privilege('service_role', 'public.'||t, 'SELECT') and has_table_privilege('service_role', 'public.'||t, 'INSERT')
      and has_table_privilege('service_role', 'public.'||t, 'UPDATE') and has_table_privilege('service_role', 'public.'||t, 'DELETE'), 'service_role can use '||t);
    perform tests.ok((select relrowsecurity from pg_class where oid = ('public.'||t)::regclass), 'RLS still enabled on '||t);
  end loop;
end $$;

-- The app's real read paths, as a signed-in admin and as a member, must no longer fail with 42501.
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000a1');
  perform tests.lives($q$select id, name, slug, description, is_active, is_child_facing, archived_at from public.church_departments where organisation_id = '00000000-0000-4000-b000-000000000001' order by name$q$, 'admin listDepartments query succeeds');
  perform tests.lives($q$select m.id, m.status, m.origin, d.name from public.department_memberships m join public.church_departments d on d.id = m.department_id$q$, 'member my-departments query succeeds');
  perform tests.lives($q$select department_id, role from public.department_leadership$q$, 'leadership query succeeds');
  perform tests.lives($q$select id, title, starts_at from public.department_events$q$, 'events query succeeds');
  perform tests.lives($q$select event_id, status from public.department_event_rsvps$q$, 'rsvp query succeeds');
end $$;
