import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/session";
import { getDepartment, listDepartmentAudit, listDepartmentLeadership, listDepartmentMembers } from "@/lib/admin/departments";
import ActionForm from "@/components/ui/ActionForm";
import DepartmentsNotice from "@/components/app/DepartmentsNotice";
import { departmentsAvailability } from "@/lib/departments/availability";
import { appointLeadership, assignMember, removeLeadership, setJoinRequests } from "../actions";

type Props = { params: Promise<{ id: string }> };

const field = "rounded-xl border border-slate-300 bg-white px-4 py-3";
const smallBtn = "btn-secondary min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60";
const when = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function describeAction(action: string, oldStatus: string | null, newStatus: string | null) {
  const [kind, detail] = action.split(":");
  const [table, op] = kind.split("_");
  if (table === "leadership") {
    const role = detail === "leader" ? "leader" : "deputy";
    if (op === "insert") return `Appointed ${role}`;
    if (op === "delete") return `Removed ${role} record`;
    return newStatus === "active" ? `Re-appointed ${role}` : `Ended ${role} role`;
  }
  const origin = detail === "leader_invite" ? " (leader invitation)" : detail === "member_request" ? " (join request)" : "";
  if (op === "insert") return `Added as ${newStatus}${origin}`;
  if (op === "delete") return "Membership deleted";
  return `${oldStatus ?? "—"} → ${newStatus ?? "—"}${origin}`;
}

export default async function DepartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, organisation } = await requireAdminSession();
  const { data: department, error: departmentError } = await getDepartment(supabase, organisation.id, id);
  if (departmentError) {
    console.error("[admin/departments/[id]] getDepartment failed", { code: departmentError.code, message: departmentError.message });
    return (
      <main className="app-page">
        <div className="mx-auto max-w-3xl">
          <Link href="/admin/departments" className="text-sm font-semibold text-purple-700">← Departments</Link>
          <h1 className="display-title mt-6 text-3xl">Department</h1>
          <DepartmentsNotice state={departmentsAvailability(departmentError)} className="mt-6" />
        </div>
      </main>
    );
  }
  if (!department) notFound();

  const [{ data: memberships }, { data: profiles }, { data: leadership }, { data: audit }] = await Promise.all([
    listDepartmentMembers(supabase, id),
    supabase.from("profiles").select("id, full_name, first_name, email").order("full_name").limit(200),
    listDepartmentLeadership(supabase, id),
    listDepartmentAudit(supabase, organisation.id, id),
  ]);

  const nameOf = new Map<string, string>();
  for (const p of profiles ?? []) nameOf.set(p.id, p.full_name || p.first_name || p.email || "Unnamed");
  const rows = (memberships ?? []).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return { ...row, profile, name: profile?.full_name || profile?.first_name || profile?.email || "Unnamed" };
  });
  const activeRows = rows.filter((r) => r.status === "active");
  const currentLeadership = (leadership ?? []).filter((l) => l.is_active);
  const allowJoin = Boolean(department.allow_join_requests);

  return (
    <main className="app-page">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/departments" className="text-sm font-semibold text-purple-700">← Departments</Link>
        <section className="app-hero mt-6 p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Department administration</p>
          <h1 className="display-title mt-3 text-4xl sm:text-5xl">{department.name}</h1>
          <p className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="chip border-white/15 bg-white/10 text-white">{department.is_active ? "Active" : "Inactive"}</span>
            {department.is_child_facing && <span className="chip border-gold-300/40 bg-gold-300/15 text-gold-100">Child-facing · admin-managed</span>}
            <span className="chip border-white/15 bg-white/10 text-white">{activeRows.length} active members</span>
          </p>
        </section>

        {department.is_child_facing && (
          <div role="note" className="notice mt-6 border-amber-200 bg-amber-50 text-amber-950">
            Child-facing ministry: leaders cannot see the roster or invite people, and join requests are disabled.
            A department assignment is not proof of safeguarding clearance — confirm checks separately before assigning volunteers.
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <section className="app-card p-6" aria-labelledby="leadership-heading">
              <p className="kicker">Leadership</p>
              <h2 id="leadership-heading" className="section-title mt-1">Leader &amp; deputies</h2>
              <p className="mt-1 text-sm text-slate-500">
                Leaders manage their own department&apos;s members and schedule; deputies manage the schedule only. Neither changes application roles.
              </p>
              {currentLeadership.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No leader appointed yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-200">
                  {currentLeadership.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold">{nameOf.get(l.profile_id) ?? "Church member"}</p>
                        <p className="text-sm capitalize text-slate-500">{l.role === "leader" ? "Department leader" : "Deputy leader"}</p>
                      </div>
                      <ActionForm action={removeLeadership} submitLabel="Remove role" pendingLabel="Removing…" className="flex flex-wrap items-center gap-2" buttonClassName={smallBtn}>
                        <input type="hidden" name="leadershipId" value={l.id} />
                        <input type="hidden" name="departmentId" value={department.id} />
                      </ActionForm>
                    </li>
                  ))}
                </ul>
              )}
              <ActionForm action={appointLeadership} submitLabel="Appoint" pendingLabel="Appointing…" resetOnSuccess className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="departmentId" value={department.id} />
                <label className="block min-w-0 flex-1">
                  <span className="text-sm font-semibold">Active member</span>
                  <select name="profileId" required defaultValue="" className={`mt-1 w-full ${field}`}>
                    <option value="" disabled>Select member</option>
                    {activeRows.map((r) => r.profile && <option key={r.id} value={r.profile.id}>{r.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Role</span>
                  <select name="role" defaultValue="leader" className={`mt-1 block ${field}`}>
                    <option value="leader">Leader</option>
                    <option value="deputy">Deputy</option>
                  </select>
                </label>
              </ActionForm>
              <p className="mt-2 text-xs text-slate-500">Only active members of this department can be appointed. One active leader per department.</p>
            </section>

            <section className="app-card p-6" aria-labelledby="assign-heading">
              <p className="kicker">Membership</p>
              <h2 id="assign-heading" className="section-title mt-1">Assign or correct a member</h2>
              <ActionForm action={assignMember} submitLabel="Save assignment" pendingLabel="Saving…" className="mt-4 flex flex-wrap gap-3">
                <input type="hidden" name="departmentId" value={department.id} />
                <select name="profileId" required className={field} defaultValue="">
                  <option value="" disabled>Select member</option>
                  {(profiles ?? []).map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.full_name || profile.first_name || profile.email}</option>
                  ))}
                </select>
                <select name="status" className={field} defaultValue="active">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </ActionForm>
              <p className="mt-2 text-xs text-slate-500">Setting someone inactive also ends any leader or deputy role they hold here.</p>
            </section>

            <section aria-labelledby="roster-heading">
              <h2 id="roster-heading" className="section-title">Roster</h2>
              {rows.length === 0 ? (
                <p className="app-card mt-4 p-6 text-sm text-slate-600">No members assigned yet.</p>
              ) : (
                <ul className="app-card mt-4 divide-y divide-slate-200 overflow-hidden">
                  {rows.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                      <div>
                        <p className="font-semibold">{row.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          <span className="capitalize">{row.status}</span>
                          {row.status === "pending" && row.origin === "leader_invite" && " · invited by leader"}
                          {row.status === "pending" && row.origin === "member_request" && " · requested to join"}
                          {currentLeadership.some((l) => l.profile_id === row.profile?.id) && " · leadership"}
                        </p>
                      </div>
                      {row.profile && (
                        <ActionForm action={assignMember} submitLabel="Update" pendingLabel="Saving…" className="flex flex-wrap items-center gap-2" buttonClassName={smallBtn}>
                          <input type="hidden" name="departmentId" value={department.id} />
                          <input type="hidden" name="profileId" value={row.profile.id} />
                          <label className="sr-only" htmlFor={`status-${row.id}`}>Status for {row.name}</label>
                          <select id={`status-${row.id}`} name="status" defaultValue={row.status} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm">
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </ActionForm>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <section className="app-card p-6">
              <p className="kicker">Policy</p>
              <h2 className="section-title mt-1">Join requests</h2>
              <p className="mt-1 text-sm text-slate-600">
                {department.is_child_facing
                  ? "Not available for child-facing departments."
                  : allowJoin
                    ? "Members can ask to join. The leader or an administrator approves each request."
                    : "Off. Only administrators and the leader's invitations add members."}
              </p>
              {!department.is_child_facing && (
                <ActionForm action={setJoinRequests} submitLabel={allowJoin ? "Turn off join requests" : "Allow join requests"} pendingLabel="Saving…" className="mt-4 flex flex-wrap gap-2" buttonClassName={smallBtn}>
                  <input type="hidden" name="id" value={department.id} />
                  <input type="hidden" name="allow" value={allowJoin ? "false" : "true"} />
                </ActionForm>
              )}
            </section>

            <section className="app-card p-6" aria-labelledby="audit-heading">
              <p className="kicker">Audit</p>
              <h2 id="audit-heading" className="section-title mt-1">Recent changes</h2>
              {(audit ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No recorded changes yet.</p>
              ) : (
                <ol className="mt-3 space-y-3 text-sm">
                  {(audit ?? []).map((a) => (
                    <li key={a.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-semibold">{nameOf.get(a.profile_id ?? "") ?? "Church member"}</p>
                      <p className="text-slate-600">{describeAction(a.action, a.old_status, a.new_status)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {when.format(new Date(a.created_at))} · by {a.changed_by ? (nameOf.get(a.changed_by) ?? "a church user") : "system"}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
