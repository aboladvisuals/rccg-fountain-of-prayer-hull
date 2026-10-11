import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/session";

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
  const { supabase, organisation } = await requireAdminSession();

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
            Review church users, membership status and assigned access roles.
            Role editing controls will be added after the secure mutation layer
            and audit protection are in place.
          </p>
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
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {memberships.length === 0 ? (
              <div className="p-6">
                <p className="font-semibold">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {memberships.map((membership) => {
                  const profile = Array.isArray(membership.profile)
                    ? membership.profile[0] ?? null
                    : membership.profile;

                  const name =
                    profile?.full_name?.trim() ||
                    profile?.first_name?.trim() ||
                    profile?.email ||
                    "Unnamed user";

                  return (
                    <article
                      key={membership.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-950">
                          {name}
                        </h3>

                        {profile?.email && (
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {profile.email}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
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
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}