-- Harden function execution permissions exposed through the API.

-- Trigger/event-trigger helpers should never be callable directly by clients.
revoke execute on function public.audit_membership_change() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.protect_membership_admin_integrity() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;

-- RLS helper functions are only needed for signed-in users.
revoke execute on function public.can_manage_family(uuid) from anon;
revoke execute on function public.is_org_admin(uuid) from anon;
revoke execute on function public.is_org_media_or_staff(uuid) from anon;
revoke execute on function public.is_org_member(uuid) from anon;
revoke execute on function public.is_org_pastor_or_admin(uuid) from anon;
revoke execute on function public.shares_family_with(uuid) from anon;

grant execute on function public.can_manage_family(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.is_org_media_or_staff(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_pastor_or_admin(uuid) to authenticated;
grant execute on function public.shares_family_with(uuid) to authenticated;

-- Make the trigger helper's search path explicit.
alter function public.set_updated_at()
set search_path = public, pg_catalog;

