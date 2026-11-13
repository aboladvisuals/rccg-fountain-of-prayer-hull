import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadershipRole, MembershipOrigin, MembershipStatus } from "./permissions";

export type DepartmentSummary = {
  id: string;
  organisation_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  is_child_facing: boolean;
  allow_join_requests: boolean;
};

export type MyMembership = {
  id: string;
  status: MembershipStatus;
  origin: MembershipOrigin;
  department: DepartmentSummary | null;
};

export type DepartmentEvent = {
  id: string;
  organisation_id: string;
  department_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  venue: string | null;
  status: "scheduled" | "cancelled" | "rescheduled";
};

const DEPT_COLUMNS = "id, organisation_id, name, slug, description, is_active, is_child_facing, allow_join_requests";
const EVENT_COLUMNS = "id, organisation_id, department_id, title, description, starts_at, ends_at, venue, status";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

/** The signed-in person's own memberships (RLS: own rows). */
export async function loadMyMemberships(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("department_memberships")
    .select(`id, status, origin, department:church_departments (${DEPT_COLUMNS})`)
    .eq("profile_id", profileId)
    .order("created_at");
  const rows: MyMembership[] = (data ?? []).map((row) => ({
    id: row.id as string,
    status: row.status as MembershipStatus,
    origin: (row.origin ?? "admin") as MembershipOrigin,
    department: one(row.department as DepartmentSummary | DepartmentSummary[] | null),
  }));
  return { rows, error };
}

/** The signed-in person's own active leadership roles (RLS: own rows only). */
export async function loadMyLeadership(supabase: SupabaseClient, profileId: string) {
  const { data } = await supabase
    .from("department_leadership")
    .select("department_id, role")
    .eq("profile_id", profileId)
    .eq("is_active", true);
  const map = new Map<string, LeadershipRole>();
  for (const row of data ?? []) {
    const current = map.get(row.department_id as string);
    if (current !== "leader") map.set(row.department_id as string, row.role as LeadershipRole);
  }
  return map;
}

export async function loadDepartment(supabase: SupabaseClient, departmentId: string) {
  const { data } = await supabase.from("church_departments").select(DEPT_COLUMNS).eq("id", departmentId).maybeSingle();
  return (data as DepartmentSummary | null) ?? null;
}

/** Departments a member may ask to join (admin-enabled, active, never child-facing). */
export async function loadJoinableDepartments(supabase: SupabaseClient, organisationId: string) {
  const { data } = await supabase
    .from("church_departments")
    .select(DEPT_COLUMNS)
    .eq("organisation_id", organisationId)
    .eq("is_active", true)
    .eq("allow_join_requests", true)
    .eq("is_child_facing", false)
    .order("name");
  return (data as DepartmentSummary[] | null) ?? [];
}

/** Upcoming (not finished) events for some departments, oldest first. RLS limits visibility. */
export async function loadUpcomingEvents(
  supabase: SupabaseClient,
  departmentIds: string[],
  options: { from?: Date; limit?: number; includeCancelled?: boolean } = {}
) {
  if (departmentIds.length === 0) return [] as DepartmentEvent[];
  let query = supabase
    .from("department_events")
    .select(EVENT_COLUMNS)
    .in("department_id", departmentIds)
    .gte("ends_at", (options.from ?? new Date()).toISOString())
    .order("starts_at", { ascending: true })
    .limit(options.limit ?? 50);
  if (!options.includeCancelled) query = query.neq("status", "cancelled");
  const { data } = await query;
  return (data as DepartmentEvent[] | null) ?? [];
}

export async function loadMyRsvps(supabase: SupabaseClient, profileId: string, eventIds: string[]) {
  const map = new Map<string, string>();
  if (eventIds.length === 0) return map;
  const { data } = await supabase
    .from("department_event_rsvps")
    .select("event_id, status")
    .eq("profile_id", profileId)
    .in("event_id", eventIds);
  for (const row of data ?? []) map.set(row.event_id as string, row.status as string);
  return map;
}

/** RSVPs for events (leaders/deputies via RLS rsvps_select). */
export async function loadEventRsvps(supabase: SupabaseClient, eventIds: string[]) {
  if (eventIds.length === 0) return [] as { event_id: string; profile_id: string; status: string }[];
  const { data } = await supabase.from("department_event_rsvps").select("event_id, profile_id, status").in("event_id", eventIds);
  return (data as { event_id: string; profile_id: string; status: string }[] | null) ?? [];
}

export type RosterRow = {
  membership_id: string;
  profile_id: string;
  display_name: string;
  status: MembershipStatus;
  origin: MembershipOrigin;
  leadership_role: LeadershipRole | null;
};

/** Names-only roster via the department_roster() security-definer function. */
export async function loadRoster(supabase: SupabaseClient, departmentId: string) {
  const { data } = await supabase.rpc("department_roster", { p_department: departmentId });
  return (data as RosterRow[] | null) ?? [];
}

export async function loadInviteCandidates(supabase: SupabaseClient, departmentId: string) {
  const { data } = await supabase.rpc("department_invite_candidates", { p_department: departmentId });
  return (data as { profile_id: string; display_name: string }[] | null) ?? [];
}

export const londonDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
export const londonTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
export const londonLongDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long" });
