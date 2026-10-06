# Phase 5 — Database 52 chương × 6 màn (sinh tự động từ data/chapters.js)

Cấu trúc: Chapter → Stage → Wave → Enemy → Elite → MiniBoss → Boss → Reward. Mọi số liệu nằm ở `DV_DATA.rules` + bảng `CHAPTERS`; sửa rồi tải lại là 312 màn dựng lại.

| Ch | Tên chương | Địa danh | Chủ đề | Thời lượng (6 màn) | Lực chiến KN | Boss (cấp) | Mở mới |
|---|---|---|---|---|---|---|---|
| 1 | Khởi Đầu Đại Việt | Hoa Lư | plain | 05:00–06:40 | 500 | Hắc Long (T1) | Bản đồ mới: Đồng Bằng; Quái: Binh Lính; Quái: Trinh Sát; Quái: Du Binh; Quái: Giáp Nặng; Elite: Dũng Mãnh; Elite: Thần Tốc; Sự kiện: Phục Kích; Sự kiện: Tướng Vàng; Boss cấp 1: nova |
| 2 | Sóng Dậy Bạch Đằng | Bạch Đằng | river | 05:00–06:50 | 530 | Thuỷ Quái Bạch Đằng (T1) | Bản đồ mới: Sông Nước; Sự kiện: Suối Hồi Sinh |
| 3 | Lửa Vạn Kiếp | Vạn Kiếp | valley | 05:10–06:50 | 550 | Quỷ Vương Vạn Kiếp (T1) | Bản đồ mới: Thung Lũng; Quái: Cung Thủ; Sự kiện: Quân Ồ Ạt |
| 4 | Núi Rừng Lam Sơn | Lam Sơn | forest | 05:10–07:00 | 580 | Sơn Đại Vương (T1) | Bản đồ mới: Rừng Sâu |
| 5 | Đại La Hùng Thành | Đại La | citadel | 05:20–07:00 | 610 | Thần Tướng Đại La (T1) | Bản đồ mới: Thành Lũy |
| 6 | Tây Đô Quyết Chiến | Tây Đô | shadow | 07:00–08:40 | 640 | Ma Vương Tây Đô (T1) | Bản đồ mới: Ma Giới; Elite: Thiết Giáp; Sự kiện: Mưa Thiên Thạch |
| 7 | Sông Như Nguyệt | Như Nguyệt | river | 07:00–08:40 | 680 | Thuỷ Tướng Như Nguyệt (T1) | — |
| 8 | Ải Chi Lăng | Chi Lăng | valley | 07:00–08:50 | 710 | Mãnh Hổ Chi Lăng (T2) | Quái: Hoả Công; Quái: Thương Binh; Boss cấp 2: shoot |
| 9 | Ải Nam Quan | Nam Quan | mountain | 07:10–08:50 | 750 | Quan Thần Nam Quan (T2) | Bản đồ mới: Núi Đá; Quái: Thiết Giáp |
| 10 | Cánh Đồng Đồng Đăng | Đồng Đăng | plain | 07:10–08:50 | 790 | Tướng Quân Đồng Đăng (T2) | Elite: Lôi Pháp |
| 11 | Chiến Địa Tây Kết | Tây Kết | swamp | 07:10–08:50 | 830 | Hắc Thuỷ Tây Kết (T2) | Bản đồ mới: Đầm Lầy |
| 12 | Bến Đông Bộ Đầu | Đông Bộ Đầu | river | 07:10–08:50 | 870 | Thuỷ Tặc Đông Bộ (T2) | Quái: Quái Tách |
| 13 | Cửa Ải Hàm Tử | Hàm Tử | sea | 07:10–09:00 | 910 | Hải Long Hàm Tử (T2) | Bản đồ mới: Biển Đảo |
| 14 | Bãi Chương Dương | Chương Dương | plain | 07:20–09:00 | 960 | Cự Tượng Chương Dương (T3) | Boss cấp 3: summon |
| 15 | Tây Sơn Thượng Đạo | Thượng Đạo | forest | 07:20–09:00 | 1010 | Sơn Quân Thượng Đạo (T3) | Elite: Cuồng Nộ |
| 16 | Trận Ngọc Hồi | Ngọc Hồi | citadel | 09:00–10:40 | 1060 | Pháo Vương Ngọc Hồi (T3) | Quái: Pháp Sư |
| 17 | Rạch Gầm – Xoài Mút | Rạch Gầm | swamp | 09:00–10:40 | 1120 | Thuỷ Thần Rạch Gầm (T3) | — |
| 18 | Kinh Thành Phú Xuân | Phú Xuân | citadel | 09:00–10:50 | 1180 | Cấm Vệ Phú Xuân (T3) | — |
| 19 | Đèo Truông Mây | Truông Mây | mountain | 09:10–10:50 | 1240 | Phong Lang Truông Mây (T3) | — |
| 20 | Đèo Hải Vân | Hải Vân | sea | 09:10–10:50 | 1300 | Hải Vân Quỷ Quan (T3) | Quái: Triệu Hồi Sư; Elite: Hiệu Lệnh |
| 21 | Thăng Long Cổ Thành | Thăng Long | citadel | 09:10–10:50 | 1370 | Thành Hoàng Thăng Long (T4) | Boss cấp 4: dash |
| 22 | Hồ Gươm Huyền Bí | Hồ Gươm | river | 09:10–10:50 | 1440 | Thần Quy Hồ Gươm (T4) | — |
| 23 | Núi Tản Viên | Tản Viên | mountain | 09:10–11:00 | 1510 | Sơn Thần Tản Viên (T4) | — |
| 24 | Đất Tổ Phong Châu | Phong Châu | plain | 09:20–11:00 | 1590 | Ma Tướng Phong Châu (T4) | — |
| 25 | Thành Cổ Loa | Cổ Loa | citadel | 09:20–11:00 | 1670 | Nỏ Thần Cổ Loa (T4) | — |
| 26 | Mê Linh Dậy Sóng | Mê Linh | plain | 10:00–11:40 | 1760 | Tướng Quỷ Mê Linh (T4) | Elite: U Ảnh |
| 27 | Cửa Sông Hát Môn | Hát Môn | river | 10:00–11:40 | 1850 | Giao Long Hát Môn (T5) | Boss cấp 5: slam |
| 28 | Lũng Nhai Hang Sâu | Lũng Nhai | cave | 10:00–11:50 | 1940 | Cự Thạch Lũng Nhai (T5) | Bản đồ mới: Hang Động; Quái: Thích Khách; Quái: Cự Nhân |
| 29 | Núi Sóc Sơn | Sóc Sơn | mountain | 10:10–11:50 | 2040 | Thiết Kỵ Sóc Sơn (T5) | — |
| 30 | Đầm Dạ Trạch | Dạ Trạch | swamp | 10:10–11:50 | 2150 | Thuỷ Quái Dạ Trạch (T5) | — |
| 31 | Hang Thần Phù | Thần Phù | cave | 10:10–11:50 | 2260 | Thạch Linh Thần Phù (T5) | — |
| 32 | Đồi Ma Hoang | Đồi Ma | shadow | 10:10–11:50 | 2380 | U Linh Đồi Ma (T5) | — |
| 33 | Rừng Đước Cà Mau | Rừng Đước | forest | 10:10–12:00 | 2500 | Cá Sấu Chúa Rừng Đước (T5) | — |
| 34 | Hoàng Liên Tuyết Sơn | Hoàng Liên | snow | 10:20–12:00 | 2630 | Tuyết Vương Hoàng Liên (T6) | Bản đồ mới: Tuyết Sơn; Boss cấp 6: spiral |
| 35 | Cồn Cát Mũi Né | Mũi Né | desert | 10:20–12:00 | 2760 | Bọ Cạp Vương Mũi Né (T6) | Bản đồ mới: Sa Mạc |
| 36 | Núi Lửa Hỏa Diệm | Hỏa Diệm | volcano | 12:00–13:40 | 2910 | Hỏa Long Diệm Sơn (T6) | Bản đồ mới: Núi Lửa; Quái: Liệp Thủ; Elite: Đại Soái |
| 37 | Vực Sâu Biển Đông | Vực Sâu | sea | 12:00–13:40 | 3060 | Thuỷ Ma Vực Sâu (T6) | — |
| 38 | Đảo Quỷ Hoang | Đảo Quỷ | sea | 12:00–13:50 | 3210 | Hải Tặc Vương (T6) | — |
| 39 | Thành Ma Hắc Ám | Thành Ma | shadow | 12:10–13:50 | 3380 | Ma Tướng Hắc Thành (T6) | — |
| 40 | Mê Cung Vạn Cốt | Mê Cung | cave | 12:10–13:50 | 3550 | Cốt Vương Mê Cung (T7) | Boss cấp 7: shield |
| 41 | Đại Ngàn Trường Sơn | Trường Sơn | forest | 12:10–13:50 | 3740 | Chúa Sơn Lâm Trường Sơn (T7) | — |
| 42 | Cao Nguyên Bazan | Tây Nguyên | plain | 12:10–13:50 | 3930 | Voi Chúa Tây Nguyên (T7) | — |
| 43 | Cố Đô Phù Nam | Phù Nam | desert | 12:10–14:00 | 4130 | Pháp Sư Phù Nam (T7) | — |
| 44 | Tháp Chàm Cổ | Chiêm Thành | desert | 12:20–14:00 | 4350 | Thần Tháp Chiêm Thành (T7) | — |
| 45 | Kinh Đô Ma Giới | Ma Đô | shadow | 12:20–14:00 | 4570 | Ma Hoàng Kinh Đô (T7) | — |
| 46 | Cửa Âm Phủ | Âm Phủ | void | 14:00–15:40 | 4810 | Diêm Vương Âm Phủ (T7) | Bản đồ mới: Hư Không |
| 47 | Biển Mây Vân Hải | Vân Hải | heaven | 14:00–15:50 | 5050 | Thần Vân Vân Hải (T8) | Bản đồ mới: Thiên Giới; Boss cấp 8: enrage |
| 48 | Cửa Thiên Môn | Thiên Môn | heaven | 14:10–15:50 | 5320 | Thiên Tướng Thiên Môn (T8) | — |
| 49 | Lôi Giới Thiên Kiếp | Lôi Giới | volcano | 14:10–16:00 | 5590 | Lôi Thần Thiên Kiếp (T8) | — |
| 50 | Vực Hư Không | Hư Không | void | 14:20–16:00 | 5880 | Hư Không Ma Chủ (T8) | — |
| 51 | Long Cung Đáy Biển | Long Cung | sea | 16:00–19:20 | 6180 | Long Vương Long Cung (T8) | — |
| 52 | Bình Minh Đại Việt | Bình Minh | heaven | 16:40–20:00 | 6500 | Chúa Tể Thiên Long (T8) | — |

## Vai trò 6 màn trong chương
1 intro · 2 standard · 3 siege (nhiều quái dày) · 4 elite (Boss rút gọn) · 5 treasure (Tướng Vàng) · 6 boss (Boss chương). Màn 1–3 và 5 kết thúc bằng Guardian (Mini Boss lớn).

## Ví dụ timeline màn 30-06 (chương 30, Boss)

```
00:00  Khởi đầu
00:19  Đợt thường
01:05  Đợt thường
01:52  Tinh Anh
02:39  Đợt dày đặc
03:26  Sự kiện
03:54  Mini Boss
04:31  Đợt thường
05:18  Đợt thường
06:05  Tinh Anh
06:52  Đợt dày đặc
07:38  Sự kiện
08:06  Mini Boss
08:44  Đợt cuối
09:40  Boss
11:50  Chiến thắng
```

## Ví dụ Wave (3 wave đầu của 30-06)

```json
[
 {
  "startTime": 0,
  "endTime": 19,
  "kind": "start",
  "label": "Khởi đầu",
  "enemyPool": [
   [
    "swarm",
    1
   ],
   [
    "grunt",
    0.29
   ]
  ],
  "spawnCount": 2,
  "spawnInterval": 1.01,
  "spawnPattern": "ring",
  "maxAlive": 14,
  "eliteChance": 0,
  "difficultyMultiplier": 3.715,
  "scale": {
   "hp": 3.715,
   "dmg": 2.058,
   "sp": 1.126,
   "exp": 2.225
  },
  "specialEvent": null
 },
 {
  "startTime": 19,
  "endTime": 65,
  "kind": "wave",
  "label": "Đợt thường",
  "enemyPool": [
   [
    "swarm",
    1
   ],
   [
    "grunt",
    0.29
   ],
   [
    "bomber",
    0.5
   ],
   [
    "splitter",
    1
   ]
  ],
  "spawnCount": 2,
  "spawnInterval": 0.65,
  "spawnPattern": "burst",
  "maxAlive": 33,
  "eliteChance": 0.05,
  "difficultyMultiplier": 4,
  "scale": {
   "hp": 4,
   "dmg": 2.143,
   "sp": 1.133,
   "exp": 0.864
  },
  "specialEvent": null
 },
 {
  "startTime": 65,
  "endTime": 112,
  "kind": "wave",
  "label": "Đợt thường",
  "enemyPool": [
   [
    "swarm",
    1
   ],
   [
    "grunt",
    0.29
   ],
   [
    "bomber",
    0.5
   ],
   [
    "splitter",
    1
   ],
   [
    "shaman",
    0.8
   ]
  ],
  "spawnCount": 2,
  "spawnInterval": 0.63,
  "spawnPattern": "ring",
  "maxAlive": 35,
  "eliteChance": 0.05,
  "difficultyMultiplier": 4.407,
  "scale": {
   "hp": 4.407,
   "dmg": 2.261,
   "sp": 1.143,
   "exp": 1.288
  },
  "specialEvent": null
 }
]
```

## Thưởng & 3 sao 30-06

```json
{
 "rewards": {
  "exp": 24875,
  "gold": 27165,
  "killExpMul": 4.58,
  "killGoldMul": 4.58,
  "equipment": {
   "drops": 3,
   "minRarity": 1,
   "bias": 18
  },
  "materials": {
   "tinh": 200
  },
  "charMaterials": {
   "hon": 21
  },
  "firstClear": {
   "gem": 120,
   "gold": 27165,
   "materials": {
    "tinh": 200
   },
   "charMaterials": {
    "hon": 32
   },
   "equipment": {
    "drops": 1,
    "minRarity": 2,
    "bias": 18
   }
  },
  "star3": {
   "gem": 40,
   "materials": {
    "tinh": 300
   },
   "charMaterials": {
    "hon": 4
   }
  },
  "perStarGem": 3
 },
 "stars": [
  "Hoàn thành trong 13:00",
  "Không bị hạ: sinh lực luôn ≥ 42%",
  "Hạ Boss trong 111s sau khi xuất hiện"
 ]
}
```
