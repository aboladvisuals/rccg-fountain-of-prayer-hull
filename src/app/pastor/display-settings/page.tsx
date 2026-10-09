import Link from "next/link";
import { requireStaffSession } from "@/lib/staff/session";
import DisplaySettingsForm from "./display-settings-form";

export default async function DisplaySettingsPage() {
  const { supabase, organisation } =
    await requireStaffSession();

  const { data: location } = await supabase
    .from("church_locations")
    .select("id")
    .eq("organisation_id", organisation.id)
    .eq("slug", "hull")
    .eq("is_active", true)
    .maybeSingle();

  let settings = {
    welcome_message:
      "Jesus Christ the same yesterday, and today, and forever.",
    show_birthdays: true,
    show_serving_team: true,
    show_presence: true,
  };

  if (location) {
    const { data } = await supabase
      .from("display_settings")
      .select(`
        welcome_message,
        show_birthdays,
        show_serving_team,
        show_presence
      `)
      .eq("organisation_id", organisation.id)
      .eq("location_id", location.id)
      .maybeSingle();

    if (data) {
      settings = data;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/pastor"
          className="text-sm font-semibold text-purple-700"
        >
          ← Back to Pastor & Admin Dashboard
        </Link>

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Auditorium display
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Display settings
          </h1>

          <p className="mt-3 text-slate-600">
            Control what appears on the church auditorium screen.
          </p>
        </section>

        <section className="mt-8">
          <DisplaySettingsForm
            welcomeMessage={settings.welcome_message}
            showBirthdays={settings.show_birthdays}
            showServingTeam={settings.show_serving_team}
            showPresence={settings.show_presence}
          />
        </section>

        <section className="mt-6">
          <Link
            href="/display"
            target="_blank"
            className="inline-flex rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-800"
          >
            Open auditorium display ↗
          </Link>
        </section>
      </div>
    </main>
  );
}
