import type { SupabaseClient } from "@supabase/supabase-js";

export type DepartmentRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  is_child_facing: boolean;
  archived_at: string | null;
  allow_join_requests?: boolean;
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
      "id, name, slug, description, is_active, is_child_facing, archived_at, allow_join_requests"
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
        origin,
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

export async function listDepartmentLeadership(
  supabase: SupabaseClient,
  departmentId: string
) {
  return supabase
    .from("department_leadership")
    .select("id, profile_id, role, is_active, created_at")
    .eq("department_id", departmentId)
    .order("role");
}

export async function listDepartmentAudit(
  supabase: SupabaseClient,
  organisationId: string,
  departmentId: string,
  limit = 12
) {
  return supabase
    .from("department_assignment_audit")
    .select("id, profile_id, action, changed_by, old_status, new_status, created_at")
    .eq("organisation_id", organisationId)
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false })
    .limit(limit);
}
