import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";
import { localDate } from "@/lib/member/dashboard";
import FamilyForm from "./family-form";
import FamilyCheckInButton from "./family-checkin-button";
import GuardianForm from "./guardian-form";

export default async function FamilyPage() {
  const { supabase, user } = await requireMemberSession();

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("slug", "rccg-fountain-of-prayer-hull")
    .eq("is_active", true)
    .maybeSingle();

  let familyId: string | null = null;

  let members: {
    id: string;
    first_name: string;
    last_name: string | null;
    relationship: string | null;
    checkedIn: boolean;
  }[] = [];

  let guardians: {
    profileId: string;
    name: string;
    email: string | null;
    relationship: string | null;
    isCurrentUser: boolean;
  }[] = [];

  let liveService: {
    id: string;
    title: string;
  } | null = null;

  if (organisation) {
    const { data: location } = await supabase
      .from("church_locations")
      .select("id, timezone")
      .eq("organisation_id", organisation.id)
      .eq("slug", "hull")
      .eq("is_active", true)
      .maybeSingle();

    if (location) {
      const today = localDate(new Date(), location.timezone);

      const { data: service } = await supabase
        .from("services")
        .select("id, title")
        .eq("organisation_id", organisation.id)
        .eq("location_id", location.id)
        .eq("service_date", today)
        .eq("status", "live")
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      liveService = service;
    }

    /*
      Every primary account holder was inserted into
      family_guardians during the migration, so this lookup
      now works for both primary adults and linked spouses.
    */
    const { data: guardianLink } = await supabase
      .from("family_guardians")
      .select("family_id")
      .eq("organisation_id", organisation.id)
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();

    if (guardianLink) {
      familyId = guardianLink.family_id;
    } else {
      // Compatibility fallback for a family created before
      // its guardian row exists.
      const { data: ownedFamily } = await supabase
        .from("families")
        .select("id")
        .eq("organisation_id", organisation.id)
        .eq("primary_profile_id", user.id)
        .limit(1)
        .maybeSingle();

      familyId = ownedFamily?.id ?? null;
    }

    if (familyId) {
      const [membersResult, guardiansResult] =
        await Promise.all([
          supabase
            .from("family_members")
            .select(
              "id, first_name, last_name, relationship"
            )
            .eq("family_id", familyId)
            .order("created_at", { ascending: true }),

          supabase
            .from("family_guardians")
            .select(
              "profile_id, relationship, created_at"
            )
            .eq("family_id", familyId)
            .order("created_at", { ascending: true }),
        ]);

      const guardianRows = guardiansResult.data ?? [];

      const guardianProfileIds = guardianRows.map(
        (guardian) => guardian.profile_id
      );

      const { data: guardianProfiles } =
        guardianProfileIds.length > 0
          ? await supabase
              .from("profiles")
              .select(
                "id, full_name, first_name, email"
              )
              .in("id", guardianProfileIds)
          : { data: [] };

      const profileMap = new Map(
        (guardianProfiles ?? []).map((profile) => [
          profile.id,
          profile,
        ])
      );

      guardians = guardianRows.map((guardian) => {
        const profile = profileMap.get(
          guardian.profile_id
        );

        return {
          profileId: guardian.profile_id,
          name:
            profile?.full_name?.trim() ||
            profile?.first_name?.trim() ||
            profile?.email ||
            "Household adult",
          email: profile?.email ?? null,
          relationship: guardian.relationship,
          isCurrentUser:
            guardian.profile_id === user.id,
        };
      });

      const rows = membersResult.data ?? [];

      members = await Promise.all(
        rows.map(async (member) => {
          let checkedIn = false;

          if (liveService) {
            const { data: attendance } = await supabase
              .from("attendance")
              .select("id")
              .eq("service_id", liveService.id)
              .eq("family_member_id", member.id)
              .maybeSingle();

            checkedIn = Boolean(attendance);
          }

          return {
            ...member,
            checkedIn,
          };
        })
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/member"
          className="text-sm font-semibold text-purple-700"
        >
          ← Back to member dashboard
        </Link>

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Family
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Your household
          </h1>

          <p className="mt-3 text-slate-600">
            Manage your household and check family members into a live church service.
          </p>
        </section>

        {liveService && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-semibold text-green-800">
              Live service
            </p>

            <p className="mt-1 font-semibold text-slate-950">
              {liveService.title}
            </p>
          </section>
        )}

        {familyId && (
          <section className="mt-8">
            <h2 className="text-xl font-bold">
              Household adults
            </h2>

            <div className="mt-4 space-y-3">
              {guardians.map((guardian) => (
                <article
                  key={guardian.profileId}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {guardian.name}
                      </p>

                      {guardian.email && (
                        <p className="mt-1 text-sm text-slate-500">
                          {guardian.email}
                        </p>
                      )}

                      <p className="mt-1 text-sm text-slate-500">
                        {guardian.relationship ||
                          "Household adult"}
                      </p>
                    </div>

                    {guardian.isCurrentUser && (
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                        You
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <GuardianForm />
        </section>

        <section className="mt-8">
          <FamilyForm />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Family members
          </h2>

          {members.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No family members have been added yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="font-semibold text-slate-950">
                    {member.first_name}
                    {member.last_name
                      ? ` ${member.last_name}`
                      : ""}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {member.relationship ||
                      "Family member"}
                  </p>

                  {liveService ? (
                    <FamilyCheckInButton
                      memberId={member.id}
                      serviceId={liveService.id}
                      firstName={member.first_name}
                      checkedIn={member.checkedIn}
                    />
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No live service available for check-in.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
