import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { memberDestination } from "@/lib/auth/redirects";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previous = response;
        response = NextResponse.next({ request });
        previous.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
        for (const name of ["cache-control", "expires", "pragma"]) {
          const value = previous.headers.get(name);
          if (value) response.headers.set(name, value);
        }
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    } },
  );
  const { data, error } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const memberRoute = path === "/member" || path.startsWith("/member/");
  if (memberRoute && (error || !data?.claims)) {
    const next = memberDestination(path + request.nextUrl.search);
    const redirected = NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url));
    response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
    response = redirected;
  }
  if (memberRoute || path === "/login" || path.startsWith("/auth/")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
}

