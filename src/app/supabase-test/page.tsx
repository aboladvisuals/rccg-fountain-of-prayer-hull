export const dynamic = "force-dynamic";

export default async function SupabaseTestPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let status = "Environment variables missing";

  if (url && key) {
    try {
      const response = await fetch(`${url}/auth/v1/settings`, {
        headers: {
          apikey: key,
        },
        cache: "no-store",
      });

      status = response.ok
        ? "Supabase connection successful"
        : `Supabase responded with status ${response.status}`;
    } catch (error) {
      status =
        error instanceof Error
          ? `Connection error: ${error.message}`
          : "Connection failed";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-bold">
          Supabase Connection Test
        </h1>

        <p className="mt-4">{status}</p>
      </div>
    </main>
  );
}
