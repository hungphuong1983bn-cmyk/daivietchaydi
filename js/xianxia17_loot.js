/* Phase 17 · Phần 5 — CỘT SÁNG RƠI ĐỒ (DV_XIAN17L) · "Cách A": cột sáng theo phẩm chất, đọc từ vật rơi có sẵn trên chiến trường.
 * Chỉ thêm lớp hình ảnh. KHÔNG đổi bảng rơi, tỉ lệ, số lượng, nhặt đồ, vàng/EXP/hồi máu, dữ liệu lưu (chỉ ĐỌC G.orb).
 * Gỡ: xoá thẻ <script src="js/xianxia17_loot.js"> hoặc DV_XIAN17L.enabled=false. (2 dòng begin/end trong index.html có `if(window.DV_XIAN17L)` nên để lại không lỗi.)
 *
 * Bậc cột sáng (suy ra từ chính vật rơi, không thêm dữ liệu vào game):
 *   Huyền Thoại  — viên EXP lớn của Boss (v >= 20)            · vàng kim, cao nhất, có vòng sóng khi xuất hiện
 *   Sử Thi       — bình hồi sinh (Tiểu Boss/suối/Tinh Anh)    · xanh ngọc
 *   Hiếm         — cụm vàng >= 8 đồng gần nhau (quái vàng…)   · vàng sáng, mờ dần khi nhặt bớt
 * Chất lượng: Thấp = chỉ Huyền Thoại, tối đa 2, không hạt · Vừa = + Sử Thi, tối đa 4, ít hạt · Cao = đủ 3 bậc, tối đa 10, hạt đầy đủ.
 * Khi nhặt: cột sáng thu lại + nổ hạt về phía người chơi (ghost, tối đa 6 cái cùng lúc).
 * Hiệu năng: mỗi bậc dựng sẵn 1 sprite cột + 1 sprite chân (không tạo gradient mỗi khung), hạt tính từ thời gian (không cấp phát), cắt vùng ngoài màn hình.
 */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2;
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = M.max(1, w | 0); c.height = M.max(1, h | 0); return c };

  const TIER = {
    L: { n: 'Huyền Thoại', p: 0, rgb: '255,196,70', core: '255,247,215', h: 230, w: 17, sp: 7, ring: 1 },
    E: { n: 'Sử Thi', p: 1, rgb: '80,255,170', core: '220,255,236', h: 140, w: 11, sp: 4, ring: 1 },
    R: { n: 'Hiếm', p: 2, rgb: '255,214,90', core: '255,249,222', h: 160, w: 13, sp: 4, ring: 0 }
  };
  const CAP = [2, 4, 10], SPARK_CAP = 40, GHOST_CAP = 6, CLUSTER_MIN = 8, CELL = 110;
  const ALLOW = [{ L: 1 }, { L: 1, E: 1 }, { L: 1, E: 1, R: 1 }];
  const SPK = [0, .55, 1];

  const S = { G: null, on: true, q: 2, rec: new WeakMap(), prev: [], cur: [], ghosts: [], cl: new Map(), cl2: new Map(), list: [], spr: {}, id: 0,
    stats: { beams: 0, ghosts: 0, orbs: 0 } };
  const qual = () => { const x = window.DV_XIAN17; return x && x.state ? x.state().q : S.q };

  /* ---------- sprite dựng sẵn ---------- */
  function sprites(k) {
    if (S.spr[k]) return S.spr[k];
    const T = TIER[k], W = 64, H = 256, col = mk(W, H), g = col.getContext('2d');
    // ngang: lõi sáng hẹp + quầng mềm
    const hg = g.createLinearGradient(0, 0, W, 0);
    hg.addColorStop(0, `rgba(${T.rgb},0)`); hg.addColorStop(.28, `rgba(${T.rgb},.35)`); hg.addColorStop(.44, `rgba(${T.core},.95)`);
    hg.addColorStop(.56, `rgba(${T.core},.95)`); hg.addColorStop(.72, `rgba(${T.rgb},.35)`); hg.addColorStop(1, `rgba(${T.rgb},0)`);
    g.fillStyle = hg; g.fillRect(0, 0, W, H);
    // dọc: đậm ở chân, tan dần lên trời
    g.globalCompositeOperation = 'destination-in';
    const vg = g.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.25, 'rgba(0,0,0,.35)'); vg.addColorStop(.75, 'rgba(0,0,0,.8)'); vg.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    // chân: quầng tròn dẹt
    const base = mk(96, 48), b = base.getContext('2d'), rg = b.createRadialGradient(48, 24, 2, 48, 24, 46);
    rg.addColorStop(0, `rgba(${T.core},.95)`); rg.addColorStop(.3, `rgba(${T.rgb},.55)`); rg.addColorStop(1, `rgba(${T.rgb},0)`);
    b.fillStyle = rg; b.fillRect(0, 0, 96, 48);
    return S.spr[k] = { col, base };
  }

  /* ---------- phân loại vật rơi (chỉ đọc) ---------- */
  function tierOf(o) {
    if (o.h) return 'E';
    if (o.g) return null;                       // vàng: xử lý theo cụm
    return (o.v || 0) >= 20 ? 'L' : null;       // viên EXP lớn = Boss
  }

  /* ---------- vẽ một cột ---------- */
  function beam(ctx, k, x, y, age, a, seed, sk) {
    const T = TIER[k], sp = sprites(k), t = S.G ? S.G.t : 0;
    const grow = RM ? 1 : M.min(1, age / .3), ease = 1 - (1 - grow) * (1 - grow);
    const flick = RM ? 1 : .88 + .12 * M.sin(t * 5 + seed);
    const h = T.h * ease, w = T.w * (1 + (1 - ease) * .6) * (RM ? 1 : (.94 + .06 * M.sin(t * 3.1 + seed * 2)));
    const al = M.min(1, a) * flick;
    ctx.globalAlpha = al * .85;
    ctx.drawImage(sp.base, x - 30, y - 8, 60, 20);                         // quầng chân
    ctx.globalAlpha = al;
    ctx.drawImage(sp.col, x - w * 1.7, y - h, w * 3.4, h);                  // thân cột (rộng ×3.4 gồm cả quầng)
    if (T.ring && age < .6 && !RM) {                                       // sóng xuất hiện
      const u = age / .6, r = 14 + u * 60;
      ctx.globalAlpha = (1 - u) * al * .8; ctx.strokeStyle = `rgb(${T.rgb})`; ctx.lineWidth = 3 * (1 - u) + 1;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * .38, 0, 0, TAU); ctx.stroke();
    }
    if (sk > 0 && !RM && S.stats.sparks < SPARK_CAP) {                    // hạt sáng bay lên (tính từ thời gian; gom 2 mức sáng / 1 lần fill)
      const n = M.round(T.sp * sk); ctx.fillStyle = `rgb(${T.core})`;
      for (let lv = 0; lv < 2; lv++) {
        ctx.globalAlpha = al * (lv ? .35 : .85); ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const ph = ((t * .45 + i / n + seed * .37) % 1); if ((ph > .5 ? 1 : 0) !== lv) continue;
          ctx.rect(x + M.sin(ph * 7 + i * 2.1 + seed) * T.w * .9 - 1, y - ph * T.h * .95 - 1, 2.2, 2.2); S.stats.sparks++;
        }
        ctx.fill();
      }
    }
  }
  // ghost: cột thu lại + hạt bắn ra khi nhặt
  function ghost(ctx, g, t) {
    const T = TIER[g.k], u = (t - g.t0) / .38, sp = sprites(g.k);
    ctx.globalAlpha = (1 - u) * .9;
    const h = T.h * (1 - u) * .8, w = T.w * (1 + u * .8);
    ctx.drawImage(sp.col, g.x - w * 1.7, g.y - h, w * 3.4, h);
    ctx.drawImage(sp.base, g.x - 30 - u * 18, g.y - 8, 60 + u * 36, 20);
    if (!RM && g.sk > 0) {
      ctx.fillStyle = `rgb(${T.core})`; const n = M.round(6 * g.sk);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + g.t0 * 3, r = 8 + u * 38; ctx.globalAlpha = (1 - u) * .9; ctx.fillRect(g.x + M.cos(a) * r - 1, g.y - 4 + M.sin(a) * r * .6 - u * 24 - 1, 2.4, 2.4) }
    }
  }

  /* ---------- móc vào vòng vẽ ---------- */
  const ENV = window.DV_ENV;
  if (!ENV || !ENV.drawAfter) { window.DV_XIAN17L = { ok: () => false, enabled: false, begin() { }, end() { }, stats: S.stats }; return; }
  const oAfter = ENV.drawAfter;
  ENV.drawAfter = function (ctx, cx, cy, W, H) {
    const G = S.G;
    if (G && S.on && DV_XIAN17L.enabled) try { frame(ctx, G, cx, cy, W, H) } catch (e) { S.on = false; console.warn('DV_XIAN17L off:', e) }
    return oAfter.apply(this, arguments);
  };

  function frame(ctx, G, cx, cy, W, H) {
    const Q = M.max(0, M.min(2, qual())), allow = ALLOW[Q], cap = CAP[Q], sk = SPK[Q], t = G.t, orbs = G.orb || [];
    S.stats.beams = 0; S.stats.sparks = 0; S.stats.orbs = orbs.length;
    const list = S.list; list.length = 0;
    const cur = S.cur; cur.length = 0;
    let gn = 0; const cl = S.cl2; cl.clear();

    for (let i = 0; i < orbs.length; i++) {
      const o = orbs[i];
      if (o.g) { if (allow.R && !o.m) { gn++; const kx = M.floor(o.x / CELL), ky = M.floor(o.y / CELL), key = kx * 100003 + ky; let c = cl.get(key); if (!c) { c = { n: 0, x: 0, y: 0, t0: 0 }; cl.set(key, c) } c.n++; c.x += o.x; c.y += o.y } continue }
      const k = tierOf(o); if (!k || !allow[k]) continue;
      let r = S.rec.get(o); if (!r) { r = { t0: t, seed: (++S.id * 1.618) % TAU, gh: 0 }; S.rec.set(o, r) }
      if (o.m && !r.gh) { r.gh = 1; spawnGhost(k, o.x, o.y, t, sk); continue }        // bị hút về người chơi → thu cột
      if (r.gh) continue;
      cur.push({ o, k, r });
      let a = 1; if (o.h && o.life != null && o.life < 3) a = RM ? .6 : .45 + .55 * M.abs(M.sin(t * 9)); // sắp biến mất → nhấp nháy
      const x = o.x - cx, y = o.y - cy, T = TIER[k];
      if (x < -40 || x > W + 40 || y < 10 || y > H + T.h + 20) continue;
      list.push({ k, x, y, age: t - r.t0, a, seed: r.seed, p: T.p });
    }
    // cụm vàng → 1 cột / cụm (giữ mốc thời gian xuất hiện giữa các khung)
    if (gn >= CLUSTER_MIN) for (const [key, c] of cl) {
      if (c.n < CLUSTER_MIN) continue;
      const old = S.cl.get(key); c.t0 = old ? old.t0 : t; c.cx = c.x / c.n; c.cy = c.y / c.n;
      const x = c.cx - cx, y = c.cy - cy;
      if (x < -40 || x > W + 40 || y < 10 || y > H + 200) continue;
      list.push({ k: 'R', x, y, age: t - c.t0, a: M.min(1, (c.n - CLUSTER_MIN + 3) / 6), seed: key % 6.28, p: 2 });
    }
    // đổi chỗ 2 Map để giữ t0
    const tmp = S.cl; S.cl = S.cl2; S.cl2 = tmp;

    // phát hiện vật rơi bậc cao vừa biến mất (nhặt/hết hạn) → ghost
    const prev = S.prev;
    for (let i = 0; i < prev.length; i++) {
      const p = prev[i]; if (p.o.got || (G.orb.indexOf(p.o) < 0 && !p.r.gh)) { if (!p.r.gh) { p.r.gh = 1; spawnGhost(p.k, p.o.x, p.o.y, t, sk) } }
    }
    S.prev = cur; S.cur = prev;

    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (list.length > cap) { list.sort((a, b) => a.p - b.p); list.length = cap }
    for (let i = 0; i < list.length; i++) { const b = list[i]; beam(ctx, b.k, b.x, b.y, b.age, b.a, b.seed, sk); S.stats.beams++ }
    const gs = S.ghosts;
    for (let i = gs.length - 1; i >= 0; i--) { const g = gs[i]; if (t - g.t0 > .38 || t < g.t0) { gs.splice(i, 1); continue } ghost(ctx, { k: g.k, x: g.x - cx, y: g.y - cy, t0: g.t0, sk: g.sk }, t) }
    S.stats.ghosts = gs.length;
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function spawnGhost(k, x, y, t, sk) { const gs = S.ghosts; if (gs.length >= GHOST_CAP) gs.shift(); gs.push({ k, x, y, t0: t, sk }) }

  window.DV_XIAN17L = {
    ok: () => S.on, enabled: true, stats: S.stats, state: () => S, tiers: TIER,
    begin(G) { S.G = G; S.on = true; S.prev = []; S.cur = []; S.ghosts.length = 0; S.cl.clear(); S.cl2.clear(); S.rec = new WeakMap(); S.id = 0 },
    end() { S.G = null; S.prev = []; S.cur = []; S.ghosts.length = 0; S.cl.clear(); S.cl2.clear(); S.list.length = 0 }
  };
})();
