# Sanctuary Light — design system notes

Branch: `design/premium-experience-20261112` (review only, not deployed).

## Tokens (src/app/globals.css `@theme`)
- **Royal plum** (`purple-*`, remapped): 50 `#f6f2fa` … 700 `#573479` … 950 `#1f1330`.
- **Warm stone** (`slate-*`, remapped): 50 `#f7f4ef` … 600 `#5b554d` … 950 `#120f0d`.
- **Gold**: 300 `#e6cb91`, 500 `#c39a4e`, 700 `#7c5e27`. **Ink**: 950 `#0e0a14`. **Water**: 400 `#7fc4d4`.
- Type: Fraunces (display, `--font-display`) + Inter (UI, `--font-sans`) via `next/font`.
- Radii: sm .5rem → 3xl 1.75rem. Shadows xs–lg. Easing `--ease-out` cubic-bezier(.22,1,.36,1).
- Durations 160 / 260 / 640 ms. Focus ring 3px `#b5813a`.

Because `purple-*` and `slate-*` are remapped, existing utility markup inherits the palette.

## Components
- Public: `Header` (glass, mobile sheet), `Hero` + `HeroMotion` (pointer tilt, pause toggle), `PublicShell`, `PageIntro`.
- Brand: `ParishMark` / `BrandLockup` — an ORIGINAL placeholder emblem, **not** the official RCCG logo.
- Auth: `AuthShell` (split cinematic panel + card).
- Signed-in: `AppFrame` + `AppNav` (`navigation.ts`), `ToolCard`, `Icon`, `ActionForm`.
- Utility classes: `.app-page`, `.app-hero`, `.app-card`, `.btn-primary`, `.btn-secondary`, `.kicker`,
  `.section-title`, `.stat-value`, `.chip`, `.chip-live`, `.skeleton`, `.reveal`.

## Motion
All decorative motion is CSS, disabled by `prefers-reduced-motion: reduce`, and ambient hero motion has a
visible pause control. Content is visible without animation support.

## Official logo slot
Place an authorised RCCG logo file in `public/brand/` and swap it into `BrandLockup`. Do not trace or
recreate the logo.

## Photography
No congregation photography is used. Art direction is CSS-only until the church supplies consented photos.

## Review 4 integration
If `ui/approved-review4` exists, diff its tokens/components against this file and port approved choices
into `globals.css` tokens first, then components, on a separate branch. Never overwrite either branch.
