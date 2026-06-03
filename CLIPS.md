# Ambient Work-card clips

The homepage Work cards play a short, **silent, looping** clip of each video in
the background, with the card's color kept as a veil over the footage so the grid
still reads as your colored design — now in motion. Cards play only while on
screen (they pause as you scroll past), so the page stays smooth.

The page is fully wired for this; it just needs the clip files. Until a clip
exists for a card, that card shows as the solid colored tile exactly as before —
so nothing ever looks broken, and you can add clips one at a time.

## How it works

- Drop a file at `src/assets/clips/<youtube-id>.mp4` (the id is the part after
  `v=` in the YouTube URL — e.g. `MGMZHuDN-y4.mp4`).
- That card fades into its looping clip under the colored veil; cards without a
  file stay solid.

## The easy way — the script

`scripts/make-clips.sh` pulls a few seconds from each video, strips the audio,
and writes a small web-optimized MP4 to the right place.

```bash
# one-time tools (macOS)
brew install yt-dlp ffmpeg

# build clips for all 10 cards
./scripts/make-clips.sh

# or just one, or tune the window/length:
START=12 DUR=8 ./scripts/make-clips.sh MGMZHuDN-y4
```

Then commit and push:

```bash
git add src/assets/clips && git commit -m "Add ambient tile clips" && git push
```

Each clip lands around 0.3–1 MB. Tune `START` (where in the video to begin),
`DUR` (length), `WIDTH`, and `CRF` (quality) — see the comments in the script.

## Updating a video

When you change a card's video, just re-run the script for that one id
(`./scripts/make-clips.sh <new-id>`), commit, and push. The veil and motion
follow automatically.

## The manual way

Any silent MP4 works: name it `<youtube-id>.mp4`, keep it roughly 16:9, a few
seconds long, ~720px wide, H.264 with `-movflags +faststart`, in
`src/assets/clips/`.

## A note on rights

Most cards are network/studio promos and trailers (TNT, Netflix, Apple TV+,
ESPN…) — you did the voiceover, but the footage is owned by those companies.
Re-hosting clips of their footage is a judgment call that's yours to make as the
site owner (showreels are common), which is why you run the script (or supply
clips you have the rights to) rather than it happening automatically.
