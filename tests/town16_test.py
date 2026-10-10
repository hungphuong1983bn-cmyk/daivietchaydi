"""Kiểm thử Phase 16 — khu mẫu Cổ Trấn / Cầu Gỗ / Thác Nước (js/town16.js + js/town16_art.js). Cần Playwright.
   python3 tests/town16_test.py            → kiểm tra logic (va chạm, nước, cầu, vòng đời, hiệu năng, lỗi console)
   python3 tests/town16_test.py shots DIR  → thêm ảnh chụp trong game (điện thoại + máy tính, ngày/hoàng hôn/đêm) và bản đồ tổng quan
Chương 24 (chỉ số 23) gắn khu 'cotran' trong data/environments.js."""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SHOTS = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == 'shots' else None
CH = 23   # chương 24 · Đất Tổ Phong Châu

BEGIN = """async (a)=>{const [c,i,q]=a,d=__dv;d.sv().snd=0;d.sv().q=q;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));
 d.run(false);const g=d.G();document.querySelector('#hud').classList.add('on');
 const step=(s)=>{for(let k=0;k<s/.05;k++){g.p.hp=g.p.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 step(1.5);g.en.length=0;g.fl&&(g.fl.length=0);const E=d.ENV.state();
 return {town:!!E.town,c:E.c,tod:E.todK}}"""
# đặt người chơi (wx,wy theo ô) → vẽ → trả trạng thái
VIEW = """(a)=>{const [x,y,tod]=a,d=__dv,g=d.G(),E=d.ENV.state();g.p.x=x*64;g.p.y=y*64;g.p.vx=g.p.vy=0;g.en.length=0;
 if(tod){const T=DV_DATA.envRules.tod[tod];E.todK=tod;E.tod=T}
 for(let k=0;k<6;k++){d.upd(.05)}g.en.length=0;for(let k=0;k<3;k++)d.draw();return {x:g.p.x,y:g.p.y,town:!!E.town}}"""
# bản đồ tổng quan: vẽ nền + vật thể y-sort + sông lên canvas lớn (không có quái / ánh sáng)
OVER = """(a)=>{const [x0,y0,x1,y1,k]=a,d=__dv,ENV=d.ENV,E=ENV.state(),W=(x1-x0)*64*k,Hh=(y1-y0)*64*k,cv=document.createElement('canvas');cv.width=W;cv.height=Hh;
 const ctx=cv.getContext('2d');ctx.scale(k,k);const w=W/k,h=Hh/k,cx=x0*64,cy=y0*64;
 for(let n=0;n<4;n++)ENV.drawGround(ctx,cx,cy,w,h);const L=[];ENV.props(cx,cy,w,h,L);L.sort((p,q)=>p.y-q.y);
 for(const o of L){const sx=o.x-cx,sy=o.y-cy;if(o.ob)ENV.drawProp(ctx,o,sx,sy)}
 window.__ov=cv;return cv.toDataURL('image/png').length}"""

with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files'])
    out = {}; bad = []; errs = []
    def newpage(w, h):
        pg = b.new_page(viewport={'width': w, 'height': h}); pg.set_default_timeout(60000)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console:' + m.text) if m.type in ('error', 'warning') else None)
        return pg
    pg = newpage(420, 800); pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    r = pg.evaluate(BEGIN, [CH, 2, 2]); out['begin'] = r
    if not r['town']: bad.append('chương 24 không bật khu cotran')
    if SHOTS: os.makedirs(SHOTS, exist_ok=True)
    def shot(name, x, y, tod=None):
        pg.evaluate(VIEW, [x, y, tod]); pg.wait_for_timeout(250); pg.evaluate('()=>__dv.draw()')
        if SHOTS: pg.locator('#cv').screenshot(path=f'{SHOTS}/{name}.png')
    if SHOTS:
        for name, x, y, tod in [('m_spawn', 0, 0, None), ('m_bridge', 0, -5.6, None), ('m_gate', 0, -9.9, None), ('m_plaza', 0, -15.2, None), ('m_fall', -12, -7.2, None), ('m_dinh', 0, -20.5, None),
                                ('m_dusk_bridge', 0, -5.6, 'dusk'), ('m_night_plaza', 0, -14, 'night'), ('m_night_fall', -12, -7.2, 'night')]:
            shot(name, x, y, tod)
        pg.evaluate("()=>{const E=__dv.ENV.state();E.todK='day';E.tod=DV_DATA.envRules.tod.day}")
        n = pg.evaluate(OVER, [-21, -27, 27, 1.5, .5]); out['overview_len'] = n
        data = pg.evaluate("()=>window.__ov.toDataURL('image/png')").split(',')[1]
        import base64; open(f'{SHOTS}/overview.png', 'wb').write(base64.b64decode(data))
    # --- logic ---
    L = pg.evaluate("""()=>{const d=__dv,E=d.ENV.state(),T=E.town,g=d.G(),P=g.p,r={};
      // 1) va chạm nhà: đi thẳng vào nhà phố từ phía nam → bị chặn trước mép chân nhà
      const hx=-4.9*64,hy=-11.2*64;P.x=-288;P.y=hy+120;P.vx=0;P.vy=0;let miny=1e9;for(let k=0;k<80;k++){P.vy=-130;d.upd(.05);g.en.length=0;miny=Math.min(miny,P.y)}
      r.houseStop=miny-hy;                                          // >=-12 nghĩa là không xuyên vào thân nhà
      // 2) nước chậm, cầu gỗ không chậm
      const river=T.R[40];P.x=river.x;P.y=river.y;d.upd(.05);const mW=d.ENV.pm();
      P.x=0;P.y=-6*64;d.upd(.05);const mB=d.ENV.pm();
      P.x=0;P.y=-1*64;d.upd(.05);const mL=d.ENV.pm();
      r.pm={water:mW,bridge:mB,land:mL};
      r.foe={water:d.ENV.foe(river.x,river.y),bridge:d.ENV.foe(0,-6*64),land:d.ENV.foe(0,-64)};
      // 3) đi từ điểm xuất phát qua cầu, vào cổng, tới quảng trường (đi bằng cách đặt vận tốc, không xuyên nhà)
      P.x=0;P.y=0;let steps=0;for(;steps<2000&&P.y>-15*64;steps++){P.vx=0;P.vy=-130;d.inp&&0;d.upd(.05);g.en.length=0;if(P.hp<=0)P.hp=P.mhp}
      r.walk={y:P.y/64,x:P.x/64,steps};
      // 4) vách thác chặn
      P.x=-13*64;P.y=-9*64;let m2=1e9;for(let k=0;k<80;k++){P.vy=-140;d.upd(.05);g.en.length=0;m2=Math.min(m2,P.y)}r.cliffStop=m2/64;
      // 5) ob() ngoài khu giữ nguyên sinh ngẫu nhiên
      let out=0;for(let gx=60;gx<90;gx++)for(let gy=-40;gy<-10;gy++)if(d.ENV.ob(gx,gy))out++;r.randomOutside=out;
      // 6) ô trong khu không có đá ngẫu nhiên khi trống
      r.cells=T.cells.size;r.deco=T.deco.length;r.lamps=T.lamps.length;r.chunks=T.chunks.size;
      return r}""")
    out['logic'] = L
    if L['houseStop'] < -14: bad.append('xuyên vào nhà phố: %s' % L['houseStop'])
    if not (L['pm']['water'] < 1 and L['pm']['bridge'] == 1 and L['pm']['land'] == 1): bad.append('tốc độ nước/cầu sai: %s' % L['pm'])
    if not (L['foe']['water'] < 1 and L['foe']['bridge'] == 1): bad.append('quái lội nước sai')
    if L['walk']['y'] > -14.5 * 64 / 64 + 0.01 and L['walk']['steps'] >= 2000: bad.append('không đi được từ spawn tới quảng trường: %s' % L['walk'])
    if L['cliffStop'] < -10.45: bad.append('xuyên vách thác')
    if L['randomOutside'] == 0: bad.append('ngoài khu mất đá ngẫu nhiên')
    # --- hiệu năng (CPU phần mềm; so sánh tương đối bật/tắt khu) ---
    perf = pg.evaluate("""()=>{const d=__dv,E=d.ENV.state(),T=E.town,g=d.G(),r={};g.en.length=0;
      const run=()=>{for(let k=0;k<20;k++)d.draw();const t0=performance.now();for(let k=0;k<100;k++)d.draw();return (performance.now()-t0)/100};
      for(const [n,x,y] of [['bridge',0,-5.6],['plaza',0,-15.2],['fall',-12,-7.2],['meadow_far',0,40]]){g.p.x=x*64;g.p.y=y*64;r[n]=run()}
      r.chunkMB=T.chunks.size*Math.pow(512*T.ks,2)*4/1048576;return r}""")
    out['perf_ms'] = {k: round(v, 2) for k, v in perf.items()}
    # --- vòng đời: thua/thắng → ván mới không lỗi, khu cũ không dính ---
    pg.evaluate("()=>{const d=__dv,g=d.G();g.win=true;d.finish()}"); pg.wait_for_timeout(300)
    r2 = pg.evaluate(BEGIN, [4, 2, 2]); out['other_chapter_town'] = r2['town']
    if r2['town']: bad.append('chương khác bị dính khu cotran')
    r3 = pg.evaluate(BEGIN, [CH, 6, 1]); out['boss_stage'] = r3
    if not r3['town']: bad.append('màn Boss chương 24 mất khu')
    bs = pg.evaluate("""async()=>{const d=__dv,g=d.G(),P=g.p,st=DV_DATA.getStage(23,6);g.t=st.bossAt-.1;P.x=0;P.y=-12*64;
      for(let k=0;k<70;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}
      for(let k=0;k<6;k++)d.draw();const E=d.ENV.state();return {boss:!!g.boss,arena:d.ENV.arenaOn()}}""")
    out['boss_arena'] = bs
    if SHOTS: pg.locator('#cv').screenshot(path=f'{SHOTS}/m_boss_arena.png')
    out['jsErrors'] = errs[:8]
    if errs: bad.append('lỗi JS/console: %d' % len(errs))
    out['nbad'] = len(bad); out['bad'] = bad
    print(json.dumps(out, ensure_ascii=False, indent=1))
    b.close()
