import Link from "next/link";
import ParishMark from "@/components/brand/ParishMark";
import s from "@/components/public/public.module.css";
import { MotionToggle, TiltStage } from "./HeroMotion";

const DIRECTIONS =
  "https://www.google.com/maps/search/?api=1&query=152-154%20Hessle%20Road%20Hull%20HU3%202AD";

export default function Hero() {
  return (
    <section className={s.hero} data-motion-root data-paused="false" aria-labelledby="hero-title">
      <div className={s.heroSky} aria-hidden="true">
        <span className={s.heroLightA} />
        <span className={s.heroLightB} />
        <span className={s.heroLightC} />
        <span className={s.heroGrain} />
      </div>

      <div className={[s.container, s.heroGrid].join(" ")}>
        <div className={s.heroCopy}>
          <p className={[s.heroEyebrow, s.enter1].join(" ")}>
            <span className={s.goldLine} /> The Redeemed Christian Church of God
          </p>

          <h1 id="hero-title" className={[s.heroTitle, s.enter2].join(" ")}>
            <span className={s.heroTitleMain}>Fountain of Prayer</span>
            <span className={s.heroTitleCity}>
              <span className={s.heroRule} aria-hidden="true" />
              Hull
            </span>
          </h1>

          <p className={[s.heroTagline, s.enter3].join(" ")}>
            Rooted in faith. United in prayer. <em>Welcome home.</em>
          </p>

          <p className={[s.heroDescription, s.enter3].join(" ")}>
            A Christ-centred family. A place to belong. Discover a life of
            faith, purpose and connection in the heart of Hull.
          </p>

          <div className={[s.actions, s.enter4].join(" ")}>
            <Link href="/plan-your-visit" className={s.buttonGold}>
              Plan your visit <span aria-hidden="true">→</span>
            </Link>
            <Link href="/about" className={s.buttonGhost}>
              Get to know us
            </Link>
          </div>

          <dl className={[s.heroFacts, s.enter5].join(" ")}>
            <div>
              <dt>Sunday worship</dt>
              <dd>9:30 AM – 12:00 PM</dd>
            </div>
            <div>
              <dt>Where we meet</dt>
              <dd>
                152–154 Hessle Road, Hull HU3 2AD{" "}
                <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer">
                  Directions<span className={s.srOnly}> (opens Google Maps in a new tab)</span>{" "}
                  <span aria-hidden="true">↗</span>
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className={s.heroArt} aria-hidden="true">
          <TiltStage>
            <div className={s.sanctuary}>
              <div className={[s.arch, s.archBack].join(" ")} />
              <div className={[s.arch, s.archMid].join(" ")} />
              <div className={[s.arch, s.archFront].join(" ")}>
                <div className={s.archWindow}>
                  <span className={s.rays} />
                  <span className={s.lightCross} />
                </div>
              </div>
              <div className={s.ripples}>
                <span />
                <span />
                <span />
              </div>
              <div className={[s.floatCard, s.floatScripture].join(" ")}>
                <span className={s.floatKicker}>Hebrews 13:8</span>
                <span className={s.floatQuote}>
                  “Jesus Christ is the same yesterday and today and forever.”
                </span>
              </div>
              <div className={[s.floatCard, s.floatBadge].join(" ")}>
                <ParishMark size={30} tone="gold" />
                <span>
                  <strong>Faith · Prayer · Community</strong>
                  Hull, United Kingdom
                </span>
              </div>
            </div>
          </TiltStage>
        </div>
      </div>

      <div className={[s.container, s.heroBottom].join(" ")}>
        <a href="#welcome" className={s.scrollCue}>
          <span className={s.scrollLine} aria-hidden="true" />
          Find your place
        </a>
        <MotionToggle />
      </div>
    </section>
  );
}
