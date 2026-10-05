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

## v2.4.0 — Nâng cấp Phase 4: EXP/Level cap · Card animation · Skill data · Tiến Hoá
- `data/progression.js`: trần cấp **trong ván = 40** (đường cong EXP giữ nguyên tới cấp 15, sau đó chậm lại); đạt trần thì orb EXP đổi thành vàng, HUD hiện **MAX**. Trần cấp **Tướng theo sao**: 0★ = 30 … 5★ = 55; EXP dư khi đã MAX đổi thành vàng (÷20). Thiếu file → dùng cấu hình dự phòng trong `index.html`.
- `data/skills.js`: bảng võ công tách khỏi code (thêm/chỉnh võ công không cần sửa `index.html`). Mỗi võ công tấn công có khối `evo` (điều kiện + hệ số).
- **Tiến Hoá** (`showLevel`): võ công đạt Lv.5 + võ công hỗ trợ đủ cấp → thẻ vàng "TIẾN HOÁ" luôn xuất hiện ở vị trí đầu. Kiếm Khí+Khinh Công 3 → Vạn Kiếm Quy Tông · Lôi Động+Hộ Thể 2 → Thiên Lôi Giáng Thế · Hàng Long+Hộ Thể 3 → Kháng Long Hữu Hối · Phi Kiếm+Khinh Công 2 → Phi Kiếm Trận. Thẻ thường Lv.4→5 có gợi ý điều kiện; Thư viện võ công hiện mô tả tiến hoá.
- **Card animation**: thẻ lật/trượt vào lần lượt, ánh sáng quét, icon lơ lửng; chọn thẻ → thẻ phóng sáng, thẻ còn lại mờ dần (330ms) rồi mới áp dụng; thẻ Tiến Hoá viền vàng nhịp thở. Tự tắt khi đồ hoạ Thấp hoặc hệ thống bật giảm chuyển động.
- Save không đổi cấu trúc (không cần migrate).

## v2.3.0 — Nâng cấp Phase 3: Wave + Spawn Director
- `data/waves.js` (data-driven): mỗi loại ải (`n/e/t/b/v`) có danh sách Wave (khoảng thời gian, pool quái + trọng số, mật độ, nhịp spawn, mẫu spawn ring/burst/line/swarm) và Event (elite / tiểu boss). Có mẫu `long8` (ải 8 phút) cho Phase 7. Thiếu file → game dùng cấu hình dự phòng.
- Spawn Director thay khối spawn cũ: mật độ nhân theo level/lực chiến, giảm khi có Boss, **Safe Zone** (spawn ≥ nửa đường chéo màn hình + 40, tối thiểu 280px), quái bị bỏ lại quá xa (>780px) được đưa về vòng spawn.
- **Trần quái theo đồ hoạ**: Thấp 80 / Vừa 120 / Cao 170 (trước đây cố định 170).
- **Object Pooling** cho quái và hạt (tái dùng đối tượng, bỏ `.filter` tạo mảng mới mỗi frame).
- Elite (vòng sáng + thanh máu, rơi 3 vàng) và Tiểu Boss (rơi 6 vàng); HUD hiện "Đợt x/y".
- Boss ải Boss xuất hiện theo `bossAt` của data (mặc định 75s như cũ).

## v2.2.0 — Nâng cấp Phase 2: Combat + Movement
- Di chuyển có gia tốc/giảm tốc (mượt, không giật), người chơi và quái **va chạm với đá địa hình** (cùng điều kiện với hình vẽ).
- Quái không còn chồng lên nhau (tách bằng lưới băm, boss không bị đẩy). `near()` lọc theo tầm đánh `ATK_RNG` và sort theo bình phương khoảng cách.
- Hit reaction: quái nảy/bẹp nhẹ khi trúng đòn (cộng thêm knockback + hit flash có sẵn).
- Xoá `renderMap` bản cũ bị trùng (code chết). Thêm hook debug `?debug` → `window.__dv` (chỉ để test).
- Bản gốc trước khi nâng cấp: thư mục `orig/` (ngoài project).

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
