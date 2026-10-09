# Phase 13 — Âm thanh chiến đấu · VFX phân lớp · Camera zoom · Loading Screen

Không đổi sát thương/cân bằng/save. Thiếu file mới → game tự dùng bản cũ (mọi chỗ gọi đều có nhánh dự phòng).

## File mới
| File | Vai trò |
|---|---|
| `data/skillfx.js` | SkillData: skillId, skillName, element, castSFX, chargeSFX, travelSFX, hitSFX, impactSFX, criticalSFX, ultimateSFX, vfx, cameraEffect (4 võ công + tiến hoá + 7 tuyệt kỹ); chất liệu quái; mốc Combo; mixer mặc định |
| `js/audio.js` | `DV_AUDIO`: 75 âm tổng hợp bằng WebAudio, 8 bus (music/sfx/skill/hit/boss/ui/env/voice), limiter, ducking, giới hạn giọng + ưu tiên, biến thiên cao độ |
| `js/vfx2.js` | `DV_VFX2`: VFX nhiều lớp theo nhóm (kiếm/đao/quyền/chưởng/hỏa/băng/lôi/độc/phong), chất liệu, chí mạng, Combo, tuyệt kỹ, banner Boss |
| `js/camera.js` | `DV_CAM`: zoom tay (＋ － / lăn chuột / kẹp 2 ngón / phím - = 0) + camera tự động |
| `data/loadscreen.js`, `js/loading.js` | `DV_LOAD`: Loading Screen dựng từ dữ liệu màn thật |
| `tests/phase13_test.py` | kiểm thử (xem cuối) |

## Âm thanh
- Mỗi nhóm có công thức riêng (không dùng chung): kiếm = vút + ngân kim loại; đao = nặng + shockwave; quyền = thump cơ thể; chưởng = khí + nổ năng lượng; hỏa = whoosh + lách tách + nổ; băng = pha lê + nứt + vỡ; lôi = tụ điện + tách + sấm; độc = năng lượng méo + bọt; phong = xé gió.
- Mỗi `SkillData` trỏ tới tên SFX; `DV_AUDIO.validate()` kiểm mọi tên đều tồn tại.
- Va chạm = lớp kỹ năng + lớp chất liệu (người/giáp/đá/thú/boss) + chí mạng + bass nặng + phản ứng Boss. Ngân sách 2 giọng/70 ms cho đòn thường.
- Tuyệt kỹ: tụ lực → tung → chạm → "cinematic impact"; nhạc nền hạ còn 35% rồi trở lại, bus Kỹ năng nổi lên.
- Đòn Boss (`nova/shoot/spiral/dash/slam/rain/summon/heal/shield`) có âm riêng; Slam có tiếng báo trước + tiếng giáng.
- Mixer có thanh trượt trong **Cài đặt**.

## Camera
- Thế giới được vẽ ở kích thước ảo `W/z × H/z` → zoom out **thấy thêm quái thật**; spawn và quái bị bỏ xa tính theo vùng nhìn ảo.
- Tự động: ít quái 100% → nhiều quái ~84% · Boss 80–90% · cảnh Boss xuất hiện ~80% rồi trả lại · kỹ năng/tuyệt kỹ phạm vi lớn zoom out nhẹ. Kẹp [0.62, 1.25]; zoom out nhanh hơn zoom in để không mất tầm nhìn.
- Bật/tắt camera tự động và xem zoom trong Cài đặt; zoom của người chơi được lưu.

## Loading Screen
Chương/Màn/Map/Boss/Quái/Thưởng/Độ khó/Lực chiến/Mẹo lấy từ `DV_DATA` (getChapter/getStage/maps/envAreas/enemies/realm/events/characters/skills/sect). Artwork procedural riêng cho 15 chủ đề × 4 buổi, hạt thời tiết theo khu, parallax 3 lớp. Có màn riêng: Đại Chiến Boss (Hắc Long), Bí Cảnh (theo loại), Thí Luyện (võ đài), Ải Tinh Anh, Mùa giải (`ST.season`).

## Kiểm thử
`python3 tests/phase13_test.py OUT` — hợp lệ SFX, dựng offline 75 âm, thông tin Loading cho 6 kịch bản, ảnh Loading/VFX/tuyệt kỹ, camera ít/nhiều quái. `?debug` rút ngắn Loading còn 0.25 s.
