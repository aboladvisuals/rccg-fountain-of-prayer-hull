/**
 * Parish emblem for Fountain of Prayer Hull.
 *
 * An original decorative mark (sanctuary arch, rising light, fountain ripples).
 * It is NOT the official RCCG logo. No authorised RCCG logo file exists in this
 * repository yet; install it through src/lib/brand/official-logo.ts and the
 * shared BrandEmblem component will use it everywhere instead of this mark.
 */
export default function ParishMark({
  size = 40,
  className,
  tone = "gold",
  ...rest
}: {
  size?: number;
  className?: string;
  tone?: "gold" | "plum" | "light";
  "data-brand"?: string;
}) {
  const stroke =
    tone === "plum" ? "#573479" : tone === "light" ? "#fff8ee" : "#d9b36a";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-brand={rest["data-brand"] ?? "placeholder-emblem-not-official-rccg-logo"}
    >
      <circle cx="24" cy="24" r="23" stroke={stroke} strokeOpacity="0.55" />
      <path
        d="M14 36V21.5C14 15.7 18.5 11 24 11s10 4.7 10 10.5V36"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M24 17.5c2.6 3.1 3.9 5.6 3.9 7.6a3.9 3.9 0 0 1-7.8 0c0-2 1.3-4.5 3.9-7.6Z"
        fill={stroke}
      />
      <path
        d="M17 33.2c2.1-1 4.4-1.5 7-1.5s4.9.5 7 1.5M19.5 36.4c1.4-.6 2.9-.9 4.5-.9s3.1.3 4.5.9"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
    </svg>
  );
}
