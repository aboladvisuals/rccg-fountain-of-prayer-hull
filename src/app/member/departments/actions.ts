"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireMemberSession } from "@/lib/member/session";
import { londonLocalToUtc } from "@/lib/calendar/london";
import {
  RSVP_STATUSES,
  cleanText,
  isUuid,
  nextMembershipState,
  type LeadershipRole,
  type MembershipAction,
  type MembershipOrigin,
  type MembershipStatus,
  type RsvpStatus,
} from "@/lib/departments/permissions";
import type { ActionResult } from "@/components/ui/ActionForm";

// Every action re-checks the session and the caller's own department role on the
// server. The database (RLS + triggers) enforces the same rules independently.

const fail = (message: string): ActionResult => ({ ok: false, message });
const friendly = (message: string) =>
  /row-level security|permission denied/i.test(message)
    ? "You do not have permission to do that."
    : /cancelled|finished|active department membership|administrator|leader or administrator|cannot make this/i.test(message)
      ? message.replace(/^.*?:\s*/, "")
      : "That change could not be saved. Please refresh and try again.";

async function myLeadership(supabase: SupabaseClient, userId: string, departmentId: string) {
  const { data } = await supabase
    .from("department_leadership")
    .select("role")
    .eq("department_id", departmentId)
    .eq("profile_id", userId)
    .eq("is_active", true);
  const roles = (data ?? []).map((r) => r.role as LeadershipRole);
  return roles.includes("leader") ? "leader" : roles.includes("deputy") ? "deputy" : null;
}

function refresh(departmentId?: string) {
  revalidatePath("/member");
  revalidatePath("/member/choir");
  if (departmentId) revalidatePath(`/member/departments/${departmentId}`);
}

/* ---------- Member: own membership ---------- */

export async function respondToMembership(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const membershipId = String(formData.get("membershipId") ?? "");
  const action = String(formData.get("decision") ?? "") as MembershipAction;
  if (!isUuid(membershipId) || !["accept", "decline", "leave"].includes(action)) return fail("Invalid request.");

  const { data: row } = await supabase
    .from("department_memberships")
    .select("id, department_id, status, origin")
    .eq("id", membershipId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!row) return fail("Membership not found.");
  const holds = (await myLeadership(supabase, user.id, row.department_id)) !== null;
  const next = nextMembershipState("self", { status: row.status as MembershipStatus, origin: row.origin as MembershipOrigin, holdsLeadership: holds }, action);
  if (!next) return fail(holds && action === "leave" ? "Leaders and deputies must ask an administrator to step down." : "That change is not available.");

  const { error } = await supabase.from("department_memberships").update({ status: next.status }).eq("id", row.id).eq("profile_id", user.id);
  if (error) return fail(friendly(error.message));
  refresh(row.department_id);
  return { ok: true, message: action === "accept" ? "Welcome — you have joined the department." : action === "decline" ? "Invitation declined." : "You have left the department." };
}

export async function requestToJoin(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const departmentId = String(formData.get("departmentId") ?? "");
  if (!isUuid(departmentId)) return fail("Invalid department.");
  const { data: dept } = await supabase
    .from("church_departments")
    .select("id, organisation_id, is_active, allow_join_requests, is_child_facing")
    .eq("id", departmentId)
    .maybeSingle();
  if (!dept || !dept.is_active || !dept.allow_join_requests || dept.is_child_facing) return fail("This department is not accepting requests.");

  const { data: existing } = await supabase
    .from("department_memberships")
    .select("id, status")
    .eq("department_id", departmentId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const { error } = existing
    ? existing.status === "inactive"
      ? await supabase.from("department_memberships").update({ status: "pending", origin: "member_request" }).eq("id", existing.id)
      : { error: { message: existing.status === "active" ? "You are already a member." : "Your request is already waiting." } }
    : await supabase.from("department_memberships").insert({
        organisation_id: dept.organisation_id,
        department_id: departmentId,
        profile_id: user.id,
        status: "pending",
        origin: "member_request",
      });
  if (error) return fail(/already/.test(error.message) ? error.message : friendly(error.message));
  refresh(departmentId);
  return { ok: true, message: "Request sent. A department leader or administrator will review it." };
}

/* ---------- Member: RSVP for themselves ---------- */

export async function setRsvp(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const eventId = String(formData.get("eventId") ?? "");
  const status = String(formData.get("status") ?? "") as RsvpStatus;
  if (!isUuid(eventId) || !RSVP_STATUSES.includes(status)) return fail("Invalid response.");
  const { data: event } = await supabase.from("department_events").select("id, organisation_id, department_id").eq("id", eventId).maybeSingle();
  if (!event) return fail("Event not found.");
  const { error } = await supabase.from("department_event_rsvps").upsert(
    { organisation_id: event.organisation_id, event_id: eventId, profile_id: user.id, status },
    { onConflict: "event_id,profile_id" }
  );
  if (error) return fail(friendly(error.message));
  refresh(event.department_id);
  return { ok: true, message: status === "yes" ? "Thanks — you are marked as attending." : status === "maybe" ? "Marked as maybe." : "Marked as unable to attend." };
}

/* ---------- Leader: membership management ---------- */

export async function inviteMember(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const departmentId = String(formData.get("departmentId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!isUuid(departmentId) || !isUuid(profileId)) return fail("Choose a church member to invite.");
  if (profileId === user.id) return fail("You cannot invite yourself.");
  if ((await myLeadership(supabase, user.id, departmentId)) !== "leader") return fail("Only the department leader can invite members.");
  const { data: dept } = await supabase.from("church_departments").select("organisation_id, is_child_facing").eq("id", departmentId).maybeSingle();
  if (!dept) return fail("Department not found.");
  if (dept.is_child_facing) return fail("Child-facing departments are managed by an administrator.");

  const { data: existing } = await supabase
    .from("department_memberships")
    .select("id, status")
    .eq("department_id", departmentId)
    .eq("profile_id", profileId)
    .maybeSingle();
  const { error } = existing
    ? existing.status === "inactive"
      ? await supabase.from("department_memberships").update({ status: "pending", origin: "leader_invite" }).eq("id", existing.id)
      : { error: { message: "This person is already a member or has a pending request." } }
    : await supabase.from("department_memberships").insert({
        organisation_id: dept.organisation_id,
        department_id: departmentId,
        profile_id: profileId,
        status: "pending",
        origin: "leader_invite",
      });
  if (error) return fail(/already/.test(error.message) ? error.message : friendly(error.message));
  refresh(departmentId);
  return { ok: true, message: "Invitation sent. It appears on their member dashboard." };
}

export async function leaderUpdateMembership(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const departmentId = String(formData.get("departmentId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  const action = String(formData.get("decision") ?? "") as MembershipAction;
  if (!isUuid(departmentId) || !isUuid(membershipId) || !["approve", "reject", "deactivate", "withdraw"].includes(action)) return fail("Invalid request.");
  if ((await myLeadership(supabase, user.id, departmentId)) !== "leader") return fail("Only the department leader can manage members.");

  const { data: row } = await supabase
    .from("department_memberships")
    .select("id, profile_id, status, origin")
    .eq("id", membershipId)
    .eq("department_id", departmentId)
    .maybeSingle();
  if (!row) return fail("Membership not found.");
  if (row.profile_id === user.id) return fail("Ask an administrator to change your own membership.");
  const roster = await supabase.rpc("department_roster", { p_department: departmentId });
  const holds = ((roster.data ?? []) as { profile_id: string; leadership_role: string | null }[]).some((r) => r.profile_id === row.profile_id && r.leadership_role);
  const next = nextMembershipState("leader", { status: row.status as MembershipStatus, origin: row.origin as MembershipOrigin, holdsLeadership: holds }, action);
  if (!next) return fail(holds ? "Only an administrator can change a leader or deputy." : "That change is not available.");

  const { error } = await supabase.from("department_memberships").update({ status: next.status }).eq("id", row.id).eq("department_id", departmentId);
  if (error) return fail(friendly(error.message));
  refresh(departmentId);
  return { ok: true, message: { approve: "Request approved.", reject: "Request declined.", deactivate: "Member deactivated.", withdraw: "Invitation withdrawn." }[action as "approve"] ?? "Saved." };
}

/* ---------- Leader / deputy: events ---------- */

function readEvent(formData: FormData) {
  const title = cleanText(formData.get("title"), 120);
  const venue = cleanText(formData.get("venue"), 120);
  const description = cleanText(formData.get("description"), 600);
  const date = String(formData.get("date") ?? "");
  const startsAt = londonLocalToUtc(date, String(formData.get("startTime") ?? ""));
  const endsAt = londonLocalToUtc(date, String(formData.get("endTime") ?? ""));
  if (!title) return { error: "Give the activity a title." } as const;
  if (!startsAt || !endsAt) return { error: "Enter a valid date, start and end time." } as const;
  if (endsAt <= startsAt) return { error: "The end time must be after the start time." } as const;
  return { title, venue: venue || null, description: description || null, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() } as const;
}

export async function createDepartmentEvent(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const departmentId = String(formData.get("departmentId") ?? "");
  if (!isUuid(departmentId)) return fail("Invalid department.");
  if (!(await myLeadership(supabase, user.id, departmentId))) return fail("Only department leaders and deputies can schedule activities.");
  const fields = readEvent(formData);
  if ("error" in fields) return fail(fields.error ?? "Invalid activity.");
  if (new Date(fields.starts_at).getTime() < Date.now() - 60_000) return fail("Choose a time in the future.");
  const { data: dept } = await supabase.from("church_departments").select("organisation_id").eq("id", departmentId).maybeSingle();
  if (!dept) return fail("Department not found.");
  const { error } = await supabase.from("department_events").insert({ ...fields, organisation_id: dept.organisation_id, department_id: departmentId, status: "scheduled" });
  if (error) return fail(friendly(error.message));
  refresh(departmentId);
  return { ok: true, message: "Activity scheduled. Members can now respond." };
}

export async function updateDepartmentEvent(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const departmentId = String(formData.get("departmentId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!isUuid(departmentId) || !isUuid(eventId)) return fail("Invalid activity.");
  if (!(await myLeadership(supabase, user.id, departmentId))) return fail("Only department leaders and deputies can edit activities.");
  const fields = readEvent(formData);
  if ("error" in fields) return fail(fields.error ?? "Invalid activity.");
  const { data, error } = await supabase
    .from("department_events")
    .update({ ...fields, status: "rescheduled" })
    .eq("id", eventId)
    .eq("department_id", departmentId)
    .neq("status", "cancelled")
    .select("id");
  if (error) return fail(friendly(error.message));
  if (!data?.length) return fail("Activity not found or already cancelled.");
  refresh(departmentId);
  return { ok: true, message: "Activity updated." };
}

export async function cancelDepartmentEvent(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireMemberSession();
  const departmentId = String(formData.get("departmentId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!isUuid(departmentId) || !isUuid(eventId)) return fail("Invalid activity.");
  if (!(await myLeadership(supabase, user.id, departmentId))) return fail("Only department leaders and deputies can cancel activities.");
  const { data, error } = await supabase
    .from("department_events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .eq("department_id", departmentId)
    .select("id");
  if (error) return fail(friendly(error.message));
  if (!data?.length) return fail("Activity not found.");
  refresh(departmentId);
  return { ok: true, message: "Activity cancelled. Members will see it as cancelled." };
}
