import type { SupabaseClient } from "@supabase/supabase-js";

// Aggregate-only membership figures from public.church_membership_stats().
// Calculated live from Supabase records on every page load (no stored totals).
// Registered membership, not Sunday attendance.

type Stats = {
  registered_total: number;
  by_status: Record<string, number>;
  family_members_total: number;
  gender_recorded: boolean;
  age_recorded: boolean;
  assigned_active_members: number;
  not_assigned_active_members: number;
  departments: { id: string; name: string; is_active: boolean; active_members: number }[];
};

function Stat({ label, value, note, tone }: { label: string; value: string | number; note?: string; tone?: "plum" | "gold" | "muted" }) {
  return (
    <article className="app-card p-5">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`stat-value mt-2 ${tone === "plum" ? "text-purple-700" : tone === "gold" ? "text-gold-700" : tone === "muted" ? "text-slate-400" : ""}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </article>
  );
}

export default async function MembershipStats({ supabase, organisationId, compact = false }: { supabase: SupabaseClient; organisationId: string; compact?: boolean }) {
  const { data, error } = await supabase.rpc("church_membership_stats", { org: organisationId });
  if (error || !data) {
    return (
      <section className="mt-12" aria-labelledby="membership-stats">
        <p className="kicker">Membership</p>
        <h2 id="membership-stats" className="section-title mt-1">Church membership</h2>
        <p className="app-card mt-4 p-6 text-sm text-slate-600">Membership statistics are not available right now.</p>
      </section>
    );
  }
  const s = data as Stats;
  const active = s.by_status?.active ?? 0;
  const inactive = s.by_status?.inactive ?? 0;
  const other = s.registered_total - active - inactive;
  const departments = (s.departments ?? []).filter((d) => d.is_active);

  return (
    <section className="mt-12" aria-labelledby="membership-stats">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Membership</p>
          <h2 id="membership-stats" className="section-title mt-1">Registered church membership</h2>
        </div>
        <span className="chip">Live from member records · not Sunday attendance</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered members" value={s.registered_total} note="Each person counted once. Visitors are not included." />
        <Stat label="Active · Inactive" value={`${active} · ${inactive}`} note={other > 0 ? `${other} with another status (e.g. pending)` : "From membership status"} tone="plum" />
        <Stat label="Men · Women" value="Not recorded" note="Gender is not stored in member profiles yet." tone="muted" />
        <Stat label="Children · Adults" value="Not recorded" note={`Date of birth is not stored. ${s.family_members_total} family members recorded by households.`} tone="muted" />
      </div>
      {!compact && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Stat label="In at least one department" value={s.assigned_active_members} note="Active members, counted once." tone="gold" />
          <Stat label="Not yet in a department" value={s.not_assigned_active_members} note="Active members with no active department." />
          <article className="app-card p-5">
            <p className="text-sm text-slate-600">Department participation</p>
            {departments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No active departments yet.</p>
            ) : (
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
                {departments.map((d) => (
                  <li key={d.id} className="flex justify-between gap-3"><span>{d.name}</span><span className="font-semibold tabular-nums">{d.active_members}</span></li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-slate-500">People can serve in several departments, so these totals overlap and do not add up to the church total.</p>
          </article>
        </div>
      )}
    </section>
  );
}
