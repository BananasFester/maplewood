# Soundtrack tools

The five songs in `music/` are original pieces, composed in code and rendered with a General MIDI
soundfont. Each song in `songs.py` is built from reusable parts (`parts.py`: chord progressions,
melodies, Travis picking, bossa guitar, walking bass, pads and so on) on top of the helpers in
`mlib.py` (notes, voicings, MIDI writing, stem rendering, reverb, mixing).

| Song | Tempo | Style | Plays |
|---|---|---|---|
| `maple_morning` | 96 | Fingerpicked acoustic guitar | Day |
| `saturday_errands` | 104 | Strummed pop with light drums | Day, build |
| `corner_cafe` | 112 | Swing jazz with walking bass | Day, night, build |
| `porch_swing` | 128 | Bossa nova | Day, night, build |
| `streetlights` | 66 | Slow piano arpeggios | Night |

## Rebuild the music

Needs Python 3 with `numpy scipy mido` (plus `pyloudnorm` for `analyze.py` and `pillow` for
`viz.py`), and the `fluidsynth` and `ffmpeg` command line tools.

1. Download the GeneralUser GS soundfont by S. Christian Collins from
   https://github.com/mrbumpy409/GeneralUser-GS (`GeneralUser-GS.sf2`). It is git-ignored here.
2. Render, mix, master to about -17 LUFS and encode to MP3:

```sh
python3 tools/music/build_music.py path/to/GeneralUser-GS.sf2 tools/music/out            # all songs
python3 tools/music/build_music.py path/to/GeneralUser-GS.sf2 tools/music/out corner_cafe # one song
cp tools/music/out/*.mp3 music/
```

Helpers: `analyze.py` prints the loudness of each instrument stem through a song, `scan.py`
flags melody notes that clash a semitone against the accompaniment, and `viz.py` draws
spectrograms to compare mixes.

The game's music player (`MUS` in `src/08_modes.js`) streams `music/<song>.mp3` with crossfades
and picks from separate day, night and build playlists, so a new song also needs adding to its
title list and playlists there.
