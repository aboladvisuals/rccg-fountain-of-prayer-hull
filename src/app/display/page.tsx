import { createClient } from "@/lib/supabase/server";
import { localDate } from "@/lib/member/dashboard";
import RotatingDisplay, {
  type DisplaySlide,
  type PresentationState,
} from "./display-client";

export const dynamic = "force-dynamic";

export default async function DisplayPage() {
  const supabase = await createClient();

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("slug", "rccg-fountain-of-prayer-hull")
    .eq("is_active", true)
    .maybeSingle();

  const slides: DisplaySlide[] = [];

  if (!organisation) {
    return (
      <RotatingDisplay
        serviceTitle="Welcome"
        organisationId={null}
        locationId={null}
        initialPresentationState={null}
        slides={[
          {
            type: "welcome",
            title: "Fountain of Prayer Hull",
            content:
              "Jesus Christ the same yesterday, and today, and forever.",
          },
        ]}
      />
    );
  }

  const { data: location } = await supabase
    .from("church_locations")
    .select("id, timezone")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  if (!location) {
    return null;
  }

  const { data: presentationState } = await supabase
    .from("presentation_state")
    .select(`
      mode,
      slide_type,
      title,
      content,
      payload,
      updated_at
    `)
    .eq("organisation_id", organisation.id)
    .eq("location_id", location.id)
    .maybeSingle();

  const today = localDate(new Date(), location.timezone);
  const [, month, day] = today.split("-").map(Number);

  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("organisation_id", organisation.id)
    .eq("location_id", location.id)
    .eq("service_date", today)
    .eq("status", "live")
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("display_settings")
    .select(`
      welcome_message,
      show_birthdays,
      show_serving_team,
      show_presence
    `)
    .eq("organisation_id", organisation.id)
    .eq("location_id", location.id)
    .maybeSingle();

  slides.push({
    type: "welcome",
    title: "Welcome to Fountain of Prayer Hull",
    content:
      settings?.welcome_message ||
      "Jesus Christ the same yesterday, and today, and forever.",
  });

  const { data: feed } = await supabase
    .from("presentation_public_feed")
    .select(`
      content_type,
      content_id,
      title,
      content,
      published_at
    `)
    .eq("organisation_id", organisation.id)
    .or(`location_id.eq.${location.id},location_id.is.null`)
    .order("published_at", { ascending: false });

  for (const item of feed ?? []) {
    if (item.content_type === "announcement") {
      slides.push({
        type: "announcement",
        title: item.title || "Announcement",
        content: item.content,
      });
    }

    if (item.content_type === "testimony") {
      slides.push({
        type: "testimony",
        title: item.title || "Testimony",
        content: item.content,
      });
    }
  }

  if (service) {
    const { data: presence } = await supabase
      .from("live_presence")
      .select(`
        display_name,
        is_visitor,
        is_serving
      `)
      .eq("organisation_id", organisation.id)
      .eq("location_id", location.id)
      .eq("service_id", service.id)
      .not("display_name", "is", null);

    const members =
      presence
        ?.filter((person) => !person.is_visitor)
        .map((person) => person.display_name)
        .filter((name): name is string => Boolean(name)) ?? [];

    const visitors =
      presence
        ?.filter((person) => person.is_visitor)
        .map((person) => person.display_name)
        .filter((name): name is string => Boolean(name)) ?? [];

    const serving =
      presence
        ?.filter(
          (person) =>
            person.is_serving && Boolean(person.display_name)
        )
        .map((person) => person.display_name)
        .filter((name): name is string => Boolean(name)) ?? [];

    if (
      settings?.show_presence !== false &&
      (members.length > 0 || visitors.length > 0)
    ) {
      slides.push({
        type: "presence",
        title: "We're glad you're here",
        members,
        visitors,
      });
    }

    if (
      settings?.show_serving_team !== false &&
      serving.length > 0
    ) {
      slides.push({
        type: "serving",
        title: "Thank you for serving",
        names: serving,
      });
    }
  }

  if (settings?.show_birthdays !== false) {
    const [{ data: profiles }, { data: familyMembers }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, first_name")
          .eq("birth_month", month)
          .eq("birth_day", day)
          .eq("show_name_on_display", true),

        supabase
          .from("family_members")
          .select("first_name, last_name")
          .eq("organisation_id", organisation.id)
          .eq("birth_month", month)
          .eq("birth_day", day)
          .eq("show_name_on_display", true),
      ]);

    const birthdayNames = [
      ...(profiles ?? []).map(
        (profile) =>
          profile.full_name?.trim() ||
          profile.first_name?.trim()
      ),
      ...(familyMembers ?? []).map((member) =>
        [member.first_name, member.last_name]
          .filter(Boolean)
          .join(" ")
      ),
    ].filter((name): name is string => Boolean(name));

    if (birthdayNames.length > 0) {
      slides.push({
        type: "birthday",
        title: "Happy Birthday!",
        names: birthdayNames,
      });
    }
  }

  const initialPresentationState: PresentationState | null =
    presentationState
      ? {
          mode: presentationState.mode as
            | "auto"
            | "manual"
            | "blank",
          slideType: presentationState.slide_type,
          title: presentationState.title,
          content: presentationState.content,
          payload:
            presentationState.payload &&
            typeof presentationState.payload === "object"
              ? presentationState.payload
              : {},
          updatedAt: presentationState.updated_at,
        }
      : null;

  return (
    <RotatingDisplay
      slides={slides}
      serviceTitle={service?.title ?? "Welcome"}
      organisationId={organisation.id}
      locationId={location.id}
      initialPresentationState={initialPresentationState}
    />
  );
}