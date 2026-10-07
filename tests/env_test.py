"""Kiểm thử Phase 6 (Map & Môi trường). Cần Playwright.
   python3 tests/env_test.py            → kiểm tra logic 52 khu × (màn thường + màn Boss) + lỗi JS
   python3 tests/env_test.py shots DIR  → chụp ảnh canvas từng khu (thường + đấu trường Boss) vào DIR
"""
import os, sys, json
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
SHOTS = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == 'shots' else None
AREAS = [int(x) - 1 for x in sys.argv[3].split(',')] if SHOTS and len(sys.argv) > 3 else list(range(52))

JS_STEP = r"""
(args) => {
  const [c, i, mode] = args, d = __dv, G0 = (d.begin(c, i), d.run(false), d.G()), P = G0.p, EV = d.ENV, bad = [], info = {};
  const step = (sec) => { for (let k = 0; k < sec / .05; k++) { P.hp = P.mhp; d.upd(.05); if (G0.paused) { const b = document.querySelector('#cards .card'); if (b) d.pick(b.dataset.k); else G0.paused = false } } };
  step(2);
  const E = EV.state();
  if (!E) bad.push('EV.state null');
  info.tod = E.todK; info.w = E.wk; info.hz = E.hk; info.zones = E.zl.map(z => z[0]).join('+');
  // thử mọi nhánh vẽ
  d.draw();
  if (mode === 'hazard' && E.hk) {                       // ép hazard xuất hiện & nổ
    G0.t = 12; P.hp = P.mhp; let seen = 0;
    for (let k = 0; k < 400; k++) { P.hp = P.mhp; d.upd(.05); if (E.hz.length || E.fx.length || E.gu) seen++; if (k % 20 === 0) d.draw() }
    info.hazardSeen = seen; if (!seen) bad.push('hazard ' + E.hk + ' không xuất hiện');
  }
  if (mode === 'boss') {
    const st = DV_DATA.getStage(c, i); G0.t = st.bossAt - .1; step(1.5);
    const bs = G0.en.find(e => e.boss);
    if (!bs) bad.push('không có Boss');
    else {
      if (!E.arena) bad.push('đấu trường không mở');
      else {
        step(1.5);
        P.x = E.arena.x + 5000; P.y = E.arena.y; step(.1);            // đẩy người chơi ra xa → phải bị giữ trong vòng
        const dd = Math.hypot(P.x - E.arena.x, P.y - E.arena.y);
        info.arenaR = E.arena.R; info.inside = Math.round(dd);
        if (dd > E.arena.R) bad.push('người chơi thoát khỏi đấu trường: ' + Math.round(dd));
        P.x = E.arena.x; P.y = E.arena.y; step(1);
        for (let k = 0; k < 10; k++) d.draw();
        bs.hp = 0; G0.boss && (bs.dead = 1); G0.boss = null; step(2.5);
        info.arenaAfter = !!E.arena;
      }
    }
  }
  for (let k = 0; k < 5; k++) d.draw();
  document.querySelector('#end').classList.remove('on'); document.querySelector('#hud').classList.add('on');
  return { bad, info };
}
"""
JS_SHOT = r"""
(args) => {
  const [c, i, kind] = args, d = __dv, G0 = (d.begin(c, i), d.run(false), d.G()), P = G0.p, EV = d.ENV;
  const step = (sec) => { for (let k = 0; k < sec / .05; k++) { P.hp = P.mhp; d.upd(.05); if (G0.paused) { const b = document.querySelector('#cards .card'); if (b) d.pick(b.dataset.k); else G0.paused = false } } };
  document.querySelector('#hud').classList.add('on');
  P.x = 900 + c * 37; P.y = 700 + c * 23; // dịch ra khỏi vùng xuất phát để thấy địa hình
  if (kind === 'boss') { const st = DV_DATA.getStage(c, 6); G0.t = st.bossAt - .1; step(3.2) } else step(3);
  G0.fl.length = 0; d.draw(); return EV.state().A[8];
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(0)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
    pg.goto(PAGE); pg.wait_for_timeout(600)
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        for c in AREAS:
            for kind, i in (('n', 2), ('boss', 6)):
                pg.evaluate(JS_SHOT, [c, i, kind]); pg.locator('#cv').screenshot(path=f'{SHOTS}/a{c+1:02d}_{kind}.png')
        print('shots ->', SHOTS, 'errors:', errs[:5])
    else:
        bad = []; summary = []
        for c in range(52):
            for i, mode in ((2, 'hazard'), (6, 'boss')):
                try:
                    r = pg.evaluate(JS_STEP, [c, i, mode])
                    for x in r['bad']: bad.append(f'{c+1}-{i:02d}: {x}')
                    if i == 6: summary.append((c + 1, r['info']))
                except Exception as e:
                    bad.append(f'{c+1}-{i:02d}: EXC {str(e)[:160]}')
        print(json.dumps({'nbad': len(bad), 'bad': bad[:30], 'jsErrors': errs[:8], 'sample': summary[:3]}, ensure_ascii=False, indent=1))
    b.close()
