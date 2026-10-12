/* Phase 22 — TẠO HÌNH CHIBI KIẾM HIỆP cho tướng (module của DV_R3D).
   Không đổi logic: chỉ "thay áo" cho rig do buildHero() (r3d_actors.js) dựng — giữ nguyên tên khớp (hip/tor/head/armL/armR/legL/legR/hair/cape/wp)
   nên heroAnim() cũ vẫn điều khiển. Thêm: đầu to, mắt (lòng trắng/tròng/điểm sáng), lông mày + miệng đổi biểu cảm, tóc nhiều lớp + đuôi ngựa buộc dây đỏ,
   khăn đỏ bay, giáp vai, đai + khóa vàng, giáp tay, giày cao cổ, kiếm lớn hơn.  R3.chibiFace(rig, mode) đổi biểu cảm: 'idle' | 'angry' | 'smile' | 'hurt'. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T) return;
  const PI = Math.PI, G = {};   // hình học dùng chung (không bị dispose khi dựng lại tướng)
  const keep = g => (g.userData.keep = true, g);
  const geo = () => {
    if (G.sph) return G;
    G.sph = keep(new T.SphereGeometry(1, 20, 16)); G.cone = keep(new T.ConeGeometry(1, 1, 6, 1)); G.cone.translate(0, .5, 0);   // đáy ở y=0, đỉnh +y (lật PI để thành lọn rủ xuống)
    G.cyl = keep(new T.CylinderGeometry(1, 1, 1, 14, 1)); G.cyl.translate(0, .5, 0); G.box = keep(new T.BoxGeometry(1, 1, 1)); G.box.translate(0, .5, 0);
    G.tor = keep(new T.TorusGeometry(1, .22, 8, 20)); return G;
  };
  const ph = (c, s) => new T.MeshPhongMaterial({ color: c, shininess: s || 70, specular: 0x667788 });
  const lm = c => new T.MeshLambertMaterial({ color: c });
  const M = (g, m, x, y, z, sx, sy, sz, rx, ry, rz) => { const o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = true; return o };

  function chibiHero(rig) {
    if (!rig || rig.chibi || !rig.head) return rig; rig.chibi = true; geo();
    const hairC = '#2b1a14', red = '#c8242b', gold = rig.st ? rig.st.trim : '#e8b84a';
    const hairM = ph(hairC, 40), hairL = ph('#4a2a1c', 40), redM = lm(red), redD = lm('#8f171d'), skin = lm('#f0cba6'), metal = ph('#2f3340', 90), goldM = ph(gold, 110), boot = ph('#4a2f1d', 50), white = lm('#f4efe6');
    rig.mats.push(hairM, hairL, redM, redD, skin, metal, goldM, boot, white);
    const head = rig.head, tor = rig.tor;

    /* ---- đầu to (tỉ lệ chibi) ---- */
    head.scale.setScalar(1.42); head.position.y = 21.6;
    for (const c of [...head.children]) {   // bỏ mắt chấm cũ; tóc sau hình cầu cũ nhường chỗ tóc nhiều lớp
      if (c.material && c.material.color && c.material.color.getHex() === 0x1a1020) head.remove(c);
    }
    /* ---- mặt ---- */
    const F = rig.face = { mode: 'idle', t: 0 }; const eyeW = lm('#ffffff'), iris = lm('#4a2a1a'), pup = lm('#120a08'), shine = new T.MeshBasicMaterial({ color: 0xffffff, fog: false });
    F.eyes = []; for (const s of [-1, 1]) {
      const g = new T.Group(); g.position.set(s * 2.75, 3.5, 5.35); head.add(g);
      g.add(M(G.sph, eyeW, 0, 0, 0, 1.55, 1.95, .55)); g.add(M(G.sph, iris, 0, -.1, .38, 1.12, 1.6, .5)); g.add(M(G.sph, pup, 0, -.1, .62, .6, .95, .4)); g.add(M(G.sph, shine, .35 * s, .55, .85, .38, .38, .3));
      const brow = M(G.box, lm('#1c120e'), s * 2.9, 6.1, 5.2, 2.6, .55, .5); brow.userData.s = s; head.add(brow); F.eyes.push({ g, brow, s });
    }
    F.mouth = M(G.sph, lm('#7a2a2a'), 0, .8, 5.7, .9, .35, .3); head.add(F.mouth);
    for (const s of [-1, 1]) head.add(M(G.sph, lm('#f2a08e'), s * 4.2, 1.5, 4.5, 1.1, .6, .3));   // má hồng

    /* ---- tóc nhiều lớp ---- */
    head.add(M(G.sph, hairM, 0, 6.6, -2.0, 6.8, 5.0, 6.2));                                         // mũ tóc phồng
    const bangs = [[-4.4, 8.0, 3.6, -.5, .5, 3.2, 4.2], [-2.4, 8.9, 4.0, -.2, .2, 3, 4.6], [0, 9.2, 4.2, 0, 0, 3.2, 5], [2.4, 8.9, 4.0, .2, -.2, 3, 4.4], [4.4, 8.0, 3.6, .5, -.5, 3.2, 4]];
    for (const [x, y, z, rx, rz, w, h] of bangs) head.add(M(G.cone, hairL, x, y, z, w, h, 1.8, PI - .5 + rx * .4, 0, rz * .8));    // mái chẻ nhiều lọn
    for (const s of [-1, 1]) { head.add(M(G.cone, hairM, s * 6, 5, 1.5, 2.4, 9, 2.4, PI + .1, 0, s * .15)); head.add(M(G.cone, hairL, s * 6.4, 3.4, -1, 1.8, 6.5, 1.8, PI, 0, s * .3)) }   // tóc mai
    for (let i = 0; i < 5; i++) { const a = -1.1 + i * .55; head.add(M(G.cone, i % 2 ? hairL : hairM, Math.sin(a) * 4.5, 11 + Math.cos(a) * .6, -.5, 2.6, 5.5, 2.4, -.35, 0, -a * .5)) }   // chỏm tóc dựng
    // đuôi ngựa: rig.hair (heroAnim vẫn lắc) + lọn phụ + dây đỏ
    if (rig.hair) { head.remove(rig.hair); const hg = new T.Group(); hg.position.set(0, 10, -5); hg.rotation.x = PI - .1; head.add(hg); rig.hair = hg;   // nhóm KHÔNG scale: heroAnim lắc rotation.x
      hg.add(M(G.cone, hairM, 0, 0, 0, 3.6, 19, 3.4)); hg.add(M(G.cone, hairL, -1.8, .2, .4, 2.2, 15, 2, 0, 0, .18)); hg.add(M(G.cone, hairL, 1.8, .2, .4, 2.2, 14, 2, 0, 0, -.18)); hg.add(M(G.cone, hairM, 0, .2, 1.1, 3, 12, 2.6)) }
    head.add(M(G.cyl, redM, 0, 8.6, -4.6, 2.2, 1.6, 2.2, PI / 2 - .3, 0, 0)); head.add(M(G.box, redM, -1.6, 9.6, -5.6, .8, 5, .5, .1, 0, .5)); head.add(M(G.box, redM, 1.6, 9.2, -5.7, .8, 4.5, .5, -.1, 0, -.5));   // dây buộc tóc đỏ
    F.band = null;

    /* ---- thân: áo lót trắng, đai, khóa vàng, khăn đỏ, giáp vai ---- */
    tor.add(M(G.box, white, 0, 6, 4, 7.6, 12, 1.2));                                                    // áo lót
    tor.add(M(G.cyl, metal, 0, 2.5, 0, 8.6, 3.8, 6.8)); tor.add(M(G.cyl, redM, 0, 2.2, 0, 8.9, 1.4, 7.1));    // đai đen + viền đỏ
    tor.add(M(G.sph, goldM, 0, 4.5, 6, 2.2, 2.2, .9)); tor.add(M(G.tor, goldM, 0, 4.5, 6.2, 2.5, 2.5, 1));   // khóa vàng tròn
    tor.add(M(G.box, redM, 3.2, -4, 5.4, 3.6, 10, .7, .08, 0, .12)); tor.add(M(G.box, redD, -3.4, -3, 5.4, 3.2, 8, .7, .08, 0, -.1));   // dải lụa đai rủ
    for (const s of [-1, 1]) {   // giáp vai nhiều lớp
      tor.add(M(G.sph, metal, s * 10.4, 21, 0, 5.2, 3.6, 5.2)); tor.add(M(G.sph, goldM, s * 10.6, 22.6, 0, 3.8, 1.6, 3.8)); tor.add(M(G.sph, metal, s * 11.8, 18.6, 0, 4.4, 2.6, 4.4));
    }
    const sc = new T.Group(); sc.position.set(0, 19.2, 0); tor.add(sc); rig.scarf = sc;                       // khăn đỏ quanh cổ
    sc.add(M(G.tor, redM, 0, 0, 0, 7.4, 7.4, 4.4, PI / 2, 0, 0)); sc.add(M(G.sph, redM, 4.8, -1, 3.6, 2.8, 2.4, 2.4));
    if (rig.cape) tor.remove(rig.cape);
    const tail = new T.Group(); tail.position.set(0, 18.5, -5.2); tor.add(tail); const t1 = M(G.box, redM, 0, -22, 0, 6.2, 22, .8), t2 = M(G.box, redD, 3.6, -17, .4, 4, 17, .7, 0, 0, -.18);
    t1.position.y = -22; t2.position.y = -17; tail.add(t1, t2); rig.cape = tail;                              // đuôi khăn dài — heroAnim vẫy theo rotation.x

    /* ---- tay: bao tay + giáp tay; chân: giày cao cổ ---- */
    for (const a of [rig.armL, rig.armR]) { a.add(M(G.cyl, metal, 0, -14.4, 0, 3.4, 6.4, 3.4)); a.add(M(G.cyl, goldM, 0, -8.6, 0, 3.55, 1, 3.55)); a.add(M(G.sph, lm('#2a2630'), 0, -17, 0, 2.9, 2.9, 2.9)) }
    for (const l of [rig.legL, rig.legR]) { l.add(M(G.cyl, boot, 0, -22, .2, 4.3, 11, 4.9)); l.add(M(G.box, boot, 0, -22, 2.8, 4.4, 3, 6.4)); l.add(M(G.cyl, goldM, 0, -11.6, 0, 4.5, 1.2, 5)); l.add(M(G.sph, metal, 0, -9, 2.2, 2.6, 2.4, 1.6)) }
    if (rig.wp) rig.wp.scale.setScalar(1.28);                                                              // kiếm to hơn, nổi bật theo tỉ lệ chibi
    rig.face.set = (mode) => setFace(rig, mode);
    return rig;
  }

  /* biểu cảm: idle / angry / smile / hurt (gọi từ heroAnim, chỉ đổi khi chế độ thay đổi) */
  function setFace(rig, mode) {
    const F = rig.face; if (!F || F.mode === mode) return; F.mode = mode;
    for (const e of F.eyes) {
      const s = e.s; e.brow.rotation.z = mode === 'angry' ? -s * .38 : mode === 'hurt' ? s * .42 : mode === 'smile' ? s * .12 : -s * .12; e.brow.position.y = mode === 'angry' ? 5.7 : mode === 'hurt' ? 6.5 : 6.1;
      e.g.scale.set(1, mode === 'smile' ? .28 : mode === 'hurt' ? .7 : 1, 1);
    }
    if (mode === 'smile') F.mouth.scale.set(1.9, .9, .3); else if (mode === 'angry') F.mouth.scale.set(1.5, .45, .3); else if (mode === 'hurt') F.mouth.scale.set(.9, 1.1, .3); else F.mouth.scale.set(.9, .35, .3);
  }
  R3.chibiHero = chibiHero; R3.chibiFace = (rig, m) => rig && rig.face && setFace(rig, m);
})();
