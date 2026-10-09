"use server";

import { revalidatePath } from "next/cache";
import { requireMemberSession } from "@/lib/member/session";

export async function submitTestimony(formData: FormData) {
  try {
    const { supabase, user } = await requireMemberSession();

    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (content.length < 10) {
      return {
        ok: false,
        message: "Please share a little more detail in your testimony.",
      };
    }

    if (content.length > 5000) {
      return {
        ok: false,
        message: "Please keep the testimony under 5,000 characters.",
      };
    }

    const { data: organisation } = await supabase
      .from("organisations")
      .select("id")
      .eq("slug", "rccg-fountain-of-prayer-hull")
      .eq("is_active", true)
      .maybeSingle();

    if (!organisation) {
      throw new Error("Church organisation could not be found.");
    }

    const { data: membership } = await supabase
      .from("organisation_memberships")
      .select("status")
      .eq("organisation_id", organisation.id)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (membership?.status !== "active") {
      throw new Error("Your church membership is not active.");
    }

    const { error } = await supabase
      .from("testimonies")
      .insert({
        organisation_id: organisation.id,
        profile_id: user.id,
        title: title || null,
        content,
        is_approved: false,
        is_public: false,
      });

    if (error) {
      throw error;
    }

    revalidatePath("/member/testimony");

    return {
      ok: true,
      message: "Your testimony has been submitted for pastoral review.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not submit your testimony. Please try again.",
    };
  }
}
