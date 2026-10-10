import Link from "next/link";
import PublicShell from "@/components/public/PublicShell";
import { PageIntro, ServiceCards } from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";
export const metadata = {
  title: "Your first visit | Fountain of Prayer Hull",
  description:
    "Whether you’re new to church or simply new to Hull, we look forward to welcoming you to Fountain of Prayer.",
};
export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="YOUR FIRST VISIT"
        title="Come as you are. You’re welcome here."
      >
        <p>
          Whether you’re new to church or simply new to Hull, we look forward to
          welcoming you to Fountain of Prayer.
        </p>
      </PageIntro>
      <section className={[s.container, s.section].join(" ")}>
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>LET’S HELP YOU FEEL AT HOME</p>
            <h2>A simple place to start.</h2>
          </div>
        </div>
        <ServiceCards />
        <p className={s.notice}>
          Find us at 152–154 Hessle Road, Hull, HU3 3AD. Join us on Sunday from
          10:00am to 12:30pm. Midweek service starts at 8:00pm; please check
          back for the confirmed day.
        </p>
        <div className={s.faq}>
          <h2>A few helpful things.</h2>
          <details>
            <summary>Do I need an account to visit?</summary>
            <p>
              No. You can visit without creating a member account. If you’re
              already at church, our visitor check-in lets you let the welcome
              team know you’re here.
            </p>
          </details>
          <details>
            <summary>What about children and young people?</summary>
            <p>
              We’re confirming the details of children’s and youth provision in
              Hull. Information will be added here when it is available.
            </p>
          </details>
          <details>
            <summary>
              Where can I find accessibility and parking information?
            </summary>
            <p>
              Our address is 152–154 Hessle Road, Hull, HU3 3AD. Detailed
              accessibility, parking and travel information is being confirmed.
            </p>
          </details>
          <details>
            <summary>Where do members sign in?</summary>
            <p>
              Use{" "}
              <Link href="/login" className={s.textLink}>
                Member login
              </Link>{" "}
              to access your existing church account.
            </p>
          </details>
        </div>
        <div className={s.notice}>
          <h3>Already with us today?</h3>
          <p style={{ marginBlock: 16 }}>
            Let the welcome team know you’ve arrived. No member account is
            required.
          </p>
          <Link href="/visit" className={s.buttonPlum}>
            Visitor check-in ↗
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
