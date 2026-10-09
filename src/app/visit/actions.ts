"use server";

import { createClient } from "@/lib/supabase/server";

export type VisitResult = {
  status: "success" | "error";
  message: string;
  field?: "firstName" | "lastName";
};

export async function registerVisit(formData: FormData): Promise<VisitResult> {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const wantsContact = formData.get("wantsContact");
  const showName = formData.get("showNameOnDisplay");

  if (
    typeof firstName !== "string" ||
    !firstName.trim() ||
    firstName.trim().length > 100
  ) {
    return {
      status: "error",
      field: "firstName",
      message: "Please enter a first name of up to 100 characters.",
    };
  }

  if (
    lastName !== null &&
    (typeof lastName !== "string" || lastName.trim().length > 100)
  ) {
    return {
      status: "error",
      field: "lastName",
      message: "Please enter a last name of up to 100 characters, or leave it blank.",
    };
  }

  if (
    (wantsContact !== null && wantsContact !== "on") ||
    (showName !== null && showName !== "on")
  ) {
    return {
      status: "error",
      message: "Please check your contact and welcome screen choices and try again.",
    };
  }

  try {
    const supabase = await createClient();

    const { data: organisation, error: organisationError } =
      await supabase
        .from("organisations")
        .select("id")
        .eq("slug", "rccg-fountain-of-prayer-hull")
        .eq("is_active", true)
        .single();

    if (organisationError || !organisation) {
      return {
        status: "error",
        message:
          "Visitor registration is temporarily unavailable. Please try again shortly or speak to the welcome team.",
      };
    }

    const { data: location, error: locationError } =
      await supabase
        .from("church_locations")
        .select("id, timezone")
        .eq("organisation_id", organisation.id)
        .eq("slug", "hull")
        .eq("is_active", true)
        .single();

    if (locationError || !location) {
      return {
        status: "error",
        message:
          "We couldn’t find the church location. Please try again shortly or speak to the welcome team.",
      };
    }

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: location.timezone || "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const { data: service, error: serviceError } =
      await supabase
        .from("services")
        .select("id")
        .eq("organisation_id", organisation.id)
        .eq("location_id", location.id)
        .eq("service_date", today)
        .eq("status", "live")
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (serviceError || !service) {
      return {
        status: "error",
        message:
          "Visitor check-in is not currently available because no live service could be found.",
      };
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName =
      typeof lastName === "string"
        ? lastName.trim() || null
        : null;
const { error } = await supabase
      .from("visitors")
      .insert({
        organisation_id: organisation.id,
        location_id: location.id,
        service_id: service.id,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        wants_contact: wantsContact === "on",
        show_name_on_display: showName === "on",
      });

    if (error) {
      return {
        status: "error",
        message:
          "We couldn’t save your visit. Please try again or speak to the welcome team.",
      };
    }

    return {
      status: "success",
      message:
        "Thank you! Your visit has been recorded. We’re glad you’re here.",
    };
  } catch {
    return {
      status: "error",
      message:
        "We couldn’t confirm your visit was saved. Please check with the welcome team before submitting again.",
    };
  }
}


