"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "@/components/public/public.module.css";
const links = [
  ["About", "/about"],
  ["Services", "/services"],
  ["Ministries", "/ministries"],
  ["Events", "/events"],
  ["Contact", "/contact"],
];
export default function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  return (
    <header
      className={s.header}
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
          <span className={s.brandMark} aria-hidden="true">
            ✦
          </span>
          <span>
            <span className={s.brandName}>Fountain of Prayer</span>
            <span className={s.brandSub}>RCCG · HULL</span>
          </span>
        </Link>
        <button
          ref={toggle}
          className={s.menuToggle}
          type="button"
          aria-controls="public-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close −" : "Menu +"}
        </button>
        <nav
          id="public-navigation"
          aria-label="Main navigation"
          className={[s.nav, open ? s.navOpen : ""].join(" ")}
        >
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            className={s.loginLink}
            onClick={() => setOpen(false)}
          >
            Member login <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
