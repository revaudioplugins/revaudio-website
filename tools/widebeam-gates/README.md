# WIDE BEAM gates

The release checks for the WIDE BEAM page (`/widebeam`). Fourteen gates (G0 to G13) drive the page in real browsers
(Playwright: installed Chrome, WebKit, and Firefox for some rows) and print one table: gate, check, PASS / FAIL / MISSING / SKIP,
and the measured value.

- **PASS / FAIL**: the check ran and the number is in the row.
- **MISSING**: a hook the check needs (`data-wb-*`, an id) is not on the page. Counted as a FAIL.
- **SKIP**: the check cannot run here and says why. Never counted as a pass.

Everything runs from this folder and uses the repo's own `node_modules` (`../../node_modules`). Nothing in `src/` is changed.

## Run it

Build, start a preview, then run every gate against it:

```bash
npm run build
npx astro preview --port 4393 --host 127.0.0.1
```

```bash
bash tools/widebeam-gates/run-gates.sh http://127.0.0.1:4393 --prod http://127.0.0.1:4393 --fixtures
```

A full run takes about an hour. The script exits 1 on any FAIL or MISSING.

## Flags (`run-gates.sh <base> [flags]`)

| Flag | What it does |
|---|---|
| `--prod <url>` | An `astro preview` of a production build. G11's byte counts run there, and G0 reads `<repo>/dist`. Takes a URL (it can be the same as `<base>`). Without it G11's weight rows SKIP. |
| `--fixtures` | Starts three dev servers that render the page's other phases: open (port 4527), released (4528), the YouTube facade (4529). G0, G3 and G13 use them. They are stopped when the run ends. |
| `--only G9,G10` | Only those gates. |
| `--engines chromium,webkit` | The browsers (the default). G3 adds Firefox. |
| `--prove` | Instead of the table: plant a known violation for each gate and print whether the gate caught it. |
| `--wide` | Print the measured values untrimmed. |

`run-timing.sh <base> [--prod <url>]` runs the timing checks (G3, G5, G6, G11, G12 under CPU and network throttling) one at a
time. Run it on a quiet machine, twice, and trust a result only when both runs agree.

## Where results go

`runs/rg-<MMDD-HHMMSS>/`: one `G<n>.out` (the `@@R` result rows) and `G<n>.err` (progress, stack traces) per gate.
The summary table is printed at the end of the run; to print it again:

```bash
node tools/widebeam-gates/Gsum.cjs tools/widebeam-gates/runs/rg-<id> --wide
```

`runs/`, `test-results/`, `baseline*/` and the files G13 caches (`csp-live.txt`, `tone.wav`) are git-ignored.

## G1 needs a baseline (not in the repo)

G1 compares section screenshots of the page under test with a folder of earlier screenshots, and fails on any section
that differs. That folder is not in git. Make one from the build you trust (by default G1 reads `tools/widebeam-gates/baseline/`):

```bash
cd tools/widebeam-gates
NODE_PATH=../../node_modules node kit/sections.cjs http://127.0.0.1:4393 baseline
```

That takes 7 sizes x 2 engines (about 230 shots). `--sizes L1141,P390 --engines chromium` makes a smaller one; G1 uses
L1141 and P390 in Chrome and WebKit. Point G1 at another folder with `WB_BASELINE=<dir>` or `node G1.cjs <base> --baseline <dir>`.
A baseline is only good for the build it was shot from: after an intended change to the page, shoot a new one.
`kit/MASKS.md` lists what the shots leave out (canvases, video, the cookie banner, the cart) and why.

## What is in here

- `run-gates.sh`, `run-timing.sh`, `Gsum.cjs`: the runners and the summary table.
- `G0.cjs` to `G13.cjs`: the gates (each file's header says what it checks). `Glib.cjs`: shared helpers and the sizes.
- `Gfixture.sh`, `Gfixture.config.mjs`: the phase fixtures (the real astro config plus `src/data/widebeam.ts` with its flags flipped, in memory).
- `pw.config.ts`: the Playwright config G2 uses to run the repo's `tests/widebeam.spec.ts` and `tests/smoke.spec.ts` (adds Firefox).
- `kit/`: section shots (`sections.cjs`), the pixel compare (`compare.cjs`) and older behaviour checks (`checks/`).
- `vendor/axe.min.js`: axe-core 4.10.2, for G10's accessibility rows.
- `package.json`: marks this folder CommonJS (the repo root is `type: module`), so `pw.config.ts` can `require()`.

Environment overrides: `WB_REPO` (the repo to test, default `../..`), `NODE_PATH`, `WB_BASELINE`, `OUT_DIR`.
