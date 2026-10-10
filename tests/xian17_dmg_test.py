"""Kiểm thử Phase 17 · Phần 3 (js/xianxia17_dmg.js). python3 tests/xian17_dmg_test.py [DIR_ảnh]"""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else None
SETUP = """async (a)=>{const [c,i,q]=a,d=__dv;d.sv().snd=0;d.sv().q=q;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));
 d.run(false);const g=d.G(),P=g.p;window.__st=(s)=>{for(let k=0;k<s/.05;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 document.querySelector('#hud').classList.add('on');P.x=900+c*37;P.y=700+c*23;g.cr=1;__st(8);return 1}"""
# số thật từ chiến đấu (cr=1 → toàn chí mạng) rồi cr=0 để có thường/kỹ năng
REAL = "()=>{const g=__dv.G();const seen={};g.cr=1;for(let k=0;k<40;k++){__st(.5);g.fl.forEach(f=>{if(f.k)seen[f.k+':'+(f.u||'-')]=1})}g.cr=0;for(let k=0;k<40;k++){__st(.5);g.fl.forEach(f=>{if(f.k)seen[f.k+':'+(f.u||'-')]=1})}return Object.keys(seen)}"
# bố cục mẫu quanh nhân vật để chụp ảnh
SHOW = """()=>{const g=__dv.G(),P=g.p;g.fl.length=0;g.en.length=0;const L=[['n',0,0,'4826',15],['n',0,1,'5637',18],['c',0,0,'7284!',24],['c','ult',0,'9120!',24],['s','hang',0,'4912',18],['s','loi',0,'6120',18],['s','phi',0,'3350',15],['s','ult',0,'12840',18],['n',0,1,'88000',18]];
 L.forEach((l,i)=>{g.fl.push({k:l[0],u:l[1],b:l[2],v:l[3],s:l[4],t:.9,T:1,x:P.x+((i%3)-1)*110,y:P.y-30-Math.floor(i/3)*55})});
 for(let k=0;k<3;k++)__dv.draw();return DV_XIAN17D.stats}"""
PERF = "()=>{const g=__dv.G(),P=g.p,X=DV_XIAN17D,r={};for(const en of [false,true]){X.enabled=en;g.fl.length=0;for(let i=0;i<24;i++)g.fl.push({k:i%3?'n':'c',u:i%4?0:'hang',b:0,v:String(1000+i)+(i%3?'':'!'),s:i%3?15:24,t:5,T:5,x:P.x+(i%6-3)*60,y:P.y-20-Math.floor(i/6)*40});for(let k=0;k<10;k++)__dv.draw();const t0=performance.now();for(let k=0;k<80;k++)__dv.draw();r[en?'on':'off']=+((performance.now()-t0)/80).toFixed(2)}X.enabled=true;return r}"
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(90000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    if OUT: os.makedirs(OUT, exist_ok=True)
    for q in (2, 1, 0):
        pg.evaluate(SETUP, [5, 2, q]); print('q', q, 'real hit kinds:', pg.evaluate(REAL))
        print('  show', pg.evaluate(SHOW))
        if OUT and q in (2, 0): pg.screenshot(path=f'{OUT}/dmg_q{q}.png')
        if q == 2: print('  perf ms/frame', pg.evaluate(PERF))
    print('ERRORS:', errs[:8] if errs else 'none')
    b.close()
