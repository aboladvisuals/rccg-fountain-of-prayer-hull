import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
  EventEmpty,
  ServiceCards,
  VisitCallout,
} from "@/components/public/PublicContent";
import Hero from "@/components/sections/Hero";
import s from "@/components/public/public.module.css";

export const metadata = {
  title: "RCCG Fountain of Prayer Hull | Welcome Home",
  description:
    "RCCG Fountain of Prayer Hull is a Christ-centred church family growing through worship, prayer, fellowship and service. Join us Sundays at 9:30 AM in Hull.",
};

export default function Home() {
  return (
    <PublicShell>
      <Hero />

      <section className={s.scripture}>
        <div className={s.container}>
          <span className={s.eyebrow}>
            OUR UNCHANGING FOUNDATION
          </span>

          <p>
            “Jesus Christ is the same yesterday and today
            and forever.”
          </p>

          <span className={s.verse}>
            HEBREWS 13:8
          </span>
        </div>
      </section>

      <section
        id="about"
        className={[
          s.container,
          s.section,
          s.aboutGrid,
        ].join(" ")}
      >
        <div>
          <p className={s.eyebrow}>
            A CHURCH. A FAMILY. A HOME.
          </p>

          <h2>
            A place to belong.
            <br />
            <em>A faith to live.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            RCCG Fountain of Prayer Hull is a
            Christ-centred church family where people can
            worship freely, grow in the Word, pray
            together and build meaningful relationships.
          </p>

          <p>
            Whether you are discovering faith, returning
            to church, new to Hull or simply looking for a
            spiritual home, there is room for you here.
          </p>

          <Link
            className={s.textLink}
            href="/about"
          >
            Discover our church{" "}
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
                THIS SUNDAY
              </p>

              <h2>
                Come as you are.
                <br />
                <em>Leave strengthened.</em>
              </h2>
            </div>

            <Link
              className={s.textLink}
              href="/plan-your-visit"
            >
              Plan your first visit ↗
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

              <h3>Sunday worship</h3>

              <p>
                Join us from 9:30 AM to 12:00 PM for
                worship, prayer, the Word and fellowship.
              </p>
            </article>

            <article className={s.valueCard}>
              <div
                className={s.valueArt}
                aria-hidden="true"
              >
                <span>02</span>
              </div>

              <h3>In the heart of Hull</h3>

              <p>
                152–154 Hessle Road, Hull, HU3 2AD.
              </p>
            </article>

            <article className={s.valueCard}>
              <div
                className={s.valueArt}
                aria-hidden="true"
              >
                <span>03</span>
              </div>

              <h3>Your first visit</h3>

              <p>
                No pressure and no need to know everything
                beforehand. Come, meet the family and
                experience church with us.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="services"
        className={[
          s.container,
          s.section,
        ].join(" ")}
      >
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>
              GATHER WITH US
            </p>

            <h2>
              Worship together.
              <br />
              <em>Grow together.</em>
            </h2>
          </div>

          <Link
            className={s.textLink}
            href="/services"
          >
            Explore our services ↗
          </Link>
        </div>

        <ServiceCards />
      </section>

      <section
        id="ministries"
        className={s.softSection}
      >
        <div
          className={[
            s.container,
            s.section,
          ].join(" ")}
        >
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>
                LIFE TOGETHER
              </p>

              <h2>
                Church is more
                <br />
                <em>than a Sunday.</em>
              </h2>
            </div>

            <Link
              className={s.textLink}
              href="/ministries"
            >
              Explore church life ↗
            </Link>
          </div>

          <div className={s.threeGrid}>
            {[
              [
                "01",
                "Grow in faith",
                "Make room for Scripture, prayer and a deeper walk with Christ.",
              ],
              [
                "02",
                "Find your people",
                "Build genuine relationships through fellowship, care and shared life.",
              ],
              [
                "03",
                "Live with purpose",
                "Use your gifts to serve others and make the love of Christ visible.",
              ],
            ].map(([number, title, copy]) => (
              <article
                key={number}
                className={s.valueCard}
              >
                <div
                  className={s.valueArt}
                  aria-hidden="true"
                >
                  <span>{number}</span>
                </div>

                <h3>{title}</h3>

                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="events"
        className={[
          s.container,
          s.section,
        ].join(" ")}
      >
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>
              GATHER. CELEBRATE. CONNECT.
            </p>

            <h2>
              Moments that bring
              <br />
              <em>the family together.</em>
            </h2>
          </div>

          <Link
            href="/events"
            className={s.textLink}
          >
            View events ↗
          </Link>
        </div>

        <EventEmpty />
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
              NEW HERE?
            </p>

            <h2>
              Your seat is waiting.
              <br />
              <em>We would love to meet you.</em>
            </h2>
          </div>

          <div className={s.bodyCopy}>
            <p>
              Visiting a church for the first time can feel
              unfamiliar. We want your first Sunday with us
              to feel simple, welcoming and relaxed.
            </p>

            <p>
              Find our location, service time and the
              information you need before you arrive.
            </p>

            <Link
              className={s.textLink}
              href="/plan-your-visit"
            >
              Plan your visit{" "}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <div id="contact">
        <VisitCallout />
      </div>
    </PublicShell>
  );
}