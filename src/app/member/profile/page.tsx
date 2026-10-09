import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const { supabase, user } = await requireMemberSession();

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      email,
      full_name,
      first_name,
      phone,
      show_name_on_display,
      show_family_on_display,
      birth_month,
      birth_day
    `)
    .eq("id", user.id)
    .maybeSingle();

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
            Account
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Profile & privacy
          </h1>

          <p className="mt-3 text-slate-600">
            Manage your church profile and what may appear on public church displays.
          </p>
        </section>

        <section className="mt-8">
          <ProfileForm
            email={profile?.email ?? user.email ?? ""}
            fullName={profile?.full_name ?? ""}
            firstName={profile?.first_name ?? ""}
            phone={profile?.phone ?? ""}
            showNameOnDisplay={
              profile?.show_name_on_display ?? false
            }
            showFamilyOnDisplay={
              profile?.show_family_on_display ?? false
            }
            birthMonth={profile?.birth_month ?? null}
            birthDay={profile?.birth_day ?? null}
          />
        </section>
      </div>
    </main>
  );
}
