# Phase 9 — Art Pass: Q版 Võ Hiệp (nhân vật + quái)

Chỉ thay LỚP HÌNH ẢNH. Gameplay, chỉ số, dữ liệu, save không đổi. Thiếu `js/chibi.js` / `js/monsterart.js` → game tự dùng hình cũ.

## Nhân vật — `js/chibi.js` (`DV_CHIBI`)
- Tỉ lệ Q版 (đầu ≈ ½ chiều cao), mắt anime có điểm sáng, chớp mắt, má hồng, viền mực đậm, đổ bóng 2 tông.
- Mỗi tướng có khuôn mặt/tóc/mũ/dấu hiệu riêng (`SPEC`): sẹo, râu, tàn nhang, ria; màu mắt theo màu nhận diện.
- Biểu cảm theo trạng thái: đánh/kỹ năng (hằm hè, há miệng), tuyệt kỹ (mắt rực), bị đánh (> <), gục (x x), thắng (^ ^).
- Animation vẫn do `DV_CHAR.pose()` (idle/move/attack/skill/ultimate/hit/defeat/victory); VFX đòn, aura, ấn dưới chân giữ nguyên.
- Trang bị đổi hình trực quan theo ô + phẩm chất (Thường 🟢 / Hiếm 🔵 / Sử Thi 🟣 / Huyền Thoại 🟠): Vũ khí (lưỡi/cán toả sáng), Giáp (huy hiệu, viền, vai to hơn, hào quang), Ngọc (ngọc trán), Cung (đeo lưng), Găng (cổ tay), Giày (ủng, tia lửa), Nhẫn (lấp lánh ở tay).
- Tướng mạnh nổi bật hơn: Thức Tỉnh/Thăng Giai/MAX phóng to nhẹ (tối đa +10%), đổi mũ/giáp/áo choàng/phụ kiện theo `visual` có sẵn, aura dày dần.
- Hiệu ứng: **Lên cấp** (cột sáng, vòng, mũi tên ↑, sao) · **Học/nâng võ công** (vòng ấn + sách bay vào ngực) · **Nâng cảnh giới** (Thức Tỉnh/Thăng Giai/Tiến Hoá: loé sáng, tia, cánh sen, rồng cuộn).
  Trong trận phát khi chọn thẻ (`pickCard`); ở Hồ sơ phát khi bấm NÂNG/xem trước bậc.

## Quái — `js/monsterart.js` (`DV_MART`)
15 chủ đề map = 15 chủng tộc (dáng khác hẳn): plain Binh giặc · river Thuỷ quái (đầu cá) · valley Sơn tặc · forest Thú rừng · citadel Cấm quân · shadow U hồn · mountain Sơn quỷ · swamp Quỷ bùn · sea Hải quái (cua) · cave Thạch linh · snow Tuyết quái · desert Bọ sa mạc · volcano Quỷ lửa · void Hư ảnh · heaven Thiên binh.
- × 14 vai trò (Binh lính, Trinh sát, Giáp nặng, Du binh, Cung thủ, Thương binh, Hoả công, Thiết giáp, Quái tách, Pháp sư, Triệu hồi sư, Thích khách, Cự nhân, Liệp thủ) + Mini Boss + Boss: vũ khí/giáp/mặt nạ/vương miện khác nhau.
- × biến thể theo chương: màu da/áo xoay theo `chapterId`, 4 kiểu phụ kiện (nón/mũ/khăn/sừng, sừng/mào, mắt…), nên 52 chương không lặp mẫu.
- Animation: nảy bước + chân chạy live, nghiêng theo hướng; gồng đỏ trước đòn (`tel`), lao kéo vệt (`dsh`).
- Hiệu ứng: **xuất hiện** (vòng truyền tống + cột sáng, trồi lên) · **bị đánh** (nháy trắng, tia sáng, chí mạng lớn hơn) · **tiêu diệt** (vòng sóng, mảnh vỡ theo tộc: bong bóng/lá/đá/khói/tia lửa, hồn bay lên; Boss lớn hơn).
- Hiệu năng: quái thường được nướng thành sprite, chỉ Elite/Mini Boss/Boss/U hồn vẽ trực tiếp; tự giảm chi tiết khi >120 quái hoặc đồ hoạ Thấp.

## Móc nối (tối thiểu)
`index.html`: nạp 2 script; `enemy()` gọi `MA.body`; `hit()` gọi `MA.onHit/onDie`; `spawnD/bigE` ghi `born`; `pickCard` đặt `G.chp.burst`.
`js/character.js`: `draw()` gọi `DV_CHIBI.body` nếu có; `eqOf()` đọc trang bị đang mặc.

## Kiểm thử
`tests/chibi_preview.html?m=states|tiers[&eq=0..3]` · `tests/monster_preview.html` (bảng 15×16) · `python3 tests/art_test.py OUT [chương,…|auto] [giây]` (chụp trong trận, báo lỗi JS).
Lưu ý: `tests/char_test.py` mục 5 (trong trận) cần chỉnh chờ màn Loading của Phase 8 (`DV_HOME.loading` bất đồng bộ) — lỗi có từ trước Phase 9.
