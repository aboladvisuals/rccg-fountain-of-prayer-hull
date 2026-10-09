"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/staff/session";

export async function markNoteRead(noteId: string) {
  try {
    const { supabase, user, organisation } =
      await requireStaffSession();

    const { error } = await supabase
      .from("private_notes")
      .update({
        is_read: true,
        read_by: user.id,
        read_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("organisation_id", organisation.id);

    if (error) {
      throw error;
    }

    revalidatePath("/pastor/private-notes");
    revalidatePath("/pastor");

    return {
      ok: true,
      message: "Note marked as read.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update this note.",
    };
  }
}
