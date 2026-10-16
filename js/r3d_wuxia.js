/* Phase 21 — HIỆU ỨNG VÕ CÔNG CHIBI RỰC SÁNG (module của DV_R3D, dựng trên bộ công cụ DV_R3D.F của r3d_fx.js)
   KHÔNG đổi sát thương / hồi chiêu / tầm đánh / AI / dữ liệu lưu: chỉ thêm lớp hiển thị bám vào SỰ KIỆN CÓ THẬT của logic game:
     · DV_VFX.cast('kiem')  → chuỗi Combo đánh thường 4 nhịp (ngang · dọc · xoay · lao tới)
     · DV_VFX.onHit         → tia lửa + sóng xung kích + mảnh năng lượng, chí mạng có sao nổ + rung camera
     · G.pr (đạn kiếm khí)   → Kỹ năng 1 Kiếm Phong (vệt kiếm khí xanh nhiều lớp)
     · DV_VFX.ult           → Kỹ năng 2 Long Thần Vạn Kiếm (rồng kiếm vàng kim tích lực → phóng kiếm vào địch thật)
     · G.skxe 'trail'       → Kỹ năng 3 Tuyệt Ảnh (ảnh phân thân tím theo đường lướt của Thần Tốc / Lướt Sóng)
     · G.skx 'met'          → Kỹ năng 4 Thiên Hỏa (pháp trận lửa → thiên thạch → vùng cháy)
     · G.skx 'zone' (băng)  → Kỹ năng 5 Băng Long (rồng băng cuộn quanh trận + tinh thể)
     · G.skx 'twr'          → Kỹ năng 6 Quỷ Ảnh (bóng kiếm tím đen chém liên hoàn → vòng chém lớn khi kết thúc)
     · e.slw / G.skb        → hiệu ứng trạng thái làm chậm / đóng băng / thiêu đốt trên quái
   Giai đoạn: tích lực → thi triển → va chạm → tan biến. Tự giảm theo chất lượng (sv.q) và tự bỏ lớp phụ khi quá nhiều hiệu ứng. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T || !R3.F) return;
  const F = R3.F, M = Math, PI = M.PI, TAU = PI * 2, R = Math.random;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const H = (x, y) => R3.height(x, y), Q = () => F.S ? F.S.q : 1;
  const W = R3.wux = { step: 0, last: -9, castT: -9, G: null, geo: {}, sig: new Map(), ice: new Map(), shd: new Map(), grounds: 0, imp: 0, st: { t: 0, fz: [] } };
  const AM = (col, op, side) => F.addM(F.C(col), op * .8, null, side);   // Phase 22: -20% độ đục để không che nhân vật/quái
  const busy = () => F.list.length > [28, 55, 90][Q()];   // chỉ cho hiệu ứng TRANG TRÍ phụ
  const skillBusy = () => F.list.length > 260;           // an toàn tuyệt đối; skill chính luôn được dựng

  const shake = v => { const G = W.G; if (G) G.shake = M.max(G.shake || 0, v) };
  const _q = new T.Quaternion(), _Y = new T.Vector3(0, 1, 0), _v = new T.Vector3();

  function kill(o) { if (o.parent) o.parent.remove(o); o.traverse(x => { if (x.material && x.material.dispose) x.material.dispose(); if (x.userData && x.userData.og && x.geometry) x.geometry.dispose() }) }
  function rune(col, rad, op) { const m = R3.runeDecal(col, rad, op); m.userData.og = 1; return m }
  /* hình cung phẳng (nằm trên mặt đất, hướng chính = +Z cục bộ), lưu đệm */
  function sector(inner, span) {
    const k = inner + '|' + span; if (W.geo[k]) return W.geo[k];
    const g = new T.RingGeometry(inner, 1, 44, 6, -PI / 2 - span / 2, span); g.rotateX(-PI / 2); return W.geo[k] = g;
  }
  function vsector(span) {   // cung đứng (mặt phẳng chứa hướng tiến + trục dọc)
    const k = 'v' + span; if (W.geo[k]) return W.geo[k];
    const g = new T.RingGeometry(.84, 1, 44, 1, .75 * PI - span / 2, span); g.rotateY(PI / 2); return W.geo[k] = g;
  }
  const face = a => PI / 2 - a;   // yaw để +Z cục bộ hướng về góc a của game
  function fx(grp, dur, fn) {   // dựng hiệu ứng có vòng đời rõ ràng: fn(u,t) với u∈[0,1]
    F.put(grp); let t = 0;
    return F.add(dt => { t += dt; const u = clamp(t / dur, 0, 1); try { fn(u, t) } catch (e) { u < 1 && console.warn('[wux]', e) } if (u >= 1) { kill(grp); return false } return true });
  }
  function setOp(arr, k) { for (const [m, o] of arr) m.material.opacity = o * k }

  /* ====================== ĐÁNH THƯỜNG: COMBO 4 NHỊP ====================== */
  function combo(x, y, a, ev) {
    const now = performance.now() / 1000; if (now - W.castT < .09) return; W.castT = now;   // nhiều đạn cùng lúc = một đòn
    if (now - W.last > 2.4) W.step = 0; W.last = now;
    const s = W.step++ % 4, q = Q(), g = new T.Group(), c1 = ev ? '#ffe27a' : '#5aa8ff', c2 = ev ? '#fff4c0' : '#d8f0ff';
    g.position.set(x, H(x, y) + 28, y); g.rotation.y = face(a); const dx = M.cos(a), dz = M.sin(a);
    if (s === 0) {   // 1. chém ngang: vệt kiếm cong theo quỹ đạo vũ khí
      const L = [[new T.Mesh(sector(.86, 2.2), AM(c1, .95, T.DoubleSide)), .95], [new T.Mesh(sector(.45, 2.0), AM(c1, .35, T.DoubleSide)), .35], [new T.Mesh(sector(.95, 2.4), AM(c2, 1, T.DoubleSide)), 1]];
      for (const [m] of L) { m.rotation.z = .22; m.renderOrder = 6; g.add(m) }
      fx(g, .26, (u) => { const e = F.ease(u), r = 30 + 20 * e; L.forEach(([m], i) => { m.scale.set(r * (1 - i * .05), 1, r * (1 - i * .05)); m.rotation.y = -1.1 + 2.2 * F.ease3(u) + i * .08 }); setOp(L, 1 - u * u); if (q && u < .7) { const aa = a + (-1.1 + 2.2 * F.ease3(u)) * -1; F.burst(x + M.cos(aa) * r, y + M.sin(aa) * r, 26, 1, 40, .3, c2, 20, 0) } });
    } else if (s === 1) {   // 2. chém dọc: cung đứng + đường kiếm sáng + tia sáng + bụi
      const arc = new T.Mesh(vsector(1.9), AM(c1, .95, T.DoubleSide)), arc2 = new T.Mesh(vsector(1.6), AM(c2, 1, T.DoubleSide)); arc.renderOrder = arc2.renderOrder = 6; g.add(arc, arc2);
      const bl = new T.Mesh(F.geos().cylS, AM(c2, 1)); bl.scale.set(1.8, 74, 1.8); bl.position.set(0, -4, 44); g.add(bl);
      F.ring(x + dx * 46, y + dz * 46, 30, .35, c1, 1, .1); if (q) F.burst(x + dx * 46, y + dz * 46, 6, 10, 150, .45, '#cfd8e6', 50, 220);
      fx(g, .3, (u) => { const k = 30 + 24 * F.ease(u); arc.scale.setScalar(k); arc2.scale.setScalar(k * .93); arc.rotation.x = arc2.rotation.x = -1.15 + 2.3 * F.ease3(u); bl.position.y = 64 - 70 * F.ease3(u); bl.material.opacity = (1 - u) * (u < .5 ? 1 : .6); arc.material.opacity = .95 * (1 - u * u); arc2.material.opacity = 1 - u * u });
    } else if (s === 2) {   // 3. chém xoay: vòng kiếm khí 360° quanh nhân vật
      const L = [[new T.Mesh(sector(.84, TAU * .92), AM(c1, .9, T.DoubleSide)), .9], [new T.Mesh(sector(.6, TAU * .7), AM(c2, .55, T.DoubleSide)), .55]]; for (const [m] of L) { m.renderOrder = 6; g.add(m) }
      F.ring(x, y, 70, .4, c1); if (q) F.burst(x, y, 20, 12, 150, .4, c2, 60, 120);
      fx(g, .38, (u) => { const r = 22 + 38 * F.ease(u); L.forEach(([m], i) => { m.scale.set(r * (1 - i * .18), 1, r * (1 - i * .18)); m.rotation.y = (i ? -1 : 1) * u * TAU * 1.25 }); setOp(L, 1 - u * u * u) });
    } else {   // 4. lao tới: vệt chuyển động + mũi kiếm đâm
      const st = [], N = q ? 7 : 4;
      for (let i = 0; i < N; i++) { const m = new T.Mesh(F.geos().cone, AM(i % 2 ? c2 : c1, .8)); const lat = (i - (N - 1) / 2) * 5.2; m.userData = { lat, L: 46 + R() * 30 }; g.add(m); st.push([m, .8]) }
      const sp = new T.Mesh(F.geos().cone, AM(c2, 1)); sp.rotation.x = PI / 2; g.add(sp); g.position.y -= 6;
      F.ring(x + dx * 60, y + dz * 60, 34, .35, c2, 1, .12); if (q) F.burst(x + dx * 58, y + dz * 58, 22, 12, 170, .4, c1, 40, 120);
      fx(g, .3, (u) => { const e = F.ease(u); for (const [m] of st) { const L = m.userData.L * (1 + e); m.rotation.x = -PI / 2; m.scale.set(2.6, L, 2.6); m.position.set(m.userData.lat, 0, -6 - 24 * e) } sp.scale.set(5, 70 * e, 5); sp.position.set(0, 0, 0); setOp(st, 1 - u); sp.material.opacity = 1 - u * u });
    }
  }
  /* ====================== TRÚNG ĐÒN ====================== */
  const PAL = { kiem: '#6ab8ff', loi: '#c0a0ff', hang: '#ffd070', phi: '#9ad0ff', hoa: '#ff8a3a', bang: '#8fe4ff', doc: '#7aff6a', phong: '#b070ff', tinh: '#ff7a3a', tru: '#ffe9a0', lien: '#ffc0e0', ult: '#ffd070', ltk: '#ffe27a', dbl: '#bfe3ff' };
  const TICK = { bang: 1, doc: 1, kim: 1, phong: 1, dl: 1 };
  function impact(e, src, cr) {
    if (!e || W.imp >= [3, 6, 10][Q()]) return; W.imp++; const col = PAL[src] || '#ffffff', r = (e.r || 11), x = e.x, y = e.y, q = Q();
    if (!TICK[src] || cr) { F.ring(x, y, r * (cr ? 3.6 : 2.4), cr ? .4 : .28, cr ? '#ffe27a' : col); if (q) F.flashDome(x, y, r * 1.4, .18, col, .45) }
    F.burst(x, y, r * 1.1, cr ? 10 : 4, cr ? 210 : 120, cr ? .5 : .32, col, 90, 220);
    if (cr) {   // chí mạng: sao nổ + lóe sáng + rung nhẹ camera
      const g = new T.Group(); g.position.set(x, H(x, y) + r * 1.1, y); const N = q ? 10 : 6, sp = [];
      for (let i = 0; i < N; i++) { const m = new T.Mesh(F.geos().cone, AM(i % 2 ? '#ffffff' : '#ffc83c', .95)); const a = i / N * TAU + R() * .2; m.userData = { a, L: 26 + R() * 26 }; g.add(m); sp.push([m, .95]) }
      R3.flash(x, y, 0xffd070, 6); shake(.12);
      fx(g, .3, (u) => { const e = F.ease(u); for (const [m] of sp) { const a = m.userData.a; m.rotation.set(0, 0, 0); m.quaternion.setFromUnitVectors(_Y, _v.set(M.cos(a), .15, M.sin(a))); m.position.set(M.cos(a) * 6 * e, 0, M.sin(a) * 6 * e); m.scale.set(3.4 * (1 - u), m.userData.L * e, 3.4 * (1 - u)) } setOp(sp, 1 - u) });
    }
  }
  /* ====================== KỸ NĂNG 1 · KIẾM PHONG (đạn kiếm khí) ====================== */
  function bladeStreaks(G) {
    const L = F.pool.wxs || (F.pool.wxs = { a: [], used: 0 }), cap = [6, 12, 20][Q()];
    const prs = []; for (const p of G.pr) { if (p.k === 'kiem') { prs.push(p); if (prs.length >= cap) break } }
    while (L.a.length < prs.length) { const grp = new T.Group(), o = new T.Mesh(F.geos().cone, AM('#3a98ff', .55)), i = new T.Mesh(F.geos().cone, AM('#eaf6ff', .9)); grp.add(o, i); grp.userData = { o, i }; grp.visible = false; F.put(grp); L.a.push(grp) }
    for (let n = 0; n < L.a.length; n++) {
      const m = L.a[n], p = prs[n]; if (!p) { m.visible = false; continue } m.visible = true;
      const sp = M.hypot(p.vx, p.vy) || 1, dx = p.vx / sp, dz = p.vy / sp, ev = G.evo && G.evo.kiem;
      m.position.set(p.x, H(p.x, p.y) + 26, p.y); _q.setFromUnitVectors(_Y, _v.set(-dx, 0, -dz)); m.quaternion.copy(_q);
      m.userData.o.scale.set(9, 70, 9); m.userData.i.scale.set(3.4, 54, 3.4); m.userData.o.material.color.set(ev ? '#ffc040' : '#3a98ff');
    }
  }
  /* ====================== KỸ NĂNG 2 · LONG THẦN VẠN KIẾM (Tuyệt Kỹ) ====================== */
  function dragonSwords(P) {
    const G = W.G; if (!G) return; const q = Q(), N = [10, 15, 22][q], x = P.x, y = P.y, g = F.geos(), grp = new T.Group(), y0 = H(x, y);
    grp.position.set(x, y0, y); const sw = [], mats = [];
    const tg = G.en.filter(e => !e.dead && M.hypot(e.x - x, e.y - y) < 420).sort(() => R() - .5);
    for (let i = 0; i < N; i++) {
      const s = new T.Group(), head = i === 0, sc = head ? 1.5 : 1 - i / N * .45, bm = AM(head ? '#fff2b0' : '#ffc83a', head ? .9 : .7), gm = AM('#ffb020', .3);
      const b = new T.Mesh(g.cone, bm); b.scale.set(2.6 * sc, 30 * sc, 1); b.rotation.set(0, 0, 0); s.add(b);
      const gd = new T.Mesh(g.box, AM('#fff6cf', .7)); gd.scale.set(8 * sc, 1.8, 2.2); s.add(gd); const gl = R3.glowSprite(0xffc23a, head ? 64 : 22 * sc, head ? .5 : .22); s.add(gl);
      if (head) for (const sd of [-1, 1]) { const h = new T.Mesh(g.cone, AM('#ffe9a0', .95)); h.scale.set(1.8, 22, 1.8); h.position.set(sd * 5, 8, 0); h.rotation.set(0, 0, -sd * .8); s.add(h) }
      grp.add(s); sw.push({ s, i, tg: tg.length ? tg[i % tg.length] : null, ang: R() * TAU, p0: new T.Vector3(), done: 0 }); mats.push(bm, gm);
    }
    R3.flash(x, y, 0xffd070, 8); shake(.5); F.burst(x, y, 12, 26, 220, .8, '#ffe27a', 220, 100);
    const Tg = .8, Ts = .5, Tf = .45, Tt = Tg + Ts + Tf, pos = (sw_, t) => { const i = sw_.i, th = t * 4.6 - i * .4, u = F.ease3(clamp(t / Tg, 0, 1)), r = (68 - i * 1.0) * (.35 + .65 * u), h = 16 + (i * 5.2 + M.sin(t * 6 + i * .6) * 8) * u; return _v.set(M.cos(th) * r, h, M.sin(th) * r) };
    fx(grp, Tt, (u, t) => {
      const fade = clamp(M.min(t / .15, (Tt - t) / Tf), 0, 1);
      for (const w of sw) {
        const s = w.s; let dir;
        if (t < Tg) { const p = pos(w, t); s.position.copy(p); const p2 = pos(w, t + .03); dir = p2.sub(p).normalize(); w.p0.copy(s.position) }
        else if (t < Tg + Ts) {   // phóng kiếm đồng loạt vào địch (so le theo thứ tự thân rồng)
          const k = clamp((t - Tg - w.i * .018) / (Ts * .55), 0, 1), e = F.ease3(k), tx = w.tg ? w.tg.x - x : M.cos(w.ang) * 300, tz = w.tg ? w.tg.y - y : M.sin(w.ang) * 300, ty = (w.tg ? H(w.tg.x, w.tg.y) : y0) - y0 + 18;
          s.position.set(w.p0.x + (tx - w.p0.x) * e, w.p0.y + (ty - w.p0.y) * e, w.p0.z + (tz - w.p0.z) * e); dir = _v.set(tx - w.p0.x, ty - w.p0.y, tz - w.p0.z).normalize();
          if (k >= 1 && !w.done) { w.done = 1; const ax = x + tx, ay = y + tz; F.ring(ax, ay, 44, .4, '#ffe9a0'); F.burst(ax, ay, 10, q ? 8 : 4, 150, .5, '#ffd24a', 140, 160); if (q && w.i % 3 === 0) F.pillar(ax, ay, 150, 8, '#fff0c0', .35, .7) }
        } else dir = null;
        if (dir) { _q.setFromUnitVectors(_Y, dir); s.quaternion.copy(_q) }
      }
      for (const m of mats) m.opacity = (m.userData.o || (m.userData.o = m.opacity)) * fade;
    });
  }
  /* ====================== KỸ NĂNG 3 · TUYỆT ẢNH (ảnh phân thân) ====================== */
  /* Phase 22: bóng phân thân = ĐÚNG HÌNH nhân vật hiện tại (gộp mọi mesh đặc của rig chibi thành 1 hình học, dựng 1 lần/tướng) */
  function silGeo() {
    const A = R3.A, h = A && A.hero; if (!h || !h.g) return null; if (W.sil && W.sil.key === h) return W.sil.geo;
    h.g.updateMatrixWorld(true); const inv = new T.Matrix4().copy(h.g.matrixWorld).invert(), pos = [], v = new T.Vector3(), mat = new T.Matrix4();
    h.g.traverse(o => { if (!o.isMesh || !o.geometry || !o.visible) return; const m = o.material; if (!m || m.blending === T.AdditiveBlending || (m.transparent && m.opacity < .9)) return;
      let g = o.geometry; if (g.index) g = g.toNonIndexed(); const p = g.attributes.position; mat.multiplyMatrices(inv, o.matrixWorld); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(mat); pos.push(v.x, v.y, v.z) } });
    if (pos.length < 900) return null; const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); W.sil = { key: h, geo }; return geo;
  }
  function ghost(col, dark) {
    const sg = Q() > 0 ? silGeo() : null;
    if (sg) {   // bóng hình người: lớp thân màu + lớp viền sáng lớn hơn một chút
      const g = new T.Group(), b = new T.Mesh(sg, new T.MeshBasicMaterial({ color: new T.Color(col).lerp(new T.Color('#ffffff'), .12), transparent: true, opacity: .66, depthWrite: true, fog: false })), o = new T.Mesh(sg, AM('#d8b8ff', .55, T.BackSide)); b.scale.setScalar(1.3); o.scale.setScalar(1.42); b.renderOrder = 6; o.renderOrder = 5; g.add(b, o); g.add(R3.glowSprite(new T.Color(col).getHex(), 52, .42));   // thân đặc (không cộng dồn các mặt chồng nhau) + viền sáng phía sau
      return g;
    }
    const g = new T.Group(), c = AM(col, .75), b = new T.Mesh(F.geos().cylS, c); b.scale.set(6, 15, 4); b.position.y = 4; g.add(b);
    const hd = new T.Mesh(F.geos().sph, c); hd.scale.setScalar(5.4); hd.position.y = 24; g.add(hd);
    const sc = new T.Mesh(F.geos().box, AM('#ff5a8a', .8)); sc.scale.set(8, 1.8, 3); sc.position.y = 19; g.add(sc);
    const sw = new T.Mesh(F.geos().cone, AM('#fff', .9)); sw.scale.set(1.6, 28, 1.6); sw.position.set(8, 10, 4); sw.rotation.z = -.9; g.add(sw);
    g.add(R3.glowSprite(new T.Color(col).getHex(), 44, .5));
    if (dark) { const d = new T.Mesh(F.geos().cylS, new T.MeshBasicMaterial({ color: 0x14062a, transparent: true, opacity: .5, depthWrite: false, fog: false })); d.scale.set(7, 17, 5); d.position.y = 4; g.add(d) }
    return g;
  }
  W.ghost = ghost;   // (kiểm thử) bóng phân thân
  function afterimage(e) {
    if (skillBusy()) return; const G = W.G, x = e.x, y = e.y, g = ghost('#b070ff', 1), d = e.d || 0, dur = .55;
    g.position.set(x, H(x, y), y); g.rotation.y = (G && G.p && G.p.face < 0) ? -PI / 2 : PI / 2; g.visible = false; let t0 = -d;
    if (!(Q() > 0 && W.sil)) for (const sg of [-1, 1]) { const m = new T.Mesh(F.geos().cone, AM('#e6ccff', .9)); m.scale.set(2, 40, 2); m.rotation.z = sg * .9; m.position.y = 18; g.add(m) }
    fx(g, dur + d, (u, t) => { const k = clamp((t - d) / dur, 0, 1); g.visible = t >= d; g.position.y = H(x, y) + k * 6; g.scale.setScalar(1 + k * .12); g.traverse(o => { if (o.material && o.userData.k0 == null) o.userData.k0 = o.material.opacity; if (o.material) o.material.opacity = o.userData.k0 * (1 - k) }); if (t >= d && !g.userData.s) { g.userData.s = 1; F.burst(x, y, 18, 8, 120, .5, '#d9b8ff', 90, 60); F.ring(x, y, 26, .3, '#b070ff') } });
  }
  /* ====================== KỸ NĂNG 4 · THIÊN HỎA ====================== */
  function fireGround(x, y, r, dur) {
    const q = Q(); if (W.grounds >= [5, 8, 12][q]) return; W.grounds++; const g = new T.Group(), rn = rune('#ff7a30', 1, .85); g.add(rn); g.position.set(x, H(x, y), y);
    const fl = [], N = [5, 9, 14][q]; for (let i = 0; i < N; i++) { const m = new T.Mesh(F.geos().cone, AM(i % 3 ? '#ff6a1a' : '#ffd070', .8)); m.userData = { a: R() * TAU, rr: .25 + R() * .65, h: 16 + R() * 26, ph: R() * 6 }; g.add(m); fl.push(m) }
    fx(g, dur, (u, t) => { const k = clamp(M.min(t / .25, (dur - t) / .6), 0, 1); rn.scale.set(r, 1, r); rn.rotation.y = t * .6; rn.material.opacity = .85 * k;
      for (const m of fl) { const d = m.userData, f = .75 + .25 * M.sin(t * 11 + d.ph); m.position.set(M.cos(d.a) * r * d.rr, 0, M.sin(d.a) * r * d.rr); m.scale.set(5.5, d.h * f * k, 5.5); m.material.opacity = .8 * k }
      if (q && R() < .5) { const a = R() * TAU, rr = R() * r * .8; R3.emit(x + M.cos(a) * rr, y + M.sin(a) * rr, 6, 0, 0, 60 + R() * 70, .7, R() < .5 ? '#ff9a3a' : '#ffd070', -20) } if (u >= 1) W.grounds-- });
  }
  function meteorSigil(G) {
    const L = G.skx; if (!L) return;
    for (const o of L) {
      if (o.k !== 'met') continue; let s = W.sig.get(o);
      if (!s) { if (skillBusy()) continue; const rn = rune('#ff5a2a', 1, .0), rn2 = rune('#ffc070', 1, 0); rn.position.y = rn2.position.y = 2; F.put(rn); F.put(rn2); s = { rn, rn2, done: 0 }; W.sig.set(o, s) }
      const k = clamp((o.t + .3) / .45, 0, 1), left = clamp((o.T - o.t) / .35, 0, 1), fade = M.min(k, left), x = o.x, y = o.y, r = o.r * 1.25;
      s.rn.position.set(x, H(x, y) + 2, y); s.rn2.position.set(x, H(x, y) + 2.6, y); s.rn.scale.set(r, 1, r); s.rn2.scale.set(r * .62, 1, r * .62); s.rn.rotation.y = o.t * 1.4; s.rn2.rotation.y = -o.t * 2; s.rn.material.opacity = .9 * fade; s.rn2.material.opacity = .8 * fade;
      if (o.t >= o.T && !s.done) { s.done = 1; fireGround(x, y, o.r * 1.1, 2.4); shake(.22); F.pillar(x, y, 240, o.r * .38, '#ff7a2a', .6, .7); F.ring(x, y, o.r * 2.2, .7, '#ff5a2a', 1, .08); if (Q()) F.burst(x, y, 10, 20, o.r * 3, 1.1, '#ff6a1a', 260, 120) }
    }
    for (const [o, s] of W.sig) if (!L.includes(o) || o.t > o.T + .5) { kill(s.rn); kill(s.rn2); W.sig.delete(o) }
  }
  /* ====================== KỸ NĂNG 5 · BĂNG LONG ====================== */
  function iceDragons(G) {
    const L = G.skx; if (!L) return; const q = Q();
    for (const o of L) {
      if (o.k !== 'zone' || o.st !== 'ice' || o.col) continue; let d = W.ice.get(o);
      if (!d) {
        if (skillBusy()) continue; const grp = new T.Group(), g = F.geos(), N = [8, 12, 16][q], seg = []; F.put(grp);
        for (let i = 0; i < N; i++) { const m = new T.Mesh(g.sph, AM(i % 2 ? '#bff4ff' : '#4ac8ff', .8)); grp.add(m); seg.push(m) }
        const head = new T.Group(), hm = new T.Mesh(g.cone, AM('#e8fbff', .95)); hm.scale.set(6, 16, 6); hm.rotation.x = PI / 2; head.add(hm);
        for (const sd of [-1, 1]) { const h = new T.Mesh(g.cone, AM('#9fe6ff', .9)); h.scale.set(2, 14, 2); h.position.set(sd * 4, 6, -4); h.rotation.set(-.6, 0, -sd * .6); head.add(h) } head.add(R3.glowSprite(0x6ad8ff, 70, .7)); grp.add(head);
        const cr = [], M2 = [6, 10, 14][q]; for (let i = 0; i < M2; i++) { const m = new T.Mesh(g.oct, AM(i % 2 ? '#e6fbff' : '#7ad8ff', .7)); m.userData = { a: i / M2 * TAU + R() * .3, rr: .88 + R() * .18, h: 20 + R() * 26, d: R() * .3 }; grp.add(m); cr.push(m) }
        d = { grp, seg, head, cr }; W.ice.set(o, d); R3.flash(o.x, o.y, 0x9fe6ff, 5);
      }
      const t = o.t, x = o.x, y = o.y, r = o.r, fade = clamp(M.min(t / .3, (o.T - t) / .45), 0, 1), N = d.seg.length;
      d.grp.position.set(x, H(x, y), y);
      const pt = i => { const th = t * 2.4 - i * .2, rr = r * (.7 - i * .008), h = 16 + 12 * M.sin(t * 3 + i * .5) + (N - i) * .8; return [M.cos(th) * rr, h, M.sin(th) * rr, th] };
      d.seg.forEach((m, i) => { const p = pt(i + 1); m.position.set(p[0], p[1], p[2]); m.scale.setScalar(M.max(2.5, 8.5 - i * .5)); m.material.opacity = .8 * fade });
      const p0 = pt(0), p1 = pt(-.3); d.head.position.set(p0[0], p0[1], p0[2]); d.head.rotation.y = M.atan2(p1[0] - p0[0], p1[2] - p0[2]); d.head.scale.setScalar(.6 + .4 * fade);
      d.cr.forEach(m => { const u = clamp((t - d.cr.indexOf(m) * .03) / .4, 0, 1), k = F.ease3(u) * fade, u2 = m.userData; m.position.set(M.cos(u2.a) * r * u2.rr, u2.h * .5 * k, M.sin(u2.a) * r * u2.rr); m.scale.set(5.5, u2.h * k, 5.5); m.material.opacity = .7 * fade });
      if (q && R() < .25) F.burst(x + M.cos(p0[3]) * r * .7, y + M.sin(p0[3]) * r * .7, p0[1], 1, 40, .5, '#dff6ff', 30, -20);
    }
    for (const [o, d] of W.ice) if (!L.includes(o) || o.t >= o.T) { F.burst(o.x, o.y, 14, [8, 14, 20][q], o.r * 1.6, .9, '#bff0ff', 160, 160); F.ring(o.x, o.y, o.r * 1.1, .45, '#8fe4ff'); kill(d.grp); W.ice.delete(o) }
  }
  /* ====================== KỸ NĂNG 6 · QUỶ ẢNH ====================== */
  function shadowClones(G) {
    const L = G.skx; if (!L) return; const q = Q();
    for (const o of L) {
      if (o.k !== 'twr') continue; let s = W.shd.get(o);
      if (!s) { if (skillBusy()) continue; const grp = new T.Group(), N = [2, 3, 4][q], cl = []; F.put(grp); for (let i = 0; i < N; i++) { const gh = ghost('#8a3aff', 1); grp.add(gh); cl.push({ gh, ph: i / N * TAU, sl: R() * .3 }) } s = { grp, cl }; W.shd.set(o, s); F.ring(o.x, o.y, o.r * 1.4, .5, '#8a3aff') }
      const t = o.t, fade = clamp(M.min(t / .3, (o.T - t) / .4), 0, 1);
      for (const c of s.cl) {
        const th = t * 5.2 + c.ph, rr = o.r * .9, x = o.x + M.cos(th) * rr, y = o.y + M.sin(th) * rr; c.gh.position.set(o.x + M.cos(th) * rr - o.x, H(x, y) - H(o.x, o.y) + M.abs(M.sin(t * 9 + c.ph)) * 4, M.sin(th) * rr); c.gh.rotation.y = -th; c.gh.scale.setScalar(1.15 * fade + .001);
        c.gh.traverse(m => { if (m.material && m.userData.k0 == null) m.userData.k0 = m.material.opacity; if (m.material) m.material.opacity = m.userData.k0 * fade });
        c.sl -= 1 / 60; if (c.sl <= 0 && q) { c.sl = .18 + R() * .1; const sx = o.x + M.cos(th) * rr, sy = o.y + M.sin(th) * rr; F.burst(sx, sy, 20, 4, 110, .3, '#d9b8ff', 40, 0); const m = new T.Mesh(sector(.84, 1.6), AM('#c890ff', .8, T.DoubleSide)); m.position.set(sx, H(sx, sy) + 20, sy); m.rotation.y = face(th + PI / 2); m.scale.setScalar(26); fx(m, .18, (u) => { m.scale.setScalar(26 + 16 * u); m.material.opacity = .8 * (1 - u) }) }
      }
      s.grp.position.set(o.x, H(o.x, o.y), o.y); s.o = o;
    }
    for (const [o, s] of W.shd) if (!L.includes(o) || o.t >= o.T) {   // kết thúc: vòng chém năng lượng lớn
      const x = o.x, y = o.y, r = o.r * 2.3; kill(s.grp); W.shd.delete(o); if (o.t < o.T * .5) continue;
      const g = new T.Group(); g.position.set(x, H(x, y) + 22, y); const A = new T.Mesh(sector(.8, TAU * .95), AM('#9a4aff', .9, T.DoubleSide)), B = new T.Mesh(sector(.9, TAU * .8), new T.MeshBasicMaterial({ color: 0x14062a, transparent: true, opacity: .55, depthWrite: false, fog: false, side: T.DoubleSide })); A.renderOrder = 6; g.add(B, A);
      F.ring(x, y, r * .8, .5, '#c890ff'); if (q) F.burst(x, y, 20, 16, r * 1.6, .7, '#b070ff', 150, 80); R3.flash(x, y, 0xa060ff, 6); shake(.18);
      fx(g, .5, (u) => { const k = r * (.25 + .75 * F.ease(u)); A.scale.set(k, 1, k); B.scale.set(k * .94, 1, k * .94); A.rotation.y = B.rotation.y = -u * TAU * 1.3; A.material.opacity = .9 * (1 - u * u); B.material.opacity = .55 * (1 - u) });
    }
  }
  /* ====================== TRẠNG THÁI: làm chậm / đóng băng / thiêu đốt ====================== */
  function statuses(G, dt) {
    const S = W.st; S.t -= dt; if (S.t > 0) return; S.t = .12; const q = Q(); if (!q && !G.skb) return; const P = G.p, cap = [0, 4, 8][q];
    let fz = 0;
    for (const e of G.en) {
      if (e.dead) continue; const dx = e.x - P.x, dy = e.y - P.y; if (dx * dx + dy * dy > 520 * 520) continue;
      if (e.slw > 0) { if ((e.slk || 1) < .45 && fz < cap) { S.fz[fz] = S.fz[fz] || mkFreeze(); const m = S.fz[fz++]; m.visible = true; m.position.set(e.x, H(e.x, e.y), e.y); m.scale.setScalar(M.max(.8, (e.r || 11) / 13)) } if (q && R() < .5) R3.emit(e.x + (R() - .5) * e.r, e.y + (R() - .5) * e.r, 4, 0, 0, 40 + R() * 40, .5, '#bff0ff', -10) }
    }
    for (let i = fz; i < S.fz.length; i++) S.fz[i].visible = false;
    if (G.skb && q) for (const b of G.skb) { const e = b.e; if (e && !e.dead && R() < .6) R3.emit(e.x + (R() - .5) * e.r, e.y, e.r * 1.2, 0, 0, 70 + R() * 50, .5, R() < .5 ? '#ff8a2a' : '#ffd070', -60) }
  }
  function mkFreeze() { const g = new T.Group(); for (let i = 0; i < 4; i++) { const m = new T.Mesh(F.geos().oct, AM(i % 2 ? '#e6fbff' : '#6ad0ff', .65)); const a = i / 4 * TAU; m.position.set(M.cos(a) * 9, 7, M.sin(a) * 9); m.scale.set(4, 12 + i * 3, 4); m.rotation.set((R() - .5) * .5, 0, (R() - .5) * .5); g.add(m) } F.put(g); return g }

  /* ====================== đăng ký ====================== */
  W.onSkxe = e => { if (e.e === 'trail') afterimage(e); else if (e.e === 'meteor' && Q()) { F.ring(e.x, e.y, e.r * 1.1, .8, '#ffd070', 1, .12); F.burst(e.x, e.y, 8, 14, e.r * 2, 1, '#ffb040', 220, 140) } };
  R3.reg({
    init(S) {
      const V = window.DV_VFX; if (V && !V.__wux) {
        V.__wux = 1; const w = (n, f) => { const o = V[n]; if (typeof o !== 'function') return; V[n] = function () { if (R3.active()) { try { f.apply(null, arguments) } catch (e) { console.warn('[wux]', n, e) } } return o.apply(this, arguments) } };
        w('cast', (k, x, y, a, ev) => { if (k === 'kiem') combo(x, y, a, ev) }); w('onHit', (e, src, cr) => impact(e, src, cr)); w('ult', P => dragonSwords(P));
      }
    },
    begin(S, G) { W.G = G; W.sil = null; W.step = 0; W.castT = W.last = -9; W.grounds = 0; W.imp = 0; for (const s of W.sig.values()) { kill(s.rn); kill(s.rn2) } W.sig.clear(); for (const d of W.ice.values()) kill(d.grp); W.ice.clear(); for (const s of W.shd.values()) kill(s.grp); W.shd.clear(); W.st.fz.length = 0; W.st.t = 0 },
    update(S, G, dt) {
      W.G = G; W.imp = 0; if (!G || !G.p) return;
      try { bladeStreaks(G); meteorSigil(G); iceDragons(G); shadowClones(G); statuses(G, dt) } catch (e) { console.warn('[wux upd]', e) }
    },
    end(S) { for (const s of W.sig.values()) { kill(s.rn); kill(s.rn2) } W.sig.clear(); for (const d of W.ice.values()) kill(d.grp); W.ice.clear(); for (const s of W.shd.values()) kill(s.grp); W.shd.clear(); W.st.fz.length = 0 }
  });
})();
