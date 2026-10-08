"""Kiểm thử Hero Showcase (Main Menu). Cần Playwright.
   python3 tests/showcase_test.py            → toàn bộ kiểm tra
   python3 tests/showcase_test.py shots DIR  → thêm ảnh chụp từng bước
Bám đúng danh sách kiểm thử trong yêu cầu:
  A→B đổi tướng · đổi trang bị → hình đổi · tăng cấp · tăng sao · đột phá · nâng Võ học · đổi diện mạo ·
  thoát/vào lại · mở khoá tướng · hoãn hiệu ứng khi có modal · chỉ số khớp trong trận · 0 lỗi JS
"""
import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
SHOTS = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == 'shots' else None
if SHOTS: os.makedirs(SHOTS, exist_ok=True)
URL = 'file://' + ROOT + '/index.html?debug'
fails = []
def check(ok, msg):
    print(('  ✓ ' if ok else '  ✗ ') + msg)
    if not ok: fails.append(msg)

# băm một khung vẽ tất định bằng chính DV_CHAR.draw (hàm Main Menu dùng) để biết "hình có đổi không"
HASH = """([id,opt])=>{const c=document.createElement('canvas');c.width=200;c.height=220;const g=c.getContext('2d');
 const p=DV_CHAR.prog(id);DV_CHAR.draw(g,id,Object.assign({x:100,y:200,scale:2,f:1,t:1,state:'idle',st:1,aw:p.aw,asc:p.asc,max:DV_CHAR.isMax(id,p),q:2},opt||{}));
 const d=g.getImageData(0,0,200,220).data;let h=0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]){n++;h=(h*31+d[i]*3+d[i+1]*5+d[i+2]*7)|0}}return [h,n]}"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 780}, device_scale_factor=2)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errs.append(m.text))  # ảnh it_n*/it_f* chưa có → emoji dự phòng (đã biết)
    def shot(n):
        if SHOTS: pg.screenshot(path=f'{SHOTS}/{n}.png')
    def S(): return pg.evaluate("()=>JSON.parse(localStorage.getItem('dvcd'))")
    def sv(js): return pg.evaluate("()=>{const s=__dv.sv();" + js + ";__dv.put()}")
    def txt(sel): return pg.evaluate("(q)=>{const e=document.querySelector(q);return e?e.innerText:''}", sel)
    def boot(): pg.goto(URL); pg.wait_for_timeout(900)

    print('1. Module đã nạp và nối dữ liệu')
    boot()
    check(pg.evaluate("()=>typeof DV_SHOW==='object'&&!!document.querySelector('#hhero canvas')"), 'DV_SHOW đã nạp, #hhero là canvas')
    check(pg.evaluate("()=>!document.querySelector('#hhero img')"), 'không còn <img> artwork cố định (hero.png) trong #hhero')

    print('2. Chọn Tướng A → Tướng B: hình, tên, chỉ số đổi theo')
    sv("for(const i of ['lh','nq','thd','dl','nb','ltk'])s.hu[i]=1"); boot()
    seen = {}
    for hid in ['dbl', 'lh', 'nq', 'thd', 'dl', 'nb', 'ltk']:
        sv(f"s.hs='{hid}'"); pg.wait_for_timeout(450)
        nm = txt('#hpn .r1 b'); hd = txt('#hn'); exp = pg.evaluate(f"()=>__dv.HEROES().find(h=>h.id=='{hid}').n"); cur = pg.evaluate("()=>DV_SHOW.cur().id")
        h, n = pg.evaluate(HASH, [hid, None]); seen[hid] = h
        check(nm == exp == hd and cur == hid and n > 500, f'{hid}: panel="{nm}" header="{hd}" cur={cur}, model {n}px')
    check(len(set(seen.values())) == 7, '7 tướng → 7 hình vẽ KHÁC NHAU (không dùng hình chung)')
    sv("s.hs='nq'"); pg.wait_for_timeout(500); shot('A_nq')
    sv("s.hs='lh'"); pg.wait_for_timeout(700); shot('B_lh')
    ok = pg.evaluate("()=>{const b=__dv.bon(),t=document.querySelector('#hpn .st').textContent.replace(/\\s/g,'');return t.includes('❤'+Math.round(100+b.hp))&&t.includes('⚔'+Math.round(100*b.am))}")
    check(ok, 'HP/Công trên panel = bon() (đúng số liệu chiến đấu, đã gồm trang bị)')

    print('3. Đổi trang bị → hình tướng đổi (không chỉ đổi icon)')
    sv("s.hs='dbl'"); pg.wait_for_timeout(600)
    h0, _ = pg.evaluate(HASH, ['dbl', None])
    sv("s.inv.push({u:'tleg',s:'w',r:3,n:'Kiếm Hoàng Long',l:1})"); pg.wait_for_timeout(700)
    card = pg.evaluate("()=>{const e=document.querySelector('#hgr');return e?e.querySelector('.rb').textContent+'|'+e.querySelector('h3').textContent:null}")
    check(card and 'HUYỀN THOẠI' in card and 'Kiếm Hoàng Long' in card, f'nhận trang bị Huyền Thoại → hiện thẻ phần thưởng: {card}'); shot('gear_card')
    pg.click('#hgr [data-g=eq]'); pg.wait_for_timeout(700)
    check(S()['eqp']['w'] == 'tleg' and not pg.evaluate("()=>!!document.querySelector('#hgr')"), 'MẶC NGAY → trang bị được mặc, thẻ đóng')
    h1, _ = pg.evaluate(HASH, ['dbl', None])
    sv("delete s.eqp.w"); pg.wait_for_timeout(700)
    h2, n2 = pg.evaluate(HASH, ['dbl', None])
    check(h0 != h1, 'mặc Vũ khí Huyền Thoại → hình tướng ĐỔI')
    check(h1 != h2 and n2 > 500, 'tháo vũ khí → hình đổi lại; tướng vẫn vẽ bình thường, không tự gắn vũ khí khác')
    pips = pg.evaluate("()=>[...document.querySelectorAll('#hpn .gp i')].map(i=>i.classList.contains('on'))")
    check(pips[0] is False and any(pips[1:]), f'ô trang bị trên panel đúng (vũ khí trống, còn lại có): {pips}')
    sv("s.eqp.w='tleg'"); pg.wait_for_timeout(500)
    check('Huyền Thoại' in pg.evaluate("()=>document.querySelector('#hpn .gp i').title"), 'ô vũ khí hiện đúng bậc Huyền Thoại')
    shot('equip_legendary')

    print('4. Tăng cấp: bảng chi tiết → animation → cập nhật → lưu')
    sv("s.gold=50000;s.hs='dbl';s.hx.dbl={l:1,e:0}"); pg.wait_for_timeout(500)
    pw0 = pg.evaluate("()=>+document.querySelector('#hpw').textContent.replace(/\\D/g,'')")
    pg.click('#hpn [data-a=lv]'); pg.wait_for_timeout(250)
    sh = txt('#hsh .bx')
    check(pg.evaluate("()=>document.querySelector('#hsh').classList.contains('on')"), 'bấm NÂNG CẤP → mở bảng chi tiết')
    for kw in ['Lv.1', 'Lv.2', 'EXP hiện tại 0', 'cần 600', 'Chi phí', 'Trước nâng', 'Sau nâng', 'Sinh lực', 'Công kích', 'Phòng thủ', 'Bạo kích', 'Tốc độ', 'Lực chiến']:
        check(kw in sh, f'bảng có "{kw}"')
    shot('lv_sheet')
    g0 = S()['gold']; pg.click('#hsh [data-a=lvok]'); pg.wait_for_timeout(300)
    s1 = S()
    check(s1['hx']['dbl']['l'] == 2 and s1['gold'] == g0 - 300, f"Lv.1→2, trừ đúng 300 vàng (còn {s1['gold']})")
    check('Lv.1/' in txt('#hpn .xp'), 'đang tích tụ năng lượng: số liệu panel CHƯA nhảy (giữ cảnh trước khi bùng)')
    shot('lv_charge'); pg.wait_for_timeout(600); shot('lv_burst')
    check('LEVEL UP!' in txt('#hfx') and pg.evaluate("()=>document.querySelector('#hfx').classList.contains('on')"), 'hiện "LEVEL UP!"')
    pg.wait_for_timeout(1500)
    check('Lv.2/' in txt('#hpn .xp'), 'sau animation: panel hiện Lv.2')
    check(pg.evaluate("()=>document.querySelectorAll('#hpn .up').length")>0, 'chỉ số tăng được làm nổi bật')
    pw1 = pg.evaluate("()=>+document.querySelector('#hpw').textContent.replace(/\\D/g,'')"); check(pw1 > pw0, f'Lực chiến tăng {pw0} → {pw1}')

    print('5. Tăng sao')
    sv("s.hx.dbl.s=1"); pg.wait_for_timeout(500); shot('star_charge')
    check('1 SAO' in txt('#hfx'), 'hiện "★ 1 SAO"')
    pg.wait_for_timeout(2200)
    check(pg.evaluate("()=>document.querySelectorAll('#hpn .sr i.on').length")==1, 'panel hiện đúng 1 sao sáng')
    check('Lv.2/35' in txt('#hpn .xp'), 'trần cấp mở rộng 30 → 35 theo ★ (dữ liệu game)')

    print('6. Đột phá cảnh giới (tên lấy từ dữ liệu)')
    sv("s.hx.dbl.l=15;s.hon=999;s.gold=999999;s.mt=999"); pg.wait_for_timeout(400)
    aw1 = pg.evaluate("()=>DV_DATA.charById.dbl.awakening[0].name")
    h_before, _ = pg.evaluate(HASH, ['dbl', None])
    pg.click('#hpn [data-a=bk]'); pg.wait_for_timeout(500)
    check(S()['hx']['dbl']['aw'] == 1, 'Thức Tỉnh 1 đã lưu')
    check(pg.evaluate("()=>document.querySelector('#hdim').classList.contains('on')"), 'màn hình tối đi (nền)')
    shot('realm_charge'); pg.wait_for_timeout(1400); shot('realm_array'); pg.wait_for_timeout(1300); shot('realm_burst')
    check('ĐỘT PHÁ!' in txt('#hfx') and aw1 in txt('#hfx'), f'hiện "ĐỘT PHÁ!" + cảnh giới mới từ dữ liệu: {aw1}')
    pg.wait_for_timeout(1800)
    check(aw1 in txt('#hpn .r3'), 'panel hiện cảnh giới mới')
    h_after, _ = pg.evaluate(HASH, ['dbl', None]); check(h_before != h_after, 'diện mạo tướng ĐỔI sau Thức Tỉnh')
    shot('realm_done')

    print('7. Nâng Võ học (skill)')
    sv("s.gold=99999"); pg.wait_for_timeout(300)
    pw0 = pg.evaluate("()=>__dv.pwr()")
    pg.click('#hpn [data-a=vh]'); pg.wait_for_timeout(250); shot('vh_sheet')
    sh = txt('#hsh .bx')
    check('Kiếm Pháp' in sh and 'Tầng 0' in sh and 'LC' in sh, 'bảng Võ học: icon/tầng cũ→mới/chỉ số/LC trước→sau')
    pg.click('#hsh [data-a=vhok]'); pg.wait_for_timeout(500)
    vh = S()['vh']; check(len([k for k in vh if vh[k]]) == 1, f'đã học 1 tầng: {vh}')
    pg.wait_for_timeout(500); shot('vh_fx')
    check('HỌC VÕ CÔNG' in txt('#hfx'), 'tầng đầu của một bộ võ → "HỌC VÕ CÔNG"')
    vf = pg.evaluate("()=>{const c=document.querySelector('#hfxs'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n}")
    check(vf > 200, f'lớp VFX toàn màn hình đang vẽ ({vf}px)')
    pg.wait_for_timeout(1800); pw1 = pg.evaluate("()=>__dv.pwr()"); check(pw1 > pw0, f'LC tăng thật {pw0} → {pw1}')
    pg.wait_for_timeout(1500)
    k0 = pg.evaluate("()=>Object.keys(__dv.sv().vh)[0]"); nxt = k0[:-1] + str(int(k0[-1]) + 1)
    sv(f"s.vh['{nxt}']=1"); pg.wait_for_timeout(600)
    check('SKILL UPGRADED' in txt('#hfx'), 'tầng sau của bộ đã học → "SKILL UPGRADED" (khác hiệu ứng học mới)')
    pg.wait_for_timeout(2300)

    print('8. Đổi diện mạo (skin)')
    check(pg.evaluate("()=>getComputedStyle(document.querySelector('#hskb')).display!=='none'"), 'nút Diện mạo hiện khi tướng có ≥ 2 diện mạo')
    hA, _ = pg.evaluate(HASH, ['dbl', None])
    pg.click('#hskb'); pg.wait_for_timeout(250); shot('skin_sheet')
    check('Dạng gốc' in txt('#hsh .bx') and aw1 in txt('#hsh .bx'), 'danh sách diện mạo đã mở đúng dữ liệu')
    pg.click('#hsh [data-a=skin][data-v="0"]'); pg.wait_for_timeout(300)
    check(S()['hx']['dbl'].get('skin') == 0, 'đã lưu diện mạo đã chọn')
    pg.click('#hsh [data-a=x]'); pg.wait_for_timeout(700)
    check(pg.evaluate("()=>{const c=DV_SHOW.cur();return c.form.aw===0&&c.p.aw===1}"), 'Main Menu vẽ diện mạo gốc, nhưng cấp/cảnh giới thật vẫn là Thức Tỉnh 1')
    hB, _ = pg.evaluate(HASH, ['dbl', {'aw': 0, 'asc': 0, 'max': False}]); check(hA != hB, 'hình đổi giữa 2 diện mạo'); shot('skin_base')
    sv("delete s.hx.dbl.skin")

    print('9. Thoát game → vào lại vẫn đúng tướng/trang bị')
    sv("s.hs='nq'"); boot()
    check(pg.evaluate("()=>DV_SHOW.cur().id")=='nq' and txt('#hpn .r1 b') == 'Ngô Quyền', 'vào lại: vẫn là Ngô Quyền')
    sv("s.hs='dbl'"); boot()
    check(pg.evaluate("()=>document.querySelector('#hpn .gp i').title.includes('Huyền Thoại')") and 'Lv.15' in txt('#hpn .xp'), 'vào lại: trang bị Huyền Thoại, Lv.15 được giữ')
    check(aw1 in txt('#hpn .r3'), 'vào lại: cảnh giới được giữ')

    print('10. Hiệu ứng được hoãn khi modal đang mở, phát khi đóng')
    sv("s.hs='dbl';s.gold=9999"); pg.wait_for_timeout(400)
    pg.click('[data-m=skill]'); pg.wait_for_timeout(300)
    l0 = S()['hx']['dbl']['l']; sv(f"s.hx.dbl.l={l0}+1"); pg.wait_for_timeout(800)
    check(not pg.evaluate("()=>document.querySelector('#hfx').classList.contains('on')"), 'modal mở: chưa phát hiệu ứng (không phát sau lưng modal)')
    pg.evaluate("()=>document.querySelector('#modal').classList.remove('on')"); pg.wait_for_timeout(500)
    check('LEVEL UP!' in txt('#hfx') and pg.evaluate("()=>document.querySelector('#hfx').classList.contains('on')"), 'đóng modal: hiệu ứng LEVEL UP phát ra')
    pg.wait_for_timeout(2500)

    print('11. Mở khoá tướng mới (Triệu hồi) — cinematic đúng tướng')
    boot(); sv("s.gem=5000;s.hu={dbl:1}"); pg.reload(); pg.wait_for_timeout(900)
    pg.click('.hcol [data-m=sum]'); pg.wait_for_timeout(300)
    pg.click('[data-sm="10"]'); pg.wait_for_timeout(2300)
    got = pg.evaluate("()=>{const e=document.querySelector('#hun');return e?{n:e.querySelector('h2').textContent,r:e.querySelector('.rt').textContent}:null}")
    check(got is not None, f'cinematic mở khoá xuất hiện: {got}')
    names = pg.evaluate("()=>__dv.HEROES().map(h=>h.n)")
    check(got and got['n'] in names, 'tên hiện ra là của một tướng thật trong dữ liệu')
    check(got and got['r'] in ['C', 'B', 'A', 'S', 'SS', 'SSR'], 'phẩm chất hiện đúng')
    pg.wait_for_timeout(1500); shot('unlock')
    for _ in range(6):
        if not pg.evaluate("()=>!!document.querySelector('#hun')"): break
        pg.click('#hun', force=True); pg.wait_for_timeout(2100)
    check(pg.evaluate("()=>!document.querySelector('#hun')"), 'chạm để qua từng tướng, kết thúc → vào bảng kết quả')
    check(pg.evaluate("()=>document.querySelectorAll('#sm .smk .ic canvas').length")>0, 'thẻ kết quả vẽ đúng model chibi của tướng (không phải emoji)')
    shot('summon_cards')
    pg.click('#smx'); pg.wait_for_timeout(400)
    check(len([k for k in S()['hu'] if S()['hu'][k]]) > 1, 'tướng mới đã được thêm vào danh sách sở hữu')

    print('12. Chỉ số panel khớp chỉ số TRONG TRẬN')
    boot(); sv("s.hs='thd';s.hu.thd=1"); pg.wait_for_timeout(500)
    ph = pg.evaluate("()=>{const t=document.querySelector('#hpn .st').textContent.replace(/\\s/g,'');return {hp:+t.match(/❤(\\d+)/)[1],atk:+t.match(/⚔(\\d+)/)[1],spd:+t.match(/👟(\\d+)/)[1]}}")
    pg.evaluate("()=>__dv.begin(0,1)"); pg.wait_for_timeout(1800)
    gm = pg.evaluate("()=>{const G=__dv.G();return {hp:Math.round(G.p.mhp),am:G.am,spd:Math.round(G.p.spd)}}")
    check(ph['hp'] == gm['hp'] and ph['atk'] == round(100 * gm['am']) and ph['spd'] == gm['spd'], f'panel {ph} == trận {gm}')

    print('13. Thẻ trang bị theo bậc; Thường không có thẻ')
    boot()
    sv("s.inv.push({u:'tcm',s:'h',r:0,n:'Ngọc Lam',l:1})"); pg.wait_for_timeout(700)
    check(not pg.evaluate("()=>!!document.querySelector('#hgr')"), 'trang bị Thường: KHÔNG hiện thẻ (tránh nhiễu)')
    for r, kw in [(1, 'HIẾM'), (2, 'SỬ THI')]:
        sv(f"s.inv.push({{u:'tr{r}',s:'a',r:{r},n:'Giáp Thử',l:1}})"); pg.wait_for_timeout(600)
        c = pg.evaluate("()=>{const e=document.querySelector('#hgr');return e?e.querySelector('.rb').textContent:null}")
        check(c == kw, f'bậc {r} → thẻ "{c}"'); shot(f'gear_r{r}'); pg.click('#hgr [data-g=x]'); pg.wait_for_timeout(300)
    sv("s.inv.push({u:'tm1',s:'r',r:1,n:'Nhẫn A',l:1},{u:'tm2',s:'f',r:2,n:'Giày B',l:1},{u:'tm3',s:'n',r:1,n:'Găng C',l:1})"); pg.wait_for_timeout(600)
    c = pg.evaluate("()=>{const e=document.querySelector('#hgr');return e?e.querySelector('h3').textContent+'|'+(e.querySelector('.mr')||{}).textContent:null}")
    check(c and 'Giày B' in c and '+ 2 trang bị' in c, f'nhận nhiều món cùng lúc → thẻ món tốt nhất + gộp phần còn lại: {c}'); pg.click('#hgr [data-g=x]'); pg.wait_for_timeout(300)

    print('14. Tướng mở khoá từ nguồn bất kỳ (không qua Triệu hồi) cũng có cinematic')
    nid = pg.evaluate("()=>__dv.HEROES().find(h=>!__dv.sv().hu[h.id]&&!h.off).id"); nnm = pg.evaluate(f"()=>__dv.HEROES().find(h=>h.id=='{nid}').n")
    sv(f"s.hu['{nid}']=1"); pg.wait_for_timeout(900)
    check(nnm in pg.evaluate("()=>{const e=document.querySelector('#hun');return e?e.querySelector('h2').textContent:''}"), f'cấp tướng {nnm} bằng code → cinematic {nnm} tự phát')
    pg.wait_for_timeout(2000); pg.click('#hun', force=True); pg.wait_for_timeout(500)
    check(pg.evaluate("()=>!document.querySelector('#hun')"), 'kết thúc, không lặp lại'); pg.wait_for_timeout(1500)
    check(pg.evaluate("()=>!document.querySelector('#hun')"), 'không phát lặp lần 2')

    print('15. Lỗi JS:', len(errs))
    check(not errs, 'không có lỗi JS' + (': ' + '; '.join(errs[:3]) if errs else ''))
    b.close()
print('\nKẾT QUẢ:', 'ĐẠT TẤT CẢ' if not fails else f'{len(fails)} LỖI'); [print('  ✗', f) for f in fails]
sys.exit(1 if fails else 0)
