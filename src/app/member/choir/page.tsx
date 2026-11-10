import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";

export default async function ChoirPage() {
  const { supabase, user } = await requireMemberSession();

  const { data: membership } = await supabase
    .from("department_memberships")
    .select(
      `
        id,
        status,
        department:church_departments!inner (id, slug)
      `
    )
    .eq("profile_id", user.id)
    .eq("status", "active")
    .eq("department.slug", "choir-and-worship")
    .maybeSingle();

  if (!membership) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/member" className="text-sm font-semibold text-purple-700">
            ← Member dashboard
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Choir</h1>
          <p className="mt-3 text-slate-600">
            You need an active Choir and Worship assignment to view this page.
          </p>
        </div>
      </main>
    );
  }

  const department = Array.isArray(membership.department)
    ? membership.department[0]
    : membership.department;
  const departmentId = department?.id;

  const { data: events } = departmentId
    ? await supabase
        .from("department_events")
        .select("id, title, starts_at, ends_at, venue, status")
        .eq("department_id", departmentId)
        .order("starts_at", { ascending: true })
        .limit(20)
    : { data: [] };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/member" className="text-sm font-semibold text-purple-700">
          ← Member dashboard
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Choir</h1>
        <p className="mt-2 text-sm text-slate-500">Europe/London times.</p>
        <div className="mt-6 space-y-3">
          {(events ?? []).length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No rehearsals scheduled yet.
            </p>
          ) : (
            (events ?? []).map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <h2 className="font-semibold">{event.title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Europe/London",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.starts_at))}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {event.status}
                </p>
              </article>
            ))
          )}
        </div>
        <div className="mt-6 flex gap-4 text-sm font-semibold">
          <Link href="/member/bible" className="text-purple-700">
            Bible →
          </Link>
          <Link href="/member/hymnal" className="text-purple-700">
            Hymnal →
          </Link>
        </div>
      </div>
    </main>
  );
}
