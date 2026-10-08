# Phase 11 — Hero Showcase (Main Menu)

Main Menu không còn dùng `assets/hero.png`. Nó vẽ **đúng tướng đang chọn** bằng chính `DV_CHAR.draw`.

## Luồng dữ liệu (một nguồn, không hệ thống song song)
`sv.hs` → `HEROES` → `DV_CHAR` (hình / animation / aura / Thức Tỉnh / Thăng Giai) → trang bị đang mặc (`sv.eqp`/`sv.inv`, chibi đã vẽ theo `eqOf()`) → `bon()` (chỉ số = đúng số liệu trong trận) → `sv.vh` (Võ học).
Panel hiển thị HP/Công/Thủ/Bạo/Tốc từ `bon()` + `DV_CHAR.stats`; test #12 xác nhận khớp `G.p.mhp`/`G.am`/`G.p.spd` trong trận.

## Hiệu ứng tiến bộ (tự phát khi dữ liệu đổi, hoãn tới khi modal/overlay đóng)
Mỗi sự kiện có chuỗi **tích tụ → bùng nổ**; số liệu trên panel chỉ nhảy sau khi bùng. Lớp VFX toàn màn hình `#hfxs` (chớp sáng, cột sáng, sóng xung kích, số chỉ số bay lên, vật bay vào tướng, tia lửa, confetti, rung camera) dùng chung cho mọi sự kiện. Số chỉ số bay lên lấy từ chênh lệch **thật** trước/sau (`bon()`).

| Sự kiện | Phát hiện | Hiệu ứng |
|---|---|---|
| Lên cấp | `p.l` tăng | hạt hội tụ + cột sáng + vòng chân + tướng phát sáng → chớp vàng, sóng, tia lửa, `LEVEL UP!`, số `❤/⚔/LC +n` bay lên |
| Học võ công (tầng đầu của bộ) | `sv.vh` thêm khoá `x0` | icon sách bay vào tướng (màu theo bộ), burst cuộn võ công, vòng rune, `HỌC VÕ CÔNG` |
| Nâng kỹ năng (tầng sau) | `sv.vh` thêm khoá `xN` | vòng rune dâng lên, cột sáng mảnh, cuộn xoay, `SKILL UPGRADED` |
| Đột phá | `aw/asc` tăng | tối nền, zoom, pháp trận lục giác, pose `ultimate`, cột sáng, chớp trắng, 3 sóng, rung, tên cảnh giới từ `DV_CHAR` |
| Tăng ★ | `s` tăng | sao sáng lần lượt + burst + chớp, `★ N SAO` |
| Nhận trang bị hiếm | `sv.inv` có uid mới, `r ≥ 1` | **thẻ phần thưởng** theo bậc: Hiếm (xanh, tia nhẹ) · Sử Thi (tím, tia + sóng + rung) · Huyền Thoại (vàng, tia dày, chớp, 2 sóng, confetti). Có "MẶC NGAY" nếu tốt hơn món đang mặc; nhiều món → thẻ món tốt nhất + gộp phần còn lại. Bậc Thường: không có thẻ |
| Đổi trang bị | chữ ký `eqp/inv` | tướng đổi hình ngay; burst theo màu bậc cao nhất |
| Mở khoá tướng | `sv.hu` có khoá mới (mọi nguồn: triệu hồi, mua, sự kiện…) | cinematic phân cấp C→SSR: C/B nhẹ · A/S + cột sáng · SS/SSR + chớp trắng, 3 sóng, rung, confetti, tên phát sáng, huy hiệu bật ra. Mỗi tướng chỉ phát 1 lần/phiên |
| Đổi tướng | `sv.hs` | fade 0.35s |
| Nhận thưởng | vàng/KC tăng | tướng ăn mừng + câu thoại |

Hiệu ứng nền theo hệ (`design.aura.kind`): wind→gió, dragon→tàn lửa, tide→tuyết/nước, thunder→tia sét, leaf→lá, guard→bụi vàng, sun→tia sáng.

## Nâng cấp ngay trên Main Menu
`NÂNG CẤP` (bảng: Lv hiện tại→sau, EXP hiện/cần, chi phí, chỉ số trước/sau), `ĐỘT PHÁ`, `VÕ HỌC` (tầng cũ→mới, chỉ số & LC trước→sau), nút 👘 **Diện mạo**.

## Quyết định thiết kế (cần biết)
- **Chi phí lên cấp**: game gốc chỉ lên cấp bằng EXP sau ván. Nút NÂNG CẤP quy đổi 🪙 → EXP (mặc định 2🪙 = 1 EXP, đọc `DV_DATA.prog.trainRate` nếu có). Chỉnh một chỗ trong `lvCost()`.
- **Skin**: game chưa có hệ thống skin riêng. "Diện mạo" = các dạng đã mở (Gốc → Thức Tỉnh → Thăng Giai → Cực Hạn), lưu ở `sv.hx[id].skin`; tự về dạng mới nhất khi đột phá.
- **Phẩm chất tướng** (C…SSR) cố định theo tướng; chỉ ★ và bậc trang bị thay đổi → aura/VFX đổi theo hai thứ đó.
- Skill "nâng cấp" dùng hệ **Võ học** sẵn có (toàn cục), vì game không có cấp kỹ năng riêng từng tướng.

## Test
`python3 tests/showcase_test.py [shots DIR]` — 15 nhóm, bám danh sách kiểm thử yêu cầu.
(`char_test.py`, `test_progress.py` lỗi y hệt ở bản gốc — không do phase này.)

- Ảnh vật phẩm găng/giày (`it_n*`, `it_f*`) chưa có trong `assets/` → thẻ trang bị dùng emoji 🧤/👢 dự phòng (giống `iimg()` của game). Thêm file là tự dùng.
