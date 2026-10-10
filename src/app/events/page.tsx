import Link from "next/link";
import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  VisitCallout,
  EventEmpty,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";
export const metadata = {
  title: "What’s on | Fountain of Prayer Hull",
  description:
    "Discover upcoming gatherings and opportunities to share life with Fountain of Prayer Hull.",
};
export default function Page() {
  return (
    <PublicShell>
      <PageIntro label="WHAT’S ON" title="Gather. Connect. Be encouraged.">
        <p>
          Discover upcoming gatherings and opportunities to share life with
          Fountain of Prayer Hull.
        </p>
      </PageIntro>
      <section className={[s.container, s.section].join(" ")}>
        <EventEmpty />
        <div className={s.bodyCopy} style={{ marginTop: 32 }}>
          <p>Looking for our regular gatherings?</p>
          <Link href="/services" className={s.textLink}>
            Explore our services ↗
          </Link>
        </div>
      </section>
      <VisitCallout />
    </PublicShell>
  );
}
