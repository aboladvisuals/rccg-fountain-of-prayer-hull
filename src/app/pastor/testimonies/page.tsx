import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/session";
import TestimonyControls from "./testimony-controls";

export default async function PastorTestimoniesPage() {
  const { supabase, organisation } =
    await requireStaffSession();

  const { data: testimonies, error } = await supabase
    .from("testimonies")
    .select(`
      id,
      profile_id,
      title,
      content,
      is_approved,
      is_public,
      created_at
    `)
    .eq("organisation_id", organisation.id)
    .order("created_at", { ascending: false });

  const profileIds = [
    ...new Set(
      (testimonies ?? [])
        .map((testimony) => testimony.profile_id)
        .filter(Boolean)
    ),
  ];

  const { data: profiles } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, first_name, email")
          .in("id", profileIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile,
    ])
  );

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
            Review
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Testimonies
          </h1>

          <p className="mt-3 text-slate-600">
            Review member testimonies before approving or publishing them.
          </p>
        </section>

        <section className="mt-8">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
              Testimonies could not be loaded.
            </div>
          ) : !testimonies || testimonies.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No testimonies have been submitted.
            </div>
          ) : (
            <div className="space-y-4">
              {testimonies.map((testimony) => {
                const profile =
                  profileMap.get(testimony.profile_id);

                const sender =
                  profile?.full_name?.trim() ||
                  profile?.first_name?.trim() ||
                  profile?.email ||
                  "Member";

                return (
                  <article
                    key={testimony.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {sender}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Europe/London",
                          }).format(
                            new Date(testimony.created_at)
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={
                            testimony.is_approved
                              ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
                              : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                          }
                        >
                          {testimony.is_approved
                            ? "Approved"
                            : "Awaiting approval"}
                        </span>

                        {testimony.is_public && (
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                            Public
                          </span>
                        )}
                      </div>
                    </div>

                    {testimony.title && (
                      <h2 className="mt-5 text-lg font-semibold">
                        {testimony.title}
                      </h2>
                    )}

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {testimony.content}
                    </p>

                    <TestimonyControls
                      testimonyId={testimony.id}
                      approved={testimony.is_approved}
                      isPublic={testimony.is_public}
                    />
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
