# Phase 12 · Part 6 — Cảnh Giới (10 bậc) + Môn Phái

Nút **☯ Môn phái** ở Main Menu mở hub 3 tab (`js/sect.js`, `DV_SECT`): **🏯 Môn Phái · 📜 Tuyệt Học · ☁ Cảnh Giới**.
Số liệu thuần ở `data/sect.js` (`DV_DATA.sect`, kiểm bằng node: `node -e "console.log(require('./tests/load_sect.js').validate())"`).
Thiếu file → game chạy như cũ, nút Môn phái báo "đang phát triển".

> **Hai khái niệm khác nhau.** *Thức Tỉnh/Thăng Giai* (Phase 7) vẫn là **dạng hình** của tướng. *Cảnh giới* (Part 6) là **10 bậc tu luyện** mới.
> Main Menu hiện `Cảnh giới: <bậc> · <dạng hình>`.

## Cảnh Giới — theo TỪNG TƯỚNG (`sv.cg[heroId]` = 0…9)
Phàm Nhân → Luyện Thể → Luyện Khí → **Trúc Cơ** → **Kết Đan** → Nguyên Anh → **Hoá Thần** → Luyện Hư → **Đại Thừa** → **Độ Kiếp** (đậm = "đại cảnh giới" có hiệu ứng trong ván).

* Đột phá **tuần tự**, **xác định** (không may rủi). Cần: cấp tướng, số chương đã mở, 🪙 + ⚙ Tinh thiết + 🔮 Hồn tướng.
* Cấp tướng cần: 5/10/15/20/25/30/38/46/54 — các bậc cuối **buộc phải tăng ★** (trần cấp 0★=30 … 5★=55): Luyện Hư ≥2★, Đại Thừa ≥4★, Độ Kiếp 5★.
* Chi phí 🪙: 1.5k → 500k (tổng ≈ 1,08M) · ⚙: 5 → 500 · 🔮: 0 → 120.
* **Bonus cộng dồn** các bậc đã đạt. Đủ 9 bậc: Công +30%, Sinh lực +260, Tốc độ +7%, Bạo kích +7%, Né +6%, ST bạo kích +50%.
* **Trong ván** (cộng dồn): Trúc Cơ tầm hút đồ ×1.25 · Kết Đan hồi máu 0.3%/s · Hoá Thần EXP ×1.10 · Đại Thừa nạp tuyệt kỹ ×1.15 · Độ Kiếp giảm sát thương 5% + hồi 0.2%/s.

## Môn Phái — theo TÀI KHOẢN (`sv.sc`)
Mở khi mở tới **chương 2**. Gia nhập **1 phái** (lần đầu miễn phí). Mỗi phái cộng chỉ số cho **mọi tướng**; tướng **hợp phái** nhận ×1.25.

| Phái | Sở trường | Hợp phái |
|---|---|---|
| 🗡 Tây Sơn Đao Môn | Công · Bạo kích | Đinh Bộ Lĩnh, Lý Thường Kiệt |
| 🕊 Bạch Hạc Quyền Phái | Tốc độ · Né | Ngô Quyền, Đinh Liễn |
| ⛰ Tản Viên Sơn Phái | Sinh lực · Giảm sát thương | Lê Hoàn, Nguyễn Bặc |
| ⚡ Long Quân Lôi Môn | ST bạo kích · Công | Trần Hưng Đạo, Lý Thường Kiệt |
| 🌸 Âu Cơ Bách Hoa Cốc | Hồi máu · EXP · Hút đồ | (hỗ trợ — không hợp riêng ai) |

* **Cống Hiến**: điểm danh +20/ngày · 3 nhiệm vụ ngày (+15/+20/+25, tiến độ lấy từ bộ đếm nhiệm vụ ngày `sv.qd.D`: `games/wins/kills`) · quyên góp 2.000🪙 → +10, tối đa 10 lượt/ngày. Kịch bản đủ việc ≈ 130/ngày.
* **Cấp phái 1–10** theo Cống Hiến TỔNG (ngưỡng 0/50/130/250/420/650/950/1350/1850/2500); mỗi cấp cộng `lvE` của phái.
* **4 Tuyệt Học/phái**, học **tuần tự** bằng Cống Hiến hiện có (60/150/320/600), cần phái cấp 1/3/6/9. Có hiệu ứng chỉ số, một số có hiệu ứng trong ván.
* **Đổi phái** tốn 💎50; tiến độ mỗi phái (`sv.sc.p[id] = {t,c,l}`) **giữ riêng**, quay lại không mất gì.
* Mọi thứ reset theo **ngày địa phương** (`dk()`), không cần máy chủ.

## Nối vào engine (tối thiểu, đều có guard)
* `bon()` cộng `DV_DATA.sect.realmBonus(sv.cg[sv.hs])` + `sectBonus(sv.sc, sv.hs)` → lực chiến (`pwr()`), Nâng cấp tướng, Hồ sơ **tự cập nhật**.
* `newGame()`: sau `dbStage(S)` gộp `DV_DATA.sect.run(...)` vào `G.rgn / G.xg / G.mg / G.ec / G.dr` (các trường đã có từ Part 4; giảm sát thương tổng chặn 60%).
* Main Menu: nhãn Cảnh giới (`heroshow.js`), chấm đỏ nút Môn phái (`bdg().sc`: chưa gia nhập / điểm danh / nhiệm vụ nhận được / học được Tuyệt Học / có tướng đột phá được).
* `DV_HERO.record(id)` thêm trường phụ `cg {step,name,icon,max}` (không đổi 19 trường gốc `FIELDS`).
* Save: thêm `cg`, `sc` — gộp mặc định bằng `dm()`, **không đổi `sv.v`** (vẫn v4); save cũ tự bổ sung (đã test).

## Kiểm thử
`python3 tests/test_sect.py` — 48 kiểm tra (dữ liệu thuần, migrate, khoá chương, gia nhập/điểm danh/nhiệm vụ/quyên góp/reset ngày, Tuyệt Học tuần tự, ×1.25 hợp phái, đổi phái, đột phá 0→9, thiếu cấp/chương/vàng, cảnh giới riêng từng tướng, hồ sơ + menu, chấm đỏ, hiệu ứng trong ván).
Hồi quy đạt: `test_menu` (đã sửa 1 dòng: nút Môn phái nay mở hub thay vì báo "đang phát triển") · `test_modes` · `test_upgrade` · `test_progress` · `test_realm` · `showcase_test`.

## Chưa kiểm chứng / cần tinh chỉnh
* **Cân bằng chưa đo bằng người chơi hay bot.** Mới chỉ so tổng: Cảnh giới Độ Kiếp (Công +30%) và phái max (Tây Sơn hợp phái: Công +21%, Bạo kích +11%) cùng cỡ tổng Võ học (Công +23%, Bạo kích +14%). Cộng cả ba, tướng 5★ cuối game mạnh hơn rõ → có thể cần hạ `e` ở `realms[]`/`sects[]` hoặc tăng `recommendedPower` của chương cuối. Chỉnh ở `data/sect.js`.
* Chi phí vàng/tinh thiết/hồn và tốc độ Cống Hiến chưa đối chiếu kinh tế dài hạn (`realms[].c`, `rules`).
* Hiệu ứng trong ván mới kiểm bằng giá trị `G.*` và hồi máu; chưa đo cảm giác `mg/ec` trên thiết bị thật (chỉ Chromium 420×860).
* **Không có nhiệm vụ riêng của phái, không có Boss/sự kiện phái, không có PvP phái** — chỉ là Cống Hiến từ điểm danh/nhiệm vụ ngày/quyên góp. Chưa có "Thiên Kiếp" là trận chiến; đột phá là bấm nút.
* `test_realm.py` từng báo 1 lần FAIL ở mục "Menu tạm dừng Thử Luyện có nút RÚT LUI", chạy lại 2 lần đều đạt và bản gốc cũng đạt — nghi **flake do thời gian**, chưa tìm được nguyên nhân.
* Lưu ý khi viết test: `heroshow` chỉ vẽ lại bảng thông tin khi không có lớp phủ (thẻ "TƯỚNG MỚI", hiệu ứng lên cấp). Bơm tướng vào save bằng tay sẽ bật thẻ này và che hub → lưu rồi nạp lại trước khi kiểm tra menu.
