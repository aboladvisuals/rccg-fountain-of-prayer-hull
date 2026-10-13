import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  VisitCallout,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";

export const metadata = {
  title: "Contact & Location | RCCG Fountain of Prayer Hull",
  description:
    "Contact RCCG Fountain of Prayer Hull, find our location on Hessle Road and get the information you need before your visit.",
};

export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="CONTACT & LOCATION"
        title="We look forward to meeting you."
      >
        <p>
          Find your way to Fountain of Prayer Hull,
          get in touch with the church and plan your
          first visit with confidence.
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
            FOUNTAIN OF PRAYER HULL
          </p>

          <h2>
            A warm welcome
            <br />
            <em>starts here.</em>
          </h2>

          <div
            className={s.bodyCopy}
            style={{ marginTop: 24 }}
          >
            <p>
              Join us every Sunday from 9:30 AM to
              12:00 PM at 152–154 Hessle Road,
              Hull, HU3 2AD.
            </p>

            <p>
              Whether you are visiting for the first time,
              returning to church or looking for a church
              family in Hull, we would love to welcome you.
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

        <div className={s.detailList}>
          <div>
            <h3>Visit us</h3>

            <p>
              152–154 Hessle Road
              <br />
              Hull, HU3 2AD
            </p>

            <a
              className={s.textLink}
              href="https://www.google.com/maps/search/?api=1&query=152-154%20Hessle%20Road%20Hull%20HU3%202AD"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions ↗
            </a>
          </div>

          <div>
            <h3>Sunday service</h3>

            <p>
              Every Sunday
              <br />
              9:30 AM–12:00 PM
            </p>
          </div>

          <div>
            <h3>Email us</h3>

            <p>
              <a
  className={s.textLink}
  href="https://mail.google.com/mail/?view=cm&fs=1&to=rccgfountainofprayerhull@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
>
  rccgfountainofprayerhull@gmail.com ↗
</a>
            </p>
          </div>

          <div>
            <h3>Call us</h3>

            <p>
              <a
                className={s.textLink}
                href="tel:0793686378"
              >
                0793686378
              </a>
            </p>
          </div>

          <div>
            <h3>Stay connected</h3>

            <p>
              Follow RCCG Fountain of Prayer Hull on
              Facebook for church updates and announcements.
            </p>

            <a
              className={s.textLink}
              href="https://www.facebook.com/share/18FGcTEdLZ/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit our Facebook page ↗
            </a>
          </div>

          <div>
            <h3>New here?</h3>

            <p>
              We have a simple first-visit guide to help
              you know what to expect before you arrive.
            </p>

            <Link
              className={s.textLink}
              href="/plan-your-visit"
            >
              First-visit information ↗
            </Link>
          </div>
        </div>
      </section>

      <VisitCallout />
    </PublicShell>
  );
}