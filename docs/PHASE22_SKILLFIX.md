# Phase 22 (bước 1) — Sửa skill không hiển thị đủ khi đông quái
Nguyên nhân: `js/r3d_wuxia.js` bỏ qua (`continue`/`return`) việc dựng Thiên Hỏa, Băng Long, Quỷ Ảnh, Tuyệt Ảnh khi `F.list.length` vượt ngưỡng 28/55 (chất lượng Thấp/Vừa). Đông quái → nhiều vòng/hạt nền → skill chính hiện trễ hoặc mất hẳn.
Sửa: tách `busy()` (chỉ trang trí phụ) khỏi `skillBusy()` (ngưỡng an toàn 260); nâng giới hạn vùng lửa Thiên Hỏa [2,4,6]→[5,8,12]. Không đổi sát thương/AI/lưu.
Kiểm: giả lập 70 hiệu ứng nền → bản cũ dựng 0 skill, bản mới dựng đủ 3. Chưa làm: tạo hình chibi mới, quái mới, thu nhỏ hiệu ứng quá sáng.
