# The $69 bundle on the site: handoff for Dan (2026-11-25)

Gil: the price and licence side is ours and is done. **How the bundle looks on the site and where it sits is
yours.** This branch (`feat/bundle-checkout`, from main `7598f36`) is a working reference, not a design. Keep any
of it or none.

## What's ready (not yours to do)

- **Paddle:** the bundle is its own product with one price, $69 on Black Friday and Cyber Monday.
  - price `pri_01m89s443rzzrxj4180yj2ny91`
  - product `pro_01m89q42p15tjnxjjbbbcw5v72`
- **Licence worker** (`revlimiter-license`, Revlimiter `tools/RevLicenseKeygen/gumroad-worker`, branch
  `feat/bundle`, `PADDLE_BUNDLE_PRICE`):
  - A Paddle order with that price mints a key for each of the 6 paid plugins: RevLimiter, Radio Roulette, DRIFT,
    RevFX, OBDTUNE and WIDE BEAM.
  - The buyer gets **one email** with all 6 keys. Each key has its own "KEY & DOWNLOAD" button, and the email
    points to GAS and GAS 2 as free.
  - The `/purchase` page after checkout shows all 6 unlocked.
  - The money card counts it as one "Bundle" sale.
  - `test/test_bundle.mjs` passes.
- **Order to go live:** the worker goes live before any site button sells the bundle. Otherwise a buyer pays and
  gets no keys: the worker would email an "UNKNOWN price id" alert, and someone would have to reissue by hand.
  Check `GET https://revlimiter-license.revaudio.workers.dev/version`: the stamp must be at or after the bundle
  commit.

## All the site needs

The cart already does the rest. A bundle is just one more cart item whose Paddle price is the id above:

1. A cart catalog entry (`Cart.astro` frontmatter): `checkoutMap.bundle = <price id>` and `cartCatalog.bundle =
   { name, price: 69, img, formats }`.
2. Any element with `data-add-to-cart data-slug="bundle" data-name=… data-price="69"`.
   - Add `data-cart-open` to open the drawer on click, like BUY NOW does.
3. Drop it from the cart after the sale (Tue Dec 1 00:00 PT). Paddle's price will be archived then, so a stale
   cart would fail at checkout.

## What this branch does (reference)

The commit is `5de5dd6`. The changes are in four places:
- `src/data/sale.ts`: `saleBundle` holds the slug, name ("RevAudio bundle (all 8 plugins)"), price id, $69,
  formats, and `until` (the end of Cyber Monday).
- `Cart.astro`: adds `saleBundle` to the catalog. `read()` skips any catalog item past its `until`.
- `SaleStrip.astro`: "All 8 plugins $69" adds it to the cart and opens the cart. Without JS it is still a link to
  `/plugins`.
- `SaleIntro.astro`: the intro's "All 8 plugins $69" is now a button. It powers the intro off and opens the cart
  with the bundle in it.

Tested in Chrome with `?sale=bf` on `/plugins` and `?sale=cm` on home:
- the cart shows the bundle at $69
- "Continue to payment" sends Paddle `[{ priceId: "pri_01m89s443rzzrxj4180yj2ny91", quantity: 1 }]` (Paddle was
  stubbed, so nothing was charged)
- on home, the intro button also hands the TV over to the menu as before

## Open for you (UI/UX)

1. **Where it sits.** Today the only bundle lines are the strip and the intro.
   - The strip hides `.ss-bundle` on narrow screens.
   - So once a phone visitor closes the intro, there is no way to buy the bundle.
   - Probably wanted: a bundle card or button on `/plugins` (and the home TV?) while the sale is on.
2. **The cart row** has no image (`img: ''`). It wants a bundle thumbnail.
3. **Copy.** The name in the cart and the Paddle checkout, and whether to say "6 keys + GAS and GAS 2 free".
4. **Codes.** REDLINE and CYBER40 must not apply to the bundle (Paddle setting, Gil). If someone has the bundle
   and a code in the cart, Paddle decides; check how that reads in the drawer.
5. **Push.** The worker must be live first (see above). Main is live (CI deploy + smoke).

## After launch

- Gil places one real order with a 100% test code and checks that the one email arrives with 6 working keys.
- Radio Roulette, DRIFT and RevFX have their own licence workers, which aren't on Gil's Mac. If one of them
  ignores the hub's `quiet: true`, the buyer gets that plugin's own key email too. Keys still arrive. OBDTUNE and
  WIDE BEAM do honour it.
