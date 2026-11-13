-- Department ministry workspace (P1). Staging / isolated local lab only until
-- the owner approves production. Depends on 20261110150000_add_departments.sql
-- and 20261113090000_fix_department_leadership_rls_recursion.sql.
--
-- Small, explicit extension of the existing Departments model:
--   * church_departments.allow_join_requests  (admin-controlled, default off)
--   * department_memberships.origin           (admin | leader_invite | member_request)
--     so an invitation and a join request are never confused with each other
--     or with a plain admin assignment (all three still use status 'pending').
--   * department_events.created_by / updated_at, rsvp updated_at.
-- No new global application roles. admin/pastor/media/member are unchanged.
--
-- Permission model (all server-side, enforced by RLS + triggers):
--   Administrator : everything (existing policies), incl. leader/deputy appointment.
--   Leader        : own department only, never child-facing departments:
--                   invite existing active church members, approve/decline join
--                   requests, deactivate ordinary members, re-invite. Cannot touch
--                   anyone who holds leadership, cannot touch their own row, cannot
--                   write department_leadership, cannot change global roles.
--   Deputy        : manage department events (existing events_write policy) and
--                   read RSVPs. No membership management.
--   Member        : accept/decline own invitations, request to join departments
--                   where the admin enabled requests, leave (unless they hold
--                   leadership), RSVP for themselves only.
-- Every membership and leadership change is written to
-- department_assignment_audit by trigger.
-- No policy added here reads another RLS-protected department table in a way
-- that can loop back to department_memberships (see regression tests).

-- 1. Schema extension ---------------------------------------------------------
alter table public.church_departments
  add column if not exists allow_join_requests boolean not null default false;

alter table public.department_memberships
  add column if not exists origin text not null default 'admin',
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'department_memberships_origin_check') then
    alter table public.department_memberships
      add constraint department_memberships_origin_check
      check (origin in ('admin', 'leader_invite', 'member_request'));
  end if;
end $$;

alter table public.department_events
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.department_event_rsvps
  add column if not exists updated_at timestamptz not null default now();

-- 2. Minimal security-definer helpers -------------------------------------------
-- True only when the CALLER and the target are both active members of org.
create or replace function public.is_active_org_member(org uuid, target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from public.organisation_memberships c
      where c.organisation_id = org and c.profile_id = auth.uid() and c.status = 'active')
    and exists (
      select 1 from public.organisation_memberships t
      where t.organisation_id = org and t.profile_id = target and t.status = 'active')
$$;

-- Display-name roster for a department. Admins: any department of their org.
-- Active leader/deputy: own department, never child-facing. Names only, no
-- email/phone, so leaders never see contact details through this function.
create or replace function public.department_roster(p_department uuid)
returns table (
  membership_id uuid, profile_id uuid, display_name text,
  status text, origin text, leadership_role text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select m.id, m.profile_id,
         coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.first_name), ''), 'Church member'),
         m.status, m.origin,
         (select dl.role from public.department_leadership dl
           where dl.department_id = m.department_id and dl.profile_id = m.profile_id and dl.is_active
           order by dl.role = 'leader' desc limit 1),
         m.created_at
  from public.department_memberships m
  join public.church_departments d on d.id = m.department_id
  left join public.profiles p on p.id = m.profile_id
  where m.department_id = p_department
    and (
      public.is_org_admin(d.organisation_id)
      or (
        not d.is_child_facing
        and exists (
          select 1 from public.department_leadership dl
          where dl.department_id = d.id and dl.profile_id = auth.uid() and dl.is_active)
        and exists (
          select 1 from public.department_memberships me
          where me.department_id = d.id and me.profile_id = auth.uid() and me.status = 'active')
      )
    )
  order by m.status, 3
$$;

-- Active church members a LEADER may invite (not already active/pending).
create or replace function public.department_invite_candidates(p_department uuid)
returns table (profile_id uuid, display_name text)
language sql stable security definer set search_path = public as $$
  select om.profile_id,
         coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.first_name), ''), 'Church member')
  from public.church_departments d
  join public.organisation_memberships om
    on om.organisation_id = d.organisation_id and om.status = 'active'
  left join public.profiles p on p.id = om.profile_id
  where d.id = p_department
    and d.is_active and not d.is_child_facing
    and exists (
      select 1 from public.department_leadership dl
      where dl.department_id = d.id and dl.profile_id = auth.uid()
        and dl.role = 'leader' and dl.is_active)
    and not exists (
      select 1 from public.department_memberships m
      where m.department_id = d.id and m.profile_id = om.profile_id
        and m.status in ('active', 'pending'))
  order by 2
$$;

revoke all on function public.is_active_org_member(uuid, uuid) from public, anon;
revoke all on function public.department_roster(uuid) from public, anon;
revoke all on function public.department_invite_candidates(uuid) from public, anon;
grant execute on function public.is_active_org_member(uuid, uuid) to authenticated;
grant execute on function public.department_roster(uuid) to authenticated;
grant execute on function public.department_invite_candidates(uuid) to authenticated;

-- 3. Organisation consistency (department rows can never cross organisations) --
create or replace function public.enforce_department_org_match()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dept_org uuid;
begin
  if tg_table_name = 'department_event_rsvps' then
    select organisation_id into dept_org from public.department_events where id = new.event_id;
  else
    select organisation_id into dept_org from public.church_departments where id = new.department_id;
  end if;
  if dept_org is null or dept_org <> new.organisation_id then
    raise exception 'Department record organisation mismatch';
  end if;
  if tg_op = 'UPDATE' then
    if new.organisation_id is distinct from old.organisation_id then
      raise exception 'A department record cannot be moved to another organisation';
    end if;
    if tg_table_name <> 'department_event_rsvps' then
      if new.department_id is distinct from old.department_id then
        raise exception 'A department record cannot be moved to another department';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_org_match on public.department_memberships;
create trigger enforce_org_match before insert or update on public.department_memberships
  for each row execute function public.enforce_department_org_match();
drop trigger if exists enforce_org_match on public.department_leadership;
create trigger enforce_org_match before insert or update on public.department_leadership
  for each row execute function public.enforce_department_org_match();
drop trigger if exists enforce_org_match on public.department_events;
create trigger enforce_org_match before insert or update on public.department_events
  for each row execute function public.enforce_department_org_match();
drop trigger if exists enforce_org_match on public.department_event_rsvps;
create trigger enforce_org_match before insert or update on public.department_event_rsvps
  for each row execute function public.enforce_department_org_match();

-- 4. Leadership: only ACTIVE leadership needs an active membership, so a
--    leadership record can be deactivated after the membership ends.
create or replace function public.assert_department_leader_membership()
returns trigger language plpgsql as $$
begin
  if new.is_active and not exists (
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

-- 5. Membership policies for leaders and members (admin policy unchanged) -------
drop policy if exists memberships_leader_invite on public.department_memberships;
create policy memberships_leader_invite on public.department_memberships
  for insert to authenticated
  with check (
    origin = 'leader_invite' and status = 'pending'
    and profile_id <> auth.uid()
    and exists (
      select 1 from public.department_leadership dl
      where dl.department_id = department_memberships.department_id
        and dl.profile_id = auth.uid() and dl.role = 'leader' and dl.is_active)
    and exists (
      select 1 from public.church_departments d
      where d.id = department_memberships.department_id
        and d.is_active and not d.is_child_facing)
    and public.is_active_org_member(organisation_id, profile_id)
  );

drop policy if exists memberships_member_request on public.department_memberships;
create policy memberships_member_request on public.department_memberships
  for insert to authenticated
  with check (
    profile_id = auth.uid() and origin = 'member_request' and status = 'pending'
    and exists (
      select 1 from public.church_departments d
      where d.id = department_memberships.department_id
        and d.is_active and d.allow_join_requests and not d.is_child_facing)
    and public.is_active_org_member(organisation_id, auth.uid())
  );

drop policy if exists memberships_leader_update on public.department_memberships;
create policy memberships_leader_update on public.department_memberships
  for update to authenticated
  using (
    profile_id <> auth.uid()
    and exists (
      select 1 from public.department_leadership dl
      where dl.department_id = department_memberships.department_id
        and dl.profile_id = auth.uid() and dl.role = 'leader' and dl.is_active)
    and exists (
      select 1 from public.church_departments d
      where d.id = department_memberships.department_id and not d.is_child_facing)
  )
  with check (
    profile_id <> auth.uid()
    and exists (
      select 1 from public.department_leadership dl
      where dl.department_id = department_memberships.department_id
        and dl.profile_id = auth.uid() and dl.role = 'leader' and dl.is_active)
  );

drop policy if exists memberships_member_update on public.department_memberships;
create policy memberships_member_update on public.department_memberships
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Transition rules for non-admin updates (RLS cannot see OLD values).
create or replace function public.guard_department_membership_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dept record;
  holds_leadership boolean;
begin
  new.updated_at := now();
  if new.profile_id is distinct from old.profile_id then
    raise exception 'A department membership cannot be reassigned to another person';
  end if;
  if public.is_org_admin(old.organisation_id) then
    return new;
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'Not allowed';
  end if;

  select * into dept from public.church_departments where id = old.department_id;
  select exists (
    select 1 from public.department_leadership dl
    where dl.department_id = old.department_id and dl.profile_id = old.profile_id and dl.is_active
  ) into holds_leadership;

  if old.profile_id = auth.uid() then
    -- Member acting on their own record.
    if old.status = 'pending' and old.origin = 'leader_invite'
       and new.status in ('active', 'inactive') and new.origin = old.origin then
      return new;                                   -- accept / decline invitation
    elsif old.status = 'active' and new.status = 'inactive' and new.origin = old.origin then
      if holds_leadership then
        raise exception 'Leaders and deputies must ask an administrator to step down';
      end if;
      return new;                                   -- leave department
    elsif old.status = 'inactive' and new.status = 'pending' and new.origin = 'member_request'
          and dept.is_active and dept.allow_join_requests and not dept.is_child_facing then
      return new;                                   -- request to re-join
    end if;
    raise exception 'This membership change needs a department leader or administrator';
  end if;

  -- Otherwise this is the department leader path (RLS already limited it to the
  -- active leader of this non-child-facing department).
  if holds_leadership then
    raise exception 'Only an administrator can change a leader or deputy membership';
  end if;
  if old.status = 'pending' and old.origin = 'member_request'
     and new.status in ('active', 'inactive') and new.origin = old.origin then
    return new;                                     -- approve / decline request
  elsif old.status = 'active' and new.status = 'inactive' and new.origin = old.origin then
    return new;                                     -- deactivate member
  elsif old.status = 'inactive' and new.status = 'pending' and new.origin = 'leader_invite'
        and dept.is_active then
    return new;                                     -- re-invite
  elsif old.status = 'pending' and old.origin = 'leader_invite'
        and new.status = 'inactive' and new.origin = old.origin then
    return new;                                     -- withdraw invitation
  end if;
  raise exception 'Department leaders cannot make this membership change';
end;
$$;

drop trigger if exists guard_department_membership_update on public.department_memberships;
create trigger guard_department_membership_update
  before update on public.department_memberships
  for each row execute function public.guard_department_membership_update();

-- When a membership stops being active, any leadership in that department ends.
create or replace function public.end_leadership_with_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'active' and new.status <> 'active' then
    update public.department_leadership set is_active = false
    where department_id = new.department_id and profile_id = new.profile_id and is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists end_leadership_with_membership on public.department_memberships;
create trigger end_leadership_with_membership
  after update on public.department_memberships
  for each row execute function public.end_leadership_with_membership();

-- 6. Audit trail ----------------------------------------------------------------
create or replace function public.audit_department_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r record;
  act text;
  old_s text;
  new_s text;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if tg_table_name = 'department_memberships' then
    act := 'membership_' || lower(tg_op) || ':' || r.origin;
    old_s := case when tg_op = 'INSERT' then null else old.status end;
    new_s := case when tg_op = 'DELETE' then null else new.status end;
    if tg_op = 'UPDATE' and old.status is not distinct from new.status
       and old.origin is not distinct from new.origin then
      return new;
    end if;
  else
    act := 'leadership_' || lower(tg_op) || ':' || r.role;
    old_s := case when tg_op = 'INSERT' then null
                  when old.is_active then 'active' else 'inactive' end;
    new_s := case when tg_op = 'DELETE' then null
                  when new.is_active then 'active' else 'inactive' end;
    if tg_op = 'UPDATE' and old.is_active = new.is_active and old.role = new.role then
      return new;
    end if;
  end if;
  insert into public.department_assignment_audit
    (organisation_id, department_id, profile_id, action, changed_by, old_status, new_status)
  values (r.organisation_id, r.department_id, r.profile_id, act, auth.uid(), old_s, new_s);
  return r;
end;
$$;

drop trigger if exists audit_department_membership on public.department_memberships;
create trigger audit_department_membership
  after insert or update or delete on public.department_memberships
  for each row execute function public.audit_department_change();
drop trigger if exists audit_department_leadership on public.department_leadership;
create trigger audit_department_leadership
  after insert or update or delete on public.department_leadership
  for each row execute function public.audit_department_change();

-- 7. Events and RSVPs -------------------------------------------------------------
create or replace function public.stamp_department_event()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists stamp_department_event on public.department_events;
create trigger stamp_department_event before insert or update on public.department_events
  for each row execute function public.stamp_department_event();

-- RSVP: active member of the event's department, event not cancelled and not over.
create or replace function public.assert_rsvp_membership()
returns trigger language plpgsql as $$
declare
  ev record;
begin
  select department_id, status, ends_at into ev from public.department_events where id = new.event_id;
  if ev.department_id is null then
    raise exception 'Event not found';
  end if;
  if tg_op = 'UPDATE' and (new.event_id is distinct from old.event_id
                           or new.profile_id is distinct from old.profile_id) then
    raise exception 'An RSVP cannot be moved';
  end if;
  if ev.status = 'cancelled' then
    raise exception 'This event has been cancelled';
  end if;
  if ev.ends_at < now() then
    raise exception 'This event has already finished';
  end if;
  if not exists (
    select 1 from public.department_memberships m
    where m.department_id = ev.department_id
      and m.profile_id = new.profile_id
      and m.status = 'active'
  ) then
    raise exception 'RSVP requires active department membership';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create index if not exists department_event_rsvps_event_idx
  on public.department_event_rsvps (event_id);
