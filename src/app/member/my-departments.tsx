import Link from "next/link";
import Icon from "@/components/ui/Icon";
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
    <section aria-labelledby="my-departments">
      <p className="kicker">Serving</p>
      <h2 id="my-departments" className="section-title mt-1">
        My Departments
      </h2>
      {rows.length === 0 ? (
        <div className="app-card mt-4 flex items-start gap-4 p-6">
          <span className="tool-icon shrink-0">
            <Icon name="department" />
          </span>
          <p className="text-sm leading-6 text-slate-600">
            You are not assigned to a department yet.
          </p>
        </div>
      ) : (
        <ul className="app-card mt-4 divide-y divide-slate-200 overflow-hidden">
          {rows.map((row) => {
            const department = Array.isArray(row.department)
              ? row.department[0]
              : row.department;
            if (!department) return null;
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="tool-icon shrink-0">
                    <Icon name={department.slug === "choir-and-worship" ? "hymnal" : "department"} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{department.name}</h3>
                    <p className="text-sm capitalize text-slate-500">{row.status}</p>
                  </div>
                </div>
                {department.slug === "choir-and-worship" && (
                  <Link
                    href="/member/choir"
                    className="btn btn-outline btn-secondary min-h-11 px-4 py-2 text-sm"
                  >
                    Open choir <span aria-hidden="true">→</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
