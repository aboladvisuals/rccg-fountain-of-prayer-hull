# Production: new sign-ups appear on /admin/users ("awaiting a role")

## What is wrong (plain English)

When someone signs up with the email magic link, Supabase creates their login and
the existing baseline trigger creates their `profiles` row, but **nothing creates
an organisation membership**. `/admin/users` lists memberships, so new people
never appear there and the admin cannot give them a role.

## Fix (one additive migration)

`supabase/migrations/20261113130000_signup_membership_records.sql`:

1. Adds `organisation_memberships.awaiting_role` (boolean, default `false`).
2. Adds an `after insert on public.profiles` trigger that creates a Hull church
   membership with the **lowest** role (`member`), status **`inactive`** and
   `awaiting_role = true`. Production's `membership_status` enum is only
   `active`/`inactive` (checked read-only on 13 Nov 2026), so no new status or role
   is added. An inactive membership grants nothing: every access helper, policy
   and page requires `status = 'active'`. A new sign-up can still only read their
   own profile and their own membership row, as before.
   The trigger never blocks a sign-up: on any error it logs a warning and the
   admin can link the person by hand.
3. Clears `awaiting_role` automatically the first time the role or status is
   changed (the admin can also "confirm as is" from `/admin/users`).
4. **Backfill:** gives every existing profile that has no Hull membership the same
   inactive, awaiting record. Existing memberships are never changed.
5. Replaces `church_membership_stats` so awaiting records are left out of the
   registered totals and reported as `awaiting_role_total`.

It creates or relaxes **no RLS policy**, adds **no grants**, adds **no roles**, and
is safe to run twice. Names are never invented: the admin page shows the
profile's existing name or email only.

The website tolerates the column being missing (it retries without
`awaiting_role`), so it is safe whether the code is deployed before or after the
SQL is run. The "awaiting a role" badge only appears once the SQL has run.

## Why the SQL Editor (not `supabase db push`)

Production's migration history does not match this repository (the baseline
`20261001000000` exists only on the original developer's laptop, and earlier
fixes were applied by hand in the SQL Editor). `supabase db push` could try to
re-run old files. Pasting this one file into the SQL Editor is the recommended
route.

## Steps for the owner (Supabase dashboard)

1. **Backup first.** Dashboard → Database → Backups: confirm a backup from today
   exists (or take one / enable PITR). With the CLI you can also run
   `supabase db dump --linked -f backup-before-signup-membership.sql`.
2. **Preview (read-only).** SQL Editor → run:

   ```sql
   -- How many existing profiles will be backfilled as "awaiting a role"?
   select count(*) as profiles_to_backfill
   from public.profiles p
   cross join public.organisations o
   where o.slug = 'rccg-fountain-of-prayer-hull' and o.is_active
     and not exists (select 1 from public.organisation_memberships om
                     where om.organisation_id = o.id and om.profile_id = p.id);

   -- And who they are (check nobody here was removed on purpose)
   select p.id, p.email, p.full_name, p.created_at
   from public.profiles p
   cross join public.organisations o
   where o.slug = 'rccg-fountain-of-prayer-hull' and o.is_active
     and not exists (select 1 from public.organisation_memberships om
                     where om.organisation_id = o.id and om.profile_id = p.id)
   order by p.created_at;
   ```

   If someone in that list should **not** appear on `/admin/users` (for example a
   membership you deleted on purpose), note their id. After step 3 you can delete
   their new awaiting row (see Rollback, part B).
3. **Apply.** Paste the whole of
   `supabase/migrations/20261113130000_signup_membership_records.sql` into the
   SQL Editor and run it.
4. **Verify.**

   ```sql
   select column_name, data_type, column_default
   from information_schema.columns
   where table_schema = 'public' and table_name = 'organisation_memberships'
     and column_name = 'awaiting_role';                      -- 1 row, boolean, false

   select tgname, tgrelid::regclass from pg_trigger
   where tgname in ('create_signup_membership', 'clear_awaiting_role');  -- 2 rows

   select count(*) as awaiting from public.organisation_memberships
   where awaiting_role;                                      -- = profiles_to_backfill from step 2

   select has_function_privilege('anon', 'public.create_signup_membership()', 'EXECUTE')        as anon_can_run_signup,
          has_function_privilege('authenticated', 'public.create_signup_membership()', 'EXECUTE') as users_can_run_signup,
          has_function_privilege('anon', 'public.church_membership_stats(uuid)', 'EXECUTE')       as anon_can_read_stats;
                                                             -- all false
   ```

   Then open `/admin/users` as the admin: new sign-ups are listed first with the
   badge **"New sign-up · awaiting a role"**. Choose a role and status and save.
5. **Record it** (only if you also use the CLI):
   `supabase migration repair --status applied 20261113130000`.

## Rollback

A. Undo the code objects (keeps everyone's memberships):

```sql
drop trigger if exists create_signup_membership on public.profiles;
drop trigger if exists clear_awaiting_role on public.organisation_memberships;
drop function if exists public.create_signup_membership();
drop function if exists public.clear_awaiting_role();
```

Then restore the previous statistics function: from
`supabase/migrations/20261113110000_membership_statistics.sql`, paste the
`create or replace function public.church_membership_stats(org uuid) ... $$;`
block plus its two lines
`revoke all on function public.church_membership_stats(uuid) from public, anon;` and
`grant execute on function public.church_membership_stats(uuid) to authenticated;`
into the SQL Editor and run them. Do this **before** dropping the column.

B. Optionally remove the records created for people the admin has not yet given
a role (only rows still awaiting; anyone the admin already assigned is kept):

```sql
delete from public.organisation_memberships where awaiting_role;
-- or one person only:
-- delete from public.organisation_memberships where awaiting_role and profile_id = '<id>';
```

C. Finally, drop the column (deploy the previous app version first, or keep the
current one, which tolerates the missing column):

```sql
alter table public.organisation_memberships drop column if exists awaiting_role;
```
