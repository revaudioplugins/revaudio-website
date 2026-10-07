# Lessons (revaudio-website)

Patterns from user corrections. Read at session start before website work.

## 2026-09-06 - never push until Dan says push clearly

The garage homepage pass went to origin/main as a noindex /garage preview before Dan had
reviewed it. Dan: "never push until i say to push clearly."

Rule: commit locally after each verified step; do NOT `git push` until the user in this session writes "push" in
plain words (rule set by Dan; on the Yoni laptop the user is Yoni). Report "committed locally, not pushed". A preview route still deploys on push
(GitHub Pages) and lands on partner clones, so "noindex" is not a reason to push early.
The "rv close" ritual is an explicit push instruction and still counts.

## 2026-10-07 — Don't call the user "Dan"
- On the `C:\Users\Yoni` laptop the user is Yoni. I asked for "push from Dan" a third time because the push-rule memory was titled "until Dan says push". The memory now says "the user".
- Rule: when asking for go-ahead, write "say push". Before sending, every "Dan" that means "you" gets changed to "you".

## 2026-10-07 — removing a catalog field: prove it with the built pages, not the build
- Astro does not type-check `.astro` templates at build time, so a leftover `plugin.someField` just renders as
  nothing and `npm run build` stays green. Rule: after deleting a field from `src/data/*.ts`, grep `src/` and
  `tests/` for it, then diff the built pages before and after (strip only the attribute you meant to remove) and
  expect nothing else to change.
- `npx playwright install` (needed after `npm ci` bumps @playwright/test) deletes every browser revision no
  remaining install links to, including ones other tools pinned by path. Rule: point scripts at the newest
  `ms-playwright` folder, never at a fixed revision.

## 2026-10-07 — scripted edits can eat CSS escapes
- A Python heredoc edit turned `content: '\00b7'` into a NUL byte (`' b7'` on screen); the build stayed green and the dot just vanished.
- Rule: after any scripted edit that writes a backslash escape, check that exact line with `od -c` (or grep the escape) before building. For anything with backslashes, write the script to a file in the scratchpad, or use Edit.
## 2026-10-07 — a "still open" list in the handoff can already be done: re-grep each item first
- The 10-06/10-07 handoffs said Terms §7 and the EULA still named the old store. They had been vendor-neutral since
  `683b934` (2026-10-01); the item was copied forward without a fresh grep. Rule: before planning from a handoff's
  open-items list, grep each item in the current tree and say which ones are already done.
- Terms and the EULA share one date constant (`TERMS_LAST_UPDATED`; Privacy has its own `PRIVACY_LAST_UPDATED`
  since `1c34cac`): a Terms/EULA edit re-dates both and changes `data-terms-version` in the cart. The cart's legal
  popup sits on every page, so expect ~22 built pages to differ. Verify with a word-level dist diff, not a page count.
- The Playwright MCP browser can be held by another session ("Browser is already in use"). Render with a node
  script that requires the repo's `node_modules/@playwright/test` instead; don't run `npx playwright install`.

## 2026-10-07 — privacy text: check the server side, the live site, and who owns consent
- The site's ad tags were consent-gated, but until Yoni's worker change (RevLimiter `fae16a3`) the licence worker
  sent Meta a server-side Purchase for every sale whatever the cookie choice. Rule: before writing or reviewing
  tracker text, read the browser code (CookieBanner, Cart, trial components) AND the worker's webhook path, check
  which secrets are set (names only), and load the live site in a fresh browser with ad hosts recorded and aborted.
- Two sessions rewrote the Privacy page in parallel on 2026-10-07; Yoni's (`1c34cac`) went live first and won.
  Yoni owns cookie consent (Dan, 2026-10-07). Rule: before touching Privacy or cookie text, fetch origin and read
  the newest handoff entries for an owner.
