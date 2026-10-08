# Phase 12 · Part 3 — Nâng cấp Tướng · Trang bị · Võ học · Set · Phù Văn

Quyết định đã chốt: **trang bị và Võ học tách riêng theo từng tướng**, **giữ 7 ô trang bị** (w,a,h,n,b,r,f).

## Dữ liệu — `data/upgrade.js` (`DV_DATA.upg`)
Thuần dữ liệu + hàm thuần (kiểm bằng node, không cần trình duyệt). Thiếu file → game dùng dự phòng cũ (3 sách × 3 tầng, không Set/Phù Văn).
- **Võ học**: 4 sách × 5 tầng (Kiếm Pháp, Nội Công, Khinh Công, **Tâm Pháp** mới). Mỗi tướng có 1 sách **sở trường** (hiệu ứng ×1.25, bảng `martial.aff`).
- **Set trang bị**: đếm số món đang mặc có phẩm chất ≥ bậc. Long Tuyền (Hiếm+) / Huyền Thiết (Sử Thi+) / Hoàng Long (Huyền Thoại), mốc 3/5/7 món, cộng dồn các bậc.
- **Phù Văn**: 6 loại (Công/Hộ/Phong/Bạo/Ảnh/Tâm), cấp 1–5, tốn 🪙+⚙; **3 ô mở ở cấp tướng 1/10/20**; cấp Phù Văn riêng từng tướng; không gắn trùng loại.

## Lưu trữ (save v3 → v4, tự migrate)
| Khoá | Ý nghĩa |
|---|---|
| `sv.eqh[heroId] = {slot: uid}` | trang bị đang mặc của từng tướng (túi `sv.inv` vẫn dùng chung, mỗi món chỉ một tướng mặc) |
| `sv.vhx[heroId] = {bookTier: 1}` | Võ học đã học của từng tướng |
| `sv.rn[heroId] = {eq:[k,k,k], lv:{k:n}}` | Phù Văn |
`sv.eqp` / `sv.vh` **vẫn dùng được** nhưng là getter (không lưu) trả về dữ liệu của tướng đang chọn `sv.hs` → code cũ/heroshow/test không phải sửa. Helper: `eqiH(id,k)`, `owner(uid)`, `asHero(id,fn)` (đổi tướng tạm, luôn khôi phục).
**Migrate**: trang bị cũ → tướng đang chọn; các tướng khác bắt đầu **trống** (dùng *Tự động mặc* trong màn Nâng cấp). Võ học đã học cũ → **sao cho mọi tướng đang sở hữu** (không ai bị thiệt).

## Giao diện — `js/upgrade.js` (`DV_UP`)
Màn **NÂNG CẤP TƯỚNG** toàn màn hình, vuốt/‹ › đổi tướng (không đổi tướng chính), 4 tab, chấm đỏ theo tab:
- **Tướng**: Lv/EXP, *Lên 1 cấp* / *Lên tối đa* (đổi 🪙→EXP như trước), chỉ số tổng hợp, Hồ sơ, chọn tướng chính.
- **Trang bị**: 7 ô, đổi từ túi, nâng cấp, tinh luyện, bán, *Tự động mặc*, chuyển món từ tướng khác, bảng Set.
- **Võ học**: sách theo tướng, nhãn sở trường, học tuần tự.
- **Phù Văn**: học/nâng, gắn/tháo 3 ô.
Điểm vào: Menu **Tướng → ⬆ NÂNG CẤP**, ô **Trang bị** (menu + dải 7 ô), **KHÁC → Võ học**. *Thư viện võ công* (võ công trong ván) không còn lẫn tab Võ học.

## Chỉ số (`bon()`)
`… + martial×sở trường + Set + Phù Văn` (cộng sau hệ số Thức Tỉnh/Thăng Giai như Võ học cũ). Trần bạo kích 60%, né 30% giữ nguyên.

## Chưa làm (cố ý, ghi rõ)
- **Trận Pháp** (Part 3 gốc ghi "Phù Văn / Trận Pháp"): chưa có — cần thiết kế riêng (đội hình 2 người ở Part 7).
- Phù Văn không rơi từ ải; hiện chỉ mua bằng 🪙/⚙. Nguồn rơi sẽ gắn ở Bí Cảnh (Part 4).

## Test
`python3 tests/test_upgrade.py` (data + migrate + trang bị/Võ học/Set/Phù Văn/nâng cấp tướng + menu, ~46 mục). Hồi quy đạt: `test_menu.py`, `test_modes.py`, `showcase_test.py` (đã sửa 2 dòng đọc `eqp`/`vh` theo cấu trúc mới). `char_test.py`, `test_progress.py`, `batch.py` **lỗi y hệt trên bản zip gốc** (môi trường test), nên chưa dùng làm bằng chứng.
