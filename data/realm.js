/* PHASE 12 · PART 4 — BÍ CẢNH · THỬ LUYỆN SINH TỒN · BOSS THẾ GIỚI (thuần dữ liệu + hàm thuần, không đọc/ghi save).
   Dựng trên DV_DATA.getStage() của Phase 5: mọi tầng Bí Cảnh / mọi đợt Thử Luyện = bản sao có hệ số của một màn thường
   → không nhân đôi dữ liệu. Engine (index.html) chỉ gọi build(), riftReward(), trialReward(), pct và wboss. Chỉnh cân bằng tại DV_DATA.realm.rules. */
window.DV_DATA = window.DV_DATA || {};
(function () {
  const D = window.DV_DATA;
  const clone = o => JSON.parse(JSON.stringify(o));
  const rnd = v => Math.max(0, Math.round(v));
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 };

  const RULES = {
    rift: {
      floors: 10, stamina: 8, sweepStamina: 5, daily: 5, maxBatch: 5,
      dur: 70, bossAt: 48,                                // mỗi tầng ngắn (70s), Thủ Hộ xuất hiện lúc 48s
      hp0: .85, hpStep: .17, dmg0: .9, dmgStep: .07,      // hệ số quái theo tầng: 0.85 → 2.38 (HP), 0.9 → 1.53 (ST)
      bossFloors: [5, 10], bossFloorHp: { 5: .9, 10: 1.25 },
      firstGem: 5, firstGemStep: 1, bossRewardMul: 1.5
    },
    trial: {
      stamina: 6, segment: 30, minutes: 45,
      hpPerMin: .30, hpQuad: .012, dmgPerMin: .12, dmgQuad: .004,
      unlockBest: [0, 240, 420, 600]                      // cần sống ≥ n giây ở cấp trước để mở cấp kế
    },
    wboss: { tl: 90, stamina: 5, phaseAt: [0, 30, 60], dailyClaim: 1 }
  };

  /* ───────────── BÍ CẢNH: 7 loại ───────────── */
  // need: số chương đã mở (sv.un) tối thiểu · mul: hệ số thưởng theo loại · aff: số lượng ưu tiên
  const TYPES = [
    { id: 'ore', n: 'Hắc Thiết Quật', i: '⛏', col: '#7a8794', need: 0, d: 'Mỏ cổ nơi quái canh giữ — rơi nhiều Tinh thiết.', focus: 'tinh', mul: { tinh: 3.5 } },
    { id: 'gold', n: 'Tụ Bảo Động', i: '💰', col: '#c9a227', need: 1, d: 'Kho báu bọn cướp — rơi nhiều Vàng.', focus: 'gold', mul: { gold: 4 } },
    { id: 'exp', n: 'Thiên Địa Lò', i: '🧘', col: '#3a8dff', need: 2, d: 'Linh khí dày đặc — tăng mạnh EXP tướng.', focus: 'exp', mul: { exp: 4 } },
    { id: 'soul', n: 'Hồn Tướng Điện', i: '🔮', col: '#a64bff', need: 3, d: 'Hồn phách anh linh — rơi nhiều Hồn tướng.', focus: 'hon', mul: { hon: 4 } },
    { id: 'gear', n: 'Binh Khí Trủng', i: '⚔', col: '#d9532b', need: 5, d: 'Mộ binh khí — rơi nhiều trang bị phẩm chất cao.', focus: 'gear', mul: { drops: 2, minRar: 1, bias: 12 } },
    { id: 'rune', n: 'Phù Văn Các', i: '🔶', col: '#e8903a', need: 7, d: 'Các thờ Phù Văn — nguồn duy nhất của Phù Văn Thạch.', focus: 'rs', mul: { rs: 1 } },
    { id: 'gem', n: 'Thiên Cơ Các', i: '💎', col: '#35c4c4', need: 10, d: 'Tầng cao nhất giang hồ — rơi Kim cương, quái hung hãn nhất.', focus: 'gem', mul: { gem: 1 }, harder: 1.15 }
  ];
  const type = id => TYPES.find(t => t.id === id) || null;
  const typeOpen = (id, un) => { const t = type(id); return !!t && (un | 0) >= t.need };

  /* Phẩm chất tầng (affix): mỗi tầng 1–3 luật. Luật nằm trong dữ liệu — engine chỉ đọc hệ số. */
  const AFF = [
    { id: 'swift', n: 'Cuồng Phong', i: '🌪', d: 'Quái chạy nhanh +18%', w: { sp: 1.18 } },
    { id: 'iron', n: 'Thiết Giáp', i: '🛡', d: 'Quái trâu hơn +35% sinh lực, chậm hơn 5%', w: { hp: 1.35, sp: .95 } },
    { id: 'swarm', n: 'Thú Triều', i: '🐺', d: 'Quái đông hơn +40%, yếu hơn 20%', w: { dens: 1.4, hp: .8 } },
    { id: 'meteor', n: 'Thiên Thạch', i: '☄', d: 'Mưa thiên thạch định kỳ', ev: [{ at: 14, ev: 'meteor' }, { at: 34, ev: 'meteor' }, { at: 56, ev: 'meteor' }] },
    { id: 'ambush', n: 'Phục Kích', i: '⚠', d: 'Phục kích và quân ồ ạt', ev: [{ at: 20, ev: 'ambush' }, { at: 42, ev: 'horde' }] },
    { id: 'fury', n: 'Huyết Nộ', i: '🩸', d: 'Quái đánh đau +30%, bạn đánh mạnh +10%', w: { dmg: 1.3 }, p: { am: 1.1 } },
    { id: 'frail', n: 'Thể Yếu', i: '💔', d: 'Bạn nhận thêm 25% sát thương, quái yếu hơn 10%', w: { hp: .9 }, p: { hin: 1.25 } },
    { id: 'blessed', n: 'Phúc Địa', i: '🍀', d: 'Có suối hồi sinh và Tướng Vàng', ev: [{ at: 24, ev: 'heal' }, { at: 38, ev: 'golden' }, { at: 52, ev: 'heal' }] },
    { id: 'elite', n: 'Tinh Anh Đông', i: '⭐', d: 'Tỉ lệ Tinh Anh ×3', w: { el: 3 } }
  ];
  const affOf = id => AFF.find(a => a.id === id) || null;
  /** Danh sách luật cố định theo (loại, tầng): tầng 1 không có · 2–4: 1 · 5–8: 2 · 9–10: 3 */
  function affixes(tid, f) {
    const n = f <= 1 ? 0 : f <= 4 ? 1 : f <= 8 ? 2 : 3, out = [], used = {};
    let h = hash(tid + ':' + f);
    while (out.length < n) { const a = AFF[h % AFF.length]; h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; if (!used[a.id]) { used[a.id] = 1; out.push(a.id) } else h++; }
    return out;
  }
  const refChapter = un => Math.max(0, Math.min((un | 0), (D.db ? D.db.chapters.length : 52) - 1));
  const floorMul = f => ({ hp: RULES.rift.hp0 + RULES.rift.hpStep * (f - 1), dmg: RULES.rift.dmg0 + RULES.rift.dmgStep * (f - 1) });
  const isBossFloor = f => RULES.rift.bossFloors.indexOf(f) >= 0;

  /** Dựng một mini-stage cho tầng f của Bí Cảnh `tid`, dựa trên chương c. Trả về cùng schema getStage(). */
  function buildRift(S) {
    const R = RULES.rift, T = type(S.r), f = Math.max(1, Math.min(R.floors, S.f | 0 || 1)), c = S.c | 0;
    const base = D.getStage(c, 3), bt = D.getStage(c, isBossFloor(f) ? 6 : 3);
    if (!T || !base || !bt) return null;
    const st = clone(base), fm = floorMul(f), hard = T.harder || 1, aff = affixes(T.id, f).map(affOf);
    const W = {}, P = {}, ev = [];
    aff.forEach(a => { for (const k in (a.w || {})) W[k] = (W[k] || 1) * a.w[k]; for (const k in (a.p || {})) P[k] = (P[k] || 1) * a.p[k]; (a.ev || []).forEach(e => ev.push(e)) });
    const tw = base.waves, pick = fr => clone(tw[Math.min(tw.length - 2, Math.max(1, Math.round(tw.length * fr)))]);
    const segs = [[0, 16, 'start', 'Khởi đầu', clone(tw[0])], [16, 32, 'wave', 'Đợt thường', pick(.35)], [32, R.bossAt, 'dense', 'Đợt dày đặc', pick(.6)], [R.bossAt, R.dur, 'final', 'Thủ Hộ & đợt cuối', pick(.85)]];
    st.waves = segs.map(([a, b, k, lb, w]) => {
      w.startTime = a; w.endTime = b; w.kind = k; w.label = lb;
      w.scale.hp *= fm.hp * hard * (W.hp || 1); w.scale.dmg *= fm.dmg * hard * (W.dmg || 1); w.scale.sp *= (W.sp || 1);
      w.maxAlive = rnd(w.maxAlive * (W.dens || 1)); w.spawnInterval = +(w.spawnInterval * (W.iv || 1)).toFixed(3);
      w.eliteChance = Math.min(.2, (w.eliteChance || 0) * (W.el || 1)); return w;
    });
    const sc = i => st.waves[Math.min(i, st.waves.length - 1)].scale;
    st.events = [{ at: 14, k: 'elite', n: f >= 6 ? 2 : 1, sc: clone(sc(1)) }, { at: 30, k: 'elite', n: f >= 6 ? 2 : 1, sc: clone(sc(2)) }];
    if (f >= 3) st.events.push({ at: 40, k: 'mini', id: base.miniBoss.id, sc: clone(sc(2)) });
    ev.forEach(e => st.events.push({ at: e.at, k: 'event', ev: e.ev, n: 1, sc: clone(sc(e.at < 32 ? 1 : 2)) }));
    st.events.sort((a, b) => a.at - b.at); st.events.push({ at: R.bossAt, k: 'boss', sc: clone(bt.boss.scale) });
    const b = clone(bt.boss); b.at = R.bossAt;
    b.hp = rnd(b.hp * fm.hp * hard * (R.bossFloorHp[f] || 1)); b.dmg = +(b.dmg * fm.dmg * hard).toFixed(2);
    b.mech = (b.mech || []).map(m => Object.assign({}, m, m.dmg ? { dmg: +(m.dmg * fm.dmg * hard).toFixed(2) } : {}));
    b.scale = clone(sc(3)); st.boss = b; st.miniBoss = clone(base.miniBoss);
    st.miniBoss.hp = rnd(st.miniBoss.hp * fm.hp * hard);
    st.duration = R.dur; st.bossAt = R.bossAt; st.stageId = 'R-' + T.id + '-' + f; st.type = 'n'; st.role = 'rift';
    st.recommendedPower = rnd(base.recommendedPower * (.8 + .12 * (f - 1)) * hard);
    st.rift = { type: T.id, floor: f, aff: aff.map(a => a.id), boss: isBossFloor(f) };
    st.mod = P;                                           // hệ số cho người chơi (am, hin…) — engine áp dụng lúc vào màn
    return st;
  }

  /** Thưởng 1 tầng. win: thắng; first: lần đầu qua tầng; sweep: quét (không có thưởng lần đầu) */
  function riftReward(tid, f, c, win, opt) {
    opt = opt || {}; const R = RULES.rift, T = type(tid), st = D.getStage(c, 3), r = st.rewards, g = 1 + .25 * (f - 1);
    const bm = isBossFloor(f) ? R.bossRewardMul : 1, m = T.mul, k = g * bm;
    const o = { exp: rnd(r.exp * .5 * (m.exp || 1) * k), gold: rnd(r.gold * .5 * (m.gold || 1) * k), tinh: rnd(Math.max(2, r.materials.tinh) * (m.tinh || 1) * k), hon: rnd(Math.max(1, r.charMaterials.hon) * (m.hon || 1) * k),
      rs: m.rs ? rnd((2 + f) * (isBossFloor(f) ? 2 : 1)) : 0, gem: m.gem ? rnd((6 + 2 * f) * bm) : 0,
      drops: rnd(1 + (m.drops || 0) + (isBossFloor(f) ? 1 : 0)), minRar: Math.min(3, (m.minRar || 0) + (f >= 8 ? 1 : 0)), bias: (r.equipment.bias || 0) + (m.bias || 0) + f, first: 0 };
    if (!win) { for (const q of ['exp', 'gold', 'tinh', 'hon', 'rs', 'gem']) o[q] = 0; o.drops = 0; return o }
    if (opt.first && !opt.sweep) { o.first = 1; o.gem += R.firstGem + R.firstGemStep * f; o.drops += 1; o.minRar = Math.min(3, o.minRar + 1) }
    return o;
  }

  /* ───────────── THỬ LUYỆN SINH TỒN (vô tận) ───────────── */
  const TIERS = [
    { n: 'Đồng', i: '🥉', col: '#b87333', hp: .8, dmg: .85, rw: 1 },
    { n: 'Bạc', i: '🥈', col: '#c0c8d0', hp: 1.0, dmg: 1.0, rw: 1.6 },
    { n: 'Vàng', i: '🥇', col: '#ffd34a', hp: 1.3, dmg: 1.15, rw: 2.4 },
    { n: 'Huyền', i: '🌌', col: '#a64bff', hp: 1.7, dmg: 1.3, rw: 3.5 }];
  const MILE = [[180, 8], [300, 12], [480, 20], [720, 30], [960, 45], [1200, 60], [1500, 80], [1800, 120]];   // [giây, 💎]
  const MILE_DROP = { 480: 1, 960: 2, 1800: 3 };                                                              // phẩm chất trang bị tặng thêm
  const trialScale = (t, T) => { const m = t / 60; return { hp: (1 + RULES.trial.hpPerMin * m + RULES.trial.hpQuad * m * m) * T.hp, dmg: (1 + RULES.trial.dmgPerMin * m + RULES.trial.dmgQuad * m * m) * T.dmg } };
  const tierOpen = (ti, best) => ti <= 0 || ((best || [])[ti - 1] | 0) >= RULES.trial.unlockBest[ti];

  function buildTrial(S) {
    const Rt = RULES.trial, T = TIERS[Math.max(0, Math.min(TIERS.length - 1, S.tier | 0))], c = S.c | 0, base = D.getStage(c, 3);
    if (!base) return null;
    const st = clone(base), n = Math.round(Rt.minutes * 60 / Rt.segment), tw = base.waves, pat = ['ring', 'burst', 'swarm', 'line'];
    const W0 = tw[Math.min(tw.length - 2, Math.max(1, Math.round(tw.length * .5)))], sc0 = W0.scale;
    st.waves = []; st.events = [];
    for (let k = 0; k < n; k++) {
      const t = k * Rt.segment, m = t / 60, s = trialScale(t, T), w = clone(W0);
      w.startTime = t; w.endTime = t + Rt.segment; w.kind = 'wave'; w.label = 'Phút ' + String(Math.floor(m)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
      w.scale = { hp: sc0.hp * s.hp, dmg: sc0.dmg * s.dmg, sp: Math.min(1.45, sc0.sp * (1 + .012 * m)), exp: sc0.exp * (1 + .1 * m) };
      w.maxAlive = Math.round(Math.min(120, 20 + 3 * Math.min(30, m * 2.2))); w.spawnInterval = +Math.max(.28, 1.0 - .04 * m).toFixed(3);
      w.spawnCount = Math.min(5, 1 + Math.floor(m / 3)); w.spawnPattern = pat[k % pat.length]; w.eliteChance = Math.min(.14, .012 + .008 * m);
      st.waves.push(w);
      if (k > 0 && k % 4 === 0) st.events.push({ at: t, k: 'elite', n: 1 + Math.floor(m / 4), sc: clone(w.scale) });
      if (k > 0 && k % 6 === 3) st.events.push({ at: t + 5, k: 'event', ev: ['ambush', 'meteor', 'horde', 'heal', 'golden'][(k / 6 | 0) % 5], n: 1, sc: clone(w.scale) });
      if (k > 0 && k % 8 === 7) st.events.push({ at: t + 8, k: 'mini', id: base.miniBoss.id, sc: clone(w.scale) });
    }
    st.events.sort((a, b) => a.at - b.at);
    st.miniBoss = clone(base.miniBoss); st.miniBoss.hp = rnd(st.miniBoss.hp * T.hp);
    st.duration = Rt.minutes * 60; st.bossAt = 1e9; st.stageId = 'T-' + (S.tier | 0); st.type = 'n'; st.role = 'trial';
    st.recommendedPower = rnd(base.recommendedPower * (1 + .25 * (S.tier | 0)));
    st.trial = { tier: S.tier | 0, name: T.n }; st.mod = {};
    return st;
  }

  /** Thưởng một lượt Thử Luyện theo thời gian sống sót (t giây), tầng Tier, số quái hạ */
  function trialReward(tier, t, kills, c, bestOld) {
    const T = TIERS[Math.max(0, Math.min(TIERS.length - 1, tier | 0))], st = D.getStage(c, 3), r = st.rewards, m = t / 60, o = {
      exp: rnd((r.exp * .35 * m + kills * 8 * r.killExpMul) * T.rw), gold: rnd((r.gold * .35 * m + kills * 3) * T.rw),
      tinh: rnd(Math.max(1, r.materials.tinh * .4) * m * T.rw), hon: rnd(Math.max(.3, r.charMaterials.hon * .25) * m * T.rw), rs: 0, gem: 0, drops: 0, minRar: 0, bias: 10, ms: []
    };
    for (const [sec, gem] of MILE) if (t >= sec && (bestOld | 0) < sec) { o.ms.push({ sec, gem: rnd(gem * T.rw) }); o.gem += rnd(gem * T.rw); const dr = MILE_DROP[sec]; if (dr) { o.drops++; o.minRar = Math.max(o.minRar, dr) } }
    return o;
  }

  /* Bảng nâng cấp % ngẫu nhiên của Thử Luyện: mỗi lần lên cấp rút 3 thẻ (xem mixPool ở js/realm.js) */
  const PCT = {
    rar: [{ n: 'Thường', c: '#35c46a', w: 60 }, { n: 'Hiếm', c: '#3a8dff', w: 28 }, { n: 'Sử Thi', c: '#a64bff', w: 10 }, { n: 'Huyền Thoại', c: '#ff9a2e', w: 2 }],
    stats: [
      { k: 'am', n: 'Công Lực', i: '⚔️', v: [.06, .10, .16, .25], d: 'Sát thương gây ra' },
      { k: 'as', n: 'Tốc Đánh', i: '💨', v: [.05, .08, .12, .18], d: 'Tốc độ ra đòn' },
      { k: 'cr', n: 'Bạo Kích', i: '🎯', v: [.03, .05, .08, .12], d: 'Tỉ lệ bạo kích', cap: .75 },
      { k: 'cm', n: 'Sát Thương Bạo', i: '💥', v: [.10, .18, .28, .42], d: 'Sát thương khi bạo kích' },
      { k: 'mhp', n: 'Sinh Lực', i: '❤️', v: [.08, .14, .22, .35], d: 'Sinh lực tối đa (hồi tương ứng)' },
      { k: 'spd', n: 'Thân Pháp', i: '🍃', v: [.04, .07, .10, .15], d: 'Tốc độ di chuyển' },
      { k: 'dr', n: 'Hộ Thể', i: '🛡️', v: [.03, .05, .08, .12], d: 'Giảm sát thương nhận', cap: .6 },
      { k: 'rgn', n: 'Hồi Khí', i: '💚', v: [.002, .004, .007, .011], d: 'Hồi sinh lực mỗi giây (% tối đa)', fine: 1 },
      { k: 'mg', n: 'Hấp Linh', i: '🧲', v: [.15, .25, .40, .60], d: 'Tầm hút EXP / vàng' },
      { k: 'xg', n: 'Ngộ Đạo', i: '📘', v: [.08, .14, .22, .35], d: 'EXP nhận được' },
      { k: 'ec', n: 'Khí Tụ', i: '🔥', v: [.10, .18, .28, .42], d: 'Tuyệt kỹ nạp nhanh hơn' }]
  };
  const pctStat = k => PCT.stats.find(s => s.k === k) || null;
  /** Rút độ hiếm theo trọng số; luck (0..) dịch trọng số sang hiếm hơn khi lên cấp cao. rng: () => [0,1) */
  function pctRar(rng, luck) {
    const w = PCT.rar.map((r, i) => r.w * (i ? 1 + (luck || 0) * .04 * i : 1)), tot = w.reduce((a, b) => a + b, 0); let x = rng() * tot;
    for (let i = 0; i < w.length; i++) { if ((x -= w[i]) <= 0) return i } return 0;
  }
  /** Rút n thẻ % khác loại nhau → ['pct:<stat>:<rar>', …] */
  function pctRoll(rng, luck, n) {
    const ks = PCT.stats.map(s => s.k), out = [];
    while (out.length < n && ks.length) { const i = Math.floor(rng() * ks.length), k = ks.splice(i, 1)[0]; out.push('pct:' + k + ':' + pctRar(rng, luck)) }
    return out;
  }
  const pctVal = (k, r) => { const s = pctStat(k); return s ? s.v[Math.max(0, Math.min(3, r | 0))] : 0 };
  const pctText = (k, r) => { const s = pctStat(k), v = pctVal(k, r); return s ? s.n + ' +' + (s.fine ? Math.round(v * 1000) / 10 : Math.round(v * 100)) + '%' + (s.fine ? '/s' : '') : '' };
  /** Áp một thẻ % lên G (đối tượng ván chơi). Trả về chuỗi mô tả. */
  function pctApply(G, key) {
    const [, k, r0] = String(key).split(':'), r = +r0 | 0, v = pctVal(k, r), s = pctStat(k), P = G.p; if (!s) return '';
    switch (k) {
      case 'am': G.am *= 1 + v; break;
      case 'as': G.as = (G.as || 1) * (1 + v); break;
      case 'cr': G.cr = Math.min(s.cap, (G.cr || 0) + v); break;
      case 'cm': G.cm = (G.cm || 2) + v; break;
      case 'mhp': { const add = P.mhp * v; P.mhp += add; P.hp += add; break }
      case 'spd': P.spd *= 1 + v; break;
      case 'dr': G.dr = Math.min(s.cap, (G.dr || 0) + v); break;
      case 'rgn': G.rgn = (G.rgn || 0) + v; break;
      case 'mg': G.mg = (G.mg || 1) + v; break;
      case 'xg': G.xg = (G.xg || 1) + v; break;
      case 'ec': G.ec = (G.ec || 1) + v; break;
    }
    G.tp = G.tp || {}; G.tp[k] = (G.tp[k] || 0) + 1; return pctText(k, r);
  }

  /* ───────────── BOSS THẾ GIỚI: Hắc Long 3 giai đoạn ───────────── */
  const PH = [
    { n: 'Hắc Long Thức Giấc', c: '#ffd34a', say: '🐲 HẮC LONG THỨC GIẤC!' },
    { n: 'Long Hỏa Phun Trào', c: '#ff8a3a', say: '🔥 GIAI ĐOẠN 2 — LONG HỎA PHUN TRÀO! Né vòng đỏ!' },
    { n: 'Cuồng Long Nổi Giận', c: '#ff4a4a', say: '💢 GIAI ĐOẠN 3 — CUỒNG LONG NỔI GIẬN!' }];
  const WMECH = [   // ph: giai đoạn tối thiểu để kích hoạt (khớp abil() của engine); 'rain' = vùng nguy hiểm nhiều điểm
    { k: 'shoot', n: 3, spread: .45, cd: 3.0, sp: 200, dmg: 6, ph: 1 },
    { k: 'nova', n: 10, cd: 5.5, sp: 130, dmg: 5, ph: 1 },
    { k: 'rain', n: 4, spread: 440, r: 62, tel: 1.6, gap: .2, cd: 6.5, dmg: 9, ph: 2 },
    { k: 'slam', r: 115, tel: 1.3, cd: 6.5, dmg: 12, ph: 2 },
    { k: 'summon', id: 'grunt', n: 2, cap: 6, cd: 9, ph: 2 },
    { k: 'spiral', arms: 2, dur: 3, sp: 150, cd: 10, dmg: 5, ph: 3 },
    { k: 'rain', n: 6, spread: 500, r: 56, tel: 1.4, gap: .16, cd: 5.5, dmg: 10, ph: 3 },
    { k: 'dash', tel: 1.0, spd: 480, t: .35, cd: 8, dmg: 13, ph: 3 },
    { k: 'enrage', sp: 1.15, cd: .85, ph: 3 }];
  const phaseOf = el => { const a = RULES.wboss.phaseAt; return el >= a[2] ? 3 : el >= a[1] ? 2 : 1 };
  /** Hạng theo sát thương cao nhất trong 1 lượt (90s) */
  const RANKS = [
    { n: 'Tân Binh', i: '🪵', min: 0, rw: { g: 800 } },
    { n: 'Đồng', i: '🥉', min: 3000, rw: { g: 1500, t: 10 } },
    { n: 'Bạc', i: '🥈', min: 8000, rw: { g: 2500, t: 20, m: 10 } },
    { n: 'Vàng', i: '🥇', min: 18000, rw: { g: 4000, t: 30, m: 20, rs: 3 } },
    { n: 'Bạch Kim', i: '💠', min: 36000, rw: { g: 6000, t: 45, m: 35, rs: 6 } },
    { n: 'Kim Cương', i: '💎', min: 64000, rw: { g: 9000, t: 70, m: 60, rs: 10 } },
    { n: 'Tông Sư', i: '🏯', min: 100000, rw: { g: 14000, t: 100, m: 90, rs: 16 } },
    { n: 'Võ Thần', i: '🐉', min: 150000, rw: { g: 20000, t: 150, m: 150, rs: 25 } }];
  /** Mốc hạng tăng theo tiến độ (un = số chương đã mở): ×(1 + 0.1·un), tối đa ×7 */
  const rankMin = (i, un) => Math.round(RANKS[i].min * (1 + .1 * Math.min(60, un | 0)));
  const rankOf = (dmg, un) => { let r = 0; for (let i = 0; i < RANKS.length; i++) if (dmg >= rankMin(i, un)) r = i; return r };
  const rankNext = (dmg, un) => { const r = rankOf(dmg, un); return r + 1 < RANKS.length ? { r: r + 1, need: rankMin(r + 1, un) - dmg } : null };
  /** Thực thể Boss thế giới (ghi đè lên thực thể thường của engine). un = số chương đã mở → độ đau của đòn */
  function wbossEnt(un) {
    const ds = 1 + .05 * Math.min(40, un | 0), mech = clone(WMECH);
    return { ab: mech, cv: mech.map(m => (m.cd || 1) * (.6 + Math.random() * .4)), ds, tel: 0, dsh: 0, shd: 0, shr: 0, spt: 0, ph: 1, pp: 0, wbs: 1, arm: 0, enr: 0, split: null, bm: 0, kid: 0, sc: { hp: 1, dmg: ds, sp: 1, exp: 1 }, r: 34, sp: 40, dmg: 9 * ds };
  }

  D.realm = {
    rules: RULES, types: TYPES, type, typeOpen, aff: AFF, affOf, affixes, refChapter, floorMul, isBossFloor,
    buildRift, riftReward,
    tiers: TIERS, mile: MILE, tierOpen, trialScale, buildTrial, trialReward,
    pct: { def: PCT, stat: pctStat, roll: pctRoll, rar: pctRar, val: pctVal, text: pctText, apply: pctApply },
    wboss: { phases: PH, mech: WMECH, phase: phaseOf, ranks: RANKS, rankMin, rankOf, rankNext, ent: wbossEnt },
    /** Dựng stage theo S = {x:'rift'|'trial', c, …} — engine gọi từ dbStage() */
    build(S) { return S.x === 'rift' ? buildRift(S) : S.x === 'trial' ? buildTrial(S) : null }
  };
})();
