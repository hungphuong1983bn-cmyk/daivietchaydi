# Phase 12 · Part 2 — Main Menu trung tâm + Hồ sơ tướng

## Hồ sơ tướng độc lập — `js/herodata.js` (`DV_HERO.record(id)`)
Không thêm dữ liệu lưu mới; ghép **chỉ-đọc** từ nguồn sẵn có (một nguồn sự thật): `HEROES` + `sv.hx[id]` + `DV_CHAR` (cảnh giới, kỹ năng, aura, animation, VFX).
19 trường: `id, name, quality, level, exp, star, realm, atk, hp, def, spd, crit, martial, skill, equipment, skin, aura, animation, vfx`.
`DV_HERO.all()` trả hồ sơ cả 7 tướng. Giới hạn thiết kế hiện tại: **trang bị và Võ học là của tài khoản** (dùng chung mọi tướng), nên `equipment`/`martial` giống nhau giữa các tướng — chưa tách theo từng tướng (cần quyết định riêng vì ảnh hưởng cân bằng + save).

## Main Menu (`index.html`, `js/home.js`)
- Đã có từ trước: tướng đang chọn vẽ bằng `DV_CHAR.draw` (không còn ảnh chung), Lv/EXP/LC/Cảnh giới/chỉ số, chương hiện tại, nâng cấp tại chỗ.
- **Mới**: nút **VÀO GIANG HỒ**; dải 3 ô *Nhiệm vụ · Sự kiện đang diễn ra · Chưa nhận*; hàng **7 ô trang bị đang mặc** (viền theo phẩm chất; ẩn khi màn thấp <760px); lưới 4×2 thêm **Môn phái** và **Bí cảnh** (hiện báo "đang phát triển" — hệ thống thật ở Part 6 / Part 4, không làm giả).
- **Chấm đỏ** (`bdg()`): phần thưởng chưa nhận (`claim` = NV + mốc sự kiện + đăng nhập + Battle Pass), nhiệm vụ hoàn thành, **sự kiện mới** (`sv.evs`, tắt khi mở danh sách sự kiện; sự kiện lăn tháng tự "mới" lại), **tướng có thể nâng cấp** (đủ vàng quy đổi EXP, chưa chạm trần), **trang bị có thể nâng cấp** (đủ vàng, Lv<10).
- Save: thêm `sv.evs` (tự bổ sung cho save cũ).

## Test
`python3 tests/test_menu.py` (27 mục). Hồi quy đạt: `showcase_test.py`, `test_modes.py`, bot ải 1-1…1-6, không lỗi JS.
