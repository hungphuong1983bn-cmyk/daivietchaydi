/* Phase 19 — VÕ CÔNG MỞ RỘNG (DV_SKX): logic chiến đấu cho 11 võ công mới (dữ liệu ở data/skills.js, âm thanh ở data/skillfx.js).
   Dùng đúng cơ chế cũ: cấp võ công G.sk[k], hồi chiêu G.cd[k], hệ số tiến hoá xm(k), sát thương qua hit() với G.src = k (bảng tính sát thương, số bay, âm thanh va chạm không đổi).
   Thực thể sống lâu (phượng, trận băng/độc, lốc xoáy, thiên thạch, cự kiếm, cánh kiếm, chuông vàng) nằm trong G.skx; sự kiện một lần trong G.skxe.
   Hiển thị: bản 3D ở js/r3d_skx.js (đọc G.skx / G.skxe), bản 2D dự phòng ở draw2d() bên dưới. Không sửa dữ liệu cân bằng / rơi đồ / thưởng. */
(function () {
  'use strict';
  const M = Math, R = Math.random, TAU = M.PI * 2;
  let A = null;
  const ent = (G, o) => { (G.skx || (G.skx = [])).push(o); return o };
  const evn = (G, o) => { const q = G.skxe || (G.skxe = []); if (q.length < 80) q.push(o) };
  const alive = e => e && !e.dead && !e.gone;
  function area(G, x, y, r, d, src, kb) {
    G.src = src; for (const e of G.en) { if (!alive(e)) continue; const dx = e.x - x, dy = e.y - y, L = M.hypot(dx, dy) || 1; if (L < r + e.r) A.hit(e, d, kb ? dx / L * kb : 0, kb ? dy / L * kb : 0) } G.src = null;
  }
  function snd(G, k, stage) { if (A.AU && A.FXD) A.AU.stage(stage || 'cast', k, G); else A.sfx && A.sfx('s') }
  function slow(e, t, k) { e.slw = M.max(e.slw || 0, t); e.slk = M.min(e.slk || 1, k) }
  function burn(G, e, dmg, t) { const b = G.skb || (G.skb = []); if (b.length > 60) return; const o = b.find(x => x.e === e); if (o) { o.t = M.max(o.t, t); return } b.push({ e, t, tk: .5, d: dmg }) }
  function pick(T, n, shuffle) { const L = shuffle ? T.slice().sort(() => R() - .5) : T; return L.slice(0, n) }

  /* ---------- tung chiêu ---------- */
  const CAST = {
    hoa(G, P, l, X, c, T) {
      if (!T.length) { c.hoa = .3; return } const n = 1 + (l > 2) + X.n; c.hoa = (3.4 - .22 * l) * X.cd; snd(G, 'hoa'); P.skc = .4;
      for (let i = 0; i < n; i++) { const t = T[i % T.length], a = M.atan2(t.y - P.y, t.x - P.x) + (i - (n - 1) / 2) * .5; ent(G, { k: 'fire', x: P.x, y: P.y - 12, a, spd: 270, t: 0, T: 2.6, tg: t, dmg: (30 + 12 * l) * X.dmg, r: (60 + 6 * l) * X.rad, l, evo: !!G.evo.hoa }) }
    },
    bang(G, P, l, X, c, T) {
      if (!T.length) { c.bang = .4; return } const n = 1 + X.n; c.bang = (5.2 - .3 * l) * X.cd; snd(G, 'bang');
      for (const t of pick(T, n, 1)) { ent(G, { k: 'zone', st: 'ice', x: t.x, y: t.y, r: (90 + 10 * l) * X.rad, t: 0, T: 3.6 + .2 * l, tk: 0, dmg: (8 + 4 * l) * X.dmg, evo: !!G.evo.bang }); evn(G, { e: 'ice', x: t.x, y: t.y, r: (90 + 10 * l) * X.rad }) }
    },
    doc(G, P, l, X, c, T) {
      if (!T.length) { c.doc = .4; return } const n = 1 + (l > 2); c.doc = (4.4 - .25 * l) * X.cd; snd(G, 'doc');
      for (const t of pick(T, n, 1)) ent(G, { k: 'zone', st: 'poison', x: t.x, y: t.y, r: (70 + 8 * l) * X.rad, t: 0, T: 5, tk: 0, dmg: (6 + 3 * l) * X.dmg })
    },
    phong(G, P, l, X, c, T) {
      const n = 1 + X.n; c.phong = (6.2 - .35 * l) * X.cd; snd(G, 'phong');
      for (let i = 0; i < n; i++) { const t = T[i % (T.length || 1)], a = t ? M.atan2(t.y - P.y, t.x - P.x) + (i ? (i % 2 ? 1 : -1) * .7 : 0) : R() * TAU; ent(G, { k: 'twr', x: P.x + M.cos(a) * 40, y: P.y + M.sin(a) * 40, a, spd: 120, t: 0, T: 4, tk: 0, r: (60 + 6 * l) * X.rad, dmg: (7 + 3 * l) * X.dmg }) }
    },
    tinh(G, P, l, X, c, T) {
      const n = 3 + l + X.n; c.tinh = (7.5 - .45 * l) * X.cd; snd(G, 'tinh'); const L = T.length ? pick(T, n, 1) : []; if (A.CAM) A.CAM.skill('tinh', G, 160 * X.rad);
      for (let i = 0; i < n; i++) { const t = L[i % (L.length || 1)], x = t ? t.x + (R() - .5) * 50 : P.x + (R() - .5) * 420, y = t ? t.y + (R() - .5) * 50 : P.y + (R() - .5) * 320; ent(G, { k: 'met', x, y, t: -i * .13, T: .95, r: 72 * X.rad, dmg: (40 + 14 * l) * X.dmg, ox: (R() - .5) * 200 }) }
    },
    tru(G, P, l, X, c, T) {
      if (!T.length) { c.tru = .4; return } const n = 1 + X.n; c.tru = (8.5 - .5 * l) * X.cd; snd(G, 'tru'); if (A.CAM) A.CAM.skill('tru', G, 120);
      const L = T.slice().sort((a, b) => b.hp - a.hp).slice(0, n); L.forEach((t, i) => ent(G, { k: 'swd', x: t.x, y: t.y, t: -i * .22, T: .8, r: (90 + 8 * l) * (X.rad || 1), dmg: (90 + 35 * l) * X.dmg, tg: t }))
    },
    lien(G, P, l, X, c) {
      const n = 8 + 2 * l + X.n; c.lien = (3.6 - .22 * l) * X.cd; snd(G, 'lien'); P.atk = .2; const base = (G.skxr = (G.skxr || 0) + .45); evn(G, { e: 'bloom', x: P.x, y: P.y, r: 70 });
      for (let i = 0; i < n; i++) ent(G, { k: 'bld', x: P.x, y: P.y - 6, a: base + i / n * TAU, spd: 320, t: 0, T: .8, dmg: (14 + 6 * l) * X.dmg, h: new Set(), ev: !!G.evo.lien })
    },
    kim(G, P, l, X, c, T) {
      if (!T.length || T[0]._d > 230 * 230) { c.kim = .3; return } c.kim = (10 - .8 * l) * X.cd; const dur = 2 + .4 * l; G.kcT = dur; G.kcm = M.max(.15, 1 - (.45 + .07 * l)); snd(G, 'kim'); P.skc = .5;
      area(G, P.x, P.y, (110 + 10 * l) * X.rad, (10 + 6 * l) * X.dmg, 'kim', 380); ent(G, { k: 'dome', t: 0, T: dur }); evn(G, { e: 'gong', x: P.x, y: P.y, r: (110 + 10 * l) * X.rad })
    }
  };


  /* ================= VÕ CÔNG RIÊNG TỪNG TƯỚNG (khai báo ở data/characters.js: skills[1..2], passive, ultimate) =================
     Tự động tung khi có địch trong tầm, hồi chiêu G.cd.h1/h2; sát thương theo cấp Tướng (A.hl). Buff tạm lưu ở G.hb, áp bằng hệ số có theo dõi để không đè các nguồn khác. */
  const dmv = A_ => 20 + 1.5 * (A_.hl || 1);
  const aimA = (P, T) => T && T[0] ? M.atan2(T[0].y - P.y, T[0].x - P.x) : (P.face > 0 ? 0 : M.PI);
  const moveA = (P, T) => M.hypot(P.vx || 0, P.vy || 0) > 20 ? M.atan2(P.vy, P.vx) : aimA(P, T);
  function cone(G, x, y, a, r, span, d, src, kb) {
    G.src = src; for (const e of G.en) { if (!alive(e)) continue; const dx = e.x - x, dy = e.y - y, L = M.hypot(dx, dy) || 1; if (L > r + e.r) continue; let da = M.atan2(dy, dx) - a; da = M.abs(M.atan2(M.sin(da), M.cos(da))); if (da <= span / 2 || span >= TAU) A.hit(e, d, dx / L * (kb || 0), dy / L * (kb || 0)) } G.src = null;
  }
  function buff(G, tag, k, v, t) { const b = G.hb || (G.hb = []); const o = b.find(x => x.tag === tag); if (o) { o.t = M.max(o.t, t); o.v = v } else b.push({ tag, k, v, t }) }
  const HERO = {
    dbl: {
      c1: 6, c2: 18,
      s1(G, P, T) { const a = moveA(P, T) + PI_, d = dmv(A) * 2.2; cone(G, P.x, P.y, a, 135, 2.6, d, 'dbl', 420); evn(G, { e: 'arc', x: P.x, y: P.y, a, r: 135, span: 2.6, col: '#bfe3ff' }); snd(G, 'kiem') },
      s2(G, P) { buff(G, 'cmd', 'as', .1, 4); evn(G, { e: 'cmd', x: P.x, y: P.y, r: 110, col: '#ffd070' }); G.fl.push({ x: P.x, y: P.y - 96, t: 1.2, T: 1.2, v: 'HIỆU LỆNH', c: '#ffd070', s: 16 }) }
    },
    lh: {
      c1: 5, c2: 16,
      s1(G, P) { cone(G, P.x, P.y, 0, 140, TAU, dmv(A) * 1.8, 'lh', 300); evn(G, { e: 'arc', x: P.x, y: P.y, a: 0, r: 140, span: TAU, col: '#ffb070', spin: 1 }); snd(G, 'hang') },
      s2(G, P) { G.hsh = 120; G.hshT = 3; ent(G, { k: 'dome', t: 0, T: 3, col: 0xffa050 }); evn(G, { e: 'cmd', x: P.x, y: P.y, r: 90, col: '#ffa050' }) }
    },
    nq: {
      c1: 7, c2: 9,
      s1(G, P, T) { const a = aimA(P, T); ent(G, { k: 'wave', x: P.x, y: P.y, a, t: 0, T: 1, spd: 300, r: 70, dmg: dmv(A) * 1.5, tk: 0, h: new Set() }); snd(G, 'bang') },
      s2(G, P, T) { const a = moveA(P, T); for (let i = 1; i <= 5; i++) evn(G, { e: 'trail', x: P.x + M.cos(a) * i * 28, y: P.y + M.sin(a) * i * 28, col: '#7ad8ff', d: i * .02 }); P.x += M.cos(a) * 140; P.y += M.sin(a) * 140; if (A.clamp) A.clamp(P); P.inv = M.max(P.inv || 0, .3); buff(G, 'surf', 'spd', .2, 2) }
    },
    thd: {
      c1: 22, c2: 12,
      s1(G, P) { buff(G, 'hich', 'am', .15, 5); evn(G, { e: 'cmd', x: P.x, y: P.y, r: 130, col: '#b88aff' }); G.fl.push({ x: P.x, y: P.y - 96, t: 1.2, T: 1.2, v: 'HỊCH TƯỚNG SĨ', c: '#d9b8ff', s: 16 }) },
      s2(G, P, T) { if (!T.length) return false; const t = T[0]; ent(G, { k: 'zone', st: 'ice', col: '#b070ff', x: t.x, y: t.y, r: 110, t: 0, T: 5, tk: 0, dmg: dmv(A) * .25 }); evn(G, { e: 'ice', x: t.x, y: t.y, r: 110, col: '#c090ff' }) }
    },
    dl: {
      c1: 3.5, c2: 14,
      s1(G, P, T) { if (!T.length) return false; const a = aimA(P, T); for (let i = -1; i <= 1; i++) ent(G, { k: 'arw', x: P.x, y: P.y - 8, a: a + i * .22, spd: 560, t: 0, T: .75, dmg: dmv(A) * 1.1, h: new Set() }); snd(G, 'phong') },
      s2(G, P) { buff(G, 'nin', 'cr', 1, 2.2); evn(G, { e: 'cmd', x: P.x, y: P.y, r: 70, col: '#9dffb5' }); G.fl.push({ x: P.x, y: P.y - 96, t: 1.2, T: 1.2, v: 'NÍN THỞ', c: '#9dffb5', s: 16 }) }
    },
    nb: {
      c1: 6, c2: 15,
      s1(G, P, T) { if (!T.length) return false; const a = aimA(P, T); cone(G, P.x, P.y, a, 120, 1.5, dmv(A) * 1.6, 'nb', 380); for (const e of G.en) if (alive(e) && M.hypot(e.x - P.x, e.y - P.y) < 130) { let da = M.atan2(e.y - P.y, e.x - P.x) - a; da = M.abs(M.atan2(M.sin(da), M.cos(da))); if (da < .75) slow(e, .5, .03) } evn(G, { e: 'arc', x: P.x, y: P.y, a, r: 120, span: 1.5, col: '#ffd9a0' }); snd(G, 'kim') },
      s2(G, P) { buff(G, 'thu', 'dr', .25, 4); ent(G, { k: 'dome', t: 0, T: 4, col: 0xc89a5a }); evn(G, { e: 'cmd', x: P.x, y: P.y, r: 90, col: '#c89a5a' }) }
    },
    ltk: {
      c1: 5, c2: 9,
      s1(G, P, T) { if (!T.length) return false; const t = T[0], d = dmv(A) * 3; G.src = 'ltk'; for (const e of G.en) if (alive(e) && M.hypot(e.x - t.x, e.y - t.y) < 95 + e.r) A.hit(e, d, 0, 0); G.src = null; evn(G, { e: 'xcut', x: t.x, y: t.y, r: 95 }); snd(G, 'kiem') },
      s2(G, P, T) { if (!T.length) return false; const t = T[0], a = M.atan2(t.y - P.y, t.x - P.x); for (let i = 1; i <= 5; i++) evn(G, { e: 'trail', x: P.x + (t.x - P.x) * i / 6, y: P.y + (t.y - P.y) * i / 6, col: '#ffe27a', d: i * .02 }); P.x = t.x + M.cos(a) * 60; P.y = t.y + M.sin(a) * 60; if (A.clamp) A.clamp(P); P.inv = M.max(P.inv || 0, .25); buff(G, 'than', 'cr', 1, 1.6); G.src = 'ltk'; A.hit(t, dmv(A) * 1.2, 0, 0); G.src = null }
    }
  };
  const PI_ = M.PI;
  /* nội tại theo tướng (xấp xỉ bằng buff/trigger, số liệu theo mô tả) */
  function heroPassive(G, P, dt, st, hid) {
    if (hid === 'dbl' && G.kills >= (st.k20 = st.k20 == null ? 20 : st.k20)) { st.k20 += 20; buff(G, 'bw', 'am', .3, 2.5); evn(G, { e: 'cmd', x: P.x, y: P.y, r: 70, col: '#ffe27a' }) }
    if (hid === 'ltk' && G.kills !== st.kl) { if (st.kl != null && G.kills > st.kl) buff(G, 'nq', 'cm', .2, 1.4); st.kl = G.kills }
    if (hid === 'dl' && G.wi !== st.wi) { if (st.wi != null) buff(G, 'tan', 'am', .25, 1.6); st.wi = G.wi }
    G.hlow = hid === 'lh' && P.hp < P.mhp * .4;
  }
  /* kích hoạt kèm Tuyệt Kỹ — gọi từ ult() trong index.html */
  function ultRider(G, api) {
    A = api; const P = G.p, hid = api.hid, d = dmv(api); let T = api.near();
    const ring = (n, dm, sc) => { for (let i = 0; i < n; i++) ent(G, { k: 'bld', x: P.x, y: P.y - 6, a: i / n * TAU, spd: 380, t: 0, T: .9, dmg: dm, h: new Set(), ev: true, sc: sc || 1, hr: 20 * (sc || 1) }) };
    switch (hid) {
      case 'dbl': ring(12, d * 2.2, 1.2); break;
      case 'lh': for (const e of G.en) if (alive(e) && M.hypot(e.x - P.x, e.y - P.y) < 400) slow(e, 1.4, .04); ent(G, { k: 'swd', x: P.x, y: P.y, t: -.1, T: .7, r: 240, dmg: d * 3, tg: null }); break;
      case 'nq': ent(G, { k: 'zone', st: 'stake', x: P.x, y: P.y, r: 380, t: 0, T: 4.5, tk: 0, dmg: d * 1.1 }); break;
      case 'thd': { const L = G.en.filter(alive).sort(() => R() - .5).slice(0, 14); L.forEach((e, i) => ent(G, { k: 'bolt', x: e.x, y: e.y, t: -(.1 + i * .09), T: .1, r: 70, dmg: d * 2.4 })); break }
      case 'dl': ent(G, { k: 'rain', x: P.x, y: P.y, t: 0, T: 3, tk: 0, r: 380, dmg: d * .9 }); break;
      case 'nb': buff(G, 'ultnb', 'dr', .6, 5); ent(G, { k: 'dome', t: 0, T: 5, col: 0xc89a5a }); area(G, P.x, P.y, 300, d, 'nb', 520); evn(G, { e: 'gong', x: P.x, y: P.y, r: 300 }); break;
      case 'ltk': ent(G, { k: 'bld', x: P.x, y: P.y, a: aimA(P, T), spd: 760, t: 0, T: .75, dmg: d * 5, h: new Set(), ev: true, sc: 5, hr: 110 }); break;
    }
  }

  /* ---------- cập nhật thực thể ---------- */
  function updEnt(G, o, dt, P) {
    o.t += dt; if (o.t < 0) return;
    switch (o.k) {
      case 'fire': {
        if (!alive(o.tg)) { let b = null, bd = 1e9; for (const e of G.en) { if (!alive(e)) continue; const d = (e.x - o.x) ** 2 + (e.y - o.y) ** 2; if (d < bd) { bd = d; b = e } } o.tg = b }
        if (o.tg) { const w = M.atan2(o.tg.y - o.y, o.tg.x - o.x); let da = w - o.a; da = M.atan2(M.sin(da), M.cos(da)); o.a += M.max(-1, M.min(1, da)) * 4.5 * dt * (1 + o.t) }
        o.x += M.cos(o.a) * o.spd * dt; o.y += M.sin(o.a) * o.spd * dt; let boom = o.t >= o.T;
        if (!boom) for (const e of G.en) if (alive(e) && M.hypot(e.x - o.x, e.y - o.y) < e.r + 14) { boom = true; break }
        if (boom) { o.t = o.T + 1; area(G, o.x, o.y, o.r, o.dmg, 'hoa', 260); for (const e of G.en) if (alive(e) && M.hypot(e.x - o.x, e.y - o.y) < o.r + e.r) burn(G, e, o.dmg * .12, 2); evn(G, { e: 'fireboom', x: o.x, y: o.y, r: o.r }); snd(G, 'hoa', 'impact') }
        break
      }
      case 'zone': {
        o.tk -= dt; if (o.tk <= 0) { o.tk = .5; area(G, o.x, o.y, o.r, o.dmg, o.st === 'poison' ? 'doc' : o.st === 'stake' ? 'nq' : 'bang'); for (const e of G.en) if (alive(e) && M.hypot(e.x - o.x, e.y - o.y) < o.r + e.r) o.st === 'poison' ? slow(e, .7, .8) : slow(e, .9, o.st === 'stake' ? .3 : .42) }
        if (o.st === 'poison') { const L = G.en; /* đám mây bám nhẹ theo địch gần */ let b = null, bd = o.r * o.r * 1.5; for (const e of L) { if (!alive(e)) continue; const d = (e.x - o.x) ** 2 + (e.y - o.y) ** 2; if (d < bd) { bd = d; b = e } } if (b) { o.x += (b.x - o.x) * .6 * dt; o.y += (b.y - o.y) * .6 * dt } }
        break
      }
      case 'twr': {
        o.x += M.cos(o.a) * o.spd * dt; o.y += M.sin(o.a) * o.spd * dt; o.a += M.sin(o.t * 1.3) * .6 * dt;
        for (const e of G.en) if (alive(e)) { const dx = o.x - e.x, dy = o.y - e.y, d = M.hypot(dx, dy); if (d < o.r * 1.8 && d > 4) { const k = (e.boss ? .25 : e.mb ? .5 : 1) * 130 * dt; e.x += dx / d * k; e.y += dy / d * k } }
        o.tk -= dt; if (o.tk <= 0) { o.tk = .35; area(G, o.x, o.y, o.r, o.dmg, 'phong') }
        break
      }
      case 'met': if (o.t >= o.T) { o.t = o.T + 1; area(G, o.x, o.y, o.r, o.dmg, 'tinh', 300); evn(G, { e: 'meteor', x: o.x, y: o.y, r: o.r }); snd(G, 'tinh', 'impact'); G.shake = M.max(G.shake || 0, .35) } break;
      case 'swd': if (alive(o.tg) && o.t < o.T * .6) { o.x = o.tg.x; o.y = o.tg.y } if (o.t >= o.T) { o.t = o.T + 1; area(G, o.x, o.y, o.r, o.dmg, 'tru', 420); evn(G, { e: 'sword', x: o.x, y: o.y, r: o.r }); snd(G, 'tru', 'impact'); G.shake = M.max(G.shake || 0, .6); G.hs = M.max(G.hs || 0, .04) } break;
      case 'bld': o.x += M.cos(o.a) * o.spd * dt; o.y += M.sin(o.a) * o.spd * dt; for (const e of G.en) if (alive(e) && !o.h.has(e) && M.hypot(e.x - o.x, e.y - o.y) < e.r + (o.hr || 16)) { o.h.add(e); G.src = o.hsrc || 'lien'; A.hit(e, o.dmg, M.cos(o.a) * 120, M.sin(o.a) * 120); G.src = null } break;
      case 'dome': o.x = P.x; o.y = P.y; break;
      case 'wave': o.x += M.cos(o.a) * o.spd * dt; o.y += M.sin(o.a) * o.spd * dt; for (const e of G.en) if (alive(e) && !o.h.has(e) && M.hypot(e.x - o.x, e.y - o.y) < o.r + e.r) { o.h.add(e); G.src = 'nq'; A.hit(e, o.dmg, M.cos(o.a) * 360, M.sin(o.a) * 360); G.src = null; slow(e, 1, .5) } break;
      case 'arw': o.x += M.cos(o.a) * o.spd * dt; o.y += M.sin(o.a) * o.spd * dt; for (const e of G.en) if (alive(e) && !o.h.has(e) && M.hypot(e.x - o.x, e.y - o.y) < e.r + 8) { o.h.add(e); G.src = 'dl'; A.hit(e, o.dmg, M.cos(o.a) * 120, M.sin(o.a) * 120); G.src = null; o.t = M.max(o.t, o.T - .08) } break;
      case 'bolt': if (o.t >= 0) { o.t = o.T + 1; area(G, o.x, o.y, o.r, o.dmg, 'thd', 200); evn(G, { e: 'bolt', x: o.x, y: o.y, r: o.r }) } break;
      case 'rain': o.tk -= dt; if (o.tk <= 0) { o.tk = .07; const a = R() * TAU, rr = M.sqrt(R()) * o.r, x = P.x + M.cos(a) * rr, y = P.y + M.sin(a) * rr; ent(G, { k: 'arwf', x, y, t: 0, T: .35, dmg: o.dmg }) } break;
      case 'arwf': if (o.t >= o.T) { o.t = o.T + 1; area(G, o.x, o.y, 44, o.dmg, 'dl', 120); evn(G, { e: 'arrowhit', x: o.x, y: o.y, r: 44 }) } break;
      case 'shrine': { const inn = !G.ending && M.hypot(P.x - o.x, P.y - o.y) < o.r; G.shrIn = inn; if (inn) { P.hp = M.min(P.mhp, P.hp + P.mhp * .025 * dt); o.tk -= dt; if (o.tk <= 0) { o.tk = 1; evn(G, { e: 'mote', x: P.x, y: P.y }) } } if (o.t >= o.T) G.shrIn = false; break }
    }
  }

  function tick(G, dt, api) {
    A = api; A.G = G; const P = G.p, s = G.sk, c = G.cd, S = G.skx; let N = null; const near = () => N || (N = A.near());
    for (const k in CAST) if (s[k] && !(c[k] > 0)) CAST[k](G, P, s[k], A.xm(k), c, near());
    const hid = A.hid, H = HERO[hid];
    if (H) for (const [i, key] of [[1, 'h1'], [2, 'h2']]) {
      if (c[key] == null) { c[key] = i === 1 ? 1.2 : 5; continue } if (c[key] > 0) continue;
      const T = near(); if (!T.length) { c[key] = .3; continue }
      const r = H[i === 1 ? 's1' : 's2'](G, P, T); c[key] = r === false ? .3 : H[i === 1 ? 'c1' : 'c2'] * (A.xm ? 1 : 1); if (r !== false) P.skc = .35;
    }
    const hs = G.hst || (G.hst = { am: 1, as: 1, spd: 1, cr: 0, cm: 0 }); if (H) heroPassive(G, P, dt, hs, hid);
    { const tot = { am: 1, as: 1, spd: 1, cr: 0, cm: 0, dr: 0 }, hb = G.hb; if (hb && hb.length) { let j = 0; for (const o of hb) { o.t -= dt; if (o.t > 0) { hb[j++] = o; if (o.k === 'am' || o.k === 'as' || o.k === 'spd') tot[o.k] *= 1 + o.v; else tot[o.k] += o.v } } hb.length = j }
      if (tot.am !== hs.am) { G.am = (G.am || 1) / hs.am * tot.am; hs.am = tot.am } if (tot.spd !== hs.spd) { P.spd = P.spd / hs.spd * tot.spd; hs.spd = tot.spd } if (tot.cr !== hs.cr) { G.cr = (G.cr || 0) + tot.cr - hs.cr; hs.cr = tot.cr } if (tot.cm !== hs.cm) { G.cm = (G.cm || 2) + tot.cm - hs.cm; hs.cm = tot.cm }
      G.hkm = (1 - tot.dr) * (G.hlow ? .85 : 1); G.hsa = tot.as }
    if (G.hshT > 0) { G.hshT -= dt; if (G.hshT <= 0) G.hsh = 0 }
    // thụ động (theo dõi hệ số đã áp để không chồng lên các nguồn khác)
    const st = G.skp || (G.skp = { mg: 1, as: 1, hr: 0 });
    { const w = 1 + .3 * (s.hut || 0); if (w !== st.mg) { G.mg = (G.mg || 1) / st.mg * w; st.mg = w } }
    // Linh Tuyền: sự kiện thưởng định kỳ (không khi có boss) — hồi máu + tăng tốc ra chiêu khi đứng trong vòng
    if (!G.ending && !G.boss && G.t > (G.shrN ? G.shrN : 30)) { G.shrN = G.t + 55; const a = R() * TAU; ent(G, { k: 'shrine', x: P.x + M.cos(a) * 260, y: P.y + M.sin(a) * 260, t: 0, T: 14, r: 95, tk: 0 }); G.fl.push({ x: P.x, y: P.y - 110, t: 2, T: 2, v: '✨ LINH TUYỀN XUẤT HIỆN', c: '#9dffb5', s: 17 }) }
    { const w = (1 + .08 * (s.ngu || 0)) * (G.shrIn ? 1.25 : 1) * (G.hsa || 1); if (w !== st.as) { G.as = (G.as || 1) / st.as * w; st.as = w } }
    if (s.hoi && P.hp > 0 && P.hp < P.mhp && !G.ending) { P.hp = M.min(P.mhp, P.hp + P.mhp * .004 * s.hoi * dt); st.hr -= dt; if (st.hr <= 0) { st.hr = 1.1; evn(G, { e: 'mote', x: P.x, y: P.y }) } }
    if (G.kcT > 0) { G.kcT -= dt; if (G.kcT <= 0) G.kcm = 1 }
    if (S && S.length) { for (const o of S) updEnt(G, o, dt, P); let j = 0; for (const o of S) if (o.t < o.T + 0.0 || (o.t < 0)) S[j++] = o; S.length = j }
    const b = G.skb; if (b && b.length) { let j = 0; for (const o of b) { o.t -= dt; o.tk -= dt; if (o.tk <= 0) { o.tk = .5; if (alive(o.e)) { G.src = 'hoa'; A.hit(o.e, o.d); G.src = null } } if (o.t > 0 && alive(o.e)) b[j++] = o } b.length = j }
    if (G.skxe && G.skxe.length > 40) G.skxe.length = 40;
  }

  /* ---------- bản vẽ 2D dự phòng ---------- */
  function draw2d(ctx, cx, cy, G) {
    const S = G.skx; if (!S) return; ctx.save();
    for (const o of S) {
      if (o.t < 0) continue; const x = o.x - cx, y = o.y - cy, u = M.min(1, o.t / o.T);
      if (o.k === 'zone') { ctx.globalAlpha = .35 * (1 - u * u); ctx.fillStyle = o.st === 'ice' ? '#7ad8ff' : '#6aff7a'; ctx.beginPath(); ctx.ellipse(x, y, o.r, o.r * .6, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = .8 * (1 - u); ctx.strokeStyle = '#fff'; ctx.stroke() }
      else if (o.k === 'fire') { ctx.globalAlpha = .9; ctx.fillStyle = '#ff9a3a'; ctx.beginPath(); ctx.arc(x, y - 12, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff1b0'; ctx.beginPath(); ctx.arc(x, y - 12, 4, 0, TAU); ctx.fill() }
      else if (o.k === 'twr') { ctx.globalAlpha = .5; ctx.strokeStyle = '#d8f4ff'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y - i * 14, o.r * (.4 + i * .18), o.r * .2, 0, 0, TAU); ctx.stroke() } }
      else if (o.k === 'met') { const f = M.max(0, 1 - o.t / o.T); ctx.globalAlpha = .6; ctx.strokeStyle = '#ff6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, o.r * (1 - f), o.r * (1 - f) * .6, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = '#ffb060'; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(x + o.ox * f, y - 340 * f, 12, 0, TAU); ctx.fill() }
      else if (o.k === 'swd') { const f = M.max(0, 1 - o.t / o.T); ctx.globalAlpha = .9; ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x - 5, y - 360 * f - 120, 10, 120); ctx.globalAlpha = .4; ctx.strokeStyle = '#ffd070'; ctx.beginPath(); ctx.ellipse(x, y, o.r * (1 - f * .6), o.r * .55 * (1 - f * .6), 0, 0, TAU); ctx.stroke() }
      else if (o.k === 'bld') { ctx.globalAlpha = .9; ctx.fillStyle = '#ffd0e8'; ctx.save(); ctx.translate(x, y); ctx.rotate(o.a); ctx.fillRect(-8, -2, 16, 4); ctx.restore() }
      else if (o.k === 'shrine') { ctx.globalAlpha = .35; ctx.fillStyle = '#7dff9a'; ctx.beginPath(); ctx.ellipse(x, y, o.r, o.r * .6, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = .9; ctx.strokeStyle = '#eaffd0'; ctx.stroke() }
      else if (o.k === 'wave') { ctx.globalAlpha = .6; ctx.strokeStyle = '#7ad8ff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, o.r, o.a - 1, o.a + 1); ctx.stroke() }
      else if (o.k === 'arw') { ctx.globalAlpha = .9; ctx.strokeStyle = '#eaffd0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - M.cos(o.a) * 22, y - M.sin(o.a) * 22); ctx.stroke() }
      else if (o.k === 'dome') { ctx.globalAlpha = .25; ctx.fillStyle = '#ffd070'; ctx.beginPath(); ctx.arc(x, y - 14, 42, 0, TAU); ctx.fill(); ctx.globalAlpha = .8; ctx.strokeStyle = '#ffe9a0'; ctx.stroke() }
    }
    ctx.restore();
  }
  /* chắn sát thương (Thiết Bích) + phản đòn (Thép Già) — gọi từ hurt() */
  function absorb(G, d) {
    if (G.hsh > 0 && d > 0) { const a = M.min(G.hsh, d); G.hsh -= a; d -= a; if (a > 0) G.fl.push({ x: G.p.x, y: G.p.y - 60, t: .5, T: .5, v: 'CHẶN ' + (a | 0), c: '#ffd9a0', s: 14 }) }
    if (A && A.hid === 'nb' && R() < .1) { let b = null, bd = 1e9; for (const e of G.en) { if (!alive(e)) continue; const q = (e.x - G.p.x) ** 2 + (e.y - G.p.y) ** 2; if (q < bd) { bd = q; b = e } } if (b) { G.src = 'nb'; A.hit(b, 40, 0, 0); G.src = null; evn(G, { e: 'cmd', x: G.p.x, y: G.p.y, r: 60, col: '#ffd9a0' }) } }
    return d;
  }
  /* sét chí mạng lan sang 1 địch kề (Hưng Đạo) — gọi từ hit() khi chí mạng */
  function onCrit(e, d) {
    const G = A && A.G; if (!G || A.hid !== 'thd' || G.src !== 'loi' || e._ch) return; let b = null, bd = 160 * 160;
    for (const o of G.en) { if (!alive(o) || o === e) continue; const q = (o.x - e.x) ** 2 + (o.y - e.y) ** 2; if (q < bd) { bd = q; b = o } } if (b) { e._ch = 1; evn(G, { e: 'bolt', x: b.x, y: b.y, r: 40 }); A.hit(b, d * .5, 0, 0); e._ch = 0 }
  }
  window.DV_SKX = { tick, draw2d, absorb, onCrit, ult: ultRider, keys: Object.keys(CAST) };
})();
