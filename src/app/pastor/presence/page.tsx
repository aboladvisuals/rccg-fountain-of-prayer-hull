import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/session";
import { localDate } from "@/lib/member/dashboard";

export default async function LivePresencePage() {
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

  let attendance: {
    id: string;
    profile_id: string | null;
    family_member_id: string | null;
    display_name: string | null;
    is_serving: boolean;
    checked_in_at: string;
  }[] = [];

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
      const [attendanceResult, visitorResult] =
        await Promise.all([
          supabase
            .from("attendance")
            .select(`
              id,
              profile_id,
              family_member_id,
              display_name,
              is_serving,
              checked_in_at
            `)
            .eq("organisation_id", organisation.id)
            .eq("service_id", service.id)
            .order("checked_in_at", {
              ascending: true,
            }),

          supabase
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
              ascending: true,
            }),
        ]);

      attendance =
        attendanceResult.data ?? [];

      visitors =
        visitorResult.data ?? [];
    }
  }

  const totalPresent =
    attendance.length + visitors.length;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/pastor"
          className="text-sm font-semibold text-purple-700"
        >
          ← Back to Pastor & Admin Dashboard
        </Link>

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Live service
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Live presence
          </h1>

          <p className="mt-3 text-slate-600">
            Members, family and visitors currently checked in.
          </p>
        </section>

        {!service ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold">
              No live service right now.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-3xl bg-purple-950 p-7 text-white">
              <p className="text-sm text-purple-200">
                {service.title}
              </p>

              <p className="mt-2 text-4xl font-bold">
                {totalPresent}
              </p>

              <p className="mt-1 text-sm text-purple-200">
                Total present
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-bold">
                Members & family
              </h2>

              {attendance.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                  No members checked in yet.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {attendance.map((person) => (
                    <article
                      key={person.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {person.display_name ||
                              "Name hidden"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {person.profile_id
                              ? "Member"
                              : "Family member"}
                          </p>
                        </div>

                        {person.is_serving && (
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                            Serving
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        Checked in{" "}
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
                            person.checked_in_at
                          )
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-bold">
                Visitors
              </h2>

              {visitors.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                  No visitors checked in yet.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {visitors.map((visitor) => {
                    const name =
                      visitor.show_name_on_display
                        ? [
                            visitor.first_name,
                            visitor.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ") || "Visitor"
                        : "Name hidden";

                    return (
                      <article
                        key={visitor.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                      >
                        <p className="font-semibold">
                          {name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Visitor
                        </p>

                        <p className="mt-4 text-xs text-slate-500">
                          Checked in{" "}
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
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}




