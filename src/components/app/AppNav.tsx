"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./app.module.css";

export type NavItem = { href: string; label: string; exact?: boolean };

/** Section navigation for signed-in areas. Links only; access is enforced server-side per page. */
export default function AppNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={s.nav}>
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
  );
}
