# Đại Việt Chạy Đi

Game kiếm hiệp roguelike sinh tồn (HTML/JS thuần, không cần build).

## Chạy game
```bash
python3 -m http.server 8080   # rồi mở http://localhost:8080/index.html
```
- `index.html` — toàn bộ game. Admin: `admin-dai-viet.html` (cũng mở được từ Cài đặt).
- Game và Admin dùng chung `localStorage` (khoá `dvcd*`) nên phải mở cùng một địa chỉ/origin.

## Điều khiển
Kéo ngón tay hoặc WASD/mũi tên để di chuyển · võ công tự đánh · `Space`/`Q`: tuyệt kỹ · `P`/`Esc` hoặc nút ⏸: tạm dừng.

## Cấu trúc
`index.html`, `admin-dai-viet.html`, `manifest.webmanifest`, `assets/` (ảnh), `icons/`.
Game thủ thành Hoa Lư cũ (js/, css/, shared/, admin/, test/, vendor/) đã được gỡ bỏ.

## v2.1.0 — HOME / Bản đồ chương / Nhiệm vụ / Sự kiện
- HOME mobile: avatar+EXP, vàng/kim cương/thể lực, Hero động giữa màn hình (idle, aura, hạt sáng, bóng; bấm để ra đòn), icon hoạt động có badge đỏ, nút CHIẾN ĐẤU, thanh điều hướng dưới.
- Bản đồ 6 chương (Hoa Lư → Tây Đô), mỗi chương 6–7 node: Thường ⚔ / Elite ⭐ / Kho báu 🎁 / Sự kiện 🔥 / Boss 👹. Khoá tuần tự, hạ Boss mở chương kế. Mỗi loại màn có luật thắng riêng.
- Nhiệm vụ: Chính (theo chương) / Ngày / Tuần / Thành tựu, nút ĐI TỚI, hoạt lực + mốc thưởng.
- Sự kiện: banner + đếm ngược, tab Tổng quan/Nhiệm vụ/Phần thưởng/BXH, Hoa Lư Token + đổi quà, Boss thế giới Hắc Long.
- Save: `sv.v` = 3, tự migrate (chương đã mở được đánh dấu hoàn thành).

## Thay đổi v2.0.0
- Gỡ toàn bộ game thủ thành; bỏ liên kết vòng về chính `index.html`.
- Sửa link Admin → game (trỏ tới file không tồn tại).
- Thêm manifest/icon (cài PWA), tạm dừng + tự dừng khi chuyển tab.
- Sự kiện (Boss thế giới, Đua sát thương, Đại lễ) và Battle Pass tự lăn theo tháng thay vì hết hạn 31/10/2026; tiến độ reset theo tháng, thưởng hạng nhận được trong 3 ngày cuối tháng. Admin dùng cùng mặc định.
- Ngày reset nhiệm vụ/điểm danh theo giờ địa phương (trước đây theo UTC, lệch 7 giờ).
- Sửa: đánh Boss thế giới làm sai "kỷ lục sống sót"; thắng khi vừa chết; hộp thoại treo máy hiện giữa trận; số % tướng lẻ.
- Thiếu ảnh `it_n*`/`it_f*` (găng, giày): tự dùng biểu tượng emoji.
