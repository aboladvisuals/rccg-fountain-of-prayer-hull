import Link from "next/link";
import type { ReactNode } from "react";
import BrandLockup from "@/components/brand/BrandLockup";
import AppNav, { type NavItem } from "./AppNav";
import s from "./app.module.css";

/**
 * Shared chrome for member, pastor/admin and media areas: brand, area label,
 * section navigation and an optional actions slot. Presentation only; every
 * page keeps its own server-side session and role checks.
 */
export default function AppFrame({
  area,
  nav,
  actions,
  children,
  tone = "light",
}: {
  area: string;
  nav: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
  tone?: "light" | "operations";
}) {
  return (
    <div className={[s.frame, tone === "operations" ? s.operations : ""].join(" ")}>
      <a href="#app-content" className={s.skip}>
        Skip to content
      </a>
      <header className={s.bar}>
        <div className={s.barInner}>
          <div className={s.identity}>
            <Link href="/" className={s.brand} aria-label="Fountain of Prayer Hull home">
              <BrandLockup compact tone={tone === "operations" ? "light" : "dark"} />
            </Link>
            <span className={s.area}>{area}</span>
          </div>
          {actions && <div className={s.actions}>{actions}</div>}
        </div>
        <div className={s.navRow}>
          <AppNav items={nav} label={`${area} navigation`} />
        </div>
      </header>
      <div id="app-content" className={s.content} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
