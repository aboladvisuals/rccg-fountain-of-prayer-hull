// Pure calendar maths for the dashboard calendar card.
// "Today" is always resolved in the church timezone (Europe/London) through
// Intl, so GMT/BST changes are handled by the platform's tz database. Grid maths
// uses UTC-only Date arithmetic so it never depends on the device timezone.

export const CHURCH_TIMEZONE = "Europe/London";

export type CalendarDate = { year: number; month: number; day: number }; // month 1-12

export type ZonedParts = CalendarDate & {
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Monday … 6 = Sunday
};

const formatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Wall-clock parts of an instant in the given timezone (default Europe/London). */
export function zonedParts(instant: Date, timeZone = CHURCH_TIMEZONE): ZonedParts {
  const values: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  const date = { year: values.year, month: values.month, day: values.day };
  return { ...date, hour: values.hour % 24, minute: values.minute, second: values.second, weekday: weekdayIndex(date) };
}

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monday-first weekday index (0 = Monday, 6 = Sunday). */
export function weekdayIndex({ year, month, day }: CalendarDate) {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function addDays(date: CalendarDate, delta: number): CalendarDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day + delta));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Add months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: CalendarDate, delta: number): CalendarDate {
  const index = date.year * 12 + (date.month - 1) + delta;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

export function sameDate(a: CalendarDate | null | undefined, b: CalendarDate | null | undefined) {
  return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
}

export function isoDate({ year, month, day }: CalendarDate) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseIsoDate(value: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const date = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > daysInMonth(date.year, date.month)) return null;
  return date;
}

export type GridCell = CalendarDate & { inMonth: boolean; iso: string };

/**
 * Monday-to-Sunday grid for a month: whole weeks only, leading/trailing days
 * from the neighbouring months flagged inMonth=false. 4–6 rows.
 */
export function monthGrid(year: number, month: number): GridCell[][] {
  const first = { year, month, day: 1 };
  const lead = weekdayIndex(first);
  const total = daysInMonth(year, month);
  const rows = Math.ceil((lead + total) / 7);
  const start = addDays(first, -lead);
  const weeks: GridCell[][] = [];
  for (let w = 0; w < rows; w++) {
    const week: GridCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      week.push({ ...date, inMonth: date.month === month && date.year === year, iso: isoDate(date) });
    }
    weeks.push(week);
  }
  return weeks;
}

/** Keyboard navigation for the date grid (WAI-ARIA date-picker pattern). */
export function keyboardTarget(date: CalendarDate, key: string, shiftKey = false): CalendarDate | null {
  switch (key) {
    case "ArrowLeft": return addDays(date, -1);
    case "ArrowRight": return addDays(date, 1);
    case "ArrowUp": return addDays(date, -7);
    case "ArrowDown": return addDays(date, 7);
    case "Home": return addDays(date, -weekdayIndex(date));
    case "End": return addDays(date, 6 - weekdayIndex(date));
    case "PageUp": return shiftKey ? addMonths(date, -12) : addMonths(date, -1);
    case "PageDown": return shiftKey ? addMonths(date, 12) : addMonths(date, 1);
    default: return null;
  }
}

/** Is the London UTC offset for this instant British Summer Time? */
export function isBritishSummerTime(instant: Date) {
  const p = zonedParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000) === 60;
}

export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

export function longDateLabel(date: CalendarDate) {
  return `${WEEKDAYS_LONG[weekdayIndex(date)]} ${date.day} ${MONTHS[date.month - 1]} ${date.year}`;
}

/**
 * Convert a London wall-clock date + time ("YYYY-MM-DD", "HH:MM") into a UTC
 * instant. Handles GMT/BST: a time inside the spring-forward gap moves forward
 * by the gap (01:30 -> 02:30 BST); an ambiguous autumn time uses the first
 * (BST) occurrence. Returns null for malformed input.
 */
export function londonLocalToUtc(date: string, time: string): Date | null {
  const d = parseIsoDate(date);
  const t = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!d || !t) return null;
  const wall = Date.UTC(d.year, d.month - 1, d.day, Number(t[1]), Number(t[2]));
  const offsetAt = (instant: number) => {
    const p = zonedParts(new Date(instant));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instant;
  };
  // Try the earlier (summer, larger) offset first so ambiguous times resolve to BST.
  const candidates = [wall - offsetAt(wall - 3 * 3600_000), wall - offsetAt(wall + 3 * 3600_000)].sort((a, b) => a - b);
  for (const c of candidates) {
    if (c + offsetAt(c) === wall) return new Date(c);
  }
  // Spring-forward gap: no exact match, use the pre-transition offset.
  return new Date(wall - offsetAt(wall - 3 * 3600_000));
}
