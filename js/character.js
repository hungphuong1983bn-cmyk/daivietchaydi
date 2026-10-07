/* Phase 7 — CHARACTER ENGINE  (window.DV_CHAR)
   Đọc dữ liệu từ DV_DATA.characters / charRules (data/characters.js). Không chứa chỉ số nhân vật nào.
   - Chỉ số, Thức Tỉnh, Thăng Giai, MAX: tính từ dữ liệu
   - Hình ảnh: ghép từ thư viện bộ phận (PARTS) theo `design`, vá thêm `visual` của từng bậc tiến hoá
   - Animation: 8 trạng thái idle/move/attack/skill/ultimate/hit/defeat/victory
   - Tích hợp game: DV_CHAR.drawGame(...) thay hero() nếu có dữ liệu, ngược lại game dùng hình cũ
   - Màn Hồ sơ: DV_CHAR.open(id) (cần DV_CHAR.bind({...}) từ index.html) */
(function () {
  'use strict';
  const D = window.DV_DATA || {}, M = Math, TAU = M.PI * 2;
  const RULES = () => D.charRules, LIST = () => D.characters || [];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - (1 - t) * (1 - t) * (1 - t), eio = t => t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  const STATES = ['idle', 'move', 'attack', 'skill', 'ultimate', 'hit', 'defeat', 'victory'];
  const PRIO = { idle: 0, move: 1, attack: 2, skill: 3, hit: 4, ultimate: 5, victory: 6, defeat: 7 };
  const STATE_VN = { idle: 'Đứng yên', move: 'Di chuyển', attack: 'Đánh thường', skill: 'Kỹ năng', ultimate: 'Tuyệt kỹ', hit: 'Trúng đòn', defeat: 'Gục ngã', victory: 'Chiến thắng' };
  let B = null; // cầu nối tới index.html: {sv,put,sfx,info,cap,legacy}
  /* Phase 9: lớp hình ảnh Q版 (js/chibi.js). Thiếu file → dùng hình vẽ cũ bên dưới. */
  const CB = window.DV_CHIBI && window.DV_CHIBI.ok() ? window.DV_CHIBI : null;
  let EQC = { t: -1, v: null };
  function eqOf() { // trang bị đang mặc → hình dáng trên nhân vật
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - EQC.t < 400) return EQC.v; EQC.t = now; let o = null;
    try { const sv = B && B.sv && B.sv(); if (sv && sv.eqp && sv.inv) { o = {}; for (const k in sv.eqp) { const it = sv.inv.find(i => i.u === sv.eqp[k]); if (it) o[k] = { r: it.r | 0, l: it.l | 0 } } } } catch (e) { o = null }
    return EQC.v = o;
  }
  const BURST_DUR = { lvl: 1.0, skl: 1.2, realm: 1.7 };

  /* ================= DỮ LIỆU & CHỈ SỐ ================= */
  const get = id => D.charById && D.charById[id] || null;
  const ok = () => !!(D.characters && D.charRules && D.charById && (!D.charValidate || D.charValidate().length === 0));
  const prog = id => { // tiến độ từ save
    const sv = B && B.sv(), H = sv && sv.hx && sv.hx[id] || {};
    return { l: H.l || 1, s: H.s || 0, aw: H.aw | 0, asc: H.asc | 0 };
  };
  const isMax = (id, p) => { const c = get(id), R = RULES(); if (!c || !B) return false; p = p || prog(id); return p.l >= B.cap(p.s) && p.aw >= R.awakeningStages && p.asc >= R.ascensionStages };
  const sumAw = (c, n) => { let m = 0; for (let i = 0; i < n && i < c.awakening.length; i++)m += c.awakening[i].mul || 0; return m };
  const sumAsc = (c, n) => { const o = { hp: 0, attack: 0, defense: 0, speed: 0, crit: 0, range: 0, attackSpeed: 0 }; for (let i = 0; i < n && i < c.ascension.length; i++) { const a = c.ascension[i].add || {}; for (const k in a) o[k] = (o[k] || 0) + a[k] } return o };
  /* Nền của 4 chỉ số "cũ" lấy từ HEROES đang chạy (admin có thể đã chỉnh), 3 chỉ số mới lấy từ rules.base trừ khi applyBase */
  function baseOf(c) {
    const R = RULES(), lg = B && B.legacy ? B.legacy(c.id) : null, ab = !!R.applyBase;
    return {
      hpB: lg ? lg.hp : c.stats.hp - R.base.hp, amB: lg ? lg.am : c.stats.attack / R.base.attack - 1,
      spB: lg ? lg.sp : c.stats.speed / R.base.speed - 1, crB: lg ? lg.cr : c.stats.crit,
      def: ab ? c.stats.defense : R.base.defense, rng: ab ? c.stats.range : R.base.range, as: ab ? c.stats.attackSpeed : R.base.attackSpeed
    };
  }
  /* Chỉ số hiệu lực — đúng bằng những gì chiến đấu dùng (không tính trang bị/Võ học) */
  function stats(id, p) {
    const c = get(id), R = RULES(); if (!c) return null; p = p || prog(id);
    const b = baseOf(c), a = sumAsc(c, p.asc), mx = (p.max != null ? p.max : isMax(id, p)) ? R.maxBonus : { hp: 0, attack: 0 };
    const m = (1 + R.levelGrowth * (p.l - 1)) * (1 + R.starGrowth * p.s), aw = sumAw(c, p.aw);
    return {
      hp: M.round((R.base.hp + b.hpB * m) * (1 + aw) * (1 + mx.hp)),
      attack: M.round(R.base.attack * (1 + b.amB * m) * (1 + aw) * (1 + mx.attack)),
      defense: M.round(b.def + a.defense),
      speed: M.round(R.base.speed * (1 + b.spB + a.speed) * 10) / 10,
      crit: M.min(.6, b.crB + a.crit),
      range: b.rng + a.range,
      attackSpeed: M.round((b.as + a.attackSpeed) * 100) / 100
    };
  }
  /* Phần cộng thêm cho bon() — bằng 0 khi chưa Thức Tỉnh/Thăng Giai (và applyBase tắt) ⇒ không đổi chiến đấu cũ */
  function delta(id, p) {
    const c = get(id), R = RULES(), z = { hpMul: 0, atkMul: 0, speed: 0, crit: 0, defense: 0, range: 0, as: 0 };
    if (!c || !R) return z; p = p || prog(id);
    const a = sumAsc(c, p.asc), aw = sumAw(c, p.aw), mx = isMax(id, p) ? R.maxBonus : { hp: 0, attack: 0 }, ab = !!R.applyBase;
    z.hpMul = (1 + aw) * (1 + mx.hp) - 1; z.atkMul = (1 + aw) * (1 + mx.attack) - 1;
    z.speed = a.speed; z.crit = a.crit;
    z.defense = (ab ? c.stats.defense - R.base.defense : 0) + a.defense;
    z.range = (ab ? c.stats.range - R.base.range : 0) + a.range;
    z.as = (ab ? c.stats.attackSpeed - R.base.attackSpeed : 0) + a.attackSpeed;
    return z;
  }
  function req(id, kind) { // điều kiện + chi phí bậc kế tiếp
    const c = get(id), pr = prog(id), sv = B.sv(), isA = kind === 'aw', list = isA ? c.awakening : c.ascension, n = isA ? pr.aw : pr.asc;
    if (n >= list.length) return { done: 1, ok: 0, why: 'Đã đạt bậc tối đa' };
    const st = list[n], r = st.req || {}, cost = st.cost || {};
    let why = '';
    if (!sv.hu[id]) why = 'Chưa sở hữu tướng';
    else if (r.level && pr.l < r.level) why = `Cần tướng Lv.${r.level}`;
    else if (r.awakening != null && pr.aw < r.awakening) why = `Cần Thức Tỉnh ${r.awakening}/${RULES().awakeningStages}`;
    else if (cost.hon && (sv.hon | 0) < cost.hon) why = `Thiếu 🔮 Hồn tướng (${sv.hon | 0}/${cost.hon})`;
    else if (cost.gold && sv.gold < cost.gold) why = `Thiếu 🪙 Vàng (${sv.gold}/${cost.gold})`;
    else if (cost.mt && (sv.mt | 0) < cost.mt) why = `Thiếu ⚙ Tinh thiết (${sv.mt | 0}/${cost.mt})`;
    return { ok: !why, why, st, cost, n };
  }
  function upgrade(id, kind) {
    const q = req(id, kind); if (!q.ok) return 0; const sv = B.sv(), c = q.cost;
    sv.hon = (sv.hon | 0) - (c.hon || 0); sv.gold -= c.gold || 0; sv.mt = (sv.mt | 0) - (c.mt || 0);
    const H = sv.hx[id] || (sv.hx[id] = { l: 1, e: 0 }); if (kind === 'aw') H.aw = (H.aw | 0) + 1; else H.asc = (H.asc | 0) + 1;
    B.put(); return 1;
  }

  /* ================= GỘP THIẾT KẾ THEO BẬC TIẾN HOÁ ================= */
  const RC = {};
  function resolve(id, aw, asc, max) {
    const key = id + '|' + aw + '|' + asc + '|' + (max ? 1 : 0); if (RC[key]) return RC[key];
    const c = get(id), d = JSON.parse(JSON.stringify(c.design));
    const ap = v => { for (const k in v) { if (k === 'palette' || k === 'aura') Object.assign(d[k], v[k]); else if (k === 'extra') v.extra.forEach(x => { if (d.extra.indexOf(x) < 0) d.extra.push(x) }); else d[k] = v[k] } };
    for (let i = 0; i < aw && i < c.awakening.length; i++)ap(c.awakening[i].visual || {});
    for (let i = 0; i < asc && i < c.ascension.length; i++)ap(c.ascension[i].visual || {});
    if (max) ap(c.max.visual || {});
    d.aw = aw; d.asc = asc; d.max = !!max; return RC[key] = d;
  }

  /* ================= MÀU & TIỆN ÍCH VẼ ================= */
  const MX = {};
  function hex(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)] }
  function rgba(h, a) { const k = h + a; if (MX[k]) return MX[k]; const c = hex(h); return MX[k] = `rgba(${c[0]},${c[1]},${c[2]},${a})` }
  function mix(h, t, to) { const k = h + '|' + t + to; if (MX[k]) return MX[k]; const a = hex(h), b = hex(to || '#ffffff'); return MX[k] = `rgb(${a.map((v, i) => M.round(lerp(v, b[i], t))).join()})` }
  const hs = (i, s) => { const x = M.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - M.floor(x) };
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++)c.lineTo(pts[i][0], pts[i][1]); c.closePath() }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() }
  const OUT = 'rgba(12,8,22,.78)';

  /* ================= TƯ THẾ / ANIMATION ================= */
  const WP = { // loại vũ khí: chiều dài, góc nghỉ, kiểu đòn đánh
    sword: { len: 23, rest: -1.05, atk: 'slash' }, glaive: { len: 40, rest: -1.25, atk: 'slash', sw: 1.2 }, spear: { len: 46, rest: -1.0, atk: 'thrust' },
    bow: { len: 16, rest: -.12, atk: 'shoot', am: .9 }, banner: { len: 40, rest: -1.4, atk: 'cast' }, shield: { len: 11, rest: -.35, atk: 'bash' }, twin: { len: 17, rest: -.95, atk: 'slash' }
  };
  function pose(c, d, st, s, T) {
    const A = c.anim && c.anim[st] || {}, k = clamp(s / T, 0, 1), w = WP[d.weapon];
    const p = { bob: 0, lean: 0, sx: 1, sy: 1, ox: 0, oy: 0, rot: 0, al: 1, wa: w.rest, ext: 0, leg: 0, flash: 0, cast: 0, k: k, w2: 0 };
    const ph = s * TAU / T;
    switch (st) {
      case 'idle': p.bob = M.sin(ph) * .9 * (A.amp || 1); p.wa = w.rest + M.sin(ph) * .06; p.sy = 1 + M.sin(ph) * .012; break;
      case 'move': { const wt = A.weight || 1, r = A.rate || 1, q = s * TAU / T * r; p.bob = -M.abs(M.sin(q)) * 2.4 / wt; p.leg = M.sin(q) * 5.5 / M.sqrt(wt); p.lean = .1; p.wa = w.rest + .35 + M.sin(q) * .08; p.sx = 1 + M.sin(q * 2) * .02; break }
      case 'attack': {
        const sw = (A.swing || 1) * (w.sw || 1), e = ease(k);
        if (w.atk === 'slash') { p.wa = lerp(-.8 - 1.6 * sw, -.8 + 1.65 * sw, e); p.lean = .2 * M.sin(k * M.PI); p.ox = 3 * M.sin(k * M.PI); p.w2 = lerp(-.8 + 1.6 * sw, -.8 - 1.6 * sw, e) }
        else if (w.atk === 'thrust') { p.wa = -.12 - .25 * (1 - e); p.ext = M.sin(k * M.PI) * 12 * sw; p.lean = .18 * M.sin(k * M.PI); p.ox = 4 * M.sin(k * M.PI) }
        else if (w.atk === 'shoot') { p.wa = -.05; p.ext = k < .55 ? k / .55 : 1 - (k - .55) / .45; p.lean = -.05; p.ox = k > .55 ? -2 * (1 - k) : 0 }
        else if (w.atk === 'cast') { p.wa = lerp(-1.6, .3, e); p.lean = .12 * M.sin(k * M.PI); p.cast = M.sin(k * M.PI) }
        else { p.ox = 9 * M.sin(k * M.PI) * sw; p.sx = 1 + .06 * M.sin(k * M.PI); p.wa = -.3 + .5 * M.sin(k * M.PI); p.lean = .12 * M.sin(k * M.PI) }
        break
      }
      case 'skill': { const cs = A.cast || 1; p.wa = lerp(w.rest, -1.57, M.sin(clamp(k * 2, 0, 1) * M.PI / 2)); p.sy = 1 - .07 * M.sin(k * M.PI); p.lean = -.14 * M.sin(k * M.PI) * cs; p.cast = M.sin(k * M.PI) * cs; p.oy = -2 * M.sin(k * M.PI); break }
      case 'ultimate': { const cs = A.cast || 1; if (k < .25) { p.sy = 1 - .2 * (k / .25); p.sx = 1 + .1 * (k / .25); p.wa = w.rest - .4 * (k / .25) } else { const j = (k - .25) / .75; p.oy = -16 * M.sin(j * M.PI); p.wa = -1.57; p.sy = 1 + .08 * M.sin(j * M.PI); p.cast = (j < .5 ? j * 2 : 1) * cs } p.flash = k > .25 && k < .45 ? .55 : 0; break }
      case 'hit': { const e = 1 - k, sg = A.stagger || 1; p.ox = -6 * e * sg; p.lean = -.26 * e * sg; p.sx = 1 + .1 * e; p.sy = 1 - .08 * e; p.flash = e > .45 ? e : 0; p.wa = w.rest + .5 * e; break }
      case 'defeat': { const e = ease(k); p.rot = e * 1.45; p.ox = -e * 7; p.al = 1 - .65 * k; p.wa = lerp(w.rest, 1.5, e); p.sy = 1 - .08 * e; break }
      case 'victory': p.oy = -M.abs(M.sin(ph)) * 5; p.wa = -1.57 + M.sin(ph * 2) * .12; p.cast = .5 + .5 * M.sin(ph); p.lean = -.05; break;
    }
    return p;
  }

  /* ================= BỘ PHẬN: THÂN ================= */
  function legs(X, col, wd, hipY) {
    const c = X.c, p = X.p, bw = X.bw; c.strokeStyle = X.m(col); c.lineWidth = wd; c.lineCap = 'round';
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * bw * .38, hipY); c.lineTo(s * bw * .42 + p.leg * s * s * .5 * (s > 0 ? 1 : -1), -1 - p.bob - (s * p.leg > 0 ? M.abs(p.leg) * .35 : 0)); c.stroke() }
    c.lineCap = 'butt';
  }
  const BODY = {
    armor(X) {
      const c = X.c, P = X.pal, bw = X.bw, y0 = -27, y1 = -10;
      legs(X, P.sub, 3.4, y1);
      c.fillStyle = X.m(P.main); poly(c, [[-bw, y0], [bw, y0], [bw * .82, y1], [-bw * .82, y1]]); c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();
      c.strokeStyle = rgba(P.sub, .9); c.lineWidth = 1; for (let i = 1; i < 4; i++) { const y = y0 + i * 4; c.beginPath(); c.moveTo(-bw * (1 - i * .045), y); c.lineTo(bw * (1 - i * .045), y); c.stroke() }
      c.fillStyle = X.m(P.accent); c.fillRect(-bw * .85, y1 - 3, bw * 1.7, 3);
      c.fillStyle = X.m(P.sub); poly(c, [[-bw * .8, y1], [-bw * .1, y1], [-bw * .3, y1 + 9], [-bw * 1.0, y1 + 8]]); c.fill(); poly(c, [[bw * .1, y1], [bw * .8, y1], [bw * 1.0, y1 + 8], [bw * .3, y1 + 9]]); c.fill();
    },
    robe(X) {
      const c = X.c, P = X.pal, bw = X.bw, y0 = -27, ph = X.t * 2 + (X.p.leg ? X.p.leg * .1 : 0), sw = M.sin(ph) * 1.2 + X.p.leg * .25;
      c.fillStyle = X.m(P.main); poly(c, [[-bw * .85, y0], [bw * .85, y0], [bw * 1.75 + sw, -2], [-bw * 1.75 + sw, -2]]); c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUT; c.stroke();
      c.fillStyle = X.m(P.sub); poly(c, [[-bw * .3, y0 + 2], [bw * .3, y0 + 2], [bw * .55 + sw * .8, -2], [-bw * .55 + sw * .8, -2]]); c.fill();
      c.fillStyle = X.m(P.accent); poly(c, [[-bw * 1.75 + sw, -5], [bw * 1.75 + sw, -5], [bw * 1.78 + sw, -2], [-bw * 1.78 + sw, -2]]); c.fill(); c.fillRect(-bw * .85, y0 + 5, bw * 1.7, 2);
      c.fillStyle = X.m(P.sub); poly(c, [[-bw * .85, y0], [-bw * 1.5, -15], [-bw * 1.1, -14], [-bw * .6, y0 + 8]]); c.fill();
    },
    light(X) {
      const c = X.c, P = X.pal, bw = X.bw * .8, y0 = -27, y1 = -11;
      legs(X, P.sub, 2.8, y1);
      c.fillStyle = X.m(P.main); poly(c, [[-bw, y0], [bw, y0], [bw * .85, y1], [-bw * .85, y1]]); c.fill(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke();
      c.strokeStyle = X.m(P.accent); c.lineWidth = 2.2; c.beginPath(); c.moveTo(-bw, y0 + 1); c.lineTo(bw * .8, y1 - 1); c.stroke();
      c.fillStyle = X.m(P.sub); poly(c, [[-bw * .9, y1 - 1], [bw * .9, y1 - 1], [bw * 1.3, y1 + 6], [-bw * 1.2, y1 + 5]]); c.fill();
      c.fillStyle = X.m(P.accent); c.fillRect(-bw * .9, y1 - 2, bw * 1.8, 2);
    },
    heavy(X) {
      const c = X.c, P = X.pal, bw = X.bw * 1.12, y0 = -27, y1 = -10;
      legs(X, P.sub, 4.6, y1);
      c.fillStyle = X.m(P.main); poly(c, [[-bw, y0], [bw, y0], [bw * .95, y1], [-bw * .95, y1]]); c.fill(); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
      c.fillStyle = X.m(P.metal); poly(c, [[-bw * .6, y0 + 1], [bw * .6, y0 + 1], [bw * .5, y0 + 10], [-bw * .5, y0 + 10]]); c.fill(); c.lineWidth = 1; c.stroke();
      c.fillStyle = X.m(P.accent); rrect(c, -bw * .95, y1 - 4, bw * 1.9, 4, 1.5); c.fill(); c.fillStyle = X.m(P.metal); c.fillRect(-2, y1 - 4.5, 4, 5);
      c.fillStyle = X.m(P.sub); c.fillRect(-bw * .9, y1, bw * .75, 7); c.fillRect(bw * .15, y1, bw * .75, 7);
    }
  };
  /* ================= BỘ PHẬN: VAI / LƯNG ================= */
  const SHOULDER = {
    none() { },
    pauldron(X) { const c = X.c, P = X.pal, y = -26 + 0, r = 5.2 * X.sc; for (const s of [-1, 1]) { c.fillStyle = X.m(P.accent); c.beginPath(); c.arc(s * X.bw * 1.05, y, r, M.PI, 0); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); c.fillStyle = rgba('#000000', .18); c.fillRect(s * X.bw * 1.05 - r, y - 1, r * 2, 2) } },
    spike(X) { SHOULDER.pauldron(X); const c = X.c, P = X.pal; c.fillStyle = X.m(P.metal); for (const s of [-1, 1]) { const x = s * X.bw * 1.05; poly(c, [[x - 2.2, -29], [x + 2.2, -29], [x + s * 1.5, -37]]); c.fill() } },
    sash(X) { const c = X.c, P = X.pal, f = M.sin(X.t * 5) * 2.5 + X.p.leg * .3; c.fillStyle = X.m(P.accent); c.beginPath(); c.moveTo(-X.bw * .9, -26); c.quadraticCurveTo(-X.bw * 1.4 - 3, -21, -X.bw * 1.3 - 5 + f, -9); c.lineTo(-X.bw * 1.0 - 5 + f, -8); c.quadraticCurveTo(-X.bw * .7, -21, -X.bw * .4, -26); c.fill() }
  };
  const BACK = {
    none() { },
    cape(X) { const c = X.c, P = X.pal, f = M.sin(X.t * 3) * 2 + X.p.leg * .5 - X.p.lean * 6; c.fillStyle = X.m(P.sub); c.beginPath(); c.moveTo(-X.bw * .7, -27); c.quadraticCurveTo(-X.bw * 1.8 - 3, -16, -X.bw * 2 - 7 + f, -3); c.lineTo(-X.bw * .2, -4); c.closePath(); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); c.fillStyle = X.m(P.accent); c.fillRect(-X.bw * .8, -28, X.bw * .5, 2.5) },
    scarf(X) { const c = X.c, P = X.pal, t = X.t * 4; c.strokeStyle = X.m(P.accent); c.lineWidth = 3; c.lineCap = 'round'; for (let j = 0; j < 2; j++) { c.beginPath(); c.moveTo(-1, -27 + j * 2); for (let i = 1; i <= 10; i++)c.lineTo(-i * 3.6 - X.p.leg * .2, -26 + j * 3 + i * .5 + M.sin(t - i * .7 + j) * (1.2 + i * .4)); c.globalAlpha = j ? .6 : 1; c.stroke() } c.globalAlpha = 1; c.lineCap = 'butt' },
    quiver(X) { const c = X.c, P = X.pal; c.save(); c.translate(-X.bw * .6, -19); c.rotate(-.5); c.fillStyle = X.m(P.sub); rrect(c, -3, -11, 6, 20, 2); c.fill(); c.lineWidth = 1.1; c.strokeStyle = OUT; c.stroke(); c.strokeStyle = X.m(P.metal); c.lineWidth = 1; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 1.6, -11); c.lineTo(i * 2.2, -17); c.stroke() } c.fillStyle = X.m(P.accent); c.fillRect(-3, -2, 6, 2); c.restore() },
    banner(X) { const c = X.c, P = X.pal, f = M.sin(X.t * 4) * 3; c.strokeStyle = X.m(P.metal); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-X.bw * .7, -10); c.lineTo(-X.bw * .7 - 3, -52); c.stroke(); c.fillStyle = X.m(P.accent); c.beginPath(); c.moveTo(-X.bw * .7 - 3, -50); c.quadraticCurveTo(-X.bw * .7 - 14, -47 + f, -X.bw * .7 - 21 + f, -43); c.quadraticCurveTo(-X.bw * .7 - 12, -41 - f, -X.bw * .7 - 3, -36); c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke() },
    twin(X) { const c = X.c, P = X.pal; for (const s of [-1, 1]) { c.save(); c.translate(-2, -22); c.rotate(s * .6 - 2.3 + 1.57 * 0); c.fillStyle = X.m(P.metal); poly(c, [[0, -1.6], [24, -1], [27, 0], [24, 1], [0, 1.6]]); c.fill(); c.fillStyle = X.m(P.accent); c.fillRect(-3, -2.6, 4, 5.2); c.restore() } },
    sunburst(X) { const c = X.c, P = X.pal, n = 12, r0 = 17, rot = X.t * .5; c.save(); c.translate(-2, -26); c.fillStyle = rgba(P.accent, .85); for (let i = 0; i < n; i++) { const a = rot + i * TAU / n, l = i % 2 ? 24 : 31; poly(c, [[M.cos(a - .1) * r0, M.sin(a - .1) * r0], [M.cos(a) * l, M.sin(a) * l], [M.cos(a + .1) * r0, M.sin(a + .1) * r0]]); c.fill() } c.strokeStyle = X.m(P.accent); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r0, 0, TAU); c.stroke(); c.restore() }
  };
  /* ================= BỘ PHẬN: ĐẦU ================= */
  function face(X, cy) { const c = X.c, P = X.pal; c.fillStyle = X.m(P.skin); c.beginPath(); c.arc(0, cy, 6, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = OUT; c.stroke(); c.fillStyle = '#2a1a14'; c.fillRect(2.2, cy - 1, 1.8, 2.2) }
  const HEAD = {
    topknot(X) { const c = X.c, P = X.pal, y = -31; face(X, y); c.fillStyle = '#1e1618'; c.beginPath(); c.arc(0, y - 1.5, 6.3, M.PI * 1.02, M.PI * 1.98); c.fill(); c.beginPath(); c.arc(-1, y - 9, 3.2, 0, TAU); c.fill(); c.fillStyle = X.m(P.accent); c.fillRect(-5.5, y - 4.5, 11, 2); c.beginPath(); c.arc(0, y - 3.6, 1.5, 0, TAU); c.fill(); c.fillRect(-2.2, y - 7.4, 4.4, 1.6) },
    crest(X) { const c = X.c, P = X.pal, y = -31, f = M.sin(X.t * 5) * 1.5 + X.p.leg * .15; face(X, y); c.fillStyle = X.m(P.metal); c.beginPath(); c.arc(0, y - 1, 6.8, M.PI, 0); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); c.fillRect(-7, y - 1.2, 3, 7); c.fillStyle = X.m(P.main); c.beginPath(); c.moveTo(-1.5, y - 7); c.quadraticCurveTo(-9 + f, y - 14, -13 + f, y - 9 - f * .4); c.quadraticCurveTo(-7, y - 8, -3, y - 5); c.fill(); c.fillStyle = X.m(P.accent); c.fillRect(-6.5, y - 2.4, 13, 1.8) },
    headband(X) { const c = X.c, P = X.pal, y = -31, t = X.t * 5; face(X, y); c.fillStyle = '#16120f'; c.beginPath(); c.arc(0, y - 1.2, 6.4, M.PI * 1.02, M.PI * 1.98); c.fill(); c.fillRect(-6.4, y - 1.5, 3, 5); c.fillStyle = X.m(P.accent); c.fillRect(-6.5, y - 4.2, 13, 2.2); c.strokeStyle = X.m(P.accent); c.lineWidth = 2.2; c.lineCap = 'round'; for (let j = 0; j < 2; j++) { c.beginPath(); c.moveTo(-5, y - 3 + j); for (let i = 1; i <= 7; i++)c.lineTo(-5 - i * 2.8, y - 2.5 + j * 2 + i * .6 + M.sin(t - i * .8 + j) * (i * .35)); c.stroke() } c.lineCap = 'butt' },
    wing(X) { const c = X.c, P = X.pal, y = -31; face(X, y); c.fillStyle = '#17121f'; c.beginPath(); c.arc(0, y - 1, 6.6, M.PI, 0); c.fill(); c.fillRect(-6.6, y - 1.2, 13.2, 1.5); c.fillStyle = X.m(P.sub); c.lineWidth = 1.1; c.strokeStyle = OUT; for (const s of [-1, 1]) { rrect(c, s > 0 ? 5 : -17, y - 4.5, 12, 3, 1.2); c.fill(); c.stroke() } c.fillStyle = X.m(P.accent); c.fillRect(-6.6, y - 3.4, 13.2, 1.8); c.beginPath(); c.arc(0, y - 7, 1.6, 0, TAU); c.fill() },
    round(X) { const c = X.c, P = X.pal, y = -30.5; face(X, y); c.fillStyle = X.m(P.metal); c.beginPath(); c.arc(0, y - 1.5, 7.2, M.PI, 0); c.fill(); c.lineWidth = 1.3; c.strokeStyle = OUT; c.stroke(); c.fillStyle = X.m(P.accent); c.fillRect(-8.2, y - 2, 16.4, 2.4); rrect(c, -7, y - 1, 3.2, 8, 1.2); c.fillStyle = X.m(P.metal); c.fill(); c.stroke(); c.fillStyle = X.m(P.accent); c.beginPath(); c.arc(0, y - 8.3, 1.7, 0, TAU); c.fill() },
    hood(X) { const c = X.c, P = X.pal, y = -30; face(X, y + .5); c.fillStyle = X.m(P.main); c.beginPath(); c.moveTo(-8, y + 4); c.quadraticCurveTo(-9, y - 8, -1, y - 12); c.quadraticCurveTo(8, y - 8, 7.5, y - 1); c.quadraticCurveTo(4, y - 5, 1, y - 3); c.quadraticCurveTo(-3, y - 3, -5, y + 4); c.closePath(); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUT; c.stroke(); c.strokeStyle = X.m(P.accent); c.lineWidth = 1.8; c.beginPath(); c.moveTo(-1, y - 11); c.lineTo(-7, y - 18 + M.sin(X.t * 6)); c.stroke() },
    tiered(X) { const c = X.c, P = X.pal, y = -31, f = M.sin(X.t * 4) * 1; face(X, y); c.fillStyle = X.m(P.accent); c.lineWidth = 1.1; c.strokeStyle = OUT; rrect(c, -7, y - 7, 14, 4.2, 1.5); c.fill(); c.stroke(); rrect(c, -4.8, y - 12, 9.6, 5, 1.5); c.fill(); c.stroke(); c.fillStyle = X.m(P.main); c.beginPath(); c.arc(0, y - 8.6, 1.5, 0, TAU); c.fill(); c.fillStyle = X.m('#ff4a4a'); c.beginPath(); c.arc(0, y - 14, 1.8, 0, TAU); c.fill(); c.strokeStyle = X.m(P.metal); c.lineWidth = 1.2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 7, y - 5); c.lineTo(s * 8.4 + f * s, y + 3); c.stroke() } }
  };

  /* ================= VŨ KHÍ ================= */
  function hand(X, S, ang) { // vị trí bàn tay tính từ vai
    const aa = lerp(.9, ang, X.d && WP[X.d.weapon].am || .45), L = 9.5; return { x: S.x + M.cos(aa) * L, y: S.y + M.sin(aa) * L, aa };
  }
  function glowLine(X, x0, y0, x1, y1, w) { if (X.d.glow > .05) { const c = X.c; c.save(); c.strokeStyle = rgba(X.pal.accent, .35 * X.d.glow); c.lineWidth = w + 5 + X.d.glow * 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore() } }
  const WEAPON = {
    sword(X, H, a, p) { const c = X.c, P = X.pal, L = WP.sword.len + p.ext, ca = M.cos(a), sa = M.sin(a); c.save(); c.translate(H.x, H.y); c.rotate(a); glowLine(X, 2, 0, L, 0, 2); c.fillStyle = X.m(P.metal); poly(c, [[2, -1.8], [L - 4, -1.6], [L, 0], [L - 4, 1.6], [2, 1.8]]); c.fill(); c.lineWidth = .9; c.strokeStyle = OUT; c.stroke(); c.fillStyle = X.m(P.accent); c.fillRect(0, -4, 3, 8); c.fillRect(-5, -1.3, 5, 2.6); c.restore(); return { x: H.x + ca * L, y: H.y + sa * L, r: L } },
    glaive(X, H, a, p) { const c = X.c, P = X.pal, L = WP.glaive.len + p.ext, ca = M.cos(a), sa = M.sin(a); c.save(); c.translate(H.x, H.y); c.rotate(a); c.strokeStyle = X.m('#5a3a1e'); c.lineWidth = 2.6; c.beginPath(); c.moveTo(-12, 0); c.lineTo(L - 6, 0); c.stroke(); glowLine(X, L - 14, -4, L, 0, 2); c.fillStyle = X.m(P.metal); c.beginPath(); c.moveTo(L - 17, 0); c.quadraticCurveTo(L - 14, -12, L + 1, -9); c.quadraticCurveTo(L - 3, -3, L + 2, 1); c.quadraticCurveTo(L - 8, 3, L - 17, 0); c.fill(); c.lineWidth = .9; c.strokeStyle = OUT; c.stroke(); c.fillStyle = X.m(P.main); c.fillRect(L - 20, -1.8, 3.5, 3.6); c.strokeStyle = X.m(P.main); c.lineWidth = 1.6; c.beginPath(); c.moveTo(L - 19, 1); c.lineTo(L - 22 - M.sin(X.t * 7) * 1.5, 7); c.stroke(); c.restore(); return { x: H.x + ca * L, y: H.y + sa * L, r: L } },
    spear(X, H, a, p) { const c = X.c, P = X.pal, L = WP.spear.len + p.ext, ca = M.cos(a), sa = M.sin(a); c.save(); c.translate(H.x, H.y); c.rotate(a); c.strokeStyle = X.m('#6a4a2a'); c.lineWidth = 2.2; c.beginPath(); c.moveTo(-14, 0); c.lineTo(L - 10, 0); c.stroke(); glowLine(X, L - 12, 0, L, 0, 2); c.fillStyle = X.m(P.metal); poly(c, [[L - 12, -2.6], [L - 3, -3], [L + 3, 0], [L - 3, 3], [L - 12, 2.6]]); c.fill(); c.lineWidth = .9; c.strokeStyle = OUT; c.stroke(); c.strokeStyle = X.m(P.accent); c.lineWidth = 1.8; for (let i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(L - 13, 0); c.lineTo(L - 19 - M.sin(X.t * 8 + i) * 2, i * 4 + M.sin(X.t * 6 + i) * 1.5); c.stroke() } c.restore(); return { x: H.x + ca * L, y: H.y + sa * L, r: L } },
    bow(X, H, a, p) { const c = X.c, P = X.pal, st = X.state === 'attack' ? p.ext : 0; c.save(); c.translate(H.x + 2, H.y); c.rotate(a); c.strokeStyle = X.m('#8a6a3a'); c.lineWidth = 2.4; c.beginPath(); c.arc(-4, 0, 15, -1.05, 1.05); c.stroke(); glowLine(X, 0, 0, 0, 0, 1); const ty = M.sin(1.05) * 15, tx = M.cos(1.05) * 15 - 4, pull = st * 8; c.strokeStyle = rgba(P.metal, .9); c.lineWidth = 1; c.beginPath(); c.moveTo(tx, -ty); c.lineTo(tx - pull - 4, 0); c.lineTo(tx, ty); c.stroke(); if (X.state === 'attack' && p.k < .6 || X.state !== 'attack') { c.strokeStyle = X.m(P.metal); c.lineWidth = 1.3; c.beginPath(); c.moveTo(tx - pull - 4, 0); c.lineTo(tx + 14 - pull * .2, 0); c.stroke(); c.fillStyle = X.m(P.accent); poly(c, [[tx + 14 - pull * .2, -1.8], [tx + 19 - pull * .2, 0], [tx + 14 - pull * .2, 1.8]]); c.fill() } c.restore(); return { x: H.x + 11, y: H.y, r: 18 } },
    banner(X, H, a, p) { const c = X.c, P = X.pal, L = WP.banner.len + p.ext, ca = M.cos(a), sa = M.sin(a), f = M.sin(X.t * 5) * 2.5; c.save(); c.translate(H.x, H.y); c.rotate(a); c.strokeStyle = X.m('#5a3a2a'); c.lineWidth = 2.4; c.beginPath(); c.moveTo(-10, 0); c.lineTo(L, 0); c.stroke(); c.fillStyle = X.m(P.accent); c.beginPath(); c.moveTo(L - 3, 0); c.quadraticCurveTo(L - 16, -9 + f, L - 25 + f, -6); c.quadraticCurveTo(L - 17, -2, L - 25 + f, 4 - f * .5); c.quadraticCurveTo(L - 14, 5, L - 3, 1.5); c.fill(); c.lineWidth = .9; c.strokeStyle = OUT; c.stroke(); const og = 3.4 + p.cast * 2 + X.d.glow * 1.5; const g = c.createRadialGradient(L + 3, 0, 0, L + 3, 0, og * 3); g.addColorStop(0, rgba('#ffffff', .95)); g.addColorStop(.35, rgba(P.accent, .8)); g.addColorStop(1, rgba(P.accent, 0)); c.fillStyle = g; c.fillRect(L - og * 3, -og * 3, og * 6 + 6, og * 6); c.fillStyle = X.m(P.metal); c.beginPath(); c.arc(L + 3, 0, 2.6, 0, TAU); c.fill(); c.restore(); return { x: H.x + ca * (L + 3), y: H.y + sa * (L + 3), r: L } },
    shield(X, H, a, p) { const c = X.c, P = X.pal; c.save(); c.translate(H.x + 3 + p.ox * .2, H.y - 1); c.fillStyle = X.m(P.accent); c.beginPath(); c.arc(0, 0, 10.5, 0, TAU); c.fill(); c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke(); c.fillStyle = X.m(P.metal); c.beginPath(); c.arc(0, 0, 7.4, 0, TAU); c.fill(); c.stroke(); c.fillStyle = X.m(P.main); c.beginPath(); c.arc(0, 0, 3.2, 0, TAU); c.fill(); if (X.d.glow > .05) { c.strokeStyle = rgba(P.accent, .35 + X.d.glow * .5); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 12.5, 0, TAU); c.stroke() } c.restore(); const S = { x: H.x + 5, y: H.y - 6 }; c.save(); c.translate(S.x, S.y); c.rotate(a - .8); glowLine(X, 0, 0, 12, 0, 2); c.fillStyle = X.m(P.metal); poly(c, [[0, -1.8], [10, -1.4], [14, 0], [10, 1.4], [0, 1.8]]); c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke(); c.restore(); return { x: H.x + 12, y: H.y - 2, r: 14 } },
    twin(X, H, a, p) { const c = X.c, P = X.pal, L = WP.twin.len, out = []; for (let i = 0; i < 2; i++) { const ang = i ? (X.state === 'attack' ? p.w2 : a - .5 + 1.2) : a, hx = H.x - i * 3, hy = H.y + i * 2; c.save(); c.translate(hx, hy); c.rotate(ang); glowLine(X, 2, 0, L, 0, 2); c.fillStyle = X.m(P.metal); poly(c, [[2, -1.7], [L - 4, -1.5], [L, 0], [L - 4, 1.5], [2, 1.7]]); c.fill(); c.lineWidth = .8; c.strokeStyle = OUT; c.stroke(); c.fillStyle = X.m(P.accent); c.fillRect(0, -3.4, 2.8, 6.8); c.fillRect(-4, -1.1, 4, 2.2); c.restore(); out.push({ x: hx + M.cos(ang) * L, y: hy + M.sin(ang) * L }) } return { x: out[0].x, y: out[0].y, r: L, x2: out[1].x, y2: out[1].y } }
  };

  /* ================= PHỤ KIỆN TIẾN HOÁ (extra) ================= */
  const EXTRA_BEHIND = {
    wings(X) { const c = X.c, P = X.pal, f = M.sin(X.t * 3) * .12 + (X.state === 'victory' ? .2 : 0), col = X.d.aura.color; for (const s of [0, 1]) { c.save(); c.translate(-2, -24); c.rotate(-.3 - s * .35 + f * (s ? 1 : -1)); c.fillStyle = rgba(col, .26 + X.d.glow * .15); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-22, -16 - s * 6, -34 + s * 6, -3 + s * 10); c.quadraticCurveTo(-18, -2, 0, 3); c.fill(); c.strokeStyle = rgba(P.accent, .55); c.lineWidth = 1; c.stroke(); c.restore() } },
    halo(X) { const c = X.c, P = X.pal, y = (X.top ? X.top - 3 : -42) + M.sin(X.t * 2) * .6; c.save(); c.translate(-2, y); c.strokeStyle = rgba(P.accent, .9); c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 11, 3.6, 0, 0, TAU); c.stroke(); c.strokeStyle = rgba('#ffffff', .6); c.lineWidth = .8; c.beginPath(); c.ellipse(0, 0, 8, 2.4, 0, 0, TAU); c.stroke(); const g = c.createRadialGradient(0, 0, 2, 0, 0, 20); g.addColorStop(0, rgba(P.accent, .25)); g.addColorStop(1, rgba(P.accent, 0)); c.fillStyle = g; c.fillRect(-20, -14, 40, 28); c.restore() },
    crown(X) { const c = X.c, P = X.pal, col = X.d.aura.color, y = X.top ? X.top - 7 : -50; c.save(); c.translate(-1, y); c.fillStyle = rgba(col, .3 + X.d.glow * .2); for (let i = 0; i < 5; i++) { const x = (i - 2) * 6, r = 5 + (i % 2) * 2 - M.abs(i - 2) * .6; c.beginPath(); c.arc(x, M.sin(X.t * 2 + i) * 1.2, r, 0, TAU); c.fill() } c.strokeStyle = rgba(P.accent, .8); c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { if (((X.t * 8 + i * 3) | 0) % 4 === 0) continue; const x = (i - 1) * 8; c.beginPath(); c.moveTo(x, 4); c.lineTo(x + 2, 9); c.lineTo(x - 1, 12); c.lineTo(x + 1, 17); c.stroke() } c.restore() },
    pennants(X) { const c = X.c, P = X.pal; c.strokeStyle = rgba(P.accent, .9); c.lineWidth = 2.4; c.lineCap = 'round'; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(-X.bw * .5, -13 + j * 1.5); for (let i = 1; i <= 7; i++)c.lineTo(-X.bw * .5 - i * 3 - X.p.leg * .3, -13 + j * 2 + i * (.6 + j * .35) + M.sin(X.t * 5 - i * .8 + j * 1.5) * (1 + i * .4)); c.stroke() } c.lineCap = 'butt' },
    coil(X) { const c = X.c, P = X.pal, col = X.d.aura.color; c.save(); c.translate(-2, -20); c.strokeStyle = rgba(col, .75); c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 28; i++) { const u = i / 28, a = X.t * 2.2 + u * 9, x = M.cos(a) * (13 + u * 4), y = 22 - u * 62 + M.sin(a) * 2.4; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.globalAlpha = .55; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = rgba(P.accent, .9); c.globalAlpha = .8; c.stroke(); c.restore() }
  };
  const EXTRA_FRONT = {
    blades(X) { const c = X.c, P = X.pal, n = X.max ? 6 : 3, r = 19 + (X.max ? 4 : 0), q = X.q === 0 ? M.min(n, 2) : n; for (let i = 0; i < q; i++) { const a = X.t * 2.4 + i * TAU / q, x = M.cos(a) * r, y = -21 + M.sin(a) * r * .38, z = M.sin(a); if (z < 0 && X.pass === 'front') continue; if (z >= 0 && X.pass === 'back') continue; c.save(); c.translate(x, y); c.rotate(a + M.PI / 2); c.globalAlpha = .6 + z * .35; c.fillStyle = rgba(P.accent, .35 + X.d.glow * .3); c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.fill(); c.fillStyle = X.m(P.metal); poly(c, [[0, -6], [1.6, 0], [0, 4], [-1.6, 0]]); c.fill(); c.restore() } },
    flames(X) { const c = X.c, col = X.d.aura.color, P = X.pal; const spots = [[-X.bw * 1.05, -29], [X.bw * 1.05, -29], [-2, -38]]; for (let s = 0; s < spots.length; s++) { const [x0, y0] = spots[s]; for (let i = 0; i < 3; i++) { const ph = X.t * 5 + s * 2 + i, h = 7 + M.sin(ph) * 3 + i * 1.5; c.fillStyle = rgba(i ? P.accent : col, .65 - i * .15); c.beginPath(); c.moveTo(x0 - 2.4 + i, y0); c.quadraticCurveTo(x0 - 3 + i + M.sin(ph) * 2, y0 - h * .6, x0 + M.sin(ph * 1.3) * 2, y0 - h); c.quadraticCurveTo(x0 + 3, y0 - h * .5, x0 + 2.4 - i, y0); c.fill() } } },
    embers(X) { const c = X.c, col = X.d.aura.color, n = [0, 6, 12][X.q === undefined ? 2 : X.q]; for (let i = 0; i < n; i++) { const u = (X.t * .55 + i * .173) % 1, x = M.sin(i * 12.9 + X.t * .8) * 16, y = -4 - u * 52; c.fillStyle = rgba(i % 3 ? col : X.pal.accent, (1 - u) * .85); c.beginPath(); c.arc(x, y, 1.1 + (1 - u) * 1.1, 0, TAU); c.fill() } }
  };
  function groundRunes(X) { // vòng ấn dưới chân (extra: runes)
    const c = X.c, col = X.pal.accent, r = X.max ? 30 : 23, rot = X.t * .8; c.save(); c.translate(0, 1); c.scale(1, .36); c.strokeStyle = rgba(col, .75); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.lineWidth = 1; c.strokeStyle = rgba(col, .5); c.beginPath(); c.arc(0, 0, r - 5, 0, TAU); c.stroke();
    c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = rot + i * TAU / 8; c.beginPath(); c.moveTo(M.cos(a) * (r - 5), M.sin(a) * (r - 5)); c.lineTo(M.cos(a) * (r + 3), M.sin(a) * (r + 3)); c.stroke() } if (X.max) { c.strokeStyle = rgba('#ffffff', .6); c.beginPath(); for (let i = 0; i < 6; i++) { const a = -rot + i * TAU / 3 * 1; const x = M.cos(a) * (r - 5), y = M.sin(a) * (r - 5); i ? c.lineTo(x, y) : c.moveTo(x, y) } c.closePath(); c.stroke() } c.restore();
  }

  /* ================= AURA THEO LOẠI ================= */
  const AURA = {
    wind(X, n) { const c = X.c, col = X.d.aura.color; c.lineWidth = 1.6; c.lineCap = 'round'; for (let i = 0; i < n; i++) { const a = X.t * 2.6 + i * 2.4, r = 15 + (i % 5) * 3.4, y = -8 - (i % 7) * 5.2; c.strokeStyle = rgba(col, .55); c.beginPath(); c.ellipse(0, y, r, r * .3, 0, a, a + .9); c.stroke() } c.lineCap = 'butt' },
    dragon(X, n) { const c = X.c, col = X.d.aura.color; for (let i = 0; i < n; i++) { const u = (X.t * .7 + i * .137) % 1, x = M.sin(i * 7.3 + X.t * 2) * (9 + (i % 4) * 3), y = -2 - u * 46, s = (1 - u) * 3.6 + .6; c.fillStyle = rgba(i % 3 ? col : X.pal.accent, (1 - u) * .7); c.beginPath(); c.ellipse(x, y, s * .7, s * 1.6, M.sin(i + X.t * 3) * .4, 0, TAU); c.fill() } },
    tide(X, n) { const c = X.c, col = X.d.aura.color; c.save(); c.translate(0, 1); c.scale(1, .34); for (let i = 0; i < M.ceil(n / 4); i++) { const u = (X.t * .5 + i * .31) % 1; c.strokeStyle = rgba(col, (1 - u) * .7); c.lineWidth = 2.4 * (1 - u) + .6; c.beginPath(); c.arc(0, 0, 8 + u * 26, 0, TAU); c.stroke() } c.restore(); for (let i = 0; i < n; i++) { const u = (X.t * .9 + i * .21) % 1, a = i * 2.7, x = M.cos(a) * (10 + (i % 3) * 5), y = -u * 30 + u * u * 24 - 2; c.fillStyle = rgba(col, (1 - u) * .8); c.beginPath(); c.arc(x, y, 1.5, 0, TAU); c.fill() } },
    thunder(X, n) { const c = X.c, col = X.d.aura.color; c.lineWidth = 1.5; for (let i = 0; i < n; i++) { if ((((X.t * 14 + i * 3.7) | 0) % 3) !== 0) continue; const a = hs(i, (X.t * 14) | 0) * TAU, r = 14 + hs(i, 3) * 10, x = M.cos(a) * r, y = -20 + M.sin(a) * r * .9; c.strokeStyle = rgba(i % 2 ? '#ffffff' : col, .9); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (hs(i, 5) - .5) * 8, y - 4); c.lineTo(x + (hs(i, 6) - .5) * 8, y - 8); c.lineTo(x + (hs(i, 7) - .5) * 10, y - 13); c.stroke() } },
    leaf(X, n) { const c = X.c, col = X.d.aura.color; for (let i = 0; i < n; i++) { const u = (X.t * .4 + i * .151) % 1, a = X.t * 1.6 + i * 2.1, r = 11 + (i % 4) * 3.4, x = M.cos(a) * r, y = -3 - u * 44 + M.sin(a) * 3; c.save(); c.translate(x, y); c.rotate(a * 2); c.fillStyle = rgba(i % 3 ? col : X.pal.accent, (1 - u * .6) * .8); c.beginPath(); c.ellipse(0, 0, 3.2, 1.4, 0, 0, TAU); c.fill(); c.restore() } },
    guard(X, n) { const c = X.c, col = X.d.aura.color, k = M.min(n, 8); c.lineWidth = 2; for (let i = 0; i < k; i++) { const a = X.t * .9 + i * TAU / k; c.strokeStyle = rgba(col, .35 + .35 * M.sin(X.t * 3 + i)); c.beginPath(); c.ellipse(0, -18, 22, 25, 0, a, a + .55); c.stroke() } },
    sun(X, n) { const c = X.c, col = X.d.aura.color, k = M.min(n, 14), g = c.createRadialGradient(0, -20, 4, 0, -20, 34); g.addColorStop(0, rgba(col, .22)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(-36, -56, 72, 72); c.lineWidth = 1.6; for (let i = 0; i < k; i++) { const a = X.t * .6 + i * TAU / k, l0 = 22, l1 = 28 + (i % 2) * 7 + M.sin(X.t * 3 + i) * 2; c.strokeStyle = rgba(col, .6); c.beginPath(); c.moveTo(M.cos(a) * l0, -20 + M.sin(a) * l0); c.lineTo(M.cos(a) * l1, -20 + M.sin(a) * l1); c.stroke() } }
  };

  /* ================= VFX THEO TRẠNG THÁI ================= */
  function arcTrail(X, S, a0, a1, r, w, col) {
    const c = X.c, n = 9; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, aa = lerp(a0, a1, u0), bb = lerp(a0, a1, u1); c.strokeStyle = rgba(col, u1 * .8); c.lineWidth = w * (.25 + u1 * .75); c.beginPath(); c.arc(S.x, S.y, r, aa, bb, bb < aa); c.stroke() } c.lineCap = 'butt';
  }
  function trailVfx(X, S, tip) {
    const c = X.c, p = X.p, k = p.k, P = X.pal, ai = .5 + X.d.asc * .12 + (X.max ? .3 : 0), col = X.d.glow > .3 ? P.accent : P.metal, fade = 1 - k * k * .6;
    c.save(); c.globalAlpha = fade;
    switch (X.d.trail) {
      case 'slash': { const w = WP[X.d.weapon], r = w.len + 9, a1 = p.wa, a0 = a1 - 1.5 * ai - .6; arcTrail(X, S, a0, a1, r, 4 + 3 * ai, col); break }
      case 'sweep': { const a1 = p.wa, a0 = a1 - 2.2; arcTrail(X, S, a0, a1, 38, 7 + 3 * ai, col); arcTrail(X, S, a0 + .3, a1, 30, 3, '#ffffff'); break }
      case 'thrust': { const L = 50 + p.ext; c.strokeStyle = rgba(col, .85); c.lineCap = 'round'; for (let i = -1; i <= 1; i++) { c.lineWidth = i ? 1.4 : 3.4 * ai + 1; c.beginPath(); c.moveTo(14, -24 + i * 4); c.lineTo(L + 14 + p.ext, -25 + i * 2.4); c.stroke() } c.fillStyle = rgba('#ffffff', .8); c.beginPath(); c.arc(L + 18 + p.ext, -25, 2.6 + ai, 0, TAU); c.fill(); c.lineCap = 'butt'; break }
      case 'arrow': { const x = 14 + k * 70; c.strokeStyle = rgba(col, .9); c.lineWidth = 1.6 + ai; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 18 - ai * 8, -22); c.lineTo(x, -22); c.stroke(); c.fillStyle = rgba('#ffffff', .95); poly(c, [[x, -24], [x + 6, -22], [x, -20]]); c.fill(); c.lineCap = 'butt'; break }
      case 'arc': { c.strokeStyle = rgba(P.accent, .95); c.lineWidth = 2 + ai; c.beginPath(); let x = tip.x, y = tip.y; c.moveTo(x, y); const sd = (X.t * 30) | 0; for (let i = 1; i <= 6; i++) { x += 9; y += (hs(i, sd) - .5) * 14; c.lineTo(x, y) } c.stroke(); c.strokeStyle = rgba('#ffffff', .9); c.lineWidth = 1; c.stroke(); break }
      case 'bash': { const u = ease(k), x = 20 + p.ox; c.strokeStyle = rgba(col, .85 * (1 - k)); c.lineWidth = 3; c.beginPath(); c.ellipse(x, -14, 5 + u * 12, 9 + u * 14, 0, -1.2, 1.2); c.stroke(); for (let i = 0; i < 5; i++) { const a = -1 + i * .5; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + M.cos(a) * 12, -14 + M.sin(a) * 15); c.lineTo(x + M.cos(a) * (18 + u * 10), -14 + M.sin(a) * (22 + u * 10)); c.stroke() } break }
      case 'cross': { const u = ease(k), l = 8 + u * 22 * (.7 + ai * .4); c.lineCap = 'round'; for (const s of [-1, 1]) { c.strokeStyle = rgba(s > 0 ? col : P.accent, .9); c.lineWidth = 3 * (1 - k * .5) + ai; c.beginPath(); c.moveTo(24 - l * .7, -20 - s * l * .7); c.lineTo(24 + l * .7, -20 + s * l * .7); c.stroke() } c.lineCap = 'butt'; break }
    }
    c.restore();
  }
  function stateVfx(X, tip, S) {
    const c = X.c, p = X.p, k = p.k, P = X.pal, st = X.state, col = X.d.aura.color, ai = .5 + X.d.asc * .12 + (X.max ? .3 : 0);
    if (st === 'attack') trailVfx(X, S, tip);
    else if (st === 'skill') { const u = ease(k); c.save(); c.translate(0, 1); c.scale(1, .36); c.strokeStyle = rgba(col, (1 - k) * .9); c.lineWidth = 4 * (1 - k) + 1; c.beginPath(); c.arc(0, 0, 10 + u * 34 * (.8 + ai * .3), 0, TAU); c.stroke(); c.restore(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8, r = 8 + u * 22; c.fillStyle = rgba(i % 2 ? P.accent : col, (1 - k) * .9); c.beginPath(); c.arc(M.cos(a) * r, -4 - u * 28 * hs(i, 1) + M.sin(a) * 3, 1.8, 0, TAU); c.fill() } }
    else if (st === 'ultimate') {
      const j = clamp((k - .2) / .8, 0, 1), u = ease(j); c.save();
      c.translate(0, 1); c.scale(1, .36); for (let i = 0; i < 3; i++) { const jj = clamp(j - i * .12, 0, 1); c.strokeStyle = rgba(i ? col : '#ffffff', (1 - jj) * .9); c.lineWidth = 5 * (1 - jj) + 1; c.beginPath(); c.arc(0, 0, 6 + ease(jj) * 62, 0, TAU); c.stroke() } c.restore();
      for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + k, r = 10 + u * 40; c.fillStyle = rgba(i % 2 ? '#ffffff' : P.accent, (1 - j) * .9); c.beginPath(); c.arc(M.cos(a) * r, -18 + M.sin(a) * r * .6, 1.6, 0, TAU); c.fill() }
    }
    else if (st === 'hit') { c.strokeStyle = rgba('#ffffff', 1 - k); c.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const a = -2.6 + i * .5, r0 = 10 + k * 6, r1 = 18 + k * 14; c.beginPath(); c.moveTo(-6 + M.cos(a) * r0, -20 + M.sin(a) * r0); c.lineTo(-6 + M.cos(a) * r1, -20 + M.sin(a) * r1); c.stroke() } }
    else if (st === 'defeat') { for (let i = 0; i < 9; i++) { const u = (k * .9 + i * .1) % 1; c.fillStyle = rgba(i % 2 ? col : '#ffffff', (1 - k) * .75); c.beginPath(); c.arc(M.sin(i * 5.1) * 14, -8 - u * 34 * (.4 + k), 1.4 + hs(i, 2), 0, TAU); c.fill() } }
    else if (st === 'victory') { for (let i = 0; i < 12; i++) { const u = (X.t * .8 + i * .083) % 1, a = i * 2.4; c.fillStyle = rgba(i % 2 ? P.accent : '#ffffff', (1 - u) * .9); c.save(); c.translate(M.cos(a) * (8 + u * 24), -10 - u * 46); c.rotate(X.t * 3 + i); c.fillRect(-1.2, -1.2, 2.4, 2.4); c.restore() } }
  }
  function ultPillar(X) { // cột sáng Tuyệt kỹ — vẽ phía sau thân
    const c = X.c, k = X.p.k; if (k <= .2) return; const j = clamp((k - .2) / .8, 0, 1), u = ease(j), P = X.pal, w = 10 + u * 12, g = c.createLinearGradient(0, -92, 0, 0);
    g.addColorStop(0, rgba(X.d.aura.color, 0)); g.addColorStop(.6, rgba(P.accent, .22 * (1 - j * .6))); g.addColorStop(1, rgba('#ffffff', .4 * (1 - j * .5)));
    c.fillStyle = g; c.beginPath(); c.moveTo(-w * .5, -92); c.lineTo(w * .5, -92); c.lineTo(w, 0); c.lineTo(-w, 0); c.closePath(); c.fill();
  }
  function maxFx(X) { // dấu hiệu MAX: vòng sáng chân + cột sáng mờ
    const c = X.c, P = X.pal, g = c.createLinearGradient(0, -70, 0, 0); g.addColorStop(0, rgba(P.accent, 0)); g.addColorStop(1, rgba(P.accent, .16 + .05 * M.sin(X.t * 3))); c.fillStyle = g; c.fillRect(-14, -70, 28, 70);
  }

  /* ================= VẼ NHÂN VẬT ================= */
  /* o: {x,y,scale,f,t,state,st,aw,asc,max,q,alpha,evo} — t = đồng hồ chung (giây), st = giây kể từ khi vào trạng thái */
  function draw(ctx, id, o) {
    const c = get(id); if (!c) return false; const R = RULES();
    const aw = o.aw | 0, asc = o.asc | 0, mx = !!o.max, d = resolve(id, aw, asc, mx), state = STATES.indexOf(o.state) >= 0 ? o.state : 'idle';
    const T = R.anim[state].dur, loop = R.anim[state].loop, s = loop ? (o.st || 0) % T : M.min(o.st || 0, T);
    const p = pose(c, d, state, s, T), sc = (o.scale || 1) * d.height * (CB ? 1.12 * (1 + M.min(.1, (aw + asc * .6 + (mx ? 3 : 0)) * .01)) : 1), q = o.q == null ? 2 : o.q, f = o.f || 1;
    const pal = d.palette, fl = M.max(p.flash, o.flash || 0);
    const X = { c: ctx, d, pal, p, t: o.t || 0, state, q, f, bw: 7 * d.width, sc: d.width, max: mx, m: col => fl > .02 ? mix(col, M.min(1, fl)) : col, pass: 'both' };
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(sc * f, sc); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    /* 1. tầng đất: bóng, ấn, aura nền */
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 12 * d.width + 1, 4.5, 0, 0, TAU); ctx.fill();
    if (d.extra.indexOf('runes') >= 0 && q > 0) groundRunes(X);
    if (mx && q > 0) maxFx(X);
    if (state === 'ultimate') ultPillar(X);
    if (o.evo > 0) { const u = 1 - o.evo; ctx.save(); ctx.translate(0, 1); ctx.scale(1, .4); for (let i = 0; i < 3; i++) { const jj = clamp(u * 1.4 - i * .15, 0, 1); ctx.strokeStyle = rgba(i ? pal.accent : '#ffffff', (1 - jj) * .95); ctx.lineWidth = 6 * (1 - jj) + 1; ctx.beginPath(); ctx.arc(0, 0, 8 + ease(jj) * 56, 0, TAU); ctx.stroke() } ctx.restore() }
    const an = d.aura.n * (q === 0 ? 0 : q === 1 ? .5 : 1) | 0;
    if (an > 0 && AURA[d.aura.kind]) { ctx.save(); ctx.translate(p.ox, p.oy * .5); AURA[d.aura.kind](X, an); ctx.restore() }
    /* 2. thân + trang bị (hệ toạ độ bị biến đổi theo tư thế) */
    ctx.save(); ctx.translate(p.ox, p.oy); if (p.rot) ctx.rotate(p.rot); ctx.scale(p.sx, p.sy); ctx.rotate(p.lean * .6); if (p.al < 1) ctx.globalAlpha *= p.al;
    ctx.translate(0, p.bob);
    if (X.q > 0) { X.pass = 'back'; for (const e of d.extra) if (EXTRA_BEHIND[e]) EXTRA_BEHIND[e](X); if (d.extra.indexOf('blades') >= 0) EXTRA_FRONT.blades(X) }
    let S, tip;
    if (CB) { X.eq = eqOf(); X.id = id; X.top = -52; const rb = CB.body(X); S = rb.S; tip = rb.tip }
    else {
    (BACK[d.back] || BACK.none)(X);
    (BODY[d.body] || BODY.armor)(X);
    (SHOULDER[d.shoulder] || SHOULDER.none)(X); (HEAD[d.head] || HEAD.round)(X);
    /* tay + vũ khí */
    S = { x: 3, y: -24 }; const Hd = hand(X, S, p.wa);
    ctx.strokeStyle = X.m(pal.sub); ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(Hd.x, Hd.y); ctx.stroke(); ctx.lineCap = 'butt';
    tip = WEAPON[d.weapon](X, Hd, p.wa, p);
    ctx.fillStyle = X.m(pal.skin); ctx.beginPath(); ctx.arc(Hd.x, Hd.y, 2.3, 0, TAU); ctx.fill();
    }
    if (X.q > 0) { X.pass = 'front'; if (d.extra.indexOf('blades') >= 0) EXTRA_FRONT.blades(X); if (d.extra.indexOf('flames') >= 0) EXTRA_FRONT.flames(X); if (d.extra.indexOf('embers') >= 0) EXTRA_FRONT.embers(X) }
    ctx.restore();
    /* 3. VFX trạng thái (không bị nghiêng) */
    if (q > 0 || state === 'attack') stateVfx(X, tip, { x: S.x + p.ox, y: S.y + p.bob }); 
    if (o.evo > 0) { ctx.fillStyle = rgba('#ffffff', M.max(0, o.evo - .55) * 1.6); ctx.fillRect(-60, -90, 120, 100) }
    if (CB) { if (o.burst) CB.burst(ctx, o.burst.k, o.burst.u, pal, q, o.t || 0, d.aura.color); if (o.bursts) for (const b of o.bursts) CB.burst(ctx, b.k, b.u, pal, q, o.t || 0, d.aura.color); if (o.evo > 0) CB.burst(ctx, 'realm', 1 - o.evo, pal, q, o.t || 0, d.aura.color) }
    ctx.restore(); return true;
  }

  /* ================= TÍCH HỢP TRONG TRẬN ================= */
  function gameProg(id) { const p = prog(id); return { id, aw: p.aw, asc: p.asc, max: isMax(id, p) } }
  function drawGame(ctx, x, y, G, q) {
    const cp = G && G.chp; if (!cp || !get(cp.id)) return false; const P = G.p, R = RULES();
    let want = 'idle';
    if (G.ending) want = G.win ? 'victory' : 'defeat'; else if (G.ul > .3) want = 'ultimate'; else if (P.inv > .17) want = 'hit'; else if (P.skc > 0) want = 'skill'; else if (P.atk > 0) want = 'attack'; else if (P.moving) want = 'move';
    const cs = cp.cs || (cp.cs = { s: 'idle', t0: G.t });
    if (want !== cs.s) { const cd = R.anim[cs.s], busy = !cd.loop && G.t - cs.t0 < cd.dur; if (!(busy && PRIO[want] <= PRIO[cs.s] && cs.s !== want)) { cs.s = want; cs.t0 = G.t } }
    /* khi một trạng thái không lặp vừa hết hạn mà đòn mới lại tới: bắt đầu lại */
    if (!R.anim[cs.s].loop && G.t - cs.t0 > R.anim[cs.s].dur && cs.s === want && (want === 'attack' || want === 'skill')) cs.t0 = G.t - .001;
    const flick = P.inv > 0 && ((G.t * 20) | 0) % 2;
    return draw(ctx, cp.id, { x, y, scale: 1, f: P.face, t: G.t, state: cs.s, st: G.t - cs.t0, aw: cp.aw, asc: cp.asc, max: cp.max, q, alpha: flick && cs.s !== 'defeat' ? .55 : null, bursts: [cp.burst, cp.burst2].filter(b => b && G.t >= b.t0 && G.t - b.t0 < BURST_DUR[b.k]).map(b => ({ k: b.k, u: (G.t - b.t0) / BURST_DUR[b.k] })) });
  }

  /* ================= MÀN HỒ SƠ ================= */
  const UI = { id: null, state: 'idle', pv: { aw: 0, asc: 0, max: false }, raf: 0, t0: 0, evo: 0, evoAt: 0, auto: 0 };
  const STAT_ROWS = [['hp', '❤ Sinh lực', v => v], ['attack', '⚔ Công', v => v], ['defense', '🛡 Phòng thủ', v => v], ['speed', '👟 Tốc độ', v => v], ['crit', '💥 Bạo kích', v => M.round(v * 1000) / 10 + '%'], ['range', '🎯 Tầm đánh', v => v], ['attackSpeed', '⚡ Tốc đánh', v => '×' + v]];
  const fmtCost = c => [c.hon ? '🔮' + c.hon : '', c.gold ? '🪙' + c.gold.toLocaleString('vi') : '', c.mt ? '⚙' + c.mt : ''].filter(Boolean).join(' · ');
  function open(id) {
    if (!get(id) || !B) return; UI.id = id; UI.state = 'idle'; const p = prog(id); UI.pv = { aw: p.aw, asc: p.asc, max: isMax(id, p) }; UI.evo = 0; render();
  }
  function render() {
    const id = UI.id, c = get(id), R = RULES(), pr = prog(id), sv = B.sv(), own = !!sv.hu[id], rc = R.rarityColor[c.rarity] || '#fff', pv = UI.pv;
    const mxv = pv.max, pp = { l: pr.l, s: pr.s, aw: pv.aw, asc: pv.asc, max: mxv }; const st = stats(id, pp), st1 = stats(id, { l: pr.l, s: pr.s, aw: 0, asc: 0, max: false });
    const chip = (att, v, on, lock, lab) => `<button data-${att}="${v}" style="font:inherit;font-size:11px;padding:4px 8px;border-radius:12px;border:1px solid ${on ? '#ffd978' : '#3b4468'};background:${on ? 'rgba(255,217,120,.18)' : 'rgba(10,14,32,.8)'};color:${lock ? '#7f86a3' : '#f3e3b8'};cursor:pointer">${lab}</button>`;
    const stChips = STATES.map(s => chip('chst', s, UI.state === s, 0, STATE_VN[s])).join('');
    const awChips = [...Array(R.awakeningStages + 1).keys()].map(n => chip('chaw', n, pv.aw === n && !mxv, n > pr.aw, n === 0 ? 'Gốc' : 'TT ' + n + (n > pr.aw ? ' 🔒' : ''))).join('');
    const ascChips = [...Array(R.ascensionStages + 1).keys()].map(n => chip('chasc', n, pv.asc === n && !mxv, n > pr.asc, n === 0 ? '—' : 'TG ' + n + (n > pr.asc ? ' 🔒' : ''))).join('');
    const maxOwned = isMax(id, pr), maxChip = chip('chmax', 1, mxv, !maxOwned, '👑 MAX' + (maxOwned ? '' : ' 🔒'));
    const upBox = (kind, label) => {
      const q = req(id, kind); if (q.done) return `<div style="font-size:12px;opacity:.75">${label}: <b style="color:#7dff9a">đã đạt tối đa</b></div>`;
      return `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px"><div style="font-size:11px;line-height:1.35"><b style="color:#ffd978">${label} → ${q.st.name}</b><br><span style="opacity:.8">${q.st.d}</span><br><span style="opacity:.9">Chi phí ${fmtCost(q.cost)}${q.st.req && q.st.req.level ? ' · Lv.' + q.st.req.level : ''}</span>${q.ok ? '' : `<br><span style="color:#ff9a8a">${q.why}</span>`}</div><button class="btn gold" data-chup="${kind}" style="width:auto;padding:7px 10px;font-size:12px;flex:none;${q.ok ? '' : 'filter:grayscale(.9);opacity:.55'}">NÂNG</button></div>`;
    };
    const stageDesc = (() => {
      if (mxv) return `<b style="color:#ffd978">👑 ${c.max.name}</b> — ${c.max.d}`;
      const parts = []; if (pv.aw > 0) { const a = c.awakening[pv.aw - 1]; parts.push(`<b style="color:#9fd0ff">Thức Tỉnh ${pv.aw}: ${a.name}</b> — ${a.d}`) } if (pv.asc > 0) { const a = c.ascension[pv.asc - 1]; parts.push(`<b style="color:#ffb86a">Thăng Giai ${pv.asc}: ${a.name}</b> — ${a.d}`) } return parts.length ? parts.join('<br>') : '<span style="opacity:.7">Dạng gốc.</span>';
    })();
    const dlt = (k, f) => { const v = st[k] - st1[k]; if (!v) return ''; const sh = k === 'crit' ? '+' + M.round(v * 1000) / 10 + '%' : k === 'attackSpeed' ? '+' + M.round(v * 100) / 100 : '+' + M.round(v * 10) / 10; return ` <small style="color:#7dff9a;display:inline;opacity:1">(${sh})</small>` };
    const rows = STAT_ROWS.map(([k, lab, f]) => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)"><span>${lab}</span><b>${f(st[k])}${dlt(k, f)}</b></div>`).join('');
    const sk = c.skills.map((s, i) => `<div style="font-size:12px;margin:3px 0"><b style="color:#ffd978">Kỹ năng ${i + 1} · ${s.name}</b><br><span style="opacity:.8">${s.d}</span></div>`).join('');
    const mbx = document.getElementById('mb'), sy = mbx ? mbx.scrollTop : 0, sp = mbx && mbx.parentElement ? mbx.parentElement.scrollTop : 0;
    B.info('HỒ SƠ NHÂN VẬT', `<div style="background:rgba(9,12,28,.98);border:1px solid #2b3358;border-radius:12px;padding:10px 11px">
<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:8px"><div><div style="font-size:19px;font-weight:700;color:#ffd978;line-height:1.1">${c.name}</div><div style="font-size:12px;opacity:.85">${c.title}</div></div><div style="text-align:right"><b style="color:${rc};font-size:16px">${c.rarity}</b><div style="font-size:11px;opacity:.85">${c.class} · ${c.role}</div></div></div>
<div style="position:relative;margin:8px 0 6px;border-radius:10px;overflow:hidden;background:radial-gradient(ellipse at 50% 85%,${rgba(c.design.palette.main, .45)},rgba(8,10,24,.95) 70%);border:1px solid ${rc}"><canvas id="chcv" width="280" height="190" style="width:100%;height:190px;display:block"></canvas><div id="chtag" style="position:absolute;left:8px;top:6px;font-size:11px;opacity:.9">${STATE_VN[UI.state]}</div><div style="position:absolute;right:8px;top:6px;font-size:11px;color:#ffd978">${mxv ? '👑 MAX' : (pv.aw || pv.asc) ? `TT ${pv.aw} · TG ${pv.asc}` : 'Dạng gốc'}${(pv.aw > pr.aw || pv.asc > pr.asc || (mxv && !maxOwned)) ? ' · xem trước' : ''}</div></div>
<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${stChips}</div>
<div style="font-size:11px;opacity:.75;margin:6px 0 3px">Tiến hoá (bấm để xem trước) · Lv.${pr.l}</div>
<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">${awChips}</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">${ascChips} ${maxChip}</div>
<div style="font-size:12px;line-height:1.4;margin:6px 0;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05)">${stageDesc}</div>
${own ? `<div style="margin:6px 0;padding:6px 8px;border-radius:8px;border:1px solid #3b4468">${upBox('aw', 'Thức Tỉnh')}<div style="height:6px"></div>${upBox('asc', 'Thăng Giai')}</div>` : '<div style="font-size:12px;color:#ff9a8a;margin:6px 0">Chưa sở hữu tướng — triệu hồi hoặc mua để nâng tiến hoá.</div>'}
<div style="font-size:11px;opacity:.75;margin:8px 0 2px">Chỉ số${(pv.aw !== pr.aw || pv.asc !== pr.asc || mxv) ? ' (xem trước)' : ''} · Lv.${pr.l}${pr.s ? ' · ' + pr.s + '★' : ''}</div>${rows}
<div style="margin-top:8px;font-size:12px"><b style="color:#ffd978">Vũ khí · ${c.weapon.name}</b><br><span style="opacity:.8">${c.weapon.d}</span></div>
<div style="margin-top:6px;font-size:12px"><b style="color:#ffd978">Nội tại · ${c.passive.name}</b><br><span style="opacity:.8">${c.passive.d}</span></div>
<div style="margin-top:6px">${sk}</div>
<div style="margin-top:6px;font-size:12px"><b style="color:#ff9a6a">Tuyệt kỹ · ${c.ultimate.name}</b><br><span style="opacity:.8">${c.ultimate.d}</span></div>
<div style="margin-top:8px;font-size:11px;opacity:.7">Nhận diện: ${c.design.silhouette}</div></div>`);
    if (mbx) { mbx.scrollTop = sy; if (mbx.parentElement) mbx.parentElement.scrollTop = sp }
    startLoop();
  }
  function startLoop() {
    cancelAnimationFrame(UI.raf); const cv = document.getElementById('chcv'); if (!cv) return; const dpr = M.min(2, window.devicePixelRatio || 1), W = 280, H = 190;
    cv.width = W * dpr; cv.height = H * dpr; const ctx = cv.getContext('2d'); let last = performance.now(), clock = 0, stT = 0, cur = UI.state, tag = document.getElementById('chtag');
    const R = RULES(), reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    (function loop(now) {
      if (!cv.isConnected || !cv.offsetParent) return; const dt = M.min(.05, (now - last) / 1000); last = now; clock += dt; stT += dt;
      if (cur !== UI.state) { cur = UI.state; stT = 0 }
      const T = R.anim[cur].dur;
      if (!R.anim[cur].loop && stT > T + .9) stT = 0; // phát lại đòn không lặp sau một nhịp nghỉ
      if (UI.evo > 0) UI.evo = M.max(0, UI.evo - dt / 1.3);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, 158, 4, W / 2, 158, 120); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      draw(ctx, UI.id, { x: W / 2 - 4, y: 166, scale: CB ? 1.9 : 2.4, f: 1, t: clock, state: cur, st: stT, aw: UI.pv.aw, asc: UI.pv.asc, max: UI.pv.max, q: reduce ? 1 : 2, evo: UI.evo });
      UI.raf = requestAnimationFrame(loop);
    })(last);
  }
  function onClick(e) {
    const t = e.target.closest('[data-chst],[data-chaw],[data-chasc],[data-chmax],[data-chup],[data-chopen]'); if (!t || !B) return; const d = t.dataset; e.stopPropagation();
    if (d.chopen) return open(d.chopen);
    if (!UI.id) return;
    if (d.chst) { UI.state = d.chst; const tg = document.getElementById('chtag'); if (tg) tg.textContent = STATE_VN[UI.state]; document.querySelectorAll('[data-chst]').forEach(b => { const on = b.dataset.chst === UI.state; b.style.borderColor = on ? '#ffd978' : '#3b4468'; b.style.background = on ? 'rgba(255,217,120,.18)' : 'rgba(10,14,32,.8)' }); return }
    if (d.chaw != null) { UI.pv.aw = +d.chaw; UI.pv.max = false; UI.evo = .6; return render() }
    if (d.chasc != null) { UI.pv.asc = +d.chasc; UI.pv.max = false; UI.evo = .6; return render() }
    if (d.chmax != null) { const R = RULES(); UI.pv = { aw: R.awakeningStages, asc: R.ascensionStages, max: true }; UI.evo = 1; return render() }
    if (d.chup) { if (upgrade(UI.id, d.chup)) { const p = prog(UI.id); UI.pv = { aw: p.aw, asc: p.asc, max: isMax(UI.id, p) }; B.sfx('u'); render(); UI.evo = 1 } else B.sfx('d'); }
  }
  function bind(b) { B = b; const mb = document.getElementById('mb'); if (mb && !mb._chb) { mb._chb = 1; mb.addEventListener('click', onClick) } }

  window.DV_CHAR = { get, all: LIST, ok, prog, isMax, stats, delta, req, upgrade, resolve, draw, drawGame, gameProg, open, bind, pose, STATES, STATE_VN, WP };
})();
