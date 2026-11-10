import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

type Props = {
  supabase: SupabaseClient;
  profileId: string;
};

export default async function MyDepartments({ supabase, profileId }: Props) {
  const { data } = await supabase
    .from("department_memberships")
    .select(
      `
        id,
        status,
        department:church_departments (
          id,
          name,
          slug,
          is_active
        )
      `
    )
    .eq("profile_id", profileId);

  const rows = data ?? [];

  return (
    <section className="mt-9" aria-labelledby="my-departments">
      <h2 id="my-departments" className="text-xl font-bold">
        My Departments
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          You are not assigned to a department yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {rows.map((row) => {
            const department = Array.isArray(row.department)
              ? row.department[0]
              : row.department;
            if (!department) return null;
            return (
              <article
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold">{department.name}</h3>
                <p className="mt-1 text-sm capitalize text-slate-500">
                  {row.status}
                </p>
                {department.slug === "choir-and-worship" && (
                  <Link
                    href="/member/choir"
                    className="mt-3 inline-block text-sm font-semibold text-purple-700"
                  >
                    Open choir →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
