import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  ServiceCards,
  VisitCallout,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";

export const metadata = {
  title: "Services | RCCG Fountain of Prayer Hull",
  description:
    "Join RCCG Fountain of Prayer Hull for Sunday worship, prayer, the Word and fellowship from 9:30 AM to 12:00 PM at 152–154 Hessle Road, Hull.",
};

const expectations = [
  {
    number: "01",
    title: "Worship",
    copy:
      "Come ready to lift your heart to God and worship together as one church family.",
  },
  {
    number: "02",
    title: "Prayer",
    copy:
      "Prayer is central to our life together as we seek God, give thanks and stand with one another.",
  },
  {
    number: "03",
    title: "The Word",
    copy:
      "We make room for Scripture that strengthens faith and speaks into everyday life.",
  },
];

export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="GATHER WITH US"
        title="A Sunday worth making room for."
      >
        <p>
          Join us for worship, prayer, the Word and
          fellowship as we gather together in the presence
          of God.
        </p>
      </PageIntro>

      <section
        className={[
          s.container,
          s.section,
        ].join(" ")}
      >
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>
              SUNDAY WORSHIP
            </p>

            <h2>
              One church family.
              <br />
              <em>One shared moment with God.</em>
            </h2>
          </div>

          <Link
            href="/plan-your-visit"
            className={s.textLink}
          >
            Plan your first visit ↗
          </Link>
        </div>

        <ServiceCards />
      </section>

      <section className={s.softSection}>
        <div
          className={[
            s.container,
            s.section,
          ].join(" ")}
        >
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>
                WHAT TO EXPECT
              </p>

              <h2>
                Come as you are.
                <br />
                <em>Worship with us.</em>
              </h2>
            </div>
          </div>

          <div className={s.threeGrid}>
            {expectations.map((item) => (
              <article
                key={item.number}
                className={s.valueCard}
              >
                <div
                  className={s.valueArt}
                  aria-hidden="true"
                >
                  <span>{item.number}</span>
                </div>

                <h3>{item.title}</h3>

                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className={[
          s.container,
          s.section,
          s.aboutGrid,
        ].join(" ")}
      >
        <div>
          <p className={s.eyebrow}>
            WHEN & WHERE
          </p>

          <h2>
            Sunday in Hull.
            <br />
            <em>We would love to welcome you.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            Our Sunday worship service runs from
            9:30 AM to 12:00 PM.
          </p>

          <p>
            We meet at 152–154 Hessle Road,
            Hull, HU3 2AD.
          </p>

          <p>
            If it is your first time with us, there is no
            pressure to know what to do beforehand. Simply
            come, settle in and experience the service at
            your own pace.
          </p>

          <Link
            href="/plan-your-visit"
            className={s.buttonPlum}
          >
            Plan your first visit ↗
          </Link>
        </div>
      </section>

      <VisitCallout />
    </PublicShell>
  );
}