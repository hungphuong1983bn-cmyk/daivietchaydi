"""Kiểm thử Phase 17 · Phần 1 (js/xianxia17.js). python3 tests/xian17_test.py [DIR_ảnh]"""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else None
THEMES = {'plain': 0, 'mountain': 8, 'cave': 27, 'shadow': 5}
PRE = """async (a)=>{const [c,i,q]=a,d=__dv;d.sv().snd=0;d.sv().q=q;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));
 d.run(false);const g=d.G(),P=g.p;
 const step=(s)=>{for(let k=0;k<s/.05;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 document.querySelector('#hud').classList.add('on');P.x=900+c*37;P.y=700+c*23;step(8);g.fl&&(g.fl.length=0);
 for(let k=0;k<12;k++)d.draw();const X=window.DV_XIAN17;return {ok:X.ok(),layers:X.stats.layers,parts:X.stats.parts,q:X.state().q}}"""
PERF = """async ()=>{const d=__dv,X=window.DV_XIAN17,r={};for(const en of [false,true]){X.enabled=en;for(let k=0;k<20;k++)d.draw();const t0=performance.now();for(let k=0;k<100;k++)d.draw();r[en?'on':'off']=+((performance.now()-t0)/100).toFixed(2)}X.enabled=true;return r}"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(90000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    if OUT: os.makedirs(OUT, exist_ok=True)
    for name, c in THEMES.items():
        for q in (2, 1, 0):
            r = pg.evaluate(PRE, [c, 2, q]); print(name, 'q', q, json.dumps(r))
            if q == 2: print('  perf ms/frame', pg.evaluate(PERF))
            if OUT and q in (2, 0): pg.screenshot(path=f'{OUT}/{name}_q{q}.png')
            pg.evaluate("()=>{__dv.finish&&0}")
    print('ERRORS:', errs[:8] if errs else 'none')
    b.close()
