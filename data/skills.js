/* Dữ liệu Võ công (Phase 4) — bảng tương ứng: skills. Thiếu file → game dùng bảng dự phòng trong index.html.
   t = nhóm · n = tên · i = emoji · r = độ hiếm (T/H/S/L) · d = mô tả · u(l) = mô tả chỉ số theo cấp
   evo = Tiến Hoá: cần võ công này đạt cấp tối đa VÀ võ công `need.k` đạt ≥ `need.l`.
         m = hệ số nhân khi đã tiến hoá: n (cộng thêm số luồng/tia/kiếm), dmg (×sát thương), cd (×hồi chiêu), rad (×tầm/bán kính) */
window.DV_DATA = window.DV_DATA || {};
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
  ho: { t: 'Phòng Thủ', n: 'Hộ Thể', i: '🛡️', r: 'T', d: 'Nội lực hộ thân, tăng sinh lực tối đa.', u: l => `Sinh lực tối đa +${25 * l}` }
};
