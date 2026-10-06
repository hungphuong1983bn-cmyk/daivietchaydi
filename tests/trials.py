import sys, json, statistics as st
from run_stage import run
c=int(sys.argv[1]); i=int(sys.argv[2]); n=int(sys.argv[3]) if len(sys.argv)>3 else 3
rows=[]
for k in range(n):
    r=run(c,i,'god'); ttk=round(r['bkt']-r['bat'],1) if r['bkt'] else None
    rows.append(dict(dps=r['bossDps'],lv=r['lv'],ttk=ttk,hits=r['hits'],bits=r['stageBits'],kills=r['kills'],bossHp=r.get('bossHp'),t=r['t'],win=r['win'],dmg=r['dmgPerMin']))
    print(f"  trial {k}: bossDps {r['bossDps']} bossHp {r.get('bossHp')} lv {r['lv']} ttk {ttk} win {r['win']} hits {r['hits']} bits {r['stageBits']} kills {r['kills']} t {r['t']} dmg/min {r['dmgPerMin'][:8]}",flush=True)
d=run.__globals__['sync_playwright']  # noqa
