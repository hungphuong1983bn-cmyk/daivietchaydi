/* Phase 17 · Phần 2 — Hiệu ứng KỸ NĂNG tiên hiệp vàng kim (DV_XIAN17S)
 * Chỉ thêm lớp vẽ bọc lên DV_VFX (vfx.js). Không đổi sát thương, tầm đánh, hồi chiêu, năng lượng, rơi đồ, dữ liệu lưu.
 * Gỡ: xoá thẻ <script src="js/xianxia17_skill.js"> hoặc đặt DV_XIAN17S.enabled = false.
 * 3 bậc rõ ràng:
 *   THƯỜNG   — kỹ năng cơ bản: giữ nguyên hiệu ứng cũ (không thêm gì).
 *   MẠNH     — kỹ năng đã Tiến Hoá / nổ diện rộng: vòng vàng + hạt sáng + tia ngắn.
 *   TUYỆT KỸ — pháp trận xoay nhiều lớp + hoa sen vàng nở + tia sáng toả ra + đường kiếm xoáy + cánh sen bay.
 */
(function () {
  'use strict';
  const VF = window.DV_VFX;
  if (!VF || !VF.ok || !VF.ok()) return;
  const M = Math, TAU = M.PI * 2, TILT = .56;          // TILT: ép elip để ra cảm giác góc nhìn nghiêng từ trên xuống
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const S = { fx: [], petals: [], t: 0, stats: { ult: 0, strong: 0, petals: 0 } };
  const CAP = [3, 6, 10];                               // số hiệu ứng "mạnh" tối đa cùng lúc theo chất lượng
  const q = () => { const x = window.DV_XIAN17; return x && x.state ? x.state().q : 2 };
  const ease = (k) => 1 - (1 - k) * (1 - k) * (1 - k);

  /* ---------- hoa sen vàng ---------- */
  function lotus(c, x, y, r, open, a, rot) {
    // hai tầng cánh, nở dần theo open (0..1)
    c.save(); c.translate(x, y); c.scale(1, TILT + .12); c.rotate(rot || 0);
    for (let layer = 0; layer < 2; layer++) {
      const n = layer ? 8 : 10, rr = r * (layer ? .62 : 1), off = layer ? TAU / 16 : 0;
      for (let i = 0; i < n; i++) {
        const ang = i / n * TAU + off, L = rr * (.35 + .65 * open), W = rr * .22 * (.5 + .5 * open);
        c.save(); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * .45, -W * 1.6, L, 0); c.quadraticCurveTo(L * .45, W * 1.6, 0, 0); c.closePath();
        const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, `rgba(255,248,215,${a})`); g.addColorStop(.6, `rgba(255,205,90,${a * .9})`); g.addColorStop(1, `rgba(255,150,30,${a * .7})`);
        c.fillStyle = g; c.fill(); c.strokeStyle = `rgba(255,236,170,${a})`; c.lineWidth = 1.2; c.stroke(); c.restore();
      }
    }
    c.restore();
  }

  /* ---------- pháp trận ---------- */
  function circle(c, x, y, R, t, a, detail) {
    c.save(); c.translate(x, y); c.scale(1, TILT);
    c.strokeStyle = `rgba(255,215,110,${a})`; c.lineWidth = 3.2; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
    c.lineWidth = 1.4; c.strokeStyle = `rgba(255,236,170,${a * .85})`; c.beginPath(); c.arc(0, 0, R * .93, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, R * .66, 0, TAU); c.stroke();
    // vạch chữ phù xoay
    const nt = detail ? 72 : 36; c.lineWidth = 1.6;
    for (let i = 0; i < nt; i++) { const ang = i / nt * TAU + t * .35, big = i % 6 === 0, r0 = R * (big ? .86 : .89), r1 = R * .93; c.beginPath(); c.moveTo(M.cos(ang) * r0, M.sin(ang) * r0); c.lineTo(M.cos(ang) * r1, M.sin(ang) * r1); c.stroke() }
    // sao 6 cánh xoay ngược chiều
    c.strokeStyle = `rgba(255,205,90,${a * .9})`; c.lineWidth = 2;
    for (let k = 0; k < 2; k++) { c.beginPath(); for (let i = 0; i < 3; i++) { const ang = -t * .5 + k * M.PI / 3 + i * TAU / 3, px = M.cos(ang) * R * .66, py = M.sin(ang) * R * .66; i ? c.lineTo(px, py) : c.moveTo(px, py) } c.closePath(); c.stroke() }
    // chấm phù ở vòng giữa
    if (detail) { c.fillStyle = `rgba(255,240,190,${a})`; for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + t * .6; c.beginPath(); c.arc(M.cos(ang) * R * .8, M.sin(ang) * R * .8, 3.2, 0, TAU); c.fill() } }
    c.restore();
  }

  /* ---------- tạo hiệu ứng ---------- */
  function ult(x, y) {
    const Q = q(); S.fx.push({ k: 'ult', x, y, t: 0, T: Q === 0 ? 1.2 : 1.9, R: 310, seed: M.random() * 100 });
    if (Q >= 1 && !RM) for (let i = 0; i < (Q >= 2 ? 26 : 12); i++) petal(x, y);
  }
  function strong(x, y, R, big) {
    const Q = q(); let n = 0; for (const f of S.fx) if (f.k === 's') n++; if (n >= CAP[Q]) return;
    S.fx.push({ k: 's', x, y, t: 0, T: big ? .75 : .5, R: R * (big ? 1.25 : 1.1), big, seed: M.random() * 100 });
  }
  function petal(x, y) {
    if (S.petals.length > (q() >= 2 ? 90 : 40)) return; const a = M.random() * TAU, v = 80 + M.random() * 260;
    S.petals.push({ x, y, vx: M.cos(a) * v, vy: M.sin(a) * v * .6 - 60, z: 0, vz: 60 + M.random() * 120, r: M.random() * TAU, vr: (M.random() - .5) * 8, t: 0, T: 1.2 + M.random() * .9, s: 4 + M.random() * 4, pink: M.random() < .4 });
  }

  /* ---------- cập nhật ---------- */
  const oUpdate = VF.update;
  VF.update = function (dt, g, qq) {
    oUpdate.apply(this, arguments);
    if (g !== S.g) { S.g = g; S.fx.length = 0; S.petals.length = 0 }
    for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.T) S.fx.splice(i, 1) }
    for (let i = S.petals.length - 1; i >= 0; i--) { const p = S.petals[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.vy *= .985; p.vz -= 150 * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -.3 } p.r += p.vr * dt; if (p.t >= p.T) S.petals.splice(i, 1) }
    S.t += dt;
  };

  /* ---------- vẽ dưới thực thể: pháp trận + hoa sen ---------- */
  const oGround = VF.ground;
  VF.ground = function (c, cx, cy, W, H) {
    oGround.apply(this, arguments);
    if (!DV_XIAN17S.enabled || !S.fx.length) return;
    S.stats.ult = 0; S.stats.strong = 0;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const f of S.fx) {
      const x = f.x - cx, y = f.y - cy, k = f.t / f.T, ws = f.k === 'ult' ? M.min(1, W / 640) : 1;
      if (x < -f.R * 1.5 || y < -f.R * 1.5 || x > W + f.R * 1.5 || y > H + f.R * 1.5) continue;
      if (f.k === 'ult') {
        const grow = ease(M.min(1, k * 2.6)), fade = k < .72 ? 1 : 1 - (k - .72) / .28, R = f.R * ws * (.35 + .65 * grow), det = q() >= 1;
        // quầng sáng nền
        const g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(255,220,120,${.34 * fade})`); g.addColorStop(.7, `rgba(255,170,50,${.12 * fade})`); g.addColorStop(1, 'rgba(255,150,30,0)');
        c.save(); c.translate(x, y); c.scale(1, TILT); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill(); c.restore();
        circle(c, x, y, R, S.t + f.seed, fade, det);
        if (det) circle(c, x, y, R * .55, -S.t * 1.2 + f.seed, fade * .8, false);
        // hoa sen nở ở tâm
        lotus(c, x, y + 4, (86 + 24 * grow) * M.max(.8, ws), ease(M.min(1, k * 3.2)), fade, S.t * .12);
        // sóng năng lượng lan ra
        const wk = M.min(1, k * 1.7); c.strokeStyle = `rgba(255,236,170,${(1 - wk) * .9})`; c.lineWidth = 10 * (1 - wk) + 2;
        c.save(); c.translate(x, y); c.scale(1, TILT); c.beginPath(); c.arc(0, 0, f.R * ws * 1.15 * ease(wk), 0, TAU); c.stroke(); c.restore();
        S.stats.ult++;
      } else {
        const wk = ease(k), a = 1 - k, R = f.R * (.3 + .7 * wk);
        c.strokeStyle = `rgba(255,215,100,${a})`; c.lineWidth = (f.big ? 7 : 4) * a + 1.5;
        c.save(); c.translate(x, y); c.scale(1, TILT); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
        if (f.big && q() >= 1) { c.lineWidth = 1.5; c.strokeStyle = `rgba(255,240,190,${a * .8})`; c.beginPath(); c.arc(0, 0, R * .72, 0, TAU); c.stroke() } c.restore();
        if (f.big && q() >= 1) lotus(c, x, y, R * .42, wk, a * .9, f.seed);
        S.stats.strong++;
      }
    }
    c.restore();
  };

  /* ---------- vẽ trên thực thể: tia sáng + kiếm xoáy + cánh sen ---------- */
  const oAir = VF.air;
  VF.air = function (c, cx, cy, W, H) {
    oAir.apply(this, arguments);
    if (!DV_XIAN17S.enabled || !(S.fx.length || S.petals.length)) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const f of S.fx) {
      const x = f.x - cx, y = f.y - cy, k = f.t / f.T, ws = f.k === 'ult' ? M.min(1, W / 640) : 1;
      if (x < -f.R * 1.6 || y < -f.R * 1.6 || x > W + f.R * 1.6 || y > H + f.R * 1.6) continue;
      if (f.k === 'ult') {
        const Q = q(), n = Q >= 2 ? 28 : Q === 1 ? 16 : 8, burst = M.min(1, k * 3), fade = k < .6 ? 1 : M.max(0, 1 - (k - .6) / .4);
        // tia sáng lao ra ngoài từ tâm
        for (let i = 0; i < n; i++) {
          const ang = i / n * TAU + f.seed + (i % 2 ? .06 : -.06) * k, len = f.R * ws * (.4 + .9 * ((i * 37 % 10) / 10 + .3)) * ease(burst), r0 = 40 + f.R * ws * .22 * burst;
          const x0 = x + M.cos(ang) * r0, y0 = y + M.sin(ang) * r0 * TILT, x1 = x + M.cos(ang) * (r0 + len), y1 = y + M.sin(ang) * (r0 + len) * TILT;
          const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(255,245,200,${.9 * fade})`); g.addColorStop(1, 'rgba(255,170,40,0)');
          c.strokeStyle = g; c.lineWidth = i % 3 ? 2 : 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        }
        // đường kiếm xoáy quanh nhân vật (3 cung quét)
        if (Q >= 1 && k < .85) for (let j = 0; j < 3; j++) {
          const base = k * 11 + j * TAU / 3 + f.seed, Rr = f.R * ws * (.5 + .3 * j / 2) * ease(M.min(1, k * 3)), sw = 1.25 + j * .15;
          c.strokeStyle = `rgba(255,${230 - j * 25},${150 - j * 40},${.85 * (1 - k)})`; c.lineWidth = 6 - j * 1.3; c.beginPath();
          for (let s = 0; s <= 14; s++) { const ang = base - s / 14 * sw, px = x + M.cos(ang) * Rr, py = y + M.sin(ang) * Rr * TILT - 12; s ? c.lineTo(px, py) : c.moveTo(px, py) } c.stroke();
        }
        // loé sáng trung tâm
        const fl = M.max(0, 1 - k * 4); if (fl > 0) { const g = c.createRadialGradient(x, y - 10, 0, x, y - 10, 150); g.addColorStop(0, `rgba(255,250,220,${fl})`); g.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = g; c.fillRect(x - 150, y - 160, 300, 300) }
      } else if (f.big || q() >= 2) {
        // tia ngắn quanh vòng vàng của kỹ năng mạnh
        const n = f.big ? 10 : 6, a = 1 - k, R = f.R * (.3 + .7 * ease(k));
        c.strokeStyle = `rgba(255,230,150,${a})`; c.lineWidth = 2;
        for (let i = 0; i < n; i++) { const ang = i / n * TAU + f.seed, r0 = R * .8, r1 = R * (1 + .5 * ease(k)); c.beginPath(); c.moveTo(x + M.cos(ang) * r0, y + M.sin(ang) * r0 * TILT); c.lineTo(x + M.cos(ang) * r1, y + M.sin(ang) * r1 * TILT); c.stroke() }
      }
    }
    // cánh sen bay
    S.stats.petals = S.petals.length;
    const B = c.getTransform ? c.getTransform() : null; let lastCol = '';
    for (const p of S.petals) {
      const x = p.x - cx, y = p.y - cy - p.z, a = M.min(1, (p.T - p.t) * 1.6, p.t * 6 + .2), cs = M.cos(p.r), sn = M.sin(p.r), sy = .55 + .45 * M.abs(M.sin(p.r * 1.7));
      if (B) c.setTransform(B.a * cs + B.c * sn, B.b * cs + B.d * sn, -B.a * sn * sy + B.c * cs * sy, -B.b * sn * sy + B.d * cs * sy, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f);
      else { c.save(); c.translate(x, y); c.rotate(p.r); c.scale(1, sy) }
      c.fillStyle = p.pink ? `rgba(255,170,200,${a * .9})` : `rgba(255,222,130,${a})`;
      c.beginPath(); c.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); c.fill(); if (!B) c.restore();
    }
    if (B) c.setTransform(B);
    c.restore();
  };

  /* ---------- móc vào các sự kiện kỹ năng (không đổi logic gốc) ---------- */
  const oUlt = VF.ult, oBoom = VF.boom, oPalm = VF.palm, oBolt = VF.bolt, oCast = VF.cast;
  VF.ult = function (P) { oUlt.apply(this, arguments); if (DV_XIAN17S.enabled) try { ult(P.x, P.y + 6) } catch (e) { } };
  VF.boom = function (x, y, Rr) { oBoom.apply(this, arguments); if (DV_XIAN17S.enabled && Rr > 90) try { strong(x, y, Rr, Rr > 150) } catch (e) { } };
  VF.palm = function (x, y, Rr, ev) { oPalm.apply(this, arguments); if (DV_XIAN17S.enabled && ev) try { strong(x, y, Rr, true) } catch (e) { } };   // chỉ khi đã Tiến Hoá
  VF.bolt = function (x, y, Rr, ev) { oBolt.apply(this, arguments); if (DV_XIAN17S.enabled && ev) try { strong(x, y, Rr * 1.4, false) } catch (e) { } };
  VF.cast = function (kind, x, y, a, ev) { oCast.apply(this, arguments); if (DV_XIAN17S.enabled && ev) try { strong(x, y, 120, false) } catch (e) { } };
  const oReset = VF.reset; VF.reset = function () { S.fx.length = 0; S.petals.length = 0; return oReset.apply(this, arguments) };

  window.DV_XIAN17S = { ok: () => true, enabled: true, stats: S.stats, state: () => S, test: { ult: (x, y) => ult(x, y), strong: (x, y, R, b) => strong(x, y, R, b) } };
})();
