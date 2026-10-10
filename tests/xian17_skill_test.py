"""Kiểm thử Phase 17 · Phần 2 (js/xianxia17_skill.js). python3 tests/xian17_skill_test.py [DIR_ảnh]"""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else None
SETUP = """async (a)=>{const [c,i,q]=a,d=__dv;d.sv().snd=0;d.sv().q=q;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));
 d.run(false);const g=d.G(),P=g.p;window.__st=(s)=>{for(let k=0;k<s/.05;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 document.querySelector('#hud').classList.add('on');P.x=900+c*37;P.y=700+c*23;__st(10);g.fl.length=0;return g.en.length}"""
ULT = "()=>{const d=__dv,g=d.G();g.e=100;g.sm=0;d.run(true);d.ult();d.run(false);g.sm=0;return {ul:g.ul}}"
FRAME = "(s)=>{const d=__dv;__st(s);__dv.G().sm=0;__dv.G().fl.length=0;for(let k=0;k<3;k++)d.draw();const X=DV_XIAN17S;return {ult:X.stats.ult,strong:X.stats.strong,petals:X.stats.petals,fx:X.state().fx.length}}"
PERF = "()=>{const d=__dv,X=DV_XIAN17S,r={};for(const en of [false,true]){X.enabled=en;const g=d.G();g.e=100;d.run(true);d.ult();d.run(false);g.sm=0;for(let k=0;k<6;k++){__st(.1)}const t0=performance.now();for(let k=0;k<60;k++)d.draw();r[en?'on':'off']=+((performance.now()-t0)/60).toFixed(2);__st(3)}X.enabled=true;return r}"
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(90000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    if OUT: os.makedirs(OUT, exist_ok=True)
    for q in (2, 1, 0):
        print('q', q, 'enemies', pg.evaluate(SETUP, [5, 2, q]))
        pg.evaluate(ULT)
        for step, tag in ((.15, 'a'), (.3, 'b'), (.5, 'c'), (.6, 'd')):
            r = pg.evaluate(FRAME, step); print('  ', tag, json.dumps(r))
            if OUT and q == 2: pg.screenshot(path=f'{OUT}/ult_{tag}.png')
        if q == 2: print('  perf', pg.evaluate(PERF))
        r = pg.evaluate("()=>{__st(3);return DV_XIAN17S.state().fx.length+'/'+DV_XIAN17S.state().petals.length}"); print('  after end fx/petals', r)
    print('ERRORS:', errs[:8] if errs else 'none')
    b.close()
