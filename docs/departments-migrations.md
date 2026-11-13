# Departments: migrations, testing and rollback

Staging / isolated local lab only. **Do not apply to production project
`tosnqfrcxfbkjkfdoqyk` without the owner's explicit approval.** Never run
`supabase db push` or `supabase link` against an unidentified project.

## Migration order

| Order | File | Purpose |
| --- | --- | --- |
| 0 | `20261001000000` recovered baseline | **Not in this repository.** Exists only in the owner's local lab (`C:\Projects\rccg-db-lab`). |
| … | `20261011235500` … `20261013110719` | Existing role/audit/media migrations (unchanged). |
| 1 | `20261110150000_add_departments.sql` | Departments foundation (unchanged). Contains the recursive `leadership_select` policy. |
| 2 | `20261113090000_fix_department_leadership_rls_recursion.sql` | **Permanent RLS recursion fix.** |
| 3 | `20261113100000_department_ministry_workspace.sql` | P1: leader-managed membership, join requests, invitations, audit triggers, event/RSVP hardening. |

Migrations 2 and 3 must always be applied together with or after 1. They are
idempotent (safe to re-run).

### The owner's local fix migration

The owner reported a locally saved migration named
`fix_department_leadership_rls_recursion`. It was **not found on any GitHub
branch** on 13 Nov 2026, so `20261113090000_fix_department_leadership_rls_recursion.sql`
was written from the owner's description. Before applying either to staging:

1. Compare the owner's local file with this one (`git diff --no-index`).
2. Keep only **one** of them in `supabase/migrations`. If the owner's local
   file is already recorded in the lab's `supabase_migrations.schema_migrations`
   table under a different version, either keep that version and delete this
   file, or mark this one as applied. Do not apply two different versions of
   the same policy change.

## The recursion bug

`department_memberships.memberships_select` reads `department_leadership`;
the original `department_leadership.leadership_select` read
`department_memberships`. Postgres evaluates both policies and fails with
`infinite recursion detected in policy for relation "department_memberships"`,
which is why member assignment failed. The fixed `leadership_select` allows:

* organisation administrators (`public.is_org_admin(organisation_id)`), and
* a person reading their **own** leadership record (`profile_id = auth.uid()`).

It reads no other department table, so the cycle cannot form. This is
narrower than before: ordinary members no longer see who else holds
leadership. Leaders/deputies see roster names through
`public.department_roster()` (names only, never child-facing departments).

## Permission model after migration 3

* **Admin** – everything (existing policies) including appointing/removing
  leaders and deputies, enabling join requests, and reading the audit trail.
* **Leader** (`department_leadership.role = 'leader'`, active) – own
  department only, never child-facing: invite existing active church members,
  approve/decline join requests, deactivate ordinary members, withdraw
  invitations, manage events. Cannot change anyone holding leadership, their
  own row, leadership records or global roles.
* **Deputy** – manage events and view RSVPs/roster names (existing
  `events_write` behaviour). No membership management.
* **Member** – accept/decline own invitations, request to join where the admin
  enabled it (never child-facing), leave (unless holding leadership), RSVP for
  themselves on non-cancelled, unfinished events.
* Every membership/leadership change is written to
  `department_assignment_audit` with `changed_by = auth.uid()`.

## Testing

Static guard (no database): `node --test tests/*.test.cjs`.

Live RLS suite (throwaway local PostgreSQL only):

```bash
PGHOST=/tmp PGPORT=54329 PGUSER=postgres supabase/tests/run-local.sh
```

It loads `supabase/tests/00_test_only_supabase_shim_and_stub_baseline.sql`
(a **stub** of the unrecovered baseline: Supabase `auth.uid()`, roles, and
the minimal tables/helpers the migrations reference), replays every migration
in order, seeds fictional users and runs `20_department_rls.test.sql` as admin,
leader, deputy, member, invited member, non-member, another organisation's
admin and anon. Because the baseline is stubbed, **repeat the replay in the
owner's lab with the real recovered baseline** before staging.

To run the same suite in the owner's lab after the real baseline: skip file
`00_…` (the lab already has Supabase's auth/roles), apply migrations, then run
`10_fictional_seed.sql` and `20_department_rls.test.sql` in a scratch database
only (the seed inserts fictional rows).

## Rollback

Run in a transaction on staging only.

Migration 3 (`20261113100000`):

```sql
begin;
drop trigger if exists guard_department_membership_update on public.department_memberships;
drop trigger if exists end_leadership_with_membership on public.department_memberships;
drop trigger if exists audit_department_membership on public.department_memberships;
drop trigger if exists audit_department_leadership on public.department_leadership;
drop trigger if exists stamp_department_event on public.department_events;
drop trigger if exists enforce_org_match on public.department_memberships;
drop trigger if exists enforce_org_match on public.department_leadership;
drop trigger if exists enforce_org_match on public.department_events;
drop trigger if exists enforce_org_match on public.department_event_rsvps;
drop policy if exists memberships_leader_invite on public.department_memberships;
drop policy if exists memberships_member_request on public.department_memberships;
drop policy if exists memberships_leader_update on public.department_memberships;
drop policy if exists memberships_member_update on public.department_memberships;
drop function if exists public.guard_department_membership_update();
drop function if exists public.end_leadership_with_membership();
drop function if exists public.audit_department_change();
drop function if exists public.stamp_department_event();
drop function if exists public.enforce_department_org_match();
drop function if exists public.department_roster(uuid);
drop function if exists public.department_invite_candidates(uuid);
drop function if exists public.is_active_org_member(uuid, uuid);
-- Optional (drops data): columns added by migration 3
-- alter table public.department_memberships drop column origin, drop column updated_at;
-- alter table public.church_departments drop column allow_join_requests;
-- alter table public.department_events drop column created_by, drop column updated_at;
-- alter table public.department_event_rsvps drop column updated_at;
-- assert_department_leader_membership / assert_rsvp_membership: re-run their
-- definitions from 20261110150000 to restore the original bodies.
commit;
```

Migration 2 (`20261113090000`): there is no safe standalone rollback, because
restoring the old policy reintroduces the infinite recursion. Roll back only
together with the whole Departments feature (drop the department tables
created in `20261110150000`), or replace the policy with an even stricter one
(`using (public.is_org_admin(organisation_id))`).

## Membership statistics (`20261113110000_membership_statistics.sql`)

Additive, read-only, aggregate-only. Rollback:
`drop function if exists public.church_membership_stats(uuid); drop function if exists public.department_membership_stats(uuid);`

* Registered members: `organisation_memberships` rows (unique per person). Visitors excluded.
* Active/inactive: `organisation_memberships.status`.
* Family members: `family_members` count, reported separately (not added to the registered total).
* Men/women, children/adults: **not recorded** — the schema has no sex/gender, full date of birth
  (only `birth_month`/`birth_day`) or child flag. Nothing is inferred from names or relationships.
* Department totals: distinct people with an active department membership (overlapping).
* Access: org admin/pastor; active leader/deputy of `ushering-and-hospitality` (aggregates only);
  department totals for that department's own leader/deputy.

### Deferred minimum schema change (needs owner consent decision)
`alter table public.profiles add column sex text check (sex in ('male','female')), add column date_of_birth date;`
and the same two optional columns on `public.family_members`, both nullable, collected only with
consent and editable by the member/guardian. Children = age under 18 on the current Europe/London
date; missing values stay "Unspecified"/"Age unknown".
