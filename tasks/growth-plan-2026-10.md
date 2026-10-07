# Growth plan — Oct 2026 (from Website & Google Ads audit, 2026-10-06)

Source: `RevAudio_Website_and_Google_Ads_Audit_2026-10-06.pdf`.
Order: measure → pages → traffic → content/trust → scale. No spend increase until Phase 1 passes.

## Code findings (verified 2026-10-06)
- `src/components/Cart.astro:174,224` — Google Ads conversion sends `lastCheckoutValue` (pre-payment cart sum, line 362), not Paddle's settled total. `transaction_id` is read (line 213) but not sent → no dedupe.
- `src/components/Cart.astro:142` — comment says Meta Purchase is server-side via **Lemon Squeezy** webhook. Site is on Paddle now. No Paddle webhook → Ads/Meta found in the website repo. Check licence worker; Meta Purchase may be dead.
- `src/components/CookieBanner.astro:61` — `initGoogleAds()` exits if `window.gtag` exists. Audit saw gtag loaded before any consent choice → something else (Cloudflare Zaraz / tag gateway? `/nojr/gtag/js` proxy) loads it first. No Consent Mode v2 default/update calls.
- Privacy policy (`src/data/legal.ts` / `PrivacyContent.astro`) says no advertising trackers, but site runs Google Ads + Meta Pixel.

## Ads account snapshot (read-only check by Claude, 2026-10-06, all time Jul 19 – Oct 6)
- All 3 campaigns PAUSED (no spend now). Total ₪1,955, 181k impr, 7,826 clicks, 74 "conversions", **0 purchases**.
  - Revlimiter, PMax, ₪30/day: ₪1,033. Search ₪395 (232 clicks), Discover ₪362, Display ₪251 (4,367 clicks, 3 conv), YouTube ₪23.
  - Radio Roulette new campaign, Demand Gen, ₪30/day: ₪787, 16 conv, "some ads disapproved".
  - Radio Roulette campaign, PMax, ₪50/day: ₪135, almost all Display (1,571 clicks), "all asset groups limited by policy".
  - 1 draft in progress.
- Conversions: Primary = Purchase (website, "Needs attention", 0 ever), Purchase (server, new, Inactive), Sign-up (68, Count Every), Start Trial Radio Roulette (6), YouTube subscriptions (4), YouTube follow-on views (24). Android installs = Secondary. So bidding optimised for sign-ups + YouTube, never sales.
- Search terms: free / AI seekers ("ai mastering free", "online sequencer", "mario sequencer", "autotune", "ai coustics").
- Uploads → new data connections live in Data Manager (offers HTTPS / SFTP / Sheets).

**Ads master plan (Phases 0, 1-Ads, 4):** https://claude.ai/code/artifact/6e94ee20-d155-4957-897c-c6637d052605 (budget $600/mo, English core markets, Search only; decided with Yoni 2026-10-06).

**Week 0 status (2026-10-07, done in the Ads account with Yoni):** only "Purchase (server)" Primary; Data manager HTTPS import of the licence worker CSV linked to it, daily 18:00-19:00 IL (worker fixes 98302c8 header-first, 4761879 placeholder row); auto-tagging on + auto-apply off (already); enhanced conversions already on in Ads + site sends buyer email (636c9b1); Sign-up value per product (d7b92bb); KP plan removed. NEW BLOCKER found: Google "Free desktop software" policy covers free trials of plug-ins, so ads need RevAudio certified as authoritative distribution site: requested 2026-10-07, case 4-6073000041684 (RevLimiter + Radio Roulette, 10 countries); every ad must contain the software name. Open: test order (Yoni), draft "Radio Roulette videos" (Demand Gen, Yoni decides), Google's reply in info@revaudio.net.

## Phase 0 — Stop the bleed (owner: Yoni, Google Ads UI)
- [ ] Pause Performance Max / Dynamic Search Ads. Keep only brand + exact product-name Search.
- [ ] Export last 60–90 days: campaign settings, search terms, landing/expanded URLs, conversion actions (primary/secondary), Paddle daily orders + refunds.
- [ ] Check: car "rev limiter" / casino "roulette" queries; spend landing on /gas/, /drift/, /the-ac/, /beta/, /blog/; bidding goals that count signups/downloads as purchases.

## Phase 1 — Measurement (owner: Claude, this repo + licence worker)
- [x] Cart.astro: send `transaction_id`, real total + currency from Paddle `checkout.completed` data (both engine paths). `de2ef94`, local, not pushed. Value = total − tax.
- [x] Server-side purchase: Paddle `transaction.completed` webhook → Google Ads (offline/enhanced conversions) + Meta CAPI. Same order ID as browser event. Licence worker `/ads/conversions.csv` (gclid via Paddle customData, net value) imported daily by Data manager; Meta CAPI net value (worker 16d0168, 98302c8, 4761879).
- [x] Consent Mode v2: default denied → granted on Accept, gtag from googletagmanager.com only after Accept (`de2ef94`, `61b0117`, live). Pre-consent loader was the Cloudflare Google tag gateway (edge-injected); Yoni switched it OFF 2026-10-06. Verified live: none/decline = 0 Google requests, accept = full tag.
- [x] Privacy policy + banner text match real tracking (2026-10-07): ads tags after Accept, hashed sale report to Meta, trial emails, Resend/Formspree/YouTube, GitHub Pages not Vercel; banner links Privacy; footer "Cookie settings" reopens banner, decline after accept clears ad cookies + reloads. Open for Yoni: Meta CAPI sends hashed email on every sale even without cookie consent (disclosed as legitimate interest); gate it on consent if he prefers.
- [x] Conversion actions: Purchase = only primary. Trial signup, GAS download, demo play = secondary. (Week 0, 2026-10-07: only Purchase (server) Primary.)
- [ ] 🧑 Acceptance (Yoni's test order, `?gclid=TESTabc123456`): 1 test order → 1 conversion, correct ID/value/currency; cancel → none; reload → no double; totals reconcile with Paddle.

## Phase 2 — Pages that sell
- [ ] Homepage hero: category line ("Mixing & Mastering Plugins"), outcome headline, per-product Listen / Try / Buy CTAs. Keep gauge.
- [ ] RevLimiter: resolve chain-position contradiction (homepage early vs product page end); one meaning for "redline"; before/after audio + trial CTA above fold; price/trial/licence/refund beside buy button.
- [ ] Radio Roulette: on-page audio player (one loop → 4–5 labelled results); manual video lower.
- [ ] Trust: makers on About; Production Expert coverage link (ask them to fix 14→30-day trial); permissioned quotes; tested-only compat matrix (OS × Apple Silicon/Intel × VST3/AU/AAX × DAWs).
- [ ] Drift / The AC: remove purchase/refund boilerplate. RevBeta link out of footer.
- [ ] Download portal: branded, link back to store. GAS email: remove "trial ending" text.

## Phase 3 — SEO
- [ ] Titles/metas per audit p.7 (e.g. "RevLimiter — Mastering Limiter Plugin | RevAudio").
- [ ] JSON-LD: SoftwareApplication + Offer per product, Organization on homepage. Match visible data, no ratings.
- [ ] Legal dialogs (~3,500 words/page): lazy-load or `data-nosnippet`.
- [ ] Product-specific OG images for RevLimiter + Radio Roulette.
- [ ] Search Console: verify, sitemap, live URL test per product. Cloudflare: confirm Googlebot/AdsBot not hit by 1010 rule.
- [ ] Blog, 2/month, buyer intent: streaming loudness (LUFS/true peak), limiter vs clipper, best free saturators (GAS), creative FX chains.

## Phase 4 — Promotion mix
- Google Ads rebuilt: Search only, exact/phrase. Campaigns: Brand / RevLimiter / Radio Roulette / GAS (separate lead budget). Manual or capped CPC until ~30 purchases/month. English markets first.
- GAS as funnel entry → email nurture → RevLimiter trial. Pitch BPB, KVR, Plugin Boutique freebies.
- Trial email sequence: days 1, 3, 7, 14, 25, 29.
- Creator seeding: 10–20 mid-size producers, NFR licences, short before/after reels.
- Gearspace/KVR launch threads; Reddit within rules; recruit affiliates from responsive creators; marketplaces (Plugin Boutique, ADSR).

## KPIs
Visit → demo play → trial → download → activation → checkout → purchase, by product + source. Judge trial cohorts 35–40 days after signup.

## Open inputs (need from Yoni)
1. Monthly ad budget + total spent so far.
2. Campaign type running now (PMax / Search / DSA).
3. Paddle orders + trial signups since launch.
