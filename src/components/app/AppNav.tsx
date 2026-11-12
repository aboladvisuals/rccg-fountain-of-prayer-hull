"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import s from "./app.module.css";

export type NavItem = { href: string; label: string; exact?: boolean };

type Edges = { start: boolean; end: boolean };

/** Section navigation for signed-in areas. Links only; access is enforced server-side per page. */
export default function AppNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });

  // Show an edge fade (and a chevron hint) only on the side where more links are hidden.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const next = { start: el.scrollLeft > 2, end: max - el.scrollLeft > 2 };
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  // Keep the current section visible when the bar overflows on small screens.
  useEffect(() => {
    const el = navRef.current;
    const current = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !current || el.scrollWidth <= el.clientWidth) return;
    const target = current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, [pathname]);

  return (
    <div
      className={s.navWrap}
      data-overflow-start={edges.start || undefined}
      data-overflow-end={edges.end || undefined}
    >
      <nav ref={navRef} aria-label={label} className={s.nav}>
        <ul className={s.navList}>
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={s.navLink}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <span className={`${s.navHint} ${s.navHintStart}`} aria-hidden="true">
        ‹
      </span>
      <span className={`${s.navHint} ${s.navHintEnd}`} aria-hidden="true">
        ›
      </span>
    </div>
  );
}
