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

const DIRECTIONS =
  "https://www.google.com/maps/search/?api=1&query=152-154%20Hessle%20Road%20Hull%20HU3%202AD";

const lifeTogether = [
  ["01", "Grow in faith", "Make room for Scripture, prayer and a deeper walk with Christ."],
  ["02", "Find your people", "Build genuine relationships through fellowship, care and shared life."],
  ["03", "Live with purpose", "Use your gifts to serve others and make the love of Christ visible."],
];

export default function Home() {
  return (
    <PublicShell>
      <Hero />

      <section className={s.scripture} aria-label="Our unchanging foundation">
        <div className={[s.container, s.reveal].join(" ")}>
          <span className={s.eyebrow}>Our unchanging foundation</span>
          <blockquote>
            <p>“Jesus Christ is the same yesterday and today and forever.”</p>
          </blockquote>
          <span className={s.verse}>Hebrews 13:8</span>
        </div>
      </section>

      <section
        id="welcome"
        className={[s.container, s.section, s.aboutGrid].join(" ")}
      >
        <div className={s.reveal}>
          <p className={s.eyebrow}>A church. A family. A home.</p>
          <h2>
            A place to belong.
            <br />
            <em>A faith to live.</em>
          </h2>
        </div>

        <div className={[s.bodyCopy, s.reveal].join(" ")}>
          <p className={s.lead}>
            RCCG Fountain of Prayer Hull is a Christ-centred church family where
            people can worship freely, grow in the Word, pray together and build
            meaningful relationships.
          </p>
          <p>
            Whether you are discovering faith, returning to church, new to Hull
            or simply looking for a spiritual home, there is room for you here.
          </p>
          <Link className={s.textLink} href="/about">
            Discover our church <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className={s.softSection} aria-labelledby="sunday-heading">
        <div className={[s.container, s.section].join(" ")}>
          <div className={[s.sectionHeading, s.reveal].join(" ")}>
            <div>
              <p className={s.eyebrow}>This Sunday</p>
              <h2 id="sunday-heading">
                Come as you are.
                <br />
                <em>Leave strengthened.</em>
              </h2>
            </div>
            <Link className={s.textLink} href="/plan-your-visit">
              Plan your first visit <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className={s.bento}>
            <article className={[s.bentoCell, s.bentoFeature, s.reveal].join(" ")}>
              <span className={s.bentoKicker}>Sunday worship</span>
              <p className={s.bentoTime}>
                9:30 <small>AM</small>
                <span aria-hidden="true" className={s.bentoDash}>–</span>
                <span className={s.srOnly}> to </span>
                12:00 <small>PM</small>
              </p>
              <p>
                Join us every Sunday for worship, prayer, the Word and
                fellowship.
              </p>
              <Link href="/services" className={s.bentoLink}>
                Our services <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className={[s.bentoCell, s.bentoPlace, s.reveal].join(" ")}>
              <span className={s.bentoKicker}>In the heart of Hull</span>
              <h3>152–154 Hessle Road</h3>
              <p>Hull, HU3 2AD</p>
              <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={s.bentoLink}>
                Get directions<span className={s.srOnly}> (opens Google Maps in a new tab)</span>{" "}
                <span aria-hidden="true">↗</span>
              </a>
            </article>

            <article className={[s.bentoCell, s.reveal].join(" ")}>
              <span className={s.bentoKicker}>Your first visit</span>
              <h3>No pressure, just welcome.</h3>
              <p>
                There is no need to know everything beforehand. Come, meet the
                family and experience church with us.
              </p>
              <Link href="/plan-your-visit" className={s.bentoLink}>
                What to expect <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className={[s.bentoCell, s.reveal].join(" ")}>
              <span className={s.bentoKicker}>Already here today?</span>
              <h3>Say hello to the welcome team.</h3>
              <p>Visitor check-in takes a moment and needs no account.</p>
              <Link href="/visit" className={s.bentoLink}>
                Visitor check-in <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="services" className={[s.container, s.section].join(" ")}>
        <div className={[s.sectionHeading, s.reveal].join(" ")}>
          <div>
            <p className={s.eyebrow}>Gather with us</p>
            <h2>
              Worship together.
              <br />
              <em>Grow together.</em>
            </h2>
          </div>
          <Link className={s.textLink} href="/services">
            Explore our services <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ServiceCards />
      </section>

      <section id="ministries" className={s.softSection}>
        <div className={[s.container, s.section].join(" ")}>
          <div className={[s.sectionHeading, s.reveal].join(" ")}>
            <div>
              <p className={s.eyebrow}>Life together</p>
              <h2>
                Church is more
                <br />
                <em>than a Sunday.</em>
              </h2>
            </div>
            <Link className={s.textLink} href="/ministries">
              Explore church life <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className={s.threeGrid}>
            {lifeTogether.map(([number, title, copy]) => (
              <article key={number} className={[s.valueCard, s.reveal].join(" ")}>
                <div className={s.valueArt} aria-hidden="true">
                  <span>{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className={[s.container, s.section].join(" ")}>
        <div className={[s.sectionHeading, s.reveal].join(" ")}>
          <div>
            <p className={s.eyebrow}>Gather. Celebrate. Connect.</p>
            <h2>
              Moments that bring
              <br />
              <em>the family together.</em>
            </h2>
          </div>
          <Link href="/events" className={s.textLink}>
            View events <span aria-hidden="true">→</span>
          </Link>
        </div>
        <EventEmpty />
      </section>

      <section className={s.softSection}>
        <div className={[s.container, s.section, s.aboutGrid].join(" ")}>
          <div className={s.reveal}>
            <p className={s.eyebrow}>New here?</p>
            <h2>
              Your seat is waiting.
              <br />
              <em>We would love to meet you.</em>
            </h2>
          </div>
          <div className={[s.bodyCopy, s.reveal].join(" ")}>
            <p className={s.lead}>
              Visiting a church for the first time can feel unfamiliar. We want
              your first Sunday with us to feel simple, welcoming and relaxed.
            </p>
            <p>
              Find our location, service time and the information you need
              before you arrive.
            </p>
            <Link className={s.textLink} href="/plan-your-visit">
              Plan your visit <span aria-hidden="true">→</span>
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
