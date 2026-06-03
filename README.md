# revaudio-website

Marketing site for RevAudio. Built with [Astro](https://astro.build) — static, fast, deploys to Vercel.

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

Output goes to `dist/`. Vercel auto-deploys from `main`.

## Pages

- `/` — homepage (hero + 4 plugin cards + email capture)
- `/revlimiter` — flagship limiter plugin
- `/the-ac` — air-band exciter / saturator
- `/the-cooker` — stereo panner with autopilot
- `/maybach` — dynamic EQ (in development)
- `/about` — RevAudio philosophy
- `/contact` — email + social

## TODO before launch

- [x] Buy `revaudio.net` domain (GoDaddy)
- [ ] Reserve `@revaudio` on Instagram, X, YouTube
- [ ] Connect Vercel deploy
- [ ] Set up MailerLite account, replace form `action` in `src/components/EmailCapture.astro`
- [ ] Set up `hello@revaudio.net` (GoDaddy email forwarding or Google Workspace)
- [ ] Add Plausible or Cloudflare Web Analytics
- [ ] Drop real plugin screenshots into `/public/screenshots/`
- [ ] Bounce real audio A/B demos and wire them into plugin pages
- [ ] Generate `/public/og-default.png` (1200x630) for social previews

## Brand tokens

Defined in `src/styles/global.css` under `:root`. Muscle-car / mechanical aesthetic — dark warm base, brass accents, oxide warnings, chrome highlights.

## Deploy

Currently target: **Vercel** (free tier). Push to `main` triggers auto-deploy once the GitHub repo is connected.
