import Image from "next/image";
import ParishMark from "./ParishMark";
import { OFFICIAL_RCCG_LOGO, OFFICIAL_RCCG_LOGO_ALT } from "@/lib/brand/official-logo";
import s from "./brand.module.css";

/**
 * Shared emblem: renders the authorised RCCG logo when it has been installed
 * (see src/lib/brand/official-logo.ts), otherwise the clearly-documented
 * placeholder ParishMark. On dark surfaces the official logo sits on a light
 * plate so its own colours stay correct and legible.
 */
export default function BrandEmblem({
  size = 40,
  surface = "light",
  className,
  decorative = true,
}: {
  size?: number;
  surface?: "light" | "dark";
  className?: string;
  /** Decorative when brand text sits next to it (avoids repeating the name). */
  decorative?: boolean;
}) {
  if (OFFICIAL_RCCG_LOGO) {
    const { src, width, height } = OFFICIAL_RCCG_LOGO;
    const scale = size / Math.max(width, height);
    return (
      <span className={[s.logoPlate, surface === "dark" ? s.logoPlateDark : "", className ?? ""].join(" ")} style={{ width: size, height: size }}>
        <Image
          src={src}
          width={Math.round(width * scale)}
          height={Math.round(height * scale)}
          alt={decorative ? "" : OFFICIAL_RCCG_LOGO_ALT}
          aria-hidden={decorative ? true : undefined}
          className={s.logoImg}
          unoptimized={src.endsWith(".svg")}
          priority
        />
      </span>
    );
  }
  return (
    <ParishMark
      size={size}
      tone={surface === "dark" ? "gold" : "plum"}
      className={className}
      data-brand="placeholder-emblem-not-official-rccg-logo"
    />
  );
}
