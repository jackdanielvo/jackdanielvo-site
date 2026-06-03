#!/usr/bin/env bash
#
# make-clips.sh — generate the ambient silent tile clips for the homepage.
#
# For each video it downloads a short segment, strips the audio, crops to a
# clean 16:9, scales down, and writes a small web-optimized MP4 to
#   src/assets/clips/<youtube-id>.mp4
# The homepage auto-plays whatever clips exist and falls back to the still
# thumbnail for any that are missing — so you can add them one at a time.
#
# Requires: yt-dlp and ffmpeg  (brew install yt-dlp ffmpeg)
#
# Usage:
#   ./scripts/make-clips.sh                 # build clips for every id below
#   ./scripts/make-clips.sh MGMZHuDN-y4     # build just one
#   START=12 DUR=6 ./scripts/make-clips.sh  # take 6s starting at 0:12
#
# Tunables (env): START (seconds into the source), DUR (clip length),
#                 WIDTH (output width px), CRF (quality 18=high … 28=small)
#
set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/assets/clips"
mkdir -p "$OUT_DIR"

START="${START:-8}"     # skip intros/logos; start a few seconds in
DUR="${DUR:-6}"         # 6-second loop is plenty for ambient motion
WIDTH="${WIDTH:-720}"   # cards are small; 720px wide looks crisp and stays light
CRF="${CRF:-26}"        # 24-28 keeps files ~0.3-1MB each

# The 10 portfolio videos (keep in sync with src/portfolio.json).
IDS=(
  MGMZHuDN-y4   # NHL on TNT
  L5QokvTq2HQ   # Vivi Headphones
  xMF5cy9mif0   # Epic Groceries / Hyundai
  8H1SwTjS0J8   # Pluribus
  ItDEzR1s_Cs   # Spaceballs 2
  pL--wWygzBE   # Georgia vs Alabama
  I24REvS3wtY   # The First Omen
  0R5itL20wK4   # Australian Open
  boSpnSzFTrE   # Pluto TV Halloween
  NxzfxyjGjwE   # Ford v Ferrari
)
[ "$#" -gt 0 ] && IDS=("$@")

for ID in "${IDS[@]}"; do
  OUT="$OUT_DIR/$ID.mp4"
  echo "▶ $ID  (start=${START}s dur=${DUR}s)"
  TMP="$(mktemp -d)"
  # Download just the needed window in decent quality (no audio needed later).
  yt-dlp -f 'bv*[height<=1080]+ba/b[height<=1080]' \
    --download-sections "*${START}-$((START+DUR+1))" \
    -o "$TMP/src.%(ext)s" "https://www.youtube.com/watch?v=$ID"
  SRC="$(ls "$TMP"/src.* | head -1)"
  # Crop to 16:9, scale, drop audio, web-optimize (faststart for instant play).
  ffmpeg -y -i "$SRC" -t "$DUR" -an \
    -vf "crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=${WIDTH}:-2,fps=24" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$CRF" -preset veryfast \
    -movflags +faststart "$OUT"
  rm -rf "$TMP"
  echo "  ✓ $(du -h "$OUT" | cut -f1)  → $OUT"
done

echo
echo "Done. Commit the new files in src/assets/clips/ and push:"
echo "  git add src/assets/clips && git commit -m 'Add ambient tile clips' && git push"
