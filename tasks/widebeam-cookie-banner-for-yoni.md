# The cookie banner on a sideways phone: a layout fix for Yoni

Written 2026-11-18 by the WIDE BEAM build (lane A), revised 2026-11-19. `src/components/CookieBanner.astro` is Yoni's
component (`tasks/lessons.md` 2026-10-07: Yoni owns the consent text), so nothing here touches it. This note gives the
bug, the measurements and a proposed CSS block. The wording stays exactly as it is.

The first version of the block was wrong: tested the way a reviewer tests it (injected as a plain style tag), it hid
ALL the consent text and the Privacy link. Its plain `.cb-short { display: inline }` lost to the component's own
`.cb-short[data-astro-cid-fzbxxtek] { display: none }` (Astro adds that attribute to every rule in the component's
`<style>`, which outranks a bare class), while `.cb-full { display: none }` had nothing to lose to. The block below
starts every selector with `#cookie-banner`, so it wins in both places: pasted at the end of the component's `<style>`,
and injected for a test. Every number below was measured with this exact block.

## What breaks

On a phone held sideways (for example 844 x 390), the banner fills more than the whole screen. That is the first
thing every sideways visitor sees, on every page of the site.

- The screen is wider than 640 px, so the banner uses its **desktop** layout: a 2rem title with a 200 px left margin,
  the long consent text, and both keys in one row.
- The text column is squeezed to **80 px**, one or two words a line, **29 lines**. The banner grows to **625-626 px**
  in a 390 px screen, so its top sits at **-235 / -236 px**: the heading and most of the text are above the screen.
- The keys can still be reached, but the visitor can't read what they are agreeing to.
- It is site-wide: `/widebeam`, `/drift` and `/` measure the same. Findings hero-08 and mobile-14 in the WIDE BEAM plan.

## Measured (dev server, fresh visitor, Playwright, 2026-11-19)

Chrome and WebKit gave the same numbers to the pixel, except where two are given (Chrome / WebKit).

| Screen | Today: height / top | Today: text | Proposed: height / top | Proposed: text |
|---|---|---|---|---|
| 844 x 390 (iPhone 14-ish, sideways) | 626 / -236 (Chrome), 625 / -235 (WebKit) | long, 80 px wide, 29 lines | 63 / 327 | short line, 391 px wide, 2 lines |
| 932 x 430 (Pro Max, sideways) | 341 / 89 | long, 143 / 132 px wide, 15 lines | 63 / 367 | short line, 444 / 445 px, 1 line |
| 740 x 360 (an Android, sideways) | 626 / -266 (Chrome), 625 / -265 (WebKit) | long, 80 px, 29 lines | 63 / 297 | short line, 322 px, 2 lines |
| 667 x 375 (SE, sideways) | 626 / -251 (Chrome), 625 / -250 (WebKit) | long, 80 px, 29 lines | 63 / 312 | short line, 243 px, 2 lines |
| 640 x 360 (a small Android, sideways) | 233 / 127 (the stacked 640 px layout) | long, 523 px, 4 lines | 74 / 286 | short line, 198 px, 3 lines |
| 1141 x 480 (a short laptop window) | 158 / 322 | long, 353 / 321 px, 6 lines | 63 / 417 | short line, 444 / 445 px, 1 line |

With the block, at every size above and in both engines:
- the text is the short line, "We use cookies to improve your experience and our marketing. Privacy.", at 13.1 px
  (the desktop size, .82rem);
- the Privacy link measures 45-46 x 16 px and a tap on it reaches the link itself;
- Decline and Accept All are 44 px tall (40 px today) and a tap on each reaches it;
- the whole banner is on screen.
- `/drift` and `/` at 844 x 390 measure the same as `/widebeam` (63 / 327, 391 px, 2 lines).
- With the notch of a sideways iPhone (Chrome, insets left and right 59 px, bottom 21 px): 84 px tall (the 21 px inset
  is the banner's own padding), the title starts at x 59 and Accept All ends at x 785, both inside the notch insets.

How it was measured, so you can repeat it: open the page in Playwright (Chrome or WebKit) at the screen size with a
fresh context (no `ra-cookie-consent` in localStorage; phones with `isMobile` and `hasTouch`), wait 3.2 s for the
banner, and read `#cookie-banner.getBoundingClientRect()` (height, top), the visible text block (`.cb-full` or
`.cb-short`, the one whose display is not none: its width, and its line count from `getClientRects()`), the Privacy
link's size, and `document.elementFromPoint()` at the centre of the link and of each key. For "Proposed", inject the
CSS block below with `page.addStyleTag`, wait 1.2 s and read the same numbers. A second pass injected the block with
`[data-astro-cid-fzbxxtek]` added to every selector, which is what Astro does when the block sits in the component's
`<style>`: every number was identical.

## Proposed: one short-screen branch, layout only

Add this at the end of the banner's `<style>`. It applies only when the screen is short (500 px or less) and wider than
the phone sheet (601 px or more; the existing `max-width: 600px` block already handles narrower phones). It reuses the
phone sheet's own choices: the short line instead of the long one, the title first, taller keys. Everything sits on
one row: the title, the short line with its Privacy link, then Decline and Accept All.

```css
/* Short screens wider than the phone sheet (a phone held sideways, a short laptop window): one slim row.
   Every selector starts with #cookie-banner, so the block wins over this component's own rules both at the end of
   this <style> and when a test injects it as a plain style tag. */
@media (max-height: 500px) and (min-width: 601px) {
  #cookie-banner .cb-inner {
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: .55rem max(1.2rem, env(safe-area-inset-right, 0px)) .55rem max(1.2rem, env(safe-area-inset-left, 0px));
  }
  #cookie-banner .cb-text { flex-direction: row; align-items: center; gap: .9rem; }
  #cookie-banner .cb-title { order: -1; margin-left: 0; font-size: 1.15rem; letter-spacing: .06em; white-space: nowrap; }
  #cookie-banner .cb-full { display: none; }
  #cookie-banner .cb-short { display: inline; }
  #cookie-banner .cb-body { font-size: .82rem; line-height: 1.4; }
  #cookie-banner .cb-actions { display: flex; gap: .6rem; }
  #cookie-banner .cb-btn { --rb-h: 44px; --rb-px: 16px; --rb-fs: 15px; --rb-r: 12px; }
}
```

Notes:
- **The words.** In this branch the visitor reads the short line, the same one upright phones get today. If the long
  text must show on sideways phones, delete the two lines for `.cb-full` and `.cb-short`. Measured that way (WebKit):
  110 px tall with 5 lines at 844 x 390, 165 px with 8 lines at 667 x 375, 92 px with 4 lines at 1141 x 480; still on
  screen, Privacy link reachable.
- **Side effect on laptops.** A desktop window 500 px tall or less also gets the slim row (158 -> 63 px at 1141 x 480).
  That is probably welcome, but it is a change there too. To limit it to phones, add `and (pointer: coarse)` to the
  query.
- **Between 601 and 640 px wide** the existing `max-width: 640px` block stacks the banner; on a short screen this block
  (`display: flex` on the keys, two grid columns) puts it back on one row: at 640 x 360, 233 -> 74 px.
- **Not checked on a real iPhone.** Only the emulated sizes above were checked.

## Why WIDE BEAM cares

The WIDE BEAM page lifts its SOUND key above the banner while the banner is up, so the key is never hidden under it.
A 625 px banner leaves no room for that on a sideways phone: the key ends up under the banner until the visitor answers
it (G8 in the plan, reported as waiting on this fix). With the slim row the key clears the banner: at 844 x 390 the key
spans y 267-311 and the banner starts at y 327, and a tap on the key reaches the key (both engines; at every size in
the table the key sits above the banner).
