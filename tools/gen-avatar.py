#!/usr/bin/env python3
# gen-avatar.py — RevAudio Google Workspace account / email profile picture.
# "RA" monogram, on-brand (warm near-black weathered metal + brass + oxide-red),
# rendered via OpenAI gpt-image-1. Displays as a small circle in Gmail avatars,
# so the mark must read from far away: bold condensed caps, high contrast,
# centered with a circle-crop-safe margin, minimal clutter.
#
# Generates 4 candidates for pick. Key from tools/.openai_key.local or $OPENAI_API_KEY.
#   python3 gen-avatar.py            -> writes all 4 to SCRATCH
import base64
import json
import os
import sys
import urllib.request

SCRATCH = "/private/tmp/claude-501/-Users-danavivi-workspace/f434c849-df49-4d67-910e-4f2410a96a34/scratchpad"
KEY_FILE = os.path.join(os.path.dirname(__file__), ".openai_key.local")

# --- brand-locked prompt fragments ------------------------------------------
GROUND = (
    "The background fills the entire square edge to edge with a warm near-black "
    "weathered brushed-metal surface (#0b0a09 to #14110f), subtle patina, faint "
    "dark vignette. No license plate, no bolt holes, no border frame clutter, no "
    "extra text, no tagline. Clean, premium, minimal."
)
MONO = (
    "A bold two-letter monogram reading 'RA' in tall condensed uppercase letters "
    "(Bebas Neue / vintage license-plate style), embossed and engraved into the "
    "metal with a crisp beveled edge and a soft drop shadow. The monogram is "
    "perfectly centered and occupies about 55 percent of the frame, with generous "
    "empty margin all around so nothing is clipped when cropped to a circle. Both "
    "letters are sharp, legible, and readable from far away at small size."
)
TWO_COLOR = "The letter R is oxide rust-red (#c8331f), the letter A is warm brass gold (#e8c878)."
ALL_BRASS = "Both letters are warm brass gold (#e8c878 with #c9a35c shading), gleaming."
RING = (
    "A thin polished brass circular ring (#c9a35c) is inscribed just inside the "
    "square edges, framing the monogram like a coin or medallion."
)

CANDIDATES = {
    "a-twocolor-ring": f"{MONO} {TWO_COLOR} {RING} {GROUND} Square avatar, vintage industrial muscle-car aesthetic.",
    "b-twocolor-plain": f"{MONO} {TWO_COLOR} {GROUND} Square avatar, vintage industrial muscle-car aesthetic.",
    "c-brass-ring": f"{MONO} {ALL_BRASS} {RING} {GROUND} Square avatar, vintage industrial muscle-car aesthetic.",
    "d-brass-plain": f"{MONO} {ALL_BRASS} {GROUND} Square avatar, vintage industrial muscle-car aesthetic, high contrast.",
}


def get_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE) as f:
            k = f.read().strip()
            if k:
                return k
    k = os.environ.get("OPENAI_API_KEY", "").strip()
    if not k:
        sys.exit("no key: put it in .openai_key.local or export OPENAI_API_KEY")
    return k


def gen(key, prompt):
    body = json.dumps({
        "model": "gpt-image-1",
        "prompt": prompt,
        "size": "1024x1024",
        "quality": "high",
        "n": 1,
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    return base64.b64decode(data["data"][0]["b64_json"])


def main():
    key = get_key()
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for name, prompt in CANDIDATES.items():
        if only and only not in name:
            continue
        out = os.path.join(SCRATCH, f"revaudio-avatar-{name}.png")
        print(f"generating {name} ...", flush=True)
        try:
            png = gen(key, prompt)
        except urllib.error.HTTPError as e:
            print(f"  FAILED {name}: {e.code} {e.read()[:300]}", flush=True)
            continue
        with open(out, "wb") as f:
            f.write(png)
        print(f"  saved {out} ({len(png)//1024} KB)", flush=True)


if __name__ == "__main__":
    main()
