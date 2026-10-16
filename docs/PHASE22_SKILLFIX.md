# Phase 22 (bước 1) — Sửa skill không hiển thị đủ khi đông quái
Nguyên nhân: `js/r3d_wuxia.js` bỏ qua (`continue`/`return`) việc dựng Thiên Hỏa, Băng Long, Quỷ Ảnh, Tuyệt Ảnh khi `F.list.length` vượt ngưỡng 28/55 (chất lượng Thấp/Vừa). Đông quái → nhiều vòng/hạt nền → skill chính hiện trễ hoặc mất hẳn.
Sửa: tách `busy()` (chỉ trang trí phụ) khỏi `skillBusy()` (ngưỡng an toàn 260); nâng giới hạn vùng lửa Thiên Hỏa [2,4,6]→[5,8,12]. Không đổi sát thương/AI/lưu.
Kiểm: giả lập 70 hiệu ứng nền → bản cũ dựng 0 skill, bản mới dựng đủ 3. Chưa làm: tạo hình chibi mới, quái mới, thu nhỏ hiệu ứng quá sáng.

## Bước 2 — Nhân vật chính chibi
Thêm `js/r3d_chibi.js` (hook 1 dòng ở cuối `buildHero` trong `r3d_actors.js`, 1 dòng biểu cảm trong `heroAnim`, scale tướng 1.3 khi vào trận, 1 script tag trong `index.html`). Áp cho cả 7 tướng (cùng bộ đầu/mặt/tóc/khăn/giáp vai/giày), lỗi → tự giữ bản cũ.
Có: đầu to, mắt (trắng/tròng/đồng tử/điểm sáng), lông mày + miệng đổi biểu cảm (bình thường · tức giận khi đánh/skill · cười khi thắng · đau khi trúng đòn), tóc nhiều lớp + đuôi ngựa dây đỏ lắc theo chạy, khăn đỏ + đuôi khăn bay, giáp vai, đai + khóa vàng, giáp tay, giày cao cổ, kiếm 1.28x.
Hiệu ứng võ công: độ đục -20%, giảm bán kính trang trí combo/ult (không đổi vùng sát thương).
Hạn chế: camera nghiêng 55° nên mặt chỉ rõ khi zoom/nhìn nghiêng; mesh vẫn là hình khối ghép (không có model/texture ngoài); chưa đo FPS thiết bị thật; chưa chạy smoke_all.py.

## Bước 3 — 8 họ quái thường có hình dáng riêng
Thêm `js/r3d_fams.js`. Hook trong `r3d_actors.js`: `R3.SHAPES` (đăng ký shape), `R3.fam(k,e)` ở `updEnemies`, chuyển động `R3.FAMM` (hop/bay/vỗ cánh/lean theo họ), bỏ `embellish` cho họ mới. Không đổi chỉ số/AI/kỹ năng quái (chỉ đọc `e.tid`, `e.el`).
Ánh xạ: swarm,splitter→côn trùng · tank,armor,bomber→thùng gỗ · grunt,lancer,archer,hunter→lính canh vệ · shaman,summoner→pháp sư · fast→sói · assassin→dơi · colossus→khổng lồ · mọi quái elite→tinh anh. Boss/Mini-boss giữ nguyên (bước 4).
Kiểm: dựng đủ 8 họ không lỗi JS; 120 quái hỗn hợp: 187→195 ms/khung (SwiftShader CPU, +4%).
Chưa làm: hoạt ảnh chân tay theo khớp (quái instanced = 1 mesh tĩnh, chỉ nhún/nghiêng/vỗ cánh toàn thân); hiệu ứng tấn công riêng từng họ; palette theo chương cho thùng gỗ/sói/dơi.

## Bước 4 — 5 mini-boss đặc biệt nhiều bộ phận
Thêm `js/r3d_boss.js`. Hook trong `r3d_actors.js`: `R3.mbParts` cuối `buildRig`, `R3.mbAnim` cuối `rigAnim`, `a.ms` thay cho `[a.lit,a.glow]` trong nhấp nháy/chết (có try/catch → lỗi thì tự về hình cũ).
Mỗi mini-boss gồm nhiều mesh có pivot: Rồng Băng/Hỏa Long (thân, cổ, đầu, hàm, 2 cánh vỗ, đuôi), Ma Thần (thân, áo choàng, đầu, 2 tay, mảnh năng lượng quay), Tê Giác Đá (thân, đầu+sừng, 4 chân bước chéo, đuôi), Thần Cây (thân rễ, tán lá, 2 tay cành). Hoạt ảnh phản ứng e.tel (báo đòn: há hàm/giơ tay/cúi đầu) và e.dsh (lao). Hạt riêng: tuyết/lửa/hơi thở, khói tím, bụi đá, lá bay.
Gán theo chủ đề: snow,river,sea→Rồng Băng · shadow,void→Ma Thần · mountain,cave,plain,valley→Tê Giác Đá · volcano,desert→Hỏa Long · forest,swamp→Thần Cây · citadel,heaven giữ hình cũ. Boss chương giữ nguyên. Không đổi chỉ số/cơ chế.
Kiểm: 15 chủ đề dựng + báo đòn + lao + chết không lỗi JS; 120 quái hỗn hợp 176 ms/khung (SwiftShader).
Chưa làm: hiệu ứng tấn công riêng gắn skill của quái (hơi thở lửa/băng thật, đạp đất tạo sóng): đòn đánh vẫn là cơ chế `mech` cũ, chỉ hình ảnh/hạt báo hiệu mới.

## Bước 5 — Vầng sáng vật rơi (vàng · EXP · bình hồi)
Thêm `js/r3d_loot.js` (đọc `G.orb`, KHÔNG đổi logic nhặt/EXP/vàng). Sửa `js/r3d_fx.js` `updOrbs`: xu/gem nảy cùng quầng sáng (`R3.lootPop`), gem EXP tô màu theo cấp (`R3.lootCol`), gem nhỏ lớn hơn chút; cột sáng vật lớn đổi vàng → tím cho khớp EXP lớn. `index.html`: 1 script tag.
Nhận biết: VÀNG = quầng vàng + tia lấp lánh xoay · EXP nhỏ (v<4) xanh lam · EXP vừa (4–19) chàm tím + tia · EXP lớn (≥20, tinh anh/boss) tím hồng + vòng lớn + tia + cột sáng · BÌNH HỒI xanh lục + tia (nhấp nháy khi sắp biến mất).
Mỗi vật: quầng billboard cộng sáng + vòng nằm trên mặt đất nhịp thở + bóng tối nhẹ dưới chân (tăng tương phản trên nền sáng). Rơi: nảy theo cung + tia lửa + vòng sóng. Bị hút: vệt sáng. Nhặt: tóe sáng tại nhân vật. Chất lượng Thấp: chỉ quầng sáng (bỏ vòng đất, tia, bóng, tia lửa).
Kiểm: 300 vật rơi, nhặt đúng (vàng cộng bình thường), không lỗi ở 3 mức chất lượng. Chi phí: +16–22% ms/khung với 300 vật (SwiftShader CPU, trường hợp cực đoan).

## Bước 6 — Màn hình chính cao cấp
Thêm `js/home_pro.js` (CSS ghi đè + dời `#hpn` xuống dưới sân khấu; KHÔNG đổi logic nút/dữ liệu). Sửa `js/heroshow.js` (neo hiệu ứng 2D theo chân/đầu mô hình 3D qua `R3.homeFeet`) và `js/r3d_home.js` (thêm `R3.homeFeet`). `index.html`: 1 script tag.
Nguyên nhân lỗi cũ: thẻ thông tin tướng nằm đè lên nửa dưới nhân vật (che chân + kiếm); hiệu ứng 2D (tích tụ, lên cấp, đột phá) tính chân nhân vật theo chiều cao thẻ → lệch khỏi mô hình 3D khi bố cục đổi.
Bố cục mới: thanh trên (avatar + tiền tệ dạng viên) → biểu ngữ chương → sân khấu nhân vật toàn thân + bệ sáng, 2 cột nút bên → thẻ tướng (dưới sân khấu) → chip nhanh → 5 ô chức năng (Trang bị, Võ công, Cửa hàng, Môn phái, Bí cảnh) → VÀO GIANG HỒ → thanh dưới. Bỏ nút trùng (Tướng/Túi có ở thanh dưới; Triệu hồi có ở cột phải); ẩn hàng ô trang bị (xem ở "Trang bị"). Co theo chiều cao: ≤760 ẩn chip + phiên bản; ≤660 ẩn biểu ngữ, chỉ số, nhãn nút.
Kiểm: 390×844, 412×915, 360×640, 320×568; hiệu ứng star/realm bám đúng chân; Võ công/Cửa hàng mở-đóng; nút VÕ HỌC trong thẻ tướng đã dời vẫn hoạt động; Vào Giang Hồ vào trận; không lỗi JS.

## Bước 7 — Hiệu ứng skill ôm sát địa hình + đẹp hơn
Nguyên nhân bị "cắt trên mặt địa hình": vòng sóng, rune, vùng lửa/băng, vùng báo đòn là mặt phẳng đặt ở MỘT độ cao (độ cao tại tâm); địa hình chênh −28…+16 (núi/tuyết ×1.5) nên chỗ đồi nhô lên che mất một phần; `CircleGeometry` còn là 1 mặt quạt phẳng không thể uốn theo đồi.
Sửa: thêm `js/r3d_drape.js` — bản đồ độ cao 160×160 (texture half-float, 2400 đơn vị quanh nhân vật, dựng từ `R3.height`, làm mới theo lát khi đi quá 420 đơn vị) + `R3.drape(mat)` vá vertex shader: đỉnh nằm sát mặt phẳng cục bộ (position.y<.6, pháp tuyến lên) được nâng/hạ theo độ cao địa hình tại chính đỉnh đó; cột sáng/mái vòm/cầu không đổi. Áp cho mọi vật liệu cộng sáng (`F.addM`), `runeDecal`, `nmesh` của skx. Chia nhỏ hình học: đĩa 56×12, vòng 72×2, rune 48×16, cung wuxia/skx nhiều đoạn bán kính. Vòng sóng nâng 1.6→2.2 + polygonOffset. Vùng sát thương (logic 2D) không đổi.
Đẹp hơn: đĩa năng lượng dùng texture (lõi dịu, viền sáng, tan mềm) thay mảng phẳng; Long Thần Vạn Kiếm (ult): màu vàng kim giàu sắc, độ đục rune/cột/cung/mái vòm giảm để bớt trắng cháy.
Kiểm (chương 8 Nam Quan – núi, 52° nghiêng): ult — rune thành vòng tròn liền mạch (bản cũ khuyết một mảng); vùng băng + lửa + thiên thạch + pháp trận đủ hình tròn; không lỗi JS; 120 quái 153 ms/khung (SwiftShader, không tăng).
Giới hạn: bản đồ độ cao dùng texture đỉnh (WebGL2 — game đã yêu cầu); hiệu ứng nằm ngoài 1200 đơn vị quanh nhân vật không được ôm địa hình (không xuất hiện trong thực tế); chưa thử thiết bị thật.

## Bước 8 — Tuyệt Ảnh / Quỷ Ảnh: bóng phân thân đúng hình nhân vật
`js/r3d_wuxia.js`: `silGeo()` gộp mọi mesh đặc của rig chibi hiện tại thành 1 hình học (dựng 1 lần/tướng, ~50k đỉnh, dùng chung); `ghost()` dùng nó cho bóng phân thân: thân tím trong suốt (không cộng dồn mặt chồng nhau) + viền sáng BackSide + quầng sáng; chất lượng Thấp (q=0) giữ bóng hình trụ cũ. Bỏ 2 tia chéo trên bóng hình người. `W.ghost` xuất để kiểm thử.
Kiểm (chương 8 núi, chương 30 hang): Kiếm Phong 5 vệt xanh có đầu sóng; Tuyệt Ảnh hàng 5 bóng nhân vật tím có kiếm dọc đường lướt, đọc rõ cả nền sáng lẫn tối; skill đủ khi đông hiệu ứng; không lỗi JS; 171 ms/khung (SwiftShader, 120 quái).
Chưa kiểm riêng: Quỷ Ảnh (cùng hàm ghost) khi kết thúc vòng chém; tư thế bóng là tư thế đứng của rig (chưa có tư thế lao).
