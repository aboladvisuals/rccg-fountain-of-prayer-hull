-- Fix circular RLS dependency between department memberships
-- and department leadership.

DROP POLICY IF EXISTS leadership_select
ON public.department_leadership;

CREATE POLICY leadership_select
ON public.department_leadership
FOR SELECT TO authenticated
USING (
    public.is_org_admin(organisation_id)
    OR profile_id = (SELECT auth.uid())
);