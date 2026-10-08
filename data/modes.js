/* PHASE 12 · PART 1 — Chế độ ải: ẢI TINH ANH + QUÉT ẢI (thuần dữ liệu + hàm biến đổi, không đọc/ghi save).
   Dựng trên DV_DATA.getStage() của Phase 5: mọi màn Tinh Anh = bản sao có hệ số của màn thường → không nhân đôi dữ liệu 312 màn.
   Chỉnh cân bằng tại DV_DATA.modes.rules. */
window.DV_DATA = window.DV_DATA || {};
(function () {
  const D = window.DV_DATA;
  const RULES = {
    elite: {
      needBits: 7,            // phải đạt 3 sao ở màn thường mới mở Tinh Anh
      stamina: 10,            // thể lực mỗi lượt (ải thường = 5)
      dailyPerStage: 3,       // số lượt Tinh Anh mỗi màn mỗi ngày
      mon: { hp: 1.7, dmg: 1.35, sp: 1.08 },          // nhân lên scale của mọi Wave
      dens: 1.25, interval: .85,                      // mật độ quái tối đa ×, nhịp spawn × (nhanh hơn)
      eliteChance: { mul: 2.5, min: .03, cap: .15 },  // tỉ lệ Tinh Anh trong Wave
      eventElite: 1,                                  // +n quái Tinh Anh ở mỗi sự kiện "elite"
      boss: { hp: 2.0, dmg: 1.2, cd: .8, bullets: 1.25 },   // HP Boss, sát thương đạn, hồi chiêu ×, số đạn ×
      reward: { exp: 1.6, gold: 1.6, kill: 1.3, tinh: 2, hon: 2, drops: 1, minRarity: 1, rarityCap: 3, bias: 1, firstGem: 2, star3: 1.5 }
    },
    sweep: {
      needBits: 7,            // chỉ quét khi đã 3 sao
      stamina: 5,
      maxBatch: 10,           // quét tối đa n lượt một lần
      mul: { exp: 1, gold: 1, tinh: 1, hon: 1 }       // quét = thưởng thông quan cơ bản (không có thưởng lần đầu / sao)
    }
  };

  const num = (v, k) => Math.max(0, Math.round(v * k));
  const clone = o => JSON.parse(JSON.stringify(o));

  /* Bản sao Tinh Anh của một màn (không sửa màn gốc) */
  function hard(st) {
    const r = RULES.elite, s = clone(st), rw = r.reward;
    s.hard = 1;
    s.waves.forEach(w => {
      w.scale.hp *= r.mon.hp; w.scale.dmg *= r.mon.dmg; w.scale.sp *= r.mon.sp;
      w.maxAlive = Math.round(w.maxAlive * r.dens);
      w.spawnInterval = +(w.spawnInterval * r.interval).toFixed(3);
      w.eliteChance = w.eliteChance > 0 || w.kind !== 'start' ? Math.min(r.eliteChance.cap, Math.max(r.eliteChance.min, w.eliteChance * r.eliteChance.mul)) : 0;
    });
    (s.events || []).forEach(e => { if (e.k === 'elite') e.n = (e.n || 1) + r.eventElite; });
    const b = s.boss, bb = r.boss;
    b.hp = Math.round(b.hp * bb.hp);
    b.dmg = +(b.dmg * bb.dmg).toFixed(2);
    b.mech = (b.mech || []).map(m => Object.assign({}, m, {
      cd: +(m.cd * bb.cd).toFixed(2),
      n: m.n ? Math.round(m.n * bb.bullets) : m.n,
      dmg: m.dmg ? +(m.dmg * bb.dmg).toFixed(2) : m.dmg
    }));
    if (s.miniBoss && s.miniBoss.hp) s.miniBoss.hp = Math.round(s.miniBoss.hp * 1.5);
    const x = s.rewards;
    x.exp = num(x.exp, rw.exp); x.gold = num(x.gold, rw.gold);
    x.killExpMul *= rw.kill; x.killGoldMul *= rw.kill;
    x.materials.tinh = num(x.materials.tinh, rw.tinh); x.charMaterials.hon = num(x.charMaterials.hon, rw.hon);
    x.equipment.drops += rw.drops; x.equipment.minRarity = Math.min(rw.rarityCap, x.equipment.minRarity + rw.minRarity); x.equipment.bias += rw.bias;
    x.firstClear.gem = num(x.firstClear.gem, rw.firstGem); x.firstClear.gold = num(x.firstClear.gold, rw.gold);
    x.firstClear.materials.tinh = num(x.firstClear.materials.tinh, rw.tinh); x.firstClear.charMaterials.hon = num(x.firstClear.charMaterials.hon, rw.hon);
    x.star3.gem = num(x.star3.gem, rw.star3); x.star3.materials.tinh = num(x.star3.materials.tinh, rw.star3);
    x.perStarGem = num(x.perStarGem, 1.5);
    s.recommendedPower = Math.round(s.recommendedPower * 1.45);
    return s;
  }

  /* Thưởng 1 lượt quét (không cần chơi). Trả về số liệu thuần; phần ngẫu nhiên rơi đồ do engine gọi mk()/rollR(). */
  function sweepReward(st, isHard) {
    const s = isHard ? hard(st) : st, r = s.rewards, m = RULES.sweep.mul;
    return {
      exp: num(r.exp, m.exp), gold: num(r.gold, m.gold), tinh: num(r.materials.tinh, m.tinh), hon: num(r.charMaterials.hon, m.hon),
      gem: 0, drops: r.equipment.drops, minRarity: r.equipment.minRarity, bias: r.equipment.bias
    };
  }

  D.modes = { rules: RULES, hard, sweepReward };
})();
