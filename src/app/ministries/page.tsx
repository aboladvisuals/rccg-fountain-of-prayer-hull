import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  VisitCallout,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";

export const metadata = {
  title: "Life Together | RCCG Fountain of Prayer Hull",
  description:
    "Discover life beyond Sunday at RCCG Fountain of Prayer Hull through prayer, fellowship, service and spiritual growth.",
};

const pathways = [
  {
    number: "01",
    title: "Prayer",
    copy:
      "Seek God together, give thanks, stand with one another and bring the needs of people before Him.",
  },
  {
    number: "02",
    title: "Fellowship",
    copy:
      "Build genuine relationships rooted in faith, encouragement, care and shared life.",
  },
  {
    number: "03",
    title: "Service",
    copy:
      "Put faith into practice by using your gifts, showing kindness and helping where there is need.",
  },
];

export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="LIFE TOGETHER"
        title="Find connection. Grow with purpose."
      >
        <p>
          Faith is lived beyond a Sunday service: in the
          way we pray, care for one another, grow together
          and serve the people around us.
        </p>
      </PageIntro>

      <section
        className={[
          s.container,
          s.section,
          s.aboutGrid,
        ].join(" ")}
      >
        <div>
          <p className={s.eyebrow}>
            BEYOND SUNDAY
          </p>

          <h2>
            Faith grows
            <br />
            <em>in community.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            Church is more than gathering in one room once
            a week. It is learning to walk with Christ
            together, support one another and make space
            for faith to shape everyday life.
          </p>

          <p>
            At Fountain of Prayer Hull, we want people to
            find meaningful connection, grow spiritually
            and discover practical ways to contribute to
            the life of the church family.
          </p>

          <Link
            href="/contact"
            className={s.textLink}
          >
            Get connected{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
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
                HOW WE GROW TOGETHER
              </p>

              <h2>
                Pray. Connect.
                <br />
                <em>Serve.</em>
              </h2>
            </div>
          </div>

          <div className={s.threeGrid}>
            {pathways.map((item) => (
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
            FIND YOUR PLACE
          </p>

          <h2>
            There is room
            <br />
            <em>for your gifts too.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            Everyone has something meaningful to bring.
            As you become part of the church family, there
            are opportunities to encourage others, serve
            practically and contribute to the life of the
            congregation.
          </p>

          <p>
            Details of specific Hull ministry groups,
            children&apos;s and youth provision, and
            volunteering opportunities will be published
            here as they are formally confirmed.
          </p>

          <Link
            href="/contact"
            className={s.buttonPlum}
          >
            Ask about getting involved ↗
          </Link>
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
              START WITH SUNDAY
            </p>

            <h2>
              Come meet the family.
              <br />
              <em>Take your next step naturally.</em>
            </h2>
          </div>

          <div className={s.bodyCopy}>
            <p>
              If you are new to Fountain of Prayer Hull,
              the simplest place to begin is Sunday
              worship.
            </p>

            <p>
              Join us from 9:30 AM to 12:00 PM at
              152–154 Hessle Road, Hull, HU3 2AD.
            </p>

            <Link
              href="/plan-your-visit"
              className={s.textLink}
            >
              Plan your first visit{" "}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <VisitCallout />
    </PublicShell>
  );
}