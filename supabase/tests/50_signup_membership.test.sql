-- Sign-up membership records (20261113130000). TEST-ONLY, fictional data.
-- Runs after 40_data_api_grants.test.sql (reuses tests.* helpers and state).
-- A real sign-up is: GoTrue inserts auth.users, then the existing baseline
-- trigger inserts public.profiles. That baseline trigger is not in this
-- repository, so each sign-up below inserts both rows as the database owner.
\set ON_ERROR_STOP 1

-- Static: least privilege ------------------------------------------------------
do $$ begin
  perform tests.ok(exists (select 1 from pg_trigger t
      where t.tgrelid = 'public.profiles'::regclass and t.tgname = 'create_signup_membership' and not t.tgisinternal),
    'sign-up trigger is attached to public.profiles');
  perform tests.ok((select prosecdef from pg_proc where oid = 'public.create_signup_membership()'::regprocedure),
    'sign-up function is SECURITY DEFINER');
  perform tests.ok((select proconfig @> array['search_path=public'] from pg_proc where oid = 'public.create_signup_membership()'::regprocedure),
    'sign-up function has a pinned search_path');
  perform tests.ok(not has_function_privilege('anon', 'public.create_signup_membership()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.create_signup_membership()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.clear_awaiting_role()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.clear_awaiting_role()', 'EXECUTE'),
    'browser roles cannot call the trigger functions');
  perform tests.ok((select relrowsecurity from pg_class where oid = 'public.organisation_memberships'::regclass),
    'RLS still enabled on organisation_memberships');
  perform tests.ok(not exists (select 1 from public.organisation_memberships where awaiting_role),
    'existing seeded memberships are not marked as awaiting a role');
end $$;

-- A brand-new sign-up ----------------------------------------------------------
insert into auth.users (id, email) values ('00000000-0000-4000-a000-0000000000a9', 'newcomer@example.test');
insert into public.profiles (id, email) values ('00000000-0000-4000-a000-0000000000a9', 'newcomer@example.test');

do $$
declare m record;
begin
  select * into m from public.organisation_memberships where profile_id = '00000000-0000-4000-a000-0000000000a9';
  perform tests.ok(m.organisation_id = '00000000-0000-4000-b000-000000000001', 'sign-up gets a record for the Hull church only');
  perform tests.ok(m.role = 'member' and m.status = 'inactive' and m.awaiting_role,
    'record has the lowest role, inactive status and is awaiting a role');
  perform tests.ok(tests.n($q$select 1 from public.organisation_memberships where profile_id = '00000000-0000-4000-a000-0000000000a9'$q$) = 1,
    'exactly one record, none for other organisations');
  perform tests.ok(exists (select 1 from public.membership_audit_log
      where target_profile_id = '00000000-0000-4000-a000-0000000000a9' and action = 'insert' and changed_by is null),
    'record creation is in the membership audit log');
  perform tests.ok((select full_name is null and first_name is null from public.profiles where id = '00000000-0000-4000-a000-0000000000a9'),
    'no names are invented for the new profile');
end $$;

-- What the pending sign-up can do (nothing beyond an unassigned person) -------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000a9');
  perform tests.ok(tests.n('select 1 from public.organisation_memberships') = 1
    and (select awaiting_role from public.organisation_memberships) = true,
    'pending sign-up sees only their own record (so the dashboard can say a role is coming)');
  perform tests.ok(not public.is_org_admin('00000000-0000-4000-b000-000000000001')
    and not public.is_org_media_or_staff('00000000-0000-4000-b000-000000000001')
    and not public.is_org_pastor_or_admin('00000000-0000-4000-b000-000000000001'),
    'pending sign-up has no admin, pastor or media access');
  perform tests.ok(tests.n('select 1 from public.profiles') = 1, 'pending sign-up cannot read other profiles');
  perform tests.ok(tests.n('select 1 from public.church_departments') = 0, 'pending sign-up cannot list departments');
  perform tests.throws($q$select public.church_membership_stats('00000000-0000-4000-b000-000000000001')$q$, 'Not authorised',
    'pending sign-up cannot read membership statistics');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000a9','pending','member_request')$q$,
    null, 'pending sign-up cannot request to join a department');
  update public.organisation_memberships set status = 'active', role = 'admin'
    where profile_id = '00000000-0000-4000-a000-0000000000a9';
  update public.organisation_memberships set awaiting_role = false
    where profile_id = '00000000-0000-4000-a000-0000000000a9';
  perform set_config('role', 'postgres', true);
  perform tests.ok((select role = 'member' and status = 'inactive' and awaiting_role from public.organisation_memberships
      where profile_id = '00000000-0000-4000-a000-0000000000a9'),
    'pending sign-up cannot activate, promote or un-flag themselves');
end $$;

do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000b1');
  perform tests.ok(tests.n($q$select 1 from public.department_invite_candidates('00000000-0000-4000-c000-000000000001')
     where profile_id = '00000000-0000-4000-a000-0000000000a9'$q$) = 0,
    'department leaders cannot invite someone still awaiting a role');
end $$;

-- The admin sees the sign-up and assigns the role ----------------------------
do $$
declare s jsonb;
begin
  perform tests.login('00000000-0000-4000-a000-0000000000a1');
  perform tests.ok(tests.n($q$select 1 from public.organisation_memberships m join public.profiles p on p.id = m.profile_id
      where m.awaiting_role and p.email = 'newcomer@example.test'$q$) = 1,
    'admin sees the new sign-up, with email, awaiting a role (the /admin/users query)');
  s := public.church_membership_stats('00000000-0000-4000-b000-000000000001');
  perform tests.ok((s->>'registered_total')::int = 9 and (s->>'awaiting_role_total')::int = 1,
    'statistics leave sign-ups awaiting a role out of the registered total and count them separately');
  update public.organisation_memberships set status = 'active'
    where profile_id = '00000000-0000-4000-a000-0000000000a9';
  perform tests.ok((select status = 'active' and role = 'member' and not awaiting_role from public.organisation_memberships
      where profile_id = '00000000-0000-4000-a000-0000000000a9'),
    'admin activates the member and the awaiting flag clears automatically');
  perform tests.ok(exists (select 1 from public.membership_audit_log
      where target_profile_id = '00000000-0000-4000-a000-0000000000a9' and action = 'update'
        and changed_by = '00000000-0000-4000-a000-0000000000a1' and new_status = 'active'),
    'the assignment is audited with the admin as the actor');
  s := public.church_membership_stats('00000000-0000-4000-b000-000000000001');
  perform tests.ok((s->>'registered_total')::int = 10 and (s->>'awaiting_role_total')::int = 0,
    'once assigned, the person counts as a registered member');
  perform tests.ok(public.is_active_org_member('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000a9'),
    'after assignment they are an active member like any other');
end $$;

-- Backfill and idempotency -----------------------------------------------------
-- A profile created before the migration (trigger disabled to simulate it).
alter table public.profiles disable trigger create_signup_membership;
insert into auth.users (id, email) values ('00000000-0000-4000-a000-0000000000aa', 'earlier@example.test');
insert into public.profiles (id, email) values ('00000000-0000-4000-a000-0000000000aa', 'earlier@example.test');
alter table public.profiles enable trigger create_signup_membership;
create temp table before_rerun as
  select profile_id, organisation_id, role, status, awaiting_role from public.organisation_memberships;
\ir ../migrations/20261113130000_signup_membership_records.sql
do $$ begin
  perform tests.ok((select role = 'member' and status = 'inactive' and awaiting_role from public.organisation_memberships
      where profile_id = '00000000-0000-4000-a000-0000000000aa' and organisation_id = '00000000-0000-4000-b000-000000000001'),
    'backfill gives an earlier sign-up without a record an inactive record awaiting a role');
  perform tests.ok(not exists (
      select profile_id, organisation_id, role, status, awaiting_role from before_rerun
      except select profile_id, organisation_id, role, status, awaiting_role from public.organisation_memberships),
    're-running the migration leaves every existing membership unchanged');
  -- The fixture's other-parish admin also has no Hull record. This app serves a
  -- single church, so every profile without a Hull record is backfilled: 2 rows.
  perform tests.ok(tests.n('select 1 from public.organisation_memberships') = tests.n('select 1 from before_rerun') + 2,
    're-running the migration adds only the missing records, no duplicates');
  perform tests.ok((select status = 'active' and role = 'admin' from public.organisation_memberships
      where profile_id = '00000000-0000-4000-a000-0000000000f2' and organisation_id = '00000000-0000-4000-b000-000000000002'),
    'memberships in another organisation are never changed');
end $$;
