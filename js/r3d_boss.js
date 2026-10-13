/* Phase 22 — 5 MINI-BOSS ĐẶC BIỆT dựng từ NHIỀU BỘ PHẬN có khớp (module của DV_R3D):
   Rồng Băng · Ma Thần · Tê Giác Đá · Hỏa Long · Thần Cây.  Mỗi bộ phận là một mesh riêng + pivot nên có hoạt ảnh thật (vỗ cánh, há hàm, vung tay, bước chân, lắc tán lá).
   Gắn theo chủ đề chương (e.mb): snow/river/sea→Rồng Băng · shadow/void→Ma Thần · mountain/cave/plain/valley→Tê Giác Đá · volcano/desert→Hỏa Long · forest/swamp→Thần Cây.
   citadel/heaven giữ tạo hình cũ. Không đổi chỉ số / AI / cơ chế: chỉ đọc e.tel, e.dsh, e.hp để diễn hoạt ảnh. Boss chương giữ nguyên. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T || !R3.SHAPES) return;
  const PI = Math.PI, TAU = PI * 2, M = Math, Y = new T.Vector3(0, 1, 0), _q = new T.Quaternion(), _e = new T.Euler(), _d = new T.Vector3();
  let P_ = null;
  const tiny = (b) => b.add(P_.box, '#000000', 0, 0, 0, .01, .01, .01);   // geometry giả cho buildRig() gốc (còn lại là vòng rune + hào quang)
  for (const n of ['ice', 'dem', 'rhi', 'fire', 'tree']) R3.SHAPES['mb_' + n] = (b) => { P_ = R3.prim(); tiny(b) };

  function seg(b, col, p0, p1, w, glow) {
    _d.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); const L = _d.length() || 1e-3; _d.divideScalar(L); _q.setFromUnitVectors(Y, _d); _e.setFromQuaternion(_q, 'XYZ');
    b.add(P_.cyl, col, p0[0], p0[1], p0[2], w, L, w, _e.x, _e.y, _e.z, glow);
  }
  /* dựng 1 bộ phận: fn vẽ trong HỆ TỌA ĐỘ THÂN, pivot = điểm khớp → mesh đặt tại pivot */
  function part(a, name, pivot, seed, fn) {
    const b = R3.Builder(seed); fn(b); const geo = b.done(), g = new T.Group(); g.position.set(pivot[0], pivot[1], pivot[2]);
    if (geo.lit) { geo.lit.translate(-pivot[0], -pivot[1], -pivot[2]); const m = new T.Mesh(geo.lit, new T.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; m.userData.lit = 1; g.add(m); a.ms.push(m) }
    if (geo.glow) { geo.glow.translate(-pivot[0], -pivot[1], -pivot[2]); const m = new T.Mesh(geo.glow, new T.MeshBasicMaterial({ vertexColors: true })); g.add(m); a.ms.push(m) }
    a.body.add(g); a.parts[name] = g; return g;
  }
  const horn = (b, col, x, y, z, s, len) => { b.add(P_.cone, col, x, y, z, 1.7 * len, 6 * len, 1.7 * len, -.5, 0, -s * .6); b.add(P_.cone, col, x + s * 2.2 * len, y + 5.4 * len, z - 2.4 * len, 1.1 * len, 5 * len, 1.1 * len, -1.0, 0, -s * 1.0) };

  /* ===================== RỒNG (băng / lửa) ===================== */
  const DRG = {
    ice: { sc: '#bfe6ff', scD: '#6fa6d8', belly: '#f0fbff', horn: '#e8fbff', eye: '#4adcff', crys: '#7ae8ff', wing: '#7ac4f0', bone: '#cfeaff', glow: 1 },
    fire: { sc: '#e0442a', scD: '#8a2014', belly: '#ffc070', horn: '#2a1410', eye: '#ffe24a', crys: '#ff9a2a', wing: '#ff7a2a', bone: '#5a1a10', glow: 1 }
  };
  function dragon(a, pal, fire) {
    const C = pal;
    part(a, 'body', [0, 0, 0], 11, b => {
      b.add(P_.ico1, C.sc, 0, 14, 0, 8.6, 7.4, 14, 0, 0, 0, false, .1); b.add(P_.ico1, C.belly, 0, 10.4, 2, 6.4, 3.8, 11, 0, 0, 0, false, .08);
      for (let i = 0; i < 7; i++) { b.add(P_.cone5, C.crys, 0, 20.6 - M.abs(i - 3) * .6, -9 + i * 3.4, 1.7, fire ? 6.4 : 5.4, 1.5, .1, 0, 0, true) }          // gai lưng: tinh thể băng / ngọn lửa
      for (const s of [-1, 1]) for (const z of [7, -8]) { b.add(P_.cyl, C.scD, s * 6.4, 0, z, 2.8, 10, 2.8); b.add(P_.box, C.sc, s * 6.4, 0, z + 1.4, 3.8, 2, 5.4); for (let c = -1; c <= 1; c++) b.add(P_.cone5, C.horn, s * 6.4 + c * 1.1, .2, z + 4.4, .5, 1.8, .5, PI / 2, 0, 0) }   // chân + móng
      if (fire) for (let i = 0; i < 5; i++) b.add(P_.cone, '#ffcf4a', M.sin(i * 2.1) * 6, 10 + (i % 3) * 3.6, -4 + i * 3, 1.6, 6 + (i % 2) * 3, 1.6, 0, 0, M.sin(i) * .4, true);   // lửa quanh thân
      else for (let i = 0; i < 4; i++) b.add(P_.cone5, C.crys, (i % 2 ? 1 : -1) * 8, 12 + i * 1.6, 2 - i * 4, 1.3, 5, 1.3, 0, 0, (i % 2 ? -1 : 1) * 1.1, true);   // tinh thể băng ở sườn
    });
    part(a, 'neck', [0, 17, 9], 12, b => { seg(b, C.sc, [0, 16, 8], [0, 22, 14], 3.8); for (let i = 0; i < 3; i++) b.add(P_.cone5, C.scD, 0, 19 + i * 1.6, 9 + i * 2, 1.2, 3.4, 1.2, -.5, 0, 0) });
    part(a, 'head', [0, 22, 14], 13, b => {
      b.add(P_.ico1, C.sc, 0, 24, 17.5, 4.8, 4.2, 5.6, 0, 0, 0, false, .06); b.add(P_.box, C.sc, 0, 22.4, 20, 4.4, 2.6, 6.4, .05, 0, 0); b.add(P_.box, C.scD, 0, 24, 24, 3.6, 1.4, 3);   // đầu + mõm
      for (const s of [-1, 1]) { horn(b, C.horn, s * 2.6, 27, 15, s, 1.3); b.add(P_.oct, C.eye, s * 2.9, 26.4, 20.4, 1.1, 1.1, .8, 0, 0, 0, true); b.add(P_.cone5, C.crys, s * 4.6, 24, 16, 1.2, 4, 1.2, 0, 0, -s * 1.2, true) }
      for (let i = 0; i < 4; i++) b.add(P_.cone5, '#fff', -2.4 + i * 1.6, 21.4, 23.6, .4, 1.4, .4, PI, 0, 0);                                                                         // răng trên
    });
    part(a, 'jaw', [0, 21.4, 18], 14, b => { b.add(P_.box, C.scD, 0, 19.4, 21.6, 3.4, 1.8, 6.4); for (let i = 0; i < 3; i++) b.add(P_.cone5, '#fff', -1.5 + i * 1.5, 21, 24, .4, 1.3, .4) });
    for (const s of [-1, 1]) part(a, s < 0 ? 'wingL' : 'wingR', [s * 5, 19, -1], 15 + s, b => {
      const sh = [s * 5, 19, -1], el = [s * 15, 30, -3], tp = [s * 28, 25, -6]; seg(b, C.bone, sh, el, 1.5); seg(b, C.bone, el, tp, 1.2);
      for (const f of [[s * 25, 9, -10], [s * 18, 6, -11], [s * 11, 9, -9]]) seg(b, C.bone, el, f, .9);
      for (let j = 0; j < 3; j++) b.add(P_.cone, C.wing, s * (11 + j * 6.6), 8 + j * 1.4, -5.6 - j * 2.2, 8.4, 17, .45, 0, 0, s * (1.2 - j * .09), j === 1);   // màng cánh
      if (!fire) for (let j = 0; j < 4; j++) b.add(P_.cone5, C.crys, s * (13 + j * 4.6), 27 - j * 2.4, -4, 1, 4, 1, 0, 0, s * 1.4, true);
    });
    part(a, 'tail', [0, 12, -13], 16, b => { for (let i = 0; i < 5; i++) b.add(P_.cone, C.sc, 0, 12 - i * .5, -13 - i * 4.4, 4.6 - i * .75, 7, 4.6 - i * .75, -1.5, 0, 0); b.add(P_.cone5, C.crys, 0, 11, -33, 2.4, 8, 2.4, -1.5, 0, 0, true) });
  }

  /* ===================== MA THẦN ===================== */
  function demon(a) {
    const ar = '#2a1c3c', arL = '#4a3470', pu = '#b44cff', puL = '#e0a8ff';
    part(a, 'body', [0, 0, 0], 21, b => {
      for (const s of [-1, 1]) { b.add(P_.cyl, ar, s * 5.4, 2, 0, 4.8, 13, 4.8); b.add(P_.box, arL, s * 5.6, 0, 2, 6.8, 5, 10); for (let i = 0; i < 3; i++) b.add(P_.cone5, pu, s * 5.6 + (i - 1) * 1.8, .2, 7.6, .7, 2, .7, PI / 2, 0, 0, true) }
      b.add(P_.box, ar, 0, 14, 0, 18, 18, 11, 0, 0, 0, false, .1); b.add(P_.box, arL, 0, 13, 0, 19, 2.4, 12); b.add(P_.oct, pu, 0, 25, 6, 4.4, 6.4, 2.6, 0, 0, 0, true); b.add(P_.tor, arL, 0, 25, 5.6, 7.4, 7.4, 3);
      for (let i = 0; i < 6; i++) b.add(P_.cone5, pu, 0, 33 - i * 3.6, -7 - i * .4, 1.8, 8 - i * .6, 1.8, -.7, 0, 0, true);                    // gai sống lưng
      for (const s of [-1, 1]) { b.add(P_.sph, arL, s * 13, 31, 0, 6.8, 4.8, 6.8); for (let i = 0; i < 4; i++) b.add(P_.cone, pu, s * (14 + i * 1.8), 34 + i * .4, (i - 1.5) * 2.6, 1.6, 9 - i, 1.6, (i - 1.5) * .2, 0, -s * (.7 + i * .2), true) }
    });
    part(a, 'cape', [0, 31, -6], 22, b => { b.add(P_.box, '#1a1028', 0, 4, -6.6, 16, 28, .9, .1, 0, 0); for (let i = -2; i <= 2; i++) b.add(P_.cone, '#1a1028', i * 3.4, 4, -7.4, 1.9, -8, .6) });
    part(a, 'head', [0, 33, 0], 23, b => {
      b.add(P_.box, ar, 0, 33.4, 0, 9.4, 8.6, 8.8, 0, 0, 0, false, .08); b.add(P_.box, '#120a1c', 0, 34, 4.4, 6.4, 3.8, .8);
      for (const s of [-1, 1]) { b.add(P_.box, puL, s * 2.4, 36, 4.9, 2.6, 1.2, .7, 0, 0, s * .35, true); horn(b, arL, s * 4, 40, -1, s, 1.7) }
      for (let i = 0; i < 4; i++) b.add(P_.cone5, '#fff', -2.4 + i * 1.6, 33, 4.6, .45, 1.6, .45, PI, 0, 0);
    });
    for (const s of [-1, 1]) part(a, s < 0 ? 'armL' : 'armR', [s * 14, 31, 0], 24 + s, b => {
      b.add(P_.cyl, ar, s * 14.6, 14, 0, 3.8, 16, 3.8, 0, 0, -s * .15); b.add(P_.box, arL, s * 17, 5, 1, 8.2, 9, 8.2);
      for (let i = 0; i < 3; i++) b.add(P_.cone5, pu, s * 17 + (i - 1) * 2.6, 6, 6.2, 1.2, 5, 1.2, PI / 2 + .1, 0, 0, true);               // móng vuốt tím
    });
    part(a, 'shards', [0, 22, 0], 25, b => { for (let i = 0; i < 7; i++) { const an = i / 7 * TAU; b.add(P_.oct, i % 2 ? puL : pu, M.cos(an) * 19, 14 + (i % 3) * 7, M.sin(an) * 19, 1.8, 4.4, 1.8, 0, 0, an, true) } });
  }

  /* ===================== TÊ GIÁC ĐÁ ===================== */
  function rhino(a) {
    const st = '#8a8272', stD = '#5e574a', stL = '#aaa392', moss = '#6aa83a', hn = '#e8e0c4';
    part(a, 'body', [0, 0, 0], 31, b => {
      b.add(P_.ico1, st, 0, 15, -1, 9.6, 8.6, 14, 0, 0, 0, false, .14); b.add(P_.ico1, stD, 0, 12, -8, 8, 7, 7, 0, 0, 0, false, .14);
      for (let i = 0; i < 4; i++) b.add(P_.ico1, stL, 0, 22.4 - M.abs(i - 1.5) * .8, -7 + i * 5, 5 - i * .3, 2.6, 3.4, 0, 0, 0, false, .12);   // tấm giáp đá trên lưng
      for (const s of [-1, 1]) { b.add(P_.ico1, moss, s * 6, 22, 3, 3.4, 1.4, 3.4, 0, 0, 0, false, .12); b.add(P_.cone5, '#5ad0ff', s * 4, 22, -6, 1.3, 5.4, 1.3, -.2, 0, s * .3, true) }
    });
    part(a, 'head', [0, 17, 10], 32, b => {
      b.add(P_.ico1, st, 0, 15, 17, 6.2, 5.8, 8.2, 0, 0, 0, false, .12); b.add(P_.cone, hn, 0, 17.6, 22, 2.8, 12, 2.8, 1.0, 0, 0); b.add(P_.cone, hn, 0, 19.6, 17.6, 1.7, 6.4, 1.7, .5, 0, 0);       // sừng lớn + sừng nhỏ
      for (const s of [-1, 1]) { b.add(P_.cone5, stD, s * 5, 20, 13, 1.7, 4.4, 1.2, -.2, 0, -s * .4); b.add(P_.box, '#ffb04a', s * 3, 18.4, 22, 1.7, 1.3, .8, 0, 0, s * .3, true) }
      b.add(P_.ico1, moss, 0, 20.4, 13, 3.4, 1.2, 3.4, 0, 0, 0, false, .1);
    });
    for (const [n, x, z] of [['legFL', -6.4, 8], ['legFR', 6.4, 8], ['legBL', -6.4, -9], ['legBR', 6.4, -9]]) part(a, n, [x, 12, z], 33 + x + z, b => { b.add(P_.cyl, stD, x, 0, z, 4.8, 12, 4.8); b.add(P_.ico1, st, x, 1.4, z + 1, 5.6, 2.4, 6.4, 0, 0, 0, false, .1) });
    part(a, 'tail', [0, 14, -14], 34, b => { b.add(P_.cone, stD, 0, 8, -14, 1.8, 10, 1.8, -2.2, 0, 0); b.add(P_.ico1, st, 0, 6, -23, 2.8, 2.8, 2.8, 0, 0, 0, false, .1) });
  }

  /* ===================== THẦN CÂY ===================== */
  function tree(a) {
    const bk = '#6a4a2a', bkD = '#3e2a16', bkL = '#8a6438', lf = '#4ec23a', lfD = '#2e8a2a', gl = '#9aff6a';
    part(a, 'body', [0, 0, 0], 41, b => {
      for (let i = 0; i < 7; i++) { const an = i / 7 * TAU; seg(b, bkD, [M.cos(an) * 3, 8, M.sin(an) * 3], [M.cos(an) * 12, 0, M.sin(an) * 12], 2.4 - (i % 2) * .5) }   // rễ làm chân
      b.add(P_.cyl, bk, 0, 6, 0, 8.6, 22, 7.4, 0, 0, 0, false, .12); b.add(P_.ico1, bkL, 0, 22, 0, 8.8, 7, 7.6, 0, 0, 0, false, .12);
      for (let i = 0; i < 5; i++) b.add(P_.box, bkD, M.cos(i * 1.3) * 7, 10 + i * 3.4, M.sin(i * 1.3) * 5.6, .9, 6, .8, 0, i, 0);                // vết vỏ cây
      b.add(P_.oct, gl, 0, 15, 6.6, 2.6, 3.6, 1.6, 0, 0, 0, true); b.add(P_.tor, bkD, 0, 15, 6.2, 4.2, 4.2, 2);                                // lõi xanh ngực
      for (const s of [-1, 1]) { b.add(P_.box, '#0e2208', s * 3.2, 23.4, 7.4, 2.8, 1.4, .8, 0, 0, s * .3); b.add(P_.box, gl, s * 3.2, 23.4, 7.9, 1.8, .9, .6, 0, 0, s * .3, true) }
      b.add(P_.box, '#0e2208', 0, 18.6, 7.6, 4.4, 2.4, .7);
    });
    part(a, 'canopy', [0, 27, 0], 42, b => {
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, r = i === 7 ? 0 : 8; b.add(P_.ico1, i % 3 ? lf : lfD, M.cos(an) * r, 31 + (i % 3) * 3.6, M.sin(an) * r, 8.4 - (i % 2), 6.4, 8.4 - (i % 2), 0, i, 0, false, .2) }
      for (let i = 0; i < 4; i++) b.add(P_.cone5, gl, M.cos(i * 1.6) * 6, 36 + (i % 2) * 3, M.sin(i * 1.6) * 6, 1.1, 3.4, 1.1, 0, 0, 0, true);
    });
    for (const s of [-1, 1]) part(a, s < 0 ? 'armL' : 'armR', [s * 8, 24, 0], 43 + s, b => {
      seg(b, bk, [s * 8, 24, 0], [s * 18, 18, 2], 3.2); seg(b, bkL, [s * 18, 18, 2], [s * 24, 8, 5], 2.8);
      for (let i = 0; i < 4; i++) seg(b, bkD, [s * 24, 8, 5], [s * (26 + i * .8), 1 + i * .6, 7 + (i - 1.5) * 2.4], 1.1);                      // rễ-ngón tay
      for (let i = 0; i < 3; i++) b.add(P_.ico1, lf, s * (14 + i * 4), 20 - i * 2.4, 1 + i, 2.6, 1.6, 2.6, 0, i, 0, false, .2);
    });
  }

  /* ---------- gắn bộ phận vào rig do buildRig() gốc dựng ---------- */
  R3.mbParts = function (a, e, k) {
    P_ = R3.prim(); a.ms = []; a.parts = {}; if (a.lit) a.lit.visible = false; if (a.glow) a.glow.visible = false; a.fam = k.fam; a.seed = e.id * .731;
    const f = k.fam; if (f === 'ice') dragon(a, DRG.ice, false); else if (f === 'fire') dragon(a, DRG.fire, true); else if (f === 'dem') demon(a); else if (f === 'rhi') rhino(a); else if (f === 'tree') tree(a);
    return a;
  };

  /* ---------- hoạt ảnh bộ phận (gọi cuối rigAnim) ---------- */
  R3.mbAnim = function (a, e, k, S, G, dt, sc) {
    const t = S.t + a.seed, p = a.parts, f = a.fam, tel = e.tel > 0, dash = e.dsh > 0, P = G.p, yaw = M.atan2(P.x - e.x, P.y - e.y), fx = M.sin(yaw), fy = M.cos(yaw), q = S.q | 0;
    const sw = M.sin(t * 2.1), br = 1 + .025 * M.sin(t * 2.4); a.body.scale.set(1, br, 1);
    const emit = R3.emit, rnd = M.random;
    if (f === 'ice' || f === 'fire') {
      const flap = (dash ? 1.4 : 1) * (.42 + .3 * M.sin(t * (tel ? 7 : 3.1)));
      p.wingL.rotation.z = flap; p.wingR.rotation.z = -flap; p.wingL.rotation.y = -.15 * sw; p.wingR.rotation.y = .15 * sw;
      p.neck.rotation.x = .08 * M.sin(t * 2.2) - (tel ? .22 : 0); p.head.rotation.x = .12 * M.sin(t * 2.2 + .6) - (tel ? .3 : 0); p.jaw.rotation.x = tel ? .75 + .1 * M.sin(t * 20) : .08 + .06 * M.sin(t * 2.6);
      p.tail.rotation.y = .38 * M.sin(t * 2.0); p.tail.rotation.x = .06 * M.sin(t * 3);
      if (emit && q > 0) {
        const mx = e.x + fx * 22 * sc, my = e.y + fy * 22 * sc, hz = 20 * sc;
        if (tel && rnd() < dt * 60) emit(mx, my, hz, fx * 150 + (rnd() - .5) * 40, fy * 150 + (rnd() - .5) * 40, -10 + rnd() * 20, .55, f === 'ice' ? '#d4f4ff' : '#ff8a2a', 0);     // hơi thở khi báo hiệu đòn
        if (rnd() < dt * (f === 'fire' ? 22 : 12)) { const an = rnd() * TAU, rr = e.r * (.5 + rnd()); emit(e.x + M.cos(an) * rr, e.y + M.sin(an) * rr, 6 + rnd() * 14, 0, 0, f === 'fire' ? 50 + rnd() * 50 : 12, 1.2, f === 'fire' ? (rnd() < .5 ? '#ff7a2a' : '#ffd34a') : (rnd() < .5 ? '#cdeeff' : '#7ae8ff'), f === 'fire' ? -8 : 6) }   // lửa/tuyết bay quanh thân
      }
    } else if (f === 'dem') {
      const sw2 = M.sin(t * 2.6); p.armL.rotation.x = -.5 * sw2 - (tel ? .9 : 0); p.armR.rotation.x = .5 * sw2 - (tel ? .9 : 0); p.armL.rotation.z = -.1 - (dash ? .4 : 0); p.armR.rotation.z = .1 + (dash ? .4 : 0);
      p.head.rotation.x = .1 * M.sin(t * 2) - (tel ? .2 : 0); p.head.rotation.y = .18 * M.sin(t * 1.3); p.cape.rotation.x = .12 + .1 * M.sin(t * 2.4) + (dash ? .5 : 0); p.shards.rotation.y = t * 1.3; p.shards.position.y = 22 + 2 * M.sin(t * 2);
      if (emit && q > 0 && rnd() < dt * 20) { const an = rnd() * TAU, rr = e.r * (.5 + rnd()); emit(e.x + M.cos(an) * rr, e.y + M.sin(an) * rr, 4, 0, 0, 40 + rnd() * 40, 1.1, rnd() < .5 ? '#b44cff' : '#3a1a5a', -6) }
    } else if (f === 'rhi') {
      const ph = t * (dash ? 14 : 5.5), a1 = M.sin(ph) * (dash ? .9 : .55), a2 = M.sin(ph + PI) * (dash ? .9 : .55);
      p.legFL.rotation.x = a1; p.legBR.rotation.x = a1; p.legFR.rotation.x = a2; p.legBL.rotation.x = a2;
      p.head.rotation.x = tel ? -.28 + .1 * M.sin(t * 30) : dash ? .42 : .08 * M.sin(t * 2.6); p.tail.rotation.y = .3 * M.sin(t * 3.4);
      if (emit && q > 0 && (dash || rnd() < dt * 6)) { const an = rnd() * TAU; for (let i = 0; i < (dash ? 2 : 1); i++) emit(e.x - fx * 10 * sc + M.cos(an) * 8, e.y - fy * 10 * sc + M.sin(an) * 8, 2, -fx * 30, -fy * 30, 20 + rnd() * 20, .8, rnd() < .5 ? '#bdb29a' : '#8a8272', -30) }   // bụi + mảnh đá
    } else if (f === 'tree') {
      const sw2 = M.sin(t * 1.7); p.armL.rotation.z = .18 * sw2 + (tel ? .9 : 0); p.armR.rotation.z = -.18 * sw2 - (tel ? .9 : 0); p.armL.rotation.x = -.2 * M.sin(t * 2.3) - (dash ? .5 : 0); p.armR.rotation.x = .2 * M.sin(t * 2.3) - (dash ? .5 : 0);
      p.canopy.rotation.z = .07 * M.sin(t * 1.4); p.canopy.rotation.x = .05 * M.sin(t * 1.1 + 1); p.canopy.scale.setScalar(1 + .03 * M.sin(t * 2.2));
      if (emit && q > 0 && rnd() < dt * 18) { const an = rnd() * TAU, rr = e.r * (.4 + rnd()); emit(e.x + M.cos(an) * rr, e.y + M.sin(an) * rr, 24 + rnd() * 20, (rnd() - .5) * 30, (rnd() - .5) * 30, -6, 1.6, rnd() < .5 ? '#6ae04a' : '#c8ff8a', 4) }   // lá bay
    }
  };

  /* ---------- gán họ mini-boss theo chủ đề chương (mở rộng R3.fam của r3d_fams.js) ---------- */
  const TH = { snow: 'ice', river: 'ice', sea: 'ice', shadow: 'dem', void: 'dem', mountain: 'rhi', cave: 'rhi', plain: 'rhi', valley: 'rhi', volcano: 'fire', desert: 'fire', forest: 'tree', swamp: 'tree' };
  const prev = R3.fam, C = new Map();
  R3.fam = function (k, e) {
    if (e && e.mb && !e.boss && k) {
      const f = TH[k.theme]; if (!f) return k; const key = k.key + '|mb' + f; let o = C.get(key); if (o) return o;
      o = Object.assign({}, k, { key, fam: f, mbf: 1, shape: 'mb_' + f }); C.set(key, o); return o;
    }
    return prev ? prev(k, e) : k;
  };
})();
