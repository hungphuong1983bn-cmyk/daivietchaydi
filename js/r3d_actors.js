/* Phase 18 — NHÂN VẬT · QUÁI · BOSS 3D (module của DV_R3D)
   Hình khối 3D dựng bằng mã (chưa có file mô hình .glb trong dự án): 7 nhân vật theo `design` (thân/mũ/vũ khí), 8 chủng quái × vai trò × biến thể màu theo chương,
   Elite / Mini Boss / Boss lớn hơn có hào quang + tinh thể + sừng. Hoạt ảnh bằng khớp (đứng chờ, chạy, đánh, tuyệt kỹ, trúng đòn, ngã, thắng) / nảy-nghiêng-co giãn khi đông quân.
   Quái thường: InstancedMesh theo chủng (≈6 draw call cho 170 quái). Elite/Boss: nhóm riêng.   Không đổi AI/chỉ số: chỉ ĐỌC G.en, G.p. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T) return;
  const M = Math, PI = M.PI, TAU = PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, ease = t => 1 - (1 - t) * (1 - t) * (1 - t), lerp = (a, b, t) => a + (b - a) * t;
  const A = { hero: null, heroKey: '', arch: new Map(), rig: new Map(), seen: new Map(), dying: [], first: new Map(), S: null, lastN: 0 };
  R3.A = A;
  let P_ = null;
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(0, 0, 0, 'YXZ'), _p = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color();
  const shade = (hex, f) => { _c.set(hex); _c.multiplyScalar(f); return '#' + _c.getHexString() };
  const lm = (col, o) => new T.MeshLambertMaterial(Object.assign({ color: col }, o || {}));
  const pm = (col, sh) => new T.MeshPhongMaterial({ color: col, shininess: sh || 80, specular: 0x777777 });
  const gm = (col, op) => new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op == null ? .9 : op, blending: T.AdditiveBlending, depthWrite: false, fog: false });
  const mesh = (geo, m, x, y, z, sx, sy, sz, rx, ry, rz) => { const o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = true; return o };

  /* ---------- hoa văn pháp trận (canvas → texture) dùng cho hào quang dưới chân ---------- */
  const RUNE = new Map();
  function runeTex(col) {
    let t = RUNE.get(col); if (t) return t;
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.translate(128, 128); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = 4; g.globalAlpha = .95; g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.stroke();
    g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * TAU / 6 * 2 % TAU, x = M.cos(a) * 96, y = M.sin(a) * 96; i ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.save(); g.rotate(a); g.fillRect(104, -2, 14, 4); g.restore() }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.arc(M.cos(a) * 64, M.sin(a) * 64, 5, 0, TAU); g.fill() }
    g.globalAlpha = .35; const gr = g.createRadialGradient(0, 0, 0, 0, 0, 100); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.fill();
    t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; RUNE.set(col, t); return t;
  }
  R3.runeTex = runeTex;
  function runeDecal(col, rad, op) {
    const g = new T.CircleGeometry(1, 32); g.rotateX(-PI / 2); const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: runeTex(col), transparent: true, opacity: op == null ? .8 : op, blending: T.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    m.scale.set(rad, 1, rad); m.renderOrder = 3; return m;
  }
  R3.runeDecal = runeDecal;
  function glowSprite(col, size, op) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: R3.sparkTex(), color: col, transparent: true, opacity: op == null ? .8 : op, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.set(size, size, 1); return s;
  }
  R3.glowSprite = glowSprite;

  /* ================= NHÂN VẬT ================= */
  const HS = {
    dbl: { body: 'armor', head: 'topknot', back: 'cape', weapon: 'sword', trim: '#e8b84a' },
    lh: { body: 'heavy', head: 'crest', back: 'none', weapon: 'glaive', trim: '#f0c24a' },
    nq: { body: 'light', head: 'headband', back: 'scarf', weapon: 'spear', trim: '#e8e0a0' },
    thd: { body: 'robe', head: 'wing', back: 'banner', weapon: 'banner', trim: '#d9b8ff' },
    dl: { body: 'light', head: 'hood', back: 'quiver', weapon: 'bow', trim: '#c9d28a' },
    nb: { body: 'heavy', head: 'round', back: 'none', weapon: 'shield', trim: '#d8a860' },
    ltk: { body: 'armor', head: 'tiered', back: 'twin', weapon: 'twin', trim: '#ffe27a' }
  };
  function buildHero(id, col) {
    P_ = R3.prim(); const st = HS[id] || HS.dbl, g = new T.Group(), rig = { g, id, col, st, mats: [], pose: { armR: 0, armL: 0, legA: 0, lean: 0, twist: 0, y: 0, crouch: 0 } };
    const skin = lm('#e6c29c'), robe = lm(col), robeD = lm(shade(col, .65)), robeL = lm(shade(col, 1.35)), under = lm('#eee8d8'), gold = pm(st.trim, 90), steel = pm('#dfe8ff', 120), hairM = lm('#17121e'), dark = lm('#2a2230');
    rig.mats.push(skin, robe, robeD, robeL, under, gold, steel, hairM, dark);
    const heavy = st.body === 'heavy', robeB = st.body === 'robe', W = heavy ? 1.2 : st.body === 'light' ? .9 : 1;
    const hip = new T.Group(); hip.position.y = 20; g.add(hip); rig.hip = hip;
    const mkLeg = x => { const l = new T.Group(); l.position.set(x, 0, 0); l.add(mesh(P_.cyl, robeD, 0, -19, 0, 3 * W, 18, 3 * W)); l.add(mesh(P_.box, dark, 0, -20, 1.6, 4 * W, 2.4, 6.4)); hip.add(l); return l };
    rig.legL = mkLeg(-3.3 * W); rig.legR = mkLeg(3.3 * W);
    const tor = new T.Group(); hip.add(tor); rig.tor = tor;
    const tg = new T.CylinderGeometry((robeB ? 6.2 : 7.4) * W, (robeB ? 9.6 : 6.4) * W, 20, 9); tor.add(mesh(tg, robe, 0, 11, 0, 1, 1, .78));
    if (robeB || st.body === 'armor') { const sk = new T.CylinderGeometry(6.4 * W, 11 * W, 16, 10, 1, true); tor.add(mesh(sk, robeD, 0, -2, 0, 1, 1, .9)) }
    tor.add(mesh(P_.cyl, gold, 0, 3, 0, 7.8 * W, 3, 6.2 * W));      // đai vàng
    tor.add(mesh(P_.cone, under, 0, 17.4, 2.8, 4, 5, 2.4, PI, 0, 0));  // cổ áo trắng
    if (heavy || st.body === 'armor') { for (const s of [-1, 1]) tor.add(mesh(P_.sph, gold, s * 9 * W, 20.5, 0, 4.4, 3.2, 4.4)); tor.add(mesh(P_.box, gold, 0, 8, 3.8, 9 * W, 8, 1.2)) }
    if (st.back === 'cape') { rig.cape = mesh(P_.box, robeD, 0, -4, -5.4, 14, 28, 1, .1, 0, 0); tor.add(rig.cape) }
    if (st.back === 'scarf') { rig.cape = mesh(P_.box, lm('#e8e0a0'), 0, 4, -5, 5, 26, 1, .25, 0, 0); tor.add(rig.cape) }
    if (st.back === 'banner') { rig.cape = mesh(P_.box, lm('#7a4ad0'), 0, -2, -5.4, 11, 30, 1, .15, 0, 0); tor.add(rig.cape) }
    if (st.back === 'quiver') { tor.add(mesh(P_.cyl, lm('#6a4528'), -3, 6, -5.6, 2.6, 18, 2.6, .3, 0, .4)); for (let i = 0; i < 3; i++) tor.add(mesh(P_.cone, lm('#e8e0c8'), -5 + i * 1.5, 25, -7, .8, 5, .8, .3, 0, .4)) }
    const head = new T.Group(); head.position.set(0, 22.4, 0); tor.add(head); rig.head = head;
    head.add(mesh(P_.sph, skin, 0, 3.4, 0, 6.2, 6.8, 6.2));
    for (const s of [-1, 1]) head.add(mesh(P_.sph, lm('#1a1020'), s * 2.3, 3.8, 5.3, .8, .9, .6));
    head.add(mesh(P_.sph, hairM, 0, 4.4, -1.4, 6.5, 6.8, 6.5));    // tóc sau
    rig.hair = mesh(P_.cone, hairM, 0, 3, -5.4, 3.4, 20, 3.4, PI, 0, 0); head.add(rig.hair);   // tóc dài buông
    const hd = st.head;
    if (hd === 'topknot') { head.add(mesh(P_.sph, hairM, 0, 11, -1, 3, 3, 3)); head.add(mesh(P_.cyl, gold, 0, 9, -1, 1.2, 2, 1.2)) }
    else if (hd === 'crest') { head.add(mesh(P_.cone, gold, 0, 8, 0, 6, 5, 6)); head.add(mesh(P_.box, lm('#d33'), 0, 11, -1, 1.4, 9, 4, -.2, 0, 0)) }
    else if (hd === 'headband') { head.add(mesh(P_.cyl, lm('#e8e0a0'), 0, 7, 0, 6.5, 1.6, 6.5)); head.add(mesh(P_.box, lm('#e8e0a0'), -5, 6, -5.5, 1.2, 9, .8, 0, 0, .3)) }
    else if (hd === 'wing') { head.add(mesh(P_.cyl, dark, 0, 8.5, 0, 6, 5, 6)); for (const s of [-1, 1]) head.add(mesh(P_.box, gold, s * 9, 12, 0, 8, 1, 2, 0, 0, s * .2)) }
    else if (hd === 'hood') { head.add(mesh(P_.cone, robe, 0, 4, -.6, 7.4, 11, 7.4)) }
    else if (hd === 'round') { head.add(mesh(P_.sph, gold, 0, 5.4, 0, 6.8, 5.4, 6.8)); head.add(mesh(P_.cone, lm('#d33'), 0, 11, 0, 1.2, 4, 1.2)) }
    else if (hd === 'tiered') { head.add(mesh(P_.cone, lm('#d9b36a'), 0, 6.4, 0, 11, 5, 11)); head.add(mesh(P_.cone, lm('#e8c87a'), 0, 10.4, 0, 7, 5.5, 7)); head.add(mesh(P_.sph, gold, 0, 16.2, 0, 1.4, 1.4, 1.4)) }
    const mkArm = x => { const a = new T.Group(); a.position.set(x * 9 * W, 20, 0); tor.add(a); a.add(mesh(P_.cyl, robe, 0, -15, 0, 2.5, 15, 2.5)); a.add(mesh(P_.sph, skin, 0, -16.5, 0, 2.4, 2.4, 2.4)); const hnd = new T.Group(); hnd.position.y = -16.5; a.add(hnd); a.userData.hand = hnd; return a };
    rig.armL = mkArm(-1); rig.armR = mkArm(1);
    const hR = rig.armR.userData.hand, hL = rig.armL.userData.hand, wp = new T.Group(); rig.wp = wp; hR.add(wp);
    const blade = (len, w, m, x) => mesh(P_.box, m, x || 0, 0, 0, w, len, .5);
    switch (st.weapon) {
      case 'sword': wp.add(mesh(P_.box, steel, 0, 2, 0, 1.8, 36, .6)); wp.add(mesh(P_.cone, steel, 0, 38, 0, .9, 3, .3)); wp.add(mesh(P_.box, gold, 0, 0, 0, 7, 1.4, 1.8)); wp.add(mesh(P_.cyl, lm('#3a2a1a'), 0, -6, 0, 1.2, 6, 1.2)); wp.add(mesh(P_.box, new T.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: .5, blending: T.AdditiveBlending, depthWrite: false }), 0, 3, 0, 3.6, 36, .6)); break;
      case 'glaive': wp.add(mesh(P_.cyl, lm('#5a3a22'), 0, -14, 0, 1.2, 62, 1.2)); { const tg = new T.TorusGeometry(10, 1.5, 4, 14, 2.1); const b = mesh(tg, steel, 4, 52, 0, 1, 1.4, .6, 0, 0, PI / 2 + 1.0); wp.add(b) } wp.add(mesh(P_.cone, steel, 0, 60, 0, 1.4, 8, .8)); wp.add(mesh(P_.sph, lm('#d33'), 0, 46, 0, 2, 2, 2)); break;
      case 'spear': wp.add(mesh(P_.cyl, lm('#7a5a34'), 0, -16, 0, 1.1, 66, 1.1)); wp.add(mesh(P_.cone, steel, 0, 50, 0, 2.2, 12, .8)); wp.add(mesh(P_.sph, lm('#d33'), 0, 48, 0, 2.2, 3, 2.2)); break;
      case 'banner': wp.add(mesh(P_.cyl, lm('#4a3a2a'), 0, -12, 0, 1.2, 62, 1.2)); wp.add(mesh(P_.box, lm('#7a4ad0'), 6, 36, 0, 12, 18, .6)); wp.add(mesh(P_.box, gold, 6, 52, 0, 12, 1.6, .8)); wp.add(glowSprite(0xd0a0ff, 14, .9)).position.set(0, 52, 0); wp.add(mesh(P_.sph, gm(0xe0c0ff, 1), 0, 52, 0, 2.6, 2.6, 2.6)); break;
      case 'bow': { const tg = new T.TorusGeometry(15, 1.2, 4, 12, PI); wp.add(mesh(tg, lm('#8a5a30'), 0, 4, 0, .5, 1, 1, 0, 0, PI / 2 + PI)); wp.add(mesh(P_.cyl, lm('#f0f0e0'), 0, -11, 0, .3, 30, .3)); } break;
      case 'shield': wp.add(mesh(P_.box, steel, 0, 2, 0, 2, 24, .6)); wp.add(mesh(P_.box, gold, 0, 0, 0, 6, 1.4, 1.6)); { const sh = mesh(P_.cyl, pm('#b87333', 60), 0, 0, 0, 11, 2, 11, PI / 2, 0, 0); sh.position.set(0, 0, 3); hL.add(sh); sh.rotation.set(0, PI / 2, PI / 2); hL.add(mesh(P_.sph, gold, 3, 0, 0, 3, 3, 1.4)); } break;
      case 'twin': wp.add(mesh(P_.box, pm('#ffd24a', 100), 0, 2, 0, 1.6, 28, .6)); wp.add(mesh(P_.box, gold, 0, 0, 0, 6, 1.2, 1.6)); { const w2 = new T.Group(); w2.add(mesh(P_.box, pm('#ffd24a', 100), 0, 2, 0, 1.6, 28, .6)); w2.add(mesh(P_.box, gold, 0, 0, 0, 6, 1.2, 1.6)); w2.rotation.x = 1.1; hL.add(w2); rig.wp2 = w2 } break;
    }
    // hào quang + pháp trận dưới chân + linh khí
    rig.aura = runeDecal('#ffd978', 30, .55); rig.aura.position.y = 1.5; g.add(rig.aura);
    rig.glow = glowSprite(0xffd27a, 90, .22); rig.glow.position.y = 26; g.add(rig.glow);
    rig.orbs = []; for (let i = 0; i < 5; i++) { const s = glowSprite(0xffe9a8, 7, .85); g.add(s); rig.orbs.push(s) }
    g.traverse(o => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true });
    return rig;
  }
  function heroColor() { const S = A.S; return (S.host.HR && S.host.HR().col) || '#2f5aa8' }
  function ensureHero(S, G) {
    const hr = S.host.HR ? S.host.HR() : { id: 'dbl', col: '#2f5aa8' }, key = hr.id + hr.col;
    if (A.hero && A.heroKey === key) return A.hero;
    if (A.hero) { S.world.remove(A.hero.g); disposeGroup(A.hero.g) }
    A.hero = buildHero(hr.id, hr.col); A.heroKey = key; S.world.add(A.hero.g); return A.hero;
  }
  function disposeGroup(g) { g.traverse(o => { if (o.geometry && !o.geometry.userData.keep && !isPrim(o.geometry)) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material.userData.keep) o.material.dispose() }) }
  function isPrim(geo) { for (const k in P_) if (P_[k] === geo) return true; return false }

  let nearest = null;
  function heroAnim(S, G, dt) {
    const r = ensureHero(S, G), P = G.p, t = S.t, pz = r.pose, gr = r.g;
    const sp = M.hypot(P.vx || 0, P.vy || 0), mv = !!P.moving && sp > 10;
    if (mv && S.q > 0 && R3.emit) { A.dust = (A.dust || 0) - dt; if (A.dust <= 0) { A.dust = .07 - M.min(.03, sp / 9000); const th = S.theme || { h: 40, s: 30, l: 40 }, c = 'hsl(' + th.h + ',' + M.round(th.s * .6) + '%,' + M.min(75, th.l + 28) + '%)'; for (let i = 0; i < 2; i++) R3.emit(P.x - (P.vx || 0) * .05 + (M.random() - .5) * 12, P.y - (P.vy || 0) * .05 + (M.random() - .5) * 8, 1, -(P.vx || 0) * .15 + (M.random() - .5) * 26, -(P.vy || 0) * .15 + (M.random() - .5) * 26, 14 + M.random() * 16, .45 + M.random() * .25, c, -30) } }
    gr.position.set(P.x, R3.height(P.x, P.y), P.y);
    // hướng: chạy theo vận tốc; đang đánh thì quay về địch gần nhất
    let tgt = null, bd = 1e9; if (P.atk > 0 || G.ul > 0) { for (const e of G.en) { if (e.dead) continue; const d = (e.x - P.x) ** 2 + (e.y - P.y) ** 2; if (d < bd && d < 520 * 520) { bd = d; tgt = e } } }
    let yaw = r.yaw == null ? 0 : r.yaw;
    const want = tgt ? M.atan2(tgt.x - P.x, tgt.y - P.y) : mv ? M.atan2(P.vx, P.vy) : (r.wantYaw != null ? r.wantYaw : yaw);
    r.wantYaw = want; let dy = want - yaw; dy = ((dy + PI) % TAU + TAU) % TAU - PI; yaw += dy * M.min(1, dt * 14); r.yaw = yaw; gr.rotation.y = yaw;
    const atk = P.atk > 0 ? 1 - P.atk / .22 : -1, ult = G.ul > 0, end = G.ending;
    let aR = -.25, aL = .15, legA = 0, lean = 0, twist = 0, y = 0, crouch = 0, wpx = 1.2;
    if (mv) { const ph = t * (9 + sp / 40); legA = M.sin(ph) * .85; aL = -M.sin(ph) * .55; aR = M.sin(ph) * .35 - .1; lean = .16; y = M.abs(M.cos(ph)) * 1.6 } else { y = M.sin(t * 2.2) * .5; aR += M.sin(t * 2.2) * .03 }
    if (atk >= 0) { const k = atk; if (k < .3) { aR = lerp(-.25, -2.5, k / .3); twist = .55 * k / .3; wpx = 1.2 } else { const u = ease((k - .3) / .7); aR = lerp(-2.5, -.4, u); twist = .55 - 1.1 * u; wpx = 1.2 + .5 * u } lean += .1 }
    if (ult) { const k = 1 - G.ul / .7; aR = -2.7; aL = -2.5; y = 6 + M.sin(clamp(k, 0, 1) * PI) * 8; wpx = .3; lean = -.1 }
    if (P.skc > 0 && !ult) { aL = -1.3; aR = -1.5 }
    if (end) { if (G.win) { y = M.abs(M.sin(t * 8)) * 8; aR = -2.7; aL = -2.7 } else { const k = clamp(1 - G.endT / .9, 0, 1); gr.rotation.x = 0; r.fall = k; lean = -1.5 * k; y -= 14 * k; aR = 1.2 * k; aL = 1.2 * k } } else r.fall = 0;
    const k = M.min(1, dt * 16); pz.armR = lerp(pz.armR, aR, k); pz.armL = lerp(pz.armL, aL, k); pz.legA = lerp(pz.legA, legA, k); pz.lean = lerp(pz.lean, lean, k); pz.twist = lerp(pz.twist, twist, k); pz.y = lerp(pz.y, y, k); pz.wpx = lerp(pz.wpx == null ? 1.2 : pz.wpx, wpx, k);
    r.hip.position.y = 20 + pz.y; r.legL.rotation.x = pz.legA; r.legR.rotation.x = -pz.legA;
    r.tor.rotation.set(pz.lean, pz.twist, M.sin(t * 14) * (mv ? .04 : 0));
    r.armR.rotation.x = pz.armR; r.armL.rotation.x = pz.armL; r.armR.rotation.z = -.12; r.armL.rotation.z = .12; r.wp.rotation.x = pz.wpx;
    if (r.cape) r.cape.rotation.x = .15 + (mv ? .5 : .08) + M.sin(t * 6) * .05;
    if (r.hair) r.hair.rotation.x = PI - (mv ? .6 : .1) + M.sin(t * 5) * .06;
    // hoạt ảnh trúng đòn: nhấp nháy
    const fl = P.inv > 0 && ((t * 20) | 0) % 2; for (const m of r.mats) if (m.emissive) m.emissive.setScalar(fl ? .55 : 0);
    // hào quang
    r.aura.rotation.y = t * .8; r.aura.material.opacity = .45 + .15 * M.sin(t * 3) + (ult ? .4 : 0); const as = ult ? 1.8 + M.sin(t * 12) * .1 : 1; r.aura.scale.set(30 * as, 1, 30 * as);
    r.glow.material.opacity = .2 + (ult ? .35 : 0) + .05 * M.sin(t * 4);
    r.orbs.forEach((o, i) => { const a = t * 1.6 + i * TAU / 5, rr = 20 + M.sin(t * 2 + i) * 4; o.position.set(M.cos(a) * rr, 8 + ((t * 18 + i * 14) % 56), M.sin(a) * rr); o.material.opacity = .8 * M.sin(((t * 18 + i * 14) % 56) / 56 * PI) });
    r.g.visible = true;
  }

  /* ================= QUÁI: dựng theo CHỦNG × VAI TRÒ ================= */
  const COL = s => s;
  function eyes(b, k, y, z, dx, sz) { for (const s of [-1, 1]) b.add(P_.box, k.P.eye, s * dx, y, z, sz, sz, sz * .6, 0, 0, 0, true) }
  function human(b, k, big) {
    const P = k.P, r = k.role, w = r.wide ? 1.3 : r.slim ? .8 : 1;
    for (const s of [-1, 1]) { b.add(P_.cyl, P.clothD, s * 3.3 * w, 0, 0, 3 * w, 13, 3 * w); b.add(P_.box, P.dark, s * 3.3 * w, 0, 1.4, 4 * w, 2.2, 6) }
    b.add(P_.box, P.cloth, 0, 12, 0, 13 * w, 15, 8.4);
    b.add(P_.box, P.clothD, 0, 11.4, 4.4, 14 * w, 2.4, 1);   // đai
    if (r.plate) { for (const s of [-1, 1]) b.add(P_.sph, P.metal, s * 8.6 * w, 25, 0, 4.6, 3.4, 4.6); b.add(P_.box, P.metal, 0, 14, 4.4, 9 * w, 9, 1.4) }
    for (const s of [-1, 1]) { b.add(P_.cyl, P.cloth, s * 8.6 * w, 15, 0, 2.6, 10, 2.6, 0, 0, -s * .12); b.add(P_.sph, P.skin, s * 9.4 * w, 14, .8, 2.4, 2.4, 2.4) }
    b.add(P_.sph, P.skin, 0, 31, 0, 6, 6.4, 6);
    if (k.R.helm) { b.add(P_.cone, P.metal, 0, 33, 0, 6.8, 7, 6.8); b.add(P_.cone, P.acc, 0, 41, 0, .8, 7, .8, 0, 0, 0, true) } else if (k.R.hood) { b.add(P_.cone, P.cloth, 0, 30, -.5, 7, 12, 7) } else { b.add(P_.sph, '#2a1c14', 0, 33, -1, 6.4, 5, 6.4) }
    eyes(b, k, 32, 5.2, 2.2, 1.7);
    switch (r.w) {
      case 'club': b.add(P_.cyl, '#6a4528', 11.5, 4, 3, 1.6, 20, 1.6, -.3, 0, -.1); b.add(P_.sph, '#6a4528', 12, 22, 6, 4.2, 4.2, 4.2); break;
      case 'dagger': b.add(P_.box, P.metal, 12, 10, 5, .9, 12, .4, -.9, 0, 0); break;
      case 'shield': b.add(P_.cyl, P.metal, -11, 6, 4, 8, 1.6, 8, PI / 2, 0, 0); b.add(P_.sph, P.acc, -11, 14, 5.2, 2, 2, 1.2, 0, 0, 0, true); break;
      case 'bow': b.add(P_.tor, '#8a5a30', 11, 15, 4, 11, 11, 11, 0, 1.57, 0); break;
      case 'spear': b.add(P_.cyl, '#7a5a34', 12, -2, 3, 1.1, 46, 1.1); b.add(P_.cone, P.metal, 12, 44, 3, 2, 8, .8); break;
      case 'bomb': b.add(P_.sph, '#1a1a22', 11, 17, 6, 4.2, 4.2, 4.2); b.add(P_.sph, '#ffb02e', 11, 22, 6, 1.3, 1.3, 1.3, 0, 0, 0, true); break;
    }
    if (big) { for (const s of [-1, 1]) b.add(P_.cone, '#d33', s * 4, 36, -1, 1.8, 11, 1.8, 0, 0, -s * .4); b.add(P_.box, P.clothD, 0, 3, -5.4, 15 * w, 26, 1.2, .1, 0, 0) }
  }
  function beast(b, k, big) {
    const P = k.P, acc = P.acc, body = P.skin;
    b.add(P_.sph, body, 0, 12, 0, 6.6, 6.6, 12.5, 0, 0, 0, 0, .6);
    b.add(P_.sph, P.light, 0, 15, 12, 5.4, 5.2, 5.4); b.add(P_.cone, P.light, 0, 14.4, 17, 2.6, 7, 2.6, PI / 2, 0, 0);
    for (const s of [-1, 1]) { b.add(P_.cone, P.dark, s * 3.2, 20, 11, 1.8, 5, 1.2, 0, 0, -s * .2); b.add(P_.cone5, '#fff', s * 1.2, 11.4, 22, .5, 2, .5, PI, 0, 0) }
    for (let i = 0; i < 7; i++) { const a = -1.1 + i * .37; b.add(P_.cone, acc, M.sin(a) * 6, 17 + M.cos(a) * 4, 8.5, 2.2, 8, 2.2, 1.2, 0, -a) }   // bờm
    for (const s of [-1, 1]) for (const z of [-7, 7]) { b.add(P_.cyl, P.dark, s * 4, 0, z, 2, 10, 2); b.add(P_.box, P.light, s * 4, 0, z + 1, 2.6, 1.6, 4) }
    b.add(P_.cone, acc, 0, 12, -14, 2.4, 14, 2.4, -1.2, 0, 0);
    eyes(b, k, 17, 15.2, 2.4, 1.2);
    if (big) { for (const s of [-1, 1]) b.add(P_.cone, '#fff2c0', s * 3, 20, 14, 1.4, 9, 1.4, .3, 0, -s * .5) }
  }
  function ogre(b, k, big) {
    const P = k.P;
    for (const s of [-1, 1]) { b.add(P_.cyl, P.dark, s * 5, 0, 0, 4.6, 12, 4.6); b.add(P_.box, P.dark, s * 5, 0, 2, 6, 2.4, 8) }
    b.add(P_.sph, P.skin, 0, 20, 0, 12, 12, 9.4, 0, 0, 0, 0, .8); b.add(P_.cyl, P.clothD, 0, 11, 0, 12.5, 4, 9.6);
    for (const s of [-1, 1]) { b.add(P_.cyl, P.skin, s * 13, 14, 0, 4.2, 14, 4.2, 0, 0, -s * .2); b.add(P_.sph, P.light, s * 15, 12, 2, 4.4, 4.4, 4.4) }
    b.add(P_.sph, P.skin, 0, 34, 1, 6.2, 5.6, 5.6); for (const s of [-1, 1]) { b.add(P_.cone, P.light, s * 5, 38, 0, 1.6, 8, 1.6, 0, 0, -s * .45); b.add(P_.cone5, '#fff', s * 2, 29, 5.4, .7, 2.6, .7, PI, 0, 0) }
    eyes(b, k, 34, 5.6, 2.4, 1.6); b.add(P_.cyl, '#5a3a22', 17, 0, 6, 2.4, 30, 2.4, -.3, 0, -.2); b.add(P_.sph, '#6a4528', 19, 28, 10, 5.6, 5.6, 5.6);
  }
  function golem(b, k, big) {
    const P = k.P;
    for (const s of [-1, 1]) b.add(P_.box, P.skin, s * 5.4, 0, 0, 6.4, 12, 7);
    b.add(P_.box, P.skin, 0, 12, 0, 16, 15, 10); b.add(P_.box, P.dark, 0, 12, 5.2, 11, 11, 1); b.add(P_.oct, P.acc, 0, 20, 5.8, 3, 3, 1.6, 0, 0, 0, true);
    for (const s of [-1, 1]) { b.add(P_.box, P.dark, s * 11, 12, 0, 6, 16, 6); b.add(P_.box, P.skin, s * 11.5, 4, 1, 7.4, 8, 7.4) }
    b.add(P_.box, P.skin, 0, 27, 0, 9, 8, 8); eyes(b, k, 31, 4.4, 2.4, 2); b.add(P_.cone5, P.acc, -4, 35, 0, 1.2, 6, 1.2, 0, 0, 0, true);
  }
  function crab(b, k, big) {
    const P = k.P;
    b.add(P_.sph, P.skin, 0, 7, 0, 11, 5.4, 9, 0, 0, 0, 0, .8);
    for (const s of [-1, 1]) { b.add(P_.cyl, P.skin, s * 12, 6, 7, 1.8, 10, 1.8, 1, 0, -s * .6); b.add(P_.sph, P.light, s * 14, 10, 14, 5, 3.6, 4.6); b.add(P_.cone, P.metal, s * 14, 8, 19, 1.8, 6, 1.2, PI / 2, 0, 0); for (let i = 0; i < 3; i++) b.add(P_.cyl, P.dark, s * 8, 2, -5 + i * 5, 1.3, 11, 1.3, 0, 0, -s * 1.1) }
    for (const s of [-1, 1]) { b.add(P_.cyl, P.skin, s * 3, 11, 6, .9, 5, .9); b.add(P_.sph, P.eye, s * 3, 17, 6, 1.7, 1.7, 1.7, 0, 0, 0, true) }
  }
  function blob(b, k, big) {
    const P = k.P; b.add(P_.ico1, P.skin, 0, 9, 0, 12, 9, 11, 0, 0, 0, 0, 1.2); b.add(P_.ico, P.light, 2, 14, 4, 5, 3, 3, 0, 0, 0, 0, .4);
    for (let i = 0; i < 5; i++) b.add(P_.cone, P.dark, M.cos(i * 1.3) * 8, 14, M.sin(i * 1.3) * 7, 2, 7, 2, 0, 0, 0);
    eyes(b, k, 11, 9.6, 3.4, 2.2); b.add(P_.box, '#2a0a10', 0, 6, 10.4, 7, 2.2, 1);
  }
  function amphi(b, k, big) {
    const P = k.P;
    for (const s of [-1, 1]) { b.add(P_.cyl, P.dark, s * 3.4, 0, 0, 2.6, 11, 2.6); b.add(P_.cone5, P.light, s * 3.4, 0, 3, 4, 2, 5, PI / 2, 0, 0) }
    b.add(P_.sph, P.skin, 0, 14, 0, 7.6, 10, 6.4); b.add(P_.sph, P.light, 0, 11, 3.4, 5.2, 7, 3.2);
    b.add(P_.sph, P.skin, 0, 29, 1, 7, 6, 6.4); b.add(P_.box, '#2a0a10', 0, 26.4, 6, 7, 1.4, 1);
    for (let i = 0; i < 4; i++) b.add(P_.cone, P.acc, 0, 33 - i * .6, -2 - i * 3.4, 1.4, 10 - i * 1.4, 1.4, -.5 - i * .15, 0, 0);
    for (const s of [-1, 1]) { b.add(P_.cyl, P.skin, s * 9, 14, 0, 2.4, 11, 2.4, 0, 0, -s * .3); b.add(P_.cone5, P.light, s * 11, 6, 2, 4, 5, 1, 0, 0, 0) }
    eyes(b, k, 30, 5.6, 3.6, 2.2); b.add(P_.cone, P.skin, 0, 6, -8, 3, 14, 3, -1.3, 0, 0);
  }
  function ghost(b, k, big) {
    const P = k.P; b.add(P_.cone, P.skin, 0, 4, 0, 9, 28, 9); b.add(P_.sph, P.light, 0, 30, 0, 6.4, 6.8, 6); b.add(P_.cone, P.dark, 0, 30, -1, 7.2, 10, 7.2);
    for (let i = 0; i < 5; i++) b.add(P_.cone, P.skin, M.cos(i * 1.26) * 6, 2, M.sin(i * 1.26) * 6, 2.4, -14 - (i % 2) * 6, 2.4);
    for (const s of [-1, 1]) { b.add(P_.cone, P.skin, s * 9, 18, 2, 2.4, 14, 2.4, 0, 0, -s * 1.1) }
    eyes(b, k, 31, 5, 2.4, 2.2);
  }

  /* ---------- trang trí riêng cho Elite / Mini Boss / Boss (giáp vai, mão sừng, lõi ngực phát sáng, áo choàng, gai lưng, đai sọ) ---------- */
  const HEAD = { human: [0, 33, 0, 7], beast: [0, 17, 12, 6], ogre: [0, 36, 1, 7], golem: [0, 29, 0, 7], crab: [0, 10, 0, 9], blob: [0, 16, 0, 10], amphi: [0, 31, 1, 7], ghost: [0, 33, 0, 7] };
  const CHEST = { human: [0, 15, 5], beast: [0, 12, 8], ogre: [0, 20, 7], golem: [0, 15, 6], crab: [0, 8, 9], blob: [0, 10, 11], amphi: [0, 16, 5], ghost: [0, 18, 6] };
  const SHLD = { human: [9, 26], beast: [5, 15], ogre: [13, 25], golem: [11, 22], crab: [11, 9], blob: [9, 14], amphi: [9, 22], ghost: [9, 22] };
  function embellish(b, k, tier) {
    const P = k.P, sh = k.shape, H = HEAD[sh] || HEAD.human, C = CHEST[sh] || CHEST.human, S = SHLD[sh] || SHLD.human, boss = tier >= 2, n = boss ? 7 : 5;
    // mão sừng quanh đầu
    for (let i = 0; i < n; i++) { const a = (i / n - .5) * 2.6, hx = H[0] + M.sin(a) * H[3], hy = H[1] + 2 + M.cos(a) * H[3] * .55; b.add(P_.cone, i % 2 ? P.acc : P.metal, hx, hy + 1, H[2] - 1, 1.4 + (boss ? .5 : 0), (boss ? 9 : 6) * (1 - M.abs(a) * .22), 1.4, -.25, 0, -a * .55, !!(i % 2)) }
    // giáp vai gai
    for (const sd of [-1, 1]) { b.add(P_.sph, P.metal, sd * S[0], S[1], 0, 5.6, 3.6, 5.6); for (let i = 0; i < 3; i++) b.add(P_.cone, P.acc, sd * (S[0] + 1.6 + i * 1.2), S[1] + 3.2 - i * .6, (i - 1) * 2.4, 1.3, 6 + (boss ? 2.5 : 0) - i * .8, 1.3, (i - 1) * .3, 0, -sd * (.8 + i * .22)) }
    // lõi ngực phát sáng + khung
    b.add(P_.oct, P.crys, C[0], C[1], C[2], 3.2, 4.2, 2, 0, 0, 0, true); b.add(P_.tor, P.metal, C[0], C[1], C[2] - .4, 5.4, 5.4, 2.4, 0, 0, 0);
    // gai sống lưng
    if (sh !== 'blob' && sh !== 'crab') for (let i = 0; i < (boss ? 5 : 3); i++) b.add(P_.cone, P.dark, 0, H[1] - 7 - i * 3.8, -(H[2] < 4 ? 5 : 3) - i * (sh === 'beast' ? 2.6 : .4), 1.5, 7 - i * .6, 1.5, -.8, 0, 0);
    if (boss) {
      // áo choàng rách phía sau
      if (sh === 'human' || sh === 'ogre' || sh === 'golem' || sh === 'amphi') { b.add(P_.box, P.clothD, 0, 14, -5.4, 17, 28, .8, .18, 0, 0); for (let i = -2; i <= 2; i++) b.add(P_.cone, P.clothD, i * 3.6, 0, -6.4, 1.8, 7, .6, PI + .1, 0, i * .08) }
      // đai sọ
      for (let i = -2; i <= 2; i++) b.add(P_.sph, '#e8e0cc', i * 3.2, C[1] - 6, C[2] - .5 + M.abs(i) * -.4, 1.6, 1.8, 1.4);
      // mắt phát sáng lớn
      for (const sd of [-1, 1]) b.add(P_.oct, P.eye, sd * 2.6, H[1] + 1.2, H[2] + 5.4, 1.4, 1.1, 1.1, 0, 0, 0, true);
    }
  }
  const SHAPES = { human, beast, ogre, golem, crab, blob, amphi, ghost };
  function getArch(k) {
    let a = A.arch.get(k.key); if (a) return a;
    P_ = R3.prim(); let h = 7; for (let i = 0; i < k.key.length; i++) h = (h * 31 + k.key.charCodeAt(i)) | 0;
    const b = R3.Builder(h >>> 0), fn = SHAPES[k.shape] || human; fn(b, k, k.big);
    const geo = b.done(), S = A.S, N = 200; a = { geo, lit: null, glow: null, n: 0, ghost: k.shape === 'ghost' };
    if (geo.lit) { const mat = a.ghost ? new T.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: .78, depthWrite: false }) : new T.MeshLambertMaterial({ vertexColors: true }); a.lit = new T.InstancedMesh(geo.lit, mat, N); a.lit.castShadow = S.q > 1 && !a.ghost; a.lit.frustumCulled = false; a.lit.instanceColor = new T.InstancedBufferAttribute(new Float32Array(N * 3).fill(1), 3); S.actG.add(a.lit) }
    if (geo.glow) { a.glow = new T.InstancedMesh(geo.glow, new T.MeshBasicMaterial({ vertexColors: true }), N); a.glow.frustumCulled = false; a.glow.instanceColor = new T.InstancedBufferAttribute(new Float32Array(N * 3).fill(1), 3); S.actG.add(a.glow) }
    A.arch.set(k.key, a); return a;
  }
  const DEF_SK = e => ({ key: 'def|' + (e.c || ''), shape: 'human', role: { w: 'club' }, R: {}, big: e.boss ? 2 : e.mb ? 1 : 0, el: e.el ? 1 : 0, tier: 1, h: 0, P: { skin: '#c9a07a', dark: '#6a4a38', light: '#e0c0a0', cloth: e.c || '#7a3030', clothD: shade(e.c || '#7a3030', .7), acc: '#f0c24a', eye: '#ff4a3a', crys: '#ff8a5a', metal: '#c9d0de', metalD: '#7a8498' } });

  function putInst(a, i, x, y, z, sc, yaw, pitch, roll, sx, sy, r, g, bl) {
    _e.set(pitch, yaw, roll); _q.setFromEuler(_e); _m.compose(_p.set(x, y, z), _q, _s.set(sc * sx, sc * sy, sc * sx));
    if (a.lit) { a.lit.setMatrixAt(i, _m); a.lit.instanceColor.setXYZ(i, r, g, bl) } if (a.glow) { a.glow.setMatrixAt(i, _m); a.glow.instanceColor.setXYZ(i, r, g, bl) }
  }
  /* nhóm riêng cho Elite / Mini Boss / Boss */
  function buildRig(e, k) {
    const a = { geo: null }, g = new T.Group(); P_ = R3.prim(); let h = 7; for (let i = 0; i < k.key.length; i++) h = (h * 31 + k.key.charCodeAt(i)) | 0;
    const b = R3.Builder((h >>> 0) + 5), S = A.S; (SHAPES[k.shape] || human)(b, k, k.big || 1); if (k.big || e.boss || e.mb || e.el) embellish(b, k, e.boss ? 2 : e.mb ? 1.5 : 1); const geo = b.done();
    const body = new T.Group(); g.add(body);
    if (geo.lit) { const m = new T.Mesh(geo.lit, k.shape === 'ghost' ? new T.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: .8, depthWrite: false }) : new T.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; body.add(m); a.lit = m }
    if (geo.glow) { const m = new T.Mesh(geo.glow, new T.MeshBasicMaterial({ vertexColors: true })); body.add(m); a.glow = m }
    const col = e.boss ? (e.hp < e.mhp / 2 ? '#ff7a20' : '#ff4a3a') : e.mb ? '#c46aff' : (e.el > 1 ? '#ff4664' : '#ffd34a');
    a.ring = runeDecal(col, 1, e.boss ? .85 : .65); g.add(a.ring); a.ring.position.y = 1.2;
    a.halo = glowSprite(new T.Color(col), e.boss ? 44 : e.mb ? 34 : 30, e.boss ? .45 : .3); a.halo.position.y = 18; g.add(a.halo);
    a.cry = []; if (k.big === 2) { for (let i = 0; i < 3 + (k.tier | 0); i++) { const c = new T.Mesh(P_.oct, new T.MeshBasicMaterial({ color: k.P.crys, fog: false })); c.scale.set(2.2, 4.4, 2.2); g.add(c); a.cry.push(c) } }
    a.body = body; a.g = g; a.col = col; S.actG.add(g); return a;
  }
  function rigAnim(a, e, k, S, G, dt) {
    const t = S.t, P = G.p, g = a.g, sc = (e.r / 11) * 1.18 * (e.boss ? 1.7 : e.mb ? 1.3 : 1) * (k.role && k.role.mini ? .85 : 1), age = A.first.has(e.id) ? S.t - A.first.get(e.id) : 9;
    const spn = ease(clamp(age / .6, 0, 1));
    const ph = t * 9 + e.id, mv = e.sp > 90 ? 1.3 : 1, hop = M.abs(M.sin(ph * mv)) * (k.shape === 'ghost' ? 1 : 2.4) * sc + (k.shape === 'ghost' ? 6 + M.sin(t * 3 + e.id) * 3 : 0);
    const yaw = M.atan2(P.x - e.x, P.y - e.y), tel = e.tel > 0, dash = e.dsh > 0;
    g.position.set(e.x, R3.height(e.x, e.y) + hop, e.y); g.rotation.set(0, yaw, 0);
    const pitch = tel ? -.18 : dash ? .34 : .06 * M.sin(ph * mv), roll = .06 * M.sin(ph * mv * .7);
    a.body.rotation.set(pitch, 0, roll);
    const pu = tel ? 1 + .06 * M.sin(t * 40) : 1, fl = e.fl > 0 ? 1.1 : 1;
    g.scale.set(sc * spn * fl * (tel ? 1 / pu : 1) * (dash ? 1.1 : 1), sc * spn * (e.fl > 0 ? .92 : 1) * pu * (dash ? .88 : 1), sc * spn * fl * (dash ? 1.1 : 1));
    // hào quang đổi màu theo máu Boss; flash khi trúng đòn
    if (e.boss) { const c = e.hp < e.mhp / 2 ? '#ff7a20' : '#ff4a3a'; if (a.col !== c) { a.col = c; a.halo.material.color.set(c) } }
    const L = 9.3 * (e.boss ? 2.3 : e.mb ? 1.8 : 1.5) * (1 + .05 * M.sin(t * 4)); a.ring.rotation.y = -t * (e.boss ? .9 : 1.3); a.ring.scale.set(L, 1, L); a.ring.position.y = 1.2 / sc;
    a.halo.position.y = 18; a.halo.material.opacity = (e.boss ? .4 : .26) + .08 * M.sin(t * 5) + (tel ? .2 : 0);
    for (let i = 0; i < a.cry.length; i++) { const an = t * .9 + i * TAU / a.cry.length, c = a.cry[i]; c.position.set(M.cos(an) * 21, 18 + M.sin(an * 2) * 3, M.sin(an) * 21); c.rotation.y = t * 2 + i }
    if ((e.boss || e.mb) && R3.emit && (S.q > 0) && M.random() < dt * (e.boss ? 38 : 16)) { const an = M.random() * TAU, rr = e.r * (.6 + M.random() * .9); R3.emit(e.x + M.cos(an) * rr, e.y + M.sin(an) * rr, 2, 0, 0, 55 + M.random() * 70, 1.1, e.boss ? (e.hp < e.mhp / 2 ? '#ff9a3a' : '#ff5a3a') : '#c46aff', -10) }
    const col = tel ? 1.7 : e.fl > 0 ? 3 : 1;
    for (const m of [a.lit, a.glow]) if (m) { /* màu nhấp nháy: qua material.color của mesh */ m.material.color.setScalar(e.fl > 0 ? 3 : tel ? 1.5 : 1); if (tel && m === a.lit) m.material.color.setRGB(1.7, .6, .6) }
  }

  const pos = new T.Vector3();
  function updEnemies(S, G, dt) {
    const MA = window.DV_MART, P = G.p, t = S.t;
    for (const a of A.arch.values()) a.n = 0;
    const live = new Set(), cull2 = 1700 * 1700;
    for (const e of G.en) {
      if (e.dead && !e.boss) { /* chết trong khung này: vẫn vẽ tới khi reap */ }
      const dx = e.x - P.x, dy = e.y - P.y; if (dx * dx + dy * dy > cull2) { live.add(e.id); continue }
      const k = MA && MA.skinFor ? MA.skinFor(e, G) : DEF_SK(e); live.add(e.id);
      if (!A.first.has(e.id)) { A.first.set(e.id, t); if (R3.fxSpawn) R3.fxSpawn(e, k) }
      const rigged = e.boss || e.mb || e.el;
      let snap = A.seen.get(e.id); if (!snap) { snap = { id: e.id, k, rigged: !!rigged }; A.seen.set(e.id, snap) }
      snap.x = e.x; snap.y = e.y; snap.r = e.r; snap.boss = !!e.boss; snap.yaw = M.atan2(P.x - e.x, P.y - e.y); snap.hp = e.hp; snap.sc = (e.r / 11) * 1.18 * (e.boss ? 1.7 : e.mb ? 1.3 : 1) * (k.role && k.role.mini ? .85 : 1);
      if (rigged) {
        let a = A.rig.get(e.id); if (!a) { a = buildRig(e, k); A.rig.set(e.id, a) } snap.rig = a; rigAnim(a, e, k, S, G, dt);
      } else {
        const a = getArch(k); if (a.n >= 199) continue; const age = t - A.first.get(e.id), spn = ease(clamp(age / .35, 0, 1));
        const sc = snap.sc * spn, ph = t * 9 + e.id, mv = e.sp > 90 ? 1.3 : 1, tel = e.tel > 0, dash = e.dsh > 0, ghost = k.shape === 'ghost';
        const hop = M.abs(M.sin(ph * mv)) * (ghost ? 1 : 2.4) * sc + (ghost ? 6 + M.sin(t * 3 + e.id) * 3 : 0);
        const lean = tel ? -.18 : dash ? .34 : .06 * M.sin(ph * mv), fl = e.fl > 0, sq = tel ? 1 + .06 * M.sin(t * 40) : 1;
        const wob = M.sin(ph * mv * .7) * .07;
        const r = fl ? 3 : tel ? 1.7 : 1, g = fl ? 3 : tel ? .6 : 1, bl = fl ? 3 : tel ? .6 : 1;
        putInst(a, a.n++, e.x, R3.height(e.x, e.y) + hop, e.y, sc, snap.yaw, lean, wob, (fl ? 1.12 : 1) / (tel ? sq : 1) * (dash ? 1.1 : 1), (fl ? .9 : 1) * sq * (dash ? .86 : 1), r, g, bl);
      }
    }
    // quái biến mất → hiệu ứng chết
    for (const [id, sn] of A.seen) {
      if (live.has(id)) continue; A.seen.delete(id); A.first.delete(id);
      const d2 = (sn.x - P.x) ** 2 + (sn.y - P.y) ** 2; if (d2 > 1400 * 1400) { if (sn.rig) { disposeRig(sn.rig); A.rig.delete(id) } continue }
      A.dying.push({ sn, t: 0, T: sn.boss ? 1.6 : sn.rigged ? .8 : .42 });
      if (R3.fxKill) R3.fxKill(sn);
      if (sn.rig) A.rig.delete(id);
    }
    for (let i = A.dying.length - 1; i >= 0; i--) {
      const d = A.dying[i]; d.t += dt; const u = clamp(d.t / d.T, 0, 1), sn = d.sn;
      if (sn.rig) {
        const a = sn.rig; a.g.position.y = R3.height(sn.x, sn.y) + u * (sn.boss ? 14 : 4); const s = sn.sc * (1 - ease(u) * .35); a.g.scale.set(s * (1 + u * .25), s * (1 - u * .85), s * (1 + u * .25)); a.g.rotation.y = sn.yaw + u * 2; a.ring.material.opacity *= .9; a.halo.material.opacity = (1 - u) * .6;
        for (const m of [a.lit, a.glow]) if (m) { m.material.transparent = true; m.material.opacity = 1 - u; m.material.color.setScalar(1 + (1 - u) * 2) }
        if (u >= 1) { disposeRig(a) }
      } else if (!sn.rig) {
        const a = getArch(sn.k); if (a.n < 199) { const s = sn.sc * (1 - ease(u) * .6); putInst(a, a.n++, sn.x, R3.height(sn.x, sn.y) + u * 6, sn.y, s, sn.yaw + u * 3, -u * .9, u * .6, 1 + u * .5, 1 - u * .9, 2.2 * (1 - u) + 1, 2.2 * (1 - u) + 1, 2.2 * (1 - u) + 1) }
      }
      if (u >= 1) A.dying.splice(i, 1);
    }
    for (const a of A.arch.values()) { if (a.lit) { a.lit.count = a.n; a.lit.instanceMatrix.needsUpdate = true; a.lit.instanceColor.needsUpdate = true } if (a.glow) { a.glow.count = a.n; a.glow.instanceMatrix.needsUpdate = true; a.glow.instanceColor.needsUpdate = true } }
    A.lastN = G.en.length;
  }
  function disposeRig(a) { if (!a || !a.g) return; a.g.parent && a.g.parent.remove(a.g); a.g.traverse(o => { if (o.geometry && !isPrim(o.geometry)) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material.map) o.material.dispose() }); a.g = null }

  /* ================= LỚP PHỦ 2D: thanh máu Elite · nhân vật ================= */
  function overlay(ctx, G, W, H) {
    const P = G.p, sp = {};
    // thanh máu nhân vật (xanh) phía trên đầu
    const hp = R3.project(P.x, P.y, 66, sp); if (hp.vis) {
      const w = 46, h = 6, x = hp.x - w / 2, y = hp.y - 6;
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = '#2a0f0f'; ctx.fillRect(x, y, w, h);
      const f = clamp(P.hp / P.mhp, 0, 1); ctx.fillStyle = f < .3 ? '#ff5a4a' : '#5be37a'; ctx.fillRect(x, y, w * f, h); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, w * f, 2);
    }
    for (const e of G.en) {
      if (e.dead || !(e.el || e.mb) || e.boss) continue; const s = R3.project(e.x, e.y, e.r * 3.2 + 14, sp); if (!s.vis || s.x < -40 || s.x > W + 40 || s.y < -20 || s.y > H + 40) continue;
      const w = e.mb ? 56 : 40, h = 5, x = s.x - w / 2, y = s.y; ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = e.mb ? '#c46aff' : e.el > 1 ? '#ff4664' : '#ffd34a'; ctx.fillRect(x, y, w * clamp(e.hp / e.mhp, 0, 1), h); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x, y, w * clamp(e.hp / e.mhp, 0, 1), 1.6);
    }
  }
  R3.ovl = R3.ovl || []; R3.ovl.push(overlay);

  R3.reg({
    init(S) { A.S = S; S.actG = new T.Group(); S.world.add(S.actG); P_ = R3.prim() },
    begin(S, G) {
      A.S = S; for (const a of A.arch.values()) { if (a.lit) { S.actG.remove(a.lit); a.lit.dispose(); a.lit.material.dispose() } if (a.glow) { S.actG.remove(a.glow); a.glow.dispose(); a.glow.material.dispose() } if (a.geo) { a.geo.lit && a.geo.lit.dispose(); a.geo.glow && a.geo.glow.dispose() } }
      A.arch.clear(); for (const a of A.rig.values()) disposeRig(a); A.rig.clear(); for (const d of A.dying) if (d.sn.rig) disposeRig(d.sn.rig); A.dying.length = 0; A.seen.clear(); A.first.clear();
      if (A.hero) { S.world.remove(A.hero.g); disposeGroup(A.hero.g); A.hero = null; A.heroKey = '' } ensureHero(S, G);
    },
    update(S, G, dt) { heroAnim(S, G, dt); updEnemies(S, G, dt) },
    end(S) {
      for (const a of A.arch.values()) { if (a.lit) { S.actG.remove(a.lit); a.lit.dispose() } if (a.glow) { S.actG.remove(a.glow); a.glow.dispose() } } A.arch.clear();
      for (const a of A.rig.values()) disposeRig(a); A.rig.clear(); for (const d of A.dying) if (d.sn.rig) disposeRig(d.sn.rig); A.dying.length = 0; A.seen.clear(); A.first.clear();
      if (A.hero) { S.world.remove(A.hero.g); disposeGroup(A.hero.g); A.hero = null; A.heroKey = '' }
    }
  });
  R3.buildHero = buildHero;
})();
