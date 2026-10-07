# Phase 10 — Nâng cấp hiệu ứng kỹ năng (VFX chiến đấu)

Chỉ thay LỚP HIỆU ỨNG. Sát thương, tầm đánh, hồi chiêu, dữ liệu, save **không đổi**. Thiếu `js/vfx.js` → game tự dùng hiệu ứng cũ (mọi chỗ gọi đều có nhánh dự phòng `VF ? mới : cũ`).

## Nhận diện từng kỹ năng
| Kỹ năng | Hiệu ứng | Khi tiến hoá |
|---|---|---|
| **Kiếm Khí** (kiếm khí) | lưỡi liềm xanh băng + vệt đuôi dài + tia lửa; trúng → vệt chém chéo trắng (chí mạng: chém chữ X) | Vạn Kiếm Quy Tông: vàng ánh sáng, to hơn |
| **Lôi Động** (sét) | tia sét tím phân nhánh từ trời, vòng sốc đúng bán kính, vết cháy, hồ quang nhảy trên mục tiêu | Thiên Lôi: xanh trắng, nổ khói, dày hơn |
| **Hàng Long Chưởng** (chưởng lực) | ấn bàn tay vàng, sóng xung kích đúng bán kính, vạch lực toả ra, nứt đất, bụi; trúng → sao 8 cánh | Kháng Long: lửa — vòng đỏ cam, lưỡi lửa quanh rìa, tàn lửa |
| **Phi Kiếm** (gió) | kiếm ngọc lục xoay + vệt gió cuộn + lá gió; trúng → chém ngắn xanh | Phi Kiếm Trận: thêm vòng năng lượng nét đứt xoay, màu lam ngọc |

## Tuyệt kỹ (theo tướng — id lấy từ `HR().id`)
`dbl` 12 luồng **ánh sáng** · `lh` **đao khí** đỏ xoáy + **lửa** nổ + nứt đất · `nq` rừng cọc **băng** · `thd` **vạn lôi** (nhiều tia sét ngẫu nhiên) · `dl` mưa tên **độc** (vũng độc + bọt) · `nb` thành đồng **vòng năng lượng** + **gió** đẩy ra · `ltk` hai nhát **kiếm quang** xé chéo + nổ ánh sáng. Tướng mới chưa có mẫu → hiệu ứng vàng mặc định.

## Kẻ địch & môi trường chiến đấu
- Đạn kẻ địch: lõi tối + viền đỏ + vệt đuôi theo chủ đề map (độc ở forest/swamp, băng ở river/sea/snow, lửa ở volcano/desert, tím ở shadow/void, vàng ở heaven) → **luôn khác** hiệu ứng của ta.
- Vùng báo đòn: viền nét đứt xoay + vòng thu vào + dấu ✕ (giữ đúng bán kính sát thương). Thiên thạch có quả cầu lửa rơi ở nửa giây cuối, chạm đất nổ lửa; slam nứt đất + bụi.
- Quái tự nổ (`boom`), hồi máu, Boss gục (nhiều vụ nổ chồng nhịp + vòng sáng) đều có hiệu ứng riêng.

## Chống rối mắt
- Trần số hiệu ứng / hạt theo đồ hoạ: Thấp 48/110 · Vừa 96/240 · Cao 150/420 (tuyệt kỹ được vượt 1.6×).
- Ngân sách hit-effect mỗi khung hình: 4 / 8 / 14; vượt ngân sách chỉ còn 1 hạt nhỏ. Cú "dọn sạch" 9999 không sinh hiệu ứng.
- Loé sáng tuyệt kỹ/Boss chỉ là **quầng quanh nhân vật** (bán kính 300px, độ mờ ≤ 0.3), không còn phủ trắng toàn màn hình.
- Hiệu ứng tan nhanh (0.2–0.7s), dùng nét mảnh/hình thấu kính; chùm tia tuyệt kỹ mỏng và tắt dần theo bình phương.
- Đồ hoạ Thấp: không cộng sáng (`lighter`), ít hạt, đuôi ngắn, rung 60%.

## Rung màn hình nhẹ
`DV_VFX.shake(v)` dùng lại `G.shake` có sẵn (tối đa 0.6 ≈ 4px, tắt dần trong ~0.2s): Hàng Long 0.2–0.3 · Lôi Động 0.1–0.2 · nổ 0.2–0.32 · tuyệt kỹ 0.5 · Boss gục 0.6 (trước đây 1.0). Tự tắt khi hệ thống bật *giảm chuyển động*.

## Móc nối (tối thiểu) — `index.html`
Nạp `js/vfx.js`; `const VF=…`; `skills()` (đặt `G.src` nguồn đòn, đạn Kiếm Khí mang `k:'kiem'`, gọi `VF.bolt/palm/cast`); `hit()` (→ `VF.onHit/kill/bossDie`); `upd()` (→ `VF.update`); `draw()` (→ `VF.ground/air/proj/phi/ep/zone/flash`); `ult()`, `boom()`, `healP()`, `zoneUpd()`, `drawTel()`. Hook debug thêm `ult`, `VF`.

## Kiểm thử
`python3 tests/vfx_test.py OUT [0|1|2]` — chụp 15 kịch bản (4 kỹ năng ± tiến hoá, 7 tuyệt kỹ, đạn/vùng báo đòn theo chủ đề) ở 3 mốc thời gian, ghép `sheet_*.png`, báo lỗi JS. Đã chạy sạch lỗi ở cả 3 mức đồ hoạ, và qua 3 trận Boss (chương 1, 25, 38) gồm cả cảnh Boss gục.
