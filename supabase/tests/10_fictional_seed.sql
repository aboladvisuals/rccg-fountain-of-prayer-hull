-- TEST-ONLY fictional data (example.test addresses). Run as the database owner.
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-0000000000a1', 'admin@example.test'),
  ('00000000-0000-4000-a000-0000000000b1', 'leader@example.test'),
  ('00000000-0000-4000-a000-0000000000c1', 'deputy@example.test'),
  ('00000000-0000-4000-a000-0000000000d1', 'member@example.test'),
  ('00000000-0000-4000-a000-0000000000e1', 'nonmember@example.test'),
  ('00000000-0000-4000-a000-0000000000f1', 'joiner@example.test'),
  ('00000000-0000-4000-a000-0000000000f2', 'other-org@example.test');
insert into public.profiles (id, full_name, first_name, email)
  select id, initcap(split_part(email, '@', 1)) || ' Testperson', initcap(split_part(email, '@', 1)), email from auth.users;
insert into public.organisations (id, name, slug) values
  ('00000000-0000-4000-b000-000000000001', 'Fictional Test Parish', 'rccg-fountain-of-prayer-hull'),
  ('00000000-0000-4000-b000-000000000002', 'Other Fictional Parish', 'other-fictional-parish');
insert into public.organisation_memberships (organisation_id, profile_id, role, status) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000a1', 'admin', 'active'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000b1', 'member', 'active'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000c1', 'member', 'active'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000d1', 'member', 'active'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000e1', 'member', 'active'),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-0000000000f1', 'member', 'active'),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-0000000000f2', 'admin', 'active');
insert into public.church_departments (id, organisation_id, name, slug, is_active, is_child_facing) values
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 'Test Choir', 'test-choir', true, false),
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-b000-000000000001', 'Test Ushers', 'test-ushers', true, false),
  ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-b000-000000000001', 'Test Children', 'test-children', true, true),
  ('00000000-0000-4000-c000-000000000009', '00000000-0000-4000-b000-000000000002', 'Other Parish Choir', 'other-choir', true, false);
