/* Phase 13 — SkillData: âm thanh · hiệu ứng · camera cho từng võ công (data-driven).
   Mỗi bản ghi:  skillId · skillName · element · weapon · castSFX · chargeSFX · travelSFX · hitSFX · impactSFX · criticalSFX · ultimateSFX · vfx · cameraEffect
   - Tên SFX ("kiem.cast", "hoa.explode"...) là khoá trong js/audio.js (DV_AUDIO.recipes). Đổi tên ở đây = đổi âm thanh, không cần sửa code.
   - evo = phần ghi đè khi võ công đã Tiến Hoá.
   - cameraEffect: { wide: bán kính vùng tác động (px) → camera tự zoom-out nhẹ để thấy hết · shake: rung nhẹ 0..0.6 · punch: zoom-in thoáng lúc tung chiêu }
   Nhóm âm thanh (element): kiem · dao · quyen · chuong · hoa · bang · loi · doc · phong
   Thiếu file → game dùng âm thanh/hiệu ứng cũ (mọi chỗ gọi đều có nhánh dự phòng). */
window.DV_DATA = window.DV_DATA || {};
DV_DATA.skillfx = {
  /* ===== Mixer: âm lượng mặc định của từng nhóm (người chơi chỉnh trong Cài đặt) ===== */
  mix: { music: .30, sfx: .80, skill: .90, hit: .85, boss: 1.0, ui: .60, env: .50, voice: .80 },
  mixLabel: { music: 'Nhạc nền', sfx: 'Hiệu ứng chung', skill: 'Kỹ năng', hit: 'Va chạm', boss: 'Boss', ui: 'Giao diện', env: 'Môi trường', voice: 'Giọng nói' },

  /* ===== Võ công thường ===== */
  skills: {
    kiem: { skillId: 'kiem', skillName: 'Kiếm Khí', element: 'kiem', weapon: 'sword',
      castSFX: 'kiem.cast', chargeSFX: null, travelSFX: 'kiem.travel', hitSFX: 'kiem.hit', impactSFX: 'kiem.impact', criticalSFX: 'crit.kiem', ultimateSFX: null,
      vfx: 'kiem', cameraEffect: { wide: 0, shake: 0, punch: 0 },
      evo: { skillName: 'Vạn Kiếm Quy Tông', castSFX: 'kiem.cast2', travelSFX: 'kiem.travel', impactSFX: 'kiem.impact2', cameraEffect: { wide: 150, shake: .06 } } },
    loi: { skillId: 'loi', skillName: 'Lôi Động', element: 'loi', weapon: 'thunder',
      castSFX: 'loi.charge', chargeSFX: 'loi.charge', travelSFX: null, hitSFX: 'loi.crack', impactSFX: 'loi.thunder', criticalSFX: 'crit.loi', ultimateSFX: null,
      vfx: 'loi', cameraEffect: { wide: 0, shake: .1, punch: 0 },
      evo: { skillName: 'Thiên Lôi Giáng Thế', impactSFX: 'loi.thunder2', cameraEffect: { wide: 190, shake: .16 } } },
    hang: { skillId: 'hang', skillName: 'Hàng Long Chưởng', element: 'chuong', weapon: 'palm',
      castSFX: 'chuong.cast', chargeSFX: 'chuong.charge', travelSFX: null, hitSFX: 'chuong.hit', impactSFX: 'chuong.impact', criticalSFX: 'crit.chuong', ultimateSFX: null,
      vfx: 'chuong', cameraEffect: { wide: 160, shake: .2, punch: 0 },
      evo: { skillName: 'Kháng Long Hữu Hối', element: 'hoa', castSFX: 'hoa.whoosh', hitSFX: 'hoa.hit', impactSFX: 'hoa.explode', criticalSFX: 'crit.hoa', cameraEffect: { wide: 230, shake: .28 } } },
    phi: { skillId: 'phi', skillName: 'Phi Kiếm', element: 'phong', weapon: 'sword',
      castSFX: 'phong.whoosh', chargeSFX: null, travelSFX: 'phong.whoosh', hitSFX: 'phong.slash', impactSFX: 'phong.burst', criticalSFX: 'crit.phong', ultimateSFX: null,
      vfx: 'phong', cameraEffect: { wide: 0, shake: 0, punch: 0 },
      evo: { skillName: 'Phi Kiếm Trận', cameraEffect: { wide: 130, shake: 0 } } }
  },

  /* ===== Tuyệt kỹ theo tướng (id = HR().id) ===== */
  ults: {
    dbl: { skillId: 'ult_dbl', skillName: 'Thập Nhị Sứ Quân Quy Hàng', element: 'kiem', weapon: 'sword',
      castSFX: 'kiem.cast2', chargeSFX: 'fx.riser', travelSFX: 'kiem.travel', hitSFX: 'kiem.hit', impactSFX: 'kiem.impact2', criticalSFX: 'crit.kiem', ultimateSFX: 'fx.cine',
      vfx: 'ult_kiem', cameraEffect: { wide: 400, shake: .5, punch: .15 } },
    lh: { skillId: 'ult_lh', skillName: 'Bình Tống Phá Lỗ', element: 'dao', weapon: 'glaive', sub: 'hoa',
      castSFX: 'dao.swing', chargeSFX: 'fx.riser', travelSFX: 'hoa.whoosh', hitSFX: 'dao.hit', impactSFX: 'hoa.explode', criticalSFX: 'crit.dao', ultimateSFX: 'fx.cine',
      vfx: 'ult_dao', cameraEffect: { wide: 400, shake: .5, punch: .15 } },
    nq: { skillId: 'ult_nq', skillName: 'Cọc Ngầm Bạch Đằng', element: 'bang', weapon: 'spear',
      castSFX: 'bang.freeze', chargeSFX: 'fx.riser', travelSFX: null, hitSFX: 'bang.crack', impactSFX: 'bang.shatter', criticalSFX: 'crit.bang', ultimateSFX: 'fx.cine',
      vfx: 'ult_bang', cameraEffect: { wide: 400, shake: .45, punch: .15 } },
    thd: { skillId: 'ult_thd', skillName: 'Vạn Lôi Bạch Đằng', element: 'loi', weapon: 'banner',
      castSFX: 'loi.charge', chargeSFX: 'fx.riser', travelSFX: null, hitSFX: 'loi.crack', impactSFX: 'loi.thunder2', criticalSFX: 'crit.loi', ultimateSFX: 'fx.cine',
      vfx: 'ult_loi', cameraEffect: { wide: 400, shake: .5, punch: .15 } },
    dl: { skillId: 'ult_dl', skillName: 'Mưa Tên', element: 'doc', weapon: 'bow',
      castSFX: 'doc.energy', chargeSFX: 'fx.riser', travelSFX: 'phong.whoosh', hitSFX: 'doc.burst', impactSFX: 'doc.toxic', criticalSFX: 'crit.doc', ultimateSFX: 'fx.cine',
      vfx: 'ult_doc', cameraEffect: { wide: 400, shake: .4, punch: .15 } },
    nb: { skillId: 'ult_nb', skillName: 'Thiết Bích Thành Đồng', element: 'quyen', weapon: 'shield', sub: 'phong',
      castSFX: 'chuong.cast', chargeSFX: 'fx.riser', travelSFX: null, hitSFX: 'quyen.hit', impactSFX: 'quyen.shock', criticalSFX: 'crit.chuong', ultimateSFX: 'fx.cine',
      vfx: 'ult_quyen', cameraEffect: { wide: 400, shake: .5, punch: .15 } },
    ltk: { skillId: 'ult_ltk', skillName: 'Như Hà Nghịch Lỗ', element: 'kiem', weapon: 'twin',
      castSFX: 'kiem.cast2', chargeSFX: 'fx.riser', travelSFX: 'kiem.travel', hitSFX: 'kiem.hit', impactSFX: 'kiem.impact2', criticalSFX: 'crit.kiem', ultimateSFX: 'fx.cine',
      vfx: 'ult_kiem', cameraEffect: { wide: 400, shake: .5, punch: .15 } },
    _default: { skillId: 'ult_default', skillName: 'Tuyệt Kỹ', element: 'kiem', weapon: 'sword',
      castSFX: 'kiem.cast2', chargeSFX: 'fx.riser', travelSFX: null, hitSFX: 'kiem.hit', impactSFX: 'kiem.impact2', criticalSFX: 'crit.kiem', ultimateSFX: 'fx.cine',
      vfx: 'ult_kiem', cameraEffect: { wide: 400, shake: .5, punch: .15 } }
  },

  /* ===== Chất liệu quái → lớp âm va chạm (tid = id trong DV_DATA.enemies) =====
     flesh người · metal giáp · stone đá · beast thú · boss/mini boss lấy theo cờ e.boss / e.mb */
  material: {
    grunt: 'flesh', fast: 'flesh', swarm: 'flesh', archer: 'flesh', lancer: 'flesh', assassin: 'flesh', shaman: 'flesh', summoner: 'flesh', splitter: 'flesh', bomber: 'flesh',
    tank: 'metal', armor: 'metal',
    colossus: 'stone',
    hunter: 'beast',
    _default: 'flesh'
  },
  /* chủ đề map → chất liệu thay thế cho quái "lẻ" (hunter/swarm ở map thú/đá...) */
  themeMaterial: { cave: 'stone', mountain: 'stone', forest: 'beast', swamp: 'beast', desert: 'beast' },

  /* ===== Phản ứng của Boss khi bị kỹ năng mạnh đánh trúng (rút gọn theo yếu tố) ===== */
  bossReact: { default: 'boss.react', hoa: 'boss.roar', bang: 'boss.react', loi: 'boss.roar' },

  /* ===== Âm thanh đòn của Boss/quái theo cơ chế `ab.k` ===== */
  enemyAbility: { shoot: 'boss.shoot', nova: 'boss.nova', spiral: 'boss.spiral', dash: 'boss.dash', slam: 'boss.slam', rain: 'boss.rain', summon: 'boss.summon', heal: 'boss.heal', shield: 'boss.shield' },

  /* ===== Mốc Combo ===== */
  combo: { window: 2.4, tiers: [10, 20, 30, 50, 100], label: ['', 'TỐT!', 'XUẤT SẮC!', 'THẦN SA!', 'TUYỆT THẾ!', 'HUYỀN THOẠI!'], color: ['#fff', '#ffe08a', '#ffb62e', '#ff7a3a', '#ff4a6a', '#c88aff'] },

  /* ===== Bảng màu hiệu ứng theo nhóm ===== */
  palette: {
    kiem: ['#cfe8ff', '#7ab8ff'], dao: ['#ffb08a', '#ff6a3a'], quyen: ['#ffe9a8', '#e8b84a'], chuong: ['#ffe08a', '#ffb62e'],
    hoa: ['#ffd05a', '#ff5a1a'], bang: ['#e8fbff', '#7ad8ff'], loi: ['#f4ecff', '#b080ff'], doc: ['#b6ff7a', '#a24aff'], phong: ['#dffff0', '#5ae8b0']
  },

  /* Tra cứu: src = G.src ('kiem','loi','hang','phi','ult' hoặc null) · trả bản ghi đã gộp tiến hoá */
  resolve(src, G) {
    const S = this;
    if (src === 'ult') return S.ults[(G && G.uid)] || S.ults._default;
    const b = S.skills[src]; if (!b) return null;
    if (G && G.evo && G.evo[src] && b.evo) { b._e = b._e || Object.assign({}, b, b.evo); return b._e }
    return b;
  },
  materialOf(e, theme) {
    const S = this;
    if (e.boss) return 'boss'; if (e.mb) return 'boss';
    let m = S.material[e.tid] || S.material._default;
    if (m === 'flesh' && theme && S.themeMaterial[theme] && (e.tid === 'swarm' || e.tid === 'fast')) m = S.themeMaterial[theme] === 'beast' ? 'beast' : m;
    return m;
  }
};
