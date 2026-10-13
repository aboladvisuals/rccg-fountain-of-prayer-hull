create policy "staff_read_all_services"
on public.services
for select
to authenticated
using (
  is_org_pastor_or_admin(organisation_id)
);