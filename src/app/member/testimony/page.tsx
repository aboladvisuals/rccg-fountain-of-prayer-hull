import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";
import TestimonyForm from "./testimony-form";

export default async function TestimonyPage() {
  const { supabase, user } = await requireMemberSession();

  const { data: testimonies } = await supabase
    .from("testimonies")
    .select("id, title, content, is_approved, is_public, created_at")
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
            Testimony
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Share what God has done
          </h1>

          <p className="mt-3 text-slate-600">
            Submit your testimony for pastoral review.
          </p>
        </section>

        <section className="mt-8">
          <TestimonyForm />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Your testimonies
          </h2>

          {!testimonies || testimonies.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              You have not submitted any testimonies yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {testimonies.map((testimony) => (
                <article
                  key={testimony.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={
                        testimony.is_approved
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
                          : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                      }
                    >
                      {testimony.is_approved
                        ? testimony.is_public
                          ? "Approved · Public"
                          : "Approved"
                        : "Awaiting approval"}
                    </span>

                    <span className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/London",
                      }).format(new Date(testimony.created_at))}
                    </span>
                  </div>

                  {testimony.title && (
                    <h3 className="mt-4 text-lg font-semibold">
                      {testimony.title}
                    </h3>
                  )}

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {testimony.content}
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
