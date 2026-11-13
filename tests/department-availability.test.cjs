/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// Department pages must degrade gracefully (never throw an error digest) when
// the department tables are missing or not granted to the Data API.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, mod, mod.exports);
  return mod.exports;
}
const a = load('src/lib/departments/availability.ts');

test('production 42501 (missing GRANT) is treated as "being set up"', () => {
  const prod = { code: '42501', message: 'permission denied for table church_departments' };
  assert.equal(a.isDepartmentSetupError(prod), true);
  assert.equal(a.departmentsAvailability(prod), 'setup');
  assert.match(a.departmentsMessage('setup'), /being set up/);
});

test('missing table / function / column codes are setup errors', () => {
  for (const code of ['PGRST205', 'PGRST202', '42P01', '42883', '42703']) {
    assert.equal(a.departmentsAvailability({ code }), 'setup', code);
  }
});

test('no error is ok; other errors get a retry message, never a crash', () => {
  assert.equal(a.departmentsAvailability(null), 'ok');
  assert.equal(a.departmentsAvailability(undefined), 'ok');
  assert.equal(a.departmentsMessage('ok'), null);
  assert.equal(a.departmentsAvailability({ code: '57014', message: 'timeout' }), 'error');
  assert.match(a.departmentsMessage('error'), /refresh/);
});

test('admin departments pages and choir page no longer throw on query errors', () => {
  const list = fs.readFileSync(path.join(root, 'src/app/admin/departments/page.tsx'), 'utf8');
  assert.doesNotMatch(list, /throw new Error\(/);
  assert.match(list, /departmentsAvailability\(error\)/);
  assert.match(list, /<DepartmentsNotice/);
  const detail = fs.readFileSync(path.join(root, 'src/app/admin/departments/[id]/page.tsx'), 'utf8');
  assert.match(detail, /departmentError/);
  const choir = fs.readFileSync(path.join(root, 'src/app/member/choir/page.tsx'), 'utf8');
  assert.match(choir, /departmentsAvailability\(error\)/);
});

test('grant migration exists, grants authenticated, and never grants anon', () => {
  const dir = path.join(root, 'supabase/migrations');
  const file = fs.readdirSync(dir).find((f) => /grant_department_data_api_access\.sql$/.test(f));
  assert.ok(file, 'grant migration present');
  const sql = fs.readFileSync(path.join(dir, file), 'utf8').toLowerCase();
  for (const t of ['church_departments', 'department_memberships', 'department_leadership', 'department_events', 'department_event_rsvps', 'department_assignment_audit']) {
    assert.match(sql, new RegExp(`grant select[^;]*public\\.${t}[^;]*to authenticated`), t);
  }
  assert.doesNotMatch(sql.replace(/--.*$/gm, ''), /grant[^;]*to[^;]*\banon\b/);
  assert.doesNotMatch(sql, /disable row level security/);
});
