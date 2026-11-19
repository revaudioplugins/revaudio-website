# The cookie banner on a sideways phone: a layout fix for Yoni

Written 2026-11-18 by the WIDE BEAM build (lane A). `src/components/CookieBanner.astro` is Yoni's component
(`tasks/lessons.md` 2026-10-07: Yoni owns the consent text), so nothing here touches it. This note gives the bug, the
measurements and a proposed CSS block. The wording stays exactly as it is.

## What breaks

On a phone held sideways (for example 844 x 390), the banner fills more than the whole screen. That is the first
thing every sideways visitor sees, on every page of the site.

- The screen is wider than 640 px, so the banner uses its **desktop** layout. That layout has a 2rem title with a
  200 px left margin, the long consent text, and both keys in one row.
- The text column is squeezed to about **80 px**, one or two words per line. The banner grows to **625 px** in a
  390 px screen, so its top sits at **-235 px**: the heading and most of the text are above the screen.
- The keys can still be reached (they sit near y 58), but the visitor can't read what they are agreeing to.
- It is site-wide: `/drift` and `/` measure the same. Findings hero-08 and mobile-14 in the WIDE BEAM plan.

## Measured (dev server, cookie banner fresh, Playwright, 2026-11-18)

Banner height and top, today versus the proposal below. The proposal was injected as a style tag;
`CookieBanner.astro` was not changed.

| Screen | Engine | Page | Today: height / top | Proposed: height / top | Text width, today -> proposed |
|---|---|---|---|---|---|
| 844 x 390 (iPhone 14-ish, sideways) | WebKit | /widebeam, /drift | 625 / -235 | 64 / 326 | 80 -> 435 px |
| 844 x 390 | Chrome | /drift | 626 / -236 | 64 / 326 | 80 -> 444 px |
| 932 x 430 (Pro Max, sideways) | WebKit + Chrome | /widebeam, /drift | 341 / 89 | 64 / 366 | 136-149 -> 517 px |
| 667 x 375 (SE, sideways) | WebKit + Chrome | /widebeam, /drift | 625-626 / -250 | 64 / 311 | 80 -> 258-267 px |
| 1141 x 480 (a short laptop window) | WebKit | /widebeam, /drift | 158 / 322 | 64 / 416 | 345 -> 517 px |

Both keys become 44 px tall (they are 40 px today), which meets the phone tap-target size.

How it was measured, so you can repeat it: open the page in Playwright (WebKit or Chrome) at the screen size with a
fresh context (no `ra-cookie-consent` in localStorage), wait 3 s for the banner, then read
`#cookie-banner.getBoundingClientRect()` (height, top) and the width of the visible text block (`.cb-full` or
`.cb-short`). For the "proposed" column, inject the CSS below with `page.addStyleTag` and read the same numbers.

## Proposed: one short-screen branch, layout only

Add this at the end of the banner's `<style>`. It applies only when the screen is short (500 px or less) and wider than
the phone sheet (601 px or more, which the existing `max-width: 600px` block already handles). It reuses the phone
sheet's own choices: the short line instead of the long one, the title first, and the 44 px keys. Everything sits on
one row: the title, the short line with its Privacy link, then Decline and Accept All.

```css
/* Short screens wider than a phone sheet (a phone held sideways, a short laptop window): one slim row. */
@media (max-height: 500px) and (min-width: 601px) {
  .cb-inner {
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: .6rem max(1.2rem, env(safe-area-inset-right)) .6rem max(1.2rem, env(safe-area-inset-left));
  }
  .cb-text { flex-direction: row; align-items: center; gap: .8rem; }
  .cb-title { order: -1; margin-left: 0; font-size: 1.15rem; letter-spacing: .06em; white-space: nowrap; }
  .cb-full { display: none; }
  .cb-short { display: inline; }
  .cb-body { font-size: .8rem; line-height: 1.4; }
  .cb-actions { gap: .6rem; }
  .cb-btn { --rb-h: 44px; --rb-px: 16px; --rb-fs: 15px; --rb-r: 12px; }
}
```

Notes:
- **The words.** In this branch the visitor reads the short line ("We use cookies to improve your experience and our
  marketing. Privacy."), the same one phones get today. If the long text must show on landscape phones, say so and
  the branch can keep `.cb-full` on two lines instead (about 90 px tall).
- **Side effect on laptops.** A desktop window shorter than 500 px also gets the slim row (158 -> 64 px). That is
  probably welcome, but it is a change there too. To limit it to phones, add `and (pointer: coarse)` to the query.
- **The notch.** The left and right padding uses the safe-area insets, so the title and keys stay clear of the notch
  when the phone is held sideways.
- **Not checked on a real iPhone.** Only the emulated sizes above were checked.

## Why WIDE BEAM cares

The WIDE BEAM page lifts its SOUND key above the banner while the banner is up, so the key is never hidden under it.
A 625 px banner leaves no room for that on a sideways phone: the key ends up under the banner until the visitor
answers it (G8 in the plan, reported as blocked on this fix). With the slim row, the key clears the banner. The
injected test shows it sitting just above the row at 844 x 390.
