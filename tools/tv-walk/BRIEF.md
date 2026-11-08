# Test-visitor walk: the revaudio.net home page "TV" (shared brief, read it all first)

You are one of 4 test visitors. RevAudio sells audio plugins (VST3 / AU / AAX) for music producers. The home page
holds an old TV set: its screen is the plugin store (categories, a list of plugins, each plugin's panel with a Try
key and a "Product page" key). The team is about to rework how the TV lets people try, download and go deeper.
Your notes decide what changes. Walk it as the person described in your own brief, first as a visitor; read the
site's code only afterwards, and only to add a `code_ref` to a finding.

## The test copy (safe, nothing live)
- A local copy of the live site runs at http://127.0.0.1:4480 (same code as the live site today).
- Drive it ONLY through the shared helper `walk.cjs` in this folder. Write small step scripts in your own folder,
  `$TV_WALK_OUT/<you>/steps/NN-what.cjs`, and run each with `node <script>`. Example:
  ```js
  const { session } = require('<repo>/tools/tv-walk/walk.cjs');
  session('noa', async ({ page, shot, note }) => {
    await page.goto('/');              // relative to the test copy
    await page.waitForTimeout(1500);   // let the TV settle
    await shot('first-look');          // saved as $TV_WALK_OUT/noa/shots/NNN-first-look.png
    await page.getByRole('button', { name: /accept all/i }).click();
    note('closed the cookie banner');
  });
  ```
  Each run opens a fresh browser that keeps your cookies and local storage from your earlier runs (pass
  `{ fresh: true }` as a third argument to start clean). It ends on the page where your script stopped; start the
  next script with `page.goto(...)` to the URL it printed ("URL at end"), or redo the clicks.
- Your device, zoom and settings are already set by your name in the helper. Never use the Playwright MCP tools or
  any other browser: other visitors share them. Never open revaudio.net or any other live address.
- Never edit files outside your own folder, never run git, never start or stop servers.

## What is blocked (on purpose)
- Every request that leaves the test copy is blocked, so nothing is sent for real.
- The trial / download sign-up gets a fake "ok": you will see the screen that follows sending your email, but no
  email arrives, so the step "open the email and download" cannot be walked. Say what you would expect there.
- Checkout (Paddle) is blocked: buying cannot finish. Only judge whether the way to buy is clear.
- Ignore these errors, they come from the test setup: Paddle failing to load, and a 403 for the Astro dev toolbar.
- Use a made-up email such as `noa.test@example.com`.

## How to walk
- Act like a person: click or tap what you can see (`getByRole`, `getByText`, `locator(...).tap()` on phones,
  `page.keyboard` for keys), scroll, wait 1-2 s after each action for animations. Never click hidden elements
  through `page.evaluate`; if you can't find something by looking, that is a finding.
- Look at every screenshot you take (Read the PNG) and judge what a visitor sees there: wording, size, contrast,
  what draws the eye, what is cut off, what moves.
- `$TV_WALK_OUT/<you>/log.txt` records page errors, blocked requests and the fake sign-ups.
- Budget: about 25-40 step runs and at most 60 screenshots.
- Be honest and specific. Don't invent problems to fill the list; say "not sure" when you are not.

## What to hand back
1. `$TV_WALK_OUT/<you>/findings.json`:
```json
{
  "visitor": { "name": "", "age": 0, "device": "", "summary": "one line in your voice" },
  "jobs": [
    { "id": 1, "job": "", "result": "easy | struggled | failed", "taps": 0,
      "what_happened": "", "shots": ["004-name.png"] }
  ],
  "findings": [
    { "id": "N1", "severity": "blocker | major | minor | polish",
      "area": "first-look | browse | plugin-detail | try-form | after-email | product-page | popups | phone | keyboard | readability | motion | trust | copy | other",
      "what_happened": "", "quote": "what you'd say, in your voice", "evidence": ["006-name.png"],
      "fix_idea": "", "code_ref": "optional src/...:line" }
  ],
  "loved": ["what worked well and should stay"],
  "top3": ["N2", "N5", "N1"]
}
```
2. A final message of at most 150 words: your top 3 and each job's result.
