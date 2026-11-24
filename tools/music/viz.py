import sys, numpy as np, warnings; warnings.filterwarnings('ignore')
from scipy.io import wavfile
from scipy.signal import spectrogram
from PIL import Image
names=sys.argv[2:]; out=sys.argv[1]
rows=[]
for n in names:
    sr,x=wavfile.read(f'{out}/{n}.wav'); m=x.mean(1)
    f,t,S=spectrogram(m,sr,nperseg=4096,noverlap=2048)
    # log-frequency mapping 40Hz..16kHz into 160 rows
    fr=np.geomspace(40,16000,160); idx=np.searchsorted(f,fr).clip(0,len(f)-1)
    D=10*np.log10(S[idx]+1e-12); D=np.clip((D+110)/80,0,1)
    W=900; cols=np.linspace(0,D.shape[1]-1,W).astype(int); D=D[:,cols][::-1]
    img=(np.stack([D*255,D**1.5*200,D**3*120],2)).astype(np.uint8)
    env=np.abs(m); env=env[:len(env)//W*W].reshape(W,-1).max(1); wave=np.zeros((40,W,3),np.uint8)
    for i,v in enumerate(env): h=int(v*38); wave[20-h//2:20+h//2+1,i]=(120,200,255)
    rows.append(np.concatenate([wave,img,np.full((6,W,3),255,np.uint8)],0))
Image.fromarray(np.concatenate(rows,0)).save(f'{out}/spectro.png')
# octave band balance
for n in names:
    sr,x=wavfile.read(f'{out}/{n}.wav'); m=x.mean(1); F=np.abs(np.fft.rfft(m))**2; fr=np.fft.rfftfreq(len(m),1/sr)
    bands=[(31,63),(63,125),(125,250),(250,500),(500,1000),(1000,2000),(2000,4000),(4000,8000),(8000,16000)]
    e=[10*np.log10(F[(fr>=a)&(fr<b)].sum()+1e-9) for a,b in bands]; mx=max(e)
    print(f'{n:18}',' '.join(f'{v-mx:6.1f}' for v in e))
