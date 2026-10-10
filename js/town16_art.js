/* Phase 16 — Bộ asset "Cổ Trấn · Cầu Gỗ · Thác Nước" (window.DV_TOWN_ART)
 * Vẽ procedural bằng Canvas 2D (cùng cách với PAINT trong js/environment.js), bake một lần mỗi (asset, biến thể, dpr).
 * Mỗi asset: { w, h, ax, ay, n } — kích thước logic (px thế giới), điểm neo chân (ax, ay) trong sprite, n = số biến thể.
 * Phần chuyển động (đèn lồng đung đưa, cờ, thác chảy) KHÔNG nằm trong sprite mà do js/town16.js vẽ đè lên mỗi khung.
 * Dùng độc lập: DV_TOWN_ART.bake('shop', 1, dpr) → canvas.  Danh sách: DV_TOWN_ART.list
 */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = M.max(1, w | 0); c.height = M.max(1, h | 0); return c };
  const rng = seed => { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 } };
  const cl = v => M.max(0, M.min(255, v | 0));
  const parse = c => { if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] } const m = c.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]] };
  const S = (c, f) => { const a = parse(c); return `rgb(${cl(a[0] * f)},${cl(a[1] * f)},${cl(a[2] * f)})` };
  const X = (a, b, t) => { const p = parse(a), q = parse(b); return `rgb(${cl(p[0] + (q[0] - p[0]) * t)},${cl(p[1] + (q[1] - p[1]) * t)},${cl(p[2] + (q[2] - p[2]) * t)})` };
  const A = (c, a) => { const p = parse(c); return `rgba(${p[0]},${p[1]},${p[2]},${a})` };
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill() };
  const poly = (g, p, f, s, lw) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); g.fill(); if (s) { g.strokeStyle = s; g.lineWidth = lw || 1; g.stroke() } };
  const ln = (g, p, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.stroke() };
  const rect = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h) };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath() };
  const shadow = (g, cx, y, rx) => { const gr = g.createRadialGradient(cx, y, 2, cx, y, rx); gr.addColorStop(0, 'rgba(0,0,0,.34)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(0, y); g.scale(1, .2); g.translate(0, -y); g.fillStyle = gr; g.beginPath(); g.arc(cx, y, rx, 0, TAU); g.fill(); g.restore() };

  /* bảng màu */
  const WALL = ['#d8aa45', '#e7dcc0', '#b9c8ae'], ROOF = ['#6a4a3c', '#58544c', '#6b4638'], WOOD = '#6a2a1c', WOOD2 = '#8a4a2a', STONE = '#8c867a', BRICK = '#b46a46', GOLD = '#e8b84a', RED = '#c0302a';

  /* mái ngói âm dương: mặt trước hình thang có rãnh dọc + hàng ngói vảy cá, sống mái, đao cong */
  function roof(g, x0, x1, yT, yB, ins, col, o) {
    o = o || {}; const r = o.r || Math.random;
    const gr = g.createLinearGradient(0, yT, 0, yB); gr.addColorStop(0, S(col, 1.15)); gr.addColorStop(1, S(col, .76));
    poly(g, [[x0 + ins, yT], [x1 - ins, yT], [x1, yB], [x0, yB]], gr);
    const n = M.max(4, M.round((x1 - x0) / 7)); g.save(); g.beginPath(); g.moveTo(x0 + ins, yT); g.lineTo(x1 - ins, yT); g.lineTo(x1, yB); g.lineTo(x0, yB); g.closePath(); g.clip();
    g.strokeStyle = A(S(col, .55), .6); g.lineWidth = 1; g.beginPath();
    for (let i = 0; i <= n; i++) { const t = i / n; g.moveTo(x0 + ins + (x1 - x0 - 2 * ins) * t, yT); g.lineTo(x0 + (x1 - x0) * t, yB) } g.stroke();
    g.strokeStyle = A(S(col, 1.35), .35); g.beginPath(); for (let i = 0; i < n; i++) { const t = (i + .5) / n; g.moveTo(x0 + ins + (x1 - x0 - 2 * ins) * t, yT); g.lineTo(x0 + (x1 - x0) * t, yB) } g.stroke();
    const rows = M.max(3, M.round((yB - yT) / 6));
    for (let j = 1; j <= rows; j++) { const t = j / rows, y = yT + (yB - yT) * t, l = x0 + ins * (1 - t), rg = x1 - ins * (1 - t), w = (rg - l) / n; g.strokeStyle = A(S(col, .5), .55); g.lineWidth = 1; g.beginPath(); for (let i = 0; i < n; i++) { g.moveTo(l + i * w, y - 1.5); g.quadraticCurveTo(l + i * w + w / 2, y + 2.6, l + (i + 1) * w, y - 1.5) } g.stroke() }
    if (o.moss) for (let i = 0; i < 9; i++) ell(g, x0 + ins + r() * (x1 - x0 - 2 * ins), yT + r() * (yB - yT), 3 + r() * 7, 1.5 + r() * 3, `rgba(${80 + r() * 30 | 0},${130 + r() * 30 | 0},60,${.25 + r() * .25})`);
    g.restore();
    rect(g, x0 - 2, yB - 2, x1 - x0 + 4, 4.5, S(col, .5)); rect(g, x0 - 2, yB + 2, x1 - x0 + 4, 1.5, 'rgba(0,0,0,.25)');
    g.fillStyle = S(col, .66); rr(g, x0 + ins - 3, yT - 4, x1 - x0 - 2 * ins + 6, 6, 3); g.fill(); rect(g, x0 + ins - 2, yT - 4, x1 - x0 - 2 * ins + 4, 1.4, A(S(col, 1.5), .5));
    for (const s of [-1, 1]) { const px = s < 0 ? x0 + ins - 3 : x1 - ins + 3; g.fillStyle = S(col, .66); g.beginPath(); g.moveTo(px, yT + 1); g.quadraticCurveTo(px + s * 9, yT - 1, px + s * 10, yT - 11); g.quadraticCurveTo(px + s * 4, yT - 5, px, yT - 4); g.fill() }
  }
  /* mái cong đao (đình, tháp, cổng): hai mép cong vút, ngói kẻ theo hình quạt */
  function curved(g, cx, yT, wT, wB, yB, col, o) {
    o = o || {}; const lift = o.lift == null ? 13 : o.lift, tip = wB / 2 + (o.flare == null ? 9 : o.flare);
    const path = () => { g.beginPath(); g.moveTo(cx - wT / 2, yT); g.lineTo(cx + wT / 2, yT); g.quadraticCurveTo(cx + wB * .43, yB - 8, cx + tip, yB - lift); g.quadraticCurveTo(cx + wB * .3, yB + 5, cx, yB + 4); g.quadraticCurveTo(cx - wB * .3, yB + 5, cx - tip, yB - lift); g.quadraticCurveTo(cx - wB * .43, yB - 8, cx - wT / 2, yT); g.closePath() };
    const gr = g.createLinearGradient(0, yT, 0, yB); gr.addColorStop(0, S(col, 1.18)); gr.addColorStop(1, S(col, .72));
    g.save(); path(); g.fillStyle = gr; g.fill(); g.clip();
    const n = M.max(6, M.round(wB / 8)); g.lineWidth = 1;
    for (let i = 0; i <= n; i++) { const t = i / n; g.strokeStyle = A(S(col, i % 2 ? .5 : 1.4), i % 2 ? .6 : .3); g.beginPath(); g.moveTo(cx - wT / 2 + wT * t, yT); g.lineTo(cx - tip + tip * 2 * t, yB + 4); g.stroke() }
    const rows = M.max(3, M.round((yB - yT) / 6)); g.strokeStyle = A(S(col, .5), .5);
    for (let j = 1; j <= rows; j++) { const t = j / rows, y = yT + (yB - yT) * t, hw = (wT / 2) + (tip - wT / 2) * t; g.beginPath(); for (let i = 0; i < n; i++) { const a = cx - hw + hw * 2 * i / n, b = cx - hw + hw * 2 * (i + 1) / n; g.moveTo(a, y - 1.5); g.quadraticCurveTo((a + b) / 2, y + 2.4, b, y - 1.5) } g.stroke() }
    g.restore();
    g.strokeStyle = S(col, .45); g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - tip, yB - lift); g.quadraticCurveTo(cx - wB * .3, yB + 5, cx, yB + 4); g.quadraticCurveTo(cx + wB * .3, yB + 5, cx + tip, yB - lift); g.stroke();
    ell(g, cx, yB + 8, wB * .38, 3, 'rgba(0,0,0,.22)');
    g.fillStyle = S(col, .6); rr(g, cx - wT / 2 - 4, yT - 5, wT + 8, 7, 3.5); g.fill(); rect(g, cx - wT / 2 - 3, yT - 5, wT + 6, 1.4, A(S(col, 1.6), .5));
    if (o.dragon !== false) for (const s of [-1, 1]) { const px = cx + s * (wT / 2 + 4); g.strokeStyle = GOLD; g.lineWidth = 2.2; g.beginPath(); g.moveTo(px, yT - 3); g.quadraticCurveTo(px + s * 9, yT - 5, px + s * 9, yT - 14); g.quadraticCurveTo(px + s * 4, yT - 12, px + s * 6, yT - 8); g.stroke() }
    if (o.orb) { ell(g, cx, yT - 10, 5, 5, GOLD); ell(g, cx - 1.5, yT - 11.5, 1.8, 1.8, '#fff6c8'); ln(g, [[cx, yT - 5], [cx, yT - 2]], GOLD, 2) }
  }
  function col(g, x, y, w, h, c) { rect(g, x, y, w, h, c); rect(g, x + w * .62, y, w * .38, h, 'rgba(0,0,0,.28)'); rect(g, x, y, 1.6, h, 'rgba(255,255,255,.16)'); rect(g, x - 1.5, y + h - 4, w + 3, 4, S(STONE, .9)) }
  function planks(g, x, y, w, h, c, r) { rect(g, x, y, w, h, c); for (let i = 0; i < w; i += 5) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.07)'; g.fillRect(x + i, y, 1.4, h) } rect(g, x, y, w, 1.5, 'rgba(255,255,255,.12)') }
  function lattice(g, x, y, w, h, c) { g.strokeStyle = c; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i <= w; i += 5) { g.moveTo(x + i, y); g.lineTo(x + i, y + h) } for (let j = 0; j <= h; j += 5) { g.moveTo(x, y + j); g.lineTo(x + w, y + j) } g.stroke() }
  function stains(g, x, y, w, h, r, n) { for (let i = 0; i < n; i++) ell(g, x + r() * w, y + r() * h, 3 + r() * 9, 2 + r() * 5, `rgba(${r() < .5 ? '60,40,20' : '255,255,255'},${.05 + r() * .07})`) }
  function sign(g, x, y, w, h, r) { rect(g, x, y, w, h, '#a82820'); g.strokeStyle = GOLD; g.lineWidth = 1.4; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); for (let i = 0; i < 3; i++) { const yy = y + 6 + i * ((h - 12) / 3); ln(g, [[x + w * .3, yy], [x + w * .7, yy + 2 + r() * 4], [x + w * .35, yy + 6]], GOLD, 1.5) } }

  /* ============ DANH SÁCH ASSET ============ */
  const ART = {};

  ART.shop = { w: 156, h: 200, ax: 78, ay: 188, n: 3, solid: [2, 2], paint(g, r, v) {
    const wall = WALL[v % 3], rf = ROOF[v % 3]; shadow(g, 78, 189, 74);
    rect(g, 16, 118, 124, 68, wall); stains(g, 16, 118, 124, 68, r, 7); poly(g, [[16, 150], [30, 146], [34, 160], [18, 164]], A(BRICK, .55));
    rect(g, 12, 180, 132, 8, S(STONE, .95)); rect(g, 12, 180, 132, 1.6, 'rgba(255,255,255,.2)');
    planks(g, 24, 126, 24, 54, WOOD2, r); planks(g, 108, 126, 24, 54, WOOD2, r);
    rect(g, 48, 126, 60, 54, '#241410'); rect(g, 48, 126, 60, 5, 'rgba(0,0,0,.55)');
    for (let i = 0; i < 6; i++) ell(g, 56 + i * 8, 168, 3.2, 3.2, ['#d8532a', '#e8b84a', '#6aa04a', '#d8532a', '#b84a8a', '#e8b84a'][i]);
    rect(g, 48, 172, 60, 8, S(WOOD2, .85));
    col(g, 12, 114, 11, 72, WOOD); col(g, 133, 114, 11, 72, WOOD); col(g, 73, 114, 10, 72, WOOD);
    sign(g, 116, 124, 14, 40, r); ln(g, [[123, 118], [123, 124]], '#2a1810', 1.5);
    roof(g, 2, 154, 96, 118, 8, rf, { r });
    rect(g, 26, 58, 104, 40, X(wall, '#ffffff', .1)); stains(g, 26, 58, 104, 40, r, 4); rect(g, 22, 56, 112, 4, WOOD); rect(g, 22, 94, 112, 4, WOOD);
    for (const x of [38, 92]) { rect(g, x - 2, 64, 30, 28, WOOD); rect(g, x, 66, 26, 24, '#1b1210'); planks(g, x, 66, 12, 24, v === 1 ? '#3b7a6a' : '#2f6b57', r); planks(g, x + 14, 66, 12, 24, v === 1 ? '#3b7a6a' : '#2f6b57', r); lattice(g, x, 66, 26, 24, A('#1b1210', .55)) }
    rect(g, 26, 90, 104, 3, S(WOOD, 1.1)); for (let x = 30; x < 128; x += 8) rect(g, x, 92, 2.4, 5, S(WOOD, .9));
    roof(g, 6, 150, 14, 58, 28, rf, { r, moss: v !== 1 });
    poly(g, [[78, 4], [88, 14], [68, 14]], S(rf, .8)); ell(g, 78, 3, 3, 3, GOLD);
  }, lan: [[18, 118, 1], [138, 118, 1], [126, 120, .8]] };

  ART.wide = { w: 232, h: 168, ax: 116, ay: 156, n: 2, solid: [3, 2], paint(g, r, v) {
    const wall = WALL[(v + 1) % 3], rf = ROOF[(v + 1) % 3]; shadow(g, 116, 158, 108);
    rect(g, 12, 148, 208, 8, S(STONE, .95)); rect(g, 18, 90, 196, 58, wall); stains(g, 18, 90, 196, 58, r, 9);
    rect(g, 18, 90, 196, 6, 'rgba(0,0,0,.28)');
    rect(g, 96, 104, 40, 44, '#241410'); rect(g, 100, 108, 32, 38, '#3a2418'); lattice(g, 100, 108, 32, 38, A(GOLD, .35)); rect(g, 100, 100, 32, 4, RED);
    for (const x of [30, 150]) { rect(g, x, 100, 50, 38, '#d8c79a'); for (let i = 0; i < 50; i += 3) rect(g, x + i, 100, 1, 38, r() < .5 ? 'rgba(120,90,40,.35)' : 'rgba(255,255,255,.18)'); rect(g, x - 2, 98, 54, 3, S(WOOD, 1)); ln(g, [[x + 25, 138], [x + 25, 148]], '#4a3a20', 1) }
    for (let i = 0; i < 6; i++) col(g, 20 + i * 36, 88, 9, 62, WOOD);
    roof(g, 2, 230, 22, 90, 34, rf, { r, moss: true });
    poly(g, [[116, 8], [128, 22], [104, 22]], S(rf, .8)); ell(g, 116, 6, 3.4, 3.4, GOLD);
  }, lan: [[30, 90, 1], [112, 92, 1.1], [202, 90, 1]] };

  ART.dinh = { w: 348, h: 262, ax: 174, ay: 250, n: 1, solid: [5, 2], paint(g, r) {
    shadow(g, 174, 252, 164);
    rect(g, 14, 236, 320, 14, S(STONE, .85)); rect(g, 28, 223, 292, 14, STONE); rect(g, 42, 211, 264, 13, S(STONE, 1.12));
    for (const y of [236, 223, 211]) rect(g, 14, y, 320, 1.4, 'rgba(255,255,255,.22)');
    for (let i = 0; i < 9; i++) rect(g, 140 + i * 8, 224, 1, 26, 'rgba(0,0,0,.2)');
    rect(g, 70, 140, 208, 72, '#7a1a16'); rect(g, 70, 140, 208, 5, 'rgba(0,0,0,.4)');
    rect(g, 122, 146, 104, 66, '#2a0e0c'); lattice(g, 122, 146, 104, 66, A(GOLD, .5)); rect(g, 172, 146, 4, 66, GOLD);
    for (const x of [82, 244]) { rect(g, x, 156, 22, 38, '#241410'); lattice(g, x, 156, 22, 38, A(GOLD, .55)) }
    for (let i = 0; i < 8; i++) { const x = 64 + i * 31; col(g, x, 134, 12, 78, i === 3 || i === 4 ? '#8a1a14' : '#a02018'); rect(g, x - 2, 130, 16, 5, GOLD) }
    rect(g, 66, 126, 216, 10, '#8a1a14'); rect(g, 66, 126, 216, 2, GOLD); rect(g, 66, 134, 216, 1.5, A(GOLD, .8));
    rect(g, 100, 104, 148, 24, '#7a1a16'); lattice(g, 104, 108, 140, 16, A(GOLD, .45)); rect(g, 100, 104, 148, 3, GOLD);
    curved(g, 174, 78, 120, 332, 140, '#7a5a48', { lift: 15, flare: 12 });
    curved(g, 174, 28, 56, 190, 90, '#6e5040', { lift: 12, flare: 10, orb: true });
    rect(g, 140, 86, 68, 20, '#7a1a16'); g.strokeStyle = GOLD; g.lineWidth = 1.4; g.strokeRect(141, 87, 66, 18);
    g.fillStyle = GOLD; g.font = 'bold 13px "Times New Roman",Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ĐÌNH LÀNG', 174, 96.5);
  }, lan: [[92, 138, 1.15], [170, 140, 1.2], [256, 138, 1.15]] };

  ART.pagoda = { w: 140, h: 346, ax: 70, ay: 334, n: 1, solid: [2, 2], paint(g, r) {
    shadow(g, 70, 336, 62);
    rect(g, 10, 322, 120, 12, S(STONE, .85)); rect(g, 20, 311, 100, 12, STONE);
    const tiers = [[60, 46, '#a85a3e'], [52, 40, '#b0644a'], [44, 36, '#b86e52'], [36, 30, '#c07a5c']]; let y = 311;
    tiers.forEach((t, i) => {
      const bw = t[0], bh = t[1], x = 70 - bw / 2; rect(g, x, y - bh, bw, bh, t[2]); rect(g, x + bw * .66, y - bh, bw * .34, bh, 'rgba(0,0,0,.22)'); stains(g, x, y - bh, bw, bh, r, 3);
      for (let k = 0; k < 3; k++) rect(g, x + 2, y - bh + 5 + k * (bh / 3), bw - 4, 1, 'rgba(0,0,0,.14)');
      g.fillStyle = '#1e1008'; g.beginPath(); g.moveTo(70 - 7, y - 4); g.lineTo(70 - 7, y - bh * .55); g.arc(70, y - bh * .55, 7, M.PI, 0); g.lineTo(70 + 7, y - 4); g.fill(); ln(g, [[70, y - bh * .45], [70, y - 4]], A(GOLD, .5), 1);
      for (const s of [-1, 1]) col(g, 70 + s * (bw / 2 - 5) - 3, y - bh, 6, bh, WOOD);
      curved(g, 70, y - bh - 22, bw + 8, bw + 52 - i * 4, y - bh + 6, '#6a5040', { lift: 11, flare: 8, dragon: i === 0, orb: false });
      y -= bh + 26 - (i === 3 ? 4 : 0);
    });
    ln(g, [[70, y + 12], [70, 12]], '#3a2a1c', 3); for (let k = 0; k < 4; k++) ell(g, 70, 20 + k * 8, 6 - k * .9, 2, GOLD); ell(g, 70, 8, 4, 4, GOLD); ell(g, 69, 7, 1.4, 1.4, '#fff6c8');
  }, lan: [[28, 270, .9], [112, 270, .9]] };

  ART.gate = { w: 420, h: 250, ax: 210, ay: 240, n: 1, solid: [0, 0], paint(g, r) {
    shadow(g, 210, 242, 190);
    for (const x of [28, 336]) {
      rect(g, x - 6, 226, 68, 14, S(STONE, .85)); rect(g, x, 124, 56, 106, BRICK); rect(g, x + 38, 124, 18, 106, 'rgba(0,0,0,.24)'); rect(g, x, 124, 3, 106, 'rgba(255,255,255,.14)');
      for (let j = 0; j < 9; j++) { const y = 130 + j * 11; g.strokeStyle = 'rgba(60,24,12,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 56, y); g.stroke(); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + 7 + i * 14 + (j % 2) * 7, y); g.lineTo(x + 7 + i * 14 + (j % 2) * 7, y + 11); g.stroke() } }
      stains(g, x, 124, 56, 106, r, 8); rect(g, x - 5, 116, 66, 10, WOOD); rect(g, x - 5, 116, 66, 2, A(GOLD, .8));
      curved(g, x + 28, 98, 38, 90, 118, '#6a4a3c', { lift: 9, flare: 6, dragon: false, orb: true });
      rect(g, x + 14, 148, 28, 52, '#7a1a16'); g.strokeStyle = GOLD; g.lineWidth = 1.2; g.strokeRect(x + 15, 149, 26, 50); for (let k = 0; k < 4; k++) ln(g, [[x + 20, 158 + k * 11], [x + 36, 158 + k * 11]], A(GOLD, .8), 1.2);
    }
    rect(g, 84, 122, 252, 22, WOOD); rect(g, 84, 122, 252, 3, A(GOLD, .9)); rect(g, 84, 141, 252, 3, 'rgba(0,0,0,.35)');
    for (let i = 0; i < 6; i++) { const x = 100 + i * 42; ln(g, [[x, 125], [x + 8, 138], [x + 16, 125]], A(GOLD, .5), 1.3) }
    rect(g, 156, 98, 108, 26, '#7a1a16'); g.strokeStyle = GOLD; g.lineWidth = 1.6; g.strokeRect(157.5, 99.5, 105, 23);
    g.fillStyle = GOLD; g.font = 'bold 15px "Times New Roman",Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CỔ TRẤN', 210, 112);
    curved(g, 210, 52, 130, 340, 100, '#6e5242', { lift: 14, flare: 12, orb: true });
  }, lan: [[88, 144, 1.2], [210, 146, 1.2], [332, 144, 1.2]] };

  ART.stall = { w: 120, h: 132, ax: 60, ay: 122, n: 3, solid: [1, 1], paint(g, r, v) {
    shadow(g, 60, 124, 54); const aw = [['#c0302a', '#f0e4c0'], ['#2f6b57', '#f0e4c0'], ['#d8a040', '#7a2a1c']][v % 3];
    ln(g, [[16, 120], [18, 44]], WOOD, 4); ln(g, [[104, 120], [102, 44]], WOOD, 4);
    rect(g, 18, 86, 84, 34, WOOD2); rect(g, 18, 86, 84, 4, S(WOOD2, 1.2)); rect(g, 18, 108, 84, 12, S(WOOD2, .75)); planks(g, 18, 90, 84, 18, WOOD2, r);
    const goods = [['#d8532a', 6], ['#e8b84a', 6], ['#6aa04a', 5], ['#b84a8a', 5], ['#e87a2a', 6]];
    for (let i = 0; i < 9; i++) { const q = goods[(i + v) % 5]; ell(g, 26 + i * 8.5, 82 - (i % 2) * 4, q[1] * .62, q[1] * .56, q[0]); ell(g, 25 + i * 8.5, 80 - (i % 2) * 4, 1.4, 1.2, 'rgba(255,255,255,.5)') }
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? aw[1] : aw[0]; g.beginPath(); g.moveTo(10 + i * 16.7, 36); g.lineTo(10 + (i + 1) * 16.7, 36); g.lineTo(4 + (i + 1) * 18.7, 66); g.lineTo(4 + i * 18.7, 66); g.fill() }
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? aw[1] : aw[0]; g.beginPath(); g.arc(13 + i * 18.7, 66, 9.3, 0, M.PI); g.fill() }
    rect(g, 8, 32, 104, 6, WOOD); rect(g, 8, 32, 104, 1.4, 'rgba(255,255,255,.2)');
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(4, 66, 112, 4);
  }, lan: [[60, 70, .8]] };

  ART.well = { w: 84, h: 100, ax: 42, ay: 88, n: 1, solid: [1, 1], paint(g, r) {
    shadow(g, 42, 90, 36); ell(g, 42, 76, 30, 13, S(STONE, .7)); ell(g, 42, 72, 30, 13, STONE); ell(g, 42, 72, 23, 9, '#14202a'); ell(g, 42, 74, 20, 6, '#22485a'); ell(g, 36, 73, 6, 1.6, 'rgba(255,255,255,.3)');
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ell(g, 42 + M.cos(a) * 26.5, 72 + M.sin(a) * 11, 5, 3.2, i % 2 ? S(STONE, 1.1) : S(STONE, .9)) }
    rect(g, 14, 36, 5, 40, WOOD); rect(g, 65, 36, 5, 40, WOOD); rect(g, 12, 32, 60, 6, S(WOOD, 1.1));
    roof(g, 8, 76, 14, 34, 10, '#6a4a3c', { r }); ln(g, [[42, 36], [42, 62]], '#d8c79a', 1.4); rr(g, 38, 60, 8, 8, 2); g.fillStyle = WOOD2; g.fill();
  }, lan: [] };

  ART.lamp = { w: 46, h: 150, ax: 23, ay: 140, n: 1, solid: [0, 0], paint(g, r) {
    shadow(g, 23, 142, 14); rect(g, 16, 134, 14, 6, S(STONE, .9)); rect(g, 20, 36, 6, 100, WOOD); rect(g, 23.5, 36, 2.5, 100, 'rgba(0,0,0,.3)'); ln(g, [[23, 40], [38, 34]], WOOD, 3); ln(g, [[23, 56], [36, 40]], WOOD2, 2); ell(g, 23, 34, 4.5, 4.5, S(WOOD, 1.1));
  }, lan: [[38, 38, 1.15]] };

  ART.post = { w: 30, h: 80, ax: 15, ay: 72, n: 1, solid: [0, 0], paint(g, r) {
    shadow(g, 15, 73, 11); rect(g, 10, 26, 10, 46, WOOD2); rect(g, 15, 26, 5, 46, 'rgba(0,0,0,.28)'); rect(g, 8, 22, 14, 6, S(WOOD, .9)); rr(g, 9, 18, 12, 6, 2); g.fillStyle = S(WOOD2, 1.15); g.fill(); for (let i = 0; i < 3; i++) rect(g, 10, 36 + i * 11, 10, 1.4, 'rgba(0,0,0,.25)');
  }, lan: [] };

  ART.bamboo = { w: 140, h: 230, ax: 70, ay: 218, n: 2, solid: [1, 1], paint(g, r, v) {
    shadow(g, 70, 220, 44); const n = 9 + v * 2;
    const stems = []; for (let i = 0; i < n; i++) stems.push({ x: 40 + r() * 60, h: 120 + r() * 80, lean: (r() - .5) * 16, w: 3.4 + r() * 2, hue: 80 + r() * 20 });
    stems.sort((a, b) => a.h - b.h);
    for (const s of stems) {
      const top = 218 - s.h; g.strokeStyle = `hsl(${s.hue},46%,${34 + (s.x % 9)}%)`; g.lineWidth = s.w; g.lineCap = 'butt'; g.beginPath(); g.moveTo(s.x, 218); g.quadraticCurveTo(s.x + s.lean * .3, 218 - s.h * .5, s.x + s.lean, top); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s.x - s.w * .3, 218); g.quadraticCurveTo(s.x + s.lean * .3 - s.w * .3, 218 - s.h * .5, s.x + s.lean - s.w * .3, top); g.stroke();
      for (let j = 1; j < 7; j++) { const t = j / 7, yy = 218 - s.h * t, xx = s.x + s.lean * t * t; rect(g, xx - s.w * .7, yy, s.w * 1.4, 1.6, `hsl(${s.hue},40%,22%)`) }
      for (let k = 0; k < 6; k++) { const t = .55 + k * .08, yy = 218 - s.h * t, xx = s.x + s.lean * t * t, dir = k % 2 ? 1 : -1; g.fillStyle = `hsl(${88 + r() * 24},${52 + r() * 10}%,${30 + r() * 18}%)`; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + dir * 14, yy - 10 + r() * 6, xx + dir * (24 + r() * 8), yy + 7); g.quadraticCurveTo(xx + dir * 12, yy - 1, xx, yy); g.fill() }
    }
  }, lan: [] };

  ART.peach = { w: 160, h: 190, ax: 80, ay: 178, n: 2, solid: [1, 1], paint(g, r, v) {
    shadow(g, 80, 180, 40); poly(g, [[70, 178], [74, 110], [84, 110], [92, 178]], '#4a342a'); ln(g, [[78, 120], [52, 90], [40, 70]], '#4a342a', 6); ln(g, [[82, 116], [112, 88], [124, 66]], '#4a342a', 6); ln(g, [[80, 100], [82, 66], [74, 44]], '#4a342a', 5); ln(g, [[78, 150], [96, 140]], '#4a342a', 3);
    const pk = v ? ['#f6a3c0', '#ffd0e0', '#e87aa0'] : ['#f8b0c8', '#ffe0ea', '#ee88aa'];
    const cl_ = [[40, 66, 28], [124, 62, 28], [80, 40, 34], [60, 88, 24], [104, 86, 24], [24, 88, 16], [140, 86, 16]];
    for (const c of cl_) for (let i = 0; i < 26; i++) { const a = r() * TAU, d = r() * c[2]; ell(g, c[0] + M.cos(a) * d, c[1] + M.sin(a) * d * .8, 3 + r() * 3.4, 2.6 + r() * 2.4, pk[(r() * 3) | 0] + ''); }
    for (let i = 0; i < 40; i++) { const c = cl_[(r() * cl_.length) | 0], a = r() * TAU, d = r() * c[2]; ell(g, c[0] + M.cos(a) * d, c[1] + M.sin(a) * d * .8, 1.2, 1.2, '#fff8e8') }
    for (let i = 0; i < 8; i++) ell(g, 40 + r() * 80, 172 + r() * 7, 3, 1.6, pk[1]);
  }, lan: [] };

  ART.boat = { w: 190, h: 80, ax: 95, ay: 52, n: 1, solid: [0, 0], paint(g, r) {
    ell(g, 95, 58, 82, 10, 'rgba(0,0,0,.28)');
    g.fillStyle = '#4a2a1c'; g.beginPath(); g.moveTo(10, 38); g.quadraticCurveTo(95, 66, 180, 36); g.lineTo(170, 52); g.quadraticCurveTo(95, 66, 20, 52); g.closePath(); g.fill();
    g.fillStyle = '#6a3c28'; g.beginPath(); g.moveTo(10, 38); g.quadraticCurveTo(95, 56, 180, 36); g.quadraticCurveTo(95, 48, 10, 38); g.fill();
    ln(g, [[12, 38], [4, 28]], '#4a2a1c', 3); ln(g, [[178, 36], [188, 26]], '#4a2a1c', 3);
    g.fillStyle = '#b09060'; g.beginPath(); g.moveTo(54, 40); g.quadraticCurveTo(96, 6, 138, 40); g.lineTo(130, 42); g.quadraticCurveTo(96, 16, 62, 42); g.closePath(); g.fill();
    g.fillStyle = '#8a6c42'; g.beginPath(); g.moveTo(62, 42); g.quadraticCurveTo(96, 16, 130, 42); g.quadraticCurveTo(96, 28, 62, 42); g.fill();
    for (let i = 0; i < 9; i++) { const t = i / 8; g.strokeStyle = 'rgba(70,46,20,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(58 + t * 76, 40); g.quadraticCurveTo(70 + t * 52, 14, 62 + t * 68, 41); g.stroke() }
    rect(g, 66, 38, 60, 6, '#22140c'); ln(g, [[150, 40], [172, 8]], '#8a6a3a', 2);
  }, lan: [] };

  ART.cliff = { w: 720, h: 380, ax: 360, ay: 366, n: 1, solid: [10, 2], paint(g, r) {
    shadow(g, 360, 368, 330);
    const W0 = 720, top = 64, base = 362, cx = 360;
    const gr = g.createLinearGradient(0, top, 0, base); gr.addColorStop(0, '#7a7870'); gr.addColorStop(.45, '#5c5a58'); gr.addColorStop(1, '#3e3c42');
    g.fillStyle = gr; g.beginPath(); g.moveTo(10, base); g.lineTo(0, top + 90); g.lineTo(20, top + 40);
    for (let x = 20; x <= 700; x += 20) g.lineTo(x, top + 6 + M.sin(x * .05) * 7 + (r() - .5) * 14 + (x < 80 || x > 640 ? 30 : 0));
    g.lineTo(720, top + 90); g.lineTo(710, base); g.closePath(); g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 70; i++) { const x = r() * W0, w = 6 + r() * 24; g.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.09)'; g.fillRect(x, top + r() * 40, w, base - top); }
    for (let j = 0; j < 12; j++) { const y = top + 30 + j * 24 + r() * 8; g.strokeStyle = r() < .5 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.1)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W0; x += 24) g.lineTo(x, y + (r() - .5) * 8); g.stroke() }
    for (let i = 0; i < 26; i++) { const x = r() * W0, y = top + 30 + r() * 250; ln(g, [[x, y], [x + (r() - .5) * 14, y + 14 + r() * 24], [x + (r() - .5) * 20, y + 40 + r() * 20]], 'rgba(0,0,0,.28)', 1.4) }
    const sx = 360 - 92, sw = 184; const wg = g.createLinearGradient(sx, 0, sx + sw, 0); wg.addColorStop(0, 'rgba(10,20,26,0)'); wg.addColorStop(.2, 'rgba(10,20,26,.55)'); wg.addColorStop(.8, 'rgba(10,20,26,.55)'); wg.addColorStop(1, 'rgba(10,20,26,0)'); g.fillStyle = wg; g.fillRect(sx - 20, top, sw + 40, base - top);
    for (let i = 0; i < 40; i++) ell(g, r() * W0, top + 20 + r() * 300, 10 + r() * 28, 4 + r() * 8, `rgba(${70 + r() * 30 | 0},${110 + r() * 30 | 0},60,${.1 + r() * .18})`);
    g.restore();
    for (let k = 0; k < 16; k++) { const x = 40 + k * 42 + r() * 20; if (x > 250 && x < 470) continue; const y = top + 8 + M.sin(x * .05) * 7 + (x < 80 || x > 640 ? 30 : 0); for (let i = 0; i < 4; i++) ell(g, x + (r() - .5) * 30, y - 2 - r() * 18, 14 + r() * 14, 9 + r() * 7, `hsl(${100 + r() * 30},${44 + r() * 10}%,${22 + r() * 14}%)`) }
    for (const x of [50, 108, 600, 668]) { poly(g, [[x - 3, top + 24], [x + 3, top + 24], [x + 4, top - 12], [x - 4, top - 12]], '#4a342a'); for (let i = 0; i < 5; i++) ell(g, x + (r() - .5) * 34, top - 22 - r() * 26, 17 + r() * 10, 12 + r() * 8, `hsl(${108 + r() * 20},${46 + r() * 10}%,${20 + r() * 12}%)`) }
    for (let i = 0; i < 20; i++) { const x = 20 + r() * 680; if (x > 250 && x < 470) continue; const y = top + 30 + r() * 20; for (let k = 0; k < 3; k++) ln(g, [[x + k * 3, y], [x + k * 3 + (r() - .5) * 6, y + 20 + r() * 40]], `hsl(${100 + r() * 20},40%,${24 + r() * 8}%)`, 1.6) }
    for (const x of [14, 60, 160, 560, 650, 706]) { const w = 34 + r() * 26; ell(g, x, base - 8, w, 20, S('#44424a', .8)); ell(g, x - 4, base - 12, w * .8, 15, '#5c5a60'); ell(g, x - 8, base - 18, w * .4, 6, 'rgba(255,255,255,.14)') }
  }, lan: [] };

  /* deck cầu gỗ vẽ trực tiếp lên nền (xem town16.js) — ở đây chỉ có trụ cầu + lan can để y-sort */

  /* ============ API ============ */
  const CACHE = {};
  function bake(name, v, k) {
    const a = ART[name]; if (!a) return null; v = (v | 0) % (a.n || 1); k = k || 1;
    const key = name + v + '@' + k; if (CACHE[key]) return CACHE[key];
    const c = mk(M.ceil(a.w * k), M.ceil(a.h * k)), g = c.getContext('2d'); g.scale(k, k);
    try { a.paint(g, rng(M.imul(name.length * 7919 + name.charCodeAt(0) * 131, 2654435761) + v * 977 + 5), v) } catch (e) { console.warn('DV_TOWN_ART:', name, e) }
    return CACHE[key] = c;
  }
  const list = {}; for (const k in ART) { const a = ART[k]; list[k] = { w: a.w, h: a.h, ax: a.ax, ay: a.ay, n: a.n, lan: a.lan || [], solid: a.solid } }
  window.DV_TOWN_ART = { bake, list, names: Object.keys(ART), flush: () => { for (const k in CACHE) delete CACHE[k] } };
})();
