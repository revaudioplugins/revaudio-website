# revaudio-website

Marketing site for RevAudio. Built with [Astro](https://astro.build) — static and fast. Hosted on GitHub Pages at https://revaudio.net. Repo: https://github.com/revaudioplugins/revaudio-website.

## Local dev

```powershell
npm install
npm run dev
```

Server starts at http://localhost:4321.

## Build

```powershell
npm run build
npm run preview
```

Output goes to `dist/`. Every push to `main` runs the GitHub Pages workflow and deploys the live site (see Deploy below).

## Pages

- `/` — homepage
- Product pages, one per entry in `src/data/plugins.ts` (rendered by `src/pages/[slug].astro`): `/revlimiter`, `/radio-roulette`, `/gas`, `/drift`, `/the-ac` (checked 2026-10-05; `plugins.ts` is the source of truth)
- `/store` and `/buy/<slug>` — store and checkout (Paddle)
- `/blog`, `/about`, `/contact`, `/support`, plus the legal pages (`/eula`, `/privacy`, `/terms`, `/accessibility`)

## TODO before launch

- [x] Buy `revaudio.net` domain (GoDaddy)
- [ ] Reserve `@revaudio` on Instagram, X, YouTube
- [x] Deploy: GitHub Pages since 2026-06-03 (commit `031ba7c`), not Vercel
- [ ] Set up MailerLite account, replace form `action` in `src/components/EmailCapture.astro`
- [ ] Set up `hello@revaudio.net` (GoDaddy email forwarding or Google Workspace)
- [ ] Add Plausible or Cloudflare Web Analytics
- [ ] Drop real plugin screenshots into `/public/screenshots/`
- [ ] Bounce real audio A/B demos and wire them into plugin pages
- [ ] Generate `/public/og-default.png` (1200x630) for social previews

## Brand tokens

Defined in `src/styles/global.css` under `:root`. Muscle-car / mechanical aesthetic — dark warm base, brass accents, oxide warnings, chrome highlights.

## Deploy

**GitHub Pages**, via `.github/workflows/deploy.yml` (`public/CNAME` = revaudio.net). NOT Vercel: the `vercel.json` still in the repo is stale (wiki `website-update.md`).

A push to `main` is a live deploy, so it follows the team push rule: commit only your own files (`git add -- <paths>`, never `git add .`), and push only when Dan says "push" in the chat. Right before that push: `git pull --rebase`, then `git log origin/main..HEAD`.

Checkout = Paddle Billing, the only store (`checkoutEngine: 'paddle'` in `src/data/site.ts`). See wiki `store` (`shared/wiki/pages/store-paddle.md`).
