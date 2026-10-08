"""Phase 12 · Part 1 — kiểm thử Ải Tinh Anh + Quét Ải (cần Playwright)."""
import os, json
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
from run_stage import BOT
ok = True
def chk(name, cond, info=''):
    global ok; ok &= bool(cond); print(('PASS' if cond else 'FAIL'), '-', name, info, flush=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(0)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(500)
    pg.add_script_tag(content="window.__bot=" + BOT)
    pg.evaluate("()=>{if(window.DV_HOME)DV_HOME.loading=(c,n,h,cb)=>cb()}")  # bỏ màn Loading để bot chạy đồng bộ
    snap = lambda: pg.evaluate("()=>{const s=__dv.sv();return {gold:s.gold,gem:s.gem,mt:s.mt,hon:s.hon||0,inv:s.inv.length,sa:s.sa,sr:JSON.stringify(s.sr),srh:JSON.stringify(s.srh),cl:Object.keys(s.cl).length,clh:JSON.stringify(s.clh),el:JSON.stringify(s.el),stars:__dv.starsTot(),un:s.un}}")
    # 1) chưa 3 sao → khoá
    pg.evaluate("__dv.sv().sa=60")
    chk('Khoá Tinh Anh/Quét khi chưa 3★', 'Đạt 3★' in pg.evaluate("__dv.modeBtns(0,1)"))
    pg.evaluate("__dv.goH('0-1')"); chk('goH bị chặn khi chưa 3★', pg.evaluate("!__dv.G()||!__dv.G().hard"))
    pg.evaluate("__dv.sweep('0-1-1-0')"); chk('Quét bị chặn khi chưa 3★', snap()['sa'] == 60)
    # 2) đạt 3 sao ở 1-1
    pg.evaluate("()=>{const s=__dv.sv();s.sr['0-1']=7;s.cl['0-1']=1;s.sa=60}")
    html = pg.evaluate("__dv.modeBtns(0,1)")
    chk('Hiện nút Tinh Anh + Quét khi 3★', 'ẢI TINH ANH' in html and 'QUÉT' in html and 'data-goh' in html and 'data-sw' in html)
    chk('Quét Tinh Anh khoá khi Tinh Anh chưa 3★', 'data-sw="0-1-1-1"' not in html)
    # 3) quét thường ×1 và ×3
    a = snap(); pg.evaluate("__dv.sweep('0-1-1-0')"); b1 = snap()
    chk('Quét ×1 tốn 5 thể lực', a['sa'] - b1['sa'] == 5, f"{a['sa']}→{b1['sa']}")
    chk('Quét ×1 nhận vàng/tinh thiết/hồn/trang bị', b1['gold'] > a['gold'] and b1['mt'] > a['mt'] and b1['hon'] > a['hon'] and b1['inv'] > a['inv'])
    chk('Quét không đổi tiến độ sao/mở khoá', a['sr'] == b1['sr'] and a['stars'] == b1['stars'] and a['un'] == b1['un'] and b1['gem'] == a['gem'])
    pg.evaluate("document.querySelector('#modal').classList.remove('on')")
    pg.evaluate("__dv.sweep('0-1-3-0')"); b3 = snap()
    chk('Quét ×3 tốn 15 thể lực', b1['sa'] - b3['sa'] == 15, f"{b1['sa']}→{b3['sa']}")
    pg.evaluate("__dv.sv().sa=10;__dv.sweep('0-1-5-0')")
    chk('Không đủ thể lực → không quét', snap()['sa'] == 10)
    pg.evaluate("document.querySelector('#modal').classList.remove('on')")
    # 4) chơi Tinh Anh thật bằng bot (bất tử)
    pg.evaluate("__dv.sv().sa=60")
    n0 = snap()
    r = pg.evaluate("o=>__bot(o)", {'c': 1, 'i': 1, 'mode': 'god', 'h': 1})
    n1 = snap()
    chk('Tinh Anh: G.hard bật + Boss HP gấp đôi', r['win'] and r['bossHp'] > 0, f"bossHp={r.get('bossHp')}")
    base = pg.evaluate("DV_DATA.getStage(0,1).boss.hp")
    chk('Boss HP Tinh Anh ≥ 2× màn thường', r['bossHp'] >= base * 1.9, f"{base}→{r['bossHp']}")
    chk('Tinh Anh tốn 10 thể lực', n0['sa'] - n1['sa'] in (10, 9, 11), f"{n0['sa']}→{n1['sa']}")
    chk('Sao Tinh Anh lưu RIÊNG (srh), sao thường không đổi', json.loads(n1['srh']).get('0-1', 0) > 0 and n1['sr'] == n0['sr'] and n1['stars'] == n0['stars'])
    chk('Tinh Anh không làm đổi clear/mở khoá thường', n1['cl'] == n0['cl'] and n1['un'] == n0['un'])
    chk('Đếm lượt/ngày: 1 lượt đã dùng', pg.evaluate("__dv.elLeft(0,1)") == 2)
    gem_first = n1['gem'] - n0['gem']
    chk('Lần đầu Tinh Anh nhận thưởng ngọc', gem_first > 0, f'+{gem_first} 💎')
    # 5) hết lượt
    pg.evaluate("()=>{const s=__dv.sv();s.sa=60;document.querySelector('#end').classList.remove('on')}")
    pg.evaluate("()=>{__dv.sv().el.n['0-1']=3}")
    chk('Hết 3 lượt → elLeft=0, nút Tinh Anh khoá', pg.evaluate("__dv.elLeft(0,1)") == 0 and 'data-goh' not in pg.evaluate("__dv.modeBtns(0,1)"))
    # 6) sang ngày mới → reset lượt
    pg.evaluate("()=>{__dv.sv().el.d='1999-01-01'}")
    chk('Qua ngày mới reset lượt', pg.evaluate("__dv.elLeft(0,1)") == 3)
    # 7) Quét Tinh Anh sau khi Tinh Anh 3★
    pg.evaluate("()=>{const s=__dv.sv();s.srh['0-1']=7;s.sa=60;s.el.n={}}")
    a = snap(); pg.evaluate("__dv.sweep('0-1-1-1')"); c1 = snap()
    chk('Quét Tinh Anh: tốn 10 thể lực + 1 lượt/ngày', a['sa'] - c1['sa'] == 10 and pg.evaluate("__dv.elLeft(0,1)") == 2)
    chk('Quét Tinh Anh thưởng > quét thường', (c1['gold'] - a['gold']) > pg.evaluate("DV_DATA.modes.sweepReward(DV_DATA.getStage(0,1),false).gold") * 1.4)
    # 8) save cũ (thiếu srh/clh/el) vẫn nạp được
    pg.evaluate("()=>{localStorage.setItem('dvcd',JSON.stringify({gold:5,un:0,v:3}))}")
    pg.reload(); pg.wait_for_timeout(500)
    chk('Save cũ nạp được + có khoá mới', pg.evaluate("()=>{const s=__dv.sv();return !!s.srh&&!!s.clh&&!!s.el}"))
    chk('Không có lỗi JS', not errs, str(errs[:2]))
    b.close()
print('ALL PASS' if ok else 'SOME FAIL')
