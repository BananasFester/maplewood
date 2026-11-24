import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
import warnings; warnings.filterwarnings('ignore')
import pyloudnorm as pyln
from songs import SONGS
name=sys.argv[1]; out=sys.argv[2]
song=[f() for f in SONGS if f.__name__==name][0]
secs=[]
# section boundaries every 8 bars using tempo map
nb=int(song.end_beat//4)+1
WIN=[0]+list(range(4,nb,8)) if name!='streetlights' else [0]+list(range(2,nb,8))
rows=[]
for ch in sorted(song.programs):
    sr,x=wavfile.read(os.path.join(out,'stems',f'{name}_ch{ch}.wav')); x=x.astype(np.float64)*10**(song.mix[ch]['gain_db']/20)
    meter=pyln.Meter(sr,block_size=0.4)
    if song.mix[ch].get('hp'): x=sosfilt(butter(2,song.mix[ch]['hp'],'high',fs=sr,output='sos'),x,axis=0)
    vals=[]
    for b in WIN:
        t0=song.seconds(b*4); t1=song.seconds(min(nb,b+8 if b>=4 else 4)*4)
        seg=x[int(t0*sr):int(t1*sr)]
        L=meter.integrated_loudness(seg) if len(seg)>sr else -99
        vals.append(max(-99,L))
    rows.append((song.mix[ch]['name'],vals))
print('bars   '+' '.join(f'{b:>6}' for b in WIN))
for n,v in rows: print(f'{n[:14]:14} '+' '.join(f'{x:6.1f}' for x in v))
