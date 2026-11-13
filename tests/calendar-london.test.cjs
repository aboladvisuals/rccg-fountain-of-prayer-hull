/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const file = path.resolve(__dirname, '..', 'src/lib/calendar/london.ts');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = { exports: {} };
new Function('require', 'module', 'exports', code)(require, m, m.exports);
const cal = m.exports;
const d = (year, month, day) => ({ year, month, day });

test('leap years', () => {
  assert.equal(cal.isLeapYear(2024), true);
  assert.equal(cal.isLeapYear(2026), false);
  assert.equal(cal.isLeapYear(2028), true);
  assert.equal(cal.isLeapYear(1900), false);
  assert.equal(cal.isLeapYear(2000), true);
  assert.equal(cal.daysInMonth(2028, 2), 29);
  assert.equal(cal.daysInMonth(2026, 2), 28);
  assert.equal(cal.daysInMonth(2100, 2), 28);
});

test('month lengths', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mm) => cal.daysInMonth(2026, mm)), [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
});

test('Monday-first weekday index', () => {
  assert.equal(cal.weekdayIndex(d(2026, 11, 13)), 4); // Friday
  assert.equal(cal.weekdayIndex(d(2026, 11, 16)), 0); // Monday
  assert.equal(cal.weekdayIndex(d(2026, 11, 15)), 6); // Sunday
});

test('November 2026 grid: Monday-first, every day present once', () => {
  const grid = cal.monthGrid(2026, 11);
  assert.equal(grid.length, 6); // 1 Nov 2026 is a Sunday
  assert.ok(grid.every((w) => w.length === 7));
  assert.equal(grid[0][0].iso, '2026-10-26');
  assert.equal(grid[0][6].iso, '2026-11-01');
  const inMonth = grid.flat().filter((c) => c.inMonth).map((c) => c.day);
  assert.deepEqual(inMonth, Array.from({ length: 30 }, (_, i) => i + 1));
  assert.equal(grid.flat().filter((c) => cal.weekdayIndex(c) !== grid.flat().indexOf(c) % 7).length, 0);
});

test('February 2027 fits exactly four weeks; February 2028 has 29 days', () => {
  assert.equal(cal.monthGrid(2027, 2).length, 4);
  const feb28 = cal.monthGrid(2028, 2).flat().filter((c) => c.inMonth);
  assert.equal(feb28.length, 29);
  assert.equal(feb28.at(-1).iso, '2028-02-29');
});

test('month navigation crosses years and clamps days', () => {
  assert.deepEqual(cal.addMonths(d(2026, 12, 15), 1), d(2027, 1, 15));
  assert.deepEqual(cal.addMonths(d(2027, 1, 15), -1), d(2026, 12, 15));
  assert.deepEqual(cal.addMonths(d(2028, 1, 31), 1), d(2028, 2, 29));
  assert.deepEqual(cal.addMonths(d(2027, 1, 31), 1), d(2027, 2, 28));
  assert.deepEqual(cal.addMonths(d(2026, 3, 31), -13), d(2025, 2, 28));
});

test('keyboard targets follow the date-grid pattern', () => {
  const start = d(2026, 11, 13);
  assert.deepEqual(cal.keyboardTarget(start, 'ArrowRight'), d(2026, 11, 14));
  assert.deepEqual(cal.keyboardTarget(start, 'ArrowLeft'), d(2026, 11, 12));
  assert.deepEqual(cal.keyboardTarget(start, 'ArrowDown'), d(2026, 11, 20));
  assert.deepEqual(cal.keyboardTarget(start, 'ArrowUp'), d(2026, 11, 6));
  assert.deepEqual(cal.keyboardTarget(start, 'Home'), d(2026, 11, 9));
  assert.deepEqual(cal.keyboardTarget(start, 'End'), d(2026, 11, 15));
  assert.deepEqual(cal.keyboardTarget(start, 'PageDown'), d(2026, 12, 13));
  assert.deepEqual(cal.keyboardTarget(start, 'PageUp', true), d(2025, 11, 13));
  assert.deepEqual(cal.keyboardTarget(d(2026, 12, 31), 'ArrowRight'), d(2027, 1, 1));
  assert.equal(cal.keyboardTarget(start, 'a'), null);
});

test('London date at UTC midnight boundaries (GMT and BST)', () => {
  // Winter (GMT = UTC): 23:59 UTC is still the same London day.
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-11-13T23:59:59Z'))), [2026, 11, 13, 23, 59]);
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-11-14T00:00:00Z'))), [2026, 11, 14, 0, 0]);
  // Summer (BST = UTC+1): 23:30 UTC on 1 July is already 2 July in London.
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-07-01T23:30:00Z'))), [2026, 7, 2, 0, 30]);
  // New Year in GMT.
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-12-31T23:59:00Z'))), [2026, 12, 31, 23, 59]);
});

test('DST transitions in Europe/London (2026: 29 March and 25 October)', () => {
  // Spring forward at 01:00 UTC: 00:59 GMT -> 02:00 BST.
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-03-29T00:59:00Z'))), [2026, 3, 29, 0, 59]);
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-03-29T01:00:00Z'))), [2026, 3, 29, 2, 0]);
  assert.equal(cal.isBritishSummerTime(new Date('2026-03-29T00:59:00Z')), false);
  assert.equal(cal.isBritishSummerTime(new Date('2026-03-29T01:00:00Z')), true);
  // Fall back at 01:00 UTC: 01:59 BST -> 01:00 GMT.
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-10-25T00:59:00Z'))), [2026, 10, 25, 1, 59]);
  assert.deepEqual(pick(cal.zonedParts(new Date('2026-10-25T01:00:00Z'))), [2026, 10, 25, 1, 0]);
  assert.equal(cal.isBritishSummerTime(new Date('2026-10-25T01:00:00Z')), false);
  assert.equal(cal.isBritishSummerTime(new Date('2026-11-13T12:00:00Z')), false);
});

test('London date is independent of the device timezone', () => {
  // zonedParts must not use local getters; result is identical whatever TZ the process runs in.
  const instant = new Date('2026-07-01T23:30:00Z');
  assert.equal(cal.isoDate(cal.zonedParts(instant)), '2026-07-02');
  assert.equal(cal.zonedParts(instant).weekday, 3); // Thursday
});

test('ISO parse rejects impossible dates', () => {
  assert.deepEqual(cal.parseIsoDate('2028-02-29'), d(2028, 2, 29));
  assert.equal(cal.parseIsoDate('2026-02-29'), null);
  assert.equal(cal.parseIsoDate('2026-13-01'), null);
  assert.equal(cal.parseIsoDate('nope'), null);
});

test('long label', () => {
  assert.equal(cal.longDateLabel(d(2026, 11, 13)), 'Friday 13 November 2026');
});

function pick(p) { return [p.year, p.month, p.day, p.hour, p.minute]; }

test('London wall-clock to UTC across GMT/BST', () => {
  assert.equal(cal.londonLocalToUtc('2026-11-13', '19:00').toISOString(), '2026-11-13T19:00:00.000Z');
  assert.equal(cal.londonLocalToUtc('2026-07-01', '19:00').toISOString(), '2026-07-01T18:00:00.000Z');
  assert.equal(cal.londonLocalToUtc('2026-07-02', '00:30').toISOString(), '2026-07-01T23:30:00.000Z');
  // Spring-forward gap 01:00-02:00 on 29 Mar 2026 -> moved forward by an hour.
  assert.equal(cal.londonLocalToUtc('2026-03-29', '01:30').toISOString(), '2026-03-29T01:30:00.000Z');
  assert.equal(cal.londonLocalToUtc('2026-03-29', '03:00').toISOString(), '2026-03-29T02:00:00.000Z');
  // Ambiguous 01:30 on 25 Oct 2026 -> first occurrence (BST).
  assert.equal(cal.londonLocalToUtc('2026-10-25', '01:30').toISOString(), '2026-10-25T00:30:00.000Z');
  assert.equal(cal.londonLocalToUtc('2026-10-25', '03:00').toISOString(), '2026-10-25T03:00:00.000Z');
  assert.equal(cal.londonLocalToUtc('2026-02-30', '10:00'), null);
  assert.equal(cal.londonLocalToUtc('2026-11-13', '24:00'), null);
});
