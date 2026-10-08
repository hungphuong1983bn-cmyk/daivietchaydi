# Phase 12 — Kiểm kê hệ thống & lộ trình (trước khi nâng cấp)

Phân tích dựa trên mã nguồn thực tế của bản `phase12-progress-vfx` (index.html + data/ + js/).

## A. Đã có — tái sử dụng, KHÔNG làm lại
| Hệ thống | Nằm ở | Ghi chú |
|---|---|---|
| 52 chương × 6 màn (312 màn), Wave/Elite/MiniBoss/Boss/Reward/3 sao | `data/chapters.js`, `data/monsters.js` (`DV_DATA.getStage/getChapter/validate`) | Đủ trường yêu cầu mục I: id, tên, khu vực, thời lượng, đợt quái, loại/số quái, EXP, vàng, rơi, Boss + cơ chế, điều kiện mở khoá, lực chiến đề xuất, thưởng, 3 sao. Bot test thắng cả 312 màn |
| Bản đồ chương + khoá theo ★ + nút CHIẾN ĐẤU | `js/chmap.js`, `sheetDB()` | Mở chương kế khi hạ Boss + đủ ★ |
| 52 môi trường (nền, địa hình, thời tiết, arena Boss) | `data/environments.js`, `js/environment.js` | |
| Quái theo chương, Boss riêng | `js/monsterart.js` | |
| 7 tướng độc lập: chỉ số, 3 kỹ năng, tuyệt kỹ, Thức Tỉnh ×3, Thăng Giai ×5, skin theo dạng | `data/characters.js`, `js/character.js`, `js/chibi.js` | |
| Main Menu vẽ đúng tướng đang chọn + hiệu ứng tiến bộ + nâng cấp ngay trên menu | `js/home.js`, `js/charselect.js`, `js/heroshow.js` | Đã đúng yêu cầu mục XII/XXI phần "đúng tướng" |
| Chiến đấu roguelike trong trận (lên cấp chọn thẻ võ công, cộng dồn, Tiến Hoá) | `index.html` (`showLevel`, `data/skills.js`) | Mỗi ván đã là một build ngẫu nhiên |
| Võ học (nâng võ công toàn cục), trang bị 7 loại (w,a,h,b,r,n,f) 4 phẩm chất, nâng cấp, Tinh thiết | `VH`, `PER`, `SLOT`, `renderInv` | **Lưu ý: game có 7 ô, yêu cầu ghi 6 ô** — cần quyết định |
| Triệu hồi tướng (gacha C…SSR), Cửa hàng, Vòng quay | `renderSummon`, `renderShop`, event `wh` | |
| Nhiệm vụ Chính/Ngày/Tuần + Thành tựu (có thưởng) | `QS`, `ACH`, `renderQuest/Ach` | Chưa có danh hiệu, nhiệm vụ phụ/mùa |
| Sự kiện: đăng nhập 7 ngày, Boss thế giới, Đua sát thương, Đại Lễ, mốc thưởng | `EV`, `renderEvents` | Boss thế giới/BXH là **mô phỏng cục bộ** (không có server) |
| Battle Pass theo tháng (50 cấp, Premium) | `BP`, `renderBP` | Là nền cho Season |
| Thể lực, offline AFK, lưu `localStorage` có migrate (`sv.v`, `dm()` deep-merge) | `sta()`, `afkCheck()`, `initSv()` | Thêm khoá save mới an toàn |
| VFX theo kỹ năng/tuyệt kỹ, chất lượng Thấp/Vừa/Cao, object pooling | `js/vfx.js` | |

## B. Còn thiếu (đối chiếu 24 mục)
| Mục | Trạng thái |
|---|---|
| II Ải thường: Quét ải | ✅ **làm xong ở Phase 12-P1** |
| III Ải Tinh Anh | ✅ **làm xong ở Phase 12-P1** |
| IV Bí Cảnh (7 loại, nhiều tầng) | ❌ chưa có |
| V Thử Luyện Sinh Tồn | ⚠ lõi roguelike đã có; thiếu chế độ vô tận + bảng nâng cấp ngẫu nhiên % riêng |
| VI Boss Thế giới nhiều phase, vùng nguy hiểm, BXH hạng | ⚠ có bản đánh Boss thế giới đơn giản; thiếu phase/vùng nguy hiểm/thưởng theo hạng |
| VII Sự kiện theo thứ trong tuần | ❌ (event hiện theo tháng/tuần, không theo thứ) |
| VIII Season đầy đủ (nhiệm vụ mùa, boss mùa, lưu BXH cũ) | ⚠ chỉ có Battle Pass tháng |
| IX Giang Hồ Kỳ Ngộ | ❌ |
| X Môn Phái | ❌ |
| XI Cảnh giới 10 bậc | ⚠ có Thức Tỉnh/Thăng Giai, chưa có 10 cảnh giới Phàm Nhân→Độ Kiếp |
| XIII Tổ đội 2 người + Combo | ❌ **không tồn tại trong code** (yêu cầu ghi "giữ" nhưng chưa từng có) → phải làm mới |
| XIV Set trang bị / hiệu ứng đặc biệt | ❌ |
| XV Phù Văn / Trận Pháp | ❌ |
| XVII BXH đa dạng Top 100 | ⚠ chỉ 2 bảng mô phỏng, ~10 người |
| XVIII Đại Hội Võ Lâm (PvP) | ❌ (không có server → cần PvP bất đồng bộ với đội hình bot/ghost) |
| XXIII Tách dữ liệu: Hero/Skill/Equipment/Quest/Sect/Realm/Season/Achievement | ⚠ Chapter/Stage/Enemy/Boss/Character/Skill/Env đã tách; **Equipment, Quest, Achievement, Event, Reward, Sect, Realm, Season còn nằm trong `index.html`** |

## C. Quyết định cần chốt trước các phần sau
1. **Không có máy chủ**: BXH, Boss thế giới, PvP chỉ có thể là mô phỏng cục bộ (bot/ghost). Muốn thật cần backend.
2. **6 ô hay 7 ô trang bị** (hiện 7).
3. **Tổ đội 2 người** là hệ thống hoàn toàn mới: cần định nghĩa tướng hỗ trợ đánh thế nào trong trận (AI đi theo? chỉ cộng buff + combo kích hoạt?).
4. **Art "không placeholder"**: trang bị găng/giày vẫn dùng emoji (thiếu `it_n*`, `it_f*`); ảnh nền menu/boss cũ là ảnh tĩnh.

## D. Lộ trình (mỗi phần: làm → test → mới sang phần sau)
P1 Vượt ải ✅ (xong Quét + Tinh Anh) · P2 Main Menu/tướng ✅ · P3 Nâng cấp tướng/trang bị/võ công (+ Set, Phù Văn) · P4 Bí Cảnh/Thử Luyện/Boss · P5 Event ngày + Season · P6 Môn Phái + Cảnh giới · P7 Tổ đội + Combo · P8 PvP + BXH · P9 Nhiệm vụ/Thành tựu/Login · P10 VFX/UI/hiệu năng.

## E. Phase 12-P1 — đã triển khai
- `data/modes.js` (`DV_DATA.modes`): luật Tinh Anh + Quét; `hard(stage)` tạo bản Tinh Anh của **mọi** 312 màn từ dữ liệu thường (không nhân đôi dữ liệu).
- **Ải Tinh Anh** (mở khi màn thường 3★): quái HP ×1.7 / sát thương ×1.35, mật độ ×1.25, spawn nhanh hơn, tỉ lệ Tinh Anh ×2.5, +1 quái Tinh Anh mỗi sự kiện; Boss HP ×2, đạn nhiều hơn ×1.25, hồi chiêu ×0.8, sát thương ×1.2; thưởng EXP/Vàng ×1.6, Tinh thiết/Hồn ×2, +1 trang bị rơi, phẩm chất tối thiểu +1. Tốn ⚡10, **3 lượt/màn/ngày**. Sao và clear lưu riêng (`sv.srh`, `sv.clh`) → không làm lệch điều kiện mở chương.
- **Quét Ải**: màn đã 3★ → quét ×1 hoặc ×n (tối đa 10, theo thể lực ⚡5/lượt), nhận EXP/Vàng/Tinh thiết/Hồn/trang bị; không có thưởng lần đầu/sao, không đổi tiến độ. **Quét Tinh Anh** khi Tinh Anh đã 3★ (⚡10, tính vào lượt/ngày).
- Save mới: `sv.srh`, `sv.clh`, `sv.el {d,n}`, `sv.sw`; save cũ tự bổ sung (đã test).
- Test: `python3 tests/test_modes.py` (23 mục, đạt). Hồi quy: `showcase_test.py` đạt, `DV_DATA.validate()` ok, bot thắng 1-1…1-6, không lỗi JS.
