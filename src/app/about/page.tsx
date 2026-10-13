import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  VisitCallout,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";

export const metadata = {
  title: "About Us | RCCG Fountain of Prayer Hull",
  description:
    "Discover RCCG Fountain of Prayer Hull, a Christ-centred church family rooted in prayer, worship, Scripture, fellowship and service.",
};

const values = [
  {
    number: "01",
    title: "Christ at the centre",
    copy:
      "Jesus Christ is the foundation of our faith, our worship and the life we share together.",
  },
  {
    number: "02",
    title: "Prayer as a way of life",
    copy:
      "We believe prayer is more than a moment in a service. It shapes how we seek God, support one another and face everyday life.",
  },
  {
    number: "03",
    title: "People growing together",
    copy:
      "Church is family. We make room for people to belong, ask questions, mature in faith and serve with purpose.",
  },
];

export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="OUR CHURCH"
        title="A place to belong. A faith to grow."
      >
        <p>
          RCCG Fountain of Prayer Hull is a Christ-centred
          church family and part of the Redeemed Christian
          Church of God.
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
            WHO WE ARE
          </p>

          <h2>
            Rooted in Christ.
            <br />
            <em>Growing together.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            Our church life is centred on Jesus Christ.
            Through Scripture, prayer, worship, fellowship
            and service, we seek to know Him more deeply
            and reflect His love in everyday life.
          </p>

          <p>
            We are a growing church family in Hull,
            welcoming people at every stage of faith.
            Whether you are exploring Christianity,
            returning to church or looking for a spiritual
            home, you are welcome here.
          </p>

          <Link
            href="/plan-your-visit"
            className={s.textLink}
          >
            Plan your first visit{" "}
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
                WHAT SHAPES US
              </p>

              <h2>
                Faith that is lived,
                <br />
                <em>not only spoken.</em>
              </h2>
            </div>
          </div>

          <div className={s.threeGrid}>
            {values.map((value) => (
              <article
                key={value.number}
                className={s.valueCard}
              >
                <div
                  className={s.valueArt}
                  aria-hidden="true"
                >
                  <span>{value.number}</span>
                </div>

                <h3>{value.title}</h3>

                <p>{value.copy}</p>
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
            OUR FOUNDATION
          </p>

          <h2>
            Jesus Christ,
            <br />
            <em>unchanging forever.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            “Jesus Christ is the same yesterday and today
            and forever.”
          </p>

          <p className={s.notice}>
            Hebrews 13:8
          </p>

          <p>
            This truth anchors who we are as a church:
            faithful to Christ, dependent on prayer and
            committed to growing together in His Word.
          </p>
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
              LEADERSHIP & CARE
            </p>

            <h2>
              Shepherding people.
              <br />
              <em>Serving with purpose.</em>
            </h2>
          </div>

          <div className={s.bodyCopy}>
            <p>
              RCCG Fountain of Prayer Hull is led by
              Pastor Akinsanya Olufemi together with
              Pastor (Mrs) Akinsanya, supported by
              Minister Ademola, Minister Israel,
              Minister Sunday, Minister Sodiya and
              Minister Samuel.
            </p>

            <p>
              Together, the leadership and ministry team
              serve the church family through pastoral
              care, prayer, teaching, worship, fellowship
              and practical service.
            </p>
          </div>
        </div>
      </section>

      <section
        className={[
          s.container,
          s.section,
        ].join(" ")}
      >
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>
              OUR HOME IN HULL
            </p>

            <h2>
              Local church.
              <br />
              <em>Open doors.</em>
            </h2>
          </div>

          <Link
            href="/contact"
            className={s.textLink}
          >
            Contact us ↗
          </Link>
        </div>

        <div className={s.threeGrid}>
          <article className={s.valueCard}>
            <div
              className={s.valueArt}
              aria-hidden="true"
            >
              <span>01</span>
            </div>

            <h3>Where we meet</h3>

            <p>
              152–154 Hessle Road, Hull, HU3 2AD.
            </p>
          </article>

          <article className={s.valueCard}>
            <div
              className={s.valueArt}
              aria-hidden="true"
            >
              <span>02</span>
            </div>

            <h3>When we gather</h3>

            <p>
              Sunday worship runs from 9:30 AM to 12:00 PM.
            </p>
          </article>

          <article className={s.valueCard}>
            <div
              className={s.valueArt}
              aria-hidden="true"
            >
              <span>03</span>
            </div>

            <h3>Everyone is welcome</h3>

            <p>
              Come as you are. Meet the family, worship
              with us and take your next step at your own
              pace.
            </p>
          </article>
        </div>
      </section>

      <VisitCallout />
    </PublicShell>
  );
}