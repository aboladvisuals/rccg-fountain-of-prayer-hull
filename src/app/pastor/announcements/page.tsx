import Link from "next/link";
import { requireMediaSession } from "@/lib/media/session";
import AnnouncementForm from "./announcement-form";
import AnnouncementToggle from "./announcement-toggle";

export default async function PastorAnnouncementsPage() {
  const { supabase, organisation } =
    await requireMediaSession();

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select(`
      id,
      title,
      content,
      is_active,
      created_at
    `)
    .eq("organisation_id", organisation.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/media"
          className="text-sm font-semibold text-purple-700"
        >
          ← Back to Media Dashboard
        </Link>

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Display management
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Announcements
          </h1>

          <p className="mt-3 text-slate-600">
            Create announcements for the church display and presentation feed.
          </p>
        </section>

        <section className="mt-8">
          <AnnouncementForm />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Existing announcements
          </h2>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
              Announcements could not be loaded.
            </div>
          ) : !announcements || announcements.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No announcements yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {announcement.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Europe/London",
                        }).format(
                          new Date(announcement.created_at)
                        )}
                      </p>
                    </div>

                    <span
                      className={
                        announcement.is_active
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
                          : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      }
                    >
                      {announcement.is_active
                        ? "Active"
                        : "Hidden"}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {announcement.content}
                  </p>

                  <AnnouncementToggle
                    announcementId={announcement.id}
                    active={announcement.is_active}
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