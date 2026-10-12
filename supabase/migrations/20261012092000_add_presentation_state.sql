create table if not exists public.presentation_state (
  id uuid primary key default gen_random_uuid(),

  organisation_id uuid not null
    references public.organisations(id)
    on delete cascade,

  location_id uuid not null
    references public.church_locations(id)
    on delete cascade,

  mode text not null default 'auto'
    check (mode in ('auto', 'manual', 'blank')),

  slide_type text,
  title text,
  content text,
  payload jsonb not null default '{}'::jsonb,

  updated_by uuid
    references auth.users(id)
    on delete set null,

  updated_at timestamptz not null default now(),

  constraint presentation_state_location_unique
    unique (location_id)
);

create index if not exists presentation_state_organisation_idx
  on public.presentation_state(organisation_id);

alter table public.presentation_state
enable row level security;

revoke all
on public.presentation_state
from anon, authenticated;

grant select
on public.presentation_state
to anon, authenticated;

grant insert, update
on public.presentation_state
to authenticated;

create policy public_read_presentation_state
on public.presentation_state
for select
to anon, authenticated
using (true);

create policy media_insert_presentation_state
on public.presentation_state
for insert
to authenticated
with check (
  public.is_org_media_or_staff(organisation_id)
);

create policy media_update_presentation_state
on public.presentation_state
for update
to authenticated
using (
  public.is_org_media_or_staff(organisation_id)
)
with check (
  public.is_org_media_or_staff(organisation_id)
);

alter publication supabase_realtime
add table public.presentation_state;