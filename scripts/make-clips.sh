#!/usr/bin/env bash
#
# make-clips.sh — generate the ambient silent tile clips for the homepage Work grid.
#
# For each video it downloads a short segment, strips the audio, crops to a clean
# 16:9, scales down, and writes a small web-optimized MP4 to
#   src/assets/clips/<youtube-id>.mp4
# The homepage plays whatever clips exist (with the card's color veil over them)
# and falls back to the solid colored tile for any that are missing — so you can
# add them one at a time, and updating a video just means re-running this for it.
#
# Requires: yt-dlp and ffmpeg   (macOS: brew install yt-dlp ffmpeg)
#
# Usage:
#   ./scripts/make-clips.sh                 # build clips for every id below
#   ./scripts/make-clips.sh MGMZHuDN-y4     # build/refresh just one
#   START=12 DUR=8 ./scripts/make-clips.sh  # take 8s starting 0:12 into the video
#
# Tunables (env): START (seconds in), DUR (clip length), WIDTH (px), CRF (18 hi … 30 small)
#
set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/assets/clips"
mkdir -p "$OUT_DIR"

START="${START:-8}"     # skip intros/logos; start a few seconds in
DUR="${DUR:-8}"         # 8-second loop reads as continuous motion
WIDTH="${WIDTH:-720}"   # cards are small; 720px wide is crisp and light
CRF="${CRF:-27}"        # 26-30 keeps files ~0.3-1MB each

# The 10 portfolio videos (keep in sync with src/portfolio.json).
IDS=(
  MGMZHuDN-y4 L5QokvTq2HQ xMF5cy9mif0 8H1SwTjS0J8 ItDEzR1s_Cs
  pL--wWygzBE I24REvS3wtY 0R5itL20wK4 boSpnSzFTrE NxzfxyjGjwE
)
[ "$#" -gt 0 ] && IDS=("$@")

for ID in "${IDS[@]}"; do
  OUT="$OUT_DIR/$ID.mp4"
  echo "▶ $ID  (start=${START}s dur=${DUR}s)"
  TMP="$(mktemp -d)"
  yt-dlp -f 'bv*[height<=1080]+ba/b[height<=1080]' \
    --download-sections "*${START}-$((START+DUR+1))" \
    -o "$TMP/src.%(ext)s" "https://www.youtube.com/watch?v=$ID"
  SRC="$(ls "$TMP"/src.* | head -1)"
  ffmpeg -y -i "$SRC" -t "$DUR" -an \
    -vf "crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=${WIDTH}:-2,fps=24" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$CRF" -preset veryfast \
    -movflags +faststart "$OUT"
  rm -rf "$TMP"
  echo "  ✓ $(du -h "$OUT" | cut -f1)  → $OUT"
done

echo
echo "Done. Commit and push the new files:"
echo "  git add src/assets/clips && git commit -m 'Add ambient tile clips' && git push"
