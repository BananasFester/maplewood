"""Idiomatic accompaniment patterns and melody helpers built on mlib."""
from mlib import nn, chord, voicing, bass_note, chord_pcs, QUAL


def prog(s, bpb=4):
    """'G | D/F# | Am7 D7' -> list of bars, each a list of (chord, beats)."""
    bars = []
    for bar in s.split('|'):
        syms = bar.split()
        if not syms:
            continue
        d = bpb / len(syms)
        bars.append([(chord(x), d) for x in syms])
    return bars


def segs(bars, start_bar, bpb=4):
    """Yield (beat, dur, chord, bar_index, pos_in_bar) for each chord segment."""
    for i, bar in enumerate(bars):
        b = (start_bar + i) * bpb
        for ch, d in bar:
            yield b, d, ch, i, b - (start_bar + i) * bpb
            b += d


def jazz(ch):
    q = ch['q']
    ext = {'7': [0, 4, 7, 10, 14, 21], 'm7': [0, 3, 7, 10, 14], 'maj7': [0, 4, 7, 11, 14], '6': [0, 4, 7, 9, 14],
           'm6': [0, 3, 7, 9, 14], '': [0, 4, 7, 9, 14]}.get(q)
    if ext is None:
        return ch
    c = dict(ch); c['ivs'] = ext; return c


def melody(song, ch, start_beat, text, vel=72, shift=0, legato=0.93, human=0.012, accent=6, bpb=4, check=True, dyn=None):
    """Tokens 'E5:1.5 r:.5 ...' with '|' as bar checks. Returns end beat."""
    b = start_beat; bar_sum = 0.0; bar_no = 0; notes = []
    for tok in text.split():
        if tok == '|':
            if check and abs(bar_sum - bpb) > 1e-6:
                raise ValueError('%s: bar %d sums to %s in %r' % (song.name, bar_no + 1, bar_sum, text[:60]))
            bar_sum = 0.0; bar_no += 1; continue
        p, d = tok.split(':'); d = float(d)
        if p != 'r':
            notes.append((b, d, nn(p) + shift))
        b += d; bar_sum += d
    if check and bar_sum and abs(bar_sum - bpb) > 1e-6:
        raise ValueError('%s: last bar sums to %s' % (song.name, bar_sum))
    if not notes:
        return b
    lo = min(n[2] for n in notes); hi = max(n[2] for n in notes)
    for st, d, p in notes:
        pos = (st - start_beat) % bpb
        v = vel + (accent if abs(pos) < 1e-6 else accent * .4 if abs(pos - bpb / 2) < 1e-6 else 0)
        v += (p - lo) / max(1, hi - lo) * 6 - 3
        if d >= 1.5: v += 3
        if dyn: v += dyn(st)
        song.add(st, d, p, v, ch, human=human, legato=legato)
    return b


def travis(song, ch, bars, start_bar, vel=60, lo=55, hi=74, pinch_every=2, bass_lo=None, bass_hi=None):
    prev = None; rng = song.rng
    bl = bass_lo or nn('E2'); bh = bass_hi or nn('D3')
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        v = voicing(c, 3, lo, hi, prev); prev = v
        root = bass_note(c, bl, bh)
        alt = [m for m in range(bl, bh + 8) if m % 12 == (c['root'] + 7) % 12 and m > root]
        alt = alt[0] if alt else root + 7
        if c['bass'] != c['root']:
            alt = root + 12 if root + 12 <= bh + 5 else root
        steps = int(dur * 2)
        treble = [v[-1], v[1], v[-1], v[0], v[1], v[-1], v[0], v[1]]
        for k in range(steps):
            t = beat + k * 0.5
            if k % 2 == 0:
                bn = root if (k // 2) % 2 == 0 else alt
                song.add(t, 1.0, bn, vel + 6 - (k // 2) % 2 * 3, ch, human=0.008, legato=0.9)
                if k == 0 and (bi % pinch_every == 0):
                    song.add(t, 1.0, v[-1], vel + 2, ch, human=0.008)
            else:
                n = treble[(k + bi) % len(treble)]
                song.add(t, 0.75, n, vel - 6 + rng.uniform(-3, 3), ch, human=0.009, legato=0.95)


def strum(song, ch, bars, start_bar, pattern='D.DU.UDU', vel=62, lo=60, hi=76, n=4, spread=0.012, mute_last=False):
    """Ukulele/guitar strum. pattern over 8 eighths: D down, U up, . rest."""
    prev = None
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        v = voicing(c, n, lo, hi, prev); prev = v
        steps = int(dur * 2)
        off = int(pos * 2)
        for k in range(steps):
            sym = pattern[(off + k) % len(pattern)]
            if sym == '.':
                continue
            t = beat + k * 0.5
            notes = v if sym == 'D' else list(reversed(v))
            vv = vel if sym == 'D' else vel - 12
            if k == 0: vv += 6
            for j, p in enumerate(notes):
                song.add(t + j * spread * song.bpm / 60.0 / 1.0, 0.45 if sym == 'U' else 0.9, p, vv - j * 2, ch, human=0.004, legato=0.95, swing=False)


def bossa_guitar(song, ch, bars, start_bar, vel=58, lo=52, hi=70):
    prev = None
    hits_a = [0, 1.5, 3]; hits_b = [1, 2.5]
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        v = voicing(jazz(c), 4, lo, hi, prev); prev = v
        root = bass_note(c, nn('E2'), nn('D3'))
        fifth = root + 7 if (c['root'] + 7) % 12 in chord_pcs(c) or True else root
        for b in (0, 2):
            if b < dur:
                song.add(beat + b, 1.6, root if b == 0 else (root + 7 if root + 7 <= nn('E3') else root - 5), vel + 4, ch, human=0.006)
        hits = hits_a if (start_bar + bi) % 2 == 0 else hits_b
        for h in hits:
            if pos <= h < pos + dur:
                for j, p in enumerate(v):
                    song.add(beat + (h - pos) + j * 0.004, 0.45, p, vel - 4 - j, ch, human=0.005, legato=0.9)


def bossa_bass(song, ch, bars, start_bar, vel=78):
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        r = bass_note(c, nn('E1'), nn('D2') + 2)
        f = r + 7 if r + 7 <= nn('C3') else r - 5
        if dur >= 4:
            pat = [(0, 1.5, r, 0), (1.5, .5, r, -10), (2, 1.5, f, -4), (3.5, .5, f, -12)]
        else:
            pat = [(0, 1.5, r, 0), (1.5, .5, f, -10)]
        for o, d, p, dv in pat:
            song.add(beat + o, d, p, vel + dv, ch, human=0.006, legato=0.9)


def walking(song, ch, bars, start_bar, vel=80):
    rng = song.rng; last = nn('A2'); LO, HI = nn('E1'), nn('C3')
    segl = list(segs(bars, start_bar))
    for idx, (beat, dur, c, bi, pos) in enumerate(segl):
        nxt = segl[idx + 1][2] if idx + 1 < len(segl) else c
        r = bass_note(c, LO, HI, target=last)
        pcs = chord_pcs(c)
        up = r <= (LO + HI) / 2 + rng.uniform(-3, 3)
        tones = [m for m in (range(r + 1, r + 12) if up else range(r - 11, r)) if m % 12 in pcs]
        if not up:
            tones = tones[::-1]
        if not tones:
            tones = [r + 7]
        nr = bass_note(nxt, LO, HI, target=r)
        appr = nr - 1 if (nr > r or rng.random() < .5) else nr + 1
        if appr < LO: appr = nr + 1
        if appr > HI: appr = nr - 1
        n = int(round(dur))
        if n >= 4:
            line = [r, tones[0], tones[1] if len(tones) > 1 else tones[0], appr]
        elif n == 3:
            line = [r, tones[0], appr]
        elif n == 2:
            line = [r, appr]
        else:
            line = [r]
        for k, p in enumerate(line):
            song.add(beat + k, 1.0, p, vel + (4 if k == 0 else 0) + rng.uniform(-4, 4), ch, human=0.006, legato=0.97, swing=False)
        last = line[-1]


def comp_swing(song, ch, bars, start_bar, vel=54, lo=53, hi=71):
    rng = song.rng; prev = None
    pats4 = [[(0, .9), (1.5, .45)], [(0.5, .45), (2, .9)], [(0, 1.8), (3.5, .45)], [(1, .4), (2.5, .45)], [(0, .45), (1.5, 1.4)]]
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        v = voicing(jazz(c), 4, lo, hi, prev); prev = v
        if dur >= 4:
            pat = rng.choice(pats4)
        else:
            pat = rng.choice([[(0, .9)], [(0, .45), (1.5, .4)], [(0.5, .9)], [(0, 1.4)]])
        for o, d in pat:
            for j, p in enumerate(v):
                song.add(beat + o + j * 0.003, d, p, vel - j + rng.uniform(-3, 3), ch, human=0.007, legato=0.95)


def pad(song, ch, bars, start_bar, vel=48, lo=55, hi=76, n=4):
    prev = None
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        v = voicing(c, n, lo, hi, prev); prev = v
        for p in v:
            song.add(beat, dur, p, vel, ch, human=0.004, legato=1.0, swing=False)


def arpeggio(song, ch, bars, start_bar, vel=52, pedal=True):
    """Night piano left hand: wide broken chords in eighths with sustain pedal."""
    prev = None
    for beat, dur, c, bi, pos in segs(bars, start_bar):
        r = bass_note(c, nn('Eb2'), nn('D3'))
        up = voicing(c, 3, r + 7, r + 22, prev); prev = up
        seq = [r, up[0], up[1], up[2], up[1], up[0], up[1], up[0]]
        steps = int(dur * 2)
        for k in range(steps):
            p = seq[k % len(seq)]
            song.add(beat + k * .5, 1.2 if k == 0 else 0.9, p, vel + (8 if k == 0 else 0) - (k % 2) * 3, ch, human=0.012, legato=1.0)
        if pedal:
            song.cc(beat + 0.08, ch, 64, 0)
            song.cc(beat + 0.12, ch, 64, 100)


def root_fifth(song, ch, bars, start_bar, vel=74, lo=None, hi=None, walkups=True):
    rng = song.rng
    lo = lo or nn('E1'); hi = hi or nn('D2') + 3
    segl = list(segs(bars, start_bar))
    for idx, (beat, dur, c, bi, pos) in enumerate(segl):
        r = bass_note(c, lo, hi)
        f = r + 7 if r + 7 <= hi + 7 else r - 5
        nxt = segl[idx + 1][2] if idx + 1 < len(segl) else c
        nr = bass_note(nxt, lo, hi, target=r)
        if dur >= 4:
            pat = [(0, 1.5, r, 4), (1.5, .5, r, -12), (2, 1.5, f, 0)]
            if walkups and rng.random() < .55 and nr != r:
                pat.append((3.5, .5, nr - 1 if nr > r else nr + 1, -8))
            else:
                pat.append((3.5, .5, f, -14))
        else:
            pat = [(0, 1.5, r, 2), (1.5, .5, f, -10)]
        for o, d, p, dv in pat:
            song.add(beat + o, d, p, vel + dv, ch, human=0.007, legato=0.88)


# ---------------- drums (GM channel 10 / index 9) ----------------
K, SS, SN, CLAP, HHC, HHP, HHO, RIDE, CRASH, TAMB, SHAKER, CABASA, MARACA, BTAP, BSLAP, BSWIRL = 36, 37, 38, 39, 42, 44, 46, 51, 49, 54, 82, 69, 70, 38, 39, 40


def drums(song, style, start_bar, nbars, level=1.0, fill_last=False, crash_first=False):
    rng = song.rng; ch = 9
    def hit(b, note, v, h=0.004, sw=True):
        song.add(b, 0.25, note, v * level, ch, human=h, legato=1.0, swing=sw)
    for i in range(nbars):
        b0 = (start_bar + i) * 4
        last = fill_last and i == nbars - 1
        if style == 'folk':
            hit(b0, K, 58); hit(b0 + 2, K, 50)
            if rng.random() < .3: hit(b0 + 2.5, K, 36)
            hit(b0 + 1, SS, 44); hit(b0 + 3, SS, 46)
            for k in range(8):
                hit(b0 + k * .5, SHAKER, 38 if k % 2 == 0 else 28)
        elif style == 'folk2':
            hit(b0, K, 62); hit(b0 + 2, K, 54); hit(b0 + 2.5, K, 34)
            hit(b0 + 1, SS, 48); hit(b0 + 3, SS, 50)
            hit(b0 + 1, TAMB, 40); hit(b0 + 3, TAMB, 42)
            for k in range(8):
                hit(b0 + k * .5, SHAKER, 40 if k % 2 == 0 else 30)
        elif style == 'shaker':
            for k in range(8):
                hit(b0 + k * .5, SHAKER, 34 if k % 2 == 0 else 24)
        elif style == 'brush':
            hit(b0, BSWIRL, 34); hit(b0 + 2, BSWIRL, 30)
            hit(b0 + 1, BTAP, 46); hit(b0 + 3, BTAP, 50)
            for k, (o, v) in enumerate([(0, 48), (1, 40), (1.5, 30), (2, 46), (3, 40), (3.5, 30)]):
                hit(b0 + o, RIDE, v)
            hit(b0 + 1, HHP, 34); hit(b0 + 3, HHP, 36)
            for o in (0, 1, 2, 3):
                hit(b0 + o, K, 24 if o else 30)
            if last:
                hit(b0 + 2.5, BSLAP, 44); hit(b0 + 3.5, BSLAP, 50)
        elif style == 'bossa':
            for o, v in ((0, 50), (1.5, 36), (2, 46), (3.5, 36)):
                hit(b0 + o, K, v, sw=False)
            clave = [0, 1.5, 3] if (start_bar + i) % 2 == 0 else [1, 2.5]
            for o in clave:
                hit(b0 + o, SS, 44, sw=False)
            for k in range(8):
                hit(b0 + k * .5, SHAKER, 34 if k % 2 == 0 else 24, sw=False)
            hit(b0 + 1, HHP, 26, sw=False); hit(b0 + 3, HHP, 28, sw=False)
        elif style == 'bossa_light':
            clave = [0, 1.5, 3] if (start_bar + i) % 2 == 0 else [1, 2.5]
            for o in clave:
                hit(b0 + o, SS, 36, sw=False)
            for k in range(8):
                hit(b0 + k * .5, SHAKER, 28 if k % 2 == 0 else 20, sw=False)
        elif style == 'pop':
            hit(b0, K, 60); hit(b0 + 2, K, 52)
            if rng.random() < .5: hit(b0 + 1.5, K, 38)
            hit(b0 + 1, CLAP, 42); hit(b0 + 3, CLAP, 44)
            for k in range(16):
                hit(b0 + k * .25, SHAKER, 32 if k % 4 == 0 else 22 if k % 2 else 26)
            if rng.random() < .5: hit(b0 + 3.5, TAMB, 34)
        elif style == 'pop_light':
            hit(b0, K, 48); hit(b0 + 2, K, 40)
            for k in range(8):
                hit(b0 + k * .5, SHAKER, 28 if k % 2 == 0 else 20)
        if last and style in ('folk', 'folk2', 'pop'):
            hit(b0 + 3.5, SN if style == 'pop' else SS, 50); hit(b0 + 3.75, SN if style == 'pop' else SS, 56)
        if crash_first and i == 0:
            hit(b0, CRASH, 44 if style != 'brush' else 36)
