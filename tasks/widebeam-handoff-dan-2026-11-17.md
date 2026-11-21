# WIDE BEAM page: handoff for Dan (2026-11-17)

From Gil, built with Claude Code on Gil's Mac. Branch **`feat/widebeam-page`** (pushed, NOT merged, NOT live).
Route **`/widebeam`**, unlisted: `noindex`; in `plugins.ts` as `in-development` with no `library`, so it is off the
home TV, /buy and /support, and nothing links to it.

**Update 2026-11-19 (Gil):** BUY NOW and the trial gate are wired (commit `7a92522`), and the license hub is deployed
with both (`0f241f7`). See "Open" below.

## Try it

```sh
git fetch origin && git worktree add ../revaudio-website-widebeam feat/widebeam-page
cd ../revaudio-website-widebeam && npm ci   # or symlink node_modules from your main checkout
npx astro dev --port 4391                   # http://localhost:4391/widebeam
```

The intro plays on every load, a reload included (since 2026-11-18; Back / Forward skips it); the REPLAY pill brings it
back. Click anywhere to start the music.

## What is on the page, top to bottom

| Section | What it does | Code |
|---|---|---|
| Hero | Higgsfield video: a GT coupe sweeps past and drives off down the road. Title comes up at 5 s. On the last frame it dissolves into that frame with the car painted out; a canvas carries the tail lights into the vanishing point. | `src/lib/widebeam/intro.ts`, `night.ts`, `public/widebeam/intro-{1080,720}.mp4`, `src/assets/widebeam/intro-{poster,end}.jpg` |
| Get it | Free 30-day trial (posts to the download gate) + BUY NOW $9 (Paddle) | `src/data/widebeam.ts`, `bindSignup()` in `init.ts` |
| The dash | WideBeam's real face, live: every knob, TILT wheel, HIGH BEAM / SIDE switches, MONO, POWER rocker, presets, LCDs, lamps, road beams, correlation needle. Plus START THE ENGINE, "use your own track", a goniometer. | `face.ts`, `audio.ts` |
| The stereo road | Scroll story, 6 steps (WIDTH, LOW FOCUS, HIGH BEAM, TILT, MONO/CORRELATION, CRUISE) on a road of pan × frequency | `story.ts` |
| Glove box | The 16 factory presets as cards; a click glides the dash's knobs to it | `state.ts` (`PRESETS`) |
| Odometer + trip computer | Specs | `widebeam.astro` (`DATA`) |
| Launch list | Email form, source `widebeam-notify` | `bindSignup()` |

Fixed SOUND pill bottom-right. Keys: H high beam, M mono, S side, P power, [ ] presets.

## How the important parts work

- **The face is the plugin's own art.** `face-base.webp` is a 2x capture of WideBeam `Source/ui` with every moving
  part hidden; the plugin's baked filmstrips (`knob-*.webp`, `switch-toggle2`, `power-rocker`, `level-wheel`) sit on
  their seats in the plugin's 1536×1024 coordinates. Lamp exposure, road shade, beam cones, halogen lag and the
  needle's mass-spring are ported from WideBeam `app.js` / `garage.js`. If the plugin face changes, re-capture.
- **Audio is a demo, not the plugin's DSP.** A Web Audio mid/side chain after the README's laws: WIDTH (linear to
  100, then +6 dB at 200), LR4 LOW FOCUS on the side, TILT shelves at 1.5 kHz, HIGH BEAM = 25 ms velvet-noise
  decorrelator into the side × REACH, CRUISE gain law, MIX, MONO, SIDE, POWER. No allpass-aligned dry, no attack
  ducking. Correlation is measured live and drives the needle. The page says it is a browser demo.
- **Music starts by itself** where the browser allows: on load if Chrome already trusts the site, otherwise on the
  first click / tap / key anywhere (the AudioContext is resumed inside that gesture, which iOS Safari needs). A visitor
  who stops it is never restarted.
- **Intro failure paths** go straight to the still road: autoplay refused, video error, no start in 6 s, a 3 s
  stall, reduced motion, Save-Data.
- **Type and buttons are the house's** (DESIGN.md §3/§4): Bebas, Oswald, VT323, Inter, `.rv-btn`. The WIDE BEAM
  lockup alone keeps the plugin plate's engraved serif (a product name wears its plugin's own header lockup).

## Open: what it needs before it can go live

1. **Paddle: done 2026-11-19.** Price `pri_01m7vhcdt6t1dtpbyn9g1mx00m` ($9, product `pro_01m7vhb719rzqnagt7vmm03kwh`) is in
   `src/data/widebeam.ts` and the `plugins.ts` entry; `'widebeam'` is in `OWN_ROUTE`. BUY NOW adds WIDE BEAM to the
   cart at $9.00. Paddle refuses checkout on localhost ("blocked for this vendor"; RevFX gets the same), so the
   first real checkout test is on revaudio.net after the merge. The hub's `PADDLE_PRICE_MAP` mints the key on sale.
2. **Trial gate: done 2026-11-19.** `gateWired: true`; the form posts `{email, plugin: 'widebeam', marketing}` to
   `/download/register` first (hub `DL_PLUGINS.widebeam`, live), then joins the list. Until a build is shipped from
   /pit-lane the email and portal say COMING SOON, no dead links. Builds still to upload, then BUILDS_LIVE on the
   widebeam-license worker. Still open: the home TV (`library`) and status `live` when it should be listed; a Paddle
   bundle product if the BF/CM bundle should check out in one go (`sale.ts` has no bundle checkout).
3. **Cloudflare cache rule.** `widebeam/` joined `FOLDERS` in `tools/assetver/integration.mjs` (the videos get
   `?v=<hash>`), but the long-cache rule in the Cloudflare dashboard does not list it yet. Until it does the videos
   keep the 10-minute cache. Nothing breaks.
4. **Real devices.** Tested in Playwright Chromium + WebKit on macOS, 1440×900 and 390×844, no page errors. Not tested:
   real iPhone Safari (intro autoplay + the gesture-started audio), Windows, Firefox.
5. **Formats line** under BUY NOW says "Mac VST3 · AU · AAX · Windows VST3". AAX stays (Gil, 2026-11-19), but the
   0.10.x handoff builds have an **unsigned** AAX: it must be PACE-signed (wraptool) before the pkg ships.

## Touched outside the page

- `src/components/WelcomeDiscountPopup.astro`, `ExitIntentPopup.astro`: `/widebeam` excluded (its one ask is the trial
  / launch list), same as `/obdtune` on its branch.
- `tools/assetver/integration.mjs` + `docs/assets.md`: the `widebeam/` public folder.

## Weight

Face art ~2 MB WebP (filmstrips at full frame size; Astro re-encodes, raw files do not ship). Intro 1.5 MB (desktop) /
0.66 MB (phones, `media="(max-width: 900px)"`), loaded only when the intro plays (`preload="none"`).
