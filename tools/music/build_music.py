"""Render, mix, master and encode the Maple Lane soundtrack.
usage: python3 build_music.py SOUNDFONT.sf2 OUTDIR [song_name ...]"""
import json, os, subprocess, sys, time
import numpy as np
from scipy.io import wavfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mlib import render_stems, make_ir, mixdown, soft_limit, SR, db
from songs import SONGS

TARGET_I = -17.0


def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'loudnorm=I=%s:TP=-1.5:LRA=11:print_format=json' % TARGET_I,
                        '-f', 'null', '-'], capture_output=True, text=True)
    txt = r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1]
    j = json.loads(txt)
    return float(j['input_i']), float(j['input_tp'])


def main():
    sf2, out = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    ir = make_ir()
    report = {}
    for fn in SONGS:
        s = fn()
        if only and s.name not in only:
            continue
        t0 = time.time()
        stems = render_stems(s, sf2, os.path.join(out, 'stems'))
        mix = mixdown(s, stems, ir)
        mix = mix / max(1e-9, np.abs(mix).max()) * db(-1.0)
        tmp = os.path.join(out, s.name + '_pre.wav')
        wavfile.write(tmp, SR, mix.astype(np.float32))
        I, TP = measure(tmp)
        gain = TARGET_I - I
        if TP + gain > -1.3:
            mix = soft_limit(mix, ceiling_db=-1.3 - gain)
        mix = mix * db(gain)
        fin = os.path.join(out, s.name + '.wav')
        wavfile.write(fin, SR, mix.astype(np.float32))
        I2, TP2 = measure(fin)
        mp3 = os.path.join(out, s.name + '.mp3')
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', fin, '-codec:a', 'libmp3lame', '-b:a', '112k',
                        '-metadata', 'title=' + s.name.replace('_', ' ').title(), '-metadata', 'artist=Maple Lane', mp3], check=True)
        dur = len(mix) / SR
        report[s.name] = {'seconds': round(dur, 1), 'lufs': I2, 'tp': TP2, 'mp3_kb': os.path.getsize(mp3) // 1024,
                          'notes': len(s.notes), 'render_s': round(time.time() - t0, 1),
                          'stem_peaks_db': {s.mix[ch]['name']: round(float(20 * np.log10(np.abs(x).max() + 1e-9) + s.mix[ch]['gain_db']), 1) for ch, x in stems.items()}}
        print(s.name, json.dumps(report[s.name]))
        os.remove(tmp)
    with open(os.path.join(out, 'report.json'), 'w') as f:
        json.dump(report, f, indent=1)


if __name__ == '__main__':
    main()
