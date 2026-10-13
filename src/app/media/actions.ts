"use server";

import { revalidatePath } from "next/cache";

import { requireMediaSession } from "@/lib/media/session";

type ManualSlideType =
  | "welcome"
  | "announcement"
  | "testimony"
  | "birthday"
  | "presence"
  | "serving"
  | "verse"
  | "lyrics";

type AutoNavigationDirection = "next" | "previous";

async function getHullLocation() {
  const { supabase, user, organisation } =
    await requireMediaSession();

  const { data: location } = await supabase
    .from("church_locations")
    .select("id")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  return {
    supabase,
    user,
    organisation,
    location,
  };
}

export async function setPresentationMode(
  mode: "auto" | "blank"
) {
  const { supabase, user, organisation, location } =
    await getHullLocation();

  if (!location) {
    return {
      ok: false,
      message: "Hull location could not be found.",
    };
  }

  const { error } = await supabase
    .from("presentation_state")
    .update({
      mode,
      slide_type: null,
      title: null,
      content: null,
      payload: {},
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("organisation_id", organisation.id)
    .eq("location_id", location.id);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/media");
  revalidatePath("/display");

  return {
    ok: true,
    message:
      mode === "auto"
        ? "Automatic rotation resumed."
        : "Auditorium display cleared.",
  };
}

export async function navigateAutomaticSlides(
  direction: AutoNavigationDirection
) {
  const { supabase, user, organisation, location } =
    await getHullLocation();

  if (!location) {
    return {
      ok: false,
      message: "Hull location could not be found.",
    };
  }

  const commandId = crypto.randomUUID();

  const { error } = await supabase
    .from("presentation_state")
    .update({
      mode: "auto",
      slide_type: null,
      title: null,
      content: null,
      payload: {
        auto_command: direction,
        auto_command_id: commandId,
      },
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("organisation_id", organisation.id)
    .eq("location_id", location.id);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/media");
  revalidatePath("/display");

  return {
    ok: true,
    message:
      direction === "next"
        ? "Moved to next automatic slide."
        : "Moved to previous automatic slide.",
  };
}

export async function showManualSlide(input: {
  slideType: ManualSlideType;
  title: string;
  content?: string;
  payload?: Record<string, unknown>;
}) {
  const { supabase, user, organisation, location } =
    await getHullLocation();

  const title = input.title.trim();
  const content = input.content?.trim() || null;

  if (!title) {
    return {
      ok: false,
      message: "A slide title is required.",
    };
  }

  if (!location) {
    return {
      ok: false,
      message: "Hull location could not be found.",
    };
  }

  const { error } = await supabase
    .from("presentation_state")
    .update({
      mode: "manual",
      slide_type: input.slideType,
      title,
      content,
      payload: input.payload ?? {},
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("organisation_id", organisation.id)
    .eq("location_id", location.id);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/media");
  revalidatePath("/display");

  return {
    ok: true,
    message: "Slide sent to auditorium display.",
  };
}