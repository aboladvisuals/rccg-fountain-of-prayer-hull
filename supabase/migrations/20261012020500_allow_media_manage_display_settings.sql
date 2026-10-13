drop policy if exists staff_manage_display_settings
on public.display_settings;

create policy staff_manage_display_settings
on public.display_settings
for all
to authenticated
using (
  public.is_org_media_or_staff(organisation_id)
)
with check (
  public.is_org_media_or_staff(organisation_id)
);