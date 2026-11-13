/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// Static regression guard for the department RLS recursion bug.
// The live behaviour is proven by supabase/tests/run-local.sh against a real
// PostgreSQL; this check runs everywhere (no database needed).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const sql = files.map((f) => ({ f, text: fs.readFileSync(path.join(dir, f), 'utf8').replace(/--.*$/gm, '') }));

// Final effective definition of each policy on a table = last "create policy" in migration order.
function finalPolicies(table) {
  const out = new Map();
  for (const { f, text } of sql) {
    const re = new RegExp(`create\\s+policy\\s+"?([a-z_]+)"?\\s+on\\s+public\\.${table}\\b([\\s\\S]*?);`, 'gi');
    for (const m of text.matchAll(re)) out.set(m[1], { file: f, body: m[2] });
    const drop = new RegExp(`drop\\s+policy\\s+if\\s+exists\\s+"?([a-z_]+)"?\\s+on\\s+public\\.${table}\\b`, 'gi');
    for (const m of text.matchAll(drop)) if (out.get(m[1])?.file !== f) out.delete(m[1]);
  }
  return out;
}

test('fix migration exists after the departments migration', () => {
  const fix = files.find((f) => /fix_department_leadership_rls_recursion/.test(f));
  assert.ok(fix, 'missing *_fix_department_leadership_rls_recursion.sql');
  assert.ok(fix > '20261110150000_add_departments.sql');
});

test('department_leadership policies never read department_memberships (no recursion cycle)', () => {
  const policies = finalPolicies('department_leadership');
  assert.ok(policies.has('leadership_select'));
  for (const [name, { body }] of policies) assert.doesNotMatch(body, /department_memberships/, `${name} reintroduces the cycle`);
});

test('leadership_select allows only org admins and the record owner', () => {
  const { body } = finalPolicies('department_leadership').get('leadership_select');
  assert.match(body, /is_org_admin\(organisation_id\)/);
  assert.match(body, /profile_id\s*=\s*(?:\(\s*select\s+)?auth\.uid\(\)(?:\s*\))?/i);
  assert.doesNotMatch(body, /\btrue\b/);
});

test('RLS stays enabled on every department table', () => {
  const all = sql.map((s) => s.text).join('\n');
  for (const t of ['church_departments', 'department_memberships', 'department_leadership', 'department_assignment_audit', 'department_events', 'department_event_rsvps']) {
    assert.match(all, new RegExp(`alter table public\\.${t} enable row level security`));
    assert.doesNotMatch(all, new RegExp(`alter table public\\.${t} disable row level security`));
  }
});

test('every security definer function pins search_path', () => {
  for (const { f, text } of sql) {
    for (const m of text.matchAll(/create\s+or\s+replace\s+function[\s\S]*?\$\$/gi)) {
      if (/security\s+definer/i.test(m[0])) assert.match(m[0], /set\s+search_path\s*=\s*public/i, `${f}: ${m[0].slice(0, 80)}`);
    }
  }
});

test('no global application roles are added', () => {
  const all = sql.map((s) => s.text).join('\n');
  assert.doesNotMatch(all, /alter\s+type\s+public\.app_role/i);
  assert.doesNotMatch(all, /choir_admin|department_admin|department_manager/i);
});

test('membership statistics functions are aggregate-only, access-checked and not callable by anon', () => {
  const file = sql.find((s) => /membership_statistics/.test(s.f));
  assert.ok(file, 'missing membership statistics migration');
  const t = file.text;
  assert.match(t, /church_membership_stats[\s\S]*security definer set search_path = public/);
  assert.match(t, /is_org_pastor_or_admin\(org\)/);
  assert.match(t, /raise exception 'Not authorised/);
  assert.match(t, /revoke all on function public\.church_membership_stats\(uuid\) from public, anon/);
  assert.doesNotMatch(t, /create table/i, 'no stored totals');
  for (const pii of ['email', 'full_name', 'first_name', 'phone']) assert.doesNotMatch(t, new RegExp(`\\b${pii}\\b`), `exposes ${pii}`);
});
