/* Phase 17 · Phần 3 — SỐ SÁT THƯƠNG nổi nhiều màu (DV_XIAN17D)
 * Chỉ thay cách VẼ chữ sát thương lên quái (chữ có f.k do hit() gắn). Không đổi công thức sát thương, tầm đánh, rơi đồ, dữ liệu lưu.
 * Chữ khác (LÊN CẤP, NÉ, +HP, cảnh báo Boss…) vẫn vẽ theo code cũ.
 * Gỡ: xoá thẻ <script src="js/xianxia17_dmg.js"> hoặc DV_XIAN17D.enabled=false (hit() vẫn chạy bình thường).
 *   THƯỜNG  — trắng viền tối (Boss: hồng nhạt)
 *   CHÍ MẠNG — vàng cam to, nảy lớn rồi co lại, viền nâu đỏ, hào quang vàng, dấu "!"
 *   KỸ NĂNG — màu theo võ công: Hàng Long vàng cam · Lôi Động tím · Phi Kiếm xanh băng · Tuyệt Kỹ vàng kim rất to
 */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2;
  const SK = { hang: { c: '#ffb347', o: '#4a2400', g: '255,170,60' }, loi: { c: '#d9a8ff', o: '#2c1050', g: '190,120,255' },
    phi: { c: '#8fe8ff', o: '#06303f', g: '110,220,255' }, ult: { c: '#ffe27a', o: '#4a2a00', g: '255,215,100' }, _: { c: '#a8ffd0', o: '#0b3a22', g: '120,255,190' } };
  const S = { glow: 0, stats: { n: 0, c: 0, s: 0 }, fr: -1 };
  const q = () => { const x = window.DV_XIAN17; return x && x.state ? x.state().q : 2 };

  const QUE = [];
  // vẽ sau lớp sương/vignette của DV_ENV.drawAfter để số không bị phủ mờ; không có DV_ENV thì vẽ ngay
  function draw(ctx, f, x, y) {
    if (!DV_XIAN17D.enabled || !f.k) return false;
    if (window.DV_ENV && DV_ENV.drawAfter && S.hooked) {
      const m = ctx.getTransform(); if (QUE.length > 80) return true;
      QUE.push({ f, sc: m.a, dx: m.a * x + m.c * y + m.e, dy: m.b * x + m.d * y + m.f }); return true;
    }
    return paint(ctx, f, x, y);
  }
  function flush(ctx) {
    if (!QUE.length) return; ctx.save();
    for (const o of QUE) { ctx.setTransform(o.sc, 0, 0, o.sc, o.dx, o.dy); try { paint(ctx, o.f, 0, 0) } catch (e) { } }
    ctx.restore(); QUE.length = 0;
  }
  function paint(ctx, f, x, y) {
    const txt = '-' + String(f.v).replace('!', ''), life = f.T - f.t, Q = q(), crit = f.k === 'c', skill = f.k === 's', ult = f.u === 'ult';
    let size = (f.s || 15), fill = '#fff', out = '#141420', gl = '', glowA = 0;
    if (skill) { const P = SK[f.u] || SK._; fill = P.c; out = P.o; gl = P.g; size *= ult ? 1.5 : 1.15; glowA = ult ? .9 : .45 }
    else if (f.b && !crit) { fill = '#ffb0a0'; out = '#3a0a0a' }
    if (crit) { size *= 1.2; fill = '#ffc83c'; out = '#4a1200'; gl = '255,150,30'; glowA = .9; const P = SK[f.u]; if (skill && P) { out = P.o; gl = P.g } }
    const pop = crit || ult ? 1 + M.max(0, .8 - life * 4.4) : 1 + M.max(0, .35 - life * 3);       // nảy to rồi co lại
    const a = M.min(1, f.t * 3), px = M.round(size * pop);
    ctx.save(); ctx.globalAlpha = a; ctx.font = '900 ' + px + 'px Georgia,"Times New Roman",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    // hào quang (chỉ chí mạng/tuyệt kỹ, giới hạn số lượng mỗi khung để không nặng)
    if (glowA && Q >= 1 && S.glow < (Q >= 2 ? 10 : 4)) { S.glow++; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * glowA * .55; const r = px * (txt.length * .42 + .8);
      const g = ctx.createRadialGradient(x, y - px * .35, 0, x, y - px * .35, r); g.addColorStop(0, `rgba(${gl},.8)`); g.addColorStop(1, `rgba(${gl},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - px * .35 - r, r * 2, r * 2); ctx.restore() }
    ctx.lineWidth = M.max(3, px * .2); ctx.strokeStyle = out; ctx.strokeText(txt, x, y);
    ctx.lineWidth = 1.2; ctx.strokeStyle = crit || skill ? 'rgba(255,240,190,.85)' : 'rgba(255,255,255,.4)'; ctx.fillStyle = fill; ctx.fillText(txt, x, y); ctx.strokeText(txt, x, y);
    if (crit) { const w = ctx.measureText(txt).width; ctx.font = '900 ' + M.round(px * .66) + 'px Georgia,serif'; ctx.lineWidth = 3; ctx.strokeStyle = out; const bx = x + w / 2 + px * .22, by = y - px * .12; ctx.strokeText('!', bx, by); ctx.fillStyle = '#fff2b0'; ctx.fillText('!', bx, by) }
    ctx.restore(); S.stats[crit ? 'c' : skill ? 's' : 'n']++; return true;
  }
  if (window.DV_ENV && DV_ENV.drawAfter) { const oA = DV_ENV.drawAfter; DV_ENV.drawAfter = function (ctx) { oA.apply(this, arguments); try { flush(ctx) } catch (e) { QUE.length = 0 } }; S.hooked = true }
  window.DV_XIAN17D = { ok: () => true, enabled: true, stats: S.stats, draw, frame() { S.glow = 0; QUE.length = 0 } };
})();
