import PublicShell from "@/components/public/PublicShell";
import { PageIntro, VisitCallout } from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";
export const metadata = {
  title: "Our church | Fountain of Prayer Hull",
  description:
    "We are RCCG Fountain of Prayer Hull, a Christ-centred family and part of the Redeemed Christian Church of God.",
};
export default function Page() {
  return (
    <PublicShell>
      <PageIntro label="OUR CHURCH" title="A place to belong. A faith to grow.">
        <p>
          We are RCCG Fountain of Prayer Hull, a Christ-centred family and part
          of the Redeemed Christian Church of God.
        </p>
      </PageIntro>
      <section className={[s.container, s.section, s.aboutGrid].join(" ")}>
        <div>
          <p className={s.eyebrow}>AT THE HEART OF IT ALL</p>
          <h2>
            Prayer. Worship.
            <br />
            <em>Life together.</em>
          </h2>
        </div>
        <div className={s.bodyCopy}>
          <p>
            Our life as a church is centred on Jesus Christ. Through prayer, the
            Bible, worship and fellowship, we seek to grow in faith and reflect
            His love in everyday life.
          </p>
          <p>
            You don’t need to have every answer to begin the journey. There is
            room to explore, to ask questions and to grow alongside others.
          </p>
        </div>
      </section>
      <section className={s.softSection}>
        <div className={[s.container, s.section].join(" ")}>
          <p className={s.eyebrow}>OUR FOUNDATION</p>
          <h2>
            Jesus Christ, the same
            <br />
            <em>yesterday, today and forever.</em>
          </h2>
          <p className={s.notice}>Hebrews 13:8</p>
          <div className={s.bodyCopy}>
            <p>
              Our Hull pastoral leadership: Pastor Olubunmi Akintujoye and
              Pastor Olufunmi Akintujoye.
            </p>
          </div>
        </div>
      </section>
      <VisitCallout />
    </PublicShell>
  );
}
