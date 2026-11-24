"""Five original pieces for Maple Lane. Melodies are written by hand; accompaniment comes from parts.py patterns."""
from mlib import Song, nn, chord, voicing, bass_note, clean_clashes
from parts import (prog, segs, melody, travis, strum, bossa_guitar, bossa_bass, walking, comp_swing, pad, arpeggio,
                   root_fifth, drums, jazz)


def guide(song, ch, bars, start_bar, vel=52, lo=55, hi=70, dur_scale=1.0):
    """Smooth line of 3rds and 7ths, one note per chord: a soft harmony part."""
    last = (lo + hi) // 2
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        pcs = [(c['root'] + iv) % 12 for iv in c['ivs'] if iv % 12 in (3, 4, 10, 11, 9, 2)] or [(c['root'] + 4) % 12]
        cands = [m for m in range(lo, hi + 1) if m % 12 in pcs]
        p = min(cands, key=lambda m: abs(m - last)); last = p
        song.add(beat, dur * dur_scale, p, vel, ch, human=0.01, legato=0.98, swing=False)


def offbeat_pluck(song, ch, bars, start_bar, vel=46, lo=62, hi=79):
    prev = None
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        v = voicing(c, 2, lo, hi, prev); prev = v
        for k in range(int(dur)):
            for p in v:
                song.add(beat + k + .5, .3, p, vel - (4 if k % 2 else 0), ch, human=0.006, legato=0.8)


def final_chord(song, ch, sym, beat, dur, lo, hi, n=4, vel=60, roll=0.03):
    c = chord(sym)
    v = voicing(c, n, lo, hi)
    for j, p in enumerate(v):
        song.add(beat + j * roll, dur, p, vel - j * 2, ch, human=0.004, legato=1.0, swing=False)


# ------------------------------------------------------------------ 1. Maple Morning
def maple_morning():
    s = Song('maple_morning', 96, seed=11)
    s.inst(0, 0, 25, 'Steel Guitar', pan=48, rev=.22, gain_db=0)
    s.inst(1, 0, 73, 'Flute', pan=74, rev=.36, gain_db=-3.5, hp=180)
    s.inst(2, 0, 9, 'Glockenspiel', pan=84, rev=.42, gain_db=3, hp=400)
    s.inst(3, 0, 32, 'Acoustic Bass', pan=64, rev=.06, gain_db=-1)
    s.inst(4, 0, 49, 'Slow Strings', pan=60, rev=.5, gain_db=-2, hp=150)
    s.inst(9, 0, 0, 'Drums', pan=64, rev=.14, gain_db=0)
    INTRO = prog('G | Cadd9 | Em7 | D7sus4 D7')
    A1 = prog('G | D/F# | Em7 | Cmaj7 | G/B | C | Am7 | D7sus4 D7')
    A2 = prog('G | D/F# | Em7 | Cmaj7 | G/B | C | Am7 D7 | G')
    B = prog('C | D | Bm7 | Em7 | Am7 | D/F# | G/B C | D7sus4 D7')
    BR = prog('Em | C | G | D | Em | C | Am7 | D7')
    OUT = prog('G | Cadd9 | Am7 D7sus4 | G')
    mA1 = ('B4:.5 D5:.5 E5:1 D5:2 | r:1 A4:.5 B4:.5 A4:1 F#4:1 | G4:.5 B4:.5 D5:1 G5:1.5 F#5:.5 | E5:3 r:1 | '
           'B4:.5 D5:.5 E5:1 D5:1 B4:1 | C5:1 E5:1 G5:1 E5:1 | D5:1.5 C5:.5 B4:1 A4:1 | A4:3 r:1')
    mA2 = ('B4:.5 D5:.5 E5:1 D5:2 | r:1 A4:.5 B4:.5 A4:1 F#4:1 | G4:.5 B4:.5 D5:1 G5:1.5 F#5:.5 | E5:2 D5:.5 E5:.5 G5:1 | '
           'A5:1.5 G5:.5 E5:1 D5:1 | C5:1 E5:1 D5:1 C5:1 | B4:1 A4:1 C5:1 F#4:1 | G4:3 r:1')
    mB = ('E5:1.5 D5:.5 E5:1 G5:1 | F#5:2 E5:1 D5:1 | D5:1.5 B4:.5 D5:1 F#5:1 | E5:3 r:1 | '
          'C5:1.5 B4:.5 C5:1 E5:1 | D5:2 A4:1 D5:1 | B4:1 D5:1 E5:1 G5:1 | G5:2 F#5:1 D5:1')
    mBR = ('G5:.5 F#5:.5 E5:.5 B4:.5 E5:1 G5:1 | G5:.5 E5:.5 C5:.5 E5:.5 G5:2 | D5:.5 G5:.5 B5:.5 A5:.5 G5:1 D5:1 | F#5:2 A5:2 | '
           'G5:.5 F#5:.5 E5:.5 B4:.5 E5:1 G5:1 | A5:.5 G5:.5 E5:.5 C5:.5 E5:2 | C5:1 E5:1 A5:1 G5:1 | F#5:1 E5:1 D5:1 C5:1')
    mOUT = 'B4:.5 D5:.5 E5:1 D5:2 | E5:2 D5:2 | C5:2 A4:2 | G4:4'
    plan = [('intro', INTRO), ('a1', A1), ('a2', A2), ('b', B), ('a1g', A1), ('a2', A2), ('br', BR), ('b2', B), ('a2f', A2), ('out', OUT)]
    bar = 0
    for name, P in plan:
        n = len(P); b0 = bar * 4
        s.chords += [(beat, dur, c) for beat, dur, c, bi, pos in segs(P, bar)]
        travis(s, 0, P[:3] if name == 'out' else P, bar, vel=58 if name in ('intro', 'a1g', 'br', 'out') else 62)
        if name != 'intro':
            root_fifth(s, 3, P[:3] if name == 'out' else P, bar, vel=70 if name not in ('a1g', 'br') else 62)
        if name == 'intro':
            drums(s, 'shaker', bar + 2, 2)
        elif name in ('a1', 'a2', 'a2f'):
            drums(s, 'folk', bar, n, level=.9, fill_last=True)
        elif name in ('b', 'b2'):
            drums(s, 'folk2', bar, n, fill_last=True, crash_first=True)
        elif name in ('a1g', 'br'):
            drums(s, 'shaker', bar, n)
        if name == 'a1': melody(s, 1, b0, mA1, vel=70)
        if name == 'a2': melody(s, 1, b0, mA2, vel=72)
        if name == 'b':
            melody(s, 1, b0, mB, vel=76); pad(s, 4, P, bar, vel=44)
            s.ramp(4, 11, b0, b0 + 16, 70, 112); s.ramp(4, 11, b0 + 24, b0 + 32, 112, 80)
        if name == 'a1g': melody(s, 2, b0, mA1, vel=92, shift=12, legato=.6)
        if name == 'br':
            melody(s, 2, b0, mBR, vel=90, legato=.6); guide(s, 1, P, bar, vel=46, lo=64, hi=76)
            pad(s, 4, P, bar, vel=38); s.ramp(4, 11, b0, b0 + 32, 60, 100)
        if name == 'b2':
            melody(s, 1, b0, mB, vel=78); melody(s, 2, b0, mB, vel=62, shift=12, legato=.6); pad(s, 4, P, bar, vel=48)
            s.ramp(4, 11, b0, b0 + 32, 100, 118)
        if name == 'a2f':
            melody(s, 1, b0, mA2, vel=74); melody(s, 2, b0, mA2, vel=62, shift=12, legato=.6); pad(s, 4, P, bar, vel=46)
            s.ramp(4, 11, b0 + 16, b0 + 32, 110, 70)
        if name == 'out':
            melody(s, 2, b0, mOUT, vel=84, shift=12, legato=.7)
            s.add(b0 + 12, 6, nn('G1') + 12, 62, 3, legato=1)
            final_chord(s, 0, 'G', b0 + 12, 6, 50, 72, n=4, vel=60, roll=.06)
            s.ritard(b0 + 8, b0 + 16, 80)
        bar += n
    s.cleaned = clean_clashes(s, (1, 2))
    return s


# ------------------------------------------------------------------ 2. Corner Cafe
def corner_cafe():
    s = Song('corner_cafe', 112, seed=22, swing=0.64)
    s.inst(0, 8, 4, 'Chorused Tine EP', pan=50, rev=.28, gain_db=-2.5, chorus=60, hp=120)
    s.inst(1, 0, 11, 'Vibraphone', pan=78, rev=.34, gain_db=1.5, hp=200)
    s.inst(2, 0, 71, 'Clarinet', pan=60, rev=.32, gain_db=-2, hp=150)
    s.inst(3, 0, 32, 'Acoustic Bass', pan=64, rev=.06, gain_db=-3)
    s.inst(9, 0, 40, 'Brush Kit', pan=64, rev=.16, gain_db=4)
    INTRO = prog('Gm7 C7 | Am7 D7 | Gm7 C7 | Fmaj7 C7')
    A1 = prog('Fmaj7 D7 | Gm7 C7 | Am7 D7 | Gm7 C7 | Fmaj7 F7 | Bbmaj7 Bbm6 | Am7 D7 | Gm7 C7')
    A2 = prog('Fmaj7 D7 | Gm7 C7 | Am7 D7 | Gm7 C7 | Fmaj7 F7 | Bbmaj7 Bbm6 | Gm7 C7 | F6')
    B = prog('Am7 | D7 | Gm7 | C7 | Am7 | D7 | Gm7 | C7')
    TAG = prog('Gm7 C7 | Am7 D7 | Gm7 C7 | Fmaj7 | Fmaj7')
    head = 'A4:1 C5:.5 A4:.5 F#4:.5 A4:.5 C5:1 | Bb4:1.5 A4:.5 G4:1 E4:1 | C5:.5 E5:.5 G5:.5 E5:.5 F#5:1 D5:1 | F5:.5 D5:.5 Bb4:.5 G4:.5 E5:2 | A4:1 C5:.5 F5:.5 E5:.5 Eb5:.5 C5:1 | D5:1.5 C5:.5 Db5:1 Bb4:1'
    mA1 = head + ' | C5:1 A4:.5 G4:.5 F#4:1 A4:1 | G4:3 r:1'
    mA2 = head + ' | Bb4:1 A4:.5 G4:.5 E4:1 G4:1 | F4:3 r:1'
    mB = ('E5:1.5 D5:.5 C5:1 A4:1 | F#4:1 A4:1 C5:1 D5:1 | D5:1.5 C5:.5 Bb4:1 G4:1 | E4:1 G4:1 Bb4:1 C5:1 | '
          'E5:.5 G5:.5 E5:.5 C5:.5 A4:2 | A4:.5 C5:.5 D5:.5 F#5:.5 A5:2 | G5:1 F5:1 D5:1 Bb4:1 | C5:2 Bb4:.5 G4:.5 E4:1')
    vhead = 'r:.5 A4:.5 C5:.5 E5:.5 D5:.5 C5:.5 A4:1 | Bb4:.5 D5:.5 F5:.5 D5:.5 E5:2 | C5:1 E5:.5 G5:.5 F#5:.5 E5:.5 D5:1 | Bb4:1.5 G4:.5 E4:2 | F4:.5 A4:.5 C5:.5 E5:.5 Eb5:1 C5:1 | D5:1 F5:.5 D5:.5 Db5:1.5 Bb4:.5'
    vA1 = vhead + ' | C5:.5 B4:.5 A4:.5 G4:.5 F#4:1 C5:1 | Bb4:2 A4:.5 G4:.5 E4:1'
    vA2 = vhead + ' | Bb4:1 D5:.5 C5:.5 Bb4:.5 G4:.5 E4:1 | F4:2 r:2'
    mTAG = 'Bb4:1 A4:.5 G4:.5 E4:1 G4:1 | C5:1 A4:.5 G4:.5 F#4:1 A4:1 | Bb4:1 A4:.5 G4:.5 E4:1 G4:1 | F4:4 | r:4'
    plan = [('intro', INTRO), ('a1', A1), ('a2', A2), ('b', B), ('a2', A2), ('a1v', A1), ('a2v', A2), ('b2', B), ('a2f', A2), ('tag', TAG)]
    bar = 0
    for name, P in plan:
        n = len(P); b0 = bar * 4
        s.chords += [(beat, dur, c) for beat, dur, c, bi, pos in segs(P, bar)]
        PP = P[:3] if name == 'tag' else P
        comp_swing(s, 0, PP, bar, vel=50 if name in ('a1v', 'b2') else 54)
        walking(s, 3, PP, bar, vel=76)
        drums(s, 'brush', bar, len(PP), level=.85 if name in ('intro', 'a1') else 1.0, fill_last=name in ('a2', 'b', 'a2v', 'b2', 'tag'))
        if name == 'a1': melody(s, 1, b0, mA1, vel=70, legato=.85)
        if name == 'a2': melody(s, 1, b0, mA2, vel=72, legato=.85)
        if name == 'b': melody(s, 2, b0, mB, vel=74, legato=.95)
        if name == 'a1v': melody(s, 2, b0, vA1, vel=74, legato=.95)
        if name == 'a2v': melody(s, 1, b0, vA2, vel=72, legato=.85)
        if name == 'b2':
            melody(s, 1, b0, mB, vel=72, legato=.85); guide(s, 2, P, bar, vel=50, lo=55, hi=69)
        if name == 'a2f':
            melody(s, 1, b0, mA2, vel=74, legato=.85); melody(s, 2, b0, mA2, vel=56, shift=-12, legato=.95)
        if name == 'tag':
            melody(s, 1, b0, mTAG, vel=70, legato=.85)
            final_chord(s, 0, 'Fmaj9', b0 + 12, 6, 53, 74, n=5, vel=56, roll=.05)
            s.add(b0 + 12, 6, nn('F1') + 12, 70, 3, legato=1, swing=False); s.add(b0 + 12, 1, 51, 40, 9, swing=False); s.add(b0 + 12, 1, 36, 34, 9, swing=False)
            s.ritard(b0 + 8, b0 + 14, 92)
        bar += n
    s.cleaned = clean_clashes(s, (1, 2))
    return s


# ------------------------------------------------------------------ 3. Porch Swing (bossa)
def porch_swing():
    s = Song('porch_swing', 128, seed=33)
    s.inst(0, 0, 24, 'Nylon Guitar', pan=54, rev=.24, gain_db=0)
    s.inst(1, 0, 73, 'Flute', pan=72, rev=.36, gain_db=-2, hp=180)
    s.inst(2, 0, 11, 'Vibraphone', pan=82, rev=.36, gain_db=1.5, hp=200)
    s.inst(3, 0, 32, 'Acoustic Bass', pan=64, rev=.06, gain_db=-2.5)
    s.inst(4, 0, 49, 'Slow Strings', pan=58, rev=.55, gain_db=-7, hp=150)
    s.inst(9, 0, 0, 'Drums', pan=64, rev=.12, gain_db=-3)
    INTRO = prog('Cmaj7 | Cmaj7 | Dm7 | G7')
    A1 = prog('Cmaj7 | Cmaj7 | D7 | D7 | Dm7 | G7 | Em7 A7 | Dm7 G7')
    A2 = prog('Cmaj7 | Cmaj7 | D7 | D7 | Dm7 | G7 | Cmaj7 | Cmaj7')
    B = prog('Fmaj7 | Fm6 | Em7 | A7b9 | Dm7 | G7 | Em7 A7 | Dm7 G7')
    OUT = prog('Cmaj7 | Dm7 G7 | Cmaj7 | Cmaj7')
    head = 'E5:1.5 D5:.5 E5:1 G5:1 | r:.5 E5:.5 D5:.5 C5:.5 B4:2 | A4:1.5 B4:.5 C5:1 D5:1 | F#5:2 E5:1 D5:1 | F5:1.5 E5:.5 D5:1 C5:1 | B4:2 r:.5 G4:.5 A4:.5 B4:.5'
    mA1 = head + ' | D5:1 B4:1 C#5:1 E5:1 | D5:2 B4:1 G4:1'
    mA2 = head + ' | E5:1.5 D5:.5 C5:2 | r:4'
    mB = ('A5:1.5 G5:.5 A5:1 C6:1 | Ab5:2 G5:1 F5:1 | G5:1.5 F#5:.5 E5:1 D5:1 | C#5:2 Bb4:1 A4:1 | '
          'F5:1.5 E5:.5 F5:1 A5:1 | G5:2 F5:1 D5:1 | E5:1 G5:1 C#5:1 A4:1 | D5:1 F5:1 B4:1 G4:1')
    mOUT = 'E5:1.5 D5:.5 E5:1 G5:1 | F5:1 D5:1 B4:1 G4:1 | E5:4 | r:4'
    plan = [('intro', INTRO), ('a1', A1), ('a2', A2), ('b', B), ('a2', A2), ('a1v', A1), ('bv', B), ('a2f', A2), ('out', OUT)]
    bar = 0
    for name, P in plan:
        n = len(P); b0 = bar * 4
        s.chords += [(beat, dur, c) for beat, dur, c, bi, pos in segs(P, bar)]
        PP = P[:2] if name == 'out' else P
        bossa_guitar(s, 0, PP, bar, vel=56)
        if name != 'intro':
            bossa_bass(s, 3, PP, bar, vel=74)
        drums(s, 'bossa_light' if name in ('intro', 'a1v', 'out') else 'bossa', bar, len(PP))
        if name == 'a1': melody(s, 1, b0, mA1, vel=70, legato=.9)
        if name == 'a2': melody(s, 1, b0, mA2, vel=72, legato=.9)
        if name == 'b':
            melody(s, 1, b0, mB, vel=74, legato=.9); pad(s, 4, P, bar, vel=40); s.ramp(4, 11, b0, b0 + 32, 70, 112)
        if name == 'a1v':
            melody(s, 2, b0, mA1, vel=66, legato=.8); guide(s, 1, P, bar, vel=46, lo=60, hi=74)
        if name == 'bv':
            melody(s, 2, b0, mB, vel=66, legato=.8); guide(s, 1, P, bar, vel=48, lo=62, hi=76)
            pad(s, 4, P, bar, vel=42); s.ramp(4, 11, b0, b0 + 32, 90, 118)
        if name == 'a2f':
            melody(s, 1, b0, mA2, vel=72, legato=.9); pad(s, 4, P, bar, vel=36); s.ramp(4, 11, b0, b0 + 32, 110, 60)
        if name == 'out':
            melody(s, 1, b0, mOUT, vel=66, legato=.9)
            final_chord(s, 0, 'Cmaj9', b0 + 8, 8, 52, 72, n=5, vel=54, roll=.05)
            s.add(b0 + 8, 8, nn('C2'), 70, 3, legato=1); s.add(b0 + 8, 1, 37, 30, 9)
            s.ritard(b0 + 4, b0 + 12, 104)
        bar += n
    s.cleaned = clean_clashes(s, (1, 2))
    return s


# ------------------------------------------------------------------ 4. Streetlights (night)
def streetlights():
    s = Song('streetlights', 66, seed=44)
    s.inst(0, 0, 0, 'Piano LH', pan=56, rev=.42, gain_db=-3)
    s.inst(1, 0, 0, 'Piano RH', pan=68, rev=.42, gain_db=2.5)
    s.inst(2, 0, 49, 'Slow Strings', pan=62, rev=.6, gain_db=-9, hp=140)
    s.inst(3, 0, 35, 'Fretless Bass', pan=64, rev=.12, gain_db=-5)
    s.inst(4, 0, 8, 'Celeste', pan=80, rev=.55, gain_db=1, hp=500)
    s.inst(5, 0, 42, 'Cello', pan=50, rev=.5, gain_db=-2, hp=90)
    INTRO = prog('Ebmaj7 | Abmaj7')
    A = prog('Ebmaj7 | Gm7 | Abmaj7 | Bb7sus4 Bb7 | Eb/G | Cm7 | Fm7 | Bb7')
    A2 = prog('Ebmaj7 | Gm7 | Abmaj7 | Abm6 | Eb/Bb | C7 | Fm7 Bb7 | Ebmaj7')
    B = prog('Cm7 | Ab | Eb/G | Abmaj7 | Fm7 | Gm7 | Abmaj7 | Bb7sus4 Bb7')
    OUT = prog('Abmaj7 | Abm6 | Ebmaj9')
    mA = ('G5:1.5 F5:.5 Eb5:1 Bb4:1 | D5:2 C5:.5 D5:.5 F5:1 | Eb5:1.5 C5:.5 Ab4:1 G4:1 | F4:2 Ab4:1 Bb4:1 | '
          'G5:1.5 F5:.5 Eb5:1 G5:1 | Bb5:2 G5:1 Eb5:1 | Ab5:1.5 G5:.5 F5:1 C5:1 | D5:3 r:1')
    mA2 = ('G5:1.5 F5:.5 Eb5:1 Bb4:1 | D5:2 C5:.5 D5:.5 F5:1 | Eb5:1.5 C5:.5 Ab4:1 G4:1 | Cb5:2 Bb4:1 Ab4:1 | '
           'G4:1.5 Bb4:.5 Eb5:1 G5:1 | G5:1.5 E5:.5 Bb4:1 C5:1 | Ab5:1 G5:.5 F5:.5 D5:1 Bb4:1 | Eb5:3 r:1')
    mB = ('G5:1 Eb5:.5 G5:.5 C6:2 | C6:1 Bb5:.5 Ab5:.5 Eb5:2 | Bb5:1.5 G5:.5 Eb5:2 | G5:1 Ab5:.5 Bb5:.5 C6:2 | '
          'Ab5:1.5 G5:.5 F5:1 Eb5:1 | D5:1.5 Eb5:.5 F5:1 G5:1 | C6:2 Bb5:1 G5:1 | F5:2 D5:2')
    mOUT = 'C5:2 Bb4:1 G4:1 | Cb5:2 Bb4:1 Ab4:1 | G4:4'
    plan = [('intro', INTRO), ('a', A), ('a2', A2), ('b', B), ('a2s', A2), ('bc', B), ('a2f', A2), ('out', OUT)]
    bar = 0
    soft = lambda st: -4
    for name, P in plan:
        n = len(P); b0 = bar * 4
        s.chords += [(beat, dur, c) for beat, dur, c, bi, pos in segs(P, bar)]
        arpeggio(s, 0, P[:2] if name == 'out' else P, bar, vel=46 if name in ('intro', 'a', 'bc') else 50)
        if name not in ('intro', 'a'):
            for beat, dur, c, bi, pos in segs(P[:2] if name == 'out' else P, bar):
                s.add(beat, dur, bass_note(c, nn('Eb1'), nn('D2')), 58, 3, human=.01, legato=.98, swing=False)
        if name == 'a': melody(s, 1, b0, mA, vel=62, legato=1.0, human=.018)
        if name == 'a2':
            melody(s, 1, b0, mA2, vel=64, legato=1.0, human=.018); pad(s, 2, P, bar, vel=36); s.ramp(2, 11, b0, b0 + 32, 50, 100)
        if name == 'b':
            melody(s, 1, b0, mB, vel=68, legato=1.0, human=.018); melody(s, 4, b0, mB, vel=40, shift=12, legato=.6)
            pad(s, 2, P, bar, vel=40); s.ramp(2, 11, b0, b0 + 32, 100, 118)
        if name == 'a2s':
            melody(s, 1, b0, mA2, vel=62, legato=1.0, human=.018); pad(s, 2, P, bar, vel=40)
        if name == 'bc':
            melody(s, 5, b0, mB, vel=66, shift=-12, legato=1.0, human=.02); pad(s, 2, P, bar, vel=34)
            s.ramp(5, 11, b0, b0 + 16, 80, 120); s.ramp(5, 11, b0 + 16, b0 + 32, 120, 90)
        if name == 'a2f':
            melody(s, 1, b0, mA2, vel=60, legato=1.0, human=.018); melody(s, 4, b0, mA2, vel=34, shift=12, legato=.6)
            pad(s, 2, P, bar, vel=38); s.ramp(2, 11, b0 + 16, b0 + 32, 110, 70)
        if name == 'out':
            melody(s, 1, b0, mOUT, vel=56, legato=1.0, human=.02)
            pad(s, 2, P, bar, vel=34); s.ramp(2, 11, b0, b0 + 12, 90, 40)
            final_chord(s, 0, 'Ebmaj9', b0 + 8, 8, nn('Eb2'), nn('G4'), n=5, vel=50, roll=.09); s.cc(b0 + 8.05, 0, 64, 0); s.cc(b0 + 8.1, 0, 64, 100)
            s.add(b0 + 8, 8, nn('Eb1') + 12, 54, 3, legato=1, swing=False)
            s.ritard(b0, b0 + 12, 54)
        bar += n
    # phrase breathing: ease off at the end of each 8-bar phrase, then settle back
    for e in (10, 18, 26, 34, 42):
        s.tempo += [((e - 1) * 4 + 2, 63.5), ((e - 1) * 4 + 3, 61.5), (e * 4, 66)]
    s.tempo.sort()
    s.cleaned = clean_clashes(s, (1, 4, 5))
    return s


# ------------------------------------------------------------------ 5. Saturday Errands
def saturday_errands():
    s = Song('saturday_errands', 104, seed=55)
    s.inst(0, 8, 24, 'Ukulele', pan=44, rev=.2, gain_db=-1, hp=150)
    s.inst(1, 0, 12, 'Marimba', pan=76, rev=.26, gain_db=4)
    s.inst(2, 0, 71, 'Clarinet', pan=60, rev=.3, gain_db=-2, hp=150)
    s.inst(3, 0, 32, 'Acoustic Bass', pan=64, rev=.05, gain_db=-1)
    s.inst(4, 0, 45, 'Pizzicato Strings', pan=86, rev=.34, gain_db=-3, hp=200)
    s.inst(5, 0, 9, 'Glockenspiel', pan=34, rev=.4, gain_db=-2, hp=500)
    s.inst(9, 0, 0, 'Drums', pan=64, rev=.12, gain_db=-5)
    INTRO = prog('D | Bm | G | A7')
    A = prog('D | Bm | G | A | D | Bm | Em7 | A7')
    A2 = prog('D | Bm | G | A | D/F# | G | A7 | D')
    B = prog('G | A | F#m | Bm | Em7 | F#7 | G | A7')
    OUT = prog('G | A7 | D')
    h4 = 'F#5:.5 A5:.5 F#5:.5 D5:.5 E5:.5 F#5:.5 A5:1 | B5:.5 A5:.5 F#5:.5 D5:.5 B4:1 r:1 | D5:.5 E5:.5 G5:.5 B5:.5 A5:.5 G5:.5 E5:1 | E5:1 C#5:.5 E5:.5 A5:2'
    mA = h4 + ' | F#5:.5 A5:.5 F#5:.5 D5:.5 E5:.5 F#5:.5 A5:1 | D6:.5 B5:.5 A5:.5 F#5:.5 D5:1 r:1 | G5:.5 F#5:.5 E5:.5 D5:.5 B4:.5 D5:.5 E5:1 | C#5:1 E5:1 G5:1 r:1'
    mA2 = h4 + ' | A5:.5 F#5:.5 A5:.5 D6:.5 C#6:.5 B5:.5 A5:1 | B5:.5 G5:.5 D5:.5 B4:.5 D5:1 G5:1 | A5:.5 G5:.5 E5:.5 C#5:.5 E5:1 C#5:1 | D5:2 r:2'
    mB = ('B4:1.5 D5:.5 G5:2 | E5:1.5 C#5:.5 A4:2 | A4:1 C#5:1 F#5:1 E5:1 | D5:3 r:1 | '
          'G5:1.5 F#5:.5 E5:1 D5:1 | C#5:1.5 E5:.5 A#4:2 | B4:1 D5:1 G5:1 B5:1 | A5:1 G5:1 E5:1 C#5:1')
    mOUT = 'B4:.5 D5:.5 G5:.5 B5:.5 A5:2 | A5:.5 G5:.5 E5:.5 C#5:.5 E5:2 | D5:1 r:3'
    plan = [('intro', INTRO), ('a', A), ('a2', A2), ('b', B), ('ap', A), ('a2g', A2), ('b2', B), ('a2f', A2), ('out', OUT)]
    bar = 0
    for name, P in plan:
        n = len(P); b0 = bar * 4
        s.chords += [(beat, dur, c) for beat, dur, c, bi, pos in segs(P, bar)]
        PP = P[:2] if name == 'out' else P
        strum(s, 0, PP, bar, vel=60 if name != 'intro' else 56)
        if name != 'intro':
            root_fifth(s, 3, PP, bar, vel=72)
        if name == 'intro': drums(s, 'pop_light', bar, n)
        elif name in ('b', 'b2'): drums(s, 'pop_light', bar, n, crash_first=name == 'b2')
        elif name == 'out': pass
        else: drums(s, 'pop', bar, n, fill_last=True, crash_first=name in ('ap', 'a2f'))
        if name == 'a': melody(s, 1, b0, mA, vel=70, legato=.7)
        if name == 'a2': melody(s, 1, b0, mA2, vel=72, legato=.7)
        if name == 'b': melody(s, 2, b0, mB, vel=72, legato=.95)
        if name == 'ap': melody(s, 1, b0, mA, vel=70, legato=.7); offbeat_pluck(s, 4, P, bar, vel=44)
        if name == 'a2g':
            melody(s, 1, b0, mA2, vel=70, legato=.7); melody(s, 5, b0, mA2, vel=40, legato=.6); offbeat_pluck(s, 4, P, bar, vel=42)
        if name == 'b2':
            melody(s, 2, b0, mB, vel=74, legato=.95); guide(s, 1, P, bar, vel=50, lo=62, hi=76, dur_scale=.5)
        if name == 'a2f':
            melody(s, 1, b0, mA2, vel=74, legato=.7); melody(s, 2, b0, mA2, vel=50, shift=-12, legato=.9); offbeat_pluck(s, 4, P, bar, vel=46)
        if name == 'out':
            melody(s, 1, b0, mOUT, vel=72, legato=.7)
            strum(s, 0, prog('D'), bar + 2, pattern='D.......', vel=66)
            s.add(b0 + 8, 1, nn('D2'), 74, 3, legato=.9)
            drums(s, 'pop_light', bar, 2)
            s.add(b0 + 8, .5, 49, 40, 9); s.add(b0 + 8, .5, 36, 60, 9)
            s.ritard(b0 + 4, b0 + 9, 92)
        bar += n
    s.cleaned = clean_clashes(s, (1, 2, 5))
    return s


SONGS = [maple_morning, corner_cafe, porch_swing, streetlights, saturday_errands]
