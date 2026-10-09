"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/staff/session";

export async function updateDisplaySettings(formData: FormData) {
  try {
    const { supabase, user, organisation } =
      await requireStaffSession();

    const welcomeMessage = String(
      formData.get("welcomeMessage") ?? ""
    ).trim();

    const showBirthdays =
      formData.get("showBirthdays") === "on";

    const showServingTeam =
      formData.get("showServingTeam") === "on";

    const showPresence =
      formData.get("showPresence") === "on";

    if (!welcomeMessage || welcomeMessage.length > 500) {
      return {
        ok: false,
        message:
          "Please enter a welcome message of up to 500 characters.",
      };
    }

    const { data: location } = await supabase
      .from("church_locations")
      .select("id")
      .eq("organisation_id", organisation.id)
      .eq("slug", "hull")
      .eq("is_active", true)
      .maybeSingle();

    if (!location) {
      throw new Error("Hull location could not be found.");
    }

    const { error } = await supabase
      .from("display_settings")
      .upsert(
        {
          organisation_id: organisation.id,
          location_id: location.id,
          welcome_message: welcomeMessage,
          show_birthdays: showBirthdays,
          show_serving_team: showServingTeam,
          show_presence: showPresence,
          updated_by: user.id,
        },
        {
          onConflict: "location_id",
        }
      );

    if (error) throw error;

    revalidatePath("/pastor/display-settings");
    revalidatePath("/display");

    return {
      ok: true,
      message: "Display settings updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update the display settings.",
    };
  }
}

