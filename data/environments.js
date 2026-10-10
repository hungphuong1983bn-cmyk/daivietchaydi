/* Phase 6 — Map & Môi trường (thuần dữ liệu, KHÔNG chứa logic).
   Engine: js/environment.js (window.DV_ENV). Thiếu file này hoặc engine → game tự dùng nền cũ.

   Cấu trúc:
     DV_DATA.envRules   hằng số cân bằng môi trường (sát thương hazard, độ chậm vùng đất, bán kính đấu trường…)
     DV_DATA.envThemes  15 chủ đề: nền · chướng ngại · vùng địa hình · thời tiết · ánh sáng · đấu trường Boss
     DV_DATA.envAreas   52 khu vực (theo thứ tự chương): mỗi khu có buổi trong ngày, thời tiết, địa hình, hazard, đấu trường riêng

   Mã rút gọn của envAreas (mỗi dòng): [tod, thờiTiết, cườngĐộ 0-3, vùngĐất[], hazard, chướngNgại[]|null, hueDịch, tênĐấuTrường, mô tả]
     phần tử thứ 10 (tuỳ chọn) = id khu dựng tay trong DV_TOWN (js/town16.js), ví dụ 'cotran': bản đồ dựng tay có sông/cầu gỗ/thác/cổ trấn; bỏ phần tử này là về nền sinh ngẫu nhiên
     tod:     dawn · day · dusk · night
     weather: none petals rain storm snow blizzard sand ash ember fog spore motes spray
     zone:    mud water ice lava poison sand holy rift
     hazard:  null | bolt (sét) · rock (đá rơi) · icicle (băng rơi) · geyser (phun dung nham) · meteor (thiên thạch)
              · beam (thiên quang) · rift (nứt hư không) · gust (gió giật) · spore (độc khí) · wave (sóng thần) · bone (cốt thương) · soul (hồn lửa) */
window.DV_DATA = window.DV_DATA || {};

DV_DATA.envRules = {
  arena:   { r: 430, openT: 1.1, pad: 14, closeT: 1.6 },     // đấu trường Boss: bán kính, thời gian phong ấn, biên an toàn
  zone: {                                                    // hiệu ứng vùng địa hình
    mud:    { spd: .62 }, water: { spd: .8 }, sand: { spd: .6 }, rift: { spd: .72 },
    ice:    { fr: 3.2 },                                     // ma sát khi trượt băng (thấp = trơn)
    lava:   { dmg: .028, tick: .8 },                         // % máu tối đa mỗi nhịp
    poison: { dmg: .014, tick: .8, spd: .85 },
    holy:   { heal: .012, tick: 1 },
    foeSlow: .6,                                             // quái chịu 60% độ chậm của người chơi
    clearR: 300,                                             // không có vùng đất trong bán kính này quanh điểm xuất phát
    cell: 512                                                // kích thước ô sinh vùng đất (px)
  },
  hazard: {                                                  // mọi hazard đều có báo hiệu trước; không gây chết người (chừa ≥1 máu)
    firstAt: 9,                                              // giây đầu ván không có hazard
    dmgPct: .05,                                             // % máu tối đa của người chơi
    bossMul: 0,                                              // trong đấu trường Boss: 0 = tắt hazard thường
    perLevel: 0
  },
  weather: { count: [0, 46, 96] },                           // số hạt cơ bản theo đồ hoạ Thấp/Vừa/Cao (nhân cường độ)
  tod: {                                                     // ánh sáng theo buổi: tint (r,g,b,a) · dark (độ tối 0-1) · ambient (r,g,b) · lightR (bán kính đèn người chơi)
    dawn:  { tint: [255, 170, 150, .10], dark: .00, amb: [60, 40, 70],  lightR: 0 },
    day:   { tint: [255, 250, 230, .00], dark: .00, amb: [0, 0, 0],     lightR: 0 },
    dusk:  { tint: [255, 120, 70, .14],  dark: .16, amb: [50, 25, 55],  lightR: 330 },
    night: { tint: [40, 70, 150, .10],   dark: .50, amb: [8, 14, 48],   lightR: 250 }
  }
};

/* ===== 15 CHỦ ĐỀ =====
   ground: {s,l} độ bão hoà/sáng nền (hue lấy từ hue của chương) · deco kiểu hạt chi tiết · hv/lv biên độ khác biệt giữa các ô
   ob: {mod, kinds:[[loại,trọng số]], c:[màu chính, màu phụ, màu nhấn]}  — chướng ngại có va chạm
   zones: {loại: mật độ 0-1}                 — vùng địa hình (bùn/nước/băng/dung nham…)
   dark: độ tối nền cộng thêm (hang động, hư không) · rays: tia sáng · par: lớp phủ cuộn xa (cloud/mist/canopy/glow/stars)
   arena: {floor:[nền1,nền2], rune, wall, deco, glyph} */
DV_DATA.envThemes = {
  plain:   { ground: { s: 36, l: 27, deco: 'grass', hv: 16, lv: 4, flower: ['#f4a3b8', '#ffe27a', '#fff'] },
             ob: { mod: 24, kinds: [['rock', 3], ['bush', 3], ['oak', 2]], c: ['#6d6a62', '#3f7a3a', '#8a5a34'] },
             zones: { mud: .25 }, par: 'cloud', vig: [10, 20, 8],
             arena: { floor: ['#4a4036', '#2c261f'], rune: '#ffd978', wall: '#ffcf70', deco: 'banner', glyph: 'star' } },
  river:   { ground: { s: 40, l: 25, deco: 'water', hv: 12, lv: 5 },
             ob: { mod: 26, kinds: [['rock', 3], ['reed', 3], ['willow', 1]], c: ['#5d6a70', '#4c8a5a', '#7a8a4a'] },
             zones: { water: .55, mud: .12 }, par: 'mist', vig: [4, 14, 28],
             arena: { floor: ['#2c4a5a', '#16303c'], rune: '#7fe0ff', wall: '#5fd0ff', deco: 'pillar', glyph: 'wave' } },
  valley:  { ground: { s: 34, l: 25, deco: 'dust', hv: 18, lv: 4 },
             ob: { mod: 22, kinds: [['rock', 3], ['pine', 2], ['boulder', 2]], c: ['#7a6e5a', '#2f6a44', '#9a8a6a'] },
             zones: { mud: .2 }, par: 'cloud', vig: [18, 14, 6],
             arena: { floor: ['#5a4a38', '#352b20'], rune: '#ffb35a', wall: '#ff9a3a', deco: 'brazier', glyph: 'star' } },
  forest:  { ground: { s: 38, l: 20, deco: 'leaf', hv: 14, lv: 4 },
             ob: { mod: 15, kinds: [['oak', 4], ['pine', 3], ['bush', 2], ['rock', 1]], c: ['#5d6a58', '#2f6e3a', '#6a4528'] },
             zones: { mud: .3 }, rays: 1, par: 'canopy', vig: [2, 14, 6],
             arena: { floor: ['#33442c', '#1a2615'], rune: '#a8ff8a', wall: '#7dff7a', deco: 'totem', glyph: 'lotus' } },
  citadel: { ground: { s: 18, l: 29, deco: 'stone', hv: 10, lv: 4 },
             ob: { mod: 21, kinds: [['pillar', 3], ['ruin', 3], ['rock', 1], ['bush', 1]], c: ['#8a8070', '#5a5448', '#c0a060'] },
             zones: {}, par: 'cloud', vig: [20, 12, 6],
             arena: { floor: ['#5a5a60', '#2e2e34'], rune: '#ffd24a', wall: '#ffc03a', deco: 'brazier', glyph: 'square' } },
  swamp:   { ground: { s: 30, l: 18, deco: 'mud', hv: 14, lv: 4 },
             ob: { mod: 20, kinds: [['mangrove', 4], ['reed', 3], ['deadtree', 1], ['rock', 1]], c: ['#4a5040', '#3a5a2a', '#4a3a28'] },
             zones: { mud: .45, poison: .22, water: .25 }, par: 'mist', vig: [6, 14, 4],
             arena: { floor: ['#2e3a22', '#161d10'], rune: '#b6ff5a', wall: '#9aff40', deco: 'totem', glyph: 'skull' } },
  mountain:{ ground: { s: 14, l: 28, deco: 'rock', hv: 8, lv: 5 },
             ob: { mod: 17, kinds: [['boulder', 4], ['rock', 3], ['pine', 1], ['spire', 2]], c: ['#807a76', '#5a5654', '#a8a29a'] },
             zones: { ice: .08 }, par: 'cloud', vig: [10, 10, 18],
             arena: { floor: ['#5a5654', '#2c2a2a'], rune: '#e8d8b0', wall: '#d8c8a0', deco: 'spire', glyph: 'square' } },
  cave:    { ground: { s: 24, l: 14, deco: 'crystal', hv: 14, lv: 3 },
             ob: { mod: 16, kinds: [['stalag', 4], ['crystal', 3], ['boulder', 1]], c: ['#4a4658', '#8a5ad0', '#c9a0e0'] },
             zones: { water: .15, poison: .08 }, dark: .22, par: 'mist', vig: [16, 4, 26],
             arena: { floor: ['#3a2f4a', '#1a1424'], rune: '#d09aff', wall: '#c07aff', deco: 'crystal', glyph: 'star' } },
  sea:     { ground: { s: 44, l: 33, deco: 'foam', hv: 10, lv: 5 },
             ob: { mod: 25, kinds: [['coral', 3], ['palm', 2], ['rock', 2]], c: ['#6a7078', '#2f8a5a', '#e07a6a'] },
             zones: { water: .5, sand: .1 }, par: 'cloud', vig: [0, 14, 30],
             arena: { floor: ['#2a5a6e', '#143444'], rune: '#8af0ff', wall: '#6addff', deco: 'coral', glyph: 'wave' } },
  volcano: { ground: { s: 24, l: 14, deco: 'lava', hv: 8, lv: 3 },
             ob: { mod: 18, kinds: [['lavarock', 4], ['spire', 2], ['boulder', 2]], c: ['#3a2c2a', '#ff5a1a', '#6a4a40'] },
             zones: { lava: .32 }, par: 'glow', vig: [30, 6, 2],
             arena: { floor: ['#3e2420', '#1a0c0a'], rune: '#ff7a2a', wall: '#ff5a1a', deco: 'brazier', glyph: 'star' } },
  snow:    { ground: { s: 20, l: 62, deco: 'snow', hv: 8, lv: 4 },
             ob: { mod: 20, kinds: [['icecrys', 3], ['pine', 3], ['boulder', 1]], c: ['#9ab0c0', '#d8eaf6', '#6a8aa0'] },
             zones: { ice: .42 }, par: 'cloud', vig: [10, 18, 34],
             arena: { floor: ['#9ab8d0', '#5a7890'], rune: '#e8faff', wall: '#c8f0ff', deco: 'icepillar', glyph: 'snow' } },
  desert:  { ground: { s: 52, l: 52, deco: 'dune', hv: 10, lv: 4 },
             ob: { mod: 27, kinds: [['cactus', 3], ['rock', 2], ['bones', 1], ['palm', 1]], c: ['#a08868', '#4a8a4a', '#e8dcc0'] },
             zones: { sand: .35 }, par: 'cloud', vig: [26, 16, 4],
             arena: { floor: ['#b89a64', '#7a6038'], rune: '#fff0b0', wall: '#ffd870', deco: 'pillar', glyph: 'sun' } },
  shadow:  { ground: { s: 22, l: 15, deco: 'shadow', hv: 12, lv: 3 },
             ob: { mod: 19, kinds: [['tomb', 3], ['deadtree', 3], ['bones', 1], ['spire', 1]], c: ['#4a4254', '#2a2434', '#a05ad0'] },
             zones: { rift: .12, poison: .1 }, dark: .18, par: 'mist', vig: [20, 4, 20],
             arena: { floor: ['#34283e', '#150f1c'], rune: '#ff5a7a', wall: '#ff3a5a', deco: 'totem', glyph: 'skull' } },
  heaven:  { ground: { s: 40, l: 76, deco: 'cloud', hv: 10, lv: 4 },
             ob: { mod: 26, kinds: [['pillar', 3], ['cloudcol', 2], ['ruin', 1]], c: ['#e8e0cc', '#fff4cc', '#ffd870'] },
             zones: { holy: .16 }, rays: 1, par: 'cloud', vig: [30, 26, 10],
             arena: { floor: ['#e8dcb8', '#b8a470'], rune: '#fff2a0', wall: '#fff0b0', deco: 'pillar', glyph: 'sun' } },
  void:    { ground: { s: 30, l: 10, deco: 'void', hv: 16, lv: 3 },
             ob: { mod: 18, kinds: [['voidrock', 4], ['crystal', 2], ['spire', 1]], c: ['#2e2440', '#8a4ad0', '#e0a0ff'] },
             zones: { rift: .25 }, dark: .26, par: 'stars', vig: [18, 2, 30],
             arena: { floor: ['#2a1a44', '#0a0414'], rune: '#e8a0ff', wall: '#c870ff', deco: 'crystal', glyph: 'star' } }
};

/* ===== 52 KHU VỰC (thứ tự = chương 1…52) =====
   [tod, weather, cường độ, vùngĐất[], hazard, chướngNgại|null, hueDịch, tênĐấuTrường, mô tả] */
DV_DATA.envAreas = [
  /* 1  Hoa Lư       */ ['dawn',  'petals', 1, ['mud'],            null,     null,                          0,  'Đài Cố Đô',          'Đồng cỏ hoa lúc bình minh'],
  /* 2  Bạch Đằng    */ ['dusk',  'spray',  1, ['water'],          'wave',   null,                          0,  'Bến Cọc Ngầm',       'Cửa sông chiều tà, sóng vỗ'],
  /* 3  Vạn Kiếp     */ ['dusk',  'ember',  1, ['mud'],            'meteor', null,                          0,  'Sân Hoả Đài',        'Thung lũng lửa cháy'],
  /* 4  Lam Sơn      */ ['day',   'petals', 1, ['mud'],            null,     ['oak', 'pine', 'bush'],       0,  'Gốc Đa Nghìn Năm',   'Rừng già, nắng xuyên tán'],
  /* 5  Đại La       */ ['day',   'none',   0, [],                 'beam',   null,                          0,  'Điện Đại La',        'Thành lũy gạch cổ'],
  /* 6  Tây Đô       */ ['night', 'fog',    2, ['rift'],           'soul',   null,                          0,  'Ma Đàn Tây Đô',      'Ma giới đêm sương'],
  /* 7  Như Nguyệt   */ ['night', 'rain',   2, ['water'],          'bolt',   ['rock', 'reed'],              12, 'Bến Đêm Như Nguyệt', 'Đêm mưa bên sông'],
  /* 8  Chi Lăng     */ ['dawn',  'fog',    2, ['mud'],            'rock',   ['pine', 'boulder', 'rock'],   8,  'Ải Phục Binh',       'Sương sớm thung lũng hẹp'],
  /* 9  Nam Quan     */ ['day',   'none',   0, ['ice'],            'rock',   null,                          0,  'Cổng Ải Nam Quan',   'Ải núi đá cheo leo'],
  /* 10 Đồng Đăng    */ ['dusk',  'sand',   1, ['mud'],            'gust',   null,                          14, 'Bãi Chiến Đồng Đăng','Đồng khô gió chiều'],
  /* 11 Tây Kết      */ ['night', 'spore',  2, ['mud', 'poison'],  'spore',  null,                          0,  'Đầm Sương Tây Kết',  'Đầm lầy đêm đom đóm'],
  /* 12 Đông Bộ Đầu  */ ['day',   'rain',   1, ['water', 'mud'],   null,     ['willow', 'reed', 'rock'],    10, 'Bến Đông Bộ',        'Bến sông mưa phùn'],
  /* 13 Hàm Tử       */ ['dawn',  'spray',  1, ['water', 'sand'],  'wave',   null,                          0,  'Đảo Hàm Tử',         'Bãi biển rạng đông'],
  /* 14 Chương Dương */ ['day',   'sand',   1, [],                 'gust',   ['rock', 'bush'],              20, 'Bãi Cát Chương Dương','Bãi sông nắng gắt'],
  /* 15 Thượng Đạo   */ ['dusk',  'petals', 1, ['mud'],            null,     ['pine', 'oak', 'oak'],        8,  'Cổng Thượng Đạo',    'Đường rừng hoàng hôn'],
  /* 16 Ngọc Hồi     */ ['dawn',  'ash',    2, [],                 'meteor', ['ruin', 'pillar', 'rock'],    8,  'Luỹ Ngọc Hồi',       'Thành khói pháo mịt mù'],
  /* 17 Rạch Gầm     */ ['dusk',  'rain',   2, ['water', 'mud'],   'bolt',   ['mangrove', 'reed'],          14, 'Rạch Gầm Xoài Mút',  'Rạch nước chiều giông'],
  /* 18 Phú Xuân     */ ['night', 'petals', 1, [],                 'beam',   null,                          12, 'Điện Kinh Thành',    'Cung cấm đêm đèn lồng'],
  /* 19 Truông Mây   */ ['dusk',  'fog',    2, ['ice'],            'rock',   ['spire', 'boulder', 'pine'],  10, 'Đỉnh Truông Mây',     'Đèo mây phủ'],
  /* 20 Hải Vân      */ ['dawn',  'storm',  2, ['water'],          'bolt',   ['rock', 'coral'],             14, 'Quan Hải Vân',       'Đèo ven biển bão tố'],
  /* 21 Thăng Long   */ ['day',   'petals', 1, [],                 'beam',   ['pillar', 'ruin', 'bush'],    16, 'Điện Kính Thiên',    'Hoàng thành rồng bay'],
  /* 22 Hồ Gươm      */ ['night', 'fog',    1, ['water'],          'wave',   ['willow', 'reed', 'rock'],    18, 'Tháp Rùa',           'Hồ đêm sương huyền ảo'],
  /* 23 Tản Viên     */ ['dawn',  'fog',    1, ['ice'],            'icicle', ['spire', 'pine', 'boulder'],  14, 'Đỉnh Tản Viên',      'Núi thiêng biển mây'],
  /* 24 Phong Châu   */ ['day',   'petals', 1, ['mud'],            null,     ['oak', 'bush', 'rock'],       18, 'Đền Hùng',           'Đất Tổ cây cổ thụ', 'cotran'],   // Phase 16: khu mẫu Cổ Trấn · Cầu Gỗ · Thác Nước (js/town16.js)
  /* 25 Cổ Loa       */ ['dusk',  'ash',    1, [],                 'meteor', ['ruin', 'pillar', 'rock'],    18, 'Vòng Ốc Cổ Loa',     'Thành ốc hoàng hôn'],
  /* 26 Mê Linh      */ ['dusk',  'sand',   2, ['mud'],            'gust',   null,                          24, 'Đài Hai Bà',         'Cánh đồng cuồng phong'],
  /* 27 Hát Môn      */ ['dusk',  'storm',  2, ['water'],          'bolt',   null,                          22, 'Ngã Ba Hát Môn',     'Cửa sông bão chiều'],
  /* 28 Lũng Nhai    */ ['night', 'motes',  1, ['water', 'poison'],'rock',   null,                          0,  'Hang Lũng Nhai',     'Hang sâu đá phát sáng'],
  /* 29 Sóc Sơn      */ ['dawn',  'blizzard',1,['ice'],            'icicle', null,                          16, 'Đỉnh Sóc Sơn',       'Núi cao gió lạnh'],
  /* 30 Dạ Trạch     */ ['night', 'spore',  2, ['mud', 'poison'],  'spore',  ['mangrove', 'deadtree'],      12, 'Đầm Dạ Trạch',       'Đầm đêm khí độc'],
  /* 31 Thần Phù     */ ['night', 'motes',  2, ['water'],          'rock',   ['crystal', 'stalag'],         12, 'Điện Thạch Nhũ',     'Hang tinh thể huyền bí'],
  /* 32 Đồi Ma       */ ['night', 'fog',    2, ['rift', 'poison'], 'soul',   null,                          14, 'Gò Đồi Ma',          'Đồi mộ hoang âm u'],
  /* 33 Rừng Đước    */ ['dusk',  'spore',  1, ['mud', 'water'],   null,     ['mangrove', 'reed'],          14, 'Cửa Rừng Đước',      'Rừng ngập mặn chiều muộn'],
  /* 34 Hoàng Liên   */ ['day',   'snow',   2, ['ice'],            'icicle', null,                          0,  'Đỉnh Hoàng Liên',    'Tuyết sơn nắng lạnh'],
  /* 35 Mũi Né       */ ['day',   'sand',   2, ['sand'],           'gust',   null,                          0,  'Cồn Cát Mũi Né',     'Sa mạc cát bay'],
  /* 36 Hỏa Diệm     */ ['dusk',  'ember',  2, ['lava'],           'geyser', null,                          0,  'Hố Hỏa Diệm',        'Núi lửa dung nham'],
  /* 37 Vực Sâu      */ ['night', 'rain',   2, ['water'],          'wave',   ['coral', 'rock'],             18, 'Vực Biển Đông',      'Biển đêm vực thẳm'],
  /* 38 Đảo Quỷ      */ ['dusk',  'storm',  2, ['sand', 'water'],  'bolt',   ['palm', 'rock', 'bones'],     22, 'Đảo Hải Tặc',        'Đảo hoang bão đỏ'],
  /* 39 Thành Ma     */ ['night', 'ash',    2, ['rift'],           'soul',   ['tomb', 'spire'],             16, 'Điện Hắc Thành',     'Thành đen tro bay'],
  /* 40 Mê Cung      */ ['night', 'none',   0, ['poison'],         'bone',   ['bones', 'stalag', 'tomb'],   16, 'Hầm Vạn Cốt',        'Mê cung xương trắng'],
  /* 41 Trường Sơn   */ ['dawn',  'rain',   2, ['mud', 'water'],   'bolt',   ['oak', 'pine'],               12, 'Đèo Trường Sơn',     'Đại ngàn mưa sớm'],
  /* 42 Tây Nguyên   */ ['dusk',  'sand',   1, ['mud'],            'gust',   ['rock', 'bush'],              28, 'Cao Nguyên Bazan',   'Cao nguyên đất đỏ'],
  /* 43 Phù Nam      */ ['day',   'sand',   1, ['sand'],           'gust',   ['pillar', 'cactus', 'ruin'],  8,  'Đô Thành Phù Nam',   'Cố đô trong cát'],
  /* 44 Chiêm Thành  */ ['dusk',  'ash',    1, ['sand'],           'beam',   ['pillar', 'ruin', 'cactus'],  14, 'Tháp Chàm',          'Tháp gạch đỏ hoàng hôn'],
  /* 45 Ma Đô        */ ['night', 'ember',  2, ['rift', 'lava'],   'geyser', ['spire', 'tomb'],             20, 'Ngai Ma Hoàng',      'Kinh đô ma giới rực lửa'],
  /* 46 Âm Phủ       */ ['night', 'motes',  2, ['rift'],           'rift',   null,                          0,  'Điện Diêm La',       'Cửa âm phủ u minh'],
  /* 47 Vân Hải      */ ['day',   'motes',  1, ['holy'],           'beam',   null,                          0,  'Đài Vân Hải',        'Biển mây vàng nắng'],
  /* 48 Thiên Môn    */ ['dawn',  'motes',  2, ['holy'],           'beam',   ['pillar', 'cloudcol'],        8,  'Cổng Thiên Môn',     'Cổng trời ngập sáng'],
  /* 49 Lôi Giới     */ ['dusk',  'storm',  3, ['lava'],           'bolt',   null,                          18, 'Lôi Đài',            'Lôi giới sấm sét liên hồi'],
  /* 50 Hư Không     */ ['night', 'motes',  3, ['rift'],           'rift',   ['voidrock', 'crystal'],       14, 'Tâm Hư Không',       'Vực hư không vô tận'],
  /* 51 Long Cung    */ ['night', 'spray',  2, ['water'],          'wave',   ['coral', 'rock'],             26, 'Điện Long Cung',     'Cung rồng đáy biển'],
  /* 52 Bình Minh    */ ['dawn',  'motes',  3, ['holy'],           'beam',   ['pillar', 'cloudcol', 'ruin'],10, 'Đỉnh Bình Minh',     'Bình minh Đại Việt rực rỡ']
];

/* Kiểm tra dữ liệu môi trường (gọi: DV_DATA.envValidate() → mảng lỗi, rỗng = hợp lệ) */
DV_DATA.envValidate = function () {
  const err = [], D = DV_DATA, T = D.envThemes, A = D.envAreas;
  const TOD = Object.keys(D.envRules.tod), WE = 'none petals rain storm snow blizzard sand ash ember fog spore motes spray'.split(' ');
  const ZN = 'mud water ice lava poison sand holy rift'.split(' '), HZ = 'bolt rock icicle geyser meteor beam rift gust spore wave bone soul'.split(' ');
  const OB = 'rock boulder bush oak pine willow reed mangrove deadtree palm cactus pillar ruin crystal stalag coral lavarock bones tomb spire icecrys cloudcol voidrock'.split(' ');
  if (A.length !== 52) err.push('envAreas phải đủ 52 khu vực (đang ' + A.length + ')');
  for (const k in T) {
    const t = T[k];
    if (D.maps && !D.maps[k]) err.push('theme ' + k + ' không có trong DV_DATA.maps');
    for (const o of t.ob.kinds) if (!OB.includes(o[0])) err.push(k + ': chướng ngại lạ ' + o[0]);
    for (const z in t.zones) if (!ZN.includes(z)) err.push(k + ': vùng đất lạ ' + z);
    if (!t.arena || !t.arena.floor) err.push(k + ': thiếu arena');
  }
  if (D.db) D.db.chapters.forEach((c, i) => { const a = A[i]; if (!a) return err.push('thiếu khu vực ' + (i + 1)); if (!T[c.theme]) err.push('chương ' + (i + 1) + ': theme lạ ' + c.theme); });
  A.forEach((a, i) => {
    const n = 'khu ' + (i + 1);
    if (!TOD.includes(a[0])) err.push(n + ': tod lạ ' + a[0]);
    if (!WE.includes(a[1])) err.push(n + ': thời tiết lạ ' + a[1]);
    if (a[2] < 0 || a[2] > 3) err.push(n + ': cường độ ngoài 0-3');
    for (const z of a[3]) if (!ZN.includes(z)) err.push(n + ': vùng đất lạ ' + z);
    if (a[4] && !HZ.includes(a[4])) err.push(n + ': hazard lạ ' + a[4]);
    if (a[5]) for (const o of a[5]) if (!OB.includes(o)) err.push(n + ': chướng ngại lạ ' + o);
    if (!a[7] || !a[8]) err.push(n + ': thiếu tên đấu trường / mô tả');
    if (a[9] && window.DV_TOWN && !DV_TOWN.ids().includes(a[9])) err.push(n + ': khu dựng tay lạ ' + a[9]);
  });
  return err;
};
