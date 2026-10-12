"""Luồng 3D: Home -> vào trận -> giao tranh -> rơi đồ -> kết thúc/thưởng -> lưu -> về Home. Chạy: python3 -I tests/flow3d_test.py (cần http.server cổng 8099 hoặc file://)"""
import os, sys, json
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/opt/pw-browsers'
from playwright.sync_api import sync_playwright
PAGE='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))+'?debug'
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-gl=angle"])
    pg=b.new_page(viewport={'width':390,'height':780}); errs=[]
    pg.on('requestfailed',lambda r:errs.append('REQ '+r.url[-60:])); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(PAGE); pg.wait_for_timeout(1000)
    r={}
    pg.evaluate("(()=>{__dv.sv().q=0;__dv.home()})()"); pg.wait_for_timeout(3500)
    r['home3d']=pg.evaluate("DV_R3D.home.on")
    g0=pg.evaluate("[__dv.sv().gold,__dv.sv().st.games]")
    pg.evaluate("(()=>{__dv.sv().sa=999;__dv.begin(0,1,false)})()"); pg.wait_for_timeout(3500)
    r['battle3d']=pg.evaluate("DV_R3D.active&&DV_R3D.active()")
    r['homeOffInBattle']=not pg.evaluate("DV_R3D.home.on")
    pg.evaluate("(()=>{const d=__dv;d.run(false);const G=d.G();for(let i=0;i<600;i++){G.p.hp=G.p.mhp;d.upd(.05);if(document.querySelector('#lv.on')){try{d.pick(0)}catch(e){}}}d.run(true)})()")
    pg.wait_for_timeout(1500)
    r['orbs']=pg.evaluate("__dv.G().orb.length"); r['enemies']=pg.evaluate("__dv.G().en.length")
    pg.screenshot(path=OUT+'/flow_battle.png')
    pg.evaluate("(()=>{const G=__dv.G();G.win=1;__dv.finish()})()"); pg.wait_for_timeout(2500)
    r['endShown']=pg.evaluate("!!document.querySelector('#end.on')")
    g1=pg.evaluate("[__dv.sv().gold,__dv.sv().st.games]"); r['rewardGold']=g1[0]-g0[0]; r['gamesInc']=g1[1]-g0[1]
    r['saved']=pg.evaluate("!!localStorage.length")
    pg.screenshot(path=OUT+'/flow_end.png')
    pg.click('#b-home'); pg.wait_for_timeout(3500)
    r['homeBack3d']=pg.evaluate("DV_R3D.home.on"); r['battleOff']=not pg.evaluate("DV_R3D.active&&DV_R3D.active()")
    pg.screenshot(path=OUT+'/flow_home.png')
    # chế độ 2D
    pg.evaluate("(()=>{__dv.sv().r3d=0;__dv.begin(0,1,false)})()"); pg.wait_for_timeout(3000)
    r['2dFallback']=not pg.evaluate("DV_R3D.active&&DV_R3D.active()")
    r['errors']=errs[:8]; print(json.dumps(r,ensure_ascii=False,indent=1)); b.close()
