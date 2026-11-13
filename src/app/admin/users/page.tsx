import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/session";
import UserAccessForm from "./user-access-form";
import { isMissingColumnError } from "@/lib/member/dashboard";

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
  awaiting_role?: boolean;
  profile: ProfileRow | ProfileRow[] | null;
};

const PROFILE_COLUMNS = "profile:profiles (id, full_name, first_name, email)";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { supabase, organisation, user } =
    await requireAdminSession();
  const showAwaitingOnly = (await searchParams).show === "awaiting";

  const load = (columns: string) =>
    supabase
      .from("organisation_memberships")
      .select(`${columns}, ${PROFILE_COLUMNS}`)
      .eq("organisation_id", organisation.id)
      .order("created_at", { ascending: true });

  let result = await load("id, role, status, awaiting_role");
  // Before the sign-up migration is applied the column does not exist yet.
  if (isMissingColumnError(result.error)) {
    result = await load("id, role, status");
  }
  const { data, error } = result;

  if (error) {
    throw new Error("Unable to load organisation users.");
  }

  const all = (data ?? []) as unknown as MembershipRow[];
  const awaitingCount = all.filter((m) => m.awaiting_role === true).length;
  // New sign-ups awaiting a role are listed first so the admin sees them straight away.
  const memberships = [
    ...all.filter((m) => m.awaiting_role === true),
    ...(showAwaitingOnly ? [] : all.filter((m) => m.awaiting_role !== true)),
  ];

  return (
    <main className="app-page">
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

        <section className="app-hero mt-8 p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
            {organisation.name}
          </p>

          <h1 className="mt-3 text-4xl sm:text-5xl display-title">
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
                {all.length} user
                {all.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Changes are audit logged
            </div>
          </div>

          {(awaitingCount > 0 || showAwaitingOnly) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p>
                <strong>
                  {awaitingCount} new sign-up{awaitingCount === 1 ? "" : "s"} awaiting a role.
                </strong>{" "}
                Choose a role and status, then save. They have no member access until you do.
              </p>
              <Link
                href={showAwaitingOnly ? "/admin/users" : "/admin/users?show=awaiting"}
                className="inline-flex min-h-11 items-center font-semibold text-amber-900 underline underline-offset-4"
              >
                {showAwaitingOnly ? "Show everyone" : "Show only new sign-ups"}
              </Link>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {memberships.length === 0 ? (
              <div className="app-card p-6">
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
                    className="app-card p-5 sm:p-6"
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

                          {membership.awaiting_role === true && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                              New sign-up · awaiting a role
                            </span>
                          )}

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
                          awaitingRole={membership.awaiting_role === true}
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