# Phase 15 — Nâng cấp đồ hoạ MÀN CHƠI (`js/map15.js` → `window.DV_MAP15`)

Chỉ thêm lớp hình ảnh/HUD bọc lên `DV_ENV` (Phase 6). **Không đổi** sát thương, AI, chỉ số quái/Boss, điều kiện qua màn, mở khoá,
điều khiển, dữ liệu lưu, Skill. Xoá thẻ `<script src="js/map15.js">` là game về đúng Phase 6–14. Module tự tắt nếu có lỗi vẽ.

Engine là Canvas 2D **top-down** (nền lát tile 64px, vật thể y-sort), nên "chiều sâu" được làm bằng khói mù theo tầng, tiền cảnh thị sai ở rìa
và ánh sáng cục bộ — không phải parallax cuộn ngang.

## Đã làm
| Hạng mục | Nội dung |
|---|---|
| Nền liền mạch | `environment.js`: giảm lệch sáng từng ô (×0.35) — nguyên nhân hiệu ứng "bàn cờ". `map15.js`: 2 lớp mottle bake sẵn (448/640px, lặp liền), cuộn theo thế giới ở tốc độ khác nhau |
| Chiều sâu | Khói mù hậu cảnh (đỉnh màn) + tối nhẹ tiền cảnh (đáy); **tiền cảnh thị sai ×1.32** chỉ ở rìa màn hình (không che giữa): lá/cành (rừng, đồng, sông, đầm), đá (núi, thung lũng, núi lửa, ma giới), tinh thể phát sáng (hang, hư không), cành phủ tuyết, mây (thiên giới, biển, sa mạc), mái hiên + đèn lồng (thành trì) |
| Môi trường sống động | Hạt nền theo chủ đề: lá bay theo gió, đom đóm/linh quang/tàn lửa/tia băng nhấp nháy, bụi cát; gió thay đổi chậm. Đèn lồng đỏ **đung đưa + phát sáng** trên cột cờ; quầng sáng lửa lò, tinh thể, băng, dung nham, totem (cường độ theo buổi trong ngày) |
| Boss | Hào quang dưới đất (quầng + vòng rune xoay + 8 điểm sáng), màu theo chủ đề, mạnh dần khi Boss mất máu; vẽ *dưới* quái nên không che tín hiệu |
| Bắt đầu màn | Fade từ đen + banner: `CHƯƠNG n · tên chương` / tên khu / `Màn n-i · loại ải` + buổi, thời tiết, địa hình (đọc từ dữ liệu thật). Cũng cho Bí Cảnh, Boss Thế Giới |
| Hoàn thành màn | Tia sáng xoay, quầng vàng, "HOÀN THÀNH ẢI", tia lửa — phủ lên màn kết quả (màn kết quả/sao/thưởng giữ nguyên) |
| HUD | Khung avatar, thanh máu/năng lượng/EXP có bóng, nền mờ cho khối chỉ số (đọc rõ trên nền sáng), khung tên Boss "✦ BOSS ✦". Không xoá/đổi chức năng nào, không thêm số liệu giả |

## Hiệu năng & dọn dẹp
- Mức đồ hoạ Thấp/Vừa/Cao (`Q()`): hạt 0/14/28 · tiền cảnh tối đa 3/5/8 · mức Thấp bỏ lớp mottle thứ 2 và mọi quầng additive.
- Sprite glow/tiền cảnh/mottle bake một lần mỗi khu; hạt dùng pool cố định; gradient khói mù được cache theo kích thước.
- `prefers-reduced-motion`: tắt đung đưa và trôi theo camera.
- `DV_MAP15.end()` (gọi trong `finish()`) giải phóng canvas, hạt và tham chiếu `G`.

## Chưa làm / ngoài phạm vi engine hiện tại
- Parallax nhiều lớp cuộn ngang, cầu gỗ/vực sâu, thác nước, nhà ngói cổ trấn: cần bản đồ/asset mới, engine top-down không có khái niệm này.
- Animation quái/boss (di chuyển, đòn, hạ gục), hoạt cảnh Boss, giai đoạn Boss: đã có ở Phase 9, 12-P4 (Boss Thế Giới 3 giai đoạn) — không sửa để không đổi AI/độ khó.
- Chọn màn / bản đồ chương (trạng thái khoá, sao, hạng, thưởng): đã có ở Phase 8 (`js/chmap.js`) — không sửa.
- Chuyển cảnh giữa các màn: đã có Loading Screen Phase 13; Phase 15 thêm fade + banner khi vào màn.

## Kiểm thử
- `python3 tests/map15_test.py [shots DIR]` — 15 chủ đề × (thường + Boss): banner, hào quang, tiền cảnh, hiệu ứng thắng, dọn tài nguyên, đo ms/khung bật/tắt.
- `python3 tests/sweep15.py A B` — quét chương A..B-1 × 6 màn (có chờ Loading): ván chạy, Boss xuất hiện, vẽ không lỗi, Phase 15 không tự tắt.
- Lưu ý: `tests/env_test.py`, `smoke_all.py`, `test_progress.py` đã hỏng từ Phase 13 (gọi `begin` đồng bộ trong khi Loading là bất đồng bộ) — không do Phase 15; mẫu chờ đúng nằm trong hai bài test mới.
