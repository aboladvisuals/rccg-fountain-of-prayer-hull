import { createClient } from "@/lib/supabase/server";
import { memberDestination } from "@/lib/auth/redirects";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const next = memberDestination(params.get("next"));
  let destination = `/login?error=auth&next=${encodeURIComponent(next)}`;
  const code = params.get("code");
  if (code && !params.has("error")) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) destination = next;
    } catch {
      // Never expose tokens, provider messages, or callback parameters in logs.
    }
  }
  // Relative Location preserves the browser's origin behind proxies and on LAN.
  // Never trust forwarded Host headers or a user-supplied absolute return URL.
  return new Response(null, { status: 303, headers: {
    Location: destination,
    "Cache-Control": "private, no-store, max-age=0",
    "Referrer-Policy": "no-referrer",
  } });
}
