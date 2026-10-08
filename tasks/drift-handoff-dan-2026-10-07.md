# /drift copy vs Drift 5.0.1 — handoff to Dan (2026-10-07)

From Gil's session. While checking the beta feedback flow, I pulled Drift `main` (now `d80e958`, Drift **5.0.1**) and checked the /drift page against it. Two claims on the page are no longer true of the plugin. **Nothing on the page was changed**: the copy is yours, so the calls are yours.

Page checked: `feat/drift-page` @ `13d79cb` (your latest). Plugin checked: `~/Drift` `main` @ `d80e958`.

## 1. 🔴 "Whole sound pans" — reversed in 5.0.1

**What changed in the plugin.** Drift `docs/decisions.md`, 2026-10-06: **D2 REVERSED**. The PAN wheel and every pan feed (AutoPilot Pan, TRAKS, AUTO DRIFT, the BAND_WIDTH Haas) move **only the BAND SELECT slice** again; below/above the band keep their own stereo. Commit `5779b43` ("PAN wheel moves only the selected band", your words: "the effect should be only on the selected band"). The plugin's wheel tooltip now says "the selected band". Exception: the default band (HP 20 / LP 20000) is the whole spectrum, so out of the box it still pans everything.

**Where the page still says the whole sound moves** (the page's D2/H1 rule):

| File | Line | What it says | Visible? |
|---|---|---|---|
| `src/components/drift/DriftFx.astro` | 90 | #fx headline: **"Whole sound pans. / FX on one slice."** | yes, a section headline |
| `src/pages/drift.astro` | 86 | meta description: "DRIFT pans your whole sound across the stereo field … Echo, reverb, tremolo and pitch play on a band you pick." | yes: Google results + link previews |
| `src/components/drift/DriftFx.astro` | 109 | band strip aria-label: "the effects play only in this slice" (true for FX, but no longer the only thing in the slice) | screen readers |
| `src/data/drift.ts` | 13, 69-71, 288 | header rule "D2/H1: DRIFT pans the WHOLE sound" + the `demoWholeSound` build gate (`demoMode 'real'` refuses until the demo pans the WHOLE signal) | no, but it gates the build |
| `src/lib/drift/demo.ts` | 8 | "this file MUST pan the WHOLE signal (C1 / D2/H1)" | no: it decides what the demo does |
| `src/lib/drift/trackui.ts` | 13 | "the WHOLE sound moves (D2/H1)" | no |
| `src/components/drift/DriftHero.astro` | 8 | the wheel "IS the pan of the whole sound" | no |
| `src/components/drift/DriftTracks.astro` | 14 | TRACKS "drives the page's pan bus: the WHOLE sound" | no |
| `src/components/drift/DriftHeadUnit.astro` | 12 | the before/after needs "the whole-sound build" | no |

**Decisions for you:**
- New #fx headline and meta description. The honest version is roughly "you pick a band; DRIFT pans it and plays its FX there, the rest stays put" (or lean on the default: the whole mix until you narrow the band).
- The **page's own wheel / TRACKS / meters**: should they still show the whole sound moving, or the band moving with the rest fixed?
- The **`demoWholeSound` gate** now points the wrong way. The demo that is "honest" for 5.0.1 pans the band, which the current `demo.ts` already does ("still pans only the band"). Flip the gate's meaning, or drop it.
- Your **before/after bounces** for `demoMode 'real'` (`DriftHeadUnit.astro`): if they were recorded on a whole-sound build (4.30.0 to 5.0.0), they show behaviour 5.0.1 no longer has.

## 2. 🔴 AUTOTUNE is out of the plugin (5.0.0)

**What changed in the plugin.** Drift 5.0.0: **GLUE COMP replaces AUTOTUNE** (Drift `DESIGN.md` § "GLUE COMP strip - FX column 0 (5.0.0, 2026-10-06) - replaces AUTOTUNE": a console bus compressor, neon cyan; merge `d7b1c19`). Autotune moves to a separate free plugin (Drift `PLAN.md`, commit `d881bb2`).

**Where the page still shows it:**

| File | Line | What it says |
|---|---|---|
| `src/components/drift/DriftFx.astro` | 174 | #fx spec plate ("Also under the hood"): **`AUTOTUNE` — "Your key and scale"** |
| `src/components/drift/DriftFx.astro` | 12-13 | header comment: "no band claim for SATURATE/AUTOTUNE"; `fx-autotune.png` (already off the page, still in `src/assets/seasons/drift/`) |

**Also worth checking, same cause:**
- `DriftFx.astro` ~line 94, **"The DRIFT window, as it opens in your DAW."** If that screenshot is from before 5.0.0, it shows the AUTOTUNE panel, not GLUE COMP.
- The spec plate's **"PRESETS 60"**: the AUTOTUNE presets were re-voiced with GLUE COMP in 5.0.0 (Drift `83f081c`). The count may still be right; worth a look.
- The FX pedals/cards in #fx list echo, reverb, tremolo, pitch. 5.1.0 on Drift `feat/space` (**not merged**) swaps TREMOLO for HALO. No change needed now, just a heads-up if 5.1 ships in the beta.

## Also spotted (not checked in depth)

- Drift `tasks/licensing-plan-2026-10-04.md`: **D1 Trial 30 days** (Yoni, 10-04, "overrides roadmap 8.3's 14"), and the to-do list there says to fix the stale "14-day" copy. The page says **14 days** everywhere (`drift.trialDays: 14`). Possibly two different trials (the Oct 10 beta vs the plugin's own trial), but worth one line with Yoni before the page goes live.

## Not in this handoff

The beta feedback form (`/drift/feedback`) and its BETA FEEDBACK key over Apply in #creators are on Gil's branch `feat/drift-feedback` (rebased on your `13d79cb`; touches only `DriftCreators.astro` + a small rule block in `drift.css`). That's separate and comes as its own PR into `feat/drift-page`.
