# The bundle in the TV: QA handoff for Gil (2026-11-25)

Dan: the site side is built on `feat/bundle-checkout`, on top of your `5de5dd6` and `f461175`. **It is not on main.**
Please QA it. It merges into main on Dan's word after that.

A merge before Friday is safe for the sale itself: everything about the bundle shows only while `html[data-sale]` is
set, which starts Fri Nov 27 00:00 PT. One TV change goes live at the merge, though (see "The TV on every channel").

## What changed from your reference

- **The bundle now lives inside the TV.** Dan picked this look ("Channel 00") from three.
  - **BUNDLES** is the first tab in the categories. It is outlined and blinks 5 times when the tube comes on.
  - The bundle has its own channel, **All 8**, first in the strip. Its thumbnail shows the 8 plugins.
  - The bundle's page shows "All 8 plugins" and "Black Friday bundle" (or "Cyber Monday bundle").
    - The 8 plugins stand bare on the glass.
    - Its key is **Add all 8 to cart · $69**: `data-add-to-cart data-cart-open data-slug="bundle"`, your cart item.
  - While the sale is on, the TV opens on BUNDLES with the bundle lit. This holds on `/plugins` and on the home TV.
  - ALL lists the plugins only, and phones open on the bundle's page.
  - Off the sale, the script takes all of it out (`[data-ww-sale]`), so the TV is as before.
  - Files: `src/components/WordWall.astro`, and `src/data/sale.ts` (`saleBundle.meta`, `.slugs`, `.tv`).
- **Your sale pop-up (`SaleIntro`) is unmounted** in `src/layouts/BaseLayout.astro`, because the TV carries the
  offer now.
  - The file is kept, and one line brings it back.
  - `TempHero` copes with `window.__saleIntro` being gone.
- **The strip:**
  - On phones the bundle line stays, shortened to "ALL 8 $69". It still adds the bundle and opens the cart.
  - The Cyber Monday "OBD-II" badge is hidden up to 900 px, so it doesn't run into the bundle line.
- **The cart:**
  - The bundle row has a picture of the 8 and the line "6 licence keys in one email · GAS + GAS 2 free".
  - **No paying twice.** Adding the bundle takes out the singles it holds, and a note says so. A single the bundle
    already holds is refused with a note, and the drawer opens.
  - There is no upsell box. One was built and then taken out, because with REDLINE the singles cost less (see Open).
- **The TV on every channel (laptops):** the glass behind the categories and the strip is 35% darker, with a 2 px line
  under the strip. Dan picked this. It is the one change that goes live as soon as the branch merges.
- **If the sale ends while the page is open,** the TV steps over to ALL (the strip clears `html[data-sale]`).
- **New test:** `tests/sale-bundle-tv.spec.ts` runs the real date path on the built site: Black Friday, Cyber Monday,
  off the sale, and the end with the page open.

## How to run it

1. Get the branch and install:

```
git fetch && git checkout feat/bundle-checkout && npm ci
```

2. Start the dev server:

```
npm run dev
```

   Then open these. `?sale=` works in dev only; production ignores it.
   - `http://localhost:4321/plugins/?sale=bf` (Black Friday)
   - `?sale=cm` (Cyber Monday), `?sale=soon` (this week), `?sale=off`
   - Home: `http://localhost:4321/?sale=bf`
3. The real date path on a production build. This sets the browser clock and runs 8 tests in Chromium + WebKit:

```
npx playwright test tests/sale-bundle-tv.spec.ts
```

## QA list

1. **Laptop, `/plugins/?sale=bf`.**
   - The TV opens on BUNDLES (5 blinks), with All 8 lit, the 8 pictures and $69.
   - Click "Add all 8 to cart". The drawer opens with the bundle row (picture, 6-keys line) and a subtotal of $69.00.
2. **The cart rules.**
   - Add RevLimiter, then the bundle. RevLimiter leaves the cart with the note "The bundle holds RevLimiter, so it
     came out of the cart."
   - With the bundle in, add RevFX. It is not added, the drawer opens, and the note says "RevFX is already in the
     bundle."
3. **Continue to payment with the bundle.** The Paddle overlay should open with `pri_01m89s443rzzrxj4180yj2ny91` at
   $69. **We have not opened it**, because it makes a draft order in Paddle. Your call.
4. **REDLINE or CYBER40 typed at the Paddle checkout on the bundle.** Paddle should refuse it (your setting; we have
   not checked it).
5. **`?sale=cm`:** green, "Cyber Monday bundle", "ends tonight, 23:59 PT", the same keys.
6. **Phone (390 wide; Safari or a real iPhone), `/plugins/?sale=bf`.**
   - The TV opens on the bundle's page.
   - "‹ All plugins" goes to the list, with BUNDLES first and the bundle on top.
   - ALL shows the plugins only.
   - The strip's "ALL 8 $69" adds the bundle and opens the cart.
7. **Home, `/?sale=bf`.** The opening screen shows first. The first scroll or tap brings up the TV on BUNDLES, with no
   pop-up.
8. **Off the sale** (`?sale=soon`, `?sale=off`): no BUNDLES tab and no bundle anywhere. The TV is as on main, plus the
   new line.
9. **Safari:** the blink, the sizes of the 8 pictures, and the line.

## What we checked (Dan's Mac, 2026-11-25)

- **Items 1, 2 and 5 to 8:** in Chromium and in WebKit (Safari's engine), at 1312x740, 1141x636 and 390.
- **Item 9:** Dan looked at the TV in Safari on his laptop. **Not checked:** items 3 and 4, and a real iPhone.
- **Production build with the clock:** the new test passes 8 of 8.
- **The full suite at `a8fbe88`:**
  - 96 passed, 1 skipped.
  - 3 failed, all in pages this branch doesn't touch:
    - the `/widebeam` robots test waits forever on the missing meta since `listed: true`;
    - `/drift` on WebKit logs the video controls' icons.
  - After the later TV changes, the sale test + smoke gave 53 passed, with the same `/drift` failure.
  - Main's CI has been red since Nov 23 for another reason: the `webServer` 60 s timeout, so no test runs.
- **The licence worker** is live with the bundle: the `/version` stamp read `43a2105` at 20:55 Israel on Nov 25.

## Settled by Dan tonight

These come from his notes on the first review page, at 22:56 on Nov 25.
- **A card under the TV:** "Not now". His note: "all these sections should be a part of the screen we have right
  now", and the same for Cyber Monday. That is why the bundle now lives inside the TV.
- **A value line ("$X of plugins for $69"):** none. This was asked as a Dan + Gil question; say so if you disagree.
- **The name in the cart:** "RevAudio bundle (all 8 plugins)", as it is now. The Paddle checkout shows Paddle's own
  product name.

## Open for you and Dan

1. 🔴 **The price.**
   - With REDLINE, the five plugins that have a price cost $55.50 as singles (50% off $111). With CYBER40 they cost
     $66.60.
   - Both are less than the $69 bundle. The only extra the bundle gives is DRIFT, which has no price yet.
   - The site makes no "save" claim. Does $69 stand?
2. **The 10% welcome pop-up** still shows on phones during the sale. Does its code work on the bundle? We haven't
   touched it.
3. **The Paddle overlay** and your 100%-code test order (your after-launch plan).
4. **Two other unmerged branches touch the same files:** `feat/garage-home` and `feat/phone-dive`.
   - Against this branch they clash only in `tasks/handoff.md` and `tasks/lessons.md` (and `.impeccable/config.json`
     for phone-dive).
   - `WordWall.astro` merges by itself, but the merged result hasn't been built.

## Going live

Dan's word merges `feat/bundle-checkout` into main. That is a fast-forward today, and a live deploy.

The bundle then shows from Fri Nov 27 00:00 PT (10:00 Israel) and goes away by itself on Tue Dec 1 00:00 PT. The cart
drops it at the same moment.
