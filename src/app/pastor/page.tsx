import Link from "next/link";
import ToolCard from "@/components/app/ToolCard";
import Icon from "@/components/ui/Icon";

import { localDate } from "@/lib/member/dashboard";
import { requireStaffSession } from "@/lib/staff/session";
import LondonCalendar from "@/components/app/LondonCalendar";
import MembershipStats from "@/components/app/MembershipStats";

export default async function PastorDashboardPage() {
  const { supabase, organisation, role } =
    await requireStaffSession();

  const { data: location } = await supabase
    .from("church_locations")
    .select("id, name, timezone")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  let service: {
    id: string;
    title: string;
  } | null = null;

  let totalPresent = 0;
  let membersPresent = 0;
  let visitorsPresent = 0;

  if (location) {
    const today = localDate(
      new Date(),
      location.timezone
    );

    const { data: liveService } = await supabase
      .from("services")
      .select("id, title")
      .eq("organisation_id", organisation.id)
      .eq("location_id", location.id)
      .eq("service_date", today)
      .eq("status", "live")
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    service = liveService;

    if (service) {
      const [attendanceResult, visitorResult] =
        await Promise.all([
          supabase
            .from("attendance")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "organisation_id",
              organisation.id
            )
            .eq("service_id", service.id),

          supabase
            .from("visitors")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "organisation_id",
              organisation.id
            )
            .eq("service_id", service.id),
        ]);

      membersPresent =
        attendanceResult.count ?? 0;

      visitorsPresent =
        visitorResult.count ?? 0;

      totalPresent =
        membersPresent + visitorsPresent;
    }
  }

  const [
    unreadNotesResult,
    pendingTestimoniesResult,
  ] = await Promise.all([
    supabase
      .from("private_notes")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("organisation_id", organisation.id)
      .eq("is_read", false),

    supabase
      .from("testimonies")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("organisation_id", organisation.id)
      .eq("is_approved", false),
  ]);

  const unreadNotes =
    unreadNotesResult.count ?? 0;

  const pendingTestimonies =
    pendingTestimoniesResult.count ?? 0;

  return (
    <main className="app-page">
      <div className="mx-auto max-w-6xl">
        <section className="app-hero p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                {organisation.name}
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl display-title">
                Pastor &amp; Admin Dashboard
              </h1>
              <p className="mt-3 max-w-xl text-purple-100">
                Live church operations, pastoral care and service management.
              </p>
            </div>
            <span className="chip border-white/15 bg-white/10 text-white">
              <Icon name="shield" size={16} />
              {role === "admin" ? "Administrator" : "Pastor"}
            </span>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="today-overview">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Today</p>
              <h2 id="today-overview" className="section-title mt-1">
                Today&apos;s overview
              </h2>
            </div>
            {service && (
              <span className="chip chip-live">{service.title} · Live</span>
            )}
          </div>

          {!service ? (
            <div className="app-card mt-4 flex items-start gap-4 p-6">
              <span className="tool-icon shrink-0">
                <Icon name="calendar" />
              </span>
              <div>
                <p className="font-semibold">No live service right now</p>
                <p className="mt-1 text-sm text-slate-600">
                  Start a scheduled service when the congregation is ready.
                </p>
                <Link href="/pastor/services" className="btn-secondary mt-4 inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold">
                  Go to services
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <article className="app-card p-6">
                <p className="text-sm text-slate-600">Total present</p>
                <p className="stat-value mt-2">{totalPresent}</p>
              </article>
              <article className="app-card p-6">
                <p className="text-sm text-slate-600">Members &amp; family</p>
                <p className="stat-value mt-2 text-purple-700">{membersPresent}</p>
              </article>
              <article className="app-card p-6">
                <p className="text-sm text-slate-600">Visitors</p>
                <p className="stat-value mt-2 text-gold-700">{visitorsPresent}</p>
              </article>
            </div>
          )}
        </section>
        <div className="lg:col-span-5">
          <LondonCalendar initialToday={localDate(new Date(), "Europe/London")} />
        </div>
        </div>

        <MembershipStats supabase={supabase} organisationId={organisation.id} />

        <section className="mt-12" aria-labelledby="ops">
          <p className="kicker">Sunday</p>
          <h2 id="ops" className="section-title mt-1">Church operations</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ToolCard href="/pastor/services" icon="calendar" title="Church services" description="Create, start and end services." />
            <ToolCard href="/pastor/presence" icon="presence" title="Live presence" description="Who is checked in to the live service." />
            <ToolCard href="/pastor/visitors" icon="visitor" title="Visitors today" description="Welcome ministry list for today." />
            <ToolCard href="/media" icon="screen" title="Media dashboard" description="Auditorium presentation controls." tone="accent" />
          </div>
        </section>

        <section className="mt-12" aria-labelledby="care">
          <p className="kicker">Shepherding</p>
          <h2 id="care" className="section-title mt-1">Pastoral care</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ToolCard href="/pastor/private-notes" icon="note" title="Private notes" description="Confidential messages from members." badge={unreadNotes} badgeLabel="unread" note="Confidential" />
            <ToolCard href="/pastor/testimonies" icon="testimony" title="Testimonies" description="Review testimonies before anything is shared." badge={pendingTestimonies} badgeLabel="awaiting review" />
          </div>
        </section>

        <section className="mt-12" aria-labelledby="comms">
          <p className="kicker">Auditorium</p>
          <h2 id="comms" className="section-title mt-1">Display &amp; communication</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ToolCard href="/pastor/announcements" icon="megaphone" title="Announcements" description="Presentation content for the screen." />
            <ToolCard href="/pastor/display-settings" icon="sliders" title="Display settings" description="What the auditorium screen may show." />
            <ToolCard href="/display" icon="screen" title="Auditorium display" description="Open the big-screen view." newTab />
            {role === "admin" && (
              <ToolCard href="/admin/users" icon="users" title="Users & roles" description="Administrator-only role management." note="Admin only" />
            )}
            {role === "admin" && (
              <ToolCard href="/admin/departments" icon="department" title="Departments" description="Leaders, deputies, members and join requests." note="Admin only" />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
