import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = { full_name: string | null; first_name: string | null; show_name_on_display: boolean; show_family_on_display: boolean };
export type Membership = { role: "member" | "pastor" | "admin" | "media"; status: "active" | "inactive" };
export type Service = { id: string; title: string; starts_at: string | null };
export type Attendance = { checked_in_at: string; is_serving: boolean };
export type Dashboard = {
  profile: Profile | null;
  membership: Membership | null;
  organisationName: string;
  locationName: string;
  timezone: string;
  services: { service: Service; attendance: Attendance | null; unavailable: boolean }[];
  issues: string[];
  presenceAvailable: boolean;
};

export function hasStaffAccess(membership: Membership | null): boolean {
  return membership?.status === "active" && ["pastor", "admin"].includes(membership.role);
}

export function localDate(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export async function loadDashboard(supabase: SupabaseClient, userId: string, now = new Date()): Promise<Dashboard> {
  const result: Dashboard = { profile: null, membership: null, organisationName: "Fountain of Prayer Hull", locationName: "Hull", timezone: "Europe/London", services: [], issues: [], presenceAvailable: false };
  const [profile, organisation] = await Promise.all([
    supabase.from("profiles").select("full_name, first_name, show_name_on_display, show_family_on_display").eq("id", userId).maybeSingle(),
    supabase.from("organisations").select("id, name").eq("slug", "rccg-fountain-of-prayer-hull").eq("is_active", true).maybeSingle(),
  ]);
  if (profile.error) result.issues.push("Your profile could not be loaded. Please refresh to try again.");
  else if (!profile.data) result.issues.push("Your profile is not ready yet. Please contact the church team.");
  else result.profile = profile.data;
  if (organisation.error || !organisation.data) {
    result.issues.push("Church details are temporarily unavailable. Please refresh to try again.");
    return result;
  }
  const org = organisation.data;
  result.organisationName = org.name;
  const [membership, location] = await Promise.all([
    supabase.from("organisation_memberships").select("role, status").eq("organisation_id", org.id).eq("profile_id", userId).maybeSingle(),
    supabase.from("church_locations").select("id, name, timezone").eq("organisation_id", org.id).eq("slug", "hull").eq("is_active", true).maybeSingle(),
  ]);
  if (membership.error) result.issues.push("Your membership could not be verified. Please refresh to try again.");
  else result.membership = membership.data;
  if (location.error || !location.data) {
    result.issues.push("Hull service details are temporarily unavailable.");
    return result;
  }
  result.locationName = location.data.name;
  result.timezone = location.data.timezone;
  // No privileges or membership are inferred from a successful email login.
  if (membership.error || result.membership?.status !== "active") return result;
  let date: string;
  try { date = localDate(now, result.timezone); }
  catch { result.issues.push("The church timezone needs to be checked by the church team."); return result; }
  const services = await supabase.from("services").select("id, title, starts_at")
    .eq("organisation_id", org.id).eq("location_id", location.data.id)
    .eq("status", "live").eq("service_date", date).order("starts_at", { ascending: true, nullsFirst: false });
  if (services.error) { result.issues.push("Your current service could not be loaded. Please refresh to try again."); return result; }
  result.presenceAvailable = true;
  result.services = await Promise.all((services.data ?? []).map(async (service: Service) => {
    const attendance = await supabase.from("attendance").select("checked_in_at, is_serving")
      .eq("organisation_id", org.id).eq("service_id", service.id).eq("profile_id", userId).maybeSingle();
    return { service, attendance: attendance.error ? null : attendance.data, unavailable: Boolean(attendance.error) };
  }));
  return result;
}
