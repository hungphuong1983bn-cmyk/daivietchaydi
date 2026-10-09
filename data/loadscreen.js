/* Phase 13 — LOADING SCREEN: dữ liệu bổ sung (thuần dữ liệu).
   Màn Loading KHÔNG hard-code từng màn. js/loading.js dựng nội dung từ dữ liệu game thật:
     ChapterData  DV_DATA.getChapter(c)        tên chương, enemyPool, boss, rewards, recommendedPower, theme
     StageData    DV_DATA.getStage(c,i)        loại màn, thưởng, độ khó, timeline sự kiện, boss.mech
     MapData      DV_DATA.maps / envThemes / envAreas   chủ đề, buổi trong ngày, thời tiết, địa hình, hazard, tên khu vực
     EnemyData    DV_DATA.enemies / elites / miniBosses  tên + khả năng quái
     BossData     stage.boss (tên, mech) + DV_DATA.realm.wboss (Boss Thế Giới)
     EventData    DV_DATA.events + bảng `events` dưới đây (Đại chiến Boss · Bí Cảnh · Thí Luyện · Tinh Anh · Mùa giải)
     SeasonData   `season` dưới đây
   File này chỉ chứa phần KHÔNG có sẵn ở nơi khác: lời mẹo tĩnh, tên đòn Boss theo cơ chế, mẫu màn Sự kiện. Thêm mẹo = thêm một dòng. */
window.DV_DATA = window.DV_DATA || {};
DV_DATA.loadscreen = {
  minTime: 1.7,            /* giây tối thiểu để người chơi kịp đọc (giảm chuyển động: 0.7) */
  bossTime: 2.3,
  status: { start: 'Đang chuẩn bị chiến trường...', enemies: 'Đang triệu hồi quái...', boss: 'Đang chuẩn bị Boss...', env: 'Đang bố trí địa hình...', audio: 'Đang nạp âm thanh...', ready: 'Sẵn sàng xuất trận!' },

  /* tên đòn Boss theo cơ chế `mech[].k` (cơ chế lấy từ data/monsters.js) */
  skillName: {
    nova: 'Vạn Khí Bùng Nổ', shoot: 'Phi Tiễn Truy Hồn', spiral: 'Xoáy Đạn Ma Vực', dash: 'Xung Phong Phá Trận', slam: 'Địa Chấn Trảm',
    rain: 'Mưa Thiên Thạch', summon: 'Triệu Hồi Quân', heal: 'Hồi Sinh Thuật', shield: 'Hộ Thể Kim Chung', enrage: 'Cuồng Nộ'
  },
  /* mẹo theo cơ chế Boss: {pct} = % máu kích hoạt (pha 2 = 66%, pha 3 = 33%) */
  mechTip: {
    summon: 'Boss triệu hồi quái khi máu xuống dưới {pct}% — dọn quân nhỏ rồi quay lại đánh Boss.',
    slam: 'Vòng đỏ dưới chân báo trước đòn Địa Chấn — rời khỏi vòng trước khi nó thu hẹp hết.',
    nova: 'Boss bắn vòng đạn toả đều — đứng giữa hai viên đạn và chạy vòng quanh.',
    spiral: 'Xoáy đạn quay liên tục — di chuyển ngược chiều xoáy để dễ né.',
    dash: 'Boss gồng người rồi lao thẳng — thấy vạch đỏ hãy đổi hướng ngang.',
    rain: 'Mưa thiên thạch rơi theo vòng đỏ — đừng đứng yên một chỗ.',
    shield: 'Khi Boss dựng khiên, sát thương nhận vào bị giảm — chờ khiên tan rồi dồn Tuyệt Kỹ.',
    heal: 'Boss hồi máu cho quái xung quanh — hạ quái hồi máu trước.',
    enrage: 'Máu thấp Boss sẽ cuồng nộ, chạy nhanh và đánh dồn dập — giữ sẵn Tuyệt Kỹ.',
    shoot: 'Boss ngắm bắn nhiều viên cùng lúc — giữ khoảng cách vừa phải và né ngang.'
  },
  zoneTip: {
    mud: 'Vùng bùn làm bạn chậm đi rõ rệt — tránh bị dồn vào bùn khi quái đông.',
    water: 'Nước nông làm giảm tốc độ di chuyển.',
    ice: 'Mặt băng trơn — khó đổi hướng, hãy chuyển hướng sớm.',
    lava: 'Dung nham gây sát thương mỗi nhịp — đừng đứng trên vùng đỏ cam.',
    poison: 'Đầm độc vừa gây sát thương vừa làm chậm.',
    sand: 'Cát lún làm chậm bước chân.',
    holy: 'Vùng thánh quang hồi sinh lực dần — dụ quái đứng ngoài và dưỡng sức ở đây.',
    rift: 'Khe nứt hư không làm chậm người bước vào.'
  },
  hazardTip: {
    bolt: 'Sét đánh theo vòng báo hiệu — nghe tiếng sấm là phải rời chỗ.', rock: 'Đá rơi từ trên cao — quan sát vòng bóng đổ dưới đất.',
    icicle: 'Băng nhọn rơi theo vòng báo trước.', geyser: 'Dung nham phun lên từ vết nứt — tránh các vết đỏ.', meteor: 'Mưa thiên thạch — vòng đỏ báo hiệu điểm rơi.',
    beam: 'Thiên quang quét xuống theo vòng sáng — rời đi ngay khi thấy.', rift: 'Nứt hư không mở ra dưới chân — luôn di chuyển.',
    gust: 'Gió giật đẩy người chơi — đừng sát mép vùng nguy hiểm.', spore: 'Độc khí bốc lên từng đợt — tránh khói tím.',
    wave: 'Sóng thần ập vào — chạy ngang theo hướng sóng.', bone: 'Cốt thương trồi lên từ đất — vạch trắng báo trước.', soul: 'Hồn lửa bay theo người chơi — kéo chúng ra xa quái.'
  },

  /* mẫu màn Sự kiện / chế độ đặc biệt (không dùng Loading của Chương) */
  events: {
    wb: { title: 'ĐẠI CHIẾN BOSS', sub: 'HẮC LONG', theme: 'volcano', tod: 'dusk', hue: 8, boss: 'wb', tag: 'Boss Thế Giới', tipKey: 'wb',
      rewards: [['🎟', 'Hoa Lư Token'], ['🏆', 'Điểm sát thương'], ['💎', 'Thưởng hạng']], status: 'Đang đánh thức Hắc Long...' },
    rift: { title: 'BÍ CẢNH', tag: 'Bí Cảnh', tipKey: 'rift', status: 'Đang mở cổng Bí Cảnh...' },
    trial: { title: 'ĐẠI HỘI VÕ LÂM', sub: 'THÍ LUYỆN', theme: 'citadel', tod: 'dusk', hue: 35, arena: 1, tag: 'Võ Đài', tipKey: 'trial',
      rewards: [['✨', 'EXP'], ['⚙', 'Tinh thiết'], ['🔮', 'Hồn tướng']], status: 'Đang dựng võ đài...' },
    elite: { title: 'ẢI TINH ANH', tag: 'Tinh Anh', tipKey: 'elite', status: 'Đang tập hợp tinh binh...' },
    season: { title: 'MÙA GIẢI', theme: 'heaven', tod: 'dawn', hue: 48, tag: 'Mùa Giải', tipKey: 'season', status: 'Đang vào mùa giải...' }
  },
  /* loại Bí Cảnh (DV_DATA.realm.types[].id) → chủ đề artwork */
  riftTheme: { ore: ['cave', 'night', 215], gold: ['desert', 'day', 42], exp: ['heaven', 'dawn', 205], soul: ['shadow', 'night', 280], gear: ['volcano', 'dusk', 15], rune: ['mountain', 'dusk', 24], gem: ['snow', 'day', 190] },

  /* mẹo tĩnh (c = nhóm). Mẹo động (boss/quái/môn phái/tướng/sự kiện/địa hình) do loading.js sinh từ DB. */
  tips: [
    { c: 'combat', t: 'Võ công tự động ra đòn — hãy tập trung di chuyển để gom quái và né đạn.' },
    { c: 'combat', t: 'Hạ gục quái để nạp Tuyệt Kỹ. Khi nút sáng lên hãy bấm để quét sạch đám đông quanh mình.' },
    { c: 'combat', t: 'Cầu xanh là EXP, cầu xanh lục hồi máu, đồng vàng để nâng cấp — đừng bỏ lỡ khi an toàn.' },
    { c: 'combat', t: 'Vòng đỏ dưới chân là vùng báo đòn: rời khỏi trước khi vòng thu hẹp hết.' },
    { c: 'combat', t: 'Quái đông bất thường? Camera tự zoom out nhẹ để bạn nhìn thấy nhiều quái hơn.' },
    { c: 'camera', t: 'Bạn có thể zoom bằng nút ＋ －, lăn chuột hoặc kẹp hai ngón. Chạm vào số % để về mức chuẩn.' },
    { c: 'combo', t: 'Đánh liên tục để dồn Combo: các mốc 10 · 20 · 30 · 50 · 100 HIT có hiệu ứng và âm thanh riêng. Ngừng đánh ~2 giây là combo reset.' },
    { c: 'combo', t: 'Đòn Bạo Kích có loé sáng, ngôi sao và âm thanh riêng — tăng Bạo kích bằng trang bị và Phù Văn.' },
    { c: 'element', t: 'Mỗi võ công có âm thanh và hiệu ứng riêng: kiếm leng keng, đao nặng nề, lôi nổ giòn, băng vỡ vụn, độc sủi bọt, gió xé không khí.' },
    { c: 'element', t: 'Nghe tiếng là biết đòn: tụ lực rít lên rồi trầm xuống là Tuyệt Kỹ sắp bùng nổ.' },
    { c: 'element', t: 'Quái giáp phát tiếng kim loại, quái đá nứt vỡ, quái thú gầm nhẹ — dựa vào đó để nhận ra loại quái trong đám đông.' },
    { c: 'gear', t: 'Trang bị nâng tối đa Lv.10, sau đó có thể Tinh Luyện thêm tối đa 5 lần.' },
    { c: 'gear', t: 'Dùng "Mặc đồ tốt nhất" trong màn Tướng để tự chọn trang bị mạnh nhất còn rảnh.' },
    { c: 'gear', t: 'Phù Văn Thạch chỉ rơi ở Bí Cảnh Phù Văn Các — hãy tích trữ trước khi nâng Phù Văn.' },
    { c: 'level', t: 'Đạt trần cấp trong ván, EXP sẽ chuyển thành vàng — hãy tận dụng để nâng cấp võ công cao nhất.' },
    { c: 'level', t: 'Võ công đạt Lv.5 cùng võ công hỗ trợ đủ cấp sẽ xuất hiện thẻ vàng TIẾN HOÁ ở vị trí đầu tiên.' },
    { c: 'stage', t: 'Đạt 3 sao ở màn thường để mở Ải Tinh Anh và chức năng Quét ải.' },
    { c: 'stage', t: 'Thể lực hồi theo thời gian — Ải Tinh Anh tốn nhiều thể lực hơn nhưng thưởng cao hơn.' },
    { c: 'enemy', t: 'Quái Tách chết sẽ chia thành hai Trinh Sát — dọn gọn trước khi chúng tản ra.' },
    { c: 'enemy', t: 'Hoả Công tự nổ khi áp sát — đánh từ xa và đừng để chúng dồn bạn vào góc.' },
    { c: 'enemy', t: 'Thích Khách lao nhanh sau khi gồng — thấy vạch đỏ thì đổi hướng ngang.' },
    { c: 'enemy', t: 'Pháp Sư hồi máu cho quái xung quanh: ưu tiên hạ trước để đám quái không "trâu" lên.' },
    { c: 'enemy', t: 'Cung Thủ đứng xa bắn tỉa — áp sát bằng cách đi vòng, đừng chạy thẳng vào mũi tên.' }
  ],
  tipLabel: { combat: 'CHIẾN ĐẤU', camera: 'CAMERA', combo: 'COMBO', element: 'VÕ CÔNG', gear: 'TRANG BỊ', level: 'CẢNH GIỚI', stage: 'ẢI', enemy: 'KẺ ĐỊCH', boss: 'BOSS', zone: 'ĐỊA HÌNH', hero: 'TƯỚNG', sect: 'MÔN PHÁI', event: 'SỰ KIỆN', skill: 'TIẾN HOÁ', rift: 'BÍ CẢNH', wb: 'BOSS THẾ GIỚI', trial: 'THÍ LUYỆN', elite: 'TINH ANH', season: 'MÙA GIẢI' },
  /* mẹo riêng cho từng chế độ */
  modeTips: {
    wb: ['Hắc Long có 3 giai đoạn; từ giai đoạn 2 xuất hiện mưa thiên thạch và Địa Chấn — luôn quan sát vòng đỏ.', 'Điểm sát thương Boss Thế Giới quyết định hạng nhận thưởng cuối kỳ — dồn Tuyệt Kỹ khi Boss đứng yên.'],
    rift: ['Mỗi Bí Cảnh có biến số ngẫu nhiên (Cuồng Phong, Thú Triều, Thiên Thạch...) — đọc kỹ trước khi vào.', 'Số lượt Bí Cảnh có giới hạn mỗi ngày; tầng cao hơn thưởng tốt hơn.'],
    trial: ['Thí Luyện càng lâu quái càng mạnh — mỗi lần lên cấp bạn chọn 1 trong 3 thẻ nâng cấp %.', 'Hạng Thí Luyện càng cao, thưởng Tinh thiết và Hồn tướng càng nhiều.'],
    elite: ['Ải Tinh Anh có quái mạnh hơn, đông hơn và Boss máu gấp đôi — chuẩn bị Tuyệt Kỹ.', 'Mỗi màn có số lượt Tinh Anh giới hạn mỗi ngày.'],
    season: ['Hoàn thành nhiệm vụ mùa để nhận điểm Battle Pass.']
  }
};
