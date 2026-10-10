"""Quét 52 chương × 6 màn (có chờ Loading Phase 13): ván chạy được, Boss xuất hiện, vẽ không lỗi, Phase 15 không tự tắt.
   python3 tests/sweep15.py 0 18   → chương 0..17"""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
A, B = int(sys.argv[1]), int(sys.argv[2])
JS = """async (a)=>{const [c,i]=a,d=__dv;d.sv().snd=0;d.sv().q=1;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,60));
 d.run(false);const g=d.G(),P=g.p,st=DV_DATA.getStage(c,i),bad=[];
 const step=(s)=>{for(let k=0;k<s/.05;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 step(6);for(let k=0;k<4;k++)d.draw();
 g.t=st.bossAt-.1;step(1.5);for(let k=0;k<4;k++)d.draw();
 if(!g.en.find(e=>e.boss))bad.push('Boss không xuất hiện');
 if(!DV_MAP15.enabled)bad.push('Phase15 tự tắt');
 document.querySelector('#end').classList.remove('on');return bad}"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(60000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    bad = []; n = 0
    for c in range(A, B):
        for i in range(1, 7):
            n += 1
            try:
                for x in pg.evaluate(JS, [c, i]): bad.append(f'{c+1}-{i}: {x}')
            except Exception as e: bad.append(f'{c+1}-{i}: EXC {str(e)[:120]}')
    print(json.dumps({'stages': n, 'nbad': len(bad), 'bad': bad[:12], 'jsErrors': errs[:5]}, ensure_ascii=False))
    b.close()
