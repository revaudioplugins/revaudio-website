# HANDOFF — revaudio-website session 2026-08-05 (Radio Roulette $20 → $19)

> **Third handoff for this worktree today, deliberate.** `HANDOFF.md` (favicon: tach
> gauge) and `HANDOFF-2026-08-05-never-on-sale-copy.md` were written by two *other*
> concurrent sessions. Neither was archived or edited here — all three describe the
> same worktree on the same day from three sessions that overlapped. Read all three.

## State at session end

Branch: `main` in `~/projects/revaudio/revaudio-website`. **In sync with `origin/main` (0 ahead, 0 behind)** at close. One commit from this session, pushed and verified live.

- `9ca8064` — *Radio Roulette: $20 -> $19* — **mine.** Pushed; live HTML re-fetched and confirmed.
- `8474849` (favicon) and `c36f85c` (never-on-sale copy) landed **above** mine from the two other sessions. Not mine, not reviewed here.

The task was a single price change, plus its one hand-maintained duplicate:

1. `src/data/plugins.ts` — Radio Roulette `introPriceUsd: 20 → 19`. This one field feeds the crane door, the fallen drop-zone twin, the store card, the mobile buy bar, and the cart's `data-price`.
2. `src/components/PluginShowcase.astro:108` — the homepage carousel paints its price as a **literal string** (`priceHtml: '$19'`), so it does not follow the catalog and had to be edited by hand. ⚠️ Anyone changing a price must edit both places; `plugins.ts` alone leaves the homepage slide lying.

Dan's framing: **Lemon Squeezy was already at $19** — this commit is the site catching up to the store, not a pricing decision being made in code. The checkout URL was not touched.

### `git status` summary

- **Committed this session (pushed + live):**
  - `src/data/plugins.ts` — `introPriceUsd: 19` for `radio-roulette`, one line.
  - `src/components/PluginShowcase.astro` — carousel slide `priceHtml: '$19'`, one line.
- **Modified, uncommitted — NOT this session's work (GAS car thread):**
  - `package.json` / `package-lock.json` — adds `three@^0.185.1`. 🔴 The favicon session verified `three` is imported **only** by git-excluded Mac-local lab pages; nothing tracked imports it. Committing this ships a prod dependency the deployed site never loads.
  - `.gitignore` — adds a `tools/_gas-car-candidates/*` scratch-ignore block.
- **Untracked — not this session's:**
  - `src/assets/plugins/gas-car-{front,side}.png`, `gas-side-wheel-{front,rear}.png` — GAS car renders for the local-only lab pages.
  - `tools/gen-gas-car.sh` — the generator for the above.
  - `.impeccable/` — design-hook config + cache (`config.json`, `hook.cache.json`). Local tooling state.
  - `HANDOFF-2026-08-05-never-on-sale-copy.md` — the other session's handoff. `HANDOFF.md` itself is gitignored; this variant name is not.

**Nothing of mine is uncommitted.** Every file dirty at close belongs to another session's thread.

## Verified

- `npm run build` clean (29 pages, 2.31s). Built `dist/` grepped: **no `$20` survives anywhere** in the output.
- Live, after deploy, via `curl` on `https://revaudio.net/radio-roulette/` with a browser UA: door price `$19`, `data-price="19"` on both buy paths, aria-labels read "Add Radio Roulette to cart, $19".
- Pre-deploy in `dist/`: store card `$19`, homepage carousel `$19`, product-page door + drop-zone `$19`.

## Unverified

- **No real browser was opened this session.** The price was confirmed by grepping built HTML and live HTML, not by a Playwright/WebKit screenshot. The *numbers* are right; nobody looked at whether `$19` sits correctly in the carousel slide's painted type (the slide's price is absolutely positioned at `left: 0, top: 382, fs: 30` — a narrower string than `$20` by one glyph width, so it should be fine, but it was not seen).
- The `git pull --rebase` before the push **refused** ("cannot pull with rebase: You have unstaged changes") because of the GAS thread's dirty files. The push still fast-forwarded cleanly, so nothing was skipped — but the standard pull-then-push discipline was not actually exercised.

## Background processes

None started this session. Nothing to kill.

## Things the next session needs to decide

1. **The GAS car thread — commit, exclude, or drop?** `three@^0.185.1` in `package.json` + 4 car PNGs + `tools/gen-gas-car.sh` + a `.gitignore` block. Options: (a) `git.info/exclude` the assets and **revert the `package.json`/lock change** so no unused prod dep ships; (b) commit the whole thread once something tracked actually renders the car. Last signal: nobody in any of today's three sessions claimed this thread. Memory says the *GAS drive-in video* concept was killed 2026-08-04 — unclear whether these car renders are a survivor of that or a new idea. **To act:** find out who owns it before committing a dependency.
2. **Is $19 an intentional break from the price ladder?** `plugins.ts` documents a rule ratified 2026-08-04: *"every plugin launches at its forever price — $49/$69/$99 tiers."* Radio Roulette is now $19 (was $20 — so it was already off-ladder before this session). Last signal: Dan, this session — "the price of Radio Roulette is 20$ lets change it to 19$ ls already updated." Read as a store-sync instruction, not a ladder revision. **To act:** either amend the ladder comment to admit a sub-$49 tier, or leave the deviation undocumented and let it bite the next person who reads the rule as absolute.
3. **Stale `$20` in prose.** `tasks/checkout-bundle-plan-for-gil.md:35`, `tasks/checkout-bundle-review.md:178` (both instruct creating the LS product at $20 — Gil-facing, actively misleading now) and the design-rationale comment at `src/components/BuyButtonCrane.astro:603` ("same visual mass as the $20"). Left untouched; scope was the live price. **To act:** the two `tasks/` docs matter more than the comment — Gil may still be working from them.
4. **Still open from 08-04, untouched today:** the RevLimiter LS LIVE variant list price → $49 + a real test purchase (Yoni/Gil lane).

## Suggested commit splits

Nothing of mine is pending. For the GAS thread, if a future session decides to land it, the honest split is:

- One commit: `chore(gas): ignore gas-car candidate renders` — covers `.gitignore` only. Safe in isolation.
- One commit: `feat(gas): car renders + generator for the local lab` — covers `tools/gen-gas-car.sh` + the 4 PNGs. **Only if** a tracked page consumes them.
- 🔴 **Do not bundle `package.json`/`package-lock.json`** into either until a tracked source file imports `three`.

## Cleanup TODOs

- Add `HANDOFF-*.md` to `.gitignore` — `HANDOFF.md` is already ignored, but today's two dated variants show up as untracked noise in every `git status`.
- Decide whether `.impeccable/` (design-hook config + cache) is ignored or committed; right now it is untracked clutter.
- Three handoffs now sit at the repo root. Once read, move all three to `.handoff-archive/` — don't merge them.
- Scratch patch from this session at `…/scratchpad/price19.patch` (session scratchpad, disposable).

## Memory written this session

- `feedback_no_concurrent_sessions_one_worktree.md` — addendum: **three** sessions on this one tree today, and the technique that let a commit stay clean anyway (filter your own hunks into a patch, `git apply --cached`, since `git add -p` is interactive and unavailable).
- `project_revaudio_website.md` — 2026-08-05 section: Radio Roulette $19, the carousel's hand-maintained price duplicate, and the ladder-rule deviation.

Read once, then move to `.handoff-archive/`.
