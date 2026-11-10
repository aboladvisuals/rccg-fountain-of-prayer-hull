"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/session";

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

  if (!departmentId || !profileId) {
    return { ok: false, message: "Member and department are required." };
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
