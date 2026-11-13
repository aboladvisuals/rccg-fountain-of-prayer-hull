// Pure helpers shared by department pages and server actions. These mirror the
// database rules for UI decisions only; RLS and triggers remain the authority.

export type LeadershipRole = "leader" | "deputy";
export type MembershipStatus = "pending" | "active" | "inactive";
export type MembershipOrigin = "admin" | "leader_invite" | "member_request";
export type RsvpStatus = "yes" | "no" | "maybe";

export const RSVP_STATUSES: readonly RsvpStatus[] = ["yes", "maybe", "no"];
export const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = ["active", "pending", "inactive"];
export const LEADERSHIP_ROLES: readonly LeadershipRole[] = ["leader", "deputy"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export type DepartmentAbilities = {
  viewRoster: boolean;
  manageMembers: boolean;
  manageEvents: boolean;
  viewRsvps: boolean;
};

/** What a person may do in one department, given their active leadership role. */
export function departmentAbilities(input: {
  leadershipRole: LeadershipRole | null;
  isActiveMember: boolean;
  isChildFacing: boolean;
}): DepartmentAbilities {
  const leads = input.isActiveMember && input.leadershipRole !== null;
  const leader = leads && input.leadershipRole === "leader";
  return {
    viewRoster: leads && !input.isChildFacing,
    manageMembers: leader && !input.isChildFacing,
    manageEvents: leads,
    viewRsvps: leads,
  };
}

export type MembershipAction = "accept" | "decline" | "leave" | "approve" | "reject" | "deactivate" | "withdraw" | "reinvite";

/** Allowed transitions for non-admins (mirrors guard_department_membership_update). */
export function nextMembershipState(
  actor: "self" | "leader",
  current: { status: MembershipStatus; origin: MembershipOrigin; holdsLeadership: boolean },
  action: MembershipAction
): { status: MembershipStatus; origin: MembershipOrigin } | null {
  const { status, origin, holdsLeadership } = current;
  if (actor === "self") {
    if (status === "pending" && origin === "leader_invite" && action === "accept") return { status: "active", origin };
    if (status === "pending" && origin === "leader_invite" && action === "decline") return { status: "inactive", origin };
    if (status === "active" && action === "leave" && !holdsLeadership) return { status: "inactive", origin };
    return null;
  }
  if (holdsLeadership) return null;
  if (status === "pending" && origin === "member_request" && action === "approve") return { status: "active", origin };
  if (status === "pending" && origin === "member_request" && action === "reject") return { status: "inactive", origin };
  if (status === "pending" && origin === "leader_invite" && action === "withdraw") return { status: "inactive", origin };
  if (status === "active" && action === "deactivate") return { status: "inactive", origin };
  if (status === "inactive" && action === "reinvite") return { status: "pending", origin: "leader_invite" };
  return null;
}

export type UpcomingEvent = { id: string; starts_at: string; ends_at: string; status: string };

/** The next activity that has not finished and is not cancelled. */
export function nextActivity<T extends UpcomingEvent>(events: T[], now: Date): T | null {
  const t = now.getTime();
  return (
    [...events]
      .filter((e) => e.status !== "cancelled" && new Date(e.ends_at).getTime() > t)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null
  );
}

export function rsvpCounts(rows: { status: string }[]) {
  const counts = { yes: 0, maybe: 0, no: 0 };
  for (const row of rows) if (row.status in counts) counts[row.status as RsvpStatus] += 1;
  return counts;
}

export function cleanText(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
