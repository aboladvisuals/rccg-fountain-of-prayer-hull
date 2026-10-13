drop policy if exists staff_create_announcements
on public.announcements;

drop policy if exists staff_update_announcements
on public.announcements;

drop policy if exists staff_delete_announcements
on public.announcements;

create policy staff_create_announcements
on public.announcements
for insert
to authenticated
with check (
  public.is_org_media_or_staff(organisation_id)
);

create policy staff_update_announcements
on public.announcements
for update
to authenticated
using (
  public.is_org_media_or_staff(organisation_id)
)
with check (
  public.is_org_media_or_staff(organisation_id)
);

create policy staff_delete_announcements
on public.announcements
for delete
to authenticated
using (
  public.is_org_media_or_staff(organisation_id)
);