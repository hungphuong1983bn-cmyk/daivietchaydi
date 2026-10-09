/* PHASE 12 · PART 2 — HỒ SƠ TƯỚNG ĐỘC LẬP (window.DV_HERO)
   Không lưu thêm dữ liệu: ghép (read-only) từ các nguồn đã có → một nguồn sự thật duy nhất.
     HEROES (tên, phẩm chất, chỉ số gốc)  ·  sv.hx[id] (level, exp, sao, skin)  ·  DV_CHAR (cảnh giới, kỹ năng, aura, animation, VFX)
   record(id) trả về đủ 19 trường: id, name, quality, level, exp, star, realm, atk, hp, def, spd, crit, martial, skill, equipment, skin, aura, animation, vfx.
   Phase 12-P6: thêm trường phụ cg (Cảnh giới 10 bậc, KHÔNG nằm trong FIELDS).
   Phase 12-P3: trang bị (7 ô) và Võ học là của TỪNG TƯỚNG (sv.eqh[id], sv.vhx[id]); túi đồ dùng chung. */
(function () {
  let B = null;
  const bind = c => { B = c };
  const ok = () => !!B;
  const RG = () => window.DV_DATA && DV_DATA.charRules;

  function forms(id, p, mx, c) {            // khớp danh sách "Diện mạo" của heroshow (Gốc → Thức Tỉnh → Thăng Giai → Cực Hạn)
    const F = [{ n: 'Dạng gốc' }];
    if (c) {
      for (let i = 0; i < p.aw; i++) F.push({ n: (c.awakening[i] && c.awakening[i].name) || 'Thức Tỉnh ' + (i + 1) });
      for (let i = 0; i < p.asc; i++) F.push({ n: (c.ascension[i] && c.ascension[i].name) || 'Thăng Giai ' + (i + 1) });
      if (mx) F.push({ n: 'Cực Hạn' });
    }
    return F;
  }

  function record(id) {
    if (!B) return null;
    const s = B.sv(), h = B.HEROES.find(x => x.id === id);
    if (!h) return null;
    const H = s.hx[id] || { l: 1, e: 0 }, owned = !!s.hu[id];
    const CH = window.DV_CHAR && DV_CHAR.ok && DV_CHAR.ok() ? DV_CHAR : null;
    const c = CH && CH.get(id), p = CH ? CH.prog(id) : { aw: 0, asc: 0, l: H.l, s: H.s || 0 };
    const mx = CH ? CH.isMax(id) : false, st = CH && c ? CH.stats(id) : null, q = B.HQ[h.q] || [h.q, '#aaa'];
    const F = forms(id, p, mx, c), si = H.skin != null && H.skin >= 0 && H.skin < F.length - 1 ? H.skin : F.length - 1;
    const d = c && c.design, A = RG() && RG().anim;
    const eq = ['w', 'a', 'h', 'b', 'r', 'n', 'f'].filter(k => B.slot[k]).map(k => { const it = B.eqiH ? B.eqiH(id, k) : B.eqi(k); return { slot: k, label: B.slot[k].t, item: it ? { n: it.n, r: it.r, l: it.l, set: it.set || null } : null } });
    return {
      id, name: h.n, title: c && c.title || '', cls: c && c.class || '', owned,
      quality: { code: h.q, name: q[0], color: q[1] },
      level: H.l, exp: H.e, expNext: B.hexp(H.l), levelCap: B.cap(H.s || 0),
      star: H.s || 0,
      realm: { aw: p.aw, asc: p.asc, max: mx, name: mx ? 'Cực Hạn' : (p.aw || p.asc) ? `Thức Tỉnh ${p.aw} · Thăng Giai ${p.asc}` : 'Dạng gốc' },
      cg: (() => { const X = window.DV_DATA && DV_DATA.sect, k = (s.cg && s.cg[id]) | 0; if (!X) return null; const r = X.realm(k); return { step: k, name: r.n, icon: r.i, max: k >= X.MAXR } })(),
      atk: st ? st.attack : h.am, hp: st ? st.hp : h.hp, def: st ? st.defense : 0, spd: st ? st.speed : h.sp, crit: st ? st.crit : h.cr,
      martial: B.martialOf ? B.martialOf(id) : B.martial(),                 // Võ học đã học của CHÍNH tướng này
      skill: c ? { passive: c.passive && c.passive.name, list: c.skills.map(x => x.name), ultimate: c.ultimate && c.ultimate.name, main: h.sk } : { main: h.sk, list: [], passive: null, ultimate: null },
      equipment: eq,
      skin: { current: si, list: F.map(f => f.n), name: F[si].n },
      aura: d ? { kind: d.aura.kind, color: d.aura.color } : null,
      animation: A ? Object.keys(A) : [],
      vfx: { trail: d ? d.trail : null, glow: d ? d.glow : 0, ultimateName: c && c.ultimate && c.ultimate.name || null, hasEngine: !!(window.DV_VFX && DV_VFX.ok && DV_VFX.ok()) }
    };
  }

  const FIELDS = ['id', 'name', 'quality', 'level', 'exp', 'star', 'realm', 'atk', 'hp', 'def', 'spd', 'crit', 'martial', 'skill', 'equipment', 'skin', 'aura', 'animation', 'vfx'];
  window.DV_HERO = { bind, ok, record, FIELDS, all: () => (ok() ? B.HEROES.map(h => record(h.id)) : []) };
})();
