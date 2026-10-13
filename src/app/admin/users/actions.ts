"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/session";

const ALLOWED_ROLES = ["member", "pastor", "admin", "media"] as const;
const ALLOWED_STATUSES = ["active", "inactive"] as const;

type AppRole = (typeof ALLOWED_ROLES)[number];
type MembershipStatus = (typeof ALLOWED_STATUSES)[number];

function isAppRole(value: string): value is AppRole {
  return ALLOWED_ROLES.includes(value as AppRole);
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return ALLOWED_STATUSES.includes(value as MembershipStatus);
}

export async function updateMembershipAccess(formData: FormData) {
  try {
    const { supabase, organisation } = await requireAdminSession();

    const membershipId = String(
      formData.get("membershipId") ?? ""
    ).trim();

    const role = String(formData.get("role") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!membershipId) {
      return {
        ok: false,
        message: "Membership could not be identified.",
      };
    }

    if (!isAppRole(role)) {
      return {
        ok: false,
        message: "Please select a valid role.",
      };
    }

    if (!isMembershipStatus(status)) {
      return {
        ok: false,
        message: "Please select a valid membership status.",
      };
    }

    const { data: membership, error: membershipError } =
      await supabase
        .from("organisation_memberships")
        .select("id, organisation_id, role, status")
        .eq("id", membershipId)
        .eq("organisation_id", organisation.id)
        .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return {
        ok: false,
        message: "That membership could not be found.",
      };
    }

    if (
      membership.role === role &&
      membership.status === status
    ) {
      return {
        ok: true,
        message: "No changes were needed.",
      };
    }

    const { error: updateError } = await supabase
      .from("organisation_memberships")
      .update({
        role,
        status,
      })
      .eq("id", membership.id)
      .eq("organisation_id", organisation.id);

    if (updateError) {
      const message = updateError.message.toLowerCase();

      if (
        message.includes("final active administrator") ||
        message.includes("final active admin")
      ) {
        return {
          ok: false,
          message:
            "The final active administrator cannot be demoted or deactivated.",
        };
      }

      throw updateError;
    }

    revalidatePath("/admin/users");
    revalidatePath("/pastor");
    revalidatePath("/member");

    return {
      ok: true,
      message: "User access updated successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update this user.",
    };
  }
}