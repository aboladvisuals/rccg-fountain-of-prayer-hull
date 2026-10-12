import Link from "next/link";
import { localDate } from "@/lib/member/dashboard";
import { requireMediaSession } from "@/lib/media/session";
import {
  setPresentationMode,
  showManualSlide,
} from "./actions";
import BirthdayPanel from "./birthday-panel";
import LivePreview from "./live-preview";
import ShowOnScreenButton from "./show-on-screen-button";

export default async function MediaDashboardPage() {
  const { supabase, organisation, role } =
    await requireMediaSession();

  const roleLabel =
    role === "admin"
      ? "Administrator"
      : role === "pastor"
        ? "Pastor"
        : "Media";

  const { data: location } = await supabase
    .from("church_locations")
    .select("id, timezone")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  const { data: presentationState } = location
    ? await supabase
        .from("presentation_state")
        .select(`
          mode,
          slide_type,
          title,
          content,
          updated_at
        `)
        .eq("organisation_id", organisation.id)
        .eq("location_id", location.id)
        .maybeSingle()
    : { data: null };

  let birthdayNames: string[] = [];

  if (location) {
    const today = localDate(
      new Date(),
      location.timezone
    );

    const [, month, day] = today
      .split("-")
      .map(Number);

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

    birthdayNames = [
      ...(profiles ?? []).map(
        (profile) =>
          profile.full_name?.trim() ||
          profile.first_name?.trim()
      ),

      ...(familyMembers ?? []).map(
        (member) =>
          [member.first_name, member.last_name]
            .filter(Boolean)
            .join(" ")
      ),
    ].filter(
      (name): name is string =>
        Boolean(name)
    );
  }

  const { data: presentationFeed } = await supabase
    .from("presentation_public_feed")
    .select(`
      content_type,
      content_id,
      title,
      content,
      published_at
    `)
    .eq("organisation_id", organisation.id)
    .or(
      location
        ? `location_id.eq.${location.id},location_id.is.null`
        : "location_id.is.null"
    )
    .order("published_at", { ascending: false });

  const publicTestimonies =
    presentationFeed?.filter(
      (item) => item.content_type === "testimony"
    ) ?? [];

  const activeAnnouncements =
    presentationFeed?.filter(
      (item) => item.content_type === "announcement"
    ) ?? [];

  let liveService: {
    id: string;
    title: string;
  } | null = null;

  let members: string[] = [];
  let visitors: string[] = [];
  let serving: string[] = [];

  if (location) {
    const today = localDate(
      new Date(),
      location.timezone
    );

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

    liveService = service;

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

      members = [
        ...new Set(
          (presence ?? [])
            .filter((person) => !person.is_visitor)
            .map((person) => person.display_name)
            .filter(
              (name): name is string =>
                typeof name === "string" &&
                name.trim().length > 0
            )
        ),
      ];

      visitors = [
        ...new Set(
          (presence ?? [])
            .filter((person) => person.is_visitor)
            .map((person) => person.display_name)
            .filter(
              (name): name is string =>
                typeof name === "string" &&
                name.trim().length > 0
            )
        ),
      ];

      serving = [
        ...new Set(
          (presence ?? [])
            .filter(
              (person) =>
                person.is_serving &&
                typeof person.display_name === "string"
            )
            .map((person) => person.display_name)
            .filter(
              (name): name is string =>
                typeof name === "string" &&
                name.trim().length > 0
            )
        ),
      ];
    }
  }

  async function showWelcome() {
    "use server";

    await showManualSlide({
      slideType: "welcome",
      title: "Welcome to Fountain of Prayer Hull",
      content:
        "Jesus Christ the same yesterday, and today, and forever.",
    });
  }

  async function showVerse(formData: FormData) {
    "use server";

    const reference = String(
      formData.get("reference") ?? ""
    ).trim();

    const verse = String(
      formData.get("verse") ?? ""
    ).trim();

    if (!reference || !verse) {
      return;
    }

    await showManualSlide({
      slideType: "verse",
      title: reference,
      content: verse,
    });
  }

  async function showLyrics(formData: FormData) {
    "use server";

    const songTitle = String(
      formData.get("songTitle") ?? ""
    ).trim();

    const lyrics = String(
      formData.get("lyrics") ?? ""
    ).trim();

    if (!songTitle || !lyrics) {
      return;
    }

    await showManualSlide({
      slideType: "lyrics",
      title: songTitle,
      content: lyrics,
    });
  }

  async function resumeAutomatic() {
    "use server";

    await setPresentationMode("auto");
  }

  async function clearDisplay() {
    "use server";

    await setPresentationMode("blank");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/member"
            className="text-sm font-semibold text-purple-700"
          >
            ← Member dashboard
          </Link>

          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
            {roleLabel}
          </span>
        </header>

        <section className="mt-8 rounded-3xl bg-purple-950 p-7 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
            {organisation.name}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Media Dashboard
          </h1>

          <p className="mt-3 max-w-3xl text-purple-100">
            Control presentation-safe content for the auditorium display.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Current presentation mode
              </p>

              <h2 className="mt-1 text-xl font-semibold capitalize">
                {presentationState?.mode ?? "Unavailable"}
              </h2>

              {presentationState?.mode === "manual" &&
                presentationState.title && (
                  <p className="mt-2 text-sm text-slate-600">
                    Showing: {presentationState.title}
                  </p>
                )}
            </div>

            <Link
              href="/display"
              target="_blank"
              className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-800"
            >
              Open live display ↗
            </Link>
          </div>
        </section>

        <LivePreview />

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <form action={showWelcome}>
            <button
              type="submit"
              className="w-full rounded-2xl bg-purple-700 p-6 text-left text-white transition hover:bg-purple-800"
            >
              <span className="text-sm text-purple-200">
                Manual presentation
              </span>

              <span className="mt-2 block text-lg font-semibold">
                Show Welcome
              </span>
            </button>
          </form>

          <form action={resumeAutomatic}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-purple-300"
            >
              <span className="text-sm text-slate-500">
                Display mode
              </span>

              <span className="mt-2 block text-lg font-semibold">
                Resume automatic rotation
              </span>
            </button>
          </form>

          <form action={clearDisplay}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-left text-red-900 transition hover:border-red-300"
            >
              <span className="text-sm text-red-600">
                Emergency control
              </span>

              <span className="mt-2 block text-lg font-semibold">
                Clear auditorium display
              </span>
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Live service
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Presence & serving
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Only presentation-safe names already permitted for display are shown here.
            </p>
          </div>

          {!liveService ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
              No live service is active right now.
            </div>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  {liveService.title}
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Presence
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Members & family
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {members.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Visitors
                    </p>

                    <p className="mt-2 text-2xl font-bold text-amber-900">
                      {visitors.length}
                    </p>
                  </div>
                </div>

                {members.length === 0 &&
                visitors.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No presentation-safe presence names are available yet.
                  </p>
                ) : (
                  <ShowOnScreenButton
                    slideType="presence"
                    title="We're glad you're here"
                    payload={{
                      members,
                      visitors,
                    }}
                  />
                )}
              </article>

              <article className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">
                  {liveService.title}
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Serving team
                </h3>

                <div className="mt-4 rounded-xl bg-purple-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                    Serving today
                  </p>

                  <p className="mt-2 text-2xl font-bold text-purple-950">
                    {serving.length}
                  </p>
                </div>

                {serving.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No presentation-safe serving names are available yet.
                  </p>
                ) : (
                  <ShowOnScreenButton
                    slideType="serving"
                    title="Thank you for serving"
                    payload={{
                      names: serving,
                    }}
                  />
                )}
              </article>
            </div>
          )}
        </section>

        <BirthdayPanel names={birthdayNames} />

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <form
            action={showVerse}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Bible presentation
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Show Bible verse
            </h2>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">
                Reference
              </span>

              <input
                name="reference"
                type="text"
                required
                maxLength={100}
                placeholder="John 3:16"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">
                Verse text
              </span>

              <textarea
                name="verse"
                required
                maxLength={2000}
                rows={7}
                placeholder="Enter the verse text to display..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
            >
              Show verse on screen
            </button>
          </form>

          <form
            action={showLyrics}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Worship presentation
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Show song lyrics
            </h2>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">
                Song title
              </span>

              <input
                name="songTitle"
                type="text"
                required
                maxLength={150}
                placeholder="Song title"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">
                Lyrics
              </span>

              <textarea
                name="lyrics"
                required
                maxLength={5000}
                rows={7}
                placeholder="Enter the section of lyrics to display..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
            >
              Show lyrics on screen
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Presentation-safe content
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Active announcements
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Only announcements currently active for the presentation feed appear here.
            </p>
          </div>

          {activeAnnouncements.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
              No active announcements are available.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {activeAnnouncements.map((announcement) => (
                <article
                  key={announcement.content_id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <h3 className="text-lg font-semibold">
                    {announcement.title || "Announcement"}
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {announcement.content}
                  </p>

                  <ShowOnScreenButton
                    slideType="announcement"
                    title={
                      announcement.title || "Announcement"
                    }
                    content={announcement.content}
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Presentation-safe content
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Public testimonies
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Only testimonies already approved and published by the pastoral team appear here.
            </p>
          </div>

          {publicTestimonies.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
              No approved public testimonies are available.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {publicTestimonies.map((testimony) => (
                <article
                  key={testimony.content_id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <h3 className="text-lg font-semibold">
                    {testimony.title || "Testimony"}
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {testimony.content}
                  </p>

                  <ShowOnScreenButton
                    slideType="testimony"
                    title={testimony.title || "Testimony"}
                    content={testimony.content}
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/pastor/announcements"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <p className="text-sm text-slate-500">
              Presentation content
            </p>

            <h2 className="mt-2 text-lg font-semibold">
              Announcements →
            </h2>
          </Link>

          <Link
            href="/pastor/display-settings"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <p className="text-sm text-slate-500">
              Display behaviour
            </p>

            <h2 className="mt-2 text-lg font-semibold">
              Display settings →
            </h2>
          </Link>
        </section>
      </div>
    </main>
  );
}