import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/session";
import { localDate } from "@/lib/member/dashboard";

export default async function PastorVisitorsPage() {
  const { supabase, organisation } =
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

  let visitors: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    show_name_on_display: boolean;
    created_at: string;
  }[] = [];

  if (location) {
    const today = localDate(
      new Date(),
      location.timezone
    );

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
      const { data } = await supabase
        .from("visitors")
        .select(`
          id,
          first_name,
          last_name,
          show_name_on_display,
          created_at
        `)
        .eq("organisation_id", organisation.id)
        .eq("service_id", service.id)
        .order("created_at", {
          ascending: false,
        });

      visitors = data ?? [];
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/pastor"
          className="text-sm font-semibold text-purple-700"
        >
          ← Back to Pastor & Admin Dashboard
        </Link>

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Welcome ministry
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Visitors today
          </h1>

          <p className="mt-3 text-slate-600">
            Visitors checked into the current live service.
          </p>
        </section>

        {service && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-semibold text-green-800">
              Live service
            </p>

            <p className="mt-1 font-semibold">
              {service.title}
            </p>
          </section>
        )}

        <section className="mt-8">
          {!service ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No live service right now.
            </div>
          ) : visitors.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No visitors have checked in yet.
            </div>
          ) : (
            <div className="space-y-4">
              {visitors.map((visitor) => {
                const fullName = [
                  visitor.first_name,
                  visitor.last_name,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <article
                    key={visitor.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {fullName || "Visitor"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Visitor
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        Checked in
                      </span>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-sm text-slate-600">
                        Checked in at{" "}
                        {new Intl.DateTimeFormat(
                          "en-GB",
                          {
                            timeZone:
                              location?.timezone ??
                              "Europe/London",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        ).format(
                          new Date(
                            visitor.created_at
                          )
                        )}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Display name:{" "}
                        <span className="font-medium text-slate-900">
                          {visitor.show_name_on_display
                            ? fullName || "Visitor"
                            : "Not shared"}
                        </span>
                      </p>
                    </div>
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


