# Phase 22 (bước 1) — Sửa skill không hiển thị đủ khi đông quái
Nguyên nhân: `js/r3d_wuxia.js` bỏ qua (`continue`/`return`) việc dựng Thiên Hỏa, Băng Long, Quỷ Ảnh, Tuyệt Ảnh khi `F.list.length` vượt ngưỡng 28/55 (chất lượng Thấp/Vừa). Đông quái → nhiều vòng/hạt nền → skill chính hiện trễ hoặc mất hẳn.
Sửa: tách `busy()` (chỉ trang trí phụ) khỏi `skillBusy()` (ngưỡng an toàn 260); nâng giới hạn vùng lửa Thiên Hỏa [2,4,6]→[5,8,12]. Không đổi sát thương/AI/lưu.
Kiểm: giả lập 70 hiệu ứng nền → bản cũ dựng 0 skill, bản mới dựng đủ 3. Chưa làm: tạo hình chibi mới, quái mới, thu nhỏ hiệu ứng quá sáng.

## Bước 2 — Nhân vật chính chibi
Thêm `js/r3d_chibi.js` (hook 1 dòng ở cuối `buildHero` trong `r3d_actors.js`, 1 dòng biểu cảm trong `heroAnim`, scale tướng 1.3 khi vào trận, 1 script tag trong `index.html`). Áp cho cả 7 tướng (cùng bộ đầu/mặt/tóc/khăn/giáp vai/giày), lỗi → tự giữ bản cũ.
Có: đầu to, mắt (trắng/tròng/đồng tử/điểm sáng), lông mày + miệng đổi biểu cảm (bình thường · tức giận khi đánh/skill · cười khi thắng · đau khi trúng đòn), tóc nhiều lớp + đuôi ngựa dây đỏ lắc theo chạy, khăn đỏ + đuôi khăn bay, giáp vai, đai + khóa vàng, giáp tay, giày cao cổ, kiếm 1.28x.
Hiệu ứng võ công: độ đục -20%, giảm bán kính trang trí combo/ult (không đổi vùng sát thương).
Hạn chế: camera nghiêng 55° nên mặt chỉ rõ khi zoom/nhìn nghiêng; mesh vẫn là hình khối ghép (không có model/texture ngoài); chưa đo FPS thiết bị thật; chưa chạy smoke_all.py.
