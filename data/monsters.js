/* Dữ liệu Quái / Elite / Mini Boss / Cơ chế Boss / Sự kiện / Bản đồ (Phase 5 — 52 chương).
   Thuần dữ liệu: KHÔNG chứa logic. Logic đọc các bảng này nằm ở index.html (abilities) và data/chapters.js (builder).

   Chỉ số quái ghi theo "đơn vị chương 1" (hp/dmg/sp gốc). Khi vào trận được nhân với scale của Wave
   (DV_DATA.db → stage.waves[].scale). Mọi đòn đặc biệt ghi trong `ab` (danh sách khả năng):
     shoot  {cd,sp,dmg,n,spread,keep}   bắn đạn ngắm vào người chơi, giữ khoảng cách `keep`
     nova   {cd,n,sp,dmg}                bắn vòng đạn toả đều
     spiral {cd,dur,arms,sp,dmg}         xoáy đạn quay trong `dur` giây
     dash   {cd,tel,spd,t}               báo hiệu `tel`s rồi lao thẳng trong `t`s
     slam   {cd,tel,r,dmg}               vòng đỏ báo hiệu `tel`s rồi nổ bán kính r
     summon {cd,id,n,cap}                gọi quái id (tối đa cap con còn sống)
     heal   {cd,rad,pct}                 hồi pct máu tối đa cho quái xung quanh
     boom   {rad}                        tự nổ khi chạm người chơi
   Khả năng của Boss thêm `ph` = pha tối thiểu (1: luôn có · 2: dưới 66% máu · 3: dưới 33% máu).
   Modifier boss: shield {dur,red,cd} (giảm sát thương nhận), enrage {sp,cd} (cuồng nộ khi pha 3). */
window.DV_DATA = window.DV_DATA || {};

/* ===== QUÁI THƯỜNG — intro = chương đầu tiên xuất hiện ===== */
DV_DATA.enemies = {
  grunt:    { n: 'Binh Lính',    hp: 18, sp: 55,  r: 11, dmg: 6,  exp: 1,  c: '#7a3030', intro: 1,  tier: 1 },
  fast:     { n: 'Trinh Sát',    hp: 12, sp: 98,  r: 10, dmg: 5,  exp: 1,  c: '#2d5a7a', intro: 1,  tier: 1 },
  tank:     { n: 'Giáp Nặng',    hp: 60, sp: 38,  r: 15, dmg: 10, exp: 3,  c: '#5a4630', intro: 1,  tier: 2 },
  swarm:    { n: 'Du Binh',      hp: 7,  sp: 105, r: 7,  dmg: 3,  exp: .5, c: '#8a6a3a', intro: 1,  tier: 1 },
  archer:   { n: 'Cung Thủ',     hp: 14, sp: 46,  r: 10, dmg: 7,  exp: 2,  c: '#3a6a4a', intro: 3,  tier: 2,
              ab: [{ k: 'shoot', cd: 2.6, sp: 190, dmg: 7, n: 1, spread: .3, keep: 210 }] },
  lancer:   { n: 'Thương Binh',  hp: 24, sp: 62,  r: 11, dmg: 9,  exp: 2,  c: '#6a4a2a', intro: 5,  tier: 2,
              ab: [{ k: 'dash', cd: 3.4, tel: .5, spd: 330, t: .35 }] },
  bomber:   { n: 'Hoả Công',     hp: 10, sp: 84,  r: 10, dmg: 22, exp: 2,  c: '#c05a1a', intro: 7,  tier: 2,
              ab: [{ k: 'boom', rad: 70 }] },
  armor:    { n: 'Thiết Giáp',   hp: 55, sp: 42,  r: 14, dmg: 12, exp: 4,  c: '#4a5060', intro: 9,  tier: 3, arm: .35 },
  splitter: { n: 'Quái Tách',    hp: 40, sp: 52,  r: 13, dmg: 9,  exp: 3,  c: '#5a3a6a', intro: 12, tier: 3, split: { id: 'fast', n: 2 } },
  shaman:   { n: 'Pháp Sư',      hp: 30, sp: 40,  r: 11, dmg: 6,  exp: 4,  c: '#3a8a8a', intro: 14, tier: 3,
              ab: [{ k: 'heal', cd: 3.5, rad: 150, pct: .1 }] },
  summoner: { n: 'Triệu Hồi Sư', hp: 46, sp: 36,  r: 12, dmg: 8,  exp: 6,  c: '#7a2a6a', intro: 18, tier: 4,
              ab: [{ k: 'summon', cd: 6, id: 'swarm', n: 2, cap: 6 }] },
  assassin: { n: 'Thích Khách',  hp: 22, sp: 90,  r: 10, dmg: 14, exp: 4,  c: '#2a2a3a', intro: 22, tier: 4,
              ab: [{ k: 'dash', cd: 2.4, tel: .35, spd: 420, t: .3 }] },
  colossus: { n: 'Cự Nhân',      hp: 150, sp: 30, r: 20, dmg: 18, exp: 9,  c: '#6a5a4a', intro: 28, tier: 5,
              ab: [{ k: 'slam', cd: 4.5, tel: .8, r: 90, dmg: 16 }] },
  hunter:   { n: 'Liệp Thủ',     hp: 26, sp: 58,  r: 10, dmg: 8,  exp: 5,  c: '#3a5a8a', intro: 36, tier: 5,
              ab: [{ k: 'shoot', cd: 2.2, sp: 230, dmg: 8, n: 3, spread: .45, keep: 260 }] }
};

/* ===== ELITE: hệ số nhân lên quái nền + khả năng thêm. intro = chương đầu tiên xuất hiện ===== */
DV_DATA.elites = {
  brave:   { n: 'Dũng Mãnh', hp: 4,   dmg: 1.3, sp: 1,   r: 1.35, intro: 1 },
  swift:   { n: 'Thần Tốc',  hp: 3,   dmg: 1.2, sp: 1.5, r: 1.2,  intro: 1 },
  ironc:   { n: 'Thiết Giáp',hp: 5,   dmg: 1.2, sp: .9,  r: 1.4,  arm: .4, intro: 6 },
  thunder: { n: 'Lôi Pháp',  hp: 3.5, dmg: 1.2, sp: 1,   r: 1.3,  intro: 10,
             ab: [{ k: 'nova', cd: 4.5, n: 10, sp: 140, dmg: 8 }] },
  fury:    { n: 'Cuồng Nộ',  hp: 4,   dmg: 1.4, sp: 1.1, r: 1.35, enrage: .5, intro: 15 },
  caller:  { n: 'Hiệu Lệnh', hp: 3.5, dmg: 1.2, sp: 1,   r: 1.3,  intro: 20,
             ab: [{ k: 'summon', cd: 7, id: 'swarm', n: 3, cap: 8 }] },
  phantom: { n: 'U Ảnh',     hp: 3,   dmg: 1.6, sp: 1.3, r: 1.2,  intro: 26,
             ab: [{ k: 'dash', cd: 2.8, tel: .4, spd: 400, t: .3 }] },
  warlord: { n: 'Đại Soái',  hp: 6,   dmg: 1.5, sp: 1,   r: 1.5,  arm: .25, intro: 36,
             ab: [{ k: 'nova', cd: 3.5, n: 14, sp: 160, dmg: 10 }, { k: 'summon', cd: 8, id: 'grunt', n: 3, cap: 8 }] }
};

/* ===== MINI BOSS: mỗi chủ đề (theme) có một Mini Boss riêng. mech sinh theo cấp (kit) của chương ===== */
DV_DATA.miniBosses = {
  mb_plain:    { n: 'Hộ Vệ Đá',        hp: 840, sp: 42, r: 26, dmg: 14, c: '#7a7a6a', theme: 'plain' },
  mb_river:    { n: 'Thuỷ Quái Con',   hp: 820, sp: 48, r: 25, dmg: 13, c: '#2d6a8a', theme: 'river' },
  mb_valley:   { n: 'Tướng Phục Binh', hp: 860, sp: 50, r: 25, dmg: 15, c: '#8a5a2a', theme: 'valley' },
  mb_forest:   { n: 'Mãnh Thú Rừng',   hp: 830, sp: 54, r: 26, dmg: 14, c: '#3a6a2a', theme: 'forest' },
  mb_citadel:  { n: 'Cấm Vệ Quân',     hp: 900, sp: 40, r: 26, dmg: 15, c: '#a03030', theme: 'citadel' },
  mb_swamp:    { n: 'Quỷ Đầm Lầy',     hp: 850, sp: 44, r: 26, dmg: 13, c: '#4a6a3a', theme: 'swamp' },
  mb_mountain: { n: 'Sơn Quỷ',         hp: 920, sp: 38, r: 28, dmg: 16, c: '#6a5a7a', theme: 'mountain' },
  mb_cave:     { n: 'Thạch Linh',      hp: 900, sp: 40, r: 27, dmg: 15, c: '#5a4a6a', theme: 'cave' },
  mb_sea:      { n: 'Giao Long Non',   hp: 840, sp: 52, r: 26, dmg: 14, c: '#2a8aa8', theme: 'sea' },
  mb_volcano:  { n: 'Hỏa Quỷ',         hp: 880, sp: 46, r: 26, dmg: 17, c: '#c04a1a', theme: 'volcano' },
  mb_snow:     { n: 'Tuyết Nhân',      hp: 880, sp: 44, r: 27, dmg: 14, c: '#8ab0c8', theme: 'snow' },
  mb_desert:   { n: 'Bọ Cạp Cát',      hp: 850, sp: 56, r: 25, dmg: 15, c: '#c0a050', theme: 'desert' },
  mb_shadow:   { n: 'U Linh Tướng',    hp: 860, sp: 50, r: 25, dmg: 16, c: '#4a2a6a', theme: 'shadow' },
  mb_heaven:   { n: 'Thiên Binh',      hp: 900, sp: 48, r: 26, dmg: 16, c: '#d8c070', theme: 'heaven' },
  mb_void:     { n: 'Hư Ảnh',          hp: 920, sp: 50, r: 26, dmg: 17, c: '#3a1a5a', theme: 'void' }
};

/* ===== BOSS KIT: bộ cơ chế tăng dần theo cấp (tier 1 → 8). Mỗi tier CỘNG THÊM cơ chế vào tier trước.
   Tier của chương = rules.boss.tierOf(chương) trong chapters.js ===== */
DV_DATA.bossKits = [
  /* tier 1 */ [{ k: 'nova', n: 14, cd: 3, sp: 150, dmg: 12, ph: 1 }, { k: 'nova', n: 20, cd: 2, sp: 150, dmg: 12, ph: 2 }],
  /* tier 2 */ [{ k: 'shoot', n: 3, cd: 4, sp: 200, dmg: 11, spread: .5, keep: 0, ph: 1 }],
  /* tier 3 */ [{ k: 'summon', id: 'swarm', n: 4, cd: 9, cap: 10, ph: 2 }],
  /* tier 4 */ [{ k: 'dash', cd: 7, tel: .7, spd: 380, t: .5, ph: 2 }],
  /* tier 5 */ [{ k: 'slam', cd: 6, tel: .9, r: 120, dmg: 20, ph: 2 }],
  /* tier 6 */ [{ k: 'spiral', cd: 9, dur: 3, arms: 3, sp: 170, dmg: 10, ph: 3 }],
  /* tier 7 */ [{ k: 'shield', cd: 14, dur: 3, red: .8, ph: 3 }],
  /* tier 8 */ [{ k: 'enrage', sp: 1.3, cd: .65, ph: 3 }]
];

/* ===== SỰ KIỆN ĐẶC BIỆT trong Wave (specialEvent). intro = chương đầu tiên xuất hiện ===== */
DV_DATA.events = {
  ambush: { n: 'Phục Kích',     d: 'Một vòng quân địch bất ngờ áp sát',            intro: 1 },
  golden: { n: 'Tướng Vàng',    d: 'Kẻ địch chạy trốn mang nhiều vàng — hạ gục để nhận thưởng', intro: 1 },
  heal:   { n: 'Suối Hồi Sinh', d: 'Bình hồi sinh xuất hiện — nhặt để hồi máu',     intro: 2 },
  horde:  { n: 'Quân Ồ Ạt',     d: 'Bầy quái ào tới từ một hướng',                  intro: 3 },
  meteor: { n: 'Mưa Thiên Thạch', d: 'Vòng đỏ báo hiệu — né để khỏi bị đánh trúng',  intro: 6 }
};

/* ===== BẢN ĐỒ / CHỦ ĐỀ: hue nền, màu lá, hồ sơ trọng số quái (profile) ===== */
DV_DATA.maps = {
  plain:    { n: 'Đồng Bằng',   hue: 98,  leaf: '#f4a3b8', ev: ['ambush', 'golden', 'horde'],
              profile: { grunt: 1, fast: .6, tank: .5, swarm: .3, lancer: .5, archer: .5, bomber: .3, armor: .4 } },
  river:    { n: 'Sông Nước',   hue: 205, leaf: '#f4a3b8', ev: ['ambush', 'golden', 'heal'],
              profile: { grunt: .8, swarm: 1, archer: 1, fast: .6, splitter: .8, shaman: .6, summoner: .3 } },
  valley:   { n: 'Thung Lũng',  hue: 150, leaf: '#d9c28a', ev: ['ambush', 'horde', 'meteor'],
              profile: { grunt: .8, fast: 1, lancer: 1, archer: .8, bomber: .6, tank: .5, hunter: .3 } },
  forest:   { n: 'Rừng Sâu',    hue: 122, leaf: '#9fd0a0', ev: ['horde', 'golden', 'heal'],
              profile: { swarm: 1.2, fast: 1, archer: .8, lancer: .6, summoner: .5, grunt: .5, assassin: .4 } },
  citadel:  { n: 'Thành Lũy',   hue: 35,  leaf: '#ff8a3a', ev: ['ambush', 'meteor', 'golden'],
              profile: { tank: 1, armor: 1, archer: .8, shaman: .6, grunt: .6, colossus: .4, hunter: .4 } },
  swamp:    { n: 'Đầm Lầy',     hue: 85,  leaf: '#9fd0a0', ev: ['horde', 'heal', 'ambush'],
              profile: { swarm: 1, splitter: 1, shaman: .8, summoner: .6, bomber: .5, grunt: .5, assassin: .3 } },
  mountain: { n: 'Núi Đá',      hue: 255, leaf: '#d9c28a', ev: ['meteor', 'ambush', 'golden'],
              profile: { tank: 1, armor: 1, lancer: .8, colossus: .6, grunt: .5, hunter: .4, bomber: .4 } },
  cave:     { n: 'Hang Động',   hue: 285, leaf: '#c9a0e0', ev: ['ambush', 'horde', 'meteor'],
              profile: { swarm: 1, assassin: .8, bomber: .8, summoner: .7, tank: .5, splitter: .5, colossus: .3 } },
  sea:      { n: 'Biển Đảo',    hue: 190, leaf: '#9fe0f0', ev: ['golden', 'horde', 'heal'],
              profile: { fast: 1, archer: 1, splitter: .6, shaman: .6, swarm: .7, hunter: .5, summoner: .4 } },
  volcano:  { n: 'Núi Lửa',     hue: 8,   leaf: '#ff4a3a', ev: ['meteor', 'ambush', 'horde'],
              profile: { bomber: 1.2, tank: .8, armor: .7, colossus: .8, hunter: .6, assassin: .4, summoner: .3 } },
  snow:     { n: 'Tuyết Sơn',   hue: 200, leaf: '#e8f4ff', ev: ['ambush', 'heal', 'meteor'],
              profile: { fast: 1, archer: 1, armor: .8, assassin: .6, shaman: .5, colossus: .4, hunter: .5 } },
  desert:   { n: 'Sa Mạc',      hue: 42,  leaf: '#f0d890', ev: ['horde', 'golden', 'meteor'],
              profile: { swarm: 1.1, assassin: .9, lancer: .8, bomber: .8, summoner: .6, colossus: .4, hunter: .4 } },
  shadow:   { n: 'Ma Giới',     hue: 275, leaf: '#ff4a3a', ev: ['ambush', 'horde', 'meteor'],
              profile: { assassin: 1, shaman: .9, summoner: .9, hunter: .8, grunt: .5, colossus: .4, bomber: .4 } },
  heaven:   { n: 'Thiên Giới',  hue: 52,  leaf: '#fff0b0', ev: ['golden', 'meteor', 'heal'],
              profile: { hunter: 1, armor: .9, shaman: .9, colossus: .8, assassin: .7, summoner: .5 } },
  void:     { n: 'Hư Không',    hue: 310, leaf: '#e0a0ff', ev: ['meteor', 'ambush', 'horde'],
              profile: { assassin: .8, hunter: .8, summoner: .8, colossus: .7, shaman: .7, armor: .6, bomber: .6, splitter: .5 } }
};
