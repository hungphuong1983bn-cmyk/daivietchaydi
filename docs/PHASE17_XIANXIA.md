# Phase 17 — Đồ hoạ TIÊN HIỆP (làm từng phần)

## Phần 1 · Khí quyển bản đồ (`js/xianxia17.js`, `window.DV_XIAN17`)
Lớp hình ảnh bọc lên `DV_ENV` (giống map15). Không đổi sát thương, AI, rơi đồ, dữ liệu/save.
**Gỡ:** xoá thẻ `<script src="js/xianxia17.js">` (và 2 dòng `DV_XIAN17.begin/end` trong `index.html`, có `if(window.DV_XIAN17)` nên để lại cũng không lỗi) · hoặc `DV_XIAN17.enabled=false`.

| Thành phần | Thấp | Vừa | Cao |
|---|---|---|---|
| Tông xanh đen/tím (multiply, theo giờ trong ngày) + vignette | ✔ | ✔ | ✔ |
| Sương sát đất (màu theo chủ đề) | | ✔ | ✔ (+lớp 2) |
| Núi xa + đền cổ có đèn, trăng (ban đêm/hoàng hôn), tia sáng thể tích, sương cao | | ✔ | ✔ |
| Lá đỏ/vàng rơi + hạt sáng vàng kim | | (ít) | ✔ |

Tôn trọng `prefers-reduced-motion` (không trôi, không hạt chuyển động). Hiệu năng (CPU phần mềm, so sánh tương đối): +2–5 ms/khung ở mức Cao.
Kiểm thử: `python3 tests/xian17_test.py [DIR_ảnh]`.

## Phần 2 · Kỹ năng vàng kim (`js/xianxia17_skill.js`, `window.DV_XIAN17S`)
Bọc lên `DV_VFX` (`update/ground/air/ult/boom/palm/bolt/cast/reset`), gọi hàm gốc trước rồi vẽ thêm. Không đổi sát thương, tầm đánh, hồi chiêu, năng lượng; chậm khung/zoom/rung camera của tuyệt kỹ vẫn là cơ chế sẵn có (`G.sm`, `G.zm`).
**Gỡ:** xoá thẻ `<script src="js/xianxia17_skill.js">` hoặc `DV_XIAN17S.enabled=false`.

| Bậc | Khi nào | Hiệu ứng thêm |
|---|---|---|
| Thường | kỹ năng cơ bản | giữ nguyên hiệu ứng cũ |
| Mạnh | kỹ năng đã Tiến Hoá, hoặc nổ có bán kính > 90 | vòng vàng, tia ngắn, hoa sen nhỏ (nổ > 150); tối đa 3/6/10 cái cùng lúc theo chất lượng |
| Tuyệt kỹ | bấm Tuyệt Kỹ | pháp trận 2 lớp xoay (vạch phù, sao 6 cánh, chấm phù), hoa sen vàng nở, sóng năng lượng, 8/16/28 tia sáng, 3 cung kiếm xoáy, loé tâm, cánh sen bay (0/12/26) |

Pháp trận tự thu theo bề rộng màn hình (điện thoại hẹp). Kiểm thử: `python3 tests/xian17_skill_test.py [DIR_ảnh]` (kích hoạt tuyệt kỹ 3 mức chất lượng, vòng đời, hiệu năng, lỗi console).

## Phần 3 · Số sát thương nhiều màu (`js/xianxia17_dmg.js`, `window.DV_XIAN17D`)
Chỉ đổi cách VẼ chữ sát thương lên quái. `hit()` trong `index.html` chỉ thêm 3 trường mô tả vào chữ nổi (`k` loại: n/c/s · `u` nguồn `G.src` · `b` Boss) — công thức sát thương, chí mạng, tầm đánh, rơi đồ không đổi. Chữ khác (LÊN CẤP, NÉ, +HP, cảnh báo Boss) vẫn vẽ theo code cũ.
**Gỡ:** xoá thẻ `<script src="js/xianxia17_dmg.js">` hoặc `DV_XIAN17D.enabled=false` (hai chỗ sửa nhỏ trong `index.html` có `if(window.DV_XIAN17D)` nên để lại không lỗi).

| Loại | Kiểu hiển thị |
|---|---|
| Thường | trắng viền tối, dạng `-4826` (Boss: hồng nhạt) |
| Chí mạng | vàng cam to hơn 20%, nảy lớn rồi co, viền nâu đỏ, hào quang vàng, dấu `!` sát số |
| Kỹ năng | theo võ công: Hàng Long vàng cam · Lôi Động tím · Phi Kiếm xanh băng · Tuyệt Kỹ vàng kim rất to (kiếm khí cơ bản tính là Thường) |

Số được xếp hàng và vẽ **sau** lớp sương/vignette của `DV_ENV.drawAfter` để không bị phủ mờ; không có `DV_ENV` thì vẽ ngay như cũ. Hào quang giới hạn 10/4/0 cái mỗi khung theo chất lượng Cao/Vừa/Thấp. Kiểm thử: `python3 tests/xian17_dmg_test.py [DIR_ảnh]`.

## Phần 4 · Boss & quái (`js/xianxia17_boss.js`, `window.DV_XIAN17B`)
Chỉ thêm hình ảnh: không đổi máu, sát thương, AI, kỹ năng Boss, rơi đồ, dữ liệu lưu. `hud()` của game vẫn cập nhật `#bossw/#bossb`; file này chỉ bọc `DV_MART.body` (viền sáng) và thêm CSS/DOM phụ cho thanh máu. Thêm 2 dòng `begin/end` trong `index.html` (có `if(window.DV_XIAN17B)`).
**Gỡ:** xoá thẻ `<script src="js/xianxia17_boss.js">` hoặc `DV_XIAN17B.enabled=false` (thanh máu về khung Phase 15).

- **Viền sáng** (bóng sáng bọc nét vẽ, nhịp thở): Boss vàng cam, dưới 50% máu đổi đỏ cam · Tiểu Boss tím · Tinh Anh vàng/đỏ (khớp vòng chân cũ). Quái thường không có viền. Hạn mức quái thường/Elite/Mini có viền mỗi khung: 0/3/8 (Thấp/Vừa/Cao); Boss luôn có.
- **Thanh máu Boss lớn:** huy hiệu quỷ viền vàng bên trái, tên Boss, khung vàng kim, vạch mốc 25/50/75%, thanh "máu vừa mất" tụt dần, hiển thị %, nhấp nháy khi dưới 30%. Thay khung "✦ BOSS ✦" của Phase 15 bằng CSS ưu tiên cao hơn (`#hud #bossw`).

Kiểm thử: `python3 tests/xian17_boss_test.py [DIR_ảnh]`.

## Phần 5 · Cột sáng rơi đồ — Cách A (`js/xianxia17_loot.js`, `window.DV_XIAN17L`)
Chỉ thêm hình ảnh; chỉ **đọc** `G.orb`, không đổi bảng rơi, tỉ lệ, nhặt đồ, vàng/EXP/hồi máu, dữ liệu lưu. Thêm 2 dòng `begin/end` trong `index.html` (có `if(window.DV_XIAN17L)`).
**Gỡ:** xoá thẻ `<script src="js/xianxia17_loot.js">` hoặc `DV_XIAN17L.enabled=false`.

Lưu ý thiết kế: trong game, trang bị (đồ phẩm Thường→Huyền Thoại) chỉ được tung khi **kết thúc màn** (`stageReward`), không có vật phẩm trang bị nằm trên chiến trường. Vì vậy cột sáng gắn vào những vật rơi **có thật** trên bản đồ và suy bậc từ chính chúng:

| Bậc | Nguồn (suy ra từ `G.orb`) | Kiểu |
|---|---|---|
| Huyền Thoại | viên EXP lớn (`v ≥ 20`, của Boss) | vàng kim, cao nhất, vòng sóng khi xuất hiện |
| Sử Thi | bình hồi sinh (`h`) — Tiểu Boss/suối/Tinh Anh | xanh ngọc; sắp hết hạn thì nhấp nháy |
| Hiếm | cụm ≥ 8 đồng vàng gần nhau (quái vàng…) | vàng sáng, 1 cột/cụm, mờ dần khi nhặt bớt |

Cột mọc lên trong 0,3 giây; khi nhặt, cột thu lại + hạt bắn về phía người chơi (tối đa 6 hiệu ứng thu cùng lúc). Số cột tối đa mỗi khung: 2/4/10 (Thấp/Vừa/Cao); Thấp chỉ có bậc Huyền Thoại, không hạt. Trần hạt 40/khung. Sprite cột và chân dựng sẵn 1 lần. Tôn trọng `prefers-reduced-motion` (không nhấp nháy, không hạt, cột hiện ngay).
Chưa làm: cột sáng theo phẩm chất **trang bị** (cần thiết kế thêm chế độ rơi đồ trên chiến trường, sẽ đổi gameplay nên chưa đụng).

## Phần 6 · HUD viền vàng kim (`js/xianxia17_hud.js`, `window.DV_XIAN17H`)
Chỉ CSS + 1 lớp theo dõi nhẹ (đổi class khi máu < 30% hoặc đổi chất lượng, chỉ khi có thay đổi). Không đổi bố cục, kích thước ô, vị trí nút, logic `hud()`. Khung vàng dùng `border`/`box-shadow`/pseudo-element nên không xô lệch layout cũ. Gỡ: xoá thẻ `<script src="js/xianxia17_hud.js">` hoặc `DV_XIAN17H.enabled=false` (gỡ `<style id="x17hs">`).
- Huy hiệu cấp: vòng vàng kim 2 lớp, 4 đinh tán · 3 thanh HP/Năng lượng/EXP: khung vàng kim, vạch 25/50/75%, vệt bóng; HP < 30% đỏ nhấp nháy · bảng chỉ số: nền tối trong mờ + viền vàng + 2 góc trang trí · nút Tuyệt Kỹ: vòng vàng kim + viền chấm xoay khi sẵn sàng · nút Tạm dừng: vòng vàng kim.
- Chất lượng Thấp: bỏ bóng sáng, vệt bóng và trang trí góc (nhẹ cho GPU yếu).
Bài học khi làm: viền vàng dạng gradient `border-box` sẽ **lộ qua** lớp nền trong suốt bên trên → với nền bán trong suốt (bảng chỉ số) dùng viền màu đặc + `box-shadow` inset thay vì gradient.

## Phần 7 · Tối ưu hiệu năng
Chỉ giảm việc vẽ thừa, không đổi hình ảnh/logic.
- **Khí quyển:** tia sáng thể tích và trăng dùng gradient dựng sẵn (trước: tạo 4–5 gradient mỗi khung); lá rơi dùng một ma trận biến đổi cho cả vòng (trước: `save/translate/rotate/scale/restore` từng chiếc).
- **Cột sáng:** hạt gom 2 mức sáng/1 lần `fill` thay vì mỗi hạt một lần; trần 40 hạt/khung; sprite dựng sẵn.
- **Tuyệt kỹ:** cánh sen bay dùng một ma trận cho cả vòng.
- Mọi chỗ dùng `ctx.getTransform` đều có đường lui về `save/restore` cũ.

Số lệnh canvas mỗi khung (đếm bằng `python3 tests/xian17_ops.py`; so **mức chênh** của từng module vì cảnh nền mỗi lần chạy hơi khác):

| Module / mức Cao, nhàn rỗi | Trước | Sau |
|---|---|---|
| Khí quyển (`DV_XIAN17`) | +152 lệnh · 24 `save` · 5 gradient | +125 lệnh · 2 `save` · 0 gradient |
| Cột sáng (`DV_XIAN17L`), 9 cột | +81 lệnh | +43 lệnh |
| Khí quyển, mức Vừa | +74 | +59 |
| Mức Thấp | gần như không đổi (đã rẻ sẵn) | — |

**Giới hạn đã biết (chưa làm):** (1) tuyệt kỹ mức Cao vẫn tạo ~48 gradient/khung (mỗi tia sáng một gradient riêng, vì độ dài/hướng đổi theo thời gian) — muốn giảm cần đổi cách vẽ tia, có thể làm mờ nhẹ đầu tia; (2) sương vẫn vẽ tile co giãn mỗi khung, có thể dựng sẵn tile đúng cỡ; (3) vignette vẫn là một `drawImage` toàn màn hình. **Chưa đo được thời gian ms:** trình duyệt headless (canvas vẽ bằng CPU) cho số đo dao động rất lớn giữa các lần chạy nên không dùng để kết luận; các con số trên là số lệnh, không phải ms. Nên đo thêm trên máy thật, bật `?debug` và so `DV_XIAN17*.enabled=false`.

Kiểm thử: `python3 tests/xian17_loot_test.py [DIR_ảnh]` (cột sáng 3 bậc, trần theo chất lượng, ghost khi nhặt, class HP thấp của HUD) · `python3 tests/xian17_ops.py` (đếm lệnh theo module).
