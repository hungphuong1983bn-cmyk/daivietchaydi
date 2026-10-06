/* Database 52 CHƯƠNG × 6 MÀN = 312 MÀN (Phase 5) — hoàn toàn data-driven.
   Cấu trúc: Chapter → Stage → Wave → Enemy → Elite → MiniBoss → Boss → Reward
   (Enemy/Elite/MiniBoss/BossKit/Event/Map nằm ở data/monsters.js).

   Không có màn nào được viết tay trong gameplay: index.html chỉ đọc DV_DATA.db qua DV_DATA.getStage()/getChapter().
   Mọi con số cân bằng nằm trong DV_DATA.rules bên dưới — sửa rules hoặc bảng CHAPTERS rồi tải lại là toàn bộ 312 màn
   được dựng lại (và DV_DATA.validate() kiểm tra lại tiến trình / thời lượng / wave / thưởng).

   Thuật ngữ: c = chương 1..52 (trong engine dùng c0 = c-1) · i = màn 1..6 · g = chỉ số màn toàn cục 0..311 */
window.DV_DATA = window.DV_DATA || {};
(function () {
  const D = window.DV_DATA;

  /* ================= LUẬT CÂN BẰNG (một nơi duy nhất để chỉnh) ================= */
  const RULES = D.rules = {
    chapters: 52, stagesPerChapter: 6,
    stageTypes: ['n', 'n', 'n', 'e', 't', 'b'],                         // kiểu màn trên bản đồ (khớp LAY cũ)
    roles: ['intro', 'standard', 'siege', 'elite', 'treasure', 'boss'], // vai trò từng màn trong chương
    /* thời lượng (giây) theo dải chương: [chương đầu, chương cuối, tối thiểu, tối đa] — đúng yêu cầu thiết kế */
    durationBands: [[1, 5, 300, 420], [6, 15, 420, 540], [16, 25, 540, 660], [26, 35, 600, 720],
                    [36, 45, 720, 840], [46, 50, 840, 960], [51, 52, 960, 1200]],
    stageDurFrac: [0, .25, .5, .75, .35, 1],   // vị trí của từng màn trong dải thời lượng của chương
    bandCreep: .15,                            // phần thời lượng tăng dần theo chương trong cùng dải
    cycleAt: [480, 780],                       // D < 480s: 1 chu kỳ wave · < 780s: 2 chu kỳ · còn lại 3 chu kỳ
    /* độ khó: d(g) = total^(g/311). Trong một màn nhân thêm (1 + ramp·tiến độ) vì người chơi cũng lên cấp trong màn */
    diff: { total: 9.4, ramp: 1.4, dmgExp: .55, spMax: .30, finalBump: 1.06, hpBoss: .03 },
    density: { base: 14, perChapter: .55, growth: 1.0, hardCap: 140 },  // số quái tối đa cùng lúc
    elite: { base: .004, perStage: .00035, cap: .05, aliveBase: 3, alivePer: 6, scripted: [1, 12] },  // [cơ bản, +1 mỗi N chương]
    /* HP Boss/Mini Boss = DPS tham chiếu(lực chiến) × thời lượng × tỉ lệ. dpsRef = [lực chiến khuyến nghị, DPS lên Boss] đo bằng bot test
       (tests/trials) với nhân vật đúng lực chiến khuyến nghị; nội suy tuyến tính giữa các mốc. ttk = tỉ lệ khung chiến đấu dự kiến dùng để hạ Boss. */
    boss: { dpsRef: [[500, 170], [870, 215], [1430, 315], [2370, 400], [3910, 640], [7150, 1900], [9000, 2600]],
            ttk: { full: .45, lite: .4, guardian: .35 }, miniSec: 8, hp: 2400, mini: 1.0, guardian: 1.9, lite: .55, fightBase: 40, fightPerChapter: 3, fightMax: 200,
            tierOf: c => Math.min(8, 1 + Math.floor((c - 1) / 6.5)) },
    /* EXP: đặt nhịp lên cấp trong màn. Cấp cuối dự kiến khi Boss xuất hiện = lvBase + lvPerMin·phút (kẹp lvMin..lvMax);
       mỗi Wave có expMul để quái trong Wave đó cho đủ EXP theo đường cong curve. fill = tỉ lệ quái spawn thực sự bị hạ. */
    exp: { lvBase: 6, lvPerMin: 1.8, lvMin: 8, lvMax: 36, curve: .8, fill: .7, starFrac: .85, mulMax: 40 },
    engine: { bossHpExp: 0, miniHpExp: 0 },   // HP engine = hp(DB) × growth × scale.hp^exp. Giờ hp đã là HP cuối từ dpsRef nên exp = 0 (boss không phình theo scale quái)
    power: { start: 500, end: 6500, stageSpan: [.92, 1.10] },
    reward: {
      exp: 1000, expPerStage: .05, gold: 1200, goldPerStage: .045, killScale: .02,
      roleMul:   { intro: .9, standard: 1, siege: 1.15, elite: 1.8, treasure: 1.5, boss: 2.5 },
      goldMul:   { intro: .9, standard: 1, siege: 1.15, elite: 1.8, treasure: 2.4, boss: 2.5 },
      matMul:    { intro: .5, standard: 1, siege: 1, elite: 1.8, treasure: 1.6, boss: 3 },
      honMul:    { intro: .5, standard: .5, siege: 1, elite: 1.5, treasure: 1, boss: 3 },
      drops:     { intro: 1, standard: 1, siege: 2, elite: 3, treasure: 3, boss: 3 },
      gearBias: [.1, 32],                       // [mỗi màn, trần] cộng vào rollR()
      firstClearGem: [5, 1], bossGem: [25, 2],  // [cơ bản, mỗi chương]
      starGem: 3, star3: { gem: [10, 1], matMul: 1.5 }
    },
    stars: { hpFloor: [60, .6, 25] },           // sinh lực tối thiểu giữ được: 60% − 0.6%/chương, sàn 25%
    unlock: { starsFromChapter: 10, starsPerChapter: .8 }
  };

  /* ================= BẢNG 52 CHƯƠNG: [tên địa danh, tên chương, chủ đề, tên Boss, (hue riêng)] ================= */
  const ACTS = [[1, 10, 'Khai Quốc'], [11, 20, 'Hùng Binh'], [21, 30, 'Sơn Hà'], [31, 40, 'Huyền Thoại'], [41, 52, 'Thiên Địa']];
  const CHAPTERS = [
    ['Hoa Lư', 'Khởi Đầu Đại Việt', 'plain', 'Hắc Long', 98], ['Bạch Đằng', 'Sóng Dậy Bạch Đằng', 'river', 'Thuỷ Quái Bạch Đằng', 205],
    ['Vạn Kiếp', 'Lửa Vạn Kiếp', 'valley', 'Quỷ Vương Vạn Kiếp', 150], ['Lam Sơn', 'Núi Rừng Lam Sơn', 'forest', 'Sơn Đại Vương', 122],
    ['Đại La', 'Đại La Hùng Thành', 'citadel', 'Thần Tướng Đại La', 35], ['Tây Đô', 'Tây Đô Quyết Chiến', 'shadow', 'Ma Vương Tây Đô', 275],
    ['Như Nguyệt', 'Sông Như Nguyệt', 'river', 'Thuỷ Tướng Như Nguyệt'], ['Chi Lăng', 'Ải Chi Lăng', 'valley', 'Mãnh Hổ Chi Lăng'],
    ['Nam Quan', 'Ải Nam Quan', 'mountain', 'Quan Thần Nam Quan'], ['Đồng Đăng', 'Cánh Đồng Đồng Đăng', 'plain', 'Tướng Quân Đồng Đăng'],
    ['Tây Kết', 'Chiến Địa Tây Kết', 'swamp', 'Hắc Thuỷ Tây Kết'], ['Đông Bộ Đầu', 'Bến Đông Bộ Đầu', 'river', 'Thuỷ Tặc Đông Bộ'],
    ['Hàm Tử', 'Cửa Ải Hàm Tử', 'sea', 'Hải Long Hàm Tử'], ['Chương Dương', 'Bãi Chương Dương', 'plain', 'Cự Tượng Chương Dương'],
    ['Thượng Đạo', 'Tây Sơn Thượng Đạo', 'forest', 'Sơn Quân Thượng Đạo'], ['Ngọc Hồi', 'Trận Ngọc Hồi', 'citadel', 'Pháo Vương Ngọc Hồi'],
    ['Rạch Gầm', 'Rạch Gầm – Xoài Mút', 'swamp', 'Thuỷ Thần Rạch Gầm'], ['Phú Xuân', 'Kinh Thành Phú Xuân', 'citadel', 'Cấm Vệ Phú Xuân'],
    ['Truông Mây', 'Đèo Truông Mây', 'mountain', 'Phong Lang Truông Mây'], ['Hải Vân', 'Đèo Hải Vân', 'sea', 'Hải Vân Quỷ Quan'],
    ['Thăng Long', 'Thăng Long Cổ Thành', 'citadel', 'Thành Hoàng Thăng Long'], ['Hồ Gươm', 'Hồ Gươm Huyền Bí', 'river', 'Thần Quy Hồ Gươm'],
    ['Tản Viên', 'Núi Tản Viên', 'mountain', 'Sơn Thần Tản Viên'], ['Phong Châu', 'Đất Tổ Phong Châu', 'plain', 'Ma Tướng Phong Châu'],
    ['Cổ Loa', 'Thành Cổ Loa', 'citadel', 'Nỏ Thần Cổ Loa'], ['Mê Linh', 'Mê Linh Dậy Sóng', 'plain', 'Tướng Quỷ Mê Linh'],
    ['Hát Môn', 'Cửa Sông Hát Môn', 'river', 'Giao Long Hát Môn'], ['Lũng Nhai', 'Lũng Nhai Hang Sâu', 'cave', 'Cự Thạch Lũng Nhai'],
    ['Sóc Sơn', 'Núi Sóc Sơn', 'mountain', 'Thiết Kỵ Sóc Sơn'], ['Dạ Trạch', 'Đầm Dạ Trạch', 'swamp', 'Thuỷ Quái Dạ Trạch'],
    ['Thần Phù', 'Hang Thần Phù', 'cave', 'Thạch Linh Thần Phù'], ['Đồi Ma', 'Đồi Ma Hoang', 'shadow', 'U Linh Đồi Ma'],
    ['Rừng Đước', 'Rừng Đước Cà Mau', 'forest', 'Cá Sấu Chúa Rừng Đước'], ['Hoàng Liên', 'Hoàng Liên Tuyết Sơn', 'snow', 'Tuyết Vương Hoàng Liên'],
    ['Mũi Né', 'Cồn Cát Mũi Né', 'desert', 'Bọ Cạp Vương Mũi Né'], ['Hỏa Diệm', 'Núi Lửa Hỏa Diệm', 'volcano', 'Hỏa Long Diệm Sơn'],
    ['Vực Sâu', 'Vực Sâu Biển Đông', 'sea', 'Thuỷ Ma Vực Sâu'], ['Đảo Quỷ', 'Đảo Quỷ Hoang', 'sea', 'Hải Tặc Vương'],
    ['Thành Ma', 'Thành Ma Hắc Ám', 'shadow', 'Ma Tướng Hắc Thành'], ['Mê Cung', 'Mê Cung Vạn Cốt', 'cave', 'Cốt Vương Mê Cung'],
    ['Trường Sơn', 'Đại Ngàn Trường Sơn', 'forest', 'Chúa Sơn Lâm Trường Sơn'], ['Tây Nguyên', 'Cao Nguyên Bazan', 'plain', 'Voi Chúa Tây Nguyên'],
    ['Phù Nam', 'Cố Đô Phù Nam', 'desert', 'Pháp Sư Phù Nam'], ['Chiêm Thành', 'Tháp Chàm Cổ', 'desert', 'Thần Tháp Chiêm Thành'],
    ['Ma Đô', 'Kinh Đô Ma Giới', 'shadow', 'Ma Hoàng Kinh Đô'], ['Âm Phủ', 'Cửa Âm Phủ', 'void', 'Diêm Vương Âm Phủ'],
    ['Vân Hải', 'Biển Mây Vân Hải', 'heaven', 'Thần Vân Vân Hải'], ['Thiên Môn', 'Cửa Thiên Môn', 'heaven', 'Thiên Tướng Thiên Môn'],
    ['Lôi Giới', 'Lôi Giới Thiên Kiếp', 'volcano', 'Lôi Thần Thiên Kiếp'], ['Hư Không', 'Vực Hư Không', 'void', 'Hư Không Ma Chủ'],
    ['Long Cung', 'Long Cung Đáy Biển', 'sea', 'Long Vương Long Cung'], ['Bình Minh', 'Bình Minh Đại Việt', 'heaven', 'Chúa Tể Thiên Long']
  ];

  /* ================= TIỆN ÍCH ================= */
  const M = Math, lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => M.max(a, M.min(b, v));
  const rnd = (v, s) => M.round(v / s) * s, r1 = v => M.round(v * 100) / 100;
  const fmt = t => String(t / 60 | 0).padStart(2, '0') + ':' + String(t % 60 | 0).padStart(2, '0');
  const gIdx = (c, i) => (c - 1) * RULES.stagesPerChapter + (i - 1);
  const dCurve = g => M.pow(RULES.diff.total, g / (RULES.chapters * RULES.stagesPerChapter - 1));
  const pad = n => String(n).padStart(2, '0');
  /* bảng EXP/level của game (data/progression.js); dự phòng dùng cùng công thức */
  const expNeed = l => D.prog ? D.prog.exp(l) : (() => { let t = 20; for (let k = 1; k < l; k++) t = M.round(t * (k < 14 ? 1.35 : 1.15) + 8); return t })();
  const cumExp = L => { const f = M.floor(L); let t = 0; for (let l = 1; l < f; l++) t += expNeed(l); return t + (L - f) * expNeed(f) };

  /* ---- thời lượng một màn (giây) ---- */
  function durationOf(c, i) {
    const b = RULES.durationBands.find(x => c >= x[0] && c <= x[1]), pc = (c - b[0]) / M.max(1, b[1] - b[0]);
    const f = RULES.stageDurFrac[i - 1], k = RULES.bandCreep;
    return rnd(b[2] + (b[3] - b[2]) * (k * pc + (1 - k) * f), 10);
  }
  const bandOf = c => RULES.durationBands.find(x => c >= x[0] && c <= x[1]);

  /* ---- pool quái của chương: theo chủ đề, chỉ quái đã mở (intro ≤ c); quái vừa ra mắt được ưu tiên ---- */
  function enemyPoolOf(c, theme) {
    const prof = D.maps[theme].profile, out = [];
    for (const id in D.enemies) {
      const e = D.enemies[id];
      if (e.intro > c || !prof[id]) continue;
      let w = prof[id];
      if (id === 'grunt') w *= M.max(.15, 1 - c / 70);
      if (c - e.intro <= 2 && e.intro > 1) w *= 1.8;
      out.push({ id, w: r1(w), tier: e.tier });
    }
    out.sort((a, b) => b.w - a.w);
    return out.slice(0, 7).sort((a, b) => a.tier - b.tier || b.w - a.w).map(x => ({ id: x.id, w: x.w }));
  }
  function elitePoolOf(c) {
    return Object.keys(D.elites).filter(k => D.elites[k].intro <= c)
      .sort((a, b) => D.elites[b].intro - D.elites[a].intro).slice(0, 5)
      .map(k => ({ id: k, w: c - D.elites[k].intro < 5 ? 1.5 : 1 }));
  }

  /* ---- Boss / Mini Boss: cơ chế sinh từ BossKit theo cấp (tier) của chương ---- */
  function kitOf(c, tier, maxN) {
    const out = [], g = M.floor(c / 10), cdk = M.max(.6, 1 - c / 150);
    for (let t = 0; t < M.min(tier, D.bossKits.length); t++) for (const a of D.bossKits[t]) {
      const x = Object.assign({}, a);
      if (x.cd) x.cd = r1(x.cd * cdk);
      if (x.k === 'nova' || x.k === 'shoot') x.n += g;
      if (x.k === 'summon') x.n += g;
      if (x.k === 'spiral') x.arms += M.floor(g / 2);
      out.push(x);
    }
    return maxN ? out.slice(0, maxN) : out;
  }

  /* ---- Wave: một beat của timeline → dữ liệu Wave đầy đủ ---- */
  const KIND = {  // mật độ, nhịp, số quái thêm, mẫu spawn, hệ số elite, tên hiển thị
    start:  { dens: .45, iv: 1.5, nx: 0, pat: ['ring'],          el: 0,  label: 'Khởi đầu' },
    wave:   { dens: 1,   iv: 1,   nx: 0, pat: ['ring', 'burst'], el: 1,  label: 'Đợt thường' },
    elite:  { dens: 1,   iv: .9,  nx: 0, pat: ['burst'],         el: 4,  label: 'Tinh Anh' },
    dense:  { dens: 1.4, iv: .75, nx: 1, pat: ['swarm'],         el: .5, label: 'Đợt dày đặc' },
    event:  { dens: .8,  iv: 1,   nx: 0, pat: ['ring'],          el: 1,  label: 'Sự kiện' },
    mini:   { dens: .7,  iv: 1.2, nx: 0, pat: ['line'],          el: .5, label: 'Mini Boss' },
    final:  { dens: 1.55, iv: .7, nx: 1, pat: ['line', 'swarm'], el: 2,  label: 'Đợt cuối' },
    boss:   { dens: .55, iv: 1.3, nx: 0, pat: ['ring'],          el: 0,  label: 'Boss' }
  };

  function buildStage(c, i, ch, db) {
    const R = RULES, role = R.roles[i - 1], type = R.stageTypes[i - 1], g = gIdx(c, i), Dur = durationOf(c, i);
    const fightK = { boss: 1, elite: .75 }[role] || .55;
    const fight = M.min(rnd(clamp(R.boss.fightBase + R.boss.fightPerChapter * c, R.boss.fightBase, R.boss.fightMax) * fightK, 5), Dur * .25);
    const bossAt = Dur - fight, T = bossAt;
    const cycles = Dur < R.cycleAt[0] ? 1 : Dur < R.cycleAt[1] ? 2 : 3;
    const XP = R.exp, Lend = clamp(XP.lvBase + XP.lvPerMin * (T / 60), XP.lvMin, XP.lvMax), Lt = t => 1 + (Lend - 1) * M.pow(clamp(t / T, 0, 1), XP.curve);

    /* --- 1. Timeline: START → (Wave Wave Elite Dense Event Mini)×cycles → Final → Boss → Victory --- */
    const beats = [{ k: 'start', w: role === 'intro' ? .3 : .4 }];
    for (let k = 0; k < cycles; k++) {
      beats.push({ k: 'wave', w: 1 }, { k: 'wave', w: 1 },
        { k: 'elite', w: role === 'elite' ? 1.5 : 1 }, { k: 'dense', w: role === 'siege' ? 1.5 : role === 'intro' ? .8 : 1 },
        { k: 'event', w: role === 'treasure' ? 1.3 : .6 }, { k: 'mini', w: .8 });
      if (role === 'elite' && k === cycles - 1) beats.push({ k: 'elite', w: 1 });
    }
    beats.push({ k: 'final', w: 1.2 });
    const tw = beats.reduce((a, b) => a + b.w, 0);
    let t0 = 0; beats.forEach((b, n) => { b.s = M.round(t0); t0 += T * b.w / tw; b.e = n === beats.length - 1 ? M.round(T) : M.round(t0) });

    const eliteN = R.elite.scripted[0] + M.floor(c / R.elite.scripted[1]) + (role === 'elite' ? 1 : 0);
    const evPool = D.maps[ch.theme].ev.filter(k => D.events[k].intro <= c);
    const timeline = [], events = [], waves = [];
    let evN = 0, miniN = 0, eliteTotal = 0, goldenN = 0;

    beats.forEach((b, n) => {
      const K = KIND[b.k], mid = ((b.s + b.e) / 2) / T, dd = dCurve(g) * (1 + R.diff.ramp * mid) * (b.k === 'final' ? R.diff.finalBump : 1);
      const pl = ch.enemyPool, plen = pl.length;
      let take = b.k === 'start' ? M.min(2, plen) : b.k === 'final' ? plen : M.max(2, M.ceil(plen * (.5 + .5 * mid)));
      let pool = pl.slice(0, take).map(x => [x.id, x.w]);
      if (b.k === 'dense') pool = pool.map(([id, w]) => [id, r1(w * (id === 'swarm' || id === 'fast' ? 1.6 : 1))]);
      const dens = M.min(R.density.hardCap, M.round((R.density.base + R.density.perChapter * c) * (1 + R.density.growth * mid) * K.dens));
      const iv = r1(clamp(.8 - .35 * mid - .004 * c, .28, .8) * K.iv);
      const sn = M.min(6, 1 + M.floor(mid * 2) + K.nx + M.floor(c / 20));
      const ec = r1e(M.min(R.elite.cap, R.elite.base + R.elite.perStage * g) * K.el);
      const lnT = M.log(R.diff.total * (1 + R.diff.ramp));
      const w = {
        startTime: b.s, endTime: b.e, kind: b.k, label: K.label,
        enemyPool: pool, spawnCount: sn, spawnInterval: iv, spawnPattern: K.pat[n % K.pat.length], maxAlive: dens,
        eliteChance: ec, difficultyMultiplier: r1e(dd),
        scale: { hp: r1e(dd), dmg: r1e(M.pow(dd, R.diff.dmgExp)), sp: r1e(1 + R.diff.spMax * M.log(dd) / lnT) },
        specialEvent: null
      };
      { // EXP của Wave: đủ để người chơi đạt cấp mục tiêu theo thời gian
        const wt = pool.reduce((a, x) => a + x[1], 0) || 1, avg = pool.reduce((a, x) => a + x[1] * (D.enemies[x[0]].exp || 1), 0) / wt;
        const cap = (b.e - b.s) / iv * sn * XP.fill, need = cumExp(Lt(b.e)) - cumExp(Lt(b.s));
        w.scale.exp = r1e(clamp(need / M.max(1, cap * avg), .5, XP.mulMax));
      }
      timeline.push({ t: b.s, k: b.k, label: K.label });
      if (b.k === 'elite') {                       // Elite scripted: đầu và giữa đợt
        for (const at of [b.s + 3, M.round((b.s + b.e) / 2)]) { events.push({ at, k: 'elite', n: eliteN, sc: w.scale }); eliteTotal += eliteN }
        w.specialEvent = { kind: 'elite', at: b.s + 3, n: eliteN };
      } else if (b.k === 'event') {
        const kind = role === 'treasure' ? 'golden' : evPool[evN % evPool.length]; evN++;
        const at = b.s + M.round((b.e - b.s) * .15), x = { at, k: 'event', ev: kind, n: kind === 'golden' ? 1 + M.floor(c / 15) : 1, sc: w.scale };
        if (kind === 'golden') goldenN += x.n;
        events.push(x); w.specialEvent = { kind, at, n: x.n };
      } else if (b.k === 'mini') {
        const at = b.s + M.round((b.e - b.s) * .1);
        events.push({ at, k: 'mini', id: ch.miniBoss, sc: w.scale }); miniN++; w.specialEvent = { kind: 'mini', at, id: ch.miniBoss };
      }
      waves.push(w);
    });
    /* Boss beat */
    const bd = dCurve(g) * (1 + R.diff.ramp), lnT = M.log(R.diff.total * (1 + R.diff.ramp));
    waves.push({ startTime: M.round(T), endTime: 9999, kind: 'boss', label: 'Boss', enemyPool: ch.enemyPool.slice(0, M.max(2, M.ceil(ch.enemyPool.length * .6))).map(x => [x.id, x.w]),
      spawnCount: 1, spawnInterval: KIND.boss.iv, spawnPattern: 'ring', maxAlive: M.round((R.density.base + R.density.perChapter * c) * KIND.boss.dens * 2), eliteChance: 0,
      difficultyMultiplier: r1e(bd), scale: { hp: r1e(bd), dmg: r1e(M.pow(bd, R.diff.dmgExp)), sp: r1e(1 + R.diff.spMax * M.log(bd) / lnT), exp: r1e(waves[waves.length - 1].scale.exp) }, specialEvent: { kind: 'boss', at: M.round(T) } });
    timeline.push({ t: M.round(T), k: 'boss', label: 'Boss' }, { t: M.round(Dur), k: 'victory', label: 'Chiến thắng' });
    events.push({ at: M.round(T), k: 'boss', sc: waves[waves.length - 1].scale });
    events.sort((a, b) => a.at - b.at);
    timeline.forEach(x => x.time = fmt(x.t));

    /* --- 2. Boss cuối của màn: Guardian (Mini Boss lớn) · Lite (Boss rút gọn) · Full (Boss chương) --- */
    const tier = R.boss.tierOf(c), form = role === 'boss' ? 'full' : role === 'elite' ? 'lite' : 'guardian';
    const kt = form === 'full' ? tier : M.max(1, tier - 1), bossWave = waves[waves.length - 1];
    const src = form === 'guardian' ? db.miniBosses[ch.miniBoss] : db.bosses[ch.bossId];
    const hpMul = form === 'full' ? 1 : form === 'lite' ? R.boss.lite : R.boss.guardian;
    const dpsAt = pw0 => { const T = R.boss.dpsRef; if (pw0 <= T[0][0]) return T[0][1]; for (let k = 1; k < T.length; k++) if (pw0 <= T[k][0]) return lerp(T[k - 1][1], T[k][1], (pw0 - T[k - 1][0]) / (T[k][0] - T[k - 1][0])); return T[T.length - 1][1] };
    const pw0 = M.round(ch.recommendedPower * lerp(R.power.stageSpan[0], R.power.stageSpan[1], (i - 1) / 5) / 10) * 10, refDps = dpsAt(pw0);
    const finale = { id: src.id || ch.miniBoss, name: form === 'guardian' ? src.n : ch.bossName, form, at: M.round(T), fight, kitTier: kt,
      hp: M.round(refDps * fight * R.boss.ttk[form]), growth: 1, sp: src.sp, r: form === 'guardian' ? M.round(src.r * 1.25) : form === 'lite' ? 26 : src.r, dmg: src.dmg, c: src.c,
      scale: bossWave.scale, mech: form === 'guardian' ? kitOf(c, kt, 3) : kitOf(c, kt) };
    const mini = { id: ch.miniBoss, name: db.miniBosses[ch.miniBoss].n, hpMul: R.boss.mini, hp: M.round(refDps * R.boss.miniSec * R.boss.mini), growth: 1, sp: db.miniBosses[ch.miniBoss].sp,
      r: db.miniBosses[ch.miniBoss].r, dmg: db.miniBosses[ch.miniBoss].dmg, c: db.miniBosses[ch.miniBoss].c, count: miniN, mech: kitOf(c, M.max(1, tier - 1), 2) };
    const skill = { cd: r1(M.max(.6, 1 - c / 150)), extra: M.floor(c / 12) };

    /* --- 3. Thưởng --- */
    const RW = R.reward, ex = RW.exp * (1 + RW.expPerStage * g), go = RW.gold * (1 + RW.goldPerStage * g), kmul = 1 + RW.killScale * g;
    const ms = RW.roleMul[role], bias = M.min(RW.gearBias[1], M.round(RW.gearBias[0] * g));
    const tinh = M.round((4 + .35 * g) * RW.matMul[role]), hon = M.max(1, M.round((2 + c / 6) * RW.honMul[role]));
    const minR = role === 'boss' ? (c >= 40 ? 2 : c >= 20 ? 1 : 0) : role === 'elite' ? (c >= 30 ? 1 : 0) : 0;
    const fcGem = RW.firstClearGem[0] + RW.firstClearGem[1] * c + (role === 'boss' ? RW.bossGem[0] + RW.bossGem[1] * c : 0);
    const rewards = {
      exp: M.round(ex * ms), gold: M.round(go * RW.goldMul[role]), killExpMul: r1(kmul), killGoldMul: r1(kmul),
      equipment: { drops: RW.drops[role], minRarity: minR, bias },
      materials: { tinh }, charMaterials: { hon },
      firstClear: { gem: fcGem, gold: M.round(go * RW.goldMul[role]), materials: { tinh: tinh }, charMaterials: { hon: M.ceil(hon * 1.5) }, equipment: { drops: 1, minRarity: M.min(3, minR + 1), bias } },
      star3: { gem: RW.star3.gem[0] + RW.star3.gem[1] * c, materials: { tinh: M.round(tinh * RW.star3.matMul) }, charMaterials: { hon: 1 + M.floor(c / 10) } },
      perStarGem: RW.starGem
    };

    /* --- 4. Điều kiện 3 sao: ⏱ thời gian · 🛡 không bị hạ · 🎯 yêu cầu đặc biệt --- */
    const par = rnd(Dur * 1.1, 10), floor = M.round(M.max(R.stars.hpFloor[2], R.stars.hpFloor[0] - R.stars.hpFloor[1] * c));
    const SP = {
      intro:    { id: 'level',   n: M.round(Lend * XP.starFrac), desc: l => `Đạt cấp ${l.n} trong trận` },
      standard: { id: 'hits',    n: M.max(5, M.round(14 - c * .18)),   desc: l => `Bị đánh trúng không quá ${l.n} lần` },
      siege:    { id: 'elites',  n: M.max(2, eliteTotal - 1),          desc: l => `Hạ ${l.n} Tinh Anh` },
      elite:    { id: 'elites',  n: eliteTotal,                         desc: l => `Hạ ${l.n} Tinh Anh` },
      treasure: { id: 'golden',  n: M.max(1, M.ceil(goldenN / 2)),      desc: l => `Hạ ${l.n} Tướng Vàng` },
      boss:     { id: 'bossTime', n: M.round(fight * .85),              desc: l => `Hạ Boss trong ${l.n}s sau khi xuất hiện` }
    }[role];
    const stars = [
      { id: 'time', n: par, desc: `Hoàn thành trong ${fmt(par)}` },
      { id: 'nodown', n: floor, desc: `Không bị hạ: sinh lực luôn ≥ ${floor}%` },
      Object.assign({}, SP, { desc: SP.desc(SP) })
    ];

    const pw = M.round(ch.recommendedPower * lerp(R.power.stageSpan[0], R.power.stageSpan[1], (i - 1) / 5) / 10) * 10;
    return { stageId: c + '-' + pad(i), chapterId: c, targetLevel: M.round(Lend), index: i, type, role, duration: Dur, bossAt: M.round(T), parTime: par,
      recommendedPower: pw, difficulty: { index: g, base: r1e(dCurve(g)), ramp: R.diff.ramp },
      timeline, waves, events, miniBoss: mini, boss: finale, skill, rewards, stars };
  }
  function r1e(v) { return M.round(v * 1000) / 1000 }

  /* ================= DỰNG DATABASE ================= */
  function build() {
    const db = { version: 1, rules: RULES, enemies: D.enemies, elites: D.elites, miniBosses: D.miniBosses, bosses: {}, maps: D.maps, events: D.events, chapters: [] };
    const seen = new Set(), seenTheme = new Set(), themeN = {}, R = RULES;
    let lastTier = 0;
    CHAPTERS.forEach((row, n) => {
      const c = n + 1, theme = row[2], map = D.maps[theme];
      themeN[theme] = (themeN[theme] || 0) + 1;
      const act = ACTS.find(a => c >= a[0] && c <= a[1]);
      const tier = R.boss.tierOf(c), bossId = 'boss_' + pad(c), mini = D.miniBosses['mb_' + theme];
      const pool = enemyPoolOf(c, theme), epool = elitePoolOf(c);
      const rp = M.round(R.power.start * M.pow(R.power.end / R.power.start, (c - 1) / (R.chapters - 1)) / 10) * 10;
      /* mở khoá + giới thiệu cơ chế mới (để thấy rõ progression không chỉ HP/Attack) */
      const intro = [];
      pool.forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); intro.push('Quái: ' + D.enemies[p.id].n) } });
      if (!seenTheme.has(theme)) { seenTheme.add(theme); intro.unshift('Bản đồ mới: ' + map.n) }
      for (const k in D.elites) if (D.elites[k].intro === c) intro.push('Elite: ' + D.elites[k].n);
      for (const k in D.events) if (D.events[k].intro === c) intro.push('Sự kiện: ' + D.events[k].n);
      if (tier !== lastTier) { intro.push('Boss cấp ' + tier + ': ' + D.bossKits[tier - 1].map(a => a.k).filter((v, i, a) => a.indexOf(v) === i).join('/')); lastTier = tier }
      const bk = M.max(1, tier), bm = D.maps[theme];
      db.bosses[bossId] = { id: bossId, n: row[3], chapter: c, tier, hp: R.boss.hp, sp: 46, r: 30, dmg: 18, c: mini.c, mech: kitOf(c, bk) };
      const chap = {
        chapterId: c, chapterName: row[1], place: row[0], act: act[2], theme, mapId: theme + '-' + themeN[theme], hue: row[4] != null ? row[4] : (bm.hue + 9 * (themeN[theme] - 1)) % 360,
        recommendedPower: rp, enemyPool: pool, elitePool: epool, miniBoss: 'mb_' + theme, bossId, boss: bossId, bossName: row[3], bossTier: tier, introduces: intro,
        rewards: { clear: { gem: 30 + 4 * c, charMaterials: { hon: 3 + M.floor(c / 4) }, equipment: { drops: 1, minRarity: c >= 10 ? 2 : 1, bias: M.min(R.reward.gearBias[1], M.round(R.reward.gearBias[0] * gIdx(c, 6))) } } },
        unlockCondition: { prevChapterBoss: c > 1 ? c - 1 : null, minTotalStars: c >= R.unlock.starsFromChapter ? M.round((c - R.unlock.starsFromChapter + 1) * R.unlock.starsPerChapter) : 0 },
        stages: []
      };
      for (let i = 1; i <= R.stagesPerChapter; i++) chap.stages.push(buildStage(c, i, chap, db));
      db.chapters.push(chap);
    });
    return db;
  }

  /* ================= TRUY CẤP (engine dùng c0 = chương 0-based) ================= */
  D.db = build();
  D.getChapter = c0 => D.db.chapters[c0];
  D.getStage = (c0, i) => { const ch = D.db.chapters[c0]; return ch && ch.stages[i - 1] };
  D.fmtTime = fmt;

  /* ================= KIỂM TRA TOÀN VẸN ================= */
  D.validate = function () {
    const db = D.db, R = RULES, err = [], st = { stages: 0, waves: 0, minDur: 1e9, maxDur: 0 };
    const E = m => { if (err.length < 80) err.push(m) };
    if (db.chapters.length !== R.chapters) E('Số chương ' + db.chapters.length + ' ≠ ' + R.chapters);
    const ids = new Set(); let prevPw = 0, prevBase = 0, prevDur = 0;
    db.chapters.forEach(ch => {
      if (ch.stages.length !== R.stagesPerChapter) E('Chương ' + ch.chapterId + ' không đủ ' + R.stagesPerChapter + ' màn');
      for (const f of ['chapterId', 'chapterName', 'theme', 'mapId', 'recommendedPower', 'enemyPool', 'elitePool', 'miniBoss', 'boss', 'rewards', 'unlockCondition'])
        if (ch[f] == null) E('Chương ' + ch.chapterId + ' thiếu ' + f);
      if (!db.maps[ch.theme]) E('Chương ' + ch.chapterId + ': theme lạ');
      if (!db.miniBosses[ch.miniBoss]) E('Chương ' + ch.chapterId + ': miniBoss lạ');
      if (!db.bosses[ch.boss]) E('Chương ' + ch.chapterId + ': boss lạ');
      if (ch.recommendedPower < prevPw) E('Power giảm ở chương ' + ch.chapterId); prevPw = ch.recommendedPower;
      ch.enemyPool.forEach(p => { if (!db.enemies[p.id]) E('Pool lạ ' + p.id); if (db.enemies[p.id].intro > ch.chapterId) E('Quái ' + p.id + ' xuất hiện trước intro ở chương ' + ch.chapterId) });
      ch.elitePool.forEach(p => { if (!db.elites[p.id]) E('Elite lạ ' + p.id); if (db.elites[p.id].intro > ch.chapterId) E('Elite ' + p.id + ' sớm hơn intro') });
      const b = bandOf(ch.chapterId);
      ch.stages.forEach(s => {
        st.stages++; if (ids.has(s.stageId)) E('Trùng stageId ' + s.stageId); ids.add(s.stageId);
        if (s.duration < b[2] || s.duration > b[3]) E(s.stageId + ': thời lượng ' + s.duration + ' ngoài dải ' + b[2] + '–' + b[3]);
        if (s.duration < prevDur - 1e-6 && s.index === 1 && false) E('Thời lượng giảm');
        st.minDur = M.min(st.minDur, s.duration); st.maxDur = M.max(st.maxDur, s.duration);
        /* Wave: liên tục, không chồng, không lỗ hổng; wave cuối là Boss; mọi pool hợp lệ */
        const W = s.waves; st.waves += W.length;
        if (W[0].startTime !== 0) E(s.stageId + ': wave đầu không bắt đầu ở 0');
        for (let k = 0; k < W.length; k++) {
          const w = W[k];
          for (const f of ['startTime', 'endTime', 'enemyPool', 'spawnCount', 'spawnInterval', 'spawnPattern', 'eliteChance', 'difficultyMultiplier']) if (w[f] == null) E(s.stageId + ' wave ' + k + ' thiếu ' + f);
          if (w.endTime <= w.startTime) E(s.stageId + ' wave ' + k + ' có độ dài ≤ 0');
          if (k && W[k - 1].endTime !== w.startTime && W[k - 1].endTime !== 9999) E(s.stageId + ': hở/chồng giữa wave ' + (k - 1) + ' và ' + k);
          w.enemyPool.forEach(p => { if (!db.enemies[p[0]]) E(s.stageId + ': pool wave lạ ' + p[0]) });
          if (k && w.difficultyMultiplier < W[k - 1].difficultyMultiplier * .999 && w.kind !== 'boss') E(s.stageId + ': độ khó giảm trong màn ở wave ' + k);
          if (k && w.difficultyMultiplier > W[k - 1].difficultyMultiplier * 1.35) E(s.stageId + ': độ khó nhảy > 35% ở wave ' + k);
        }
        if (W[W.length - 1].kind !== 'boss' || W[W.length - 1].endTime !== 9999) E(s.stageId + ': wave cuối phải là Boss');
        if (M.abs(W[W.length - 1].startTime - s.bossAt) > 1) E(s.stageId + ': bossAt lệch');
        const tl = s.timeline; for (let k = 1; k < tl.length; k++) if (tl[k].t < tl[k - 1].t) E(s.stageId + ': timeline không tăng');
        if (tl[0].k !== 'start' || tl[tl.length - 1].k !== 'victory') E(s.stageId + ': timeline thiếu start/victory');
        if (!tl.some(x => x.k === 'mini')) E(s.stageId + ': thiếu Mini Boss'); if (!tl.some(x => x.k === 'elite')) E(s.stageId + ': thiếu Elite');
        if (s.bossAt >= s.duration) E(s.stageId + ': boss sau victory');
        /* Độ khó nền tăng đều giữa các màn, không nhảy đột ngột */
        const base = s.difficulty.base; if (prevBase && (base < prevBase || base / prevBase > 1.04)) E(s.stageId + ': độ khó nền nhảy ×' + r1e(base / prevBase)); prevBase = base;
        /* Thưởng + sao */
        const r = s.rewards; for (const f of ['exp', 'gold', 'equipment', 'materials', 'charMaterials', 'firstClear', 'star3']) if (r[f] == null) E(s.stageId + ' thiếu thưởng ' + f);
        if (!(r.exp > 0 && r.gold > 0)) E(s.stageId + ': exp/gold ≤ 0');
        if (s.stars.length !== 3) E(s.stageId + ': cần 3 điều kiện sao');
        if (!db.bosses[s.boss.id] && !db.miniBosses[s.boss.id]) E(s.stageId + ': boss cuối lạ');
        if (!(s.boss.hp > 0 && s.boss.mech && s.boss.mech.length)) E(s.stageId + ': boss cuối thiếu hp/mech');
        if (!(s.miniBoss.hp > 0 && s.miniBoss.mech.length)) E(s.stageId + ': mini boss thiếu hp/mech');
      });
    });
    return { ok: err.length === 0, errors: err, stats: st };
  };
})();
