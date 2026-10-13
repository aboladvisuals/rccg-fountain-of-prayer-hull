-- Remove implicit PUBLIC execution rights from security-sensitive functions.

revoke execute on function public.audit_membership_change() from public;
revoke execute on function public.can_manage_family(uuid) from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.is_org_admin(uuid) from public;
revoke execute on function public.is_org_media_or_staff(uuid) from public;
revoke execute on function public.is_org_member(uuid) from public;
revoke execute on function public.is_org_pastor_or_admin(uuid) from public;
revoke execute on function public.protect_membership_admin_integrity() from public;
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.shares_family_with(uuid) from public;

-- Re-grant only the RLS helper functions to signed-in users.
grant execute on function public.can_manage_family(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.is_org_media_or_staff(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_pastor_or_admin(uuid) to authenticated;
grant execute on function public.shares_family_with(uuid) to authenticated;