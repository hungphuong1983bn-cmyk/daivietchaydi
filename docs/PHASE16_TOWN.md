# Phase 16 — Khu mẫu "Cổ Trấn · Cầu Gỗ · Thác Nước"

Bản đồ dựng tay đầu tiên (set-piece) đặt trong thế giới vô hạn của `js/environment.js`. Hiện gắn vào **Chương 24 · Đất Tổ Phong Châu** (cả 6 màn).
Gỡ: xoá phần tử thứ 10 `'cotran'` của dòng 24 trong `data/environments.js` (hoặc xoá 2 thẻ `<script>` town16) → game về đúng Phase 15.

## File
| File | Vai trò |
|---|---|
| `js/town16_art.js` | Bộ asset vẽ bằng code (`DV_TOWN_ART`): nhà phố ×3, nhà ngang ×2, đình, tháp 4 tầng, cổng trấn, quán ×3, giếng, cột đèn, cột cầu, tre ×2, đào ×2, thuyền, vách thác |
| `js/town16.js` | Bố cục "cotran", nền bake theo mảnh 512px, sông/nước chảy, cầu gỗ, thác động, đèn lồng, va chạm, tốc độ lội nước, ánh sáng |
| `js/environment.js` | Chỉ thêm hook nhỏ (đánh dấu "Phase 16"): `ob`, `blobs`, `props`, `drawProp`, `drawGround`, `update`, `foe`, `lighting`, `setup`; thêm 2 loại ô vô hình `tsolid`, `tpost` |
| `data/environments.js` | Phần tử thứ 10 của dòng chương 24 = `'cotran'` |
| `index.html` | 2 thẻ script + cho vật thể lớn tự khai báo vùng cắt (`cw/ch`) để vách thác không bị "nhảy" khi vào/ra màn hình |
| `tests/town16_test.py`, `tests/town16_assets.html` | Kiểm thử + bảng xem thử asset |

## Bố cục (ô 64px, gốc = điểm xuất phát)
Đồng cỏ phía nam → đường đất → **cầu gỗ** (x=0, y −8…−4, lan can + đèn lồng) bắc qua sông chảy ngang y≈−6 → **cổng trấn** → phố lát đá → quảng trường (giếng, quán, đào) → **đình** ở cuối phố; nhà phố hai bên, nhà ngang, tháp ở đông-bắc. **Thác nước** ở tây-bắc (x≈−13, y≈−10): vách đá cao ~5 ô, màn nước chảy động, hồ + sương + cầu vồng mờ ban ngày; sông chảy từ hồ ra phía đông, có kè đá bờ bắc, thuyền, hoa súng, lau sậy.

## Luật chơi (không đổi sát thương/AI)
- Nhà, cổng (2 trụ), vách thác, giếng, quán, cây: có va chạm theo ô; lan can cầu và đồ trang trí không chặn.
- Lội sông/hồ: người chơi ×0.62, quái ×0.77 (giống bùn). **Trên cầu gỗ không chậm.**
- Đấu trường Boss: vật thể trong vòng phong ấn tự ẩn, như các khu khác.
- Trong hộp khu (x −21…27, y −27…−1.5 ô) tắt đá/bùn ngẫu nhiên; ngoài hộp giữ nguyên.

## Thêm khu dựng tay mới
Thêm `REG.<id>` trong `town16.js` (sông, cầu, danh sách `objects` theo ô, `trees`), rồi gán id vào phần tử thứ 10 của chương mong muốn. Asset mới: thêm `ART.<tên>` trong `town16_art.js` (`w,h,ax,ay,n,paint,lan`).
Xem thử không cần chọn chương: `index.html?debug&town=cotran`.

## Kiểm thử
`python3 tests/town16_test.py [shots DIR]` — va chạm nhà/vách, nước chậm/cầu không chậm, đi từ spawn tới quảng trường, ngoài khu vẫn sinh ngẫu nhiên, vòng đời, Boss, hiệu năng, lỗi console. Đã chạy lại `map15_test.py` và `sweep15.py 22 26`: 0 lỗi.

## Chưa làm / lưu ý
- Mới 1 khu mẫu; chưa có chương riêng trên bản đồ chương (cần nới `RULES.chapters` = 52 và UI chmap/home).
- Chữ trên bảng "ĐÌNH LÀNG"/"CỔ TRẤN" dùng font hệ thống; trình duyệt thiếu font có dấu sẽ hiển thị không dấu.
- Ảnh kiểm thử chạy bằng CPU phần mềm nên ms/khung chỉ để so sánh tương đối (khu mẫu ~+8ms so với đồng cỏ thường).
