import PublicShell from "@/components/public/PublicShell";
import { PageIntro, VisitCallout } from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";
export const metadata = {
  title: "Contact & location | Fountain of Prayer Hull",
  description:
    "Find your way to Fountain of Prayer Hull and connect with our church community.",
};
export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="CONTACT & LOCATION"
        title="We look forward to meeting you."
      >
        <p>
          Find your way to Fountain of Prayer Hull and connect with our church
          community.
        </p>
      </PageIntro>
      <section className={[s.container, s.section, s.aboutGrid].join(" ")}>
        <div>
          <p className={s.eyebrow}>FOUNTAIN OF PRAYER HULL</p>
          <h2>
            A warm welcome
            <br />
            <em>starts here.</em>
          </h2>
          <div className={s.bodyCopy} style={{ marginTop: 24 }}>
            <p>
              Join us for Sunday service from 10:00am to 12:30pm at 152–154
              Hessle Road, Hull, HU3 3AD. We look forward to welcoming you.
            </p>
          </div>
        </div>
        <div className={s.detailList}>
          <div>
            <h3>Visit us</h3>
            <p>
              152–154 Hessle Road
              <br />
              Hull, HU3 3AD
            </p>
            <a
              className={s.textLink}
              href="https://www.google.com/maps/search/?api=1&amp;query=152-154%20Hessle%20Road%20Hull%20HU3%203AD"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions (opens a new tab) ↗
            </a>
          </div>
          <div>
            <h3>Get in touch</h3>
            <p>Church email and telephone details coming soon.</p>
          </div>
          <div>
            <h3>Stay connected</h3>
            <p>
              Official Hull social channels will be shared here once confirmed.
            </p>
          </div>
        </div>
      </section>
      <VisitCallout />
    </PublicShell>
  );
}
