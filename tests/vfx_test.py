"""Phase 10 — chụp VFX chiến đấu trong trận.  python3 tests/vfx_test.py OUT [quality 0|1|2]
Mỗi kịch bản: gom quái 8s → kích kỹ năng → chụp ở 3 mốc thời gian → ghép contact sheet."""
import os, sys, json
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
from PIL import Image
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/vfx'
QL = int(sys.argv[2]) if len(sys.argv) > 2 else 2
os.makedirs(OUT, exist_ok=True)
SC = [  # (tên, hero, kỹ năng, tiến hoá, ult?)
 ('kiem', 'dbl', {'kiem': 5}, [], 0), ('kiem_evo', 'dbl', {'kiem': 5, 'khinh': 3}, ['kiem'], 0),
 ('loi', 'thd', {'loi': 4}, [], 0), ('loi_evo', 'thd', {'loi': 5, 'ho': 2}, ['loi'], 0),
 ('hang', 'lh', {'hang': 4}, [], 0), ('hang_evo', 'lh', {'hang': 5, 'ho': 3}, ['hang'], 0),
 ('phi', 'nq', {'phi': 4}, [], 0), ('phi_evo', 'nq', {'phi': 5, 'khinh': 2}, ['phi'], 0),
 ('ult_dbl', 'dbl', {'kiem': 3}, [], 1), ('ult_lh', 'lh', {'hang': 3}, [], 1), ('ult_nq', 'nq', {'phi': 3}, [], 1),
 ('ult_thd', 'thd', {'loi': 3}, [], 1), ('ult_dl', 'dl', {'phi': 3}, [], 1), ('ult_nb', 'nb', {'hang': 3}, [], 1), ('ult_ltk', 'ltk', {'kiem': 3}, [], 1)]
FR = [5, 12, 22]
PRE = """async (o)=>{const d=__dv;d.sv().hs=o.h;d.sv().q=o.q;const G0=d.G();d.begin(0,1);for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));d.run(false);
 const G=d.G(),P=G.p;P.hp=P.mhp=1e9;let t=0;while(G.t<7&&t<900){if(G.paused){const cs=[...document.querySelectorAll('#cards .card')].map(x=>x.dataset.k);if(cs.length)d.pick(cs[0]);G.paused=false;continue}P.hp=1e9;d.upd(.04);t++}
 return {en:G.en.length}}"""
SET = """(o)=>{const d=__dv,G=d.G();G.sk=o.sk;G.evo={};o.evo.forEach(k=>G.evo[k]=1);G.cd={};G.pr.length=0;G.p.hp=G.p.mhp=1e9;G.e=100;G.en.forEach((e,i)=>{if(e.boss)return;const a=i*2.4,r=60+(i%6)*32;e.x=G.p.x+Math.cos(a)*r;e.y=G.p.y+Math.sin(a)*r*.8;e.hp=e.mhp=1e7});if(o.ult){d.run(true);d.ult();d.run(false)}return d.VF().stats()}"""
STEP = """(n)=>{const d=__dv,G=d.G();for(let i=0;i<n;i++){G.p.hp=1e9;d.upd(.016)}d.draw();return d.VF().stats()}"""
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 560, 'height': 860})
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(PAGE); pg.wait_for_timeout(600)
    for name, h, sk, evo, ult in SC:
        pg.evaluate("document.querySelectorAll('.ov,#home,#loading').forEach(x=>x.style.display='none')")
        pg.evaluate(PRE, {'h': h, 'q': QL})
        pg.evaluate(SET, {'sk': sk, 'evo': evo, 'ult': ult})
        ims = []; last = 0; st = None
        for f in FR:
            st = pg.evaluate(STEP, f - last); last = f
            fn = f'{OUT}/{name}_{f}.png'; pg.locator('canvas').first.screenshot(path=fn); im=Image.open(fn); w,h=im.size; ims.append(im.crop((0, h//2-300, w, h//2+260)).resize((560,560)) if w!=560 else im.crop((0,h//2-300,w,h//2+260)))
        sheet = Image.new('RGB', (560 * 3, 560)); [sheet.paste(im, (i * 560, 0)) for i, im in enumerate(ims)]
        sheet.save(f'{OUT}/sheet_{name}.png'); print(name, st)
    print('ERRS', errs[:8]); b.close()

# ---- cảnh kẻ địch: đạn theo chủ đề, vùng báo đòn, thiên thạch, nổ, boss gục ----
EN = """(o)=>{const d=__dv,G=d.G(),P=G.p;G.en.length=0;G.ep.length=0;G.tz.length=0;G.ch=G.ch||{};G.ch.theme=o.th;
 for(let i=0;i<8;i++){const a=i/8*6.28;G.ep.push({x:P.x+Math.cos(a)*40,y:P.y+Math.sin(a)*40,vx:Math.cos(a)*150,vy:Math.sin(a)*150,life:4,dmg:0})}
 G.tz.push({x:P.x-120,y:P.y+60,r:70,t:.9,T:1.5,dmg:0,k:'m'},{x:P.x+110,y:P.y+50,r:80,t:.9,T:1.5,dmg:0,k:'s'});
 d.VF().boom(P.x+10,P.y-110,60);return 1}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 560, 'height': 860}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(600); ims = []
    for th in ['plain', 'swamp', 'snow', 'volcano']:
        pg.evaluate("document.querySelectorAll('.ov,#home,#loading').forEach(x=>x.style.display='none')")
        pg.evaluate(PRE, {'h': 'dbl', 'q': QL}); pg.evaluate(EN, {'th': th})
        for f in (28,):
            pg.evaluate(STEP, f); fn = f'{OUT}/enemy_{th}.png'; pg.locator('canvas').first.screenshot(path=fn)
            im = Image.open(fn); w, h = im.size; ims.append(im.crop((0, h//2-260, w, h//2+260)))
    sh = Image.new('RGB', (ims[0].size[0]*2, ims[0].size[1]*2))
    for i, im in enumerate(ims): sh.paste(im, ((i % 2)*im.size[0], (i//2)*im.size[1]))
    sh.save(f'{OUT}/sheet_enemy.png'); print('ENEMY ERRS', errs[:5]); b.close()
