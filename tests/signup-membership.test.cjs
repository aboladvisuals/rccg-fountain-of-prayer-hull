/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// New sign-ups awaiting a role, media dashboard link and activity wording.
// Exercises the production modules with isolated provider doubles; the database
// behaviour itself is covered by supabase/tests/50_signup_membership.test.sql.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
function load(relative, mocks = {}) {
  const code = ts.transpileModule(read(relative), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  return mod.exports;
}

// A query-builder double. `answers[table]` is a value, an Error-like object, or
// an array of those consumed one per query (to model a retry).
function database(answers) {
  const calls = [];
  return { calls, from(table) {
    const call = { table, columns: null, filters: [], update: null }; calls.push(call);
    const queue = answers[table];
    const value = Array.isArray(queue) && queue.__sequence ? queue.shift() : queue;
    const result = value && value.code ? { data: null, error: value } : { data: value ?? null, error: null };
    const chain = {
      select: (columns) => { call.columns = columns; return chain; },
      update: (payload) => { call.update = payload; return chain; },
      eq: (k, v) => { call.filters.push([k, v]); return chain; },
      order: () => chain,
      maybeSingle: async () => result,
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return chain;
  } };
}
const seq = (...items) => Object.assign(items, { __sequence: true });

const dashboard = load('src/lib/member/dashboard.ts');
const base = {
  profiles: { full_name: null, first_name: null, show_name_on_display: false, show_family_on_display: false },
  organisations: { id: 'org-hull', name: 'Hull church' },
  church_locations: { id: 'location-hull', name: 'Hull', timezone: 'Europe/London' },
  services: [{ id: 'service-today', title: 'Service', starts_at: null }],
  attendance: null,
};

test('a new sign-up is recognised as awaiting a role and gets no presence access', async () => {
  const db = database({ ...base, organisation_memberships: { role: 'member', status: 'inactive', awaiting_role: true } });
  const result = await dashboard.loadDashboard(db, 'user-new');
  assert.equal(dashboard.isAwaitingRole(result.membership), true);
  assert.equal(result.presenceAvailable, false);
  assert.equal(db.calls.some((c) => c.table === 'attendance' || c.table === 'services'), false);
  assert.match(db.calls.find((c) => c.table === 'organisation_memberships').columns, /awaiting_role/);
});

test('awaiting a role only applies to records that are not active', () => {
  assert.equal(dashboard.isAwaitingRole({ role: 'member', status: 'active', awaiting_role: true }), false);
  assert.equal(dashboard.isAwaitingRole({ role: 'member', status: 'inactive', awaiting_role: false }), false);
  assert.equal(dashboard.isAwaitingRole({ role: 'member', status: 'inactive' }), false);
  assert.equal(dashboard.isAwaitingRole(null), false);
});

test('dashboard still works before the migration adds the column (42703 retry)', async () => {
  const db = database({ ...base, organisation_memberships: seq({ code: '42703', message: 'column organisation_memberships.awaiting_role does not exist' }, { role: 'member', status: 'active' }) });
  const result = await dashboard.loadDashboard(db, 'user-a', new Date('2026-10-08T10:00:00Z'));
  assert.deepEqual(result.issues, []);
  assert.equal(result.membership.status, 'active');
  const reads = db.calls.filter((c) => c.table === 'organisation_memberships');
  assert.equal(reads.length, 2);
  assert.equal(reads[1].columns, 'role, status');
});

test('other membership errors still fail closed without a retry', async () => {
  const db = database({ ...base, organisation_memberships: seq({ code: '42501', message: 'denied' }) });
  const result = await dashboard.loadDashboard(db, 'user-a');
  assert.equal(result.membership, null);
  assert.match(result.issues.join(), /membership/);
  assert.equal(db.calls.filter((c) => c.table === 'organisation_memberships').length, 1);
});

test('media access matches the existing /media rule: active media, pastor or admin', () => {
  for (const role of ['media', 'pastor', 'admin']) assert.equal(dashboard.hasMediaAccess({ role, status: 'active' }), true, role);
  assert.equal(dashboard.hasMediaAccess({ role: 'member', status: 'active' }), false);
  assert.equal(dashboard.hasMediaAccess({ role: 'media', status: 'inactive' }), false);
  assert.equal(dashboard.hasMediaAccess(null), false);
});

function mediaSession(membership) {
  const redirect = (to) => { const e = new Error('redirect'); e.to = to; throw e; };
  const db = database({ organisations: { id: 'org-hull', name: 'Hull church' }, organisation_memberships: membership });
  return load('src/lib/media/session.ts', {
    'next/navigation': { redirect },
    '@/lib/member/session': { requireMemberSession: async () => ({ supabase: db, user: { id: 'user-a' } }) },
  }).requireMediaSession;
}
test('requireMediaSession uses the shared rule and still refuses members and inactive staff', async () => {
  assert.equal((await mediaSession({ role: 'media', status: 'active' })()).role, 'media');
  for (const membership of [{ role: 'member', status: 'active' }, { role: 'media', status: 'inactive' }, null]) {
    await assert.rejects(mediaSession(membership)(), (e) => e.to === '/member');
  }
  assert.match(read('src/lib/media/session.ts'), /hasMediaAccess\(membership\)/);
});

test('member dashboard links media-only users to /media and explains the pending role', () => {
  const page = read('src/app/member/page.tsx');
  assert.match(page, /hasMediaAccess\(membership\) && !hasStaffAccess\(membership\)/);
  assert.match(page, /href="\/media"/);
  assert.match(page, /Open Media dashboard/);
  assert.match(page, /The church admin can see your sign-up and will assign your role/);
  assert.match(page, /department leaders can add you to your departments/);
});

function adminAction(membershipRow) {
  const db = database({ organisation_memberships: seq(membershipRow, null) });
  const mod = load('src/app/admin/users/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    '@/lib/admin/session': { requireAdminSession: async () => ({ supabase: db, organisation: { id: 'org-hull' } }) },
  });
  return { db, update: mod.updateMembershipAccess };
}
const form = (fields) => { const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.set(k, v); return f; };

test('admin can confirm a new sign-up as it is, which clears the awaiting flag', async () => {
  const { db, update } = adminAction({ id: 'm1', organisation_id: 'org-hull', role: 'member', status: 'inactive' });
  const result = await update(form({ membershipId: 'm1', role: 'member', status: 'inactive', confirmAwaiting: 'true' }));
  assert.equal(result.ok, true);
  assert.deepEqual(db.calls.find((c) => c.update).update, { role: 'member', status: 'inactive', awaiting_role: false });
});

test('ordinary unchanged saves are still a no-op and never send awaiting_role', async () => {
  const { db, update } = adminAction({ id: 'm1', organisation_id: 'org-hull', role: 'member', status: 'active' });
  const result = await update(form({ membershipId: 'm1', role: 'member', status: 'active' }));
  assert.equal(result.message, 'No changes were needed.');
  assert.equal(db.calls.some((c) => c.update), false);
  const again = adminAction({ id: 'm1', organisation_id: 'org-hull', role: 'member', status: 'inactive' });
  await again.update(form({ membershipId: 'm1', role: 'pastor', status: 'active' }));
  assert.deepEqual(again.db.calls.find((c) => c.update).update, { role: 'pastor', status: 'active' });
});

test('/admin/users lists new sign-ups first, labels them and can filter to them', () => {
  const page = read('src/app/admin/users/page.tsx');
  assert.match(page, /New sign-up · awaiting a role/);
  assert.match(page, /\/admin\/users\?show=awaiting/);
  assert.match(page, /isMissingColumnError\(result\.error\)/);
});

test('activity wording uses the right article', () => {
  const workspace = read('src/app/member/departments/workspace.tsx');
  assert.doesNotMatch(workspace, /Schedule a \{activityWord\}/);
  assert.match(workspace, /activityWord === "activity" \? "an" : "a"/);
});

test('migration is additive and least-privilege', () => {
  const sql = read('supabase/migrations/20261113130000_signup_membership_records.sql').replace(/--.*$/gm, '');
  assert.match(sql, /security definer\s+set search_path = public/i);
  assert.match(sql, /'member'::public\.app_role, 'inactive'::public\.membership_status, true/);
  assert.match(sql, /on conflict \(organisation_id, profile_id\) do nothing/);
  assert.doesNotMatch(sql, /create policy|drop policy|alter policy|disable row level security/i);
  assert.doesNotMatch(sql, /grant [^;]* to (anon|public)\b/i);
  assert.doesNotMatch(sql, /'admin'::|'pastor'::|'media'::|'active'::/);
});
