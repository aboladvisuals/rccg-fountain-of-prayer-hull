"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/session";
import { LEADERSHIP_ROLES, MEMBERSHIP_STATUSES, isUuid, type LeadershipRole, type MembershipStatus } from "@/lib/departments/permissions";

const adminFriendly = (message: string) =>
  /active department membership/i.test(message)
    ? "Assign this person as an active member of the department first."
    : /department_one_active_leader|duplicate key/i.test(message)
      ? "This department already has an active leader in that role. Remove them first."
      : /row-level security|permission denied/i.test(message)
        ? "You do not have permission to do that."
        : message;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createDepartment(formData: FormData) {
  const { supabase, organisation } = await requireAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isChildFacing = formData.get("isChildFacing") === "on";

  if (!name) {
    return { ok: false, message: "Department name is required." };
  }

  const slug = slugify(name);
  if (!slug) {
    return { ok: false, message: "Could not create a URL slug." };
  }

  const { error } = await supabase.from("church_departments").insert({
    organisation_id: organisation.id,
    name,
    slug,
    description: description || null,
    is_active: false,
    is_child_facing: isChildFacing,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/departments");
  return { ok: true, message: "Department created as inactive." };
}

export async function setDepartmentActive(formData: FormData) {
  const { supabase, organisation } = await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  const active = formData.get("active") === "true";

  const { error } = await supabase
    .from("church_departments")
    .update({
      is_active: active,
      archived_at: active ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organisation_id", organisation.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${id}`);
  return {
    ok: true,
    message: active ? "Department activated." : "Department archived.",
  };
}

export async function assignMember(formData: FormData) {
  const { supabase, organisation } = await requireAdminSession();
  const departmentId = String(formData.get("departmentId") ?? "").trim();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!isUuid(departmentId) || !isUuid(profileId)) {
    return { ok: false, message: "Member and department are required." };
  }
  if (!MEMBERSHIP_STATUSES.includes(status as MembershipStatus)) {
    return { ok: false, message: "Choose a valid status." };
  }

  const { error } = await supabase.from("department_memberships").upsert(
    {
      organisation_id: organisation.id,
      department_id: departmentId,
      profile_id: profileId,
      status,
    },
    { onConflict: "department_id,profile_id" }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/departments/${departmentId}`);
  revalidatePath("/member");
  return { ok: true, message: "Assignment saved." };
}

export async function appointLeadership(formData: FormData) {
  const { supabase, organisation } = await requireAdminSession();
  const departmentId = String(formData.get("departmentId") ?? "").trim();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as LeadershipRole;
  if (!isUuid(departmentId) || !isUuid(profileId) || !LEADERSHIP_ROLES.includes(role)) {
    return { ok: false, message: "Choose an active member and a role." };
  }
  // Reactivate an existing record for the same person and role, otherwise insert.
  const { data: existing } = await supabase
    .from("department_leadership")
    .select("id")
    .eq("organisation_id", organisation.id)
    .eq("department_id", departmentId)
    .eq("profile_id", profileId)
    .eq("role", role)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("department_leadership").update({ is_active: true }).eq("id", existing.id)
    : await supabase.from("department_leadership").insert({
        organisation_id: organisation.id,
        department_id: departmentId,
        profile_id: profileId,
        role,
        is_active: true,
      });
  if (error) return { ok: false, message: adminFriendly(error.message) };
  revalidatePath(`/admin/departments/${departmentId}`);
  revalidatePath("/member");
  return { ok: true, message: role === "leader" ? "Leader appointed." : "Deputy appointed." };
}

export async function removeLeadership(formData: FormData) {
  const { supabase, organisation } = await requireAdminSession();
  const id = String(formData.get("leadershipId") ?? "").trim();
  const departmentId = String(formData.get("departmentId") ?? "").trim();
  if (!isUuid(id) || !isUuid(departmentId)) return { ok: false, message: "Invalid leadership record." };
  const { error } = await supabase
    .from("department_leadership")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organisation_id", organisation.id);
  if (error) return { ok: false, message: adminFriendly(error.message) };
  revalidatePath(`/admin/departments/${departmentId}`);
  revalidatePath("/member");
  return { ok: true, message: "Leadership role removed. Their membership is unchanged." };
}

export async function setJoinRequests(formData: FormData) {
  const { supabase, organisation } = await requireAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  const allow = formData.get("allow") === "true";
  if (!isUuid(id)) return { ok: false, message: "Invalid department." };
  const { data: dept } = await supabase.from("church_departments").select("is_child_facing").eq("id", id).eq("organisation_id", organisation.id).maybeSingle();
  if (!dept) return { ok: false, message: "Department not found." };
  if (allow && dept.is_child_facing) return { ok: false, message: "Child-facing departments are assigned by an administrator only." };
  const { error } = await supabase.from("church_departments").update({ allow_join_requests: allow }).eq("id", id).eq("organisation_id", organisation.id);
  if (error) return { ok: false, message: adminFriendly(error.message) };
  revalidatePath(`/admin/departments/${id}`);
  revalidatePath("/admin/departments");
  return { ok: true, message: allow ? "Members can now request to join." : "Join requests turned off." };
}
