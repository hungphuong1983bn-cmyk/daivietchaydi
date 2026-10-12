"""Phase 21 — Hiệu ứng võ công chibi: combo, kiếm phong, long thần vạn kiếm (ult), tuyệt ảnh, thiên hỏa, băng long, quỷ ảnh, trúng đòn/chí mạng, trạng thái.
Chạy: python3 -I tests/wuxia_test.py [thư_mục_ảnh]  (Playwright + SwiftShader). Đếm hiệu ứng thật + lỗi JS ở 3 mức chất lượng, chụp ảnh."""
import os, sys, json
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/opt/pw-browsers'
from playwright.sync_api import sync_playwright
PAGE='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))+'?debug'
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-gl=angle"])
    pg=b.new_page(viewport={'width':780,'height':560}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') and 'GPU' not in m.text and 'WebGL' not in m.text else None)
    pg.goto(PAGE); pg.wait_for_timeout(1000); out={}
    for q in (2,1,0):
        pg.evaluate(f"(()=>{{__dv.sv().q={q};__dv.sv().sa=9999;__dv.sv().r3d=1;__dv.begin(0,2,false)}})()"); pg.wait_for_timeout(2500)
        r=pg.evaluate("""(()=>{const d=__dv;d.run(false);const G=d.G();const W=DV_R3D.wux,F=DV_R3D.F;
          for(const k of ['kiem','phong','tinh','bang','hoa'])G.sk[k]=5; const seen={step:0,maxList:0,ice:0,sig:0,shd:0,fz:0,pr:0,ult:0,trail:0,maxFps:0};
          const t0=performance.now();
          for(let n=0;n<100;n++){G.p.hp=G.p.mhp;d.upd(.05);
            if(n===25){DV_VFX.ult(G.p)}               // Tuyệt Kỹ = Long Thần Vạn Kiếm
            if(n===40){for(let i=1;i<=5;i++)G.skxe.push({e:'trail',x:G.p.x+i*26,y:G.p.y,col:'#7ad8ff',d:i*.02})}   // Tuyệt Ảnh
            if(n===50){const e=G.en[0];if(e){e.slw=2;e.slk=.3;DV_VFX.onHit(e,'kiem',true,99)}}   // chí mạng + đóng băng
            if(n%2==0)d.draw();seen.maxList=Math.max(seen.maxList,F.list.length);seen.ice=Math.max(seen.ice,W.ice.size);seen.sig=Math.max(seen.sig,W.sig.size);seen.shd=Math.max(seen.shd,W.shd.size);
            seen.fz=Math.max(seen.fz,W.st.fz.filter(m=>m.visible).length);seen.pr=Math.max(seen.pr,G.pr.length);
            if(document.querySelector('#lv.on')){try{d.pick(0)}catch(e){}}
            if(window.__shot&&window.__shot[n])window.__shot[n]=1;}
          seen.step=W.step;seen.ms=Math.round((performance.now()-t0)/100);seen.en=G.en.length;seen.kills=G.kills;seen.dm=G.dm|0;return JSON.stringify(seen)})()""")
        out[f'q{q}']=json.loads(r)
        if q==2:
            for tag,n in (('combo',12),('ult',46),('skills',110)):
                pg.evaluate(f"""(()=>{{const d=__dv;d.run(false);const G=d.G();for(const k of ['kiem','phong','tinh','bang','hoa'])G.sk[k]=5;
                  for(let i=0;i<{n};i++){{G.p.hp=G.p.mhp;d.upd(.05);if(i==30&&'{tag}'=='ult')DV_VFX.ult(G.p);if(document.querySelector('#lv.on')){{try{{d.pick(0)}}catch(e){{}}}}d.draw()}}}})()""")
                pg.screenshot(path=f'{OUT}/wux_{tag}.png')
    out['errors']=sorted(set(errs))[:12]; print(json.dumps(out,ensure_ascii=False,indent=1)); b.close()
