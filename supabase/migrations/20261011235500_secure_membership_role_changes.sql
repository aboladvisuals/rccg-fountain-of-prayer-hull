-- Secure organisation membership role/status changes.
-- Adds:
--   1. Last-active-admin protection.
--   2. Automatic audit logging for membership changes.
--   3. Admin-only read access to the audit history.

create table if not exists public.membership_audit_log (
  id uuid primary key default gen_random_uuid(),

  organisation_id uuid not null
    references public.organisations(id)
    on delete cascade,

  membership_id uuid,

  target_profile_id uuid not null
    references public.profiles(id),

  changed_by uuid
    references public.profiles(id),

  action text not null
    check (action in ('insert', 'update', 'delete')),

  old_role public.app_role,
  new_role public.app_role,

  old_status public.membership_status,
  new_status public.membership_status,

  created_at timestamptz not null default now()
);

create index if not exists membership_audit_log_org_created_idx
  on public.membership_audit_log (
    organisation_id,
    created_at desc
  );

create index if not exists membership_audit_log_profile_idx
  on public.membership_audit_log (
    target_profile_id
  );

alter table public.membership_audit_log
  enable row level security;

drop policy if exists admins_read_membership_audit
  on public.membership_audit_log;

create policy admins_read_membership_audit
  on public.membership_audit_log
  for select
  to authenticated
  using (
    public.is_org_admin(organisation_id)
  );

revoke all
  on public.membership_audit_log
  from anon;

revoke insert, update, delete
  on public.membership_audit_log
  from authenticated;

grant select
  on public.membership_audit_log
  to authenticated;


create or replace function public.protect_membership_admin_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_active_admins integer;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform 1
    from public.organisations
    where id = old.organisation_id
    for update;
  end if;

  if tg_op = 'UPDATE' then
    if new.organisation_id is distinct from old.organisation_id then
      raise exception
        'A membership cannot be moved to another organisation.';
    end if;

    if new.profile_id is distinct from old.profile_id then
      raise exception
        'A membership cannot be reassigned to another profile.';
    end if;

    if
      old.role = 'admin'
      and old.status = 'active'
      and (
        new.role <> 'admin'
        or new.status <> 'active'
      )
    then

      select count(*)
      into remaining_active_admins
      from public.organisation_memberships
      where organisation_id = old.organisation_id
        and role = 'admin'
        and status = 'active'
        and id <> old.id;

      if remaining_active_admins = 0 then
        raise exception
          'The final active administrator cannot be demoted or deactivated.';
      end if;

    end if;

    return new;
  end if;


  if tg_op = 'DELETE' then

    if
      old.role = 'admin'
      and old.status = 'active'
    then

      select count(*)
      into remaining_active_admins
      from public.organisation_memberships
      where organisation_id = old.organisation_id
        and role = 'admin'
        and status = 'active'
        and id <> old.id;

      if remaining_active_admins = 0 then
        raise exception
          'The final active administrator cannot be deleted.';
      end if;

    end if;

    return old;
  end if;

  return null;
end;
$$;


drop trigger if exists protect_membership_admin_integrity
  on public.organisation_memberships;

create trigger protect_membership_admin_integrity
before update or delete
on public.organisation_memberships
for each row
execute function public.protect_membership_admin_integrity();


create or replace function public.audit_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if tg_op = 'INSERT' then

    insert into public.membership_audit_log (
      organisation_id,
      membership_id,
      target_profile_id,
      changed_by,
      action,
      old_role,
      new_role,
      old_status,
      new_status
    )
    values (
      new.organisation_id,
      new.id,
      new.profile_id,
      auth.uid(),
      'insert',
      null,
      new.role,
      null,
      new.status
    );

    return new;
  end if;


  if tg_op = 'UPDATE' then

    if
      old.role is distinct from new.role
      or old.status is distinct from new.status
    then

      insert into public.membership_audit_log (
        organisation_id,
        membership_id,
        target_profile_id,
        changed_by,
        action,
        old_role,
        new_role,
        old_status,
        new_status
      )
      values (
        new.organisation_id,
        new.id,
        new.profile_id,
        auth.uid(),
        'update',
        old.role,
        new.role,
        old.status,
        new.status
      );

    end if;

    return new;
  end if;


  if tg_op = 'DELETE' then

    insert into public.membership_audit_log (
      organisation_id,
      membership_id,
      target_profile_id,
      changed_by,
      action,
      old_role,
      new_role,
      old_status,
      new_status
    )
    values (
      old.organisation_id,
      old.id,
      old.profile_id,
      auth.uid(),
      'delete',
      old.role,
      null,
      old.status,
      null
    );

    return old;
  end if;

  return null;
end;
$$;


drop trigger if exists audit_membership_change
  on public.organisation_memberships;

create trigger audit_membership_change
after insert or update or delete
on public.organisation_memberships
for each row
execute function public.audit_membership_change();