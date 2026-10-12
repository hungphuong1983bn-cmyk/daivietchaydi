# Phase 21 — Hiệu ứng võ công chibi rực sáng (3D)
Module mới `js/r3d_wuxia.js` (bám sự kiện thật, không đổi sát thương/hồi chiêu/AI/lưu). Sửa nhỏ: `index.html` (1 script tag), `js/r3d_fx.js` (vệt chém cũ chỉ chạy khi không có module mới), `js/r3d_skx.js` (1 dòng hook). Test: `tests/wuxia_test.py`. Bản gốc Phase 20: giữ bản zip cũ để khôi phục.

| Hiệu ứng | Gắn vào sự kiện thật |
|---|---|
| Combo 4 nhịp (ngang/dọc/xoay/lao tới) | `DV_VFX.cast('kiem')` |
| Trúng đòn, chí mạng (sao nổ, rung camera) | `DV_VFX.onHit` |
| Kiếm Phong | đạn Kiếm Khí (`G.pr`) |
| Long Thần Vạn Kiếm | `DV_VFX.ult` (Tuyệt Kỹ), kiếm bay vào địch thật |
| Tuyệt Ảnh | sự kiện `trail` (Thần Tốc / Lướt Sóng) |
| Thiên Hỏa | thực thể `met` (Tinh Thần Vẫn Lạc) |
| Băng Long | trận băng (Hàn Băng Trận) |
| Quỷ Ảnh | lốc xoáy `twr` (Toàn Phong Trảm) |
| Trạng thái | `e.slw/e.slk` (chậm/đóng băng), `G.skb` (thiêu) |

Chưa có: icon skill mới, Combo tuyệt đỉnh, hiệu ứng choáng (dữ liệu quái không có trạng thái này). "Lao tới" và vùng cháy chỉ là hình ảnh.
Kiểm thử: chạy 45 bước ở chất lượng Cao và Thấp, không lỗi JS; chưa đo FPS trên thiết bị thật, chưa chạy lại smoke_all.
