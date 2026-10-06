import os, sys, json, time
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright

BOT = r"""
async (o) => {
  const d = __dv, c0 = o.c - 1, i = o.i, DT = o.dt || 0.04, god = o.mode === 'god';
  const sv = d.sv();
  const D = DV_DATA, st = D.getStage(c0, i), ch = D.getChapter(c0);
  // ---- gắn trang bị để lực chiến ≈ lực chiến khuyến nghị của màn ----
  const want = Math.round(st.recommendedPower * (o.powMul || 1));
  const setG = (r, l) => { for (const k in sv.eqp) { const it = sv.inv.find(x => x.u === sv.eqp[k]); it.r = r; it.l = l; } };
  let done = false;
  for (let r = 0; r < 4 && !done; r++) for (let l = 1; l <= 80; l++) { setG(r, l); if (d.pwr() >= want) { done = true; break; } }
  const myPow = d.pwr();
  d.begin(c0, i); d.run(false);
  let G = d.G(); G.dbg = {}; const P = G.p, inp = d.inp();
  const out = { stageId: st.stageId, role: st.role, dur: st.duration, bossAt: st.bossAt, par: st.parTime, recPow: st.recommendedPower, myPow,
    waveSeen: [], evFire: {}, hpMin: 1, dmgTaken: 0, dmgPerMin: [], aliveMax: 0, aliveAvg: 0, elitesSeen: 0, minisSeen: 0, bossSeen: 0, abil: {}, steps: 0 };
  const seenEl = new Set(), seenMini = new Set();
  let lastWi = 0, lastHp = P.hp, aliveSum = 0, minDmg = 0, nextMin = 60, wMark = { n: G.ps.n, t: 0, k: 0, o: 0 };
  const waveStats = []; let orbGen = 0;
  const t0 = performance.now();
  const lim = st.duration * 1.7 + 60;
  while (G.t < lim) {
    if (G.paused) {
      const cs = [...document.querySelectorAll('#cards .card')].map(x => x.dataset.k); let k = cs.find(x => x.startsWith('evo:'));
      if (!k) { const atk = ['kiem', 'loi', 'hang', 'phi']; const sc = x => atk.includes(x) ? 10 + (G.sk[x] || 0) * 2 - atk.indexOf(x) * .1 : x === 'ho' ? 3 : x === 'khinh' ? 2 : 0; k = cs.sort((a, c2) => sc(c2) - sc(a))[0]; }
      if (k) d.pick(k); else G.paused = false; continue; }
    // ---- bot di chuyển: né quái + đạn, hút orb ----
    let fx = 0, fy = 0, near = 1e9, boss = null;
    for (const e of G.en) { if (e.dead) continue; if (e.boss) boss = e; const dx = P.x - e.x, dy = P.y - e.y, q = dx * dx + dy * dy; if (q < 14400) { const w = 1 / (q + 400); fx += dx * w; fy += dy * w; } if (q < near) near = q; }
    for (const p of G.ep) { const rx = P.x - p.x, ry = P.y - p.y, v2 = p.vx * p.vx + p.vy * p.vy || 1; const tca = Math.max(0, (rx * p.vx + ry * p.vy) / v2);
      if (tca < 1.1) { const cx = rx - p.vx * tca, cy = ry - p.vy * tca, dm = Math.hypot(cx, cy); if (dm < 48) { const w = .9 / (tca + .25); fx += cx / (dm + 1) * w; fy += cy / (dm + 1) * w; } } }
    for (const z of G.tz) { const dx = P.x - z.x, dy = P.y - z.y, q = Math.hypot(dx, dy); if (q < z.r + 45) { fx += dx / (q + 1) * 3; fy += dy / (q + 1) * 3; } }
    let best = null, bd = 1e9; for (const ob of G.orb) { const q = (ob.x - P.x) ** 2 + (ob.y - P.y) ** 2; if (q < bd && q < 640000) { bd = q; best = ob; } }
    if (best) { const l = Math.sqrt(bd) + 1, w = near > 14400 ? .05 : .012; fx += (best.x - P.x) / l * w; fy += (best.y - P.y) / l * w; }
    if (boss) { const dx = boss.x - P.x, dy = boss.y - P.y, l = Math.hypot(dx, dy) + 1; if (l > 130) { fx += dx / l * .02; fy += dy / l * .02; } else { fx += -dy / l * .012; fy += dx / l * .012; } }
    fx += Math.cos(G.t * .31) * .004; fy += Math.sin(G.t * .27) * .004;
    const m = Math.hypot(fx, fy) || 1; inp.x = fx / m; inp.y = fy / m;
    const hp0 = P.hp;
    d.upd(DT); out.steps++;
    for (const ob of G.orb) { if (!ob._s) { ob._s = 1; if (ob.v) orbGen += ob.v; } }
    if (P.hp < hp0) { const dm = hp0 - P.hp; out.dmgTaken += dm; minDmg += dm; }
    if (god) P.hp = P.mhp;
    out.hpMin = Math.min(out.hpMin, P.hp / P.mhp);
    aliveSum += G.en.length; if (G.en.length > out.aliveMax) out.aliveMax = G.en.length;
    if (G.wi !== lastWi) {
      const cnt = G.ps.n - wMark.n; waveStats.push({ wi: lastWi, spawned: cnt, span: +(G.t - wMark.t).toFixed(1), kills: G.kills - wMark.k, orb: Math.round(orbGen - wMark.o), alive: G.en.length }); wMark = { n: G.ps.n, t: G.t, k: G.kills, o: orbGen };
      out.waveSeen.push({ wi: G.wi, t: +G.t.toFixed(2), exp: G.ws.waves[G.wi - 1].s, kind: G.ws.waves[G.wi - 1].k }); lastWi = G.wi;
    }
    for (const e of G.en) {
      if (e.dead) continue;
      if (e.el === 1 && !seenEl.has(e.id)) { seenEl.add(e.id); }
      if (e.mb && !seenMini.has(e.id)) seenMini.add(e.id);
      if (e.boss && !out.bossSeen) { out.bossSeen = +G.t.toFixed(2); out.dmAtBoss = G.dm || 0; out.bossHp = Math.round(e.mhp); out.bossMech = (e.ab || []).map(a => a.k).filter((v, k, a) => a.indexOf(v) === k).join(','); }
    }
    for (const k in G.evd) { if (G.evd[k] && out.evFire[k] == null) out.evFire[k] = +G.t.toFixed(2); }
    if (G.t >= nextMin) { out.dmgPerMin.push(+(minDmg / P.mhp * 100).toFixed(0)); minDmg = 0; nextMin += 60; }
    if (document.querySelector('#end').classList.contains('on')) break;
    if (G.ending && G.endT <= 0) break;
  }
  out.ms = Math.round(performance.now() - t0); out.aliveAvg = Math.round(aliveSum / Math.max(1, out.steps));
  out.elitesSeen = seenEl.size; out.minisSeen = seenMini.size; out.minisExpected = st.miniBoss.count;
  out.end = document.querySelector('#end').classList.contains('on');
  out.win = !!G.win; out.t = +G.t.toFixed(1); out.bkt = +(G.bkt || 0).toFixed(1); out.bat = +(G.bat || 0).toFixed(1);
  out.kills = G.kills; out.lv = P.lv; out.hits = G.hits; out.mh = +G.mh.toFixed(2); out.elk = G.elk; out.gk = G.gk;
  out.stageBits = o.mode === 'god' || G.win ? d.stageStars(true) : 0;
  out.orbGen = Math.round(orbGen); out.orbLeft = Math.round(G.orb.reduce((a, o) => a + (o.v || 0), 0)); out.bossDps = out.bkt && out.bossHp ? Math.round(out.bossHp / Math.max(1, out.bkt - out.bat)) : 0; out.src = G.dbg; out.pwrMax = P.mhp; out.dpsBoss = out.bkt ? Math.round(((G.dm||0) - (out.dmAtBoss||0)) / Math.max(1, out.bkt - out.bat)) : 0; out.dpsAll = Math.round((G.dm||0) / Math.max(1, G.t)); out.am = +G.am.toFixed(1); out.waveStats = waveStats;
  out.starCond = st.stars.map(s => s.desc);
  out.eventsExpected = st.events.filter(e => e.k !== 'boss').length; out.eventsFired = Object.keys(G.evd).length;
  return out;
}
"""

def run(c, i, mode='god', powMul=1, dt=0.04, port=8099):
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 420, 'height': 800})
        pg.set_default_timeout(0)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(PAGE)
        pg.wait_for_timeout(500)
        r = pg.evaluate(BOT, {'c': c, 'i': i, 'mode': mode, 'powMul': powMul, 'dt': dt})
        r['errors'] = errs
        b.close()
        return r

if __name__ == '__main__':
    c, i = int(sys.argv[1]), int(sys.argv[2]); mode = sys.argv[3] if len(sys.argv) > 3 else 'god'
    pm = float(sys.argv[4]) if len(sys.argv) > 4 else 1
    t = time.time(); r = run(c, i, mode, pm)
    r.pop('waveStats', None)
    print(json.dumps(r, ensure_ascii=False)); print('wall', round(time.time() - t, 1), 's')
