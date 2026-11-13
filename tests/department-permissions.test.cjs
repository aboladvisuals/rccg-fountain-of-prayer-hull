/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// Department permission rules and server-action authorisation with isolated
// provider doubles (fictional IDs). The database enforces the same rules; see
// supabase/tests/20_department_rls.test.sql for the live PostgreSQL suite.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  const req = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(req, mod, mod.exports);
  return mod.exports;
}
const perm = load('src/lib/departments/permissions.ts');

const LEADER = '00000000-0000-4000-a000-0000000000b1';
const MEMBER = '00000000-0000-4000-a000-0000000000d1';
const OTHER = '00000000-0000-4000-a000-0000000000e1';
const DEPT = '00000000-0000-4000-c000-000000000001';
const ORG = '00000000-0000-4000-b000-000000000001';
const EVENT = '00000000-0000-4000-d000-000000000001';

test('abilities: leader vs deputy vs member vs child-facing', () => {
  assert.deepEqual(perm.departmentAbilities({ leadershipRole: 'leader', isActiveMember: true, isChildFacing: false }), { viewRoster: true, manageMembers: true, manageEvents: true, viewRsvps: true });
  assert.deepEqual(perm.departmentAbilities({ leadershipRole: 'deputy', isActiveMember: true, isChildFacing: false }), { viewRoster: true, manageMembers: false, manageEvents: true, viewRsvps: true });
  assert.deepEqual(perm.departmentAbilities({ leadershipRole: null, isActiveMember: true, isChildFacing: false }), { viewRoster: false, manageMembers: false, manageEvents: false, viewRsvps: false });
  assert.equal(perm.departmentAbilities({ leadershipRole: 'leader', isActiveMember: true, isChildFacing: true }).manageMembers, false);
  assert.equal(perm.departmentAbilities({ leadershipRole: 'leader', isActiveMember: true, isChildFacing: true }).viewRoster, false);
  assert.equal(perm.departmentAbilities({ leadershipRole: 'leader', isActiveMember: false, isChildFacing: false }).manageEvents, false);
});

test('membership transitions mirror the database guard', () => {
  const s = (status, origin, holdsLeadership = false) => ({ status, origin, holdsLeadership });
  assert.deepEqual(perm.nextMembershipState('self', s('pending', 'leader_invite'), 'accept'), { status: 'active', origin: 'leader_invite' });
  assert.equal(perm.nextMembershipState('self', s('pending', 'member_request'), 'accept'), null, 'cannot approve own request');
  assert.equal(perm.nextMembershipState('self', s('active', 'admin', true), 'leave'), null, 'leaders step down via admin');
  assert.deepEqual(perm.nextMembershipState('leader', s('pending', 'member_request'), 'approve'), { status: 'active', origin: 'member_request' });
  assert.equal(perm.nextMembershipState('leader', s('active', 'admin', true), 'deactivate'), null, 'leader cannot remove a deputy');
  assert.equal(perm.nextMembershipState('leader', s('pending', 'leader_invite'), 'approve'), null, 'leader cannot accept on someone\'s behalf');
  assert.deepEqual(perm.nextMembershipState('leader', s('inactive', 'admin'), 'reinvite'), { status: 'pending', origin: 'leader_invite' });
});

test('next activity skips cancelled and finished events', () => {
  const now = new Date('2026-11-13T12:00:00Z');
  const ev = (id, start, end, status = 'scheduled') => ({ id, starts_at: start, ends_at: end, status });
  const list = [ev('c', '2026-11-14T18:00:00Z', '2026-11-14T20:00:00Z', 'cancelled'), ev('b', '2026-11-20T18:00:00Z', '2026-11-20T20:00:00Z'), ev('a', '2026-11-13T11:00:00Z', '2026-11-13T11:30:00Z'), ev('d', '2026-11-13T11:30:00Z', '2026-11-13T13:00:00Z', 'rescheduled')];
  assert.equal(perm.nextActivity(list, now).id, 'd');
  assert.equal(perm.nextActivity([list[0], list[2]], now), null);
  assert.deepEqual(perm.rsvpCounts([{ status: 'yes' }, { status: 'yes' }, { status: 'no' }, { status: 'bogus' }]), { yes: 2, maybe: 0, no: 1 });
});

test('uuid validation', () => {
  assert.equal(perm.isUuid(DEPT), true);
  assert.equal(perm.isUuid("x' or 1=1"), false);
  assert.equal(perm.isUuid(undefined), false);
});

// ---- server actions with a programmable Supabase double ----
function fakeSupabase(handler) {
  const calls = [];
  const from = (table) => {
    const q = { table, op: 'select', filters: {}, payload: null };
    const run = () => { calls.push(q); return Promise.resolve(handler(q)); };
    const b = {
      select() { return b; }, eq(k, v) { q.filters[k] = v; return b; }, neq() { return b; }, in() { return b; }, gte() { return b; }, order() { return b; }, limit() { return b; },
      insert(p) { q.op = 'insert'; q.payload = p; return b; }, update(p) { q.op = 'update'; q.payload = p; return b; }, upsert(p) { q.op = 'upsert'; q.payload = p; return b; },
      maybeSingle: run, single: run, then(res, rej) { return run().then(res, rej); },
    };
    return b;
  };
  return { from, rpc: async () => ({ data: [] }), calls };
}
function actionsFor(userId, handler) {
  const supabase = fakeSupabase(handler);
  const actions = load('src/app/member/departments/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    '@/lib/member/session': { requireMemberSession: async () => ({ supabase, user: { id: userId } }) },
  });
  return { actions, supabase };
}
const fd = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };

test('inviteMember: refused for someone who is not the active leader', async () => {
  const { actions, supabase } = actionsFor(MEMBER, (q) => (q.table === 'department_leadership' ? { data: [] } : { data: null }));
  const res = await actions.inviteMember(fd({ departmentId: DEPT, profileId: OTHER }));
  assert.equal(res.ok, false);
  assert.match(res.message, /Only the department leader/);
  assert.equal(supabase.calls.some((c) => c.op !== 'select'), false, 'no write attempted');
});

test('inviteMember: deputies cannot invite', async () => {
  const { actions } = actionsFor(LEADER, (q) => (q.table === 'department_leadership' ? { data: [{ role: 'deputy' }] } : { data: null }));
  assert.equal((await actions.inviteMember(fd({ departmentId: DEPT, profileId: OTHER }))).ok, false);
});

test('inviteMember: leader creates a pending leader_invite only', async () => {
  const { actions, supabase } = actionsFor(LEADER, (q) => {
    if (q.table === 'department_leadership') return { data: [{ role: 'leader' }] };
    if (q.table === 'church_departments') return { data: { organisation_id: ORG, is_child_facing: false } };
    if (q.table === 'department_memberships' && q.op === 'select') return { data: null };
    return { error: null };
  });
  const res = await actions.inviteMember(fd({ departmentId: DEPT, profileId: OTHER }));
  assert.equal(res.ok, true);
  const write = supabase.calls.find((c) => c.op === 'insert');
  assert.deepEqual(write.payload, { organisation_id: ORG, department_id: DEPT, profile_id: OTHER, status: 'pending', origin: 'leader_invite' });
});

test('inviteMember: never into child-facing departments, never yourself', async () => {
  const { actions } = actionsFor(LEADER, (q) => (q.table === 'department_leadership' ? { data: [{ role: 'leader' }] } : q.table === 'church_departments' ? { data: { organisation_id: ORG, is_child_facing: true } } : { data: null }));
  assert.match((await actions.inviteMember(fd({ departmentId: DEPT, profileId: OTHER }))).message, /Child-facing/);
  assert.match((await actions.inviteMember(fd({ departmentId: DEPT, profileId: LEADER }))).message, /yourself/);
});

test('setRsvp: always writes the signed-in user, never a submitted profile', async () => {
  const { actions, supabase } = actionsFor(MEMBER, (q) => (q.table === 'department_events' ? { data: { id: EVENT, organisation_id: ORG, department_id: DEPT } } : { error: null }));
  const form = fd({ eventId: EVENT, status: 'yes', profileId: OTHER });
  assert.equal((await actions.setRsvp(form)).ok, true);
  assert.equal(supabase.calls.find((c) => c.op === 'upsert').payload.profile_id, MEMBER);
  assert.equal((await actions.setRsvp(fd({ eventId: EVENT, status: 'definitely' }))).ok, false);
});

test('createDepartmentEvent: members without leadership are refused; times stored as UTC from London input', async () => {
  const refused = actionsFor(MEMBER, (q) => (q.table === 'department_leadership' ? { data: [] } : { data: null }));
  assert.equal((await refused.actions.createDepartmentEvent(fd({ departmentId: DEPT, title: 'Rehearsal', date: '2027-07-01', startTime: '19:00', endTime: '21:00' }))).ok, false);
  const ok = actionsFor(LEADER, (q) => (q.table === 'department_leadership' ? { data: [{ role: 'deputy' }] } : q.table === 'church_departments' ? { data: { organisation_id: ORG } } : { error: null }));
  assert.equal((await ok.actions.createDepartmentEvent(fd({ departmentId: DEPT, title: 'Fictional rehearsal', date: '2027-07-01', startTime: '19:00', endTime: '21:00' }))).ok, true);
  const insert = ok.supabase.calls.find((c) => c.op === 'insert').payload;
  assert.equal(insert.starts_at, '2027-07-01T18:00:00.000Z'); // BST
  assert.equal(insert.ends_at, '2027-07-01T20:00:00.000Z');
  assert.equal('created_by' in insert, false, 'creator is stamped by the database');
  assert.match((await ok.actions.createDepartmentEvent(fd({ departmentId: DEPT, title: 'x', date: '2027-07-01', startTime: '21:00', endTime: '19:00' }))).message, /after the start/);
});

test('respondToMembership: leaders cannot leave via self-service', async () => {
  const { actions } = actionsFor(LEADER, (q) => (q.table === 'department_memberships' ? { data: { id: EVENT, department_id: DEPT, status: 'active', origin: 'admin' } } : q.table === 'department_leadership' ? { data: [{ role: 'leader' }] } : { error: null }));
  assert.match((await actions.respondToMembership(fd({ membershipId: EVENT, decision: 'leave' }))).message, /administrator/);
});
