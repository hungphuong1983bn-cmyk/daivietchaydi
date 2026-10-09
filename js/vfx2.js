/* Phase 13 — VFX PHÂN LỚP THEO VÕ CÔNG  (window.DV_VFX2)
   Bổ sung lên trên js/vfx.js (Phase 10): mỗi nhóm võ công có bộ hình ảnh RIÊNG (không chỉ đổi màu) và nhiều lớp:
     charge (tụ lực) → cast (tung chiêu) → travel/trail (vệt bay) → hit (trúng) → impact (chạm đất/nổ) → screen (màn hình) → camera → âm thanh
   Nhóm:  kiem  vệt kiếm quang + tia sáng chéo            dao   cung chém rộng + bụi đá + sóng xung kích nền
          quyen sóng quyền + nứt đất                       chuong vòng chưởng khí tròn + nổ
          hoa   tàn lửa bay lên + lưỡi lửa + vết cháy      bang  mảnh băng + tinh thể mọc + vỡ vụn khi hạ gục
          loi   hồ quang gấp khúc + tia điện               doc   bong bóng độc + đám mây + vũng độc
          phong vệt gió cong + lá + lốc xoáy
   Chất liệu: giáp → tia lửa kim loại · đá → mảnh vỡ · thú → bụi · boss → vòng chấn động.
   Chí mạng: loé viền + ngôi sao + vòng · Combo 10/20/30/50/100 HIT: banner + vòng + âm thanh tăng dần.
   Tuyệt kỹ: dim nền (nhân vật vẫn sáng) → cột tụ lực + vạch tốc độ → bùng nổ + sắc màn hình theo hệ.
   Boss xuất hiện: vòng tối + cột + banner tên (ở phía trên, không che nhân vật).
   Hiệu năng: hạt/hiệu ứng có TRẦN theo chất lượng đồ hoạ (Thấp/Vừa/Cao), ngân sách hiệu ứng đòn trúng mỗi khung, tái dùng đối tượng (pool). */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2, R = Math.random;
  const CAPP = [110, 260, 420], CAPE = [26, 64, 110], HITB = [2, 5, 9];
  let L = [], PT = [], poolL = [], poolP = [], hb = 0, qf = () => 1;
  const U = { on: 0, t: 0, T: 1.5, el: 'kiem', dim: 0 }, B = { t: 0, T: 2.6, name: '' }, S = { cf: 0, ccol: '#fff', tint: 0, tcol: '#fff', pop: 0 };
  const ez = t => 1 - (1 - t) * (1 - t) * (1 - t);
  const FX = () => window.DV_DATA && DV_DATA.skillfx;
  const pal = el => { const f = FX(); return (f && f.palette && f.palette[el]) || ['#fff', '#ffd978'] };
  const Q = () => { try { return qf() } catch (e) { return 1 } };

  function E(o) { if (L.length >= CAPE[Q()]) return null; const e = poolL.pop() || {}; for (const k in e) delete e[k]; Object.assign(e, o); e.T = e.T || e.t; L.push(e); return e }
  function P(x, y, vx, vy, t, c, s, k, g) {
    if (PT.length >= CAPP[Q()]) return; const p = poolP.pop() || {};
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = p.T = t; p.c = c; p.s = s || 3; p.k = k || 'd'; p.g = g || 0; p.r = R() * TAU; p.vr = (R() - .5) * 10; PT.push(p);
  }
  const rad = (n, f) => { for (let i = 0; i < n; i++) f(R() * TAU, i) };

  /* ---------- hiệu ứng theo hệ ---------- */
  function burst(el, x, y, big, cr) {
    const c = pal(el), q = Q(), n = (q === 0 ? 3 : q === 1 ? 5 : 8) + (big ? 4 : 0);
    switch (el) {
      case 'kiem': rad(n, a => P(x, y, M.cos(a) * 150, M.sin(a) * 150 - 20, .28, c[R() < .5 ? 0 : 1], 2, 'sp'));
        E({ k: 'rg', x, y, t: .22, R: big ? 44 : 28, c: c[0], w: 3 }); break;
      case 'dao': E({ k: 'arc', x, y, t: .3, R: big ? 62 : 46, a: -.6 + R() * .4, sp: 2.4, c: c[0], w: 9 });
        E({ k: 'rg', x, y: y + 12, t: .32, R: big ? 70 : 46, c: c[1], w: 5, fl: 1 });
        rad(big ? 6 : 3, a => P(x, y + 10, M.cos(a) * 90, -40 - R() * 80, .45, '#a89476', 3 + R() * 2, 'ch', 380)); break;
      case 'quyen': case 'chuong':
        E({ k: 'rg', x, y, t: .3, R: big ? 78 : 50, c: c[0], w: 6, fl: el === 'quyen' ? 1 : 0 }); E({ k: 'rg', x, y, t: .22, R: big ? 40 : 26, c: c[1], w: 3 });
        if (el === 'quyen' && big) E({ k: 'cr', x, y: y + 14, t: .7, R: 56, n: 7, sd: R() * 9 });
        rad(n >> 1, a => P(x, y, M.cos(a) * 110, M.sin(a) * 60 - 20, .35, c[0], 2.4, 'd')); break;
      case 'hoa': rad(n, () => P(x + (R() - .5) * 14, y, (R() - .5) * 60, -50 - R() * 90, .5 + R() * .3, c[R() < .5 ? 0 : 1], 2.5 + R() * 2.5, 'em', -40));
        if (big || cr) E({ k: 'fl', x, y: y + 10, t: .42, h: big ? 44 : 28, c: c[1] });
        if (big) E({ k: 'sc', x, y: y + 14, t: 1.1, R: 26 }); break;
      case 'bang': rad(n, a => P(x, y, M.cos(a) * 130, M.sin(a) * 130 - 30, .5, R() < .5 ? c[0] : c[1], 3 + R() * 2.5, 'sh', 260));
        E({ k: 'rg', x, y, t: .35, R: big ? 56 : 34, c: c[1], w: 3 }); if (big || cr) E({ k: 'cy', x, y: y + 12, t: .7, n: big ? 4 : 2, h: big ? 36 : 24, sd: R() * 9 }); break;
      case 'loi': E({ k: 'bo', x, y, t: .2, h: 26 + R() * 14, sd: R() * 99, c: c[0] }); if (big || cr) E({ k: 'bo', x: x + (R() - .5) * 30, y, t: .16, h: 22, sd: R() * 99, c: c[1], hz: 1 });
        rad(n >> 1, a => P(x, y, M.cos(a) * 170, M.sin(a) * 170, .2, c[0], 2, 'sp')); E({ k: 'rg', x, y, t: .2, R: 26, c: c[1], w: 2 }); break;
      case 'doc': rad(n, () => P(x + (R() - .5) * 18, y, (R() - .5) * 30, -26 - R() * 40, .7, c[R() < .5 ? 0 : 1], 3 + R() * 3, 'bu', -20));
        E({ k: 'cl', x, y, t: .7, R: big ? 44 : 28, c: c[1], sd: R() * 9 }); if (big) E({ k: 'sc', x, y: y + 14, t: 1.4, R: 28, c: 'rgba(120,255,90,.35)' }); break;
      case 'phong': E({ k: 'arc', x, y, t: .24, R: big ? 40 : 28, a: R() * TAU, sp: 1.8, c: c[0], w: 3 });
        rad(n >> 1, () => P(x, y, (R() - .5) * 150, (R() - .5) * 70, .45, c[0], 3.5, 'lf', 20)); E({ k: 'rg', x, y, t: .25, R: 32, c: c[1], w: 2 }); break;
    }
  }
  function matFx(e, x, y) {
    const f = FX(), m = f && f.materialOf ? f.materialOf(e, (G0 && G0.theme) || null) : 'flesh';
    if (m === 'metal') rad(Q() ? 5 : 2, a => P(x, y, M.cos(a) * 190, M.sin(a) * 190 - 40, .25, '#ffe9a0', 2, 'sp', 200));
    else if (m === 'stone') rad(Q() ? 4 : 2, a => P(x, y, M.cos(a) * 100, -60 - R() * 70, .5, '#8a8478', 3 + R() * 2.5, 'ch', 420));
    else if (m === 'beast') rad(Q() ? 3 : 1, a => P(x, y + 6, M.cos(a) * 60, -10 - R() * 30, .5, 'rgba(190,170,130,.55)', 5 + R() * 3, 'pf', -6));
    else if (m === 'boss') { E({ k: 'rg', x, y: y + 14, t: .4, R: 56, c: '#ffd0a0', w: 5, fl: 1 }) }
  }
  function crit(x, y, el) {
    const c = pal(el);
    E({ k: 'st', x, y: y - 14, t: .5, c: c[0], c2: c[1] }); E({ k: 'rg', x, y, t: .28, R: 46, c: c[0], w: 4 });
    S.cf = M.max(S.cf, .5); S.ccol = c[1];
  }

  /* ---------- API gọi từ index.html ---------- */
  let G0 = null;
  function reset(G) { for (const e of L) poolL.push(e); L.length = 0; for (const p of PT) poolP.push(p); PT.length = 0; U.on = 0; B.t = 0; S.cf = 0; S.tint = 0; S.pop = 0; G0 = G; if (G) G.cmb = { n: 0, t: 0, tier: 0, best: 0, pop: 0 } }
  const resolve = (src, G) => { const f = FX(); return f && f.resolve ? f.resolve(src, G) : null };

  function onHit(e, src, cr, d, G) {
    G0 = G; if (d >= 9999) return;
    combo(G);
    const s = resolve(src, G), x = e.x, y = e.y - e.r, heavy = d >= M.max(60, e.mhp * .14) || src === 'ult';
    if (hb >= HITB[Q()] && !(cr || e.boss)) return; hb++;
    if (s) { burst(s.element, x, y, heavy, cr); if (s.sub && src === 'ult' && hb < 4) burst(s.sub, x, y, 0, 0) }
    if (!(src === 'ult' && hb > 3)) matFx(e, x, y);
    if (cr) crit(x, y, s ? s.element : 'kiem');
    if (e.boss && heavy) E({ k: 'rg', x: e.x, y: e.y, t: .35, R: e.r * 2.6, c: '#fff1b0', w: 4, fl: 1 });
  }
  function onKill(e, src, G) {
    if (hb > HITB[Q()] + 3) return;
    const s = resolve(src, G), el = s && s.element, x = e.x, y = e.y - e.r * .6;
    if (el === 'bang') { rad(Q() ? 9 : 4, a => P(x, y, M.cos(a) * 160, M.sin(a) * 160 - 60, .6, R() < .5 ? '#e8fbff' : '#7ad8ff', 3.5 + R() * 3, 'sh', 330)); E({ k: 'rg', x, y, t: .35, R: 42, c: '#bfeeff', w: 3 }) }
    else if (el === 'hoa') rad(Q() ? 8 : 3, () => P(x, y, (R() - .5) * 90, -40 - R() * 60, .9, '#555', 4 + R() * 3, 'pf', -22));
    else if (el === 'loi') E({ k: 'bo', x, y, t: .22, h: 36, sd: R() * 99, c: '#f4ecff' });
    else if (el === 'doc') E({ k: 'cl', x, y, t: .9, R: 34, c: '#a24aff', sd: R() * 9 });
  }
  /* tung chiêu: R = bán kính vùng tác động (nếu có) */
  function cast(src, G, x, y, a, R2, evo) {
    G0 = G; const s = resolve(src, G); if (!s) return; const c = pal(s.element), q = Q();
    if (src === 'hang') {                                                 /* chưởng / hoả (tiến hoá) */
      const fire = s.element === 'hoa';
      E({ k: 'col', x, y: y + 10, t: .35, w: 22, h: 70, c: c[0] }); E({ k: 'rg', x, y: y + 12, t: .5, R: R2 || 100, c: c[1], w: 5, fl: 1 });
      if (fire) { for (let i = 0; i < 4; i++)E({ k: 'fl', x: x + M.cos(i * 1.57) * (R2 || 100) * .8, y: y + 10 + M.sin(i * 1.57) * (R2 || 100) * .5, t: .5, h: 34, c: c[1] }); E({ k: 'sc', x, y: y + 12, t: 1.4, R: (R2 || 100) * .35 }) }
      else if (q) E({ k: 'cr', x, y: y + 12, t: .8, R: (R2 || 100) * .55, n: 7, sd: R() * 9 });
    } else if (src === 'loi') {                                           /* sét: vòng sốc + vết cháy */
      E({ k: 'rg', x, y: y + 4, t: .35, R: R2 || 50, c: c[1], w: 4, fl: 1 }); if (q) E({ k: 'sc', x, y: y + 4, t: 1.2, R: (R2 || 50) * .6 });
    } else if (src === 'kiem') {                                          /* kiếm khí: tụ ánh sáng ở mũi kiếm + vòng aura kiếm */
      rad(q ? 5 : 2, () => P(x + M.cos(a) * 26 + (R() - .5) * 22, y + M.sin(a) * 26 + (R() - .5) * 22, M.cos(a) * 40, M.sin(a) * 40, .22, c[0], 2.4, 'sp'));
      E({ k: 'arc', x: x + M.cos(a) * 14, y: y + M.sin(a) * 14, t: .2, R: 26, a, sp: 1.6, c: c[0], w: 3 });
    } else if (src === 'phi') { E({ k: 'tor', x, y: y + 10, t: .5, R: 30 }) }
  }
  /* vệt bay: p = đạn (x,y,a) · gọi mỗi khung */
  function travel(src, G, p, dt) {
    const s = resolve(src, G); if (!s) return; p.t2 = (p.t2 || 0) - dt; if (p.t2 > 0) return; p.t2 = Q() ? .045 : .09;
    const c = pal(s.element); P(p.x + (R() - .5) * 6, p.y + (R() - .5) * 6, -p.vx * .05, -p.vy * .05 - 8, .3, c[R() < .5 ? 0 : 1], 2 + R() * 1.5, s.element === 'kiem' ? 'sp' : 'd');
  }
  /* quỹ đạo Phi Kiếm: hạt gió xoay */
  function orbit(G, P0, n, orb, evo) {
    if (!Q() || R() > .25) return; const a = orb + R() * TAU, c = pal('phong');
    P(P0.x + M.cos(a) * 62, P0.y + M.sin(a) * 62 - 10, M.cos(a + 1.57) * 30, M.sin(a + 1.57) * 30, .4, c[R() < .5 ? 0 : 1], 3, 'lf', 0);
  }

  /* ---------- Tuyệt kỹ ---------- */
  function ultStart(G, P0) {
    G0 = G; const s = resolve('ult', G); U.on = 1; U.t = 0; U.T = 1.5; U.el = s ? s.element : 'kiem'; U.sub = s && s.sub; U.px = P0.x; U.py = P0.y; U.ch = 0;
    const c = pal(U.el);
    E({ k: 'col', x: P0.x, y: P0.y + 8, t: .5, w: 36, h: 200, c: c[0] });
    E({ k: 'spd', x: P0.x, y: P0.y - 20, t: .4, c: c[0] }); E({ k: 'rg', x: P0.x, y: P0.y + 8, t: .55, R: 120, c: c[1], w: 5, fl: 1, inw: 1 });
    S.tint = .5; S.tcol = c[1];
  }
  function ultImpact(G, P0) {
    const c = pal(U.el); S.tint = .85; S.tcol = c[1];
    E({ k: 'rg', x: P0.x, y: P0.y + 10, t: .7, R: 420, c: c[0], w: 8, fl: 1 }); E({ k: 'rg', x: P0.x, y: P0.y + 10, t: .5, R: 260, c: c[1], w: 5, fl: 1 });
    if (Q()) { E({ k: 'cr', x: P0.x, y: P0.y + 12, t: 1.1, R: 220, n: 9, sd: R() * 9 }); rad(Q() > 1 ? 24 : 10, a => P(P0.x, P0.y, M.cos(a) * 260, M.sin(a) * 160 - 30, .7, c[R() < .5 ? 0 : 1], 3.5, 'em', 0)) }
  }

  /* ---------- Boss xuất hiện ---------- */
  function bossIntro(G, b, name) {
    G0 = G; B.t = B.T = 2.6; B.name = name || 'BOSS';
    E({ k: 'rg', x: b.x, y: b.y + 10, t: .9, R: b.r * 5, c: '#ff5a4a', w: 6, fl: 1 }); E({ k: 'rg', x: b.x, y: b.y + 10, t: .6, R: b.r * 3, c: '#ffd0a0', w: 4, fl: 1 });
    E({ k: 'col', x: b.x, y: b.y + 8, t: .9, w: b.r * 1.6, h: 230, c: '#ff4a3a' });
  }

  /* ---------- Combo ---------- */
  function combo(G) {
    const c = G.cmb || (G.cmb = { n: 0, t: 0, tier: 0, best: 0, pop: 0 }), f = FX(), cf = f && f.combo; if (!cf) return;
    c.n++; c.t = cf.window; c.pop = 1; if (c.n > c.best) c.best = c.n;
    const T = cf.tiers;
    if (c.tier < T.length && c.n >= T[c.tier]) {
      c.tier++; c.flash = 1.4; const col = cf.color[c.tier] || '#fff', P0 = G.p;
      E({ k: 'rg', x: P0.x, y: P0.y + 8, t: .6, R: 80 + c.tier * 40, c: col, w: 6, fl: 1 }); E({ k: 'rg', x: P0.x, y: P0.y + 8, t: .4, R: 50 + c.tier * 20, c: '#fff', w: 3, fl: 1 });
      if (c.tier >= 3) rad(Q() ? 14 : 6, a => P(P0.x, P0.y - 10, M.cos(a) * 180, M.sin(a) * 120 - 30, .6, col, 3.5, 'em', 0));
      S.cf = M.max(S.cf, c.tier >= 3 ? .6 : .3); S.ccol = col;
      if (window.DV_AUDIO) DV_AUDIO.combo(c.tier);
      if (window.DV_VFX3) DV_VFX3.combo(P0.x, P0.y, c.tier, col);
    }
  }

  /* ---------- cập nhật ---------- */
  function update(dt, G) {
    G0 = G; hb = 0;
    for (let i = L.length - 1; i >= 0; i--) { const e = L[i]; e.t -= dt; if (e.t <= 0) { poolL.push(e); L[i] = L[L.length - 1]; L.pop() } }
    for (let i = PT.length - 1; i >= 0; i--) {
      const p = PT[i]; p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= p.k === 'ch' ? .98 : .94; p.r += p.vr * dt;
      if (p.t <= 0) { poolP.push(p); PT[i] = PT[PT.length - 1]; PT.pop() }
    }
    if (U.on) { U.t += dt; U.dim = U.t < .2 ? U.t / .2 : U.t < 1.0 ? 1 : M.max(0, 1 - (U.t - 1) / .5); if (U.t >= U.T) { U.on = 0; U.dim = 0 }
      if (!U.ch && U.t > .06) { /* tụ lực: hạt bay VÀO người chơi */ } if (U.t < .32 && Q()) { const c = pal(U.el), a = R() * TAU, d = 120 + R() * 60; P(G.p.x + M.cos(a) * d, G.p.y - 10 + M.sin(a) * d * .6, -M.cos(a) * d * 3.2, -M.sin(a) * d * 1.9, .3, c[R() < .5 ? 0 : 1], 3, 'sp') }
      if (!U.hit && U.t > .3) { U.hit = 1; ultImpact(G, G.p) } if (!U.on) U.hit = 0 }
    if (B.t > 0) B.t -= dt;
    S.cf = M.max(0, S.cf - dt * 3.2); S.tint = M.max(0, S.tint - dt * 1.6);
    const c = G.cmb; if (c) { if (c.n > 0) { c.t -= dt; if (c.t <= 0) { c.n = 0; c.tier = 0 } } c.pop = M.max(0, (c.pop || 0) - dt * 6); c.flash = M.max(0, (c.flash || 0) - dt) }
  }

  /* ---------- vẽ (lớp thế giới, toạ độ ảo W/z) ---------- */
  function dim(ctx, W, H) { if (U.on && U.dim > 0) { ctx.fillStyle = 'rgba(6,8,22,' + (.42 * U.dim) + ')'; ctx.fillRect(-W, -H, W * 3, H * 3) } }
  function jag(ctx, x0, y0, x1, y1, sd, amp) {
    ctx.beginPath(); ctx.moveTo(x0, y0); let s = sd | 0; const n = 7;
    for (let i = 1; i < n; i++) { s = (s * 1103515245 + 12345) >>> 0; ctx.lineTo(x0 + (x1 - x0) * i / n + ((s % 100) / 100 - .5) * amp, y0 + (y1 - y0) * i / n + ((s >> 8) % 100 / 100 - .5) * amp * .5) } ctx.lineTo(x1, y1); ctx.stroke();
  }
  function draw(ctx, cx, cy, G) {
    const q = Q(); ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const e of L) {
      const k = 1 - e.t / e.T, x = e.x - cx, y = e.y - cy, a = 1 - k;
      switch (e.k) {
        case 'rg': { const r = e.R * (e.inw ? 1.05 - .85 * ez(k) : .2 + .8 * ez(k)); ctx.strokeStyle = e.c; ctx.globalAlpha = a * (e.inw ? .8 : 1); ctx.lineWidth = e.w * a + 1; ctx.beginPath(); if (e.fl) ctx.ellipse(x, y, r, r * .42, 0, 0, TAU); else ctx.arc(x, y, r, 0, TAU); ctx.stroke(); break }
        case 'arc': { const r = e.R * (.8 + .4 * k); ctx.strokeStyle = e.c; ctx.globalAlpha = a * .4; ctx.lineWidth = e.w + 4; ctx.beginPath(); ctx.arc(x, y, r, e.a - e.sp / 2, e.a + e.sp / 2); ctx.stroke(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = e.w * .45 * a + 1; ctx.stroke(); break }
        case 'bo': { ctx.strokeStyle = e.c; ctx.globalAlpha = a; ctx.lineWidth = 2.4 * a + .6; jag(ctx, x, y - e.h, x + (e.hz ? 14 : 0), y, e.sd, 16); if (q) { ctx.globalAlpha = a * .4; ctx.lineWidth = 6; jag(ctx, x, y - e.h, x + (e.hz ? 14 : 0), y, e.sd, 16) } break }
        case 'cr': { ctx.strokeStyle = 'rgba(30,20,10,' + (.75 * a) + ')'; ctx.lineWidth = 2.2; let s = e.sd | 0; const r = e.R * (.35 + .65 * ez(M.min(1, k * 3))); for (let i = 0; i < e.n; i++) { s = (s * 1103515245 + 12345) >>> 0; const an = i / e.n * TAU + (s % 50) / 80; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + M.cos(an) * r * .5 + (s % 9 - 4), y + M.sin(an) * r * .5 * .45); ctx.lineTo(x + M.cos(an) * r, y + M.sin(an) * r * .45); ctx.stroke() } break }
        case 'sc': { ctx.fillStyle = e.c || 'rgba(20,10,5,' + (.28 * a) + ')'; if (e.c) ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, y, e.R, e.R * .45, 0, 0, TAU); ctx.fill(); break }
        case 'fl': { const h = e.h * (k < .3 ? k / .3 : 1), g = ctx.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, 'rgba(255,230,120,0)'); g.addColorStop(.5, 'rgba(255,170,50,' + (.9 * a) + ')'); g.addColorStop(1, 'rgba(255,70,20,' + (.9 * a) + ')'); ctx.fillStyle = g; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 9 - 5, y); ctx.quadraticCurveTo(x + i * 9 + M.sin(G.t * 20 + i) * 3, y - h * (i ? .6 : 1) * .6, x + i * 9, y - h * (i ? .7 : 1)); ctx.quadraticCurveTo(x + i * 9 + 4, y - h * .4, x + i * 9 + 5, y); ctx.fill() } break }
        case 'cy': { const h = e.h * ez(M.min(1, k * 3.5)); ctx.globalAlpha = a < .35 ? a / .35 : 1; let s = e.sd | 0; for (let i = 0; i < e.n; i++) { s = (s * 1103515245 + 12345) >>> 0; const ox = ((s % 60) - 30) * (e.n > 2 ? 1 : .5), hh = h * (.7 + (s >> 6) % 40 / 100); ctx.fillStyle = '#bfeeff'; ctx.strokeStyle = '#5ab8e8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + ox - 5, y); ctx.lineTo(x + ox, y - hh); ctx.lineTo(x + ox + 5, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(x + ox - 1, y - 2); ctx.lineTo(x + ox, y - hh); ctx.lineTo(x + ox + 2, y - 2); ctx.fill() } break }
        case 'cl': { let s = e.sd | 0; ctx.fillStyle = e.c; for (let i = 0; i < 4; i++) { s = (s * 1103515245 + 12345) >>> 0; ctx.globalAlpha = a * .22; ctx.beginPath(); ctx.arc(x + (s % 30 - 15) * k * 1.4, y - k * 14 + ((s >> 7) % 20 - 10), e.R * (.5 + .5 * k) * (.7 + i * .15), 0, TAU); ctx.fill() } break }
        case 'tor': { ctx.strokeStyle = '#8affc8'; for (let i = 0; i < 5; i++) { ctx.globalAlpha = a * (1 - i * .15); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + M.sin(G.t * 9 + i) * 3, y - i * 9 - k * 20, e.R * (1 - i * .15), e.R * .3 * (1 - i * .1), 0, 0, TAU); ctx.stroke() } break }
        case 'col': { const w = e.w * (1 - .6 * k), g = ctx.createLinearGradient(0, y - e.h, 0, y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, e.c); ctx.globalAlpha = a * .75; ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - e.h, w, e.h); break }
        case 'spd': { ctx.strokeStyle = e.c; ctx.globalAlpha = a * .8; ctx.lineWidth = 1.6; for (let i = 0; i < 14; i++) { const an = i / 14 * TAU + (i % 2) * .1, r0 = 40 + k * 60, r1 = r0 + 40 + (i % 3) * 14; ctx.beginPath(); ctx.moveTo(x + M.cos(an) * r0, y + M.sin(an) * r0 * .8); ctx.lineTo(x + M.cos(an) * r1, y + M.sin(an) * r1 * .8); ctx.stroke() } break }
        case 'st': { const r = 8 + 14 * ez(k), rot = k * 1.4; ctx.globalAlpha = a; ctx.fillStyle = e.c; ctx.strokeStyle = e.c2; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = rot + i * M.PI / 4, rr = i % 2 ? r * .35 : r; ctx.lineTo(x + M.cos(an) * rr, y + M.sin(an) * rr) } ctx.closePath(); ctx.fill(); ctx.stroke(); break }
      }
    }
    ctx.globalAlpha = 1;
    for (const p of PT) {
      const x = p.x - cx, y = p.y - cy, a = M.max(0, p.t / p.T);
      switch (p.k) {
        case 'sp': ctx.strokeStyle = p.c; ctx.globalAlpha = a; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * .05, y - p.vy * .05); ctx.stroke(); break;
        case 'sh': ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.lineTo(p.s * .6, p.s * .6); ctx.lineTo(-p.s * .6, p.s * .6); ctx.fill(); ctx.restore(); break;
        case 'em': ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y, p.s * a + .5, 0, TAU); ctx.fill(); break;
        case 'bu': ctx.globalAlpha = a * .9; ctx.strokeStyle = p.c; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, p.s * (1.4 - a * .4), 0, TAU); ctx.stroke(); break;
        case 'lf': ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
        case 'ch': ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); ctx.restore(); break;
        case 'pf': ctx.globalAlpha = a * .5; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y, p.s * (1.8 - a), 0, TAU); ctx.fill(); break;
        default: ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
      }
    }
    ctx.restore();
  }

  /* ---------- vẽ (lớp màn hình, kích thước thật) ---------- */
  function screen(ctx, W, H, G) {
    if (S.cf > 0 || S.tint > 0) {                                                  /* viền loé: chí mạng / tuyệt kỹ / combo */
      const a = M.max(S.cf * .22, S.tint * .3), col = S.tint > S.cf * .5 ? S.tcol : S.ccol, g = ctx.createRadialGradient(W / 2, H / 2, M.min(W, H) * .32, W / 2, H / 2, M.hypot(W, H) * .6);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col); ctx.save(); ctx.globalAlpha = M.min(.4, a); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    if (B.t > 0) {                                                                 /* banner Boss: nằm phía trên, không che nhân vật */
      const u = 1 - B.t / B.T, k = u < .15 ? u / .15 : u > .8 ? (1 - u) / .2 : 1, y = H * .2, w = M.min(W * .92, 420);
      ctx.save(); ctx.globalAlpha = k * .92; const g = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0); g.addColorStop(0, 'rgba(60,0,0,0)'); g.addColorStop(.2, 'rgba(60,0,0,.85)'); g.addColorStop(.8, 'rgba(60,0,0,.85)'); g.addColorStop(1, 'rgba(60,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(W / 2 - w / 2, y - 30, w, 66); ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
      ctx.font = 'bold 12px Georgia,serif'; ctx.fillStyle = '#ff9a8a'; ctx.strokeText('— BOSS XUẤT HIỆN —', W / 2 + (1 - k) * 60, y - 10); ctx.fillText('— BOSS XUẤT HIỆN —', W / 2 + (1 - k) * 60, y - 10);
      ctx.font = 'bold 26px Georgia,serif'; ctx.fillStyle = '#ffe9a8'; ctx.strokeText(B.name, W / 2 - (1 - k) * 60, y + 22); ctx.fillText(B.name, W / 2 - (1 - k) * 60, y + 22); ctx.restore();
    }
    const c = G.cmb, f = FX(), cf = f && f.combo;
    if (c && c.n >= 3 && cf) {                                                     /* HUD combo (bên phải, dưới thanh trạng thái) */
      const col = cf.color[c.tier] || '#fff', sc = 1 + c.pop * .28 + (c.flash > 0 ? .1 : 0), x = W - 14, y = M.max(150, H * .3);
      ctx.save(); ctx.globalAlpha = M.min(1, c.t * 2.2 + .3); ctx.textAlign = 'right'; ctx.translate(x, y); ctx.scale(sc, sc); ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = col;
      ctx.font = 'italic bold 30px Georgia,serif'; ctx.strokeText(c.n + ' HIT', 0, 0); ctx.fillText(c.n + ' HIT', 0, 0);
      if (c.tier > 0) { ctx.font = 'bold 13px Georgia,serif'; ctx.strokeText(cf.label[c.tier], 0, 18); ctx.fillText(cf.label[c.tier], 0, 18) }
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(-70, 24, 70, 4); ctx.fillStyle = col; ctx.fillRect(-70 * M.min(1, c.t / cf.window), 24, 70 * M.min(1, c.t / cf.window), 4);
      ctx.restore();
    }
  }

  window.DV_VFX2 = {
    ok: () => true, init: c => { if (c && c.q) qf = c.q }, reset, update, draw, dim, screen, onHit, onKill, cast, travel, orbit, ultStart, bossIntro, combo,
    stats: () => ({ fx: L.length, pt: PT.length, ult: U.on, combo: G0 && G0.cmb ? G0.cmb.n : 0, capE: CAPE[Q()], capP: CAPP[Q()] })
  };
})();
