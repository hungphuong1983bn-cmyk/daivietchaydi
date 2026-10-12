"""Võ công mở rộng: đủ 11 skill cấp 5 + tiến hoá chạy 40s mô phỏng ở nhiều màn, ở cả 3D và 2D (gọi draw()), không lỗi JS; kiểm tra sát thương, tiến hoá, thẻ chọn."""
import os, sys, json
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/opt/pw-browsers'
from playwright.sync_api import sync_playwright
PAGE='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))+'?debug'
KEYS=['hoa','bang','doc','phong','tinh','tru','lien','kim','hoi','hut','ngu']
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-gl=angle"])
    pg=b.new_page(viewport={'width':390,'height':780}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') and 'GPU' not in m.text and 'WebGL' not in m.text else None)
    pg.goto(PAGE); pg.wait_for_timeout(1000); out={}
    pg.evaluate("(()=>{__dv.sv().q=1;__dv.sv().sa=9999})()")
    for mode in (1,0):
        for (c,i) in ((0,2),(7,6),(20,3),(40,6)):
            pg.evaluate(f"(()=>{{__dv.sv().r3d={mode};__dv.begin({c},{i},false)}})()"); pg.wait_for_timeout(3000)
            r=pg.evaluate(f"""(()=>{{const d=__dv;d.run(false);const G=d.G();for(const k of {json.dumps(KEYS)}){{G.sk[k]=5;if(DV_DATA.skills[k].evo)G.evo[k]=1}}
              for(let n=0;n<800;n++){{G.p.hp=G.p.mhp;d.upd(.05);if(document.querySelector('#lv.on')){{try{{d.pick(0)}}catch(e){{}}}}if(n%20==0&&{1-mode})d.draw()}}
              d.draw();return JSON.stringify({{en:G.en.length,kills:G.kills,skx:(G.skx||[]).length,dm:G.dm|0}})}})()""")
            out[f'{"3D" if mode else "2D"} {c+1}-{i}']=json.loads(r)
    out['cards']=pg.evaluate("(()=>{const G=__dv.G();return Object.keys(DV_DATA.skills).length})()")
    out['errors']=errs[:10]; print(json.dumps(out,ensure_ascii=False,indent=1)); b.close()
