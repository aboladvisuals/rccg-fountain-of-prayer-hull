-- Department foundation. Apply to staging only until owner approves production.

create table if not exists public.church_departments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  location_id uuid references public.church_locations(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default false,
  is_child_facing boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organisation_id, slug)
);

create table if not exists public.department_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  department_id uuid not null references public.church_departments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'inactive')),
  effective_from date,
  effective_to date,
  notes text,
  created_at timestamptz not null default now(),
  unique (department_id, profile_id)
);

create unique index if not exists department_memberships_one_active
  on public.department_memberships (department_id, profile_id)
  where status = 'active';

create table if not exists public.department_leadership (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  department_id uuid not null references public.church_departments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('leader', 'deputy')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (department_id, profile_id, role)
);

create unique index if not exists department_one_active_leader
  on public.department_leadership (department_id)
  where role = 'leader' and is_active;

create table if not exists public.department_assignment_audit (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  department_id uuid,
  profile_id uuid,
  action text not null,
  changed_by uuid references public.profiles(id),
  old_status text,
  new_status text,
  created_at timestamptz not null default now()
);

create table if not exists public.department_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  department_id uuid not null references public.church_departments(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled', 'rescheduled')),
  recurrence_rule text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.department_event_rsvps (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid not null references public.department_events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

create table if not exists public.member_scripture_bookmarks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  bible_id text not null,
  passage_id text not null,
  reference text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.member_hymn_favourites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hymn_number integer not null,
  title text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, hymn_number)
);

create index if not exists church_departments_org_active_idx
  on public.church_departments (organisation_id, is_active);
create index if not exists department_memberships_dept_status_idx
  on public.department_memberships (department_id, status);
create index if not exists department_memberships_profile_idx
  on public.department_memberships (profile_id);
create index if not exists department_events_dept_starts_idx
  on public.department_events (department_id, starts_at);
create index if not exists department_audit_org_created_idx
  on public.department_assignment_audit (organisation_id, created_at desc);

create or replace function public.assert_department_leader_membership()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.department_memberships m
    where m.department_id = new.department_id
      and m.profile_id = new.profile_id
      and m.status = 'active'
  ) then
    raise exception 'Leadership requires an active department membership';
  end if;
  return new;
end;
$$;

drop trigger if exists assert_department_leader_membership on public.department_leadership;
create trigger assert_department_leader_membership
before insert or update on public.department_leadership
for each row execute function public.assert_department_leader_membership();

create or replace function public.assert_rsvp_membership()
returns trigger language plpgsql as $$
declare
  dept uuid;
begin
  select department_id into dept from public.department_events where id = new.event_id;
  if not exists (
    select 1 from public.department_memberships m
    where m.department_id = dept
      and m.profile_id = new.profile_id
      and m.status = 'active'
  ) then
    raise exception 'RSVP requires active department membership';
  end if;
  return new;
end;
$$;

drop trigger if exists assert_rsvp_membership on public.department_event_rsvps;
create trigger assert_rsvp_membership
before insert or update on public.department_event_rsvps
for each row execute function public.assert_rsvp_membership();

alter table public.church_departments enable row level security;
alter table public.department_memberships enable row level security;
alter table public.department_leadership enable row level security;
alter table public.department_assignment_audit enable row level security;
alter table public.department_events enable row level security;
alter table public.department_event_rsvps enable row level security;
alter table public.member_scripture_bookmarks enable row level security;
alter table public.member_hymn_favourites enable row level security;

create policy departments_select on public.church_departments
  for select to authenticated
  using (
    public.is_org_admin(organisation_id)
    or exists (
      select 1 from public.organisation_memberships om
      where om.organisation_id = church_departments.organisation_id
        and om.profile_id = auth.uid()
        and om.status = 'active'
    )
  );

create policy departments_write on public.church_departments
  for all to authenticated
  using (public.is_org_admin(organisation_id))
  with check (public.is_org_admin(organisation_id));

create policy memberships_select on public.department_memberships
  for select to authenticated
  using (
    public.is_org_admin(organisation_id)
    or profile_id = auth.uid()
    or (
      exists (
        select 1 from public.department_leadership dl
        where dl.department_id = department_memberships.department_id
          and dl.profile_id = auth.uid()
          and dl.is_active
      )
      and not exists (
        select 1 from public.church_departments d
        where d.id = department_memberships.department_id
          and d.is_child_facing
      )
    )
  );

create policy memberships_write on public.department_memberships
  for all to authenticated
  using (public.is_org_admin(organisation_id))
  with check (public.is_org_admin(organisation_id));

create policy leadership_select on public.department_leadership
  for select to authenticated
  using (
    public.is_org_admin(organisation_id)
    or exists (
      select 1 from public.department_memberships m
      where m.department_id = department_leadership.department_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
    )
  );

create policy leadership_write on public.department_leadership
  for all to authenticated
  using (public.is_org_admin(organisation_id))
  with check (public.is_org_admin(organisation_id));

create policy audit_select on public.department_assignment_audit
  for select to authenticated
  using (public.is_org_admin(organisation_id));

revoke insert, update, delete on public.department_assignment_audit from authenticated;

create policy events_select on public.department_events
  for select to authenticated
  using (
    public.is_org_admin(organisation_id)
    or exists (
      select 1 from public.department_memberships m
      where m.department_id = department_events.department_id
        and m.profile_id = auth.uid()
        and m.status = 'active'
    )
  );

create policy events_write on public.department_events
  for all to authenticated
  using (
    public.is_org_admin(organisation_id)
    or exists (
      select 1 from public.department_leadership dl
      where dl.department_id = department_events.department_id
        and dl.profile_id = auth.uid()
        and dl.is_active
    )
  )
  with check (
    public.is_org_admin(organisation_id)
    or exists (
      select 1 from public.department_leadership dl
      where dl.department_id = department_events.department_id
        and dl.profile_id = auth.uid()
        and dl.is_active
    )
  );

create policy rsvps_select on public.department_event_rsvps
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_org_admin(organisation_id)
    or exists (
      select 1 from public.department_events e
      join public.department_leadership dl on dl.department_id = e.department_id
      where e.id = department_event_rsvps.event_id
        and dl.profile_id = auth.uid()
        and dl.is_active
    )
  );

create policy rsvps_write on public.department_event_rsvps
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy bookmarks_own on public.member_scripture_bookmarks
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy favourites_own on public.member_hymn_favourites
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

insert into public.church_departments (organisation_id, name, slug, is_active, is_child_facing)
select o.id, v.name, v.slug, false, v.child
from public.organisations o
cross join (values
  ('Choir and Worship', 'choir-and-worship', false),
  ('Media and Technical', 'media-and-technical', false),
  ('Ushering and Hospitality', 'ushering-and-hospitality', false),
  ('Prayer and Intercession', 'prayer-and-intercession', false),
  ('Children''s Ministry', 'childrens-ministry', true),
  ('Youth and Young Adults', 'youth-and-young-adults', false),
  ('Sunday School and Bible Study', 'sunday-school', false),
  ('Welfare and Member Care', 'welfare', false),
  ('Evangelism and Outreach', 'evangelism', false),
  ('Follow-up and New Converts', 'follow-up', false),
  ('Events and Protocol', 'events-and-protocol', false),
  ('Administration', 'administration', false),
  ('Finance and Stewardship', 'finance', false),
  ('Sanitation and Facilities', 'sanitation', false),
  ('Security and Safety', 'security', false),
  ('Transport and Logistics', 'transport', false),
  ('Men''s Fellowship', 'mens-fellowship', false),
  ('Women''s Fellowship', 'womens-fellowship', false)
) as v(name, slug, child)
on conflict (organisation_id, slug) do nothing;
