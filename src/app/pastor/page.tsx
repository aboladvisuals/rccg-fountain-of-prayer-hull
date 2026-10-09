import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/session";
import { localDate } from "@/lib/member/dashboard";

export default async function PastorDashboardPage() {
  const { supabase, organisation, role } =
    await requireStaffSession();

  const { data: location } = await supabase
    .from("church_locations")
    .select("id, name, timezone")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  let service: {
    id: string;
    title: string;
  } | null = null;

  let totalPresent = 0;
  let membersPresent = 0;
  let visitorsPresent = 0;

  if (location) {
    const today = localDate(new Date(), location.timezone);

    const { data: liveService } = await supabase
      .from("services")
      .select("id, title")
      .eq("organisation_id", organisation.id)
      .eq("location_id", location.id)
      .eq("service_date", today)
      .eq("status", "live")
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    service = liveService;

    if (service) {
      const [
        attendanceResult,
        visitorResult,
      ] = await Promise.all([
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("organisation_id", organisation.id)
          .eq("service_id", service.id),

        supabase
          .from("visitors")
          .select("id", { count: "exact", head: true })
          .eq("organisation_id", organisation.id)
          .eq("service_id", service.id),
      ]);

      membersPresent = attendanceResult.count ?? 0;
      visitorsPresent = visitorResult.count ?? 0;
      totalPresent = membersPresent + visitorsPresent;
    }
  }

  const [
    unreadNotesResult,
    pendingTestimoniesResult,
  ] = await Promise.all([
    supabase
      .from("private_notes")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisation.id)
      .eq("is_read", false),

    supabase
      .from("testimonies")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisation.id)
      .eq("is_approved", false),
  ]);

  const unreadNotes = unreadNotesResult.count ?? 0;
  const pendingTestimonies =
    pendingTestimoniesResult.count ?? 0;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">

        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/member"
            className="text-sm font-semibold text-purple-700"
          >
            ← Member dashboard
          </Link>

          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
            {role === "admin" ? "Administrator" : "Pastor"}
          </span>
        </header>

        <section className="mt-8 rounded-3xl bg-purple-950 p-7 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
            {organisation.name}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Pastor & Admin Dashboard
          </h1>

          <p className="mt-3 text-purple-100">
            Live church operations, pastoral care and service management.
          </p>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              Today&apos;s overview
            </h2>

            {service && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800">
                {service.title} · Live
              </span>
            )}
          </div>

          {!service ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
              <p className="font-semibold">
                No live service right now
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">
                  Total present
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {totalPresent}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">
                  Members & family
                </p>
                <p className="mt-2 text-3xl font-bold text-purple-700">
                  {membersPresent}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">
                  Visitors
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {visitorsPresent}
                </p>
              </article>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">

          <Link
            href="/pastor/presence"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <p className="text-sm text-slate-500">
              Live service
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Live presence →
            </h2>
          </Link>

          <Link
            href="/pastor/visitors"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <p className="text-sm text-slate-500">
              Welcome ministry
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Visitors today →
            </h2>
          </Link>

          <Link
            href="/pastor/private-notes"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Pastoral care
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                  Private notes →
                </h2>
              </div>

              {unreadNotes > 0 && (
                <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                  {unreadNotes}
                </span>
              )}
            </div>
          </Link>

          <Link
            href="/pastor/testimonies"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  Review
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                  Testimonies →
                </h2>
              </div>

              {pendingTestimonies > 0 && (
                <span className="rounded-full bg-amber-500 px-3 py-1 text-sm font-semibold text-white">
                  {pendingTestimonies}
                </span>
              )}
            </div>
          </Link>

          <Link
            href="/pastor/announcements"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <p className="text-sm text-slate-500">
              Display management
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
              Auditorium controls
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Display settings →
            </h2>
          </Link>

          <Link
            href="/display"
            target="_blank"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300"
          >
            <p className="text-sm text-slate-500">
              Big screen
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Open auditorium display ↗
            </h2>
          </Link>

        </section>
      </div>
    </main>
  );
}

