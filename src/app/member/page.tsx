import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";
import { hasStaffAccess, loadDashboard } from "@/lib/member/dashboard";
import SignOutButton from "./sign-out-button";
import PresenceControls from "./presence-controls";

const memberTools = [
  ["/member/family", "Family", "Manage your household and family check-in."],
  ["/member/history", "Attendance history", "Look back at the services you have attended."],
  ["/member/private-note", "Private note", "Send a private message to the pastoral team."],
  ["/member/testimony", "Testimony", "Share what God has done in your life."],
  ["/member/profile", "Profile & privacy", "Manage your details and church display preferences."],
];

export default async function MemberPage() {
  const { supabase, user } = await requireMemberSession();
  const dashboard = await loadDashboard(supabase, user.id);
  const { profile, membership, issues } = dashboard;
  const name = profile?.first_name?.trim() || profile?.full_name?.trim();
  const active = membership?.status === "active";
  const role = active ? ({ member: "Member", pastor: "Pastor", admin: "Administrator", media: "Media team" }[membership.role]) : "Access pending";
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-purple-700">← Church home</Link>
          <SignOutButton />
        </header>
        <section className="mt-8 rounded-3xl bg-purple-950 p-7 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">{dashboard.organisationName}</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Welcome{name ? `, ${name}` : " back"}</h1>
          <p className="mt-3 break-words text-purple-100">{user.email}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1">{role}</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{dashboard.locationName}</span>
          </div>
        </section>

        {issues.length > 0 && <div role="alert" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          {issues.map((issue) => <p key={issue} className="mb-2 last:mb-0">{issue}</p>)}
          <a href="/member" className="mt-3 inline-block font-semibold underline">Refresh dashboard</a>
        </div>}

        {!active && !issues.some((issue) => /membership|Church details/.test(issue)) && <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-6">
          <h2 className="text-lg font-semibold">{membership?.status === "inactive" ? "Your membership is inactive" : "Your account is ready; member access is pending"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">You are signed in securely. Please ask the church team to {membership ? "reactivate" : "link"} your membership at Fountain of Prayer Hull.</p>
        </section>}

        <section className="mt-8" aria-labelledby="presence-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="presence-heading" className="text-xl font-bold">Your presence today</h2>
            <a href="/member" className="text-sm font-semibold text-purple-700">Refresh status</a>
          </div>
          <p className="mt-1 text-sm text-slate-500">{dashboard.timezone} · Status updates when you refresh.</p>
          {!dashboard.presenceAvailable ? <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">{active ? "Presence is temporarily unavailable." : "Presence and serving status will be available once your membership is active."}</p>
            : dashboard.services.length === 0 ? <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold">No live service right now</h3>
              <p className="mt-2 text-sm text-slate-600">Your check-in and serving status will appear here when a service is live today.</p>
            </div> : dashboard.services.map(({ service, attendance, unavailable }) => <article key={service.id} className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{service.title}</h3><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">Live today</span></div>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div><dt className="text-sm text-slate-500">Check-in</dt><dd className="mt-1 font-semibold">{unavailable ? "Status unavailable" : attendance ? "Checked in" : "Not checked in"}</dd>
                  {attendance && <dd className="mt-1 text-sm text-slate-500">{new Intl.DateTimeFormat("en-GB", { timeZone: dashboard.timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(attendance.checked_in_at))}</dd>}
                </div>
                <div><dt className="text-sm text-slate-500">Serving</dt><dd className="mt-1 font-semibold">{unavailable ? "Status unavailable" : attendance?.is_serving ? "You’re serving today" : attendance ? "Not marked as serving" : "Not recorded yet"}</dd></div>
              </dl>
              {unavailable && <p role="alert" className="mt-4 text-sm text-amber-800">We couldn’t load your attendance. Please refresh to try again.</p>}

              <PresenceControls
                serviceId={service.id}
                checkedIn={Boolean(attendance)}
                serving={attendance?.is_serving ?? false}
                unavailable={unavailable}
              />
            </article>)}

        </section>

        <section className="mt-9" aria-labelledby="member-tools">
          <h2 id="member-tools" className="text-xl font-bold">
            Your church life
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {memberTools.map(([href, title, description]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold">
                  {title} →
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {hasStaffAccess(membership) && (
          <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-6">
            <h2 className="text-lg font-semibold">
              Pastoral & administration
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Your {role.toLowerCase()} role is recognised.
            </p>

            <Link
              href="/pastor"
              className="mt-4 inline-flex rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Open Pastor & Admin Dashboard →
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}






