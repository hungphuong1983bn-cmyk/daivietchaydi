/* Phase 22 — 8 HỌ QUÁI THƯỜNG có hình dáng riêng (module của DV_R3D, dựng trên Builder + SHAPES của r3d_actors.js).
   KHÔNG đổi chỉ số / AI / kỹ năng quái: chỉ đổi HÌNH ẢNH theo vai trò (e.tid) bằng R3.fam(k, e) → k mới có shape 'f_<họ>'.
     swarm,splitter→côn trùng · tank,armor,bomber→thùng gỗ · grunt,lancer,archer,hunter→lính canh vệ · shaman,summoner→pháp sư
     fast→sói · assassin→dơi · colossus→khổng lồ · mọi quái tinh anh (e.el)→tinh anh.   Boss / Mini-boss giữ nguyên (bước sau).
   R3.FAMM: chuyển động riêng từng họ (bò nhanh, vồ, bay lượn + vỗ cánh, bước nặng...). Mỗi họ: silhouette, bảng màu, mắt phát sáng riêng. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T || !R3.SHAPES) return;
  const PI = Math.PI, SH = R3.SHAPES, Y = new T.Vector3(0, 1, 0), _q = new T.Quaternion(), _e = new T.Euler(), _d = new T.Vector3();
  let P_ = null;
  /* đoạn trụ nối p0→p1 (chân, tay, cánh...) */
  function seg(b, col, p0, p1, w, glow) {
    _d.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); const L = _d.length() || 1e-3; _d.divideScalar(L); _q.setFromUnitVectors(Y, _d); _e.setFromQuaternion(_q, 'XYZ');
    b.add(P_.cyl, col, p0[0], p0[1], p0[2], w, L, w, _e.x, _e.y, _e.z, glow);
  }
  const eyeG = (b, col, x, y, z, s) => { for (const sd of [-1, 1]) b.add(P_.box, col, sd * x, y, z, s, s, s * .5, 0, 0, 0, true) };

  /* ---------------- CÔN TRÙNG: nhện giáp 8 chân, mắt đỏ, bò thấp ---------------- */
  function insect(b, k) {
    const sh = '#2c2230', shD = '#1a141e', red = '#e0382a', org = '#ff7a2a';
    b.add(P_.ico1, shD, 0, 8, -6, 9.5, 6.4, 10.5, 0, 0, 0, false, .12);                      // bụng
    b.add(P_.ico1, sh, 0, 9, 3, 7.4, 5.6, 7.4, 0, 0, 0, false, .12);                          // ngực giáp
    b.add(P_.ico, sh, 0, 8.4, 9.6, 5, 4.2, 4.6);                                              // đầu
    for (let i = 0; i < 3; i++) b.add(P_.box, red, 0, 14.6 + (i ? 0 : 0), -9 + i * 5, 3.2 - i * .4, .9, 3.4, 0, 0, 0, true);   // vằn đỏ trên lưng
    for (const s of [-1, 1]) {
      b.add(P_.cone, '#d8c8a8', s * 2.2, 5.4, 13, 1.1, 5, 1.1, PI / 2 + .5, 0, -s * .5);       // hàm
      for (let j = 0; j < 4; j++) {                                                           // 4 chân mỗi bên, 2 đốt
        const z = 6 - j * 4.4, kx = s * (12 + (j % 2) * 2), kz = z + (j < 2 ? 4 : -4);
        seg(b, sh, [s * 4.5, 8, z], [kx, 15, kz], 1.25); seg(b, org, [kx, 15, kz], [s * (19 + (j % 2) * 2), 0, kz + (j < 2 ? 3 : -3)], .95);
      }
      for (let q = 0; q < 2; q++) b.add(P_.box, red, s * (1.6 + q * 1.5), 10.6 + q * .6, 12.4, 1.2, 1.2, .7, 0, 0, 0, true);   // 4 mắt đỏ phát sáng
    }
  }

  /* ---------------- THÙNG GỖ: khối ghép ván, đai sắt, mặt giận, nứt, mầm hồi máu ---------------- */
  function crate(b, k) {
    const w1 = '#9a6232', w2 = '#7a4a24', w3 = '#5a3618', fe = '#3a3e4a';
    for (const s of [-1, 1]) { b.add(P_.box, w2, s * 4.2, 0, 0, 5, 7, 6); b.add(P_.box, fe, s * 4.2, 0, 1.8, 5.4, 1.4, 6.6) }                  // chân ngắn
    b.add(P_.box, w1, 0, 6, 0, 17, 17, 14, 0, 0, 0, false, .06);                                                                                 // thân thùng
    for (let i = -1; i <= 1; i++) b.add(P_.box, w3, i * 5.2, 6.4, 7.1, .8, 16.4, .6);                                                           // khe ván
    for (const y of [8.2, 20]) b.add(P_.box, fe, 0, y, 0, 17.8, 1.8, 14.8);                                                                     // đai sắt ngang
    b.add(P_.box, w3, -3, 11, 7.2, 5.5, .6, .5, 0, 0, .7); b.add(P_.box, w3, 5, 17, 7.2, 4.2, .6, .5, 0, 0, -.6);                                // vết nứt
    for (const [x, y] of [[-7.5, 8.6], [7.5, 8.6], [-7.5, 20.4], [7.5, 20.4]]) b.add(P_.sph, '#c9ced8', x, y, 7.6, .9, .9, .5);                    // đinh
    for (const s of [-1, 1]) {
      b.add(P_.box, '#ffffff', s * 3.6, 14.6, 7.4, 3.4, 3.2, .6); b.add(P_.box, '#1a0e08', s * 3.6, 14.2, 7.9, 1.5, 1.8, .5);
      b.add(P_.box, '#1a0e08', s * 3.6, 18.2, 7.7, 4.6, 1, .6, 0, 0, s * .45);                                                                 // lông mày giận
      b.add(P_.box, w1, s * 11.4, 8, 0, 4.6, 12, 4.8, 0, 0, -s * .22); b.add(P_.box, w2, s * 12.6, 3, 0, 6.4, 6, 6.4);                          // tay + nắm đấm gỗ
      b.add(P_.box, fe, s * 12.6, 6.4, 0, 6.8, 1.2, 6.8);
    }
    b.add(P_.box, '#2a1408', 0, 9.6, 7.5, 7.2, 2, .5);                                                                                           // miệng
    for (let i = 0; i < 4; i++) b.add(P_.cone5, '#ffffff', -3 + i * 2, 11.6, 7.8, .9, 1.6, .4, PI, 0, 0);                                         // răng
    b.add(P_.cone, '#5ad84a', 0, 23.6, 0, 1.6, 6, 1.6, 0, 0, 0, true); b.add(P_.cone, '#8aff6a', 2.6, 23.4, 0, 1.2, 4.4, 1.2, 0, 0, -.6, true);    // mầm xanh = hồi máu
    b.add(P_.cone, '#5ad84a', -2.6, 23.4, 0, 1.2, 4.2, 1.2, 0, 0, .6, true);
  }

  /* ---------------- LÍNH CANH VỆ: mũ giáp chùm đỏ, giáo, khiên, tabard ---------------- */
  function guard(b, k) {
    const P = k.P, steel = '#b9c3d6', steelD = '#7d889e', red = '#c42a30', cloth = P.cloth || red, dk = '#3a3f4e';
    for (const s of [-1, 1]) { b.add(P_.cyl, dk, s * 3.4, 4, 0, 3.2, 8, 3.2); b.add(P_.box, '#2a2118', s * 3.4, 0, 1.6, 4.6, 4.4, 7.2) }
    b.add(P_.box, steel, 0, 10, 0, 12, 12, 8, 0, 0, 0, false, .05); b.add(P_.box, cloth, 0, 5, 4.4, 9, 11, .9); b.add(P_.box, '#e8c44a', 0, 11.2, 4.5, 12.4, 1.4, 1.2);   // giáp + tabard + đai vàng
    for (const s of [-1, 1]) { b.add(P_.sph, steel, s * 8.2, 21, 0, 4.4, 3.4, 4.4); b.add(P_.cyl, steelD, s * 8.8, 12, 0, 2.6, 9, 2.6, 0, 0, -s * .1) }       // vai + tay
    b.add(P_.sph, '#f0cba6', 0, 28.6, 0, 7.2, 7.4, 7);                                                                                       // đầu to
    b.add(P_.sph, steel, 0, 31, -.4, 7.9, 6.2, 7.6); b.add(P_.box, steelD, 0, 28.6, 5.4, 2, 5.6, 1.2);                                           // mũ + sống mũi mũ
    b.add(P_.cone, red, 0, 36, -1, 1.8, 8, 1.8, -.2, 0, 0); b.add(P_.box, red, 0, 38, -3.4, 1.4, 8, 3, -.4, 0, 0);                              // chùm lông đỏ
    for (const s of [-1, 1]) { b.add(P_.box, '#ffffff', s * 2.6, 27.4, 6.4, 2.4, 2.4, .6); b.add(P_.box, '#1a0e08', s * 2.6, 27.4, 6.8, 1.3, 1.6, .5); b.add(P_.box, '#1a0e08', s * 2.8, 30.4, 6.7, 3.6, .8, .5, 0, 0, s * .4) }
    b.add(P_.cyl, '#7a5a34', 12.5, -2, 3, 1.1, 50, 1.1); b.add(P_.cone, '#dfe6f4', 12.5, 48, 3, 2.4, 10, .9); b.add(P_.sph, red, 12.5, 47, 3, 2, 2.4, 2);      // giáo
    b.add(P_.cyl, steelD, -11.5, 7, 5, 8.6, 1.8, 8.6, PI / 2, 0, 0); b.add(P_.cyl, red, -11.5, 7, 6, 6, 1.9, 6, PI / 2, 0, 0); b.add(P_.sph, '#e8c44a', -11.5, 11.5, 6.8, 1.8, 1.8, 1, 0, 0, 0, true);   // khiên
  }

  /* ---------------- TINH ANH: giáp tối, năng lượng tím, to cao đáng sợ ---------------- */
  function elite(b, k) {
    const ar = '#2a2038', arL = '#463864', pu = '#a24cff', puL = '#d6a0ff';
    for (const s of [-1, 1]) { b.add(P_.cyl, ar, s * 5, 2, 0, 4.6, 13, 4.6); b.add(P_.box, arL, s * 5, 0, 2, 6.4, 5, 9); b.add(P_.cone5, pu, s * 5, 12, 3.4, 2.2, 5, 2.2, .6, 0, 0, true) }
    b.add(P_.box, ar, 0, 14, 0, 17, 18, 10.4, 0, 0, 0, false, .08); b.add(P_.oct, pu, 0, 24, 5.6, 3.8, 5.4, 2.4, 0, 0, 0, true); b.add(P_.tor, arL, 0, 24, 5.2, 6.4, 6.4, 3);   // thân + lõi tím
    b.add(P_.box, arL, 0, 12, 0, 18.6, 2.2, 11.2);
    for (const s of [-1, 1]) {
      b.add(P_.sph, arL, s * 12.4, 30, 0, 6.6, 4.6, 6.6); for (let i = 0; i < 3; i++) b.add(P_.cone, pu, s * (13 + i * 1.8), 33 + i * .6, (i - 1) * 3, 1.5, 8 - i, 1.5, (i - 1) * .3, 0, -s * (.7 + i * .25), true);   // vai gai
      b.add(P_.cyl, ar, s * 13.4, 14, 0, 3.8, 14, 3.8, 0, 0, -s * .2); b.add(P_.box, arL, s * 15.4, 4, 0, 7.6, 8, 7.6); b.add(P_.cone5, pu, s * 15.4, 12, 3.6, 1.6, 5, 1.6, PI / 2, 0, 0, true);   // tay + nắm đấm giáp
    }
    b.add(P_.box, ar, 0, 31, 0, 9, 8.6, 8.4, 0, 0, 0, false, .06);                                                                           // đầu giáp
    for (const s of [-1, 1]) { b.add(P_.cone, arL, s * 4.2, 38, -1, 1.8, 11, 1.8, -.2, 0, -s * .5); b.add(P_.box, puL, s * 2.4, 34.2, 4.3, 2.6, 1.2, .7, 0, 0, s * .3, true) }   // sừng + mắt tím
    for (let i = 0; i < 5; i++) b.add(P_.cone5, pu, 0, 30 - i * 3.4, -6 - i * .3, 1.5, 7 - i * .5, 1.5, -.7, 0, 0, true);                       // gai sống lưng phát sáng
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; b.add(P_.oct, i % 2 ? puL : pu, Math.cos(a) * 17, 16 + (i % 3) * 5, Math.sin(a) * 12, 1.6, 3.6, 1.6, 0, 0, a, true) }   // mảnh năng lượng lơ lửng
  }

  /* ---------------- PHÁP SƯ: áo choàng xanh, mũ trùm, trượng pha lê ---------------- */
  function mage(b, k) {
    const rb = '#2a56c8', rbD = '#1c3a8a', gold = '#e8c44a', cy = '#7af0ff';
    b.add(P_.cone, rb, 0, 0, 0, 10.5, 25, 8.4, 0, 0, 0, false, .05); b.add(P_.cyl, rbD, 0, 0, 0, 10.8, 2.2, 8.6);                                  // áo choàng xòe
    b.add(P_.cyl, gold, 0, 11, 0, 5.4, 1.6, 4.6); b.add(P_.sph, cy, 0, 11.8, 4.6, 1.3, 1.3, .8, 0, 0, 0, true);                                    // đai + ngọc
    for (const s of [-1, 1]) { b.add(P_.cyl, rb, s * 6.4, 14, 0, 2.6, 8, 2.6, 0, 0, -s * .5); b.add(P_.sph, '#f0cba6', s * 9.6, 14, 1, 2, 2, 2) }
    b.add(P_.sph, rb, 0, 28, -.8, 9, 8.6, 8.4); b.add(P_.cone, rb, 0, 30, -2.6, 6.8, 9, 6, -.5, 0, 0);                                            // mũ trùm
    b.add(P_.sph, '#10163a', 0, 27.6, 3, 6.2, 6, 4.6); eyeG(b, '#bff8ff', 2.4, 27.8, 6.2, 2.2); b.add(P_.box, '#10163a', 0, 25, 6, 3, .5, .4);        // mặt tối, mắt sáng
    b.add(P_.cyl, '#6a4528', 12, -2, 4, 1.1, 40, 1.1, 0, 0, -.05); b.add(P_.oct, cy, 12.6, 40, 4, 3.4, 5, 3.4, 0, 0, 0, true); b.add(P_.cone5, gold, 12.4, 36, 4, 2.4, 3, 2.4, PI, 0, 0);   // trượng + pha lê xanh
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; b.add(P_.oct, cy, 12.6 + Math.cos(a) * 6, 40 + Math.sin(a) * 6, 4, 1, 1.8, 1, 0, 0, a, true) }
  }

  /* ---------------- KHỔNG LỒ: người đá, rêu, tinh thể, mắt vàng ---------------- */
  function giant(b, k) {
    const st = '#8a8a7c', stD = '#5e5e54', stL = '#a8a898', moss = '#6aa83a', cr = '#5ad0ff';
    for (const s of [-1, 1]) { b.add(P_.ico1, stD, s * 6.4, 9, 0, 6.8, 9, 6.8, 0, 0, 0, false, .14); b.add(P_.ico, stD, s * 6.4, 1.4, 1.4, 6.8, 3, 8.4, 0, 0, 0, false, .12) }
    b.add(P_.ico1, st, 0, 22, 0, 14, 12.4, 10.6, 0, 0, 0, false, .16); b.add(P_.ico, stL, -4, 26, 5, 6, 5, 4, 0, 0, 0, false, .15);                     // thân đá
    for (const s of [-1, 1]) {
      b.add(P_.ico1, st, s * 15.4, 25, 0, 6.8, 6.2, 6.8, 0, 0, 0, false, .15); b.add(P_.ico1, moss, s * 15.6, 29.6, 0, 5.4, 2.4, 5.4, 0, 0, 0, false, .15);   // vai + rêu
      b.add(P_.cyl, stD, s * 17, 10, 0, 4.8, 14, 4.8, 0, 0, -s * .06); b.add(P_.ico1, st, s * 17.6, 6, 0, 7.8, 7, 7.8, 0, 0, 0, false, .15);                 // tay + nắm đấm
    }
    b.add(P_.ico, stL, 0, 31, 3, 6.6, 5.6, 5.6, 0, 0, 0, false, .12); b.add(P_.ico1, moss, 0, 35.4, 1, 6.2, 2.2, 5.4, 0, 0, 0, false, .15);              // đầu chìm + rêu
    eyeG(b, '#ffd24a', 2.6, 31.6, 7.6, 2.4); b.add(P_.box, stD, 0, 28.4, 8, 6.4, 1.1, .6);
    for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 4.4; b.add(P_.cone5, cr, x, 26 + (i % 2) * 4, -8, 2.2, 8 + (i % 3) * 3, 2.2, -.4 - i * .06, 0, x * .05, true) }      // tinh thể sau lưng
    b.add(P_.cone5, cr, -12, 28, -2, 1.6, 6, 1.6, 0, 0, .5, true); b.add(P_.ico1, moss, -6, 30, 5, 2.6, 1.3, 2.6, 0, 0, 0, false, .15);
  }

  /* ---------------- SÓI: thân dài, lông nhiều lớp, móng vuốt, hàm răng ---------------- */
  function wolf(b, k) {
    const f1 = '#9aa6bd', f2 = '#5b6478', f3 = '#c9d2e4', red = '#ff3a3a';
    b.add(P_.ico1, f2, 0, 11, -4, 6.4, 6.2, 11, 0, 0, 0, false, .08); b.add(P_.ico1, f1, 0, 12, 5, 6.8, 6.6, 7.4, 0, 0, 0, false, .08);                  // thân sau/trước
    for (let i = 0; i < 6; i++) b.add(P_.cone5, f3, 0, 16.4 - Math.abs(i - 2.5) * .5, -9 + i * 3.6, 1.9, 5.4, 1.5, .25, 0, 0);                            // bờm gai trên lưng
    for (const s of [-1, 1]) for (const [z, r] of [[7, 0], [-8, 1]]) { const x = s * 3.8; seg(b, f2, [x, 10, z], [x * 1.2, 5.6, z + (r ? -2 : 1.6)], 2.1); seg(b, f1, [x * 1.2, 5.6, z + (r ? -2 : 1.6)], [x * 1.3, .6, z + (r ? -3 : 3)], 1.5); b.add(P_.cone5, '#f4f0e0', x * 1.3, .4, z + (r ? -3 : 4.2), .6, 1.6, .6, PI / 2, 0, 0) }   // 4 chân + móng
    b.add(P_.ico1, f1, 0, 15, 12.6, 4.8, 4.6, 4.8, 0, 0, 0, false, .08); b.add(P_.cone, f3, 0, 13, 15.4, 2.6, 7, 2.2, PI / 2, 0, 0);                    // đầu + mõm
    b.add(P_.sph, '#161a24', 0, 14.2, 21.8, 1, 1, 1); for (const s of [-1, 1]) { b.add(P_.cone5, f2, s * 2.8, 20, 11.4, 1.7, 5, 1.2, -.2, 0, -s * .2); b.add(P_.cone5, '#ffffff', s * 1.3, 11.4, 19.4, .5, 1.5, .5, PI, 0, 0) }   // tai + nanh
    eyeG(b, red, 2.2, 16, 15.8, 1.5);
    b.add(P_.cone, f1, 0, 14, -13, 3.4, 12, 3, -1.2, 0, 0); b.add(P_.cone, f3, 0, 13, -14.5, 2.2, 8, 2, -1.4, 0, 0);                                    // đuôi xù
  }

  /* ---------------- DƠI: cánh có xương, tai nhọn, mắt đỏ (bay cao, vỗ cánh) ---------------- */
  function bat(b, k) {
    const bd = '#3a2250', wg = '#8a3acb', wgL = '#d06aff', bone = '#2a1840';
    b.add(P_.ico1, bd, 0, 10, 0, 4.8, 5.4, 5.2, 0, 0, 0, false, .06); b.add(P_.ico1, bd, 0, 16.4, 3.4, 4.4, 4.2, 4.2, 0, 0, 0, false, .06);                // thân + đầu
    for (const s of [-1, 1]) {
      b.add(P_.cone5, bd, s * 2.6, 22, 2.8, 1.5, 6, 1.1, 0, 0, -s * .2); b.add(P_.box, '#ff3a5a', s * 1.9, 16.8, 6.8, 1.3, 1.3, .6, 0, 0, 0, true); b.add(P_.cone5, '#fff', s * .9, 13.6, 7.2, .4, 1.3, .4, PI, 0, 0);   // tai + mắt + nanh
      const sh = [s * 3, 12.4, -.4], el = [s * 14, 18.2, -1], tp = [s * 27, 14, -3];                                                                      // xương cánh: vai → khuỷu → mút
      seg(b, bone, sh, el, 1.1); seg(b, bone, el, tp, .9);
      for (const [tx, ty, tz] of [[s * 24, 3, -6], [s * 17, 1, -8], [s * 9, 2, -8.4]]) { seg(b, bone, el, [tx, ty, tz], .7); }                           // 3 ngón cánh
      for (let j = 0; j < 3; j++) { const x0 = s * (11 + j * 6.4), z0 = -3.4 - j * 2.4; b.add(P_.cone, j % 2 ? wgL : wg, x0, 4 + j * .4, z0, 7, 11, .35, 0, 0, s * 1.35 - (j - 1) * s * .12, j === 1) }   // màng cánh
      b.add(P_.cone5, wg, s * 4, 12, 1, 2, 5, .5, 0, 0, s * 1.5);
    }
  }

  const FAMS = { insect, crate, guard, elite, mage, giant, wolf, bat };
  for (const n in FAMS) { const f = FAMS[n]; SH['f_' + n] = (b, k, big) => { P_ = R3.prim(); f(b, k, big) } }

  /* ---------------- chuyển động riêng: hop biên độ, bay (fly), bob, lean/wob nhân, vỗ cánh (flap), tốc độ nhịp (spd) ---------------- */
  R3.FAMM = {
    insect: { hop: .5, fly: 0, bob: 0, lean: .35, wob: .25, spd: 2.4, flap: 0 },
    crate: { hop: 1.6, fly: 0, bob: 0, lean: .7, wob: 1.6, spd: .8, flap: 0 },
    guard: { hop: 1.8, fly: 0, bob: 0, lean: 1, wob: .6, spd: 1, flap: 0 },
    elite: { hop: 1.2, fly: 0, bob: .3, lean: .5, wob: .4, spd: .7, flap: 0 },
    mage: { hop: .6, fly: 3, bob: 1.4, lean: .4, wob: .5, spd: .6, flap: 0 },
    giant: { hop: 1.4, fly: 0, bob: 0, lean: .3, wob: .8, spd: .5, flap: 0 },
    wolf: { hop: 2.8, fly: 0, bob: 0, lean: 1.6, wob: .5, spd: 1.5, flap: 0 },
    bat: { hop: 0, fly: 14, bob: 3.2, lean: .8, wob: 1.8, spd: 1, flap: .55 }
  };
  const MAP = { swarm: 'insect', splitter: 'insect', tank: 'crate', armor: 'crate', bomber: 'crate', grunt: 'guard', lancer: 'guard', archer: 'guard', hunter: 'guard', shaman: 'mage', summoner: 'mage', fast: 'wolf', assassin: 'bat', colossus: 'giant' };
  const C = new Map();
  R3.fam = function (k, e) {
    if (!k || !e || e.boss || e.mb) return k; const f = e.el ? 'elite' : MAP[e.tid]; if (!f) return k;
    const key = k.key + '|f' + f; let o = C.get(key); if (o) return o; if (C.size > 200) C.clear();
    o = Object.assign({}, k, { key, fam: f, shape: 'f_' + f }); C.set(key, o); return o;
  };
})();
