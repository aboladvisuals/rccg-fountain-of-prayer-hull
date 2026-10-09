/** Only member destinations are accepted; never redirect to a supplied origin. */
export function memberDestination(value: string | null | undefined): string {
  if (!value || /[\\\s%]/.test(value)) return "/member";
  if (!/^\/member(?:\/|\?|#|$)/.test(value)) return "/member";
  const parsed = new URL(value, "https://internal.invalid");
  if (parsed.pathname !== "/member" && !parsed.pathname.startsWith("/member/")) return "/member";
  return parsed.pathname + parsed.search + parsed.hash;
}

export function magicLinkCallback(origin: string, next: string): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", memberDestination(next));
  return url.toString();
}
