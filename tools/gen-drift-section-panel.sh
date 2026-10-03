#!/usr/bin/env bash
# Generate a BLANK DRIFT plate for a whole /drift section (gpt-image-1), Dan 2026-10-03:
# "different panel please, use OpenAI" for the #drive section frame. Same law as
# gen-drift-trial-panel.sh: text-only prompt (never upload RevAudio art to an external
# service), the plate is a dumb background, everything on it is live HTML. Details sit
# in the corners only, so the page can 9-slice it to any section size.
# Usage: tools/gen-drift-section-panel.sh <variant E|F|G|H|S> <out.png>
set -euo pipefail
VAR="${1:?variant}"; OUT="${2:?out.png}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set}"
read -r -d '' BASE <<'P' || true
A single large rectangular dashboard panel from a modern Japanese drift car's interior, photographed perfectly
straight-on (orthographic front view, no perspective, no tilt), centered, floating on a transparent background.
The panel is a rounded rectangle about one and a half times as wide as it is tall and fills about 90% of the
frame width. The ENTIRE panel, all four rounded corners and every edge, is fully inside the frame with an empty
transparent margin of at least 4% on every side: nothing is cropped.
The middle of the face is calm, even and EMPTY so live content can sit on top of it: no text, no letters, no
logos, no buttons, no knobs, no displays, no holes, no stickers, no gauges. Any detail lives at the four corners
or runs evenly along the edges.
Lighting: one soft key light from the upper left with a very gentle falloff, even enough that the middle could be
stretched without showing a hot spot; no window reflections; no cast shadow.
Palette: near-black violet (#0f0a14 to #1f0f2e) with accents of violet #8a2be2 and magenta #e040c8 used sparingly.
Every pixel outside the panel is fully transparent (alpha zero): no drop shadow, no vignette, no background surface.
P
case "$VAR" in
  E) EXTRA="Face: dark violet-black carbon fibre, a fine even 2x2 twill weave under a deep glossy clear coat with a faint purple sheen. Frame: a narrow brushed black steel bezel (about 3% of the width) around the carbon, with a crisp machined chamfer catching a thin cool highlight on the top and left. Four small dark gunmetal Phillips-head screws, one in the bezel at each corner, each turned to a different angle." ;;
  F) EXTRA="Face: matte black anodized steel with a fine even brushed grain. One thin recessed groove runs all around the face about 4% in from the edge, with a violet neon tube (#d23cff, low intensity) glowing softly inside the groove, like underglow lighting set into the metal; the glow stays inside the groove. Four small dark gunmetal Phillips-head screws, one near each corner outside the groove, each turned to a different angle. Crisp machined chamfer on the outer edge." ;;
  G) EXTRA="Face: deep black suede (alcantara) like a racing steering wheel rim, soft and matte with a very fine nap. A single line of violet contrast stitching (#8a2be2 thread, small even stitches) runs all around the face about 4% in from the edge. The suede is wrapped over a thin dark steel edge with a subtle chamfer highlight. Four small dark gunmetal hex-socket bolts, one at each corner, each turned to a different angle." ;;
  H) EXTRA="Face: machined gunmetal aluminium, dark grey with a violet tint (#1a1622 to #2a2433), with a very fine even circular-brushed (spun) grain like a premium aftermarket JDM part. A deep crisp machined chamfer runs around the edge with a bright cool highlight on the top and left and a dark shade on the bottom and right, so it reads as a thick billet plate. Four polished steel hex-socket bolts, one at each corner, each turned to a different angle." ;;
  # S = Dan 10-03 "a new panel specific for this section, same style (E), just polished": E at the section's own
  # proportion (~1.3:1, not stretched from 1.6:1), sharper material language. Re-rolled for a pick.
  S) BASE="${BASE/about one and a half times as wide as it is tall and fills about 90% of the
frame width/about 1.3 times as wide as it is tall and fills about 92% of the frame height}"
     EXTRA="Face: dark violet-black carbon fibre, a very fine, crisp, perfectly even 2x2 twill weave with sharp tow edges, under a deep glossy clear coat with a faint purple sheen; the weave is clearly resolved, never blurry or noisy. The carbon face is recessed a few millimetres below the frame, with a thin violet (#8a2be2) anodized lip line where the frame meets the carbon. Frame: a narrow brushed black steel bezel (about 4% of the panel width) with a crisp machined chamfer: a thin cool highlight on the top and left edges, a soft shade on the bottom and right. Four small dark gunmetal Phillips-head screws, one in the bezel at each corner, each turned to a different angle. Premium product photography, ultra sharp, high detail, clean, no grain, no blur." ;;
  *) echo "variant E|F|G|H|S"; exit 1 ;;
esac

BODY="$(python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1]+"\n"+sys.argv[2],"size":"1536x1024","quality":"high","background":"transparent","n":1}))' "$BASE" "$EXTRA")"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
curl -sS https://api.openai.com/v1/images/generations -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" -d "$BODY" -o "$TMP"
python3 - "$TMP" "$OUT" <<'PY'
import base64, json, sys
d = json.load(open(sys.argv[1]))
if not d.get("data"):
    sys.stderr.write(json.dumps(d)[:600] + "\n"); sys.exit(1)
open(sys.argv[2], "wb").write(base64.b64decode(d["data"][0]["b64_json"]))
print("saved", sys.argv[2])
PY
