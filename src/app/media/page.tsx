import Link from "next/link";
import { requireMediaSession } from "@/lib/media/session";

export default async function MediaDashboardPage() {
  const { organisation, role } = await requireMediaSession();

  const roleLabel =
    role === "admin"
      ? "Administrator"
      : role === "pastor"
        ? "Pastor"
        : "Media";

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
            Control presentation-safe content for the auditorium display
            without exposing private pastoral or member information.
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/display"
            target="_blank"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <p className="text-sm text-slate-500">
              Auditorium
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Open live display ↗
            </h2>
          </Link>

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

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            Media controls are being expanded
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Next we will add a presentation controller, preview, Show on Screen,
            Bible verses, lyrics, welcome screens, approved testimonies,
            attendance-safe presentation data, and Supabase Realtime.
          </p>
        </section>
      </div>
    </main>
  );
}