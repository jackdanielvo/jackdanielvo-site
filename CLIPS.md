# Ambient tile clips — how to add motion to the Work cards

The homepage Work cards can play a short, **silent, looping** clip in the
background to add movement. The page is already wired for this — it just needs
the clip files. Until a clip exists for a card, that card shows its still
thumbnail exactly as before, so you can add them whenever and one at a time.

## How it works

- Drop a file at `src/assets/clips/<youtube-id>.mp4` (the id is the part after
  `v=` in the YouTube URL — e.g. `MGMZHuDN-y4.mp4`).
- On the live site that card fades into the looping clip; cards without a file
  stay as the thumbnail.
- Clips are **muted** and only play **while the card is on screen**, so the page
  stays smooth. They're skipped entirely for visitors who have "reduce motion"
  on or are in data-saver mode, and on any card whose file is missing.

## The easy way — the script

I included `scripts/make-clips.sh`, which pulls a few seconds from each video,
strips the audio, and writes a small web-optimized MP4 to the right place.

```bash
# one-time tools
brew install yt-dlp ffmpeg

# build clips for all 10 cards
./scripts/make-clips.sh

# or just one card, or tune the window/length:
START=12 DUR=6 ./scripts/make-clips.sh MGMZHuDN-y4
```

Then commit and push:

```bash
git add src/assets/clips && git commit -m "Add ambient tile clips" && git push
```

Each clip lands around 0.3–1 MB. You can tune `START` (where in the video to
begin), `DUR` (length), `WIDTH`, and `CRF` (quality) — see the comments in the
script.

## The manual way

Any silent MP4 works. Just name it `<youtube-id>.mp4`, keep it roughly 16:9, a
few seconds long, ~720px wide, H.264 with `-movflags +faststart`, and put it in
`src/assets/clips/`. (A matching `.webm` is optional and not required.)

## A note on rights

Most of these cards are network/studio promos and trailers (TNT, Netflix, Apple
TV+, ESPN, etc.) — you did the voiceover, but the footage is owned by those
companies. Re-hosting clips of their footage on your own site is a judgment call
that's yours to make as the site owner (showreels are common in the industry,
but it's not my call to download and republish their video). That's why the clip
files aren't generated automatically — you run the script (or supply clips you
have the rights to) so the decision stays with you. If you'd rather not host
studio footage, tell me and I'll switch the cards to a hover-to-play preview
streamed from YouTube instead, which avoids hosting anything.
