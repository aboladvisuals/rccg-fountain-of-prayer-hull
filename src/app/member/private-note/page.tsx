import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";
import PrivateNoteForm from "./private-note-form";

export default async function PrivateNotePage() {
  const { supabase, user } = await requireMemberSession();

  const { data: notes } = await supabase
    .from("private_notes")
    .select("id, message, is_read, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

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
            Pastoral care
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Private note
          </h1>

          <p className="mt-3 text-slate-600">
            Send a confidential message to the pastoral team.
          </p>
        </section>

        <section className="mt-8">
          <PrivateNoteForm />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Your previous notes
          </h2>

          {!notes || notes.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              You have not sent any private notes yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={
                        note.is_read
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
                          : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                      }
                    >
                      {note.is_read
                        ? "Seen by pastoral team"
                        : "Sent"}
                    </span>

                    <span className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/London",
                      }).format(new Date(note.created_at))}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {note.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
