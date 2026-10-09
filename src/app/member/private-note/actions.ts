"use server";

import { revalidatePath } from "next/cache";
import { requireMemberSession } from "@/lib/member/session";

export async function submitPrivateNote(formData: FormData) {
  try {
    const { supabase, user } = await requireMemberSession();

    const message = String(formData.get("message") ?? "").trim();

    if (message.length < 5) {
      return {
        ok: false,
        message: "Please enter a little more detail.",
      };
    }

    if (message.length > 2000) {
      return {
        ok: false,
        message: "Please keep the note under 2,000 characters.",
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
      .from("private_notes")
      .insert({
        organisation_id: organisation.id,
        profile_id: user.id,
        message,
      });

    if (error) {
      throw error;
    }

    revalidatePath("/member/private-note");

    return {
      ok: true,
      message: "Your private note has been sent to the pastoral team.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not send your note. Please try again.",
    };
  }
}
