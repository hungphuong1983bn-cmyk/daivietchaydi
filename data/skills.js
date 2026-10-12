/* Dữ liệu Võ công (Phase 4) — bảng tương ứng: skills. Thiếu file → game dùng bảng dự phòng trong index.html.
   t = nhóm · n = tên · i = emoji · r = độ hiếm (T/H/S/L) · d = mô tả · u(l) = mô tả chỉ số theo cấp
   evo = Tiến Hoá: cần võ công này đạt cấp tối đa VÀ võ công `need.k` đạt ≥ `need.l`.
         m = hệ số nhân khi đã tiến hoá: n (cộng thêm số luồng/tia/kiếm), dmg (×sát thương), cd (×hồi chiêu), rad (×tầm/bán kính) */
window.DV_DATA = window.DV_DATA || {};
const M2 = v => Math.round(v * 100);
DV_DATA.skills = {
  kiem: { t: 'Tấn Công', n: 'Kiếm Khí', i: '🗡️', r: 'H', d: 'Phóng kiếm khí xuyên địch gần nhất.',
    u: l => `Sát thương ${16 + 7 * l} · ${1 + (l > 2) + (l > 4)} luồng`,
    evo: { n: 'Vạn Kiếm Quy Tông', i: '⚔️', need: { k: 'khinh', l: 3 }, d: 'Kiếm khí hoá vạn kiếm: +2 luồng, sát thương ×1.6, ra chiêu nhanh hơn.', m: { n: 2, dmg: 1.6, cd: .8 } } },
  loi: { t: 'Tấn Công', n: 'Lôi Động', i: '⚡', r: 'S', d: 'Triệu sét đánh ngẫu nhiên vào địch.',
    u: l => `Sát thương ${28 + 11 * l} · ${l + 1} tia`,
    evo: { n: 'Thiên Lôi Giáng Thế', i: '🌩️', need: { k: 'ho', l: 2 }, d: 'Sấm sét trời giáng: +3 tia, vùng nổ rộng hơn 50%, sát thương ×1.4.', m: { n: 3, dmg: 1.4, rad: 1.5 } } },
  hang: { t: 'Tấn Công', n: 'Hàng Long Chưởng', i: '🐉', r: 'L', d: 'Chưởng lực nổ vòng quanh, đẩy lùi địch.',
    u: l => `Sát thương ${22 + 9 * l} · tầm ${80 + 14 * l}`,
    evo: { n: 'Kháng Long Hữu Hối', i: '🔥', need: { k: 'ho', l: 3 }, d: 'Chưởng lực bùng nổ: tầm ×1.35, sát thương ×1.5, hồi chiêu nhanh hơn.', m: { dmg: 1.5, rad: 1.35, cd: .85 } } },
  phi: { t: 'Tấn Công', n: 'Phi Kiếm', i: '🔱', r: 'H', d: 'Kiếm bay xoay quanh thân hộ vệ.',
    u: l => `${l + 1} thanh kiếm · sát thương ${10 + 5 * l}`,
    evo: { n: 'Phi Kiếm Trận', i: '🌀', need: { k: 'khinh', l: 2 }, d: 'Kiếm trận bao quanh: +3 thanh kiếm, sát thương ×1.5.', m: { n: 3, dmg: 1.5 } } },
  khinh: { t: 'Hỗ Trợ', n: 'Khinh Công', i: '🍃', r: 'T', d: 'Thân pháp nhẹ nhàng, chạy nhanh hơn.', u: l => `Tốc độ +${10 * l}%` },
  ho: { t: 'Phòng Thủ', n: 'Hộ Thể', i: '🛡️', r: 'T', d: 'Nội lực hộ thân, tăng sinh lực tối đa.', u: l => `Sinh lực tối đa +${25 * l}` },
  /* ===== Phase 19: võ công mở rộng (logic: js/skills_ext.js · hiệu ứng 3D: js/r3d_skx.js) ===== */
  hoa: { t: 'Tấn Công', n: 'Phượng Hoàng Hỏa', i: '🔥', r: 'S', d: 'Triệu hoán phượng lửa tự tìm địch, nổ lan và thiêu đốt.',
    u: l => `Sát thương ${30 + 12 * l} · ${1 + (l > 2)} phượng · nổ tầm ${60 + 6 * l}`,
    evo: { n: 'Niết Bàn Hỏa Phượng', i: '🦅', need: { k: 'ngu', l: 2 }, d: 'Phượng hoàng tái sinh: +2 phượng, sát thương ×1.5, nổ rộng hơn 30%.', m: { n: 2, dmg: 1.5, rad: 1.3 } } },
  bang: { t: 'Tấn Công', n: 'Hàn Băng Trận', i: '❄️', r: 'H', d: 'Lập trận băng làm chậm và gây sát thương địch trong vùng.',
    u: l => `Sát thương ${8 + 4 * l}/nhịp · tầm ${90 + 10 * l} · làm chậm`,
    evo: { n: 'Cửu U Hàn Ngục', i: '🧊', need: { k: 'hoi', l: 2 }, d: 'Hàn ngục mở rộng ×1.4, +1 trận, sát thương ×1.5.', m: { n: 1, dmg: 1.5, rad: 1.4 } } },
  doc: { t: 'Tấn Công', n: 'Vạn Độc Vân', i: '☠️', r: 'H', d: 'Rải mây độc bám theo đám địch, độc tính gặm mòn sinh lực.',
    u: l => `Sát thương ${6 + 3 * l}/nhịp · ${1 + (l > 2)} đám mây · tầm ${70 + 8 * l}` },
  phong: { t: 'Tấn Công', n: 'Toàn Phong Trảm', i: '🌪️', r: 'H', d: 'Lốc xoáy chạy về phía địch, hút địch vào tâm và cắt xé.',
    u: l => `Sát thương ${7 + 3 * l}/nhịp · tầm ${60 + 6 * l} · hút địch`,
    evo: { n: 'Cửu Thiên Cuồng Phong', i: '🌀', need: { k: 'ngu', l: 2 }, d: '+1 lốc xoáy, tầm ×1.4, sát thương ×1.4.', m: { n: 1, dmg: 1.4, rad: 1.4 } } },
  tinh: { t: 'Tấn Công', n: 'Tinh Thần Vẫn Lạc', i: '☄️', r: 'L', d: 'Gọi mưa sao băng rơi xuống đầu địch sau một nhịp báo hiệu.',
    u: l => `Sát thương ${40 + 14 * l} · ${3 + l} thiên thạch`,
    evo: { n: 'Chư Thiên Tinh Vẫn', i: '🌠', need: { k: 'ngu', l: 3 }, d: '+4 thiên thạch, sát thương ×1.4, nổ rộng hơn 25%.', m: { n: 4, dmg: 1.4, rad: 1.25 } } },
  tru: { t: 'Tấn Công', n: 'Tru Tiên Kiếm', i: '🗡️', r: 'L', d: 'Cự kiếm từ trời giáng xuống kẻ mạnh nhất trong tầm.',
    u: l => `Sát thương ${90 + 35 * l} · tầm ${90 + 8 * l}`,
    evo: { n: 'Tru Tiên Tứ Kiếm', i: '⚔️', need: { k: 'ho', l: 2 }, d: 'Bốn thanh Tru Tiên cùng giáng: +2 kiếm, sát thương ×1.3.', m: { n: 2, dmg: 1.3 } } },
  lien: { t: 'Tấn Công', n: 'Liên Hoa Kiếm Trận', i: '🪷', r: 'S', d: 'Hoa sen kiếm nở rộ, phóng cánh kiếm toả ra mọi hướng.',
    u: l => `Sát thương ${14 + 6 * l} · ${8 + 2 * l} cánh kiếm`,
    evo: { n: 'Vạn Hoa Triều Nguyên', i: '🌸', need: { k: 'khinh', l: 2 }, d: '+8 cánh kiếm, sát thương ×1.4, ra chiêu nhanh hơn.', m: { n: 8, dmg: 1.4, cd: .8 } } },
  kim: { t: 'Phòng Thủ', n: 'Kim Chung Tráo', i: '🔔', r: 'S', d: 'Triệu chuông vàng bao thân: giảm mạnh sát thương nhận và chấn lui địch.',
    u: l => `Giảm ${M2(.45 + .07 * l)}% sát thương · ${(2 + .4 * l).toFixed(1)}s`,
    evo: { n: 'Bất Hoại Kim Thân', i: '🛡️', need: { k: 'ho', l: 3 }, d: 'Chuông vàng bền hơn, hồi chiêu nhanh hơn, chấn lui rộng ×1.4.', m: { cd: .75, rad: 1.4, dmg: 1.3 } } },
  hoi: { t: 'Hỗ Trợ', n: 'Hồi Xuân Quyết', i: '🌿', r: 'T', d: 'Linh khí xuân sinh, hồi sinh lực liên tục.', u: l => `Hồi ${(.4 * l).toFixed(1)}% sinh lực/giây` },
  hut: { t: 'Hỗ Trợ', n: 'Hấp Linh Đại Pháp', i: '🧲', r: 'T', d: 'Hút linh khí, ngọc kinh nghiệm và vàng từ xa.', u: l => `Tầm hút +${30 * l}%` },
  ngu: { t: 'Hỗ Trợ', n: 'Ngự Phong Quyết', i: '💨', r: 'H', d: 'Ngự phong tăng tốc độ ra chiêu của mọi võ công.', u: l => `Tốc độ ra chiêu +${8 * l}%` }
};
