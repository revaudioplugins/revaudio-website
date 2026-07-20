# Handoff: multi-item checkout + "buy X, get GAS free" bundle logic

**Purpose of this document:** This is a self-contained brief for a fresh AI session (no prior
conversation context) to pick up. Your job is NOT to implement anything yet. Your job is to:
1. Verify the findings below (they came from web search + doc reading, not hands-on API testing —
   some of it may be incomplete or have moved on since).
2. Think of options beyond the ones listed here.
3. Come back with a ranked recommendation: best option to implement **now**, and best option for
   **where the business is headed** (more products, more bundle combinations), if those differ.
4. If anything below needs Gil to answer (flagged explicitly), ask him before assuming.

Repo: `/Users/gilmichaeli/revaudio-website` — RevAudio, an audio plugin (VST/AU/AAX) company.
Static Astro site, no backend/server today (no API routes, no Workers, no webhook receivers exist
in this repo currently).

---

## The problem, in plain terms

RevAudio sells plugins individually (RevLimiter live now, others coming — Radio Roulette, etc.)
plus a small $5 saturator called **GAS**. The intended promo: **GAS is free if bought together
with any other RevAudio plugin in the same purchase; if bought alone, it's $5.** This needs to
actually happen at checkout (correct price charged, correct license/download delivered) — not
just be a marketing sentence.

More broadly, the underlying capability we actually want: **let a customer add more than one
product to a cart and complete ONE checkout with ONE combined total** (not N separate
transactions for N products). The GAS-free-bundle rule is the first real use case for this, but
Gil expects more products and more bundle combos over time, so whatever we pick should scale
past "just GAS," not be a one-off hack.

Current code already has the GAS product half-built for this: `introPriceUsd: 5`,
`bundleNote: 'Free when you buy any other RevAudio plugin — no separate purchase needed.'` in
`src/data/plugins.ts` (~line 308) — but `checkoutUrl` is `null` (no Lemon Squeezy product created
yet) and there is zero logic anywhere implementing the bundle rule. It's presentational copy only.

---

## Current architecture (verified by reading the code)

- **Cart is 100% client-side**: `src/components/Cart.astro`, state in `localStorage`
  (`revaudio_cart_v2`). No server, no session.
- **Checkout today is single-item only, even though the cart UI shows multiple items**:
  `openCheckout()` in `Cart.astro` (~lines 200-222) only ever reads `items[0]` and opens that one
  product's Lemon Squeezy hosted checkout link via `window.LemonSqueezy.Url.Open(url)`. If a
  customer has 2 products in the cart today, only the first one's checkout actually opens — this
  is a **latent bug**, independent of the GAS promo, worth fixing regardless.
- **Each product has its own static Lemon Squeezy checkout URL** in `src/data/plugins.ts`
  (`checkoutUrl` field per plugin, e.g. `REVLIMITER_CHECKOUT_URL`). No cart/discount API calls —
  buy buttons are just links to LemonSqueezy's hosted checkout page for one product.
- **No webhooks, no API routes, no server-side fulfillment code anywhere in this repo.** All
  order confirmation / license-key / download-link emails today come entirely from Lemon
  Squeezy's own built-in automated delivery.

## Checkout-provider history (this matters — read before suggesting anything)

Git history shows this site has **already migrated checkout providers twice**:

1. **Gumroad** (earliest)
2. **Paddle** — commit `cf5a21c` ("Switch checkout provider Lemon Squeezy -> Paddle") explicitly
   says *"Paddle.js overlay (multi-item checkout)"* in the commit body. **Paddle was chosen
   specifically because its overlay supports multi-item checkouts** — i.e. the exact capability
   we now want was already wired into this codebase once.
3. **Lemon Squeezy** (current) — commit `238be13` ("Migrate checkout to Lemon Squeezy") swapped
   the Paddle multi-item overlay back out for a single-product Lemon Squeezy hosted link.

**Open question for Gil, not answered anywhere in the repo or memory:** why did we move off
Paddle back to single-item Lemon Squeezy, if Paddle already had multi-item cart support working?
Was it fees, approval/verification friction, a bug, a business reason unrelated to checkout
mechanics? **Ask him before ruling Paddle back in or out** — it may be the simplest path since it
was already partially built here before, or there may be a hard blocker that makes it a non-starter.

## What's confirmed about Lemon Squeezy specifically (current provider)

- **No native multi-item cart.** Their own community feedback board has a long-open, unresolved
  request titled "Cart (multiple products)." The Create Checkout API takes a relationship to
  exactly **one** variant per checkout — no `line_items` array. Only same-product quantity is
  supported, not different products combined.
- Workaround that stays on Lemon Squeezy: create one generic "custom checkout" product, override
  its price via the API's `custom_price` field to match the cart's computed total, and pass
  metadata describing what was actually in the cart. This requires:
  - A backend endpoint (doesn't exist today) to call the LS API server-side (API key can't live
    in browser JS).
  - A webhook receiver for `order_created` to read that metadata and do your OWN fulfillment
    (license keys, download links, emails) per actual product — because LS's built-in automatic
    delivery only knows about the one generic SKU it thinks it sold, not the real N products.
  - This is a real, non-trivial build, not a small tweak.

## Competitor checkout research (screenshots Gil supplied, cross-checked against real sources)

- **Safari Audio** (a competing plugin company) — checkout is unmistakably **Shopify's stock
  checkout template** (fingerprinted via Shopify's exact default copy, e.g. the "Email me with
  news and offers" checkbox). Shopify natively supports full multi-item carts (that's its core
  business) but is a general commerce platform — would need an app or custom integration for
  plugin license-key/download fulfillment specifically.
- **Waves Audio** — checkout appears custom/proprietary (couldn't confirm the backend). Notable
  pattern worth copying regardless of platform choice: **the free bonus item is NOT priced into
  the same transaction at all.** Their cart shows a banner — *"Your cart is eligible for 1 free
  plugin. An email to select it will be sent after checkout."* — i.e. they decouple the free
  item from checkout math entirely and grant it via a post-purchase redemption email instead of
  a $0 line item in the same order. This sidesteps the "one checkout, one variant" problem
  completely, on any platform.
- **FabFilter** — confirmed via search to use **Cleverbridge**, a genuine merchant-of-record
  competitor to Lemon Squeezy. Verified via Cleverbridge's own Cart API docs: it natively
  supports multiple product IDs combined into ONE checkout with ONE total (comma-separated
  product IDs in the cart request). This is real, documented, working multi-item-cart support in
  a platform used by a comparable company in the same industry.

## Options identified so far (evaluate, refine, and go beyond these)

**A. Stay on Lemon Squeezy, copy Waves' pattern.** Checkout only ever charges for what's actually
purchased (no attempt to merge totals); GAS (and future bundle freebies) get granted after the
fact via a webhook-triggered redemption email, decoupled from the paid checkout entirely. Lowest
lift of the "real" options, but still requires standing up a minimal backend (webhook receiver +
some way to send/trigger the grant) that doesn't exist today. Doesn't give a true "one combined
total" checkout — sidesteps rather than solves that part.

**B. Stay on Lemon Squeezy, build the custom-price + generic-SKU + webhook-fulfillment
workaround** (see above) for genuine one-total, multi-product checkouts. Keeps the current
payment relationship but is a real backend build, and you take over fulfillment (license
generation, emails) yourselves since LS's automatic delivery breaks down once products are
merged into a generic SKU.

**C. Migrate to a merchant-of-record platform with native multi-item cart support** — Cleverbridge
(confirmed real cart API, seems more enterprise-leaning based on how it's positioned) or
FastSpring (commonly used in the audio-plugin/software space specifically, markets itself as an
upgrade path from Lemon Squeezy). Real migration project (re-key products/prices, re-point
checkout code, verify tax/VAT/compliance continuity), but gets native carts and bundle/discount
rules built-in, and should scale cleanly as more products/bundles are added later.

**D. Migrate to Shopify** (or similar general commerce platform) + a license-delivery app or
custom fulfillment glue. Cart/discount/bundle tooling is very mature, but it's not
purpose-built for software licensing — expect to still need custom work for serial
keys/downloads. Heavier than a pure MoR swap if the goal is "just fix checkout," lighter if
Gil wants a full storefront rebuild anyway.

**E. Revisit Paddle** — it already supports multi-item overlay checkout (per this repo's own
prior implementation) and is also a merchant-of-record (handles tax/VAT like Lemon Squeezy does).
**Needs Gil's input on why it was dropped before anything else.** If the reason was fixable/minor,
this could be the least-effort option since multi-item logic was already coded here once
(see commits `cf5a21c`, `b50fe76`, `db9f8bf` for what that integration looked like).

**F. Stripe Checkout** (flagged by Claude as under-explored, worth Fable digging into properly).
Stripe Checkout natively supports multiple line items in one Checkout Session — real cart
support. Key tradeoff: Stripe is **not** a merchant-of-record by default — RevAudio would become
the seller of record and be responsible for its own global sales-tax/VAT registration and
remittance (Stripe Tax helps calculate/collect but doesn't make you MoR-exempt the way Lemon
Squeezy/Paddle/Cleverbridge/FastSpring do). Given the code comment "Lemon Squeezy (merchant of
record)" in `plugins.ts` suggests MoR status was a deliberate requirement, this needs to be
weighed explicitly, not assumed away.

---

## What we need back from you (Fable)

1. Sanity-check everything above against current, live documentation/support channels — some of
   this came from web search snippets, not hands-on testing.
2. Surface any options not listed here (other MoR platforms, Paddle Billing specifically vs.
   classic Paddle, Gumroad's current capabilities, a hybrid approach, etc.).
3. Weigh every option on: (a) effort to implement the GAS-free-bundle rule specifically, right
   now; (b) how well it scales as more products/bundle combinations get added later; (c) whether
   it requires RevAudio to become its own merchant of record (tax/VAT compliance burden) vs.
   staying with an MoR provider; (d) whether it requires new backend infrastructure that doesn't
   exist today (webhooks, API routes, hosting for that); (e) migration risk/cost given RevLimiter
   is already live and selling on Lemon Squeezy right now — don't break existing sales.
4. Give a clear, ranked recommendation: best option to build now, and — if different — the best
   direction for where this is headed as the catalog grows. Explain the reasoning, not just the
   pick.
5. Flag anything you need Gil to answer directly (start with: why was Paddle dropped?) rather
   than guessing.
