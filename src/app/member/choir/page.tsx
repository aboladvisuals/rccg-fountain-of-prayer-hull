import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";
import { loadMyMemberships } from "@/lib/departments/workspace";
import DepartmentWorkspace from "../departments/workspace";

const CHOIR_SLUG = "choir-and-worship";

export default async function ChoirPage() {
  const { supabase, user } = await requireMemberSession();
  const { rows } = await loadMyMemberships(supabase, user.id);
  const choir = rows.find((row) => row.department?.slug === CHOIR_SLUG && row.status !== "inactive");

  if (!choir?.department || choir.status !== "active") {
    return (
      <main className="app-page">
        <div className="mx-auto max-w-3xl">
          <Link href="/member" className="text-sm font-semibold text-purple-700">← Member dashboard</Link>
          <h1 className="display-title mt-6 text-3xl">Choir</h1>
          <p className="mt-3 text-slate-600">
            {choir?.status === "pending"
              ? "Your Choir and Worship membership is pending. You can respond to an invitation from your member dashboard."
              : "You need an active Choir and Worship assignment to view this page."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="mx-auto max-w-6xl">
        <Link href="/member" className="text-sm font-semibold text-purple-700">← Member dashboard</Link>
        <section className="app-hero mt-6 p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Ministry workspace</p>
          <h1 className="display-title mt-3 text-4xl sm:text-5xl">{choir.department.name}</h1>
          <p className="mt-3 max-w-2xl text-purple-100">Rehearsals, services and your availability in one place. Song titles and references only — lyrics and scores are not stored.</p>
        </section>
        <DepartmentWorkspace supabase={supabase} userId={user.id} department={choir.department} membership={{ id: choir.id, status: choir.status, origin: choir.origin }} variant="choir" />
      </div>
    </main>
  );
}
