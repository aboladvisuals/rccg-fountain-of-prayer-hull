import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberSession } from "@/lib/member/session";
import { isUuid } from "@/lib/departments/permissions";
import { loadDepartment } from "@/lib/departments/workspace";
import DepartmentWorkspace from "../workspace";

type Props = { params: Promise<{ id: string }> };

export default async function DepartmentPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await requireMemberSession();
  // RLS: only active members of the church organisation can read departments.
  const department = await loadDepartment(supabase, id);
  if (!department) notFound();
  const { data: membership } = await supabase
    .from("department_memberships")
    .select("id, status, origin")
    .eq("department_id", id)
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <main className="app-page">
      <div className="mx-auto max-w-6xl">
        <Link href="/member" className="text-sm font-semibold text-purple-700">← Member dashboard</Link>
        <section className="app-hero mt-6 p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Department</p>
          <h1 className="display-title mt-3 text-4xl sm:text-5xl">{department.name}</h1>
          {department.description && <p className="mt-3 max-w-2xl text-purple-100">{department.description}</p>}
        </section>
        <DepartmentWorkspace supabase={supabase} userId={user.id} department={department} membership={membership ? { id: membership.id, status: membership.status, origin: membership.origin ?? "admin" } : null} />
      </div>
    </main>
  );
}
