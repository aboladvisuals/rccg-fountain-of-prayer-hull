"use server";

import { revalidatePath } from "next/cache";
import { requireMemberSession } from "@/lib/member/session";
import { localDate } from "@/lib/member/dashboard";

export async function updateProfile(formData: FormData) {
  try {
    const { supabase, user } = await requireMemberSession();

    const fullName = String(formData.get("fullName") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    const showNameOnDisplay =
      formData.get("showNameOnDisplay") === "on";

    const showFamilyOnDisplay =
      formData.get("showFamilyOnDisplay") === "on";

    const birthMonthRaw = String(
      formData.get("birthMonth") ?? ""
    ).trim();

    const birthDayRaw = String(
      formData.get("birthDay") ?? ""
    ).trim();

    if (fullName.length > 150) {
      return { ok: false, message: "Full name is too long." };
    }

    if (firstName.length > 100) {
      return { ok: false, message: "First name is too long." };
    }

    if (phone.length > 50) {
      return { ok: false, message: "Phone number is too long." };
    }

    const birthMonth = birthMonthRaw
      ? Number(birthMonthRaw)
      : null;

    const birthDay = birthDayRaw
      ? Number(birthDayRaw)
      : null;

    if (
      birthMonth !== null &&
      (!Number.isInteger(birthMonth) ||
        birthMonth < 1 ||
        birthMonth > 12)
    ) {
      return {
        ok: false,
        message: "Please choose a valid birth month.",
      };
    }

    if (
      birthDay !== null &&
      (!Number.isInteger(birthDay) ||
        birthDay < 1 ||
        birthDay > 31)
    ) {
      return {
        ok: false,
        message: "Please choose a valid birth day.",
      };
    }

    if (
      (birthMonth === null && birthDay !== null) ||
      (birthMonth !== null && birthDay === null)
    ) {
      return {
        ok: false,
        message:
          "Please enter both birth month and birth day, or leave both blank.",
      };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        first_name: firstName || null,
        phone: phone || null,
        show_name_on_display: showNameOnDisplay,
        show_family_on_display: showFamilyOnDisplay,
        birth_month: birthMonth,
        birth_day: birthDay,
      })
      .eq("id", user.id);

    if (error) throw error;

    /*
      Keep the member's CURRENT LIVE attendance display name
      in sync with their latest privacy choice.
    */
    const { data: organisation } = await supabase
      .from("organisations")
      .select("id")
      .eq("slug", "rccg-fountain-of-prayer-hull")
      .eq("is_active", true)
      .maybeSingle();

    if (organisation) {
      const { data: location } = await supabase
        .from("church_locations")
        .select("id, timezone")
        .eq("organisation_id", organisation.id)
        .eq("slug", "hull")
        .eq("is_active", true)
        .maybeSingle();

      if (location) {
        const today = localDate(
          new Date(),
          location.timezone
        );

        const { data: service } = await supabase
          .from("services")
          .select("id")
          .eq("organisation_id", organisation.id)
          .eq("location_id", location.id)
          .eq("service_date", today)
          .eq("status", "live")
          .order("starts_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (service) {
          const displayName = showNameOnDisplay
            ? fullName ||
              firstName ||
              user.email ||
              "Member"
            : null;

          const { error: attendanceError } = await supabase
            .from("attendance")
            .update({
              display_name: displayName,
            })
            .eq("service_id", service.id)
            .eq("profile_id", user.id);

          if (attendanceError) {
            throw attendanceError;
          }
        }
      }
    }

    revalidatePath("/member/profile");
    revalidatePath("/member");
    revalidatePath("/display");
    revalidatePath("/pastor/presence");

    return {
      ok: true,
      message: "Profile and privacy settings updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not update your profile.",
    };
  }
}
