# Authentication and member dashboard

The browser requests a PKCE magic link using its current origin. The callback exchanges the code and writes SSR cookies; the callback uses a relative redirect to preserve the browser origin. Next.js Proxy requires an absolute redirect, so member protection derives its login URL from the incoming request URL. Configure deployment proxies to preserve the public host and protocol. Only `/member` destinations are accepted. Do not override the callback origin to a different host: the PKCE verifier belongs to the browser and host that requested the email.

## Supabase setup

In Authentication → URL Configuration, set Site URL to the canonical public URL when deployed. For local testing, use `http://localhost:3000`. Add `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/callback?next=**` to Redirect URLs. Add the equivalent entries for each actual LAN address/port and the eventual HTTPS production domain. Keep production host matching exact. If your provider matches query strings, the second entry allows the validated member return path. Do not use a wildcard production hostname.

The default email template must use `{{ .ConfirmationURL }}`. A custom template hardcoding Site URL can discard the requested callback. This application expects the resulting `?code=…` PKCE callback. Request and open the newest link in the same browser, on the same device and host. A phone must request its own link from the computer's LAN address; `localhost` on a phone refers to the phone. For Next development, allow the specific LAN host through `allowedDevOrigins` if Next rejects development assets/actions. Use HTTPS and the normal canonical host in production.

No new secret or privileged key is needed. Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` remain in use. Never put a service-role key in the browser. Supabase's redirect allowlist and email delivery settings are separate from application code.

## Sessions and access

The existing SSR clients persist sessions in cookies. Proxy refreshes verified claims, forwards refreshed cookies, preserves provider cache headers, and protects `/member` and descendants. Member layout and data access also verify with `getUser()`. Member/login/auth responses must not be cached by a CDN. Sign-out is a server action, signs out this device, invalidates the router cache, and returns to login. Other devices stay signed in.

The existing new-user trigger creates profiles. The dashboard never creates membership or elevates roles. It loads the authenticated user's profile and Hull organisation membership using the normal client and existing RLS. Missing/inactive memberships show a pending/inactive state. Active pastor/admin roles are recognised from the database, never user metadata. Future actions must independently validate authentication, active organisation membership and permissions before writing.

Presence reads today's live services in the configured Hull timezone, then only this user's attendance for each service. A record indicates check-in; `is_serving` is shown from that record. Missing records, query errors and no live service have separate states. Historical or stale live services on earlier dates are not current presence. Check-in, family, history, notes, testimony, profile editing and staff tools remain clearly labelled placeholders in this phase.

## Verification

Run `npm run build`, `npx tsc --noEmit`, `npm run lint`, and `node --test tests/auth-member.test.cjs tests/session-lifecycle.test.cjs`.

The offline test suite is the safe local verification path when email delivery is blocked: it tests production callback, redirect guards, refresh-cookie propagation, protected routing, sign-out, roles, data scoping, timezone handling and error states using provider doubles. A separate lifecycle test uses the real Supabase SSR library with an isolated Auth transport to exercise PKCE verifier cookies, session persistence across client instances, token refresh and cookie removal on sign-out. It introduces no bypass endpoint, test password, service-role key or production runtime switch. These tests do **not** prove real email delivery, provider token exchange, browser session persistence or RLS integration.

For live verification: request one email from `/login`; open it in the requesting browser; confirm `/member` loads; reload and open another tab to confirm persistence; sign out; revisit `/member` and confirm login protection. Repeat with an expired/used link to confirm recovery. Avoid repeated email requests during a rate limit. Test LAN from a real phone after adding its actual redirect URLs. Verify a deployed HTTPS host separately.

References: https://supabase.com/docs/guides/auth/server-side/creating-a-client and https://supabase.com/docs/guides/auth/redirect-urls.


## Verification result — 8 October 2026

Production build, standalone TypeScript check, lint and 33 automated checks passed. The real browser verified protected member redirects, invalid-code recovery, and the visitor form remaining public. One magic-link request to the supplied email reached Supabase but returned the email rate limit. Real email delivery, successful provider exchange, signed-in browser persistence and sign-out remain unverified. LAN/mobile and a production domain were not live-tested. No auth settings or database policies were changed. The supplied account has a profile but no active Hull membership, so access will remain pending until the church team assigns it.


# Auth foundation and first-admin handoff — 8 October 2026

Project: `C:\Projects\rccg-fountain-of-prayer-hull`  
Supabase project: `tosnqfrcxfbkjkfdoqyk`

## Changes

- Assigned the existing account `aboladeanuoluwapo@gmail.com` an active `admin` membership in the existing Hull organisation through the Supabase SQL connector.
- Resolved and checked auth user/profile ID `89778640-cc3f-4d32-bb75-ebed216055b7` and organisation ID `6fdc1e56-af12-441b-a543-62545d5cfaf1` against the supplied email and organisation slug before writing.
- Membership ID: `28c5e81b-b812-45ab-ace2-d2f7a08285bd`. The guarded upsert was run twice: one membership remains, with identical creation/update timestamps. An already active admin row is left untouched.
- Added this verification record to `docs/auth-and-members.md` and saved the repeatable operation in `docs/first-admin.sql`.
- No application source, schema, RLS policy, auth setting, visitor flow, or check-in write was changed. Existing uncommitted project work was preserved.

## Verification

- Production build: passed (`npm run build`).
- Standalone TypeScript: passed (`node node_modules/typescript/bin/tsc --noEmit --incremental false`).
- Lint: passed (`npm run lint`).
- Both existing auth/member and session-lifecycle suites: all 33 tests passed.
- Live database queries under `SET LOCAL ROLE authenticated` with this user's claims read the profile, active admin membership, organisation and active Hull location. Confirmed RLS remains enabled on all six dashboard tables. The transaction rolled back its temporary role/claim settings; no session or access token was manufactured.
- Hull timezone is `Europe/London`; the database's local date at verification was `2026-10-08`. No matching live service exists for that date. The expected dashboard state is **No live service right now**. A separate RLS attendance query succeeded with zero rows for this account. No production service or attendance fixtures were inserted.
- These SQL checks verify database visibility for the dashboard's filters, not a successful signed-in browser/PostgREST request. Existing automated tests exercise the actual dashboard loader and its live-service/attendance states.
- Real browser: localhost `/member` redirects to `/login?next=%2Fmember`; invalid-code callback redirects to login with recovery text. LAN `/member` at `http://192.168.1.112:3000` preserves its origin and redirects to login.
- Exactly one fresh real magic-link request was made through the localhost login form. The provider still returned the email-rate-limit state. No repeated send attempt or bypass was used.
- Successful email delivery, callback exchange, signed-in dashboard rendering, reload persistence, sign-out and protection after that sign-out remain unverified live. LAN was exercised from the laptop browser, not a physical phone. Production HTTPS remains untested.

## Manual Supabase auth configuration still required to verify

The available connector exposes SQL and project tools but no auth-configuration reader. Current Site URL, redirect allowlist, email template and SMTP settings were not read or changed. Do not interpret the following as observed settings.

In **Authentication → URL Configuration** for the project:

1. Use `http://localhost:3000` as Site URL while local-only. When deployed, use the actual canonical HTTPS production origin instead. No production domain was supplied; do not enter a guessed domain or a literal placeholder.
2. Ensure these redirect entries are present (a backslash escapes the literal question mark in Supabase's glob syntax):

   ```text
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback\?next=**
   http://192.168.1.112:3000/auth/callback
   http://192.168.1.112:3000/auth/callback\?next=**
   ```

   The current login form requests `http://localhost:3000/auth/callback?next=%2Fmember`, or the identical path/query on the requesting LAN host. The narrowly scoped query pattern supports safe nested member return paths while keeping the host and callback path fixed.
3. For deployment, add the same two callback entries using the actual HTTPS production origin. Keep the production hostname exact, with no hostname wildcard. Retain local/LAN entries only while those environments are intentionally supported. Supabase's [redirect URL documentation](https://supabase.com/docs/guides/auth/redirect-urls) describes the Site URL fallback, allowlist and glob escaping.
4. Verify the magic-link email uses `{{ .ConfirmationURL }}` so Supabase verifies the email token before returning a PKCE code to `/auth/callback`. A template that goes straight to Site URL or a token-hash confirmation endpoint does not match this implementation. Leave the standard template intact when already correct; template customization may require custom SMTP on new Free projects.
5. Keep current rate limits and security controls. Wait for the limit to clear, then request one fresh link and open it in the same browser/device/host that requested it. If email delivery remains blocked, inspect the project's email delivery/SMTP configuration in Supabase rather than weakening controls.

For phone testing, request the link on the phone at the LAN URL and open it in that same phone browser. The laptop must be reachable on that address and port. No Next.js LAN-origin configuration change was required by the observed laptop-browser test; phone testing is still required.

## Next step

The first-admin assignment and dashboard read foundation are ready for the next check-in implementation. The production-auth foundation is **not yet verified end to end**: confirm the manual settings and complete one real login → callback → member → reload → sign-out → protected-route cycle first. Then implement member check-in as a separate scoped task, with server-side authentication, active membership, service scoping and duplicate protection. No check-in writes have been introduced.

