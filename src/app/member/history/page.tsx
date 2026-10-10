import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";

export default async function AttendanceHistoryPage() {
  const { supabase, user } = await requireMemberSession();

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("slug", "rccg-fountain-of-prayer-hull")
    .eq("is_active", true)
    .maybeSingle();

  let rows: {
    id: string;
    checked_in_at: string;
    is_serving: boolean;
    services: {
      title: string;
      service_date: string;
      starts_at: string | null;
    }[];
  }[] = [];

  if (organisation) {
    const result = await supabase
      .from("attendance")
      .select(`
        id,
        checked_in_at,
        is_serving,
        services (
          title,
          service_date,
          starts_at
        )
      `)
      .eq("organisation_id", organisation.id)
      .eq("profile_id", user.id)
      .order("checked_in_at", { ascending: false });

    rows = result.data ?? [];
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/member"
          className="text-sm font-semibold text-purple-700"
        >
          ← Back to member dashboard
        </Link>

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Attendance
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Your attendance history
          </h1>

          <p className="mt-3 text-slate-600">
            A record of the church services you have checked into.
          </p>
        </section>

        <section className="mt-8">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No attendance records yet.
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => {
                const service = row.services?.[0] ?? null;

                return (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {service?.title ?? "Church service"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {service?.service_date
                            ? new Intl.DateTimeFormat("en-GB", {
                                dateStyle: "full",
                                timeZone: "Europe/London",
                              }).format(
                                new Date(
                                  `${service.service_date}T12:00:00`
                                )
                              )
                            : "Date unavailable"}
                        </p>
                      </div>

                      {row.is_serving && (
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                          Serving
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-sm text-slate-600">
                      Checked in at{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        timeZone: "Europe/London",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(row.checked_in_at))}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

