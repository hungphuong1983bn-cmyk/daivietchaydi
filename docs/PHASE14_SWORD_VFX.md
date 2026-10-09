# Phase 14 — Nâng cấp đồ hoạ Skill kiếm hiệp (`js/vfx3.js`)

Chỉ thay lớp hình ảnh. Sát thương, hồi chiêu, điều khiển, dữ liệu Skill, âm thanh, camera **không đổi**.
Engine: Canvas 2D. `vfx3.js` bọc (wrap) các hàm của `DV_VFX` (`js/vfx.js`); xoá thẻ `<script src="js/vfx3.js">` là game về đúng hiệu ứng Phase 10/13.

## Bộ dựng hình
| Hàm | Dùng cho |
|---|---|
| `ribbon` | vệt kiếm / vệt Phi Kiếm: dải thon theo quỹ đạo thật, 3 lớp (quầng · thân · lõi trắng) |
| `arcBlade` | đường chém cong, đầu dày – đuôi thon, quét theo thời gian |
| `lens` | vết chém thẳng, kiếm ảnh, tia băng, kiếm quang xé trời |
| `ring` | sóng xung kích 3 lớp + vòng dư chấn + dải tối giả khúc xạ |
| `rune` | pháp trận xoay dưới đất (vòng · vạch · bát quái) |
| `vx` (vortex) | các nhánh xoáy cuộn ra ngoài |
| `b3` | sét phân nhánh đệ quy |
| `sw` | kiếm ảnh lao xuống, cắm xuống thì nổ |
| hạt | `m` mote (quỹ đạo cực) · `s` tia · `h` mảnh năng lượng · `d` bụi/sương · `i` mảnh băng · `f` lá |

Phân lớp: **back** (dưới nhân vật: pháp trận, sóng đất, cột sáng) · **front** (trên nhân vật) · **bokeh tiền cảnh** (`z=2`, thị sai nhẹ).

## Theo từng Skill
- **Kiếm Khí (đòn thường)**: mỗi viên đạn ngẫu nhiên một dạng — 3 đường kiếm cong nối tiếp · kiếm thẳng xuyên phá · song kiếm; vệt ribbon dài theo tốc độ, hạt xoắn theo quỹ đạo, bóng đổ dưới đất. Tung chiêu: 2 nhát quét luân phiên trái/phải. Trúng: 2–3 vết chém chéo, chớp sáng, vòng xung kích, tia + mảnh năng lượng, bụi.
- **Combo** (mốc 10/20/30…): chuỗi 3–7 đường chém quét quanh nhân vật, lệch nhịp 0.055s (hook trong `vfx2.js → combo()`).
- **Tuyệt kỹ**: tụ khí (0.2s) → cột sáng + chớp → 3 nhịp sóng xung kích → hiệu ứng riêng từng tướng → hạt tan dần bay lên.
  `dbl` kiếm trận (kiếm ảnh giáng xuống + 12 đường kiếm quang) · `lh` 2 xoáy đao khí/lửa + vòng chém · `nq` gai băng toả tia + sương + mảnh băng · `thd` mạng sét · `dl` xoáy độc + sương độc · `nb` trận pháp bát quái + 2 xoáy ngược chiều · `ltk` hai nhát chém chéo khổng lồ + kiếm ảnh.
- **Lôi Động**: cột sáng, 1–3 tia sét phân nhánh, vòng xung kích, pháp trận chớp, tia điện toả mặt đất.
- **Hàng Long Chưởng**: pháp trận bát quái, 3 vòng xung kích, 3 nhánh xoáy khí, tia + mảnh + bụi, (tiến hoá) tàn lửa bay lên.
- **Phi Kiếm**: vệt ribbon theo quỹ đạo tròn + quầng từng thanh + hạt bay theo quỹ đạo.
- **Báo hiệu**: khi thanh tuyệt kỹ đầy, khí xoáy hội tụ nhẹ quanh nhân vật.

## Hiệu năng
Sprite quầng sáng dựng sẵn, chuỗi rgba cache, pool đối tượng/hạt, trần theo đồ hoạ (Thấp/Vừa/Cao: 34/80/140 hiệu ứng · 150/340/560 hạt), ngân sách hiệu ứng trúng đòn mỗi khung, tôn trọng `prefers-reduced-motion`. Mức Thấp bỏ additive blend.

## File đổi
`js/vfx3.js` (mới) · `index.html` (+1 thẻ script) · `js/vfx2.js` (+1 dòng gọi `DV_VFX3.combo`) · `docs/PHASE14_SWORD_VFX.md`.
Kiểm thử: `python3 tests/vfx_test.py OUT [0|1|2]` (chụp contact sheet từng Skill/tuyệt kỹ).
