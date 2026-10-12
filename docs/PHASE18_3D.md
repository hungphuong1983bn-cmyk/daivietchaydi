# Phase 18 — Chuyển đồ họa sang 3D thật (Three.js r170)

## Cách chạy
- Mở `index.html` (hoặc `python3 -m http.server`), không cần mạng: Three.js đã đóng gói sẵn tại `vendor/three.bundle.js` (APK Capacitor dùng được).
- Cài đặt → "🧊 Đồ họa 3D": TẮT = quay về Canvas 2D cũ (`sv.r3d = 0`). Mặc định BẬT; nếu thiết bị không có WebGL tự lùi về 2D.
- Chất lượng Thấp/Vừa/Cao (`sv.q`) điều khiển bóng đổ, mật độ cỏ/đá/hạt, pixel ratio, số hiệu ứng.
- Test: `python3 -I tests/flow3d_test.py shots` (Home→trận→rơi đồ→thưởng→lưu→Home→2D); `tests/smoke_all.py` (312 màn; 1 lỗi `1-01` có sẵn từ bản gốc, không do 3D).

## File thay đổi / thêm
- Thêm: `js/r3d.js` (lõi: renderer, camera nghiêng 55° fov 38, địa hình chunk, props instancing, đấu trường, ánh sáng/sương/thời tiết), `js/r3d_actors.js` (tướng, quái, elite/mini/boss có rig + hoạt ảnh), `js/r3d_fx.js` (kỹ năng, đạn, tia sét, trận pháp, hoa sen, telegraph, orb + cột sáng loot), `js/r3d_home.js` (cảnh Home 3D), `js/r3d_map.js` (Bản đồ 52 chương 3D: trời đổi màu theo cuộn, mây nhiều tầng thị sai, đảo núi/tháp nổi theo hue chương, dòng sông vàng + đom đóm, pháp trận dưới nút, chùm sáng chương hiện tại; nút/nhãn 2D giữ nguyên, dữ liệu từ DV_MAP ctx), `vendor/three.bundle.js`, `tests/flow3d_test.py`, tài liệu này.
- Sửa: `index.html` (script tags, hook bind/resize/begin/draw/home, nút Cài đặt 3D), `js/xianxia17_dmg.js` (export `flush`).
- Giữ nguyên toàn bộ logic, dữ liệu, tỉ lệ rơi, thưởng, lưu. Code 2D cũ không xoá; bản gốc: `game_src_backup_phase16`.

## Mô hình / hoạt ảnh / texture / shader (đều procedural, không dùng file .glb)
- 28 loại props (cây, đá, cột, đèn lồng, bia, v.v.) gộp geometry + InstancedMesh.
- Tướng: rig theo từng nhân vật (HS table). Quái: 8 khung (human/beast/ogre/golem/crab/blob/amphi/ghost) × skin; elite/mini/boss phóng to (boss ×1.7). Hoạt ảnh: idle/đi/đánh/trúng đòn/chết/xuất hiện.
- Texture sinh bằng canvas: chi tiết nền, trận pháp/rune, glow sprite. Shader: `onBeforeCompile` cho nền (đồi viền sáng), vật liệu cộng (additive) cho FX.
- Kỹ năng 3D: kiếm khí, kiếm bay, sét, trận pháp, hoa sen, chưởng, nổ, hồi máu, ult, boss chết; telegraph vòng đỏ; cột sáng loot theo phẩm (3 bậc).
- Overlay 2D `#cv` (trong suốt): số sát thương, thanh máu, joystick; HUD DOM giữ nguyên.

## Hiệu năng (SwiftShader, màn 10-06)
~90–100 draw calls, ~90–97k tris ở cả 3 mức chất lượng; pooling mesh/hạt, instancing quái thường & props, chunk địa hình theo camera.

## Giới hạn còn lại
- Chưa dùng model/animation ngoài (.glb); hình dạng là procedural.
- Bản đồ thị trấn (`E.town`), decal/mây `E.dc/E.cl` chưa dựng 3D.
- FPS thật cần đo trên thiết bị; môi trường test chỉ có phần mềm WebGL.

---
# Phase 19 — Nâng cấp võ công · đồ họa · hiệu ứng

## Võ công mới (11, tổng 17)
Dữ liệu `data/skills.js` (tên, độ hiếm, mô tả theo cấp, Tiến Hoá), âm thanh `data/skillfx.js`, logic `js/skills_ext.js` (DV_SKX), hiệu ứng 3D `js/r3d_skx.js`, bản 2D dự phòng `DV_SKX.draw2d`.
| Skill | Nhóm | Hiệu quả |
|---|---|---|
| Phượng Hoàng Hỏa 🔥 (S) | Tấn công | Phượng lửa tự dẫn, nổ lan + thiêu đốt. Tiến hoá: Niết Bàn Hỏa Phượng |
| Hàn Băng Trận ❄️ (H) | Tấn công | Trận băng: sát thương theo nhịp + làm chậm. Tiến hoá: Cửu U Hàn Ngục |
| Vạn Độc Vân ☠️ (H) | Tấn công | Mây độc bám đám địch, độc theo nhịp |
| Toàn Phong Trảm 🌪️ (H) | Tấn công | Lốc xoáy hút địch vào tâm và cắt xé. Tiến hoá: Cửu Thiên Cuồng Phong |
| Tinh Thần Vẫn Lạc ☄️ (L) | Tấn công | Mưa thiên thạch có vòng báo hiệu. Tiến hoá: Chư Thiên Tinh Vẫn |
| Tru Tiên Kiếm 🗡️ (L) | Tấn công | Cự kiếm giáng xuống kẻ nhiều máu nhất. Tiến hoá: Tru Tiên Tứ Kiếm |
| Liên Hoa Kiếm Trận 🪷 (S) | Tấn công | Hoa sen kiếm, cánh kiếm toả mọi hướng. Tiến hoá: Vạn Hoa Triều Nguyên |
| Kim Chung Tráo 🔔 (S) | Phòng thủ | Chuông vàng giảm sát thương nhận + chấn lui. Tiến hoá: Bất Hoại Kim Thân |
| Hồi Xuân Quyết 🌿 | Hỗ trợ | Hồi sinh lực liên tục |
| Hấp Linh Đại Pháp 🧲 | Hỗ trợ | Tăng tầm hút ngọc/vàng |
| Ngự Phong Quyết 💨 (H) | Hỗ trợ | Tăng tốc độ ra chiêu (cần cho vài Tiến Hoá) |
Các skill tự vào kho thẻ chọn khi lên cấp, thư viện Võ công, và hệ Tiến Hoá cũ (không đổi luật). Sửa nhỏ trong `index.html`: `skills()` gọi `DV_SKX.tick`, quái có trạng thái chậm `e.slw/e.slk`, `hurt()` nhân `G.kcm` (chuông vàng), `draw()` gọi `draw2d`.

## Đồ họa màn chơi
- `js/r3d_decor.js`: cỏ/hoa/tinh thể/nấm/đá than hồng phủ nền, đung đưa theo gió (shader), đổi kiểu theo chủ đề (tuyết, núi lửa, thiên giới, hư không/ma giới, hang, đầm lầy, sông biển, sa mạc), tránh nước/dung nham, Thấp: tắt · Vừa: ít · Cao: dày + phát sáng.
- Hậu kỳ mức Cao (`r3d.js`): Bloom (UnrealBloom) cho hiệu ứng cộng sáng + tối góc; tự tắt khi lỗi; `sv.bloom = 0` để tắt riêng. Bundle `vendor/three.bundle.js` build lại có EffectComposer/RenderPass/UnrealBloomPass/OutputPass/ShaderPass.
- Sửa gói APK: `scripts/prepare-web.js` thêm thư mục `vendor`.

## Test
`tests/skx_test.py` (11 skill cấp 5 + tiến hoá, 4 màn × 3D/2D, không lỗi), `tests/flow3d_test.py`, `tests/smoke_all.py` (chỉ còn lỗi 1-01 có sẵn từ bản gốc).

## Sự kiện Linh Tuyền
Mỗi ~55s (đầu tiên lúc 30s, không khi có boss) xuất hiện vòng Linh Tuyền cách người chơi ~260px, tồn tại 14s: đứng trong vòng hồi 2.5% sinh lực/giây và +25% tốc độ ra chiêu. Logic trong `js/skills_ext.js` (entity 'shrine'), 3D trong `js/r3d_skx.js`.

## Võ công riêng từng tướng (đúng khai báo trong data/characters.js)
Logic `js/skills_ext.js` (bảng HERO, nội tại, Tuyệt Kỹ), hiệu ứng `js/r3d_skx.js`. Tự tung khi có địch; hồi chiêu `G.cd.h1/h2`; sát thương = 20 + 1.5 × cấp Tướng (nhân hệ số công của trận).
| Tướng | Võ công 2 | Võ công 3 | Nội tại thêm | Tuyệt Kỹ thêm |
|---|---|---|---|---|
| Đinh Bộ Lĩnh | Chém Đoạn Hậu (cung sau lưng, đẩy lùi) | Hiệu Lệnh (+10% tốc đánh 4s) | Mỗi 20 hạ gục +30% sát thương 2.5s | 12 luồng kiếm quang toả ra |
| Lê Hoàn | Quét Ngang (vòng 360°) | Thiết Bích (chắn 120 sát thương 3s) | <40% máu giảm 15% sát thương nhận | Đại đao giáng + làm choáng 400px |
| Ngô Quyền | Thuỷ Triều Dâng (sóng nước đẩy lùi) | Lướt Sóng (lao 140px, miễn nhiễm 0.3s, +20% tốc chạy 2s) | — | Rừng cọc 4.5s làm chậm + gây sát thương |
| Trần Hưng Đạo | Hịch Tướng Sĩ (+15% công 5s) | Kết Trận (trận đồ làm chậm) | Sét chí mạng lan sang địch kề | 14 tia sét giáng ngẫu nhiên |
| Đinh Liễn | Loạt Tên (3 mũi toả quạt) | Nín Thở (bạo kích chắc chắn 2.2s) | Đầu mỗi đợt +25% sát thương | Mưa tên 3s |
| Nguyễn Bặc | Thuẫn Đập (choáng cung trước) | Thủ Thành (giảm 25% sát thương 4s) | 10% phản 40 sát thương khi bị đánh | Khiên +60% giảm sát thương 5s, hất văng |
| Lý Thường Kiệt | Song Kiếm Hợp Bích (chém chéo) | Thần Tốc (dịch chuyển sau lưng địch, bạo kích) | Hạ gục → bạo kích +20% sát thương 1.4s | Kiếm quang vàng quét một đường |
Hook trong index.html: `hurt()` (chắn/phản/giảm sát thương), `hit()` (sét lan), `ult()` (kèm hiệu ứng riêng). Test: `tests/hero_skill_test.py`.

---
# Phase 20 — Chỉnh chu đồ họa
- Boss / Mini Boss / Elite: trang trí riêng (`embellish` trong `js/r3d_actors.js`): mão sừng, giáp vai gai, lõi ngực phát sáng, gai sống lưng; Boss thêm áo choàng rách, đai sọ, mắt lớn phát sáng, tàn lửa bay quanh người.
- Hậu kỳ mức Cao: chỉnh màu theo chủ đề màn (đêm xanh lạnh, hoàng hôn/ núi lửa ấm, tuyết lạnh, ma giới tím, thiên giới vàng), tăng nhẹ độ bão hoà, bloom dịu lại (0.3) để không che nhân vật.
- Bụi chân theo màu nền khi nhân vật chạy (mọi mức trừ Thấp).
- Màn hình chính: ánh sáng dịu hơn, núi nhiều tầng đậm màu + sương hồng xa → có chiều sâu thay vì xám bệch.
