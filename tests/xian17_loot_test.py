"""Kiểm thử Phase 17 · Phần 5 cột sáng rơi đồ + Phần 6 HUD vàng kim. python3 tests/xian17_loot_test.py [DIR_ảnh]"""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else None
SETUP = """async (a)=>{const [c,i,q]=a,d=__dv;d.sv().snd=0;d.sv().q=q;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));
 d.run(false);const g=d.G(),P=g.p;window.__st=(s)=>{for(let k=0;k<s/.05;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 document.querySelector('#hud').classList.add('on');P.x=900+c*37;P.y=700+c*23;__st(6);g.fl.length=0;return g.en.length}"""
# thả vật rơi giả quanh người chơi (chỉ đọc bởi module; không đổi game)
DROP = """()=>{const g=__dv.G(),P=g.p;g.orb.length=0;
 g.orb.push({x:P.x-120,y:P.y-30,v:30});            // EXP lớn = Boss
 g.orb.push({x:P.x+110,y:P.y-10,h:1,life:20});     // bình hồi sinh
 for(let k=0;k<14;k++)g.orb.push({x:P.x+20+(k%5)*7,y:P.y+110+(k%3)*6,g:1});   // cụm vàng
 g.orb.push({x:P.x-60,y:P.y+90,v:2});              // EXP thường (không cột)
 g.orb.push({x:P.x+170,y:P.y+60,v:30});g.orb.push({x:P.x-170,y:P.y+70,h:1,life:20});
 for(let k=0;k<4;k++){g.orb.push({x:P.x+30+k*25,y:P.y-140,v:40})}
 g.t+=.05;for(let k=0;k<4;k++)__dv.draw();g.t+=.5;__dv.draw();const L=DV_XIAN17L.stats;return {beams:L.beams,orbs:L.orbs,sparks:L.sparks}}"""
PICK = """()=>{const g=__dv.G(),P=g.p;g.paused=false;g.orb.length=0;g.t+=.05;__dv.draw();DV_XIAN17L.state().ghosts.length=0;g.orb.push({x:P.x+5,y:P.y,v:30});g.t+=.05;__dv.draw();g.t+=.05;__dv.draw();
 const b0=DV_XIAN17L.stats.beams;P.hp=P.mhp;__dv.upd(.05);g.paused=false;__dv.draw();const gh=DV_XIAN17L.stats.ghosts;g.t+=1;__dv.draw();return {before:b0,ghostsAfterPickup:gh,ghostsLater:DV_XIAN17L.stats.ghosts,orbs:g.orb.length}}"""
HUD = """()=>{const h=document.getElementById('hud'),g=__dv.G(),P=g.p,cs=(s)=>getComputedStyle(document.querySelector(s));
 P.hp=P.mhp*.2;for(let k=0;k<3;k++)__dv.draw();const out={low:h.classList.contains('x17hlow'),lo:document.querySelector('#hud .bars .bar').classList.contains('x17lo'),
 av:cs('#hud .av').borderTopColor,stat:cs('#hud .stat').borderTopWidth,ult:cs('#ult').borderTopWidth,avBg:cs('#hud .av').backgroundImage.slice(0,40)};
 P.hp=P.mhp;for(let k=0;k<3;k++)__dv.draw();out.lowAfter=h.classList.contains('x17hlow');return out}"""
PERF = "()=>{const d=__dv,r={};const g=d.G();for(const en of [false,true]){DV_XIAN17L.enabled=en;DV_XIAN17H.enabled=en;for(let k=0;k<10;k++)d.draw();const t0=performance.now();for(let k=0;k<80;k++)d.draw();r[en?'on':'off']=+((performance.now()-t0)/80).toFixed(2)}DV_XIAN17L.enabled=true;DV_XIAN17H.enabled=true;return r}"
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(90000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    if OUT: os.makedirs(OUT, exist_ok=True)
    for q in (2, 1, 0):
        print('q', q, 'enemies', pg.evaluate(SETUP, [5, 2, q]))
        print('  drop', json.dumps(pg.evaluate(DROP)))
        if OUT: pg.screenshot(path=f'{OUT}/loot_q{q}.png')
        print('  pickup', json.dumps(pg.evaluate(PICK)))
        print('  hud', json.dumps(pg.evaluate(HUD)))
        if OUT: pg.evaluate(DROP); pg.screenshot(path=f'{OUT}/hud_q{q}.png')
        if q == 2: print('  perf', pg.evaluate(DROP.replace("return {beams", "window.__d=1;return {beams")) and pg.evaluate(PERF))
    print('ERRORS:', errs[:8] if errs else 'none')
    b.close()
