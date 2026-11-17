# WIDE BEAM page: handoff for Dan (2026-11-17)

From Gil, built with Claude Code on Gil's Mac. Branch **`feat/widebeam-page`** (pushed, NOT merged, NOT live).
Route **`/widebeam`**, unlisted: `noindex`, not in `plugins.ts`, nothing links to it.

## Try it

```sh
git fetch origin && git worktree add ../revaudio-website-widebeam feat/widebeam-page
cd ../revaudio-website-widebeam && npm ci   # or symlink node_modules from your main checkout
npx astro dev --port 4391                   # http://localhost:4391/widebeam
```

The intro plays once per browser tab (`sessionStorage`); the REPLAY pill brings it back. Click anywhere to start the music.

## What is on the page, top to bottom

| Section | What it does | Code |
|---|---|---|
| Hero | Higgsfield video: a GT coupe sweeps past and drives off down the road. Title comes up at 5 s. On the last frame it dissolves into that frame with the car painted out; a canvas carries the tail lights into the vanishing point. | `src/lib/widebeam/intro.ts`, `night.ts`, `public/widebeam/intro-{1080,720}.mp4`, `src/assets/widebeam/intro-{poster,end}.jpg` |
| Get it | Free 30-day trial email + BUY NOW (placeholder, see below) | `src/data/widebeam.ts`, `bindSignup()` in `init.ts` |
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

1. **Paddle.** No WideBeam product/price exists, so BUY NOW is a placeholder that explains. Note: `sale.ts` on main
   (`713f6b3`, today) lists "Wide Beam ($9)" in the BF/CM bundle. To go live: set `priceUsd` + `paddlePriceId` in
   `src/data/widebeam.ts`; add a WideBeam entry to `src/data/plugins.ts` with the same id and price (the cart only
   checks out slugs it finds there); add `'widebeam'` to `OWN_ROUTE` in `src/pages/[slug].astro` (else the generic
   page fights this one for `/widebeam`); keep it off the home TV / store until it should be listed (copy how
   `revfx.ts` `listed` does it). The button then renders `data-add-to-cart data-cart-open`, which adds and opens the
   drawer (checked with identical markup pointed at RevFX).
2. **Trial gate.** `gateWired: false`: the trial form only joins the list (`/form-once`, source `widebeam-trial`) and
   promises the link when the trial opens. Flip it once the revlimiter-license worker has `DL_PLUGINS.widebeam` and the
   builds are in R2; the form then posts `{email, plugin: 'widebeam', marketing}` to `/download/register` first. The
   WideBeam repo's own `license-worker` is not deployed (`REPLACE_WITH_WIDEBEAM_SEATS_ID`).
3. **Cloudflare cache rule.** `widebeam/` joined `FOLDERS` in `tools/assetver/integration.mjs` (the videos get
   `?v=<hash>`), but the long-cache rule in the Cloudflare dashboard does not list it yet. Until it does the videos
   keep the 10-minute cache. Nothing breaks.
4. **Real devices.** Tested in Playwright Chromium + WebKit on macOS, 1440×900 and 390×844, no page errors. Not tested:
   real iPhone Safari (intro autoplay + the gesture-started audio), Windows, Firefox.
5. **Formats line** under BUY NOW says "Mac VST3 · AU · AAX · Windows VST3" (WideBeam README). Confirm AAX ships.

## Touched outside the page

- `src/components/WelcomeDiscountPopup.astro`, `ExitIntentPopup.astro`: `/widebeam` excluded (its one ask is the trial
  / launch list), same as `/obdtune` on its branch.
- `tools/assetver/integration.mjs` + `docs/assets.md`: the `widebeam/` public folder.

## Weight

Face art ~2 MB WebP (filmstrips at full frame size; Astro re-encodes, raw files do not ship). Intro 1.5 MB (desktop) /
0.66 MB (phones, `media="(max-width: 900px)"`), loaded only when the intro plays (`preload="none"`).
