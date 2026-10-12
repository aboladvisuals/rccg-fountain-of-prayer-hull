"use server";

import { revalidatePath } from "next/cache";

import { localDate } from "@/lib/member/dashboard";
import { requireStaffSession } from "@/lib/staff/session";

type ServiceStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled";

function zonedLocalDateTimeToIso(
  date: string,
  time: string,
  timeZone: string
) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);

  if (!dateMatch || !timeMatch) {
    throw new Error("Invalid service date or start time.");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("Invalid service start time.");
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const targetAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0
  );

  let candidate = targetAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = formatter.formatToParts(
      new Date(candidate)
    );

    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    );

    const representedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second)
    );

    const difference =
      targetAsUtc - representedAsUtc;

    if (difference === 0) {
      return new Date(candidate).toISOString();
    }

    candidate += difference;
  }

  const finalParts = formatter.formatToParts(
    new Date(candidate)
  );

  const finalValues = Object.fromEntries(
    finalParts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const matchesRequestedTime =
    Number(finalValues.year) === year &&
    Number(finalValues.month) === month &&
    Number(finalValues.day) === day &&
    Number(finalValues.hour) === hour &&
    Number(finalValues.minute) === minute;

  if (!matchesRequestedTime) {
    throw new Error(
      "That local service time is not valid in the church timezone."
    );
  }

  return new Date(candidate).toISOString();
}

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
    throw new Error(
      "Hull location could not be found."
    );
  }

  return {
    supabase,
    user,
    organisation,
    location,
  };
}

export async function createService(
  formData: FormData
) {
  try {
    const {
      supabase,
      user,
      organisation,
      location,
    } = await getServiceContext();

    const title = String(
      formData.get("title") ?? ""
    ).trim();

    const startTime = String(
      formData.get("startTime") ?? ""
    ).trim();

    if (!title || title.length > 150) {
      return {
        ok: false,
        message:
          "Please enter a valid service title.",
      };
    }

    if (
      startTime &&
      !/^\d{2}:\d{2}$/.test(startTime)
    ) {
      return {
        ok: false,
        message:
          "Please enter a valid service start time.",
      };
    }

    const serviceDate = localDate(
      new Date(),
      location.timezone
    );

    const startsAt = startTime
      ? zonedLocalDateTimeToIso(
          serviceDate,
          startTime,
          location.timezone
        )
      : null;

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

    if (error) {
      throw error;
    }

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
  status: ServiceStatus
) {
  try {
    const {
      supabase,
      organisation,
      location,
    } = await getServiceContext();

    if (status === "live") {
      const today = localDate(
        new Date(),
        location.timezone
      );

      /*
       * Only one live service per location/day.
       * Complete any other live service first.
       */
      const { error: closeError } =
        await supabase
          .from("services")
          .update({
            status: "completed",
          })
          .eq(
            "organisation_id",
            organisation.id
          )
          .eq("location_id", location.id)
          .eq("service_date", today)
          .eq("status", "live")
          .neq("id", serviceId);

      if (closeError) {
        throw closeError;
      }
    }

    const { error } = await supabase
      .from("services")
      .update({ status })
      .eq("id", serviceId)
      .eq(
        "organisation_id",
        organisation.id
      )
      .eq("location_id", location.id);

    if (error) {
      throw error;
    }

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