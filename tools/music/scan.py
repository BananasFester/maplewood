import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from songs import SONGS
LEAD={'maple_morning':(1,2),'corner_cafe':(1,2),'porch_swing':(1,2),'streetlights':(1,5),'saturday_errands':(1,2)}
for fn in SONGS:
    s=fn(); leads=LEAD[s.name]
    notes=[n for n in s.notes if n[4]!=9]
    flags=[]
    for st,du,p,v,ch in notes:
        if ch not in leads or du<0.45: continue
        pos=st%4
        strong = min(abs(pos-0),abs(pos-2),abs(pos-4))<0.08
        for st2,du2,p2,v2,ch2 in notes:
            if ch2 in leads: continue
            ov=min(st+du,st2+du2)-max(st,st2)
            if ov<0.45: continue
            iv=abs(p-p2)
            if iv in (1,13,25) and v2>30:
                flags.append((round(st,2),s.programs[ch][2],p,s.programs[ch2][2],p2,iv,strong))
    strongs=[f for f in flags if f[6]]
    print(f'{s.name}: {len(flags)} semitone clashes, {len(strongs)} on strong beats')
    seen=set()
    for f in strongs[:14]:
        bar=int(f[0]//4)
        if (bar,f[2]) in seen: continue
        seen.add((bar,f[2])); print('   bar',bar,'beat',round(f[0]%4,2),f[1],f[2],'vs',f[3],f[4],'int',f[5])
