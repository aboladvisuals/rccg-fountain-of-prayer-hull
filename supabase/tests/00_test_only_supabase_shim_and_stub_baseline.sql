-- TEST-ONLY FIXTURE. NEVER APPLY TO ANY SUPABASE PROJECT.
--
-- The recovered baseline (20261001000000) lives only on the owner's laptop
-- and is NOT in this repository. To replay the repository migrations in a
-- fresh, plain PostgreSQL database we need:
--   1. A minimal shim of what Supabase provides (auth schema, auth.uid(),
--      anon/authenticated roles, the supabase_realtime publication).
--   2. A minimal STUB of the baseline objects the repository migrations
--      reference. Column lists are limited to the columns the migrations and
--      app code actually use. Helper-function bodies are ASSUMED (an
--      active admin/pastor/media membership of the organisation), because the
--      real definitions are in the unrecovered baseline.
-- Results from this fixture prove the department policies' logic and the
-- absence of recursion; they do NOT replace a replay on the owner's lab with
-- the real baseline.

-- 1. Supabase shim -----------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

create extension if not exists pgcrypto;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(
    current_setting('request.jwt.claim.sub', true),
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
  ), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
create publication supabase_realtime;

-- 2. Stub baseline (assumed shapes) ------------------------------------------
create type public.app_role as enum ('admin', 'pastor', 'media', 'member');
create type public.membership_status as enum ('pending', 'active', 'inactive');

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, is_active boolean not null default true
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, first_name text, email text
);
create table public.church_locations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null, slug text not null, timezone text not null default 'Europe/London',
  is_active boolean not null default true
);
create table public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'member',
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id, profile_id)
);
create table public.announcements (id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id));
create table public.display_settings (id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id));
create table public.services (id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id));
create table public.testimonies (id uuid primary key default gen_random_uuid(), is_approved boolean not null default false, is_public boolean not null default false);
create view public.presentation_public_feed as select 1 as placeholder;

create or replace function public.is_org_admin(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organisation_memberships m
    where m.organisation_id = org and m.profile_id = auth.uid()
      and m.role = 'admin' and m.status = 'active')
$$;
create or replace function public.is_org_media_or_staff(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organisation_memberships m
    where m.organisation_id = org and m.profile_id = auth.uid()
      and m.role in ('admin', 'pastor', 'media') and m.status = 'active')
$$;
create or replace function public.is_org_pastor_or_admin(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organisation_memberships m
    where m.organisation_id = org and m.profile_id = auth.uid()
      and m.role in ('admin', 'pastor') and m.status = 'active')
$$;

alter table public.profiles enable row level security;
create policy profiles_own on public.profiles for select to authenticated
  using (id = auth.uid() or exists (select 1 from public.organisation_memberships m where public.is_org_admin(m.organisation_id)));
alter table public.organisation_memberships enable row level security;
create policy om_select on public.organisation_memberships for select to authenticated
  using (profile_id = auth.uid() or public.is_org_admin(organisation_id));
create policy om_write on public.organisation_memberships for all to authenticated
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
alter table public.announcements enable row level security;
alter table public.display_settings enable row level security;
alter table public.services enable row level security;
alter table public.testimonies enable row level security;
alter table public.organisations enable row level security;
create policy orgs_read on public.organisations for select to anon, authenticated using (true);
