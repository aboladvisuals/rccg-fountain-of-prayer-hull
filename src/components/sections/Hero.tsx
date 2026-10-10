import Link from "next/link";
import s from "@/components/public/public.module.css";
export default function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.heroGlow} aria-hidden="true" />
      <div className={[s.container, s.heroGrid].join(" ")}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>
            <span className={s.goldLine} /> WELCOME TO FOUNTAIN OF PRAYER HULL
          </p>
          <h1>
            Rooted in faith.
            <br />
            United in prayer.
            <br />
            <em>Welcome home.</em>
          </h1>
          <p className={s.heroDescription}>
            A Christ-centred family. A place to belong.
            <br />
            Discover a life of faith, purpose and connection.
          </p>
          <div className={s.actions}>
            <Link href="/plan-your-visit" className={s.buttonGold}>
              Plan your visit <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/about" className={s.heroTextLink}>
              Get to know us <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className={s.heroArt}>
          {/* Replace this decorative panel with an approved Hull photograph when ready. */}
          <div className={s.archOuter} aria-hidden="true">
            <div className={s.archInner}>
              <div className={s.lightCross} />
            </div>
          </div>
          <div className={s.artCaption}>
            <span>FAITH · PRAYER · COMMUNITY</span>
            <span>HULL, UNITED KINGDOM</span>
          </div>
        </div>
      </div>
      <div className={[s.container, s.heroBottom].join(" ")}>
        <span>THE REDEEMED CHRISTIAN CHURCH OF GOD</span>
        <a href="#about">
          Find your place <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
