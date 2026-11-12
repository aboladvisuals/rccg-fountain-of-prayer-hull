import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/session";
import { listDepartments } from "@/lib/admin/departments";
import ActionForm from "@/components/ui/ActionForm";
import { createDepartment, setDepartmentActive } from "./actions";

export default async function AdminDepartmentsPage() {
  const { supabase, organisation } = await requireAdminSession();
  const { data, error } = await listDepartments(supabase, organisation.id);

  if (error) {
    throw new Error("Unable to load departments.");
  }

  const departments = data ?? [];

  return (
    <main className="app-page">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/pastor" className="text-sm font-semibold text-purple-700">
            ← Pastor & Admin Dashboard
          </Link>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
            Administrator
          </span>
        </header>

        <section className="app-hero mt-8 p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
            {organisation.name}
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl display-title">Departments</h1>
          <p className="mt-3 max-w-3xl text-purple-100">
            Create, activate and archive church departments. Assignments never change application roles.
          </p>
        </section>

        <section className="app-card mt-8 p-6">
          <h2 className="text-lg font-semibold">New department</h2>
          <ActionForm action={createDepartment} submitLabel="Create inactive department" pendingLabel="Creating…" resetOnSuccess className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Name</span>
              <input
                name="name"
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Description</span>
              <textarea
                name="description"
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isChildFacing" />
              Child-facing (extra privacy)
            </label>
          </ActionForm>
        </section>

        <section className="mt-8 space-y-4">
          {departments.length === 0 ? (
            <p className="app-card p-6">
              No departments yet. Apply the migration seed or create one above.
            </p>
          ) : (
            departments.map((department) => (
              <article
                key={department.id}
                className="app-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{department.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {department.is_active ? "Active" : "Inactive"}
                      {department.is_child_facing ? " · Child-facing" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/departments/${department.id}`}
                      className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 btn-secondary min-h-11"
                    >
                      Manage
                    </Link>
                    <ActionForm
                      action={setDepartmentActive}
                      submitLabel={department.is_active ? "Archive" : "Activate"}
                      pendingLabel="Updating…"
                      className="flex flex-wrap items-center gap-2"
                      buttonClassName="btn-secondary min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      <input type="hidden" name="id" value={department.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={department.is_active ? "false" : "true"}
                      />
                    </ActionForm>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
