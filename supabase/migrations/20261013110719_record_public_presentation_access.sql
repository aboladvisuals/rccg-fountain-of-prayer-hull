-- Record the existing live permissions for the public presentation feed.
grant select on public.presentation_public_feed to anon;

-- Only approved, public testimonies may be read anonymously.
drop policy if exists public_read_published_testimonies
on public.testimonies;

create policy public_read_published_testimonies
on public.testimonies
for select
to anon
using (is_approved = true and is_public = true);
