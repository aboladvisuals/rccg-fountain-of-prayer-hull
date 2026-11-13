import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import ActionForm from "@/components/ui/ActionForm";
import Icon from "@/components/ui/Icon";
import { departmentAbilities, nextActivity, rsvpCounts, type RsvpStatus } from "@/lib/departments/permissions";
import {
  loadEventRsvps,
  loadInviteCandidates,
  loadMyLeadership,
  loadMyRsvps,
  loadRoster,
  loadUpcomingEvents,
  londonDateTime,
  londonLongDate,
  londonTime,
  type DepartmentEvent,
  type DepartmentSummary,
} from "@/lib/departments/workspace";
import { isoDate, zonedParts } from "@/lib/calendar/london";
import MembershipStats from "@/components/app/MembershipStats";
import {
  cancelDepartmentEvent,
  createDepartmentEvent,
  inviteMember,
  leaderUpdateMembership,
  respondToMembership,
  setRsvp,
  updateDepartmentEvent,
} from "./actions";

type Props = {
  supabase: SupabaseClient;
  userId: string;
  department: DepartmentSummary;
  membership: { id: string; status: string; origin: string } | null;
  variant?: "choir" | "default";
};

const RSVP_LABELS: Record<RsvpStatus, string> = { yes: "Attending", maybe: "Maybe", no: "Can’t attend" };
const smallBtn = "btn-secondary min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60";
const field = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3";

function hm(iso: string) {
  const p = zonedParts(new Date(iso));
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

function RsvpButtons({ event, current }: { event: DepartmentEvent; current?: string }) {
  if (event.status === "cancelled") return <p className="mt-3 text-sm font-semibold text-red-700">Cancelled</p>;
  return (
    <div className="mt-4" role="group" aria-label={`Your availability for ${event.title}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Your availability{current ? `: ${RSVP_LABELS[current as RsvpStatus]}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(["yes", "maybe", "no"] as RsvpStatus[]).map((status) => (
          <ActionForm
            key={status}
            action={setRsvp}
            submitLabel={RSVP_LABELS[status]}
            pendingLabel="Saving…"
            className="flex flex-wrap items-center gap-2"
            buttonClassName={
              current === status
                ? "min-h-11 rounded-full bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                : smallBtn
            }
          >
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="status" value={status} />
          </ActionForm>
        ))}
      </div>
    </div>
  );
}

function EventFields({ event }: { event?: DepartmentEvent }) {
  const date = event ? isoDate(zonedParts(new Date(event.starts_at))) : undefined;
  return (
    <>
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">Title</span>
        <input name="title" required maxLength={120} defaultValue={event?.title} placeholder="e.g. Rehearsal" className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Date</span>
        <input name="date" type="date" required defaultValue={date} className={field} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-semibold">Starts</span>
          <input name="startTime" type="time" required defaultValue={event ? hm(event.starts_at) : undefined} className={field} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Ends</span>
          <input name="endTime" type="time" required defaultValue={event ? hm(event.ends_at) : undefined} className={field} />
        </label>
      </div>
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">Venue <span className="font-normal text-slate-500">(optional)</span></span>
        <input name="venue" maxLength={120} defaultValue={event?.venue ?? undefined} className={field} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">Notes for members <span className="font-normal text-slate-500">(optional — song titles or references only, no lyrics)</span></span>
        <textarea name="description" rows={2} maxLength={600} defaultValue={event?.description ?? undefined} className={field} />
      </label>
    </>
  );
}

export default async function DepartmentWorkspace({ supabase, userId, department, membership, variant = "default" }: Props) {
  const leadership = await loadMyLeadership(supabase, userId);
  const role = leadership.get(department.id) ?? null;
  const active = membership?.status === "active";
  const can = departmentAbilities({ leadershipRole: role, isActiveMember: active, isChildFacing: department.is_child_facing });
  const activityWord = variant === "choir" ? "rehearsal" : "activity";
  const activityWithArticle = `${activityWord === "activity" ? "an" : "a"} ${activityWord}`;

  const events = active ? await loadUpcomingEvents(supabase, [department.id], { includeCancelled: true, limit: 30 }) : [];
  const ids = events.map((e) => e.id);
  const [myRsvps, rsvps, roster, candidates] = await Promise.all([
    loadMyRsvps(supabase, userId, ids),
    can.viewRsvps ? loadEventRsvps(supabase, ids) : Promise.resolve([]),
    can.viewRoster ? loadRoster(supabase, department.id) : Promise.resolve([]),
    can.manageMembers ? loadInviteCandidates(supabase, department.id) : Promise.resolve([]),
  ]);
  const deptStats = role
    ? ((await supabase.rpc("department_membership_stats", { p_department: department.id })).data as { active_members: number; pending_members: number; upcoming_events: number }[] | null)?.[0] ?? null
    : null;
  const names = new Map(roster.map((r) => [r.profile_id, r.display_name]));
  const next = nextActivity(events, new Date());
  const pendingRequests = roster.filter((r) => r.status === "pending" && r.origin === "member_request");
  const pendingInvites = roster.filter((r) => r.status === "pending" && r.origin === "leader_invite");
  const activeMembers = roster.filter((r) => r.status === "active");

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        {!active && (
          <section className="app-card border-purple-200 bg-purple-50 p-6">
            <h2 className="section-title">
              {membership?.status === "pending" && membership.origin === "leader_invite"
                ? `You have been invited to ${department.name}`
                : membership?.status === "pending"
                  ? "Your request is waiting for review"
                  : "You are not an active member of this department"}
            </h2>
            {membership?.status === "pending" && membership.origin === "leader_invite" && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(["accept", "decline"] as const).map((decision) => (
                  <ActionForm key={decision} action={respondToMembership} submitLabel={decision === "accept" ? "Accept invitation" : "Decline"} className="flex flex-wrap gap-2" buttonClassName={decision === "accept" ? undefined : smallBtn}>
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <input type="hidden" name="decision" value={decision} />
                  </ActionForm>
                ))}
              </div>
            )}
          </section>
        )}

        {active && (
          <section aria-labelledby="next-activity" className="app-hero p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Next {activityWord}</p>
            {next ? (
              <>
                <h2 id="next-activity" className="display-title mt-2 text-3xl">{next.title}</h2>
                <p className="mt-2 text-purple-100">
                  {londonLongDate.format(new Date(next.starts_at))} · {londonTime.format(new Date(next.starts_at))}–{londonTime.format(new Date(next.ends_at))}
                  {next.venue ? ` · ${next.venue}` : ""}
                </p>
                {next.status === "rescheduled" && <p className="mt-1 text-sm text-gold-200">Updated by the department leader</p>}
                {next.description && <p className="mt-3 max-w-xl text-sm text-purple-100">{next.description}</p>}
                <div className="mt-2 rounded-2xl bg-white/95 p-4 text-slate-900">
                  <RsvpButtons event={next} current={myRsvps.get(next.id)} />
                </div>
              </>
            ) : (
              <>
                <h2 id="next-activity" className="display-title mt-2 text-3xl">Nothing scheduled yet</h2>
                <p className="mt-2 text-purple-100">
                  {can.manageEvents ? `Schedule the next ${activityWord} below.` : `Your department leader will publish the next ${activityWord} here.`}
                </p>
              </>
            )}
          </section>
        )}

        {active && (
          <section aria-labelledby="schedule">
            <p className="kicker">Schedule</p>
            <h2 id="schedule" className="section-title mt-1">Upcoming {variant === "choir" ? "rehearsals & services" : "activities"}</h2>
            <p className="mt-1 text-sm text-slate-500">All times are UK time (Europe/London).</p>
            {events.length === 0 ? (
              <div className="app-card mt-4 flex items-start gap-4 p-6">
                <span className="tool-icon shrink-0"><Icon name="calendar" /></span>
                <p className="text-sm leading-6 text-slate-600">No upcoming {activityWord}s have been scheduled.</p>
              </div>
            ) : (
              <ol className="mt-4 space-y-4">
                {events.map((event) => {
                  const eventRsvps = rsvps.filter((r) => r.event_id === event.id);
                  const counts = rsvpCounts(eventRsvps);
                  return (
                    <li key={event.id} className={`app-card p-5 ${event.status === "cancelled" ? "opacity-75" : ""}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={`text-lg font-semibold ${event.status === "cancelled" ? "line-through" : ""}`}>{event.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            <time dateTime={event.starts_at}>{londonDateTime.format(new Date(event.starts_at))}</time>–{londonTime.format(new Date(event.ends_at))}
                            {event.venue ? ` · ${event.venue}` : ""}
                          </p>
                          {event.description && <p className="mt-2 text-sm text-slate-600">{event.description}</p>}
                        </div>
                        <span className={`chip ${event.status === "cancelled" ? "border-red-200 bg-red-50 text-red-800" : event.status === "rescheduled" ? "border-amber-200 bg-amber-50 text-amber-900" : ""}`}>
                          {event.status === "scheduled" ? "Scheduled" : event.status === "cancelled" ? "Cancelled" : "Updated"}
                        </span>
                      </div>
                      {event.id !== next?.id && <RsvpButtons event={event} current={myRsvps.get(event.id)} />}
                      {can.viewRsvps && (
                        <details className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                          <summary className="cursor-pointer font-semibold text-purple-800">
                            Availability: {counts.yes} attending · {counts.maybe} maybe · {counts.no} can’t attend
                          </summary>
                          {eventRsvps.length === 0 ? (
                            <p className="mt-2 text-slate-600">No responses yet.</p>
                          ) : (
                            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                              {eventRsvps.map((r) => (
                                <li key={r.profile_id}>{names.get(r.profile_id) ?? "Department member"} — {RSVP_LABELS[r.status as RsvpStatus]}</li>
                              ))}
                            </ul>
                          )}
                          {can.manageEvents && event.status !== "cancelled" && (
                            <div className="mt-4 border-t border-slate-200 pt-4">
                              <details>
                                <summary className="cursor-pointer font-semibold text-purple-800">Edit {activityWord}</summary>
                                <ActionForm action={updateDepartmentEvent} submitLabel="Save changes" className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <input type="hidden" name="departmentId" value={department.id} />
                                  <input type="hidden" name="eventId" value={event.id} />
                                  <EventFields event={event} />
                                </ActionForm>
                              </details>
                              <ActionForm action={cancelDepartmentEvent} submitLabel={`Cancel this ${activityWord}`} pendingLabel="Cancelling…" className="mt-3 flex flex-wrap gap-2" buttonClassName="min-h-11 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700">
                                <input type="hidden" name="departmentId" value={department.id} />
                                <input type="hidden" name="eventId" value={event.id} />
                              </ActionForm>
                            </div>
                          )}
                        </details>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}
      </div>

      {role && department.slug === "ushering-and-hospitality" && (
        <div className="order-first lg:col-span-12 [&>section]:mt-0">
          <MembershipStats supabase={supabase} organisationId={department.organisation_id} compact />
        </div>
      )}
      <aside className="space-y-6 lg:col-span-5">
        <section className="app-card p-6">
          <p className="kicker">Your role</p>
          <h2 className="section-title mt-1">{role === "leader" ? "Department leader" : role === "deputy" ? "Deputy leader" : active ? "Member" : "Not active"}</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {active && <li>See schedules and tell your leader if you can attend.</li>}
            {can.manageEvents && <li>Schedule, edit and cancel {activityWord}s; see who can attend.</li>}
            {can.manageMembers && <li>Invite church members and review join requests.</li>}
            {role && department.is_child_facing && <li>Child-facing ministry: the roster is managed by an administrator for safeguarding.</li>}
          </ul>
          {active && !role && membership && (
            <ActionForm action={respondToMembership} submitLabel="Leave department" pendingLabel="Leaving…" className="mt-4 flex flex-wrap gap-2" buttonClassName={smallBtn}>
              <input type="hidden" name="membershipId" value={membership.id} />
              <input type="hidden" name="decision" value="leave" />
            </ActionForm>
          )}
        </section>

        {deptStats && (
          <section className="app-card p-6" aria-labelledby="dept-stats">
            <p className="kicker">Department total</p>
            <h2 id="dept-stats" className="section-title mt-1">{deptStats.active_members} active {deptStats.active_members === 1 ? "member" : "members"}</h2>
            <p className="mt-1 text-sm text-slate-600">{deptStats.pending_members} pending · {deptStats.upcoming_events} upcoming {deptStats.upcoming_events === 1 ? "activity" : "activities"}. Calculated live from department records.</p>
          </section>
        )}

        {can.manageEvents && (
          <section className="app-card app-card-accent p-6" aria-labelledby="new-activity">
            <p className="kicker">Plan</p>
            <h2 id="new-activity" className="section-title mt-1">Schedule {activityWithArticle}</h2>
            <p className="mt-1 text-sm text-slate-500">Enter UK time. Members of this department are able to respond.</p>
            <ActionForm action={createDepartmentEvent} submitLabel={`Schedule ${activityWord}`} pendingLabel="Scheduling…" resetOnSuccess className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="departmentId" value={department.id} />
              <EventFields />
            </ActionForm>
          </section>
        )}

        {can.manageMembers && (
          <section className="app-card p-6" aria-labelledby="manage-members">
            <p className="kicker">People</p>
            <h2 id="manage-members" className="section-title mt-1">Members</h2>
            <p className="mt-1 text-sm text-slate-500">{activeMembers.length} active · names only, contact details stay private.</p>

            {pendingRequests.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Join requests</h3>
                <ul className="mt-2 space-y-2">
                  {pendingRequests.map((r) => (
                    <li key={r.membership_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
                      <span className="font-medium">{r.display_name}</span>
                      <span className="flex gap-2">
                        {(["approve", "reject"] as const).map((d) => (
                          <ActionForm key={d} action={leaderUpdateMembership} submitLabel={d === "approve" ? "Approve" : "Decline"} className="flex gap-2" buttonClassName={d === "approve" ? "min-h-11 rounded-full bg-purple-700 px-4 text-sm font-semibold text-white" : smallBtn}>
                            <input type="hidden" name="departmentId" value={department.id} />
                            <input type="hidden" name="membershipId" value={r.membership_id} />
                            <input type="hidden" name="decision" value={d} />
                          </ActionForm>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ActionForm action={inviteMember} submitLabel="Send invitation" pendingLabel="Inviting…" resetOnSuccess className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="departmentId" value={department.id} />
              <label className="block min-w-0 flex-1">
                <span className="text-sm font-semibold">Invite a church member</span>
                <select name="profileId" required className={field} defaultValue="">
                  <option value="" disabled>Select member</option>
                  {candidates.map((c) => <option key={c.profile_id} value={c.profile_id}>{c.display_name}</option>)}
                </select>
              </label>
            </ActionForm>

            {pendingInvites.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Invitations awaiting a reply</h3>
                <ul className="mt-2 space-y-2">
                  {pendingInvites.map((r) => (
                    <li key={r.membership_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>{r.display_name}</span>
                      <ActionForm action={leaderUpdateMembership} submitLabel="Withdraw" className="flex gap-2" buttonClassName={smallBtn}>
                        <input type="hidden" name="departmentId" value={department.id} />
                        <input type="hidden" name="membershipId" value={r.membership_id} />
                        <input type="hidden" name="decision" value="withdraw" />
                      </ActionForm>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="mt-5 divide-y divide-slate-200 border-t border-slate-200">
              {activeMembers.map((r) => (
                <li key={r.membership_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="font-medium">
                    {r.display_name}
                    {r.leadership_role && <span className="chip ml-2 text-xs capitalize">{r.leadership_role}</span>}
                  </span>
                  {!r.leadership_role && r.profile_id !== userId && (
                    <ActionForm action={leaderUpdateMembership} submitLabel="Deactivate" pendingLabel="Updating…" className="flex gap-2" buttonClassName={smallBtn}>
                      <input type="hidden" name="departmentId" value={department.id} />
                      <input type="hidden" name="membershipId" value={r.membership_id} />
                      <input type="hidden" name="decision" value="deactivate" />
                    </ActionForm>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {can.viewRoster && !can.manageMembers && (
          <section className="app-card p-6">
            <p className="kicker">People</p>
            <h2 className="section-title mt-1">Members</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {activeMembers.map((r) => <li key={r.membership_id}>{r.display_name}{r.leadership_role ? ` · ${r.leadership_role}` : ""}</li>)}
            </ul>
          </section>
        )}

        <nav className="flex flex-wrap gap-4 text-sm font-semibold" aria-label="Related">
          <Link href="/member" className="text-purple-700">← Member dashboard</Link>
          {variant === "choir" && <Link href="/member/hymnal" className="text-purple-700">Hymnal titles →</Link>}
          {variant === "choir" && <Link href="/member/bible" className="text-purple-700">Bible →</Link>}
        </nav>
      </aside>
    </div>
  );
}
