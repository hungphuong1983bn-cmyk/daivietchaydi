/* Phase 12 · Part 6 — Dữ liệu CẢNH GIỚI (10 bậc) + MÔN PHÁI (5 phái). Thuần dữ liệu + hàm thuần (kiểm được bằng node).
   Thiếu file này → game chạy như cũ (không cộng chỉ số, nút Môn phái báo "đang phát triển").

   Khoá hiệu ứng khớp bon() trong index.html:  am = công (%) · hp = sinh lực · sp = tốc độ (%) · cr = bạo kích · dg = né đòn · cm = ST bạo kích
   Khoá hiệu ứng TRONG VÁN (run):  rgn = hồi máu %/giây · xg = nhân EXP · mg = nhân tầm hút đồ · ec = nhân tốc nạp tuyệt kỹ · dr = giảm sát thương

   CẢNH GIỚI — theo TỪNG TƯỚNG (sv.cg[heroId] = 0..9). Đột phá tuần tự, tốn 🪙 + ⚙ Tinh thiết + 🔮 Hồn tướng,
              cần cấp tướng + số chương đã mở. Bonus cộng dồn qua các bậc đã đạt.
   MÔN PHÁI  — theo TÀI KHOẢN (sv.sc): gia nhập 1 phái, tích Cống Hiến, lên cấp phái (1–10), học 4 Tuyệt Học.
              Tiến độ mỗi phái được giữ riêng (đổi phái không mất). Tướng "hợp phái" nhận bonus ×1.25. */
window.DV_DATA = window.DV_DATA || {};
DV_DATA.sect = (() => {
  const M = Math;
  const EK = {
    am: ['Công', 1], hp: ['Sinh lực', 0], sp: ['Tốc độ', 1], cr: ['Bạo kích', 1], dg: ['Né đòn', 1], cm: ['ST bạo kích', 1],
    rgn: ['Hồi máu/giây', 2], xg: ['EXP trong ván', 3], mg: ['Tầm hút đồ', 3], ec: ['Nạp tuyệt kỹ', 3], dr: ['Giảm sát thương', 1]
  };
  const STAT = ['am', 'hp', 'sp', 'cr', 'dg', 'cm'], RUN = ['rgn', 'xg', 'mg', 'ec', 'dr'];
  const r1 = v => M.round(v * 1000) / 10;
  /** Mô tả hiệu ứng: kiểu 0 = số nguyên, 1 = +x%, 2 = +x%/giây, 3 = nhân (×1.12 → +12%) */
  const fmt = e => Object.keys(e || {}).filter(k => EK[k] && e[k]).map(k => {
    const t = EK[k][1], v = e[k];
    if (t === 0) return EK[k][0] + ' +' + M.round(v);
    if (t === 3) return EK[k][0] + ' +' + M.round((v - 1) * 100) + '%';
    if (t === 2) return EK[k][0] + ' +' + r1(v) + '%';
    return EK[k][0] + ' +' + r1(v) + '%';
  }).join(', ');
  const add = (o, e, m) => { for (const k in e) o[k] = (o[k] || 0) + e[k] * (m || 1); return o };

  /* ───────────── CẢNH GIỚI ───────────── */
  /* lv = cấp tướng tối thiểu (trần cấp: 0★=30 … 5★=55) · un = số chương đã mở tối thiểu (sv.un) · c = chi phí {g vàng, t tinh thiết, h hồn tướng}
     e = bonus cộng dồn khi ĐẠT bậc này · r = hiệu ứng trong ván (cộng dồn) · big = đại cảnh giới (có hiệu ứng nổi bật) */
  const realms = [
    { n: 'Phàm Nhân', i: '👤', col: '#9aa0a6', d: 'Thân xác phàm tục, chưa nhập đạo.' },
    { n: 'Luyện Thể', i: '💪', col: '#c9a27a', lv: 5, un: 0, c: { g: 1500, t: 5, h: 0 }, e: { hp: 30, am: .02 }, d: 'Rèn gân cốt, thể phách vững vàng.' },
    { n: 'Luyện Khí', i: '🌬', col: '#7ec8e3', lv: 10, un: 1, c: { g: 4000, t: 15, h: 0 }, e: { am: .03, sp: .01 }, d: 'Dẫn khí vào kinh mạch, hơi thở hoà nhịp đất trời.' },
    { n: 'Trúc Cơ', i: '🏛', col: '#5fd18a', lv: 15, un: 2, c: { g: 9000, t: 30, h: 5 }, e: { hp: 40, cr: .01, dg: .01 }, r: { mg: 1.25 }, big: 1, d: 'Xây nền móng đạo cơ — nhặt đồ xa hơn.' },
    { n: 'Kết Đan', i: '🔴', col: '#e8a33d', lv: 20, un: 4, c: { g: 20000, t: 60, h: 10 }, e: { am: .04, hp: 40, cm: .08 }, r: { rgn: .003 }, big: 1, d: 'Ngưng tụ kim đan — tự hồi sinh lực trong trận.' },
    { n: 'Nguyên Anh', i: '🧿', col: '#b184ff', lv: 25, un: 7, c: { g: 40000, t: 100, h: 20 }, e: { am: .04, cr: .01, sp: .01, dg: .01 }, d: 'Nguyên thần thành hình, ra khỏi xác phàm.' },
    { n: 'Hoá Thần', i: '🌟', col: '#ff7ab8', lv: 30, un: 11, c: { g: 80000, t: 160, h: 35 }, e: { hp: 50, am: .04, cm: .10 }, r: { xg: 1.10 }, big: 1, d: 'Thần thức thông thiên — nhận thêm EXP trong ván.' },
    { n: 'Luyện Hư', i: '🌀', col: '#4ac9ff', lv: 38, un: 16, c: { g: 150000, t: 240, h: 55 }, e: { am: .04, cr: .02, sp: .02, dg: .01 }, d: 'Hư không thành đạo, thân hoà vào hư vô.' },
    { n: 'Đại Thừa', i: '☯', col: '#ffd34d', lv: 46, un: 22, c: { g: 280000, t: 350, h: 80 }, e: { hp: 50, am: .04, cm: .12 }, r: { ec: 1.15 }, big: 1, d: 'Đạo quả viên mãn — tuyệt kỹ nạp nhanh hơn.' },
    { n: 'Độ Kiếp', i: '⚡', col: '#ff5a3c', lv: 54, un: 30, c: { g: 500000, t: 500, h: 120 }, e: { am: .05, hp: 50, cr: .03, sp: .03, dg: .03, cm: .20 }, r: { dr: .05, rgn: .002 }, big: 1, d: 'Vượt Thiên Kiếp, chạm ngưỡng phi thăng.' }
  ];
  const MAXR = realms.length - 1;
  const clampR = s => M.max(0, M.min(MAXR, s | 0));
  const realm = s => realms[clampR(s)];
  /** Tổng bonus chỉ số của cảnh giới bậc s (cộng dồn 1..s) */
  const realmBonus = s => { const o = {}; for (let k = 1; k <= clampR(s); k++) add(o, realms[k].e); return o };
  /** Hiệu ứng trong ván của cảnh giới bậc s */
  const realmRun = s => { const o = {}; for (let k = 1; k <= clampR(s); k++) { const r = realms[k].r; if (!r) continue; for (const x in r) { if (x === 'rgn' || x === 'dr') o[x] = (o[x] || 0) + r[x]; else o[x] = (o[x] || 1) * r[x] } } return o };
  /** Điều kiện đột phá từ bậc s lên s+1. ctx = {lv, un, gold, mt, hon} → {ok, max, next, miss:[…], req:{lv,un,g,t,h}} */
  function breakCheck(s, ctx) {
    s = clampR(s); if (s >= MAXR) return { ok: false, max: true, next: null, miss: [], req: null };
    const N = realms[s + 1], miss = [], c = ctx || {};
    const f = { lv: (c.lv | 0) >= N.lv, un: (c.un | 0) >= N.un, g: (c.gold | 0) >= N.c.g, t: (c.mt | 0) >= N.c.t, h: (c.hon | 0) >= N.c.h };
    if (!f.lv) miss.push('Cấp tướng ' + N.lv); if (!f.un) miss.push('Mở chương ' + (N.un + 1));
    if (!f.g) miss.push('🪙 ' + N.c.g.toLocaleString('vi')); if (!f.t) miss.push('⚙ ' + N.c.t); if (!f.h) miss.push('🔮 ' + N.c.h);
    return { ok: !miss.length, max: false, next: N, miss, flags: f, req: { lv: N.lv, un: N.un, g: N.c.g, t: N.c.t, h: N.c.h } };
  }

  /* ───────────── MÔN PHÁI ───────────── */
  const rules = {
    joinUn: 1,            // cần mở tới chương 2 (sv.un ≥ 1)
    switchGem: 50,        // phí đổi phái (💎); lần gia nhập đầu miễn phí
    aff: 1.25,            // hệ số bonus cho tướng hợp phái
    levels: [0, 50, 130, 250, 420, 650, 950, 1350, 1850, 2500], // ngưỡng Cống Hiến TỔNG của cấp 1…10
    checkin: 20,          // Cống Hiến điểm danh/ngày
    donate: { g: 2000, ch: 10, max: 10 }, // quyên góp 🪙 → Cống Hiến, tối đa lần/ngày
    tasks: [              // nhiệm vụ ngày: tiến độ lấy từ bộ đếm nhiệm vụ ngày của game (sv.qd.D[k])
      { k: 'games', n: 3, ch: 15, t: 'Vào trận 3 lần' },
      { k: 'wins', n: 2, ch: 20, t: 'Thắng 2 trận' },
      { k: 'kills', n: 200, ch: 25, t: 'Hạ 200 quái' }
    ]
  };
  const sects = [
    { id: 'tayson', n: 'Tây Sơn Đao Môn', i: '🗡', col: '#d4543a', d: 'Đao pháp cương mãnh, lấy công làm thủ.', f: 'Công · Bạo kích', aff: ['dbl', 'ltk'], lvE: { am: .005, cr: .003 },
      sk: [{ n: 'Đao Pháp Tây Sơn', e: { am: .03 } }, { n: 'Bão Táp Phản Công', e: { cr: .03 } }, { n: 'Phá Trận Đao', e: { am: .04, cm: .10 } }, { n: 'Thiên Hạ Vô Song', e: { am: .05, cr: .03 }, r: { ec: 1.12 } }] },
    { id: 'bachac', n: 'Bạch Hạc Quyền Phái', i: '🕊', col: '#58b6d8', d: 'Thân pháp nhẹ như hạc, đánh nhanh rút gọn.', f: 'Tốc độ · Né đòn', aff: ['nq', 'dl'], lvE: { sp: .005, dg: .003 },
      sk: [{ n: 'Hạc Lượn Cánh', e: { sp: .03 } }, { n: 'Điểm Huyệt Thủ', e: { dg: .03 } }, { n: 'Lăng Ba Vi Bộ', e: { sp: .03, dg: .02 }, r: { mg: 1.20 } }, { n: 'Hạc Vũ Cửu Thiên', e: { sp: .03, cr: .03 }, r: { ec: 1.10 } }] },
    { id: 'tanvien', n: 'Tản Viên Sơn Phái', i: '⛰', col: '#7a8f4a', d: 'Thân cứng như núi, lấy tĩnh chế động.', f: 'Sinh lực · Giảm sát thương', aff: ['lh', 'nb'], lvE: { hp: 12, am: .002 },
      sk: [{ n: 'Kim Thạch Công', e: { hp: 40 } }, { n: 'Thổ Địa Thủ Hộ', e: { hp: 40 }, r: { dr: .03 } }, { n: 'Sơn Hà Bất Động', e: { hp: 60 }, r: { rgn: .002 } }, { n: 'Tản Viên Thần Lực', e: { hp: 80, am: .04 }, r: { dr: .03 } }] },
    { id: 'longquan', n: 'Long Quân Lôi Môn', i: '⚡', col: '#8a5ad8', d: 'Mượn sức rồng sấm, một đòn định càn khôn.', f: 'ST bạo kích · Công', aff: ['thd', 'ltk'], lvE: { cm: .02, am: .003 },
      sk: [{ n: 'Long Tức Công', e: { cm: .12 } }, { n: 'Lôi Quang Thủ', e: { am: .03, cr: .02 } }, { n: 'Thuỷ Long Ngâm', e: { cm: .15 }, r: { ec: 1.12 } }, { n: 'Long Quân Giáng Thế', e: { am: .05, cm: .20, cr: .02 } }] },
    { id: 'auco', n: 'Âu Cơ Bách Hoa Cốc', i: '🌸', col: '#e87aa8', d: 'Y đạo và dưỡng sinh, bền bỉ nuôi chí lớn.', f: 'Hồi máu · EXP · Hút đồ', aff: [], lvE: { hp: 6, sp: .002, cr: .002 },
      sk: [{ n: 'Bách Hoa Tâm Pháp', e: { hp: 30 }, r: { rgn: .002 } }, { n: 'Hương Thảo Dưỡng Thể', e: { hp: 20 }, r: { rgn: .003 } }, { n: 'Linh Khê Thu Nhặt', e: { sp: .02 }, r: { mg: 1.25 } }, { n: 'Âu Cơ Hộ Mệnh', e: { hp: 50 }, r: { xg: 1.12, dr: .03 } }] }
  ];
  const SK_LV = [1, 3, 6, 9], SK_COST = [60, 150, 320, 600];
  sects.forEach(S => S.sk.forEach((k, j) => { k.lv = SK_LV[j]; k.c = SK_COST[j]; k.d = fmt(k.e) + (k.r ? (k.e && Object.keys(k.e).length ? ' · ' : '') + fmt(k.r) : '') }));
  const sect = id => sects.find(s => s.id === id) || null;
  const level = tot => { let l = 0; for (const t of rules.levels) if ((tot | 0) >= t) l++; return M.max(1, l) };
  /** Tiến độ tới cấp kế: {l, max, cur, need, pct} */
  const lvProg = tot => { const l = level(tot), max = l >= rules.levels.length, a = rules.levels[l - 1], b = rules.levels[l]; return { l, max, cur: (tot | 0) - a, need: max ? 0 : b - a, pct: max ? 100 : M.round(((tot | 0) - a) / (b - a) * 100) } };
  const isAff = (id, hero) => { const S = sect(id); return !!S && S.aff.includes(hero) };
  /** Bonus chỉ số của phái cho 1 tướng. sc = sv.sc (có thể thiếu/rỗng). */
  function sectBonus(sc, hero) {
    const o = {}; if (!sc || !sc.id) return o; const S = sect(sc.id); if (!S) return o;
    const p = (sc.p || {})[S.id] || {}, L = level(p.t | 0);
    add(o, S.lvE, L); S.sk.forEach((k, j) => { if ((p.l || {})[j]) add(o, k.e) });
    const m = isAff(S.id, hero) ? rules.aff : 1; if (m !== 1) for (const k in o) o[k] *= m;
    return o;
  }
  /** Hiệu ứng trong ván của phái (các Tuyệt Học đã học) */
  function sectRun(sc) {
    const o = {}; if (!sc || !sc.id) return o; const S = sect(sc.id); if (!S) return o; const p = (sc.p || {})[S.id] || {};
    S.sk.forEach((k, j) => { if (!(p.l || {})[j] || !k.r) return; for (const x in k.r) { if (x === 'rgn' || x === 'dr') o[x] = (o[x] || 0) + k.r[x]; else o[x] = (o[x] || 1) * k.r[x] } });
    return o;
  }
  /** Gộp hiệu ứng trong ván (phái + cảnh giới) với mặc định an toàn */
  function run(sc, realmStep) {
    const a = sectRun(sc), b = realmRun(realmStep);
    return { rgn: (a.rgn || 0) + (b.rgn || 0), dr: M.min(.5, 1 - (1 - (a.dr || 0)) * (1 - (b.dr || 0))), xg: (a.xg || 1) * (b.xg || 1), mg: (a.mg || 1) * (b.mg || 1), ec: (a.ec || 1) * (b.ec || 1) };
  }
  /** Trạng thái học Tuyệt Học j của phái: {ok, why} */
  function canLearn(sc, j) {
    if (!sc || !sc.id) return { ok: false, why: 'Chưa gia nhập môn phái' };
    const S = sect(sc.id), k = S && S.sk[j]; if (!k) return { ok: false, why: 'Không tồn tại' };
    const p = (sc.p || {})[S.id] || {}, l = p.l || {};
    if (l[j]) return { ok: false, why: 'Đã học' };
    if (j > 0 && !l[j - 1]) return { ok: false, why: 'Cần học Tuyệt Học trước' };
    if (level(p.t | 0) < k.lv) return { ok: false, why: 'Cần phái cấp ' + k.lv };
    if ((p.c | 0) < k.c) return { ok: false, why: 'Thiếu Cống Hiến (' + (p.c | 0) + '/' + k.c + ')' };
    return { ok: true, why: '' };
  }

  function validate() {
    const err = [], ok = (c, m) => { if (!c) err.push(m) };
    ok(realms.length === 10, 'cần đúng 10 cảnh giới');
    realms.forEach((r, i) => { if (!i) return; ok(r.e && Object.keys(r.e).every(k => STAT.includes(k)), r.n + ': e sai khoá'); ok(!r.r || Object.keys(r.r).every(k => RUN.includes(k)), r.n + ': r sai khoá'); ok(r.lv > realms[i - 1].lv || i === 1, r.n + ': cấp phải tăng dần'); ok(r.c.g > (realms[i - 1].c ? realms[i - 1].c.g : 0), r.n + ': vàng phải tăng dần') });
    ok(sects.length >= 5, 'cần ≥ 5 môn phái'); ok(new Set(sects.map(s => s.id)).size === sects.length, 'trùng id phái');
    sects.forEach(S => { ok(S.sk.length === 4, S.id + ': cần 4 Tuyệt Học'); S.sk.forEach(k => { ok(Object.keys(k.e).every(x => STAT.includes(x)), S.id + '/' + k.n + ': e sai khoá'); ok(!k.r || Object.keys(k.r).every(x => RUN.includes(x)), S.id + '/' + k.n + ': r sai khoá') }) });
    ok(rules.levels.length === 10 && rules.levels.every((v, i, a) => !i || v > a[i - 1]), 'ngưỡng cấp phái phải tăng dần');
    const hs = ['dbl', 'lh', 'nq', 'thd', 'dl', 'nb', 'ltk']; hs.forEach(h => ok(sects.some(s => s.aff.includes(h)), 'tướng ' + h + ' không hợp phái nào'));
    return err.length ? err : 'ok';
  }

  return { EK, STAT, RUN, fmt, add, realms, MAXR, realm, realmBonus, realmRun, breakCheck, rules, sects, sect, level, lvProg, isAff, sectBonus, sectRun, run, canLearn, validate };
})();
