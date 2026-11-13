/**
 * Official RCCG logo slot.
 *
 * No authorised RCCG logo file exists in this repository (checked on every
 * branch, 13 Nov 2026), so this is null and the site shows the ORIGINAL
 * placeholder emblem (ParishMark), which is NOT the RCCG logo.
 *
 * To install the authorised logo supplied by the church:
 *   1. Save the file exactly as  public/brand/rccg-logo.svg  (preferred)
 *      or  public/brand/rccg-logo.png  (transparent, at least 512 x 512 px).
 *   2. Set OFFICIAL_RCCG_LOGO below, e.g.
 *        { src: "/brand/rccg-logo.svg", width: 512, height: 512 }
 *      using the file's real pixel size so it is never stretched.
 *   3. Run `node --test tests/*.test.cjs` (the brand test checks the file exists).
 * Do not trace, redraw, recolour or download a substitute.
 */
export type OfficialLogo = { src: `/brand/rccg-logo.${"svg" | "png"}`; width: number; height: number };

export const OFFICIAL_RCCG_LOGO: OfficialLogo | null = null;

export const OFFICIAL_RCCG_LOGO_ALT = "The Redeemed Christian Church of God logo";
