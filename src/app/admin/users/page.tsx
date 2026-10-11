import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/session";
import UserAccessForm from "./user-access-form";

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  email: string | null;
};

type MembershipRow = {
  id: string;
  role: "member" | "pastor" | "admin" | "media";
  status: "active" | "inactive";
  profile: ProfileRow | ProfileRow[] | null;
};

export default async function AdminUsersPage() {
  const { supabase, organisation, user } =
    await requireAdminSession();

  const { data, error } = await supabase
    .from("organisation_memberships")
    .select(
      `
        id,
        role,
        status,
        profile:profiles (
          id,
          full_name,
          first_name,
          email
        )
      `
    )
    .eq("organisation_id", organisation.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load organisation users.");
  }

  const memberships = (data ?? []) as unknown as MembershipRow[];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/pastor"
            className="text-sm font-semibold text-purple-700"
          >
            ← Pastor & Admin Dashboard
          </Link>

          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
            Administrator
          </span>
        </header>

        <section className="mt-8 rounded-3xl bg-purple-950 p-7 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
            {organisation.name}
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            User & Role Management
          </h1>

          <p className="mt-3 max-w-3xl text-purple-100">
            Assign church access roles and activate or deactivate
            organisation membership.
          </p>

          <div className="mt-6 rounded-2xl border border-purple-700 bg-purple-900/50 p-4 text-sm leading-6 text-purple-100">
            <strong className="text-white">Access levels:</strong>{" "}
            Member has normal church access. Pastor receives pastoral
            operations access. Media receives presentation access. Admin
            receives administrative access, including user management.
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Organisation users</h2>

              <p className="mt-1 text-sm text-slate-500">
                {memberships.length} user
                {memberships.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Changes are audit logged
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {memberships.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="font-semibold">No users found</p>
              </div>
            ) : (
              memberships.map((membership) => {
                const profile = Array.isArray(membership.profile)
                  ? membership.profile[0] ?? null
                  : membership.profile;

                const name =
                  profile?.full_name?.trim() ||
                  profile?.first_name?.trim() ||
                  profile?.email ||
                  "Unnamed user";

                const isCurrentUser = profile?.id === user.id;

                return (
                  <article
                    key={membership.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-slate-950">
                            {name}
                          </h3>

                          {isCurrentUser && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              You
                            </span>
                          )}
                        </div>

                        {profile?.email && (
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {profile.email}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold capitalize text-purple-800">
                            {membership.role}
                          </span>

                          <span
                            className={
                              membership.status === "active"
                                ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold capitalize text-green-800"
                                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600"
                            }
                          >
                            {membership.status}
                          </span>
                        </div>
                      </div>

                      <div className="w-full lg:max-w-xl">
                        <UserAccessForm
                          membershipId={membership.id}
                          initialRole={membership.role}
                          initialStatus={membership.status}
                          userName={name}
                          isCurrentUser={isCurrentUser}
                        />
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong>Administrator protection:</strong> the database prevents
          the final active administrator from being demoted, deactivated
          or deleted. Every role/status change is recorded in the membership
          audit log.
        </section>
      </div>
    </main>
  );
}