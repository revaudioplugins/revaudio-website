#!/usr/bin/env bash
# Generate a BLANK DRIFT dash plate for the /drift hero trial panel (gpt-image-1).
# Text-only prompt (never upload RevAudio art to an external service, bench law);
# the plate stays a dumb background, everything on it is live HTML.
# Usage: tools/gen-drift-trial-panel.sh <variant A|B|C|D> <out.png>
set -euo pipefail
VAR="${1:?variant}"; OUT="${2:?out.png}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set}"

read -r -d '' BASE <<'P' || true
A single long horizontal dashboard plate from a modern Japanese drift car's interior, photographed perfectly
straight-on (orthographic front view, no perspective, no tilt), centered, floating on a transparent background.
The plate is a wide rounded rectangle about three times as wide as it is tall and fills about 88% of the frame
width. The ENTIRE plate, all four rounded corners and every edge, is fully inside the frame with an empty
transparent margin of at least 5% on every side: nothing is cropped.
Material: dark violet-black anodized steel with a fine horizontal brushed grain and a very subtle purple metallic
flake that sparkles faintly, like a custom car paint seen at night. The edge is a crisp machined chamfer: a thin
cool highlight along the top and left edges, a darker shade along the bottom and right edges, so it reads as a
thick solid metal part. Four small dark gunmetal Phillips-head screws, one near each corner, each turned to a
different angle. Light history: faint fine scratches and slight wear on the chamfer only.
The face is otherwise clean and EMPTY: no text, no letters, no logos, no buttons, no knobs, no displays, no holes,
no stickers unless described below.
Lighting: one soft key light from the upper left with a very gentle falloff across the face, even enough that the
middle could be stretched wider without showing a hot spot; no window reflections; no cast shadow.
Palette: face #150a1f to #1f0f2e (near-black violet), flake #7a2bb0, screws #3a3442 to #6b6478, chamfer highlight
#cdb8e6 at low strength. Every pixel outside the plate is fully transparent (alpha zero): no drop shadow, no
vignette, no background surface.
P

case "$VAR" in
  A) EXTRA="Keep it minimal: just the plate, the chamfer and the four screws." ;;
  B) EXTRA="Add one thin recessed groove running all around the face about 5% in from the edge, with a faint violet neon line (#d23cff, low intensity) glowing softly inside the groove, like underglow tubing set into the metal." ;;
  C) EXTRA="Add one racing-livery decal: a narrow magenta-and-violet checkered stripe (#e040c8 and #8a2be2 checks) that runs along the top-left edge of the face for about a third of the width, slightly worn, printed onto the metal." ;;
  # D = Dan 10-01 "A and C are the best, combine them": A's clean crisp black steel + C's checker decal
  D) EXTRA="Material override: deep black anodized steel with only a faint hint of violet (#0f0a14 to #1a1222), crisp and clean like a premium machined car part, the brushed grain fine and even, the chamfer sharp with a clean cool highlight. Add one racing-livery decal: a narrow magenta-and-violet checkered stripe (#e040c8 and #8a2be2 checks) that runs along the top-left edge of the face for about a third of the width, slightly worn, printed onto the metal and passing under the top-left screw." ;;
  *) echo "variant A|B|C|D"; exit 1 ;;
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
