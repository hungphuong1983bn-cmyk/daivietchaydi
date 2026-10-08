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


## Phase 5 — 52 chương × 6 màn (data-driven)

- `data/monsters.js` — quái, Elite, Mini Boss, bộ cơ chế Boss (8 cấp), sự kiện, bản đồ. Thuần dữ liệu.
- `data/chapters.js` — `DV_DATA.rules` (mọi hằng số cân bằng) + bảng 52 chương + bộ dựng Stage/Wave/Timeline/Reward/3 sao + `DV_DATA.validate()`.
- Engine (`index.html`) chỉ đọc `DV_DATA.getStage(c0, i)` / `getChapter(c0)`; không có màn nào hard-code. Màn sự kiện `v` vẫn dùng `waveSets.v` cũ.
- Tài liệu bảng chương: `docs/PHASE5_CHAPTERS.md` (sinh tự động).
- Kiểm tra dữ liệu: `node -e "console.log(require('./tests/load.js').validate())"`.
- Test trình duyệt (cần Playwright): `tests/smoke_all.py` (312 màn), `tests/test_progress.py` (mở khoá/thưởng/sao), `tests/batch.py 1,10,20 1,6 god` (mô phỏng toàn màn bằng bot), `tests/mortal.py` (bot không bất tử). Mở game với `?debug` để bật hook `window.__dv`.
- Hiệu chỉnh HP Boss: `rules.boss.dpsRef` (DPS đo bằng bot theo lực chiến khuyến nghị) × thời lượng chiến đấu × `rules.boss.ttk`.


## Phase 6 — Map & Môi trường

52 khu vực với nền, địa hình, thời tiết, ánh sáng, đấu trường Boss và hiệu ứng môi trường riêng. Xem `docs/PHASE6_ENVIRONMENT.md`. Kiểm thử: `python3 tests/env_test.py` (và `... shots DIR` để chụp ảnh từng khu).


## Phase 7 — Character System

7 nhân vật có hồ sơ đầy đủ (chỉ số, vũ khí, nội tại, 3 kỹ năng, tuyệt kỹ, Thức Tỉnh ×3, Thăng Giai ×5, trạng thái MAX), nhận diện hình dáng riêng và 8 animation. Toàn bộ nằm trong `data/characters.js`; engine `js/character.js`. Mở Hồ sơ: **Tướng → 📜 Hồ sơ · Tiến hoá**. Xem `docs/PHASE7_CHARACTER.md`. Kiểm thử: `python3 tests/char_test.py`. Hệ thống tướng cũ giữ nguyên; thiếu file mới thì game dùng hình/chỉ số cũ.


## Phase 8 — Main Menu & UI
`js/home.js` (cảnh parallax, banner chương, thoại nhân vật, màn Loading) · `js/charselect.js` (chọn nhân vật vuốt ngang: Thuộc tính / Võ công / Trang bị, nối Hồ sơ Phase 7) · `js/chmap.js` (bản đồ võ lâm 52 chương: khoá / hiện tại / hoàn thành, sao, hạng S-A-B-C, thưởng). Chạm một chương → mở bản đồ màn của chương đó như cũ. Thiếu module → game dùng giao diện cũ.


## Phase 9 — Art Pass Q版 Võ Hiệp
Nhân vật Q版 (`js/chibi.js`: mặt riêng, trang bị đổi hình theo phẩm chất, hiệu ứng lên cấp/học võ công/nâng cảnh giới) và quái theo chương (`js/monsterart.js`: 15 chủng tộc × 14 vai trò × biến thể từng chương, hiệu ứng xuất hiện/bị đánh/tiêu diệt). Gameplay và dữ liệu không đổi; thiếu file → dùng hình cũ. Xem `docs/PHASE9_ART.md`.


## Phase 10 — VFX chiến đấu
`js/vfx.js` (`DV_VFX`): mỗi kỹ năng một hình + màu riêng (Kiếm Khí · Lôi Động · Hàng Long Chưởng · Phi Kiếm, kèm biến thể Tiến Hoá), 7 tuyệt kỹ theo tướng (ánh sáng/đao khí+lửa/băng/sét/độc/vòng năng lượng+gió), hit effect theo nguồn đòn, vệt đuôi đạn, vụ nổ, đạn & vùng báo đòn của kẻ địch theo chủ đề, rung màn hình nhẹ. Có trần hiệu ứng theo đồ hoạ và không phủ kín màn hình. Thiếu file → dùng hiệu ứng cũ. Xem `docs/PHASE10_VFX.md`. Kiểm thử: `python3 tests/vfx_test.py OUT [0|1|2]`.


## Phase 12 — Part 1: Ải Tinh Anh + Quét Ải
`data/modes.js` (`DV_DATA.modes`) + hook trong `index.html`. Màn đạt 3★ mở **QUÉT ẢI** (×1/×n) và **ẢI TINH ANH** (quái/Boss mạnh hơn, thưởng hiếm hơn, ⚡10, 3 lượt/màn/ngày). Xem `docs/PHASE12_AUDIT.md` (kiểm kê hệ thống + lộ trình các phần còn lại). Test: `python3 tests/test_modes.py`.

## Phase 12 — Part 2: Main Menu + Hồ sơ tướng
`js/herodata.js` (`DV_HERO.record`) gom hồ sơ 19 trường cho từng tướng; Main Menu thêm dải Nhiệm vụ/Sự kiện/Chưa nhận, 7 ô trang bị, nút VÀO GIANG HỒ, Môn phái, Bí cảnh và chấm đỏ mới. Xem `docs/PHASE12_P2_MENU_HERO.md`. Test: `python3 tests/test_menu.py`.
