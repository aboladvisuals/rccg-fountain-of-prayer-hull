/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// Guards the official RCCG logo slot: never claim it is installed without the file,
// never leave a supplied file unwired, and never ship a traced/generated substitute.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const slot = fs.readFileSync(path.join(root, 'src/lib/brand/official-logo.ts'), 'utf8');
const configured = /OFFICIAL_RCCG_LOGO:\s*OfficialLogo\s*\|\s*null\s*=\s*\{[^}]*src:\s*"([^"]+)"/.exec(slot);
const candidates = ['rccg-logo.svg', 'rccg-logo.png'].filter((f) => fs.existsSync(path.join(root, 'public/brand', f)));

test('configured official logo file exists', () => {
  if (configured) assert.ok(fs.existsSync(path.join(root, 'public', configured[1])), `missing public${configured[1]}`);
});

test('a supplied official logo file is wired into the shared brand component', () => {
  if (candidates.length) assert.ok(configured, `public/brand/${candidates[0]} exists but OFFICIAL_RCCG_LOGO is still null`);
});

test('placeholder emblem is only rendered through the shared BrandEmblem', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx$/.test(e.name) && !p.includes(path.join('components', 'brand'))) {
        if (/ParishMark/.test(fs.readFileSync(p, 'utf8'))) offenders.push(path.relative(root, p));
      }
    }
  };
  walk(path.join(root, 'src'));
  assert.deepEqual(offenders, []);
});
