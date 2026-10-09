/* Phase 13 — LOADING SCREEN GIỚI THIỆU MÀN CHƠI  (window.DV_LOAD)
   Thay màn Loading "nhân vật chạy qua". Mỗi lần vào màn, nội dung được dựng từ DỮ LIỆU THẬT của màn đó (không hard-code):
     Chương/Màn (tên, khu vực, số màn, loại) · Map (chủ đề, buổi trong ngày, thời tiết → artwork riêng từng map)
     Boss (tên + cơ chế → "kỹ năng đặc biệt" + mẹo) · Quái đặc trưng (chân dung vẽ bằng chính bộ hình quái trong game)
     Phần thưởng · Độ khó · Lực chiến đề xuất (so với lực chiến của bạn) · Mẹo ngẫu nhiên từ DB (boss/quái/địa hình/tướng/môn phái/sự kiện/tiến hoá)
   Chế độ đặc biệt có màn riêng: Đại Chiến Boss (Hắc Long) · Bí Cảnh (theo loại) · Thí Luyện (võ đài) · Ải Tinh Anh · Mùa giải.
   Artwork: 15 chủ đề × 4 buổi, vẽ procedural 3 lớp (trời/xa – giữa – gần) + hạt thời tiết (tuyết, lá, tro, cát, sương...) + parallax nhẹ (CSS, GPU).
   Tối ưu: artwork được cache (tối đa 4), hạt tối đa 14/30/55 theo đồ hoạ, chân dung vẽ lại ≈ 11 fps, tự dọn khi xong. Giảm chuyển động → tĩnh.
   API: DV_LOAD.init({sv,power,q}) · DV_LOAD.show(ST,cb) · DV_LOAD.info(ST) (chỉ dựng dữ liệu, dùng để test) · DV_LOAD.art(theme,tod,hue,seed) */
(function () {
  'use strict';
  const M = Math, TAU = M.PI * 2, R = Math.random;
  const D = () => window.DV_DATA || {}, LS = () => D().loadscreen || {};
  let cfg = { sv: () => ({}), power: () => 0, q: () => 1 };
  const cache = new Map();
  const hsl = (h, s, l, a) => 'hsla(' + (((h % 360) + 360) % 360 | 0) + ',' + (s | 0) + '%,' + (l | 0) + '%,' + (a == null ? 1 : a) + ')';
  const fmt = n => (n | 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }

  /* ====================== 1. DỰNG DỮ LIỆU ====================== */
  function diffOf(st, ch) {
    const idx = st && st.difficulty ? st.difficulty.index : (ch ? ch.chapterId * 6 : 1), tot = (D().db && D().db.chapters ? D().db.chapters.length : 52) * 6, r = idx / tot;
    const L = [['Sơ Nhập', 1], ['Thường', 2], ['Khó', 3], ['Ác Liệt', 4], ['Địa Ngục', 5]], k = r < .15 ? 0 : r < .35 ? 1 : r < .6 ? 2 : r < .85 ? 3 : 4;
    return { n: L[k][0], stars: L[k][1] };
  }
  function enemyList(ch, st) {
    const E = D().enemies || {}, pool = (st && st.waves && st.waves.length ? st.waves.reduce((m, w) => { (w.enemyPool || []).forEach(p => { m[p[0]] = (m[p[0]] || 0) + p[1] }); return m }, {}) : null);
    let ids = pool ? Object.keys(pool).sort((a, b) => pool[b] - pool[a]) : (ch.enemyPool || []).map(p => p.id);
    const intro = ch.introduces || [];                                   /* quái MỚI của chương lên đầu */
    ids = intro.filter(i => E[i]).concat(ids.filter(i => intro.indexOf(i) < 0));
    const seen = new Set(), out = [];
    for (const id of ids) { if (!E[id] || seen.has(id)) continue; seen.add(id); out.push({ id, name: E[id].n, c: E[id].c, r: E[id].r, nw: intro.indexOf(id) >= 0, ab: (E[id].ab || []).map(a => a.k) }) }
    /* ưu tiên quái có kỹ năng đặc trưng để người chơi nhận diện */
    out.sort((a, b) => (b.nw - a.nw) || (b.ab.length - a.ab.length));
    return out.slice(0, 5);
  }
  function rewardChips(st, first) {
    const o = [], r = st && st.rewards; if (!r) return o;
    if (r.gold) o.push(['🪙', 'Vàng', fmt(r.gold)]);
    if (r.exp) o.push(['✨', 'EXP tướng', fmt(r.exp)]);
    if (r.materials && r.materials.tinh) o.push(['⚙', 'Tinh thiết', fmt(r.materials.tinh)]);
    if (r.charMaterials && r.charMaterials.hon) o.push(['🔮', 'Hồn tướng', fmt(r.charMaterials.hon)]);
    if (r.equipment && r.equipment.drops) o.push(['🎁', 'Trang bị', '×' + r.equipment.drops]);
    if (first && r.firstClear && r.firstClear.gem) o.push(['💎', 'Lần đầu', fmt(r.firstClear.gem)]);
    return o;
  }
  function bossInfo(st) {
    if (!st || !st.boss) return null; const b = st.boss, LSd = LS(), skills = [], seen = new Set(); let tip = null;
    for (const m of (b.mech || [])) {
      if (!LSd.skillName[m.k] || seen.has(m.k)) continue; seen.add(m.k); skills.push({ k: m.k, n: LSd.skillName[m.k], ph: m.ph || 1 });
      if (!tip && (m.ph || 1) > 1 && LSd.mechTip[m.k]) tip = LSd.mechTip[m.k].replace('{pct}', (m.ph === 2 ? 66 : 33));
    }
    skills.sort((a, c) => (c.ph - a.ph) || 0);
    return { id: b.id, name: b.name, r: b.r, c: b.c, skills: skills.slice(0, 3), all: skills, tip, hp: b.hp };
  }
  /* mẹo: tĩnh + sinh từ DB game */
  function tipPool(inf) {
    const LSd = LS(), out = [], E = D().enemies || {}, add = (c, t) => { if (t) out.push({ c, t }) };
    const kind = inf.mode;
    (LSd.modeTips && LSd.modeTips[kind] || []).forEach(t => add(kind, t));
    if (inf.boss) { inf.boss.all.forEach(s => { const t = LSd.mechTip[s.k]; if (t) add('boss', t.replace('{pct}', s.ph === 2 ? 66 : 33)) }) }
    inf.enemies.forEach(e => { (E[e.id].ab || []).forEach(a => { const n = { shoot: 'bắn tên từ xa', dash: 'lao thẳng vào bạn', boom: 'tự nổ khi chạm', heal: 'hồi máu cho đồng đội', summon: 'triệu hồi thêm quân' }[a.k]; if (n) add('enemy', e.name + ' ' + n + ' — ' + ({ shoot: 'giữ khoảng cách vừa phải, né ngang', dash: 'thấy vạch đỏ hãy đổi hướng', boom: 'hạ từ xa, đừng để áp sát', heal: 'ưu tiên hạ trước', summon: 'đừng để chúng đông quá 6 con' }[a.k]) + '.') }) ;
      if (e.nw) add('enemy', 'Quái mới của chương: ' + e.name + '. Quan sát cách chúng tấn công trước khi lao vào.') });
    (inf.zones || []).forEach(z => add('zone', LSd.zoneTip[z])); if (inf.hazard) add('zone', LSd.hazardTip[inf.hazard]);
    (inf.events || []).forEach(k => { const e = D().events && D().events[k]; if (e) add('event', e.n + ': ' + e.d + '.') });
    const C = D().characters || [], hs = cfg.sv().hs, h = C.find(x => x.id === hs); if (h && h.passive) add('hero', h.name + ' — nội tại ' + h.passive.name + ': ' + h.passive.d);
    const SK = D().skills || {}; for (const k in SK) if (SK[k].evo) add('skill', SK[k].evo.n + ' (tiến hoá ' + SK[k].n + '): ' + SK[k].evo.d);
    const S = D().sect && D().sect.sects || []; if (S.length) { const s = S[R() * S.length | 0]; add('sect', 'Môn phái ' + s.n + ' — ' + s.d) }
    const stat = (LSd.tips || []).slice(); stat.forEach(t => out.push(t));
    /* ưu tiên: mẹo theo chế độ/boss/quái/địa hình đứng đầu, rồi xáo trộn phần còn lại */
    const pri = out.filter(t => [kind, 'boss', 'zone', 'enemy'].indexOf(t.c) >= 0 && t.c !== 'enemy' || (t.c === 'enemy' && R() < .7)), rest = out.filter(t => pri.indexOf(t) < 0);
    const sh = a => { for (let i = a.length - 1; i > 0; i--) { const j = R() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]] } return a };
    const head = sh(pri).slice(0, 3), seen = new Set(head.map(t => t.c)), tail = sh(rest).filter(t => !seen.has(t.c) || R() < .3);
    return head.concat(tail).slice(0, 8);
  }
  /* ST = đối tượng ván đang chuẩn bị của game ({c,i,t,h,wb,x:'rift'|'trial'…}) */
  function info(ST) {
    ST = ST || {}; const Dd = D(), L = LS(), c = ST.c | 0, ch = Dd.getChapter && Dd.getChapter(c) || { chapterName: 'Giang Hồ', place: '', theme: 'plain', hue: 30, enemyPool: [], rewards: {} };
    const area = (Dd.envAreas && Dd.envAreas[c]) || ['day', 'none', 0, [], null, null, 0, ch.place || '', ''], theme = ch.theme || 'plain';
    const st = ST.i && Dd.getStage ? Dd.getStage(c, ST.i) : null, inf = { c, ST, chapterNo: c + 1, chapterName: ch.chapterName, place: ch.place, act: ch.act, theme, tod: area[0], weather: area[1], zones: area[3] || [], hazard: area[4], hue: ch.hue, areaName: area[7], desc: area[8], seed: c * 977 + (ST.i | 0) * 31 };
    const mapN = Dd.maps && Dd.maps[theme] && Dd.maps[theme].n;
    inf.mapName = mapN; inf.stageType = st ? st.type : 'n';
    inf.stageNo = st ? st.stageId : (c + 1) + '-' + String(ST.i | 0).padStart(2, '0'); inf.power = st ? st.recommendedPower : ch.recommendedPower; inf.diff = diffOf(st, ch);
    inf.mode = 'chapter'; inf.title = 'CHƯƠNG ' + (c + 1); inf.name = ch.chapterName.toUpperCase(); inf.sub = (ch.act ? ch.act + ' · ' : '') + (area[7] || ch.place || '');
    inf.enemies = enemyList(ch, st); inf.boss = st && st.type === 'b' ? bossInfo(st) : null; inf.rewards = rewardChips(st, true); inf.status = null; inf.events = st ? [...new Set((st.events || []).filter(e => e.k === 'event').map(e => e.ev))] : [];
    if (st && st.miniBoss) inf.mini = st.miniBoss.name;
    inf.tag = st ? ({ n: 'Ải Thường', e: 'Ải Tinh Anh', t: 'Kho Báu', b: 'Ải Boss', v: 'Sự Kiện' }[st.type] || 'Ải Thường') : '';
    if (inf.boss) inf.mode = 'boss';
    /* ---- chế độ đặc biệt ---- */
    const EV = L.events || {};
    if (ST.wb) {                                                       /* Đại Chiến Boss thế giới */
      const e = EV.wb; inf.mode = 'wb'; inf.title = e.title; inf.name = e.sub; inf.sub = e.tag; inf.theme = e.theme; inf.tod = e.tod; inf.hue = e.hue; inf.weather = 'ember'; inf.zones = []; inf.hazard = 'meteor';
      const ph = Dd.realm && Dd.realm.wboss; inf.boss = { id: 'wb', name: 'Hắc Long', r: 34, c: '#a82020', skills: (ph ? ph.mech : []).filter((m, i, a) => a.findIndex(x => x.k === m.k) === i).slice(0, 3).map(m => ({ k: m.k, n: L.skillName[m.k] || m.k, ph: m.ph })), all: (ph ? ph.mech : []).map(m => ({ k: m.k, n: L.skillName[m.k], ph: m.ph })), tip: L.modeTips.wb[0] };
      inf.enemies = []; inf.rewards = e.rewards.map(r => [r[0], r[1], '']); inf.power = null; inf.diff = { n: 'Boss Thế Giới', stars: 5 }; inf.status = e.status; inf.areaName = 'Hang Hắc Long'; inf.stageNo = 'WORLD BOSS'; inf.events = []; inf.seed = 7771;
    } else if (ST.x === 'rift') {                                      /* Bí Cảnh */
      const T = Dd.realm && Dd.realm.type ? Dd.realm.type(ST.r) : null, rt = (L.riftTheme || {})[ST.r] || ['cave', 'night', 215];
      inf.mode = 'rift'; inf.title = 'BÍ CẢNH · TẦNG ' + (ST.f || 1); inf.name = (T ? T.n : 'Bí Cảnh').toUpperCase(); inf.sub = T ? T.d : ''; inf.theme = rt[0]; inf.tod = rt[1]; inf.hue = rt[2]; inf.weather = 'motes'; inf.tag = 'Bí Cảnh';
      inf.status = L.events.rift.status; inf.boss = inf.boss && ST.f && Dd.realm.isBossFloor(ST.f) ? inf.boss : null; inf.stageNo = 'RIFT ' + (T ? T.id : '') + ' ' + (ST.f || 1);
      inf.rewards = T ? [[T.i, T.n, '']].concat(rewardChips(st, false).slice(0, 4)) : inf.rewards; inf.areaName = T ? T.n : 'Bí Cảnh'; inf.desc = T ? T.d : '';
      inf.seed = (ST.f | 0) * 13 + 500;
    } else if (ST.x === 'trial') {                                     /* Thí Luyện / Đại Hội Võ Lâm */
      const e = EV.trial, ti = Dd.realm && Dd.realm.tiers && Dd.realm.tiers[ST.tier | 0]; inf.mode = 'trial'; inf.title = e.title; inf.name = 'THÍ LUYỆN ' + (ti ? ti.n.toUpperCase() : ''); inf.sub = e.tag; inf.theme = e.theme; inf.tod = e.tod; inf.hue = e.hue; inf.arena = 1; inf.weather = 'petals'; inf.zones = []; inf.hazard = null;
      inf.boss = null; inf.rewards = e.rewards.map(r => [r[0], r[1], '']); inf.status = e.status; inf.areaName = 'Võ Đài Võ Lâm'; inf.seed = 900 + (ST.tier | 0);
    } else if (ST.h) {                                                 /* Ải Tinh Anh */
      const e = EV.elite; inf.mode = 'elite'; inf.title = e.title + ' · ' + inf.title; inf.tag = 'Tinh Anh'; inf.status = e.status;
    }
    if (ST.season) { const e = EV.season; inf.mode = 'season'; inf.title = e.title; inf.theme = e.theme; inf.tod = e.tod; inf.hue = e.hue; inf.name = String(ST.season).toUpperCase() }
    inf.you = cfg.power(); inf.tips = tipPool(inf);
    inf.steps = [L.status.start, L.status.enemies].concat(inf.boss ? [L.status.boss] : [L.status.env], [L.status.audio, L.status.ready]);
    if (inf.status) inf.steps[0] = inf.status;
    return inf;
  }

  /* ====================== 2. ARTWORK PROCEDURAL ====================== */
  const TOD = { dawn: [[232, 40, 24], [18, 88, 70]], day: [[210, 70, 46], [200, 70, 88]], dusk: [[262, 40, 26], [14, 86, 62]], night: [[232, 55, 8], [226, 40, 26]] };
  const TH = {   /* hue sky, độ bão hoà, ánh sáng*/
    plain: { dh: 0, ds: 0, dl: 0 }, river: { dh: 8, ds: -6, dl: 0 }, valley: { dh: -8, ds: -10, dl: -4 }, forest: { dh: 60, ds: -14, dl: -6 }, citadel: { dh: 6, ds: -8, dl: -2 },
    swamp: { dh: 80, ds: -22, dl: -10 }, mountain: { dh: 4, ds: -22, dl: -12 }, cave: { dh: 10, ds: -10, dl: -18 }, sea: { dh: 4, ds: 0, dl: -4 }, volcano: { dh: -170, ds: 10, dl: -8 },
    snow: { dh: 0, ds: -22, dl: 12 }, desert: { dh: -150, ds: 4, dl: 6 }, shadow: { dh: 56, ds: -4, dl: -14 }, heaven: { dh: -150, ds: 8, dl: 16 }, void: { dh: 70, ds: 6, dl: -18 }
  };
  function skyCol(theme, tod, hue) {
    const b = TOD[tod] || TOD.day, t = TH[theme] || TH.plain, h = hue == null ? 30 : hue;
    let top = [b[0][0] + t.dh * .6, b[0][1] + t.ds, b[0][2] + t.dl], bot = [b[1][0] + t.dh * .4, b[1][1] + t.ds, b[1][2] + t.dl * .6];
    if (theme === 'volcano') { top = [350, 55, 14]; bot = [16, 90, 48] } else if (theme === 'desert') { top = [28, 62, 42]; bot = [42, 90, 74] } else if (theme === 'void') { top = [268, 60, 6]; bot = [292, 55, 24] }
    else if (theme === 'heaven') { top = [208, 60, 56]; bot = [46, 95, 86] } else if (theme === 'shadow') { top = [272, 55, 8]; bot = [296, 45, 22] } else if (theme === 'snow') { top = [208, 36, 56]; bot = [200, 40, 90] }
    else if (theme === 'cave') { top = [240, 40, 5]; bot = [h, 40, 16] }
    return { top: hsl(top[0], top[1], top[2]), bot: hsl(bot[0], bot[1], bot[2]), hb: bot[0], tl: top[2] };
  }
  const ridge = (c, W, H, y0, amp, col, rnd, step, jag) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); let y = y0; for (let x = 0; x <= W + step; x += step) { y = y0 + (rnd() - .5) * amp * (jag || 1) + M.sin(x * .011 + y0) * amp * .35; c.lineTo(x, y) } c.lineTo(W, H); c.closePath(); c.fill() };
  const cloud = (c, x, y, s, col) => { c.fillStyle = col; for (const [dx, dy, r] of [[0, 0, 1], [.8, .1, .8], [-.8, .15, .75], [.3, -.35, .8], [-.35, -.25, .65]]) { c.beginPath(); c.ellipse(x + dx * s, y + dy * s, r * s * .9, r * s * .55, 0, 0, TAU); c.fill() } };
  function pagoda(c, x, y, s, col, tiers) { c.fillStyle = col; for (let i = 0; i < tiers; i++) { const w = s * (1.5 - i * .22), yy = y - i * s * .55; c.beginPath(); c.moveTo(x - w * .6, yy); c.quadraticCurveTo(x - w * .25, yy - s * .06, x, yy - s * .32); c.quadraticCurveTo(x + w * .25, yy - s * .06, x + w * .6, yy); c.lineTo(x + w * .45, yy); c.lineTo(x + w * .4, yy + s * .22); c.lineTo(x - w * .4, yy + s * .22); c.lineTo(x - w * .45, yy); c.closePath(); c.fill() } c.fillRect(x - 1.5, y - tiers * s * .55 - s * .5, 3, s * .5) }
  function bamboo(c, x, y, h, w, col, hi, rnd) { c.fillStyle = col; c.fillRect(x - w / 2, y - h, w, h); c.fillStyle = hi; c.fillRect(x - w / 2, y - h, w * .3, h); c.fillStyle = 'rgba(0,0,0,.28)'; for (let j = y - 22; j > y - h; j -= 26 + rnd() * 14) c.fillRect(x - w / 2 - 1, j, w + 2, 3); c.strokeStyle = col; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const jy = y - h + 20 + k * 38 + rnd() * 20, d = rnd() < .5 ? -1 : 1; c.beginPath(); c.moveTo(x, jy); c.quadraticCurveTo(x + d * 18, jy - 6, x + d * 34, jy + 8); c.stroke(); c.fillStyle = col; c.beginPath(); c.ellipse(x + d * 34, jy + 8, 12, 3, d * .5, 0, TAU); c.fill() } }
  const pine = (c, x, y, h, col, snow) => { c.fillStyle = col; for (let i = 0; i < 4; i++) { const w = h * (.32 - i * .05), yy = y - h * (.15 + i * .22); c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x, yy - h * .3); c.lineTo(x + w, yy); c.closePath(); c.fill(); if (snow) { c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(x - w * .6, yy - h * .12); c.lineTo(x, yy - h * .3); c.lineTo(x + w * .6, yy - h * .12); c.closePath(); c.fill(); c.fillStyle = col } } c.fillRect(x - 2, y - h * .15, 4, h * .15) };
  const crystal = (c, x, y, h, col, hi) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - h * .16, y); c.lineTo(x - h * .08, y - h * .8); c.lineTo(x, y - h); c.lineTo(x + h * .1, y - h * .7); c.lineTo(x + h * .16, y); c.closePath(); c.fill(); c.fillStyle = hi; c.beginPath(); c.moveTo(x - h * .02, y); c.lineTo(x, y - h); c.lineTo(x + h * .05, y - h * .7); c.lineTo(x + h * .06, y); c.closePath(); c.fill() };
  const spire = (c, x, y, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h * .7); c.lineTo(x - w * .6, y - h * .72); c.lineTo(x, y - h); c.lineTo(x + w * .6, y - h * .72); c.lineTo(x + w / 2, y - h * .7); c.lineTo(x + w / 2, y); c.closePath(); c.fill() };
  const wall = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y - h, w, h); for (let i = 0; i < w; i += 18) c.fillRect(x + i, y - h - 9, 11, 9) };
  const wave = (c, W, H, y0, amp, col, ph, f) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W + 8; x += 8) c.lineTo(x, y0 + M.sin(x * f + ph) * amp + M.sin(x * f * 2.3 + ph * 1.7) * amp * .4); c.lineTo(W, H); c.fill() };
  const star = (c, rnd, W, H, n, hmax) => { for (let i = 0; i < n; i++) { c.fillStyle = 'rgba(255,255,255,' + (.3 + rnd() * .7) + ')'; c.fillRect(rnd() * W, rnd() * H * hmax, 1 + rnd() * 1.6, 1 + rnd() * 1.6) } };
  const glow = (c, x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2) };

  /* mỗi chủ đề trả về 3 lớp canvas: bg (trời+xa), mid, fg */
  function paintArt(theme, tod, hue, seed, W, H) {
    const mk = () => { const k = document.createElement('canvas'); k.width = W; k.height = H; return k }, bg = mk(), mid = mk(), fg = mk(), a = bg.getContext('2d'), b = mid.getContext('2d'), f = fg.getContext('2d'), rnd = rng(seed + 7), sky = skyCol(theme, tod, hue), night = tod === 'night';
    const g = a.createLinearGradient(0, 0, 0, H * .75); g.addColorStop(0, sky.top); g.addColorStop(1, sky.bot); a.fillStyle = g; a.fillRect(0, 0, W, H);
    if (night || theme === 'void' || theme === 'shadow' || theme === 'cave') star(a, rnd, W, H, theme === 'cave' ? 12 : 90, .5);
    const sunx = W * (.2 + rnd() * .6), suny = H * (tod === 'day' ? .2 : tod === 'night' ? .17 : .42), sunR = M.min(W, H) * (theme === 'desert' ? .2 : .1);
    if (theme !== 'cave' && theme !== 'void') { glow(a, sunx, suny, sunR * 4, night ? 'rgba(190,210,255,.35)' : 'rgba(255,230,160,.55)'); a.fillStyle = night ? '#eef3ff' : theme === 'volcano' ? '#ff9a5a' : '#fff6d0'; a.beginPath(); a.arc(sunx, suny, sunR, 0, TAU); a.fill(); if (night) { a.fillStyle = sky.top; a.beginPath(); a.arc(sunx + sunR * .35, suny - sunR * .1, sunR * .92, 0, TAU); a.fill() } }
    const dk = (l, al) => hsl(sky.hb, 28, M.max(4, sky.tl + l), al == null ? 1 : al), cl = night ? 'rgba(120,140,190,.18)' : 'rgba(255,255,255,.35)';
    const dark = night || theme === 'shadow' || theme === 'void' || theme === 'cave', sh = dark ? 0 : 10;
    switch (theme) {
      case 'plain': for (let i = 0; i < 4; i++)cloud(a, rnd() * W, H * (.12 + rnd() * .25), 40 + rnd() * 40, cl); ridge(a, W, H, H * .55, 26, dk(10 + sh), rnd, 24); pagoda(b, W * .72, H * .66, 30, dk(2), 3); pagoda(b, W * .2, H * .68, 20, dk(4), 2); ridge(b, W, H, H * .66, 18, dk(-2 + sh * .3), rnd, 20);
        for (let i = 0; i < 10; i++) { const x = rnd() * W, y = H * (.72 + rnd() * .2); f.fillStyle = '#5a3a2a'; f.fillRect(x - 2, y - 44, 4, 44); f.fillStyle = hsl(340, 70, 78, .9); for (let k = 0; k < 7; k++) { f.beginPath(); f.arc(x + (rnd() - .5) * 46, y - 52 + (rnd() - .5) * 26, 12 + rnd() * 8, 0, TAU); f.fill() } } ridge(f, W, H, H * .84, 14, dk(-8), rnd, 18); break;
      case 'river': ridge(a, W, H, H * .52, 30, dk(8 + sh), rnd, 26); ridge(b, W, H, H * .6, 20, dk(0 + sh * .3), rnd, 22); wave(b, W, H, H * .68, 4, hsl(sky.hb + 150, 40, M.max(8, sky.tl + 14)), 1, .02); wave(f, W, H, H * .78, 6, hsl(sky.hb + 150, 40, M.max(6, sky.tl + 4)), 2, .015);
        for (let i = 0; i < 9; i++) { const x = rnd() * W, y = H * (.74 + rnd() * .2); f.fillStyle = '#2a1a10'; f.fillRect(x - 3, y - 70 - rnd() * 40, 6, 90) } for (let i = 0; i < 2; i++) { const x = W * (.25 + i * .45), y = H * .71; b.fillStyle = dk(-6); b.beginPath(); b.moveTo(x - 36, y); b.lineTo(x + 36, y); b.lineTo(x + 24, y + 10); b.lineTo(x - 24, y + 10); b.fill(); b.fillRect(x - 1, y - 52, 2, 52); b.beginPath(); b.moveTo(x + 2, y - 50); b.lineTo(x + 30, y - 8); b.lineTo(x + 2, y - 8); b.fill() } break;
      case 'valley': ridge(a, W, H, H * .45, 60, dk(14 + sh), rnd, 30, 1.6); ridge(b, W, H, H * .6, 70, dk(2 + sh * .4), rnd, 28, 1.7); for (let i = 0; i < 7; i++)pine(f, rnd() * W, H * (.78 + rnd() * .18), 70 + rnd() * 70, dk(-10)); break;
      case 'forest': ridge(a, W, H, H * .5, 40, dk(12 + sh), rnd, 24); for (let i = 0; i < 16; i++)bamboo(a, rnd() * W, H * .95, H * (.5 + rnd() * .3), 6 + rnd() * 5, hsl(130, 30, 22 + sh * .4, .75), hsl(120, 36, 38 + sh * .3, .6), rnd);
        for (let i = 0; i < 12; i++)bamboo(b, rnd() * W, H * 1.02, H * (.7 + rnd() * .3), 10 + rnd() * 8, hsl(135, 36, 17 + sh * .3), hsl(120, 42, 32 + sh * .3), rnd); for (let i = 0; i < 6; i++)bamboo(f, rnd() * W, H * 1.08, H * (.9 + rnd() * .3), 18 + rnd() * 12, hsl(140, 40, 10), hsl(125, 44, 22), rnd);
        if (!dark) { f.fillStyle = 'rgba(255,240,170,.12)'; for (let i = 0; i < 4; i++) { const x = rnd() * W; f.beginPath(); f.moveTo(x, 0); f.lineTo(x + 40, 0); f.lineTo(x - 80 + rnd() * 40, H); f.lineTo(x - 140, H); f.fill() } } break;
      case 'citadel': ridge(a, W, H, H * .55, 20, dk(10 + sh), rnd, 26); wall(b, 0, H * .7, W, 50, dk(0 + sh * .3)); pagoda(b, W * .5, H * .7 - 52, 40, dk(-4), 3); for (let i = 0; i < 4; i++) { const x = W * (.1 + i * .26); b.fillStyle = hsl(4, 70, 40); b.fillRect(x, H * .7 - 92, 3, 40); b.beginPath(); b.moveTo(x + 3, H * .7 - 90); b.lineTo(x + 28, H * .7 - 80); b.lineTo(x + 3, H * .7 - 70); b.fill() } wall(f, -10, H * .9, W * .4, 80, dk(-12)); wall(f, W * .62, H * .92, W * .5, 90, dk(-12)); break;
      case 'swamp': ridge(a, W, H, H * .58, 20, dk(8 + sh), rnd, 24); wave(b, W, H, H * .72, 3, hsl(120, 30, 12), 1, .03); for (let i = 0; i < 8; i++) { const x = rnd() * W, y = H * (.7 + rnd() * .2); b.strokeStyle = dk(-10); b.lineWidth = 5; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + (rnd() - .5) * 40, y - 60, x + (rnd() - .5) * 60, y - 110 - rnd() * 50); b.stroke() } for (let i = 0; i < 12; i++) glow(f, rnd() * W, H * (.55 + rnd() * .35), 22 + rnd() * 20, 'rgba(120,255,140,.4)'); ridge(f, W, H, H * .88, 12, 'rgba(10,20,10,.9)', rnd, 20); break;
      case 'mountain': ridge(a, W, H, H * .4, 90, dk(10 + sh), rnd, 40, 2.3); ridge(b, W, H, H * .58, 110, dk(0 + sh * .4), rnd, 36, 2.4); ridge(f, W, H, H * .8, 80, dk(-9), rnd, 30, 2); if (!dark) { f.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 4; i++) { const x = rnd() * W; f.beginPath(); f.moveTo(x, H * .55); f.lineTo(x + 20, H * .65); f.lineTo(x - 20, H * .65); f.fill() } } break;
      case 'cave': for (let i = 0; i < 14; i++) { const x = rnd() * W, h = 40 + rnd() * 110; a.fillStyle = dk(-2 + rnd() * 6); a.beginPath(); a.moveTo(x - 14 - rnd() * 14, 0); a.lineTo(x + 14 + rnd() * 14, 0); a.lineTo(x, h); a.fill() } ridge(b, W, H, H * .72, 30, dk(0), rnd, 24); for (let i = 0; i < 9; i++) { const x = rnd() * W, hh = 30 + rnd() * 70; glow(b, x, H * .8 - hh * .5, hh * 1.2, hsl(hue, 80, 55, .22)); crystal(b, x, H * .84, hh, hsl(hue, 60, 38), hsl(hue, 80, 74)) } ridge(f, W, H, H * .92, 14, dk(-12), rnd, 18); break;
      case 'sea': ridge(a, W, H, H * .52, 14, dk(8 + sh), rnd, 40); for (let i = 0; i < 3; i++)cloud(a, rnd() * W, H * (.1 + rnd() * .2), 50 + rnd() * 40, cl); wave(b, W, H, H * .6, 5, hsl(sky.hb + 160, 46, M.max(10, sky.tl + 12)), 1, .02); { const x = W * .66, y = H * .6; b.fillStyle = dk(-8); b.beginPath(); b.moveTo(x - 50, y); b.lineTo(x + 50, y); b.lineTo(x + 36, y + 14); b.lineTo(x - 36, y + 14); b.fill(); b.fillRect(x - 2, y - 70, 3, 70); b.beginPath(); b.moveTo(x + 2, y - 66); b.lineTo(x + 40, y - 12); b.lineTo(x + 2, y - 12); b.fill() } wave(f, W, H, H * .74, 9, hsl(sky.hb + 160, 50, M.max(8, sky.tl + 6)), 2, .018); wave(f, W, H, H * .88, 12, hsl(sky.hb + 160, 54, M.max(6, sky.tl)), 4, .014); break;
      case 'volcano': glow(a, W * .5, H * .38, W * .6, 'rgba(255,90,20,.35)'); b.fillStyle = dk(-6); b.beginPath(); b.moveTo(W * .1, H); b.lineTo(W * .42, H * .38); b.lineTo(W * .58, H * .38); b.lineTo(W * .96, H); b.fill(); glow(b, W * .5, H * .38, 90, 'rgba(255,170,60,.8)'); b.strokeStyle = 'rgba(255,120,30,.9)'; b.lineWidth = 3; for (let i = 0; i < 4; i++) { b.beginPath(); b.moveTo(W * (.46 + i * .03), H * .4); b.lineTo(W * (.44 + i * .05), H * .6 + i * 20); b.lineTo(W * (.4 + i * .08), H * .8); b.stroke() } ridge(f, W, H, H * .84, 24, 'rgba(14,6,6,.95)', rnd, 22, 1.5); for (let i = 0; i < 6; i++)glow(f, rnd() * W, H * (.86 + rnd() * .1), 30, 'rgba(255,120,30,.5)'); break;
      case 'snow': ridge(a, W, H, H * .42, 80, hsl(205, 30, 78), rnd, 36, 2.2); ridge(b, W, H, H * .58, 80, hsl(208, 30, 88), rnd, 32, 2); for (let i = 0; i < 9; i++)pine(f, rnd() * W, H * (.78 + rnd() * .2), 60 + rnd() * 80, hsl(160, 30, 22), 1); ridge(f, W, H, H * .9, 12, 'rgba(240,248,255,.95)', rnd, 20); break;
      case 'desert': ridge(a, W, H, H * .55, 14, dk(10 + sh), rnd, 40); b.fillStyle = dk(-4); b.beginPath(); b.moveTo(W * .64, H * .68); b.lineTo(W * .76, H * .46); b.lineTo(W * .88, H * .68); b.fill(); pagoda(b, W * .22, H * .66, 24, dk(-6), 4); ridge(b, W, H, H * .68, 22, hsl(36, 60, 48 - (night ? 26 : 0)), rnd, 40); ridge(f, W, H, H * .82, 30, hsl(32, 56, 38 - (night ? 22 : 0)), rnd, 36); ridge(f, W, H, H * .93, 16, hsl(28, 52, 28 - (night ? 16 : 0)), rnd, 28); break;
      case 'shadow': ridge(a, W, H, H * .55, 40, dk(8), rnd, 30); for (let i = 0; i < 6; i++)spire(b, W * (.1 + i * .16), H * .74, 26 + rnd() * 16, 120 + rnd() * 140, dk(-2)); spire(b, W * .5, H * .76, 60, 280, dk(-5)); glow(b, W * .5, H * .5, 90, 'rgba(180,70,255,.4)'); for (let i = 0; i < 8; i++)glow(f, rnd() * W, H * (.6 + rnd() * .3), 26, 'rgba(170,90,255,.35)'); ridge(f, W, H, H * .9, 18, 'rgba(8,4,14,.96)', rnd, 20); break;
      case 'heaven': for (let i = 0; i < 6; i++)cloud(a, rnd() * W, H * (.1 + rnd() * .5), 60 + rnd() * 50, 'rgba(255,255,255,.55)'); for (let i = 0; i < 3; i++) { const x = W * (.15 + i * .34), y = H * (.5 + rnd() * .12); b.fillStyle = hsl(30, 30, 82); b.beginPath(); b.ellipse(x, y, 70, 18, 0, 0, M.PI); b.fill(); b.fillStyle = hsl(120, 36, 62); b.fillRect(x - 70, y - 5, 140, 5); pagoda(b, x, y - 5, 22, hsl(8, 70, 52), 3) } f.fillStyle = 'rgba(255,240,180,.1)'; for (let i = 0; i < 4; i++) { const x = rnd() * W; f.beginPath(); f.moveTo(x, 0); f.lineTo(x + 50, 0); f.lineTo(x - 60, H); f.lineTo(x - 140, H); f.fill() } for (let i = 0; i < 6; i++)cloud(f, rnd() * W, H * (.86 + rnd() * .12), 80 + rnd() * 50, 'rgba(255,255,255,.7)'); break;
      case 'void': for (let i = 0; i < 9; i++) { const x = rnd() * W, y = H * (.2 + rnd() * .55), s = 14 + rnd() * 40; b.fillStyle = dk(4 + rnd() * 8); b.beginPath(); b.moveTo(x - s, y); b.lineTo(x - s * .4, y - s * .5); b.lineTo(x + s * .6, y - s * .3); b.lineTo(x + s, y + s * .1); b.lineTo(x + s * .2, y + s * .9); b.lineTo(x - s * .7, y + s * .5); b.fill() } glow(b, W * .5, H * .45, W * .55, 'rgba(180,60,255,.4)'); b.strokeStyle = 'rgba(230,170,255,.8)'; b.lineWidth = 2; for (let i = 0; i < 3; i++) { b.beginPath(); b.ellipse(W * .5, H * .45, 40 + i * 30, 16 + i * 8, -.4 + i * .3, 0, TAU); b.stroke() } ridge(f, W, H, H * .92, 12, 'rgba(8,2,16,.96)', rnd, 20); break;
      default: ridge(a, W, H, H * .55, 30, dk(10), rnd, 28); ridge(b, W, H, H * .7, 24, dk(0), rnd, 24); ridge(f, W, H, H * .88, 14, dk(-10), rnd, 20);
    }
    return { bg, mid, fg };
  }
  /* khung võ đài (Thí Luyện) vẽ chồng lên nền */
  function arenaOverlay(c, W, H) { c.fillStyle = 'rgba(20,10,6,.5)'; c.beginPath(); c.ellipse(W / 2, H * .82, W * .46, H * .09, 0, 0, TAU); c.fill(); c.strokeStyle = '#ffd978'; c.lineWidth = 3; c.beginPath(); c.ellipse(W / 2, H * .82, W * .46, H * .09, 0, 0, TAU); c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.ellipse(W / 2, H * .82, W * .34, H * .065, 0, 0, TAU); c.stroke(); for (const sx of [.1, .9]) { c.fillStyle = '#8a1a14'; c.fillRect(W * sx - 2, H * .45, 4, H * .38); c.beginPath(); c.moveTo(W * sx + 2, H * .47); c.lineTo(W * sx + (sx < .5 ? 34 : -34), H * .52); c.lineTo(W * sx + 2, H * .58); c.fill() } }
  function art(theme, tod, hue, seed, W, H, arena) {
    const k = [theme, tod, hue | 0, seed | 0, W, H, arena ? 1 : 0].join('|'); let o = cache.get(k); if (o) { cache.delete(k); cache.set(k, o); return o }
    o = paintArt(theme, tod, hue, seed, W, H); if (arena) arenaOverlay(o.mid.getContext('2d'), W, H);
    cache.set(k, o); while (cache.size > 4) cache.delete(cache.keys().next().value);       /* dỡ artwork cũ */
    return o;
  }

  /* ====================== 3. CHÂN DUNG QUÁI / BOSS ====================== */
  function drawMon(cv, m, inf, t, boss) {
    const c = cv.getContext('2d'), w = cv.width, h = cv.height; c.clearRect(0, 0, w, h);
    const MA = window.DV_MART; c.save(); c.translate(w / 2, h * .88);
    const s = boss ? 1.45 : 1.15 * M.min(1.25, M.max(.85, (m.r || 11) / 12));
    c.scale(s, s);
    if (m.id === 'wb') { drawDragon(c, t); c.restore(); return }
    try {
      if (MA && MA.body) {
        const e = { tid: m.id === 'boss' ? 'colossus' : m.id, id: 3, boss: boss ? 1 : 0, mb: 0, el: 0, c: m.c, fl: 0, sp: 50, tel: 0, dsh: 0, born: null, hp: 1, mhp: 1, x: 0, y: 0 }, G = { t, ch: { theme: inf.theme, chapterId: inf.chapterNo, bossTier: 3 }, p: { x: 1e5, y: 0 }, en: { length: 0 } };
        if (boss) e.tid = bossTid(inf.theme); MA.body(c, e, G, 2);
      } else { c.fillStyle = m.c || '#7a3030'; c.beginPath(); c.arc(0, -14, 14, 0, TAU); c.fill() }
    } catch (er) { c.fillStyle = m.c || '#7a3030'; c.beginPath(); c.arc(0, -14, 14, 0, TAU); c.fill() }
    c.restore();
  }
  const bossTid = th => ({ citadel: 'colossus', mountain: 'colossus', cave: 'colossus' }[th] || 'colossus');
  function drawDragon(c, t) {
    c.scale(1.5, 1.5); c.fillStyle = '#2a0a0a'; c.strokeStyle = '#ff5a2a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-30, -6); c.quadraticCurveTo(-34, -30, -14, -34 + M.sin(t * 3) * 2); c.quadraticCurveTo(0, -48, 16, -34); c.quadraticCurveTo(34, -28, 30, -12); c.quadraticCurveTo(22, -2, 8, -4); c.quadraticCurveTo(-8, 4, -30, -6); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-10, -42); c.lineTo(-16, -56); c.lineTo(-4, -44); c.moveTo(10, -42); c.lineTo(18, -56); c.lineTo(4, -44); c.fill(); c.fillStyle = '#ffd34a'; c.beginPath(); c.arc(-6, -30, 2.4, 0, TAU); c.arc(8, -30, 2.4, 0, TAU); c.fill();
  }

  /* ====================== 4. GIAO DIỆN ====================== */
  function css() {
    if (document.getElementById('dvld-css')) return; const s = document.createElement('style'); s.id = 'dvld-css';
    s.textContent = `#dvld{position:fixed;inset:0;z-index:99;background:#05060f;color:#fff;font-family:Georgia,'Times New Roman',serif;overflow:hidden;display:flex;flex-direction:column;opacity:1;transition:opacity .35s;user-select:none;-webkit-tap-highlight-color:transparent}
#dvld.out{opacity:0;pointer-events:none}
#dvld .ly{position:absolute;left:-6%;top:-3%;width:112%;height:106%;will-change:transform}
#dvld .ly canvas{width:100%;height:100%;display:block}
#dvld .l1{animation:dvp1 14s ease-in-out infinite alternate}#dvld .l2{animation:dvp2 11s ease-in-out infinite alternate}#dvld .l3{animation:dvp3 8s ease-in-out infinite alternate}
@keyframes dvp1{to{transform:translate3d(-1.2%,0,0)}}@keyframes dvp2{to{transform:translate3d(2%,0,0)}}@keyframes dvp3{to{transform:translate3d(-3.5%,0,0)}}
#dvld.rm .ly{animation:none}
#dvld .fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#dvld .sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.62) 0,rgba(0,0,0,0) 28%,rgba(0,0,0,0) 44%,rgba(0,0,0,.78) 100%);pointer-events:none}
#dvld .in{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:calc(env(safe-area-inset-top) + 18px) 16px calc(env(safe-area-inset-bottom) + 14px);max-width:760px;margin:0 auto;width:100%;box-sizing:border-box}
#dvld .hd{text-align:center;text-shadow:0 2px 8px #000}
#dvld .tg{display:inline-block;font-size:11px;letter-spacing:2px;padding:2px 10px;border-radius:10px;border:1px solid rgba(255,217,120,.6);background:rgba(0,0,0,.35);color:#ffd978;margin-bottom:6px}
#dvld .ti{font-size:14px;letter-spacing:5px;color:#ffd978;font-weight:700}
#dvld .nm{font-size:clamp(26px,7vw,40px);font-weight:900;letter-spacing:2px;line-height:1.15;margin:2px 0;background:linear-gradient(#fff6c8,#ffc94a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 3px #000)}
#dvld .sb{font-size:13px;opacity:.92;color:#ffe9b8}
#dvld .sp{flex:1;min-height:8px}
#dvld .bx{background:linear-gradient(rgba(14,16,34,.58),rgba(8,10,22,.7));border:1.5px solid rgba(214,168,74,.65);border-radius:12px;padding:8px 10px;margin-top:8px;box-shadow:0 4px 18px rgba(0,0,0,.5)}
#dvld .bx h4{margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#ffd978;font-weight:700}
#dvld .bs{display:flex;gap:10px;align-items:center}
#dvld .bs canvas{flex:0 0 auto;border-radius:10px;background:radial-gradient(rgba(255,70,50,.35),rgba(0,0,0,.2) 70%);border:1px solid rgba(255,120,90,.5)}
#dvld .bn{font-size:20px;font-weight:900;color:#ff9a8a;text-shadow:0 1px 4px #000}
#dvld .bk{font-size:12px;line-height:1.55;color:#ffe9d0;margin:0;padding:0;list-style:none}
#dvld .bk li:before{content:"◆ ";color:#ff7a5a}
#dvld .en{display:flex;gap:6px;justify-content:space-around}
#dvld .en div{text-align:center;flex:1;min-width:0}
#dvld .en canvas{display:block;margin:0 auto;background:radial-gradient(rgba(255,255,255,.1),rgba(0,0,0,0) 70%);border-radius:8px}
#dvld .en small{display:block;font-size:10px;margin-top:1px;color:#e8dcc0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dvld .en .nw small{color:#ffd978}
#dvld .ch{display:flex;flex-wrap:wrap;gap:6px 8px}
#dvld .ch span{font-size:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,217,120,.35);border-radius:14px;padding:2px 9px;white-space:nowrap}
#dvld .ch b{color:#ffd978}
#dvld .st{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12px;margin-top:8px}
#dvld .st>div{background:rgba(0,0,0,.4);border:1px solid rgba(214,168,74,.45);border-radius:10px;padding:4px 10px;flex:1;text-align:center;min-width:120px}
#dvld .st small{display:block;font-size:10px;letter-spacing:1px;color:#c9b88a}
#dvld .st b{font-size:15px}
#dvld .tp{min-height:46px;display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.45;color:#fff4d8;transition:opacity .3s}
#dvld .tp i{font-style:normal;font-size:10px;letter-spacing:1px;background:#ffd978;color:#3a2606;font-weight:800;border-radius:6px;padding:1px 6px;margin-top:2px;white-space:nowrap}
#dvld .pg{margin-top:10px}
#dvld .pb{height:12px;border-radius:7px;background:rgba(0,0,0,.6);border:1.5px solid #a8802f;overflow:hidden}
#dvld .pb i{display:block;height:100%;width:0;background:linear-gradient(#ffe48f,#e3881c);box-shadow:0 0 10px #ffb62e}
#dvld .pt{display:flex;justify-content:space-between;font-size:12px;margin-top:4px;color:#ffe9b8;text-shadow:0 1px 3px #000}
#dvld .sk{text-align:center;font-size:10px;opacity:.6;margin-top:3px}
@media (max-height:640px){#dvld .bs canvas{width:72px;height:72px}#dvld .bx{padding:6px 8px;margin-top:5px}#dvld .tp{min-height:38px;font-size:12px}#dvld .nm{font-size:24px}#dvld .st{margin-top:5px}}`;
    document.head.appendChild(s);
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
  function particleKind(inf) {                         /* thời tiết riêng của từng khu → loại hạt */
    const w = inf.weather, t = inf.theme, m = { petals: 'leaf', rain: 'rain', storm: 'rain', snow: 'snow', blizzard: 'snow', sand: 'sand', ash: 'ash', ember: 'ember', fog: 'mist', spore: 'spore', motes: 'mote', spray: 'mist' };
    let k = m[w] || (t === 'snow' ? 'snow' : t === 'volcano' ? 'ember' : t === 'desert' ? 'sand' : t === 'forest' || t === 'plain' ? 'leaf' : 'mote');
    return { k, col: { leaf: ['#f4a3b8', '#ffd0dc', '#9fd0a0'], rain: ['#bfd8ff'], snow: ['#fff'], sand: ['#e8c88a'], ash: ['#9a8a8a', '#ccc'], ember: ['#ffb040', '#ff6a20'], mist: ['rgba(255,255,255,.5)'], spore: ['#b6ff7a', '#a24aff'], mote: ['#ffe9a8', '#bfa8ff'] }[k] };
  }
  function show(ST, cb) {
    let done = false; const fin = () => { if (done) return; done = true; try { cb() } catch (e) { console.error(e) } };
    let inf; try { inf = info(ST) } catch (e) { console.error('DV_LOAD.info', e); fin(); return }
    try { build(inf, fin) } catch (e) { console.error('DV_LOAD.show', e); const o = document.getElementById('dvld'); if (o) o.remove(); fin() }
  }
  function build(inf, fin) {
    css(); const old = document.getElementById('dvld'); if (old) old.remove();
    const rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, q = M.max(0, M.min(2, cfg.q() | 0)), LSd = LS(), boss = !!inf.boss;
    const app = document.getElementById('app') || document.body, W0 = app.clientWidth || innerWidth, H0 = app.clientHeight || innerHeight, sc = q === 0 ? .45 : .6, AW = M.max(240, W0 * sc | 0), AH = M.max(320, H0 * sc | 0);
    const ar = art(inf.theme, inf.tod, inf.hue, inf.seed, AW, AH, inf.arena), o = document.createElement('div'); o.id = 'dvld'; if (rm) o.className = 'rm';
    const tm = (/[?&]debug/.test(location.search) ? .25 : rm ? .7 : (boss ? LSd.bossTime : LSd.minTime)) * 1000, power = inf.power, you = inf.you;
    let h = `<div class="ly l1"></div><div class="ly l2"></div><div class="ly l3"></div><canvas class="fx"></canvas><div class="sh"></div><div class="in">`;
    h += `<div class="hd">${inf.tag ? `<span class="tg">${esc(inf.tag.toUpperCase())}</span><br>` : ''}<div class="ti">${esc(inf.title)}</div><div class="nm">${esc(inf.name)}</div><div class="sb">${esc(inf.sub)}${inf.stageNo ? ' · ' + esc(inf.stageNo) : ''}</div></div><div class="sp"></div>`;
    if (boss) {
      h += `<div class="bx"><h4>BOSS</h4><div class="bs"><canvas id="dvb" width="112" height="112"></canvas><div style="flex:1;min-width:0"><div class="bn">${esc(inf.boss.name)}</div>${power ? `<div style="font-size:12px;color:#ffe9b8;margin-bottom:3px">Lực chiến đề xuất: <b style="color:#ffd978">${fmt(power)}</b></div>` : ''}<div style="font-size:11px;color:#ffb8a8;margin-bottom:2px">Kỹ năng đặc biệt:</div><ul class="bk">${inf.boss.skills.map(s => `<li>${esc(s.n)}</li>`).join('')}</ul></div></div></div>`;
    }
    if (inf.enemies.length) h += `<div class="bx"><h4>QUÁI ĐẶC TRƯNG${inf.mini ? ' · TIỂU BOSS: ' + esc(inf.mini.toUpperCase()) : ''}</h4><div class="en">${inf.enemies.map((e, i) => `<div class="${e.nw ? 'nw' : ''}"><canvas data-i="${i}" width="64" height="64"></canvas><small>${esc(e.name)}${e.nw ? ' ✦' : ''}</small></div>`).join('')}</div></div>`;
    if (inf.rewards.length) h += `<div class="bx"><h4>PHẦN THƯỞNG</h4><div class="ch">${inf.rewards.map(r => `<span>${r[0]} ${esc(r[1])}${r[2] ? ' <b>' + esc(r[2]) + '</b>' : ''}</span>`).join('')}</div></div>`;
    h += `<div class="st"><div><small>ĐỘ KHÓ</small><b style="color:#ffb62e">${stars(inf.diff.stars)}</b><br><span>${esc(inf.diff.n)}</span></div>`;
    if (power) { const r = you ? you / power : 0, col = !you ? '#fff' : r >= 1 ? '#7dff9a' : r >= .75 ? '#ffd34a' : '#ff8a6a'; h += `<div><small>LỰC CHIẾN ĐỀ XUẤT</small><b>${fmt(power)}</b>${you ? `<br><span style="color:${col}">Của bạn: ${fmt(you)}</span>` : ''}</div>` }
    h += `</div><div class="bx"><div class="tp" id="dvt"></div></div>`;
    h += `<div class="pg"><div class="pb"><i></i></div><div class="pt"><span id="dvs"></span><span id="dvp">0%</span></div></div><div class="sk">Chạm để vào ngay khi đã sẵn sàng</div></div>`;
    o.innerHTML = h; app.appendChild(o);
    const L = o.querySelectorAll('.ly'); [ar.bg, ar.mid, ar.fg].forEach((cv, i) => L[i].appendChild(cv));
    const bar = o.querySelector('.pb i'), pt = o.querySelector('#dvp'), ps = o.querySelector('#dvs'), tp = o.querySelector('#dvt');
    /* mẹo xoay vòng */
    let ti = 0; const showTip = () => { const t = inf.tips[ti % inf.tips.length]; if (!t) return; tp.style.opacity = 0; setTimeout(() => { tp.innerHTML = `<i>${esc((LSd.tipLabel || {})[t.c] || 'MẸO')}</i><span>${esc(t.t)}</span>`; tp.style.opacity = 1 }, ti ? 220 : 0); ti++ };
    tp.style.transition = rm ? 'none' : 'opacity .3s'; showTip(); const tipT = inf.tips.length > 1 ? setInterval(showTip, 2600) : 0;
    /* chân dung quái / boss */
    const mons = [...o.querySelectorAll('.en canvas')], bc = o.querySelector('#dvb'); let lastP = 0;
    const paint = t => { if (bc) drawMon(bc, inf.boss, inf, t, true); mons.forEach(cv => drawMon(cv, inf.enemies[+cv.dataset.i], inf, t + +cv.dataset.i * .7, false)) };
    paint(0);
    /* hạt thời tiết */
    const fxc = o.querySelector('.fx'), pk = particleKind(inf), N = rm ? 0 : [14, 30, 55][q], P = [];
    fxc.width = AW; fxc.height = AH; const fx = fxc.getContext('2d');
    for (let i = 0; i < N; i++)P.push({ x: R() * AW, y: R() * AH, z: .4 + R() * .9, c: pk.col[i % pk.col.length], p: R() * 6 });
    const drawP = (t, dt) => {
      fx.clearRect(0, 0, AW, AH);
      for (const p of P) {
        const k = pk.k; let vx = 0, vy = 0;
        if (k === 'snow') { vy = 26 * p.z; vx = M.sin(t + p.p) * 12 } else if (k === 'rain') { vy = 260 * p.z; vx = -50 * p.z } else if (k === 'sand') { vx = 130 * p.z; vy = M.sin(t * 2 + p.p) * 6 } else if (k === 'ember') { vy = -34 * p.z; vx = M.sin(t * 1.5 + p.p) * 14 } else if (k === 'ash') { vy = 18 * p.z; vx = 22 * p.z } else if (k === 'leaf') { vy = 30 * p.z; vx = 34 * p.z + M.sin(t * 2 + p.p) * 14 } else if (k === 'mist') { vx = 18 * p.z } else { vy = -10 * p.z; vx = M.sin(t + p.p) * 10 }
        p.x += vx * dt * sc; p.y += vy * dt * sc; if (p.x > AW + 20) p.x = -20; if (p.x < -20) p.x = AW + 20; if (p.y > AH + 20) p.y = -20; if (p.y < -20) p.y = AH + 20;
        fx.fillStyle = fx.strokeStyle = p.c;
        if (k === 'rain') { fx.globalAlpha = .45; fx.lineWidth = 1; fx.beginPath(); fx.moveTo(p.x, p.y); fx.lineTo(p.x + 4, p.y + 14 * p.z); fx.stroke() }
        else if (k === 'mist') { fx.globalAlpha = .1; fx.beginPath(); fx.ellipse(p.x, p.y, 70 * p.z, 22 * p.z, 0, 0, TAU); fx.fill() }
        else if (k === 'leaf') { fx.globalAlpha = .85; fx.save(); fx.translate(p.x, p.y); fx.rotate(t * 2 + p.p); fx.beginPath(); fx.ellipse(0, 0, 5 * p.z, 2.4 * p.z, 0, 0, TAU); fx.fill(); fx.restore() }
        else if (k === 'ember' || k === 'mote' || k === 'spore') { fx.globalAlpha = .5 + .5 * M.sin(t * 3 + p.p); fx.beginPath(); fx.arc(p.x, p.y, 2.2 * p.z, 0, TAU); fx.fill() }
        else { fx.globalAlpha = .8; fx.beginPath(); fx.arc(p.x, p.y, (k === 'snow' ? 2.4 : 1.6) * p.z, 0, TAU); fx.fill() }
      } fx.globalAlpha = 1;
    };
    /* tiến độ: bước thật (artwork → quái → âm thanh) + thời gian tối thiểu để đọc */
    const t0 = performance.now(); let step = 0, finished = false, raf = 0, tLast = t0;
    const steps = inf.steps, ready = { art: true, mon: true, aud: false };
    try { if (window.DV_AUDIO) { DV_AUDIO.play('ui.pick', { force: true, v: .5 }); ready.aud = true } else ready.aud = true } catch (e) { ready.aud = true }
    const end = () => { if (finished) return; finished = true; cancelAnimationFrame(raf); clearInterval(tipT); fin(); o.classList.add('out'); setTimeout(() => o.remove(), 380) };
    o.addEventListener('pointerdown', () => { if (performance.now() - t0 > tm * .55) { bar.style.width = '100%'; pt.textContent = '100%'; end() } });
    (function f(now) {
      if (finished) return; raf = requestAnimationFrame(f); const dt = M.min(.05, (now - tLast) / 1000); tLast = now; const u = M.min(1, (now - t0) / tm), p = u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      const real = (ready.art ? .3 : 0) + (ready.mon ? .3 : 0) + (ready.aud ? .4 : 0), v = M.min(p, real >= 1 ? 1 : .94);
      bar.style.width = (v * 100).toFixed(1) + '%'; pt.textContent = (v * 100 | 0) + '%';
      const si = M.min(steps.length - 1, v * steps.length | 0); if (si !== step || !ps.textContent) { step = si; ps.textContent = steps[si] }
      const t = (now - t0) / 1000; if (!rm) drawP(t, dt); if (!rm && now - lastP > 90) { lastP = now; paint(t) }
      if (u >= 1) end();
    })(t0);
  }

  window.DV_LOAD = { ok: () => true, init: c => { cfg = Object.assign(cfg, c) }, show, info, art, cacheSize: () => cache.size, THEMES: Object.keys(TH) };
})();
