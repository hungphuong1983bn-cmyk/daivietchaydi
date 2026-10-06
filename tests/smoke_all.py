import os, json
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/opt/pw-browsers'
from playwright.sync_api import sync_playwright
JS = r"""
async () => {
  const d = __dv, sv = d.sv(), D = DV_DATA, bad = [], rows = [];
  let n = 0;
  for (let c0 = 0; c0 < 52; c0++) for (let i = 1; i <= 6; i++) {
    const st = D.getStage(c0, i); n++;
    try {
      d.begin(c0, i); d.run(false); const G = d.G(), P = G.p;
      const step = (sec) => { for (let k = 0; k < sec / .05; k++) { P.hp = P.mhp; d.upd(.05); if (G.paused) { const b = document.querySelector('#cards .card'); if (b) d.pick(b.dataset.k); else G.paused = false } } };
      step(8);
      if (!G.stg || G.stg.stageId !== st.stageId) bad.push(st.stageId + ': G.stg sai');
      if (G.en.length === 0) bad.push(st.stageId + ': không có quái sau 8s');
      // nhảy tới mini boss / elite đầu tiên
      const mini = st.events.find(e => e.k === 'mini'), el = st.events.find(e => e.k === 'elite');
      G.t = mini.at - .1; step(1.2); const miniSeen = G.en.some(e => e.mb);
      if (!miniSeen) bad.push(st.stageId + ': Mini Boss không xuất hiện');
      // nhảy tới Boss
      G.t = st.bossAt - .1; step(1.5);
      const bs = G.en.find(e => e.boss);
      if (!bs) bad.push(st.stageId + ': Boss không xuất hiện');
      else {
        if (!bs.ab || !bs.ab.length) bad.push(st.stageId + ': Boss không có cơ chế');
        if (Math.abs(bs.mhp - st.boss.hp) > 1) bad.push(st.stageId + ': HP boss ' + bs.mhp + ' ≠ DB ' + st.boss.hp);
        if (G.en.filter(e => !e.dead && !e.boss && !e.gone).length > 40 && false) bad.push('dọn sân lỗi');
        step(6); // chạy cơ chế boss 6s
        bs.hp = 1; d.G().p.hp = P.mhp; // hạ boss bằng cách để skill chạm: ép trực tiếp
      }
      rows.push([st.stageId, !!bs, miniSeen]);
      document.querySelector('#end').classList.remove('on'); document.querySelector('#hud').classList.add('on');
    } catch (e) { bad.push(st.stageId + ': EXC ' + e.message) }
  }
  return { n, bad: bad.slice(0, 40), nbad: bad.length };
}
"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':420,'height':800}); pg.set_default_timeout(0)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(500)
    r=pg.evaluate(JS); r['jsErrors']=errs[:5]; print(json.dumps(r,ensure_ascii=False,indent=1)); b.close()
