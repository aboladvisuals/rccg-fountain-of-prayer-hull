import Link from "next/link";
import ToolCard from "@/components/app/ToolCard";
import Icon, { type IconName } from "@/components/ui/Icon";
import { requireMemberSession } from "@/lib/member/session";
import { hasStaffAccess, loadDashboard, localDate } from "@/lib/member/dashboard";
import { loadJoinableDepartments, loadMyLeadership, loadMyMemberships, loadUpcomingEvents } from "@/lib/departments/workspace";
import LondonCalendar from "@/components/app/LondonCalendar";
import PresenceControls from "./presence-controls";
import MyDepartments from "./my-departments";

const memberTools: [string, string, string, IconName, string?][] = [
  ["/member/family", "Family", "Manage your household and family check-in.", "family"],
  ["/member/history", "Attendance history", "Look back at the services you have attended.", "history"],
  ["/member/private-note", "Private note", "Send a private message to the pastoral team.", "note"],
  ["/member/testimony", "Testimony", "Share what God has done in your life.", "testimony"],
  ["/member/profile", "Profile & privacy", "Manage your details and church display preferences.", "profile"],
  ["/member/bible", "Bible", "Read Scripture through an authorised source.", "bible", "Opens an external Bible site"],
  ["/member/hymnal", "Hymnal", "Search hymn numbers and titles. Lyrics are not stored.", "hymnal", "Titles and numbers only"],
];

export default async function MemberPage() {
  const { supabase, user } = await requireMemberSession();
  const dashboard = await loadDashboard(supabase, user.id);
  const { profile, membership, issues } = dashboard;
  const name = profile?.first_name?.trim() || profile?.full_name?.trim();
  const active = membership?.status === "active";
  const role = active ? ({ member: "Member", pastor: "Pastor", admin: "Administrator", media: "Media team" }[membership.role]) : "Access pending";
  const [{ rows: departmentRows }, leadership] = await Promise.all([
    loadMyMemberships(supabase, user.id),
    loadMyLeadership(supabase, user.id),
  ]);
  const activeDepartments = departmentRows.filter((row) => row.status === "active" && row.department);
  const { data: church } = await supabase.from("organisations").select("id").eq("slug", "rccg-fountain-of-prayer-hull").eq("is_active", true).maybeSingle();
  const orgId = church?.id as string | undefined;
  const [upcoming, joinable] = await Promise.all([
    active ? loadUpcomingEvents(supabase, activeDepartments.map((row) => row.department!.id), { limit: 60 }) : Promise.resolve([]),
    active && orgId ? loadJoinableDepartments(supabase, orgId) : Promise.resolve([]),
  ]);
  const departmentNames = new Map(activeDepartments.map((row) => [row.department!.id, row.department!.name]));
  const calendarEvents = upcoming.map((event) => ({ id: event.id, title: event.title, startsAt: event.starts_at, status: event.status, departmentName: departmentNames.get(event.department_id) }));
  const time = (value: string) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: dashboard.timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));

  return (
    <main className="app-page">
      <div className="mx-auto max-w-6xl">
        <section className="app-hero p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">{dashboard.organisationName}</p>
              <h1 className="display-title mt-3 text-4xl sm:text-5xl">Welcome{name ? `, ${name}` : " back"}</h1>
              <p className="mt-3 break-words text-purple-100">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                <Icon name="shield" size={16} /> {role}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                <Icon name="presence" size={16} /> {dashboard.locationName}
              </span>
            </div>
          </div>
        </section>

        {issues.length > 0 && <div role="alert" className="notice mt-6 border-amber-200 bg-amber-50 text-amber-950">
          {issues.map((issue) => <p key={issue} className="mb-2 last:mb-0">{issue}</p>)}
          <a href="/member" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Refresh dashboard</a>
        </div>}

        {!active && !issues.some((issue) => /membership|Church details/.test(issue)) && <section className="app-card mt-6 border-purple-200 bg-purple-50 p-6">
          <h2 className="section-title">{membership?.status === "inactive" ? "Your membership is inactive" : "Your account is ready; member access is pending"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">You are signed in securely. Please ask the church team to {membership ? "reactivate" : "link"} your membership at Fountain of Prayer Hull.</p>
        </section>}

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-7" aria-labelledby="presence-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kicker">Today</p>
                <h2 id="presence-heading" className="section-title mt-1">Your presence today</h2>
              </div>
              <a href="/member" className="inline-flex min-h-11 items-center text-sm font-semibold text-purple-700 underline-offset-4 hover:underline">Refresh status</a>
            </div>
            <p className="mt-1 text-sm text-slate-500">{dashboard.timezone} · Status updates when you refresh.</p>
            {!dashboard.presenceAvailable ? <p className="app-card mt-4 p-6 text-slate-600">{active ? "Presence is temporarily unavailable." : "Presence and serving status will be available once your membership is active."}</p>
              : dashboard.services.length === 0 ? <div className="app-card mt-4 flex items-start gap-4 p-6">
                <span className="tool-icon shrink-0"><Icon name="calendar" /></span>
                <div>
                  <h3 className="font-semibold">No live service right now</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Your check-in and serving status will appear here when a service is live today.</p>
                </div>
              </div> : dashboard.services.map(({ service, attendance, unavailable }) => <article key={service.id} className="app-card mt-4 overflow-hidden p-6">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{service.title}</h3><span className="chip chip-live">Live today</span></div>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-500">Check-in</dt><dd className="mt-1 font-semibold">{unavailable ? "Status unavailable" : attendance ? "Checked in" : "Not checked in"}</dd>
                    {attendance && <dd className="mt-1 text-sm text-slate-500">{time(attendance.checked_in_at)}</dd>}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-500">Serving</dt><dd className="mt-1 font-semibold">{unavailable ? "Status unavailable" : attendance?.is_serving ? "You’re serving today" : attendance ? "Not marked as serving" : "Not recorded yet"}</dd></div>
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

          <div className="lg:col-span-5">
            <LondonCalendar initialToday={localDate(new Date(), "Europe/London")} events={calendarEvents} />

            <div className="mt-6">
              <MyDepartments memberships={departmentRows} leadership={leadership} joinable={joinable} />
            </div>

            {hasStaffAccess(membership) && (
              <section className="app-hero mt-6 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Pastoral &amp; administration</p>
                <h2 className="display-title mt-2 text-2xl">Your {role.toLowerCase()} role is recognised.</h2>
                <Link
                  href="/pastor"
                  className="btn mt-5 bg-white text-purple-900 hover:bg-gold-100"
                >
                  Open Pastor &amp; Admin Dashboard <Icon name="arrow" size={18} />
                </Link>
              </section>
            )}
          </div>
        </div>

        <section className="mt-10" aria-labelledby="member-tools">
          <p className="kicker">Your church life</p>
          <h2 id="member-tools" className="section-title mt-1">Everything in one place</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {memberTools.map(([href, title, description, icon, note]) => (
              <ToolCard key={href} href={href} title={title} description={description} icon={icon} note={note} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
