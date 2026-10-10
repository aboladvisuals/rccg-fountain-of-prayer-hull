# Public site redesign

## Scope

- Homepage, shared public header/footer, About, Services, Ministries, Events,
  Contact, and Plan Your Visit.
- Visitor check-in receives the public shell and presentation changes only.
  Its action, input names, consent defaults, validation and submission flow remain intact.
- Member/family, pastor/admin, display, service-management, auth, proxy,
  Supabase clients and database policies are unchanged.
- The existing Tailwind loader is now limited to `globals.css`. The previous
  `*.css` rule renamed CSS Modules to plain CSS, producing empty class exports.
  The global stylesheet and its Tailwind pipeline are unchanged.

## Confirmed by the project owner

- 152–154 Hessle Road, Hull, HU3 3AD.
- Sunday service: 10:00am–12:30pm.
- Midweek service: 8:00pm; day not yet supplied.
- Pastor Olubunmi Akintujoye and Pastor Olufunmi Akintujoye.

## Still needed

Midweek day; church phone/email; official Hull social links; active ministry
groups and children's/youth provision; accessibility and parking details;
approved event details; approved Hull photographs.

Unconfirmed items have explicit, visitor-facing coming-soon wording. There are
no fabricated events, testimonials, leadership biographies or social links.
The public events empty state is editorial, not connected to private service
or announcement records. No additional Supabase permissions are needed.

## Design and photographs

Plum, ivory and warm gold; serif headings; responsive navigation with active
page indication, Escape dismissal, focus styling and a skip link. Hover motion
respects reduced-motion preferences. Public styling is scoped with CSS Modules.

The arch in `Hero.tsx` and the decorative panels on the homepage are the future
photo positions. Replace only their decorative interiors with approved images,
preserving their dimensions; provide meaningful alt text for informative photos.
The small star is a decorative brand treatment, not an official RCCG logo.

London benchmark: https://www.rccgfountainofprayer.com/ — used for broad structure
(welcome, faith, services, community, events, visitor information), not copied
content or Hull facts.

## Verification

- Production build and TypeScript checking.
- ESLint.
- Existing 33 auth/member/session regression tests.
- Browser checks of desktop/mobile rendering, menu expansion and Escape,
  public navigation, visit guidance, and check-in form presentation.
- Preview uses placeholder local Supabase configuration. It does not verify
  real sign-in, authenticated dashboards, RLS or live check-in writes.
- Before release, review the preview and run the existing production sign-in,
  member/family, pastor/admin and display smoke checks with authorized accounts.
