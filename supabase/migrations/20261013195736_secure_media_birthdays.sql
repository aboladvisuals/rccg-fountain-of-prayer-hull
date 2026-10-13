-- Provide media/pastor/admin users with a narrow, display-safe
-- birthday feed without exposing full member profiles.

create or replace function public.get_media_birthday_names(
  requested_org uuid,
  requested_month integer,
  requested_day integer
)
returns table (
  display_name text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select birthday_name
  from (
    select
      coalesce(
        nullif(trim(p.full_name), ''),
        nullif(trim(p.first_name), '')
      ) as birthday_name
    from public.profiles p
    join public.organisation_memberships m
      on m.profile_id = p.id
     and m.organisation_id = requested_org
     and m.status = 'active'
    where public.is_org_media_or_staff(requested_org)
      and p.birth_month = requested_month
      and p.birth_day = requested_day
      and p.show_name_on_display = true

    union

    select
      nullif(
        trim(
          concat_ws(
            ' ',
            fm.first_name,
            fm.last_name
          )
        ),
        ''
      ) as birthday_name
    from public.family_members fm
    where public.is_org_media_or_staff(requested_org)
      and fm.organisation_id = requested_org
      and fm.birth_month = requested_month
      and fm.birth_day = requested_day
      and fm.show_name_on_display = true
  ) birthdays
  where birthday_name is not null
  order by birthday_name;
$function$;

revoke execute on function public.get_media_birthday_names(
  uuid,
  integer,
  integer
) from public, anon;

grant execute on function public.get_media_birthday_names(
  uuid,
  integer,
  integer
) to authenticated;
