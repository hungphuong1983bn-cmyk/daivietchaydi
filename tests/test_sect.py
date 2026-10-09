"""Phase 12 · Part 6 — kiểm thử CẢNH GIỚI (10 bậc) + MÔN PHÁI (cần Playwright)."""
import os, json, subprocess
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PAGE = 'file://' + os.path.join(ROOT, 'index.html') + '?debug'
ok = True
def chk(n, c, i=''):
    global ok; ok &= bool(c); print(('PASS' if c else 'FAIL'), '-', n, i, flush=True)

# ───── A. Dữ liệu thuần (node) ─────
v = subprocess.run(['node', '-e', "const S=require('./tests/load_sect.js');console.log(JSON.stringify({v:S.validate(),n:S.realms.length,sects:S.sects.length,b9:S.realmBonus(9),r9:S.realmRun(9),b0:S.realmBonus(0),bc:S.breakCheck(0,{lv:5,un:0,gold:1500,mt:5,hon:0}),bn:S.breakCheck(0,{lv:4,un:0,gold:1500,mt:5,hon:0}),mx:S.breakCheck(9,{}),lv:[0,49,50,2499,2500,99999].map(S.level),aff:S.isAff('tayson','dbl'),nf:S.isAff('tayson','lh')}))"], cwd=ROOT, capture_output=True, text=True)
D = json.loads(v.stdout) if v.returncode == 0 else {}
chk('A1 validate() ok', D.get('v') == 'ok', str(D.get('v')))
chk('A2 đúng 10 cảnh giới + 5 môn phái', D.get('n') == 10 and D.get('sects') == 5)
chk('A3 Phàm Nhân không có bonus; Độ Kiếp cộng dồn đủ', D['b0'] == {} and abs(D['b9']['am'] - .30) < 1e-9 and D['b9']['hp'] == 260 and 'dr' in D['r9'] and 'ec' in D['r9'])
chk('A4 breakCheck: đủ điều kiện / thiếu cấp / đã tối đa', D['bc']['ok'] and not D['bn']['ok'] and D['bn']['miss'] == ['Cấp tướng 5'] and D['mx']['max'])
chk('A5 cấp môn phái theo ngưỡng Cống Hiến', D['lv'] == [1, 1, 2, 9, 10, 10], str(D['lv']))
chk('A6 hợp phái đúng tướng', D['aff'] and not D['nf'])

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 420, 'height': 860}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(1200)
    pg.evaluate("()=>{if(window.DV_HOME)DV_HOME.loading=(c,n,h,cb)=>cb()}")
    S = lambda js, *a: pg.evaluate(js, *a)

    # ───── B. Save mặc định / migrate ─────
    sv = S("()=>{const s=__dv.sv();return {cg:s.cg,sc:s.sc,v:s.v}}")
    chk('B1 save có cg {} và sc mặc định; sv.v vẫn 4', sv['cg'] == {} and sv['sc']['id'] == '' and sv['v'] == 4, str(sv))
    S("()=>{const s=__dv.sv();delete s.cg;delete s.sc;__dv.put()}"); pg.reload(); pg.wait_for_timeout(1200)
    sv = S("()=>{const s=__dv.sv();return {cg:s.cg,sc:s.sc}}")
    chk('B2 save cũ (thiếu cg/sc) tự bổ sung', sv['cg'] == {} and sv['sc']['p'] == {}, str(sv))
    pg.evaluate("()=>{if(window.DV_HOME)DV_HOME.loading=(c,n,h,cb)=>cb()}")

    # ───── C. Khoá theo chương ─────
    S("()=>{const s=__dv.sv();s.un=0;s.gold=0;s.gem=0;__dv.home()}")
    S("document.querySelector('[data-m=sect]').click()"); pg.wait_for_timeout(200)
    t = S("()=>document.querySelector('#hsc .pb').innerText")
    chk('C1 chưa mở chương 2 → môn phái bị khoá', 'chưa mở' in t, t[:60])
    S("DV_SECT.close()")

    # ───── D. Môn phái ─────
    S("()=>{const s=__dv.sv();s.un=2;s.gold=1000000;s.gem=500;s.hs='dbl';s.hu.dbl=1;__dv.home()}")
    b0 = S("__dv.bdg().sc"); chk('D1 đủ điều kiện, chưa gia nhập → chấm đỏ', b0 > 0, str(b0))
    S("document.querySelector('[data-m=sect]').click()"); pg.wait_for_timeout(200)
    cards = S("document.querySelectorAll('#hsc [data-a=join]').length"); chk('D2 hiện 5 môn phái để chọn', cards == 5, str(cards))
    pw0 = S("__dv.pwr()")
    S("document.querySelector('#hsc [data-a=join][data-id=tayson]').click()"); pg.wait_for_timeout(150)
    sc = S("()=>__dv.sv().sc"); chk('D3 gia nhập lần đầu miễn phí (💎 không đổi)', sc['id'] == 'tayson' and S("__dv.sv().gem") == 500)
    S("document.querySelector('#hsc [data-a=ci]').click()"); pg.wait_for_timeout(100)
    p1 = S("()=>__dv.sv().sc.p.tayson"); chk('D4 điểm danh +20 Cống Hiến', p1['t'] == 20 and p1['c'] == 20, str(p1))
    S("document.querySelector('#hsc [data-a=ci]').click()"); p1 = S("()=>__dv.sv().sc.p.tayson"); chk('D5 điểm danh lần 2 trong ngày không cộng', p1['t'] == 20)
    S("document.querySelector('#hsc [data-a=dn]').click()"); p1 = S("()=>__dv.sv().sc.p.tayson")
    chk('D6 quyên góp: -2000 🪙 +10 Cống Hiến', p1['t'] == 30 and S("__dv.sv().gold") == 998000, str(p1))
    for _ in range(12): S("document.querySelector('#hsc [data-a=dn]').click()")
    chk('D7 quyên góp tối đa 10 lượt/ngày', S("__dv.sv().sc.dn") == 10 and S("__dv.sv().sc.p.tayson.t") == 120)
    # nhiệm vụ ngày
    S("()=>{const s=__dv.sv();s.qd.D.games=0;s.qd.D.wins=0;s.qd.D.kills=0}"); S("DV_SECT.refresh()")
    S("document.querySelector('#hsc [data-a=tk][data-i=\"0\"]').click()"); chk('D8 nhiệm vụ chưa xong → không nhận được', S("__dv.sv().sc.cl[0]") is None)
    S("()=>{const s=__dv.sv();s.qd.D.games=3}"); S("DV_SECT.refresh()")
    S("document.querySelector('#hsc [data-a=tk][data-i=\"0\"]').click()"); chk('D9 nhiệm vụ xong → +15 Cống Hiến, chỉ nhận 1 lần', S("__dv.sv().sc.p.tayson.t") == 135)
    S("document.querySelector('#hsc [data-a=tk][data-i=\"0\"]').click()"); chk('D10 không nhận đúp', S("__dv.sv().sc.p.tayson.t") == 135)
    # qua ngày → reset
    S("()=>{__dv.sv().sc.d='1999-01-01'}"); S("document.querySelector('#hsc [data-a=ci]').click()")
    chk('D11 sang ngày mới: điểm danh/quyên góp/nhiệm vụ được reset', S("__dv.sv().sc.dn") == 0 and S("__dv.sv().sc.ci") == 1 and S("__dv.sv().sc.cl") == {} and S("__dv.sv().sc.p.tayson.t") == 155)
    # cấp phái + Tuyệt Học
    S("()=>{const p=__dv.sv().sc.p.tayson;p.t=2500;p.c=2000}"); S("DV_SECT.refresh()")
    S("document.querySelector('#hsc [data-a=tab][data-t=skill]').click()"); pg.wait_for_timeout(100)
    S("document.querySelector('#hsc [data-a=lr][data-j=\"1\"]')") ; chk('D12 phải học tuần tự (tầng 2 chưa học được khi chưa học tầng 1)', S("document.querySelector('#hsc [data-a=lr][data-j=\"1\"]')") is None)
    am0 = S("__dv.bon().am"); cr0 = S("__dv.bon().cr")
    S("document.querySelector('#hsc [data-a=lr][data-j=\"0\"]').click()"); am1 = S("__dv.bon().am")
    chk('D13 học Tuyệt Học 1 → công tăng, trừ 60 Cống Hiến', am1 > am0 and S("__dv.sv().sc.p.tayson.c") == 1940, f'{am0:.3f}→{am1:.3f}')
    for j in (1, 2, 3): S("(j)=>{document.querySelector('#hsc [data-a=lr][data-j=\"'+j+'\"]').click()}", j)
    chk('D14 học đủ 4 Tuyệt Học', S("Object.keys(__dv.sv().sc.p.tayson.l).length") == 4 and S("__dv.sv().sc.p.tayson.c") == 2000 - 60 - 150 - 320 - 600)
    ba = S("__dv.bon()"); chk('D15 chỉ số đã cộng môn phái (am, cr, cm)', ba['am'] > am0 and ba['cr'] > cr0, json.dumps({k: round(v, 3) for k, v in ba.items() if k in ('am', 'cr', 'cm')}))
    chk('D16 lực chiến tăng sau gia nhập + học', S("__dv.pwr()") > pw0, f"{pw0}→{S('__dv.pwr()')}")
    # tướng hợp phái ×1.25
    S("()=>{const s=__dv.sv();s.hu.lh=1;s.hx.lh=s.hx.lh||{l:1,e:0};s.hu.ltk=1;s.hx.ltk=s.hx.ltk||{l:1,e:0}}")
    a_aff = S("()=>DV_DATA.sect.sectBonus(__dv.sv().sc,'ltk').am"); a_non = S("()=>DV_DATA.sect.sectBonus(__dv.sv().sc,'lh').am")
    chk('D17 tướng hợp phái nhận ×1.25', abs(a_aff / a_non - 1.25) < 1e-9, f'{a_aff:.4f} vs {a_non:.4f}')
    # đổi phái
    S("DV_SECT.refresh()"); S("document.querySelector('#hsc [data-a=tab][data-t=sect]').click()")
    S("document.querySelector('#hsc [data-a=join][data-id=tanvien]').click()")
    chk('D18 đổi phái tốn 💎50, tiến độ phái cũ được giữ', S("__dv.sv().sc.id") == 'tanvien' and S("__dv.sv().gem") == 450 and S("__dv.sv().sc.p.tayson.t") == 2500)
    S("()=>{__dv.sv().gem=10}"); S("document.querySelector('#hsc [data-a=join][data-id=bachac]').click()")
    chk('D19 thiếu 💎 → không đổi được', S("__dv.sv().sc.id") == 'tanvien' and S("__dv.sv().gem") == 10)
    S("document.querySelector('#hsc [data-a=join][data-id=tayson]')") ; S("()=>{__dv.sv().gem=100}"); S("document.querySelector('#hsc [data-a=join][data-id=tayson]').click()")
    chk('D20 quay lại phái cũ: Tuyệt Học còn nguyên', S("Object.keys(__dv.sv().sc.p.tayson.l).length") == 4)
    S("DV_SECT.close()")

    # ───── E. Cảnh giới ─────
    S("()=>{const s=__dv.sv();s.hs='dbl';s.sc.id='';s.gold=50000000;s.mt=5000;s.hon=1000;s.un=40;s.hx.dbl={l:60,e:0,s:5};__dv.home()}")
    bon0 = S("__dv.bon()"); pw0 = S("__dv.pwr()")
    S("DV_SECT.open('realm')"); pg.wait_for_timeout(200)
    t = S("()=>document.querySelector('#hsc .pb').innerText"); chk('E1 tab Cảnh Giới hiện Phàm Nhân + thang 10 bậc', 'Phàm Nhân' in t and 'Độ Kiếp' in t and S("document.querySelectorAll('#hsc .lad').length") == 10)
    S("document.querySelector('#hsc [data-a=bk]').click()"); pg.wait_for_timeout(150)
    chk('E2 đột phá → Luyện Thể, trừ 🪙 1500 và ⚙ 5', S("__dv.sv().cg.dbl") == 1 and S("__dv.sv().gold") == 50000000 - 1500 and S("__dv.sv().mt") == 4995)
    bon1 = S("__dv.bon()"); chk('E3 chỉ số tăng (sinh lực +30, công +2%)', bon1['hp'] - bon0['hp'] == 30 and abs(bon1['am'] - bon0['am'] - .02) < 1e-9, f"hp+{bon1['hp']-bon0['hp']} am+{bon1['am']-bon0['am']:.3f}")
    chk('E4 lực chiến tăng + hiện hiệu ứng ĐỘT PHÁ', S("__dv.pwr()") > pw0 and S("!!document.querySelector('#hsc .fl')"))
    for _ in range(8): S("()=>{const b=document.querySelector('#hsc [data-a=bk]');if(b)b.click()}")
    chk('E5 đột phá liên tiếp tới Độ Kiếp (bậc 9)', S("__dv.sv().cg.dbl") == 9)
    chk('E6 Độ Kiếp: không còn nút đột phá', S("!document.querySelector('#hsc [data-a=bk]')") and 'Độ Kiếp' in S("document.querySelector('#hsc .pb').innerText"))
    bon9 = S("__dv.bon()"); chk('E7 tổng Độ Kiếp: công +30%, sinh lực +260', abs(bon9['am'] - bon0['am'] - .30) < 1e-9 and bon9['hp'] - bon0['hp'] == 260)
    # thiếu điều kiện
    S("()=>{const s=__dv.sv();s.cg.dbl=3;s.hx.dbl={l:10,e:0,s:0}}"); S("DV_SECT.refresh()")
    S("document.querySelector('#hsc [data-a=bk]').click()"); chk('E8 thiếu cấp tướng → không đột phá được', S("__dv.sv().cg.dbl") == 3)
    S("()=>{const s=__dv.sv();s.hx.dbl={l:60,e:0,s:5};s.un=0}"); S("DV_SECT.refresh()")
    S("document.querySelector('#hsc [data-a=bk]').click()"); chk('E9 thiếu số chương đã mở → không đột phá được', S("__dv.sv().cg.dbl") == 3)
    S("()=>{const s=__dv.sv();s.un=40;s.gold=0}"); S("DV_SECT.refresh()"); mt_b = S("__dv.sv().mt")
    S("document.querySelector('#hsc [data-a=bk]').click()"); chk('E10 thiếu vàng → không đột phá và không trừ gì', S("__dv.sv().cg.dbl") == 3 and S("__dv.sv().mt") == mt_b and S("__dv.sv().gold") == 0)
    # cảnh giới riêng từng tướng
    S("()=>{const s=__dv.sv();s.gold=5e7;s.hu.lh=1;s.hx.lh={l:60,e:0,s:5};s.cg.lh=0;s.cg.dbl=2}"); S("DV_SECT.refresh()")
    S("document.querySelector('#hsc [data-a=hn]').click()")
    chk('E11 chuyển tướng ›: hiện cảnh giới riêng của tướng đó', S("__dv.sv().cg.lh") == 0 and S("__dv.sv().cg.dbl") == 2 and 'Phàm Nhân' in S("document.querySelector('#hsc .pb').innerText"))
    S("DV_SECT.close()")
    # hồ sơ + menu hiển thị
    S("()=>{const s=__dv.sv();s.hs='dbl';__dv.home()}"); pg.wait_for_timeout(3500)  # chờ hiệu ứng lên cấp của heroshow xong
    rec = S("DV_HERO.record('dbl')"); chk('E12 hồ sơ tướng có cg (và vẫn đủ 19 trường gốc)', rec['cg']['step'] == 2 and rec['cg']['name'] == 'Luyện Khí' and all(f in rec for f in S("DV_HERO.FIELDS")), json.dumps(rec['cg'], ensure_ascii=False))
    # heroshow chỉ vẽ lại bảng khi không có lớp phủ (thẻ mở khoá tướng/hiệu ứng lên cấp do test bơm dữ liệu) → lưu rồi nạp lại để có menu "sạch"
    S("__dv.put()"); pg.reload(); pg.wait_for_timeout(1500)
    chk('E13 Main Menu hiện tên Cảnh giới mới', 'Luyện Khí' in S("document.querySelector('#menu').innerText"), S("(document.querySelector('.rl')||{}).innerText"))
    pg.evaluate("()=>{if(window.DV_HOME)DV_HOME.loading=(c,n,h,cb)=>cb()}")
    S("()=>{const s=__dv.sv();s.gold=5e7;s.cg.dbl=2;s.hx.dbl={l:60,e:0,s:5};s.un=40;__dv.home()}")
    chk('E14 có thể đột phá → chấm đỏ nút Môn phái', S("__dv.bdg().sc") > 0)

    # ───── F. Hiệu ứng TRONG VÁN ─────
    def run_stage():
        S("()=>{const s=__dv.sv();s.sa=60;__dv.begin(0,1)}"); pg.wait_for_timeout(300)
        return S("()=>{const G=__dv.G();return {rgn:G.rgn||0,xg:G.xg||1,mg:G.mg||1,ec:G.ec||1,dr:G.dr||0,am:G.am}}")
    S("()=>{const s=__dv.sv();s.sc.id='';s.cg={};s.hs='dbl'}"); g0 = run_stage()
    chk('F1 chưa có cảnh giới/phái → G giữ mặc định', g0['rgn'] == 0 and g0['xg'] == 1 and g0['mg'] == 1 and g0['ec'] == 1)
    S("()=>{document.querySelector('#b-quit')&&document.querySelector('#b-quit').click()}")
    S("()=>{const s=__dv.sv();s.cg={dbl:9};s.sc.id='auco';s.sc.p.auco={t:2500,c:0,l:{0:1,1:1,2:1,3:1}};s.hs='dbl'}"); g1 = run_stage()
    chk('F2 Độ Kiếp + Âu Cơ → hồi máu, EXP, hút đồ, nạp tuyệt kỹ, giảm sát thương', g1['rgn'] > .006 and g1['xg'] > 1.2 and g1['mg'] > 1.5 and g1['ec'] > 1.1 and 0 < g1['dr'] <= .6, json.dumps({k: round(v, 3) for k, v in g1.items()}))
    chk('F3 công trong ván tăng so với chưa tu luyện', g1['am'] > g0['am'], f"{g0['am']:.2f}→{g1['am']:.2f}")
    # chạy vài giây không lỗi, máu hồi
    hp = S("()=>{const G=__dv.G(),P=G.p;P.hp=P.mhp*.5;__dv.run(false);for(let i=0;i<50;i++)__dv.upd(.04);return [P.hp/P.mhp,P.mhp]}")
    chk('F4 hồi máu hoạt động trong ván (50% → >50%)', hp[0] > .5 + 0.005, f'{hp[0]:.3f}')
    S("()=>{document.querySelector('#b-quit')&&document.querySelector('#b-quit').click()}")

    chk('Z Không lỗi JS', not errs, str(errs[:2]))
    b.close()
print('ALL PASS' if ok else 'CÓ LỖI')
raise SystemExit(0 if ok else 1)
