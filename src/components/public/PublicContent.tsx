import Link from "next/link";
import type { ReactNode } from "react";

import s from "./public.module.css";

export function PageIntro({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={s.pageIntro}>
      <div className={s.container}>
        <Link
          className={s.breadcrumb}
          href="/"
        >
          Home /
        </Link>

        <p className={s.eyebrow}>
          {label}
        </p>

        <h1>{title}</h1>

        <div className={s.introCopy}>
          {children}
        </div>
      </div>
    </section>
  );
}

export function ServiceCards() {
  return (
    <div className={s.twoGrid}>
      <article className={s.serviceCard}>
        <span className={s.cardNumber}>
          01 / GATHER
        </span>

        <h3>Sunday worship</h3>

        <p>
          Make room for worship, prayer, the Word of God
          and fellowship together.
        </p>

        <div className={s.cardMeta}>
          Every Sunday · 9:30 AM–12:00 PM
        </div>
      </article>

      <article className={s.serviceCard}>
        <span className={s.cardNumber}>
          02 / WELCOME
        </span>

        <h3>Your first Sunday</h3>

        <p>
          Visiting for the first time? Come as you are,
          settle in and experience the service at your own
          pace.
        </p>

        <div className={s.cardMeta}>
          152–154 Hessle Road · Hull · HU3 2AD
        </div>
      </article>
    </div>
  );
}

export function VisitCallout() {
  return (
    <section className={s.visitCallout}>
      <div
        className={[
          s.container,
          s.calloutInner,
        ].join(" ")}
      >
        <div>
          <p className={s.eyebrow}>
            THERE’S A PLACE FOR YOU
          </p>

          <h2>Come as you are.</h2>

          <p>
            We look forward to welcoming you to Fountain
            of Prayer Hull.
          </p>
        </div>

        <Link
          href="/plan-your-visit"
          className={s.buttonLight}
        >
          Plan your visit{" "}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}

export function EventEmpty() {
  return (
    <div className={s.eventEmpty}>
      <span
        className={s.eventIcon}
        aria-hidden="true"
      >
        ✦
      </span>

      <div>
        <h3>
          Good things to look forward to.
        </h3>

        <p>
          Our Hull events calendar is being prepared.
          Confirmed dates and gathering details will
          appear here.
        </p>
      </div>

      <span className={s.pill}>
        Coming soon
      </span>
    </div>
  );
}