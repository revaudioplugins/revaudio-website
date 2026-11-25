# Temporary home hero on the TV: handoff for Dan (2026-11-18)

Branch `feat/temp-hero` (from main `94c8562`, main had not moved at handoff). **Not on main, not live.** Gil looked at
all three versions in the browser and approved the look: "looks great". He wants you to take it from here.
`npm run build` passes.

## What it is and why

The long garage (`HomeOpening.astro`, `?home=garage`) won't be ready for everyone by Black Friday, and the home page has
no intro without it. Gil asked for a temporary one:
- Only the garage's big line: "REVAUDIO · BOUTIQUE AUDIO PLUGINS", **Built like cars.**, and "Step inside." (from
  `tools/_home-opening/room.html`, `.read-b`).
- None of the 3D room, none of the walk.
- It sits **on the home TV's glass** (WordWall), in the TV's own type and tint. It "tunes in" pixelated.
- The visitor's first scroll changes the channel to the plugin menu.
- It works with the BF/CM reskins.

## How it behaves

| Version | First screen | First scroll down |
|---|---|---|
| No sale | The TV powers on, then the line tunes in pixelated (canvas, ~0.5 s, big blocks to sharp), then it is real text | The page does NOT move. The line pixelates out, the TV's power-on line (`ww:replay`) opens on the menu |
| Black Friday / Cyber Monday | The same, with the sale strip over the nav as on every page | The sale's TV intro (`SaleIntro.astro`) pops up, with the hero still on the TV behind it. Closing it (X, Esc, click outside) powers the TV over to the menu |

How the line is drawn:
- "Built like" uses the names' outlined stencil (`--ww-ink`). "cars." is filled and lit (`--ww-ink-hot`). The kicker
  and the "SCROLL FOR THE PLUGINS ▾" cue use the menu's mono.
- The tint follows the lit plugin, as the menu does.

Other ways in and out:
- Keyboard: Down, Page Down, Space or End, or a Tab into the TV, changes the channel.
- A click on the glass changes it too.
- A scroll the gestures don't catch (the scrollbar, a restored place) goes straight to the menu.
- The sale intro shows once per phase per browser, as before. After that, the first scroll goes straight to the menu.

Also on this branch (Gil's ask): "See the plugins" in the sale intro now always goes to `/plugins`, home page included.
Before, on the home page it only closed the intro and focused the TV.

Skipped (the TV shows its menu as today):
- the garage plays (`html.ho-on`): its walk ends on the TV
- high contrast (`html.hc`)
- a link straight to a plugin or category (`?plugin=`, `?cat=`, any `#hash`)
- a page that opens already scrolled

Reduced motion: no pixelation, no power-on; it just swaps.

## Files

- `src/components/TempHero.astro` (new): markup, the inline gate (sets `html.th-on` before first paint, so the menu
  never flashes under it), the pixel canvas, the gesture capture, the styles.
- `src/components/WordWall.astro`: +2 lines, a `<slot />` after `.ww-frame` (other users of WordWall pass nothing).
- `src/pages/index.astro`: `<WordWall><TempHero /></WordWall>`.
- `src/components/SaleIntro.astro`, both changes:
  - With `html.th-on` it doesn't open on load. It registers `window.__saleIntro(then)`, which the hero calls on the
    first scroll, and `close()` runs `then` afterwards.
  - "See the plugins" always navigates.

How it fits together:
- `html.th-on` hides the TV's menu children (opacity 0, pointer-events none; still in the tab order).
- The hero layer uses the same inset as `.ww-screen` in the framed set: over the tube, under the glare.
- The first scroll is caught on `window` in the capture phase (`wheel` with `stopImmediatePropagation`, so Lenis never
  sees it). This is the same trick HomeOpening uses for its loading screen.

## Preview

`npm run dev`, then the home page with `?sale=off`, `?sale=bf`, `?sale=cm` (dev only; sessionStorage per tab).
`?sale=soon` gives the countdown strip that goes live **Fri Nov 20 00:00 PT**. **Not checked with the hero.** It has no
intro, so the first scroll should go straight to the menu.

Checked: Chrome on a laptop (1512 wide) for all three, and a 390 px frame (phone) for BF.
Not checked: real Safari / iPhone touch, Windows, `?sale=soon`, `?home=garage` with the hero (it should hide).

## Open for you

1. Safari and iPhone: the touch capture (`touchmove`, `passive: false`) and the canvas `letterSpacing` (older Safari
   ignores it; the pixel frames are then a little off for ~0.5 s, and the final text is the real DOM).
2. Your call: should the hero come back on every home visit (as now), or once per session like the garage's
   `ra-ho-done`?
3. Already on main, not caused by this: the TV's scroll lock never catches at ~750-800 px window heights, because
   `section#plugins` is ~70 px taller than the screen. During the sale, its landing math uses `--site-nav-h` without
   `--sale-h`.
4. Merge to main only on Gil's or your word. Main is live (CI deploys + smoke test).
5. When the garage goes to everyone: delete `TempHero.astro`, put `<WordWall />` back in `index.astro`, and remove the
   `th-on` branch in SaleIntro. The slot in WordWall can stay.
