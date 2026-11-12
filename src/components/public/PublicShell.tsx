import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/components/navigation/Header";
import BrandLockup from "@/components/brand/BrandLockup";
import s from "./public.module.css";

const DIRECTIONS =
  "https://www.google.com/maps/search/?api=1&query=152-154%20Hessle%20Road%20Hull%20HU3%202AD";

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
        <div className={s.footerGlow} aria-hidden="true" />
        <div className={[s.container, s.footerGrid].join(" ")}>
          <div className={s.footerIntro}>
            <Link href="/" className={s.footerBrand} aria-label="Fountain of Prayer Hull home">
              <BrandLockup tone="light" />
            </Link>
            <p>
              A place for faith to grow.
              <br />A community to call home.
            </p>
            <address className={s.footerAddress}>
              <span>152–154 Hessle Road, Hull, HU3 2AD</span>
              <span>Sundays · 9:30 AM – 12:00 PM</span>
              <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer">
                Get directions<span className={s.srOnly}> (opens Google Maps in a new tab)</span>{" "}
                <span aria-hidden="true">↗</span>
              </a>
            </address>
          </div>
          <nav aria-label="Discover">
            <h2>Discover</h2>
            <Link href="/about">Our church</Link>
            <Link href="/services">Our services</Link>
            <Link href="/ministries">Life together</Link>
            <Link href="/events">What’s on</Link>
          </nav>
          <nav aria-label="You’re welcome here">
            <h2>You’re welcome here</h2>
            <Link href="/plan-your-visit">Plan your visit</Link>
            <Link href="/contact">Contact &amp; location</Link>
            <Link href="/visit">Visitor check-in</Link>
            <Link href="/login">Member login</Link>
          </nav>
        </div>
        <div className={[s.container, s.footerBottom].join(" ")}>
          <span>RCCG Fountain of Prayer Hull · The Redeemed Christian Church of God</span>
          <span className={s.footerVerse}>Jesus Christ, the same yesterday, today and forever.</span>
        </div>
      </footer>
    </div>
  );
}
