# Long garage on phones: baseline (2026-11-08, today's room.html)

Saved by the main session from the phone tester's hand-back (the tester could not write .md files). Full findings:
`findings.json` in this folder; numbers in `data/`; stills in `shots/`, `sim/`; scripts in `scripts/` (serve on 4495).

## First 10 seconds
On a normal connection the screen sits dark for half a second under a tiny, squeezed laptop menu, then the phone menu
snaps in and the garage powers on. It feels like a real place, but everything that says "we make plugins" (the CRT
screens, the posters, the drum kit) is a few pixels across and the coupe is cut off by the right edge. The first
half-screen swipe barely moves; the next rushes down the aisle; a quick flick throws past the TV into the page below.
On a slow phone network: a black screen for 43 s first.

## Numbers
- Load (Chrome Android, cache off): first frame 0.6 s local, 7.3 s at 10 Mbps, 43.5 s at 1.6 Mbps / 150 ms.
  8.36 MB in 72 requests (budget 6 MB): PBR maps 5.8 MB, pictures 1.0 MB, three.js 0.8 MB, site pictures 0.66 MB.
- GPU (WebKit 390x844, DPR 1.75 = 682x1477): ~422 MB tracked (budget: textures <= 100 MB). Material maps 245 MB
  (37 uncompressed, three at 2048), shadow maps 40 MB (5 x 1024), composer 58 MB (4x MSAA half-float + resolve), probe +
  PMREM 15 MB, posters / CRTs 28 MB, TV picture 14 MB (1170x2361), bloom + reflectors ~8 MB, canvases ~9 MB; 94 GL
  textures, none uploaded twice; ~35 MB of hidden label canvases on the CPU side.
- Draw calls: 520-556 at walk 0, 330-395 at 0.35, 81 at 0.7, 66 at 0.97.
- Hand-off: 390x844 DPR 1 2.57 % (= baseline); DPR 3: WebKit 390x844 2.37 %, 402x714 2.18 %, Chrome 412x915 1.66 %.

## Top findings
1. PH-01 GPU memory ~4x the budget (iOS tab-kill risk).
2. PH-02 the address bar threw readers below the TV back to it. FIXED by the main session (`a145e15`): WebKit now
   keeps the exact place (3784 -> 3562 -> 3784, the same offset into the page below); Chrome comes back 60 px short.
3. PH-03 slow network: 43.5 s black, no still in front.
4. PH-04 one fling skips the lock (lands 1257 px into the page below).
5. PH-05 the Simulator's Safari loses the amber light (12-15 % darker at 0 / 0.35, 32 % at 0.7; the TV glow on the
   desk gone). Cause not isolated.
Also: PH-06 the portrait slice loses the side walls (must-stays table in the hand-back), PH-07 draw calls, PH-08 the
first swipe barely moves, PH-10 the TV picture squashed ~19 % at 402x714, PH-11 rotation / bar-toggle hitches,
PH-12 the TV reads as a phone on a box in portrait, PH-13 124 hidden label canvases (~35 MB), PH-14 a white first frame
in the Simulator.

## Passes
Touch drives the walk in Chrome; reduced motion; a frozen tab returns without a jump; rotation keeps the walk position;
the intro <= 1 flash a second; no page errors.
