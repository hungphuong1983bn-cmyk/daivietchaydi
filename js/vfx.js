/* ===== PHASE 10 — VFX CHIẾN ĐẤU (DV_VFX) =====
   Chỉ thay LỚP HIỆU ỨNG. Sát thương, tầm đánh, hồi chiêu, dữ liệu, save không đổi.
   Thiếu file này → game tự dùng hiệu ứng cũ (mọi chỗ gọi đều có `VF ? … : cũ`).

   Nhận diện kỹ năng (mỗi cái một HÌNH + MÀU + CHUYỂN ĐỘNG riêng):
     Kiếm Khí        lưỡi liềm xanh băng, vệt đuôi dài, chém chéo trắng khi trúng  (→ Vạn Kiếm: vàng ánh sáng)
     Lôi Động        tia sét tím phân nhánh từ trời, vết cháy + hồ quang           (→ Thiên Lôi: xanh trắng, nổ)
     Hàng Long Chưởng ấn bàn tay vàng, sóng xung kích + vết nứt đất, bụi           (→ Kháng Long: lửa)
     Phi Kiếm        kiếm ngọc lục xoay + vệt gió cuộn                              (→ Phi Kiếm Trận: vòng năng lượng)
   Tuyệt kỹ theo tướng: dbl ánh sáng · lh đao khí+lửa · nq băng · thd vạn lôi · dl độc · nb vòng năng lượng+gió · ltk kiếm quang
   Kẻ địch: đạn có lõi tối + viền đỏ (luôn khác hiệu ứng của ta), vùng báo đòn nét đứt, thiên thạch rơi, nổ.

   Chống rối mắt: trần số hiệu ứng/hạt theo đồ hoạ, ngân sách hit-effect mỗi khung hình, không phủ toàn màn hình
   (loé sáng chỉ là quầng quanh nhân vật), rung màn hình nhẹ (≤ ~4px) và tắt khi hệ thống bật giảm chuyển động. */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2, R = Math.random, eo = k => 1 - (1 - k) * (1 - k), cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + ((cl(a, 0, 1) * 100) | 0) / 100 + ')';
  const hh = n => { n = M.sin(n * 127.1 + 311.7) * 43758.5453; return n - M.floor(n) };

  /* ---- bảng màu: c = lõi sáng, g = quầng ---- */
  const PAL = {
    kiem: { c: [232, 247, 255], g: [80, 165, 255] }, kiemE: { c: [255, 250, 215], g: [255, 205, 80] },
    loi: { c: [246, 238, 255], g: [165, 95, 255] }, loiE: { c: [236, 255, 255], g: [70, 215, 255] },
    hang: { c: [255, 242, 190], g: [255, 185, 50] }, hangE: { c: [255, 232, 150], g: [255, 85, 25] },
    phi: { c: [232, 255, 242], g: [50, 220, 150] }, phiE: { c: [215, 255, 255], g: [70, 235, 255] },
    ice: { c: [240, 255, 255], g: [110, 205, 255] }, fire: { c: [255, 240, 180], g: [255, 110, 30] },
    poison: { c: [226, 255, 170], g: [110, 215, 50] }, wind: { c: [238, 255, 246], g: [130, 230, 190] },
    light: { c: [255, 253, 228], g: [255, 214, 90] }, blade: { c: [255, 232, 205], g: [255, 70, 40] },
    dark: { c: [232, 205, 255], g: [120, 60, 205] }, def: { c: [255, 248, 225], g: [255, 200, 90] }
  };
  /* đạn/vùng của KẺ ĐỊCH theo chủ đề map: lõi tối + viền đỏ để không lẫn với hiệu ứng của ta */
  const ETH = {
    plain: 'def', valley: 'def', citadel: 'def', mountain: 'def', cave: 'def', river: 'ice', sea: 'ice', snow: 'ice',
    forest: 'poison', swamp: 'poison', shadow: 'dark', void: 'dark', volcano: 'fire', desert: 'fire', heaven: 'light'
  };
  const EC = { def: [255, 70, 55], ice: [90, 190, 255], poison: [120, 220, 60], dark: [170, 90, 255], fire: [255, 130, 30], light: [255, 215, 90] };

  /* ---- trạng thái ---- */
  let G = null, Q = 2, E = [], P2 = [], pool = [], hb = 0, uel = 'light', tm = 0, ph = 0, rm = false;
  try { rm = matchMedia('(prefers-reduced-motion:reduce)').matches } catch (e) { }
  const CAPE = [48, 96, 150], CAPP = [110, 240, 420], HIT = [4, 8, 14], QN = [.4, .75, 1];
  const N3 = (a, b, c) => [a, b, c][Q];

  /* ---- hạt ---- */
  function sp(x, y, vx, vy, t, s, c, k, g, f) {
    if (P2.length >= CAPP[Q]) return;
    const o = pool.pop() || {}; o.x = x; o.y = y; o.vx = vx; o.vy = vy; o.t = o.T = t; o.s = s; o.c = c; o.k = k; o.g = g || 0; o.f = f || 4; o.r = R() * TAU; P2.push(o);
  }
  function burst(x, y, n, v, t, s, c, k, g, a0, spr, f) {
    n = M.ceil(n * QN[Q] * (rm ? .5 : 1));
    for (let i = 0; i < n; i++) { const a = a0 === undefined ? R() * TAU : a0 + (R() - .5) * spr, w = v * (.4 + R() * .6); sp(x, y, M.cos(a) * w, M.sin(a) * w, t * (.7 + R() * .6), s, c, k, g, f) }
  }
  function add(e) {
    if (E.length >= CAPE[Q] * (e.pri ? 1.6 : 1)) return null;
    e.T = e.t = e.T || .3; e.d = e.d || 0; E.push(e);
    if (!e.d && e.on) e.on(e); return e;
  }
  function shake(v) { if (!G || rm) return; G.shake = M.max(G.shake || 0, M.min(v, .6) * (Q === 0 ? .6 : 1)) }

  /* ---- hình cơ bản ---- */
  function blade(c, x1, y1, x2, y2, w) { /* lưỡi chém dạng thấu kính, dày tối đa w */
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = M.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx + nx, my + ny, x2, y2); c.quadraticCurveTo(mx - nx, my - ny, x1, y1); c.fill();
  }
  function crescent(c, r) { /* lưỡi liềm hướng +x */
    const th = 1.1, d = r * .45, ri = M.hypot(r * M.cos(th) + d, r * M.sin(th)), f = M.atan2(r * M.sin(th), r * M.cos(th) + d);
    c.beginPath(); c.arc(0, 0, r, -th, th); c.arc(-d, 0, ri, f, -f, true); c.closePath(); c.fill();
  }
  function palmPath(c, s) { /* ấn chưởng: lòng bàn tay + 4 ngón + ngón cái */
    c.beginPath(); c.moveTo(12 * s, 8 * s); c.ellipse(0, 8 * s, 12 * s, 12 * s, 0, 0, TAU);
    for (const d of [-20, -7, 6, 19]) { const a = d * M.PI / 180, l = (d === -7 || d === 6) ? 11 : 9.5, b = 9 * s; c.moveTo(M.sin(a) * (b + 2 * l * s) + 3 * s, -M.cos(a) * (b + 2 * l * s)); c.ellipse(M.sin(a) * (b + l * s), -M.cos(a) * (b + l * s), 3.3 * s, l * s, a, 0, TAU) }
    c.moveTo(-8 * s, 6 * s); c.ellipse(-14 * s, 4 * s, 3.3 * s, 8 * s, -.95, 0, TAU);
  }
  function zig(c, x0, y0, x1, y1, n, w, seed) { c.moveTo(x0, y0); for (let i = 1; i < n; i++) { const u = i / n; c.lineTo(x0 + (x1 - x0) * u + (hh(seed + i * 3.1) - .5) * w, y0 + (y1 - y0) * u + (hh(seed + i * 5.7) - .5) * w) } c.lineTo(x1, y1) }
  function mkBolt(x0, y0, x1, y1, seg, wob) { const a = [x0, y0]; for (let i = 1; i < seg; i++) { const u = i / seg; a.push(x0 + (x1 - x0) * u + (R() - .5) * wob * (1 - u * .35), y0 + (y1 - y0) * u + (R() - .5) * 8) } a.push(x1, y1); return a }
  function polyline(c, a, ox, oy) { c.beginPath(); c.moveTo(a[0] - ox, a[1] - oy); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i] - ox, a[i + 1] - oy); c.stroke() }

  /* ================= TẠO HIỆU ỨNG ================= */
  const ring = (x, y, Rr, T, w, c, a, fill, d, r0) => add({ k: 'ring', g: 1, x, y, R: Rr, T, w, c, a: a || .9, fill: fill || 0, d, r0 });
  const glow = (x, y, Rr, T, c, a, d) => add({ k: 'glow', x, y, R: Rr, T, c, a: a || .8, d });
  const scorch = (x, y, Rr, T, c, a) => add({ k: 'scorch', g: 1, x, y, R: Rr, T, c, a: a || .4 });
  const spark = (x, y, a, spr, n, v, c, s) => burst(x, y, n, v, .32, s || 2, c, 's', 0, a, spr, 5);
  const dot = (x, y, n, v, t, s, c, g, f) => burst(x, y, n, v, t, s, c, 'd', g || 0, undefined, 0, f || 3);

  function explode(x, y, Rr, pal, big) {
    glow(x, y - 8, Rr * 1.1, .22, pal.g, .75);
    ring(x, y, Rr, .36, 9, pal.g, .85, .1);
    ring(x, y, Rr * .62, .24, 5, pal.c, .8);
    scorch(x, y, Rr * .6, 1.1, [30, 18, 14], .4);
    dot(x, y - 6, 8 + (big ? 10 : 0), 150 + Rr, .5, 3.4, pal.g, -40, 3);
    burst(x, y - 6, 6 + (big ? 6 : 0), 90 + Rr * .6, .7, Rr * .22, [70, 60, 56], 'sm', -30, undefined, 0, 2.5);
    spark(x, y - 6, undefined, 0, 10, 260 + Rr, pal.c, 2);
    shake(big ? .32 : .2);
  }

  /* --- Kiếm Khí --- */
  function kiemCast(x, y, a, ev) {
    const p = ev ? PAL.kiemE : PAL.kiem;
    glow(x + M.cos(a) * 14, y + M.sin(a) * 14, 20, .14, p.g, .6);
    spark(x + M.cos(a) * 12, y + M.sin(a) * 12, a, .9, 4, 240, p.c, 1.6);
  }
  /* --- Lôi Động --- */
  function bolt(x, y, Rr, ev, d) {
    const p = ev ? PAL.loiE : PAL.loi, sx = x + (R() - .5) * 70, sy = y - 330;
    const e = { k: 'bolt', x, y, R: Rr, T: .34, d: d || 0, p, ev, pri: 1, v: [0, 1, 2].map(() => mkBolt(sx, sy, x, y, 9, ev ? 46 : 38)), br: [] };
    for (let j = 0; j < 2; j++) { const u = 3 + j * 2, bx = e.v[0][u * 2], by = e.v[0][u * 2 + 1]; e.br.push(mkBolt(bx, by, bx + (R() - .5) * 130, by + 50 + R() * 50, 4, 24)) }
    e.on = e => {
      glow(x, y - 6, Rr * 1.1, .2, p.g, .7);
      ring(x, y, Rr, .3, 5, p.g, .85, .08);
      scorch(x, y, Rr * .55, 1.0, ev ? [20, 40, 60] : [34, 18, 54], .38);
      add({ k: 'arcs', x, y: y - 8, T: .22, p, L: Rr * .8, seed: R() * 99 });
      burst(x, y - 6, 7, 230, .38, 2, p.g, 's', 0, undefined, 0, 5); dot(x, y - 6, 4, 90, .4, 3, p.c);
      if (ev) { ring(x, y, Rr * .5, .2, 4, p.c, .9, 0, 0, .1); burst(x, y - 6, 5, 110, .6, Rr * .18, [60, 70, 90], 'sm', -20, undefined, 0, 2.5) }
      shake(ev ? .2 : .1);
    };
    return add(e);
  }
  /* --- Hàng Long Chưởng --- */
  function palm(x, y, Rr, ev) {
    const p = ev ? PAL.hangE : PAL.hang, cy = y - 10;
    add({ k: 'palm', g: 1, x, y: cy, s: M.max(1.2, Rr / 75), T: .5, p, ev, pri: 1 });
    ring(x, y, Rr, .5, 11, p.g, .9, .1, 0, .3);
    ring(x, y, Rr * .7, .36, 5, p.c, .8, 0, .04, .2);
    add({ k: 'force', g: 1, x, y: cy, R: Rr, T: .42, p, pri: 1, ph: R() * TAU });
    add({ k: 'crack', g: 1, x, y, T: .8, L: Rr * .42, seed: R() * 90 });
    scorch(x, y, Rr * .3, .8, ev ? [60, 20, 8] : [70, 50, 20], .3);
    burst(x, cy, 12, Rr * 1.3, .5, 6, ev ? [150, 90, 50] : [160, 135, 90], 'sm', 0, undefined, 0, 3.2);
    dot(x, cy, 10, Rr * 1.1, .45, 3, p.g, ev ? -90 : 0, 3);
    if (ev) { add({ k: 'flames', g: 1, x, y, R: Rr, T: .7, pri: 1 }); burst(x, cy, 8, 90, .9, 3, [255, 150, 50], 'd', -120, undefined, 0, 2) }
    shake(ev ? .3 : .2);
  }

  /* ================= TUYỆT KỸ THEO TƯỚNG ================= */
  function ultBase(x, y, p) {
    glow(x, y, 120, .45, p.g, .55);
    ring(x, y, 400, .7, 5, p.g, .75, .035);
    ring(x, y, 240, .5, 4, p.c, .6, 0, .05);
    shake(.5);
  }
  const ULT = {
    dbl: { el: 'light', f(x, y) { /* 12 luồng kiếm quang */
      const p = PAL.light; ultBase(x, y, p);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .26; add({ k: 'beam', x, y, a, L: 380, r0: 26, w: 10, T: .5, d: i * .014, c: p.c, g: p.g, pri: 1, on: e => dot(x + M.cos(a) * 380, y + M.sin(a) * 380, 3, 60, .5, 3.2, p.g, -20) }) }
      add({ k: 'dash', g: 1, x, y, R: 120, T: .8, c: p.g, rot: 0, pri: 1 });
      dot(x, y, 16, 260, .8, 3.4, p.g, -60, 2.2);
    } },
    lh: { el: 'blade', f(x, y) { /* đao khí xoáy + lửa */
      const p = PAL.blade; ultBase(x, y, p);
      add({ k: 'dao', x, y, R: 400, T: .6, p, rot: R() * TAU, pri: 1 });
      add({ k: 'crack', g: 1, x, y, T: 1.1, L: 300, seed: R() * 90, rad: 1 });
      explode(x, y, 110, PAL.fire, 1);
      burst(x, y, 16, 330, .7, 3.4, [255, 140, 40], 'd', -50, undefined, 0, 2);
    } },
    nq: { el: 'ice', f(x, y) { /* rừng cọc băng */
      const p = PAL.ice; ultBase(x, y, p);
      const n = N3(14, 24, 36);
      for (let i = 0; i < n; i++) {
        const a = R() * TAU, r = 60 + M.sqrt(R()) * 320, sx = x + M.cos(a) * r, sy = y + M.sin(a) * r * .9;
        add({ k: 'spike', g: 1, x: sx, y: sy, h: 48 + R() * 40, w: 9 + R() * 5, T: .75, d: R() * .3 + r / 400 * .12, pri: 1,
          on: e => { ring(sx, sy, 24, .25, 3, p.g, .8); dot(sx, sy - 6, 3, 90, .4, 2.6, p.c, -10) },
          end: e => { burst(sx, sy - e.h * .4, 5, 170, .6, 4, p.c, 'ic', 260, undefined, 0, 2.5) } })
      }
    } },
    thd: { el: 'loi', f(x, y) { /* vạn lôi */
      const p = PAL.loi; ultBase(x, y, p); const n = N3(6, 10, 16);
      for (let i = 0; i < n; i++) { const a = R() * TAU, r = 70 + M.sqrt(R()) * 300; bolt(x + M.cos(a) * r, y + M.sin(a) * r * .9, 46, i % 3 === 0, .05 + R() * .5) }
    } },
    dl: { el: 'poison', f(x, y) { /* mưa tên độc */
      const p = PAL.poison; ultBase(x, y, p); const n = N3(14, 24, 40);
      for (let i = 0; i < n; i++) {
        const a = R() * TAU, r = 50 + M.sqrt(R()) * 330, tx = x + M.cos(a) * r, ty = y + M.sin(a) * r * .9, pr = 30 + R() * 16;
        add({ k: 'arrow', x: tx, y: ty, sx: tx - 110, sy: ty - 380, T: .26, d: R() * .5, p, pri: 1,
          end: e => { add({ k: 'puddle', g: 1, x: tx, y: ty, R: pr, T: 1.1, p, pri: 1 }); ring(tx, ty, pr * 1.2, .3, 3, p.g, .8); burst(tx, ty - 4, 4, 60, .9, 6, [120, 200, 70], 'sm', -30, undefined, 0, 2); burst(tx, ty - 4, 2, 70, .8, 3, p.c, 'p', -50, undefined, 0, 2) } })
      }
    } },
    nb: { el: 'wind', f(x, y) { /* thành đồng vòng năng lượng + gió */
      const p = PAL.wind, gd = [224, 176, 96]; ultBase(x, y, { c: [255, 236, 190], g: gd });
      add({ k: 'wall', g: 1, x, y, R: 400, T: .6, c: [255, 232, 170], g2: gd, pri: 1 });
      add({ k: 'wall', g: 1, x, y, R: 250, T: .5, d: .06, c: p.c, g2: p.g, pri: 1 });
      burst(x, y, 26, 900, .55, 2.2, p.c, 's', 0, undefined, 0, 2.2);
    } },
    ltk: { el: 'light', f(x, y) { /* kiếm quang xé trời */
      const p = PAL.light; ultBase(x, y, p);
      add({ k: 'beam', x, y, a: -.5, L: 560, two: 1, w: 24, T: .55, c: p.c, g: p.g, pri: 1 });
      add({ k: 'beam', x, y, a: .5 + M.PI, L: 560, two: 1, w: 18, T: .55, d: .09, c: p.c, g: p.g, pri: 1 });
      glow(x, y, 170, .5, p.g, .7, .05); explode(x, y, 110, { c: p.c, g: p.g }, 1);
      dot(x, y, 18, 280, .9, 3.4, p.g, -70, 2.2);
    } },
    _: { el: 'light', f(x, y) { const p = PAL.def; ultBase(x, y, p); dot(x, y, 20, 300, .6, 3, p.g, 0, 3) } }
  };

  /* ================= VẼ HIỆU ỨNG ================= */
  const ADD = { glow: 1, blade: 1, star: 1, bolt: 1, arcs: 1, beam: 1, arrow: 1, dao: 1, force: 1, fireball: 1, flames: 1 };
  function drawE(c, e, cx, cy) {
    const k = 1 - e.t / e.T, a = 1 - k, x = e.x - cx, y = e.y - cy;
    switch (e.k) {
      case 'ring': { const r = e.R * ((e.r0 === undefined ? .2 : e.r0) + (1 - (e.r0 === undefined ? .2 : e.r0)) * eo(k));
        c.strokeStyle = rgba(e.c, e.a * a); c.lineWidth = e.w * (1 - k * .7) + 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
        if (e.fill) { c.fillStyle = rgba(e.c, e.fill * a); c.fill() } break }
      case 'glow': { const g = c.createRadialGradient(x, y, 0, x, y, e.R); g.addColorStop(0, rgba(e.c, e.a * a)); g.addColorStop(1, rgba(e.c, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, e.R, 0, TAU); c.fill(); break }
      case 'scorch': { const al = cl(a * 2, 0, 1); c.fillStyle = rgba(e.c, e.a * al); c.beginPath(); c.ellipse(x, y + 2, e.R, e.R * .62, 0, 0, TAU); c.fill(); break }
      case 'blade': { const L = e.L * (.55 + .45 * eo(k)), dx = M.cos(e.a) * L, dy = M.sin(e.a) * L;
        c.fillStyle = rgba(e.g, .55 * a); blade(c, x - dx, y - dy, x + dx, y + dy, e.w * 1.9 * a + 1);
        c.fillStyle = rgba(e.c, .95 * a); blade(c, x - dx * .92, y - dy * .92, x + dx * .92, y + dy * .92, e.w * .8 * a + .5); break }
      case 'star': for (let i = 0; i < e.n; i++) { const an = e.rot + i * TAU / e.n, L = e.L * (i % 2 ? .6 : 1) * (.35 + .65 * eo(k));
        c.fillStyle = rgba(i % 2 ? e.g : e.c, .9 * a); blade(c, x, y, x + M.cos(an) * L, y + M.sin(an) * L, 3.2 * a + .5) } break;
      case 'beam': { const u = eo(cl(k * 2.2, 0, 1)), L = e.L * u, ca = M.cos(e.a), sa = M.sin(e.a), w = e.w * (1 - k * k), x0 = e.two ? x - ca * L : x + ca * e.r0, y0 = e.two ? y - sa * L : y + sa * e.r0;
        const fa = a * a; c.fillStyle = rgba(e.g, .5 * fa); blade(c, x0, y0, x + ca * L, y + sa * L, w * 1.6); c.fillStyle = rgba(e.c, .9 * fa); blade(c, x0, y0, x + ca * L, y + sa * L, w * .7); break }
      case 'bolt': { const f = M.min(2, (k * 3) | 0), v = e.v[f], al = 1 - k * k, w = e.ev ? 1.5 : 1; c.lineJoin = 'round'; c.lineCap = 'round';
        for (const s of [[9 * w, e.p.g, .32], [4 * w, e.p.g, .65], [1.8 * w, e.p.c, 1]]) { c.strokeStyle = rgba(s[1], s[2] * al); c.lineWidth = s[0]; polyline(c, v, cx, cy); if (s[0] < 6) for (const b of e.br) polyline(c, b, cx, cy) }
        if (k < .35) { const g = c.createRadialGradient(x, y, 0, x, y, e.R * .9); g.addColorStop(0, rgba(e.p.c, .55 * (1 - k * 2.5))); g.addColorStop(1, rgba(e.p.g, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, e.R * .9, 0, TAU); c.fill() } break }
      case 'arcs': { c.lineCap = 'round'; const fr = (k * 5) | 0; for (const s of [[5, e.p.g, .5], [1.6, e.p.c, 1]]) { c.strokeStyle = rgba(s[1], s[2] * a); c.lineWidth = s[0]; c.beginPath();
          for (let j = 0; j < 4; j++) { const an = hh(e.seed + j * 7 + fr * 13) * TAU, L = e.L * (.45 + hh(e.seed + j + fr) * .55); zig(c, x, y, x + M.cos(an) * L, y + M.sin(an) * L * .8, 4, 12, e.seed + j + fr * 9) } c.stroke() } break }
      case 'palm': { const s = e.s * (.65 + .35 * eo(cl(k * 3, 0, 1))), al = M.pow(a, .8); c.save(); c.translate(x, y); c.rotate(-.12);
        palmPath(c, s); c.fillStyle = rgba(e.p.g, .22 * al); c.fill(); c.strokeStyle = rgba(e.p.c, .85 * al); c.lineWidth = 2.2; c.stroke(); c.restore(); break }
      case 'force': { const n = 10; for (let i = 0; i < n; i++) { const an = e.ph + i * TAU / n, r1 = e.R * (.2 + .6 * eo(k)), r0 = r1 - e.R * (.32 * a + .06);
          c.fillStyle = rgba(i % 2 ? e.p.g : e.p.c, .75 * a); blade(c, x + M.cos(an) * r0, y + M.sin(an) * r0, x + M.cos(an) * r1, y + M.sin(an) * r1, 9 * a + 1) } break }
      case 'flames': { const n = 14; for (let i = 0; i < n; i++) { const an = i / n * TAU + e.t * .5, r = e.R * (.72 + .22 * eo(k)) + M.sin(e.t * 20 + i * 3) * 3, h = (16 + 16 * hh(i + 3.3)) * a, fx = x + M.cos(an) * r, fy = y + M.sin(an) * r;
          c.fillStyle = rgba([255, 100, 25], .55 * a); blade(c, fx, fy, fx + (hh(i) - .5) * 8, fy - h * 1.6, 8); c.fillStyle = rgba([255, 230, 140], .8 * a); blade(c, fx, fy, fx, fy - h, 4) } break }
      case 'crack': { c.strokeStyle = rgba([25, 14, 8], .5 * cl(a * 1.6, 0, 1)); c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); const n = e.rad ? 9 : 6;
        for (let i = 0; i < n; i++) { const an = hh(e.seed + i) * TAU + i * TAU / n, L = e.L * (.55 + .45 * hh(e.seed + i * 2)) * eo(cl(k * 3, 0, 1)); zig(c, x, y, x + M.cos(an) * L, y + M.sin(an) * L * .6, 5, 16, e.seed + i * 4) } c.stroke(); break }
      case 'dao': { const r = e.R * eo(k), ang = e.rot + k * TAU * 1.05; c.lineCap = 'round';
        for (let t = 3; t >= 0; t--) { const ra = r * (1 - t * .05), al = (1 - t * .24) * a;
          for (let j = 0; j < 2; j++) { const b = ang - t * .22 + j * M.PI; c.strokeStyle = rgba(e.p.g, .6 * al); c.lineWidth = 16 * a + 3; c.beginPath(); c.arc(x, y, ra, b - .9, b + .9); c.stroke();
            if (t === 0) { c.strokeStyle = rgba(e.p.c, .95 * al); c.lineWidth = 4 * a + 1; c.beginPath(); c.arc(x, y, ra, b - .9, b + .9); c.stroke() } } } break }
      case 'spike': { const gr = eo(cl(k / .22, 0, 1)), al = k > .65 ? 1 - (k - .65) / .35 : 1, h = e.h * gr, w = e.w;
        c.fillStyle = rgba([150, 220, 255], .25 * al); c.beginPath(); c.ellipse(x, y + 2, w * 2.2, w * .9, 0, 0, TAU); c.fill();
        c.fillStyle = rgba([205, 240, 255], .95 * al); c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - 1, y - h); c.lineTo(x, y + 3); c.closePath(); c.fill();
        c.fillStyle = rgba([95, 175, 235], .95 * al); c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + 1, y - h); c.lineTo(x, y + 3); c.closePath(); c.fill();
        c.strokeStyle = rgba([240, 255, 255], .9 * al); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h); c.lineTo(x + w, y); c.stroke(); break }
      case 'arrow': { const u = k, px = e.sx + (e.x - e.sx) * u - cx, py = e.sy + (e.y - e.sy) * u - cy, dx = e.x - e.sx, dy = e.y - e.sy, l = M.hypot(dx, dy), ux = dx / l, uy = dy / l;
        c.fillStyle = rgba(e.p.g, .6); blade(c, px - ux * 90, py - uy * 90, px, py, 11); c.fillStyle = rgba(e.p.c, 1); blade(c, px - ux * 40, py - uy * 40, px + ux * 8, py + uy * 8, 4.6); c.fillStyle = rgba([60, 140, 30], 1); c.beginPath(); c.arc(px + ux * 6, py + uy * 6, 3, 0, TAU); c.fill(); break }
      case 'puddle': { const r = e.R * eo(cl(k * 6, 0, 1)), al = cl(a * 1.6, 0, 1); c.fillStyle = rgba(e.p.g, .3 * al); c.beginPath(); c.ellipse(x, y, r, r * .66, 0, 0, TAU); c.fill();
        c.strokeStyle = rgba(e.p.c, .4 * al); c.lineWidth = 1.6; c.stroke(); break }
      case 'wall': { const r = e.R * eo(k), n = 18, gp = TAU / n; c.lineCap = 'butt';
        for (let i = 0; i < n; i++) { const b = i * gp + k * .6; c.strokeStyle = rgba(i % 2 ? e.c : e.g2, .85 * a); c.lineWidth = 9 * a + 2; c.beginPath(); c.arc(x, y, r, b, b + gp * .78); c.stroke() }
        c.strokeStyle = rgba(e.g2, .5 * a); c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * .93, 0, TAU); c.stroke(); break }
      case 'dash': { c.setLineDash([14, 10]); c.lineDashOffset = -e.t * 80; c.strokeStyle = rgba(e.c, .6 * a); c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, e.R * (.6 + .4 * eo(k)), 0, TAU); c.stroke(); c.setLineDash([]); break }
      case 'fireball': break;
    }
  }

  /* ---- hạt ---- */
  function drawP(c, cx, cy, add) {
    for (let i = 0; i < P2.length; i++) {
      const p = P2[i], k = p.k, isA = k === 's' || k === 'd';
      if (isA !== add) continue;
      const a = p.t / p.T, x = p.x - cx, y = p.y - cy;
      if (k === 's') { c.strokeStyle = rgba(p.c, a); c.lineWidth = p.s * a + .6; c.beginPath(); c.moveTo(x - p.vx * .05, y - p.vy * .05); c.lineTo(x, y); c.stroke() }
      else if (k === 'd') { c.fillStyle = rgba(p.c, a); c.beginPath(); c.arc(x, y, p.s * (.4 + .6 * a), 0, TAU); c.fill() }
      else if (k === 'sm') { c.fillStyle = rgba(p.c, .28 * a); c.beginPath(); c.arc(x, y, p.s * (1.7 - a * .8), 0, TAU); c.fill() }
      else if (k === 'p') { c.strokeStyle = rgba(p.c, .8 * a); c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, p.s * (1.4 - a * .6), 0, TAU); c.stroke() }
      else if (k === 'l') { c.fillStyle = rgba(p.c, .85 * a); c.beginPath(); c.ellipse(x, y, p.s * 2, p.s * .8, M.atan2(p.vy, p.vx), 0, TAU); c.fill() }
      else if (k === 'ic') { c.save(); c.translate(x, y); c.rotate(p.r + p.t * 9); c.fillStyle = rgba(p.c, a); c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * .5, p.s * .6); c.lineTo(-p.s * .5, p.s * .6); c.fill(); c.restore() }
    }
  }

  /* ================= CẬP NHẬT ================= */
  function update(dt, g, q) {
    if (g !== G) { G = g; E.length = 0; for (const p of P2) pool.length < 500 && pool.push(p); P2.length = 0 }
    Q = q; hb = HIT[Q]; tm += dt; G.src = null;
    let j = 0;
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.d > 0) { e.d -= dt; if (e.d <= 0 && e.on) e.on(e); E[j++] = e; continue }
      e.t -= dt; if (e.u) e.u(e, dt);
      if (e.t <= 0) { if (e.end) e.end(e); continue } E[j++] = e;
    }
    E.length = j; j = 0;
    for (let i = 0; i < P2.length; i++) {
      const p = P2[i]; p.t -= dt; if (p.t <= 0) { pool.length < 500 && pool.push(p); continue }
      const f = M.max(0, 1 - dt * p.f); p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= f; p.vy *= f; P2[j++] = p;
    }
    P2.length = j;
    /* vệt đuôi đạn của ta + tia lửa nhỏ */
    const TL = N3(4, 7, 11);
    for (const p of g.pr) { const t = p.tr || (p.tr = []); const lx = t.length ? t[0] : p.x, ly = t.length ? t[1] : p.y;
      if (!t.length || M.hypot(p.x - lx, p.y - ly) > 10) { t.unshift(p.x, p.y); if (t.length > TL * 2) t.length = TL * 2 }
      if (Q > 0 && p.k === 'kiem' && R() < .5) sp(p.x + (R() - .5) * 8, p.y + (R() - .5) * 8, (R() - .5) * 40, (R() - .5) * 40, .3, 2.2, g.evo.kiem ? PAL.kiemE.g : PAL.kiem.g, 'd', 0, 3) }
    for (const p of g.ep) { const t = p.tr || (p.tr = []); const lx = t.length ? t[0] : p.x, ly = t.length ? t[1] : p.y;
      if (!t.length || M.hypot(p.x - lx, p.y - ly) > 9) { t.unshift(p.x, p.y); if (t.length > TL * 2) t.length = TL * 2 } }
    /* gió cuộn quanh Phi Kiếm */
    if (g.sk.phi && Q > 0 && R() < dt * 9 * (g.sk.phi > 2 ? 1.5 : 1)) {
      const P = g.p, n = g.sk.phi + 1 + (g.evo.phi ? 3 : 0), i = (R() * n) | 0, an = g.orbit + i / n * TAU, x = P.x + M.cos(an) * 62, y = P.y + M.sin(an) * 62 - 10;
      sp(x, y, -M.sin(an) * -60 + (R() - .5) * 20, M.cos(an) * -60 + (R() - .5) * 20, .45, 2.6, g.evo.phi ? PAL.phiE.c : PAL.phi.c, 'l', 0, 3);
    }
  }

  /* ================= VẼ (móc vào draw) ================= */
  function setC(c, mode) { const m = mode && Q > 0 ? 'lighter' : 'source-over'; if (c.globalCompositeOperation !== m) c.globalCompositeOperation = m }
  function ground(c, cx, cy, W, H) {
    for (const e of E) { if (!e.g || e.d > 0 || M.abs(e.x - cx - W / 2) > W + 420 || M.abs(e.y - cy - H / 2) > H + 420) continue; setC(c, ADD[e.k]); drawE(c, e, cx, cy) }
    setC(c, 0);
  }
  function air(c, cx, cy, W, H) {
    c.save(); c.lineCap = 'round';
    setC(c, 0); drawP(c, cx, cy, false);
    for (let pass = 0; pass < 2; pass++) for (const e of E) {
      if (e.g || e.d > 0 || !!ADD[e.k] !== !!pass || M.abs(e.x - cx - W / 2) > W + 420 || M.abs(e.y - cy - H / 2) > H + 420) continue;
      setC(c, pass); drawE(c, e, cx, cy);
    }
    setC(c, 1); drawP(c, cx, cy, true); c.restore(); setC(c, 0);
  }
  /* đạn của ta: Kiếm Khí = lưỡi liềm + vệt đuôi */
  function proj(c, p, cx, cy) {
    const ev = G && G.evo && G.evo.kiem, pal = ev ? PAL.kiemE : PAL.kiem, x = p.x - cx, y = p.y - cy, t = p.tr || [];
    c.save(); c.lineCap = 'round'; setC(c, 1);
    let px = x, py = y; const n = t.length / 2;
    for (let i = 0; i < n; i++) { const u = 1 - (i + 1) / (n + 1), nx = t[i * 2] - cx, ny = t[i * 2 + 1] - cy;
      c.strokeStyle = rgba(pal.g, .55 * u); c.lineWidth = (ev ? 16 : 12) * u; c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
      c.strokeStyle = rgba(pal.c, .8 * u); c.lineWidth = (ev ? 5 : 3.4) * u; c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke(); px = nx; py = ny }
    c.translate(x, y); c.rotate(p.a); const s = ev ? 1.25 : 1;
    c.fillStyle = rgba(pal.g, .5); crescent(c, 30 * s); c.fillStyle = rgba(pal.c, .98); crescent(c, 22 * s);
    setC(c, 0); c.restore();
  }
  /* Phi Kiếm: kiếm ngọc + vệt gió + vòng năng lượng khi tiến hoá */
  function phi(c, P, cx, cy, n, orb, ev) {
    const pal = ev ? PAL.phiE : PAL.phi, ox = P.x - cx, oy = P.y - 10 - cy;
    c.save(); c.lineCap = 'round';
    if (ev) { setC(c, 1); c.setLineDash([10, 8]); c.lineDashOffset = -tm * 50; c.strokeStyle = rgba(pal.g, .5); c.lineWidth = 2; c.beginPath(); c.arc(ox, oy, 62, 0, TAU); c.stroke(); c.setLineDash([]);
      c.fillStyle = rgba(pal.g, .06); c.fill() }
    for (let i = 0; i < n; i++) {
      const a = orb + i / n * TAU, x = ox + M.cos(a) * 62, y = oy + M.sin(a) * 62;
      setC(c, 1);
      for (const s of [[.95, 2.5, .14], [.6, 4.5, .25], [.3, 7, .45]]) { c.strokeStyle = rgba(pal.g, s[2]); c.lineWidth = s[1]; c.beginPath(); c.arc(ox, oy, 62, a - s[0], a); c.stroke() }
      c.save(); c.translate(x, y); c.rotate(a + M.PI / 2);
      c.fillStyle = rgba(pal.g, .3); c.beginPath(); c.ellipse(0, -3, 5, 14, 0, 0, TAU); c.fill(); setC(c, 0);
      const g = c.createLinearGradient(0, -15, 0, 6); g.addColorStop(0, '#ffffff'); g.addColorStop(1, ev ? '#4fe6ff' : '#37d99a');
      c.fillStyle = g; c.strokeStyle = '#0f5a44'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -19); c.lineTo(5, 5); c.lineTo(-5, 5); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e8b84a'; c.fillRect(-7, 5, 14, 3.4); c.fillStyle = '#7a4a1a'; c.fillRect(-1.6, 8, 3.2, 5); c.restore();
    }
    setC(c, 0); c.restore();
  }
  /* đạn kẻ địch: lõi tối + viền đỏ + quầng theo chủ đề */
  function ep(c, p, cx, cy, g) {
    const th = ETH[g.ch && g.ch.theme] || 'def', col = EC[th], x = p.x - cx, y = p.y - cy, t = p.tr || [];
    c.save(); c.lineCap = 'round'; let px = x, py = y; const n = t.length / 2;
    for (let i = 0; i < n; i++) { const u = 1 - (i + 1) / (n + 1), nx = t[i * 2] - cx, ny = t[i * 2 + 1] - cy; c.strokeStyle = rgba(col, .4 * u); c.lineWidth = 9 * u; c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke(); px = nx; py = ny }
    c.fillStyle = rgba(col, .3); c.beginPath(); c.arc(x, y, 12, 0, TAU); c.fill();
    c.fillStyle = '#26080e'; c.beginPath(); c.arc(x, y, 6.5, 0, TAU); c.fill();
    c.strokeStyle = rgba([255, 70, 60], .95); c.lineWidth = 2; c.stroke();
    c.fillStyle = rgba([255, 225, 210], .9); c.beginPath(); c.arc(x - 1.5, y - 1.5, 1.8, 0, TAU); c.fill(); c.restore();
  }
  /* vùng báo đòn của kẻ địch (giữ đúng bán kính sát thương) + thiên thạch rơi */
  function zone(c, z, x, y, p) {
    c.save();
    c.fillStyle = 'rgba(255,50,40,' + (.1 + .2 * p) + ')'; c.beginPath(); c.arc(x, y, z.r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,100,70,.95)'; c.lineWidth = 2; c.setLineDash([12, 8]); c.lineDashOffset = -tm * 45; c.beginPath(); c.arc(x, y, z.r, 0, TAU); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(255,200,170,.9)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, z.r * p, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,90,60,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 7, y - 7); c.lineTo(x + 7, y + 7); c.moveTo(x + 7, y - 7); c.lineTo(x - 7, y + 7); c.stroke();
    if (z.k === 'm' && z.t < .5) { const u = z.t / .5, hx = x + 80 * u, hy = y - 480 * u; setC(c, 1);
      c.lineCap = 'round'; c.strokeStyle = 'rgba(255,110,30,.4)'; c.lineWidth = 20; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 80 * .5, hy - 480 * .5 * .45); c.stroke();
      c.strokeStyle = 'rgba(255,230,150,.85)'; c.lineWidth = 7; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 80 * .2, hy - 480 * .2 * .45); c.stroke();
      c.fillStyle = 'rgba(255,120,30,.55)'; c.beginPath(); c.arc(hx, hy, 17, 0, TAU); c.fill(); c.fillStyle = '#fff1b8'; c.beginPath(); c.arc(hx, hy, 9, 0, TAU); c.fill(); setC(c, 0) }
    c.restore();
  }
  /* loé sáng: quầng quanh nhân vật, KHÔNG phủ toàn màn hình */
  function flash(c, W, H, fw, P, cx, cy) {
    const a = M.min(fw, .6) * .5, x = P.x - cx, y = P.y - cy - 10, g = c.createRadialGradient(x, y, 0, x, y, 300);
    g.addColorStop(0, 'rgba(255,244,214,' + a + ')'); g.addColorStop(1, 'rgba(255,244,214,0)'); c.fillStyle = g; c.fillRect(x - 300, y - 300, 600, 600);
  }

  /* ================= SỰ KIỆN CHIẾN ĐẤU ================= */
  function srcPal(src) {
    const ev = G && G.evo || {};
    return src === 'kiem' ? (ev.kiem ? PAL.kiemE : PAL.kiem) : src === 'loi' ? (ev.loi ? PAL.loiE : PAL.loi) : src === 'hang' ? (ev.hang ? PAL.hangE : PAL.hang) :
      src === 'phi' ? (ev.phi ? PAL.phiE : PAL.phi) : src === 'ult' ? PAL[uel] || PAL.def : PAL.def;
  }
  /* trúng đòn: mỗi kỹ năng một kiểu */
  function onHit(e, src, cr, d) {
    if (!G) return; const P = G.p, x = e.x, y = e.y - e.r * .9, a = M.atan2(e.y - P.y, e.x - P.x), s = cl(e.r / 14, .8, 2.2), p = srcPal(src), big = e.boss || e.mb, ev = G.evo || {};
    if (hb <= 0) { if (R() < .5) dot(x, y, 1, 80, .25, 2.2, p.g); return } hb--;
    switch (src) {
      case 'kiem': add({ k: 'blade', x, y, a: a + 1.15, L: 28 * s, w: 6, T: .22, c: p.c, g: p.g }); if (cr) add({ k: 'blade', x, y, a: a - 1.15, L: 28 * s, w: 6, T: .22, c: p.c, g: p.g });
        spark(x, y, a, 1.4, 4, 250, p.g, 1.8); if (ev.kiem) dot(x, y, 2, 110, .5, 2.6, p.c, -40); break;
      case 'loi': add({ k: 'arcs', x, y, T: .2, p, L: 20 * s, seed: R() * 99 }); burst(x, y, 4, 200, .3, 2, p.g, 's', 0, undefined, 0, 5); break;
      case 'hang': add({ k: 'star', x, y, n: 8, L: 24 * s, rot: R(), T: .26, c: p.c, g: p.g }); burst(x, y + e.r * .7, 3, 90, .45, 5 * s, ev.hang ? [150, 80, 40] : [165, 140, 100], 'sm', 0, a, 2.4, 3);
        if (ev.hang) dot(x, y, 3, 90, .6, 2.8, [255, 150, 50], -110, 2); break;
      case 'phi': add({ k: 'blade', x, y, a: a + .6, L: 15 * s, w: 4, T: .18, c: p.c, g: p.g }); burst(x, y, 2, 90, .5, 3, p.c, 'l', 0, a + 1.57, 2, 3); break;
      case 'ult': add({ k: 'star', x, y, n: 6, L: 22 * s, rot: R(), T: .24, c: p.c, g: p.g }); dot(x, y, 2, 140, .4, 2.6, p.g); break;
      default: add({ k: 'star', x, y, n: 4, L: 14 * s, rot: R(), T: .18, c: PAL.def.c, g: PAL.def.g }); spark(x, y, a, 1.6, 3, 200, PAL.def.g, 1.6);
    }
    if (cr) { add({ k: 'star', x, y, n: 8, L: 34 * s, rot: R(), T: .3, c: [255, 240, 200], g: [255, 140, 30] }); ring(x, y, 28 * s, .22, 3, [255, 170, 60], .9); if (big) shake(.1) }
  }
  /* tiêu diệt: ngân sách chung với hit; bỏ qua cú "dọn sạch" 9999 */
  function kill(e, src, d) {
    if (!G || d >= 9999 || hb <= 0) return; hb--; const x = e.x, y = e.y - e.r * .8, p = srcPal(src), ev = G.evo || {};
    if (src === 'hang' && ev.hang) { glow(x, y, 34, .2, PAL.fire.g, .6); dot(x, y, 6, 150, .6, 3, [255, 140, 40], -90, 2.4) }
    else if (src === 'loi') { scorch(x, e.y, 18, .8, [30, 18, 40], .3); burst(x, y, 4, 160, .3, 2, p.g, 's', 0, undefined, 0, 5) }
    else if (src === 'hang' || src === 'ult') dot(x, y, 5, 130, .5, 2.8, p.g);
    else burst(x, y, 4, 130, .45, 2.4, p.g, 'd', 0, undefined, 0, 3);
  }
  function boom(x, y, Rr) { explode(x, y, Rr, PAL.fire, Rr > 90) }
  function zoneHit(z) {
    if (z.k === 'm') { explode(z.x, z.y, z.r, PAL.fire, 1); glow(z.x, z.y - 10, z.r * 1.3, .3, PAL.fire.g, .5) }
    else { ring(z.x, z.y, z.r, .4, 9, [255, 200, 150], .9, .1); ring(z.x, z.y, z.r * .6, .3, 5, [255, 120, 80], .8); add({ k: 'crack', g: 1, x: z.x, y: z.y, T: .9, L: z.r * .6, seed: R() * 90 });
      burst(z.x, z.y - 6, 10, z.r * 1.2, .55, 6, [150, 125, 100], 'sm', 0, undefined, 0, 3); shake(.18) }
  }
  function bossDie(e) {
    const x = e.x, y = e.y, r = M.max(60, e.r * 2.2);
    for (let i = 0; i < 4; i++) { const a = R() * TAU, d = R() * r * .8; add({ k: 'glow', x: x + M.cos(a) * d, y: y + M.sin(a) * d, R: r * .7, T: .3, c: PAL.fire.g, a: .5, d: i * .12, pri: 1, on: e2 => { explode(e2.x, e2.y, r * .55, PAL.fire, 1) } }) }
    ring(x, y, 260, .8, 10, [255, 220, 150], .9, .04); ring(x, y, 160, .6, 6, PAL.light.c, .8, 0, .1); dot(x, y, 24, 360, 1.0, 3.8, [255, 200, 90], -40, 2); shake(.6);
  }
  function heal(P) { ring(P.x, P.y, 56, .5, 4, [110, 255, 160], .85, .06); burst(P.x, P.y - 12, 8, 70, .8, 2.6, [140, 255, 180], 'd', -90, -1.57, 3.4, 2) }
  function cast(kind, x, y, a, ev) { if (kind === 'kiem') kiemCast(x, y, a, ev) }
  function ult(P, hid) { const U = ULT[hid] || ULT._; uel = U.el; U.f(P.x, P.y - 12) }
  function reset() { E.length = 0; for (const p of P2) pool.length < 500 && pool.push(p); P2.length = 0; G = null }

  window.DV_VFX = { ok: () => true, update, ground, air, proj, phi, ep, zone, flash, onHit, kill, boom, zoneHit, bossDie, heal, cast, bolt, palm, ult, shake, reset,
    stats: () => ({ fx: E.length, pt: P2.length, hb }), ults: () => Object.keys(ULT).filter(k => k !== '_') };
})();
