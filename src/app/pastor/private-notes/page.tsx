import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/session";
import MarkNoteReadButton from "./mark-note-read-button";

export default async function PastorPrivateNotesPage() {
  const { supabase, organisation } =
    await requireStaffSession();

  const { data: notes, error: notesError } = await supabase
    .from("private_notes")
    .select(`
      id,
      profile_id,
      message,
      is_read,
      created_at,
      read_at
    `)
    .eq("organisation_id", organisation.id)
    .order("created_at", { ascending: false });

  const profileIds = [
    ...new Set(
      (notes ?? [])
        .map((note) => note.profile_id)
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
            Pastoral care
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Private notes
          </h1>

          <p className="mt-3 text-slate-600">
            Confidential messages submitted by members.
          </p>
        </section>

        <section className="mt-8">
          {notesError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
              Private notes could not be loaded.
            </div>
          ) : !notes || notes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No private notes have been submitted.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => {
                const profile = profileMap.get(note.profile_id);

                const sender =
                  profile?.full_name?.trim() ||
                  profile?.first_name?.trim() ||
                  profile?.email ||
                  "Member";

                return (
                  <article
                    key={note.id}
                    className={
                      note.is_read
                        ? "rounded-2xl border border-slate-200 bg-white p-6"
                        : "rounded-2xl border border-purple-200 bg-purple-50 p-6"
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {sender}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Europe/London",
                          }).format(new Date(note.created_at))}
                        </p>
                      </div>

                      <MarkNoteReadButton
                        noteId={note.id}
                        isRead={note.is_read}
                      />
                    </div>

                    <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {note.message}
                    </p>

                    {note.is_read && note.read_at && (
                      <p className="mt-4 text-xs text-slate-500">
                        Read{" "}
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Europe/London",
                        }).format(new Date(note.read_at))}
                      </p>
                    )}
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
