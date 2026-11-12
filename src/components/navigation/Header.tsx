"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLockup from "@/components/brand/BrandLockup";
import s from "@/components/public/public.module.css";

const links = [
  ["About", "/about"],
  ["Services", "/services"],
  ["Ministries", "/ministries"],
  ["Events", "/events"],
  ["Plan your visit", "/plan-your-visit"],
  ["Contact", "/contact"],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <header
      className={[s.header, onHome ? s.headerHome : "", open ? s.headerOpen : ""].join(" ")}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <div className={s.headerInner}>
        <Link
          href="/"
          className={s.brand}
          onClick={() => setOpen(false)}
          aria-label="Fountain of Prayer Hull home"
        >
          <BrandLockup tone={onHome || open ? "light" : "dark"} />
        </Link>

        <button
          ref={toggle}
          className={s.menuToggle}
          type="button"
          aria-controls="public-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={s.menuIcon} aria-hidden="true">
            <span />
            <span />
          </span>
          {open ? "Close" : "Menu"}
        </button>

        <nav
          id="public-navigation"
          aria-label="Main navigation"
          className={[s.nav, open ? s.navOpen : ""].join(" ")}
        >
          <ul className={s.navList}>
            {links.map(([label, href], index) => (
              <li key={href} style={{ "--i": index } as React.CSSProperties}>
                <Link
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className={s.loginLink}
            onClick={() => setOpen(false)}
          >
            Member login <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
