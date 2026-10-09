# Phase 12 · Part 4 — Bí Cảnh · Thử Luyện Sinh Tồn · Boss Thế Giới

Nút **🌀 Bí cảnh** ở Main Menu mở một hub 3 tab (`js/realm.js`, `DV_RIFT`). Số liệu thuần ở `data/realm.js` (`DV_DATA.realm`),
logic nối engine ở khối `PHASE 12 · PART 4` trong `index.html`. Không thêm dữ liệu quái mới: mỗi tầng / mỗi đợt là **bản sao có hệ số của màn thường**
(`getStage(chương, 3)`), nên mọi chỉnh sửa Phase 5 tự lan sang.

## IV. Bí Cảnh — 7 loại × 10 tầng
| Loại | Mở khi mở chương | Thưởng nổi bật |
|---|---|---|
| ⛏ Hắc Thiết Quật | 1 | Tinh thiết ×3.5 |
| 💰 Tụ Bảo Động | 2 | Vàng ×4 |
| 🧘 Thiên Địa Lò | 3 | EXP tướng ×4 |
| 🔮 Hồn Tướng Điện | 4 | Hồn tướng ×4 |
| ⚔ Binh Khí Trủng | 6 | +2 trang bị, phẩm chất cao |
| 🔶 Phù Văn Các | 8 | **Phù Văn Thạch** 🔶 (tiền tệ mới) |
| 💎 Thiên Cơ Các | 11 | Kim cương, quái khó hơn ×1.15 |

* Mỗi tầng ~70s; **Thủ Hộ** xuất hiện lúc 48s, hạ Thủ Hộ = qua tầng. Tầng **5 và 10** dùng Boss đầy đủ của chương, thưởng ×1.5.
* Quái theo chương cao nhất đã mở; hệ số tầng HP ×0.85 → ×2.38, ST ×0.9 → ×1.53.
* **Luật tầng** (cố định theo loại+tầng): 0 luật ở tầng 1, 1 luật tầng 2–4, 2 luật tầng 5–8, 3 luật tầng 9–10. 9 luật: Cuồng Phong, Thiết Giáp, Thú Triều, Thiên Thạch, Phục Kích, Huyết Nộ, Thể Yếu, Phúc Địa, Tinh Anh Đông.
* Vào tầng ⚡8; **5 lượt/ngày/loại** (dùng chung giữa Vào và Quét). Phải qua tầng n−1 mới vào tầng n.
* **Quét** tầng đã qua: ⚡5/lần, tối đa ×5, không có thưởng lần đầu. Lần đầu qua tầng: +💎 và +1 trang bị.
* Không đụng sao / clear / mở chương của ải thường (guard `ST.x` trong `clr()`, `finish()`).
* Phù Văn Thạch dùng để nâng Phù Văn **thay cho 🪙+⚙** (3/8/18/35/70 cho cấp 1…5) — nút 🔶 xuất hiện ở tab Phù Văn khi có thạch (Part 3 đã hứa nguồn rơi ở Bí Cảnh).

## V. Thử Luyện Sinh Tồn (vô tận)
* Không giới hạn thời gian, không Boss cuối, 45 phút quái được dựng sẵn (90 đợt × 30s), cứng dần theo hàm bậc hai; Tinh Anh/Mini-boss/sự kiện lặp theo chu kỳ.
* **4 cấp** Đồng/Bạc/Vàng/Huyền (quái ×0.8…×1.7, thưởng ×1…×3.5). Mở cấp kế khi sống ≥ 240s/420s/600s ở cấp trước. Vào ⚡6, **không giới hạn lượt**.
* **Bảng nâng cấp % ngẫu nhiên**: mỗi lần lên cấp rút 3 thẻ gồm 1–2 thẻ võ công (+ thẻ tiến hoá nếu có) và thẻ %. 11 chỉ số × 4 độ hiếm (60/28/10/2, nghiêng dần về hiếm khi lên cấp cao). Có trần: bạo kích 75%, giảm sát thương 60%.
* **Rút lui** trong menu tạm dừng vẫn nhận thưởng (thưởng theo thời gian sống + số quái). 8 mốc thưởng 💎 lần đầu (3:00 → 30:00) mỗi cấp; các mốc 8/16/30 phút tặng thêm trang bị.

## VI. Boss Thế Giới (Hắc Long)
* 90s gây sát thương, 3 giai đoạn **theo thời gian**: 0–30s, 30–60s, 60–90s (Boss 1e9 HP không chết nên không dùng mốc máu).
* GĐ1 đạn tỏa + vòng đạn · GĐ2 **vùng nguy hiểm** (`rain`: nhiều vòng đỏ có báo trước, kind mới trong engine) + đập đất + triệu hồi · GĐ3 đạn xoắn, lao tới, mưa vùng đỏ dày, cuồng nộ.
* 8 hạng (Tân Binh → Võ Thần) theo sát thương tốt nhất trong ngày. **Mốc hạng ×(1+0.1·số chương đã mở)**. Nhận thưởng hạng 1 lần/ngày. BXH vẫn là mô phỏng cục bộ (chưa có máy chủ).

## Sửa lỗi có sẵn phát hiện trong lúc làm
* **`startWB()` cũ không bao giờ vào chế độ Boss khi chạy thật.** Nó gọi `start()` rồi kiểm tra `run` ngay, nhưng màn Loading chạy bất đồng bộ (~0.9s) nên `G.wb` không được đặt: Boss thế giới biến thành một ván thường. Test cũ che lỗi vì stub Loading đồng bộ. Đã sửa bằng cờ `ST.wb` đặt trong `start0()`. Test mới `test_realm.py` mục L chạy **Loading thật**.
* `tests/test_progress.py` thiếu stub Loading nên hỏng trên bản gốc → đã thêm đúng dòng stub của `test_modes.py`.

## Thay đổi engine (tối thiểu, đều có guard)
`dbStage` (dựng stage x), `hurt` ×2 (`G.hin`, `G.dr`), nhặt orb (`G.mg`, `G.xg`), nạp tuyệt kỹ (`G.ec`), hồi khí (`G.rgn`), `abil` (giai đoạn Boss TG + kind `rain`), `spawnBoss` (thực thể Boss TG), `finish` (thưởng x), `stc/start/start0`, HUD, `showLevel/pickCard` (thẻ %), nút Rút lui. Save: thêm `rf`, `tr`, `rs`, `wbr` — gộp mặc định bằng `dm()`, **không đổi `sv.v`** (vẫn v4).

## Kiểm thử
* `tests/test_realm.py` — 89 kiểm tra (UI, Loading thật, thắng/thua, lượt/ngày, quét, 7 loại, luật tầng, thẻ %, Thử Luyện, rút lui, 3 giai đoạn Boss, hạng/thưởng, Phù Văn Thạch).
* `tests/realm_balance.py` — thăm dò cân bằng bằng bot **không bất tử** (trang bị = lực chiến khuyến nghị).
* `tests/load_realm.js` — nạp `DV_DATA.realm` trong node.
* Hồi quy: `test_menu` 27 · `test_modes` 23 · `test_upgrade` 44 · `test_progress` 24 đều đạt.

## Chưa kiểm chứng / cần tinh chỉnh với người chơi thật
* **Cân bằng chỉ đo bằng bot** (né tạm được, đánh kém). Bot ở chương 1 thắng tầng 1 và 5, **thua tầng 10** (cố ý khó); Boss TG bot sống đủ 90s nhưng GĐ3 mất 40–77% máu. Con số thật của người chơi có thể khác nhiều.
* **Mốc hạng Boss** hiệu chỉnh theo sát thương của bot (~2.4k ở chương 1, ~8k ở chương 30), người chơi thật có thể cao hơn nhiều. Chỉnh ở `RANKS` / `rankMin`.
* Thưởng Bí Cảnh/Thử Luyện chưa đối chiếu với kinh tế dài hạn; chỉnh ở `DV_DATA.realm.rules`, `types[].mul`, `MILE`, `TIERS`.
* Chưa thử trên thiết bị thật (chỉ Chromium 420×800), chưa kiểm tra hiệu năng khi nhiều vòng đỏ trên máy yếu.
* `smoke_all.py` còn lỗi sẵn có ở màn 1-01 (cùng nguyên nhân Loading) — không do Part 4.
