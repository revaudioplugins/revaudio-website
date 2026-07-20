# Handoff → Gil: checkout bundle plan (DECIDED — ready to execute)

**From:** Dan's Fable session, 2026-07-20. **Responds to your** `tasks/checkout-bundle-handoff.md`.
Full research + option ranking: `tasks/checkout-bundle-review.md` (read §1 corrections + §5b).
This file is the execution brief — self-contained, no prior conversation needed.

## Decisions made (Dan, 2026-07-20)

- **Stay on Lemon Squeezy for now.** No provider migration before the Radio Roulette launch.
- **GAS is free with EVERY plugin purchase automatically** (not only when carted together), and
  it **requires a license key** like RevLimiter.
- **Nobody may pay $5 for GAS while entitled to it free** — the cart must zero-out/remove GAS
  whenever a paid plugin is in it.
- **Multi-item paid checkout (RevLimiter + Radio Roulette in one total): solved with a static LS
  bundle SKU**, not with the generic-SKU/custom_price API workaround (rejected — see review §4).
- **Future direction: FastSpring** (only MoR with confirmed cart + bundles + built-in license
  fulfillment + audio-plugin base: oeksound, Baby Audio, AudioThing). LS is in soft-sunset under
  Stripe (Stripe Managed Payments is the successor; LS will never ship a cart). Trigger to
  migrate: catalog reaches ~3 paid products or LS announces a sunset date.
- **Paddle is filed as runner-up only.** Dan confirmed it was dropped because domain approval
  dragged and Paddle support went silent — same risk on re-application, plus Paddle Billing has
  no native fulfillment (Classic-only, deprecated) and monthly payouts with a $100 floor.

## Why this is cheap: the backend already exists

Your brief assumed "no webhooks, no server-side fulfillment anywhere." Not true at venture
level: the **`revlimiter-license` Worker** (`RevLimiter/tools/RevLicenseKeygen/gumroad-worker/`)
already receives the LS `order_created` webhook (HMAC via `LS_SIGNING_SECRET`), mints the signed
`REVL.*` key, and sends the branded key email via Resend (KV seats, `/activate`, `/download`,
`/admin-mint`). Everything below extends that Worker — no new infrastructure.

## Execute — in this order

### 1. LS dashboard (LIVE environment — remember variant IDs differ from test!)
- [ ] Create **Radio Roulette** product, $20, installer attached. Copy the LIVE variant URL.
- [ ] Create **"RevLimiter + Radio Roulette" bundle** product at the combined price, both
      installers attached. (LS supports manual bundle SKUs — one product, multiple files.)
- [ ] Create **GAS** product, $5, installer attached (standalone purchase path only).
- [ ] Confirm the existing webhook (→ Worker root URL, event `order_created`) fires for ALL
      products in the store — it's store-level, so it should; verify in Settings → Webhooks.
- [ ] Disable LS-native license keys on all of these (keys come from the Worker).

### 2. Website (`src/data/plugins.ts`, `src/components/Cart.astro`)
- [ ] Fill `RADIOROULETTE_CHECKOUT_URL` and `GAS_CHECKOUT_URL` with the LIVE URLs; add a
      `BUNDLE_CHECKOUT_URL` const for the RL+RR bundle.
- [ ] `openCheckout()` mapping (replaces the `items[0]`-only logic — the latent bug from your
      brief becomes REAL the moment RR goes paid):
      - exactly one paid item in cart → that item's URL;
      - both paid items → the bundle SKU URL (one checkout, one combined total);
      - GAS lines are never charged: when any paid item is present, GAS shows struck-through
        **$0** and is excluded from the opened checkout.
- [ ] GAS product page + cart copy: "Free with any RevAudio plugin purchase."
- [ ] Keep resolving URLs by slug from the checkout-map (do NOT trust localStorage-cached URLs —
      see `feedback_cart_stale_checkout_url_localstorage` in shared memory).

### 3. Worker (`gumroad-worker/src/worker.js`)
- [ ] Map variant IDs → entitlements: RL variant → REVL key; RR variant → RR key; bundle
      variant → both keys.
- [ ] RR key minting: RR's keygen already exists at BrokenDisc `tools/BDLicenseKeygen` — port
      its signing into this Worker (or mirror the REVL scheme with an RR prefix; must match what
      the RR plugin's LicenseManager validates — check the plugin before choosing).
- [ ] GAS key minting: GAS needs its own key scheme (Dan: GAS enforces licensing). Mirror REVL's
      signed-key pattern; bake the GAS activation URL into the GAS plugin build.
- [ ] **On EVERY paid `order_created`: also mint + include a GAS key** (+ GAS download link) in
      the same branded key email. GAS bought standalone ($5) → GAS key only.
- [ ] Idempotency: webhooks can re-deliver — don't double-mint seats.

### 4. Verify before calling it done
- [ ] Real LIVE test purchase of each path: RR alone, bundle, GAS alone — overlay opens clean,
      payment completes, correct key(s) + downloads arrive in ONE email.
- [ ] Cart with RL + RR + GAS shows: bundle total, GAS at $0.
- [ ] `wrangler tail` during test orders; replay payloads to re-test without re-buying.

### 5. In parallel — start TODAY
- [ ] **Email FastSpring sales for a pricing quote** (no public rate card; expect the 8.9%-flat
      vs 5.9%+$0.95 band). Onboarding is a sales conversation — Paddle already showed us what
      slow approval costs, so start the clock now even though migration waits for the trigger
      above.

## Known limits of this interim (accepted)
- Bundle-SKU approach is combinatorial — fine at 2 paid products (1 combo), painful at 3+
  (that's the FastSpring trigger, not a reason to build more on LS).
- Someone who bought GAS for $5 and later buys a plugin just gets a redundant free key —
  harmless, no refund flow built.
- LS per-product revenue reporting for the bundle SKU shows the bundle, not RL/RR split.
