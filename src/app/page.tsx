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
  title: "RCCG Fountain of Prayer Hull | Welcome home",
  description:
    "A Christ-centred community in Hull, growing in faith, prayer and fellowship. Get to know Fountain of Prayer and plan your first visit.",
};
export default function Home() {
  return (
    <PublicShell>
      <Hero />
      <section className={s.scripture}>
        <div className={s.container}>
          <span className={s.eyebrow}>OUR UNCHANGING FOUNDATION</span>
          <p>“Jesus Christ is the same yesterday and today and forever.”</p>
          <span className={s.verse}>HEBREWS 13:8</span>
        </div>
      </section>
      <section
        id="about"
        className={[s.container, s.section, s.aboutGrid].join(" ")}
      >
        <div>
          <p className={s.eyebrow}>A CHURCH. A FAMILY. A HOME.</p>
          <h2>
            Faith for every day.
            <br />
            <em>Room for everyone.</em>
          </h2>
        </div>
        <div className={s.bodyCopy}>
          <p>
            Welcome to RCCG Fountain of Prayer Hull. We are a Christ-centred
            family growing through prayer, worship, fellowship and service.
          </p>
          <p>
            Whether you are exploring faith, returning to church or looking for
            a place to grow, we would love to welcome you.
          </p>
          <Link className={s.textLink} href="/about">
            Discover our church <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section id="services" className={s.softSection}>
        <div className={[s.container, s.section].join(" ")}>
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>GATHER WITH US</p>
              <h2>
                A little space.
                <br />
                <em>A deeper connection.</em>
              </h2>
            </div>
            <Link className={s.textLink} href="/services">
              Explore our services ↗
            </Link>
          </div>
          <ServiceCards />
        </div>
      </section>
      <section id="ministries" className={[s.container, s.section].join(" ")}>
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>LIFE TOGETHER</p>
            <h2>More than a Sunday.</h2>
          </div>
          <Link className={s.textLink} href="/ministries">
            Faith & community ↗
          </Link>
        </div>
        <div className={s.threeGrid}>
          {[
            [
              "01",
              "Grow in faith",
              "Make space for the Word, for prayer and for the questions that help faith grow.",
            ],
            [
              "02",
              "Find connection",
              "Share the journey. Build relationships centred on fellowship and care.",
            ],
            [
              "03",
              "Live with purpose",
              "Let the love of Christ shape how we serve and encourage the people around us.",
            ],
          ].map(([number, title, copy]) => (
            <article key={number} className={s.valueCard}>
              <div className={s.valueArt} aria-hidden="true">
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="events" className={s.softSection}>
        <div className={[s.container, s.section].join(" ")}>
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>WHAT’S ON</p>
              <h2>Make room for community.</h2>
            </div>
            <Link href="/events" className={s.textLink}>
              View events ↗
            </Link>
          </div>
          <EventEmpty />
        </div>
      </section>
      <div id="contact">
        <VisitCallout />
      </div>
    </PublicShell>
  );
}
