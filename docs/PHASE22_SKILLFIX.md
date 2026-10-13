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
