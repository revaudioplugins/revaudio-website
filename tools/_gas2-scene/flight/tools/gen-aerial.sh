#!/usr/bin/env bash
# (OUT=<dir> = where the files land; key: tools/.openai_key.local of the website clone, never printed)
# Paint the flight lab's blockout render (camera = the hover pose) into a photoreal aerial with gpt-image-2.
# Usage: gen-aerial.sh <proxy.png> <tag> [n] [extra -F args...]   -> aerial-<tag><k>.png
set -euo pipefail
cd "${OUT:-.}"
SRC="$1"; TAG="$2"; N="${3:-2}"; shift 3 || true
EXPO="${EXPO:-Keep the dark blue-hour exposure and the colours of the render: the desert and the roof in deep cool dusk shadow, the only warm light the glowing shop front, its two porch lamps and the light they spill onto the sidewalk and the apron.}"
MOOD="${MOOD:-the sun has just set; cool blue-hour light on everything, a faint warm afterglow from the right, soft long shadows}"
KEY="$(tr -d '[:space:]' < "$HOME/projects/revaudio/revaudio-website/tools/.openai_key.local")"
PROMPT="Turn this rough 3D blockout render into a photorealistic aerial drone photograph. Keep the camera, the framing and the position, size and shape of every element exactly as they are in the render; only replace the flat placeholder surfaces with real materials. The scene: a lone single-storey early-1950s roadside gas station in the empty American desert at dusk, seen from a drone about 25 metres up, looking down at about 45 degrees. The building: weathered sun-bleached cream stucco walls, a flat tar-and-gravel roof with a slim parapet edge, two small rooftop vents and a stove pipe; the roof runs on past the right end of the building as a flat porch canopy. Keep the lit shop front exactly as it is in the render: the multi-pane window glowing warm amber, the red vintage gas pump with its white globe on the concrete sidewalk in front of it, the wooden radio on its bench, the posters in the window, the yellow-and-black striped oil-drum stand, the small chalkboard sign, the two porch lamps glowing warm. In front of the station: a cracked, oil-stained concrete apron, then the edge of an empty two-lane asphalt highway with a faded yellow centre line. All around: flat sandy desert with sparse dry creosote, brush and a few tumbleweeds, old tyre tracks curving from the road across the dirt to the apron. Light: $MOOD; warm incandescent light spilling from the shop window and the lamps onto the sidewalk. $EXPO Photorealistic, 35mm film look, natural grain, no CGI look. Strict: no people, no cars, no animals, no extra buildings, no extra pumps, no new signs or lettering."
curl -s https://api.openai.com/v1/images/edits -H "Authorization: Bearer $KEY" \
  -F model=gpt-image-2 -F "prompt=$PROMPT" -F n="$N" -F size=1536x1024 -F quality=high "$@" \
  -F "image[]=@$SRC" -o "resp-$TAG.json"
python3 - "$TAG" <<'PY'
import json, sys, base64
t = sys.argv[1]; d = json.load(open(f'resp-{t}.json'))
if not d.get('data'): sys.exit('API error: ' + json.dumps(d)[:800])
for i, it in enumerate(d['data'], 1):
    open(f'aerial-{t}{i}.png', 'wb').write(base64.b64decode(it['b64_json'])); print('saved', f'aerial-{t}{i}.png')
print('usage', json.dumps(d.get('usage', {}).get('output_tokens')))
PY
rm -f "resp-$TAG.json"
