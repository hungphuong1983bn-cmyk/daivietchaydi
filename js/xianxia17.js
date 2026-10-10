/* Phase 17 · Phần 1 — Khí quyển bản đồ TIÊN HIỆP (DV_XIAN17)
 * Chỉ thêm lớp hình ảnh bọc lên DV_ENV (giống map15). Không đổi sát thương, AI, rơi đồ, dữ liệu lưu.
 * Gỡ: xoá thẻ <script src="js/xianxia17.js"> hoặc đặt DV_XIAN17.enabled = false → game về đúng Phase 16.
 * Thành phần: tông màu xanh đen/tím · sương nhiều lớp (mặt đất + trên không) · tia sáng thể tích ·
 *             trăng + dãy núi xa có đền cổ · lá đỏ rơi · hạt sáng vàng kim · vignette.
 * Chất lượng: Thấp = chỉ tông màu + vignette · Vừa = +sương +tia sáng +núi xa · Cao = +hạt +lá +sương lớp 2.
 */
(function () {
  'use strict';
  const ENV = window.DV_ENV;
  if (!ENV || !ENV.ok || !ENV.ok()) return;
  const M = Math, TAU = M.PI * 2;
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = M.max(1, w | 0); c.height = M.max(1, h | 0); return c };
  const rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = M.imul(s ^ s >>> 15, 1 | s); t = t + M.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };

  const S = { on: true, q: 2, pt: 0, cx0: 0, cy0: 0, leaves: [], motes: [], ridge: null, rk: '', vig: null, vk: '',
    stats: { layers: 0, parts: 0 } };

  /* ---------- bảng màu theo chủ đề (tk của DV_ENV) ---------- */
  const FOG = { shadow: '120,90,190', void: '130,90,200', river: '70,170,170', sea: '70,170,190', swamp: '90,170,140', cave: '80,140,190',
    mountain: '110,140,190', valley: '120,140,170', snow: '150,180,215', heaven: '190,170,120', volcano: '150,80,90', desert: '170,140,100' };
  const FOG_DEF = '90,130,170';
  const TOD = { night: 1, dusk: .8, dawn: .65, day: .38 };   // cường độ không khí huyền bí

  /* ---------- sương: tile liền mạch dựng bằng các đốm mờ ---------- */
  const FT = {};
  function fogTex(rgb) {
    if (FT[rgb]) return FT[rgb];
    const N = 256, c = mk(N, N), g = c.getContext('2d'), r = rng(rgb.length * 977 + rgb.charCodeAt(0) * 31);
    for (let i = 0; i < 30; i++) {
      const x = r() * N, y = r() * N, R = 40 + r() * 80, a = .08 + r() * .12;
      for (let ox = -N; ox <= N; ox += N) for (let oy = -N; oy <= N; oy += N) {
        const px = x + ox, py = y + oy; if (px + R < 0 || py + R < 0 || px - R > N || py - R > N) continue;
        const gr = g.createRadialGradient(px, py, 0, px, py, R);
        gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr; g.fillRect(px - R, py - R, R * 2, R * 2);
      }
    }
    return FT[rgb] = c;
  }
  function fogLayer(ctx, tex, W, H, ox, oy, sc, alpha, y0, y1) {
    const N = tex.width * sc; ox = -((ox % N) + N) % N; oy = -((oy % N) + N) % N;
    ctx.globalAlpha = alpha;
    for (let x = ox; x < W; x += N) for (let y = oy; y < H; y += N) { if (y + N < y0 || y > y1) continue; ctx.drawImage(tex, x, y, N, N) }
    ctx.globalAlpha = 1; S.stats.layers++;
  }

  /* ---------- núi xa + đền cổ (tile ngang, lặp liền mạch) ---------- */
  function buildRidge(W, H) {
    const TW = M.round(W * 1.7), TH = M.round(H * .2), c = mk(TW, TH), g = c.getContext('2d'), r = rng(1717);
    const layers = [{ c: '58,70,104', a: .55, base: .55, amp: .38 }, { c: '34,42,72', a: .75, base: .72, amp: .28 }, { c: '16,20,40', a: .9, base: .88, amp: .18 }];
    layers.forEach((L, li) => {
      const ph = [r() * TAU, r() * TAU, r() * TAU], k1 = 2 + li, k2 = 5 + li * 2, k3 = 11 + li * 3;
      g.fillStyle = `rgba(${L.c},${L.a})`; g.beginPath(); g.moveTo(0, TH);
      for (let x = 0; x <= TW; x += 4) {
        const u = x / TW * TAU, v = M.sin(u * k1 + ph[0]) * .55 + M.sin(u * k2 + ph[1]) * .3 + M.sin(u * k3 + ph[2]) * .15;
        const y = TH * (L.base - L.amp * M.max(0, v) * (li === 0 ? 1.15 : 1));
        g.lineTo(x, y);
      }
      g.lineTo(TW, TH); g.closePath(); g.fill();
    });
    // đền cổ nhỏ trên đỉnh dãy giữa (chỉ một cái / tile)
    const tx = TW * .62, ty = TH * .46; g.fillStyle = 'rgba(12,16,34,.95)';
    g.fillRect(tx - 14, ty, 28, 14);
    for (let i = 0; i < 3; i++) { const w = 38 - i * 9, y = ty - i * 9; g.beginPath(); g.moveTo(tx - w, y + 2); g.lineTo(tx, y - 7); g.lineTo(tx + w, y + 2); g.lineTo(tx + w - 5, y + 5); g.lineTo(tx - w + 5, y + 5); g.closePath(); g.fill() }
    g.fillStyle = 'rgba(255,190,90,.9)'; g.fillRect(tx - 3, ty + 4, 6, 7);          // cửa sổ có đèn
    // mờ dần lên phía trên
    g.globalCompositeOperation = 'destination-in';
    const m = g.createLinearGradient(0, 0, 0, TH); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.35, 'rgba(0,0,0,.85)'); m.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = m; g.fillRect(0, 0, TW, TH);
    return c;
  }

  /* ---------- hạt: lá đỏ + hạt sáng vàng kim ---------- */
  function seedParts(W, H) {
    const r = Math.random, nl = S.q >= 2 ? 22 : S.q === 1 ? 10 : 0, nm = S.q >= 2 ? 30 : S.q === 1 ? 12 : 0;
    S.leaves.length = 0; S.motes.length = 0;
    for (let i = 0; i < nl; i++) S.leaves.push({ x: r() * W, y: r() * H, z: .5 + r() * .8, s: 3 + r() * 4, a: r() * TAU, v: 14 + r() * 22, w: r() * TAU, red: r() < .7 });
    for (let i = 0; i < nm; i++) S.motes.push({ x: r() * W, y: r() * H, z: .4 + r() * .9, s: 1 + r() * 2.2, w: r() * TAU, v: 6 + r() * 14 });
  }

  /* ---------- gradient dựng sẵn (tạo 1 lần / cỡ màn hình, không tạo lại mỗi khung) ---------- */
  const GC = { moon: null, mc: null, shaft: null, sc: null, sh: 0 };
  function moonGr(ctx) {
    if (GC.mc !== ctx) { const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 110); g.addColorStop(0, 'rgba(235,240,255,.9)'); g.addColorStop(.12, 'rgba(200,215,255,.45)'); g.addColorStop(1, 'rgba(120,150,255,0)'); GC.moon = g; GC.mc = ctx }
    return GC.moon;
  }
  function shaftGr(ctx, H) {
    if (GC.sc !== ctx || GC.sh !== H) { const g = ctx.createLinearGradient(0, 0, -H * .5, H * .85); g.addColorStop(0, 'rgba(255,225,160,1)'); g.addColorStop(1, 'rgba(255,225,160,0)'); GC.shaft = g; GC.sc = ctx; GC.sh = H }
    return GC.shaft;
  }

  /* ---------- vẽ ---------- */
  function vignette(ctx, W, H) {
    const k = W + 'x' + H; if (S.vk !== k) {
      S.vk = k; const c = mk(W, H), g = c.getContext('2d'), gr = g.createRadialGradient(W / 2, H * .52, M.min(W, H) * .32, W / 2, H * .52, M.hypot(W, H) * .6);
      gr.addColorStop(0, 'rgba(2,4,14,0)'); gr.addColorStop(1, 'rgba(2,4,14,.78)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); S.vig = c;
    }
    ctx.drawImage(S.vig, 0, 0);
  }

  // dưới thực thể: sương sát đất + tông màu
  const oGround = ENV.drawGround;
  ENV.drawGround = function (ctx, cx, cy, W, H) {
    oGround.apply(this, arguments);
    const E = ENV.state(); if (!E || !S.on || !DV_XIAN17.enabled) return;
    try {
      S.stats.layers = 0; const tod = TOD[E.todK] || .6, rgb = FOG[E.tk] || FOG_DEF, t = RM ? 0 : E.t;
      ctx.save();
      // tông xanh đen/tím (multiply: tối và lạnh hơn, giữ chi tiết)
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .3 + .42 * tod; ctx.fillStyle = 'rgb(105,118,185)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (S.q >= 1) {
        const tx = fogTex(rgb);
        fogLayer(ctx, tx, W, H, cx * .9 + t * 7, cy * .9 + t * 3, 2.2, .3 * (.5 + .5 * tod), H * .35, H);   // sương thấp, trôi chậm
        if (S.q >= 2) fogLayer(ctx, tx, W, H, cx * 1.1 - t * 11 + 90, cy * 1.1 + 60, 1.5, .18 * (.5 + .5 * tod), 0, H);
      }
      ctx.restore();
    } catch (e) { S.on = false; console.warn('DV_XIAN17 off:', e) }
  };

  // trên thực thể: núi xa, trăng, tia sáng, hạt, vignette
  const oAfter = ENV.drawAfter;
  ENV.drawAfter = function (ctx, cx, cy, W, H) {
    const E = ENV.state();
    if (E && S.on && DV_XIAN17.enabled) try {
      const t = E.t, dt = M.min(.05, M.max(0, t - S.pt)); S.pt = t;
      const G = S.G, px = G ? G.p.x : cx, py = G ? G.p.y : cy, dx = px - S.cx0, dy = py - S.cy0; S.cx0 = px; S.cy0 = py;
      const tod = TOD[E.todK] || .6, night = E.todK === 'night' || E.todK === 'dusk';
      ctx.save();
      if (S.q >= 1) {
        // núi xa (parallax rất chậm theo camera)
        const rk = W + 'x' + H; if (S.rk !== rk) { S.rk = rk; S.ridge = buildRidge(W, H); seedParts(W, H) }
        const R = S.ridge, off = -(((cx * .04) % R.width) + R.width) % R.width;
        ctx.globalAlpha = .35 + .25 * tod; for (let x = off; x < W; x += R.width) ctx.drawImage(R, x, 0); ctx.globalAlpha = 1;
        // trăng
        if (night) {
          const mx = W * .86, my = H * .075, k = (90 + 20 * M.sin(t * .5)) / 110, mg = moonGr(ctx);
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55 * tod; ctx.translate(mx, my); ctx.scale(k, k); ctx.fillStyle = mg; ctx.fillRect(-110, -110, 220, 220); ctx.scale(1 / k, 1 / k); ctx.translate(-mx, -my); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        }
        // tia sáng thể tích chéo từ góc trên-phải
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = shaftGr(ctx, H);
        for (let i = 0; i < 4; i++) {
          const sx = W * (.45 + i * .17) + (RM ? 0 : M.sin(t * .22 + i * 1.7) * 26), w = 46 + i * 18, a = (.035 + .02 * M.sin(t * .35 + i * 2.1)) * (.5 + .5 * tod);
          ctx.globalAlpha = M.min(1, a * 1.6); ctx.translate(sx, 0); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w - H * .5, H * .85); ctx.lineTo(-H * .5, H * .85); ctx.closePath(); ctx.fill(); ctx.translate(-sx, 0);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        // sương cao phía hậu cảnh
        const rgb = FOG[E.tk] || FOG_DEF; fogLayer(ctx, fogTex(rgb), W, H, cx * .3 + t * 4, cy * .3, 3, .2 * (.5 + .5 * tod), 0, H * .4);
      }
      // hạt: lá đỏ + hạt sáng vàng
      S.stats.parts = 0;
      if (S.q >= 2 || (S.q === 1 && S.leaves.length)) {
        const mv = RM ? 0 : 1, B = ctx.getTransform ? ctx.getTransform() : null; let lastCol = '';
        for (const p of S.leaves) {
          p.x += (-dx * p.z + M.sin(t * .8 + p.w) * 10 * dt + 18 * dt * p.z) * mv; p.y += (-dy * p.z + p.v * dt) * mv; p.a += dt * (1 + p.z);
          if (p.y > H + 20) { p.y = -20; p.x = M.random() * W } if (p.x > W + 20) p.x = -20; if (p.x < -20) p.x = W + 20; if (p.y < -30) p.y = H + 10;
          const cs = M.cos(p.a), sn = M.sin(p.a), sy = .5 + .5 * M.abs(M.sin(p.a * 1.3)), la = cs, lb = sn, lc = -sn * sy, ld = cs * sy;
          if (B) ctx.setTransform(B.a * la + B.c * lb, B.b * la + B.d * lb, B.a * lc + B.c * ld, B.b * lc + B.d * ld, B.a * p.x + B.c * p.y + B.e, B.b * p.x + B.d * p.y + B.f);
          else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, sy) }
          const col = p.red ? 'rgba(190,48,40,.85)' : 'rgba(210,150,50,.8)'; if (col !== lastCol) { ctx.fillStyle = col; lastCol = col }
          ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .5, 0, 0, TAU); ctx.fill(); if (!B) { ctx.restore(); lastCol = '' } S.stats.parts++;
        }
        if (B) ctx.setTransform(B);
        ctx.globalCompositeOperation = 'lighter';
        for (const p of S.motes) {
          p.x += (-dx * p.z + M.sin(t * .6 + p.w) * 6 * dt) * mv; p.y += (-dy * p.z - p.v * dt) * mv;
          if (p.y < -10) { p.y = H + 10; p.x = M.random() * W } if (p.y > H + 30) p.y = -10; if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10;
          const tw = .5 + .5 * M.sin(t * 2.2 + p.w * 3); ctx.globalAlpha = (.35 + .5 * tw) * .8; ctx.fillStyle = 'rgb(255,215,120)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); S.stats.parts++;
        }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      vignette(ctx, W, H);
      ctx.restore();
    } catch (e) { S.on = false; console.warn('DV_XIAN17 off:', e) }
    oAfter.apply(this, arguments);
  };

  window.DV_XIAN17 = {
    ok: () => S.on, enabled: true, stats: S.stats, state: () => S,
    setQuality(q) { S.q = M.max(0, M.min(2, q | 0)); S.rk = ''; },
    begin(G, st, q) { S.on = true; S.G = G; S.q = q == null ? 2 : M.max(0, M.min(2, q | 0)); S.rk = ''; S.pt = 0; S.cx0 = G && G.p ? G.p.x : 0; S.cy0 = G && G.p ? G.p.y : 0 },
    end() { S.G = null; S.leaves.length = 0; S.motes.length = 0 }
  };
})();
