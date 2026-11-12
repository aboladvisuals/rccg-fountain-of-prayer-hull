import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/session";
import { getDepartment, listDepartmentMembers } from "@/lib/admin/departments";
import ActionForm from "@/components/ui/ActionForm";
import { assignMember } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function DepartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, organisation } = await requireAdminSession();
  const { data: department } = await getDepartment(
    supabase,
    organisation.id,
    id
  );

  if (!department) {
    notFound();
  }

  const { data: memberships } = await listDepartmentMembers(supabase, id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, email")
    .order("full_name")
    .limit(200);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/departments"
          className="text-sm font-semibold text-purple-700"
        >
          ← Departments
        </Link>
        <h1 className="mt-6 text-3xl font-bold">{department.name}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {department.is_active ? "Active" : "Inactive"}
          {department.is_child_facing ? " · Child-facing" : ""}
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Assign member</h2>
          <ActionForm action={assignMember} submitLabel="Save assignment" pendingLabel="Saving…" className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="departmentId" value={department.id} />
            <select
              name="profileId"
              required
              className="rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="">Select member</option>
              {(profiles ?? []).map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name || profile.first_name || profile.email}
                </option>
              ))}
            </select>
            <select
              name="status"
              className="rounded-xl border border-slate-300 px-4 py-3"
              defaultValue="active"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </ActionForm>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Roster</h2>
          {(memberships ?? []).length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No members assigned yet.
            </p>
          ) : (
            (memberships ?? []).map((row) => {
              const profile = Array.isArray(row.profile)
                ? row.profile[0]
                : row.profile;
              const name =
                profile?.full_name ||
                profile?.first_name ||
                profile?.email ||
                "Unnamed";
              return (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="font-semibold">{name}</p>
                  <p className="mt-1 text-sm capitalize text-slate-500">
                    {row.status}
                  </p>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
