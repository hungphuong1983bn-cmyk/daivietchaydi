/* Phase 15 — Nâng cấp đồ hoạ MÀN CHƠI (DV_MAP15)
 * Chỉ thêm lớp hình ảnh bọc lên DV_ENV (Phase 6). Không đổi sát thương, AI, điều kiện qua màn, dữ liệu lưu.
 * Xoá thẻ <script src="js/map15.js"> là game về đúng giao diện Phase 6–14.
 * Thành phần: nền liền mạch (macro-texture) · khói mù chiều sâu · tiền cảnh thị sai · hạt môi trường ·
 *             đèn lồng/lửa phát sáng · hào quang Boss dưới đất · banner tên màn · hiệu ứng hoàn thành ải · HUD.
 */
(function () {
  'use strict';
  const ENV = window.DV_ENV;
  if (!ENV || !ENV.ok || !ENV.ok()) return;
  const M = Math, TAU = M.PI * 2;
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hsh = (a, b) => { let h = (a * 73856093) ^ (b * 19349663); h = M.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0 };
  const rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = M.imul(s ^ s >>> 15, 1 | s); t = t + M.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = M.max(1, w | 0); c.height = M.max(1, h | 0); return c };
  const hsla = (h, s, l, a) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a == null ? 1 : a})`;

  const S = { on: true, G: null, st: null, q: 2, area: -1, macro: null, fg: null, fgKind: '', part: [], pt: 0, ct: 0, cx0: 0, cy0: 0,
    stats: { fg: 0, part: 0, aura: 0, glow: 0 }, timers: [] };

  /* ---------- sprite sáng mờ (glow) dựng sẵn ---------- */
  const GL = {};
  function glow(rgb) {
    if (GL[rgb]) return GL[rgb];
    const c = mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.35, `rgba(${rgb},.45)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return GL[rgb] = c;
  }

  /* ---------- bảng theo chủ đề (15 chủ đề của Phase 6) ---------- */
  const FGK = { forest: 'leaf', plain: 'leaf', river: 'leaf', swamp: 'leaf', valley: 'rock', mountain: 'rock', volcano: 'rock', shadow: 'rock',
    cave: 'crys', void: 'crys', snow: 'snow', heaven: 'cloud', sea: 'cloud', desert: 'cloud', citadel: 'eave' };
  const RIM = { valley: '200,170,120', mountain: '170,200,230', volcano: '255,120,50', shadow: '150,110,200' };
  const CRY = { cave: '110,190,255', void: '200,120,255' };
  const AMB = { plain: 'leaf', forest: 'leaf', river: 'leaf', citadel: 'leaf', swamp: 'fly', shadow: 'fly', cave: 'fly', void: 'fly', heaven: 'fly', snow: 'fly',
    volcano: 'fly', desert: 'dust', mountain: 'dust', valley: 'dust', sea: 'dust' };
  const FLC = { swamp: '200,255,110', shadow: '190,140,255', cave: '130,200,255', void: '215,140,255', heaven: '255,240,180', snow: '230,246,255', volcano: '255,140,60' };
  const AURA = { shadow: '190,110,255', void: '200,110,255', snow: '140,210,255', mountain: '150,200,240', heaven: '255,225,140', volcano: '255,120,40',
    swamp: '150,230,90', sea: '90,190,255', river: '90,190,255', desert: '255,190,80', cave: '120,190,255', citadel: '255,170,70' };
  const TODL = { night: 1, dusk: .8, dawn: .6, day: .32 };

  /* ---------- sprite tiền cảnh (lớn dần từ đáy sprite lên) ---------- */
  function leaf(g, x, y, a, len, c1, c2) {
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c1; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .3, len, 0); g.quadraticCurveTo(len * .5, len * .3, 0, 0); g.fill();
    g.strokeStyle = c2; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * .92, 0); g.stroke(); g.restore();
  }
  function paintLeaf(r, E, snow) {
    const c = mk(260, 200), g = c.getContext('2d'), H = snow ? 150 : E.hue, base = hsla(H, 34, 8), mid = hsla(H, 38, 14), rim = hsla(H + 8, 42, snow ? 22 : 27);
    for (let b = 0; b < 6; b++) {
      let a = -M.PI / 2 + (r() - .5) * 1.7, x = 130 + (r() - .5) * 80, y = 200; const len = 90 + r() * 80, seg = 9; g.strokeStyle = base; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); const pts = [];
      for (let s = 1; s <= seg; s++) { a += (r() - .5) * .35; x += M.cos(a) * len / seg; y += M.sin(a) * len / seg; g.lineTo(x, y); pts.push([x, y, a]) }
      g.stroke();
      for (let s = 1; s < pts.length; s++) for (const sd of [-1, 1]) { const p = pts[s]; leaf(g, p[0], p[1], p[2] + sd * (.85 + r() * .5), 14 + r() * 16, r() < .5 ? base : mid, rim) }
    }
    if (snow) { g.fillStyle = 'rgba(236,246,255,.88)'; for (let i = 0; i < 46; i++) { g.beginPath(); g.ellipse(70 + r() * 120, 30 + r() * 150, 3 + r() * 6, 2 + r() * 3, r() * 3, 0, TAU); g.fill() } }
    return c;
  }
  function paintRock(r, E) {
    const c = mk(260, 200), g = c.getContext('2d'), rim = RIM[E.tk] || '180,170,160', gr = g.createLinearGradient(0, 40, 0, 200);
    gr.addColorStop(0, hsla(E.hue, 18, 17)); gr.addColorStop(1, hsla(E.hue, 22, 6)); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 200); let x = 0;
    while (x < 260) { x += 22 + r() * 34; g.lineTo(M.min(260, x), 200 - (30 + r() * 120) * M.sin(M.min(1, x / 260) * M.PI)) } g.lineTo(260, 200); g.closePath(); g.fill();
    g.strokeStyle = `rgba(${rim},.55)`; g.lineWidth = 2; g.stroke();
    g.globalCompositeOperation = 'lighter'; g.drawImage(glow(rim), 20, 80, 220, 140); g.globalAlpha = 1; return c;
  }
  function paintCrys(r, E) {
    const c = mk(260, 200), g = c.getContext('2d'), col = CRY[E.tk] || '120,190,255';
    for (let i = 0; i < 7; i++) { const x = 20 + i * 34 + (r() - .5) * 20, h = 60 + r() * 120, w = 12 + r() * 14; g.fillStyle = hsla(E.hue, 30, 8 + r() * 6); g.beginPath(); g.moveTo(x - w, 200); g.lineTo(x - 2, 200 - h); g.lineTo(x + 3, 200 - h); g.lineTo(x + w, 200); g.fill();
      g.fillStyle = `rgba(${col},.7)`; g.beginPath(); g.moveTo(x - 3, 200 - h + 22); g.lineTo(x, 200 - h); g.lineTo(x + 3, 200 - h + 22); g.fill();
      g.globalCompositeOperation = 'lighter'; g.drawImage(glow(col), x - 22, 200 - h - 20, 44, 44); g.globalCompositeOperation = 'source-over' } return c;
  }
  function paintCloud(r, E) {
    const c = mk(260, 200), g = c.getContext('2d'), col = E.tk === 'desert' ? '226,196,140' : (E.fogc || '230,240,250');
    for (let i = 0; i < 16; i++) { const x = 20 + r() * 220, y = 200 - r() * 90, s = 40 + r() * 50, gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, `rgba(${col},.5)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2) } return c;
  }
  function paintEave(r, E) {
    const c = mk(260, 200), g = c.getContext('2d'); g.fillStyle = '#1b1210'; g.beginPath(); g.moveTo(0, 200); g.lineTo(0, 120); g.quadraticCurveTo(110, 150, 190, 118); g.quadraticCurveTo(232, 96, 250, 52); g.quadraticCurveTo(236, 118, 260, 144); g.lineTo(260, 200); g.fill();
    g.strokeStyle = 'rgba(214,170,80,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 122); g.quadraticCurveTo(110, 152, 190, 120); g.quadraticCurveTo(232, 98, 250, 54); g.stroke();
    for (let i = 0; i < 2; i++) { const x = 60 + i * 80, y = 150 + 6 * i; g.strokeStyle = '#3a2418'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 132 + 10 * i); g.lineTo(x, y); g.stroke();
      g.fillStyle = '#c8302a'; g.beginPath(); g.ellipse(x, y + 12, 11, 14, 0, 0, TAU); g.fill(); g.fillStyle = '#e8b84a'; g.fillRect(x - 5, y - 1, 10, 3); g.fillRect(x - 5, y + 25, 10, 3);
      g.globalCompositeOperation = 'lighter'; g.drawImage(glow('255,150,60'), x - 34, y - 22, 68, 68); g.globalCompositeOperation = 'source-over' } return c;
  }
  const PAINT = { leaf: (r, E) => paintLeaf(r, E, false), snow: (r, E) => paintLeaf(r, E, true), rock: paintRock, crys: paintCrys, cloud: paintCloud, eave: paintEave };

  /* ---------- nền liền mạch: hai lớp mottle bake sẵn, cuộn theo thế giới ---------- */
  function bakeMacro(E) {
    const th = E.T.ground, out = [];
    for (let k = 0; k < 2; k++) {
      const N = k ? 640 : 448, c = mk(N, N), g = c.getContext('2d'), r = rng(E.seed + 4001 + k * 31);
      for (let i = 0; i < (k ? 14 : 18); i++) {
        const x = r() * N, y = r() * N, rad = (k ? 120 : 80) + r() * 110, dark = r() < .5, col = dark ? hsla(E.hue, th.s + 4, th.l - 16, .20) : hsla(E.hue + 6, th.s, th.l + 14, .15);
        for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
          const px = x + ox, py = y + oy; if (px < -rad || py < -rad || px > N + rad || py > N + rad) continue;
          const gr = g.createRadialGradient(px, py, 0, px, py, rad); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
        }
      }
      out.push(c);
    }
    return out;
  }

  /* ---------- hạt môi trường (pool cố định, không tạo mới mỗi khung) ---------- */
  const NP = [0, 14, 28];
  function partInit(E) {
    S.part.length = 0; const n = NP[S.q] || 0, kind = AMB[E.tk] || 'dust';
    for (let i = 0; i < n; i++) S.part.push({ k: kind, x: M.random(), y: M.random(), z: .4 + M.random() * .9, ph: M.random() * TAU, s: 3 + M.random() * 4, c: M.random() });
  }
  function partDraw(ctx, W, H, t, dt, E, dx, dy) {
    const kind = AMB[E.tk] || 'dust', wind = RM ? 0 : (.35 + .25 * M.sin(t * .27)) * 26, fl = FLC[E.tk] || '255,240,180', night = TODL[E.todK] || .5; let n = 0;
    ctx.save();
    for (const p of S.part) {
      p.x += (wind * p.z * dt - dx * p.z * .55) / W; p.y += ((kind === 'leaf' ? 18 + 14 * p.z : kind === 'dust' ? 3 : kind === 'fly' && E.tk === 'volcano' ? -14 : M.sin(t * .6 + p.ph) * 4) * dt - dy * p.z * .55) / H;
      if (p.x > 1.05) p.x -= 1.1; else if (p.x < -.05) p.x += 1.1; if (p.y > 1.05) p.y -= 1.1; else if (p.y < -.05) p.y += 1.1;
      const x = p.x * W + (RM ? 0 : M.sin(t * .8 + p.ph) * 10 * p.z), y = p.y * H; n++;
      if (kind === 'leaf') { ctx.globalAlpha = .75; ctx.fillStyle = p.c < .5 ? '#7f9f48' : p.c < .8 ? '#b8a840' : '#5f8a4a'; ctx.save(); ctx.translate(x, y); ctx.rotate(t * (.6 + p.z) + p.ph); ctx.beginPath(); ctx.ellipse(0, 0, p.s * p.z * 1.4, p.s * p.z * .5, 0, 0, TAU); ctx.fill(); ctx.restore() }
      else if (kind === 'fly') { const a = (.35 + .65 * M.max(0, M.sin(t * 1.7 + p.ph))) * (.45 + night * .5); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; const r = p.s * p.z * 3.2; ctx.drawImage(glow(fl), x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over' }
      else { ctx.globalAlpha = .16 * p.z; ctx.fillStyle = 'rgb(' + (E.fogc || '220,210,190') + ')'; ctx.fillRect(x, y, p.s * 7 * p.z, 1.3) }
    }
    ctx.restore(); S.stats.part = n;
  }

  /* ---------- tiền cảnh thị sai (chỉ ở rìa màn hình, không che giữa) ---------- */
  function fgInit(E) {
    S.fgKind = FGK[E.tk] || 'leaf'; S.fg = []; for (let v = 0; v < 3; v++) S.fg.push(PAINT[S.fgKind](rng(E.seed + 7001 + v * 53), E));
  }
  const FGMAX = [3, 5, 8];
  function fgDraw(ctx, W, H, t, E, px, py) {
    const K = 1.32, C = 230, pad = 150, lim = FGMAX[S.q] || 3, prob = S.fgKind === 'eave' ? 50 : S.fgKind === 'cloud' ? 60 : 85; let n = 0;
    const i0 = M.floor((px * K - W / 2 - pad) / C), i1 = M.floor((px * K + W / 2 + pad) / C), j0 = M.floor((py * K - H / 2 - pad) / C), j1 = M.floor((py * K + H / 2 + pad) / C);
    const alpha = S.fgKind === 'cloud' ? .5 : .9;
    for (let i = i0; i <= i1 && n < lim; i++) for (let j = j0; j <= j1 && n < lim; j++) {
      const h = hsh(i + E.c * 31, j - E.c * 17); if (h % 100 >= prob) continue;
      const sx = i * C + (h >>> 8) % C - px * K + W / 2, sy = j * C + (h >>> 16) % C - py * K + H / 2, dL = sx, dR = W - sx, dT = sy, dB = H - sy, d = M.min(dL, dR, dT, dB);
      if (d < -34 || d > 36) continue;
      const rot = d === dB ? 0 : d === dT ? M.PI : d === dL ? M.PI / 2 : -M.PI / 2, sc = (S.fgKind === 'cloud' ? 1.2 : .55) + (h % 50) / 150, sw = RM ? 0 : M.sin(t * .8 + h % 7) * .025;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot + sw); ctx.scale((h & 1 ? -1 : 1) * sc, sc); ctx.globalAlpha = alpha; ctx.drawImage(S.fg[h % 3], -130, -196); ctx.restore(); n++;
    }
    S.stats.fg = n;
  }

  /* ---------- wrapper DV_ENV ---------- */
  const oGround = ENV.drawGround, oAfter = ENV.drawAfter, oProp = ENV.drawProp, oSetup = ENV.setup;
  function ensure(E) {
    if (S.area === E.c && S.macro && S.dpr === E.dpr) return;
    S.area = E.c; S.dpr = E.dpr; S.macro = bakeMacro(E); fgInit(E); partInit(E);
  }
  ENV.setup = function (c, h) { const ok = oSetup.apply(this, arguments); S.area = -1; S.macro = null; S.fg = null; S.part.length = 0; return ok };

  ENV.drawGround = function (ctx, cx, cy, W, H) {
    oGround.apply(this, arguments);
    const E = ENV.state(); if (!E || !S.on) return; try {
      ensure(E);
      // 1) lớp mottle liền mạch: xoá ranh giới ô vuông giữa các tile
      const q = S.q;
      for (let k = 0; k < (q ? 2 : 1); k++) {
        const c = S.macro[k], N = c.width, ox = -((cx * (k ? .96 : 1)) % N + N) % N, oy = -((cy * (k ? .96 : 1)) % N + N) % N;
        ctx.globalAlpha = k ? .85 : 1;
        for (let x = ox; x < W; x += N) for (let y = oy; y < H; y += N) ctx.drawImage(c, x, y);
      }
      ctx.globalAlpha = 1;
      // 2) hào quang Boss dưới đất (nằm dưới quái vật vì drawGround vẽ trước)
      S.stats.aura = 0; const G = S.G, b = G && G.boss; if (b && !b.dead && b.hp > 0) {
        const col = AURA[E.tk] || '255,90,60', t = E.t, r = (b.r || 40) * 2.6, bx = b.x - cx, by = b.y - cy + (b.r || 40) * .35, pu = 1 + .06 * M.sin(t * 3), hurt = 1 - b.hp / M.max(1, b.mhp);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 + .25 * hurt; ctx.drawImage(glow(col), bx - r * 1.5 * pu, by - r * .95 * pu, r * 3 * pu, r * 1.9 * pu);
        ctx.globalAlpha = .55; ctx.strokeStyle = `rgba(${col},.85)`; ctx.lineWidth = 2; ctx.setLineDash([12, 16]); ctx.lineDashOffset = -t * 34;
        ctx.beginPath(); ctx.ellipse(bx, by, r * pu, r * .6 * pu, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; ctx.globalAlpha = .35;
        ctx.beginPath(); ctx.ellipse(bx, by, r * .72, r * .43, 0, 0, TAU); ctx.stroke();
        if (q) for (let i = 0; i < 8; i++) { const a = t * .5 + i * TAU / 8; ctx.globalAlpha = .6; ctx.fillStyle = `rgba(${col},.9)`; ctx.fillRect(bx + M.cos(a) * r * pu - 2, by + M.sin(a) * r * .6 * pu - 2, 4, 4) }
        ctx.restore(); S.stats.aura = 1;
      }
    } catch (e) { S.on = false; console.warn('DV_MAP15 off:', e) }
  };

  // vật thể: đèn lồng đung đưa + quầng sáng lửa/tinh thể (additive, bỏ ở mức Thấp)
  ENV.drawProp = function (ctx, o, sx, sy) {
    oProp.apply(this, arguments);
    const E = S.on && S.q && ENV.state(); if (!E) return; const k = ENV.kinds[o.k - 1]; if (!k) return;
    const s = o.sc || 1, t = E.t, fa = o.arena && E.arena ? E.arena.fade : 1, nl = TODL[E.todK] || .5; let rgb = '', rr = 0, yy = 0, a = 0;
    if (k === 'brazier') { rgb = '255,140,50'; rr = 130; yy = 90; a = (.5 + .12 * M.sin(t * 11 + o.x)) * (.6 + nl * .6) }
    else if (k === 'crystal') { rgb = '170,120,255'; rr = 90; yy = 60; a = .3 + .12 * M.sin(t * 2 + o.x) }
    else if (k === 'icecrys') { rgb = '150,215,255'; rr = 80; yy = 55; a = .25 + .1 * M.sin(t * 2 + o.x) }
    else if (k === 'lavarock') { rgb = '255,110,40'; rr = 90; yy = 30; a = .3 + .1 * M.sin(t * 3 + o.x) }
    else if (k === 'totem') { rgb = '255,200,90'; rr = 40; yy = 58; a = .22 + .1 * M.sin(t * 2.4 + o.x) }
    else if (k === 'banner') {   // đèn lồng đỏ treo ở đầu cột cờ
      const sw = RM ? 0 : M.sin(t * 1.6 + o.x * .03) * 5, lx = sx - 15 * s + sw, ly = sy - 80 * s; ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx - 2 * s, sy - 88 * s); ctx.lineTo(lx, ly - 8 * s); ctx.stroke();
      ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.ellipse(lx, ly, 6 * s, 8 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b84a'; ctx.fillRect(lx - 3 * s, ly - 9 * s, 6 * s, 2 * s); ctx.fillRect(lx - 3 * s, ly + 7 * s, 6 * s, 2 * s);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fa * (.35 + nl * .45); ctx.drawImage(glow('255,140,60'), lx - 44 * s, ly - 44 * s, 88 * s, 88 * s); ctx.restore(); S.stats.glow++; return;
    } else return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * fa; ctx.drawImage(glow(rgb), sx - rr * s, sy - yy * s - rr * s * .7, rr * 2 * s, rr * 1.4 * s); ctx.restore(); S.stats.glow++;
  };

  ENV.drawAfter = function (ctx, cx, cy, W, H) {
    const E = ENV.state(), G = S.G; S.stats.glow = 0;
    if (E && S.on && G) try {
      const t = E.t, dt = M.min(.05, M.max(0, t - S.pt)); S.pt = t; const px = G.p.x, py = G.p.y, dx = px - S.cx0, dy = py - S.cy0; S.cx0 = px; S.cy0 = py;
      ensure(E);
      // khói mù chiều sâu: hậu cảnh (đỉnh màn) nhạt mờ, tiền cảnh (đáy) đậm — tạo cảm giác tầng lớp
      const fc = E.fogc || '200,212,228', hk = fc + '|' + W + '|' + H;
      if (S.hk !== hk) { S.hk = hk; const g1 = ctx.createLinearGradient(0, 0, 0, H * .42); g1.addColorStop(0, `rgba(${fc},.17)`); g1.addColorStop(1, `rgba(${fc},0)`); const g2 = ctx.createLinearGradient(0, H * .72, 0, H); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.18)'); S.g1 = g1; S.g2 = g2 }
      ctx.fillStyle = S.g1; ctx.fillRect(0, 0, W, H * .42); ctx.fillStyle = S.g2; ctx.fillRect(0, H * .72, W, H * .28);
      if (S.q && S.part.length) partDraw(ctx, W, H, t, dt, E, RM ? 0 : dx, RM ? 0 : dy);
    } catch (e) { S.on = false; console.warn('DV_MAP15 off:', e) }
    oAfter.apply(this, arguments);
    if (E && S.on && G && S.fg) try { fgDraw(ctx, W, H, E.t, E, G.p.x, G.p.y); ctx.globalAlpha = 1 } catch (e) { S.on = false }
  };

  /* ---------- DOM: banner tên màn · hoàn thành ải · HUD ---------- */
  const css = `
#m15i{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 72px);z-index:4;pointer-events:none;display:flex;justify-content:center;text-align:center}
#m15i .f{position:fixed;inset:0;background:#02030a;animation:m15f 1.1s ease-out forwards}
#m15i .t{position:relative;padding:12px 22px;max-width:92%;animation:m15t 3.4s ease forwards;opacity:0}
#m15i .t::before{content:"";position:absolute;inset:-6px -30px;z-index:-1;background:radial-gradient(ellipse at center,rgba(4,6,16,.72) 0,rgba(4,6,16,.5) 45%,rgba(4,6,16,0) 75%)}
#m15i small{display:block;font-size:12px;letter-spacing:5px;color:#e8b84a;text-shadow:0 1px 4px #000}
#m15i h1{margin:6px 0 4px;font:900 26px/1.15 Georgia,serif;color:#fff3cf;text-shadow:0 0 18px var(--m15c,#e08a1e),0 2px 0 #3a2305;letter-spacing:1px}
#m15i p{margin:0;font-size:12px;color:#d8d2bd;text-shadow:0 1px 3px #000}
#m15i i{display:block;height:2px;margin:8px auto;width:0;background:linear-gradient(90deg,transparent,#e8b84a,transparent);animation:m15l 1.4s .4s ease-out forwards}
@keyframes m15f{0%{opacity:1}100%{opacity:0}}
@keyframes m15l{to{width:min(78vw,340px)}}
@keyframes m15t{0%{opacity:0;transform:translateY(10px) scale(.96);letter-spacing:6px}18%{opacity:1;transform:none}78%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
#m15w{position:absolute;inset:0;z-index:9;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:hidden;animation:m15wo 2.6s ease forwards}
#m15w .r{position:absolute;width:150vmax;height:150vmax;left:50%;top:50%;margin:-75vmax 0 0 -75vmax;background:repeating-conic-gradient(from 0deg,rgba(255,226,140,.28) 0 6deg,rgba(255,226,140,0) 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 55%);mask:radial-gradient(circle,#000 0,transparent 55%);animation:m15r 2.6s linear forwards}
#m15w .b{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,rgba(255,236,170,.75),rgba(255,200,90,0) 55%);animation:m15b 1.2s ease-out forwards}
#m15w h1{position:relative;margin:0;font:900 40px/1.1 Georgia,serif;color:#ffe9a8;text-shadow:0 0 22px #f0a020,0 3px 0 #4a2a05;letter-spacing:3px;animation:m15h 2.6s ease forwards}
#m15w p{position:relative;margin:6px 0 0;font-size:13px;color:#fff3cf;text-shadow:0 1px 4px #000}
#m15w s{position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:50%;background:#ffe9a8;box-shadow:0 0 8px #ffc850;animation:m15s 2.2s ease-out forwards}
@keyframes m15wo{0%,70%{opacity:1}100%{opacity:0}}
@keyframes m15r{from{transform:rotate(0)}to{transform:rotate(40deg)}}
@keyframes m15b{0%{opacity:0}30%{opacity:1}100%{opacity:.35}}
@keyframes m15h{0%{opacity:0;transform:scale(.7)}22%{opacity:1;transform:scale(1.06)}34%{transform:scale(1)}100%{opacity:1}}
@keyframes m15s{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--x),var(--y))}}
#hud .stat{background:linear-gradient(270deg,rgba(8,10,26,.6),rgba(8,10,26,0));padding:3px 6px 3px 24px;border-radius:12px 0 0 12px}
#hud .av{background:radial-gradient(circle at 35% 30%,#2c3d7a,#111a3a);box-shadow:0 0 0 2px rgba(0,0,0,.5),0 0 12px rgba(232,184,74,.55),inset 0 0 8px rgba(0,0,0,.6)}
#hud .bar{box-shadow:inset 0 1px 2px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.45)}
#hud .bar i{position:relative}
#hud .bar i::after{content:"";position:absolute;left:0;right:0;top:0;height:42%;background:linear-gradient(rgba(255,255,255,.34),rgba(255,255,255,0))}
#hud #bossw{padding:4px 16px 7px;background:linear-gradient(rgba(54,10,12,.78),rgba(14,5,7,.78));border:1px solid #8a3a2a;border-radius:12px;box-shadow:0 0 14px rgba(255,70,40,.25);color:#ffe0b0;font-weight:800;letter-spacing:1px;text-shadow:0 1px 3px #000}
#hud #bossw::before{content:"✦ BOSS ✦";display:block;font-size:9px;letter-spacing:4px;color:#ff8a6a}`;
  function dom() { if (document.getElementById('m15css')) return; const s = document.createElement('style'); s.id = 'm15css'; s.textContent = css; document.head.appendChild(s) }
  const TYPE = { n: 'ẢI THƯỜNG', e: 'ẢI TINH ANH', t: 'KHO BÁU', b: 'ẢI BOSS', v: 'SỰ KIỆN' };
  function label(G, st) {
    const D = window.DV_DATA, E = ENV.state(), A = E && E.A, c = G.map | 0; let top = '', main = A ? A[8] : '', sub = '';
    const ch = D && D.getChapter ? D.getChapter(c) : null;
    if (ch && ch.chapterName) { top = 'CHƯƠNG ' + (c + 1) + ' · ' + ch.chapterName.toUpperCase(); }
    if (G.wb) { top = 'BOSS THẾ GIỚI'; main = main || 'Hắc Long' } else if (st && st.x === 'rift') { top = 'BÍ CẢNH'; if (st.f) sub = 'Tầng ' + st.f } else if (st && st.x) top = String(st.x).toUpperCase();
    else if (st && st.i) { sub = 'Màn ' + (c + 1) + '-' + String(st.i).padStart(2, '0') + ' · ' + (TYPE[st.t] || '') }
    const env = ENV.info ? ENV.info(c).split(' · ').slice(0, 3).join(' · ') : ''; return { top, main: main || (ch && ch.place) || '', sub: [sub, env].filter(Boolean).join(' · ') };
  }
  function banner(G, st) {
    const hud = document.getElementById('hud'); if (!hud) return; const old = document.getElementById('m15i'); if (old) old.remove();
    const L = label(G, st), E = ENV.state(), d = document.createElement('div'); d.id = 'm15i';
    const col = { night: '120,150,255', dusk: '255,140,60', dawn: '255,180,120', day: '255,210,120' }[E && E.todK] || '224,138,30'; d.style.setProperty('--m15c', `rgb(${col})`);
    const esc = (s) => String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    d.innerHTML = `<div class="f"></div><div class="t"><small>${esc(L.top)}</small><h1>${esc(L.main)}</h1><i></i><p>${esc(L.sub)}</p></div>`; hud.appendChild(d);
    S.timers.push(setTimeout(() => d.remove(), 3600));
  }
  function winFx(G) {
    const host = (document.getElementById('end') || {}).parentNode; if (!host) return; const old = document.getElementById('m15w'); if (old) old.remove();
    const L = label(G, S.st), d = document.createElement('div'); d.id = 'm15w';
    let sp = ''; for (let i = 0; i < (S.q ? 26 : 12); i++) { const a = Math.random() * TAU, r = 90 + Math.random() * 200; sp += `<s style="--x:${(Math.cos(a) * r) | 0}px;--y:${(Math.sin(a) * r) | 0}px;animation-delay:${(Math.random() * .5).toFixed(2)}s"></s>` }
    d.innerHTML = `<div class="b"></div><div class="r"></div>${sp}<div style="position:relative;text-align:center"><h1>HOÀN THÀNH ẢI</h1><p>${(L.sub || L.main).replace(/[&<>]/g, '')}</p></div>`;
    host.appendChild(d); S.timers.push(setTimeout(() => d.remove(), 2800));
  }

  /* ---------- API ---------- */
  window.DV_MAP15 = {
    ok: () => S.on, stats: S.stats, state: () => S, set enabled(v) { S.on = !!v }, get enabled() { return S.on },
    begin(G, st, q) {
      S.timers.forEach(clearTimeout); S.timers.length = 0; S.G = G; S.st = st; S.q = q == null ? 2 : M.max(0, M.min(2, q | 0)); S.area = -1; S.pt = 0; S.cx0 = G.p.x; S.cy0 = G.p.y; S.on = true;
      dom(); try { banner(G, st) } catch (e) { }
    },
    end(G, win) {   // dọn tài nguyên khi rời màn
      if (win && !(G && G.wb)) try { winFx(G) } catch (e) { }
      S.macro = null; S.fg = null; S.part.length = 0; S.area = -1; S.G = null;
    }
  };
  dom();
})();
