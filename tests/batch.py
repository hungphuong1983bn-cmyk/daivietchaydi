import sys, json, time
from run_stage import run
chs=[int(x) for x in sys.argv[1].split(',')]; sts=[int(x) for x in sys.argv[2].split(',')]; mode=sys.argv[3] if len(sys.argv)>3 else 'god'
res=[]
for c in chs:
    for i in sts:
        t=time.time(); r=run(c,i,mode); r['wall']=round(time.time()-t,1); res.append(r)
        wp=[w['t']-w['exp'] for w in r['waveSeen']]
        print(f"Ch{c:>2}-{i} {r['role']:<8} dur {r['dur']:>4} t_end {r['t']:>6} boss@{r['bat']:>5}(exp {r['bossAt']}) ttk {round(r['bkt']-r['bat'],1) if r['bkt'] else '—':>5} win {r['win']!s:<5} "
              f"pow {r['myPow']}/{r['recPow']} lv {r['lv']:>2} kills {r['kills']:>5} alive max/avg {r['aliveMax']:>3}/{r['aliveAvg']:>3} hits {r['hits']:>3} am {r['am']} dpsB {r['dpsBoss']} dpsAll {r['dpsAll']} bossHp {r.get('bossHp')} orb {r['orbGen']}/left {r['orbLeft']} dmg/min%% {r['dmgPerMin'][:6]} "
              f"waves {len(r['waveSeen'])} maxWaveDrift {max(wp):.2f} ev {r['eventsFired']}/{r['eventsExpected']} el {r['elitesSeen']} mini {r['minisSeen']}/{r['minisExpected']} bits {r['stageBits']} cpu {r['ms']/1000:.1f}s err {len(r['errors'])}", flush=True)
json.dump(res,open(f"res_{sys.argv[1].replace(',','_')}_{sys.argv[2].replace(',','_')}_{mode}.json",'w'),ensure_ascii=False)
