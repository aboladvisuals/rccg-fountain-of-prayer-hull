"use server";

import { revalidatePath } from "next/cache";
import { requireMemberSession } from "@/lib/member/session";
import { localDate } from "@/lib/member/dashboard";

type ActionResult = {
  ok: boolean;
  message: string;
};

async function getContext(serviceId: string) {
  const { supabase, user } = await requireMemberSession();

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

  const { data: location } = await supabase
    .from("church_locations")
    .select("id, timezone")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  if (!location) {
    throw new Error("Hull church location could not be found.");
  }

  const today = localDate(new Date(), location.timezone);

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("organisation_id", organisation.id)
    .eq("location_id", location.id)
    .eq("service_date", today)
    .eq("status", "live")
    .maybeSingle();

  if (!service) {
    throw new Error("This service is no longer available for check-in.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, first_name, show_name_on_display")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    organisationId: organisation.id,
    serviceId: service.id,
    profile,
  };
}

function displayName(
  profile:
    | {
        full_name: string | null;
        first_name: string | null;
        show_name_on_display: boolean;
      }
    | null
) {
  if (!profile?.show_name_on_display) {
    return null;
  }

  return (
    profile.full_name?.trim() ||
    profile.first_name?.trim() ||
    null
  );
}

export async function checkIn(
  serviceId: string
): Promise<ActionResult> {
  try {
    const context = await getContext(serviceId);

    const { data: existing } = await context.supabase
      .from("attendance")
      .select("id")
      .eq("service_id", context.serviceId)
      .eq("profile_id", context.user.id)
      .maybeSingle();

    if (existing) {
      revalidatePath("/member");

      return {
        ok: true,
        message: "You are already checked in.",
      };
    }

    const { error } = await context.supabase
      .from("attendance")
      .insert({
        organisation_id: context.organisationId,
        service_id: context.serviceId,
        profile_id: context.user.id,
        display_name: displayName(context.profile),
        is_serving: false,
      });

    if (error && error.code !== "23505") {
      throw error;
    }

    revalidatePath("/member");

    return {
      ok: true,
      message: "You’re checked in. Welcome!",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not check you in. Please try again.",
    };
  }
}

export async function setServing(
  serviceId: string,
  serving: boolean
): Promise<ActionResult> {
  try {
    const context = await getContext(serviceId);

    const { data: existing } = await context.supabase
      .from("attendance")
      .select("id")
      .eq("service_id", context.serviceId)
      .eq("profile_id", context.user.id)
      .maybeSingle();

    if (!existing) {
      if (!serving) {
        return {
          ok: true,
          message: "You are not currently marked as serving.",
        };
      }

      const { error } = await context.supabase
        .from("attendance")
        .insert({
          organisation_id: context.organisationId,
          service_id: context.serviceId,
          profile_id: context.user.id,
          display_name: displayName(context.profile),
          is_serving: true,
        });

      if (error && error.code !== "23505") {
        throw error;
      }
    } else {
      const { error } = await context.supabase
        .from("attendance")
        .update({
          is_serving: serving,
        })
        .eq("id", existing.id)
        .eq("profile_id", context.user.id);

      if (error) {
        throw error;
      }
    }

    revalidatePath("/member");

    return {
      ok: true,
      message: serving
        ? "You’re checked in and marked as serving today."
        : "Serving status removed.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update your serving status.",
    };
  }
}
