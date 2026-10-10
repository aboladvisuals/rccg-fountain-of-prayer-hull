"use server";

import { revalidatePath } from "next/cache";
import { requireMemberSession } from "@/lib/member/session";
import { localDate } from "@/lib/member/dashboard";

async function getFamilyContext() {
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

  return {
    supabase,
    user,
    organisationId: organisation.id,
  };
}

async function getAccessibleFamily(
  supabase: Awaited<ReturnType<typeof getFamilyContext>>["supabase"],
  userId: string,
  organisationId: string
) {
  const { data: guardianLink } = await supabase
    .from("family_guardians")
    .select("family_id")
    .eq("organisation_id", organisationId)
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (guardianLink) {
    return { id: guardianLink.family_id };
  }

  const { data: ownedFamily } = await supabase
    .from("families")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("primary_profile_id", userId)
    .limit(1)
    .maybeSingle();

  return ownedFamily;
}

export async function addFamilyMember(formData: FormData) {
  try {
    const { supabase, user, organisationId } =
      await getFamilyContext();

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const relationship = String(
      formData.get("relationship") ?? ""
    ).trim();

    if (!firstName) {
      return {
        ok: false,
        message: "First name is required.",
      };
    }

    let family = await getAccessibleFamily(
      supabase,
      user.id,
      organisationId
    );

    if (!family) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name")
        .eq("id", user.id)
        .maybeSingle();

      const familyName =
        profile?.full_name?.trim() ||
        profile?.first_name?.trim() ||
        "My Family";

      const result = await supabase
        .from("families")
        .insert({
          organisation_id: organisationId,
          primary_profile_id: user.id,
          family_name: `${familyName} Family`,
        })
        .select("id")
        .single();

      if (result.error) throw result.error;

      family = result.data;

      const { error: guardianError } = await supabase
        .from("family_guardians")
        .insert({
          organisation_id: organisationId,
          family_id: family.id,
          profile_id: user.id,
          relationship: "Primary account holder",
        });

      if (guardianError && guardianError.code !== "23505") {
        throw guardianError;
      }
    }

    const { error } = await supabase
      .from("family_members")
      .insert({
        organisation_id: organisationId,
        family_id: family.id,
        first_name: firstName,
        last_name: lastName || null,
        relationship: relationship || null,
        show_name_on_display: true,
      });

    if (error) throw error;

    revalidatePath("/member/family");
    revalidatePath("/member");

    return {
      ok: true,
      message: `${firstName} was added to your family.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not add this family member.",
    };
  }
}

export async function removeFamilyMember(memberId: string) {
  try {
    const { supabase, user, organisationId } =
      await getFamilyContext();

    const family = await getAccessibleFamily(
      supabase,
      user.id,
      organisationId
    );

    if (!family) {
      throw new Error("Family record could not be found.");
    }

    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberId)
      .eq("family_id", family.id);

    if (error) throw error;

    revalidatePath("/member/family");

    return {
      ok: true,
      message: "Family member removed.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not remove this family member.",
    };
  }
}

export async function checkInFamilyMember(
  memberId: string,
  serviceId: string
) {
  try {
    const { supabase, user, organisationId } =
      await getFamilyContext();

    const family = await getAccessibleFamily(
      supabase,
      user.id,
      organisationId
    );

    if (!family) {
      throw new Error("Family record could not be found.");
    }

    const { data: member } = await supabase
      .from("family_members")
      .select("id, first_name, last_name, show_name_on_display")
      .eq("id", memberId)
      .eq("family_id", family.id)
      .maybeSingle();

    if (!member) {
      throw new Error("Family member could not be found.");
    }

    const { data: location } = await supabase
      .from("church_locations")
      .select("id, timezone")
      .eq("organisation_id", organisationId)
      .eq("slug", "hull")
      .eq("is_active", true)
      .maybeSingle();

    if (!location) {
      throw new Error("Hull location could not be found.");
    }

    const today = localDate(new Date(), location.timezone);

    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("organisation_id", organisationId)
      .eq("location_id", location.id)
      .eq("service_date", today)
      .eq("status", "live")
      .maybeSingle();

    if (!service) {
      throw new Error("This service is no longer available.");
    }

    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("service_id", service.id)
      .eq("family_member_id", member.id)
      .maybeSingle();

    if (existing) {
      revalidatePath("/member/family");

      return {
        ok: true,
        message: `${member.first_name} is already checked in.`,
      };
    }

    const displayName = member.show_name_on_display
      ? [member.first_name, member.last_name]
          .filter(Boolean)
          .join(" ")
      : null;

    const { error } = await supabase
      .from("attendance")
      .insert({
        organisation_id: organisationId,
        service_id: service.id,
        family_member_id: member.id,
        display_name: displayName,
        is_serving: false,
      });

    if (error && error.code !== "23505") {
      throw error;
    }

    revalidatePath("/member/family");
    revalidatePath("/member");
    revalidatePath("/pastor/presence");
    revalidatePath("/display");

    return {
      ok: true,
      message:
        error?.code === "23505"
          ? `${member.first_name} is already checked in.`
          : `${member.first_name} is checked in.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not check in this family member.",
    };
  }
}

export async function addFamilyGuardian(formData: FormData) {
  try {
    const { supabase, user, organisationId } =
      await getFamilyContext();

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const relationship = String(
      formData.get("relationship") ?? ""
    ).trim();

    if (!email) {
      return {
        ok: false,
        message: "Please enter the guardian's email address.",
      };
    }

    const family = await getAccessibleFamily(
      supabase,
      user.id,
      organisationId
    );

    if (!family) {
      throw new Error(
        "Create your family first before adding another adult."
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, first_name")
      .ilike("email", email)
      .maybeSingle();

    if (!profile) {
      throw new Error(
        "No church member account was found with that email address."
      );
    }

    const { data: membership } = await supabase
      .from("organisation_memberships")
      .select("status")
      .eq("organisation_id", organisationId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (membership?.status !== "active") {
      throw new Error(
        "That person does not currently have an active church membership."
      );
    }

    const { error } = await supabase
      .from("family_guardians")
      .insert({
        organisation_id: organisationId,
        family_id: family.id,
        profile_id: profile.id,
        relationship: relationship || null,
      });

    if (error && error.code !== "23505") {
      throw error;
    }

    revalidatePath("/member/family");

    return {
      ok: true,
      message:
        error?.code === "23505"
          ? "This person already has access to your household."
          : "Household access added.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not add this household adult.",
    };
  }
}
