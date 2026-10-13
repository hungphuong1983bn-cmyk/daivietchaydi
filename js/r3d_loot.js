/* Phase 22 — VẦNG SÁNG VẬT RƠI (module của DV_R3D, đọc G.orb, KHÔNG đổi logic nhặt/EXP/vàng).
   Mỗi loại vật rơi có màu + hình vầng sáng riêng để nhận ra từ xa:
     VÀNG  = vàng ấm, tia lấp lánh 4 cánh xoay      EXP nhỏ = xanh lam      EXP vừa = chàm tím      EXP lớn (≥20, tinh anh/boss) = tím hồng + vòng lớn + tia
     BÌNH HỒI = xanh lục + dấu cộng sáng
   Lớp hiển thị: (1) quầng sáng billboard cộng sáng  (2) vòng sáng nằm trên mặt đất nhịp thở  (3) tia lấp lánh xoay (vàng/hồi/EXP lớn).
   Khi quái chết: vật rơi "nảy" lên theo cung rồi hạ xuống (R3.lootPop dùng chung với r3d_fx để xu/gem bay cùng quầng sáng) + tia lửa + vòng sóng.
   Khi bị hút: vệt sáng theo màu. Khi nhặt: tóe sáng tại chỗ nhân vật. Chất lượng thấp: bỏ vòng đất + tia lửa. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T) return;
  const M = Math, PI = M.PI, TAU = PI * 2, L = { seen: new Map(), glow: null, gnd: null, star: null, shd: null, tex: null, n: 0 };
  const CAP = 360, _m = new T.Matrix4(), _q = new T.Quaternion(), _p = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color(), _c2 = new T.Color(), _c3 = new T.Color(), _e = new T.Euler(), _q2 = new T.Quaternion(), _ax = new T.Vector3(0, 0, 1);
  /* bảng loại vật rơi: màu quầng, màu lõi, cỡ quầng, cỡ vòng đất, có tia lấp lánh, độ sáng */
  const KIND = {
    g: { col: '#ffc43a', core: '#fff4c0', halo: 17, ring: 11, star: 1, a: .75 },
    xs: { col: '#3f9bff', core: '#d6ecff', halo: 15, ring: 9, star: 0, a: .7 },
    xm: { col: '#8a78ff', core: '#e6e0ff', halo: 23, ring: 14, star: 1, a: .8 },
    xb: { col: '#d45aff', core: '#ffe6ff', halo: 42, ring: 26, star: 1, a: .95 },
    h: { col: '#4dff94', core: '#e4ffee', halo: 34, ring: 20, star: 1, a: .95 }
  };
  const kindOf = o => o.h ? 'h' : o.g ? 'g' : (o.v || 1) >= 20 ? 'xb' : (o.v || 1) >= 4 ? 'xm' : 'xs';
  R3.lootKind = kindOf; R3.lootKinds = KIND;
  const H = (x, y) => R3.height(x, y);

  function tex(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); let gr;
    if (kind === 'shade') { gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(10,6,24,.55)'); gr.addColorStop(.55, 'rgba(10,6,24,.3)'); gr.addColorStop(1, 'rgba(10,6,24,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64) }
    else if (kind === 'glow') { gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(.6, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64) }
    else if (kind === 'ring') { gr = g.createRadialGradient(32, 32, 6, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.6, 'rgba(255,255,255,.12)'); gr.addColorStop(.82, 'rgba(255,255,255,.95)'); gr.addColorStop(.93, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64) }
    else {   // tia lấp lánh 4 cánh
      g.translate(32, 32); for (let i = 0; i < 2; i++) { g.save(); g.rotate(i * PI / 2); gr = g.createLinearGradient(-32, 0, 32, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 32, i ? 2.2 : 3.2, 0, 0, TAU); g.fill(); g.restore() }
    }
    const t = new T.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  function mk(S, t, flat, normal) {
    const geo = new T.PlaneGeometry(1, 1); if (flat) geo.rotateX(-PI / 2);
    const m = new T.InstancedMesh(geo, new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: normal ? T.NormalBlending : T.AdditiveBlending, fog: false }), CAP);
    m.frustumCulled = false; m.count = 0; m.renderOrder = normal ? 2 : flat ? 3 : 7; m.setColorAt(0, _c.set(0xffffff)); S.fxG.add(m); return m;
  }
  function build(S) {
    if (!L.tex) L.tex = { glow: tex('glow'), ring: tex('ring'), star: tex('star'), shade: tex('shade') };
    L.glow = mk(S, L.tex.glow, false); L.gnd = mk(S, L.tex.ring, true); L.star = mk(S, L.tex.star, false); L.shd = mk(S, L.tex.shade, true, true);
  }
  function drop() { for (const m of [L.glow, L.gnd, L.star, L.shd]) if (m) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); m.dispose() } L.glow = L.gnd = L.star = L.shd = null; L.seen.clear() }

  /* đăng ký vật rơi lần đầu thấy (dùng chung cho r3d_fx để nảy cùng quầng sáng) */
  function touch(o, t) { let i = L.seen.get(o); if (!i) { i = { t0: t, k: kindOf(o), isNew: 1, ph: (o.x * .37 + o.y * .21) % TAU, x: o.x, y: o.y }; L.seen.set(o, i) } return i }
  /* nảy theo cung: h = độ cao cộng thêm, s = hệ số phóng (pop-in có "đà") */
  R3.lootPop = function (o, t) {
    const i = touch(o, t), age = t - i.t0, u = M.min(1, age / .5);
    if (u >= 1) return { h: 0, s: 1 }; const e = u - 1, back = 1 + 2.2 * e * e * e + 1.2 * e * e;
    return { h: M.sin(PI * u) * (i.k === 'xb' || i.k === 'h' ? 30 : 20), s: M.max(.05, back) };
  };
  R3.lootCol = function (o, out) { _c.set(KIND[kindOf(o)].col); return out ? out.copy(_c) : _c };

  function put(m, n, x, y, z, sx, sy, qq, col, a) { _m.compose(_p.set(x, y, z), qq, _s.set(sx, sy, 1)); m.setMatrixAt(n, _m); m.setColorAt(n, _c.set(col).multiplyScalar(a)) }

  R3.reg({
    init(S) { },
    begin(S) { drop() },
    end(S) { drop() },
    update(S, G, dt) {
      if (!S.fxG) return; if (!L.glow || L.glow.parent !== S.fxG) { drop(); build(S) }
      const F = R3.F, P = G.p, t = S.t, q = S.q | 0, cur = new Set(); let ng = 0, ngr = 0, nst = 0, nsh = 0, sparks = 0, trails = 0; const camQ = S.cam.quaternion;
      for (const o of G.orb) {
        cur.add(o); const dx = o.x - P.x, dy = o.y - P.y; if (dx * dx + dy * dy > 1300 * 1300) continue;
        const i = touch(o, t), K = KIND[i.k], age = t - i.t0, pop = R3.lootPop(o, t), h0 = H(o.x, o.y);
        i.x = o.x; i.y = o.y; i.m = o.m;
        if (i.isNew) { i.isNew = 0;   // vừa rơi: tia lửa + vòng sóng (giới hạn mỗi khung để rơi hàng loạt không giật)
          if (F && q > 0 && sparks < 10) { sparks++; F.burst(o.x, o.y, h0 + 8, i.k === 'xb' ? 14 : i.k === 'xs' ? 3 : 6, i.k === 'xb' ? 120 : 70, .55, K.col, 70, 160) }
          if (F && q > 0 && (i.k === 'xb' || i.k === 'h' || i.k === 'xm')) F.ring(o.x, o.y, K.ring * 2.4, .5, K.col);
        }
        const pulse = 1 + .12 * M.sin(t * 4.2 + i.ph), fade = o.h && o.life < 4 ? (M.sin(t * 14) > 0 ? .35 : 1) : 1;   // bình hồi sắp biến mất: nhấp nháy
        const y = h0 + 9 + pop.h + M.sin(t * 4 + i.ph) * 1.6;
        if (ng < CAP) { const hs = K.halo * 1.3 * pop.s * pulse; put(L.glow, ng++, o.x, y, o.y, hs, hs, camQ, _c2.set(K.col).lerp(_c3.set(K.core), .35).getStyle(), K.a * 1.25 * fade); }
        if (q > 0 && nsh < CAP) { const sd = K.ring * 2.9 * M.min(1, age / .3 + .3); _m.compose(_p.set(o.x, h0 + .5, o.y), _q.identity(), _s.set(sd, 1, sd)); L.shd.setMatrixAt(nsh, _m); L.shd.setColorAt(nsh++, _c.set(0xffffff).multiplyScalar(fade)) }   // bóng tối nhẹ: tăng tương phản trên nền sáng
        if (q > 0 && ngr < CAP && pop.h < 4) { const rs = K.ring * 2 * (.9 + .1 * M.sin(t * 3 + i.ph)) * M.min(1, age / .3 + .2); _m.compose(_p.set(o.x, h0 + .9, o.y), _q.identity(), _s.set(rs, 1, rs)); L.gnd.setMatrixAt(ngr, _m); L.gnd.setColorAt(ngr++, _c.set(K.col).multiplyScalar(K.a * .85 * fade)) }
        if (q > 0 && K.star && nst < CAP) { const ss = K.halo * (i.k === 'xb' ? 1.9 : 1.6) * pop.s * (.85 + .3 * M.max(0, M.sin(t * 5 + i.ph))); _q2.setFromAxisAngle(_ax, t * (i.k === 'g' ? 1.4 : .8) + i.ph); _q.copy(camQ).multiply(_q2); put(L.star, nst++, o.x, y, o.y, ss, ss, _q, K.core, .9 * fade) }
        if (o.m && R3.emit && q > 0 && trails < 14 && M.random() < .6) { trails++; R3.emit(o.x, o.y, y, 0, 0, 0, .3, K.col, 0) }   // vệt sáng khi bị hút về nhân vật
      }
      for (const [o, i] of L.seen) {   // vật đã biến mất: nếu ở gần nhân vật → vừa nhặt
        if (cur.has(o)) continue; L.seen.delete(o); const K = KIND[i.k], d = M.hypot(i.x - P.x, i.y - P.y);
        if (F && q > 0 && d < 70 && sparks < 16) { sparks++; F.burst(P.x, P.y, H(P.x, P.y) + 18, i.k === 'xb' || i.k === 'h' ? 12 : 4, 90, .5, K.col, 80, 120); if (i.k === 'xb' || i.k === 'h') F.ring(P.x, P.y, 34, .45, K.col) }
      }
      for (const [m, n] of [[L.glow, ng], [L.gnd, ngr], [L.star, nst], [L.shd, nsh]]) { m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true }
    }
  });
})();
