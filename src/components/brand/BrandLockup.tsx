import ParishMark from "./ParishMark";
import s from "./brand.module.css";

/** "Fountain of Prayer · RCCG Hull" lockup shared by every surface. */
export default function BrandLockup({
  tone = "dark",
  compact = false,
}: {
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  return (
    <span className={[s.lockup, tone === "light" ? s.light : s.dark, compact ? s.compact : ""].join(" ")}>
      <ParishMark size={compact ? 34 : 40} tone={tone === "light" ? "gold" : "plum"} className={s.mark} />
      <span className={s.words}>
        <span className={s.name}>Fountain of Prayer</span>
        <span className={s.sub}>RCCG · Hull</span>
      </span>
    </span>
  );
}
