# Home LIBRARY: the TV becomes the plugin browser (branch `feat/home-library`)

- Owner: Claude Code `revaudio-a6` (laptop 1). Status: **PLAN, waiting for the user's go. Nothing built.**
- Worktree: `.claude/worktrees/home-library` off origin/main `697f49d`, `node_modules` = junction to the main clone's.
- Push: nothing goes live without the word "push" (main = live).

## The request (user, 2026-10-15)

- Home page only. The carousel (`PluginShowcase`) and the Store nav item go. Switching between plugins lives
  in the TV (`WordWall`) and only there.
- A LIBRARY button top right opens plugin categories on the TV (Mastering, Modulation, Distortion, ... + FREE).
- Picking a category: the TV's glowing words become plugin names with a thumbnail. Clicking one lights it and shows
  a bigger image, a short description, "Try it free" (email gate) and a smaller "Go to product page".
- More plugins later: the list scrolls, plus a search.
- Later: product pages get "If you like this one you may also like".
- Soon: a 1-5 star rating on every product page, with insights.

## Coordination

- `revaudio-32` holds an ACTIVE claim on `src/components/WordWall.astro` (the TV weight fix, 2026-10-15, in
  `.claude/worktrees/drift-wordwall`). Phase 2 rewrites that file, so it starts only after that claim closes and
  this branch has their commit.
- "apply ww bench" (the TV frame roll pick) is still open. The frame stays in this design, so that pick still applies.

## Decisions for the user (asked 2026-10-15)

- D1 Button label: PLUGINS (recommended by the research) or LIBRARY.
- D2 What the TV shows before any click: the ALL channel with the category buttons on the TV (recommended), or
  today's word wall until the header button is clicked.
- D3 `/store`: redirect to the home TV (recommended here), or keep a plain list page that is not in the nav.
  Note: the research synthesis leaned the other way (keep a catalog page, drop only the nav item: every readable
  peer except Kilohearts and Denise keeps one). The recommendation differs because the catalog is 4 live plugins,
  the product pages carry search and ads, and the user asked for one place to browse.
- D4 Ratings: collect now from verified users only, show stars from ~5 ratings, insights = a team page, on its own
  branch after this one (recommended); or open stars to every visitor now.

Defaults taken unless the user objects: a price line in the preview (`$49` / `$19` / `Free download` /
`Beta: free 30-day trial`), no Add to cart on home (buying stays on the product page); plugins in development
without an open trial (The AC) stay off the TV; the TV never changes by itself (no auto-cycling).

## Phases

### Phase 1: catalog data (no visual change)

- [ ] `src/data/library.ts`: the category list (id, label, order). A category with no live plugin is hidden.
- [ ] `plugins.ts`: per plugin `library: { cats, typeWord, words, blurb }` (new fields only). Phase 1 never edits
      `WordWall.astro` (revaudio-32's claim); its copy is read from these fields in phase 2, so one source feeds
      the TV now and "you may also like" later.
- [ ] Starting categories (research taxonomy; every plugin listed wherever it truly does the job):
      ALL (default) | Mastering: RevLimiter | Vocals: DRIFT | Saturation & Distortion: GAS |
      Modulation & Stereo: DRIFT | Creative FX: Radio Roulette, DRIFT | Free: GAS.
      Hidden until a plugin ships: Reverb & Delay, EQ & Dynamics, Guitar & Bass, Instruments.
- [ ] The "Try it free" action comes from the data, per plugin: paid live = trial gate with `dlGateId(p)` (never the
      slug); GAS = the free gate (`data-gate-free`, reads "Free download"); DRIFT = its own page's sign-up
      (`trialOpen`). The button names the real trial length ("Try free for 30 days").

### Phase 2: the TV becomes the library (after revaudio-32's claim closes)

- [ ] Category buttons on the TV: ALL (default, every live plugin, zero clicks) + every non-empty category.
      A one-plugin category opens with that plugin already lit (no list of one).
- [ ] Left: plugin names in the glowing stencil style + a small thumbnail + a plain type word
      ("one-knob saturator"); the selected one is lit.
- [ ] Right: the big image, name, short description, the price line, "Try free for N days" (main button),
      "Product page" (small link).
- [ ] The five glowing words (`DESIGN.md` sections 0 + 4, "what the sound does, in five words") leave the left
      column to the plugin names; they move into the preview as one small line under the description (default,
      the user may drop them instead). `DESIGN.md` changes either way.
- [ ] Switching = a channel change: the existing static burst + each plugin's own phosphor colour.
- [ ] The list is real `<a href>` links in the HTML (crawlable); the script only enhances it.
- [ ] URL state: one history entry per category (`/?c=free`), the lit plugin updates the current entry (`&p=gas`),
      so one Back leaves the category; coming back from a product page restores the lit plugin.
- [ ] Phones: one pane at a time. Category chips, then full-width rows (thumbnail, name, type word, price);
      a tap opens the preview as its own view with a history entry, Back returns to the list. No hover-only states.
- [ ] Longer lists (later): the TV pages with CH+ / CH- instead of an inner scrollbar (no scroll trap inside the
      scroll-locked TV); a search from ~10 plugins.
- [ ] Keyboard + screen reader: real buttons and links, arrow keys move the selection, `aria-selected`, visible
      focus; reduced motion = no static; high contrast = a plain list.
- [ ] A dev-only bench first, so the look is tuned by eye before it folds into the page.

### Phase 3: header + removals

- [ ] Header: the new button takes the lit "Store" slot, in words. On home it scrolls to the TV and opens the
      categories; on every other page it goes to `/?c=all`. Phones: visible next to the menu button.
- [ ] `PluginShowcase` off the home page; the file is deleted once nothing imports it.
- [ ] `/store` per D3. Old links must keep working, including the licence worker's `https://revaudio.net/store`
      link (RevLimiter repo, `gumroad-worker/src/worker.js`). GitHub Pages cannot send a real 301: the redirect is
      either a meta-refresh page in the repo (with a canonical link) or a Cloudflare Redirect Rule (dashboard only).
      Never promise a "301" without the Cloudflare rule.
- [ ] Internal links re-pointed: Footer "Store", Cart "Explore the plugins", home closing CTA "Browse the store",
      product page breadcrumb "Back to store", the `gas.astro` fallback.
- [ ] The store FAQ (what you get, trial, Mac/Windows, refund, payment) moves to a page that stays.
- [ ] Ride-along: `DESIGN.md` section 4 + wiki `website-update.md`.

### Phase 4: verify

- [ ] `npm run build` green; no bench in `dist/`.
- [ ] Playwright Chromium + WebKit at 1280x665 DPR2, 1141, 1440, 1728, 860, 390, 360: no sideways scroll, every
      category, every plugin, Back button, a deep link, keyboard only.
- [ ] Scroll lock: small steps both ways from the TV are never pulled back (lesson 2026-10-14).
- [ ] Every "Try it free" sends the right gate id (network log).
- [ ] Console: only the 4 known Meta CSP errors (baseline taken 2026-10-15 on the live site).
- [ ] People (not agents): real iPhone + Mac Safari, the look.

### Phase 5: later, each on its own branch

- [ ] Ratings (D4): ask verified users only (after a Paddle purchase, at the end of a trial, weeks after a GAS
      download), tag each rating bought / trial / free; show stars from ~5 ratings with the count; publish low
      ones too; a real quote until then; team insights page; Cloudflare Worker + D1; the worker goes into the edge
      CSP `connect-src` (dashboard only); `AggregateRating` markup on product pages only.
- [ ] "You may also like": 1-2 hand-picked per product with a one-line reason (job or place in the chain).
- [ ] Search, from ~10 plugins.
- [ ] Trial gate (idea, weak evidence): show the download at once and email it too, instead of "check your inbox".

## Research (2026-10-15, workflow `wf_9c38e794-abe`, 3 researchers + 1 synthesis, web fetches only)

- Nav label: none of 12 peer catalog labels says "Library". Seen: Plug-ins (FabFilter, Softube), Products
  (Soundtoys, Baby Audio, Plugin Boutique), Plugins (Denise), Shop (Kilohearts), Single Plugins (Plugin Alliance).
  Where buyers meet "Library" it means what they already own: Plugin Boutique's header has "Library" (a log-in for
  owned downloads) beside "Products"; Native Access "Library", Splice "Your Library", Kontakt libraries (search
  results). NN/g menu checklist: no made-up or abstract labels.
- Small catalogs often have no categories (Soundtoys, Kilohearts, Denise, whose home page IS the catalog);
  FabFilter uses 3 groups for 14 plugins; one plugin may sit in several categories (iZotope).
- Free: its own nav item or category (Plugin Alliance "FREE", Baby Audio "Freebies"); "Free download" sits where
  the price goes (iZotope).
- Tiles: image + name + a plain type word + one action; most show the price; the trial button names its length
  (Kilohearts "Start a 10-day trial" + "Buy $199"; Plugin Alliance "Get a 14-day trial").
- No quick view / list + preview was seen at any plugin store (text fetches can miss script UI); the model is the
  list-detail layout (side by side on big screens, one pane at a time on phones, Back returns to the list).
- Stars only at catalog-scale stores (iZotope, Plugin Boutique, Waves), always with a count; boutique brands show
  quotes, press verdicts and awards instead. Spiegel: 5 reviews = +270% purchase likelihood vs none; likelihood
  peaks at 4.0-4.7 stars. Google: self-serving review rule names LocalBusiness / Organization only, so Product
  ratings on our own pages look eligible (inference).
- Carousels: people scroll past them (NN/g), which backs dropping it. Inline scroll areas trap touch users (Baymard,
  search summary).
- Full output: the workflow journal (session transcript dir); unverified items are listed there.
