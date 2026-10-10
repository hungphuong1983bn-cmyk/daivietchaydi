/* Phase 6 — Engine Map & Môi trường (window.DV_ENV).
   Đọc dữ liệu từ data/environments.js. Thiếu dữ liệu / chưa có DV_DATA.db → DV_ENV.ok() = false và game dùng nền cũ.
   Các phần: 1) tiện ích  2) nền (tile bake)  3) chướng ngại  4) vùng địa hình  5) thời tiết  6) ánh sáng
             7) đấu trường Boss  8) hazard  9) API công khai */
(function () {
  'use strict';
  const D = window.DV_DATA;
  if (!D || !D.envThemes || !D.envAreas) return;
  const RU = D.envRules, TH = D.envThemes, AR = D.envAreas, M = Math, TAU = M.PI * 2, R = Math.random;

  /* ================= 1) TIỆN ÍCH ================= */
  const hs = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return (h ^ (h >>> 16)) >>> 0 };
  const rng = seed => { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 } };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = M.max(1, w | 0); c.height = M.max(1, h | 0); return c };
  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] };
  const cl = v => M.max(0, M.min(255, v | 0));
  const shade = (h, f) => { const c = hex(h); return `rgb(${cl(c[0] * f)},${cl(c[1] * f)},${cl(c[2] * f)})` };
  const mix = (a, b, t) => { const p = hex(a), q = hex(b); return `rgb(${cl(p[0] + (q[0] - p[0]) * t)},${cl(p[1] + (q[1] - p[1]) * t)},${cl(p[2] + (q[2] - p[2]) * t)})` };
  const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})` };
  const rgbs = h => hex(h).join(',');
  const hsl = (h, s, l, a) => a == null ? `hsl(${h | 0},${M.max(0, s)}%,${M.max(0, M.min(100, l))}%)` : `hsla(${h | 0},${M.max(0, s)}%,${M.max(0, M.min(100, l))}%,${a})`;
  const pick = (r, a) => a[(r() * a.length) | 0];
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill() };
  const poly = (g, p, f, s) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); g.fill(); if (s) { g.strokeStyle = s; g.lineWidth = 1; g.stroke() } };
  const ln = (g, p, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.stroke() };
  const sdw = (g, rx) => ell(g, 48, 103, rx, rx * .32, 'rgba(0,0,0,.3)');
  const ease = t => 1 - (1 - t) * (1 - t);
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath() };
  const SOFT = {};
  function soft(rgb) {                                        // sprite tròn mờ dần (dùng cho glow, sương, đèn)
    let c = SOFT[rgb]; if (c) return c;
    c = mk(128, 128); const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.35, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return SOFT[rgb] = c;
  }
  let LSPR = null;
  function lightSprite() {
    if (LSPR) return LSPR; LSPR = mk(128, 128); const g = LSPR.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.5, 'rgba(0,0,0,.82)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return LSPR;
  }

  /* ================= 3a) DANH SÁCH CHƯỚNG NGẠI ================= */
  const OBK = ['rock', 'boulder', 'bush', 'oak', 'pine', 'willow', 'reed', 'mangrove', 'deadtree', 'palm', 'cactus', 'pillar', 'ruin', 'crystal', 'stalag', 'coral', 'lavarock', 'bones', 'tomb', 'spire', 'icecrys', 'cloudcol', 'voidrock', 'brazier', 'totem', 'banner', 'tsolid', 'tpost'];   /* Phase 16: tsolid/tpost = ô va chạm vô hình của khu Cổ Trấn */
  const OBR = [13, 17, 13, 11, 9, 10, 8, 12, 8, 8, 9, 11, 15, 11, 11, 11, 14, 10, 10, 11, 12, 12, 13, 0, 0, 0, 28, 12];   // bán kính va chạm (px)
  const KI = {}; OBK.forEach((k, i) => KI[k] = i + 1);

  /* ================= 2) NỀN: bake tile ================= */
  const GD = {
    grass(g, r, P, d) {
      for (let i = 0, n = (3 + r() * 3) * d; i < n; i++) { const x = 4 + r() * 56, y = 8 + r() * 50; g.strokeStyle = hsl(P.h + 6 + r() * 10, P.s + 10, P.l + 8 + r() * 8); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1 + r() * 2, y - 5 - r() * 4); g.moveTo(x + 2, y); g.lineTo(x + 3 + r() * 2, y - 4 - r() * 3); g.stroke() }
      if (r() < .3 * d) { const x = 8 + r() * 48, y = 10 + r() * 44; ell(g, x, y, 1.9, 1.9, pick(r, P.t.flower || ['#fff'])); ell(g, x, y, .7, .7, '#ffe27a') }
    },
    water(g, r, P, d) {
      for (let i = 0; i < 2 * d; i++) { g.strokeStyle = hsl(P.h, P.s, P.l + 14, .3); g.lineWidth = 1.2; g.beginPath(); g.arc(10 + r() * 44, 10 + r() * 44, 6 + r() * 10, .2, 2.3); g.stroke() }
      if (r() < .4) ell(g, 8 + r() * 48, 8 + r() * 48, 1.3, 1.3, 'rgba(255,255,255,.55)');
      if (r() < .25 * d) ell(g, 10 + r() * 44, 10 + r() * 44, 5, 2, hsl(P.h, P.s, P.l - 7, .5));
    },
    dust(g, r, P, d) {
      for (let i = 0, n = (3 + r() * 3) * d; i < n; i++) ell(g, 4 + r() * 56, 4 + r() * 56, 1.5 + r() * 2, 1 + r(), hsl(P.h, P.s - 6, P.l + (r() < .5 ? 7 : -6), .7));
      if (r() < .35) { const x = 6 + r() * 40, y = 6 + r() * 50; ln(g, [[x, y], [x + 8, y + 4 + r() * 4], [x + 16, y + 2 + r() * 8]], hsl(P.h, P.s, P.l - 10, .45), 1) }
    },
    leaf(g, r, P, d) {
      for (let i = 0, n = (4 + r() * 4) * d; i < n; i++) ell(g, 4 + r() * 56, 4 + r() * 56, 2.6, 1.2, hsl(r() < .5 ? P.h + 20 + r() * 20 : P.h - 30 + r() * 20, 50, P.l + 10 + r() * 10, .75), r() * 3);
      for (let i = 0; i < 3 * d; i++) ell(g, 4 + r() * 56, 4 + r() * 56, 3 + r() * 3, 2 + r() * 2, hsl(P.h, P.s + 6, P.l - 5, .45));
    },
    stone(g, r, P, d) {
      g.strokeStyle = hsl(P.h, P.s, P.l - 9, .6); g.lineWidth = 1.4; g.strokeRect(.7, .7, 62.6, 62.6);
      const x = 14 + r() * 36; g.beginPath(); if (r() < .5) { g.moveTo(x, .7); g.lineTo(x, 32) } else { g.moveTo(x, 32); g.lineTo(x, 63) } g.moveTo(.7, 32); g.lineTo(63, 32 + (r() - .5) * 2); g.stroke();
      g.strokeStyle = hsl(P.h, P.s, P.l + 8, .25); g.beginPath(); g.moveTo(2, 2); g.lineTo(62, 2); g.stroke();
      if (r() < .4 * d) { const a = 6 + r() * 40, b = 6 + r() * 44; ln(g, [[a, b], [a + 7, b + 5], [a + 10, b + 12]], hsl(P.h, P.s, P.l - 12, .5), 1) }
      if (r() < .3 * d) ell(g, 8 + r() * 48, 8 + r() * 48, 4 + r() * 3, 2 + r() * 2, hsl(P.h + 60, 32, P.l - 3, .5));
    },
    mud(g, r, P, d) {
      if (r() < .55 * d) { const x = 14 + r() * 36, y = 14 + r() * 36; ell(g, x, y, 10 + r() * 7, 5 + r() * 3, hsl(P.h, P.s, P.l - 6, .75)); ell(g, x - 2, y - 1, 5, 1.6, hsl(P.h, P.s - 6, P.l + 14, .5)) }
      for (let i = 0, n = (2 + r() * 3) * d; i < n; i++) { const x = 4 + r() * 56, y = 10 + r() * 48; g.strokeStyle = hsl(P.h + 20, 36, P.l + 6, .8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 6); g.moveTo(x + 2, y); g.lineTo(x + 3, y - 5); g.stroke() }
    },
    rock(g, r, P, d) {
      for (let i = 0, n = (5 + r() * 4) * d; i < n; i++) ell(g, 3 + r() * 58, 3 + r() * 58, 1.4 + r() * 2.4, 1 + r() * 1.4, hsl(P.h, P.s, P.l + (r() < .5 ? 9 : -8), .75), r() * 3);
      if (r() < .5) { const y = 8 + r() * 44; ln(g, [[0, y], [22, y + 5], [44, y + 3], [64, y + 9]], hsl(P.h, P.s, P.l - 8, .35), 1.2) }
    },
    crystal(g, r, P, d) {
      for (let i = 0, n = (2 + r() * 3) * d; i < n; i++) { const x = 5 + r() * 54, y = 5 + r() * 54, s = 1 + r() * 2; g.fillStyle = hsl(P.h + 20, 70, 72, .5 + r() * .4); g.fillRect(x - .5, y - s * 2, 1, s * 4); g.fillRect(x - s * 2, y - .5, s * 4, 1); ell(g, x, y, s * .8, s * .8, 'rgba(255,255,255,.8)') }
      if (r() < .45) { const x = r() * 40, y = 8 + r() * 46; ln(g, [[x, y], [x + 9, y + 6], [x + 14, y + 4], [x + 24, y + 12]], hsl(P.h + 20, 60, 50, .35), 3); ln(g, [[x, y], [x + 9, y + 6], [x + 14, y + 4], [x + 24, y + 12]], hsl(P.h + 20, 80, 70, .75), 1) }
    },
    foam(g, r, P, d) {
      for (let i = 0; i < 2 * d; i++) { const x = 8 + r() * 44, y = 10 + r() * 44; g.strokeStyle = hsl(P.h, 50, P.l + 20, .35); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 5, x + 16, y); g.quadraticCurveTo(x + 24, y + 5, x + 30, y); g.stroke() }
      for (let i = 0; i < 4 * d; i++) ell(g, 4 + r() * 56, 4 + r() * 56, 1 + r(), 1 + r(), 'rgba(255,255,255,.55)');
      if (r() < .18) ell(g, 10 + r() * 44, 10 + r() * 44, 3, 2, hsl(15, 60, 78, .9));
    },
    lava(g, r, P, d) {
      for (let i = 0, n = (4 + r() * 4) * d; i < n; i++) ell(g, 3 + r() * 58, 3 + r() * 58, 1.2 + r() * 2.4, 1 + r() * 1.4, hsl(P.h, 10, P.l + (r() < .5 ? 5 : -3), .8), r() * 3);
      if (r() < .7) { const p = [[r() * 20, 6 + r() * 52]]; for (let i = 0; i < 4; i++) p.push([p[i][0] + 8 + r() * 10, p[i][1] + (r() - .5) * 16]); ln(g, p, 'rgba(255,90,20,.35)', 4); ln(g, p, hsl(20 + r() * 20, 100, 55, .95), 1.4); ln(g, p, 'rgba(255,230,120,.7)', .6) }
    },
    snow(g, r, P, d) {
      for (let i = 0; i < 3 * d; i++) ell(g, 8 + r() * 48, 8 + r() * 48, 8 + r() * 8, 3 + r() * 3, r() < .6 ? hsl(P.h, 40, P.l + 12, .55) : hsl(P.h + 10, 40, P.l - 8, .35), (r() - .5) * .5);
      for (let i = 0; i < 4 * d; i++) { const x = 4 + r() * 56, y = 4 + r() * 56; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x, y, 1.4, 1.4); if (r() < .3) { g.fillRect(x - 1.5, y + .3, 4.4, .8); g.fillRect(x + .3, y - 1.5, .8, 4.4) } }
    },
    dune(g, r, P, d) {
      for (let i = 0; i < 3 * d; i++) { const y = 6 + r() * 52, x = r() * 20; g.strokeStyle = r() < .5 ? hsl(P.h, P.s, P.l - 8, .22) : hsl(P.h, P.s, P.l + 8, .3); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 14, y - 7, x + 30, y + 7, x + 44, y - 2); g.stroke() }
      for (let i = 0; i < 3 * d; i++) ell(g, 4 + r() * 56, 4 + r() * 56, 1 + r(), 1, hsl(P.h, P.s - 8, P.l - 10, .6));
    },
    shadow(g, r, P, d) {
      for (let i = 0; i < 2 * d; i++) ell(g, 8 + r() * 48, 8 + r() * 48, 9 + r() * 9, 4 + r() * 4, hsl(P.h + 10, 40, P.l + 6, .22), r() * 3);
      if (r() < .4 * d) { const x = 12 + r() * 40, y = 12 + r() * 40; g.strokeStyle = hsl(P.h + 40, 70, 60, .5); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 3 + r() * 4, 0, r() * 4 + 2); g.stroke() }
      if (r() < .35) { const x = r() * 40, y = 8 + r() * 46; ln(g, [[x, y], [x + 8, y + 5], [x + 16, y + 3]], hsl(P.h + 30, 80, 55, .5), 1) }
    },
    cloud(g, r, P, d) {
      for (let i = 0, n = (2 + r() * 2) * d; i < n; i++) { const x = 8 + r() * 48, y = 8 + r() * 48, s = 7 + r() * 8; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2) }
      if (r() < .3) ell(g, 8 + r() * 48, 8 + r() * 48, 5, 1.5, hsl(P.h + 12, 60, P.l + 9, .6));
    },
    void(g, r, P, d) {
      for (let i = 0; i < 2; i++) { const x = r() * 64, y = r() * 64, s = 14 + r() * 14, gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, hsl(P.h + r() * 40, 70, 30, .22)); gr.addColorStop(1, hsl(P.h, 70, 30, 0)); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2) }
      for (let i = 0, n = (4 + r() * 5) * d; i < n; i++) { const a = .3 + r() * .7; g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(r() * 63, r() * 63, r() < .15 ? 2 : 1, r() < .15 ? 2 : 1) }
      if (r() < .35) { const x = r() * 40, y = 8 + r() * 46; ln(g, [[x, y], [x + 8, y + 4], [x + 13, y - 3], [x + 22, y + 3]], hsl(P.h + 20, 80, 55, .35), 2.5); ln(g, [[x, y], [x + 8, y + 4], [x + 13, y - 3], [x + 22, y + 3]], hsl(P.h + 20, 90, 75, .8), .8) }
    }
  };
  const NV = 12, NA = 4;                                       // số biến thể tile thường / tile nhấn
  function bakeTiles() {
    const th = E.T.ground, S = M.ceil(64 * dpr), k = S / 64, tiles = [];
    for (let v = 0; v < NV + NA; v++) {
      const acc = v >= NV, r = rng(E.seed + v * 977 + 13), c = mk(S, S), g = c.getContext('2d'); g.scale(k, k);
      const P = { h: E.hue + (r() - .5) * th.hv, s: th.s + (r() - .5) * 8, l: th.l + (r() - .5) * 2 * th.lv * .35, t: th }   /* Phase 15: giảm lệch sáng từng ô → hết hiệu ứng bàn cờ */;
      g.fillStyle = hsl(P.h, P.s, P.l); g.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 10; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * 62, r() * 62, 2 + r() * 3, 2 + r() * 3) }
      (GD[th.deco] || GD.dust)(g, r, P, acc ? 2.2 : 1);
      tiles.push(c);
    }
    E.tiles = tiles;
    const mkPatch = (col) => { const c = mk(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c };
    E.patch = [mkPatch(hsl(E.hue, th.s, th.l + 14, .14)), mkPatch(hsl(E.hue, th.s + 4, th.l - 12, .2))];
    E.dpr = dpr;
  }

  /* ================= 3b) CHƯỚNG NGẠI: painter ================= */
  const PAINT = {
    rock(g, r, c) { sdw(g, 18); ell(g, 48, 96, 15, 11, shade(c[0], .78)); ell(g, 45, 92, 12, 9, c[0]); ell(g, 41, 88, 6, 4, mix(c[0], '#ffffff', .3)); if (r() < .6) ell(g, 58, 99, 7, 5, shade(c[0], .68)) },
    boulder(g, r, c) { sdw(g, 24); poly(g, [[28, 102], [24, 84], [34, 70], [52, 66], [66, 76], [72, 96], [64, 104]], shade(c[0], .85)); poly(g, [[34, 70], [52, 66], [48, 84], [30, 86]], mix(c[0], '#ffffff', .25)); poly(g, [[48, 84], [52, 66], [66, 76], [72, 96], [56, 98]], shade(c[0], .66)); ln(g, [[40, 98], [46, 86], [52, 90]], 'rgba(0,0,0,.25)', 1) },
    bush(g, r, c) { sdw(g, 20);[[38, 92, 13], [58, 92, 13], [48, 82, 15], [48, 96, 12]].forEach(a => ell(g, a[0], a[1], a[2], a[2] * .85, shade(c[1], .7 + r() * .3))); ell(g, 43, 80, 6, 4, mix(c[1], '#ffffff', .25)); for (let i = 0; i < 5; i++) ell(g, 34 + r() * 30, 80 + r() * 18, 2, 2, r() < .5 ? '#ff7a8a' : '#ffe27a') },
    oak(g, r, c) { sdw(g, 22); g.fillStyle = c[2]; g.fillRect(43, 68, 10, 36); g.fillStyle = shade(c[2], .65); g.fillRect(49, 68, 4, 36); [[32, 56, 20], [64, 56, 20], [48, 42, 25], [48, 62, 19], [28, 70, 12], [68, 70, 12]].forEach(a => ell(g, a[0], a[1], a[2], a[2] * .88, shade(c[1], .62 + r() * .22))); [[38, 38, 11], [58, 44, 9], [30, 54, 8]].forEach(a => ell(g, a[0], a[1], a[2], a[2] * .8, mix(c[1], '#ffffff', .22))) },
    pine(g, r, c) { sdw(g, 18); const sn = E.tk === 'snow', col = sn ? '#3a6a56' : '#2a6a42'; g.fillStyle = '#5a3a24'; g.fillRect(45, 86, 6, 18);[[88, 24], [68, 20], [50, 15], [34, 10]].forEach((a, i) => { poly(g, [[48 - a[1], a[0]], [48, a[0] - 28], [48 + a[1], a[0]]], shade(col, .75 + i * .1)); if (sn) poly(g, [[48 - a[1] * .7, a[0] - 8], [48, a[0] - 28], [48 + a[1] * .7, a[0] - 8]], 'rgba(240,248,255,.85)') }) },
    willow(g, r, c) { sdw(g, 20); g.fillStyle = '#5a4630'; g.fillRect(44, 66, 8, 38); ell(g, 48, 48, 26, 18, shade(c[2], .7)); for (let i = 0; i < 16; i++) { const x = 24 + i * 3.2; ln(g, [[x, 50 + r() * 6], [x + (r() - .5) * 4, 66 + r() * 16], [x + (r() - .5) * 6, 78 + r() * 18]], hsl(80 + r() * 30, 40, 36 + r() * 12), 1.6) } },
    reed(g, r, c) { sdw(g, 14); for (let i = 0; i < 9; i++) { const x = 38 + r() * 20, h = 50 + r() * 40; ln(g, [[x, 104], [x + (r() - .5) * 10, 104 - h * .6], [x + (r() - .5) * 14, 104 - h]], hsl(70 + r() * 30, 40, 30 + r() * 14), 1.6); if (r() < .4) ell(g, x + (r() - .5) * 12, 104 - h, 1.8, 5, '#6a4a2a') } },
    mangrove(g, r, c) { sdw(g, 24); for (let i = 0; i < 5; i++) { const x = 22 + i * 13; ln(g, [[x, 104], [x + (i - 2) * 3, 88], [48 + (i - 2) * 3, 66]], '#4a3a28', 3.2) } g.fillStyle = '#5a4630'; g.fillRect(44, 54, 8, 20);[[36, 46, 16], [60, 46, 16], [48, 36, 19]].forEach(a => ell(g, a[0], a[1], a[2], a[2] * .8, shade(c[1], .6 + r() * .25))) },
    deadtree(g, r, c) { sdw(g, 16); poly(g, [[43, 104], [45, 60], [51, 60], [54, 104]], '#4a3e36'); ln(g, [[48, 70], [34, 56], [28, 40]], '#4a3e36', 3); ln(g, [[34, 56], [24, 54]], '#4a3e36', 2); ln(g, [[49, 62], [60, 46], [66, 32]], '#4a3e36', 3); ln(g, [[60, 46], [70, 48]], '#4a3e36', 2); ln(g, [[48, 56], [48, 40]], '#4a3e36', 2) },
    palm(g, r, c) { sdw(g, 16); ln(g, [[44, 104], [50, 76], [46, 50]], '#8a6a44', 6); ln(g, [[44, 104], [50, 76], [46, 50]], '#a8844e', 2); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, x = 46 + M.cos(a) * 30, y = 50 + M.sin(a) * 12 - 4; g.strokeStyle = shade(c[1], .7 + (i % 2) * .25); g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(46, 50); g.quadraticCurveTo((46 + x) / 2, 36 + M.sin(a) * 8, x, y + 10); g.stroke() } ell(g, 44, 54, 3, 3, '#5a3a24'); ell(g, 49, 55, 3, 3, '#5a3a24') },
    cactus(g, r, c) { sdw(g, 16); const col = c[1]; g.fillStyle = col; rr(g, 41, 52, 14, 52, 7); g.fill(); rr(g, 27, 68, 8, 22, 4); g.fill(); g.fillRect(27, 84, 20, 6); rr(g, 60, 60, 8, 20, 4); g.fill(); g.fillRect(52, 74, 16, 6); g.strokeStyle = shade(col, 1.4); g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(46 + i * 3, 56); g.lineTo(46 + i * 3, 100); g.stroke() } if (r() < .6) ell(g, 48, 52, 3.5, 3.5, '#ff7ab0') },
    pillar(g, r, c, v) { sdw(g, 20); const t = c[0], broken = v % 2 === 1; g.fillStyle = shade(t, .75); g.fillRect(34, 96, 28, 8); g.fillRect(37, 90, 22, 6); g.fillStyle = t; g.fillRect(40, broken ? 56 : 30, 16, broken ? 36 : 62); g.fillStyle = shade(t, .72); g.fillRect(50, broken ? 56 : 30, 6, broken ? 36 : 62); g.strokeStyle = shade(t, .6); g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(43 + i * 4, broken ? 60 : 36); g.lineTo(43 + i * 4, 90); g.stroke() } if (!broken) { g.fillStyle = shade(t, 1.1); g.fillRect(35, 24, 26, 7); g.fillRect(38, 31, 20, 3); ell(g, 48, 24, 13, 2.4, c[2]) } else { poly(g, [[40, 56], [44, 46], [48, 54], [52, 44], [56, 56]], t); ell(g, 62, 100, 6, 3, shade(t, .7)); ell(g, 32, 101, 5, 3, shade(t, .8)) } },
    ruin(g, r, c) { sdw(g, 26); const t = c[0]; for (let row = 0; row < 4; row++) { const y = 100 - row * 13, n = row === 3 ? 2 : 3; for (let i = 0; i < n; i++) { g.fillStyle = shade(t, .78 + ((row + i) % 3) * .1); g.fillRect(24 + i * 16 + (row % 2) * 8, y - 12, 15, 12) } } poly(g, [[24, 48], [34, 38], [42, 46], [54, 36], [66, 44], [72, 48]], shade(t, .7)); ell(g, 36, 100, 8, 3, rgba(c[1], .6)); ell(g, 60, 74, 5, 2, 'rgba(90,150,60,.5)') },
    crystal(g, r, c) { sdw(g, 18); ell(g, 48, 100, 20, 6, rgba(c[1], .25)); [[36, 100, 8, 40], [48, 102, 11, 62], [60, 100, 8, 34]].forEach((a, i) => { const x = a[0], b = a[1], w = a[2], h = a[3]; poly(g, [[x - w, b], [x - w * .6, b - h * .7], [x, b - h], [x + w * .6, b - h * .7], [x + w, b]], i === 1 ? c[1] : shade(c[1], .8)); poly(g, [[x, b - h], [x + w * .6, b - h * .7], [x + w, b], [x + 2, b]], shade(c[1], .62)); poly(g, [[x - w * .5, b - h * .6], [x - 1, b - h + 4], [x - 1, b - 8]], rgba(c[2], .55)) }) },
    stalag(g, r, c) { sdw(g, 18);[[38, 102, 10, 46], [54, 104, 12, 62], [64, 100, 7, 30]].forEach(a => { poly(g, [[a[0] - a[2], a[1]], [a[0] - 2, a[1] - a[3]], [a[0] + 2, a[1] - a[3]], [a[0] + a[2], a[1]]], c[0]); poly(g, [[a[0] + 1, a[1] - a[3]], [a[0] + a[2], a[1]], [a[0] + 3, a[1]]], shade(c[0], .62)); ln(g, [[a[0] - 3, a[1] - 4], [a[0] - 1, a[1] - a[3] * .7]], 'rgba(255,255,255,.2)', 1.5) }); ell(g, 52, 62, 2, 2, rgba(c[2], .8)) },
    coral(g, r, c) { sdw(g, 20); const cols = [c[2], '#ff9a6a', '#ff6a9a']; for (let i = 0; i < 4; i++) { const x = 32 + i * 11, col = cols[(i + (r() * 3 | 0)) % 3], h = 30 + r() * 34; ln(g, [[x, 104], [x + (r() - .5) * 8, 104 - h * .5], [x + (i - 1.5) * 4, 104 - h]], col, 4); ln(g, [[x + (i - 1.5) * 2, 104 - h * .6], [x + (i - 1.5) * 9, 104 - h * .9]], col, 3); ell(g, x + (i - 1.5) * 4, 104 - h, 3.4, 3.4, mix(col, '#ffffff', .35)); } },
    lavarock(g, r, c) { sdw(g, 24); poly(g, [[28, 102], [26, 82], [36, 68], [54, 64], [68, 76], [72, 96], [62, 104]], c[0]); poly(g, [[36, 68], [54, 64], [50, 82], [32, 84]], mix(c[0], '#ffffff', .12)); ln(g, [[40, 100], [44, 88], [52, 82], [58, 70]], rgba(c[1], .4), 4); ln(g, [[40, 100], [44, 88], [52, 82], [58, 70]], '#ff8a2a', 1.6); ln(g, [[56, 98], [60, 88], [66, 84]], '#ffb040', 1.2); ell(g, 48, 84, 18, 6, 'rgba(255,90,20,.12)') },
    bones(g, r, c) { sdw(g, 18); const b = '#e8e0cc'; ell(g, 48, 90, 12, 10, b); ell(g, 44, 88, 3, 3, '#3a3228'); ell(g, 52, 88, 3, 3, '#3a3228'); g.fillStyle = '#3a3228'; g.fillRect(47, 92, 2, 3); g.fillStyle = b; g.fillRect(41, 98, 14, 5); for (let i = 0; i < 3; i++) ln(g, [[28 + i * 3, 100 - i * 3], [34 + i * 4, 84 - i * 2], [44, 84]], shade(b, .9), 2.2); ln(g, [[66, 102], [74, 94]], b, 3); ell(g, 76, 92, 2.5, 2.5, b) },
    tomb(g, r, c) { sdw(g, 18); g.fillStyle = shade(c[0], .75); g.fillRect(32, 98, 32, 6); g.fillStyle = c[0]; g.beginPath(); g.moveTo(36, 100); g.lineTo(36, 66); g.arc(48, 66, 12, M.PI, 0); g.lineTo(60, 100); g.fill(); g.fillStyle = shade(c[0], .66); g.fillRect(54, 66, 6, 34); ln(g, [[48, 62], [48, 82]], rgba(c[2], .8), 2); ln(g, [[41, 70], [55, 70]], rgba(c[2], .8), 2); ell(g, 38, 98, 4, 2, 'rgba(70,120,60,.6)') },
    spire(g, r, c) { sdw(g, 20); poly(g, [[34, 104], [40, 70], [44, 38], [48, 14], [54, 40], [60, 72], [66, 104]], c[0]); poly(g, [[48, 14], [54, 40], [60, 72], [66, 104], [52, 104]], shade(c[0], .62)); poly(g, [[48, 14], [44, 38], [40, 70], [34, 104], [40, 104]], mix(c[0], '#ffffff', .2)); ln(g, [[44, 60], [50, 68], [48, 84]], 'rgba(0,0,0,.25)', 1) },
    icecrys(g, r, c) { sdw(g, 20); ell(g, 48, 102, 20, 6, 'rgba(180,230,255,.25)');[[34, 102, 9, 38], [48, 104, 13, 66], [62, 102, 8, 32]].forEach((a, i) => { const x = a[0], b = a[1], w = a[2], h = a[3]; poly(g, [[x - w, b], [x - w * .5, b - h * .75], [x, b - h], [x + w * .5, b - h * .75], [x + w, b]], i === 1 ? 'rgba(196,236,255,.92)' : 'rgba(170,222,250,.9)'); poly(g, [[x, b - h], [x + w * .5, b - h * .75], [x + w, b], [x + 2, b]], 'rgba(120,190,230,.9)'); poly(g, [[x - w * .5, b - h * .6], [x - 1, b - h + 5], [x - 1, b - 10]], 'rgba(255,255,255,.7)') }) },
    cloudcol(g, r, c) { sdw(g, 18); for (let i = 0; i < 6; i++) { const y = 98 - i * 12; ell(g, 48 + (r() - .5) * 4, y, 15 - i * .6, 9, `rgba(255,255,255,${.92 - i * .06})`); ell(g, 44 + (r() - .5) * 4, y - 2, 8, 4, 'rgba(255,255,255,.55)') } ln(g, [[34, 52], [48, 47], [62, 52]], c[2], 2); ell(g, 48, 30, 6, 6, 'rgba(255,240,170,.8)'); ell(g, 48, 30, 3, 3, '#fff') },
    voidrock(g, r, c) { ell(g, 48, 100, 18, 6, rgba(c[2], .22)); ell(g, 48, 92, 12, 4, rgba(c[2], .3)); poly(g, [[30, 78], [36, 62], [50, 56], [64, 64], [66, 78], [56, 88], [40, 88]], c[0]); poly(g, [[36, 62], [50, 56], [46, 74], [32, 76]], mix(c[0], '#ffffff', .14)); poly(g, [[46, 74], [50, 56], [64, 64], [66, 78], [54, 82]], shade(c[0], .62)); ln(g, [[40, 80], [48, 70], [58, 74]], rgba(c[2], .8), 1.4) },
    brazier(g, r, c) { sdw(g, 16); g.fillStyle = '#3a3030'; g.fillRect(44, 80, 8, 24); g.fillRect(38, 100, 20, 4); poly(g, [[32, 66], [64, 66], [58, 82], [38, 82]], '#4a4040'); ell(g, 48, 66, 16, 5, '#2a2020'); ell(g, 48, 66, 12, 3.5, '#ff8a2a'); ln(g, [[34, 72], [62, 72]], c[2], 1.4) },
    totem(g, r, c) { sdw(g, 16); g.fillStyle = shade(c[0], .85); g.fillRect(38, 24, 20, 80); g.fillStyle = shade(c[0], .62); g.fillRect(50, 24, 8, 80); g.fillStyle = c[0]; g.fillRect(34, 20, 28, 8); const ec = c[2]; ell(g, 43, 46, 4, 3, '#14100c'); ell(g, 53, 46, 4, 3, '#14100c'); ell(g, 43, 46, 2.2, 2.2, ec); ell(g, 53, 46, 2.2, 2.2, ec); g.fillStyle = '#14100c'; g.fillRect(43, 58, 10, 4); ln(g, [[40, 72], [56, 72]], rgba(ec, .8), 1.6); ln(g, [[40, 82], [56, 82]], rgba(ec, .6), 1.6); ln(g, [[40, 92], [56, 92]], rgba(ec, .4), 1.6) },
    tsolid() { }, tpost() { },
    banner(g, r, c) { sdw(g, 12); g.fillStyle = '#4a3a2a'; g.fillRect(46, 18, 4, 86); ell(g, 48, 17, 4, 4, c[2]); poly(g, [[50, 24], [76, 28], [72, 44], [76, 62], [50, 58]], shade(c[1], 1.1)); poly(g, [[50, 24], [76, 28], [72, 44], [76, 62], [50, 58]], rgba(c[2], .35)); ln(g, [[56, 36], [68, 40]], c[2], 2); ln(g, [[56, 46], [68, 50]], c[2], 2) }
  };
  function bakeSpr(ki, v, c) {
    const k = dpr, cv = mk(96 * k, 128 * k), g = cv.getContext('2d'); g.scale(k, k);
    try { PAINT[OBK[ki - 1]](g, rng(E.seed + ki * 131 + v * 17), c, v) } catch (e) { }
    return cv;
  }
  function getSpr(ki, v, arena) {
    const key = ki * 8 + v, cache = arena ? E.asp : E.spr;
    return cache[key] || (cache[key] = bakeSpr(ki, v, arena ? E.ac : E.T.ob.c));
  }

  /* ================= 3c) CHƯỚNG NGẠI: truy vấn ================= */
  function ob(gx, gy) {
    if (!E) return 0;
    if (E.town) {                                             // Phase 16: khu dựng tay — undefined = ngoài khu → sinh ngẫu nhiên như cũ
      const q = E.town.ob(gx, gy);
      if (q !== undefined) { const a0 = E.arena; if (q && a0) { const dx = gx * 64 + 32 - a0.x, dy = gy * 64 + 34 - a0.y, r0 = a0.R + 40; if (dx * dx + dy * dy < r0 * r0) return 0 } return q }
    }
    const h = hs(gx * 7 + 3, gy * 5 + 1);
    if (h % E.obmod) return 0;
    if (gx >= -2 && gx <= 1 && gy >= -2 && gy <= 1) return 0;
    const a = E.arena;
    if (a) { const dx = gx * 64 + 32 - a.x, dy = gy * 64 + 34 - a.y, rr = a.R + 40; if (dx * dx + dy * dy < rr * rr) return 0 }
    return E.obi[(h >>> 8) % E.obi.length];
  }
  const rad = k => OBR[k - 1] || 12;

  /* ================= 4) VÙNG ĐỊA HÌNH ================= */
  function blobs(ci, cj) {
    const key = (ci + 32768) * 65536 + (cj + 32768);
    let b = E.zc.get(key); if (b) return b;
    if (E.zc.size > 500) E.zc.clear();
    b = []; const C = RU.zone.cell, h0 = hs(ci * 131 + E.seed, cj * 197 + 13);
    if (E.zw.length) for (let i = 0; i < 2; i++) {
      const h = hs(h0 + i * 7919, ci * 3 + cj * 5 + i);
      if ((h % 1000) / 1000 >= E.zp) continue;
      const kind = E.zw[(h >>> 10) % E.zw.length], rx = 84 + (h >>> 14) % 110, ry = rx * (.62 + ((h >>> 20) % 38) / 100);
      const x = ci * C + C * .18 + ((h >>> 3) % 100) / 100 * C * .64, y = cj * C + C * .18 + ((h >>> 9) % 100) / 100 * C * .64;
      if (M.hypot(x, y) < RU.zone.clearR + rx) continue;
      if (E.town && E.town.near(x, y, rx)) continue;            // Phase 16: không có vùng bùn/nước ngẫu nhiên trong khu dựng tay
      b.push({ k: kind, x, y, rx, ry, s: h % 97 });
    }
    E.zc.set(key, b); return b;
  }
  function arenaIn(x, y, pad) { const a = E.arena; if (!a) return false; const dx = x - a.x, dy = y - a.y, r = a.R + (pad || 0); return dx * dx + dy * dy < r * r }
  function zoneAt(x, y) {
    if (!E || !E.zw.length) return 0;
    if (E.arena && arenaIn(x, y, 60)) return 0;
    const C = RU.zone.cell, c0 = M.floor((x - 210) / C), c1 = M.floor((x + 210) / C), r0 = M.floor((y - 210) / C), r1 = M.floor((y + 210) / C);
    for (let i = c0; i <= c1; i++) for (let j = r0; j <= r1; j++) {
      for (const z of blobs(i, j)) { const dx = (x - z.x) / (z.rx * .9), dy = (y - z.y) / (z.ry * .9); if (dx * dx + dy * dy < 1) return z.k }
    }
    return 0;
  }
  function bakeZone(kind) {
    const S = 256, c = mk(S, S), g = c.getContext('2d'), r = rng(E.seed + kind.length * 31 + kind.charCodeAt(0));
    const path = (sx, sy, j) => { g.beginPath(); for (let i = 0; i <= 32; i++) { const a = i / 32 * TAU, k = 1 + (M.sin(a * 3 + sx) * .06 + M.sin(a * 5 + sy) * .05 + (r() - .5) * j) * 1; const x = 128 + M.cos(a) * 118 * sx * k, y = 128 + M.sin(a) * 118 * sy * k; i ? g.lineTo(x, y) : g.moveTo(x, y) } g.closePath() };
    const rg = (r0, r1, st) => { const gr = g.createRadialGradient(128, 128, r0, 128, 128, r1); st.forEach(s => gr.addColorStop(s[0], s[1])); return gr };
    switch (kind) {
      case 'mud': path(1, 1, .04); g.fillStyle = rg(10, 120, [[0, '#3a281a'], [.7, '#4e3822'], [1, '#6a4e30']]); g.fill(); for (let i = 0; i < 6; i++) ell(g, 60 + r() * 136, 60 + r() * 136, 12 + r() * 14, 5 + r() * 5, 'rgba(255,255,255,.07)'); for (let i = 0; i < 7; i++) { const x = 50 + r() * 156, y = 50 + r() * 156; ell(g, x, y, 5, 5, 'rgba(120,90,60,.8)'); ell(g, x - 1, y - 1, 2, 2, 'rgba(255,230,190,.5)') } break;
      case 'water': path(1, 1, .03); g.fillStyle = rg(0, 122, [[0, 'rgba(120,205,245,.82)'], [.75, 'rgba(70,150,215,.78)'], [1, 'rgba(60,130,200,.45)']]); g.fill(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; path(.96, .96, .03); g.stroke(); for (let i = 0; i < 5; i++) { g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1.5; g.beginPath(); g.arc(60 + r() * 136, 60 + r() * 136, 8 + r() * 12, .3, 2.4); g.stroke() } break;
      case 'ice': path(1, 1, .03); g.fillStyle = rg(0, 122, [[0, 'rgba(235,250,255,.9)'], [.8, 'rgba(180,225,250,.88)'], [1, 'rgba(160,210,240,.5)']]); g.fill(); for (let i = 0; i < 7; i++) { const x = 60 + r() * 136, y = 60 + r() * 136; ln(g, [[x, y], [x + (r() - .5) * 60, y + (r() - .5) * 40], [x + (r() - .5) * 90, y + (r() - .5) * 70]], 'rgba(255,255,255,.7)', 1.4) } for (let i = 0; i < 5; i++) ell(g, 50 + r() * 156, 50 + r() * 156, 14 + r() * 16, 6 + r() * 6, 'rgba(255,255,255,.18)', r() * 3); break;
      case 'lava': path(1, 1, .05); g.fillStyle = '#1c0a06'; g.fill(); path(.9, .9, .06); g.fillStyle = rg(0, 112, [[0, '#ffe27a'], [.35, '#ff9a2a'], [.8, '#e8501a'], [1, '#8a2a10']]); g.fill(); for (let i = 0; i < 6; i++) { const x = 60 + r() * 136, y = 60 + r() * 136; ln(g, [[x, y], [x + (r() - .5) * 50, y + (r() - .5) * 40]], 'rgba(40,12,6,.7)', 3 + r() * 3) } break;
      case 'poison': path(1, 1, .04); g.fillStyle = rg(0, 120, [[0, 'rgba(150,220,70,.85)'], [.7, 'rgba(90,150,40,.82)'], [1, 'rgba(60,110,30,.5)']]); g.fill(); for (let i = 0; i < 8; i++) { const x = 55 + r() * 146, y = 55 + r() * 146, s = 3 + r() * 6; ell(g, x, y, s, s, 'rgba(200,255,120,.55)'); ell(g, x - s * .3, y - s * .3, s * .3, s * .3, 'rgba(255,255,255,.7)') } break;
      case 'sand': path(1, 1, .03); g.fillStyle = rg(0, 120, [[0, 'rgba(150,115,60,.9)'], [.7, 'rgba(190,150,85,.85)'], [1, 'rgba(210,175,110,.45)']]); g.fill(); for (let i = 1; i < 5; i++) { g.strokeStyle = 'rgba(90,60,30,.3)'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, i * 22, i, i + 3.6); g.stroke() } break;
      case 'holy': path(1, 1, .02); g.fillStyle = rg(0, 122, [[0, 'rgba(255,248,200,.7)'], [.7, 'rgba(255,230,140,.4)'], [1, 'rgba(255,220,120,0)']]); g.fill(); g.strokeStyle = 'rgba(255,240,170,.75)'; g.lineWidth = 2.5; g.beginPath(); g.arc(128, 128, 88, 0, TAU); g.stroke(); g.beginPath(); g.arc(128, 128, 56, 0, TAU); g.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ln(g, [[128 + M.cos(a) * 56, 128 + M.sin(a) * 56], [128 + M.cos(a) * 88, 128 + M.sin(a) * 88]], 'rgba(255,240,170,.7)', 2) } break;
      case 'rift': path(1, 1, .06); g.fillStyle = rg(0, 120, [[0, '#06020e'], [.6, '#1a0a34'], [1, '#3a1a6a']]); g.fill(); for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(190,110,255,${.7 - i * .12})`; g.lineWidth = 3 - i * .5; g.beginPath(); g.arc(128, 128, 26 + i * 22, i * 1.3, i * 1.3 + 3.2); g.stroke() } g.strokeStyle = 'rgba(210,140,255,.6)'; g.lineWidth = 3; path(.97, .97, .06); g.stroke(); break;
    }
    return c;
  }

  /* zone: tác động lên người chơi / quái */
  const SLOWZ = { mud: 1, water: 1, sand: 1, rift: 1, poison: 1 };
  function foe(x, y) {
    const tf = E && E.town && !E.arena ? E.town.foe(x, y) : 1;  // Phase 16
    if (!E || !E.slowZ || E.arena) return tf;
    const z = zoneAt(x, y); if (!z) return tf;
    const s = RU.zone[z].spd; return tf * (s ? 1 - (1 - s) * RU.zone.foeSlow : 1);
  }

  /* ================= 5) THỜI TIẾT ================= */
  const WDARK = { storm: .1, rain: .05, blizzard: .05, fog: .03, sand: .04, ash: .05, snow: .02 };
  function wInit() {
    const q = host.q(), n = M.round((RU.weather.count[q] || 0) * (E.wi ? .5 + E.wi * .4 : 0));
    E.wp = []; E.wq = q;
    if (E.wk === 'none' || E.wk === 'fog') return;
    for (let i = 0; i < n; i++) E.wp.push({ x: R(), y: R(), z: .4 + R() * .6, p: R() * TAU, s: R() });
  }
  function wUpdate(dt) {
    const k = E.wk, w = E.wp, t = E.t;
    for (const p of w) {
      switch (k) {
        case 'rain': p.y += dt * (.9 + p.z * .7); p.x -= dt * .12; break;
        case 'storm': p.y += dt * (1.3 + p.z * .8); p.x -= dt * .42; break;
        case 'spray': p.y += dt * (.45 + p.z * .3); p.x += dt * .3; break;
        case 'snow': p.y += dt * (.07 + p.z * .1); p.x += M.sin(t * .8 + p.p) * dt * .04 + dt * .01; break;
        case 'blizzard': p.x += dt * (.75 + p.z * .5); p.y += dt * (.12 + p.z * .08); break;
        case 'sand': p.x += dt * (.85 + p.z * .6); p.y += dt * .05 * M.sin(p.p + t); break;
        case 'ash': p.y += dt * (.05 + p.z * .05); p.x += M.sin(t * .5 + p.p) * dt * .03; break;
        case 'ember': p.y -= dt * (.1 + p.z * .12); p.x += M.sin(t * .9 + p.p) * dt * .05; break;
        case 'spore': p.y -= dt * (.02 + p.z * .03); p.x += M.sin(t * .6 + p.p) * dt * .03; break;
        case 'motes': p.y -= dt * (.015 + p.z * .03); p.x += M.sin(t * .4 + p.p) * dt * .02; break;
        case 'petals': p.y += dt * (.05 + p.z * .05); p.x += dt * (.035 + p.z * .02) + M.sin(t + p.p) * dt * .02; break;
      }
      if (p.y > 1.05) { p.y = -.05; p.x = R() } else if (p.y < -.05) { p.y = 1.05; p.x = R() }
      if (p.x > 1.05) p.x = -.05; else if (p.x < -.05) p.x = 1.05;
    }
    if (k === 'storm') {                                      // sét nền: chớp sáng + tia sét xa (chỉ hiệu ứng, không gây sát thương)
      E.ln -= dt; if (E.ln <= 0) { E.ln = 4 + R() * 6.5; E.fl = 1; E.lb = { x: .15 + R() * .7, s: M.round(R() * 1e6) }; if (E.wi >= 3) E.ln *= .6 }
    }
    E.fl = M.max(0, E.fl - dt * 2.2);
  }
  const MOTEC = { heaven: '255,236,150', void: '210,140,255', cave: '190,150,255', shadow: '255,110,140', sea: '170,235,255', volcano: '255,170,80' };
  function drawWeather(ctx, cx, cy, W, H, t) {
    const k = E.wk, w = E.wp; if (k === 'none') return;
    if (k === 'fog') { fogLayer(ctx, cx, W, H, t, .16 + .05 * E.wi, E.fogc); return }
    const ox = cx;
    switch (k) {
      case 'rain': case 'storm': case 'spray': {
        const sp = k === 'spray'; ctx.strokeStyle = sp ? 'rgba(215,228,242,.3)' : 'rgba(190,210,238,.46)'; ctx.lineWidth = sp ? 1 : 1.3; ctx.beginPath();
        for (const p of w) { const x = ((p.x * W - ox * p.z * .1) % W + W) % W, y = p.y * H, L = (sp ? 6 : 11) + p.z * 8, sl = k === 'storm' ? .45 : sp ? .5 : .18; ctx.moveTo(x, y); ctx.lineTo(x - L * sl, y + L) }
        ctx.stroke();
        if (!sp) { ctx.strokeStyle = 'rgba(200,220,245,.28)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < w.length; i += 6) { const p = w[i], ph = (t * 1.4 + p.s * 3) % 1, x = ((p.s * 7.3 * W + ox * .4) % W + W) % W, y = H * (.35 + p.s * .65); ctx.moveTo(x + 4 * ph * 1.6, y); ctx.ellipse(x, y, 4 * ph + 1, 1.6 * ph + .4, 0, 0, TAU) } ctx.stroke() }
        break;
      }
      case 'snow': ctx.fillStyle = 'rgba(255,255,255,.85)'; for (const p of w) { const x = ((p.x * W - ox * p.z * .12) % W + W) % W, s = 1 + p.z * 1.9; ctx.fillRect(x, p.y * H, s, s) } break;
      case 'blizzard': ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const p of w) { const x = ((p.x * W - ox * p.z * .2) % W + W) % W, y = p.y * H, L = 10 + p.z * 22; ctx.moveTo(x, y); ctx.lineTo(x - L, y - L * .22) } ctx.stroke(); ctx.fillStyle = `rgba(235,245,255,${.1 + .05 * M.sin(t * .7)})`; ctx.fillRect(0, 0, W, H); break;
      case 'sand': ctx.strokeStyle = 'rgba(226,192,120,.38)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (const p of w) { const x = ((p.x * W - ox * p.z * .2) % W + W) % W, y = p.y * H, L = 14 + p.z * 26; ctx.moveTo(x, y); ctx.lineTo(x - L, y - L * .08) } ctx.stroke(); ctx.fillStyle = `rgba(220,180,110,${.07 + .04 * M.sin(t * .5) + .03 * E.wi})`; ctx.fillRect(0, 0, W, H); break;
      case 'ash': ctx.fillStyle = 'rgba(170,165,160,.6)'; for (const p of w) { const x = ((p.x * W - ox * p.z * .1) % W + W) % W, s = 1.5 + p.z * 1.6; ctx.fillRect(x, p.y * H, s, s) } break;
      case 'ember': { ctx.globalCompositeOperation = 'lighter'; const sp = soft('255,140,50'); for (const p of w) { const x = ((p.x * W - ox * p.z * .1) % W + W) % W, tw = .55 + .45 * M.sin(t * 5 + p.p), s = 7 + p.z * 7; ctx.globalAlpha = tw * .8; ctx.drawImage(sp, x - s / 2, p.y * H - s / 2, s, s) } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; break; }
      case 'spore': case 'motes': { const col = k === 'spore' ? '190,255,110' : (MOTEC[E.tk] || '255,255,255'); ctx.globalCompositeOperation = 'lighter'; const sp = soft(col); for (const p of w) { const x = ((p.x * W - ox * p.z * .12) % W + W) % W, tw = .4 + .6 * M.abs(M.sin(t * (.8 + p.s) + p.p)), s = 8 + p.z * 10; ctx.globalAlpha = tw * .75; ctx.drawImage(sp, x - s / 2, p.y * H - s / 2, s, s) } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; break; }
      case 'petals': ctx.fillStyle = E.leaf; ctx.globalAlpha = .8; for (const p of w) { const x = ((p.x * W - ox * p.z * .15) % W + W) % W; ctx.beginPath(); ctx.ellipse(x, p.y * H, 2.2 + p.z * 1.6, 1.3 + p.z * .8, t * 1.6 + p.p, 0, TAU); ctx.fill() } ctx.globalAlpha = 1; break;
    }
  }
  function fogLayer(ctx, cx, W, H, t, a, col) {
    const sp = soft(col); ctx.globalAlpha = a;
    for (let i = 0; i < 6; i++) { const s = W * (1.1 + .5 * (i % 3)), x = (((i * .27 + t * .006 * (1 + i % 3)) % 1.4) - .2) * W - cx * .08 * (1 + i % 2), y = H * ((i * .37) % 1); ctx.drawImage(sp, x - s / 2, y - s * .3, s, s * .6) }
    ctx.globalAlpha = 1;
  }
  function drawLightning(ctx, W, H) {
    if (E.fl <= .02) return;
    ctx.fillStyle = `rgba(235,240,255,${E.fl * .38})`; ctx.fillRect(0, 0, W, H);
    if (E.lb && E.fl > .35) {
      const r = rng(E.lb.s), a = E.fl; let x = E.lb.x * W, y = 0; ctx.strokeStyle = `rgba(250,250,255,${a})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 9; i++) { x += (r() - .5) * 46; y += H * .42 / 9; ctx.lineTo(x, y) } ctx.stroke();
    }
  }
  function parallax(ctx, cx, cy, W, H, t) {
    const par = E.T.par, night = E.todK === 'night';
    switch (par) {
      case 'cloud': {
        const heav = E.tk === 'heaven', sp = soft(heav ? '255,255,255' : '0,0,0');
        if (night && !heav) break;
        ctx.globalAlpha = heav ? .28 : .07;
        for (let i = 0; i < 5; i++) { const s = 260 + (i % 3) * 120, x = (((i * .31 + t * .004 * (1 + i % 2)) % 1.5) - .25) * W - cx * (heav ? .22 : .35), y = ((i * .43 + .1) % 1) * H - cy * (heav ? .1 : .2); ctx.drawImage(sp, x - s / 2, y - s * .3, s, s * .6) }
        ctx.globalAlpha = 1; break;
      }
      case 'mist': fogLayer(ctx, cx, W, H, t, .09, E.fogc); break;
      case 'canopy': {
        const sp = soft('4,16,6'); ctx.globalAlpha = .26;
        for (let i = 0; i < 7; i++) { const s = 200 + (i % 3) * 70, x = (((i * .19 + t * .003) % 1.3) - .15) * W - cx * .5, y = ((i * .53) % 1.1 - .05) * H - cy * .5; ctx.drawImage(sp, ((x % (W + 300)) + W + 300) % (W + 300) - 150 - s / 2, ((y % (H + 300)) + H + 300) % (H + 300) - 150 - s / 2, s, s) }
        ctx.globalAlpha = 1; break;
      }
      case 'glow': { ctx.globalCompositeOperation = 'lighter'; const sp = soft('255,90,20'); ctx.globalAlpha = .1 + .04 * M.sin(t * 1.3); ctx.drawImage(sp, -W * .2, H * .55, W * 1.4, H * .7); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; break; }
      case 'stars': {
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff';
        for (let i = 0; i < 34; i++) { const h = hs(i * 17 + 5, 91), x = ((h % 1000) / 1000 * W * 1.6 - cx * .25) % (W * 1.6), y = (((h >>> 10) % 1000) / 1000 * H * 1.6 - cy * .25) % (H * 1.6), tw = .3 + .7 * M.abs(M.sin(t * (.6 + (h % 5) * .3) + i)); ctx.globalAlpha = tw * .75; ctx.fillRect((x + W * 1.6) % (W * 1.6) - W * .3, (y + H * 1.6) % (H * 1.6) - H * .3, 2, 2) }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; break;
      }
    }
  }
  function rays(ctx, cx, W, H, t) {
    ctx.globalCompositeOperation = 'lighter';
    const night = E.todK === 'night', a = night ? .02 : E.todK === 'day' ? .07 : .1, col = E.todK === 'dusk' ? '255,170,100' : E.todK === 'dawn' ? '255,200,170' : '255,245,200';
    for (let i = 0; i < 4; i++) {
      const x = (((i * .28 + t * .006) % 1.3) - .15) * W - cx * .12, wd = W * (.12 + (i % 2) * .08), gr = ctx.createLinearGradient(x, 0, x + wd * .6, H);
      gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + wd, 0); ctx.lineTo(x + wd - W * .22, H); ctx.lineTo(x - W * .22, H); ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ================= 6) ÁNH SÁNG ================= */
  let LC = null, VIG = null;
  function vignette(ctx, W, H) {
    if (!VIG || VIG.width !== M.ceil(W) || VIG.height !== M.ceil(H) || VIG._e !== E) {
      VIG = mk(M.ceil(W), M.ceil(H)); VIG._e = E; const g = VIG.getContext('2d'), v = E.T.vig, a = E.todK === 'night' ? .62 : E.todK === 'day' ? .42 : .52;
      const gr = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .88); gr.addColorStop(0, `rgba(${v[0]},${v[1]},${v[2]},0)`); gr.addColorStop(1, `rgba(${v[0]},${v[1]},${v[2]},${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    ctx.drawImage(VIG, 0, 0, W, H);
  }
  function lighting(ctx, cx, cy, W, H, t, G) {
    const T = E.tod, P = G.p;
    if (T.tint[3] > 0) { ctx.fillStyle = `rgba(${T.tint[0]},${T.tint[1]},${T.tint[2]},${T.tint[3]})`; ctx.fillRect(0, 0, W, H) }
    const a = M.min(.66, M.max(T.dark, E.T.dark || 0) + E.wdark);
    if (a < .03) return;
    const q = host.q(), sc = [.3, .4, .5][q], lw = M.ceil(W * sc), lh = M.ceil(H * sc);
    if (!LC || LC.width !== lw || LC.height !== lh) { LC = mk(lw, lh); LC._g = LC.getContext('2d') }
    const g = LC._g, LS = lightSprite(), amb = T.amb;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, lw, lh); g.fillStyle = `rgba(${amb[0]},${amb[1]},${amb[2]},${a})`; g.fillRect(0, 0, lw, lh);
    g.globalCompositeOperation = 'destination-out';
    const L = (x, y, r, s) => { if (x < -r || y < -r || x > W + r || y > H + r) return; g.globalAlpha = s; g.drawImage(LS, (x - r) * sc, (y - r) * sc, 2 * r * sc, 2 * r * sc) };
    const lr = (T.lightR || 260) * (1 + .035 * M.sin(t * 7.3) + .02 * M.sin(t * 3.1));
    L(P.x - cx, P.y - cy - 12, lr, 1);
    if (E.town) E.town.lights(L, cx, cy, W, H, t);            // Phase 16: đèn lồng khu Cổ Trấn
    for (const z of E.vl) if (z.k === 'lava' || z.k === 'holy' || z.k === 'rift') L(z.sx, z.sy, z.rx * 1.7, .85);
    if (E.arena) for (const p of E.arena.pl) if (p.k === KI.brazier) L(p.x - cx, p.y - cy - 70, 170, .9 * E.arena.fade);
    if (G.boss && !G.boss.dead) L(G.boss.x - cx, G.boss.y - cy - 20, 210, .7);
    if (E.fl > .02) { g.globalAlpha = E.fl * .9; g.fillStyle = '#000'; g.fillRect(0, 0, lw, lh) }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    ctx.drawImage(LC, 0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';                 // quầng sáng ấm quanh lửa/dung nham
    const wg = soft('255,170,80');
    for (const z of E.vl) if (z.k === 'lava') { ctx.globalAlpha = .22 + .06 * M.sin(t * 3 + z.s); const r = z.rx * 1.5; ctx.drawImage(wg, z.sx - r, z.sy - r * .7, r * 2, r * 1.4) }
    if (E.arena) for (const p of E.arena.pl) if (p.k === KI.brazier) { ctx.globalAlpha = .3 * E.arena.fade; ctx.drawImage(wg, p.x - cx - 80, p.y - cy - 150, 160, 160) }
    if (E.todK === 'night' || a > .3) { ctx.globalAlpha = .12; const r = lr * .55; ctx.drawImage(soft('255,215,150'), P.x - cx - r, P.y - cy - 12 - r, r * 2, r * 2) }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* ================= 7) ĐẤU TRƯỜNG BOSS ================= */
  const GLYPH = {
    star(g, o, r, n) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -M.PI / 2 + i / (n * 2) * TAU, rr = i % 2 ? r * .42 : r; i ? g.lineTo(o + M.cos(a) * rr, o + M.sin(a) * rr) : g.moveTo(o + M.cos(a) * rr, o + M.sin(a) * rr) } g.closePath(); g.stroke() },
    square(g, o, r, n) { for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i < 4; i++) { const a = M.PI / 4 + k * M.PI / 4 + i * M.PI / 2; i ? g.lineTo(o + M.cos(a) * r, o + M.sin(a) * r) : g.moveTo(o + M.cos(a) * r, o + M.sin(a) * r) } g.closePath(); g.stroke() } },
    wave(g, o, r, n) { for (let k = 1; k <= 3; k++) { g.beginPath(); for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU, rr = r * k / 3 + M.sin(a * (6 + k * 2)) * 7; i ? g.lineTo(o + M.cos(a) * rr, o + M.sin(a) * rr) : g.moveTo(o + M.cos(a) * rr, o + M.sin(a) * rr) } g.stroke() } },
    lotus(g, o, r, n) { const m = 8 + (n >> 1); for (let i = 0; i < m; i++) { const a = i / m * TAU; g.beginPath(); g.ellipse(o + M.cos(a) * r * .55, o + M.sin(a) * r * .55, r * .45, r * .16, a, 0, TAU); g.stroke() } g.beginPath(); g.arc(o, o, r * .18, 0, TAU); g.stroke() },
    skull(g, o, r) { g.beginPath(); g.arc(o, o - r * .1, r * .62, 0, TAU); g.stroke(); g.beginPath(); g.arc(o - r * .24, o - r * .12, r * .15, 0, TAU); g.arc(o + r * .24, o - r * .12, r * .15, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(o, o + r * .05); g.lineTo(o - r * .07, o + r * .22); g.lineTo(o + r * .07, o + r * .22); g.closePath(); g.stroke(); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(o + i * r * .12, o + r * .38); g.lineTo(o + i * r * .12, o + r * .58); g.stroke() } },
    sun(g, o, r, n) { const m = 12 + n; g.beginPath(); g.arc(o, o, r * .4, 0, TAU); g.stroke(); for (let i = 0; i < m; i++) { const a = i / m * TAU; g.beginPath(); g.moveTo(o + M.cos(a - .09) * r * .5, o + M.sin(a - .09) * r * .5); g.lineTo(o + M.cos(a) * r, o + M.sin(a) * r); g.lineTo(o + M.cos(a + .09) * r * .5, o + M.sin(a + .09) * r * .5); g.stroke() } },
    snow(g, o, r) { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, c = M.cos(a), s = M.sin(a); g.beginPath(); g.moveTo(o, o); g.lineTo(o + c * r, o + s * r); g.stroke(); for (const f of [.45, .72]) { const bx = o + c * r * f, by = o + s * r * f; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + M.cos(a + .7) * r * .2, by + M.sin(a + .7) * r * .2); g.moveTo(bx, by); g.lineTo(bx + M.cos(a - .7) * r * .2, by + M.sin(a - .7) * r * .2); g.stroke() } } }
  };
  function bakeArena(a) {
    const st = E.T.arena, S = M.round(a.R * 2 + 16), o = S / 2, c = mk(S, S), g = c.getContext('2d'), r = rng(E.seed + 7), tier = a.tier;
    g.save(); g.beginPath(); g.arc(o, o, a.R, 0, TAU); g.clip();
    const gr = g.createRadialGradient(o, o, 20, o, o, a.R); gr.addColorStop(0, st.floor[0]); gr.addColorStop(1, st.floor[1]); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.07)'; g.fillRect(r() * S, r() * S, 2 + r() * 4, 2 + r() * 4) }
    const nR = 2 + (tier >> 1), nS = 8 + tier * 2;
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2;
    for (let i = 1; i <= nR; i++) { g.beginPath(); g.arc(o, o, a.R * i / (nR + 1) + 18, 0, TAU); g.stroke() }
    g.strokeStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < nS; i++) { const an = i / nS * TAU; g.beginPath(); g.moveTo(o + M.cos(an) * 60, o + M.sin(an) * 60); g.lineTo(o + M.cos(an) * a.R, o + M.sin(an) * a.R); g.stroke() }
    g.fillStyle = rgba(st.rune, .75);                         // vòng rune
    for (let k = 0; k < 2; k++) { const rr = a.R * (k ? .88 : .64), n = (k ? 56 : 36) + tier * 2; for (let i = 0; i < n; i++) { const an = i / n * TAU; g.save(); g.translate(o + M.cos(an) * rr, o + M.sin(an) * rr); g.rotate(an); g.fillRect(-1.2, -5 - (i % 3) * 2, 2.4, 10 + (i % 3) * 4); g.restore() } }
    g.strokeStyle = rgba(st.rune, .55); g.lineWidth = 3; g.beginPath(); g.arc(o, o, a.R * .76, 0, TAU); g.stroke(); g.beginPath(); g.arc(o, o, a.R * .5, 0, TAU); g.stroke();
    if (tier >= 5) { g.lineWidth = 2; g.beginPath(); g.arc(o, o, a.R * .93, 0, TAU); g.stroke() }
    g.strokeStyle = rgba(st.rune, .9); g.lineWidth = 3.2; g.shadowColor = st.rune; g.shadowBlur = 10;
    (GLYPH[st.glyph] || GLYPH.star)(g, o, a.R * .4, 5 + M.min(4, tier >> 1));
    g.shadowBlur = 0;
    for (let i = 0; i < 9; i++) { let x = o + M.cos(r() * TAU) * a.R, y = o + M.sin(r() * TAU) * a.R; const p = [[x, y]]; for (let j = 0; j < 4; j++) { x += (o - x) * .1 + (r() - .5) * 26; y += (o - y) * .1 + (r() - .5) * 26; p.push([x, y]) } ln(g, p, 'rgba(0,0,0,.4)', 1.6) }
    g.restore();
    return c;
  }
  function arenaOpen(P, B, tier, form) {
    if (!E) return; const k = form === 'guardian' ? .72 : form === 'lite' ? .88 : 1, R0 = M.round(RU.arena.r * k);
    const a = { x: (P.x + B.x) / 2, y: (P.y + B.y) / 2, R: R0, tier: M.max(1, M.min(8, tier | 0 || 1)), form, p: 0, fade: 1, closing: false, ct: 0, pl: [], sh: 0 };
    const st = E.T.arena; E.ac = [mix(st.floor[0], '#ffffff', .22), st.floor[1], st.rune];
    E.asp = {}; a.floor = bakeArena(a);
    const n = form === 'guardian' ? 6 : M.min(14, 6 + a.tier), ki = KI[st.deco] || KI.pillar;
    for (let i = 0; i < n; i++) { const an = i / n * TAU + .3; a.pl.push({ ob: 2, k: ki, v: i % 3, x: a.x + M.cos(an) * (R0 + 6), y: a.y + M.sin(an) * (R0 + 6), sc: 1.2, arena: 1 }) }
    E.arena = a; E.hz.length = 0; E.cl.length = 0; E.gu = null;
    E.fx.push({ sk: 'ring', x: a.x, y: a.y, r: R0, t: RU.arena.openT, T: RU.arena.openT, col: st.wall });
    E.fl = M.max(E.fl, .5);
    for (let i = 0; i < 40; i++) { const an = R() * TAU; host.pt(a.x + M.cos(an) * R0, a.y + M.sin(an) * R0, M.cos(an) * -60, M.sin(an) * -60, .8, st.wall) }
  }
  function arenaUpdate(dt, G) {
    const a = E.arena; if (!a) return;
    if (!a.closing) {
      a.p = M.min(1, a.p + dt / RU.arena.openT);
      if (!G.boss || G.boss.dead) { a.closing = true; a.ct = 0; const col = E.T.arena.wall; for (let i = 0; i < 70; i++) { const an = i / 70 * TAU; host.pt(a.x + M.cos(an) * a.R, a.y + M.sin(an) * a.R, M.cos(an) * 90, M.sin(an) * 90 - 40, .9, col) } E.fl = M.max(E.fl, .6) }
    } else { a.ct += dt; a.fade = M.max(0, 1 - a.ct / RU.arena.closeT); if (a.fade <= 0) E.arena = null }
    if (E.arena && G.boss) a.ph = G.boss.ph || 1;
  }
  function clamp(o, pad) {
    const a = E && E.arena; if (!a || a.closing || a.p < .12) return;
    const dx = o.x - a.x, dy = o.y - a.y, d = M.hypot(dx, dy), m = a.R - (pad == null ? RU.arena.pad : pad);
    if (d > m && d > 1) {
      const nx = dx / d, ny = dy / d; o.x = a.x + nx * m; o.y = a.y + ny * m;
      if (o.vx != null) { const vn = o.vx * nx + o.vy * ny; if (vn > 0) { o.vx -= vn * nx; o.vy -= vn * ny } }
      if (o === host.G().p) a.sh = .5;
    }
  }
  function drawArenaFloor(ctx, cx, cy) {
    const a = E.arena; if (!a) return; const q = ease(a.p);
    ctx.save(); ctx.globalAlpha = a.fade; ctx.beginPath(); ctx.arc(a.x - cx, a.y - cy, a.R * q, 0, TAU); ctx.clip();
    ctx.drawImage(a.floor, a.x - cx - a.floor.width / 2, a.y - cy - a.floor.height / 2); ctx.restore();
  }
  function drawArenaRing(ctx, cx, cy, W, H, t, G) {
    const a = E.arena; if (!a) return; const st = E.T.arena, x = a.x - cx, y = a.y - cy, ph = a.ph || 1, rm = ph >= 3 ? .8 : ph === 2 ? .4 : 0;
    const col = mix(st.wall, '#ff3a3a', rm), pulse = .75 + .25 * M.sin(t * (3 + ph * 2)), P = G.p, dp = M.hypot(P.x - a.x, P.y - a.y), near = M.max(0, 1 - (a.R - dp) / 110);
    ctx.save(); ctx.globalAlpha = a.fade;
    ctx.fillStyle = `rgba(0,0,8,${.46 * a.p})`; ctx.beginPath(); ctx.rect(-60, -60, W + 120, H + 120); ctx.arc(x, y, a.R, 0, TAU, true); ctx.fill('evenodd');
    ctx.lineWidth = 28; ctx.strokeStyle = col.replace('rgb', 'rgba').replace(')', `,${.14 * pulse})`); ctx.beginPath(); ctx.arc(x, y, a.R, 0, TAU); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = col.replace('rgb', 'rgba').replace(')', `,${.95 * pulse})`); ctx.beginPath(); ctx.arc(x, y, a.R, -M.PI / 2, -M.PI / 2 + TAU * ease(a.p)); ctx.stroke();
    ctx.setLineDash([10, 16]); ctx.lineDashOffset = -t * (28 + ph * 10); ctx.lineWidth = 2; ctx.strokeStyle = col.replace('rgb', 'rgba').replace(')', ',.7)'); ctx.beginPath(); ctx.arc(x, y, a.R - 13, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    if (near > .02 || a.sh > 0) { const an = M.atan2(P.y - a.y, P.x - a.x), w = .5 + .3 * near; ctx.lineWidth = 16; ctx.strokeStyle = col.replace('rgb', 'rgba').replace(')', `,${M.min(.8, .5 * near + a.sh)})`); ctx.beginPath(); ctx.arc(x, y, a.R, an - w, an + w); ctx.stroke(); a.sh = M.max(0, a.sh - .05) }
    ctx.restore();
  }

  /* ================= 8) HAZARD ================= */
  const HZ = {
    bolt: { cd: 4.6, r: 56, col: '255,240,150', tel: 1.0 }, rock: { cd: 6, r: 62, col: '210,175,120', tel: 1.2, fall: 'rock' },
    icicle: { cd: 5.4, r: 50, col: '170,225,255', tel: 1.1, fall: 'ice' }, geyser: { cd: 5.2, r: 64, col: '255,120,40', tel: 1.15 },
    meteor: { cd: 6.8, r: 68, col: '255,100,40', tel: 1.3, fall: 'fire' }, beam: { cd: 6, r: 58, col: '255,236,150', tel: 1.2 },
    rift: { cd: 7, r: 66, col: '200,110,255', tel: 1.3 }, gust: { cd: 9.5, col: '230,230,230', tel: 1.3 },
    spore: { cd: 7.5, r: 60, col: '150,230,80', tel: 1.1 }, wave: { cd: 9, r: 84, col: '110,200,255', tel: 1.3 },
    bone: { cd: 6, r: 58, col: '235,230,210', tel: 1.1 }, soul: { cd: 7, r: 60, col: '170,255,190', tel: 1.2 }
  };
  function hzSchedule(G) {
    const h = HZ[E.hk]; if (!h) return;
    E.hcd = h.cd * (1.25 - .12 * E.wi) * (.8 + R() * .4);
  }
  function hzSpawn(G) {
    const h = HZ[E.hk], P = G.p;
    if (E.hk === 'gust') { const an = R() < .5 ? 0 : M.PI; E.gu = { dx: M.cos(an + (R() - .5) * .8), dy: M.sin(an + (R() - .5) * .8) * .4, t: h.tel, T: h.tel, ph: 0, a: 0 }; return }
    const n = 1 + (E.wi >= 2 ? 1 : 0) + (E.wi >= 3 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      let x, y; if (i === 0) { x = P.x + P.vx * .7 + (R() - .5) * 60; y = P.y + P.vy * .7 + (R() - .5) * 60 } else { const an = R() * TAU, d = 120 + R() * 150; x = P.x + M.cos(an) * d; y = P.y + M.sin(an) * d }
      E.hz.push({ k: E.hk, x, y, r: h.r, t: h.tel + i * .28, T: h.tel + i * .28, col: h.col, fall: h.fall });
    }
  }
  function hzImpact(z, G) {
    const P = G.p, h = HZ[z.k], col = 'rgb(' + z.col + ')';
    E.fx.push({ sk: z.k, x: z.x, y: z.y, r: z.r, t: .55, T: .55, col: z.col });
    if (E.dc.length < 24 && (z.k === 'bolt' || z.k === 'meteor' || z.k === 'geyser' || z.k === 'rock')) E.dc.push({ x: z.x, y: z.y, r: z.r * .8, t: 7, T: 7, c: z.k === 'rock' ? 'rgba(60,45,30,.55)' : 'rgba(20,10,6,.65)' });
    for (let i = 0; i < 12; i++) { const an = R() * TAU, v = 50 + R() * 110; host.pt(z.x, z.y - 6, M.cos(an) * v, M.sin(an) * v - 40, .45, col) }
    if (z.k === 'bolt' || z.k === 'meteor') E.fl = M.max(E.fl, .5);
    host.shake(.35);
    if (z.k === 'spore') E.cl.push({ x: z.x, y: z.y, r: z.r * 1.1, life: 4.5, T: 4.5, tk: 0 });
    if (!G.ending && M.hypot(P.x - z.x, P.y - 12 - z.y) < z.r + 8) {
      host.hurt(M.max(2, P.mhp * RU.hazard.dmgPct * (z.k === 'meteor' || z.k === 'wave' ? 1.2 : 1)), .45);
      if (z.k === 'wave') { const dx = P.x - z.x, dy = P.y - z.y, d = M.hypot(dx, dy) || 1; P.vx += dx / d * 260; P.vy += dy / d * 260 }
    }
  }
  function hzUpdate(dt, G) {
    const P = G.p;
    if (E.hk && !E.arena && !G.ending && G.t > RU.hazard.firstAt) { E.hcd -= dt; if (E.hcd <= 0) { hzSchedule(G); hzSpawn(G) } }
    let j = 0; for (const z of E.hz) { z.t -= dt; if (z.t <= 0) { hzImpact(z, G); continue } E.hz[j++] = z } E.hz.length = j;
    j = 0; for (const f of E.fx) { f.t -= dt; if (f.t > 0) E.fx[j++] = f } E.fx.length = j;
    j = 0; for (const d of E.dc) { d.t -= dt; if (d.t > 0) E.dc[j++] = d } E.dc.length = j;
    j = 0; for (const c of E.cl) {
      c.life -= dt; if (c.life <= 0) continue; c.tk -= dt;
      if (!G.ending && M.hypot(P.x - c.x, P.y - c.y) < c.r) { E.cm = M.min(E.cm, RU.zone.poison.spd); if (c.tk <= 0) { c.tk = RU.zone.poison.tick; host.hurt(M.max(1, P.mhp * RU.zone.poison.dmg), 0, 1) } }
      E.cl[j++] = c;
    } E.cl.length = j;
    const u = E.gu;                                           // gió giật: báo hiệu → đẩy
    if (u) {
      u.t -= dt;
      if (u.ph === 0 && u.t <= 0) { u.ph = 1; u.t = .55; u.T = .55 }
      else if (u.ph === 1) { P.vx += u.dx * 900 * dt; P.vy += u.dy * 900 * dt; for (const e of G.en) if (!e.dead && !e.boss) { e.vx += u.dx * 420 * dt; e.vy += u.dy * 420 * dt } if (u.t <= 0) E.gu = null }
    }
  }
  function hzDraw(ctx, cx, cy, W, H, t) {
    for (const d of E.dc) { ctx.globalAlpha = d.t / d.T * .9; ctx.fillStyle = d.c; ctx.beginPath(); ctx.ellipse(d.x - cx, d.y - cy, d.r, d.r * .55, 0, 0, TAU); ctx.fill() } ctx.globalAlpha = 1;
    for (const c of E.cl) { const f = M.min(1, c.life * 1.5, (c.T - c.life) * 2.2), x = c.x - cx, y = c.y - cy; ctx.globalAlpha = .55 * f; ctx.drawImage(soft('120,190,60'), x - c.r * 1.2, y - c.r * 1.2, c.r * 2.4, c.r * 2.4); ctx.globalAlpha = f * .7; ctx.fillStyle = 'rgba(190,255,110,.7)'; for (let i = 0; i < 6; i++) { const ph = (t * .7 + i * .37) % 1; ctx.beginPath(); ctx.arc(x + M.cos(i * 1.7) * c.r * .6, y + M.sin(i * 2.3) * c.r * .4 - ph * 30, 2 + (1 - ph) * 2, 0, TAU); ctx.fill() } ctx.globalAlpha = 1 }
    for (const z of E.hz) {                                   // báo hiệu
      const p = 1 - z.t / z.T; if (p < 0) continue; const x = z.x - cx, y = z.y - cy, c = z.col;
      ctx.fillStyle = `rgba(${c},${.08 + .2 * p})`; ctx.beginPath(); ctx.arc(x, y, z.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(${c},.9)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, z.r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, z.r * p, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.5;
      switch (z.k) {
        case 'beam': ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = t * 1.5 + i * .785; ctx.moveTo(x + M.cos(a) * z.r * .3, y + M.sin(a) * z.r * .3); ctx.lineTo(x + M.cos(a) * z.r, y + M.sin(a) * z.r) } ctx.stroke(); break;
        case 'geyser': case 'soul': ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 1.26 + 1; let px = x, py = y; ctx.moveTo(px, py); for (let s = 1; s <= 3; s++) { px = x + M.cos(a + (hs(i, s) % 7 - 3) * .1) * z.r * .28 * s; py = y + M.sin(a + (hs(i, s) % 7 - 3) * .1) * z.r * .28 * s; ctx.lineTo(px, py) } } ctx.stroke(); break;
        case 'bone': ctx.fillStyle = `rgba(${c},${.3 + .5 * p})`; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, bx = x + M.cos(a) * z.r * .75, by = y + M.sin(a) * z.r * .75; ctx.beginPath(); ctx.moveTo(bx + M.cos(a + 1.57) * 4, by + M.sin(a + 1.57) * 4); ctx.lineTo(bx - M.cos(a) * 9 * p, by - M.sin(a) * 9 * p); ctx.lineTo(bx + M.cos(a - 1.57) * 4, by + M.sin(a - 1.57) * 4); ctx.fill() } break;
        case 'rift': ctx.beginPath(); ctx.arc(x, y, z.r * .6, t * 3, t * 3 + 3.2); ctx.moveTo(x + z.r * .3, y); ctx.arc(x, y, z.r * .3, -t * 4, -t * 4 + 3); ctx.stroke(); break;
        case 'wave': case 'spore': for (let i = 0; i < 5; i++) { const a = i * 1.7 + t, r = z.r * (.3 + .5 * ((i * .31 + t * .6) % 1)); ctx.beginPath(); ctx.arc(x + M.cos(a) * z.r * .3, y + M.sin(a) * z.r * .25, 2 + i % 3 * 1.4, 0, TAU); ctx.stroke() } break;
        case 'bolt': ctx.strokeStyle = `rgba(255,255,255,${.5 + .5 * M.sin(t * 40)})`; ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x + 2, y); ctx.lineTo(x - 2, y + 2); ctx.lineTo(x + 7, y + 8); ctx.stroke(); break;
      }
      if (z.fall) {                                           // vật thể rơi xuống ở 45% cuối
        const q = M.max(0, (p - .55) / .45), o = (1 - q) * (1 - q);
        if (z.fall === 'rock') { ctx.fillStyle = '#6a5a48'; ctx.beginPath(); ctx.ellipse(x, y - o * 280, 15 * (.6 + .4 * q), 12 * (.6 + .4 * q), 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a7860'; ctx.beginPath(); ctx.ellipse(x - 3, y - o * 280 - 3, 6, 4, 0, 0, TAU); ctx.fill() }
        else if (z.fall === 'ice') { const yy = y - o * 280; ctx.fillStyle = 'rgba(205,240,255,.95)'; ctx.beginPath(); ctx.moveTo(x - 7, yy - 18); ctx.lineTo(x + 7, yy - 18); ctx.lineTo(x, yy + 12); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(x - 3, yy - 16, 2, 14) }
        else { const bx = x + (1 - q) * 120, by = y - o * 280; ctx.strokeStyle = 'rgba(255,150,60,.5)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(bx + 70 * (1 - q), by - 70 * (1 - q)); ctx.lineTo(bx, by); ctx.stroke(); ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(bx, by, 12 * (.7 + .3 * q), 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill() }
      }
    }
    for (const f of E.fx) {                                   // hiệu ứng nổ
      const a = f.t / f.T, q = 1 - a, x = f.x - cx, y = f.y - cy, c = f.col;
      if (f.sk === 'ring') { const R2 = f.r * (.15 + .95 * ease(q)); ctx.strokeStyle = rgba(c, a * .9); ctx.lineWidth = 12 * a + 2; ctx.beginPath(); ctx.arc(x, y, R2, 0, TAU); ctx.stroke(); continue }
      const rc = c.split(',').length === 3 ? c : rgbs(c);
      ctx.save(); ctx.globalAlpha = a;
      switch (f.sk) {
        case 'bolt': ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; { const r = rng(hs(M.round(f.x), M.round(f.y))); ctx.beginPath(); let px = x, py = y - 380; ctx.moveTo(px, py); for (let i = 1; i <= 8; i++) { px = x + (i < 8 ? (r() - .5) * 40 : 0); py = y - 380 + i * 47.5; ctx.lineTo(px, py) } ctx.stroke() } ctx.fillStyle = `rgba(${rc},.5)`; ctx.beginPath(); ctx.arc(x, y, f.r * (.8 + .5 * q), 0, TAU); ctx.fill(); break;
        case 'rock': case 'icicle': ctx.strokeStyle = `rgba(${rc},.8)`; ctx.lineWidth = 4 * a + 1; ctx.beginPath(); ctx.ellipse(x, y, f.r * (.4 + .9 * q), f.r * (.25 + .5 * q), 0, 0, TAU); ctx.stroke(); break;
        case 'geyser': case 'soul': { const h = 150 * M.sin(q * M.PI), w = f.r * .8 * (1 - .4 * q), gr = ctx.createLinearGradient(0, y, 0, y - h); gr.addColorStop(0, f.sk === 'soul' ? 'rgba(170,255,190,.9)' : 'rgba(255,200,60,.95)'); gr.addColorStop(1, f.sk === 'soul' ? 'rgba(120,80,200,0)' : 'rgba(255,90,20,0)'); ctx.fillStyle = gr; ctx.fillRect(x - w / 2, y - h, w, h); ctx.fillStyle = `rgba(${rc},.5)`; ctx.beginPath(); ctx.ellipse(x, y, f.r * .9, f.r * .5, 0, 0, TAU); ctx.fill(); break }
        case 'meteor': ctx.fillStyle = `rgba(255,170,60,${.4 * a})`; ctx.beginPath(); ctx.arc(x, y, f.r * (1 + .7 * q), 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,150,.9)'; ctx.lineWidth = 4 * a + 1; ctx.beginPath(); ctx.arc(x, y, f.r * (.8 + 1.1 * q), 0, TAU); ctx.stroke(); break;
        case 'beam': { const w = f.r * 1.3 * a + 4, gr = ctx.createLinearGradient(0, y - 440, 0, y); gr.addColorStop(0, 'rgba(255,250,210,0)'); gr.addColorStop(1, 'rgba(255,245,190,.95)'); ctx.fillStyle = gr; ctx.fillRect(x - w / 2, y - 440, w, 440); ctx.fillStyle = `rgba(${rc},.5)`; ctx.beginPath(); ctx.ellipse(x, y, f.r * (1 + .3 * q), f.r * .55, 0, 0, TAU); ctx.fill(); break }
        case 'rift': ctx.fillStyle = 'rgba(20,6,40,.8)'; ctx.beginPath(); ctx.ellipse(x, y, f.r * .6 * a, f.r * .4 * a, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = `rgba(${rc},.9)`; ctx.lineWidth = 3 * a + 1; ctx.beginPath(); ctx.arc(x, y, f.r * (1.4 - q), 0, TAU); ctx.stroke(); break;
        case 'wave': ctx.strokeStyle = `rgba(${rc},.9)`; ctx.lineWidth = 8 * a + 1; ctx.beginPath(); ctx.ellipse(x, y, f.r * (.4 + .8 * q), f.r * (.25 + .5 * q), 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, f.r * (.3 + .6 * q), f.r * (.18 + .38 * q), 0, 0, TAU); ctx.stroke(); break;
        case 'bone': ctx.fillStyle = 'rgba(240,236,220,.95)'; for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, h = 38 * M.sin(q * M.PI), bx = x + M.cos(an) * f.r * .75, by = y + M.sin(an) * f.r * .75; ctx.beginPath(); ctx.moveTo(bx - 4, by); ctx.lineTo(bx, by - h); ctx.lineTo(bx + 4, by); ctx.fill() } break;
        default: ctx.strokeStyle = `rgba(${rc},.8)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, f.r * (.5 + .7 * q), 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
    if (E.gu) {                                               // vệt gió
      const u = E.gu, a = u.ph === 0 ? 1 - u.t / u.T : 1; ctx.strokeStyle = `rgba(235,235,235,${.15 + .4 * a})`; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const y = (i * 61 + t * 40) % H, x = ((i * 137 + (u.ph ? t * 700 * (u.dx >= 0 ? 1 : -1) : 0)) % (W + 200)) - 100; ctx.moveTo(x, y + u.dy * 30); ctx.lineTo(x + u.dx * 90 * (.4 + a), y + u.dy * 30 + u.dy * 40) }
      ctx.stroke();
      if (u.ph === 0) { ctx.fillStyle = `rgba(255,255,255,${.5 * a})`; ctx.font = 'bold 20px Georgia,serif'; ctx.textAlign = 'center'; ctx.fillText(u.dx >= 0 ? '➜ GIÓ GIẬT ➜' : '⬅ GIÓ GIẬT ⬅', W / 2, H * .22) }
    }
  }

  /* ================= 9) API CÔNG KHAI ================= */
  let E = null, host = null, dpr = 1, SW = 0, SH = 0;
  const TODN = { dawn: '🌅 Bình minh', day: '☀ Ban ngày', dusk: '🌇 Hoàng hôn', night: '🌙 Ban đêm' };
  const WN = { none: '', petals: '🌸 Hoa rơi', rain: '🌧 Mưa', storm: '⛈ Bão', snow: '❄ Tuyết', blizzard: '🌨 Bão tuyết', sand: '🌪 Cát bay', ash: '🌫 Tro bụi', ember: '🔥 Tàn lửa', fog: '🌫 Sương mù', spore: '✨ Bào tử', motes: '✨ Linh quang', spray: '💧 Mưa phùn' };
  const HZN = { bolt: '⚡ Sét đánh', rock: '🪨 Đá rơi', icicle: '🧊 Băng rơi', geyser: '🌋 Dung nham phun', meteor: '☄ Thiên thạch', beam: '☀ Thiên quang', rift: '🌀 Nứt hư không', gust: '💨 Gió giật', spore: '☠ Độc khí', wave: '🌊 Sóng dữ', bone: '🦴 Cốt thương', soul: '👻 Hồn lửa' };
  const ZNN = { mud: 'Bùn lầy', water: 'Nước nông', ice: 'Băng trơn', lava: 'Dung nham', poison: 'Đầm độc', sand: 'Cát lún', holy: 'Thánh địa', rift: 'Vết nứt' };
  const themeOf = c => (D.db && D.db.chapters[c] && D.db.chapters[c].theme) || null;

  function setup(c, h) {
    host = h; const tk = themeOf(c), A = AR[c];
    if (!tk || !A || !TH[tk]) { E = null; return false }
    const T = TH[tk], ch = D.db.chapters[c], map = D.maps && D.maps[tk];
    const obl = A[5] ? A[5].map(k => KI[k]).filter(Boolean) : T.ob.kinds.flatMap(k => Array(k[1]).fill(KI[k[0]]));
    const zl = A[3].map(k => [k, T.zones[k] != null ? T.zones[k] : .22]);
    const zw = zl.flatMap(z => Array(M.max(1, M.round(z[1] * 20))).fill(z[0]));
    dpr = host.dpr();
    E = {
      c, A, tk, T, seed: hs(c + 1, 977), hue: ((ch.hue != null ? ch.hue : (map ? map.hue : 100)) + A[6] + 360) % 360,
      todK: A[0], tod: RU.tod[A[0]], wk: A[1], wi: A[2], hk: A[4], t: 0, fl: 0, ln: 3 + R() * 4, lb: null, wdark: WDARK[A[1]] ? WDARK[A[1]] * (.5 + .25 * A[2]) : 0,
      obmod: T.ob.mod, obi: obl.length ? obl : [KI.rock], spr: {}, asp: {}, ac: null,
      zl, zw, zp: M.min(.9, zl.reduce((s, z) => s + z[1], 0) * 1.15), zc: new Map(), zs: {}, slowZ: zl.some(z => SLOWZ[z[0]]), vl: [],
      hz: [], fx: [], dc: [], cl: [], gu: null, hcd: 0, arena: null, wp: [], wq: -1, cm: 1, pm: 1, pf: 0, pz: 0, ztk: 0,
      leaf: (map && map.leaf) || '#f4a3b8',
      fogc: E_FOG[tk] || '200,212,228', town: null
    };
    {                                                         // Phase 16: khu dựng tay (data/environments.js phần tử thứ 10, hoặc ?debug&town=cotran để xem thử)
      const tid = A[9] || (/[?&]debug/.test(location.search) && (location.search.match(/[?&]town=(\w+)/) || [])[1]) || null;
      if (tid && window.DV_TOWN) E.town = DV_TOWN.create(tid, E, { rng, hs, mk, soft, KI, dpr: () => dpr, q: () => host.q(), G: () => host.G() });
    }
    bakeTiles();
    for (const k of new Set(E.obi)) for (let v = 0; v < 3; v++) getSpr(k, v, false);
    for (const z of new Set(E.zl.map(z => z[0]))) E.zs[z] = bakeZone(z);
    hzSchedule(null); wInit(); LC = null; VIG = null;
    return true;
  }
  const E_FOG = { swamp: '150,170,110', shadow: '150,120,180', cave: '150,130,190', river: '190,210,225', snow: '225,236,248', volcano: '200,150,130', heaven: '255,248,225', void: '150,110,200', sea: '200,225,238', forest: '170,200,170' };

  function update(dt, G) {
    if (!E) return; const P = G.p; E.t += dt;
    if (E.wq !== host.q()) wInit();
    wUpdate(dt); arenaUpdate(dt, G); hzUpdate(dt, G);
    E.pm = E.cm; E.cm = 1; E.pf = 0; E.pz = 0;
    if (E.zw.length && !G.ending) {
      const z = zoneAt(P.x, P.y + 6), zr = z && RU.zone[z]; E.pz = z;
      if (z) {
        if (zr.spd) E.pm = M.min(E.pm, zr.spd); if (zr.fr) E.pf = zr.fr;
        E.ztk -= dt;
        if (E.ztk <= 0 && (zr.dmg || zr.heal)) {
          E.ztk = zr.tick;
          if (zr.dmg) host.hurt(M.max(1, P.mhp * zr.dmg), 0, 1);
          else if (P.hp < P.mhp) host.heal(P.mhp * zr.heal);
        }
      } else E.ztk = 0;
    }
    if (E.town && !G.ending && !E.arena) E.pm = M.min(E.pm, E.town.update(dt, G));   // Phase 16: lội sông chậm, qua cầu gỗ thì không
  }

  /* --- vẽ --- */
  function drawGround(ctx, cx, cy, W, H) {
    if (E.dpr !== dpr || !E.tiles) bakeTiles();
    const T = 64, gx0 = M.floor(cx / T), gy0 = M.floor(cy / T), tl = E.tiles;
    for (let i = 0; i <= W / T + 1; i++) for (let j = 0; j <= H / T + 1; j++) {
      const gx = gx0 + i, gy = gy0 + j, h = hs(gx, gy), v = h % 9 === 0 ? NV + (h >>> 6) % NA : (h >>> 4) % NV;
      ctx.drawImage(tl[v], gx * T - cx, gy * T - cy, T + 1, T + 1);
    }
    const pc0 = M.floor(cx / 256) - 1, pc1 = M.floor((cx + W) / 256) + 1, pr0 = M.floor(cy / 256) - 1, pr1 = M.floor((cy + H) / 256) + 1;
    for (let i = pc0; i <= pc1; i++) for (let j = pr0; j <= pr1; j++) {
      const h = hs(i * 3 + 11, j * 5 + 17); if (h % 5 > 2) continue;
      const r = 120 + (h >>> 4) % 140; ctx.drawImage(E.patch[(h >>> 3) & 1], i * 256 + h % 200 - r - cx, j * 256 + (h >>> 8) % 200 - r - cy, r * 2, r * 2);
    }
    E.vl.length = 0;
    if (E.zw.length) {                                        // vùng địa hình
      const C = RU.zone.cell, t = E.t, c0 = M.floor((cx - 220) / C), c1 = M.floor((cx + W + 220) / C), r0 = M.floor((cy - 220) / C), r1 = M.floor((cy + H + 220) / C);
      for (let i = c0; i <= c1; i++) for (let j = r0; j <= r1; j++) for (const z of blobs(i, j)) {
        const sx = z.x - cx, sy = z.y - cy, rx = z.rx, ry = z.ry;
        if (sx < -rx - 20 || sy < -ry - 20 || sx > W + rx + 20 || sy > H + ry + 20) continue;
        if (E.arena && arenaIn(z.x, z.y, z.rx)) continue;
        ctx.drawImage(E.zs[z.k], sx - rx * 1.06, sy - ry * 1.06, rx * 2.12, ry * 2.12);
        E.vl.push({ k: z.k, sx, sy, rx, ry, s: z.s });
        switch (z.k) {
          case 'water': { const ph = (t * .45 + z.s * .13) % 1; ctx.strokeStyle = `rgba(255,255,255,${.4 * (1 - ph)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx, sy, rx * .85 * ph + 2, ry * .85 * ph + 1, 0, 0, TAU); ctx.stroke(); break }
          case 'lava': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18 + .1 * M.sin(t * 3 + z.s); ctx.drawImage(soft('255,110,30'), sx - rx * 1.1, sy - ry * 1.1, rx * 2.2, ry * 2.2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; break;
          case 'poison': ctx.fillStyle = 'rgba(200,255,120,.65)'; for (let k = 0; k < 3; k++) { const ph = (t * .6 + k * .33 + z.s * .1) % 1; ctx.beginPath(); ctx.arc(sx + M.cos(z.s + k * 2) * rx * .5, sy + M.sin(z.s * 2 + k * 3) * ry * .4 - ph * 16, 1.5 + (1 - ph) * 3, 0, TAU); ctx.fill() } break;
          case 'ice': ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k < 2; k++) { const a = M.abs(M.sin(t * 2 + z.s + k * 2)), x = sx + M.cos(z.s + k * 3) * rx * .5, y = sy + M.sin(z.s * 2 + k) * ry * .4; ctx.globalAlpha = a; ctx.fillRect(x - 4, y - .5, 8, 1); ctx.fillRect(x - .5, y - 4, 1, 8) } ctx.globalAlpha = 1; break;
          case 'holy': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 + .12 * M.sin(t * 2 + z.s); ctx.drawImage(soft('255,235,150'), sx - rx, sy - ry, rx * 2, ry * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,245,190,.85)'; for (let k = 0; k < 4; k++) { const ph = (t * .4 + k * .25) % 1; ctx.fillRect(sx + M.cos(z.s + k * 1.7) * rx * .5, sy + M.sin(z.s + k) * ry * .35 - ph * 40, 2, 2) } break;
          case 'rift': ctx.strokeStyle = 'rgba(210,140,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.ellipse(sx, sy, rx * .55, ry * .55, t * .5, 0, TAU); ctx.stroke(); ctx.setLineDash([]); break;
          case 'sand': ctx.strokeStyle = 'rgba(80,55,28,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx, sy, rx * .5, ry * .5, t * .3, 0, 4.6); ctx.stroke(); break;
        }
      }
    }
    if (E.town) E.town.drawGround(ctx, cx, cy, W, H);          // Phase 16: sông, cầu, đường lát đá (dưới sàn đấu trường)
    drawArenaFloor(ctx, cx, cy);
  }
  const PR = [];
  function props(cx, cy, W, H, L) {
    const gx0 = M.floor(cx / 64) - 1, gx1 = M.floor((cx + W) / 64) + 1, gy0 = M.floor(cy / 64), gy1 = M.floor((cy + H) / 64) + 2, a = E.arena;
    for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
      const k = ob(gx, gy); if (!k || k === KI.tsolid || k === KI.tpost) continue; const h = hs(gx * 7 + 3, gy * 5 + 1);
      let o = PR.pop(); if (!o) o = { ob: 1 };
      o.k = k; o.v = (h >>> 16) % 3; o.x = gx * 64 + 32; o.y = gy * 64 + 34; o.sc = 1; o.arena = 0; L.push(o);
    }
    if (E.town) E.town.collect(cx, cy, W, H, L);
    if (a) for (const p of a.pl) { if (p.x - cx < -80 || p.x - cx > W + 80 || p.y - cy < -20 || p.y - cy > H + 130) continue; L.push(p) }
    E.props = L;
  }
  function recycle(L) { for (const o of L) if (o.ob === 1 && !o.arena && PR.length < 80) PR.push(o) }
  function drawProp(ctx, o, sx, sy) {
    if (o.tw) return E.town.drawProp(ctx, o, sx, sy);        // Phase 16
    const s = o.sc || 1, t = E.t; let yy = sy;
    if (o.k === KI.voidrock) yy -= M.sin(t * 1.6 + o.x * .01) * 3 + 8;
    const spr = getSpr(o.k, o.v, !!o.arena);
    if (o.arena && E.arena) ctx.globalAlpha = E.arena.fade * M.min(1, E.arena.p * 2);
    ctx.drawImage(spr, sx - 48 * s, yy - 104 * s, 96 * s, 128 * s);
    if (o.k === KI.brazier) {
      const f = 1 + .12 * M.sin(t * 11 + o.x), fa = o.arena ? E.arena.fade : 1; ctx.globalAlpha = fa;
      ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(sx - 10 * s, yy - 78 * s); ctx.quadraticCurveTo(sx - 12 * s * f, yy - 98 * s, sx + 2, yy - 114 * s * f); ctx.quadraticCurveTo(sx + 12 * s * f, yy - 96 * s, sx + 10 * s, yy - 78 * s); ctx.fill();
      ctx.fillStyle = '#ffd34a'; ctx.beginPath(); ctx.moveTo(sx - 5 * s, yy - 78 * s); ctx.quadraticCurveTo(sx - 4 * s, yy - 92 * s, sx + 1, yy - 100 * s * f); ctx.quadraticCurveTo(sx + 6 * s, yy - 90 * s, sx + 5 * s, yy - 78 * s); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawFx(ctx, cx, cy, W, H, G) {
    hzDraw(ctx, cx, cy, W, H, E.t); drawArenaRing(ctx, cx, cy, W, H, E.t, host.G());
  }
  function drawAfter(ctx, cx, cy, W, H) {
    const G = host.G(), t = E.t; SW = W; SH = H;
    parallax(ctx, cx, cy, W, H, t);
    if (E.T.rays) rays(ctx, cx, W, H, t);
    drawWeather(ctx, cx, cy, W, H, t);
    lighting(ctx, cx, cy, W, H, t, G);
    drawLightning(ctx, W, H);
    vignette(ctx, W, H);
  }
  function info(c) {
    const A = AR[c]; if (!A) return '';
    const z = A[3].map(k => ZNN[k]).join(', ');
    return [TODN[A[0]], WN[A[1]], A[4] ? HZN[A[4]] : '', z ? '🗺 ' + z : ''].filter(Boolean).join(' · ');
  }

  window.DV_ENV = {
    ok: () => !!(D.db && D.envValidate().length === 0),
    setup, update, ob, rad, zoneAt, foe, clamp, props, recycle, drawProp, drawGround, drawFx, drawAfter, arenaOpen, info,
    pm: () => E ? E.pm : 1, fr: () => E ? E.pf : 0, arenaOn: () => !!(E && E.arena && !E.arena.closing),
    resize: (d, w, h) => { dpr = d; VIG = null; LC = null; if (E) E.tiles = null },
    title: () => E ? `${E.A[8]} · ${TODN[E.todK]}${WN[E.wk] ? ' · ' + WN[E.wk] : ''}` : '',
    arenaName: () => E ? E.A[7] : '',
    state: () => E,
    kinds: OBK
  };
})();
