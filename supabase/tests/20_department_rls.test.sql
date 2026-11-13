-- Department RLS regression suite. TEST-ONLY, fictional data, local database only.
-- Run after: 00_test_only_supabase_shim_and_stub_baseline.sql, every file in
-- supabase/migrations (in order), then 10_fictional_seed.sql.
-- Each assertion prints "PASS: ..." or aborts with "FAIL: ...".
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create or replace function tests.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;
create or replace function tests.ok(cond boolean, name text) returns void language plpgsql as $$
begin
  if cond is true then raise notice 'PASS: %', name; else raise exception 'FAIL: %', name; end if;
end $$;
create or replace function tests.lives(stmt text, name text) returns void language plpgsql as $$
begin
  execute stmt; raise notice 'PASS: %', name;
exception when others then raise exception 'FAIL: % (unexpected error: %)', name, sqlerrm;
end $$;
create or replace function tests.throws(stmt text, pattern text, name text) returns void language plpgsql as $$
declare failed boolean := false; msg text;
begin
  begin execute stmt; exception when others then failed := true; msg := sqlerrm; end;
  if not failed then raise exception 'FAIL: % (statement succeeded but should be refused)', name; end if;
  if pattern is not null and msg !~* pattern then raise exception 'FAIL: % (wrong error: %)', name, msg; end if;
  if msg ~* 'infinite recursion' then raise exception 'FAIL: % (recursion: %)', name, msg; end if;
  raise notice 'PASS: % [refused: %]', name, msg;
end $$;
create or replace function tests.n(q text) returns bigint language plpgsql as $$
declare c bigint; begin execute 'select count(*) from (' || q || ') s' into c; return c; end $$;
grant execute on all functions in schema tests to anon, authenticated;

-- fixed identifiers ---------------------------------------------------------
\set org   '''00000000-0000-4000-b000-000000000001'''
\set org2  '''00000000-0000-4000-b000-000000000002'''

-- Static check: no department policy reads department_memberships from a
-- department_leadership policy (the recursion that broke member assignment).
do $$ begin
  perform tests.ok(not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'department_leadership'
      and (coalesce(qual, '') ~ 'department_memberships' or coalesce(with_check, '') ~ 'department_memberships')),
    'department_leadership policies never read department_memberships');
end $$;

-- ADMINISTRATOR ---------------------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000a1');
  perform tests.lives($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000b1','active'),
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000c1','active'),
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000d1','active'),
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000002','00000000-0000-4000-a000-0000000000d1','active')$q$,
    'admin assigns members (the operation that hit infinite recursion before the fix)');
  perform tests.lives($q$insert into public.department_leadership (organisation_id, department_id, profile_id, role) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000b1','leader'),
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000c1','deputy')$q$,
    'admin appoints a leader and a deputy');
  perform tests.throws($q$insert into public.department_leadership (organisation_id, department_id, profile_id, role) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000e1','deputy')$q$,
    'active department membership', 'leadership requires an active membership');
  perform tests.throws($q$insert into public.department_leadership (organisation_id, department_id, profile_id, role) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000d1','leader')$q$,
    'duplicate key', 'only one active leader per department');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status) values
    ('00000000-0000-4000-b000-000000000002','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000e1','active')$q$,
    null, 'admin cannot write a membership into another organisation');
  perform tests.ok(tests.n('select 1 from public.department_memberships') = 4, 'admin reads all memberships without recursion');
  perform tests.ok(tests.n('select 1 from public.department_leadership') = 2, 'admin reads all leadership records');
  perform tests.ok(tests.n($q$select 1 from public.department_assignment_audit where action like 'leadership_insert%'$q$) = 2
    and tests.n($q$select 1 from public.department_assignment_audit where action like 'membership_insert%'$q$) = 4,
    'membership and leadership changes are audited');
  perform tests.ok((select changed_by from public.department_assignment_audit limit 1) = '00000000-0000-4000-a000-0000000000a1',
    'audit records who made the change');
  perform tests.throws($q$update public.organisation_memberships set role = 'member'
    where profile_id = '00000000-0000-4000-a000-0000000000a1'$q$, 'final active administrator', 'last-active-administrator protection still holds');
end $$;

-- ACTIVE DEPARTMENT LEADER ------------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000b1');
  perform tests.ok(tests.n($q$select 1 from public.department_memberships where department_id = '00000000-0000-4000-c000-000000000001'$q$) = 3,
    'leader reads own department roster (no recursion)');
  perform tests.ok(tests.n($q$select 1 from public.department_memberships where department_id = '00000000-0000-4000-c000-000000000002'$q$) = 0,
    'leader cannot read another department''s memberships');
  perform tests.ok(tests.n('select 1 from public.department_leadership') = 1, 'leader reads only their own leadership record');
  perform tests.ok(tests.n('select 1 from public.department_assignment_audit') = 0, 'leader cannot read the audit trail');
  perform tests.ok(tests.n($q$select 1 from public.department_roster('00000000-0000-4000-c000-000000000001')$q$) = 3, 'leader roster function: own department');
  perform tests.ok(tests.n($q$select 1 from public.department_roster('00000000-0000-4000-c000-000000000002')$q$) = 0, 'leader roster function: other department empty');
  perform tests.ok(tests.n($q$select 1 from public.department_invite_candidates('00000000-0000-4000-c000-000000000001')
     where profile_id = '00000000-0000-4000-a000-0000000000f1'$q$) = 1
    and tests.n($q$select 1 from public.department_invite_candidates('00000000-0000-4000-c000-000000000001')
     where profile_id = '00000000-0000-4000-a000-0000000000d1'$q$) = 0
    and tests.n($q$select 1 from public.department_invite_candidates('00000000-0000-4000-c000-000000000001')
     where profile_id = '00000000-0000-4000-a000-0000000000f2'$q$) = 0,
    'invite candidates: active church members not yet in the department, never other organisations');
  perform tests.throws($q$insert into public.department_leadership (organisation_id, department_id, profile_id, role) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000b1','deputy')$q$,
    'row-level security', 'leader cannot appoint themselves to a leadership role');
  perform tests.throws($q$insert into public.department_leadership (organisation_id, department_id, profile_id, role) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000d1','deputy')$q$,
    'row-level security', 'leader cannot appoint deputies (admin only)');
  update public.organisation_memberships set role = 'admin' where profile_id = '00000000-0000-4000-a000-0000000000b1';
  perform set_config('role', 'postgres', true);
  perform tests.ok((select role::text from public.organisation_memberships where profile_id = '00000000-0000-4000-a000-0000000000b1') = 'member',
    'leader cannot change their global application role');
  perform tests.login('00000000-0000-4000-a000-0000000000b1');
  perform tests.lives($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000f1','pending','leader_invite')$q$,
    'leader invites an existing church member');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000e1','active','admin')$q$,
    'row-level security', 'leader cannot directly activate a member');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000002','00000000-0000-4000-a000-0000000000e1','pending','leader_invite')$q$,
    'row-level security', 'leader cannot invite into a department they do not lead');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000f2','pending','leader_invite')$q$,
    'row-level security', 'leader cannot invite someone from another organisation');
  perform tests.throws($q$update public.department_memberships set status = 'inactive'
    where profile_id = '00000000-0000-4000-a000-0000000000c1' and department_id = '00000000-0000-4000-c000-000000000001'$q$,
    'administrator', 'leader cannot remove their deputy (admin only)');
  perform tests.throws($q$update public.department_memberships set status = 'inactive'
    where profile_id = '00000000-0000-4000-a000-0000000000b1' and department_id = '00000000-0000-4000-c000-000000000001'$q$,
    'administrator', 'leader cannot step down by editing their own membership');
  perform tests.lives($q$insert into public.department_events (organisation_id, department_id, title, starts_at, ends_at, venue) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','Fictional rehearsal A', now() + interval '2 days', now() + interval '2 days 2 hours', 'Test hall')$q$,
    'leader creates a rehearsal in their department');
  perform tests.ok((select created_by from public.department_events where title = 'Fictional rehearsal A') = '00000000-0000-4000-a000-0000000000b1',
    'event records its creator server-side');
  perform tests.throws($q$insert into public.department_events (organisation_id, department_id, title, starts_at, ends_at) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000002','Fictional ushers meeting', now() + interval '1 day', now() + interval '1 day 1 hour')$q$,
    'row-level security', 'leader cannot create events in another department');
end $$;

-- DEPUTY -------------------------------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000c1');
  perform tests.lives($q$insert into public.department_events (organisation_id, department_id, title, starts_at, ends_at) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','Fictional rehearsal B', now() + interval '5 days', now() + interval '5 days 2 hours')$q$,
    'deputy may manage department events');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000e1','pending','leader_invite')$q$,
    'row-level security', 'deputy cannot invite members (leader-only permission)');
  perform tests.ok(tests.n($q$select 1 from public.department_invite_candidates('00000000-0000-4000-c000-000000000001')$q$) = 0,
    'deputy gets no invite candidates');
  perform tests.ok(tests.n($q$select 1 from public.department_roster('00000000-0000-4000-c000-000000000001')$q$) = 4, 'deputy can view roster names');
end $$;

-- ORDINARY DEPARTMENT MEMBER ----------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000d1');
  perform tests.ok(tests.n('select 1 from public.department_memberships') = 2, 'member sees only their own memberships');
  perform tests.ok(tests.n('select 1 from public.department_leadership') = 0, 'member cannot list leadership records');
  perform tests.ok(tests.n($q$select 1 from public.department_events where department_id = '00000000-0000-4000-c000-000000000001'$q$) = 2,
    'member sees their department''s events');
  perform tests.ok(tests.n($q$select 1 from public.department_roster('00000000-0000-4000-c000-000000000001')$q$) = 0, 'member cannot read roster');
  perform tests.lives($q$insert into public.department_event_rsvps (organisation_id, event_id, profile_id, status)
    select organisation_id, id, '00000000-0000-4000-a000-0000000000d1', 'yes' from public.department_events where title = 'Fictional rehearsal A'$q$,
    'member RSVPs for themselves');
  perform tests.lives($q$update public.department_event_rsvps set status = 'maybe' where profile_id = '00000000-0000-4000-a000-0000000000d1'$q$,
    'member changes their own RSVP');
  perform tests.throws($q$insert into public.department_event_rsvps (organisation_id, event_id, profile_id, status)
    select organisation_id, id, '00000000-0000-4000-a000-0000000000b1', 'no' from public.department_events where title = 'Fictional rehearsal B'$q$,
    'row-level security|active department membership', 'member cannot RSVP for someone else');
  perform tests.throws($q$insert into public.department_events (organisation_id, department_id, title, starts_at, ends_at) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','Fictional', now() + interval '1 day', now() + interval '1 day 1 hour')$q$,
    'row-level security', 'ordinary member cannot create events');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','00000000-0000-4000-a000-0000000000d1','active','admin')$q$,
    'row-level security', 'member cannot self-enrol');
end $$;

-- INVITED MEMBER ------------------------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000f1');
  perform tests.ok(tests.n($q$select 1 from public.department_memberships where status = 'pending' and origin = 'leader_invite'$q$) = 1,
    'invited member sees their invitation');
  perform tests.throws($q$update public.department_memberships set status = 'active', origin = 'admin'
    where profile_id = '00000000-0000-4000-a000-0000000000f1'$q$, 'leader or administrator', 'invitation origin cannot be rewritten');
  perform tests.lives($q$update public.department_memberships set status = 'active'
    where profile_id = '00000000-0000-4000-a000-0000000000f1'$q$, 'invited member accepts');
end $$;

-- JOIN REQUESTS + NON-MEMBER ----------------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000e1');
  perform tests.ok(tests.n($q$select 1 from public.department_events$q$) = 0, 'non-member sees no department events');
  perform tests.ok(tests.n($q$select 1 from public.department_memberships$q$) = 0, 'non-member sees no memberships');
  perform tests.ok(tests.n($q$select 1 from public.department_event_rsvps$q$) = 0, 'non-member sees no RSVPs');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000002','00000000-0000-4000-a000-0000000000e1','pending','member_request')$q$,
    'row-level security', 'join requests refused while the admin has not enabled them');
  perform set_config('role', 'postgres', true);
  update public.church_departments set allow_join_requests = true where id in ('00000000-0000-4000-c000-000000000001','00000000-0000-4000-c000-000000000003');
  perform tests.login('00000000-0000-4000-a000-0000000000e1');
  perform tests.lives($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000e1','pending','member_request')$q$,
    'member requests to join where enabled');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','00000000-0000-4000-a000-0000000000e1','pending','member_request')$q$,
    'row-level security', 'child-facing departments never accept self-service requests');
  perform tests.throws($q$update public.department_memberships set status = 'active' where profile_id = '00000000-0000-4000-a000-0000000000e1'$q$,
    'leader or administrator', 'requester cannot approve their own request');
end $$;
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000b1');
  perform tests.lives($q$update public.department_memberships set status = 'active'
    where profile_id = '00000000-0000-4000-a000-0000000000e1' and department_id = '00000000-0000-4000-c000-000000000001'$q$,
    'leader approves a join request');
  perform tests.lives($q$update public.department_memberships set status = 'inactive'
    where profile_id = '00000000-0000-4000-a000-0000000000e1' and department_id = '00000000-0000-4000-c000-000000000001'$q$,
    'leader deactivates an ordinary member');
  perform tests.lives($q$update public.department_events set status = 'cancelled' where title = 'Fictional rehearsal B'$q$, 'leader cancels a rehearsal');
end $$;
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000d1');
  perform tests.throws($q$insert into public.department_event_rsvps (organisation_id, event_id, profile_id, status)
    select organisation_id, id, '00000000-0000-4000-a000-0000000000d1', 'yes' from public.department_events where title = 'Fictional rehearsal B'$q$,
    'cancelled', 'no RSVP to a cancelled rehearsal');
end $$;

-- CHILD-FACING PRIVACY ---------------------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000a1');
  insert into public.department_memberships (organisation_id, department_id, profile_id, status) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','00000000-0000-4000-a000-0000000000b1','active'),
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','00000000-0000-4000-a000-0000000000d1','active');
  insert into public.department_leadership (organisation_id, department_id, profile_id, role) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','00000000-0000-4000-a000-0000000000b1','leader');
  perform tests.login('00000000-0000-4000-a000-0000000000b1');
  perform tests.ok(tests.n($q$select 1 from public.department_memberships where department_id = '00000000-0000-4000-c000-000000000003'$q$) = 1,
    'child-facing: leader sees only their own row, not the roster');
  perform tests.ok(tests.n($q$select 1 from public.department_roster('00000000-0000-4000-c000-000000000003')$q$) = 0,
    'child-facing: roster function returns nothing to leaders');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status, origin) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000003','00000000-0000-4000-a000-0000000000f1','pending','leader_invite')$q$,
    'row-level security', 'child-facing: leaders cannot invite (admin only)');
end $$;

-- ADMIN CORRECTION + LEADERSHIP CASCADE -------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000a1');
  perform tests.lives($q$update public.department_memberships set status = 'inactive'
    where profile_id = '00000000-0000-4000-a000-0000000000c1' and department_id = '00000000-0000-4000-c000-000000000001'$q$,
    'admin removes the deputy''s membership');
  perform tests.ok((select is_active from public.department_leadership where profile_id = '00000000-0000-4000-a000-0000000000c1') = false,
    'ending a membership ends the leadership role');
  perform tests.login('00000000-0000-4000-a000-0000000000c1');
  perform tests.throws($q$insert into public.department_events (organisation_id, department_id, title, starts_at, ends_at) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','Fictional', now() + interval '1 day', now() + interval '1 day 1 hour')$q$,
    'row-level security', 'former deputy loses event permissions');
end $$;

-- OTHER ORGANISATION -------------------------------------------------------------------
do $$ begin
  perform tests.login('00000000-0000-4000-a000-0000000000f2');
  perform tests.ok(tests.n('select 1 from public.department_memberships') = 0, 'other organisation admin sees none of our memberships');
  perform tests.ok(tests.n('select 1 from public.department_events') = 0, 'other organisation admin sees none of our events');
  perform tests.throws($q$insert into public.department_events (organisation_id, department_id, title, starts_at, ends_at) values
    ('00000000-0000-4000-b000-000000000002','00000000-0000-4000-c000-000000000001','Fictional', now() + interval '1 day', now() + interval '1 day 1 hour')$q$,
    null, 'cannot attach an event to another organisation''s department');
end $$;

-- UNAUTHENTICATED VISITOR -----------------------------------------------------------------
do $$ begin
  perform tests.anon();
  perform tests.ok(tests.n('select 1 from public.church_departments') = 0
    and tests.n('select 1 from public.department_memberships') = 0
    and tests.n('select 1 from public.department_leadership') = 0
    and tests.n('select 1 from public.department_events') = 0
    and tests.n('select 1 from public.department_event_rsvps') = 0
    and tests.n('select 1 from public.department_assignment_audit') = 0, 'anon reads no department data');
  perform tests.throws($q$select * from public.department_roster('00000000-0000-4000-c000-000000000001')$q$, 'permission denied', 'anon cannot call roster function');
  perform tests.throws($q$insert into public.department_memberships (organisation_id, department_id, profile_id, status) values
    ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-0000000000e1','active')$q$,
    null, 'anon cannot write memberships');
end $$;

-- Security-definer hygiene: every SECURITY DEFINER function in public pins search_path.
do $$ begin
  perform tests.ok(not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')),
    'all security definer functions set search_path');
end $$;
