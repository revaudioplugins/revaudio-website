#!/usr/bin/env bash
# The /obdtune hero runs the plugin's OWN screen code (OBDTune repo Source/ui/public: obdtune.css, obdtune.js,
# obdtune-custom.js + the PHOTO skin's photos), so the page shows exactly what the plugin shows. This copies them from a
# ref of the plugin repo (no checkout needed) into public/obdtune/ui/ and writes src/data/obdtune-ui.json (ref, commit,
# version for the INFO page). The copies are never edited by hand: re-run this when Yoni / Dan change the UI.
#
#   tools/obdtune-ui/sync.sh [repo=~/RevTune] [ref=origin/obdtune-fx]
#
# Two changes on the way, nothing else:
#   - the PNG photos become WebP (plate-A2 2.1 MB -> a few hundred KB), the CSS urls follow;
#   - the CSS's @font-face (a bench-relative path) is dropped: the page declares "OBD Pixel" on the site's VT323.
set -euo pipefail
REPO="${1:-$HOME/RevTune}"
REF="${2:-origin/obdtune-fx}"
SITE="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$SITE/public/obdtune/ui"
SRC="Source/ui/public"

git -C "$REPO" fetch -q origin || true
COMMIT="$(git -C "$REPO" rev-parse --short "$REF")"
VERSION="$(git -C "$REPO" show "$REF:CMakeLists.txt" | sed -n 's/^project([A-Za-z]* VERSION \([0-9.]*\)).*/\1/p')"

rm -rf "$OUT"; mkdir -p "$OUT/assets/photo"
for f in obdtune.js obdtune-custom.js; do git -C "$REPO" show "$REF:$SRC/$f" > "$OUT/$f"; done
git -C "$REPO" show "$REF:$SRC/obdtune.css" \
  | sed -e '/^@font-face { font-family: "OBD Pixel"/d' -e 's#\(assets/photo/[A-Za-z0-9-]*\)\.png#\1.webp#g' \
  > "$OUT/obdtune.css"

TMP="$(mktemp -d)"
for p in $(git -C "$REPO" ls-tree --name-only "$REF" "$SRC/assets/photo/"); do
  name="$(basename "$p")"
  git -C "$REPO" show "$REF:$p" > "$TMP/$name"
  case "$name" in
    *.png) cwebp -quiet -q 88 -alpha_q 100 -m 6 "$TMP/$name" -o "$OUT/assets/photo/${name%.png}.webp" ;;
    *) cp "$TMP/$name" "$OUT/assets/photo/$name" ;;
  esac
done
rm -rf "$TMP"

printf '{ "ref": "%s", "commit": "%s", "version": "%s" }\n' "$REF" "$COMMIT" "$VERSION" > "$SITE/src/data/obdtune-ui.json"
echo "synced $REF ($COMMIT, $VERSION) -> public/obdtune/ui"
du -sh "$OUT"
