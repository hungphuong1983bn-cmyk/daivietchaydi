"""Đo chi phí từng module Phase 17 theo chất lượng. python3 tests/xian17_perf.py"""
import os, sys, json, re
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SETUP = re.search(r'SETUP = """(.*?)"""', open(ROOT + '/tests/xian17_loot_test.py', encoding='utf-8').read(), re.S).group(1)
MODS = ['DV_XIAN17', 'DV_XIAN17S', 'DV_XIAN17D', 'DV_XIAN17B', 'DV_XIAN17L', 'DV_XIAN17H']
BUSY = """()=>{const g=__dv.G(),P=g.p;g.orb.length=0;for(let k=0;k<6;k++)g.orb.push({x:P.x-150+k*55,y:P.y-90,v:30});for(let k=0;k<18;k++)g.orb.push({x:P.x+20+(k%6)*7,y:P.y+110,g:1});g.orb.push({x:P.x+90,y:P.y,h:1,life:30});
 for(const e of g.en.slice(0,3)){e.el=1}return g.en.length}"""
MEAS = """(mods)=>{const d=__dv,N=10,R=5;const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[a.length>>1]};
 const one=()=>{for(let k=0;k<3;k++)d.draw();const t0=performance.now();for(let k=0;k<N;k++)d.draw();return (performance.now()-t0)/N};
 const set=(m,v)=>{const o=window[m];if(o)o.enabled=v};const r={};for(let k=0;k<10;k++)d.draw();
 const offAll=()=>{for(const m of mods)set(m,false)},onAll=()=>{for(const m of mods)set(m,true)};
 const A=[],Bn=[];for(let i=0;i<R;i++){onAll();A.push(one());offAll();Bn.push(one())}onAll();r.all=+med(A).toFixed(2);r.none=+med(Bn).toFixed(2);r.total=+(r.all-r.none).toFixed(2);
 for(const m of mods){const on=[],off=[];for(let i=0;i<R;i++){onAll();off.push((set(m,false),one()));onAll();on.push(one())}r[m]=+(med(on)-med(off)).toFixed(2)}
 onAll();return r}"""
ULTGO = "()=>{const g=__dv.G();g.e=100;g.sm=0;__dv.run(true);__dv.ult();__dv.run(false);g.sm=0;for(let k=0;k<5;k++)__st(.05);g.sm=0;return g.ul}"
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(90000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    for q in (2, 0):
        pg.evaluate(SETUP, [5, 2, q]); pg.evaluate("()=>{const g=__dv.G();g.pend=0;g.paused=false}"); pg.evaluate(BUSY)
        pg.evaluate("()=>{const g=__dv.G();g.pend=0;g.paused=false;document.getElementById('lv').classList.remove('on')}")
        print('q', q, 'idle', json.dumps(pg.evaluate(MEAS, MODS)))
        pg.evaluate(ULTGO)
        print('q', q, 'ult ', json.dumps(pg.evaluate(MEAS, MODS)))
    print('ERRORS:', errs[:5] or 'none'); b.close()
