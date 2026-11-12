import Link from "next/link";
import type { ReactNode } from "react";
import BrandLockup from "@/components/brand/BrandLockup";
import ParishMark from "@/components/brand/ParishMark";
import s from "./auth.module.css";

/**
 * Shared frame for sign-in, password recovery and reset screens.
 * Purely presentational: no auth logic lives here.
 */
export default function AuthShell({
  eyebrow,
  title,
  intro,
  back,
  children,
  footnote,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  back: { href: string; label: string };
  children: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className={s.shell}>
      <aside className={s.art} aria-hidden="true">
        <div className={s.artLight} />
        <div className={s.artArch}>
          <div className={s.artWindow}>
            <span className={s.artCross} />
          </div>
        </div>
        <div className={s.artCopy}>
          <ParishMark size={44} tone="gold" />
          <p className={s.artTitle}>
            Fountain of Prayer <span>Hull</span>
          </p>
          <p className={s.artQuote}>
            “Jesus Christ is the same yesterday and today and forever.”
            <span>Hebrews 13:8</span>
          </p>
        </div>
      </aside>

      <main className={s.panel} id="main-content">
        <div className={s.topBar}>
          <Link href="/" className={s.brand} aria-label="Fountain of Prayer Hull home">
            <BrandLockup compact />
          </Link>
          <Link href={back.href} className={s.back}>
            <span aria-hidden="true">←</span> {back.label}
          </Link>
        </div>

        <div className={s.card}>
          <p className={s.eyebrow}>{eyebrow}</p>
          <h1 className={s.title}>{title}</h1>
          {intro && <div className={s.intro}>{intro}</div>}
          <div className={s.body}>{children}</div>
        </div>

        {footnote && <div className={s.footnote}>{footnote}</div>}

        <p className={s.secure}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 10V8a6 6 0 1 1 12 0v2m-13 0h14v11H5V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Secure sign-in for RCCG Fountain of Prayer Hull members
        </p>
      </main>
    </div>
  );
}
