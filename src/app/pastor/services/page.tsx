import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/session";
import { localDate } from "@/lib/member/dashboard";
import ServiceForm from "./service-form";
import ServiceControls from "./service-controls";

export default async function ServicesPage() {
  const { supabase, organisation } =
    await requireStaffSession();

  const { data: location } = await supabase
    .from("church_locations")
    .select("id, timezone")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  let services: {
    id: string;
    title: string;
    service_date: string;
    starts_at: string | null;
    status:
      | "scheduled"
      | "live"
      | "completed"
      | "cancelled";
  }[] = [];

  if (location) {
    const today = localDate(
      new Date(),
      location.timezone
    );

    const { data } = await supabase
      .from("services")
      .select(`
        id,
        title,
        service_date,
        starts_at,
        status
      `)
      .eq("organisation_id", organisation.id)
      .eq("location_id", location.id)
      .eq("service_date", today)
      .order("starts_at", {
        ascending: true,
        nullsFirst: false,
      });

    services = data ?? [];
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
            Service management
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Church services
          </h1>

          <p className="mt-3 text-slate-600">
            Create, start and complete today&apos;s church services.
          </p>
        </section>

        <section className="mt-8">
          <ServiceForm />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Today&apos;s services
          </h2>

          {services.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No services have been created for today.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {service.title}
                      </h3>

                      {service.starts_at && (
                        <p className="mt-1 text-sm text-slate-500">
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
                            new Date(service.starts_at)
                          )}
                        </p>
                      )}
                    </div>

                    <span
                      className={
                        service.status === "live"
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
                          : service.status ===
                            "completed"
                          ? "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                          : service.status ===
                            "cancelled"
                          ? "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                          : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                      }
                    >
                      {service.status}
                    </span>
                  </div>

                  <ServiceControls
                    serviceId={service.id}
                    status={service.status}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
