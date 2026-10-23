# HANDOFF — revaudio-website session 2026-09-07 (support chat)

> Scope note: this session did **only** the support chat on `/support`. A **second Claude session was
> live in this same working tree throughout** and owns the footer commits on `main`, the staged
> `package.json`/`.gitignore`, the GAS drive-in files and the stashes. It wrote the root `HANDOFF.md`
> (footer session) seconds after this one was written, which is why this handoff lives under its own
> dated filename instead. Don't adopt its work as yours, and don't adopt this as theirs.

## State at session end

Branch: `feat/support-chat` in `~/projects/revaudio/revaudio-website`, level with
`origin/feat/support-chat` at `78df93d`. **Four commits this session, all pushed, none merged.**
`main` was never touched by this session and nothing was deployed.

```
78df93d Support chat: brass scrollbar on the message log
b0a6411 Support chat: phone sheet top edge matches the mobile buy bar (1px brass-dark)
f1171c4 Support chat: make the message log scroll (data-lenis-prevent + fixed-height flex panel)
479f9a5 Support chat on /support: dashboard-style panel, bottom-right launcher, Still-stuck strip, ?chat=open deep link
```

The branch touches exactly three files versus `origin/main`:

- `src/components/SupportChat.astro` (new, 542 lines) — launcher, panel, local answer map, styles.
- `src/data/site.ts` — adds `supportChat.workerUrl` (empty string; Yoni's backend fills it).
- `src/pages/support.astro` — imports and mounts `<SupportChat />`, adds the "Still stuck?" strip and
  an `id="contact"` anchor for the no-JS fallback.

### What was built, and the decisions behind it

Dan chose the shape from a design exploration published as an artifact (link in Cleanup below):

- **Scope: `/support` only.** Dan's words: "rather keep it support page only". Product pages already
  carry a cart FAB, a mobile buy bar and a cookie banner; a third fixed element there was rejected.
- **Visual direction B, "dashboard cluster"** — rounded panel, six gauge tiles (Install, Licence,
  Trial, DAW, Order, Human). Direction A (pit-lane radio, VT323 timestamps, square corners) was
  presented and **rejected**.
- **Named plainly "Support".** The "Pit Crew" name was offered and rejected.
- Launcher is a **bordered** pill on desktop and a 48px FAB on phones, mirroring the cart FAB on the
  left. Bordered, not filled, so Store and the buy bar remain the only brass-lit calls to action.
- Three doors, all opening the same panel: the launcher, any `[data-support-open]` element (the
  "Still stuck?" strip), and `?chat=open` in the URL. A `src=` parameter rides along to the backend
  so Instagram-sourced chats can be counted.
- **Honesty:** the status LED is amber "Bot on duty", never a green "online" with nobody behind it.
  Green requires a real presence flag from the backend.

Two fixes landed after Dan tested it:

- **The message log would not scroll.** Cause: the site's Lenis smooth scroll swallows wheel events.
  Fix: `data-lenis-prevent` on the log, the same treatment the cart drawer's item list already uses,
  plus a fixed-height flex panel so the log is the only scrolling region.
- **The scrollbar was the browser default.** Now brass: `scrollbar-color` for Firefox, the
  `::-webkit-scrollbar` trio for Chrome and Safari.

A design-hook finding also changed the phone sheet's top edge from a 3px brass bar to a 1px
`--brass-dark` line, matching the mobile buy bar's edge.

### The force-push, and why it was safe

The branch originally carried a duplicate of the footer commit "Close the hole in the middle of the
desktop footer" — the parallel session had committed it while `HEAD` was on this branch, then landed
the same change on `main` under a different hash (`2258331`). Dan asked for a rebase. It ran in a
throwaway clone under the session scratchpad so **this working tree's index was never touched**, then
`git reset --soft` moved the local branch ref, preserving the other session's staged files. The push
used `--force-with-lease` and rewrote only this feature branch.

### Uncommitted files — none of it is this session's

- **Staged (`M`):** `.gitignore` (adds `tools/_gas-car-candidates/*`), `package.json`,
  `package-lock.json`.
- **Untracked:** `src/components/GasDriveIn.astro`, `src/lib/gas-drive-in.ts`, `tools/gen-gas-car.sh`,
  five `src/assets/plugins/gas-*.png`, and the two stray `HANDOFF-2026-08-05-*.md` notes.
- **Stashes:** `stash@{0}` and `stash@{1}`, Dan's paused GAS drive-in work. Do not drop.

## Unverified

- **The brass scrollbar was never seen by either of us.** It was the last change: built green,
  committed, session closed. Confirm on a hard refresh.
- **Phone layout was never checked on a real device.** Playwright MCP was locked by the other
  session, so verification was a headless-Chrome shot at 390×844. The bottom sheet's safe-area
  padding and drag feel are unconfirmed on hardware.
- **The free-text path has never run.** `supportChat.workerUrl` is empty, so typed messages hit the
  local fallback copy. The fetch branch, the pending "…" bubble, the error branch and the
  `{reply, handoff}` contract are written but untested against a real endpoint.
- Dan confirmed the panel visually ("okey looks good") and implicitly confirmed the scroll fix by
  moving straight to the scrollbar colour. He has not re-checked the page since the rebase.
- No `npm run build` was run *after* the rebase. The same four commits built green before it, and the
  rebase changed no file contents.

## Background processes

Two Astro dev servers run against this one working tree, so both serve this branch's code.

- **This session's:** `npm run dev -- --port 4321`, which fell back to **port 4322** because 4321 was
  taken. PID `54912` (parent `54896`), output at `/tmp/claude-501/sc-dev.log`.
  Kill with `kill 54896 54912`.
- **The other session's:** `astro dev` on **port 4321**, PID `23658`. **Leave it up.** It was the URL
  opened for Dan during this session, which was harmless since both servers read the same files.

## Things the next session needs to decide

1. **Merge to `main`, or open a pull request first?** Merging `main` here is a live Vercel deploy and
   needs Dan's explicit per-action OK. Last signal: he asked for the branch to be pushed and rebased,
   and said nothing about merging. To act: `gh pr create` for Yoni to review, or an explicit "merge
   and deploy" from Dan.
2. **Who wires the backend, and when?** The front end expects `POST {message, src, page}` →
   `{reply: string, handoff?: boolean}` at `site.supportChat.workerUrl`. Yoni owns that worker. Until
   the URL is set, tiles answer locally and free text points at the tiles or a human.
3. **Site-wide later, or `/support` only forever?** Going site-wide means moving `<SupportChat />`
   into `BaseLayout.astro`, which re-opens the bottom-edge z-stack (cookie 9000 > cart drawer 200 >
   panel 150 > FABs 60 > mobile buy bar 40) and puts a second FAB on product pages — the thing Dan
   rejected.
4. **Does nav "Support" open the panel?** Designed as a door in the mockup, dropped when the scope
   narrowed. Not built. Only revisit if the chat goes site-wide.
5. **When does the LED go green?** Needs a real human-presence flag from the backend.
6. **Instagram doors are designed but not placed.** `/support?chat=open&src=ig` works today; the IG
   bio link, the ManyChat button and any story sticker still point elsewhere.

## Suggested commit splits

None for this session — all four commits are made and pushed.

**Do not commit anything currently staged or untracked.** For support-chat follow-ups, stage the
three paths explicitly (`git add src/components/SupportChat.astro src/data/site.ts
src/pages/support.astro`); never `git add -A` or `git commit -a` in this worktree while the other
session is live.

## Cleanup TODOs

- Kill this session's stray dev server on port 4322 (`kill 54896 54912`); leave 4321 alone.
- Design exploration artifact:
  https://claude.ai/code/artifact/7689c7e5-f78b-42c0-a790-1467784e1d56 — entry points, the three
  visual directions, the z-stack table, the Instagram funnel. Republish to that same URL rather than
  creating a second artifact.
- The prior `HANDOFF.md` (2026-09-06, GAS download gate) was archived to
  `.handoff-archive/HANDOFF-2026-09-06.md` by this session. The current root `HANDOFF.md` is the
  parallel footer session's, written afterwards — both are intact.
- If the tile answers in `SupportChat.astro` drift from the copy on `/support`, they are wrong by
  definition. The tiles mirror that page, and the component comment says so.

## Memory written this session

- `project_revaudio_support_chat.md` — the scope decision, the visual direction and the two rejected
  options, the backend contract, the honesty rule on the LED, the branch state and the artifact URL.
  Indexed in `MEMORY.md`.

Read once, then move to `.handoff-archive/`.
