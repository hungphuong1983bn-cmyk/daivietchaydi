# Phase 7 — Character System (data-driven)

Dữ liệu: `data/characters.js` · Engine: `js/character.js` (`window.DV_CHAR`) · Kiểm thử: `python3 tests/char_test.py`

**Không thay thế hệ thống tướng cũ.** `HEROES` trong `index.html` (mua, triệu hồi, EXP, ★, admin `dvcd_hero`) vẫn là nguồn gốc.
Phase 7 là lớp bổ sung ghép theo `id`. Thiếu `data/characters.js`/`js/character.js`, hoặc `DV_DATA.charValidate()` báo lỗi
→ `DV_CHAR.ok()` = false → game dùng hình vẽ và chỉ số cũ như trước.

## Mỗi nhân vật có (trong `DV_DATA.characters`)
`id, name, title, class, role, rarity` · `stats` (hp, attack, defense, speed, crit, range, attackSpeed) · `weapon` · `passive` ·
`skills[3]` · `ultimate` · `awakening[3]` · `ascension[5]` · `max` · `design` · `anim`.
UI không chứa chỉ số: màn Hồ sơ đọc mọi thứ qua `DV_CHAR.stats()/req()/get()`.

## 7 nhân vật — nhận diện khác nhau về dáng, không chỉ màu
| id | Dáng | Thân | Đầu | Vai | Lưng | Vũ khí | Aura | Vệt đòn |
|---|---|---|---|---|---|---|---|---|
| dbl Đinh Bộ Lĩnh | cân đối chữ T | armor | topknot | pauldron | cape | sword | wind | slash |
| lh Lê Hoàn | hình thang đồ sộ | heavy | crest | pauldron | — | glaive | dragon | sweep |
| nq Ngô Quyền | cao mảnh, khăn dài | light | headband | sash | scarf | spear | tide | thrust |
| thd Trần Hưng Đạo | áo bào hình chuông, mũ cánh chuồn | robe | wing | — | banner | banner (lệnh kỳ) | thunder | arc |
| dl Đinh Liễn | nhỏ, ống tên | light | hood | — | quiver | bow | leaf | arrow |
| nb Nguyễn Bặc | khối tròn, khiên lớn | heavy | round | pauldron | — | shield | guard | bash |
| ltk Lý Thường Kiệt | chữ V, song kiếm | armor | tiered | sash | twin | twin | sun | cross |

`DV_DATA.charValidate()` chặn việc "đổi màu": mỗi cặp nhân vật phải khác nhau ≥ 4 yếu tố hình dáng và không trùng loại vũ khí.

## Animation (8 trạng thái)
idle · move · attack · skill · ultimate · hit · defeat · victory. Thời lượng ở `charRules.anim`; nhịp/biên độ riêng từng
nhân vật ở `anim` (ví dụ `move.weight` nặng/nhẹ, `attack.swing`, `hit.stagger`). Kiểu đòn lấy theo loại vũ khí (chém, đâm, bắn, niệm, húc).
Trong trận: `idle/move` theo di chuyển, `attack` khi Kiếm Khí, `skill` khi Lôi Động/Hàng Long, `hit` khi bị đánh, `ultimate` khi dùng Tuyệt Kỹ,
`victory/defeat` khi hết ván. Đòn không lặp chạy đủ thời lượng, không bị cắt giữa chừng.

## Tiến hoá
| Mốc | Tác dụng chỉ số | Tác dụng hình ảnh |
|---|---|---|
| Level | +5%/cấp, +10%/★ (công thức cũ, giữ nguyên) | — |
| Awakening 1–3 | HP & Công +6% / +8% / +12% | **đổi diện mạo**: mũ, giáp, vai, áo choàng, vũ khí phát sáng, phụ kiện (`visual`) |
| Ascension 1–5 | Bạo kích, tốc độ, phòng thủ, tốc đánh, tầm đánh | **aura dày dần + VFX**: số hạt, vệt đòn, ấn dưới chân, tàn lửa, rồng cuộn… |
| MAX | HP & Công +5% | trạng thái riêng: bộ phụ kiện đầy đủ, trụ sáng dưới chân, 6 vật thể xoay quanh, tên + mô tả riêng |

- Điều kiện/chi phí nằm trong dữ liệu: Thức Tỉnh cần Lv.15/30/45 + 🔮 Hồn tướng + 🪙; Thăng Giai cần Thức Tỉnh tương ứng + 🔮 + ⚙ Tinh thiết.
- MAX = cấp tướng đạt trần của ★ hiện tại + Thức Tỉnh 3/3 + Thăng Giai 5/5.
- Màn Hồ sơ cho **xem trước** mọi bậc (kể cả chưa mở) và phát hiệu ứng bùng sáng khi nâng bậc.
- Save: `sv.hx[id].aw`, `.asc` (khoá tuỳ chọn; save cũ chạy bình thường, không cần migrate).

## Nối vào chiến đấu (đúng bằng số hiển thị ở Hồ sơ)
`bon()` cộng `DV_CHAR.delta()`. Khi chưa Thức Tỉnh/Thăng Giai, delta = 0 nên **kết quả giống hệt bản trước** (đã kiểm bằng so sánh với `tests/fixtures/index_phase6.html`).
Chỉ số mới: `G.dr` (giảm sát thương = d/(d+400)), `G.as` (nhân tốc hồi võ công), `G.rg` (tầm đánh, thay `ATK_RNG` cố định).
`charRules.applyBase = true` sẽ áp cả phòng thủ/tầm/tốc đánh gốc riêng từng nhân vật (mặc định tắt để không đổi cân bằng tướng hiện có).

## Thêm nhân vật mới (không sửa engine)
1. Thêm vào `HEROES` (index.html) hoặc qua Admin (`_new`), có `id`.
2. Thêm một khối vào `DV_DATA.characters` cùng `id`; chọn bộ phận từ `DV_DATA.charParts`; chạy `charValidate()`.
3. Cần bộ phận mới (loại vũ khí, dáng mũ…): thêm id vào `charParts` và một hàm vẽ tương ứng trong `js/character.js` (`BODY/HEAD/BACK/WEAPON/AURA…`).

## Kiểm thử
`python3 tests/char_test.py` — dữ liệu, hồi quy so với Phase 6, 1.680 tổ hợp vẽ, Hồ sơ + nâng cấp, trong trận, 0 lỗi JS.
`python3 tests/char_test.py shots DIR` — thêm ảnh chụp Hồ sơ và trong trận.
