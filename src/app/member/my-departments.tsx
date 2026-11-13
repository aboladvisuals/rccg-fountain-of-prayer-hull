import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ActionForm from "@/components/ui/ActionForm";
import type { DepartmentSummary, MyMembership } from "@/lib/departments/workspace";
import type { LeadershipRole } from "@/lib/departments/permissions";
import { requestToJoin, respondToMembership } from "./departments/actions";

type Props = {
  memberships: MyMembership[];
  leadership: Map<string, LeadershipRole>;
  joinable: DepartmentSummary[];
};

const smallBtn = "btn-secondary min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60";

export default function MyDepartments({ memberships, leadership, joinable }: Props) {
  const invitations = memberships.filter((m) => m.status === "pending" && m.origin === "leader_invite" && m.department);
  const rows = memberships.filter((m) => m.department && m.status !== "inactive" && !invitations.includes(m));
  const mine = new Set(memberships.filter((m) => m.status !== "inactive").map((m) => m.department?.id));
  const canRequest = joinable.filter((d) => !mine.has(d.id));

  return (
    <section aria-labelledby="my-departments">
      <p className="kicker">Serving</p>
      <h2 id="my-departments" className="section-title mt-1">My Departments</h2>

      {invitations.length > 0 && (
        <ul className="mt-4 space-y-3" aria-label="Department invitations">
          {invitations.map((row) => (
            <li key={row.id} className="app-card app-card-accent p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Invitation</p>
              <p className="mt-1 font-semibold">You have been invited to join {row.department!.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["accept", "decline"] as const).map((decision) => (
                  <ActionForm key={decision} action={respondToMembership} submitLabel={decision === "accept" ? "Accept" : "Decline"} className="flex flex-wrap gap-2" buttonClassName={decision === "accept" ? "min-h-11 rounded-full bg-purple-700 px-4 py-2 text-sm font-semibold text-white" : smallBtn}>
                    <input type="hidden" name="membershipId" value={row.id} />
                    <input type="hidden" name="decision" value={decision} />
                  </ActionForm>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length === 0 && invitations.length === 0 ? (
        <div className="app-card mt-4 flex items-start gap-4 p-6">
          <span className="tool-icon shrink-0"><Icon name="department" /></span>
          <p className="text-sm leading-6 text-slate-600">You are not assigned to a department yet.</p>
        </div>
      ) : rows.length > 0 && (
        <ul className="app-card mt-4 divide-y divide-slate-200 overflow-hidden">
          {rows.map((row) => {
            const department = row.department!;
            const role = leadership.get(department.id);
            const href = department.slug === "choir-and-worship" ? "/member/choir" : `/member/departments/${department.id}`;
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="tool-icon shrink-0">
                    <Icon name={department.slug === "choir-and-worship" ? "hymnal" : "department"} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{department.name}</h3>
                    <p className="text-sm text-slate-500">
                      {row.status === "active" ? (role === "leader" ? "Leader" : role === "deputy" ? "Deputy leader" : "Member") : "Request pending"}
                    </p>
                  </div>
                </div>
                {row.status === "active" && (
                  <Link href={href} className="btn btn-outline btn-secondary min-h-11 px-4 py-2 text-sm">
                    Open <span aria-hidden="true">→</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canRequest.length > 0 && (
        <details className="app-card mt-4 p-5">
          <summary className="cursor-pointer text-sm font-semibold text-purple-800">Request to join a department</summary>
          <p className="mt-2 text-xs text-slate-500">A department leader or administrator reviews every request.</p>
          <ul className="mt-3 space-y-2">
            {canRequest.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{d.name}</span>
                <ActionForm action={requestToJoin} submitLabel="Request" pendingLabel="Sending…" className="flex flex-wrap gap-2" buttonClassName={smallBtn}>
                  <input type="hidden" name="departmentId" value={d.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
