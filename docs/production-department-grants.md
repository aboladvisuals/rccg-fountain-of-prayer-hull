# Production fix: department pages fail with "permission denied" (42501)

## What is wrong (plain English)

Supabase changed a platform default on **30 October 2026**: tables created after
that date are no longer automatically readable by signed-in users through the
website's database API. The department tables (`church_departments`,
`department_memberships`, `department_leadership`, `department_events`,
`department_event_rsvps`, `department_assignment_audit`, plus the two personal
bookmark tables) were created in production after that date by
`20261110150000_add_departments.sql`, which (like every older migration) relied
on the old automatic grants. So every department query from a signed-in user
returns `42501 permission denied for table ...`.

`/admin/departments` throws on that error, so Next.js shows a server error
digest. Member pages silently show no departments, the choir page wrongly says
"You need an active Choir and Worship assignment", and calendar shows no
department events.

The four department migrations themselves **are already applied in production**
(their tables, columns and functions exist). Do **not** re-run them. Only the new
grant migration is needed.

## Fix (one additive migration)

`supabase/migrations/20261113120000_grant_department_data_api_access.sql` grants
`authenticated` exactly what the app uses (RLS still decides which rows), grants
`service_role`, revokes everything from `anon`, and reloads the API schema cache.
It changes no data, no policies and no roles, and is safe to run twice.

## Steps for the owner (Supabase dashboard, simplest)

1. **Backup check.** Dashboard → Database → Backups: confirm a backup from today exists (or enable PITR).
2. **Pre-check (read-only).** SQL editor → run:

   ```sql
   select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type) as privileges
   from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name in ('church_departments','department_memberships','department_leadership','department_events',
                        'department_event_rsvps','department_assignment_audit','member_scripture_bookmarks','member_hymn_favourites')
     and grantee in ('anon','authenticated','service_role')
   group by 1, 2 order by 1, 2;

   select version, name from supabase_migrations.schema_migrations order by version desc limit 10;
   ```

   Expected today: no `authenticated` rows (that is the bug). Note which department migration versions are listed.
3. **Apply.** Paste the whole of `20261113120000_grant_department_data_api_access.sql` into the SQL editor and run it.
4. **Verify.** Re-run the first query from step 2: `authenticated` should now have `INSERT,SELECT,UPDATE`
   (plus `DELETE` on RSVPs/bookmarks/favourites, `SELECT` only on the audit table), `service_role` should be listed,
   and `anon` should not appear. Reload `/admin/departments` while signed in as an admin.
5. **Record it** (only if you also use the CLI): `supabase migration repair --status applied 20261113120000`.

## Alternative: Supabase CLI

```bash
supabase link --project-ref tosnqfrcxfbkjkfdoqyk
supabase migration list            # compare Local vs Remote columns first
# If 20261110150000, 20261113040220, 20261113100000 or 20261113110000 show as NOT applied on Remote
# (e.g. they were run in the SQL editor), mark them applied - do NOT let db push re-run them:
#   supabase migration repair --status applied 20261110150000 20261113040220 20261113100000 20261113110000
supabase db push --dry-run         # must list ONLY 20261113120000_grant_department_data_api_access.sql
supabase db push
```

If the dry run lists anything other than `20261113120000`, stop and check before pushing.

## Rollback

The migration only adds privileges. To undo it (this re-breaks the department pages):

```sql
revoke select, insert, update, delete on table public.church_departments, public.department_memberships,
  public.department_leadership, public.department_events, public.department_event_rsvps,
  public.department_assignment_audit, public.member_scripture_bookmarks, public.member_hymn_favourites
from authenticated;
notify pgrst, 'reload schema';
```

## Going forward

Every new `public` table migration must include explicit `grant ... to authenticated` (and RLS + policies).
The local test lab (`supabase/tests/00_...`) now emulates the new Supabase default, and
`supabase/tests/40_data_api_grants.test.sql` fails if a department table is missing its grants.
