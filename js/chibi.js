/* Phase 9 — CHIBI / Q版 CHARACTER RENDERER  (window.DV_CHIBI)
   Chỉ thay LỚP HÌNH ẢNH của nhân vật. Chỉ số, animation (pose), tiến hoá, hiệu ứng nền (aura, ấn, VFX đòn đánh)
   vẫn do js/character.js điều khiển — file này chỉ vẽ thân/đầu/vũ khí theo phong cách Q版 võ hiệp.
   - body(X): vẽ nhân vật, trả về {S: vai cầm vũ khí, tip: mũi vũ khí}
   - burst(ctx, kind, u, pal, q, t): hiệu ứng lên cấp (lvl) / học võ công (skl) / nâng cảnh giới (realm)
   Thiếu file này → character.js tự dùng hình vẽ cũ. */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2, PI = M.PI;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const INK = '#2a1530', RAR = ['#35c46a', '#3a8dff', '#a64bff', '#ff9a2e'];
  const WPL = { sword: 23, glaive: 40, spear: 46, bow: 16, banner: 40, shield: 11, twin: 17 };

  /* ---------- màu ---------- */
  const CC = {};
  function hx(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] }
  function sh(h, t) { const k = h + t; if (CC[k]) return CC[k]; const a = hx(h), to = t > 0 ? 255 : 0, u = M.abs(t); return CC[k] = '#' + a.map(v => M.round(v + (to - v) * u).toString(16).padStart(2, '0')).join('') }
  function al(h, a) { const k = h + '@' + a; if (CC[k]) return CC[k]; const v = hx(h); return CC[k] = 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')' }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++)c.lineTo(pts[i][0], pts[i][1]); c.closePath() }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() }
  function vg(c, y0, y1, a, b, cm) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); if (cm) g.addColorStop(.5, cm); g.addColorStop(1, b); return g }
  function fillOut(c, fill, w) { c.fillStyle = fill; c.fill(); c.lineWidth = w || 1.5; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke() }
  /* dải vải bay phấp phới (khăn, đuôi tóc, dải lụa): chảy về phía -x */
  function ribbon(X, x0, y0, len, wid, wave, ph, col, drop) {
    const c = X.c, n = 9, top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = x0 - u * len - X.p.leg * .15 * u, y = y0 + u * u * (drop == null ? len * .22 : drop) + M.sin(X.t * 4.2 - u * 3.2 + ph) * wave * u, w = wid * (1 - u * .62);
      top.push([x, y - w / 2]); bot.push([x, y + w / 2]);
    }
    poly(c, top.concat(bot.reverse())); fillOut(c, X.m(col), 1.3);
  }

  /* ---------- hồ sơ khuôn mặt riêng từng nhân vật ---------- */
  const SPEC = {
    dbl: { hair: '#1d1b33', hl: '#5a5fa8', style: 'topknot', eye: '#3f84ea', brow: 1.9, mouth: 'smile', mark: null },
    lh: { hair: '#2b1612', hl: '#7a3a2c', style: 'spiky', eye: '#e8962a', brow: 3, mouth: 'grin', mark: 'scar' },
    nq: { hair: '#13242b', hl: '#3f8c96', style: 'ponytail', eye: '#2fd4a8', brow: 1.8, mouth: 'smirk', mark: null },
    thd: { hair: '#251b36', hl: '#7a62b8', style: 'long', eye: '#a475ff', brow: 2, mouth: 'calm', mark: 'beard' },
    dl: { hair: '#5c3a20', hl: '#b57a3e', style: 'tuft', eye: '#62c84c', brow: 1.7, mouth: 'smile', mark: 'freckle', big: 1.08 },
    nb: { hair: '#2b1a10', hl: '#70492a', style: 'short', eye: '#d08a2a', brow: 3, mouth: 'firm', mark: 'stub' },
    ltk: { hair: '#30260f', hl: '#c4a43a', style: 'swept', eye: '#f2c52e', brow: 1.6, mouth: 'smirk', mark: 'mustache' }
  };
  const specOf = X => SPEC[X.id] || { hair: '#2a2030', hl: '#6a5a8a', style: 'short', eye: X.pal.accent, brow: 2, mouth: 'smile', mark: null };

  /* ---------- tóc ---------- */
  function hairBack(X, sp, hx, hy, r) {
    const c = X.c, m = X.m, st = sp.style;
    if (st === 'ponytail') { ribbon(X, hx - r * .75, hy - r * .55, 26, 7, 3.4, 0, sp.hair, 9) }
    if (st === 'long') { rr(c, hx - r * 1.12, hy - r * .2, r * 2.24, r * 2.1, r * .8); fillOut(c, vg(c, hy, hy + r * 2, m(sp.hair), m(sh(sp.hair, -.3))), 1.5) }
    if (st === 'swept') { ribbon(X, hx - r * .8, hy, 12, 5, 1.8, 1, sp.hair, 7) }
    c.beginPath(); c.ellipse(hx, hy - r * .06, r * 1.1, r * 1.02, 0, 0, TAU); fillOut(c, m(sp.hair), 1.6);
    if (st === 'topknot') { c.beginPath(); c.arc(hx - 1.5, hy - r - 3.6, 4.6, 0, TAU); fillOut(c, m(sp.hair), 1.5); c.fillStyle = m(X.pal.accent); c.fillRect(hx - 4.5, hy - r - .2, 6, 2.2) }
    if (st === 'spiky') { for (let i = -2; i <= 2; i++) { poly(c, [[hx + i * 4.4 - 3, hy - r * .85], [hx + i * 4.4 + (i ? i * .8 : 0), hy - r - 7 + M.abs(i) * 1.6], [hx + i * 4.4 + 3, hy - r * .85]]); fillOut(c, m(sp.hair), 1.4) } }
    if (st === 'tuft') { c.strokeStyle = INK; c.lineWidth = 3.6; c.lineCap = 'round'; const w = M.sin(X.t * 3) * 1.2; c.beginPath(); c.moveTo(hx + 1, hy - r + 1); c.quadraticCurveTo(hx + 1 + w, hy - r - 7, hx + 6 + w, hy - r - 8); c.stroke(); c.strokeStyle = m(sp.hair); c.lineWidth = 1.8; c.stroke(); c.lineCap = 'butt' }
  }
  function bangs(X, sp, hx, hy, r, pts) {
    const c = X.c, m = X.m;
    c.beginPath(); c.moveTo(hx - r * 1.06, hy + r * .32); c.ellipse(hx, hy - r * .03, r * 1.08, r * 1.03, 0, PI, TAU);
    c.lineTo(hx + r * 1.04, hy + r * .34);
    for (let i = pts.length - 1; i >= 0; i--)c.lineTo(hx + pts[i][0] * r, hy + pts[i][1] * r);
    c.closePath(); fillOut(c, vg(c, hy - r, hy, m(sh(sp.hair, .12)), m(sp.hair)), 1.6);
    c.strokeStyle = al(sp.hl, .85); c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.ellipse(hx - r * .1, hy - r * .1, r * .8, r * .76, 0, PI * 1.12, PI * 1.55); c.stroke(); c.lineCap = 'butt';
  }
  const FR = {
    topknot: [[-.98, .3], [-.68, -.12], [-.4, -.34], [-.08, -.16], [.28, -.4], [.62, -.12], [.98, .32]],
    spiky: [[-.98, .34], [-.7, -.2], [-.45, -.4], [-.2, -.2], [.1, -.42], [.5, -.26], [.75, -.34], [.98, .34]],
    ponytail: [[-.98, .3], [-.5, -.34], [-.1, -.22], [.3, -.32], [.7, -.05], [.98, .34]],
    long: [[-.98, .36], [-.74, -.1], [-.4, -.36], [-.06, -.18], [.06, -.18], [.4, -.36], [.74, -.1], [.98, .36]],
    tuft: [[-.98, .3], [-.66, -.14], [-.36, -.3], [-.12, -.08], [.2, -.36], [.5, -.12], [.76, -.28], [.98, .3]],
    short: [[-.98, .3], [-.6, -.2], [-.2, -.36], [.2, -.3], [.6, -.18], [.98, .3]],
    swept: [[-.98, .3], [-.6, -.3], [-.1, -.4], [.4, -.22], [.8, .0], [.98, .44]]
  };

  /* ---------- khuôn mặt ---------- */
  function face(X, sp, hx, hy, r) {
    const c = X.c, P = X.pal, st = X.state, t = X.t, m = X.m;
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(hx + s * r * .98, hy + r * .12, 2.6, 3.2, 0, 0, TAU); fillOut(c, m(sh(P.skin, -.06)), 1.2) }
    const g = c.createRadialGradient(hx - r * .3, hy - r * .45, r * .15, hx, hy, r * 1.15);
    g.addColorStop(0, m(sh(P.skin, .42))); g.addColorStop(.55, m(P.skin)); g.addColorStop(1, m(sh(P.skin, -.2)));
    c.beginPath(); c.ellipse(hx, hy, r * 1.04, r * .96, 0, 0, TAU); fillOut(c, g, 1.7);
    const ey = hy + r * .14, ex = r * .42, fx = r * .12;
    const mood = st === 'hit' ? 'hit' : st === 'defeat' ? 'ko' : st === 'victory' ? 'joy' : st === 'ultimate' ? 'fury' : (st === 'attack' || st === 'skill') ? 'fierce' : (t % 3.3 < .11 ? 'blink' : 'open');
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const s of [-1, 1]) {
      const cx = hx + s * ex + fx, rx = r * .2, ry = r * .27 * (mood === 'fierce' ? .88 : mood === 'fury' ? .76 : 1);
      if (mood === 'open' || mood === 'fierce' || mood === 'fury') {
        c.fillStyle = m('#ffffff'); c.beginPath(); c.ellipse(cx, ey, rx, ry, 0, 0, TAU); c.fill();
        const ig = c.createLinearGradient(0, ey - ry, 0, ey + ry); ig.addColorStop(0, m(sh(sp.eye, -.5))); ig.addColorStop(.55, m(sp.eye)); ig.addColorStop(1, m(sh(sp.eye, .6)));
        c.fillStyle = ig; c.beginPath(); c.ellipse(cx + fx * .25, ey + ry * .06, rx * .8, ry * .92, 0, 0, TAU); c.fill();
        c.fillStyle = '#1a0f1e'; c.beginPath(); c.ellipse(cx + fx * .25, ey + ry * .06, rx * .38, ry * .5, 0, 0, TAU); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(cx - rx * .22, ey - ry * .38, rx * .3, ry * .28, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(cx + rx * .32, ey + ry * .44, rx * .14, 0, TAU); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.9; c.beginPath(); c.ellipse(cx, ey, rx, ry, 0, PI * 1.04, PI * 1.96); c.stroke();
        c.lineWidth = 1.3; c.beginPath(); c.moveTo(cx + s * rx * .95, ey - ry * .45); c.lineTo(cx + s * (rx + 2.2), ey - ry * .85); c.stroke();
        if (mood === 'fury') { c.strokeStyle = al(P.accent, .9); c.lineWidth = .9; c.beginPath(); c.ellipse(cx + fx * .25, ey + ry * .06, rx * .86, ry * .98, 0, 0, TAU); c.stroke() }
      } else if (mood === 'blink') { c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.arc(cx, ey - ry * .3, rx, .12 * PI, .88 * PI); c.stroke() }
      else if (mood === 'joy') { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(cx, ey + ry * .5, rx * 1.05, PI * 1.1, PI * 1.9); c.stroke() }
      else if (mood === 'hit') { c.strokeStyle = INK; c.lineWidth = 1.9; c.beginPath(); c.moveTo(cx + s * rx, ey - ry * .75); c.lineTo(cx - s * rx * .8, ey); c.lineTo(cx + s * rx, ey + ry * .75); c.stroke() }
      else { c.strokeStyle = INK; c.lineWidth = 1.7; c.beginPath(); c.moveTo(cx - rx, ey - ry * .6); c.lineTo(cx + rx, ey + ry * .6); c.moveTo(cx + rx, ey - ry * .6); c.lineTo(cx - rx, ey + ry * .6); c.stroke() }
      /* lông mày */
      const ang = mood === 'fierce' ? .4 : mood === 'fury' ? .65 : mood === 'hit' ? -.35 : mood === 'ko' ? -.5 : .12, by = ey - r * .43;
      c.strokeStyle = sp.hair; c.lineWidth = sp.brow; c.beginPath(); c.moveTo(cx - s * r * .2, by + ang * 4.2); c.lineTo(cx + s * r * .23, by - ang * 3); c.stroke();
    }
    /* má hồng, mũi */
    c.fillStyle = 'rgba(255,112,120,.42)'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(hx + s * r * .6 + fx, hy + r * .5, r * .17, r * .1, 0, 0, TAU); c.fill() }
    c.strokeStyle = al(sh(P.skin, -.4), .8); c.lineWidth = 1; c.beginPath(); c.moveTo(hx + fx + 1, hy + r * .36); c.lineTo(hx + fx + 2.2, hy + r * .42); c.stroke();
    /* miệng */
    const mm = st === 'ultimate' ? 'roar' : (st === 'attack' || st === 'skill') ? 'shout' : st === 'hit' ? 'ow' : st === 'defeat' ? 'flat' : st === 'victory' ? 'laugh' : sp.mouth, mx0 = hx + fx * .8, my = hy + r * .64;
    c.strokeStyle = INK; c.lineWidth = 1.4;
    if (mm === 'smile') { c.beginPath(); c.arc(mx0, my - 1.4, 2.7, .12 * PI, .88 * PI); c.stroke() }
    else if (mm === 'grin') { c.beginPath(); c.ellipse(mx0, my - 1, 3.7, 2.5, 0, 0, PI); c.fillStyle = '#fff'; c.fill(); c.stroke() }
    else if (mm === 'smirk') { c.beginPath(); c.moveTo(mx0 - 2.4, my); c.quadraticCurveTo(mx0 + .5, my + 1.6, mx0 + 3, my - 1.4); c.stroke() }
    else if (mm === 'calm') { c.beginPath(); c.moveTo(mx0 - 2, my); c.lineTo(mx0 + 2, my); c.stroke() }
    else if (mm === 'firm' || mm === 'flat') { c.beginPath(); c.moveTo(mx0 - 2.4, my + .6); c.lineTo(mx0 + 2.4, my - .2); c.stroke() }
    else if (mm === 'laugh') { c.beginPath(); c.ellipse(mx0, my - .8, 3.6, 3.4, 0, 0, PI); c.fillStyle = '#6a1c2c'; c.fill(); c.stroke(); c.fillStyle = '#ff8a9a'; c.beginPath(); c.ellipse(mx0, my + 1.2, 1.8, 1, 0, 0, TAU); c.fill() }
    else { const rx = mm === 'roar' ? 3.7 : mm === 'shout' ? 2.6 : 1.8, ry = mm === 'roar' ? 4.2 : mm === 'shout' ? 3 : 2.3; c.beginPath(); c.ellipse(mx0, my + .6, rx, ry, 0, 0, TAU); c.fillStyle = '#5a1424'; c.fill(); c.stroke(); if (mm === 'roar') { c.fillStyle = '#fff'; c.fillRect(mx0 - 2.4, my - 2.4, 4.8, 1.7) } }
    /* dấu hiệu riêng */
    const mk = sp.mark; c.lineCap = 'round';
    if (mk === 'scar') { c.strokeStyle = '#a8402e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hx + r * .55 + fx, hy + r * .02); c.lineTo(hx + r * .8 + fx, hy + r * .55); c.stroke(); c.strokeStyle = '#ffd0b8'; c.lineWidth = .8; c.beginPath(); c.moveTo(hx + r * .6 + fx, hy + r * .2); c.lineTo(hx + r * .7 + fx, hy + r * .42); c.stroke() }
    if (mk === 'freckle') { c.fillStyle = '#b5683a'; for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { c.beginPath(); c.arc(hx + s * (r * .5 + i * 1.8) + fx, hy + r * .38 + (i % 2) * 1.4, .7, 0, TAU); c.fill() } }
    if (mk === 'beard') { c.beginPath(); c.moveTo(hx - 3.6 + fx * .5, hy + r * .78); c.quadraticCurveTo(hx + fx * .5, hy + r * 1.75, hx + 3.6 + fx * .5, hy + r * .78); c.quadraticCurveTo(hx + fx * .5, hy + r * .9, hx - 3.6 + fx * .5, hy + r * .78); fillOut(c, X.m('#2c2140'), 1.1) }
    if (mk === 'mustache') { c.strokeStyle = sp.hair; c.lineWidth = 1.5; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(mx0, my - 2.2); c.quadraticCurveTo(mx0 + s * 3, my - 3, mx0 + s * 5.2, my - .6); c.stroke() } }
    if (mk === 'stub') { c.fillStyle = al('#3a2414', .5); for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(hx - 4 + i * 1.5 + fx * .5, hy + r * .8 + (i % 2) * 1.5, .6, 0, TAU); c.fill() } }
    c.lineCap = 'butt';
  }

  /* ---------- mũ / phụ kiện đầu (theo d.head — thay đổi khi Thức Tỉnh) ---------- */
  function gem(X, x, y, rad, col) { const c = X.c; c.beginPath(); c.arc(x, y, rad, 0, TAU); fillOut(c, X.m(col), 1.1); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x - rad * .3, y - rad * .3, rad * .32, 0, TAU); c.fill() }
  const HG = {
    topknot(X, hx, hy, r) { const c = X.c, P = X.pal; rr(c, hx - r * .78, hy - r * .78, r * 1.56, 3.4, 1.6); fillOut(c, X.m(P.accent), 1.2); gem(X, hx, hy - r * .78 + 1.7, 2, '#ff4a6a'); ribbon(X, hx - r * .7, hy - r * .6, 15, 3.2, 2.2, 2, P.main, 6) },
    crest(X, hx, hy, r) { const c = X.c, P = X.pal, f = M.sin(X.t * 5) * 1.6;
      ribbon(X, hx - 1, hy - r - 1, 20, 7, 2.6 + f, 0, P.main, 8);
      c.beginPath(); c.ellipse(hx, hy - r * .3, r * 1.1, r * .86, 0, PI, TAU); c.lineTo(hx + r * 1.1, hy - r * .12); c.lineTo(hx - r * 1.1, hy - r * .12); c.closePath(); fillOut(c, vg(c, hy - r * 1.1, hy, X.m(sh(P.metal, .25)), X.m(sh(P.metal, -.25))), 1.6);
      rr(c, hx - r * 1.1, hy - r * .34, r * 2.2, 3.2, 1.2); fillOut(c, X.m(P.accent), 1.1);
      for (const s of [-1, 1]) { rr(c, hx + s * r * 1.02 - 2.2, hy - r * .22, 4.4, r * .95, 1.8); fillOut(c, X.m(sh(P.metal, -.12)), 1.2) }
      c.fillStyle = X.m(P.main); poly(c, [[hx - 2.4, hy - r * 1.06], [hx + 2.4, hy - r * 1.06], [hx, hy - r - 6]]); fillOut(c, X.m(P.main), 1.1); gem(X, hx, hy - r * .42, 2.2, '#ff5a3a') },
    headband(X, hx, hy, r) { const c = X.c, P = X.pal; c.beginPath(); c.ellipse(hx, hy - r * .42, r * 1.07, r * .24, 0, 0, TAU); fillOut(c, X.m(P.accent), 1.3); c.fillStyle = X.m('#ffffff'); gem(X, hx + r * .15, hy - r * .42, 2.3, P.main);
      ribbon(X, hx - r * 1.0, hy - r * .42, 24, 4.2, 4.2, 0, P.accent, 8); ribbon(X, hx - r * 1.0, hy - r * .36, 20, 3.4, 3.4, 1.6, sh(P.accent, -.15), 12) },
    wing(X, hx, hy, r) { const c = X.c, P = X.pal, w = M.sin(X.t * 3) * .03;
      for (const s of [-1, 1]) { c.save(); c.translate(hx + s * r * .62, hy - r * .8); c.rotate(s * w); rr(c, s > 0 ? 0 : -r * 1.35, -2, r * 1.35, 4.6, 2); fillOut(c, X.m('#241a36'), 1.3); c.fillStyle = X.m(P.accent); c.fillRect(s > 0 ? 1 : -r * 1.35 + 1, -.6, r * 1.35 - 2, 1.3); c.restore() }
      c.beginPath(); c.ellipse(hx, hy - r * .6, r * .98, r * .72, 0, PI, TAU); c.lineTo(hx + r * .98, hy - r * .46); c.lineTo(hx - r * .98, hy - r * .46); c.closePath(); fillOut(c, vg(c, hy - r * 1.3, hy - r * .4, X.m('#3d2c5a'), X.m('#1b1328')), 1.5);
      rr(c, hx - r * .98, hy - r * .6, r * 1.96, 3.2, 1.4); fillOut(c, X.m(P.accent), 1.1); gem(X, hx, hy - r * .6 + 1.6, 2.3, '#ff4a6a'); c.strokeStyle = al(P.accent, .8); c.lineWidth = 1; c.beginPath(); c.moveTo(hx, hy - r * 1.28); c.lineTo(hx, hy - r * .66); c.stroke() },
    round(X, hx, hy, r) { const c = X.c, P = X.pal; for (const s of [-1, 1]) { rr(c, hx + s * r * 1.0 - 2.6, hy - r * .15, 5.2, r * 1.15, 2); fillOut(c, X.m(sh(P.metal, -.1)), 1.3) }
      c.beginPath(); c.ellipse(hx, hy - r * .3, r * 1.12, r * .88, 0, PI, TAU); c.lineTo(hx + r * 1.12, hy - r * .12); c.lineTo(hx - r * 1.12, hy - r * .12); c.closePath(); fillOut(c, vg(c, hy - r * 1.2, hy, X.m(sh(P.metal, .3)), X.m(sh(P.metal, -.28))), 1.6);
      rr(c, hx - r * 1.14, hy - r * .36, r * 2.28, 3.4, 1.4); fillOut(c, X.m(P.accent), 1.1); c.beginPath(); c.arc(hx, hy - r * 1.1, 2.4, 0, TAU); fillOut(c, X.m('#d83a3a'), 1.1); gem(X, hx, hy - r * .36 + 1.7, 1.8, '#ffe27a') },
    hood(X, hx, hy, r) { const c = X.c, P = X.pal; ribbon(X, hx - r * .6, hy - r * .9, 12, 8, 2, 0, sh(P.main, -.1), 10);
      c.beginPath(); c.moveTo(hx - r * 1.18, hy + r * .5); c.quadraticCurveTo(hx - r * 1.3, hy - r * 1.25, hx, hy - r * 1.18); c.quadraticCurveTo(hx + r * 1.3, hy - r * 1.2, hx + r * 1.15, hy + r * .5); c.quadraticCurveTo(hx + r * .78, hy - r * .46, hx, hy - r * .38); c.quadraticCurveTo(hx - r * .8, hy - r * .46, hx - r * 1.18, hy + r * .5); c.closePath(); fillOut(c, vg(c, hy - r * 1.2, hy + r * .5, X.m(sh(P.main, .18)), X.m(sh(P.main, -.18))), 1.6);
      c.strokeStyle = X.m(P.accent); c.lineWidth = 1.3; c.beginPath(); c.moveTo(hx - r * .8, hy - r * .46); c.quadraticCurveTo(hx, hy - r * .34, hx + r * .8, hy - r * .46); c.stroke(); c.fillStyle = X.m(P.accent); c.beginPath(); c.arc(hx, hy - r * 1.1, 1.6, 0, TAU); c.fill() },
    tiered(X, hx, hy, r) { const c = X.c, P = X.pal; rr(c, hx - r * .95, hy - r * .78, r * 1.9, 5, 2); fillOut(c, X.m(P.accent), 1.3); rr(c, hx - r * .62, hy - r * 1.28, r * 1.24, 5.6, 2); fillOut(c, X.m(sh(P.accent, .1)), 1.3); poly(c, [[hx - r * .3, hy - r * 1.28], [hx + r * .3, hy - r * 1.28], [hx, hy - r * 1.7]]); fillOut(c, X.m(P.main), 1.2);
      gem(X, hx, hy - r * .78 + 2.5, 2.6, '#ff3a4a'); for (const s of [-1, 1]) { c.strokeStyle = X.m(sh(P.accent, -.1)); c.lineWidth = 1.1; const sw = M.sin(X.t * 4 + s) * 1; c.beginPath(); c.moveTo(hx + s * r * .95, hy - r * .6); c.lineTo(hx + s * r * 1.0 + sw, hy + r * .1); c.stroke(); c.fillStyle = X.m('#ffe9a0'); c.beginPath(); c.arc(hx + s * r * 1.0 + sw, hy + r * .16, 1.6, 0, TAU); c.fill() } }
  };

  /* ---------- lưng ---------- */
  const BK = {
    none() { },
    cape(X, tw) { const c = X.c, P = X.pal, f = M.sin(X.t * 3) * 2 + X.p.leg * .6 - X.p.lean * 6; c.beginPath(); c.moveTo(-tw * .6, -23); c.quadraticCurveTo(-tw * 2 - 3, -14, -tw * 2.1 - 7 + f, -1); c.lineTo(-tw * .1, -3); c.closePath(); fillOut(c, vg(c, -23, -1, X.m(sh(P.sub, .1)), X.m(sh(P.sub, -.25))), 1.4); c.fillStyle = X.m(P.accent); c.fillRect(-tw * .85, -24, tw * .6, 2.6) },
    scarf(X, tw) { ribbon(X, -tw * .4, -22.5, 30, 4.4, 4.6, 0, X.pal.accent, 6); ribbon(X, -tw * .4, -20.5, 25, 3.6, 3.8, 1.8, sh(X.pal.accent, -.2), 10) },
    quiver(X, tw) { const c = X.c, P = X.pal; c.save(); c.translate(-tw * .8, -15); c.rotate(-.5); rr(c, -3.4, -12, 6.8, 22, 2.4); fillOut(c, X.m(sh(P.sub, .05)), 1.3); c.fillStyle = X.m(P.accent); c.fillRect(-3.4, -3, 6.8, 2.2); c.strokeStyle = INK; c.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 1.9, -12); c.lineTo(i * 2.5, -19); c.stroke(); c.fillStyle = X.m(i ? '#e8e0c8' : '#ff6a5a'); poly(c, [[i * 2.5 - 1.6, -17], [i * 2.5 + 1.6, -17], [i * 2.5, -22]]); c.fill() } c.restore() },
    banner(X, tw) { const c = X.c, P = X.pal, f = M.sin(X.t * 4) * 3, bx = -tw * .8; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, -9); c.lineTo(bx - 2, -52); c.stroke(); c.strokeStyle = X.m('#8a6a3a'); c.lineWidth = 1.6; c.stroke();
      c.beginPath(); c.moveTo(bx - 2, -51); c.quadraticCurveTo(bx - 13, -49 + f, bx - 21 + f, -44); c.lineTo(bx - 19 + f, -35); c.quadraticCurveTo(bx - 12, -38 - f, bx - 3, -33); c.closePath(); fillOut(c, X.m(P.accent), 1.3); gem(X, bx - 11 + f * .5, -42, 2.6, P.main) },
    twin(X, tw) { const c = X.c, P = X.pal; for (const s of [-1, 1]) { c.save(); c.translate(-2, -17); c.rotate(s * .7 - 2.35); poly(c, [[0, -1.9], [26, -1.3], [29, 0], [26, 1.3], [0, 1.9]]); fillOut(c, X.m(P.metal), 1.2); c.fillStyle = X.m(P.accent); c.fillRect(-3.5, -2.8, 4.5, 5.6); c.restore() } },
    sunburst(X) { const c = X.c, P = X.pal, n = 12, rot = X.t * .5; c.save(); c.translate(-2, -20); for (let i = 0; i < n; i++) { const a = rot + i * TAU / n, l = i % 2 ? 22 : 29; poly(c, [[M.cos(a - .12) * 14, M.sin(a - .12) * 14], [M.cos(a) * l, M.sin(a) * l], [M.cos(a + .12) * 14, M.sin(a + .12) * 14]]); c.fillStyle = al(P.accent, .85); c.fill() } c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.strokeStyle = X.m(P.accent); c.lineWidth = 2; c.stroke(); c.restore() }
  };

  /* ---------- thân, chân ---------- */
  function legsAndBoots(X, tw, long) {
    const c = X.c, P = X.pal, p = X.p, eq = X.eq && X.eq.f, bc = eq ? sh(RAR[eq.r], -.25) : sh(P.sub, -.2), cuff = eq ? RAR[eq.r] : P.accent;
    for (const s of [-1, 1]) {
      const ph = s * p.leg, fx = s * 3.3 + (s < 0 ? 1 : -1) * p.leg * .55, lift = M.max(0, ph) * .38, fy = -1.3 - lift;
      if (!long) { c.strokeStyle = INK; c.lineWidth = 6.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(s * 3.2, -11); c.lineTo(fx, fy - 2); c.stroke(); c.strokeStyle = X.m(P.sub); c.lineWidth = 4; c.stroke(); c.lineCap = 'butt' }
      c.beginPath(); c.ellipse(fx + 1, fy, 4.2, 2.8, 0, 0, TAU); fillOut(c, X.m(bc), 1.3);
      c.fillStyle = X.m(cuff); c.fillRect(fx - 2.8, fy - 3.2, 5.6, 1.6);
      if (eq && eq.r >= 3 && X.q > 0) { c.fillStyle = al('#ffe9a0', .85); c.beginPath(); c.arc(fx - 3 + M.sin(X.t * 9 + s) * 2, fy + 2, 1, 0, TAU); c.fill() }
    }
  }
  function torso(X, tw) {
    const c = X.c, P = X.pal, m = X.m, b = X.d.body, y0 = -23, y1 = -9.5, ea = X.eq && X.eq.a, rc = ea ? RAR[ea.r] : null;
    if (b === 'robe') {
      const sw = M.sin(X.t * 2 + X.p.leg * .1) * 1.1 + X.p.leg * .22;
      c.beginPath(); c.moveTo(-tw * .95, y0); c.quadraticCurveTo(-tw * 1.3, -12, -tw * 1.85 + sw, -1.5); c.lineTo(tw * 1.85 + sw, -1.5); c.quadraticCurveTo(tw * 1.3, -12, tw * .95, y0); c.closePath(); fillOut(c, vg(c, y0, -1.5, m(sh(P.main, .2)), m(sh(P.main, -.2))), 1.5);
      poly(c, [[-tw * .3, y0 + 1], [tw * .3, y0 + 1], [tw * .55 + sw * .8, -1.5], [-tw * .55 + sw * .8, -1.5]]); c.fillStyle = m(P.sub); c.fill();
      c.fillStyle = m(P.accent); poly(c, [[-tw * 1.85 + sw, -4.6], [tw * 1.85 + sw, -4.6], [tw * 1.87 + sw, -1.5], [-tw * 1.87 + sw, -1.5]]); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = m(P.accent); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-tw * .75, y0 + .5); c.lineTo(tw * .05, y0 + 8); c.lineTo(tw * .75, y0 + .5); c.stroke();
      rr(c, -tw * .95, y1 + 1.5, tw * 1.9, 3.4, 1.4); fillOut(c, m(P.accent), 1.1); gem(X, 0, y1 + 3.2, 2, rc || '#ff4a6a');
    } else {
      const heavy = b === 'heavy', hw = heavy ? tw * 1.12 : b === 'light' ? tw * .86 : tw;
      if (b === 'armor' || heavy) for (const s of [-1, 1]) { poly(c, [[s * hw * .1, y1 - 1], [s * hw * .95, y1 - 1], [s * hw * 1.08, y1 + 6.5], [s * hw * .3, y1 + 7.5]]); fillOut(c, m(P.sub), 1.2) }
      else for (const s of [-1, 1]) { poly(c, [[s * hw * .1, y1 - 1], [s * hw * .9, y1 - 1], [s * hw * 1.3, y1 + 6], [s * hw * .4, y1 + 7]]); fillOut(c, m(sh(P.main, -.15)), 1.2) }
      rr(c, -hw, y0, hw * 2, y1 - y0, 3.6); fillOut(c, vg(c, y0, y1, m(sh(P.main, .22)), m(sh(P.main, -.2))), 1.5);
      if (b === 'armor') { c.strokeStyle = al(P.sub, .55); c.lineWidth = .9; for (let j = 0; j < 3; j++) for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * hw * .38 + (j % 2) * hw * .19, y0 + 3.5 + j * 3.2, hw * .19, .1, PI - .1); c.stroke() } }
      if (b === 'heavy') { poly(c, [[-hw * .78, y0 + .5], [hw * .78, y0 + .5], [hw * .6, y0 + 8.6], [-hw * .6, y0 + 8.6]]); fillOut(c, vg(c, y0, y0 + 9, m(sh(P.metal, .35)), m(sh(P.metal, -.25))), 1.3); c.fillStyle = m(P.accent); c.beginPath(); c.arc(0, y0 + 4.4, 1.8, 0, TAU); c.fill() }
      if (b === 'light') { poly(c, [[-hw, y0], [-hw + 4.6, y0], [hw, y1 - 3], [hw - 4.4, y1 - .6]]); fillOut(c, m(P.accent), 1.1) }
      c.strokeStyle = m(P.accent); c.lineWidth = 1.5; c.beginPath(); c.moveTo(-hw * .55, y0 + .6); c.lineTo(0, y0 + 4.6); c.lineTo(hw * .55, y0 + .6); c.stroke();
      rr(c, -hw, y1 - 3.4, hw * 2, 3.8, 1.5); fillOut(c, m(P.accent), 1.2); gem(X, 0, y1 - 1.5, 2.2, rc || (heavy ? '#d83a3a' : '#ff4a6a'));
    }
    if (ea && ea.r >= 1 && X.q > 0) { c.strokeStyle = al(rc, .5 + .15 * ea.r); c.lineWidth = 1; c.beginPath(); c.moveTo(-tw * .9, y0 + 1); c.lineTo(-tw * .9, y1 - 4); c.moveTo(tw * .9, y0 + 1); c.lineTo(tw * .9, y1 - 4); c.stroke() }
    if (ea && ea.r >= 3 && X.q > 0) { const g = c.createRadialGradient(0, -16, 2, 0, -16, 17); g.addColorStop(0, al(rc, .0)); g.addColorStop(1, al(rc, .22 + .08 * M.sin(X.t * 4))); c.fillStyle = g; c.fillRect(-18, -34, 36, 36) }
  }
  function shoulders(X, tw) {
    const c = X.c, P = X.pal, k = X.d.shoulder, ea = X.eq && X.eq.a, rc = ea && ea.r >= 1 ? RAR[ea.r] : P.accent;
    if (k === 'pauldron' || k === 'spike') for (const s of [-1, 1]) { const x = s * (tw + 1.8), r = 5.2 + (ea && ea.r >= 2 ? 1 : 0); c.beginPath(); c.arc(x, -21.5, r, PI, TAU); c.lineTo(x + r, -19.5); c.lineTo(x - r, -19.5); c.closePath(); fillOut(c, vg(c, -27, -19, X.m(sh(rc, .3)), X.m(sh(rc, -.25))), 1.4);
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x - r * .3, -24.4, r * .35, 1, -.4, 0, TAU); c.fill();
      if (k === 'spike') { poly(c, [[x - 2.2, -26], [x + 2.2, -26], [x + s * 1.4, -34]]); fillOut(c, X.m(P.metal), 1.1) } }
    if (k === 'sash') ribbon(X, tw * .3, -22, 17, 4.6, 2.6, 2.4, P.accent, 5);
  }
  function arm(X, sx, sy, ang, L, sleeve, cuff) {
    const c = X.c, hx = sx + M.cos(ang) * L, hy = sy + M.sin(ang) * L;
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 6.2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = X.m(sleeve); c.lineWidth = 4.1; c.stroke();
    if (cuff) { c.strokeStyle = X.m(cuff); c.lineWidth = 4.2; c.beginPath(); c.moveTo(sx + M.cos(ang) * (L - 2.2), sy + M.sin(ang) * (L - 2.2)); c.lineTo(hx, hy); c.stroke() }
    c.lineCap = 'butt'; return { x: hx, y: hy };
  }
  function hand(X, h, ring) { const c = X.c; c.beginPath(); c.arc(h.x, h.y, 2.9, 0, TAU); fillOut(c, X.m(X.pal.skin), 1.2); if (ring && X.q > 0) { c.fillStyle = al('#ffffff', .6 + .4 * M.sin(X.t * 7)); c.beginPath(); c.arc(h.x + 1.5, h.y - 1.5, 1.1, 0, TAU); c.fill() } }

  /* ---------- vũ khí (Q版: dày, bóng, viền đậm; phẩm chất trang bị đổi màu + toả sáng) ---------- */
  function wcol(X) { const w = X.eq && X.eq.w; return w ? { rc: RAR[w.r], r: w.r } : { rc: null, r: 0 } }
  function glow(X, x0, x1, w, col, a) { const c = X.c; c.strokeStyle = al(col, a); c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x1, 0); c.stroke(); c.lineCap = 'butt' }
  function metalGrad(X, h) { return vg(X.c, -h, h, X.m('#ffffff'), X.m(sh(X.pal.metal, -.4)), X.m(X.pal.metal)) }
  function curveBlade(X, L, w) { const c = X.c; c.beginPath(); c.moveTo(2, -w); c.quadraticCurveTo(L * .6, -w * 1.5, L, -w * .2); c.quadraticCurveTo(L * .6, w * .8, 2, w); c.closePath(); fillOut(c, metalGrad(X, w * 1.5), 1.2); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = .8; c.beginPath(); c.moveTo(5, -w * .3); c.quadraticCurveTo(L * .6, -w * .8, L - 3, -w * .2); c.stroke() }
  const WEAPON = {
    sword(X, H, a, p) { const c = X.c, P = X.pal, L = WPL.sword + p.ext, W = wcol(X); c.save(); c.translate(H.x, H.y); c.rotate(a);
      if (W.r >= 1 || X.d.glow > .05) glow(X, 4, L, 7, W.rc || P.accent, .22 + .1 * W.r + X.d.glow * .2);
      poly(c, [[3, -2.7], [L - 6, -2.5], [L + 2, 0], [L - 6, 2.5], [3, 2.7]]); fillOut(c, metalGrad(X, 3), 1.3);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = .8; c.beginPath(); c.moveTo(6, -.5); c.lineTo(L - 5, -.5); c.stroke(); if (W.rc) { c.strokeStyle = al(W.rc, .9); c.lineWidth = 1; c.beginPath(); c.moveTo(6, 2); c.lineTo(L - 5, 1.9); c.stroke() }
      rr(c, .5, -5.4, 3.2, 10.8, 1.5); fillOut(c, X.m(P.accent), 1.1); c.fillStyle = X.m(sh(P.sub, -.2)); c.fillRect(-6, -1.7, 6.6, 3.4); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(-6, -1.7, 6.6, 3.4); gem(X, -7.4, 0, 2.3, W.rc || '#ff4a6a'); c.restore();
      if (W.r >= 3 && X.q > 0) sparks(X, H.x + M.cos(a) * L, H.y + M.sin(a) * L); return { x: H.x + M.cos(a) * L, y: H.y + M.sin(a) * L } },
    glaive(X, H, a, p) { const c = X.c, P = X.pal, L = WPL.glaive + p.ext, W = wcol(X); c.save(); c.translate(H.x, H.y); c.rotate(a);
      c.strokeStyle = INK; c.lineWidth = 4.4; c.beginPath(); c.moveTo(-12, 0); c.lineTo(L - 6, 0); c.stroke(); c.strokeStyle = X.m('#7a4a26'); c.lineWidth = 2.6; c.stroke();
      if (W.r >= 1 || X.d.glow > .05) glow(X, L - 20, L + 6, 9, W.rc || P.accent, .22 + .1 * W.r + X.d.glow * .2);
      c.beginPath(); c.moveTo(L - 22, -1.5); c.quadraticCurveTo(L - 12, -17, L + 6, -12); c.quadraticCurveTo(L + 14, -6, L + 9, 2); c.quadraticCurveTo(L, -4, L - 8, 3); c.lineTo(L - 22, 3); c.closePath(); fillOut(c, metalGrad(X, 10), 1.3);
      c.strokeStyle = al(W.rc || '#ffffff', .9); c.lineWidth = 1; c.beginPath(); c.moveTo(L - 18, -2); c.quadraticCurveTo(L - 10, -13, L + 5, -10); c.stroke();
      c.fillStyle = X.m(P.main); c.beginPath(); c.ellipse(L - 23, 1, 3, 4.6, 0, 0, TAU); fillOut(c, X.m(P.main), 1.1); ribbon({ c, p: { leg: 0 }, t: X.t, m: X.m }, L - 24, 3, 12, 3, 2.4, 0, P.main, 6); c.restore();
      return { x: H.x + M.cos(a) * (L + 4), y: H.y + M.sin(a) * (L + 4) } },
    spear(X, H, a, p) { const c = X.c, P = X.pal, L = WPL.spear + p.ext, W = wcol(X); c.save(); c.translate(H.x, H.y); c.rotate(a);
      c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(-14, 0); c.lineTo(L - 10, 0); c.stroke(); c.strokeStyle = X.m('#8a5a30'); c.lineWidth = 2.2; c.stroke();
      if (W.r >= 1 || X.d.glow > .05) glow(X, L - 14, L + 5, 8, W.rc || P.accent, .24 + .1 * W.r + X.d.glow * .2);
      poly(c, [[L - 15, -3.4], [L - 4, -4.6], [L + 8, 0], [L - 4, 4.6], [L - 15, 3.4]]); fillOut(c, metalGrad(X, 4.5), 1.3); c.strokeStyle = al(W.rc || '#ffffff', .9); c.lineWidth = .9; c.beginPath(); c.moveTo(L - 13, 0); c.lineTo(L + 4, 0); c.stroke();
      for (let j = 0; j < 4; j++) { c.strokeStyle = INK; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(L - 15, 0); c.quadraticCurveTo(L - 22, 3 + j * 1.6 + M.sin(X.t * 8 + j) * 1.6, L - 28 - j * 2, 5 + j * 2.2 + M.sin(X.t * 8 + j * 1.3) * 2); c.stroke(); c.strokeStyle = X.m(j % 2 ? '#e0393e' : '#ff6a5a'); c.lineWidth = 1.7; c.stroke() } c.lineCap = 'butt'; c.restore();
      return { x: H.x + M.cos(a) * (L + 6), y: H.y + M.sin(a) * (L + 6) } },
    bow(X, H, a, p) { const c = X.c, P = X.pal, W = wcol(X), st = X.state === 'attack' ? p.ext : 0; c.save(); c.translate(H.x + 2, H.y); c.rotate(a);
      c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.arc(-4, 0, 15, -1.1, 1.1); c.stroke(); c.strokeStyle = X.m(W.rc ? sh(W.rc, -.1) : '#9a6a36'); c.lineWidth = 2.8; c.stroke();
      const ty = M.sin(1.1) * 15, tx = M.cos(1.1) * 15 - 4, pull = st * 9; c.fillStyle = X.m(P.accent); for (const s of [-1, 1]) { c.beginPath(); c.arc(tx, s * ty, 1.8, 0, TAU); c.fill() }
      c.strokeStyle = al('#fff6dc', .95); c.lineWidth = 1; c.beginPath(); c.moveTo(tx, -ty); c.lineTo(-4 - pull, 0); c.lineTo(tx, ty); c.stroke();
      if (st > .02) { c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(-4 - pull, 0); c.lineTo(20, 0); c.stroke(); c.strokeStyle = X.m('#e8e0c8'); c.lineWidth = 1.4; c.stroke(); poly(c, [[20, -2.6], [26, 0], [20, 2.6]]); fillOut(c, X.m(W.rc || '#ffffff'), 1) } c.lineCap = 'butt'; c.restore();
      return { x: H.x + M.cos(a) * 22, y: H.y + M.sin(a) * 22 } },
    banner(X, H, a, p) { const c = X.c, P = X.pal, L = WPL.banner + p.ext, f = M.sin(X.t * 5) * 2.5, W = wcol(X); c.save(); c.translate(H.x, H.y); c.rotate(a);
      c.strokeStyle = INK; c.lineWidth = 4.2; c.beginPath(); c.moveTo(-10, 0); c.lineTo(L, 0); c.stroke(); c.strokeStyle = X.m(W.rc ? sh(W.rc, -.2) : '#6a4426'); c.lineWidth = 2.4; c.stroke();
      c.beginPath(); c.moveTo(L - 3, -1); c.quadraticCurveTo(L - 12, -9 - f, L - 24, -9 + f); c.lineTo(L - 22, 9 + f); c.quadraticCurveTo(L - 12, 8 - f, L - 3, 2); c.closePath(); fillOut(c, vg(c, -9, 9, X.m(sh(P.accent, .15)), X.m(sh(P.accent, -.2))), 1.3);
      gem(X, L - 13, 0, 3, W.rc || P.main); poly(c, [[L, -2.6], [L + 5, 0], [L, 2.6]]); fillOut(c, X.m(P.metal), 1); c.restore(); return { x: H.x + M.cos(a) * (L + 4), y: H.y + M.sin(a) * (L + 4) } },
    shield(X, H, a, p) { const c = X.c, P = X.pal, W = wcol(X); c.save(); c.translate(H.x + 3 + p.ox * .2, H.y - 1);
      if (W.r >= 1) { c.fillStyle = al(W.rc, .2 + .06 * W.r); c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill() }
      c.beginPath(); c.arc(0, 0, 12, 0, TAU); fillOut(c, vg(c, -12, 12, X.m(sh(P.accent, .35)), X.m(sh(P.accent, -.3))), 1.8); c.beginPath(); c.arc(0, 0, 8.6, 0, TAU); fillOut(c, vg(c, -9, 9, X.m(sh(P.main, .25)), X.m(sh(P.main, -.2))), 1.3);
      c.strokeStyle = X.m(W.rc || P.accent); c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 5, -2.2, 1.6); c.arc(2, 1.4, 2.6, 1.6, 4.4); c.stroke(); c.beginPath(); c.arc(0, 0, 2.4, 0, TAU); fillOut(c, X.m(P.metal), 1);
      c.fillStyle = X.m(P.metal); for (let i = 0; i < 8; i++) { const q = i * TAU / 8; c.beginPath(); c.arc(M.cos(q) * 10.3, M.sin(q) * 10.3, .9, 0, TAU); c.fill() } c.restore(); return { x: H.x + 14 + p.ox * .2, y: H.y - 1 } },
    twin(X, H, a, p) { const c = X.c, P = X.pal, W = wcol(X); let tip = { x: H.x, y: H.y }; for (let i = 0; i < 2; i++) { const ang = i ? (X.state === 'attack' ? p.w2 : a - .5 + 1.2) : a, hx0 = H.x - i * 3, hy0 = H.y + i * 2; c.save(); c.translate(hx0, hy0); c.rotate(ang);
      if (W.r >= 1 || X.d.glow > .05) glow(X, 3, WPL.twin + 2, 6, W.rc || P.accent, .24 + .1 * W.r + X.d.glow * .2);
      curveBlade(X, WPL.twin + 2, 2.4); c.fillStyle = X.m(P.accent); rr(c, -1, -4.2, 3, 8.4, 1.2); fillOut(c, X.m(P.accent), 1); c.fillStyle = X.m(sh(P.sub, -.2)); c.fillRect(-5, -1.6, 5, 3.2); c.strokeStyle = INK; c.lineWidth = .9; c.strokeRect(-5, -1.6, 5, 3.2); c.restore(); if (!i) tip = { x: hx0 + M.cos(ang) * (WPL.twin + 2), y: hy0 + M.sin(ang) * (WPL.twin + 2) } } return tip }
  };
  function sparks(X, x, y) { const c = X.c; for (let i = 0; i < 3; i++) { const u = (X.t * 1.4 + i * .33) % 1; c.fillStyle = al('#ffe9a0', 1 - u); c.beginPath(); c.arc(x + M.sin(i * 7 + X.t * 3) * 5, y - u * 10, 1.4 * (1 - u) + .4, 0, TAU); c.fill() } }

  /* ---------- cung đeo lưng (trang bị ô "Cung") ---------- */
  function backBow(X, tw) { const e = X.eq && X.eq.b; if (!e || X.d.weapon === 'bow') return; const c = X.c; c.save(); c.translate(-tw * .55, -17); c.rotate(.5); c.strokeStyle = INK; c.lineWidth = 4.2; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, 12, -1.1, 1.1); c.stroke(); c.strokeStyle = X.m(sh(RAR[e.r], -.15)); c.lineWidth = 2.2; c.stroke(); c.restore() }

  /* ---------- thân người: ghép tất cả ---------- */
  function body(X) {
    const c = X.c, d = X.d, p = X.p, P = X.pal, W = clamp(d.width, .85, 1.32), tw = 6.3 * M.pow(W, .75), sp = specOf(X), r = 12 * (sp.big || 1), hx = 0, hy = -33 + (sp.big ? 1 : 0) - p.bob * .15;
    const long = d.body === 'robe';
    (BK[d.back] || BK.none)(X, tw); backBow(X, tw);
    hairBack(X, sp, hx, hy, r);
    legsAndBoots(X, tw, long); torso(X, tw);
    /* tay không cầm vũ khí */
    const castUp = p.cast || 0, offA = lerp(2.05 + M.sin(X.t * 2.4) * .06 - p.leg * .05, -1.25, M.min(1, castUp * 1.3)), ng = X.eq && X.eq.n, cuffCol = ng ? RAR[ng.r] : P.accent;
    const oh = arm(X, -tw - .6, -20.5, X.d.weapon === 'shield' ? 1.6 : offA, 7.4, P.main, cuffCol); hand(X, oh, false);
    if (castUp > .15 && X.q > 0) { const g = c.createRadialGradient(oh.x, oh.y - 3, 0, oh.x, oh.y - 3, 9); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.35, al(d.aura.color, .8)); g.addColorStop(1, al(d.aura.color, 0)); c.fillStyle = g; c.globalAlpha *= castUp; c.fillRect(oh.x - 10, oh.y - 13, 20, 20); c.globalAlpha /= castUp }
    shoulders(X, tw);
    face(X, sp, hx, hy, r) /* đã vẽ nền mặt */;
    bangs(X, sp, hx, hy, r, FR[sp.style] || FR.short);
    (HG[d.head] || HG.round)(X, hx, hy, r);
    const eh = X.eq && X.eq.h; if (eh) { const gc = RAR[eh.r]; if (d.head !== 'tiered' && d.head !== 'topknot') gem(X, hx, hy - r * .46, 2 + eh.r * .25, gc); if (eh.r >= 2 && X.q > 0) { c.fillStyle = al(gc, .35 + .2 * M.sin(X.t * 5)); c.beginPath(); c.arc(hx, hy - r * .46, 5, 0, TAU); c.fill() } }
    /* tay cầm vũ khí */
    const S = { x: tw * .6 + 1.5, y: -20.5 }, am = X.d.weapon === 'bow' ? .9 : .45, aa = lerp(.9, p.wa, am), ah = arm(X, S.x, S.y, aa, 7.6, P.main, cuffCol);
    const tip = WEAPON[d.weapon](X, ah, p.wa, p); hand(X, ah, !!(X.eq && X.eq.r));
    return { S, tip };
  }

  /* ---------- hiệu ứng nhân vật: lên cấp / học võ công / nâng cảnh giới ---------- */
  const ea = t => 1 - (1 - t) * (1 - t) * (1 - t);
  function ring(c, rad, a, w, col) { c.save(); c.translate(0, 1); c.scale(1, .36); c.strokeStyle = al(col, clamp(a, 0, 1)); c.lineWidth = w; c.beginPath(); c.arc(0, 0, rad, 0, TAU); c.stroke(); c.restore() }
  function star(c, x, y, s, col, a) { c.fillStyle = al(col, clamp(a, 0, 1)); c.beginPath(); for (let i = 0; i < 8; i++) { const q = i * PI / 4, l = i % 2 ? s * .35 : s; c.lineTo(x + M.cos(q) * l, y + M.sin(q) * l) } c.closePath(); c.fill() }
  function burst(c, kind, u, pal, q, t, auraCol) {
    u = clamp(u, 0, 1); if (u <= 0 || u >= 1) return; const gold = '#ffd34a', ac = auraCol || pal.accent, n = q === 0 ? 5 : q === 1 ? 8 : 12; c.save();
    if (kind === 'lvl') {
      const w = 12 + 8 * ea(u), g = c.createLinearGradient(0, -80, 0, 0); g.addColorStop(0, al(gold, 0)); g.addColorStop(.7, al('#fff2b0', .5 * (1 - u))); g.addColorStop(1, al('#ffffff', .8 * (1 - u)));
      c.fillStyle = g; c.beginPath(); c.moveTo(-w * .5, -80 - u * 10); c.lineTo(w * .5, -80 - u * 10); c.lineTo(w * 1.1, 0); c.lineTo(-w * 1.1, 0); c.fill();
      for (let i = 0; i < 2; i++) ring(c, 8 + ea(clamp(u * 1.3 - i * .18, 0, 1)) * 40, 1 - clamp(u * 1.3 - i * .18, 0, 1), 4 * (1 - u) + 1, i ? '#ffffff' : gold);
      for (let i = 0; i < n; i++) { const k = (u * 1.2 + i / n) % 1; star(c, M.sin(i * 2.7) * 20, -4 - k * 60, 3 + (i % 3), i % 2 ? '#ffffff' : gold, 1 - k) }
      for (let i = 0; i < 3; i++) { const k = clamp(u * 1.4 - i * .16, 0, 1), y = -14 - k * 46; c.strokeStyle = al(gold, (1 - k) * .95); c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-6, y + 5); c.lineTo(0, y); c.lineTo(6, y + 5); c.stroke() }
    } else if (kind === 'skl') {
      ring(c, 6 + ea(u) * 34, 1 - u * .6, 3.2, ac); ring(c, 4 + ea(u) * 24, 1 - u * .6, 1.6, '#ffffff');
      for (let i = 0; i < n; i++) { const a = i * TAU / n + u * 6, rad = (1 - ea(clamp(u * 1.25, 0, 1))) * 36 + 3, x = M.cos(a) * rad, y = -18 + M.sin(a) * rad * .62; c.save(); c.translate(x, y); c.rotate(a * 2); c.fillStyle = al(i % 2 ? ac : '#ffffff', .95 * (1 - u * .5)); c.fillRect(-2.4, -3.4, 4.8, 6.8); c.fillStyle = al(INK, .5); c.fillRect(-1.4, -1.8, 2.8, .8); c.fillRect(-1.4, .2, 2.8, .8); c.restore() }
      if (u > .55) { const f = (u - .55) / .45, g = c.createRadialGradient(0, -18, 1, 0, -18, 30 * f + 6); g.addColorStop(0, al('#ffffff', .9 * (1 - f))); g.addColorStop(1, al(ac, 0)); c.fillStyle = g; c.fillRect(-40, -58, 80, 80) }
    } else {
      const f = ea(u), fl = u < .3 ? u / .3 : 1 - (u - .3) / .7, g = c.createRadialGradient(0, -20, 4, 0, -20, 50 + 40 * f); g.addColorStop(0, al('#ffffff', .75 * fl)); g.addColorStop(.5, al(ac, .35 * fl)); g.addColorStop(1, al(ac, 0)); c.fillStyle = g; c.fillRect(-100, -120, 200, 160);
      for (let i = 0; i < 3; i++) { const k = clamp(u * 1.35 - i * .14, 0, 1); ring(c, 8 + ea(k) * 70, (1 - k) * .95, 6 * (1 - k) + 1, i === 1 ? pal.accent : i ? '#ffffff' : ac) }
      const rays = q === 0 ? 8 : 14; for (let i = 0; i < rays; i++) { const a = i * TAU / rays + u * .8, l = 20 + f * (i % 2 ? 50 : 72); c.strokeStyle = al(i % 2 ? '#ffffff' : pal.accent, (1 - u) * .85); c.lineWidth = i % 2 ? 1.6 : 3; c.beginPath(); c.moveTo(M.cos(a) * 14, -20 + M.sin(a) * 14); c.lineTo(M.cos(a) * l, -20 + M.sin(a) * l); c.stroke() }
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + u * 2.4, rad = 10 + f * 44, x = M.cos(a) * rad, y = -3 + M.sin(a) * rad * .3; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = al(i % 2 ? '#ffd0e8' : '#ffffff', (1 - u) * .95); c.beginPath(); c.ellipse(0, 0, 8 * (1 - u * .4), 3.2, 0, 0, TAU); c.fill(); c.restore() }
      c.strokeStyle = al(ac, (1 - u) * .8); c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 30; i++) { const k = i / 30, a = t * 4 + k * 11, x = M.cos(a) * (14 + k * 8) * (1 - u * .3), y = 4 - k * 76 * f + M.sin(a) * 3; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke();
      for (let i = 0; i < n; i++) { const k = (u * 1.3 + i / n) % 1; star(c, M.sin(i * 4.1) * 30, -4 - k * 80, 3.4 + (i % 3), i % 2 ? '#ffffff' : pal.accent, 1 - k) }
    }
    c.restore();
  }

  window.DV_CHIBI = { ok: () => true, body, burst, SPEC, RAR };
})();
