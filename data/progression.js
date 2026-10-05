/* Dữ liệu EXP / Level cap (Phase 4). Thiếu file → game dùng cấu hình dự phòng trong index.html.
   runCap   = cấp tối đa TRONG ván (đạt trần: orb EXP đổi thành vàng, không hiện thẻ nữa)
   skillMax = cấp tối đa của mỗi võ công trong ván (đạt trần + đủ điều kiện → thẻ Tiến Hoá)
   heroCap  = cấp tối đa của Tướng, tăng theo số sao (0★ = 30 … 5★ = 55)
   exp(l)   = EXP cần để lên từ cấp l → l+1 trong ván (giữ đường cong cũ tới cấp 15, sau đó chậm lại)
   hexp(l)  = EXP Tướng cần để lên từ cấp l (ngoài ván)
   overflow = EXP dư khi Tướng đã đạt trần → chia cho số này để đổi ra vàng */
window.DV_DATA = window.DV_DATA || {};
DV_DATA.prog = (() => {
  const runCap = 40, skillMax = 5, tbl = [0, 20];
  for (let l = 1; l < runCap; l++) tbl[l + 1] = Math.round(tbl[l] * (l < 15 ? 1.35 : 1.15) + 8);
  return {
    runCap, skillMax, overflow: 20,
    exp: l => tbl[Math.min(l, runCap)] || tbl[runCap],
    heroCap: s => 30 + 5 * (s || 0),
    hexp: l => 600 * l
  };
})();
