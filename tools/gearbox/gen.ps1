# Gearbox bundle art (plugins page). One photograph of the console + the parts that move.
# ASCII only (PS 5.1). Usage: .\gen.ps1 -Which console|knob|needle|obdtune [-Model gpt-image-2] [-Tag a]
# Raw outputs land in tools/gearbox/raw/; process_art.py cuts the web assets from them.
param(
  [Parameter(Mandatory=$true)][string]$Which,
  [string]$Model = 'gpt-image-2',
  [string]$Tag = 'a',
  [string]$Quality = 'high'
)
$ErrorActionPreference = 'Stop'
$img = 'C:\RevAudio\shared\tools\openai\image.ps1'
$raw = Join-Path $PSScriptRoot 'raw'

$look = 'Photographed, not drawn: real materials, real light. One warm key light from the upper left like a garage bench lamp at night, soft falloff, deep warm shadows to the lower right, chrome with a cool reflection on top and a warm reflection below. Long lens, fine film grain, Kodak Portra colour. Late 1960s muscle-car era, elegant, restrained, sexy, aged patina: fine scratches, worn edges, a little dust, screws each turned to a different angle. No pure black, no pure white. No text, no letters, no numbers, no logos anywhere.'

# gpt-image-2 has no transparent output: the cut-out parts sit on a flat green screen, process_art.py keys it out
$key = 'Shot on a perfectly flat, evenly lit, uniform chroma-key green background (pure #00B140), no texture, no gradient, no cast shadow on the background, no reflection of the green on the object.'

$jobs = @{
  console = @{
    size = '3072x1024'; bg = 'opaque'
    prompt = "Straight-on top-down orthographic photograph of ONE vintage car center console panel, very wide panoramic format, the panel filling the whole frame edge to edge, no perspective, no surroundings. The panel: dark oiled walnut wood with a black crackle-finish steel surround and brushed chrome trim. Laid out left to right with generous even spacing: (1) LEFT THIRD: a polished chrome shift-gate plate screwed into the wood, cut through with an empty H-shaped gate slot (two parallel vertical slots joined in the middle by one horizontal slot), the slot deep and dark, NO lever, NO knob, the gate empty. (2) CENTRE: a round vintage tachometer with a thick chrome bezel and a domed glass, an aged cream dial face with only plain black tick marks around a 240 degree arc opening at the bottom and a short red painted zone at the end of the arc, a small dark chrome hub cap in the exact centre, NO needle, NO numbers. (3) RIGHT THIRD: a brass clip board plate holding one blank cream paper card, slightly yellowed, completely empty, no writing, no lines. (4) Along the TOP EDGE of the whole panel: a thin chrome strip with four small round jewelled indicator lamp lenses in a row near its left end (green, green, amber, red glass, all unlit and dim) and beside them one small rectangular dark smoked glass window, unlit. $look"
  }
  knob = @{
    size = '1024x1024'; bg = 'opaque'
    prompt = "Top-down orthographic product photograph seen from directly above of a single vintage 1960s gear shift knob: a round polished dark bakelite ball, deep warm brown-black, with a thin brushed chrome collar ring around its base, a soft specular highlight toward the upper left, tiny scratches and wear on the top where a hand grips it. Centred, filling about 60 percent of the frame. $key $look"
  }
  needle = @{
    size = '1024x1536'; bg = 'opaque'
    prompt = "A single vintage car gauge needle, photographed straight on, standing exactly vertical and pointing straight up, centred horizontally: a long thin tapered pointer in warm oxide orange-red enamel paint with a slim cream line down its centre, a little paint wear, a slight edge highlight on its left side from a lamp at the upper left. The needle starts with a narrow tail at the bottom and ends in a fine point near the top of the frame; NO hub, NO dial. $key $look"
  }
  obdtune = @{
    size = '1536x1024'; bg = 'opaque'
    prompt = "Product shot of an audio plugin window designed as a vintage 1960s car diagnostic tuning scanner, seen straight on and filling the frame: a dark green-grey crackle steel faceplate with a large round oscilloscope-style dial on the left glowing faint green, a row of three chunky knurled chrome knobs, two toggle switches and a small analog VU meter on the right, worn paint, brass screws. $look"
  }
}

$j = $jobs[$Which]
if (-not $j) { throw "unknown -Which $Which" }
$out = Join-Path $raw ("$Which-$Tag.png")
& $img -Prompt $j.prompt -Out $out -Size $j.size -Quality $Quality -Background $j.bg -Model $Model
if (-not (Test-Path $out)) { throw "no image written: $out" }
