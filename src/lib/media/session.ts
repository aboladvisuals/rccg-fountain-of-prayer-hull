import { redirect } from "next/navigation";
import { requireMemberSession } from "@/lib/member/session";
import { hasMediaAccess } from "@/lib/member/dashboard";

export async function requireMediaSession() {
  const { supabase, user } = await requireMemberSession();

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, name")
    .eq("slug", "rccg-fountain-of-prayer-hull")
    .eq("is_active", true)
    .maybeSingle();

  if (!organisation) {
    redirect("/member");
  }

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("role, status")
    .eq("organisation_id", organisation.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!membership || !hasMediaAccess(membership)) {
    redirect("/member");
  }

  return {
    supabase,
    user,
    organisation,
    role: membership.role as "media" | "pastor" | "admin",
  };
}