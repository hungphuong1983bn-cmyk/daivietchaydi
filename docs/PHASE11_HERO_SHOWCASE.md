# Phase 11 — Hero Showcase (Main Menu)

Main Menu không còn dùng `assets/hero.png`. Nó vẽ **đúng tướng đang chọn** bằng chính `DV_CHAR.draw`.

## Luồng dữ liệu (một nguồn, không hệ thống song song)
`sv.hs` → `HEROES` → `DV_CHAR` (hình / animation / aura / Thức Tỉnh / Thăng Giai) → trang bị đang mặc (`sv.eqp`/`sv.inv`, chibi đã vẽ theo `eqOf()`) → `bon()` (chỉ số = đúng số liệu trong trận) → `sv.vh` (Võ học).
Panel hiển thị HP/Công/Thủ/Bạo/Tốc từ `bon()` + `DV_CHAR.stats`; test #12 xác nhận khớp `G.p.mhp`/`G.am`/`G.p.spd` trong trận.

## Hiệu ứng (tự phát khi dữ liệu đổi, hoãn tới khi modal/overlay đóng)
| Sự kiện | Phát hiện | Hiệu ứng |
|---|---|---|
| Lên cấp | `p.l` tăng | tích tụ (hạt hội tụ, cột sáng, vòng chân, tướng phát sáng) → bùng nổ → `LEVEL UP!` → số liệu nhảy, chỉ số tăng nổi bật |
| Đột phá | `aw/asc` tăng | tối nền, zoom, pháp trận, tướng giơ pose `ultimate`, shockwave, hiện tên cảnh giới từ `DV_CHAR` |
| Tăng ★ | `s` tăng | sao sáng lần lượt + burst, `★ N SAO` |
| Võ học | `sv.vh` thêm khoá | icon sách + burst, `SKILL UPGRADED` |
| Đổi trang bị | chữ ký `eqp/inv` | tướng đổi hình ngay; burst theo màu bậc cao nhất; aura/hạt theo bậc |
| Đổi tướng | `sv.hs` | fade 0.35s, đổi model/animation/skill/aura/nền |
| Nhận thưởng | vàng/KC tăng | tướng ăn mừng + câu thoại |
| Tướng mới | triệu hồi / mua | `DV_SHOW.unlock(ids)`: model + phẩm chất + aura, zoom, `evo` từ ánh sáng |

Hiệu ứng nền theo hệ (`design.aura.kind`): wind→gió, dragon→tàn lửa, tide→tuyết/nước, thunder→tia sét, leaf→lá, guard→bụi vàng, sun→tia sáng.

## Nâng cấp ngay trên Main Menu
`NÂNG CẤP` (bảng: Lv hiện tại→sau, EXP hiện/cần, chi phí, chỉ số trước/sau), `ĐỘT PHÁ`, `VÕ HỌC` (tầng cũ→mới, chỉ số & LC trước→sau), nút 👘 **Diện mạo**.

## Quyết định thiết kế (cần biết)
- **Chi phí lên cấp**: game gốc chỉ lên cấp bằng EXP sau ván. Nút NÂNG CẤP quy đổi 🪙 → EXP (mặc định 2🪙 = 1 EXP, đọc `DV_DATA.prog.trainRate` nếu có). Chỉnh một chỗ trong `lvCost()`.
- **Skin**: game chưa có hệ thống skin riêng. "Diện mạo" = các dạng đã mở (Gốc → Thức Tỉnh → Thăng Giai → Cực Hạn), lưu ở `sv.hx[id].skin`; tự về dạng mới nhất khi đột phá.
- **Phẩm chất tướng** (C…SSR) cố định theo tướng; chỉ ★ và bậc trang bị thay đổi → aura/VFX đổi theo hai thứ đó.
- Skill "nâng cấp" dùng hệ **Võ học** sẵn có (toàn cục), vì game không có cấp kỹ năng riêng từng tướng.

## Test
`python3 tests/showcase_test.py [shots DIR]` — 13 nhóm, bám danh sách kiểm thử yêu cầu.
(`char_test.py`, `test_progress.py` lỗi y hệt ở bản gốc — không do phase này.)
