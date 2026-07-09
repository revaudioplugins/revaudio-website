# Handoff → Yoni: RevAudio email signature

> **CLOSED 2026-07-09 — done.** Avatar deployed, signature installed in Gmail on `info@revaudio.net`, links and logo verified rendering. Steps below are kept as the record; do not re-run the Step 1 commit, it is already in `main`.
>
> **Gotcha hit on the way:** the avatar 403'd in Gmail while returning 200 to a plain `curl`. Cause was Cloudflare **Hotlink Protection** — CF served the image only when the `Referer` was `revaudio.net`, so Gmail (`mail.google.com`) and its image proxy (`ci3.googleusercontent.com`) both got 403 and rendered a broken icon. Fixed by turning Hotlink Protection off for `revaudio.net`. Any future image hosted for email use will hit this again.

**Goal:** install a branded HTML email signature (RA monogram avatar + brand lines) on the `info@revaudio.net` Google Workspace / Gmail account.

**Status when handed off:** all files built and staged locally in `revaudio-website`, **nothing pushed, nothing installed in Gmail**. Two things remain: (1) deploy the avatar image, (2) paste the signature into Gmail.

---

## Assets (already in the repo, uncommitted)
| File | Purpose |
|---|---|
| `public/email/revaudio-avatar-ra.png` | 144px circle-cropped RA avatar — the signature image. Deploys to `https://revaudio.net/email/revaudio-avatar-ra.png`. |
| `tools/revaudio-signature.html` | Paste-ready signature markup (table-based, inline styles, email-client safe). |
| `tools/gen-avatar.py` | Generator that made the avatar (OpenAI `gpt-image-1`), if it ever needs regenerating. |

Full-res source of the mark: `~/Desktop/revaudio-avatar-1024.png` (canonical copy in `~/projects/revaudio/design-assets/revaudio-avatar-1024.png`).

---

## Step 1 — Deploy the avatar image (so it loads in recipients' inboxes)
The signature references `https://revaudio.net/email/revaudio-avatar-ra.png`. That URL is live only after a push:

```
cd ~/projects/revaudio/revaudio-website
git add public/email/revaudio-avatar-ra.png tools/revaudio-signature.html tools/gen-avatar.py
git commit -m "feat(email): RA avatar + branded Gmail signature"
git push origin main
```

Deploy is automatic via **GitHub Pages** (`.github/workflows/deploy.yml`, ~45s). Confirm with `gh run list` and then that the image opens in a browser at the URL above. **NOTE: `vercel.json` in this repo is vestigial — deploy target is GitHub Pages, not Vercel.**

## Step 2 — Install the signature in Gmail (`info@revaudio.net`)
1. Open `tools/revaudio-signature.html` in a browser.
2. Select all (Cmd+A), copy (Cmd+C).
3. Gmail → ⚙ → **See all settings** → **General** → **Signature** → **+ Create new** → paste.
4. Set it as the default for *new emails* and *replies/forwards*. Save changes.
5. Send a test email to a non-Google address and confirm the avatar renders (this verifies Step 1 hosting).

---

## Signature markup (reference — canonical copy is `tools/revaudio-signature.html`)
- Brand: **RevAudio** / "Boutique VST plugins" / *"Plugins built like cars."*
- Links: `revaudio.net` · `@revaudio` (instagram.com/revaudio) · `info@revaudio.net`
- Brass accent `#c9a35c` / links `#a8842f`, near-black name `#14110f`, avatar circle 66px.
- If a personal name/title is wanted instead of brand-only, add a line above "Boutique VST plugins".

---

## Separate but related: the account profile PHOTO is org-locked
Not part of this signature task, but FYI: setting the Google **profile picture** shows *"Your profile picture is managed by your organization"* and the upload buttons are disabled. Fix (admin only):
`admin.google.com` → **Directory → Users** → the RevAudio user → click their avatar → upload `~/Desktop/revaudio-avatar-1024.png`. (Or Directory → Directory settings → Profile editing → enable **Photo** to allow self-service.)
