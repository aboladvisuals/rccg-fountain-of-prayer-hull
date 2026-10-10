import PublicShell from "@/components/public/PublicShell";
import { PageIntro, VisitCallout } from "@/components/public/PublicContent";
import s from "@/components/public/public.module.css";
export const metadata = {
  title: "Life together | Fountain of Prayer Hull",
  description:
    "Faith is lived beyond a service: in the way we pray, care for each other and serve the people around us.",
};
export default function Page() {
  return (
    <PublicShell>
      <PageIntro
        label="LIFE TOGETHER"
        title="Find connection. Grow with purpose."
      >
        <p>
          Faith is lived beyond a service: in the way we pray, care for each
          other and serve the people around us.
        </p>
      </PageIntro>
      <section className={[s.container, s.section].join(" ")}>
        <div className={s.threeGrid}>
          {[
            [
              "Prayer",
              "Make space to seek God, give thanks and bring the needs of others before Him.",
            ],
            [
              "Fellowship",
              "Encourage one another and build relationships rooted in faith and care.",
            ],
            [
              "Service",
              "Put faith into practice through kindness, generosity and a willingness to help.",
            ],
          ].map(([title, copy]) => (
            <article className={s.serviceCard} key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <p className={s.notice}>
          Information about Hull’s ministry groups, children’s and youth
          provision, and volunteering opportunities will be added once
          confirmed.
        </p>
      </section>
      <VisitCallout />
    </PublicShell>
  );
}
