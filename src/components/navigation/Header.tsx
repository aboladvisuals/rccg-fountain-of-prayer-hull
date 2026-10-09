"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="leading-tight">
          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-purple-700">
            RCCG
          </span>
          <span className="text-lg font-bold text-slate-900">
            Fountain of Prayer Hull
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 md:flex">
          <Link href="/#about">About</Link>
          <Link href="/#services">Services</Link>
          <Link href="/#events">Events</Link>
          <Link href="/#ministries">Ministries</Link>
          <Link href="/#contact">Contact</Link>

          <Link
            href="/login"
            className="rounded-lg bg-purple-700 px-4 py-2 text-white"
          >
            Member Login
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4 font-medium text-slate-700">
            <Link href="/#about" onClick={() => setOpen(false)}>About</Link>
            <Link href="/#services" onClick={() => setOpen(false)}>Services</Link>
            <Link href="/#events" onClick={() => setOpen(false)}>Events</Link>
            <Link href="/#ministries" onClick={() => setOpen(false)}>Ministries</Link>
            <Link href="/#contact" onClick={() => setOpen(false)}>Contact</Link>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-purple-700 px-4 py-3 text-center text-white"
            >
              Member Login
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
