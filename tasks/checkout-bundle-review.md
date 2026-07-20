# Review: multi-item checkout + GAS-free-bundle — verified findings & ranked recommendation

**Response to:** `tasks/checkout-bundle-handoff.md` · **By:** Fable (Dan's Mac session) · **Date:** 2026-07-20
Verification = code/git inspection of this repo + shared memory + 4 parallel web-research passes
against live docs (July 2026). Sources cited inline.

---

## 1. Corrections to the brief (verified)

1. **"No backend/webhook/fulfillment exists anywhere" is FALSE at the venture level.**
   The `revlimiter-license` Cloudflare Worker (`revlimiter-license.revaudio.workers.dev`, source
   `RevLimiter/tools/RevLicenseKeygen/gumroad-worker/`) already:
   - receives the Lemon Squeezy `order_created` webhook (HMAC-verified, `LS_SIGNING_SECRET`),
   - mints the signed `REVL.*` license key, emails it via Resend (branded `/key` copy page),
   - runs the KV seat ledger, `/activate`, `/download`, and token-guarded `/admin-mint`.
   LS's built-in delivery is NOT what delivers RevLimiter keys today — the Worker is. This
   collapses the cost of every "needs a webhook receiver" option to near zero.
2. **The cart already passes custom data to LS checkout.** `openCheckout()` appends
   `checkout[custom][terms_accepted]` / `terms_version` — the exact passthrough channel needed to
   tell the webhook "this purchase also claimed GAS". Confirmed LS carries it into
   `meta.custom_data` on `order_created`.
3. **Provider-history correction:** actual sequence is Gumroad → **Lemon Squeezy (06-04,
   `65a0d3d`)** → Paddle (same day, `cf5a21c`…`db9f8bf`) → back to LS (06-12, `238be13`). The
   Paddle stint lasted ~8 days and `b50fe76` says *"pause until token + price ID wired"* — plus
   shared memory records a **live** Paddle token + price ID and "Paddle plan ABANDONED (was:
   independent MoR, cheaper intl)… LS KYC cleared, store activated (06-18)". Best reading: Paddle
   wasn't fully wired when LS's KYC cleared with native delivery included, and LS won on
   time-to-live + built-in fulfillment (which Paddle Billing lacks — see §3). Still confirm with
   Gil, but this looks like a race outcome, not a hard blocker.
4. **"Safari Audio" could not be identified/verified** as a company. Live checkout fingerprints of
   comparable small plugin devs (curl, 2026-07-20): **Baby Audio → FastSpring; AudioThing →
   WooCommerce+FastSpring; oeksound → FastSpring** (published FastSpring case study). The
   industry pattern points at FastSpring, not Shopify.
5. **Cleverbridge is enterprise-only** — no self-serve signup, ~$50k–200k+/yr platform fees,
   sales-negotiated. Cart API is real but irrelevant at RevAudio's size. Strike it.
6. **Practical scope note:** Radio Roulette and GAS have `checkoutUrl: null` — RevLimiter is the
   only purchasable product today, so the `items[0]` latent bug is currently unreachable. It
   becomes real the day a second paid product goes live.

## 2. Lemon Squeezy status (the incumbent) — verified July 2026

- **No multi-product cart, and it will never ship.** Create Checkout API still takes exactly one
  variant (no `line_items`); the "Cart (multiple products)" request is open since Jan 2023
  (261 votes, filed by an LS co-founder, unshipped). [docs.lemonsqueezy.com/api/checkouts/create-checkout · lemonsqueezy.nolt.io/4]
- **LS is in soft-sunset.** Stripe acquired LS (Jul 2024); **Stripe Managed Payments (SMP)** is
  the successor MoR (public preview Feb 2026; LS "continues operating normally", self-serve
  migration tools "later this year" per LS's Apr 2026 blog). No shutdown date, but no feature
  roadmap either. Don't build heavy custom plumbing on LS. [lemonsqueezy.com/blog/2026-update]
- **What LS CAN do (confirmed):** `custom_price` (cents override), `checkout_data.custom` →
  `meta.custom_data` in webhooks, and a Discount API supporting **100%-off codes locked to a
  specific product, max_redemptions=1, expiring, prefillable via
  `?checkout[discount_code]=...`**. Fees: 5% + $0.50 (+1.5% intl card / PayPal); sub-$10
  products are a "contact sales" bucket (~15%+ effective on a $5 GAS).
- Option B's generic-SKU workaround is confirmed possible but **breaks LS-native license keys,
  file delivery, per-product reporting, and clean partial refunds** — you'd re-own all
  fulfillment on a sunsetting platform. (Not recommended; see ranking.)

## 3. Other providers — verified capabilities

| Provider | MoR | Multi-item cart | Buy-A-get-B-free | License/file fulfillment | Fees | Key risk |
|---|---|---|---|---|---|---|
| **Paddle Billing** | Yes | **Yes, native** (`Checkout.open({items})`) | 100%-off discount restricted to B's price; condition enforced in our cart JS (no native cross-item rules) | **None in Billing** (Classic-only, deprecated) — fully DIY via `transaction.completed` | 5% + $0.50; sub-$10 = contact sales | Post-FTC (Jun 2025 $5M settlement) stricter onboarding; monthly payouts, $100 min; zero confirmed audio companies; one KVR report of a VST dev declined |
| **FastSpring** | Yes | **Yes, confirmed** | Bundle SKUs native; multi-discount coupons; Classic had explicit BOGO (current-platform BOGO toggle unconfirmed) | **Built-in**: license-key fulfillment incl. **remote keygen URL** (→ our existing Worker), downloads, portal | Sales-quoted; historically 8.9% flat or 5.9% + $0.95 | Fixed fee hurts $5 SKUs; pricing = sales call |
| **Stripe Checkout (direct)** | **No** | Yes (100 line items) | Yes — 100% coupon with `applies_to` product restriction | Fully DIY (small Worker job) | 2.9% + $0.30 + Tax 0.5% | **Self-MoR: EU (non-Union OSS) + UK VAT registration are ZERO-threshold for a non-EU/UK digital seller — mandatory from sale #1.** Disproportionate at current volume |
| **Stripe Managed Payments** | Yes | Rides Stripe Checkout (line items) | Coupon parity unconfirmed | Not included (no LS-style keys/files) | +3.5% on top of processing (~6.4% + $0.30) | Public preview; **likely US-entities-only so far**; the strategic endpoint LS merchants will be migrated toward |
| **Polar.sh** | Yes | **No** (open issue #7773, Nov 2025) | No bundle rules found | Built-in keys/files | 5% + 50¢ (plans change economics) | Young, pricing model still settling |
| **Gumroad** | Yes (since 2025) | Marketplace cart; bundles as SKUs | No rule-based free-gift | Built-in | **10% + $0.50 + processing (~13%+)** | Org instability (Antiwork/DOGE/AI-moderation drama); account previously deleted |
| **Shopify + license app** | **No** | Yes (best cart/bundle tooling) | Yes via apps | Via SendOwl / Sky Pilot apps | $ monthly + processing | Same self-MoR VAT burden as Stripe + app glue |
| Creem / Dodo | Yes | Not evidenced | No | Keys yes | 3.9–4% + 40¢ | Very young; no cart anyway |

## 4. Ranked recommendation

### Build NOW — Option A′: stay on Lemon Squeezy, grant GAS via the existing license Worker
(An upgrade of the brief's Option A — the Waves pattern, minus the friction, because the
backend it assumes we'd have to build already exists.)

Mechanics:
1. Create the GAS product in LS at $5 (its standalone purchase path; `GAS_CHECKOUT_URL` filled).
2. Cart: when GAS + a paid plugin are in the cart, show GAS struck-through to **$0**, checkout
   the paid plugin only, and append `checkout[custom][gas_bundle]=1` (mechanism already in place
   for `terms_version`).
3. Worker `order_created` handler: if `meta.custom_data.gas_bundle` — grant GAS in the SAME
   branded key email it already sends (attach GAS key/download link). No second checkout, no
   $0-checkout friction — better than Waves' redemption-email because our freebie is fixed, so
   there's nothing to "select".
   - Fallback variant (if we prefer LS to own GAS's files/receipts): Worker instead API-creates a
     one-time **100%-off, GAS-only, max_redemptions=1** discount code and emails the prefilled
     link. Confirmed possible end-to-end; costs the customer one extra $0 checkout.
4. If Gil wants "GAS free with ANY purchase, even without carting it": drop the flag and grant on
   every paid `order_created`. Marketing copy currently implies same-purchase; flag version
   matches it.

Why this wins now: zero new infrastructure, zero migration risk to live RevLimiter sales, small
diff (Cart.astro + Worker + one LS product), ships in a day, and nothing about it is throwaway —
the "cart intent → custom_data → Worker fulfills" pattern survives any future provider that
supports checkout metadata (all of them do).

What it does NOT solve: two PAID products in one checkout. That is unreachable today (one paid
product live) and becomes real only when Radio Roulette (or another paid plugin) ships — which is
exactly the migration trigger below. Interim if needed: sequential checkouts with honest UI.

Also fix regardless (tiny): `openCheckout()` should refuse/queue rather than silently drop
`items[1..n]` once a second paid product exists.

### Where it's headed — FastSpring, triggered by the second paid product
FastSpring is the only surveyed MoR with ALL of: confirmed shipped multi-item cart, native bundle
SKUs, built-in license fulfillment including a **remote key-generator URL** (which plugs straight
into our existing Worker — we keep the signed `REVL.*` key format and seat ledger), and a
confirmed audio-plugin customer base (oeksound, Baby Audio, AudioThing). It is the
industry-default answer to exactly this problem.

- Trigger: Radio Roulette (or any second paid plugin) approaching live, or LS announcing a hard
  sunset date — whichever comes first. Until then, migrating costs risk for capability we can't
  yet use.
- Pre-work now (cheap): have Gil open the FastSpring pricing conversation to get an actual quote
  (the historical 5.9% + $0.95 split vs 8.9% flat matters: $0.95 fixed is ugly on a $5 GAS, but
  GAS's job is mostly to ride along free, so the flat option may price fine).
- Runner-up for the future: **Stripe Managed Payments** — the platform LS merchants will be
  herded toward anyway, with native multi-line-item checkout. Re-evaluate when it's GA for
  non-US entities and its coupon mechanics are confirmed; today it's a preview with no
  license/file fulfillment and unclear eligibility.

### Rejected, in order
3. **Paddle revisit (E)** — cart is genuinely native and the discount mechanics work, but Paddle
   Billing has NO fulfillment (we'd build delivery email + refund-revocation glue), payouts are
   monthly with a $100 floor, post-FTC onboarding is stricter, and we found zero audio companies
   on it (one reported VST decline). Only worth revisiting if Gil reveals the June abandonment
   was trivial AND FastSpring's quote comes back bad.
4. **LS generic-SKU custom_price (B)** — confirmed technically possible, rejected strategically:
   the biggest build of all the LS options, it breaks LS-native delivery/reporting/refunds, and
   it invests in the one platform confirmed to be in soft-sunset.
5. **Stripe direct (F)** — cleanest cart+coupon mechanics, killed by self-MoR: zero-threshold EU
   OSS + UK VAT registration and quarterly filings from the first sale, for tens of dollars of
   tax. Not proportionate.
6. **Shopify (D)** — same self-MoR burden as Stripe plus app glue; FastSpring dominates it for
   this use case.
7. **Gumroad** — 13%+ effective fees and organizational chaos; also the old account was deleted.

## 5. Questions for Gil (in order)

1. **Why was Paddle dropped in June?** Evidence says LS cleared KYC first and had native
   delivery; confirm there's no hard blocker (rejection, fee issue) before we file Paddle as
   "runner-up only".
2. **Does GAS have license/activation enforcement, or is it delivery-only?** Determines whether
   the Worker mints a GAS key or just ships a download link in the grant email.
3. **Bundle semantics:** GAS free only when carted together with a plugin (current copy implies
   this), or free with every plugin purchase automatically?
4. **When does Radio Roulette go paid?** That date is the FastSpring migration trigger — if it's
   close, start the FastSpring pricing conversation now (question 5).
5. **OK to open the FastSpring sales/pricing conversation?** (No commitment — we just need the
   real quote to finalize the future-direction call.)
6. Minor: GAS at $5 sits in LS's sub-$10 "contact sales" fee bucket (~15% effective on
   standalone sales) — acceptable, given standalone GAS sales are expected to be rare?

## 6. Open verification items (cheap, before implementing A′)
- Test-mode check: does a 100%-off LS checkout still ask for a card? (Only matters for the
  fallback variant.)
- Confirm in LS dashboard whether RevLimiter uses LS-native license keys at all or purely the
  Worker's (memory says Worker; the brief's "LS delivers everything" was wrong either way).
