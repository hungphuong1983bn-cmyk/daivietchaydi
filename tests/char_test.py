"""Kiểm thử Phase 7 (Character). Cần Playwright.
   python3 tests/char_test.py              → toàn bộ kiểm tra
   python3 tests/char_test.py shots DIR    → thêm ảnh: bảng tiến hoá, bảng animation, hồ sơ, trong trận
Kiểm tra:
  1. Dữ liệu hợp lệ (DV_DATA.charValidate) + khớp HEROES (hp/công/tốc/bạo kích)
  2. HỒI QUY: bon() của mọi tướng chưa Thức Tỉnh/Thăng Giai == bon() của bản trước Phase 7 (index cũ), dr=0, as=1, rg=420
  3. Vẽ 7 tướng × 8 trạng thái × (gốc, TT3, TG5, MAX) × 3 mức đồ hoạ không lỗi
  4. Màn Hồ sơ: mở, đổi trạng thái/bậc xem trước, nâng Thức Tỉnh/Thăng Giai trừ đúng tài nguyên, chỉ số tăng, MAX
  5. Trong trận: mọi tướng chạy đủ trạng thái, Thức Tỉnh/Thăng Giai ảnh hưởng đúng (HP, phòng thủ, tốc đánh, tầm)
  6. Lỗi JS: 0
"""
import os, sys, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
SHOTS = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == 'shots' else None
if SHOTS: os.makedirs(SHOTS, exist_ok=True)
NEW = 'file://' + ROOT + '/index.html?debug'
OLD_SRC = os.path.join(os.path.dirname(__file__), 'fixtures', 'index_phase6.html')
OLD = 'file://' + ROOT + '/_old_phase6.html?debug'
fails = []
def check(ok, msg):
    print(('  ✓ ' if ok else '  ✗ ') + msg)
    if not ok: fails.append(msg)

BON = "(id)=>{__dv.sv().hs=id; __dv.sv().hu[id]=1; const b=__dv.bon(); return {hp:b.hp,am:+b.am.toFixed(6),sp:+b.sp.toFixed(6),cr:+b.cr.toFixed(6),dg:b.dg,cm:b.cm,dr:b.dr||0,as:b.as||1,rg:b.rg||420}}"

with sync_playwright() as p:
    br = p.chromium.launch()
    errs = []
    def newpage(url):
        pg = br.new_page(viewport={'width': 420, 'height': 800})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.goto(url); pg.wait_for_timeout(500); return pg
    pg = newpage(NEW)

    print('1. Dữ liệu')
    v = pg.evaluate("DV_DATA.charValidate()")
    check(v == [], 'charValidate rỗng ' + str(v))
    ids = pg.evaluate("DV_CHAR.all().map(c=>c.id)")
    check(len(ids) == 7, '7 nhân vật có dữ liệu: ' + ','.join(ids))
    mis = pg.evaluate("""()=>{const o=[];const R=DV_DATA.charRules;DV_CHAR.all().forEach(c=>{const h=__dv.HEROES().find(x=>x.id===c.id);if(!h){o.push(c.id+': thiếu trong HEROES');return}
      const e=(a,b)=>Math.abs(a-b)<1e-6;if(!e(c.stats.hp-R.base.hp,h.hp))o.push(c.id+' hp');if(!e(c.stats.attack/100-1,h.am))o.push(c.id+' atk');if(!e(c.stats.speed/130-1,h.sp))o.push(c.id+' spd');if(!e(c.stats.crit,h.cr))o.push(c.id+' crit');if(c.rarity!==h.q)o.push(c.id+' rarity')});return o}""")
    check(mis == [], 'chỉ số dữ liệu khớp HEROES ' + str(mis))
    ui_hard = pg.evaluate("""()=>{const src=DV_CHAR.open.toString()+DV_CHAR.stats.toString();return /hp:\\s*\\d{2,}/.test(src)}""")
    check(not ui_hard, 'engine không chứa chỉ số cứng')

    print('2. Hồi quy so với bản Phase 6')
    if os.path.exists(OLD_SRC):
        shutil.copy(OLD_SRC, os.path.join(ROOT, '_old_phase6.html'))
        try:
            po = newpage(OLD)
            for i in ids:
                a, b = po.evaluate(BON, i), pg.evaluate(BON, i)
                check(a['hp'] == b['hp'] and a['am'] == b['am'] and a['sp'] == b['sp'] and a['cr'] == b['cr'] and a['dg'] == b['dg'] and a['cm'] == b['cm'], f'bon({i}) giống bản cũ {a["hp"]}/{a["am"]}')
                check(b['dr'] == 0 and b['as'] == 1 and b['rg'] == 420, f'  {i}: dr=0, as=1, rg=420 khi chưa tiến hoá')
            po.close()
        finally:
            os.remove(os.path.join(ROOT, '_old_phase6.html'))
    else:
        print('  (bỏ qua: thiếu tests/fixtures/index_phase6.html)')

    print('3. Vẽ mọi tổ hợp')
    r = pg.evaluate("""()=>{let n=0,bad=[];const cv=document.createElement('canvas');cv.width=300;cv.height=300;const x=cv.getContext('2d');
      for(const c of DV_CHAR.all())for(const st of DV_CHAR.STATES)for(const v of [[0,0,0],[3,0,0],[3,5,0],[3,5,1],[1,2,0]])for(const q of [0,1,2])for(const f of [1,-1]){
        try{DV_CHAR.draw(x,c.id,{x:150,y:200,scale:2,f,t:3.3,state:st,st:.2,aw:v[0],asc:v[1],max:!!v[2],q});n++}catch(e){bad.push(c.id+' '+st+' '+v+' '+e.message)}}
      return {n,bad:bad.slice(0,5)}}""")
    check(not r['bad'] and r['n'] == 7 * 8 * 5 * 3 * 2, f"{r['n']} lần vẽ, lỗi: {r['bad']}")
    t = pg.evaluate("""()=>{const cv=document.createElement('canvas');cv.width=300;cv.height=300;const x=cv.getContext('2d');const t0=performance.now();for(let i=0;i<600;i++)DV_CHAR.draw(x,'ltk',{x:150,y:200,scale:1,f:1,t:i/60,state:'attack',st:(i%15)/60,aw:3,asc:5,max:1,q:2});return (performance.now()-t0)/600}""")
    check(t < 2.0, f'chi phí vẽ 1 nhân vật MAX (q cao): {t:.2f} ms/khung')

    print('4. Màn Hồ sơ & nâng cấp')
    pg.evaluate("""()=>{const s=__dv.sv();s.hon=1000;s.gold=1000000;s.mt=5000;DV_CHAR.all().forEach(c=>{s.hu[c.id]=1});s.hx.dbl={l:20,e:0,s:0};s.hs='dbl';__dv.put()}""")
    pg.evaluate("__dv.renderHero()"); pg.wait_for_timeout(200)
    check(pg.locator('[data-chopen="dbl"]').count() == 1, 'nút Hồ sơ hiện trong danh sách Tướng')
    pg.locator('[data-chopen="dbl"]').click(); pg.wait_for_timeout(400)
    check(pg.locator('#chcv').count() == 1, 'canvas xem trước hiện')
    hp0 = pg.evaluate("DV_CHAR.stats('dbl').hp"); at0 = pg.evaluate("DV_CHAR.stats('dbl').attack")
    for s in ['move', 'attack', 'skill', 'ultimate', 'hit', 'defeat', 'victory', 'idle']:
        pg.locator(f'[data-chst="{s}"]').click(); pg.wait_for_timeout(60)
    check(True, 'bấm đủ 8 trạng thái animation')
    pg.locator('[data-chaw="3"]').click(); pg.wait_for_timeout(150)
    check('xem trước' in pg.inner_text('#mb'), 'xem trước bậc chưa mở có nhãn "xem trước"')
    check(pg.evaluate("DV_CHAR.prog('dbl').aw") == 0, 'xem trước không làm đổi tiến độ thật')
    pg.locator('[data-chaw="0"]').click(); pg.wait_for_timeout(100)
    hon0 = pg.evaluate("__dv.sv().hon"); gold0 = pg.evaluate("__dv.sv().gold")
    pg.locator('[data-chup="aw"]').click(); pg.wait_for_timeout(200)
    P = pg.evaluate("DV_CHAR.prog('dbl')"); cost = pg.evaluate("DV_DATA.charById.dbl.awakening[0].cost")
    check(P['aw'] == 1, 'Thức Tỉnh 1 thành công')
    check(pg.evaluate("__dv.sv().hon") == hon0 - cost['hon'] and pg.evaluate("__dv.sv().gold") == gold0 - cost['gold'], 'trừ đúng Hồn tướng/Vàng')
    check(pg.evaluate("DV_CHAR.stats('dbl').hp") > hp0 and pg.evaluate("DV_CHAR.stats('dbl').attack") > at0, 'Thức Tỉnh tăng HP/Công')
    pg.locator('[data-chup="aw"]').click(); pg.wait_for_timeout(100)
    check(pg.evaluate("DV_CHAR.prog('dbl').aw") == 1, 'Thức Tỉnh 2 bị chặn khi tướng chưa đủ Lv.30')
    pg.evaluate("__dv.sv().hx.dbl.l=50"); pg.evaluate("DV_CHAR.open('dbl')"); pg.wait_for_timeout(100)
    for _ in range(2): pg.locator('[data-chup="aw"]').click(); pg.wait_for_timeout(100)
    for _ in range(5): pg.locator('[data-chup="asc"]').click(); pg.wait_for_timeout(100)
    P = pg.evaluate("DV_CHAR.prog('dbl')")
    check(P['aw'] == 3 and P['asc'] == 5, f"đủ Thức Tỉnh 3 + Thăng Giai 5: {P}")
    cap = pg.evaluate("__dv.PG.heroCap(0)"); pg.evaluate(f"__dv.sv().hx.dbl.l={cap}")
    check(pg.evaluate("DV_CHAR.isMax('dbl')") is True, 'đạt trạng thái MAX')
    if SHOTS:
        pg.evaluate("DV_CHAR.open('dbl')"); pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(SHOTS, 'profile_max.png'))
        pg.evaluate("DV_CHAR.open('thd')"); pg.wait_for_timeout(500); pg.locator('[data-chst="ultimate"]').click(); pg.wait_for_timeout(450); pg.screenshot(path=os.path.join(SHOTS, 'profile_thd_ult.png'))

    print('5. Trong trận')
    for i in ids:
        o = pg.evaluate("""(id)=>{const s=__dv.sv();s.hs=id;s.hu[id]=1;s.hx[id]=s.hx[id]||{l:1,e:0};__dv.begin(0,1);__dv.run(false);const G=__dv.G(),P=G.p,seen={};
          const rec=()=>{const cs=G.chp&&G.chp.cs;if(cs)seen[cs.s]=1};
          for(let k=0;k<60;k++){P.hp=P.mhp;__dv.upd(.05);if(G.paused){const b=document.querySelector('#cards .card');if(b)__dv.pick(b.dataset.k);else G.paused=false}__dv.draw();rec()}
          P.atk=.2;__dv.draw();rec();P.skc=.5;__dv.draw();rec();P.inv=.4;__dv.draw();rec();G.ul=.7;__dv.draw();rec();P.inv=0;G.ul=0;P.moving=1;__dv.draw();rec();
          G.ending=1;G.win=1;G.endT=.9;__dv.draw();rec();G.win=0;__dv.draw();rec();
          return {chp:!!G.chp,seen:Object.keys(seen),dr:G.dr,as:G.as,rg:G.rg,mhp:P.mhp}}""", i)
        check(o['chp'] and len(o['seen']) >= 6, f"{i}: trạng thái đã dùng {o['seen']}")
    # tiến hoá ảnh hưởng trận
    base = pg.evaluate("""()=>{const s=__dv.sv();s.hs='dbl';s.hx.dbl={l:30,e:0,s:0};__dv.begin(0,1);__dv.run(false);const G=__dv.G();return {mhp:G.p.mhp,am:G.am,dr:G.dr,as:G.as,rg:G.rg,spd:G.p.spd}}""")
    pg.evaluate("()=>{const s=__dv.sv();s.hx.dbl.aw=3;s.hx.dbl.asc=5}")
    ev = pg.evaluate("""()=>{__dv.begin(0,1);__dv.run(false);const G=__dv.G();return {mhp:G.p.mhp,am:G.am,dr:G.dr,as:G.as,rg:G.rg,spd:G.p.spd,chp:G.chp}}""")
    check(ev['mhp'] > base['mhp'] and ev['am'] > base['am'], f"Thức Tỉnh/Thăng Giai tăng HP {base['mhp']}→{ev['mhp']}, Công ×{base['am']:.2f}→×{ev['am']:.2f}")
    check(ev['dr'] > 0 and ev['as'] > 1 and ev['rg'] > 420 and ev['spd'] > base['spd'], f"phòng thủ {ev['dr']:.3f}, tốc đánh ×{ev['as']:.2f}, tầm {ev['rg']}, tốc {ev['spd']:.1f}")
    check(ev['chp']['asc'] == 5 and ev['chp']['aw'] == 3, 'G.chp mang đúng bậc tiến hoá vào hình vẽ trong trận')
    if SHOTS:
        for i in ['lh', 'thd', 'ltk']:
            pg.evaluate("""(id)=>{const s=__dv.sv();s.hs=id;s.hx[id]=s.hx[id]||{l:1,e:0};Object.assign(s.hx[id],{l:60,aw:3,asc:5});__dv.begin(4,1);__dv.run(false);const G=__dv.G(),P=G.p;for(let k=0;k<40;k++){P.hp=P.mhp;__dv.upd(.05);if(G.paused){const b=document.querySelector('#cards .card');if(b)__dv.pick(b.dataset.k);else G.paused=false}}P.atk=.15;__dv.draw()}""", i)
            pg.wait_for_timeout(100); pg.locator('#cv').screenshot(path=os.path.join(SHOTS, f'ingame_{i}.png'))
    print('6. Lỗi JS')
    check(not errs, f'0 lỗi JS ({errs[:3]})')
    br.close()
print('\nKẾT QUẢ:', 'ĐẠT' if not fails else f'{len(fails)} LỖI'); sys.exit(1 if fails else 0)
