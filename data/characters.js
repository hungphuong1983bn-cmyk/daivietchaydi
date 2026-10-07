/* Phase 7 — CHARACTER DATABASE (data-driven)
   Bảng tương ứng: HEROES trong index.html (cùng `id`). Dữ liệu ở đây BỔ SUNG, không thay thế:
   thiếu file / thiếu id → game dùng nhân vật cũ như trước.

   Cấu trúc một nhân vật:
   id, name, title, class, role, rarity
   stats     : hp, attack, defense, speed, crit, range, attackSpeed   (giá trị gốc, Lv.1, 0★)
   weapon    : {name, kind, d}            kind ∈ sword|glaive|spear|bow|banner|shield|twin
   passive   : {name, d}
   skills[3] : {name, d, link}            link = khoá võ công trong DV_DATA.skills (nếu có)
   ultimate  : {name, d}
   design    : nhận diện hình ảnh (xem DV_CHAR.PARTS — mỗi giá trị là một id bộ phận)
   awakening[]: mỗi bậc {name, d, req, cost, mul, visual}   → visual = patch đè lên design (ĐỔI HÌNH DÁNG)
   ascension[]: mỗi bậc {name, d, req, cost, add, visual}   → visual + VFX (NÂNG CẤP HIỆU ỨNG)
   max       : {name, d, visual}          trạng thái đặc biệt khi đủ Thức Tỉnh + Thăng Giai + trần cấp
   anim      : tuỳ chỉnh nhịp/biên độ từng trạng thái (idle,move,attack,skill,ultimate,hit,defeat,victory) */
window.DV_DATA = window.DV_DATA || {};

DV_DATA.charRules = {
  /* chỉ số nền của người chơi trong game hiện tại (đã đo từ newGame/bon) */
  base: { hp: 100, attack: 100, defense: 0, speed: 130, crit: 0, range: 420, attackSpeed: 1 },
  levelGrowth: 0.05,          // +5%/cấp (giữ đúng công thức cũ)
  starGrowth: 0.10,           // +10%/★ (giữ đúng công thức cũ)
  /* Thức Tỉnh: đổi diện mạo. req.level = cấp tướng tối thiểu; cost = {hon, gold} */
  awakeningStages: 3,
  /* Thăng Giai: nâng cấp hình + VFX. req.awakening = bậc Thức Tỉnh tối thiểu */
  ascensionStages: 5,
  /* quy đổi sang chiến đấu: số nhân cộng thêm trên chỉ số gốc. defense → giảm sát thương: d/(d+defK) */
  defK: 400,
  rarityColor: { C: '#8aa0a8', B: '#35c46a', A: '#3a8dff', S: '#a64bff', SS: '#ff9a2e', SSR: '#ff4a6a' },
  /* thời lượng (giây) của các trạng thái không lặp */
  anim: {
    idle:     { loop: 1, dur: 2.4 },
    move:     { loop: 1, dur: 0.5 },
    attack:   { loop: 0, dur: 0.32 },
    skill:    { loop: 0, dur: 0.5 },
    ultimate: { loop: 0, dur: 0.9 },
    hit:      { loop: 0, dur: 0.28 },
    defeat:   { loop: 0, dur: 0.9 },
    victory:  { loop: 1, dur: 1.2 }
  },
  /* bảng chi phí/điều kiện mặc định cho bậc 1..n (nhân vật có thể đè bằng req/cost riêng) */
  awakeningTable: [
    { req: { level: 15 }, cost: { hon: 30,  gold: 3000 },  mul: 0.06 },
    { req: { level: 30 }, cost: { hon: 80,  gold: 12000 }, mul: 0.08 },
    { req: { level: 45 }, cost: { hon: 180, gold: 40000 }, mul: 0.12 }
  ],
  ascensionTable: [
    { req: { awakening: 0 }, cost: { hon: 10,  mt: 40 },   add: { crit: 0.01, speed: 0.01 } },
    { req: { awakening: 1 }, cost: { hon: 25,  mt: 100 },  add: { crit: 0.01, defense: 8 } },
    { req: { awakening: 2 }, cost: { hon: 50,  mt: 220 },  add: { crit: 0.02, attackSpeed: 0.04 } },
    { req: { awakening: 3 }, cost: { hon: 90,  mt: 450 },  add: { speed: 0.02, defense: 12, range: 20 } },
    { req: { awakening: 3 }, cost: { hon: 150, mt: 800 },  add: { crit: 0.03, attackSpeed: 0.06, range: 30 } }
  ],
  /* trạng thái MAX cần: cấp = trần cấp của ★ hiện tại, Thức Tỉnh đủ, Thăng Giai đủ */
  maxBonus: { hp: 0.05, attack: 0.05 }
};

/* Thư viện bộ phận hình ảnh dùng trong `design` / `visual` — vẽ ở js/character.js.
   Liệt kê để validate; thêm id mới ở đây VÀ thêm hàm vẽ tương ứng. */
DV_DATA.charParts = {
  body:    ['armor', 'robe', 'light', 'heavy'],
  head:    ['topknot', 'crest', 'headband', 'wing', 'round', 'hood', 'tiered'],
  shoulder:['none', 'pauldron', 'spike', 'sash'],
  back:    ['none', 'cape', 'scarf', 'quiver', 'banner', 'twin', 'sunburst'],
  weapon:  ['sword', 'glaive', 'spear', 'bow', 'banner', 'shield', 'twin'],
  aura:    ['none', 'wind', 'dragon', 'tide', 'thunder', 'leaf', 'guard', 'sun'],
  trail:   ['slash', 'sweep', 'thrust', 'arrow', 'arc', 'bash', 'cross'],
  extra:   ['halo', 'wings', 'blades', 'flames', 'runes', 'coil', 'pennants', 'crown', 'embers']
};

DV_DATA.characters = [

/* ───────────── 1. ĐINH BỘ LĨNH — Hoàng Kiếm ───────────── */
{
  id: 'dbl', name: 'Đinh Bộ Lĩnh', title: 'Vạn Thắng Vương', class: 'Kiếm Khách', role: 'Cân bằng', rarity: 'A',
  stats: { hp: 100, attack: 105, defense: 6, speed: 130, crit: 0, range: 420, attackSpeed: 1 },
  weapon: { name: 'Vạn Thắng Kiếm', kind: 'sword', d: 'Trường kiếm thẳng, đánh chém nhanh, tầm vừa.' },
  passive: { name: 'Bá Vương', d: '+5% công. Mỗi 20 địch hạ gục, nhát chém kế tiếp gây thêm 30%.' },
  skills: [
    { name: 'Kiếm Khí', d: 'Phóng kiếm khí xuyên địch gần nhất.', link: 'kiem' },
    { name: 'Chém Đoạn Hậu', d: 'Chém vòng cung phía sau, đẩy lùi địch bám sát.', link: null },
    { name: 'Hiệu Lệnh', d: 'Tăng 10% tốc đánh trong 4 giây.', link: null }
  ],
  ultimate: { name: 'Thập Nhị Sứ Quân Quy Hàng', d: 'Mười hai luồng kiếm quang bùng nổ quanh thân.' },
  design: {
    silhouette: 'Cân đối chữ T — vai rộng, áo giáp vảy, mũ miện nhỏ',
    body: 'armor', head: 'topknot', shoulder: 'pauldron', back: 'cape', weapon: 'sword',
    height: 1, width: 1,
    palette: { main: '#2f5aa8', sub: '#1d3a73', accent: '#e8b84a', skin: '#e6c29c', metal: '#dfe8ff' },
    aura: { kind: 'wind', color: '#6aa8ff', n: 0 },
    trail: 'slash', glow: 0, extra: []
  },
  awakening: [
    { name: 'Long Bào Khai Mở', d: 'Khoác áo choàng hoàng bào, mũ miện thêm lọng.', visual: { back: 'cape', palette: { sub: '#3a2a73', accent: '#ffd34a' }, extra: ['pennants'] } },
    { name: 'Giáp Vân Long', d: 'Giáp vai chạm rồng, kiếm toả sáng xanh.', visual: { shoulder: 'spike', glow: 0.45, palette: { main: '#3a6cc4' } } },
    { name: 'Vạn Thắng Hiển Hoá', d: 'Hoàng bào rực vàng, vầng sáng sau đầu.', visual: { glow: 0.8, extra: ['pennants', 'halo'], palette: { main: '#4a7ed8', accent: '#fff0a0' } } }
  ],
  ascension: [
    { name: 'Phong Khởi', d: 'Gió lốc xanh quanh thân.', visual: { aura: { n: 6 } } },
    { name: 'Kiếm Ảnh', d: 'Vệt chém kéo bóng kiếm.', visual: { aura: { n: 10 }, trail: 'slash' } },
    { name: 'Long Ấn', d: 'Ấn rồng xoay dưới chân.', visual: { extra: ['runes'], aura: { n: 14 } } },
    { name: 'Hoàng Quang', d: 'Hào quang vàng, hạt sáng bay lên.', visual: { extra: ['embers'], aura: { n: 20, color: '#ffd978' } } },
    { name: 'Thiên Mệnh', d: 'Kiếm khí cuộn thành rồng.', visual: { extra: ['coil'], aura: { n: 26, color: '#ffe9a8' } } }
  ],
  max: { name: 'Đế Vương Thiên Mệnh', d: 'Mười hai thanh kiếm xoay quanh, ấn rồng toả sáng, bước chân để lại ánh vàng.', visual: { extra: ['halo', 'pennants', 'blades', 'runes', 'coil', 'embers'], glow: 1, palette: { main: '#5b8fe8', accent: '#fff6c0' } } },
  anim: { attack: { swing: 1.0 }, idle: { amp: 1 } }
},

/* ───────────── 2. LÊ HOÀN — Thiết Giáp ───────────── */
{
  id: 'lh', name: 'Lê Hoàn', title: 'Thập Đạo Tướng Quân', class: 'Hộ Vệ', role: 'Tiền tuyến', rarity: 'S',
  stats: { hp: 160, attack: 100, defense: 22, speed: 130, crit: 0, range: 380, attackSpeed: 0.95 },
  weapon: { name: 'Thanh Long Đao', kind: 'glaive', d: 'Đại đao lưỡi trăng, quét rộng, đẩy lùi.' },
  passive: { name: 'Thiết Thân', d: '+60 sinh lực. Dưới 40% máu: giảm 15% sát thương nhận.' },
  skills: [
    { name: 'Hàng Long Chưởng', d: 'Chưởng lực dội vòng quanh người, đẩy lùi.', link: 'hang' },
    { name: 'Quét Ngang', d: 'Xoay đao quét một vòng rộng.', link: null },
    { name: 'Thiết Bích', d: 'Dựng giáp, hấp thụ 120 sát thương trong 3 giây.', link: null }
  ],
  ultimate: { name: 'Bình Tống Phá Lỗ', d: 'Đại đao giáng xuống, sóng xung kích hất tung mọi địch.' },
  design: {
    silhouette: 'Hình thang đồ sộ — vai giáp khổng lồ, mũ trụ có mào, đại đao dài vượt đầu',
    body: 'heavy', head: 'crest', shoulder: 'pauldron', back: 'none', weapon: 'glaive',
    height: 1.04, width: 1.35,
    palette: { main: '#a33a2a', sub: '#6a1f16', accent: '#d9a441', skin: '#d3a67e', metal: '#c9ced6' },
    aura: { kind: 'dragon', color: '#ff7a4a', n: 0 },
    trail: 'sweep', glow: 0, extra: []
  },
  awakening: [
    { name: 'Hộ Tâm Thiết Giáp', d: 'Giáp ngực nạm đồng, mào mũ cao hơn.', visual: { palette: { accent: '#f0c050' }, glow: 0.3 } },
    { name: 'Long Lân Khải', d: 'Vai giáp mọc gai rồng, lưỡi đao sáng đỏ.', visual: { shoulder: 'spike', glow: 0.55, palette: { main: '#b84030' } } },
    { name: 'Thập Đạo Chiến Thần', d: 'Khoác cờ lệnh sau lưng, mũ trụ phun lửa.', visual: { back: 'banner', extra: ['flames'], glow: 0.85, palette: { main: '#c44a34', accent: '#ffd070' } } }
  ],
  ascension: [
    { name: 'Hổ Lực', d: 'Hơi nóng đỏ phả quanh chân.', visual: { aura: { n: 6 } } },
    { name: 'Thiết Bích', d: 'Khiên khí xanh mờ bao thân.', visual: { aura: { n: 10 }, extra: ['runes'] } },
    { name: 'Long Hống', d: 'Dư ảnh rồng gầm sau lưng.', visual: { aura: { n: 14 }, extra: ['runes', 'coil'] } },
    { name: 'Liệt Hoả', d: 'Lửa cháy trên lưỡi đao.', visual: { extra: ['flames', 'coil'], aura: { n: 20, color: '#ff9a4a' } } },
    { name: 'Chiến Thần Giáng Thế', d: 'Rồng đỏ cuộn quanh thân đao.', visual: { extra: ['flames', 'coil', 'embers'], aura: { n: 28, color: '#ffb070' } } }
  ],
  max: { name: 'Thiên Hạ Vô Song', d: 'Bóng rồng khổng lồ phía sau, lửa vàng cuộn dưới chân, mỗi bước chân rung đất.', visual: { extra: ['flames', 'coil', 'embers', 'runes', 'pennants'], back: 'banner', glow: 1, palette: { main: '#d65a3c', accent: '#fff0a0' } } },
  anim: { move: { weight: 1.3 }, attack: { swing: 1.25 }, idle: { amp: 0.7 } }
},

/* ───────────── 3. NGÔ QUYỀN — Bạch Đằng Du Kích ───────────── */
{
  id: 'nq', name: 'Ngô Quyền', title: 'Bạch Đằng Giang Chủ', class: 'Du Kích', role: 'Cơ động', rarity: 'SS',
  stats: { hp: 120, attack: 105, defense: 8, speed: 145.6, crit: 0, range: 440, attackSpeed: 1.05 },
  weapon: { name: 'Giáo Cọc Ngầm', kind: 'spear', d: 'Trường giáo mũi sắt, đâm thẳng tầm xa.' },
  passive: { name: 'Phong Hành', d: '+12% tốc độ. Sau khi né đòn, tốc chạy +20% trong 2 giây.' },
  skills: [
    { name: 'Phi Kiếm', d: 'Phi kiếm xoay quanh người, tự cắt địch.', link: 'phi' },
    { name: 'Thuỷ Triều Dâng', d: 'Sóng nước đẩy lùi địch phía trước.', link: null },
    { name: 'Lướt Sóng', d: 'Lao nhanh một đoạn, miễn nhiễm 0.3 giây.', link: null }
  ],
  ultimate: { name: 'Cọc Ngầm Bạch Đằng', d: 'Rừng cọc trồi lên khắp mặt đất, xuyên mọi địch trong vòng.' },
  design: {
    silhouette: 'Cao mảnh — khăn đầu dài bay theo gió, giáo dài, dải lụa chảy phía sau',
    body: 'light', head: 'headband', shoulder: 'sash', back: 'scarf', weapon: 'spear',
    height: 1.1, width: 0.82,
    palette: { main: '#2a8a6a', sub: '#17503f', accent: '#9fe6cf', skin: '#d9b08a', metal: '#cfe6e0' },
    aura: { kind: 'tide', color: '#5fe0c0', n: 0 },
    trail: 'thrust', glow: 0, extra: []
  },
  awakening: [
    { name: 'Thuỷ Lân Y', d: 'Áo thêu vảy sóng, khăn đầu dài thêm.', visual: { palette: { main: '#2a9a7a', accent: '#b4f0dc' }, glow: 0.3 } },
    { name: 'Triều Dâng', d: 'Dải lụa hoá nước, mũi giáo toả ánh ngọc.', visual: { back: 'scarf', glow: 0.55, extra: ['pennants'] } },
    { name: 'Bạch Đằng Thần Tướng', d: 'Áo choàng sóng bạc, vòng nước quanh thân.', visual: { extra: ['pennants', 'wings'], glow: 0.85, palette: { main: '#34b090', accent: '#e0fff6' } } }
  ],
  ascension: [
    { name: 'Gió Sông', d: 'Làn gió xanh ngọc theo bước chân.', visual: { aura: { n: 6 } } },
    { name: 'Sóng Bạc', d: 'Vệt đâm kéo bọt sóng.', visual: { aura: { n: 10 }, trail: 'thrust' } },
    { name: 'Lốc Xoáy', d: 'Xoáy nước nhỏ dưới chân.', visual: { extra: ['runes'], aura: { n: 14 } } },
    { name: 'Triều Cường', d: 'Giọt nước bay quanh người.', visual: { extra: ['embers'], aura: { n: 20, color: '#9ff0dc' } } },
    { name: 'Thuỷ Thần', d: 'Rồng nước uốn quanh cán giáo.', visual: { extra: ['coil'], aura: { n: 28, color: '#d0fff2' } } }
  ],
  max: { name: 'Bạch Đằng Bất Bại', d: 'Ba rồng nước xoay quanh, cọc sáng mọc từ mặt nước dưới chân.', visual: { extra: ['pennants', 'wings', 'coil', 'runes', 'embers', 'blades'], glow: 1, palette: { main: '#3cc4a2', accent: '#f0fffa' } } },
  anim: { move: { weight: 0.7, rate: 1.25 }, attack: { swing: 0.9 } }
},

/* ───────────── 4. TRẦN HƯNG ĐẠO — Pháp Lôi Thống Soái ───────────── */
{
  id: 'thd', name: 'Trần Hưng Đạo', title: 'Hưng Đạo Đại Vương', class: 'Pháp Tướng', role: 'Sát thương phép', rarity: 'SSR',
  stats: { hp: 100, attack: 112, defense: 10, speed: 130, crit: 0.12, range: 480, attackSpeed: 1 },
  weapon: { name: 'Lệnh Kỳ Thiên Uy', kind: 'banner', d: 'Cờ lệnh gắn lôi châu, triệu sét từ xa.' },
  passive: { name: 'Thiên Uy', d: '+12% công, +12% bạo kích. Sét chí mạng lan sang 1 địch kề bên.' },
  skills: [
    { name: 'Lôi Động', d: 'Triệu sét đánh ngẫu nhiên vào địch.', link: 'loi' },
    { name: 'Hịch Tướng Sĩ', d: 'Tăng 15% công toàn trận 5 giây.', link: null },
    { name: 'Kết Trận', d: 'Dựng trận đồ làm chậm địch bên trong.', link: null }
  ],
  ultimate: { name: 'Vạn Lôi Bạch Đằng', d: 'Bầu trời nứt, vạn tia sét giáng khắp chiến trường.' },
  design: {
    silhouette: 'Áo bào dài hình chuông — mũ cánh chuồn rộng hai bên, cờ lệnh cao quá đầu',
    body: 'robe', head: 'wing', shoulder: 'none', back: 'banner', weapon: 'banner',
    height: 1.12, width: 1.05,
    palette: { main: '#6a3ab8', sub: '#3d1f73', accent: '#ffd34a', skin: '#e6c29c', metal: '#d8c8ff' },
    aura: { kind: 'thunder', color: '#b48cff', n: 0 },
    trail: 'arc', glow: 0, extra: []
  },
  awakening: [
    { name: 'Tử Bào Thống Soái', d: 'Áo bào thêu chỉ vàng, mũ cánh chuồn rộng thêm.', visual: { palette: { accent: '#ffe27a' }, glow: 0.3 } },
    { name: 'Lôi Châu Khai Quang', d: 'Lôi châu sáng trên cờ lệnh, tay áo toả điện.', visual: { glow: 0.6, extra: ['runes'], palette: { main: '#7a46cc' } } },
    { name: 'Hưng Đạo Đại Vương', d: 'Vòng sáng sau lưng, áo bào ánh tím vàng.', visual: { glow: 0.9, extra: ['runes', 'halo'], palette: { main: '#8a52e0', accent: '#fff0a0' } } }
  ],
  ascension: [
    { name: 'Điện Quang', d: 'Tia điện nhỏ nhảy quanh người.', visual: { aura: { n: 6 } } },
    { name: 'Lôi Văn', d: 'Vết sét kéo dài theo nhát chém cờ.', visual: { aura: { n: 10 }, trail: 'arc' } },
    { name: 'Lôi Trận', d: 'Trận đồ sét xoay dưới chân.', visual: { extra: ['runes'], aura: { n: 14 } } },
    { name: 'Tử Điện', d: 'Cầu sét lơ lửng quanh người.', visual: { extra: ['blades'], aura: { n: 20, color: '#d0b0ff' } } },
    { name: 'Thiên Lôi', d: 'Mây sét hội tụ trên đầu.', visual: { extra: ['crown'], aura: { n: 28, color: '#efe0ff' } } }
  ],
  max: { name: 'Thiên Lôi Chấp Chưởng', d: 'Mây giông cuộn trên đầu, năm lôi châu quay quanh, mặt đất khắc trận đồ sáng tím.', visual: { extra: ['halo', 'runes', 'blades', 'crown', 'embers', 'wings'], glow: 1, palette: { main: '#9a5cf0', accent: '#fffbd0' } } },
  anim: { skill: { cast: 1.2 }, ultimate: { cast: 1.3 }, idle: { amp: 0.9 } }
},

/* ───────────── 5. ĐINH LIỄN — Tập Sự Cung Thủ ───────────── */
{
  id: 'dl', name: 'Đinh Liễn', title: 'Thiếu Niên Xạ Thủ', class: 'Cung Thủ', role: 'Tầm xa', rarity: 'C',
  stats: { hp: 110, attack: 102, defense: 3, speed: 132.6, crit: 0, range: 470, attackSpeed: 1.1 },
  weapon: { name: 'Cung Gỗ Tre', kind: 'bow', d: 'Cung gỗ nhẹ, bắn nhanh tầm xa.' },
  passive: { name: 'Tân Binh', d: '+10 sinh lực. Tên đầu tiên mỗi đợt gây thêm 25% sát thương.' },
  skills: [
    { name: 'Phi Kiếm', d: 'Phi kiếm xoay quanh người.', link: 'phi' },
    { name: 'Loạt Tên', d: 'Bắn ba mũi tên toả quạt.', link: null },
    { name: 'Nín Thở', d: 'Mũi tên kế tiếp chắc chắn bạo kích.', link: null }
  ],
  ultimate: { name: 'Mưa Tên', d: 'Trút mưa tên xuống toàn vùng xung quanh.' },
  design: {
    silhouette: 'Nhỏ, thấp — ống tên sau lưng, cung cao hơn đầu, dáng nhanh nhẹn',
    body: 'light', head: 'hood', shoulder: 'none', back: 'quiver', weapon: 'bow',
    height: 0.88, width: 0.88,
    palette: { main: '#6b7a4a', sub: '#3f4a2a', accent: '#c9a56a', skin: '#e3bf98', metal: '#e8e0c8' },
    aura: { kind: 'leaf', color: '#a8d878', n: 0 },
    trail: 'arrow', glow: 0, extra: []
  },
  awakening: [
    { name: 'Áo Choàng Săn', d: 'Khoác áo choàng xanh, ống tên đầy hơn.', visual: { palette: { main: '#78884e' }, glow: 0.2 } },
    { name: 'Cung Lõi Bạc', d: 'Cung gắn lõi bạc, dây cung phát sáng.', visual: { glow: 0.5, extra: ['pennants'] } },
    { name: 'Thần Xạ Tái Thế', d: 'Cánh gió sau lưng, mũi tên toả sáng.', visual: { extra: ['pennants', 'wings'], glow: 0.8, palette: { main: '#88a058', accent: '#f0e0a0' } } }
  ],
  ascension: [
    { name: 'Lá Rơi', d: 'Lá xanh bay theo bước chân.', visual: { aura: { n: 6 } } },
    { name: 'Tên Bay', d: 'Vệt tên kéo ánh bạc.', visual: { aura: { n: 10 }, trail: 'arrow' } },
    { name: 'Mắt Ưng', d: 'Vòng ngắm xoay dưới chân.', visual: { extra: ['runes'], aura: { n: 14 } } },
    { name: 'Gió Rừng', d: 'Lốc lá quanh người.', visual: { extra: ['embers'], aura: { n: 20, color: '#c8f098' } } },
    { name: 'Xạ Thần', d: 'Cung phát cánh sáng.', visual: { extra: ['wings'], aura: { n: 26, color: '#e8ffc8' } } }
  ],
  max: { name: 'Bách Phát Bách Trúng', d: 'Cánh xanh sau lưng, mười mũi tên sáng xoay quanh, lá vàng rơi không dứt.', visual: { extra: ['wings', 'blades', 'embers', 'runes', 'pennants'], glow: 1, palette: { main: '#98b868', accent: '#fffbd0' } } },
  anim: { move: { rate: 1.3 }, attack: { swing: 0.8 }, hit: { stagger: 1.2 } }
},

/* ───────────── 6. NGUYỄN BẶC — Thiết Thuẫn ───────────── */
{
  id: 'nb', name: 'Nguyễn Bặc', title: 'Định Quốc Công', class: 'Thuẫn Binh', role: 'Chống chịu', rarity: 'B',
  stats: { hp: 135, attack: 103, defense: 18, speed: 130, crit: 0.02, range: 360, attackSpeed: 0.95 },
  weapon: { name: 'Thuẫn Đồng & Đoản Đao', kind: 'shield', d: 'Khiên tròn đồng lớn, đoản đao đâm nhanh.' },
  passive: { name: 'Thép Già', d: '+35 sinh lực. Khi bị đánh, 10% cơ hội phản 40 sát thương.' },
  skills: [
    { name: 'Hàng Long Chưởng', d: 'Chưởng lực dội vòng quanh người.', link: 'hang' },
    { name: 'Thuẫn Đập', d: 'Đập khiên choáng địch phía trước 0.5 giây.', link: null },
    { name: 'Thủ Thành', d: 'Giảm 25% sát thương nhận trong 4 giây.', link: null }
  ],
  ultimate: { name: 'Thiết Bích Thành Đồng', d: 'Dựng bức tường khiên vòng tròn, hất văng mọi địch.' },
  design: {
    silhouette: 'Khối tròn chắc — khiên đồng lớn che nửa thân, mũ tròn có chắn má',
    body: 'heavy', head: 'round', shoulder: 'pauldron', back: 'none', weapon: 'shield',
    height: 0.96, width: 1.3,
    palette: { main: '#8a5a2a', sub: '#553414', accent: '#d9a441', skin: '#d6a982', metal: '#b9a27a' },
    aura: { kind: 'guard', color: '#e0b060', n: 0 },
    trail: 'bash', glow: 0, extra: []
  },
  awakening: [
    { name: 'Thuẫn Đồng Khắc Chữ', d: 'Khiên khắc chữ Nhẫn, mũ có vành.', visual: { glow: 0.25, palette: { accent: '#f0c060' } } },
    { name: 'Thiết Thuẫn', d: 'Khiên đổi thép sáng, vai giáp dày.', visual: { glow: 0.5, shoulder: 'spike', palette: { metal: '#d4dce6' } } },
    { name: 'Thành Đồng Hộ Quốc', d: 'Khiên toả vầng sáng, cờ nhỏ sau lưng.', visual: { glow: 0.8, back: 'banner', extra: ['halo'], palette: { main: '#a06a30', accent: '#ffe090' } } }
  ],
  ascension: [
    { name: 'Kiên Cố', d: 'Vầng đất vàng quanh chân.', visual: { aura: { n: 6 } } },
    { name: 'Thuẫn Quang', d: 'Mép khiên có ánh vàng.', visual: { aura: { n: 10 } } },
    { name: 'Khiên Trận', d: 'Ba mảnh khiên nhỏ xoay quanh.', visual: { extra: ['blades'], aura: { n: 14 } } },
    { name: 'Trọng Lực', d: 'Mặt đất lún sóng mỗi bước.', visual: { extra: ['runes'], aura: { n: 20, color: '#f0c878' } } },
    { name: 'Bất Hoại', d: 'Lớp giáp ánh kim bao thân.', visual: { extra: ['embers'], aura: { n: 26, color: '#fff0c0' } } }
  ],
  max: { name: 'Thiết Bích Bất Khả Phá', d: 'Sáu khiên sáng xoay thành vòng tròn, vầng sáng vàng quanh thân, mặt đất khắc ấn chắn.', visual: { extra: ['halo', 'blades', 'runes', 'embers'], back: 'banner', glow: 1, palette: { main: '#b87a3a', accent: '#fff0a0' } } },
  anim: { move: { weight: 1.2 }, hit: { stagger: 0.5 }, attack: { swing: 0.85 } }
},

/* ───────────── 7. LÝ THƯỜNG KIỆT — Nam Quốc Thần Kiếm ───────────── */
{
  id: 'ltk', name: 'Lý Thường Kiệt', title: 'Nam Quốc Sơn Hà', class: 'Song Kiếm', role: 'Bạo kích', rarity: 'SSR',
  stats: { hp: 130, attack: 110, defense: 9, speed: 136.5, crit: 0.15, range: 430, attackSpeed: 1.1 },
  weapon: { name: 'Nam Quốc Song Kiếm', kind: 'twin', d: 'Cặp kiếm vàng, đòn chéo liên hoàn.' },
  passive: { name: 'Nam Quốc', d: '+10% công, +15% bạo kích. Bạo kích tiếp theo sau khi hạ địch tăng 20% sát thương.' },
  skills: [
    { name: 'Kiếm Khí', d: 'Phóng kiếm khí xuyên địch.', link: 'kiem' },
    { name: 'Song Kiếm Hợp Bích', d: 'Hai nhát chém chéo nhau gây sát thương lớn.', link: null },
    { name: 'Thần Tốc', d: 'Lướt sau lưng địch, nhát kế bạo kích.', link: null }
  ],
  ultimate: { name: 'Như Hà Nghịch Lỗ', d: 'Kiếm quang vàng xé trời, quét sạch kẻ xâm phạm.' },
  design: {
    silhouette: 'Chữ V thanh thoát — hai kiếm bắt chéo sau lưng, tầng vạt áo dài, mũ cao nạm ngọc',
    body: 'armor', head: 'tiered', shoulder: 'sash', back: 'twin', weapon: 'twin',
    height: 1.08, width: 0.95,
    palette: { main: '#c9a020', sub: '#7a5c0c', accent: '#fff0a0', skin: '#e6c29c', metal: '#fff4cc' },
    aura: { kind: 'sun', color: '#ffe27a', n: 0 },
    trail: 'cross', glow: 0.2, extra: []
  },
  awakening: [
    { name: 'Kim Giáp Nam Quốc', d: 'Giáp vàng chạm mây, vạt áo dài thêm.', visual: { glow: 0.4, palette: { main: '#d6aa28' } } },
    { name: 'Nhật Quang Kiếm', d: 'Hai kiếm toả quầng nắng, dải lụa vàng bay.', visual: { glow: 0.7, extra: ['pennants'], back: 'twin' } },
    { name: 'Thần Kiếm Hiển Linh', d: 'Vầng nhật sau lưng, giáp ánh kim.', visual: { glow: 1, back: 'sunburst', extra: ['pennants', 'halo'], palette: { main: '#e6bc34', accent: '#ffe27a' } } }
  ],
  ascension: [
    { name: 'Kim Quang', d: 'Ánh vàng quanh thân.', visual: { aura: { n: 6 } } },
    { name: 'Song Ảnh', d: 'Vệt chém chéo chữ X.', visual: { aura: { n: 10 }, trail: 'cross' } },
    { name: 'Nhật Luân', d: 'Vòng nhật xoay dưới chân.', visual: { extra: ['runes'], aura: { n: 14 } } },
    { name: 'Hồng Nhật', d: 'Tàn lửa vàng bay lên.', visual: { extra: ['embers'], aura: { n: 20, color: '#fff0a0' } } },
    { name: 'Thiên Kiếm', d: 'Bốn thanh kiếm quang xoay quanh.', visual: { extra: ['blades'], aura: { n: 28, color: '#ffffff' } } }
  ],
  max: { name: 'Nam Quốc Sơn Hà Vĩnh Tồn', d: 'Mặt trời vàng sau lưng, tám kiếm quang xoay quanh, mỗi nhát chém để lại chữ Hán sáng.', visual: { extra: ['halo', 'pennants', 'blades', 'runes', 'embers', 'crown', 'wings'], back: 'sunburst', glow: 1, palette: { main: '#f4cc44', accent: '#fff0a0' } } },
  anim: { attack: { swing: 1.15 }, skill: { cast: 1.1 }, idle: { amp: 1.1 } }
}
];

/* ----- Điền bậc Thức Tỉnh/Thăng Giai thiếu req/cost/mul/add từ bảng mặc định, tạo chỉ mục ----- */
(function () {
  const R = DV_DATA.charRules;
  DV_DATA.characters.forEach(c => {
    c.awakening.forEach((a, i) => { const t = R.awakeningTable[i] || {}; a.req = a.req || t.req; a.cost = a.cost || t.cost; a.mul = a.mul != null ? a.mul : t.mul });
    c.ascension.forEach((a, i) => { const t = R.ascensionTable[i] || {}; a.req = a.req || t.req; a.cost = a.cost || t.cost; a.add = a.add || t.add });
  });
  DV_DATA.charById = {};
  DV_DATA.characters.forEach(c => DV_DATA.charById[c.id] = c);
})();

/* Kiểm tra dữ liệu: trả về mảng lỗi (rỗng = hợp lệ). Dùng trong tests & khi nạp game. */
DV_DATA.charValidate = function () {
  const err = [], R = DV_DATA.charRules, P = DV_DATA.charParts, seen = {};
  const need = ['hp', 'attack', 'defense', 'speed', 'crit', 'range', 'attackSpeed'];
  const states = ['idle', 'move', 'attack', 'skill', 'ultimate', 'hit', 'defeat', 'victory'];
  const chkPart = (cid, where, v) => {
    for (const k of ['body', 'head', 'shoulder', 'back', 'weapon', 'trail']) if (v[k] != null && P[k].indexOf(v[k]) < 0) err.push(`${cid}.${where}.${k}='${v[k]}' không có trong charParts`);
    if (v.aura && v.aura.kind != null && P.aura.indexOf(v.aura.kind) < 0) err.push(`${cid}.${where}.aura.kind='${v.aura.kind}'`);
    (v.extra || []).forEach(x => { if (P.extra.indexOf(x) < 0) err.push(`${cid}.${where}.extra '${x}' không có`) });
  };
  DV_DATA.characters.forEach(c => {
    if (!c.id || seen[c.id]) err.push('id trùng/thiếu: ' + c.id); seen[c.id] = 1;
    ['name', 'title', 'class', 'role', 'rarity'].forEach(k => { if (!c[k]) err.push(`${c.id}.${k} thiếu`) });
    if (!R.rarityColor[c.rarity]) err.push(`${c.id}.rarity '${c.rarity}' lạ`);
    need.forEach(k => { if (typeof c.stats[k] !== 'number') err.push(`${c.id}.stats.${k} thiếu`) });
    if (!c.weapon || !c.weapon.kind) err.push(c.id + '.weapon thiếu');
    if (!c.passive || !c.passive.name) err.push(c.id + '.passive thiếu');
    if (!c.skills || c.skills.length !== 3) err.push(c.id + ' cần đúng 3 skill');
    if (!c.ultimate || !c.ultimate.name) err.push(c.id + '.ultimate thiếu');
    if (!c.awakening || c.awakening.length !== R.awakeningStages) err.push(`${c.id} cần ${R.awakeningStages} bậc Thức Tỉnh`);
    if (!c.ascension || c.ascension.length !== R.ascensionStages) err.push(`${c.id} cần ${R.ascensionStages} bậc Thăng Giai`);
    if (!c.max || !c.max.visual) err.push(c.id + '.max thiếu');
    chkPart(c.id, 'design', c.design);
    (c.awakening || []).forEach((a, i) => chkPart(c.id, 'awakening' + (i + 1), a.visual || {}));
    (c.ascension || []).forEach((a, i) => chkPart(c.id, 'ascension' + (i + 1), a.visual || {}));
    if (c.max) chkPart(c.id, 'max', c.max.visual || {});
    if (c.anim) for (const s in c.anim) if (states.indexOf(s) < 0) err.push(`${c.id}.anim.${s} không phải trạng thái`);
  });
  /* chống "đổi màu": mỗi cặp nhân vật phải khác nhau ở ≥3 yếu tố hình dáng */
  const keys = c => [c.design.body, c.design.head, c.design.shoulder, c.design.back, c.design.weapon, c.design.aura.kind, c.design.trail, Math.round(c.design.height * 20), Math.round(c.design.width * 10)];
  const L = DV_DATA.characters;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = keys(L[i]), b = keys(L[j]); let d = 0; for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) d++;
    if (d < 4) err.push(`${L[i].id} và ${L[j].id} quá giống nhau (chỉ khác ${d} yếu tố)`);
    if (L[i].design.weapon === L[j].design.weapon) err.push(`${L[i].id} và ${L[j].id} trùng loại vũ khí`);
  }
  return err;
};
