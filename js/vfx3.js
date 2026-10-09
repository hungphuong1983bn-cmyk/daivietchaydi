/* ===== PHASE 14 — VFX KIẾM HIỆP CAO CẤP (DV_VFX3) =====
   Lớp hiệu ứng nâng cấp, CHỈ THAY HÌNH ẢNH. Sát thương · hồi chiêu · điều khiển · dữ liệu Skill không đổi.
   Cách gắn: bọc (wrap) các hàm của DV_VFX (js/vfx.js) → thiếu file này game tự chạy hiệu ứng Phase 10/13 như cũ.

   Bộ dựng hình (Canvas 2D, additive 'lighter'):
     ribbon   dải sáng thon theo quỹ đạo thật (vệt kiếm / vệt phi kiếm) — 3 lớp: quầng · thân · lõi trắng
     arcBlade đường chém cong có đầu dày – đuôi thon, quét theo thời gian (không còn một hình lưỡi liềm chung)
     lens     đường cắt thẳng dạng thấu kính (kiếm quang, vết chém chéo khi trúng)
     ring     sóng xung kích 3 lớp + vòng dư chấn + dải tối giả khúc xạ
     rune     pháp trận xoay dưới đất (vòng · vạch · bát quái)
     vortex   các nhánh xoáy cuộn ra ngoài (đao khí, gió, băng, độc)
     bolt3    sét phân nhánh đệ quy
     sword    kiếm ảnh lao xuống + để lại vệt, cắm xuống thì nổ
     hạt      mote (theo quỹ đạo cực) · streak (tia) · shard (mảnh năng lượng) · dust (bụi/sương)
   Phân lớp: back (dưới nhân vật) · front (trên nhân vật) · bokeh tiền cảnh có thị sai nhẹ → cảm giác chiều sâu.
   Hiệu năng: sprite quầng sáng dựng sẵn (không tạo gradient mỗi khung), chuỗi màu cache, pool đối tượng,
   trần số hiệu ứng/hạt theo đồ hoạ Thấp/Vừa/Cao, ngân sách hiệu ứng trúng đòn mỗi khung, tôn trọng giảm chuyển động. */
(function () {
  'use strict';
  const D = window.DV_VFX; if (!D || D.__v3) return;
  const M = Math, TAU = M.PI * 2, R = Math.random, cos = M.cos, sin = M.sin, hyp = M.hypot;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v, eo = k => 1 - (1 - k) * (1 - k), eo3 = k => 1 - (1 - k) * (1 - k) * (1 - k);
  const rr = (a, b) => a + R() * (b - a);
  let rm = false; try { rm = matchMedia('(prefers-reduced-motion:reduce)').matches } catch (e) { }

  /* ---------- màu ---------- */
  const PK = { /* c = lõi · m = thân · g = quầng */
    kiem: { c: [240, 251, 255], m: [150, 216, 255], g: [60, 135, 255] }, kiemE: { c: [255, 251, 228], m: [255, 226, 130], g: [255, 165, 40] },
    loi: { c: [250, 244, 255], m: [200, 160, 255], g: [135, 75, 255] }, loiE: { c: [236, 255, 255], m: [140, 236, 255], g: [50, 185, 255] },
    hang: { c: [255, 246, 205], m: [255, 214, 110], g: [255, 155, 35] }, hangE: { c: [255, 236, 172], m: [255, 150, 60], g: [255, 65, 20] },
    phi: { c: [236, 255, 246], m: [130, 246, 200], g: [30, 200, 140] }, phiE: { c: [222, 255, 255], m: [120, 240, 255], g: [40, 200, 238] },
    ice: { c: [246, 255, 255], m: [170, 232, 255], g: [80, 175, 255] }, fire: { c: [255, 246, 205], m: [255, 170, 70], g: [255, 85, 20] },
    poison: { c: [238, 255, 196], m: [160, 236, 80], g: [60, 175, 40] }, wind: { c: [255, 242, 205], m: [238, 204, 122], g: [196, 142, 58] },
    light: { c: [255, 254, 238], m: [255, 228, 142], g: [255, 188, 56] }, blade: { c: [255, 238, 214], m: [255, 138, 88], g: [255, 56, 34] },
    def: { c: [255, 248, 225], m: [255, 214, 130], g: [255, 170, 60] }
  };
  const HEROPAL = { dbl: 'light', lh: 'blade', nq: 'ice', thd: 'loi', dl: 'poison', nb: 'wind', ltk: 'light' };
  const WHITE = [255, 255, 255], DARK = [10, 8, 20], DUST = [150, 136, 116], MIST = { ice: [200, 232, 255], poison: [120, 200, 90], wind: [235, 220, 180], fire: [90, 60, 50], def: [190, 180, 160] };
  /* chuỗi rgba cache theo (mảng màu, mức alpha) — mảng màu là hằng nên cache an toàn */
  function K(c, a) { a = a < 0 ? 0 : a > 1 ? 1 : a; const i = (a * 24 + .5) | 0, s = c.__s || (c.__s = []); return s[i] || (s[i] = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (i / 24).toFixed(3) + ')') }

  /* ---------- sprite quầng sáng dựng sẵn ---------- */
  const GS = new Map();
  function gs(c) {
    const key = c[0] + ',' + c[1] + ',' + c[2]; let s = GS.get(key);
    if (!s) { s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(' + key + ',1)'); g.addColorStop(.22, 'rgba(' + key + ',.6)'); g.addColorStop(.55, 'rgba(' + key + ',.16)'); g.addColorStop(1, 'rgba(' + key + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); GS.set(key, s) }
    return s;
  }
  function glow(c, col, x, y, r, a) { if (a <= .01 || r < .5) return; c.globalAlpha = a > 1 ? 1 : a; c.drawImage(gs(col), x - r, y - r, r * 2, r * 2) }

  /* ---------- trạng thái ---------- */
  let G = null, Q = 2, tm = 0, hb = 0, uAcc = 0, uHero = 'light', flip = 1, wasUlt = 0;
  const CAPE = [34, 80, 140], CAPP = [150, 340, 560], HITB = [2, 4, 7], QN = [.4, .75, 1];
  const N3 = (a, b, c) => [a, b, c][Q];
  const FX = [], PT = [], poolF = [], poolP = [];
  const cnt = n => M.max(1, M.round(n * QN[Q] * (rm ? .5 : 1)));

  function add(o) {
    if (FX.length >= CAPE[Q] * (o.pri ? 1.5 : 1)) return null;
    const e = poolF.pop() || {}; for (const k in e) delete e[k]; Object.assign(e, o); e.T = e.t = e.T || e.t || .3; e.d = e.d || 0; FX.push(e); return e;
  }
  /* hạt: k = m mote · s streak · h shard · d dust · i ice · f feather(lá) */
  function P(k, x, y, vx, vy, t, s, c, z, g, f) {
    if (PT.length >= CAPP[Q]) return null;
    const p = poolP.pop() || {}; p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = p.T = t; p.s = s; p.c = c; p.z = z || 0; p.g = g || 0; p.f = f === undefined ? 2.5 : f; p.o = 0; p.r = R() * TAU; p.vr = (R() - .5) * 12; p.tw = R() * TAU; PT.push(p); return p;
  }
  /* hạt bay theo quỹ đạo cực quanh tâm (cx,cy): ang += av·dt, rad += rv·dt */
  function PO(k, cx, cy, ang, rad, av, rv, t, s, c, z, sq, lift) {
    const p = P(k, cx, cy, 0, 0, t, s, c, z, 0, 0); if (!p) return null;
    p.o = 1; p.cx = cx; p.cy = cy; p.a = ang; p.rad = rad; p.av = av; p.rv = rv; p.sq = sq === undefined ? .8 : sq; p.lift = lift || 0; return p;
  }
  function shake(v) { if (rm || !G) return; G.shake = M.max(G.shake || 0, M.min(v, .6) * (Q === 0 ? .6 : 1)) }

  /* ================= HÌNH CƠ BẢN ================= */
  const LX = new Float32Array(80), LY = new Float32Array(80), RX = new Float32Array(80), RY = new Float32Array(80);
  /* dải sáng thon theo chuỗi điểm (đầu → đuôi). pts phẳng [x,y,...], ox/oy trừ camera, n điểm, w = bề rộng tối đa */
  function ribbon(c, pts, n, ox, oy, w, col, a, pw) {
    if (n < 2 || a <= .01) return; if (n > 78) n = 78; pw = pw || 1.2;
    for (let i = 0; i < n; i++) {
      const i0 = i ? i - 1 : 0, i1 = i < n - 1 ? i + 1 : n - 1, dx = pts[i1 * 2] - pts[i0 * 2], dy = pts[i1 * 2 + 1] - pts[i0 * 2 + 1], l = hyp(dx, dy) || 1,
        u = i / (n - 1), ww = w * M.pow(1 - u, pw) * (i > 1 ? 1 : i ? .72 : .22), x = pts[i * 2] - ox, y = pts[i * 2 + 1] - oy, nx = -dy / l * ww, ny = dx / l * ww;
      LX[i] = x + nx; LY[i] = y + ny; RX[i] = x - nx; RY[i] = y - ny;
    }
    c.fillStyle = K(col, a); c.beginPath(); c.moveTo(LX[0], LY[0]);
    for (let i = 1; i < n; i++) c.lineTo(LX[i], LY[i]);
    for (let i = n - 1; i >= 0; i--) c.lineTo(RX[i], RY[i]);
    c.closePath(); c.fill();
  }
  /* đường chém cong trên elip tâm (x,y) bán kính rx,ry xoay rot, từ góc ua → ub (ub có thể nhỏ hơn ua). sym=1: hai đầu nhọn · 0: đầu dày, đuôi thon */
  function arcBlade(c, x, y, rx, ry, rot, ua, ub, w, col, a, sym, off) {
    if (a <= .01) return; const N = Q === 0 ? 12 : 22, cr = cos(rot), sr = sin(rot); off = off || 0;
    c.fillStyle = K(col, a); c.beginPath();
    for (let pass = 0; pass < 2; pass++) for (let j = 0; j <= N; j++) {
      const i = pass ? N - j : j, u = i / N, t = ua + (ub - ua) * u, th = sym ? M.pow(sin(M.PI * u), .8) : M.pow(u, .75) * (1 - M.pow(u, 9) * .96),
        d = off + (pass ? -.62 : .38) * w * th, ex = (rx + d) * cos(t), ey = (ry + d * (ry / rx)) * sin(t), px = x + ex * cr - ey * sr, py = y + ex * sr + ey * cr;
      if (!pass && !j) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
  }
  /* thấu kính thẳng */
  function lens(c, x1, y1, x2, y2, w, col, a) {
    if (a <= .01) return; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = hyp(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w;
    c.fillStyle = K(col, a); c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx + nx, my + ny, x2, y2); c.quadraticCurveTo(mx - nx, my - ny, x1, y1); c.fill();
  }
  function star4(c, x, y, L, w, rot, col, a) { lens(c, x - cos(rot) * L, y - sin(rot) * L, x + cos(rot) * L, y + sin(rot) * L, w, col, a); lens(c, x - cos(rot + 1.5708) * L * .62, y - sin(rot + 1.5708) * L * .62, x + cos(rot + 1.5708) * L * .62, y + sin(rot + 1.5708) * L * .62, w * .8, col, a) }
  /* sét đệ quy (điểm giữa lệch dần) → mảng phẳng */
  function frac(x0, y0, x1, y1, disp, depth, out) {
    if (depth <= 0) { out.push(x1, y1); return } const mx = (x0 + x1) / 2 + (R() - .5) * disp, my = (y0 + y1) / 2 + (R() - .5) * disp * .8;
    frac(x0, y0, mx, my, disp * .52, depth - 1, out); frac(mx, my, x1, y1, disp * .52, depth - 1, out);
  }
  function mkBolt(x0, y0, x1, y1, disp, depth, nb) {
    const main = [x0, y0]; frac(x0, y0, x1, y1, disp, depth, main); const br = [];
    for (let i = 0; i < nb; i++) { const j = 2 + ((R() * (main.length / 2 - 4)) | 0) * 2, bx = main[j], by = main[j + 1], a = M.atan2(y1 - y0, x1 - x0) + (R() - .5) * 1.6, L = hyp(x1 - x0, y1 - y0) * rr(.16, .32), b = [bx, by]; frac(bx, by, bx + cos(a) * L, by + sin(a) * L, disp * .6, depth - 1, b); br.push(b) }
    return { m: main, b: br };
  }
  function polyStroke(c, a, ox, oy) { c.beginPath(); c.moveTo(a[0] - ox, a[1] - oy); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i] - ox, a[i + 1] - oy); c.stroke() }

  /* ================= TẠO HIỆU ỨNG ================= */
  const ring = (x, y, Rr, T, w, p, o) => add(Object.assign({ k: 'ring', z: 0, x, y, R: Rr, T, w, c: p.c, g: p.g, a: 1, fl: .42, r0: .15, dk: 0 }, o));
  const flash = (x, y, Rr, T, p, o) => add(Object.assign({ k: 'fl', z: 1, x, y, R: Rr, T, c: p.c, g: p.g, rot: R() * 3, st: 1 }, o));
  const cut = (x, y, a, L, w, T, p, o) => add(Object.assign({ k: 'cut', z: 1, x, y, a, L, w, T, c: p.c, g: p.g }, o));
  const slash = (x, y, rx, ry, rot, ua, ub, w, T, p, o) => add(Object.assign({ k: 'sl', z: 1, x, y, rx, ry, rot, ua, ub, w, T, c: p.c, m: p.m, g: p.g }, o));
  function sparks(x, y, a, spr, n, v, p, z) { for (let i = 0, N = cnt(n); i < N; i++) { const q = a === undefined ? R() * TAU : a + (R() - .5) * spr, w = v * rr(.45, 1); P('s', x, y, cos(q) * w, sin(q) * w, rr(.2, .42), rr(1.6, 2.6), R() < .5 ? p.c : p.m, z === undefined ? 1 : z, 0, 3.4) } }
  function shards(x, y, n, v, p, g, a, spr) { for (let i = 0, N = cnt(n); i < N; i++) { const q = a === undefined ? R() * TAU : a + (R() - .5) * spr, w = v * rr(.4, 1); P('h', x, y, cos(q) * w, sin(q) * w - 20, rr(.35, .7), rr(2.2, 4.2), R() < .5 ? p.m : p.c, 1, g || 180, 2) } }
  function motes(x, y, n, v, T, s, p, z, g) { for (let i = 0, N = cnt(n); i < N; i++) { const q = R() * TAU, w = v * rr(.3, 1); P('m', x, y, cos(q) * w, sin(q) * w, T * rr(.7, 1.3), s * rr(.7, 1.3), R() < .5 ? p.c : p.m, z === undefined ? 1 : z, g || 0, 2.2) } }
  function dust(x, y, n, v, s, col, T) { if (!Q) n = M.ceil(n * .4); for (let i = 0, N = cnt(n); i < N; i++) { const q = R() * TAU, w = v * rr(.3, 1); P('d', x + cos(q) * 4, y + 4, cos(q) * w, sin(q) * w * .35 - rr(6, 28), (T || .7) * rr(.7, 1.3), s * rr(.7, 1.3), col || DUST, 0, -8, 2.6) } }
  /* tụ khí: hạt bay VÀO tâm theo quỹ đạo xoáy */
  function converge(x, y, n, r0, T, p, z) { for (let i = 0, N = cnt(n); i < N; i++) PO('m', x, y, R() * TAU, r0 * rr(.7, 1.15), rr(4, 7) * (i % 2 ? 1 : -1), -r0 / T * rr(.85, 1.1), T * rr(.8, 1), rr(2, 3.6), R() < .5 ? p.c : p.m, z === undefined ? 1 : z, .82) }
  /* kiếm ảnh lao xuống / bay tới */
  function sword(x0, y0, x1, y1, T, p, d, o) {
    return add(Object.assign({ k: 'sw', z: 1, x: x1, y: y1, x0, y0, T, d, c: p.c, m: p.m, g: p.g, pri: 1 }, o));
  }
  function impactSmall(x, y, p, Rr, big) { flash(x, y, Rr * .8, .2, p); ring(x, y + 4, Rr, .3, 3.4, p); sparks(x, y, undefined, 0, big ? 9 : 5, 220, p, 1); if (big) shards(x, y, 5, 160, p) }

  /* ---------- Kiếm Khí ---------- */
  function initProj(p) { const i = (R() * 3) | 0; return p.v3 = { st: i, seed: R() * 9, ph: R() * TAU } }
  function castKiem(x, y, a, ev) {
    const p = ev ? PK.kiemE : PK.kiem, d = flip; flip = -flip;
    slash(x, y, 40, 40, a, -1.05 * d, 1.05 * d, 17 * (ev ? 1.2 : 1), .2, p, { z: 1 });
    slash(x, y, 56, 56, a, -.8 * d, .8 * d, 10, .24, p, { z: 1, d: .035 });
    flash(x + cos(a) * 26, y + sin(a) * 26, 14 * (ev ? 1.2 : 1), .14, p, { st: 0 });
    sparks(x + cos(a) * 22, y + sin(a) * 22, a, 1, 5, 300, p);
    for (let i = 0; i < N3(1, 2, 3); i++) P('m', x + cos(a) * 20, y + sin(a) * 20, cos(a + (i - 1) * .6) * 120, sin(a + (i - 1) * .6) * 120, .35, 3, p.c, 1, 0, 3);
  }
  function drawProj(c, p, cx, cy) {
    const st = p.v3 || initProj(p), ev = G && G.evo && G.evo.kiem, pal = ev ? PK.kiemE : PK.kiem, s = (ev ? 1.28 : 1) * (1 + (p.n || 1) * .07), x = p.x - cx, y = p.y - cy, a = p.a, t3 = p.t3 || [];
    const n = M.min(t3.length / 2 + 1, 40), life = cl((p.life || .5) / .9, 0, 1), fade = M.min(1, life * 4);
    /* bóng đổ: tạo chiều sâu (blend thường) */
    c.save(); c.globalAlpha = .2 * fade; c.fillStyle = K(DARK, 1); c.beginPath(); c.ellipse(x - cos(a) * 6, y + 26, 20 * s, 6 * s, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = Q > 0 ? 'lighter' : 'source-over'; c.globalAlpha = 1; c.lineCap = 'round';
    /* vệt: đầu = vị trí hiện tại, nối với lịch sử quỹ đạo */
    const pts = TMP; pts[0] = p.x; pts[1] = p.y; for (let i = 0; i < n * 2 - 2 && i < t3.length; i++) pts[2 + i] = t3[i];
    ribbon(c, pts, n, cx, cy, 15 * s, pal.g, .34 * fade, 1.25); ribbon(c, pts, n, cx, cy, 8.5 * s, pal.m, .6 * fade, 1.15); ribbon(c, pts, n, cx, cy, 3.4 * s, pal.c, .95 * fade, 1.05);
    c.translate(x, y); c.rotate(a);
    if (st.st === 0) {                                   /* ba đường kiếm cong nối tiếp (echo) */
      for (let i = 2; i >= 0; i--) { const dx = -i * 17 * s, k = 1 - i * .28; arcBlade(c, dx - 4, 0, 34 * s, 34 * s, 0, -.82, .82, 15 * s * k, pal.g, .38 * k * fade, 1); arcBlade(c, dx - 4, 0, 34 * s, 34 * s, 0, -.78, .78, 8.5 * s * k, pal.m, .75 * k * fade, 1); if (!i) arcBlade(c, -4, 0, 34 * s, 34 * s, 0, -.74, .74, 3.4 * s, pal.c, 1, 1) }
    } else if (st.st === 1) {                            /* kiếm thẳng xuyên phá: lưỡi dài + mũi sao */
      lens(c, -40 * s, 0, 36 * s, 0, 7.5 * s, pal.g, .5 * fade); lens(c, -34 * s, 0, 34 * s, 0, 4.2 * s, pal.m, .85 * fade); lens(c, -28 * s, 0, 32 * s, 0, 1.7 * s, pal.c, 1);
      lens(c, -14 * s, -10 * s, -14 * s, 10 * s, 1.8 * s, pal.m, .8 * fade); star4(c, 34 * s, 0, 11 * s, 2.2 * s, st.ph + tm * 3, pal.c, .9 * fade)
    } else {                                             /* song kiếm: hai đường cong song song, lệch pha */
      for (let q = -1; q <= 1; q += 2) { const o = q * 8 * s, sh = sin(tm * 14 + st.ph) * 2.2 * q; arcBlade(c, -2 + sh, o * .7, 30 * s, 30 * s, 0, -.7, .7, 12 * s, pal.g, .36 * fade, 1); arcBlade(c, -2 + sh, o * .7, 30 * s, 30 * s, 0, -.66, .66, 5.4 * s, pal.m, .85 * fade, 1); arcBlade(c, -2 + sh, o * .7, 30 * s, 30 * s, 0, -.6, .6, 2.1 * s, pal.c, 1, 1) }
    }
    c.rotate(-a); c.globalAlpha = .8 * fade; c.drawImage(gs(pal.g), -28 * s, -28 * s, 56 * s, 56 * s); c.globalAlpha = .95 * fade; c.drawImage(gs(pal.c), -12 * s, -12 * s, 24 * s, 24 * s); c.globalAlpha = 1;
    c.restore();
  }
  const TMP = new Array(90).fill(0);
  function hitKiem(x, y, a, s, cr, ev, p) {
    const n = cr ? 3 : 2, sp = cr ? 1.1 : .9;
    for (let i = 0; i < n; i++) cut(x, y, a + 1.5708 + (i - (n - 1) / 2) * sp * .7 + (R() - .5) * .3, rr(26, 44) * s * (cr ? 1.3 : 1), (5.5 - i * .8) * (ev ? 1.2 : 1), rr(.17, .26), p, { d: i * .03 });
    flash(x, y, 20 * s, .2, p); ring(x, y + 6, 30 * s, .3, 3.2, p, { fl: .5 }); ring(x, y + 6, 18 * s, .22, 2, p, { fl: .5, d: .04 });
    sparks(x, y, a, 1.3, 7, 340, p); shards(x, y, 4, 190, p, 220, a, 1.6);
    if (ev) motes(x, y, 3, 110, .5, 3, p);
    dust(x, y + 8, 2, 70, 7, DUST, .5);
  }

  /* ---------- Lôi Động ---------- */
  function boltFx(x, y, Rr, ev, e0) {
    const p = ev ? PK.loiE : PK.loi, top = e0 && e0.v ? e0.v[0] : null, sx = top ? top[0] : x + (R() - .5) * 60, sy = top ? top[1] : y - 330;
    add({ k: 'col', z: 1, x, y: y + 2, w: 40 + Rr * .5, h: 360, T: .3, c: p.m, g: p.g, pri: 1 });
    for (let i = 0; i < N3(1, 2, 3); i++) { const o = mkBolt(sx + (R() - .5) * 20, sy, x + (R() - .5) * 16, y, 52, 5, 3); add({ k: 'b3', z: 1, o, T: .24 + i * .04, d: i * .035, c: p.c, m: p.m, g: p.g, w: 1.7 + (ev ? .7 : 0), pri: 1, x, y }) }
    flash(x, y - 6, Rr * 1.1, .26, p, { pri: 1 });
    ring(x, y, Rr * 1.5, .38, 5, p, { r0: .1 }); ring(x, y, Rr * .9, .26, 3, p, { d: .05, r0: .1 });
    add({ k: 'rune', z: 0, x, y, R: Rr * .95, fl: .42, T: .55, c: p.c, g: p.g, sp: 5, nt: 12, tri: 0 });
    for (let i = 0; i < N3(2, 3, 5); i++) { const a = R() * TAU, L = Rr * rr(.8, 1.5), o = mkBolt(x, y - 4, x + cos(a) * L, y - 4 + sin(a) * L * .55, 20, 3, 0); add({ k: 'b3', z: 1, o, T: .2, d: .03 + i * .02, c: p.c, m: p.m, g: p.g, w: 1.1, x, y }) }
    sparks(x, y - 6, undefined, 0, 12, 300, p); motes(x, y - 6, 6, 70, .8, 3, p, 1, -90); dust(x, y, 3, 90, 8, DUST, .6);
    shake(ev ? .24 : .14);
  }

  /* ---------- Hàng Long Chưởng ---------- */
  function palmFx(x, y, Rr, ev) {
    const p = ev ? PK.hangE : PK.hang, cy = y - 8;
    add({ k: 'rune', z: 0, x, y, R: Rr * .96, fl: .46, T: .85, c: p.c, g: p.g, sp: 1.8, nt: 36, tri: 1, pri: 1 });
    ring(x, y, Rr * 1.08, .5, 11, p, { r0: .25, dk: 1, pri: 1 }); ring(x, y, Rr * .72, .4, 6, p, { d: .05, r0: .2, pri: 1 }); ring(x, y, Rr * .4, .3, 4, p, { d: .1, r0: .1 });
    add({ k: 'vx', z: 1, x, y: cy, R: Rr * 1.02, arms: 3, span: 1.5, rot: R() * TAU, rs: 8, fl: .5, T: .5, c: p.c, m: p.m, g: p.g, w: 9, pri: 1 });
    flash(x, cy, Rr * .5, .24, p, { pri: 1 });
    const n = cnt(14); for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * .2; P('s', x + cos(a) * 14, cy + sin(a) * 8, cos(a) * Rr * 2.4, sin(a) * Rr * 1.3, rr(.25, .45), rr(2, 3.4), i % 2 ? p.c : p.m, 1, 0, 2.6) }
    dust(x, y, 12, Rr * 1.3, 10, DUST, .8); shards(x, cy, 6, Rr * 1.5, p, 160);
    if (ev) { for (let i = 0; i < cnt(10); i++) { const a = R() * TAU, r = Rr * rr(.3, .95); P('m', x + cos(a) * r, y + sin(a) * r * .5, 0, rr(-110, -50), rr(.5, .95), rr(2.4, 4.4), R() < .5 ? p.c : p.m, 1, -80, 1) } }
    shake(ev ? .3 : .2);
  }

  /* ================= TUYỆT KỸ ĐIỆN ẢNH ================= */
  function ultCommon(x, y, p, big) {
    converge(x, y, 30, 170, .2, p);                               /* 1) tích tụ (ngắn, không kéo dài logic) */
    add({ k: 'col', z: 0, x, y: y + 12, w: 34, h: 300, T: .55, c: p.c, g: p.g, pri: 1 });  /* 2) cột sáng bùng phát */
    flash(x, y, 60, .36, p, { st: 1, pri: 1, z: 0 });
    ring(x, y + 12, 330, .6, 9, p, { r0: .08, dk: 1, pri: 1 });
    ring(x, y + 12, 210, .5, 6, p, { d: .07, r0: .08, pri: 1 });
    ring(x, y + 12, 400, .75, 5, p, { d: .15, r0: .1, pri: 1 });                              /* 3) sóng xung kích ba nhịp */
    dust(x, y, 22, 420, 14, DUST, 1.0);
    for (let i = 0; i < cnt(18); i++) { const a = i / 18 * TAU + R() * .2; P('s', x, y, cos(a) * 560, sin(a) * 340, rr(.3, .55), rr(2, 3.4), i % 2 ? p.c : p.m, 1, 0, 2.2) }
    shake(.55);
  }
  function ultEnd(x, y, p, n) {                                   /* 4) tan dần: hạt sáng nhỏ bay lên */
    for (let i = 0; i < cnt(n || 26); i++) { const a = R() * TAU, r = rr(30, 340); P('m', x + cos(a) * r, y + sin(a) * r * .7, rr(-14, 14), rr(-60, -24), rr(.9, 1.7), rr(2, 3.8), R() < .5 ? p.c : p.m, i % 4 ? 1 : 2, -10, .9) }
  }
  const ULT = {
    dbl(x, y) {                                                    /* Kiếm Trận: kiếm ảnh giáng xuống vòng tròn + 12 đường kiếm quang cong */
      const p = PK.light; ultCommon(x, y, p);
      add({ k: 'rune', z: 0, x, y: y + 10, R: 330, fl: .46, T: 1.1, c: p.c, g: p.g, sp: 1.2, nt: 48, tri: 1, pri: 1 });
      const n = N3(8, 12, 16);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + .2, r = i % 2 ? 150 : 270, tx = x + cos(a) * r, ty = y + sin(a) * r * .72 + 6;
        sword(tx - 40, ty - 360, tx, ty, .22, p, .05 + i * .028, { end: e => impactSmall(tx, ty, p, 36, 1) }) }
      for (let i = 0; i < N3(6, 9, 12); i++) { const a = i / 12 * TAU + R() * .3; slash(x, y, 120 + i * 22, (120 + i * 22) * .8, a, 0, (i % 2 ? 1 : -1) * 2.0, 20, .5, p, { z: 1, d: .04 + i * .03, pri: 1 }) }
      ultEnd(x, y, p);
    },
    lh(x, y) {                                                     /* Đao Khí + Hoả: ba nhánh xoáy lửa cuộn ra, vòng chém lớn */
      const p = PK.blade, f = PK.fire; ultCommon(x, y, p);
      add({ k: 'vx', z: 1, x, y, R: 400, arms: 4, span: 2.2, rot: R() * TAU, rs: 7, fl: .78, T: .8, c: f.c, m: f.m, g: f.g, w: 13, pri: 1 });
      add({ k: 'vx', z: 1, x, y, R: 300, arms: 3, span: 1.8, rot: R() * TAU, rs: -9, fl: .78, T: .7, d: .06, c: p.c, m: p.m, g: p.g, w: 10, pri: 1 });
      for (let i = 0; i < 3; i++) slash(x, y, 150 + i * 80, (150 + i * 80) * .7, i * 1.1, 0, 5.4 * (i % 2 ? -1 : 1), 26 - i * 4, .55, i % 2 ? f : p, { z: 1, d: i * .06, pri: 1 });
      add({ k: 'rune', z: 0, x, y: y + 10, R: 260, fl: .46, T: .9, c: f.c, g: f.g, sp: -2.2, nt: 30, tri: 0, pri: 1 });
      for (let i = 0; i < cnt(30); i++) { const a = R() * TAU, r = rr(20, 300); P('m', x + cos(a) * r, y + sin(a) * r * .6, rr(-30, 30), rr(-190, -60), rr(.6, 1.2), rr(2.4, 5), R() < .5 ? f.m : f.c, 1, -60, 1.2) }
      motes(x, y, 18, 380, .8, 3.4, f, 1, -40); ultEnd(x, y, f, 20);
    },
    nq(x, y) {                                                     /* Băng: gai băng toả tia + sương lạnh + mảnh băng vỡ */
      const p = PK.ice; ultCommon(x, y, p);
      const n = N3(12, 18, 26);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * .15, L = rr(150, 340); add({ k: 'ic', z: 1, x, y: y + 6, a, L, w: rr(7, 12), T: .8, d: .03 + i * .008, c: p.c, m: p.m, g: p.g, sq: .72, pri: 1 }) }
      add({ k: 'vx', z: 1, x, y, R: 340, arms: 5, span: 1.4, rot: R() * TAU, rs: 5, fl: .72, T: .75, c: p.c, m: p.m, g: p.g, w: 8, pri: 1 });
      add({ k: 'rune', z: 0, x, y: y + 10, R: 300, fl: .46, T: 1.0, c: p.c, g: p.g, sp: 1.6, nt: 6, tri: 2, pri: 1 });
      for (let i = 0; i < cnt(14); i++) { const a = R() * TAU, r = rr(60, 340); P('d', x + cos(a) * r, y + sin(a) * r * .6, rr(-16, 16), rr(-18, -6), rr(1.2, 2), rr(26, 52), MIST.ice, 0, 0, .6) }
      for (let i = 0; i < cnt(26); i++) { const a = R() * TAU, r = rr(30, 330); P('i', x + cos(a) * r * .3, y - 4 + sin(a) * r * .22, cos(a) * r * 1.3, sin(a) * r * .8 - 90, rr(.7, 1.3), rr(3, 6), i % 2 ? p.c : p.m, 1, 260, 1.4) }
      ultEnd(x, y, p, 30);
    },
    thd(x, y) {                                                    /* Vạn Lôi: mạng sét toả trên đất + sét trời */
      const p = PK.loi; ultCommon(x, y, p);
      const n = N3(5, 8, 12);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * .3, L = rr(240, 400), o = mkBolt(x, y - 6, x + cos(a) * L, y - 6 + sin(a) * L * .62, 44, 5, 3); add({ k: 'b3', z: 1, o, T: .3, d: .02 + i * .018, c: p.c, m: p.m, g: p.g, w: 1.9, pri: 1, x, y }) }
      for (let i = 0; i < N3(2, 4, 6); i++) { const a = R() * TAU, r = rr(60, 300), tx = x + cos(a) * r, ty = y + sin(a) * r * .6, o = mkBolt(tx + rr(-40, 40), ty - 380, tx, ty, 54, 5, 2); add({ k: 'b3', z: 1, o, T: .26, d: .06 + i * .06, c: p.c, m: p.m, g: p.g, w: 2.1, pri: 1, x: tx, y: ty, on: () => { flash(tx, ty, 34, .2, p); ring(tx, ty, 40, .3, 3, p) } }) }
      add({ k: 'rune', z: 0, x, y: y + 10, R: 290, fl: .46, T: 1.0, c: p.c, g: p.g, sp: 4, nt: 24, tri: 0, pri: 1 });
      ultEnd(x, y, p, 30);
    },
    dl(x, y) {                                                     /* Độc: sương độc cuộn + xoáy lục + bọt độc nổi */
      const p = PK.poison; ultCommon(x, y, p);
      add({ k: 'vx', z: 1, x, y, R: 360, arms: 4, span: 2.0, rot: R() * TAU, rs: 6, fl: .74, T: .8, c: p.c, m: p.m, g: p.g, w: 10, pri: 1 });
      for (let i = 0; i < cnt(18); i++) { const a = R() * TAU, r = rr(30, 330); P('d', x + cos(a) * r * .5, y + sin(a) * r * .35, cos(a) * 60, sin(a) * 34 - 8, rr(1.1, 1.9), rr(30, 56), MIST.poison, 0, 0, .7) }
      for (let i = 0; i < cnt(26); i++) { const a = R() * TAU, r = rr(30, 340); P('m', x + cos(a) * r, y + sin(a) * r * .7, rr(-16, 16), rr(-70, -22), rr(.9, 1.7), rr(3, 6), R() < .5 ? p.c : p.m, 1, -20, 1) }
      add({ k: 'rune', z: 0, x, y: y + 10, R: 300, fl: .46, T: 1.0, c: p.c, g: p.g, sp: -1.4, nt: 20, tri: 0, pri: 1 });
      ultEnd(x, y, p, 22);
    },
    nb(x, y) {                                                     /* Nội công: trận pháp bát quái lớn + hai xoáy khí ngược chiều */
      const p = PK.wind, w2 = { c: [226, 255, 240], m: [140, 235, 200], g: [60, 190, 150] }; ultCommon(x, y, p);
      add({ k: 'rune', z: 0, x, y: y + 10, R: 380, fl: .46, T: 1.3, c: p.c, g: p.g, sp: 1.0, nt: 48, tri: 1, pri: 1 });
      add({ k: 'rune', z: 0, x, y: y + 10, R: 250, fl: .46, T: 1.1, c: w2.c, g: w2.g, sp: -1.8, nt: 30, tri: 1, d: .05, pri: 1 });
      add({ k: 'vx', z: 1, x, y, R: 400, arms: 3, span: 1.9, rot: 0, rs: 6, fl: .72, T: .85, c: p.c, m: p.m, g: p.g, w: 11, pri: 1 });
      add({ k: 'vx', z: 1, x, y, R: 300, arms: 3, span: 1.9, rot: 1, rs: -7, fl: .72, T: .8, d: .05, c: w2.c, m: w2.m, g: w2.g, w: 9, pri: 1 });
      for (let i = 0; i < cnt(20); i++) { const a = R() * TAU, r = rr(80, 340); P('f', x + cos(a) * r, y + sin(a) * r * .6, cos(a + 1.57) * 120, sin(a + 1.57) * 70, rr(.8, 1.4), rr(3, 5), i % 2 ? w2.m : p.m, 1, 0, .8) }
      ultEnd(x, y, p, 22);
    },
    ltk(x, y) {                                                    /* Kiếm quang xé trời: hai nhát chém chéo khổng lồ + dư ảnh */
      const p = PK.light; ultCommon(x, y, p);
      for (let i = 0; i < 2; i++) { const a = i ? -.52 + M.PI : -.48, L = 620;
        add({ k: 'beam', z: 1, x, y, a, L, w: 22, T: .6, d: i * .09, c: p.c, m: p.m, g: p.g, pri: 1 }); add({ k: 'beam', z: 1, x, y, a: a + .05 * (i ? -1 : 1), L: L * .8, w: 13, T: .55, d: i * .09 + .05, c: p.c, m: p.m, g: p.g, pri: 1 }) }
      slash(x, y, 220, 150, -.5, -2.4, 2.4, 40, .6, p, { d: .06, pri: 1 }); slash(x, y, 320, 220, .5, 2.6, -2.2, 28, .6, p, { d: .12, pri: 1 });
      for (let i = 0; i < N3(3, 5, 7); i++) { const a = R() * TAU, r = rr(80, 260), tx = x + cos(a) * r, ty = y + sin(a) * r * .7; sword(tx + 30, ty - 340, tx, ty, .2, p, .1 + i * .05, { end: e => impactSmall(tx, ty, p, 34, 1) }) }
      add({ k: 'rune', z: 0, x, y: y + 10, R: 300, fl: .46, T: 1.0, c: p.c, g: p.g, sp: 2, nt: 36, tri: 1, pri: 1 });
      ultEnd(x, y, p, 30);
    },
    _(x, y) { const p = PK.def; ultCommon(x, y, p); ultEnd(x, y, p, 16) }
  };

  /* ---------- Combo: chuỗi đường kiếm quanh nhân vật ---------- */
  function comboFx(x, y, tier, col) {
    const p = tier >= 3 ? PK.light : PK.kiem, n = M.min(7, 3 + tier);
    for (let i = 0; i < n; i++) { const r = 56 + i * 16, a0 = R() * TAU, d = i % 2 ? 1 : -1; slash(x, y - 6, r, r * .62, a0, 0, d * (2.3 + R()), 12 + tier * 2, .34, p, { z: 1, d: i * .055 }) }
    flash(x, y - 6, 40 + tier * 12, .3, p); ring(x, y + 8, 120 + tier * 30, .5, 5, p, { r0: .12 });
    if (tier >= 2) sparks(x, y - 8, undefined, 0, 14, 320, p); if (tier >= 3) { shards(x, y - 8, 10, 300, p); shake(.15) }
  }

  /* ================= VẼ HIỆU ỨNG ================= */
  const ADDK = { ring: 1, fl: 1, cut: 1, sl: 1, col: 1, b3: 1, rune: 1, vx: 1, sw: 1, ic: 1, beam: 1 };
  function setC(c, add) { const m = add && Q > 0 ? 'lighter' : 'source-over'; if (c.globalCompositeOperation !== m) c.globalCompositeOperation = m }

  function drawF(c, e, cx, cy) {
    const k = 1 - e.t / e.T, a = 1 - k, x = e.x - cx, y = e.y - cy;
    switch (e.k) {
      case 'sl': { /* đường chém cong quét: đầu lao trước, đuôi bám sau, tan */
        const hd = e.ua + (e.ub - e.ua) * eo(cl(k / .5, 0, 1)), tl = e.ua + (e.ub - e.ua) * eo(cl((k - .1) / .9, 0, 1)) * .96, al = M.pow(a, .7), w = e.w * (1 - k * .35);
        arcBlade(c, x, y, e.rx * (1 + k * .12), e.ry * (1 + k * .12), e.rot, tl, hd, w * 1.9, e.g, .38 * al, 0);
        arcBlade(c, x, y, e.rx * (1 + k * .12), e.ry * (1 + k * .12), e.rot, tl, hd, w, e.m, .78 * al, 0);
        arcBlade(c, x, y, e.rx * (1 + k * .12), e.ry * (1 + k * .12), e.rot, tl, hd, w * .36, e.c, al, 0);
        { const cr = cos(e.rot), sr = sin(e.rot), ex = e.rx * cos(hd), ey = e.ry * sin(hd); glow(c, e.c, x + ex * cr - ey * sr, y + ex * sr + ey * cr, 10 + w * .6, .9 * al); c.globalAlpha = 1 }
        break }
      case 'cut': { /* vết chém thẳng: bung nhanh rồi mảnh dần */
        const u = eo3(cl(k / .4, 0, 1)), L = e.L * (.35 + .65 * u), ca = cos(e.a), sa = sin(e.a), w = e.w * (1 - k * .8);
        lens(c, x - ca * L, y - sa * L, x + ca * L, y + sa * L, w * 2.1, e.g, .45 * a); lens(c, x - ca * L * .95, y - sa * L * .95, x + ca * L * .95, y + sa * L * .95, w * .8, e.c, .98 * a); break }
      case 'fl': { /* chớp sáng: lõi + quầng + sao 4 cánh */
        const r = e.R * (1.25 - .5 * eo(k)); glow(c, e.g, x, y, r * 2.1, .6 * a); glow(c, e.c, x, y, r, a); c.globalAlpha = 1;
        if (e.st) star4(c, x, y, r * 2.4 * eo3(M.min(1, k * 2.6)), 1.9 + r * .05, e.rot + k * .4, e.c, .8 * a); break }
      case 'ring': { /* sóng xung kích 3 lớp + dư chấn */
        const r = e.R * (e.r0 + (1 - e.r0) * eo3(k)), al = M.pow(a, 1.3) * e.a, fl = e.fl, w = e.w * (1 - k * .75) + 1; c.lineWidth = w * 2.4; c.strokeStyle = K(e.g, .2 * al); c.beginPath(); c.ellipse(x, y, r, r * fl, 0, 0, TAU); c.stroke();
        c.lineWidth = w; c.strokeStyle = K(e.g, .62 * al); c.stroke(); c.lineWidth = M.max(1, w * .36); c.strokeStyle = K(e.c, .95 * al); c.stroke();
        if (Q > 0) { const r2 = r * .86; c.lineWidth = w * .5; c.strokeStyle = K(e.g, .3 * al); c.beginPath(); c.ellipse(x, y, r2, r2 * fl, 0, 0, TAU); c.stroke() }
        if (e.dk && Q > 0) { c.globalCompositeOperation = 'source-over'; c.lineWidth = w * 1.6; c.strokeStyle = K(DARK, .16 * al); c.beginPath(); c.ellipse(x, y, r * .93, r * .93 * fl, 0, 0, TAU); c.stroke(); setC(c, 1) } break }
      case 'col': { /* cột sáng */
        const w = e.w * (1 - .55 * k), al = M.pow(a, .8), g = c.createLinearGradient(0, y - e.h, 0, y); g.addColorStop(0, K(e.g, 0)); g.addColorStop(.7, K(e.m || e.g, .34 * al)); g.addColorStop(1, K(e.c, .55 * al));
        c.fillStyle = g; c.fillRect(x - w / 2, y - e.h, w, e.h); c.fillStyle = K(e.c, .28 * al); c.fillRect(x - w * .16, y - e.h * .85, w * .32, e.h * .85); glow(c, e.g, x, y, w * 1.5, .6 * al); c.globalAlpha = 1; break }
      case 'b3': { /* sét: hiện chập chờn 2 pha */
        const fr = ((k * 5) | 0) % 2, al = cl(1 - k * k, 0, 1) * (fr ? .75 : 1), w = e.w; c.lineJoin = 'round'; c.lineCap = 'round';
        for (const s of [[w * 6.5, e.g, .3], [w * 2.8, e.m, .62], [w * 1.1, e.c, 1]]) { c.lineWidth = s[0]; c.strokeStyle = K(s[1], s[2] * al); polyStroke(c, e.o.m, cx, cy); if (s[0] < 7) for (const b of e.o.b) polyStroke(c, b, cx, cy) }
        glow(c, e.g, x, y, 34, .5 * al * (1 - k)); c.globalAlpha = 1; break }
      case 'rune': { /* pháp trận */
        const env = k < .12 ? k / .12 : k > .65 ? 1 - (k - .65) / .35 : 1, r = e.R * (.85 + .15 * eo(k)), rot = tm * e.sp * .6 + k * e.sp, fl = e.fl, al = env * .8;
        c.lineWidth = 3.4; c.strokeStyle = K(e.g, .55 * al); c.beginPath(); c.ellipse(x, y, r, r * fl, 0, 0, TAU); c.stroke(); c.lineWidth = 1.3; c.strokeStyle = K(e.c, .95 * al); c.stroke();
        c.beginPath(); c.ellipse(x, y, r * .8, r * .8 * fl, 0, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = K(e.g, .6 * al); c.stroke();
        c.lineWidth = 1.6; c.strokeStyle = K(e.c, .8 * al); c.beginPath();
        for (let i = 0; i < e.nt; i++) { const t = rot + i / e.nt * TAU, l = i % 3 ? .93 : .88; c.moveTo(x + cos(t) * r * l, y + sin(t) * r * l * fl); c.lineTo(x + cos(t) * r, y + sin(t) * r * fl) } c.stroke();
        if (e.tri === 1) { c.lineWidth = 2; c.strokeStyle = K(e.m || e.c, .85 * al); c.beginPath(); for (let i = 0; i < 8; i++) { const t = -rot * .7 + i / 8 * TAU, rb = r * .66; for (let j = 0; j < 3; j++) { const rj = rb + j * 7 - 7, w2 = .13 - j * .0, br = (i * 5 + j * 3) % 4 === 0; if (br) { c.moveTo(x + cos(t - w2) * rj, y + sin(t - w2) * rj * fl); c.lineTo(x + cos(t - .03) * rj, y + sin(t - .03) * rj * fl); c.moveTo(x + cos(t + .03) * rj, y + sin(t + .03) * rj * fl); c.lineTo(x + cos(t + w2) * rj, y + sin(t + w2) * rj * fl) } else { c.moveTo(x + cos(t - w2) * rj, y + sin(t - w2) * rj * fl); c.lineTo(x + cos(t + w2) * rj, y + sin(t + w2) * rj * fl) } } } c.stroke() }
        else if (e.tri === 2) { c.lineWidth = 1.8; c.strokeStyle = K(e.c, .8 * al); c.beginPath(); for (let i = 0; i < 6; i++) { const t = rot + i / 6 * TAU; c.moveTo(x, y); c.lineTo(x + cos(t) * r * .78, y + sin(t) * r * .78 * fl) } c.stroke() }
        glow(c, e.g, x, y, r * .55, .18 * al); c.globalAlpha = 1; break }
      case 'vx': { /* các nhánh xoáy: đầu lao ra, đuôi cuộn theo sau */
        const u = eo(cl(k / .8, 0, 1)), al = M.pow(a, .65), m = N3(14, 20, 28);
        for (let arm = 0; arm < e.arms; arm++) { const th = e.rot + arm / e.arms * TAU + e.rs * k * .9, rh = e.R * u, pts = TMP;
          for (let j = 0; j < m; j++) { const v = j / (m - 1), an = th - v * e.span, rd = rh * (1 - v * .72); pts[j * 2] = e.x + cos(an) * rd; pts[j * 2 + 1] = e.y + sin(an) * rd * e.fl }
          ribbon(c, pts, m, cx, cy, e.w * 1.6, e.g, .3 * al, 1.1); ribbon(c, pts, m, cx, cy, e.w, e.m, .62 * al, 1.05); ribbon(c, pts, m, cx, cy, e.w * .34, e.c, .95 * al, 1) } break }
      case 'sw': { /* kiếm ảnh lao tới: vệt + lưỡi kiếm phát sáng, cắm xuống thì mờ dần */
        const u = cl(k / .55, 0, 1), eu = u * u * (3 - 2 * u), px = e.x0 + (e.x - e.x0) * eu, py = e.y0 + (e.y - e.y0) * eu, dx = e.x - e.x0, dy = e.y - e.y0, l = hyp(dx, dy) || 1, ux = dx / l, uy = dy / l, al = k < .55 ? 1 : 1 - (k - .55) / .45, an = M.atan2(dy, dx);
        const tl = 120 * (k < .55 ? 1 : 1 - (k - .55) / .45), pts = TMP; pts[0] = px; pts[1] = py; pts[2] = px - ux * tl * .5; pts[3] = py - uy * tl * .5; pts[4] = px - ux * tl; pts[5] = py - uy * tl;
        ribbon(c, pts, 3, cx, cy, 15, e.g, .4 * al, 1.2); ribbon(c, pts, 3, cx, cy, 6.5, e.c, .85 * al, 1.1);
        c.save(); c.translate(px - cx, py - cy); c.rotate(an); lens(c, -38, 0, 14, 0, 5.6, e.g, .6 * al); lens(c, -36, 0, 18, 0, 3.2, e.m, .9 * al); lens(c, -34, 0, 20, 0, 1.3, e.c, al); lens(c, -30, -8, -30, 8, 1.8, e.m, .85 * al); c.restore();
        glow(c, e.g, px - cx, py - cy, 26, .55 * al); if (u >= 1) { glow(c, e.c, x, y, 34 * (1 - (k - .55)), .5 * al) } c.globalAlpha = 1; break }
      case 'ic': { /* tinh thể băng mọc toả tia */
        const gr = eo3(cl(k / .2, 0, 1)), al = k > .6 ? 1 - (k - .6) / .4 : 1, L = e.L * gr, ca = cos(e.a), sa = sin(e.a) * e.sq, w = e.w;
        lens(c, x, y, x + ca * L, y + sa * L, w * 1.9, e.g, .38 * al); lens(c, x, y, x + ca * L, y + sa * L, w, e.m, .85 * al); lens(c, x + ca * L * .04, y + sa * L * .04, x + ca * L * .92, y + sa * L * .92, w * .38, e.c, al);
        if (L > 40) for (let s = -1; s <= 1; s += 2) { const bx = x + ca * L * .5, by = y + sa * L * .5, ba = e.a + s * .6; lens(c, bx, by, bx + cos(ba) * L * .28, by + sin(ba) * L * .28 * e.sq, w * .5, e.m, .75 * al) } break }
      case 'beam': { /* kiếm quang xé trời */
        const u = eo3(cl(k / .32, 0, 1)), L = e.L * u, ca = cos(e.a), sa = sin(e.a), w = e.w * (1 - k * k * .9), al = M.pow(a, 1.1);
        lens(c, x - ca * L, y - sa * L * .72, x + ca * L, y + sa * L * .72, w * 1.9, e.g, .36 * al); lens(c, x - ca * L, y - sa * L * .72, x + ca * L, y + sa * L * .72, w, e.m, .72 * al); lens(c, x - ca * L * .96, y - sa * L * .69, x + ca * L * .96, y + sa * L * .69, w * .34, e.c, al);
        glow(c, e.c, x, y, 60 * a + 8, .7 * al); c.globalAlpha = 1; break }
    }
  }

  /* ---------- hạt ---------- */
  function drawP(c, cx, cy, z, add2) {
    const par = z === 2 ? 1.14 : 1;
    for (let i = 0; i < PT.length; i++) {
      const p = PT[i]; if (p.z !== z) continue; const kd = p.k, isA = kd === 'm' || kd === 's' || kd === 'h'; if (isA !== add2) continue;
      const a = p.t / p.T, x = p.x - cx * par, y = p.y - cy * par;
      if (kd === 'm') { const tw = .75 + .25 * sin(tm * 22 + p.tw), s = p.s * (2.6 + a * 1.4); glow(c, p.c, x, y, s * (z === 2 ? 1.8 : 1), M.min(1, a * 2.2) * tw); c.globalAlpha = 1 }
      else if (kd === 's') { const l = M.min(46, hyp(p.vx, p.vy) * .085) + 2; c.strokeStyle = K(p.c, a); c.lineWidth = p.s * a + .5; const sp = hyp(p.vx, p.vy) || 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x - p.vx / sp * l, y - p.vy / sp * l); c.stroke() }
      else if (kd === 'h') { c.save(); c.translate(x, y); c.rotate(p.r); c.fillStyle = K(p.c, a); c.beginPath(); c.moveTo(0, -p.s * 1.8); c.lineTo(p.s * .6, p.s * .8); c.lineTo(-p.s * .6, p.s * .8); c.fill(); c.restore() }
      else if (kd === 'd') { const s = p.s * (1.2 - a * .35 + (1 - a) * .6); c.globalAlpha = .34 * M.min(1, a * 1.6) * (1 - (1 - a) * .3); c.drawImage(gs(p.c), x - s, y - s, s * 2, s * 2); c.globalAlpha = 1 }
      else if (kd === 'i') { c.save(); c.translate(x, y); c.rotate(p.r + p.t * 7); c.fillStyle = K(p.c, a); c.strokeStyle = K(WHITE, a * .8); c.lineWidth = .8; c.beginPath(); c.moveTo(0, -p.s * 1.5); c.lineTo(p.s * .7, p.s * .4); c.lineTo(0, p.s); c.lineTo(-p.s * .7, p.s * .4); c.closePath(); c.fill(); c.stroke(); c.restore() }
      else if (kd === 'f') { c.save(); c.translate(x, y); c.rotate(p.r + p.t * 5); c.fillStyle = K(p.c, a * .9); c.beginPath(); c.ellipse(0, 0, p.s * 1.6, p.s * .6, 0, 0, TAU); c.fill(); c.restore() }
    }
  }
  const inView = (e, cx, cy, W, H) => !(M.abs(e.x - cx - W / 2) > W + 520 || M.abs(e.y - cy - H / 2) > H + 520);
  function drawLayer(c, cx, cy, W, H, z) {
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    setC(c, 0); drawP(c, cx, cy, z, false);
    setC(c, 1);
    for (let i = 0; i < FX.length; i++) { const e = FX[i]; if (e.z !== z || e.d > 0) continue; if (!inView(e, cx, cy, W, H)) continue; setC(c, ADDK[e.k]); drawF(c, e, cx, cy) }
    setC(c, 1); drawP(c, cx, cy, z, true);
    c.globalAlpha = 1; c.restore(); setC(c, 0);
  }

  /* ================= CẬP NHẬT ================= */
  function update(dt, g, q) {
    if (g !== G) { G = g; clearAll() }
    Q = q; tm += dt; hb = HITB[Q];
    let j = 0;
    for (let i = 0; i < FX.length; i++) { const e = FX[i]; if (e.d > 0) { e.d -= dt; if (e.d <= 0 && e.on) e.on(e); FX[j++] = e; continue } e.t -= dt; if (e.t <= 0) { if (e.end) e.end(e); poolF.length < 200 && poolF.push(e); continue } FX[j++] = e } FX.length = j; j = 0;
    for (let i = 0; i < PT.length; i++) {
      const p = PT[i]; p.t -= dt; if (p.t <= 0) { poolP.length < 700 && poolP.push(p); continue }
      if (p.o) { p.a += p.av * dt; p.rad = M.max(0, p.rad + p.rv * dt); p.cy -= p.lift * dt; p.x = p.cx + cos(p.a) * p.rad; p.y = p.cy + sin(p.a) * p.rad * p.sq }
      else { const f = M.max(0, 1 - dt * p.f); p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= f; p.vy *= f }
      p.r += p.vr * dt; PT[j++] = p;
    }
    PT.length = j;
    /* vệt kiếm: lịch sử quỹ đạo dày hơn + hạt xoắn theo quỹ đạo */
    const TL = N3(9, 15, 22);
    for (const p of g.pr) { if (p.k !== 'kiem') continue; const t = p.t3 || (p.t3 = []); if (!t.length || hyp(p.x - t[0], p.y - t[1]) > 5) { t.unshift(p.x, p.y); if (t.length > TL * 2) t.length = TL * 2 }
      if (Q > 0 && R() < dt * 36) { const st = p.v3 || initProj(p), ph = tm * 18 + st.ph, off = sin(ph) * 11, pal = g.evo && g.evo.kiem ? PK.kiemE : PK.kiem; P('m', p.x - sin(p.a) * off * -1, p.y + cos(p.a) * off * -1, -p.vx * .08, -p.vy * .08, .34, 2.1, R() < .5 ? pal.c : pal.m, 1, 0, 2) } }
    /* phi kiếm: hạt bay theo quỹ đạo tròn */
    if (g.sk && g.sk.phi && Q > 0 && R() < dt * 14) { const Pp = g.p, n = g.sk.phi + 1 + (g.evo && g.evo.phi ? 3 : 0), i = (R() * n) | 0, an = g.orbit + i / n * TAU, pal = g.evo && g.evo.phi ? PK.phiE : PK.phi; PO('m', Pp.x, Pp.y - 10, an, 62, 5.2, 0, .5, 2.4, R() < .5 ? pal.c : pal.m, 1, 1) }
    /* tuyệt kỹ đã đầy năng lượng: khí xoáy hội tụ nhẹ quanh nhân vật (báo hiệu, không che hình) */
    if (g.e >= 100 && !g.ending && Q > 0) { uAcc += dt; if (uAcc > (Q === 1 ? .1 : .06)) { uAcc = 0; const Pp = g.p, p = PK[HEROPAL[g.uid] || 'light']; PO('m', Pp.x, Pp.y + 6, R() * TAU, 52, 3.4, -14, .6, 2.2, R() < .5 ? p.c : p.m, 1, .5, 70) } }
  }
  function clearAll() { for (const e of FX) poolF.length < 200 && poolF.push(e); FX.length = 0; for (const p of PT) poolP.length < 700 && poolP.push(p); PT.length = 0 }

  /* ================= BỌC DV_VFX ================= */
  const O = {}; for (const k of ['update', 'ground', 'air', 'proj', 'phi', 'onHit', 'kill', 'bolt', 'palm', 'cast', 'ult', 'reset', 'stats']) O[k] = D[k];
  let lastRect = [0, 0, 1280, 720];
  D.update = function (dt, g, q) { O.update(dt, g, q); update(dt, g, q) };
  D.ground = function (c, cx, cy, W, H) { lastRect = [cx, cy, W, H]; O.ground(c, cx, cy, W, H); drawLayer(c, cx, cy, W, H, 0) };
  D.air = function (c, cx, cy, W, H) { O.air(c, cx, cy, W, H); drawLayer(c, cx, cy, W, H, 1); drawLayer(c, cx, cy, W, H, 2) };
  D.proj = function (c, p, cx, cy) { if (p.k === 'kiem' || !p.k) drawProj(c, p, cx, cy); else O.proj(c, p, cx, cy) };
  D.phi = function (c, P0, cx, cy, n, orb, ev) {
    O.phi(c, P0, cx, cy, n, orb, ev); const pal = ev ? PK.phiE : PK.phi, ox = P0.x - cx, oy = P0.y - 10 - cy;
    c.save(); setC(c, 1); c.globalAlpha = 1;
    for (let i = 0; i < n; i++) { const a = orb + i / n * TAU, m = N3(8, 12, 16), pts = TMP;                 /* vệt ribbon theo quỹ đạo tròn */
      for (let j = 0; j < m; j++) { const t = a - j / (m - 1) * (ev ? .95 : .7); pts[j * 2] = P0.x + cos(t) * 62; pts[j * 2 + 1] = P0.y - 10 + sin(t) * 62 }
      ribbon(c, pts, m, cx, cy, 6.5, pal.g, .42, 1.1); ribbon(c, pts, m, cx, cy, 2.8, pal.c, .9, 1.05);
      const x = ox + cos(a) * 62, y = oy + sin(a) * 62; glow(c, pal.g, x, y, 22, .5); glow(c, pal.c, x, y, 8, .8); c.globalAlpha = 1 }
    setC(c, 0); c.restore();
  };
  D.cast = function (kind, x, y, a, ev) { O.cast(kind, x, y, a, ev); if (kind === 'kiem') castKiem(x, y, a, ev) };
  D.bolt = function (x, y, Rr, ev, d) { const e = O.bolt(x, y, Rr, ev, d); boltFx(x, y, Rr, ev, e); return e };
  D.palm = function (x, y, Rr, ev) { O.palm(x, y, Rr, ev); palmFx(x, y, Rr, ev) };
  D.ult = function (P0, hid) { O.ult(P0, hid); uHero = hid; (ULT[hid] || ULT._)(P0.x, P0.y - 12) };
  D.onHit = function (e, src, cr, d) {
    O.onHit(e, src, cr, d); if (!G || hb <= 0) return; hb--;
    const P0 = G.p, x = e.x, y = e.y - e.r * .9, a = M.atan2(e.y - P0.y, e.x - P0.x), s = cl(e.r / 14, .8, 2), ev = G.evo || {}, big = e.boss || e.mb;
    switch (src) {
      case 'kiem': hitKiem(x, y, a, s, cr, ev.kiem, ev.kiem ? PK.kiemE : PK.kiem); break;
      case 'loi': { const p = ev.loi ? PK.loiE : PK.loi, o = mkBolt(x, y - 24, x, y + 6, 18, 3, 1); add({ k: 'b3', z: 1, o, T: .16, c: p.c, m: p.m, g: p.g, w: 1.2, x, y }); flash(x, y, 18 * s, .18, p); sparks(x, y, undefined, 0, 6, 250, p); break }
      case 'hang': { const p = ev.hang ? PK.hangE : PK.hang; flash(x, y, 20 * s, .22, p); ring(x, y + 8, 30 * s, .3, 4, p, { fl: .5 }); shards(x, y, 4, 170, p, 200, a, 2); dust(x, y + 8, 2, 80, 7, DUST, .5); break }
      case 'phi': { const p = ev.phi ? PK.phiE : PK.phi; cut(x, y, a + .9, 22 * s, 3.4, .18, p); sparks(x, y, a + 1.57, 1.2, 4, 220, p); break }
      case 'ult': { const p = PK[HEROPAL[uHero] || 'light']; flash(x, y, 24 * s, .22, p); cut(x, y, a + 1.2, 30 * s, 4.2, .22, p); sparks(x, y, undefined, 0, 5, 260, p); break }
      default: sparks(x, y, a, 1.4, 3, 200, PK.def);
    }
    if (cr) { const p = PK.light; flash(x, y, 30 * s, .3, p, { st: 1 }); ring(x, y, 40 * s, .3, 3, p, { fl: 1 }); cut(x, y, -.7, 44 * s, 5, .24, p); cut(x, y, .7, 44 * s, 5, .24, p) }
    if (big && (cr || src === 'ult')) ring(e.x, e.y + 8, e.r * 3, .4, 6, PK.def, { fl: .5, r0: .2 });
  };
  D.kill = function (e, src, d) {
    O.kill(e, src, d); if (!G || d >= 9999 || hb <= 0) return; const x = e.x, y = e.y - e.r * .8, p = PK[HEROPAL[uHero] || 'def'] && src === 'ult' ? PK[HEROPAL[uHero]] : src === 'loi' ? PK.loi : src === 'hang' ? PK.hang : src === 'phi' ? PK.phi : PK.kiem;
    for (let i = 0; i < cnt(6); i++) P('m', x + rr(-8, 8), y + rr(-8, 8), rr(-26, 26), rr(-80, -30), rr(.55, 1.0), rr(2, 3.6), R() < .5 ? p.c : p.m, 1, -20, 1.4); /* tan thành hạt sáng bay lên */
    flash(x, y, 16, .18, p, { st: 0 });
  };
  D.reset = function () { O.reset(); clearAll(); G = null };
  D.combo = comboFx;
  D.stats = function () { const s = O.stats(); s.v3 = FX.length; s.v3p = PT.length; return s };
  D.__v3 = 1;
  window.DV_VFX3 = { ok: () => true, combo: comboFx, stats: () => ({ fx: FX.length, pt: PT.length, capE: CAPE[Q], capP: CAPP[Q] }) };
})();
