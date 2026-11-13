"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  CHURCH_TIMEZONE,
  MONTHS,
  WEEKDAYS_LONG,
  WEEKDAYS_SHORT,
  addMonths,
  isBritishSummerTime,
  isoDate,
  keyboardTarget,
  longDateLabel,
  monthGrid,
  parseIsoDate,
  sameDate,
  zonedParts,
  type CalendarDate,
} from "@/lib/calendar/london";
import styles from "./calendar.module.css";

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string; // ISO instant (timestamptz)
  departmentName?: string;
  status?: string;
};

type Props = {
  /** London calendar date computed on the server ("YYYY-MM-DD"); keeps SSR and hydration identical. */
  initialToday: string;
  /** Real, RLS-filtered events the signed-in person may see. Never fabricated. */
  events?: CalendarEvent[];
  heading?: string;
};

const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: CHURCH_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Live clock isolated in its own component so only it re-renders each second. */
function LiveClock({ onDay }: { onDay: (iso: string) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  const lastDay = useRef<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = new Date();
      setNow(current);
      const day = isoDate(zonedParts(current));
      if (day !== lastDay.current) {
        lastDay.current = day;
        onDay(day);
      }
      timer = setTimeout(tick, 1000 - (current.getTime() % 1000) + 5);
    };
    tick();
    const resync = () => { if (document.visibilityState === "visible") { clearTimeout(timer); tick(); } };
    document.addEventListener("visibilitychange", resync);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", resync); };
  }, [onDay]);

  if (!now) {
    return (
      <p className={styles.clock} aria-hidden="true">
        <span className={styles.clockDigits}>--:--</span><span className={styles.clockSeconds}>--</span>
      </p>
    );
  }
  const p = zonedParts(now);
  const hh = String(p.hour).padStart(2, "0");
  const mm = String(p.minute).padStart(2, "0");
  const ss = String(p.second).padStart(2, "0");
  return (
    <p className={styles.clock}>
      <time dateTime={now.toISOString()} aria-label={`Time in Hull: ${hh}:${mm}, ${isBritishSummerTime(now) ? "British Summer Time" : "Greenwich Mean Time"}`}>
        <span className={styles.clockDigits} aria-hidden="true">{hh}<span className={styles.colon}>:</span>{mm}</span>
        <span className={styles.clockSeconds} aria-hidden="true">{ss}</span>
      </time>
      <span className={styles.zone} aria-hidden="true">{isBritishSummerTime(now) ? "BST" : "GMT"}</span>
    </p>
  );
}

export default function LondonCalendar({ initialToday, events: eventSource, heading = "Today" }: Props) {
  const events = useMemo(() => eventSource ?? [], [eventSource]);
  const serverToday = parseIsoDate(initialToday) ?? { year: 1970, month: 1, day: 1 };
  const [today, setToday] = useState<CalendarDate>(serverToday);
  const [view, setView] = useState<{ year: number; month: number }>({ year: serverToday.year, month: serverToday.month });
  const [focused, setFocused] = useState<CalendarDate>(serverToday);
  const [direction, setDirection] = useState<"prev" | "next" | null>(null);
  const moveFocusRef = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);

  const todayRef = useRef<CalendarDate>(serverToday);

  const onDay = useCallback((iso: string) => {
    const next = parseIsoDate(iso);
    const prev = todayRef.current;
    if (!next || sameDate(prev, next)) return;
    todayRef.current = next;
    setToday(next);
    // Follow the date forward if the person was looking at "today".
    setView((v) => (v.year === prev.year && v.month === prev.month ? { year: next.year, month: next.month } : v));
    setFocused((f) => (sameDate(f, prev) ? next : f));
  }, []);

  const weeks = useMemo(() => monthGrid(view.year, view.month), [view.year, view.month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = isoDate(zonedParts(new Date(event.startsAt)));
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  useEffect(() => {
    if (!moveFocusRef.current) return;
    moveFocusRef.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-iso="${isoDate(focused)}"]`)?.focus();
  }, [focused, view]);

  const go = (target: CalendarDate, fromKeyboard: boolean) => {
    if (target.year !== view.year || target.month !== view.month) {
      setDirection(target.year * 12 + target.month > view.year * 12 + view.month ? "next" : "prev");
      setView({ year: target.year, month: target.month });
    }
    moveFocusRef.current = fromKeyboard;
    setFocused(target);
  };

  const shiftMonth = (delta: number) => {
    const target = addMonths({ year: view.year, month: view.month, day: focused.day }, delta);
    setDirection(delta > 0 ? "next" : "prev");
    setView({ year: target.year, month: target.month });
    setFocused(target);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const target = keyboardTarget(focused, event.key, event.shiftKey);
    if (!target) return;
    event.preventDefault();
    go(target, true);
  };

  const prevLabel = addMonths({ ...view, day: 1 }, -1);
  const nextLabel = addMonths({ ...view, day: 1 }, 1);
  const viewingToday = view.year === today.year && view.month === today.month;
  const selectedEvents = eventsByDay.get(isoDate(focused)) ?? [];
  const todayWeekday = WEEKDAYS_LONG[(new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay() + 6) % 7];
  const headingId = "calendar-card-heading";
  const monthId = "calendar-month-label";

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.today}>
        <div className={styles.todayText}>
          <p className={styles.kicker} id={headingId}>{heading} · Hull</p>
          <p className={styles.weekday}>{todayWeekday}</p>
          <p className={styles.date}>
            <span className={styles.dayNumber}>{today.day}</span>
            <span className={styles.monthYear}>{MONTHS[today.month - 1]} {today.year}</span>
          </p>
        </div>
        <LiveClock onDay={onDay} />
      </header>

      <div className={styles.calendar}>
        <div className={styles.toolbar}>
          <button type="button" className={styles.navButton} onClick={() => shiftMonth(-1)} aria-label={`Previous month, ${MONTHS[prevLabel.month - 1]} ${prevLabel.year}`}>
            <span aria-hidden="true">‹</span>
          </button>
          <h3 id={monthId} className={styles.monthLabel} aria-live="polite">
            {MONTHS[view.month - 1]} <span className={styles.monthLabelYear}>{view.year}</span>
          </h3>
          <button type="button" className={styles.navButton} onClick={() => shiftMonth(1)} aria-label={`Next month, ${MONTHS[nextLabel.month - 1]} ${nextLabel.year}`}>
            <span aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            className={styles.todayButton}
            onClick={() => go(today, false)}
            aria-disabled={viewingToday && sameDate(focused, today) ? "true" : undefined}
          >
            Today
          </button>
        </div>

        <table
          ref={gridRef}
          role="grid"
          aria-labelledby={monthId}
          className={styles.grid}
          data-direction={direction ?? undefined}
          key={`${view.year}-${view.month}`}
          onKeyDown={onKeyDown}
        >
          <thead>
            <tr>
              {WEEKDAYS_SHORT.map((label, i) => (
                <th key={label} scope="col" abbr={WEEKDAYS_LONG[i]} className={i > 4 ? styles.weekend : undefined}>
                  <span aria-hidden="true">{label.slice(0, 1)}<span className={styles.weekdayRest}>{label.slice(1)}</span></span>
                  <span className="sr-only">{WEEKDAYS_LONG[i]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0].iso}>
                {week.map((cell) => {
                  const isToday = sameDate(cell, today);
                  const isFocused = sameDate(cell, focused);
                  const dayEvents = eventsByDay.get(cell.iso);
                  const label = `${longDateLabel(cell)}${isToday ? ", today" : ""}${dayEvents ? `, ${dayEvents.length} department ${dayEvents.length === 1 ? "event" : "events"}` : ""}`;
                  return (
                    <td key={cell.iso} role="gridcell" aria-selected={isFocused}>
                      <button
                        type="button"
                        data-iso={cell.iso}
                        tabIndex={isFocused ? 0 : -1}
                        aria-label={label}
                        aria-current={isToday ? "date" : undefined}
                        className={[
                          styles.day,
                          cell.inMonth ? "" : styles.outside,
                          isToday ? styles.isToday : "",
                          isFocused ? styles.isFocused : "",
                        ].join(" ")}
                        onClick={() => go(cell, false)}
                      >
                        <span className={styles.dayNum}>{cell.day}</span>
                        {dayEvents && <span className={styles.dot} aria-hidden="true" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.detail} aria-live="polite">
          <p className={styles.detailDate}>{longDateLabel(focused)}{sameDate(focused, today) ? " · Today" : ""}</p>
          {selectedEvents.length > 0 ? (
            <ul className={styles.eventList}>
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  <span className={styles.eventTime}>{timeFormat.format(new Date(event.startsAt))}</span>
                  <span className={styles.eventTitle}>{event.title}</span>
                  {event.departmentName && <span className={styles.eventDept}>{event.departmentName}</span>}
                </li>
              ))}
            </ul>
          ) : eventSource ? (
            <p className={styles.detailNote}>
              {events.length > 0 ? "No department activities on this day." : "Your department activities will appear here once leaders schedule them."}
            </p>
          ) : null}
          <p className={styles.hint}>Times shown in UK time (Europe/London). Use the arrow keys to move between days.</p>
        </div>
      </div>
    </section>
  );
}
