import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/components/navigation/Header";
import s from "./public.module.css";
export default function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className={s.site}>
      <a href="#main-content" className={s.skip}>
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className={s.footer}>
        <div className={[s.container, s.footerGrid].join(" ")}>
          <div>
            <Link href="/" className={s.footerBrand}>
              Fountain of Prayer<span>RCCG · Hull</span>
            </Link>
            <p>
              A place for faith to grow.
              <br />A community to call home.
            </p>
          </div>
          <div>
            <h2>Discover</h2>
            <Link href="/about">Our church</Link>
            <Link href="/services">Our services</Link>
            <Link href="/ministries">Life together</Link>
            <Link href="/events">What’s on</Link>
          </div>
          <div>
            <h2>You’re welcome here</h2>
            <Link href="/plan-your-visit">Plan your visit</Link>
            <Link href="/contact">Contact & location</Link>
            <Link href="/visit">Visitor check-in</Link>
            <Link href="/login">Member login ↗</Link>
          </div>
        </div>
        <div className={[s.container, s.footerBottom].join(" ")}>
          <span>RCCG Fountain of Prayer Hull</span>
          <span>Jesus Christ, the same yesterday, today and forever.</span>
        </div>
      </footer>
    </div>
  );
}
