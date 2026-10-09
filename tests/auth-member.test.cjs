/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// Offline verification: exercises the production modules with isolated provider
// doubles. No HTTP routes, runtime flags, keys or login bypasses are introduced.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const redirects = load('src/lib/auth/redirects.ts');
for (const unsafe of ['https://evil.test', '//evil.test', '/\\evil.test', '/member/../../evil', '/member/%2e%2e/evil', '/memberish', '/login', '/member\r\nLocation:evil', '/member/%2f%2fevil']) {
  test(`reject unsafe redirect ${JSON.stringify(unsafe)}`, () => assert.equal(redirects.memberDestination(unsafe), '/member'));
}
test('retain safe member destination', () => assert.equal(redirects.memberDestination('/member/family?view=all'), '/member/family?view=all'));
for (const origin of ['http://localhost:3000', 'http://192.168.1.20:3000', 'https://church.example']) {
  test(`callback uses requesting origin ${origin}`, () => assert.equal(new URL(redirects.magicLinkCallback(origin, '/member')).origin, origin));
}
function callback(auth) { return load('src/app/auth/callback/route.ts', { '@/lib/supabase/server': { createClient: async () => ({ auth }) } }).GET; }
test('successful PKCE exchange redirects relatively', async () => {
  let exchanged;
  const response = await callback({ exchangeCodeForSession: async (code) => { exchanged = code; return { error: null }; } })(new Request('http://internal:3000/auth/callback?code=valid&next=/member/family'));
  assert.equal(exchanged, 'valid'); assert.equal(response.status, 303); assert.equal(response.headers.get('location'), '/member/family');
  assert.match(response.headers.get('cache-control'), /no-store/); assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
});
for (const scenario of ['missing', 'expired', 'exception', 'provider-error']) {
  test(`callback recovers from ${scenario}`, async () => {
    const auth = { exchangeCodeForSession: async () => { if (scenario === 'exception') throw new Error('network'); return { error: new Error('expired') }; } };
    const response = await callback(auth)(new Request(`http://localhost/auth/callback?${scenario === 'missing' ? '' : 'code=test'}${scenario === 'provider-error' ? '&error=access_denied' : ''}`));
    assert.match(response.headers.get('location'), /^\/login\?error=auth/);
  });
}
const dashboardModule = load('src/lib/member/dashboard.ts');
test('staff requires an active database role', () => {
  assert.equal(dashboardModule.hasStaffAccess({role:'admin',status:'active'}), true);
  assert.equal(dashboardModule.hasStaffAccess({role:'pastor',status:'inactive'}), false);
  assert.equal(dashboardModule.hasStaffAccess({role:'member',status:'active'}), false);
  assert.equal(dashboardModule.hasStaffAccess(null), false);
});
test('service date follows London daylight saving time', () => assert.equal(dashboardModule.localDate(new Date('2026-06-01T23:30:00Z'), 'Europe/London'), '2026-06-02'));
function database(overrides = {}) {
  const defaults = {
    profiles: { full_name: 'Test Member', first_name: 'Test', show_name_on_display: false, show_family_on_display: false },
    organisations: { id: 'org-hull', name: 'Hull church' },
    church_locations: { id: 'location-hull', name: 'Hull', timezone: 'Europe/London' },
    organisation_memberships: { role: 'member', status: 'active' },
    services: [{ id: 'service-today', title: 'Service', starts_at: null }],
    attendance: { checked_in_at: '2026-10-08T10:00:00Z', is_serving: true },
  };
  const calls = [];
  return { calls, from(table) {
    const filters = []; calls.push({ table, filters });
    const value = Object.hasOwn(overrides, table) ? overrides[table] : defaults[table];
    const result = value instanceof Error ? { data: null, error: value } : { data: value, error: null };
    const chain = { select: () => chain, eq: (key, value) => { filters.push([key,value]); return chain; }, order: () => chain, maybeSingle: async () => result, then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) };
    return chain;
  } };
}
test('dashboard reads only signed-in member within Hull service scope', async () => {
  const db = database(); const result = await dashboardModule.loadDashboard(db, 'user-a', new Date('2026-10-08T10:00:00Z'));
  assert.equal(result.services[0].attendance.is_serving, true);
  const filters = (table) => Object.fromEntries(db.calls.find(c => c.table === table).filters);
  assert.equal(filters('profiles').id, 'user-a'); assert.equal(filters('organisation_memberships').profile_id, 'user-a');
  assert.deepEqual(filters('attendance'), {organisation_id:'org-hull',service_id:'service-today',profile_id:'user-a'});
  assert.deepEqual(filters('services'), {organisation_id:'org-hull',location_id:'location-hull',status:'live',service_date:'2026-10-08'});
});
for (const membership of [null, {role:'admin',status:'inactive'}]) {
  test(`no attendance access for ${membership ? 'inactive' : 'missing'} membership`, async () => {
    const db = database({ organisation_memberships: membership }); const result = await dashboardModule.loadDashboard(db, 'user-a');
    assert.equal(result.presenceAvailable, false); assert.equal(db.calls.some(c => c.table === 'attendance'), false);
  });
}
test('absent attendance is not checked in', async () => {
  const result = await dashboardModule.loadDashboard(database({attendance:null}), 'user-a');
  assert.equal(result.services[0].attendance, null); assert.equal(result.services[0].unavailable, false);
});
test('attendance failure is unavailable rather than absent', async () => {
  const result = await dashboardModule.loadDashboard(database({attendance:new Error('denied')}), 'user-a');
  assert.equal(result.services[0].unavailable, true);
});
test('service failure differs from no live service', async () => {
  assert.equal((await dashboardModule.loadDashboard(database({services:new Error('offline')}), 'user-a')).presenceAvailable, false);
  assert.equal((await dashboardModule.loadDashboard(database({services:[]}), 'user-a')).presenceAvailable, true);
});
test('membership query failure fails closed', async () => {
  const result = await dashboardModule.loadDashboard(database({organisation_memberships:new Error('denied')}), 'user-a');
  assert.equal(result.membership, null); assert.equal(result.presenceAvailable, false); assert.match(result.issues.join(), /membership/);
});
const { NextRequest } = require('next/server');
function proxy(claims, error = null) {
  return load('src/lib/supabase/proxy.ts', { '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: { getClaims: async () => {
    options.cookies.setAll([{name:'test-session',value:'refreshed',options:{path:'/'}}], {'Cache-Control':'private, no-store'});
    return {data: claims ? {claims} : null, error};
  } } }) } }).updateSession;
}
test('proxy refresh keeps cookies and private cache headers', async () => {
  const request = new NextRequest('http://localhost/member'); const response = await proxy({sub:'user-a'})(request);
  assert.equal(response.status, 200); assert.equal(response.cookies.get('test-session').value, 'refreshed');
  assert.equal(request.cookies.get('test-session').value, 'refreshed'); assert.match(response.headers.get('cache-control'), /no-store/);
});
test('protected nested routes redirect with refreshed cookies', async () => {
  const response = await proxy(null)(new NextRequest('http://localhost/member/family'));
  assert.equal(response.status,307); assert.equal(new URL(response.headers.get('location')).pathname + new URL(response.headers.get('location')).search,'/login?next=%2Fmember%2Ffamily'); assert.ok(response.cookies.get('test-session'));
});
test('public visitor route stays public', async () => assert.equal((await proxy(null)(new NextRequest('http://localhost/visit'))).status,200));
test('sign-out invalidates layout and redirects after provider success', async () => {
  let scope, invalidated;
  const action = load('src/app/member/actions.ts', {
    '@/lib/supabase/server': {createClient:async()=>({auth:{signOut:async(options)=>{scope=options.scope;return {error:null};}}})},
    'next/cache': {revalidatePath:(...args)=>{invalidated=args;}},
    'next/navigation': {redirect:(url)=>{throw new Error(`REDIRECT:${url}`);}},
  }).signOut;
  await assert.rejects(action(), /REDIRECT:\/login\?signedOut=1/); assert.equal(scope,'local'); assert.deepEqual(invalidated,['/','layout']);
});
test('sign-out failure remains visible without redirect', async () => {
  const action = load('src/app/member/actions.ts', {
    '@/lib/supabase/server': {createClient:async()=>({auth:{signOut:async()=>({error:new Error('offline')})}})},
    'next/cache': {revalidatePath:()=>assert.fail('must not revalidate')}, 'next/navigation': {redirect:()=>assert.fail('must not redirect')},
  }).signOut;
  assert.match((await action()).error, /couldn’t sign you out/);
});


