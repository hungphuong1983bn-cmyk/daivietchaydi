"""Kiểm thử Phase 17 · Phần 4 (js/xianxia17_boss.js). python3 tests/xian17_boss_test.py [DIR_ảnh]"""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else None
SETUP = """async (a)=>{const [c,i,q,boss]=a,d=__dv;d.sv().snd=0;d.sv().q=q;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));
 d.run(false);const g=d.G(),P=g.p;window.__st=(s)=>{for(let k=0;k<s/.05;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 document.querySelector('#hud').classList.add('on');P.x=900+c*37;P.y=700+c*23;
 if(boss){const st=DV_DATA.getStage(c,6);g.t=st.bossAt-.1;__st(3.4)}else __st(14);
 for(let k=0;k<6;k++)d.draw();return {boss:!!g.boss,en:g.en.length}}"""
MARK = """()=>{const g=__dv.G();let n=0;for(const e of g.en){if(e.dead||e.boss)continue;if(n===0){e.mb=1}else if(n===1){e.el=1}else if(n===2){e.el=2}if(++n>=3)break}
 for(let k=0;k<4;k++)__dv.draw();return {marked:n,rim:DV_XIAN17B.stats.rim}}"""
BAR = """()=>{const g=__dv.G(),b=g.boss;if(!b)return null;const out={};const w=document.getElementById('bossw');w.style.display='block';const bb=document.getElementById('bossb');b.hp=b.mhp;bb.style.width='100%';for(let k=0;k<4;k++)__dv.draw();out.full=document.getElementById('bossp').textContent;
 b.hp=b.mhp*.55;bb.style.width='55%';for(let k=0;k<4;k++)__dv.draw();__dv.hud&&0;out.after=document.getElementById('bossp').textContent;out.lag=+DV_XIAN17B.state().lag.toFixed(2);for(let k=0;k<40;k++){DV_XIAN17B.state().last-=50;__dv.draw()}out.lag2=+DV_XIAN17B.state().lag.toFixed(2);
 const r=document.getElementById('bossw').getBoundingClientRect();out.rect=[r.x|0,r.y|0,r.width|0,r.height|0];out.vis=getComputedStyle(document.getElementById('bossw')).display;return out}"""
PERF = "()=>{const d=__dv,X=DV_XIAN17B,r={};for(const en of [false,true]){X.enabled=en;for(let k=0;k<10;k++)d.draw();const t0=performance.now();for(let k=0;k<80;k++)d.draw();r[en?'on':'off']=+((performance.now()-t0)/80).toFixed(2)}X.enabled=true;return r}"
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(90000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    if OUT: os.makedirs(OUT, exist_ok=True)
    for q in (2, 1, 0):
        print('q', q, 'boss stage', pg.evaluate(SETUP, [5, 6, q, True]))
        print('  bar', json.dumps(pg.evaluate(BAR)))
        if OUT and q in (2, 0): pg.screenshot(path=f'{OUT}/boss_q{q}.png')
        if q == 2: print('  perf', pg.evaluate(PERF))
        print('  normal stage', pg.evaluate(SETUP, [5, 2, q, False]), pg.evaluate(MARK))
        if OUT and q == 2: pg.screenshot(path=f'{OUT}/elite_q2.png')
    print('ERRORS:', errs[:8] if errs else 'none')
    b.close()
