import type { SupabaseClient } from "@supabase/supabase-js";

export type DepartmentRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  is_child_facing: boolean;
  archived_at: string | null;
};

export async function listDepartments(
  supabase: SupabaseClient,
  organisationId: string
) {
  return supabase
    .from("church_departments")
    .select(
      "id, name, slug, description, is_active, is_child_facing, archived_at"
    )
    .eq("organisation_id", organisationId)
    .order("name");
}

export async function getDepartment(
  supabase: SupabaseClient,
  organisationId: string,
  departmentId: string
) {
  return supabase
    .from("church_departments")
    .select(
      "id, name, slug, description, is_active, is_child_facing, archived_at"
    )
    .eq("organisation_id", organisationId)
    .eq("id", departmentId)
    .maybeSingle();
}

export async function listDepartmentMembers(
  supabase: SupabaseClient,
  departmentId: string
) {
  return supabase
    .from("department_memberships")
    .select(
      `
        id,
        status,
        profile:profiles (
          id,
          full_name,
          first_name,
          email
        )
      `
    )
    .eq("department_id", departmentId)
    .order("created_at");
}
