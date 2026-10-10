"""Đếm lệnh canvas / khung hình theo module Phase 17 (xác định được, không phụ thuộc máy). python3 tests/xian17_ops.py"""
import os, sys, json, re
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SETUP = re.search(r'SETUP = """(.*?)"""', open(ROOT + '/tests/xian17_loot_test.py', encoding='utf-8').read(), re.S).group(1)
MODS = ['DV_XIAN17', 'DV_XIAN17S', 'DV_XIAN17D', 'DV_XIAN17B', 'DV_XIAN17L']
BUSY = """()=>{const g=__dv.G(),P=g.p;g.pend=0;g.paused=false;document.getElementById('lv').classList.remove('on');g.orb.length=0;
 for(let k=0;k<6;k++)g.orb.push({x:P.x-150+k*55,y:P.y-90,v:30});for(let k=0;k<18;k++)g.orb.push({x:P.x+20+(k%6)*7,y:P.y+110,g:1});g.orb.push({x:P.x+90,y:P.y,h:1,life:30});
 let n=0;for(const e of g.en){if(e.dead)continue;e.el=n%2?2:1;if(++n>2)break}return n}"""
ULT = "()=>{const g=__dv.G();g.e=100;g.sm=0;__dv.run(true);__dv.ult();__dv.run(false);g.sm=0;for(let k=0;k<7;k++)__st(.05);g.sm=0;g.fl.length=0;return g.ul}"
OPS = """(mods)=>{const P=CanvasRenderingContext2D.prototype,names=['createLinearGradient','createRadialGradient','drawImage','save','fill','stroke','fillRect','arc','ellipse'];
 const C={};const orig={};for(const n of names){orig[n]=P[n];C[n]=0;P[n]=function(){C[n]++;return orig[n].apply(this,arguments)}}
 const set=(m,v)=>{const o=window[m];if(o)o.enabled=v};const d=__dv,r={};
 const frame=(ms)=>{for(const n of names)C[n]=0;set('x',0);for(const m of mods)set(m,false);for(const m of ms)set(m,true);for(let k=0;k<2;k++)d.draw();for(const n of names)C[n]=0;d.draw();const o={};let tot=0;for(const n of names){o[n]=C[n];tot+=C[n]}o.TOTAL=tot;return o};
 r.none=frame([]);for(const m of mods)r[m]=frame([m]);
 for(const n of names)P[n]=orig[n];for(const m of mods)set(m,true);return r}"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(90000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    for q in (2, 1, 0):
        pg.evaluate(SETUP, [5, 2, q]); pg.evaluate(BUSY)
        for tag, pre in (('idle', None), ('ult', ULT)):
            if pre: pg.evaluate(pre)
            r = pg.evaluate(OPS, MODS)
            print(f'q{q} {tag:4s}', {k: v['TOTAL'] for k, v in r.items()}, '| grad', {k: v['createLinearGradient'] + v['createRadialGradient'] for k, v in r.items() if k != 'none'}, '| img', {k: v['drawImage'] - r['none']['drawImage'] for k, v in r.items() if k != 'none'}, '| save', {k: v['save'] - r['none']['save'] for k, v in r.items() if k != 'none'})
    print('ERRORS:', errs[:5] or 'none'); b.close()
