/* Phase 9 — MONSTER ART  (window.DV_MART)
   Chỉ thay LỚP HÌNH ẢNH của quái. Chỉ số, AI, đòn đặc biệt, va chạm… vẫn do index.html điều khiển.
   Ngoại hình = CHỦNG TỘC theo chủ đề map (10) × VAI TRÒ quái (14) × BIẾN THỂ theo chương (màu + phụ kiện):
     plain Binh giặc · snow Tuyết quái · desert Bọ sa mạc · volcano Quỷ lửa · void Hư ảnh · heaven Thiên binh · river Thuỷ quái · valley Sơn tặc · forest Thú rừng · citadel Cấm quân giáp · shadow U hồn
     mountain Sơn quỷ · swamp Quỷ bùn · sea Hải quái · cave Thạch linh
   API: body(ctx,e,G,q) vẽ thân quái (ctx đã dịch về chân quái, đã nhân r/11) · onHit(e,G,crit,q) · onDie(e,G,q) · drawFx(ctx,G,cx,cy,q)
   Quái thường được "nướng" sẵn thành sprite (nhẹ cho 170 quái cùng lúc), Elite/Mini Boss/Boss vẽ trực tiếp với chi tiết cao.
   Thiếu file → index.html dùng hình quái cũ. */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2, PI = M.PI, INK = '#241326';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, ease = t => 1 - (1 - t) * (1 - t) * (1 - t);
  const hsl = (h, s, l) => 'hsl(' + (((h % 360) + 360) % 360 | 0) + ',' + (clamp(s, 0, 100) | 0) + '%,' + (clamp(l, 0, 100) | 0) + '%)';
  function toHsl(hex) { hex = hex.replace('#', ''); const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255, mx = M.max(r, g, b), mn = M.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60 } return [h, s * 100, l * 100] }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() }
  function poly(c, p) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++)c.lineTo(p[i][0], p[i][1]); c.closePath() }
  function fo(c, f, w) { c.fillStyle = f; c.fill(); c.lineWidth = w || 1.2; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke() }
  function ell(c, x, y, rx, ry, f, w) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); fo(c, f, w) }

  /* ---------- chủng tộc theo chủ đề map ---------- */
  const RACE = {
    plain: { shape: 'human', h: 28, s: 50, l: 68, acc: '#f0c24a', eye: '#ff4a3a', deb: 'spark' },
    river: { shape: 'amphi', h: 190, s: 58, l: 54, acc: '#a8f0ff', eye: '#ffe14a', deb: 'bubble' },
    valley: { shape: 'human', h: 24, s: 44, l: 62, acc: '#ff8a3a', eye: '#ffcf3a', deb: 'spark', hood: 1 },
    forest: { shape: 'beast', h: 32, s: 46, l: 42, acc: '#8be06a', eye: '#ffe34a', deb: 'leaf' },
    citadel: { shape: 'human', h: 350, s: 14, l: 80, acc: '#f0cc5a', eye: '#ff5a5a', deb: 'spark', helm: 1 },
    shadow: { shape: 'ghost', h: 270, s: 50, l: 40, acc: '#e0a0ff', eye: '#fff2a8', deb: 'smoke' },
    mountain: { shape: 'ogre', h: 262, s: 26, l: 50, acc: '#ffb35a', eye: '#ff6a3a', deb: 'rock' },
    swamp: { shape: 'blob', h: 88, s: 52, l: 44, acc: '#e8e85a', eye: '#fff06a', deb: 'bubble' },
    sea: { shape: 'crab', h: 8, s: 74, l: 56, acc: '#ffd9a8', eye: '#1a1030', deb: 'bubble' },
    cave: { shape: 'golem', h: 222, s: 18, l: 48, acc: '#6af0ff', eye: '#6af0ff', deb: 'rock' },
    snow: { shape: 'beast', h: 200, s: 34, l: 80, acc: '#bfeaff', eye: '#3ab8ff', deb: 'spark' },
    desert: { shape: 'crab', h: 38, s: 62, l: 58, acc: '#ffcf6a', eye: '#1a1030', deb: 'rock' },
    volcano: { shape: 'ogre', h: 8, s: 72, l: 46, acc: '#ffb02e', eye: '#ffe24a', deb: 'spark' },
    void: { shape: 'ghost', h: 290, s: 62, l: 36, acc: '#ff7adf', eye: '#ffffff', deb: 'smoke' },
    heaven: { shape: 'human', h: 48, s: 62, l: 82, acc: '#fff0a0', eye: '#4aa8ff', deb: 'spark', helm: 1 }
  };
  const ROLE = {
    grunt: { w: 'club' }, fast: { w: 'dagger', slim: 1 }, tank: { w: 'shield', wide: 1, plate: 1 }, swarm: { mini: 1 },
    archer: { w: 'bow' }, lancer: { w: 'spear' }, bomber: { w: 'bomb' }, armor: { w: 'shield', plate: 2, wide: 1 },
    splitter: { seam: 1 }, shaman: { w: 'staff', orb: 1 }, summoner: { w: 'tome', crown: 1, rune: 1 }, assassin: { w: 'dagger', mask: 1, dark: 1, slim: 1 },
    colossus: { w: 'club', plate: 1, wide: 1 }, hunter: { w: 'bow', hood: 1 }, mini: { w: 'club', plate: 2, wide: 1, crown: 1 }, boss: { w: 'club', plate: 2, wide: 1, crown: 1, big: 1 }
  };

  /* ---------- bộ màu theo (tộc, chương, vai trò) ---------- */
  const SK = new Map();
  function skinFor(e, G) {
    const ch = G && G.ch || {}, theme = RACE[ch.theme] ? ch.theme : 'plain', cid = ch.chapterId || 1, tid = ROLE[e.tid] ? e.tid : 'grunt', big = e.boss ? 2 : e.mb ? 1 : 0, el = e.el === 1 ? 1 : 0;
    const key = theme + '|' + cid + '|' + tid + '|' + el + big; let k = SK.get(key); if (k) return k;
    if (SK.size > 160) SK.clear();
    const R = RACE[theme], role = ROLE[tid], sh = ((cid * 47) % 56) - 28, h = R.h + sh, v = (cid * 5 + (tid.length * 3)) % 4, ch2 = (cid * 53) % 360;
    const ch0 = toHsl(e.c && e.c[0] === '#' && e.c.length >= 7 ? e.c : '#7a3030'), dark = role.dark ? 12 : 0;
    k = {
      key, theme, R, role, tid, v, big, el, h, cid, tier: ch.bossTier || 1, shape: R.shape,
      P: {
        skin: hsl(h, R.s, R.l - dark), dark: hsl(h, R.s + 6, R.l - 20 - dark), light: hsl(h, R.s - 6, R.l + 15 - dark),
        cloth: hsl(ch0[0] + sh * .6, M.min(78, ch0[1] + 18), clamp(ch0[2] + 10, 34, 56) - dark), clothD: hsl(ch0[0] + sh * .6, M.min(78, ch0[1] + 18), clamp(ch0[2] - 4, 20, 42) - dark),
        acc: R.acc, eye: R.eye, crys: hsl(ch2, 88, 64), crysD: hsl(ch2, 70, 38), metal: '#c9d0de', metalD: '#7a8498'
      }
    };
    SK.set(key, k); return k;
  }

  /* ---------- mặt giận dữ dùng chung ---------- */
  function eyes(c, k, y, sp, sz, eyeCol) {
    for (const s of [-1, 1]) {
      const x = s * sp + 1;
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, sz, sz * 1.18, 0, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
      c.fillStyle = eyeCol || k.P.eye; c.beginPath(); c.arc(x + .6, y + .3, sz * .66, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(x + .8, y + .3, sz * .32, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - sz * .35, sz * .22, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s * sz * 1.1, y - sz * 1.9); c.lineTo(x + s * sz * .1 - s * 0, y - sz * 1.15 + (k.big ? 0 : 0)); c.stroke(); c.lineCap = 'butt';
    }
  }
  function fangs(c, y, w, n) { c.fillStyle = '#fff'; for (let i = 0; i < n; i++) { const x = -w + (i + .5) * (2 * w / n); poly(c, [[x - w / n * .7, y], [x + w / n * .7, y], [x, y + 2.6]]); c.fill(); c.lineWidth = .7; c.strokeStyle = INK; c.stroke() } }
  function mouth(c, y, w) { c.fillStyle = '#5a1424'; rr(c, -w, y - 1.2, w * 2, 3.2, 1.4); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke(); fangs(c, y - 1.1, w, 3) }

  /* ---------- các dáng (vẽ ở chân = (0,0), cao ≈ 36 đơn vị), trả về y đỉnh đầu ---------- */
  const SHAPES = {
    human(c, k, L) {
      const P = k.P, R = k.R, v = k.v, sx = k.role.slim ? .88 : k.role.wide ? 1.16 : 1;
      c.save(); c.scale(sx, 1);
      if (k.el || k.big) { poly(c, [[-6, -17], [-12, -4], [12, -4], [6, -17]]); fo(c, k.big ? '#8a1f2a' : '#c0282f', 1.2) }
      rr(c, -6.6, -17.5, 13.2, 12.6, 3.6); fo(c, P.cloth, 1.3); c.fillStyle = P.clothD; c.fillRect(-6, -9.8, 12, 2.4); c.fillStyle = R.acc; c.fillRect(-1.6, -10.2, 3.2, 3.2);
      c.strokeStyle = R.acc; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-3.6, -17.2); c.lineTo(0, -13.4); c.lineTo(3.6, -17.2); c.stroke();
      for (const s of [-1, 1]) { ell(c, s * 7.8, -13.4, 2.8, 4.2, P.cloth, 1.1); ell(c, s * 8.4, -8.8, 2.3, 2.3, P.skin, 1) }
      for (const s of [-1, 1]) ell(c, s * 9.1, -25, 2, 2.6, P.dark, 1);
      ell(c, 0, -25, 9.4, 8.7, P.skin, 1.4); c.fillStyle = P.light; c.beginPath(); c.ellipse(-3, -29, 4, 2.2, -.4, 0, TAU); c.fill();
      if (L < 1) { eyes(c, k, -25.5, 3.7, 2.4); if (!k.role.mask) mouth(c, -20.4, 2.6) } else { c.fillStyle = '#fff'; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 3.7 + 1, -25.5, 2.3, 0, TAU); c.fill() } c.fillStyle = R.eye; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 3.7 + 1.6, -25.4, 1.3, 0, TAU); c.fill() } }
      let top = -34;
      if (R.helm) { // Cấm quân: mũ giáp + chong chóng lông đỏ
        c.beginPath(); c.ellipse(0, -27, 10.4, 8.6, 0, PI, TAU); c.lineTo(10.4, -24.5); c.lineTo(-10.4, -24.5); c.closePath(); fo(c, P.metal, 1.4); rr(c, -10.6, -27.6, 21.2, 2.6, 1); fo(c, R.acc, 1);
        const pl = [[-1.5, -35], [1.5, -35], [4 + v * 2, -43], [0, -45 - v], [-4 - v * 2, -42]]; poly(c, v < 2 ? pl : [[-2, -35], [2, -35], [0, -47 - v]]); fo(c, '#d83a3a', 1.1); top = -46;
        for (const s of [-1, 1]) { rr(c, s * 10.2 - 2, -26, 4, 8, 1.6); fo(c, P.metalD, 1) }
      } else if (R.hood) { // Sơn tặc: khăn trùm + che mặt
        c.beginPath(); c.moveTo(-10.8, -22); c.quadraticCurveTo(-12, -37, 0, -36); c.quadraticCurveTo(12, -37, 10.8, -22); c.quadraticCurveTo(7, -29, 0, -28.4); c.quadraticCurveTo(-7, -29, -10.8, -22); c.closePath(); fo(c, P.clothD, 1.4);
        rr(c, -9, -23, 18, 6.6, 3); fo(c, P.cloth, 1.2); c.fillStyle = R.acc; c.fillRect(-9, -23.4, 18, 1.6); top = -36;
        if (v % 2) { poly(c, [[5, -35], [12, -41], [9, -33]]); fo(c, '#e0393e', 1) }
      } else if (v === 0) { poly(c, [[-13.5, -29], [13.5, -29], [0, -43]]); fo(c, '#e0c070', 1.3); c.strokeStyle = '#a07a30'; c.lineWidth = 1; c.beginPath(); c.moveTo(-9, -32.4); c.lineTo(9, -32.4); c.moveTo(-5, -38); c.lineTo(5, -38); c.stroke(); top = -43 }
      else if (v === 1) { c.beginPath(); c.ellipse(0, -27, 10, 8, 0, PI, TAU); c.lineTo(10, -25.5); c.lineTo(-10, -25.5); c.closePath(); fo(c, P.metalD, 1.3); c.beginPath(); c.arc(0, -35.4, 2.6, 0, TAU); fo(c, '#d83a3a', 1); top = -38 }
      else if (v === 2) { rr(c, -9.8, -30.5, 19.6, 4.6, 2); fo(c, P.cloth, 1.2); c.strokeStyle = P.cloth; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-9, -29); c.quadraticCurveTo(-16, -27, -18, -22); c.stroke(); c.lineCap = 'butt'; top = -31 }
      else { c.beginPath(); c.ellipse(0, -27, 10, 8, 0, PI, TAU); c.lineTo(10, -25.5); c.lineTo(-10, -25.5); c.closePath(); fo(c, P.metalD, 1.3); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 8, -30); c.quadraticCurveTo(s * 15, -33, s * 14, -41); c.quadraticCurveTo(s * 11, -35, s * 6, -33); c.closePath(); fo(c, '#f4ead0', 1.1) } top = -41 }
      if (k.role.mask) { rr(c, -8.4, -23.6, 16.8, 6.4, 3); fo(c, '#2a2438', 1.2) }
      c.restore(); return top;
    },
    amphi(c, k, L) { // Thuỷ quái: đầu cá, vây lưng, mang
      const P = k.P, R = k.R, v = k.v, sx = k.role.slim ? .9 : k.role.wide ? 1.15 : 1; c.save(); c.scale(sx, 1);
      poly(c, [[-5, -9], [-17, -13 - v], [-14, -5], [-17, 0], [-5, -4]]); fo(c, P.acc, 1.1);
      rr(c, -6.6, -17.2, 13.2, 12.4, 4); fo(c, P.cloth, 1.3); ell(c, 0, -10, 4.6, 5.6, P.light, 0); c.strokeStyle = P.dark; c.lineWidth = .9; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-3.6, -14 + i * 3.4); c.quadraticCurveTo(0, -12.6 + i * 3.4, 3.6, -14 + i * 3.4); c.stroke() }
      for (const s of [-1, 1]) { ell(c, s * 8, -12.4, 2.6, 4, P.skin, 1.1); ell(c, s * 8.6, -8, 2.6, 2.4, P.light, 1) }
      for (let i = -2; i <= 2; i++) { poly(c, [[i * 3.8 - 2.6, -31], [i * 3.8, -38 - (i % 2 ? 0 : 3) - (v === 1 ? 2 : 0) + M.abs(i) * -.6], [i * 3.8 + 2.6, -31]]); fo(c, i % 2 ? P.acc : P.light, 1) }
      ell(c, 0, -24.6, 11, 8.6, P.skin, 1.5); c.fillStyle = P.light; c.beginPath(); c.ellipse(0, -21, 8.2, 3.8, 0, 0, PI); c.fill();
      for (const s of [-1, 1]) { ell(c, s * 6, -27, 3.7, 3.9, '#fff', 1.2); c.fillStyle = R.eye; c.beginPath(); c.arc(s * 6 + .6, -27, 2.4, 0, TAU); c.fill(); c.fillStyle = INK; c.fillRect(s * 6 + .1, -29.2, 1.1, 4.4); c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s * 6 - s * 4, -32.6); c.lineTo(s * 6 + s * 1.5, -30.4); c.stroke() }
      c.strokeStyle = P.dark; c.lineWidth = .9; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(s * 9, -23.6 + i * 2); c.lineTo(s * 7, -23 + i * 2); c.stroke() }
      c.fillStyle = '#5a1424'; c.beginPath(); c.ellipse(1, -19.6, 5, 2.4, 0, 0, PI); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke(); fangs(c, -19.8, 4.6, 4);
      c.restore(); return -38;
    },
    beast(c, k, L) { // Thú rừng: sói / lợn rừng / gấu / hổ
      const P = k.P, R = k.R, v = k.v, sx = k.role.slim ? .9 : k.role.wide ? 1.16 : 1; c.save(); c.scale(sx, 1);
      ell(c, -10, -9, 4.4, 3.8, P.skin, 1.2);
      ell(c, 0, -10, 9, 8.2, P.skin, 1.4); ell(c, 1.4, -8.4, 5.2, 5.4, P.light, 0);
      if (v === 3) { c.strokeStyle = P.dark; c.lineWidth = 1.8; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-8 + i * 3.4, -15); c.lineTo(-6.6 + i * 3.4, -9); c.stroke() } }
      for (const s of [-1, 1]) { ell(c, s * 8.2, -9, 3, 4.6, P.skin, 1.1); for (let i = -1; i <= 1; i++) { poly(c, [[s * 8.2 + i * 1.5 - .7, -4.4], [s * 8.2 + i * 1.5 + .7, -4.4], [s * 8.2 + i * 1.5, -2.2]]); fo(c, '#fff', .6) } }
      const ear = (s) => { if (v === 1 || v === 2) { c.beginPath(); c.arc(s * 7, -30, v === 2 ? 3.6 : 2.6, 0, TAU); fo(c, P.skin, 1.1) } else { poly(c, [[s * 3.4, -29], [s * 9.4, -29.4], [s * 8, -39]]); fo(c, P.skin, 1.1); poly(c, [[s * 5, -30], [s * 8, -30], [s * 7.6, -35.6]]); c.fillStyle = '#ff9aa8'; c.fill() } };
      ear(-1); ear(1);
      ell(c, 0, -22.4, 9.4, 8.4, P.skin, 1.4); c.fillStyle = P.light; c.beginPath(); c.ellipse(-3, -27, 3.6, 2, -.4, 0, TAU); c.fill();
      ell(c, 4.8, -19.6, 5.2, 3.8, P.light, 1.1); c.fillStyle = INK; c.beginPath(); c.ellipse(8.4, -21, 1.8, 1.3, 0, 0, TAU); c.fill();
      if (v === 1) for (const s of [-1, 1]) { poly(c, [[7 - s * 2, -18.4], [9.6 - s * 2.4, -18.4], [9 - s * 1.5, -25]]); fo(c, '#f4ead0', 1) }
      for (const s of [-1, 1]) { const x = s * 3.8 + 1; c.fillStyle = R.eye; c.beginPath(); c.ellipse(x, -24.2, 2.5, 2.2, 0, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke(); c.fillStyle = INK; c.fillRect(x + .4, -26, 1, 3.8); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - s * 3, -28.4); c.lineTo(x + s * .6, -26.2); c.stroke() }
      c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(4, -18); c.quadraticCurveTo(6, -16.6, 8.6, -17.6); c.stroke(); fangs(c, -17.8, 2.6, 2);
      c.restore(); return v < 2 ? -39 : -33;
    },
    ogre(c, k, L) { // Sơn quỷ: thân đồ sộ, sừng, nanh
      const P = k.P, R = k.R, v = k.v, sx = k.role.slim ? .92 : 1.16; c.save(); c.scale(sx, 1);
      rr(c, -8.8, -18, 17.6, 14, 4); fo(c, P.skin, 1.5); ell(c, 0, -11, 5.6, 5.6, P.light, 0); c.fillStyle = P.cloth; poly(c, [[-8.8, -8], [8.8, -8], [7, -2.4], [-7, -2.4]]); fo(c, P.cloth, 1.2); c.fillStyle = R.acc; c.fillRect(-8.8, -9.6, 17.6, 2.2);
      for (const s of [-1, 1]) { ell(c, s * 10.8, -13, 4.4, 5.4, P.skin, 1.3); ell(c, s * 11.6, -6.4, 3.8, 3.6, P.light, 1.2); c.strokeStyle = P.dark; c.lineWidth = .8; c.beginPath(); c.moveTo(s * 11.6 - 1.4, -7.4); c.lineTo(s * 11.6 - 1.4, -5); c.moveTo(s * 11.6 + 1.4, -7.4); c.lineTo(s * 11.6 + 1.4, -5); c.stroke() }
      if (v === 0 || v === 3) for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 5, -29); c.quadraticCurveTo(s * 13, -31, s * 12, -41); c.quadraticCurveTo(s * 9, -34, s * 3.4, -32.6); c.closePath(); fo(c, '#f2ead2', 1.2) }
      ell(c, 0, -24.6, 10.4, 8.8, P.skin, 1.5); c.fillStyle = P.light; c.beginPath(); c.ellipse(-3.4, -29, 4, 2.2, -.4, 0, TAU); c.fill();
      if (v === 1) { poly(c, [[-3, -32], [3, -32], [0, -44]]); fo(c, '#f2ead2', 1.2) }
      if (v === 2) { for (let i = -2; i <= 2; i++) { poly(c, [[i * 3.8 - 2, -31.6], [i * 3.8, -38 - (2 - M.abs(i))], [i * 3.8 + 2, -31.6]]); fo(c, P.dark, 1) } }
      if (v === 3) { c.strokeStyle = P.dark; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-6, -30); c.lineTo(-3, -27); c.stroke() }
      eyes(c, k, -25.2, 3.6, 2, R.eye);
      rr(c, -5, -20.6, 10, 3.6, 1.6); fo(c, '#5a1424', 1); for (const s of [-1, 1]) { poly(c, [[s * 4 - 1.1, -19.4], [s * 4 + 1.1, -19.4], [s * 4.4, -24]]); fo(c, '#f4ead0', .9) }
      c.restore(); return v === 1 ? -44 : v === 2 ? -41 : v === 3 ? -42 : -34;
    },
    blob(c, k, L) { // Quỷ bùn: khối nhầy to, miệng rộng
      const P = k.P, R = k.R, v = k.v, sx = k.role.slim ? .9 : k.role.wide ? 1.12 : 1; c.save(); c.scale(sx, 1);
      c.beginPath(); c.moveTo(-13, -3); c.bezierCurveTo(-15, -16, -9, -23, 0, -23); c.bezierCurveTo(9, -23, 15, -16, 13, -3); c.quadraticCurveTo(10, -1, 7, -3.6); c.quadraticCurveTo(4, -.4, 0, -3); c.quadraticCurveTo(-4, -.4, -7, -3.6); c.quadraticCurveTo(-10, -1, -13, -3); c.closePath(); fo(c, P.skin, 1.6);
      c.fillStyle = P.light; c.beginPath(); c.ellipse(-5, -17.4, 4.4, 2.6, -.5, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(-7.4, -14.6, 1.1, 0, TAU); c.fill();
      c.fillStyle = P.dark; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-8 + i * 5, -6 + (i % 2) * 2.6, 1.2 + (i % 2) * .6, 0, TAU); c.fill() }
      const eye = (x, y, r) => { ell(c, x, y, r, r * 1.1, '#fff', 1.2); c.fillStyle = R.eye; c.beginPath(); c.arc(x + .8, y + .4, r * .6, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(x + 1, y + .4, r * .3, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - r * 1.1, y - r * 1.5); c.lineTo(x + r * 1.1, y - r * .9); c.stroke() };
      if (v === 1) eye(0, -15, 4.6); else if (v === 2) { eye(-5.6, -14.6, 2.6); eye(5.6, -14.6, 2.6); eye(0, -18.4, 2.2) } else { eye(-4.6, -15, 3.2); eye(4.6, -15, 3.2) }
      c.fillStyle = '#4a0f20'; c.beginPath(); c.ellipse(0, -8.4, 7, 3.4, 0, 0, PI); c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); fangs(c, -8.6, 6, 5);
      let top = -23;
      if (v === 0) { c.beginPath(); c.ellipse(0, -23.6, 8.6, 4.6, 0, PI, TAU); fo(c, '#e0523a', 1.3); c.fillStyle = '#fff2d0'; for (const [x, y] of [[-4, -26], [1, -27.4], [4.6, -25]]) { c.beginPath(); c.arc(x, y, 1.1, 0, TAU); c.fill() } rr(c, -2.4, -24, 4.8, 3.4, 1.2); fo(c, '#f2e6c4', 1); top = -29 }
      else if (v === 1) { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -23); c.quadraticCurveTo(s * 9, -30, s * 11, -26); c.quadraticCurveTo(s * 6, -25, 0, -23); fo(c, '#5ab04a', 1.1) } top = -29 }
      else if (v === 2) { for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5 - 2, -22.6); c.quadraticCurveTo(i * 5, -31 + M.abs(i) * 3, i * 5 + 2, -22.6); fo(c, P.skin, 1.1) } top = -30 }
      else { poly(c, [[-4, -22], [-1, -29], [2, -22]]); fo(c, '#6a8a2a', 1.1); poly(c, [[1, -22], [5, -30], [8, -21]]); fo(c, '#8aae3a', 1.1); top = -30 }
      c.restore(); return top;
    },
    crab(c, k, L) { // Hải quái: mai cua, càng lớn, mắt cuống
      const P = k.P, R = k.R, v = k.v; c.save(); if (k.role.slim) c.scale(.9, 1);
      c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * 7, -7 + i * 1.6); c.lineTo(s * (13 + i * 1.2), -3 + i * 1.4); c.lineTo(s * (14 + i * 1.2), 0); c.stroke() }
      c.strokeStyle = P.dark; c.lineWidth = 1.2; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(s * 7, -7 + i * 1.6); c.lineTo(s * (13 + i * 1.2), -3 + i * 1.4); c.lineTo(s * (14 + i * 1.2), 0); c.stroke() } c.lineCap = 'butt';
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 10, -13); c.quadraticCurveTo(s * 15.4, -19, s * 11.4, -25); c.lineTo(s * 8.4, -22); c.quadraticCurveTo(s * 11.4, -19, s * 8, -16); c.closePath(); fo(c, P.skin, 1.4); poly(c, [[s * 11.4, -25], [s * 15.8, -24], [s * 13, -19.6]]); fo(c, P.light, 1.2) }
      c.beginPath(); c.ellipse(0, -10.8, 13.4, 10, 0, PI, TAU); c.lineTo(13.4, -7); c.quadraticCurveTo(0, -3, -13.4, -7); c.closePath(); fo(c, P.skin, 1.6); c.fillStyle = P.light; c.beginPath(); c.ellipse(-4.6, -16.6, 5, 2.6, -.4, 0, TAU); c.fill();
      c.fillStyle = P.dark; if (v === 0) for (const [x, y] of [[-6, -9], [3, -11], [7, -7.6], [-1, -6.4]]) { c.beginPath(); c.arc(x, y, 1.4, 0, TAU); c.fill() }
      else if (v === 1) for (let i = -2; i <= 2; i++) { poly(c, [[i * 5 - 2, -17 + M.abs(i) * 1.6], [i * 5, -23 + M.abs(i)], [i * 5 + 2, -17 + M.abs(i) * 1.6]]); fo(c, P.acc, 1) }
      else if (v === 2) { c.strokeStyle = P.dark; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -7, 5 + i * 3.2, PI * 1.1, PI * 1.9); c.stroke() } }
      else { for (let i = 0; i < 5; i++) { c.strokeStyle = i % 2 ? '#ff7ab0' : '#ffd0e8'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(-3 + i * 1.6, -19.6); c.quadraticCurveTo(-5 + i * 2.6, -26, -4 + i * 2.3, -28); c.stroke(); c.lineCap = 'butt' } }
      for (const s of [-1, 1]) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(s * 4, -17); c.lineTo(s * 4.6, -24.6); c.stroke(); ell(c, s * 4.8, -26.6, 3.2, 3.4, '#fff', 1.2); c.fillStyle = INK; c.beginPath(); c.arc(s * 4.8 + 1, -26.4, 1.7, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s * 4.8 - s * 3.4, -30.6); c.lineTo(s * 4.8 + s * 1.2, -28.4); c.stroke() }
      c.fillStyle = '#4a0f20'; c.beginPath(); c.ellipse(0, -11.6, 4.6, 1.8, 0, 0, PI); c.fill(); fangs(c, -11.8, 4, 3);
      c.restore(); return v === 3 ? -33 : -31;
    },
    golem(c, k, L) { // Thạch linh: thân đá, tinh thể phát sáng
      const P = k.P, R = k.R, v = k.v; c.save(); if (k.role.slim) c.scale(.92, 1); else if (k.role.wide) c.scale(1.12, 1);
      const cr = (x, y, h, w, a) => { c.save(); c.translate(x, y); c.rotate(a); poly(c, [[-w, 0], [0, -h], [w, 0], [w * .5, 3]]); fo(c, P.crys, 1.2); poly(c, [[-w * .2, 0], [0, -h * .85], [w * .4, 0]]); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(); c.restore() };
      cr(-6, -19, 10 + v, 3.4, -.5); cr(6, -19, 9 + v * 1.2, 3.2, .45); if (v > 0) cr(0, -20, 12, 3, 0); if (v > 2) cr(-11, -14, 7, 2.6, -.9);
      poly(c, [[-9, -4], [-10.4, -13], [-6.4, -20.4], [6.4, -20.4], [10.4, -13], [9, -4]]); fo(c, vg(c, -20, -4, P.light, P.dark), 1.6);
      c.strokeStyle = P.dark; c.lineWidth = .9; c.beginPath(); c.moveTo(-6, -19); c.lineTo(-2, -12); c.lineTo(-5, -5); c.moveTo(3, -19); c.lineTo(6, -11); c.stroke();
      c.beginPath(); c.arc(0, -12, 3.4, 0, TAU); fo(c, P.crys, 1.2); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-.8, -12.8, 1.1, 0, TAU); c.fill();
      for (const s of [-1, 1]) { poly(c, [[s * 9.6, -17], [s * 14, -15], [s * 14.6, -8], [s * 10.4, -6], [s * 8.4, -11]]); fo(c, P.skin, 1.4); poly(c, [[s * 11.4, -7], [s * 15.8, -7.4], [s * 15.4, -2.4], [s * 11, -2]]); fo(c, P.light, 1.3) }
      poly(c, [[-8, -20.4], [8, -20.4], [8.4, -31], [-8.4, -31]]); fo(c, vg(c, -31, -20, P.light, P.skin), 1.5);
      c.fillStyle = INK; rr(c, -6.4, -27, 12.8, 3.6, 1.4); c.fill(); c.fillStyle = R.eye; for (const s of [-1, 1]) { c.fillRect(s * 3.4 - 1.5, -26.2, 3, 1.8) } c.fillStyle = 'rgba(106,240,255,.35)'; c.fillRect(-7, -28.4, 14, 6.4);
      poly(c, [[-3, -31], [0, -35 - v], [3, -31]]); fo(c, P.crys, 1.1);
      c.restore(); return -35 - v;
    }
  };
  function vg(c, y0, y1, a, b) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g }

  /* ---------- vũ khí / phụ kiện theo vai trò (vẽ ở thân đã dựng) ---------- */
  const WPN = {
    club(c, k) { c.save(); c.translate(11.4, -10); c.rotate(-.7); rr(c, -1.8, -17, 3.6, 18, 1.6); fo(c, '#9a6a3a', 1.2); c.beginPath(); c.ellipse(0, -17, 3.8, 5.2, 0, 0, TAU); fo(c, '#b07a44', 1.2); c.fillStyle = '#d8dce8'; for (const [x, y] of [[-1.8, -19], [1.8, -16], [0, -21.6]]) { poly(c, [[x - 1, y], [x + 1, y], [x, y - 2.6]]); c.fill() } c.restore() },
    dagger(c, k) { c.save(); c.translate(11, -9); c.rotate(-.9); poly(c, [[-1.4, 0], [1.4, 0], [1, -12], [0, -14.4], [-1, -12]]); fo(c, k.P.metal, 1); rr(c, -3, 0, 6, 1.8, .8); fo(c, k.P.acc, .9); c.restore() },
    spear(c, k) { c.save(); c.translate(11, -8); c.rotate(-.18); c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -30); c.stroke(); c.strokeStyle = '#a0703c'; c.lineWidth = 1.7; c.stroke(); poly(c, [[-2.8, -29], [0, -37], [2.8, -29]]); fo(c, k.P.metal, 1.1); c.fillStyle = '#e0393e'; c.beginPath(); c.moveTo(-2, -28); c.quadraticCurveTo(-5, -25, -4, -21); c.lineTo(2, -28); c.fill(); c.restore() },
    bow(c, k) { c.save(); c.translate(12, -14); c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.arc(-3, 0, 11, -1.15, 1.15); c.stroke(); c.strokeStyle = '#a0703c'; c.lineWidth = 2; c.stroke(); c.strokeStyle = '#fff6dc'; c.lineWidth = .8; c.beginPath(); c.moveTo(-3 + M.cos(1.15) * 11, -M.sin(1.15) * 11); c.lineTo(-3 + M.cos(1.15) * 11, M.sin(1.15) * 11); c.stroke(); c.restore(); c.save(); c.translate(-5, -12); c.rotate(.4); rr(c, -2.4, -9, 4.8, 15, 1.8); fo(c, k.P.clothD, 1); c.strokeStyle = '#e8e0c8'; c.lineWidth = 1; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 1.4, -9); c.lineTo(i * 1.8, -13); c.stroke() } c.restore() },
    staff(c, k) { c.save(); c.translate(11.4, -8); c.strokeStyle = INK; c.lineWidth = 3.2; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -28); c.stroke(); c.strokeStyle = '#8a5a30'; c.lineWidth = 1.7; c.stroke(); c.beginPath(); c.arc(0, -31, 4, 0, TAU); fo(c, k.P.acc, 1.2); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(-1, -32, 1.3, 0, TAU); c.fill(); c.restore() },
    tome(c, k) { c.save(); c.translate(10, -11); c.rotate(-.2); rr(c, -4.4, -6, 8.8, 11, 1.4); fo(c, k.P.clothD, 1.2); c.fillStyle = k.P.acc; c.fillRect(-4.4, -6, 2, 11); c.strokeStyle = k.P.acc; c.lineWidth = .9; c.beginPath(); c.arc(1, -.5, 2.4, 0, TAU); c.stroke(); c.restore() },
    bomb(c, k) { c.save(); c.translate(11, -10); c.beginPath(); c.arc(0, 0, 5.4, 0, TAU); fo(c, '#3a3446', 1.3); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(-1.8, -1.8, 1.4, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -5.2); c.quadraticCurveTo(3, -9, 5, -8); c.stroke(); c.fillStyle = '#ffb02e'; c.beginPath(); c.arc(5.2, -8.2, 2.2, 0, TAU); c.fill(); c.fillStyle = '#fff2a0'; c.beginPath(); c.arc(5.2, -8.2, 1, 0, TAU); c.fill(); c.restore() },
    shield(c, k) { c.save(); c.translate(-10, -10); c.beginPath(); c.arc(0, 0, 7.6, 0, TAU); fo(c, k.P.metalD, 1.4); c.beginPath(); c.arc(0, 0, 5.2, 0, TAU); fo(c, k.P.cloth, 1); c.beginPath(); c.arc(0, 0, 1.8, 0, TAU); fo(c, k.P.acc, .9); c.restore() }
  };
  function accessories(c, k, top, L) {
    const r = k.role, P = k.P, sh = k.shape; if (L >= 2) return;
    if (r.plate && sh !== 'crab' && sh !== 'ghost') { for (const s of [-1, 1]) { c.beginPath(); c.arc(s * (sh === 'ogre' ? 11 : sh === 'golem' ? 10.4 : 8.6), -17.4, r.plate > 1 ? 5.6 : 4.6, PI, TAU); fo(c, P.metal, 1.3); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(s * 8 - 1, -20.4, 1.8, .9, -.4, 0, TAU); c.fill() } if (r.plate > 1) { rr(c, -6.4, -16.4, 12.8, 7.4, 2); c.globalAlpha = .9; fo(c, P.metal, 1.2); c.globalAlpha = 1; c.strokeStyle = P.metalD; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -16.4); c.lineTo(0, -9); c.stroke() } }
    if (r.w && WPN[r.w] && sh !== 'ghost') WPN[r.w](c, k);
    if (r.seam) { c.strokeStyle = k.P.crys; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, top + 3); for (let i = 1; i < 6; i++)c.lineTo((i % 2 ? 1.6 : -1.6), top + 3 + i * (-top - 6) / 6); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = .6; c.stroke() }
    if (r.crown || k.el) { const y = top + 1.4, g = k.big ? '#ffdd55' : '#ffd34a'; poly(c, [[-6, y], [-6, y - 5.4], [-3, y - 2.6], [0, y - 7], [3, y - 2.6], [6, y - 5.4], [6, y]]); fo(c, g, 1.3); c.fillStyle = '#e0393e'; c.beginPath(); c.arc(0, y - 2, 1.3, 0, TAU); c.fill() }
  }

  /* ---------- sprite nướng sẵn cho quái thường ---------- */
  const RES = 4, BW = 44, BH = 56, SP = new Map();
  function paint(c, k, L) { const top = (SHAPES[k.shape] || SHAPES.human)(c, k, L); accessories(c, k, top, L); return top }
  function sprite(k, white) {
    const key = k.key + (white ? 'w' : ''); let s = SP.get(key); if (s) return s;
    if (SP.size > 90) SP.clear();
    const cv = document.createElement('canvas'); cv.width = BW * RES; cv.height = BH * RES; const c = cv.getContext('2d'); c.scale(RES, RES); c.translate(BW / 2, BH - 6); paint(c, k, 0);
    if (white) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height) }
    SP.set(key, cv); return cv;
  }

  /* ---------- Ghost (vẽ trực tiếp vì đuôi và lửa ma chuyển động) ---------- */
  function ghost(c, k, t, white, lod) {
    const P = k.P, R = k.R, w = white ? '#fff' : null, sx = k.role.slim ? .9 : k.role.wide ? 1.14 : 1; c.save(); c.scale(sx, 1);
    c.globalAlpha *= .92; const wv = M.sin(t * 5) * 1.8;
    c.beginPath(); c.moveTo(-9.6, -22); c.bezierCurveTo(-11, -34, 11, -34, 9.6, -22); c.lineTo(10.4, -9); for (let i = 0; i < 4; i++) { const x = 10.4 - (i + 1) * 5.2; c.quadraticCurveTo(x + 2.6 + wv * (i % 2 ? 1 : -1), -2 + (i % 2) * 3.4, x, -7 + (i % 2 ? 3 : 0)) } c.closePath(); fo(c, w || (lod ? P.skin : vg(c, -34, -2, P.light, P.dark)), 1.5);
    c.globalAlpha /= .92;
    if (!w) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-3.6, -28, 3.6, 2, -.4, 0, TAU); c.fill() }
    if (!lod) for (const s of [-1, 1]) { ell(c, s * 11.6, -15 + M.sin(t * 4 + s) * 1.6, 3.2, 2.3, w || P.light, 1.1) }
    for (const s of [-1, 1]) { ell(c, s * 3.6 + 1, -25, 2.8, 3.4, w || '#1c1030', 1.1); if (!w) { c.fillStyle = R.eye; c.beginPath(); c.arc(s * 3.6 + 1.4, -25.2, 1.4, 0, TAU); c.fill() } c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(s * 3.6 - s * 3, -29.8); c.lineTo(s * 3.6 + s * 1, -27.8); c.stroke() }
    c.fillStyle = w || '#1c1030'; c.beginPath(); c.ellipse(1, -18, 3.4, 2.6 + M.sin(t * 6) * .6, 0, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
    if (k.role.plate && !w) { for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 8.2, -22, 4.4, PI, TAU); fo(c, P.metal, 1.2) } }
    if (!w && !lod) { for (let i = 0; i < 2; i++) { const a = t * 2.4 + i * PI, x = M.cos(a) * 13, y = -20 + M.sin(a) * 4.4 - 3; c.fillStyle = hsl(k.h + 40, 90, 70); c.beginPath(); c.moveTo(x, y + 4); c.quadraticCurveTo(x - 3.6, y, x, y - 6 - M.sin(t * 9 + i) * 1.6); c.quadraticCurveTo(x + 3.6, y, x, y + 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x, y + 1.2, 1, 0, TAU); c.fill() } }
    if (!w && k.role.w === 'staff') WPN.staff(c, k);
    if (!w && (k.role.crown || k.el)) { const y = -33; poly(c, [[-6, y], [-6, y - 5.4], [-3, y - 2.6], [0, y - 7], [3, y - 2.6], [6, y - 5.4], [6, y]]); fo(c, '#ffd34a', 1.3) }
    c.restore();
  }

  /* ---------- vẽ một con quái ---------- */
  function body(ctx, e, G, q) {
    const k = skinFor(e, G), t = G.t, white = e.fl > 0, age = e.born == null ? 9 : t - e.born, fl = G.p.x >= e.x ? 1 : -1, ph = t * 9 + e.id;
    const mv = e.sp > 90 ? 1.3 : 1, tel = e.tel > 0, dash = e.dsh > 0, lod = q === 0 || G.en.length > 120 ? 1 : 0;
    ctx.save(); ctx.scale(1.18, 1.18);
    /* hiệu ứng XUẤT HIỆN: vòng truyền tống + cột sáng, quái trồi lên */
    if (age < .5) {
      const u = age / .5, ac = k.P.acc, e1 = ease(u); ctx.save(); ctx.translate(0, 2); ctx.scale(1, .36); ctx.strokeStyle = ac; ctx.globalAlpha = (1 - u) * .95; ctx.lineWidth = 3.2 * (1 - u) + .8; ctx.beginPath(); ctx.arc(0, 0, 4 + e1 * 17, 0, TAU); ctx.stroke(); ctx.globalAlpha = (1 - u) * .5; ctx.beginPath(); ctx.arc(0, 0, 3 + e1 * 11, 0, TAU); ctx.stroke(); ctx.restore();
      if (q > 0) { const g = ctx.createLinearGradient(0, -40, 0, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, ac); ctx.globalAlpha = (1 - u) * .45; ctx.fillStyle = g; ctx.fillRect(-7 * (1 - u * .4), -40, 14 * (1 - u * .4), 40); ctx.globalAlpha = 1 }
      ctx.globalAlpha = clamp(u * 1.6, 0, 1); ctx.scale(.55 + .45 * e1, .4 + .6 * e1);
    }
    /* chuyển động: nảy bước, nghiêng theo hướng đi; ĐÒN ĐÁNH: gồng (tel) · lao (dash) */
    const hop = M.abs(M.sin(ph * mv)) * (k.shape === 'ghost' ? 1 : 2.2), lean = (tel ? -.1 : dash ? .28 : .05 * M.sin(ph * mv)) * fl;
    ctx.scale(fl, 1);
    if (tel) { const p = 1 + .06 * M.sin(t * 40); ctx.scale(p, 2 - p); if (q > 0) { ctx.fillStyle = 'rgba(255,40,40,' + (.15 + .1 * M.sin(t * 30)) + ')'; ctx.beginPath(); ctx.arc(0, -16, 17, 0, TAU); ctx.fill() } }
    if (dash) { ctx.scale(1.18, .86); if (q > 0) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-16 - i * 5, -9 - i * 5 + 2); ctx.lineTo(-26 - i * 5, -9 - i * 5 + 2); ctx.stroke() } } }
    ctx.rotate(lean); ctx.translate(0, -hop);
    if (k.shape === 'ghost') { ghost(ctx, k, t + e.id, white, lod || G.en.length > 40); ctx.restore(); return true }
    if (k.big || e.el) { ctx.save(); paint(ctx, k, 0); ctx.restore(); if (white) { ctx.globalAlpha = .65; ctx.globalCompositeOperation = 'lighter'; ctx.save(); paint(ctx, k, 0); ctx.restore(); ctx.globalCompositeOperation = 'source-over' } }
    else ctx.drawImage(sprite(k, white), -BW / 2, -(BH - 6), BW, BH);
    /* chân / càng chạy live (cái làm nên cảm giác bước đi) */
    if (k.shape !== 'crab' && k.shape !== 'blob') { ctx.translate(0, hop); for (const s of [-1, 1]) { const sw = M.sin(ph * mv + (s > 0 ? PI : 0)), fx = s * 3.6 + sw * 2.6, fy = -.6 - M.max(0, sw) * 2; ctx.beginPath(); ctx.ellipse(fx, fy, 3.6, 2.2, 0, 0, TAU); ctx.fillStyle = white ? '#fff' : k.shape === 'golem' ? k.P.skin : k.P.clothD; ctx.fill(); ctx.lineWidth = 1.1; ctx.strokeStyle = INK; ctx.stroke() } }
    if (k.role.rune && !white && q > 0) { ctx.save(); ctx.translate(0, hop + 1); ctx.scale(1, .36); ctx.strokeStyle = k.P.acc; ctx.globalAlpha = .7; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.stroke(); for (let i = 0; i < 6; i++) { const a = t * 1.4 + i * TAU / 6; ctx.beginPath(); ctx.moveTo(M.cos(a) * 12, M.sin(a) * 12); ctx.lineTo(M.cos(a) * 18, M.sin(a) * 18); ctx.stroke() } ctx.restore() }
    if (k.role.orb && !white) { const a = t * 2.6, x = M.cos(a) * 12, y = -34 + M.sin(a) * 3; ctx.fillStyle = 'rgba(126,255,170,.9)'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - .6, y - 1.8, 1.2, 3.6); ctx.fillRect(x - 1.8, y - .6, 3.6, 1.2) }
    if (k.role.w === 'bomb' && !white && q > 0) { const f = M.sin(t * 24 + e.id); ctx.fillStyle = 'rgba(255,170,40,' + (.55 + .35 * f) + ')'; ctx.beginPath(); ctx.arc(16.2, -18.2 - hop, 3 + f, 0, TAU); ctx.fill() }
    if (k.big) { /* Mini Boss / Boss: viền sáng + mắt rực */
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .13 + .07 * M.sin(t * 4); ctx.fillStyle = k.P.acc; ctx.beginPath(); ctx.ellipse(0, -16 - hop, 18, 22, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (k.big === 2 && q > 0) { for (let i = 0; i < 3 + k.tier; i++) { const a = t * .9 + i * TAU / (3 + k.tier), x = M.cos(a) * 21, y = -18 + M.sin(a) * 9; ctx.fillStyle = hsl(k.h + 20, 90, 66); ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 2.4, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 2.4, y); ctx.closePath(); ctx.fill(); ctx.lineWidth = .8; ctx.strokeStyle = INK; ctx.stroke() } }
    }
    ctx.restore(); return true;
  }

  /* ---------- hiệu ứng trúng đòn / tiêu diệt ---------- */
  function onHit(e, G, cr, q) { if (!q || G.fx.length > 70) return; G.fx.push({ k: 'mh', x: e.x, y: e.y - e.r, t: cr ? .24 : .16, T: cr ? .24 : .16, c: cr ? 1 : 0, r: e.r }) }
  function onDie(e, G, q) {
    const k = skinFor(e, G), big = e.boss ? 3 : e.mb ? 2 : e.el ? 1.4 : 1; if (G.fx.length > 90 && !e.boss) return;
    G.fx.push({ k: 'md', x: e.x, y: e.y, t: .55 * (big > 1 ? 1.4 : 1), T: .55 * (big > 1 ? 1.4 : 1), r: e.r, big, deb: k.R.deb, ac: k.P.acc, sk: k.P.skin, cl: k.P.cloth, seed: e.id * 7.13 });
  }
  const hs = (a, b) => { const x = M.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - M.floor(x) };
  function drawFx(ctx, G, cx, cy, q) {
    for (const f of G.fx) {
      if (f.k === 'mh') { const u = 1 - f.t / f.T, x = f.x - cx, y = f.y - cy; ctx.save(); ctx.translate(x, y + 4); ctx.globalAlpha = 1 - u; ctx.strokeStyle = f.c ? '#ffe27a' : '#ffffff'; ctx.lineCap = 'round'; const n = f.c ? 7 : 4; for (let i = 0; i < n; i++) { const a = i * TAU / n + .4 + hs(i, 3) * .5, r0 = 4 + u * 5, r1 = 9 + u * (f.c ? 18 : 11); ctx.lineWidth = f.c ? 2.4 * (1 - u) + .6 : 1.6 * (1 - u) + .5; ctx.beginPath(); ctx.moveTo(M.cos(a) * r0, M.sin(a) * r0); ctx.lineTo(M.cos(a) * r1, M.sin(a) * r1); ctx.stroke() } if (f.c) { ctx.fillStyle = 'rgba(255,240,170,' + (.5 * (1 - u)) + ')'; ctx.beginPath(); ctx.arc(0, 0, 5 + u * 9, 0, TAU); ctx.fill() } ctx.restore() }
      else if (f.k === 'md') {
        const u = 1 - f.t / f.T, x = f.x - cx, y = f.y - cy, R = f.r * (f.big > 1 ? 1.3 : 1), n = q === 0 ? 5 : q === 1 ? 8 : 12; ctx.save(); ctx.translate(x, y);
        ctx.save(); ctx.translate(0, 2); ctx.scale(1, .4); ctx.strokeStyle = f.ac; ctx.globalAlpha = (1 - u) * .9; ctx.lineWidth = (5 * f.big) * (1 - u) + 1; ctx.beginPath(); ctx.arc(0, 0, R * (.6 + ease(u) * 2.2), 0, TAU); ctx.stroke(); ctx.restore();
        if (u < .45) { ctx.globalAlpha = (1 - u / .45) * .85; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -R * .8, R * (.7 + u * 1.2), 0, TAU); ctx.fill() }
        for (let i = 0; i < n; i++) { const a = hs(i, f.seed) * TAU, sp = (30 + hs(i, 9) * 40) * (R / 11) * (f.big > 1 ? .8 : 1), px = M.cos(a) * sp * ease(u), py = -R * .8 + M.sin(a) * sp * .6 * ease(u) + 60 * u * u * (R / 11), al = 1 - u; ctx.globalAlpha = al;
          switch (f.deb) {
            case 'bubble': ctx.strokeStyle = f.ac; ctx.lineWidth = 1.2; ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(px, -R * .8 + M.sin(a) * sp * .6 * ease(u) - 30 * u, 2 + hs(i, 4) * 3, 0, TAU); ctx.fill(); ctx.stroke(); break;
            case 'leaf': ctx.save(); ctx.translate(px, py * .8); ctx.rotate(u * 8 + i); ctx.fillStyle = i % 2 ? '#6ac84a' : f.sk; ctx.beginPath(); ctx.ellipse(0, 0, 4, 1.8, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
            case 'rock': ctx.save(); ctx.translate(px, py); ctx.rotate(u * 6 + i); ctx.fillStyle = i % 3 ? f.sk : f.ac; poly(ctx, [[-3, -2], [3, -3], [4, 2], [-2, 3]]); ctx.fill(); ctx.lineWidth = .9; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); break;
            case 'smoke': ctx.fillStyle = i % 2 ? 'rgba(120,70,170,.5)' : 'rgba(220,170,255,.5)'; ctx.beginPath(); ctx.arc(px * .7, -R * .8 - 40 * u + M.sin(a) * 8, 3 + u * 6, 0, TAU); ctx.fill(); break;
            default: ctx.fillStyle = i % 3 ? f.ac : i % 2 ? f.cl : '#fff'; ctx.save(); ctx.translate(px, py); ctx.rotate(u * 7 + i); ctx.fillRect(-2, -2, 4, 4); ctx.restore();
          }
        }
        ctx.globalAlpha = (1 - u) * .85; const sx = M.sin(u * 9 + f.seed) * 3; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(sx, -R * 1.6 - u * 34); ctx.quadraticCurveTo(sx + 4 * (1 - u), -R * 1.6 - u * 34 + 6, sx, -R * 1.6 - u * 34 + 11); ctx.quadraticCurveTo(sx - 4 * (1 - u), -R * 1.6 - u * 34 + 6, sx, -R * 1.6 - u * 34); ctx.fill(); /* hồn bay lên */
        ctx.restore();
      }
    }
  }

  window.DV_MART = { ok: () => true, body, onHit, onDie, drawFx, RACE, ROLE, skinFor, paint };
})();
