import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  VisitCallout,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";

export const metadata = {
  title: "Events | RCCG Fountain of Prayer Hull",
  description:
    "Discover special services and church family gatherings at RCCG Fountain of Prayer Hull, including Heritage Service, Praise Concert, Family Sunday and more.",
};

const events = [
  {
    number: "01",
    title: "Heritage Service",
    copy:
      "A special gathering celebrating faith, culture, gratitude and the richness of our church family.",
  },
  {
    number: "02",
    title: "Praise Concert",
    copy:
      "An uplifting time of praise and worship as we gather to celebrate God together.",
  },
  {
    number: "03",
    title: "Men’s Service",
    copy:
      "A dedicated service celebrating the men of the church and encouraging faith, responsibility and purpose.",
  },
  {
    number: "04",
    title: "Family Sunday",
    copy:
      "A Sunday centred on family, fellowship and the joy of growing together in faith.",
  },
  {
    number: "05",
    title: "Women’s Service",
    copy:
      "A special service celebrating the women of the church and their contribution to faith, family and community.",
  },
];

export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="WHAT’S ON"
        title="Gather. Celebrate. Be encouraged."
      >
        <p>
          Throughout the year, Fountain of Prayer Hull
          comes together for special moments of worship,
          celebration, fellowship and church family life.
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
              SPECIAL GATHERINGS
            </p>

            <h2>
              Moments worth
              <br />
              <em>sharing together.</em>
            </h2>
          </div>

          <Link
            href="/contact"
            className={s.textLink}
          >
            Ask about upcoming dates ↗
          </Link>
        </div>

        <div className={s.threeGrid}>
          {events.map((event) => (
            <article
              key={event.number}
              className={s.valueCard}
            >
              <div
                className={s.valueArt}
                aria-hidden="true"
              >
                <span>{event.number}</span>
              </div>

              <h3>{event.title}</h3>

              <p>{event.copy}</p>

              <p className={s.notice}>
                Date to be confirmed
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={s.softSection}>
        <div
          className={[
            s.container,
            s.section,
            s.aboutGrid,
          ].join(" ")}
        >
          <div>
            <p className={s.eyebrow}>
              REGULAR WORSHIP
            </p>

            <h2>
              You do not have to
              <br />
              <em>wait for a special event.</em>
            </h2>
          </div>

          <div className={s.bodyCopy}>
            <p>
              Our church family gathers every Sunday for
              worship, prayer, the Word and fellowship.
            </p>

            <p>
              Join us from 9:30 AM to 12:00 PM at
              152–154 Hessle Road, Hull, HU3 2AD.
            </p>

            <Link
              href="/services"
              className={s.textLink}
            >
              Explore Sunday worship{" "}
              <span aria-hidden="true">↗</span>
            </Link>
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
            STAY CONNECTED
          </p>

          <h2>
            Know what is
            <br />
            <em>coming next.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            Confirmed dates and full details for special
            services will be added here as they are
            announced.
          </p>

          <p>
            You can also follow RCCG Fountain of Prayer
            Hull on Facebook for church updates and
            announcements.
          </p>

          <a
            href="https://www.facebook.com/share/18FGcTEdLZ/?mibextid=wwXIfr"
            target="_blank"
            rel="noreferrer"
            className={s.buttonPlum}
          >
            Follow us on Facebook ↗
          </a>
        </div>
      </section>

      <VisitCallout />
    </PublicShell>
  );
}