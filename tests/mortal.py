import sys
from run_stage import run
cs=[int(x) for x in sys.argv[1].split(',')]; st=int(sys.argv[2]); pm=float(sys.argv[3]); n=int(sys.argv[4]) if len(sys.argv)>4 else 2
for c in cs:
    res=[]
    for k in range(n):
        r=run(c,st,'mortal',pm)
        res.append(('WIN' if r['win'] else f"DIE@{r['t']:.0f}/{r['dur']}"))
    r_pow=r['myPow']
    print(f"Ch{c:>2}-{st} powMul {pm} myPow {r_pow}/{r['recPow']} -> {res}",flush=True)
