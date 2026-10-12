import LivePreview from "./live-preview";
import Link from "next/link";
import { requireMediaSession } from "@/lib/media/session";
import {
  setPresentationMode,
  showManualSlide,
} from "./actions";
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
    .select("id")
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
              <LivePreview />

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