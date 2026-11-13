-- Membership statistics suite. Runs after 20_department_rls.test.sql (reuses its
-- tests.* helpers and the state it leaves). TEST-ONLY, fictional data.
\set ON_ERROR_STOP 1
-- State after suite 20 (org 1): 6 registered members (all active).
-- Active dept memberships: choir = leader, member, invited joiner (deputy and requester
-- deactivated); ushers = member; children = leader, member.
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-0000000000a2', 'pastor@example.test'),
  ('00000000-0000-4000-a000-0000000000a3', 'usher-lead@example.test'),
  ('00000000-0000-4000-a000-0000000000a4', 'lapsed@example.test');
insert into public.profiles (id, full_name, first_name, email)
  select id, 'Fictional ' || split_part(email, '@', 1), 'Fictional', email from auth.users
  where id in ('00000000-0000-4000-a000-0000000000a2','00000000-0000-4000-a000-0000000000a3','00000000-0000-4000-a000-0000000000a4');
insert into public.organisation_memberships (organisation_id, profile_id, role, status) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000a2', 'pastor', 'active'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000a3', 'member', 'active'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000a4', 'member', 'inactive')
-- Since 20261113130000 creating a profile already creates an inactive record
-- awaiting a role; this upsert is the admin assigning each person's access.
on conflict (organisation_id, profile_id) do update set role = excluded.role, status = excluded.status, awaiting_role = false;
insert into public.church_departments (id, organisation_id, name, slug, is_active) values
  ('00000000-0000-4000-c000-000000000004', '00000000-0000-4000-b000-000000000001', 'Ushering and Hospitality', 'ushering-and-hospitality', true);
insert into public.department_memberships (organisation_id, department_id, profile_id, status) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-c000-000000000004', '00000000-0000-4000-a000-0000000000a3', 'active');
insert into public.department_leadership (organisation_id, department_id, profile_id, role) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-c000-000000000004', '00000000-0000-4000-a000-0000000000a3', 'leader');
insert into public.family_members (organisation_id, first_name, relationship) values
  ('00000000-0000-4000-b000-000000000001', 'Fictional child', 'child'),
  ('00000000-0000-4000-b000-000000000002', 'Other parish dependant', 'child');

do $$
declare s jsonb;
begin
  -- ADMIN
  perform tests.login('00000000-0000-4000-a000-0000000000a1');
  s := public.church_membership_stats('00000000-0000-4000-b000-000000000001');
  raise notice 'stats as admin: %', s;
  perform tests.ok((s->>'registered_total')::int = 9, 'registered total counts each organisation member once (9)');
  perform tests.ok((s->'by_status'->>'active')::int = 8 and (s->'by_status'->>'inactive')::int = 1, 'active/inactive from membership status');
  perform tests.ok((s->>'family_members_total')::int = 1, 'family members counted separately and only for this organisation');
  perform tests.ok((s->>'gender_recorded')::boolean = false and (s->>'age_recorded')::boolean = false, 'gender and age reported as not recorded (no schema support)');
  -- active members with an active dept membership: leader b1, member d1, joiner f1, usher-lead a3 (distinct) = 4
  perform tests.ok((s->>'assigned_active_members')::int = 4, 'people in several departments counted once');
  perform tests.ok((s->>'not_assigned_active_members')::int = 4, 'active members without a department (admin, deputy, non-member, pastor)');
  perform tests.ok((select (d->>'active_members')::int from jsonb_array_elements(s->'departments') d where d->>'name' = 'Test Choir') = 3, 'choir department total');
  perform tests.ok(s::text !~ 'example\.test|Testperson|Fictional', 'no personal data in the result');
  -- PASTOR
  perform tests.login('00000000-0000-4000-a000-0000000000a2');
  perform tests.ok((public.church_membership_stats('00000000-0000-4000-b000-000000000001')->>'registered_total')::int = 9, 'pastor sees church-wide totals');
  -- USHERING LEADER
  perform tests.login('00000000-0000-4000-a000-0000000000a3');
  perform tests.ok((public.church_membership_stats('00000000-0000-4000-b000-000000000001')->>'registered_total')::int = 9, 'ushering leader sees aggregate totals');
  perform tests.ok(tests.n('select 1 from public.profiles') = 1, 'ushering leader still cannot read other profiles');
end $$;

do $$ begin
  -- other department leader / member / other org / anon are refused
  perform tests.login('00000000-0000-4000-a000-0000000000b1');
  perform tests.throws($q$select public.church_membership_stats('00000000-0000-4000-b000-000000000001')$q$, 'Not authorised', 'choir leader cannot see church-wide statistics');
  perform tests.ok((select active_members from public.department_membership_stats('00000000-0000-4000-c000-000000000001')) = 3, 'choir leader sees own department total');
  perform tests.throws($q$select * from public.department_membership_stats('00000000-0000-4000-c000-000000000004')$q$, 'Not authorised', 'choir leader cannot see ushering department totals');
  perform tests.login('00000000-0000-4000-a000-0000000000d1');
  perform tests.throws($q$select public.church_membership_stats('00000000-0000-4000-b000-000000000001')$q$, 'Not authorised', 'ordinary member refused');
  perform tests.throws($q$select * from public.department_membership_stats('00000000-0000-4000-c000-000000000001')$q$, 'Not authorised', 'ordinary member refused department totals');
  perform tests.login('00000000-0000-4000-a000-0000000000f2');
  perform tests.throws($q$select public.church_membership_stats('00000000-0000-4000-b000-000000000001')$q$, 'Not authorised', 'other organisation admin refused');
  perform tests.anon();
  perform tests.throws($q$select public.church_membership_stats('00000000-0000-4000-b000-000000000001')$q$, 'permission denied', 'anon cannot call');
end $$;

-- Live reconciliation: change data, totals follow without any stored figures.
do $$ declare s jsonb; begin
  perform tests.login('00000000-0000-4000-a000-0000000000a1');
  update public.department_memberships set status = 'inactive'
    where profile_id = '00000000-0000-4000-a000-0000000000a3' and department_id = '00000000-0000-4000-c000-000000000004';
  s := public.church_membership_stats('00000000-0000-4000-b000-000000000001');
  perform tests.ok((s->>'assigned_active_members')::int = 3 and (s->>'not_assigned_active_members')::int = 5, 'deactivating an assignment updates totals immediately');
end $$;
