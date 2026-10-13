import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  ServiceCards,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";

export const metadata = {
  title: "Plan Your Visit | RCCG Fountain of Prayer Hull",
  description:
    "Plan your first visit to RCCG Fountain of Prayer Hull. Find our Sunday service time, location and helpful information before you arrive.",
};

const steps = [
  {
    number: "01",
    title: "Know where you’re going",
    copy:
      "We meet at 152–154 Hessle Road, Hull, HU3 2AD.",
  },
  {
    number: "02",
    title: "Join us on Sunday",
    copy:
      "Sunday worship runs from 9:30 AM to 12:00 PM.",
  },
  {
    number: "03",
    title: "Come as you are",
    copy:
      "There is no need to know everything beforehand. Arrive, settle in and experience the service at your own pace.",
  },
];

export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="YOUR FIRST VISIT"
        title="Come as you are. You’re welcome here."
      >
        <p>
          Whether you are new to church, new to Hull or
          simply visiting for the first time, we want your
          first Sunday with us to feel simple, relaxed and
          welcoming.
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
              BEFORE YOU ARRIVE
            </p>

            <h2>
              Three simple things
              <br />
              <em>to know first.</em>
            </h2>
          </div>
        </div>

        <div className={s.threeGrid}>
          {steps.map((step) => (
            <article
              key={step.number}
              className={s.valueCard}
            >
              <div
                className={s.valueArt}
                aria-hidden="true"
              >
                <span>{step.number}</span>
              </div>

              <h3>{step.title}</h3>

              <p>{step.copy}</p>
            </article>
          ))}
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
                SUNDAY AT FOUNTAIN OF PRAYER
              </p>

              <h2>
                Worship. Prayer.
                <br />
                <em>The Word. Fellowship.</em>
              </h2>
            </div>
          </div>

          <ServiceCards />
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
            FIND US
          </p>

          <h2>
            Your journey
            <br />
            <em>starts here.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            RCCG Fountain of Prayer Hull
            <br />
            152–154 Hessle Road
            <br />
            Hull, HU3 2AD
          </p>

          <p>
            Sunday worship begins at 9:30 AM and finishes
            at 12:00 PM.
          </p>

          <a
            href="https://www.google.com/maps/search/?api=1&query=152-154%20Hessle%20Road%20Hull%20HU3%202AD"
            target="_blank"
            rel="noopener noreferrer"
            className={s.buttonPlum}
          >
            Get directions ↗
          </a>
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
                HELPFUL TO KNOW
              </p>

              <h2>
                A few answers
                <br />
                <em>before Sunday.</em>
              </h2>
            </div>
          </div>

          <div className={s.faq}>
            <details>
              <summary>
                Do I need an account to visit?
              </summary>

              <p>
                No. You can attend church without creating
                a member account. Visitor check-in is
                available when you are already with us and
                want to let the welcome team know you have
                arrived.
              </p>
            </details>

            <details>
              <summary>
                What should I expect during the service?
              </summary>

              <p>
                Our Sunday gathering includes worship,
                prayer, Scripture, teaching and fellowship.
                You are welcome to participate at your own
                pace.
              </p>
            </details>

            <details>
              <summary>
                What about children and young people?
              </summary>

              <p>
                We are confirming the current details of
                children&apos;s and youth provision in
                Hull. Information will be added here once
                it is formally confirmed.
              </p>
            </details>

            <details>
              <summary>
                What about parking and accessibility?
              </summary>

              <p>
                We meet at 152–154 Hessle Road, Hull,
                HU3 2AD. Detailed parking, travel and
                accessibility guidance will be published
                here once it has been fully confirmed.
              </p>
            </details>

            <details>
              <summary>
                What should I wear?
              </summary>

              <p>
                Come in whatever you feel comfortable
                wearing. There is no special dress
                requirement for visitors.
              </p>
            </details>

            <details>
              <summary>
                Where do members sign in?
              </summary>

              <p>
                Existing members can use{" "}
                <Link
                  href="/login"
                  className={s.textLink}
                >
                  Member login
                </Link>{" "}
                to access their church account.
              </p>
            </details>
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
            ALREADY HERE TODAY?
          </p>

          <h2>
            Let us know
            <br />
            <em>you’ve arrived.</em>
          </h2>
        </div>

        <div className={s.bodyCopy}>
          <p>
            If you are visiting Fountain of Prayer Hull
            today, you can use our simple visitor check-in
            to let the welcome team know you are here.
          </p>

          <p>
            No member account is required.
          </p>

          <Link
            href="/visit"
            className={s.buttonPlum}
          >
            Visitor check-in ↗
          </Link>
        </div>
      </section>

      <section className={s.visitCallout}>
        <div
          className={[
            s.container,
            s.calloutInner,
          ].join(" ")}
        >
          <div>
            <p className={s.eyebrow}>
              QUESTIONS BEFORE YOU COME?
            </p>

            <h2>We’re happy to help.</h2>

            <p>
              Get in touch if there is anything you would
              like to ask before your visit.
            </p>
          </div>

          <Link
            href="/contact"
            className={s.buttonLight}
          >
            Contact us{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}