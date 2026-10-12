"""Võ công riêng từng tướng + nội tại + tuyệt kỹ: mỗi tướng chạy 40s mô phỏng + 1 lần Tuyệt Kỹ, ở 3D và 2D; kiểm tra có tung chiêu (G.cd.h1/h2 được đặt), không lỗi JS."""
import os, sys, json
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/opt/pw-browsers'
from playwright.sync_api import sync_playwright
PAGE='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))+'?debug'
OUT=sys.argv[1] if len(sys.argv)>1 else None
HEROES=['dbl','lh','nq','thd','dl','nb','ltk']
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-gl=angle"])
    pg=b.new_page(viewport={'width':390,'height':780}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') and 'GPU' not in m.text and 'WebGL' not in m.text and 'Failed to load' not in m.text else None)
    pg.goto(PAGE); pg.wait_for_timeout(1000); res={}
    pg.evaluate("(()=>{__dv.sv().q=1;__dv.sv().sa=9999})()")
    for mode in (1,0):
        for h in HEROES:
            pg.evaluate(f"(()=>{{const v=__dv.sv();v.r3d={mode};v.hs='{h}';v.hx['{h}']=v.hx['{h}']||{{l:40,e:0}};v.hx['{h}'].l=40;__dv.begin(2,3,false)}})()"); pg.wait_for_timeout(2800)
            r=pg.evaluate("""(()=>{const d=__dv,G=d.G();d.run(false);const seen={h1:0,h2:0};let prev={h1:99,h2:99};
              for(let n=0;n<800;n++){G.p.hp=G.p.mhp;d.upd(.05);const c=G.cd;for(const k of['h1','h2']){if(c[k]!=null&&c[k]>prev[k]+.5)seen[k]++;if(c[k]!=null)prev[k]=c[k]}if(document.querySelector('#lv.on')){try{d.pick(0)}catch(e){}}
                if(n===500){G.e=100;document.querySelector('#ult').dispatchEvent(new PointerEvent('pointerdown'))}}
              d.draw&&d.draw();return JSON.stringify({seen,kills:G.kills,dm:G.dm|0,skx:(G.skx||[]).length,am:+G.am.toFixed(2),cr:+G.cr.toFixed(2)})})()""")
            res[f'{"3D" if mode else "2D"} {h}']=json.loads(r)
            if OUT and mode==1:
                pg.evaluate("(()=>{const d=__dv,G=d.G();d.run(false);for(let n=0;n<40;n++){G.p.hp=G.p.mhp;d.upd(.05)}d.run(true)})()"); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/hero_{h}.png')
    res['errors']=errs[:10]; print(json.dumps(res,ensure_ascii=False,indent=0)); b.close()
