/* Dữ liệu Wave — data-driven (Phase 3). Bảng tương ứng: waves / stage wave_config.
   Wave:  s,e = giây bắt đầu/kết thúc · pool = [[loại quái, trọng số]] · dens = số quái tối đa cùng lúc (trước khi nhân theo level/lực chiến)
          iv = giây giữa hai lượt spawn · n = số quái mỗi lượt · pat = ring | burst | line | swarm
   Event: at = giây · k = elite | mini
   bossAt = giây boss xuất hiện (chỉ dùng cho ải Boss).
   Loại quái hiện có: grunt (thường), fast (nhanh), tank (trâu). Chương sau sẽ thêm loại mới ở data/monsters.js. */
window.DV_DATA = window.DV_DATA || {};
DV_DATA.waveSets = {
  /* Ải thường (60s) */
  n: { dur: 60,
    waves: [
      { s: 0,  e: 15, pool: [['grunt', 1]],                          dens: 16, iv: .75, n: 1, pat: 'ring'  },
      { s: 15, e: 30, pool: [['grunt', 1], ['fast', .5]],            dens: 26, iv: .6,  n: 1, pat: 'ring'  },
      { s: 30, e: 45, pool: [['grunt', 1], ['fast', .5], ['tank', .3]], dens: 38, iv: .5, n: 2, pat: 'burst' },
      { s: 45, e: 60, pool: [['grunt', 1], ['fast', .6], ['tank', .3]], dens: 50, iv: .4, n: 2, pat: 'line'  }],
    events: [{ at: 40, k: 'elite' }] },
  /* Ải Elite (75s) */
  e: { dur: 75,
    waves: [
      { s: 0,  e: 20, pool: [['grunt', 1], ['fast', .4]],            dens: 22, iv: .6,  n: 1, pat: 'ring'  },
      { s: 20, e: 45, pool: [['grunt', 1], ['fast', .6], ['tank', .4]], dens: 36, iv: .5, n: 2, pat: 'burst' },
      { s: 45, e: 75, pool: [['grunt', 1], ['fast', .7], ['tank', .5]], dens: 52, iv: .4, n: 2, pat: 'line'  }],
    events: [{ at: 15, k: 'elite' }, { at: 40, k: 'elite' }, { at: 62, k: 'mini' }] },
  /* Kho báu: hạ 50 quái, tối đa 95s → dày đặc, quái nhanh */
  t: { dur: 95,
    waves: [
      { s: 0,  e: 30, pool: [['grunt', 1], ['fast', 1]],             dens: 30, iv: .35, n: 2, pat: 'swarm' },
      { s: 30, e: 95, pool: [['grunt', 1], ['fast', 1.2], ['tank', .2]], dens: 44, iv: .3, n: 3, pat: 'swarm' }],
    events: [] },
  /* Ải Boss: 3 đợt rồi Boss xuất hiện lúc 75s */
  b: { dur: 75, bossAt: 75,
    waves: [
      { s: 0,  e: 25, pool: [['grunt', 1], ['fast', .4]],            dens: 20, iv: .65, n: 1, pat: 'ring'  },
      { s: 25, e: 50, pool: [['grunt', 1], ['fast', .5], ['tank', .4]], dens: 34, iv: .5, n: 2, pat: 'burst' },
      { s: 50, e: 75, pool: [['grunt', 1], ['fast', .6], ['tank', .5]], dens: 46, iv: .4, n: 2, pat: 'line'  },
      { s: 75, e: 9999, pool: [['grunt', 1], ['fast', .4]],           dens: 24, iv: 1.2, n: 1, pat: 'ring' }],
    events: [{ at: 28, k: 'elite' }, { at: 52, k: 'mini' }] },
  /* Ải Sự kiện (60s) */
  v: { dur: 60,
    waves: [
      { s: 0,  e: 20, pool: [['grunt', 1], ['fast', .8]],            dens: 28, iv: .5,  n: 2, pat: 'burst' },
      { s: 20, e: 60, pool: [['grunt', 1], ['fast', 1], ['tank', .4]], dens: 48, iv: .4, n: 2, pat: 'swarm' }],
    events: [{ at: 30, k: 'elite' }] },
  /* Mẫu ải dài 8 phút (theo thiết kế ban đầu) — dành cho Stage dài ở Phase 7, chưa gắn vào ải nào */
  long8: { dur: 480, bossAt: 480,
    waves: [
      { s: 0,   e: 30,  pool: [['grunt', 1]],                          dens: 14, iv: .8,  n: 1, pat: 'ring'  },
      { s: 30,  e: 60,  pool: [['grunt', 1], ['fast', .5]],            dens: 22, iv: .65, n: 1, pat: 'ring'  },
      { s: 60,  e: 120, pool: [['grunt', 1], ['fast', .4], ['tank', .3]], dens: 30, iv: .6, n: 2, pat: 'burst' },
      { s: 120, e: 180, pool: [['grunt', 1], ['fast', .6], ['tank', .3]], dens: 48, iv: .45, n: 2, pat: 'line' },
      { s: 180, e: 270, pool: [['grunt', 1], ['fast', .6], ['tank', .6]], dens: 54, iv: .45, n: 2, pat: 'burst' },
      { s: 270, e: 360, pool: [['fast', 1], ['grunt', 1]],             dens: 80, iv: .3,  n: 3, pat: 'swarm' },
      { s: 360, e: 450, pool: [['grunt', 1], ['fast', .7], ['tank', .7]], dens: 70, iv: .35, n: 3, pat: 'line' },
      { s: 450, e: 9999, pool: [['grunt', 1], ['fast', .5]],           dens: 20, iv: 1.2, n: 1, pat: 'ring'  }],
    events: [{ at: 120, k: 'elite' }, { at: 180, k: 'mini' }, { at: 270, k: 'elite' }, { at: 360, k: 'mini' }] }
};
