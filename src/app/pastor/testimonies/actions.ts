"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/staff/session";

export async function approveTestimony(testimonyId: string) {
  try {
    const { supabase, organisation } =
      await requireStaffSession();

    const { error } = await supabase
      .from("testimonies")
      .update({
        is_approved: true,
      })
      .eq("id", testimonyId)
      .eq("organisation_id", organisation.id);

    if (error) throw error;

    revalidatePath("/pastor/testimonies");
    revalidatePath("/pastor");
    revalidatePath("/member/testimony");

    return {
      ok: true,
      message: "Testimony approved.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not approve this testimony.",
    };
  }
}

export async function setTestimonyPublic(
  testimonyId: string,
  makePublic: boolean
) {
  try {
    const { supabase, organisation } =
      await requireStaffSession();

    if (makePublic) {
      const { data: testimony } = await supabase
        .from("testimonies")
        .select("is_approved")
        .eq("id", testimonyId)
        .eq("organisation_id", organisation.id)
        .maybeSingle();

      if (!testimony?.is_approved) {
        throw new Error(
          "Approve the testimony before making it public."
        );
      }
    }

    const { error } = await supabase
      .from("testimonies")
      .update({
        is_public: makePublic,
      })
      .eq("id", testimonyId)
      .eq("organisation_id", organisation.id);

    if (error) throw error;

    revalidatePath("/pastor/testimonies");
    revalidatePath("/member/testimony");

    return {
      ok: true,
      message: makePublic
        ? "Testimony is now public."
        : "Testimony is no longer public.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update this testimony.",
    };
  }
}
