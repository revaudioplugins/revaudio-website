# HANDOFF — revaudio-website session 2026-09-07/08 (scroll smoothness + lab port)

> **UPDATE 2026-09-08: both items are now DONE.** The scroll fix shipped 09-07; the lab port
> landed 09-08 and `npm run build` is green again (31 pages local, 19 tracked). Decision 1 below
> is closed — kept for the reasoning. Decisions 2 and 3 are also closed/still-open as marked.

> Scope: Dan reported "the scroll is not smooth, it was smooth but now it's not, maybe because of
> some changes we did lately." Root-caused by measurement, fixed, shipped, verified live.
> A second task — porting the two Mac-local gauge lab benches onto the new hub-v3 pivot — was
> started and **deliberately parked before any file was edited** when Dan left for the day.
>
> This is NOT the root `HANDOFF.md`. That file belongs to the parallel hero-gauge session and was
> left untouched on purpose — see Cleanup TODOs.

## State at session end

Branch: `main` in `/Users/danavivi/projects/revaudio/revaudio-website`. **0 ahead, 3 behind**
`origin/main` — nothing of mine to push; the parallel hero-gauge session pushed three more commits
after mine. Two commits made this session, both already on `origin/main` and deployed:

- `64ed5f3` — Welcome popup: open after the scroll settles, not mid-gesture (the actual fix)
- `001fffd` — Merge remote-tracking branch 'origin/main' (brought in 8 upstream commits)

Verified after their later pushes: `64ed5f3` is still an ancestor of `origin/main`, and
`WelcomeDiscountPopup.astro` there still carries the settle logic. They never touched that file.

**I left no uncommitted changes.** Everything in `git status` belongs to other sessions:

- **Staged (NOT mine — do not commit):**
  - `package.json`, `package-lock.json` — adds `three@0.185.1` for the paused GAS drive-in work
  - `.gitignore` — adds `tools/_gas-car-candidates/`
  - These blocked my merge. I unstaged them, merged, and re-staged them; the staged diff was
    verified **byte-identical by SHA before and after**, and the files on disk were never written.
- **Untracked (NOT mine):** `src/components/GasDriveIn.astro`, `src/lib/gas-drive-in.ts`,
  `src/assets/plugins/gas-*.png`, `tools/gen-gas-car.sh`, `np-probe.mjs`,
  `zz-needle-refute-probe.mjs`, and three other sessions' `HANDOFF-*.md` files.
- **Untracked (mine):** this file only.

## What was wrong, and why it looked like a motion regression

`WelcomeDiscountPopup.astro` (added 2026-09-02, mounted in `BaseLayout`, so on every page) called
`showModal()` from a rAF tick the instant scroll depth crossed 35%. Opening a dialog — top layer,
backdrop, entrance animation — is a **~90ms frame in WebKit at DPR 2**. Under Lenis the scroll
position is driven from rAF, so that single frame reads as the page snagging under your finger.
Chrome absorbs the same work, which is why it presented as "Safari got worse lately" despite no
change to any animation code.

**Fix:** debounce on the scroll events themselves with a 350ms settle, instead of a rAF tick, so
the modal opens only once the page has come to rest. Lenis keeps emitting `scroll` while its lerp
converges, so the timer also waits out the glide, not just the wheel.

### Ruled out by measurement (old build vs HEAD, Chrome + WebKit, prod + dev)
Haze plates · photoreal gauge plate and its needle ticker · the `.g-glass` blend · hero wall ·
reveals · nav `backdrop-filter` · the Lenis config itself. None of them moved the numbers.

### Known-remaining, pre-existing, deliberately NOT fixed
- ~30ms WebKit frame when the garage wall PNG textures first paint (`wall-wood.png` is 1.5MB).
- Occasional lazy-image / YouTube-thumbnail decode hitches lower down the product page.
- The same `showModal()` + `html.style.overflow` pattern exists in `ExitIntentPopup`,
  `TrialGateModal`, `SubscribeModal` and `Cart`. **None are scroll-depth-triggered**, so none can
  produce this symptom. Left alone on purpose.

## Unverified

- **Dan never confirmed the scroll feels right in his own browser.** He asked me to open it, said
  "i love what you did commit", then moved to the port. Everything here is machine-measured
  (rAF-gap logging, Chrome + WebKit, local prod build + live site) — but there is no human
  confirmation, and **which browser he actually scrolls in is still unknown**. If he says it is
  still not smooth, that is new information, not a regression: re-measure in HIS browser before
  changing anything.
- The popup's own behaviour after the change was verified by script (opens ~380ms after the last
  movement, no long frame during the gesture) but never watched by a person.

## Background processes

- Astro dev server on port **4321**, PID **95813**, started by this session.
  Kill with: `kill 95813`
  Note it serves the merged code including the fix; harmless to leave running.
- Nothing else. The temporary static servers (4331/4332), the second dev server (4323), and all
  Playwright browsers were shut down and verified gone.

## Things the next session needs to decide

1. ~~**Port the two gauge lab benches**~~ — **DONE 2026-09-08.** Both benches now import `N`/`H`
   (and `PIVOT` in balancelab) from a new LOCAL-ONLY `src/lib/gauge-geometry.ts`, added to
   `.git/info/exclude` alongside the benches it serves. The `hubCy` trap below was fixed: the hub
   centre now comes from `data-pivot-y`, verified visually — the `[data-hubline]` guide lands on
   the cap, not the box centre. All three dials measured identical (hub at 49.899/51.053, w 9.973%).
   **One thing to know:** a port agent also refactored `src/pages/index.astro` to import from that
   module. That was reverted — a tracked file must never depend on an untracked one, or the site
   breaks on a clean checkout. Promoting the module to the real single source is still a live
   option: commit `gauge-geometry.ts` and switch index.astro to the import, both in one commit.
   Original reasoning kept below.

   ~~The one real open item.~~
   `src/pages/herolab.astro` and `src/pages/balancelab.astro` are Mac-local and git-excluded, and
   both still `import ... from '../assets/hero/hub-v2.png'`, which an upstream merge deleted
   (replaced by `hub-v3.png` in `7aca389`). **So `npm run build` fails locally.** The deploy is
   unaffected — a clean checkout of tracked files builds fine, 19 pages.
   Last user signal: "port them." Then, minutes later, "i want to go home, can this wait for
   tomorrow?" — answered yes, and the run was stopped before it wrote anything.

   **It is not a rename.** Both benches carry the ORIGINAL 50/50 pivot, two generations stale:
   ```js
   // what the benches still have:
   const N = { left: '30.049%', top: '16.672%', w: '40%', ox: '49.877%', oy: '83.32%' };
   const H = { left: '44.468%', top: '44.601%', w: '11.207%' };
   ```
   ```js
   // canonical, from src/pages/index.astro at HEAD — derive, don't hardcode:
   const PIVOT = { x: 49.900, y: 51.055 };
   const NW = 40, NOX = 0.49877, NOY = 0.8332;
   const HW = 9.974;
   ```
   `HW` shrank from 11.207 (the plugin's 45.5/406 hub box) because the new cap is a rim-fitted cut;
   the old box laid opaque face pixels over the needle root. `hub-v3.png` is 117x117 against the
   old 132x131.

   **The trap — do not miss this.** `balancelab.astro` (~line 465) computes the hub centre as the
   dial box centre:
   ```js
   const hubCy = db.top + db.height / 2;      // WRONG once PIVOT.y = 51.055
   ```
   That line feeds the vertical-lock shift, the `[data-hubline]` guide and the `headline ↔ hub`
   readout — the entire reason that bench exists. It must derive from the pivot. Astro frontmatter
   consts are not visible to the client script, so pass `PIVOT.y` down via a `data-*` attribute
   (house pattern — see `WelcomeDiscountPopup`'s `data-signup-url`). `herolab.astro` has no
   equivalent JS assumption; it only positions via `N`/`H`.

   **Stale comments to fix while in there:** `herolab.astro`'s header still says the face is
   "captured from the live plugin UI" and that the needle rotates "around the same (203,203)
   pivot" — both false since the photoreal plate landed. `balancelab.astro` (~line 33) claims
   "Same plugin geometry as index.astro" — it is not, currently.

   **To act:** a 7-agent workflow was authored and is persisted at
   `~/.claude/projects/-Users-danavivi-projects-revaudio-revaudio-website/d4374cae-cae2-4323-ae15-ebe3482b1a5a/workflows/scripts/port-gauge-labs-wf_da929d44-483.js`
   Re-invoke with `Workflow({scriptPath: "<that path>"})`. `resumeFromRunId` is same-session only,
   so tomorrow is a fresh run; the survey phase is cheap. Shape: Survey (canonical geometry / asset
   truth / usage inventory) → Port (one agent per file) → adversarial Review per file. Agents are
   briefed that these files are git-excluded and must never be staged or committed.

2. ~~**Pull the 3 upstream commits.**~~ **DONE 2026-09-08** — fast-forwarded to `a4ff015`; the
   staged-index recipe worked, staged SHA verified identical before and after. Recipe kept: `HEAD` is 3 behind (`a4ff015`,
   `48c113e`, `a7cc257` — hero needle/kicker timing from the parallel session). A plain
   `git merge` will be **refused** while the GAS dependency changes sit staged. The safe recipe,
   which was used successfully this session: back up `git diff --cached --binary` to a file, record
   its SHA, `git restore --staged .gitignore package.json package-lock.json`, merge, `git add` the
   same three, then confirm the staged SHA is unchanged. The files on disk are never written.

3. **Is the wall-texture hitch worth fixing?** `wall-wood.png` is a 1.5MB PNG causing a ~30ms
   WebKit frame on first paint around y≈460 on the homepage. Options: convert to WebP and let
   Astro's pipeline size it, or leave it — it is one frame, once, on first scroll. Never raised
   with Dan.

## Suggested commit splits

**None.** My only change is already committed and pushed as `64ed5f3`. Everything else in the
working tree belongs to other sessions.

Explicit warning carried forward from `HANDOFF-2026-09-07-support-chat.md` and honoured all
session: **never `git add -A` or `git commit -a` in this worktree.** Stage paths explicitly. The
staged `three` dependency and the GAS drive-in files are a paused, local-only project.

## Cleanup TODOs

- **Root `HANDOFF.md` was left alone deliberately.** It belongs to the live parallel hero-gauge
  session (written 19:27, that session pushed again at 20:03). The close-session convention would
  archive it, but archiving another running session's handoff would break their thread. This repo's
  real convention is dated root files anyway. **Do not merge the two.**
- This file: read once, then move to `.handoff-archive/`.
- Throwaway measurement scripts parked in `.handoff-archive/` (git-excluded):
  `coldscroll.mjs` (full-page rAF-gap scroll map), `verifypopup.mjs` (popup timing + hitch check),
  `gaugecheck.mjs` (renders `/`, `/herolab`, `/balancelab` and prints each dial's hub centre and
  needle pivot as a % of its box — **all three must agree on 49.900 / 51.055** once the port lands).
  Delete when the port is done.
- `np-probe.mjs` and `zz-needle-refute-probe.mjs` at the repo root are other sessions' probes, not
  mine. Someone should decide whether they are still wanted.
- Dev server on 4321 (`kill 95813`) if not wanted overnight.

## Measurement method, so it is not re-derived

Playwright driven directly from a node script against the repo's own `node_modules` — the
Playwright MCP browser was locked by a parallel session.

- Chrome needs `chromium.launch({ channel: 'chrome' })`; the bundled chromium build is missing.
- **WebKit must target `127.0.0.1`, not `localhost`** — the Astro dev server binds IPv6 only and
  WebKit fails with "Could not connect". Start it as `astro dev --host 127.0.0.1 --port 4323`.
- Always `deviceScaleFactor: 2` (M1 Max XDR). DPR 1 hides raster cost entirely.
- Metric: `performance.now()` deltas in a rAF loop plus `scrollY`, while wheeling through the whole
  page. Report frames >20ms (Chrome) / >25ms (WebKit, which caps at 60Hz). A hitch at a **stable y**
  is content or a trigger; one that drifts is load/decode noise.
- WebKit is noisy: fresh browser per run, a gap between runs, and a warm-up pass for steady state.
  Never trust a single run.
- Attribution by elimination: inject CSS by appending a `<style>` via `evaluate` (WebKit refuses
  `addStyleTag` under this site's CSP), or `addInitScript` to preset state — e.g.
  `sessionStorage['ra-popup-shown-s'] = '1'` suppresses the popup. Chrome CDP `Tracing` gives the
  main-thread breakdown; WebKit has no equivalent.
- **Trap:** if every frame comes back a flat 33ms, that is the display asleep throttling everything
  to 30Hz, not site jank. Confirm against a local control before raising any alarm.

## Memory written this session

- `reference_revaudio_scroll_bench.md` — the per-engine measurement method (the WebKit
  `127.0.0.1` requirement, DPR 2, warm-up discipline, the 30Hz throttle trap) and the finding that
  a mid-scroll `showModal()` was the hitch. Indexed in `MEMORY.md`.

Read once, then move to `.handoff-archive/`.
