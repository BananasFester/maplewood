"""Small composition toolkit: chords, voicings, humanized parts, MIDI stems, FluidSynth rendering and a numpy mix bus."""
import math, os, random, subprocess
import numpy as np
import mido
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, oaconvolve

PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
TPB = 480


def nn(s):
    """Note name to MIDI number: 'C4'=60, 'F#3', 'Bb2', 'Cb5'=71."""
    s = s.strip(); i = 1; acc = 0
    while i < len(s) and s[i] in '#b':
        acc += 1 if s[i] == '#' else -1; i += 1
    return 12 * (int(s[i:]) + 1) + PC[s[0].upper()] + acc


def pcn(s):
    return (PC[s[0].upper()] + sum(1 if c == '#' else -1 for c in s[1:])) % 12


QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], '6': [0, 4, 7, 9],
        'm6': [0, 3, 7, 9], '9': [0, 4, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14], 'm9': [0, 3, 7, 10, 14], 'add9': [0, 4, 7, 14],
        'sus4': [0, 5, 7], 'sus2': [0, 2, 7], '7sus4': [0, 5, 7, 10], 'dim': [0, 3, 6], 'm7b5': [0, 3, 6, 10],
        '7b9': [0, 4, 7, 10, 13], '13': [0, 4, 10, 14, 21], '69': [0, 4, 7, 9, 14], 'dim7': [0, 3, 6, 9], 'mmaj7': [0, 3, 7, 11]}


def chord(sym):
    bass = None
    if '/' in sym:
        sym, b = sym.split('/'); bass = pcn(b)
    r = sym[0]; i = 1
    if i < len(sym) and sym[i] in '#b' and not (sym[i] == 'b' and sym[i:i + 2] == 'b9'):
        r += sym[i]; i += 1
    q = sym[i:]
    root = pcn(r)
    if q not in QUAL:
        raise ValueError('unknown chord quality %r in %r' % (q, sym))
    return {'root': root, 'ivs': QUAL[q], 'bass': root if bass is None else bass, 'q': q, 'sym': sym}


def chord_pcs(ch):
    return sorted(set((ch['root'] + iv) % 12 for iv in ch['ivs']))


def priority(ch):
    """Intervals ordered by importance for small voicings."""
    order = []
    ivs = [iv % 12 for iv in ch['ivs']]
    for want in (3, 4, 10, 11, 9, 2, 1, 5, 6, 8, 7, 0):
        if want in ivs and want not in order:
            order.append(want)
    return order


def _best_voicing(ch, pick, lo, hi, prev, center, top):
    import itertools
    opts = []
    for iv in pick:
        pc = (ch['root'] + iv) % 12
        opts.append([m for m in range(lo, hi + 1) if m % 12 == pc])
    best = None
    for combo in itertools.product(*opts):
        v = sorted(combo)
        if len(set(v)) < len(v):
            continue
        span = v[-1] - v[0]
        score = 0.0
        if span > 15: score += (span - 15) * 3
        for a, b in zip(v, v[1:]):
            if b - a < 2: score += 6
            elif b - a < 3: score += 1.5
        if prev:
            pv = sorted(prev)
            if len(pv) == len(v):
                score += sum(abs(a - b) for a, b in zip(v, pv))
            else:
                score += abs(sum(v) / len(v) - sum(pv) / len(pv)) * 2
        c = center if center is not None else (lo + hi) / 2
        score += abs(sum(v) / len(v) - c) * (0.35 if prev else 1.0)
        if top is not None:
            score += abs(v[-1] - top) * 0.8
        if best is None or score < best[0]:
            best = (score, v)
    return best[1] if best else None


def voicing(ch, n, lo, hi, prev=None, center=None, need_root=False, top=None):
    """Choose n chord tones within [lo,hi] with smooth voice leading. Extra voices double chord tones."""
    base = priority(ch)
    have = [iv for iv in (0, 7, 4, 3) if iv in set(x % 12 for x in ch['ivs'])] or [base[0]]
    attempts = []
    if len(base) >= n:
        pick = base[:n]
        if need_root and 0 not in pick and 0 in base:
            pick = pick[:-1] + [0]
        attempts.append(pick)
    else:
        for start in range(len(have)):
            pick = list(base); k = start
            while len(pick) < n:
                pick.append(have[k % len(have)]); k += 1
            attempts.append(pick)
    for widen in (0, 4, 8, 12):
        for pick in attempts:
            v = _best_voicing(ch, pick, lo - widen, hi + widen, prev, center, top)
            if v:
                return v
    return []


def bass_note(ch, lo=nn('E1'), hi=nn('E2') + 3, target=None):
    pc = ch['bass']
    cands = [m for m in range(lo, hi + 1) if m % 12 == pc]
    if target is None:
        target = (lo + hi) / 2
    return min(cands, key=lambda m: abs(m - target))


def nearest(pc_list, near, lo, hi):
    c = [m for m in range(lo, hi + 1) if m % 12 in pc_list]
    return min(c, key=lambda m: abs(m - near))


def scale_pcs(key_root, mode='major'):
    steps = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10],
             'mixo': [0, 2, 4, 5, 7, 9, 10]}[mode]
    return [(key_root + s) % 12 for s in steps]


class Song:
    def __init__(self, name, bpm, beats_per_bar=4, seed=1, swing=0.0):
        self.name = name; self.bpm = bpm; self.bpb = beats_per_bar; self.swing = swing
        self.rng = random.Random(seed)
        self.notes = []      # (start_beat, dur_beats, pitch, vel, ch)
        self.ccs = []        # (beat, ch, cc, val)
        self.programs = {}   # ch -> (bank, prog, name)
        self.tempo = [(0.0, bpm)]  # (beat, bpm)
        self.end_beat = 0.0
        self.mix = {}        # ch -> dict(gain_db, rev, hp, pan)
        self.chords = []     # (beat, dur, chord) timeline for clean-up passes

    # --- setup ---
    def inst(self, ch, bank, prog, name, vol=100, pan=64, rev=0.25, gain_db=0.0, hp=None, chorus=0, lp=None):
        self.programs[ch] = (bank, prog, name)
        self.ccs += [(0, ch, 7, vol), (0, ch, 10, pan), (0, ch, 91, 0), (0, ch, 93, chorus), (0, ch, 11, 127)]
        self.mix[ch] = {'gain_db': gain_db, 'rev': rev, 'hp': hp, 'lp': lp, 'name': name}

    def tempo_at(self, beat):
        bpm = self.tempo[0][1]
        for b, t in self.tempo:
            if b <= beat: bpm = t
        return bpm

    def ritard(self, start_beat, end_beat, to_bpm, steps=8):
        """Gradual slowdown from current tempo to to_bpm across [start,end)."""
        b0 = self.tempo_at(start_beat)
        for i in range(steps):
            b = start_beat + (end_beat - start_beat) * i / steps
            t = b0 + (to_bpm - b0) * (i + 1) / steps
            self.tempo.append((b, t))
        self.tempo.sort()

    # --- events ---
    def swing_beat(self, b):
        if not self.swing:
            return b
        whole = math.floor(b + 1e-9); frac = b - whole
        if abs(frac - 0.5) < 1e-6:
            return whole + self.swing
        if abs(frac - 0.25) < 1e-6:
            return whole + self.swing / 2
        if abs(frac - 0.75) < 1e-6:
            return whole + self.swing + (1 - self.swing) / 2
        return b

    def add(self, start, dur, pitch, vel, ch, human=0.010, vh=6, legato=0.92, swing=True):
        s0 = self.swing_beat(start) if swing else start
        e0 = self.swing_beat(start + dur) if swing else start + dur
        bpm = self.tempo_at(s0)
        jit = self.rng.gauss(0, human) * bpm / 60.0
        jit = max(-0.06, min(0.06, jit))
        st = max(0.0, s0 + jit)
        du = max(0.05, (e0 - s0) * legato + self.rng.gauss(0, 0.01))
        v = int(max(1, min(127, vel + self.rng.gauss(0, vh))))
        self.notes.append((st, du, int(pitch), v, ch))
        self.end_beat = max(self.end_beat, st + du)

    def cc(self, beat, ch, num, val):
        self.ccs.append((beat, ch, num, int(max(0, min(127, val)))))

    def ramp(self, ch, num, b0, b1, v0, v1, steps=16):
        for i in range(steps + 1):
            self.cc(b0 + (b1 - b0) * i / steps, ch, num, v0 + (v1 - v0) * i / steps)

    # --- export ---
    def _beat_to_tick(self, b):
        return int(round(b * TPB))

    def midi(self, path, only=None):
        mf = mido.MidiFile(type=1, ticks_per_beat=TPB)
        t0 = mido.MidiTrack(); mf.tracks.append(t0)
        evs = [(self._beat_to_tick(b), mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(t))) for b, t in self.tempo]
        evs.append((self._beat_to_tick(self.end_beat + 8), mido.MetaMessage('end_of_track')))
        last = 0
        for tk, m in sorted(evs, key=lambda e: e[0]):
            if m.type == 'end_of_track':
                t0.append(mido.MetaMessage('marker', text='end', time=tk - last)); last = tk; continue
            m.time = tk - last; last = tk; t0.append(m)
        chans = sorted(self.programs) if only is None else [only]
        for ch in chans:
            tr = mido.MidiTrack(); mf.tracks.append(tr)
            bank, prog, name = self.programs[ch]
            ev = []
            if ch != 9:
                ev.append((0, 0, mido.Message('control_change', channel=ch, control=0, value=bank)))
            ev.append((0, 1, mido.Message('program_change', channel=ch, program=prog)))
            for b, c, num, val in self.ccs:
                if c == ch:
                    ev.append((self._beat_to_tick(b), 2, mido.Message('control_change', channel=ch, control=num, value=val)))
            for st, du, p, v, c in self.notes:
                if c != ch: continue
                ev.append((self._beat_to_tick(st), 4, mido.Message('note_on', channel=ch, note=p, velocity=v)))
                ev.append((self._beat_to_tick(st + du), 3, mido.Message('note_off', channel=ch, note=p, velocity=0)))
            ev.append((self._beat_to_tick(self.end_beat + 6), 9, mido.Message('control_change', channel=ch, control=7, value=self._vol(ch))))
            ev.sort(key=lambda e: (e[0], e[1]))
            last = 0
            for tk, _, m in ev:
                m.time = tk - last; last = tk; tr.append(m)
        mf.save(path)
        return path

    def _vol(self, ch):
        v = [val for b, c, num, val in self.ccs if c == ch and num == 7]
        return v[-1] if v else 100

    def seconds(self, beat):
        """Convert a beat position to seconds using the tempo map."""
        t = 0.0; prev_b, prev_bpm = 0.0, self.tempo[0][1]
        for b, bpm in self.tempo[1:]:
            if b >= beat: break
            t += (b - prev_b) * 60.0 / prev_bpm; prev_b, prev_bpm = b, bpm
        return t + (beat - prev_b) * 60.0 / prev_bpm


SR = 44100


def render_stems(song, sf2, workdir):
    os.makedirs(workdir, exist_ok=True)
    stems = {}
    for ch in sorted(song.programs):
        mid = song.midi(os.path.join(workdir, '%s_ch%d.mid' % (song.name, ch)), only=ch)
        wav = os.path.join(workdir, '%s_ch%d.wav' % (song.name, ch))
        chorus = '1' if any(c == ch and num == 93 and val > 0 for b, c, num, val in song.ccs) else '0'
        cmd = ['fluidsynth', '-ni', '-q', '-R', '0', '-C', chorus, '-g', '0.5', '-r', str(SR), '-O', 'float', '-T', 'wav',
               '-o', 'synth.polyphony=512', '-o', 'synth.chorus.depth=6', '-o', 'synth.chorus.level=1.4', '-o', 'synth.chorus.nr=3',
               '-F', wav, sf2, mid]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        sr, x = wavfile.read(wav)
        assert sr == SR
        stems[ch] = x.astype(np.float32)
    return stems


def make_ir(sr=SR, seed=7):
    rng = np.random.default_rng(seed)
    def tail(rt, fc, n):
        t = np.arange(n) / sr
        env = np.exp(-6.9 * t / rt)
        out = []
        for _ in range(2):
            x = rng.standard_normal(n) * env
            x = sosfilt(butter(2, fc, 'low', fs=sr, output='sos'), x)
            out.append(x)
        return np.stack(out, 1)
    n = int(sr * 2.6)
    ir = 0.55 * tail(1.1, 7000, n) + 0.75 * tail(2.1, 2600, n)
    # early reflections
    for d, g in ((0.011, .45), (0.017, .32), (0.023, .28), (0.031, .22), (0.043, .16), (0.057, .12)):
        k = int(d * sr); ir[k, 0] += g * (1 if rng.random() > .5 else -1); ir[k + int(rng.integers(5, 40)), 1] += g * .9
    ir = sosfilt(butter(1, 180, 'high', fs=sr, output='sos'), ir, axis=0)
    pre = np.zeros((int(0.014 * sr), 2))
    ir = np.concatenate([pre, ir])
    return (ir / np.sqrt((ir ** 2).sum(0)).max() * 0.9).astype(np.float32)


def db(x):
    return 10 ** (x / 20.0)


def mixdown(song, stems, ir, rev_gain=1.0, master_gain_db=0.0):
    n = max(len(s) for s in stems.values()) + int(SR * 3)
    dry = np.zeros((n, 2), np.float32); send = np.zeros((n, 2), np.float32)
    for ch, x in stems.items():
        m = song.mix[ch]
        y = x.copy()
        if m.get('hp'):
            y = sosfilt(butter(2, m['hp'], 'high', fs=SR, output='sos'), y, axis=0)
        if m.get('lp'):
            y = sosfilt(butter(2, m['lp'], 'low', fs=SR, output='sos'), y, axis=0)
        y *= db(m['gain_db'])
        dry[:len(y)] += y
        send[:len(y)] += y * m['rev']
    wet = np.stack([oaconvolve(send[:, i], ir[:, i])[:n] for i in range(2)], 1).astype(np.float32)
    out = dry + wet * rev_gain
    # gentle glue compression (RMS, 2:1 above threshold)
    out = compress(out, thresh_db=-20, ratio=1.8, att=0.03, rel=0.35)
    out *= db(master_gain_db)
    # trim trailing silence but keep a natural tail
    env = np.abs(out).max(1)
    idx = np.where(env > 1e-4)[0]
    if len(idx):
        out = out[:min(len(out), idx[-1] + int(SR * 0.5))]
    fade = int(SR * 1.2)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
    return out


def compress(x, thresh_db=-20, ratio=2.0, att=0.02, rel=0.3):
    from scipy.signal import lfilter
    p = (x ** 2).mean(1)
    a = math.exp(-1 / (SR * 0.05))
    env = lfilter([1 - a], [1, -a], p)
    lvl = 10 * np.log10(env + 1e-12)
    over = np.maximum(0, lvl - thresh_db)
    gr = -over * (1 - 1 / ratio)
    # smooth gain reduction with attack/release (one-pole, decimated for speed)
    step = 64
    g = gr[::step]
    out = np.empty_like(g); cur = 0.0
    aa = math.exp(-step / (SR * att)); rr = math.exp(-step / (SR * rel))
    for i, v in enumerate(g):
        cur = aa * cur + (1 - aa) * v if v < cur else rr * cur + (1 - rr) * v
        out[i] = cur
    gain = np.repeat(out, step)[:len(x)]
    return x * db(gain)[:, None].astype(np.float32)


def soft_limit(x, ceiling_db=-1.2):
    c = db(ceiling_db)
    peak = np.abs(x).max()
    if peak <= c:
        return x
    # smooth knee: tanh above 70% of ceiling
    k = 0.7 * c
    y = x.copy()
    m = np.abs(y) > k
    s = np.sign(y[m]); a = np.abs(y[m])
    y[m] = s * (k + (c - k) * np.tanh((a - k) / (c - k)))
    return y


def clean_clashes(song, leads, skip=(3, 9), reach=5):
    """Move accompaniment notes that rub a semitone (or minor ninth) against a held melody note
    to the nearest chord tone that does not; drop them if no such tone is close."""
    L = [n for n in song.notes if n[4] in leads and n[1] >= 0.4]
    def chord_at(t):
        for b, d, c in song.chords:
            if b - 1e-6 <= t < b + d:
                return c
        return None
    def bad(p, st, du):
        for ls, ld, lp, lv, lc in L:
            ov = min(st + du, ls + ld) - max(st, ls)
            if ov >= min(0.4, du * 0.5) and abs(lp - p) % 12 in (1, 11) and abs(lp - p) not in (11, 23):
                return True
        return False
    out = []; moved = dropped = 0
    for n in song.notes:
        st, du, p, v, ch = n
        if ch in leads or ch in skip or not bad(p, st, du):
            out.append(n); continue
        c = chord_at(st + 0.01)
        alt = None
        if c:
            pcs = chord_pcs(c)
            cands = sorted((m for m in range(p - reach, p + reach + 1) if m != p and m % 12 in pcs and not bad(m, st, du)), key=lambda m: abs(m - p))
            same = {q[2] for q in out if q[4] == ch and abs(q[0] - st) < 0.05}
            cands = [m for m in cands if m not in same]
            alt = cands[0] if cands else None
        if alt is not None:
            out.append((st, du, alt, v, ch)); moved += 1
        else:
            dropped += 1
    song.notes = out
    return moved, dropped
