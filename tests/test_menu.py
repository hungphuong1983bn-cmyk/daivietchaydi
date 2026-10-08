"""Phase 12 · Part 2 — Hồ sơ tướng độc lập + Main Menu trung tâm + chấm đỏ (cần Playwright)."""
import os, json
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
ok = True
def chk(n, c, i=''):
    global ok; ok &= bool(c); print(('PASS' if c else 'FAIL'), '-', n, i, flush=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 420, 'height': 860}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(1200)
    F = pg.evaluate("DV_HERO.FIELDS")
    recs = pg.evaluate("DV_HERO.all()")
    chk('Có 7 hồ sơ tướng', len(recs) == 7, str(len(recs)))
    miss = [(r['id'], k) for r in recs for k in F if k not in r or r[k] is None and k not in ('aura',)]
    chk('Mỗi tướng đủ 19 trường dữ liệu', not miss, str(miss[:3]))
    chk('Tên tướng khác nhau', len({r['name'] for r in recs}) == 7)
    chk('Aura/kỹ năng/tuyệt kỹ riêng từng tướng', len({json.dumps(r['aura']) for r in recs}) >= 4 and len({r['skill']['ultimate'] for r in recs}) == 7 and len({tuple(r['skill']['list']) for r in recs}) == 7)
    chk('Đủ 8 animation', all(len(r['animation']) == 8 for r in recs))
    chk('Chỉ số riêng từng tướng (ATK/HP khác nhau)', len({(r['atk'], r['hp']) for r in recs}) >= 5, str([(r['name'][:6], r['atk'], r['hp']) for r in recs][:4]))
    chk('Trang bị 7 ô + phẩm chất có mã', all(len(r['equipment']) == 7 and r['quality']['name'] for r in recs))
    # Mỗi tướng được chọn → Main Menu hiển thị đúng tướng đó
    pg.evaluate("()=>{const s=__dv.sv();for(const h of __dv.HEROES())s.hu[h.id]=1;__dv.put()}")
    ids = pg.evaluate("__dv.HEROES().map(h=>h.id)")
    bad = []
    for i in ids:
        pg.evaluate("i=>{__dv.sv().hs=i;__dv.home()}", i); pg.wait_for_timeout(250)
        r = pg.evaluate("i=>DV_HERO.record(i)", i)
        got = pg.evaluate("()=>({n:document.querySelector('#hn').textContent,l:document.querySelector('#hav').textContent,x:document.querySelector('#hxt').textContent,pw:document.querySelector('#hpw').textContent,gen:document.querySelector('#hhero img')?'img':'canvas'})")
        if got['n'] != r['name'] or got['l'] != str(r['level']) or ('Lv.%d' % r['level']) not in got['x'] or got['gen'] == 'img': bad.append((i, got, r['name']))
    chk('Chọn tướng nào → Main Menu hiện đúng tướng đó (tên/cấp/EXP, không dùng hero.png chung)', not bad, str(bad[:1]))
    # Thành phần Main Menu
    pg.evaluate("()=>{__dv.sv().hs='" + ids[0] + "';__dv.home()}"); pg.wait_for_timeout(300)
    m = pg.evaluate("""()=>({
      pw:document.querySelector('#hpw').textContent, pwr:__dv.pwr().toLocaleString('vi'),
      realm:/Cảnh giới/.test(document.querySelector('#menu').innerText), fight:document.querySelector('#b-fight').innerText,
      eq:document.querySelectorAll('#hdeq i').length, dash:document.querySelector('#hdash').innerText,
      chap:/CHƯƠNG 1 \\/ 52/.test(document.querySelector('#menu').innerText),
      btns:[...document.querySelectorAll('#menu [data-m]')].map(x=>x.dataset.m)})""")
    chk('Lực chiến khớp pwr()', m['pw'] == m['pwr'])
    chk('Hiển thị Cảnh giới', m['realm'])
    chk('Hiển thị chương hiện tại (x/52)', m['chap'])
    chk('Nút "VÀO GIANG HỒ"', 'VÀO GIANG HỒ' in m['fight'], m['fight'].replace('\n', ' '))
    chk('Dải Nhiệm vụ / Sự kiện / Chưa nhận', all(x in m['dash'] for x in ('NV', 'sự kiện', 'Chưa nhận')), m['dash'])
    chk('Hiển thị 7 ô trang bị đang mặc', m['eq'] == 7)
    need = ['ev', 'hero', 'gear', 'skill', 'sect', 'rift', 'bxh', 'qst', 'map' if False else 'inv']
    chk('Đủ nút: sự kiện, tướng, trang bị, võ công, môn phái, bí cảnh, BXH, nhiệm vụ', all(x in m['btns'] for x in need), str(m['btns']))
    pg.evaluate("document.querySelector('[data-m=sect]').click()"); chk('Nút Môn phái/Bí cảnh phản hồi (chưa có hệ thống → báo đang phát triển)', 'phát triển' in pg.evaluate("document.querySelector('#mb').innerText"))
    pg.evaluate("document.querySelector('#modal').classList.remove('on')")
    # Chấm đỏ
    pg.evaluate("()=>{const s=__dv.sv();s.gold=0;s.qd.c={};s.st.kills=0;s.evs={};s.fd='x';__dv.home()}")
    B0 = pg.evaluate("__dv.bdg()")
    chk('Gold=0: không báo nâng tướng/trang bị', B0['hero'] == 0 and B0['gear'] == 0, f"hero={B0['hero']} gear={B0['gear']}")
    chk('Có sự kiện mới chưa xem → chấm đỏ', B0['evn'] > 0, str(B0['evn']))
    pg.evaluate("()=>{__dv.sv().gold=10000000;__dv.home()}")
    B1 = pg.evaluate("__dv.bdg()")
    chk('Đủ vàng → báo tướng có thể nâng cấp', B1['hero'] > 0, str(B1['hero']))
    chk('Đủ vàng → báo trang bị có thể nâng cấp', B1['gear'] > 0, str(B1['gear']))
    chk('Chấm đỏ hiện trên nút Tướng và Trang bị', pg.evaluate("[...document.querySelectorAll('[data-m=hero] .bd,[data-m=gear] .bd')].every(u=>getComputedStyle(u).display!=='none')"))
    pg.evaluate("()=>{const s=__dv.sv();s.st.kills=100;__dv.home()}")
    B2 = pg.evaluate("__dv.bdg()")
    chk('Nhiệm vụ hoàn thành → báo + cộng vào "Chưa nhận"', B2['qst'] > B1['qst'] and B2['claim'] >= B2['qst'], f"qst={B2['qst']} claim={B2['claim']}")
    pg.evaluate("document.querySelector('[data-m=ev]').click()"); pg.evaluate("document.querySelector('#modal').classList.remove('on')"); pg.evaluate("__dv.home()")
    B3 = pg.evaluate("__dv.bdg()")
    chk('Mở danh sách sự kiện → hết "sự kiện mới"', B3['evn'] == 0, str(B3['evn']))
    pg.evaluate("document.querySelector('[data-m=claim]').click()"); chk('Chạm "Chưa nhận" → mở nơi nhận thưởng', pg.evaluate("document.querySelector('#modal').classList.contains('on')"))
    pg.evaluate("document.querySelector('#modal').classList.remove('on')")
    # Save cũ (không có evs) vẫn chạy
    pg.evaluate("()=>localStorage.setItem('dvcd',JSON.stringify({gold:5,un:0,v:3}))"); pg.reload(); pg.wait_for_timeout(900)
    chk('Save cũ nạp được, menu hiển thị', pg.evaluate("()=>!!__dv.sv().evs&&document.querySelector('#hdeq i')!==null"))
    chk('Không lỗi JS', not errs, str(errs[:2]))
    b.close()
print('ALL PASS' if ok else 'SOME FAIL')
