# Phase 6 — Map & Môi trường

Engine: `js/environment.js` (`window.DV_ENV`) · Dữ liệu: `data/environments.js` · Kiểm thử: `python3 tests/env_test.py`

## Thành phần

| Hạng mục | Nội dung |
|---|---|
| 52 khu vực | Mỗi chương có buổi trong ngày, thời tiết, vùng địa hình, hazard, chướng ngại và đấu trường Boss riêng (bảng dưới) |
| Background | Tile nền bake sẵn 16 biến thể/khu theo 15 chủ đề, mảng sáng/tối vĩ mô, lớp phủ cuộn xa (bóng mây, sương, tán rừng, quầng nhiệt, sao) |
| Terrain | 23 loại chướng ngại có va chạm, vẽ y-sort cùng quái; 8 loại vùng địa hình: bùn, nước, băng, dung nham, đầm độc, cát lún, thánh địa, vết nứt |
| Weather | 12 kiểu: hoa rơi, mưa, bão (có chớp sét), tuyết, bão tuyết, cát bay, tro, tàn lửa, sương, bào tử, linh quang, mưa phùn |
| Lighting | 4 buổi (bình minh/ngày/hoàng hôn/đêm), đèn quanh người chơi, nguồn sáng từ dung nham/lò lửa/Boss, tia nắng, vignette theo khu |
| Boss Arena | Phong ấn vòng tròn bán kính 430 (Guardian 72%, Lite 88%): sàn rune bake riêng theo chủ đề và cấp Boss, cột trụ, vòng chắn đổi màu theo phase, giữ người chơi và quái trong vòng, xoá chướng ngại/vùng đất bên trong, tắt hazard thường, vỡ khi Boss chết |
| Environmental effects | Vùng đất: làm chậm / trượt băng / sát thương / hồi máu. Hazard có báo hiệu: sét, đá rơi, băng rơi, dung nham phun, thiên thạch, thiên quang, nứt hư không, gió giật, độc khí, sóng dữ, cốt thương, hồn lửa |

## Cân bằng

- Mọi sát thương môi trường nằm ở `DV_DATA.envRules` (hazard 5% máu tối đa, lava 2.8%/0.8s, độc 1.4%/0.8s).
- Sát thương môi trường **không giết người chơi** (chừa ≥1 máu) và **không tính vào số lần trúng đòn** của điều kiện 3 sao; vẫn ảnh hưởng mốc máu thấp nhất.
- Không có vùng đất trong 300px quanh điểm xuất phát; hazard bắt đầu sau 9 giây.

## Tắt / quay lại nền cũ

Bỏ hai thẻ `<script>` môi trường trong `index.html`, hoặc để `DV_DATA.envValidate()` trả lỗi: game tự dùng nền cũ.

## 52 khu vực

| # | Chương | Chủ đề | Buổi | Thời tiết | Vùng đất | Hazard | Đấu trường |
|---|---|---|---|---|---|---|---|
| 1 | Khởi Đầu Đại Việt | plain | dawn | petals (1) | mud | — | Đài Cố Đô |
| 2 | Sóng Dậy Bạch Đằng | river | dusk | spray (1) | water | wave | Bến Cọc Ngầm |
| 3 | Lửa Vạn Kiếp | valley | dusk | ember (1) | mud | meteor | Sân Hoả Đài |
| 4 | Núi Rừng Lam Sơn | forest | day | petals (1) | mud | — | Gốc Đa Nghìn Năm |
| 5 | Đại La Hùng Thành | citadel | day | none (0) | — | beam | Điện Đại La |
| 6 | Tây Đô Quyết Chiến | shadow | night | fog (2) | rift | soul | Ma Đàn Tây Đô |
| 7 | Sông Như Nguyệt | river | night | rain (2) | water | bolt | Bến Đêm Như Nguyệt |
| 8 | Ải Chi Lăng | valley | dawn | fog (2) | mud | rock | Ải Phục Binh |
| 9 | Ải Nam Quan | mountain | day | none (0) | ice | rock | Cổng Ải Nam Quan |
| 10 | Cánh Đồng Đồng Đăng | plain | dusk | sand (1) | mud | gust | Bãi Chiến Đồng Đăng |
| 11 | Chiến Địa Tây Kết | swamp | night | spore (2) | mud, poison | spore | Đầm Sương Tây Kết |
| 12 | Bến Đông Bộ Đầu | river | day | rain (1) | water, mud | — | Bến Đông Bộ |
| 13 | Cửa Ải Hàm Tử | sea | dawn | spray (1) | water, sand | wave | Đảo Hàm Tử |
| 14 | Bãi Chương Dương | plain | day | sand (1) | — | gust | Bãi Cát Chương Dương |
| 15 | Tây Sơn Thượng Đạo | forest | dusk | petals (1) | mud | — | Cổng Thượng Đạo |
| 16 | Trận Ngọc Hồi | citadel | dawn | ash (2) | — | meteor | Luỹ Ngọc Hồi |
| 17 | Rạch Gầm – Xoài Mút | swamp | dusk | rain (2) | water, mud | bolt | Rạch Gầm Xoài Mút |
| 18 | Kinh Thành Phú Xuân | citadel | night | petals (1) | — | beam | Điện Kinh Thành |
| 19 | Đèo Truông Mây | mountain | dusk | fog (2) | ice | rock | Đỉnh Truông Mây |
| 20 | Đèo Hải Vân | sea | dawn | storm (2) | water | bolt | Quan Hải Vân |
| 21 | Thăng Long Cổ Thành | citadel | day | petals (1) | — | beam | Điện Kính Thiên |
| 22 | Hồ Gươm Huyền Bí | river | night | fog (1) | water | wave | Tháp Rùa |
| 23 | Núi Tản Viên | mountain | dawn | fog (1) | ice | icicle | Đỉnh Tản Viên |
| 24 | Đất Tổ Phong Châu | plain | day | petals (1) | mud | — | Đền Hùng |
| 25 | Thành Cổ Loa | citadel | dusk | ash (1) | — | meteor | Vòng Ốc Cổ Loa |
| 26 | Mê Linh Dậy Sóng | plain | dusk | sand (2) | mud | gust | Đài Hai Bà |
| 27 | Cửa Sông Hát Môn | river | dusk | storm (2) | water | bolt | Ngã Ba Hát Môn |
| 28 | Lũng Nhai Hang Sâu | cave | night | motes (1) | water, poison | rock | Hang Lũng Nhai |
| 29 | Núi Sóc Sơn | mountain | dawn | blizzard (1) | ice | icicle | Đỉnh Sóc Sơn |
| 30 | Đầm Dạ Trạch | swamp | night | spore (2) | mud, poison | spore | Đầm Dạ Trạch |
| 31 | Hang Thần Phù | cave | night | motes (2) | water | rock | Điện Thạch Nhũ |
| 32 | Đồi Ma Hoang | shadow | night | fog (2) | rift, poison | soul | Gò Đồi Ma |
| 33 | Rừng Đước Cà Mau | forest | dusk | spore (1) | mud, water | — | Cửa Rừng Đước |
| 34 | Hoàng Liên Tuyết Sơn | snow | day | snow (2) | ice | icicle | Đỉnh Hoàng Liên |
| 35 | Cồn Cát Mũi Né | desert | day | sand (2) | sand | gust | Cồn Cát Mũi Né |
| 36 | Núi Lửa Hỏa Diệm | volcano | dusk | ember (2) | lava | geyser | Hố Hỏa Diệm |
| 37 | Vực Sâu Biển Đông | sea | night | rain (2) | water | wave | Vực Biển Đông |
| 38 | Đảo Quỷ Hoang | sea | dusk | storm (2) | sand, water | bolt | Đảo Hải Tặc |
| 39 | Thành Ma Hắc Ám | shadow | night | ash (2) | rift | soul | Điện Hắc Thành |
| 40 | Mê Cung Vạn Cốt | cave | night | none (0) | poison | bone | Hầm Vạn Cốt |
| 41 | Đại Ngàn Trường Sơn | forest | dawn | rain (2) | mud, water | bolt | Đèo Trường Sơn |
| 42 | Cao Nguyên Bazan | plain | dusk | sand (1) | mud | gust | Cao Nguyên Bazan |
| 43 | Cố Đô Phù Nam | desert | day | sand (1) | sand | gust | Đô Thành Phù Nam |
| 44 | Tháp Chàm Cổ | desert | dusk | ash (1) | sand | beam | Tháp Chàm |
| 45 | Kinh Đô Ma Giới | shadow | night | ember (2) | rift, lava | geyser | Ngai Ma Hoàng |
| 46 | Cửa Âm Phủ | void | night | motes (2) | rift | rift | Điện Diêm La |
| 47 | Biển Mây Vân Hải | heaven | day | motes (1) | holy | beam | Đài Vân Hải |
| 48 | Cửa Thiên Môn | heaven | dawn | motes (2) | holy | beam | Cổng Thiên Môn |
| 49 | Lôi Giới Thiên Kiếp | volcano | dusk | storm (3) | lava | bolt | Lôi Đài |
| 50 | Vực Hư Không | void | night | motes (3) | rift | rift | Tâm Hư Không |
| 51 | Long Cung Đáy Biển | sea | night | spray (2) | water | wave | Điện Long Cung |
| 52 | Bình Minh Đại Việt | heaven | dawn | motes (3) | holy | beam | Đỉnh Bình Minh |
