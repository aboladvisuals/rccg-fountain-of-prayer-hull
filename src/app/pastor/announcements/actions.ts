"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/staff/session";

export async function createAnnouncement(formData: FormData) {
  try {
    const { supabase, user, organisation } =
      await requireStaffSession();

    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    if (!title || title.length > 150) {
      return {
        ok: false,
        message: "Please enter a title of up to 150 characters.",
      };
    }

    if (!body || body.length > 2000) {
      return {
        ok: false,
        message: "Please enter announcement text of up to 2,000 characters.",
      };
    }

    const { error } = await supabase
      .from("announcements")
      .insert({
        organisation_id: organisation.id,
        title,
        content: body,
        is_active: true,
        created_by: user.id,
      });

    if (error) throw error;

    revalidatePath("/pastor/announcements");
    revalidatePath("/display");

    return {
      ok: true,
      message: "Announcement created.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not create the announcement.",
    };
  }
}

export async function setAnnouncementActive(
  announcementId: string,
  active: boolean
) {
  try {
    const { supabase, organisation } =
      await requireStaffSession();

    const { error } = await supabase
      .from("announcements")
      .update({
        is_active: active,
      })
      .eq("id", announcementId)
      .eq("organisation_id", organisation.id);

    if (error) throw error;

    revalidatePath("/pastor/announcements");
    revalidatePath("/display");

    return {
      ok: true,
      message: active
        ? "Announcement activated."
        : "Announcement hidden from display.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update the announcement.",
    };
  }
}

