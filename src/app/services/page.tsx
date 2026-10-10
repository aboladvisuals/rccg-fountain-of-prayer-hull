import Link from "next/link";
import PublicShell from "@/components/public/PublicShell";
import {
  PageIntro,
  ServiceCards,
  VisitCallout,
} from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";
export const metadata = {
  title: "Gather with us | Fountain of Prayer Hull",
  description:
    "Make space for worship, prayer and the Word. Find out about gathering with Fountain of Prayer Hull.",
};
export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="GATHER WITH US"
        title="Time with God. Life with one another."
      >
        <p>
          Make space for worship, prayer and the Word. Find out about gathering
          with Fountain of Prayer Hull.
        </p>
      </PageIntro>
      <section className={[s.container, s.section].join(" ")}>
        <ServiceCards />
        <p className={s.notice}>
          Join us at 152–154 Hessle Road, Hull, HU3 3AD. Sunday service is
          10:00am–12:30pm. Our midweek service begins at 8:00pm; the day will be
          confirmed here.
        </p>
        <Link href="/plan-your-visit" className={s.buttonPlum}>
          Your first visit ↗
        </Link>
      </section>
      <VisitCallout />
    </PublicShell>
  );
}
