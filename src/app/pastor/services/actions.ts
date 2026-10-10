"use server";

import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/staff/session";
import { localDate } from "@/lib/member/dashboard";

async function getServiceContext() {
  const { supabase, user, organisation } =
    await requireStaffSession();

  const { data: location } = await supabase
    .from("church_locations")
    .select("id, timezone")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  if (!location) {
    throw new Error("Hull location could not be found.");
  }

  return {
    supabase,
    user,
    organisation,
    location,
  };
}

export async function createService(formData: FormData) {
  try {
    const { supabase, user, organisation, location } =
      await getServiceContext();

    const title = String(formData.get("title") ?? "").trim();
    const startTime = String(
      formData.get("startTime") ?? ""
    ).trim();

    if (!title || title.length > 150) {
      return {
        ok: false,
        message: "Please enter a valid service title.",
      };
    }

    const serviceDate = localDate(
      new Date(),
      location.timezone
    );

    let startsAt: string | null = null;

    if (startTime) {
      startsAt = new Date(
        `${serviceDate}T${startTime}:00`
      ).toISOString();
    }

    const { error } = await supabase
      .from("services")
      .insert({
        organisation_id: organisation.id,
        location_id: location.id,
        title,
        service_date: serviceDate,
        starts_at: startsAt,
        status: "scheduled",
        created_by: user.id,
      });

    if (error) throw error;

    revalidatePath("/pastor/services");

    return {
      ok: true,
      message: "Service created.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not create the service.",
    };
  }
}

export async function setServiceStatus(
  serviceId: string,
  status: "scheduled" | "live" | "completed" | "cancelled"
) {
  try {
    const { supabase, organisation, location } =
      await getServiceContext();

    if (status === "live") {
      const today = localDate(
        new Date(),
        location.timezone
      );

      /*
        Only one live service per location/day.
        Complete any other live service first.
      */
      const { error: closeError } = await supabase
        .from("services")
        .update({ status: "completed" })
        .eq("organisation_id", organisation.id)
        .eq("location_id", location.id)
        .eq("service_date", today)
        .eq("status", "live")
        .neq("id", serviceId);

      if (closeError) throw closeError;
    }

    const { error } = await supabase
      .from("services")
      .update({ status })
      .eq("id", serviceId)
      .eq("organisation_id", organisation.id)
      .eq("location_id", location.id);

    if (error) throw error;

    revalidatePath("/pastor/services");
    revalidatePath("/pastor");
    revalidatePath("/member");
    revalidatePath("/member/family");
    revalidatePath("/pastor/presence");
    revalidatePath("/pastor/visitors");
    revalidatePath("/display");

    return {
      ok: true,
      message:
        status === "live"
          ? "Service is now live."
          : status === "completed"
          ? "Service completed."
          : status === "cancelled"
          ? "Service cancelled."
          : "Service returned to scheduled.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update the service.",
    };
  }
}
