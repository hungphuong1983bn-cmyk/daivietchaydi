/* Phase 18 — HIỆU ỨNG 3D (module của DV_R3D): hạt, đạn kiếm khí, kiếm xoay, pháp trận/hoa sen/sét của kỹ năng & tuyệt kỹ,
   cảnh báo vùng đánh (Boss/hazard), vật rơi (vàng/EXP/bình hồi) và CỘT SÁNG theo phẩm chất.
   Mọi hiệu ứng là vật thể trong không gian 3D (nằm trên mặt đất / bay theo quỹ đạo / có thời điểm bắt đầu – kết thúc), phát ra từ chính sự kiện của logic game:
   bọc DV_VFX (palm/bolt/boom/ult/heal/zoneHit/bossDie/cast/onHit) giống cách các module Phase 17 đang làm; đọc G.pr / G.ep / G.orb / G.tz / G.pt / G.fx và E.hz.
   KHÔNG đổi sát thương, tầm đánh, hồi chiêu, bảng rơi đồ, dữ liệu lưu. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T) return;
  const M = Math, PI = M.PI, TAU = PI * 2, R = Math.random;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, ease = t => 1 - (1 - t) * (1 - t), ease3 = t => 1 - (1 - t) * (1 - t) * (1 - t);
  const F = { S: null, list: [], pool: {}, geo: {}, tex: {}, cc: new Map(), pt: null, own: [], ownN: 0, beams: [], items: new Map(), cl: new Map() };
  R3.F = F;
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _p = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color();
  function C(str) {   // chuỗi CSS (#hex, rgb(), hsl()) hoặc "r,g,b" → Color (đệm)
    let c = F.cc.get(str); if (c) return c; c = new T.Color();
    try { if (typeof str === 'number') c.setHex(str); else if (/^\d+,\s*\d+,\s*\d+$/.test(str)) { const a = str.split(','); c.setRGB(a[0] / 255, a[1] / 255, a[2] / 255, T.SRGBColorSpace) } else c.set(str) } catch (e) { c.set(0xffffff) }
    if (F.cc.size > 300) F.cc.clear(); F.cc.set(str, c); return c;
  }
  const H = (x, y) => R3.height(x, y);
  const Q = () => F.S ? F.S.q : 1;

  /* ---------- tài nguyên dùng chung ---------- */
  function geos() {
    if (F.geo.ring) return F.geo;
    const g = F.geo;
    g.ring = new T.RingGeometry(.86, 1, 72, 2); g.ring.rotateX(-PI / 2);   // Phase 22: nhiều đoạn để ôm địa hình
    g.disc = new T.RingGeometry(.0001, 1, 56, 12); g.disc.rotateX(-PI / 2);   // chia vòng đồng tâm: ôm địa hình (CircleGeometry cũ chỉ có 1 mặt quạt phẳng)
    g.cyl = new T.CylinderGeometry(1, 1, 1, 14, 1, true); g.cyl.translate(0, .5, 0);
    g.cylS = new T.CylinderGeometry(1, 1, 1, 6, 1); g.cylS.translate(0, .5, 0);
    g.cone = new T.ConeGeometry(1, 1, 6); g.cone.translate(0, .5, 0);
    g.petal = new T.SphereGeometry(1, 8, 6); g.petal.scale(.34, .1, 1); g.petal.translate(0, 0, 1);
    g.arc = new T.TorusGeometry(1, .06, 4, 28, 1.9);
    g.crescent = new T.TorusGeometry(1, .16, 4, 20, 2.1);
    g.sph = new T.SphereGeometry(1, 12, 8); g.oct = new T.OctahedronGeometry(1, 0); g.box = new T.BoxGeometry(1, 1, 1);
    g.dome = new T.SphereGeometry(1, 20, 10, 0, TAU, 0, PI / 2);
    g.coin = new T.CylinderGeometry(1, 1, .28, 12); g.coin.rotateX(PI / 2);
    return g;
  }
  function discTex() {   // Phase 22: đĩa năng lượng — lõi dịu, viền sáng, tan mềm (không còn mảng phẳng đặc)
    if (F.tex.disc) return F.tex.disc; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(.55, 'rgba(255,255,255,.22)'); gr.addColorStop(.84, 'rgba(255,255,255,.85)'); gr.addColorStop(.94, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return F.tex.disc = t;
  }
  R3.discTex = discTex;
  function beamTex() {
    if (F.tex.beam) return F.tex.beam; const c = document.createElement('canvas'); c.width = 8; c.height = 128; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return F.tex.beam = t;
  }
  const addM = (col, op, map, side) => { const m = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op == null ? 1 : op, blending: T.AdditiveBlending, depthWrite: false, fog: false, map: map || null, side: side || T.FrontSide }); return R3.drape ? R3.drape(m) : m };   // Phase 22: ôm địa hình
  function put(mesh) { F.S.fxG.add(mesh); return mesh }
  function kill(o) { if (o.parent) o.parent.remove(o); o.traverse(x => { if (x.material && x.material.dispose) x.material.dispose() }) }
  function add(fn) { F.list.push(fn); return fn }

  /* ---------- hạt ---------- */
  const NP = 1400;
  function initParticles(S) {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); g.setAttribute('color', new T.BufferAttribute(new Float32Array(NP * 3), 3));
    g.setDrawRange(0, 0);
    const m = new T.PointsMaterial({ size: 9, map: R3.sparkTex(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true, fog: false, opacity: .95 });
    F.pt = new T.Points(g, m); F.pt.frustumCulled = false; F.pt.renderOrder = 6; S.world.add(F.pt);
  }
  function emit(x, y, z, vx, vy, vz, life, col, grav) {
    if (F.own.length >= 700) return; F.own.push({ x, y, z, vx, vy, vz, t: life, T: life, c: C(col), g: grav == null ? 260 : grav });
  }
  R3.emit = emit;
  function burst(x, y, z, n, sp, life, col, up, grav) { n = M.ceil(n * [.4, .8, 1.3][Q()]); for (let i = 0; i < n; i++) { const a = R() * TAU, v = sp * (.3 + R() * .7); emit(x, y, z, M.cos(a) * v, M.sin(a) * v, (up == null ? 60 : up) * (.4 + R()), life * (.6 + R() * .6), col, grav) } }
  function updParticles(G, dt) {
    const pos = F.pt.geometry.attributes.position.array, col = F.pt.geometry.attributes.color.array; let n = 0;
    const P = G.p, dMax = 1500 * 1500;
    for (const p of G.pt) {   // hạt của game (toạ độ phẳng): nâng lên theo thời gian sống
      if (n >= NP - 1) break; const dx = p.x - P.x, dy = p.y - P.y; if (dx * dx + dy * dy > dMax) continue;
      const c = C(p.c), a = M.min(1, p.t * 2.5), k = n * 3; pos[k] = p.x; pos[k + 1] = H(p.x, p.y) + 6 + (.45 - M.min(.45, p.t)) * 40; pos[k + 2] = p.y; col[k] = c.r * a; col[k + 1] = c.g * a; col[k + 2] = c.b * a; n++;
    }
    for (let i = F.own.length - 1; i >= 0; i--) {
      const p = F.own[i]; p.t -= dt; if (p.t <= 0) { F.own[i] = F.own[F.own.length - 1]; F.own.pop(); continue }
      p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; const gh = H(p.x, p.y); if (p.z < 2) { p.z = 2; p.vz = M.abs(p.vz) * .3; p.vx *= .6; p.vy *= .6 }
      if (n >= NP) continue; const a = clamp(p.t / p.T * 1.6, 0, 1), k = n * 3; pos[k] = p.x; pos[k + 1] = gh + p.z; pos[k + 2] = p.y; col[k] = p.c.r * a; col[k + 1] = p.c.g * a; col[k + 2] = p.c.b * a; n++;
    }
    F.pt.geometry.setDrawRange(0, n); F.pt.geometry.attributes.position.needsUpdate = true; F.pt.geometry.attributes.color.needsUpdate = true;
  }

  /* ---------- hiệu ứng dựng sẵn ---------- */
  function ring(x, y, Rr, T_, col, thick, delay) {   // vòng sóng lan trên mặt đất
    const g = geos(), m = new T.Mesh(g.ring, addM(C(col), 1)); m.position.set(x, H(x, y) + 2.2, y); m.renderOrder = 4; put(m); let t = -(delay || 0);
    const disc = new T.Mesh(g.disc, addM(C(col), .5, discTex())); disc.position.copy(m.position); disc.renderOrder = 3; put(disc);
    return add(dt => { t += dt; if (t < 0) { m.visible = disc.visible = false; return true } m.visible = disc.visible = true; const u = clamp(t / T_, 0, 1), s = Rr * (.12 + .88 * ease(u)); m.scale.set(s, 1, s); disc.scale.set(s, 1, s); m.material.opacity = (1 - u) * .95; disc.material.opacity = (1 - u) * .22; if (u >= 1) { kill(m); kill(disc); return false } return true });
  }
  function pillar(x, y, h, rad, col, T_, op) {   // cột sáng ngắn hạn
    const g = geos(), m = new T.Mesh(g.cyl, addM(C(col), op || .8, beamTex())); m.position.set(x, H(x, y), y); m.renderOrder = 5; put(m); let t = 0;
    return add(dt => { t += dt; const u = clamp(t / T_, 0, 1), w = rad * (1 - .6 * u); m.scale.set(w, h * (.3 + .7 * ease(M.min(1, u * 4))), w); m.material.opacity = (op || .8) * (1 - u); if (u >= 1) { kill(m); return false } return true });
  }
  function flashDome(x, y, Rr, T_, col, op) {
    const g = geos(), m = new T.Mesh(g.dome, addM(C(col), op || .5)); m.position.set(x, H(x, y), y); m.renderOrder = 5; put(m); let t = 0;
    return add(dt => { t += dt; const u = clamp(t / T_, 0, 1), s = Rr * (.2 + .8 * ease3(u)); m.scale.set(s, s * .6, s); m.material.opacity = (op || .5) * (1 - u) * (1 - u); if (u >= 1) { kill(m); return false } return true });
  }
  function lotus(x, y, Rr, T_, col, n, delay) {
    const g = geos(), grp = new T.Group(); grp.position.set(x, H(x, y) + 2.4, y); n = n || 10; const mats = [];
    for (let l = 0; l < 2; l++) for (let i = 0; i < n; i++) { const mt = addM(C(l ? '#fff1b0' : col), .8); mats.push(mt); const p = new T.Mesh(g.petal, mt); const a = i / n * TAU + l * PI / n; p.rotation.y = a; p.rotation.x = -(.15 + l * .35); p.position.set(0, l * 3, 0); p.userData.l = l; grp.add(p) }
    grp.renderOrder = 5; put(grp); let t = -(delay || 0);
    return add(dt => { t += dt; if (t < 0) { grp.visible = false; return true } grp.visible = true; const u = clamp(t / T_, 0, 1), o = ease3(M.min(1, u * 2.2)), s = Rr * (.3 + .7 * o); grp.children.forEach(p => { const k = s * (p.userData.l ? .62 : 1); p.scale.set(k * .5, k, k) }); grp.rotation.y = t * .6; for (const m of mats) m.opacity = (1 - u * u) * .8; if (u >= 1) { kill(grp); return false } return true });
  }
  function bolt(x, y, rad, evo) {   // sét giáng từ trời
    const g = geos(), grp = new T.Group(), segs = 9, H0 = 420, col = evo ? '#e0b8ff' : '#c9a8ff'; grp.position.set(x, H(x, y), y); let px = 0, pz = 0, py = H0;
    const parts = [];
    for (const w of [[5, '#a070ff', .55], [1.8, '#ffffff', 1]]) { let ax = 0, az = 0, ay = H0; for (let i = 1; i <= segs; i++) { const ny = H0 * (1 - i / segs), nx = (i < segs ? (R() - .5) * 46 : 0), nz = (i < segs ? (R() - .5) * 46 : 0), dx = nx - ax, dy = ny - ay, dz = nz - az, L = M.hypot(dx, dy, dz); const m = new T.Mesh(g.cylS, addM(C(w[1]), w[2])); m.position.set((ax + nx) / 2, (ay + ny) / 2 - L / 2 + L / 2, (az + nz) / 2); m.scale.set(w[0], L, w[0]); m.position.set(ax, ay, az); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx, dy, dz).normalize()); grp.add(m); parts.push(m); ax = nx; ay = ny; az = nz } }
    grp.renderOrder = 6; put(grp); let t = 0; const T_ = .34;
    R3.flash(x, y, 0xc0a0ff, 6);
    ring(x, y, rad * 1.3, .45, '#b890ff'); flashDome(x, y, rad * .8, .35, '#e0ccff', .45); burst(x, y, 6, 18, 140, .5, '#d9b8ff', 180);
    return add(dt => { t += dt; const u = clamp(t / T_, 0, 1), fl = (t < .1 || ((t * 40) | 0) % 3 === 0) ? 1 : .55; for (const m of parts) m.material.opacity = (1 - u) * fl; if (u >= 1) { kill(grp); return false } return true });
  }
  function palm(x, y, Rr, evo) {   // Hàng Long Chưởng: sóng chưởng vàng
    ring(x, y, Rr, .5, '#ffc35a'); ring(x, y, Rr * .7, .4, '#fff0b0', 1, .06); flashDome(x, y, Rr * .8, .45, '#ffd070', .55); R3.flash(x, y, 0xffd070, 4);
    burst(x, y, 10, 22, Rr * 1.1, .6, '#ffd978', 160); if (evo) lotus(x, y, Rr * .5, .7, '#ffd070', 8);
  }
  function boom(x, y, Rr) { ring(x, y, Rr * 1.1, .4, '#ff7a3a'); flashDome(x, y, Rr, .35, '#ffb050', .7); R3.flash(x, y, 0xff9a40, 5); burst(x, y, 8, 20, Rr * 2, .55, '#ff9a4a', 170); pillar(x, y, 120, Rr * .35, '#ffb060', .4, .6) }
  function heal(P) { ring(P.x, P.y, 70, .6, '#7dff9a'); for (let i = 0; i < 14; i++) { const a = R() * TAU, r = 10 + R() * 28; emit(P.x + M.cos(a) * r, P.y + M.sin(a) * r, 4, 0, 0, 70 + R() * 50, .9, '#9dffb5', -20) } pillar(P.x, P.y, 90, 20, '#7dff9a', .7, .5) }
  function zoneHit(z) { ring(z.x, z.y, z.r, .4, z.k === 's' ? '#ff6a4a' : '#ff9a3a'); burst(z.x, z.y, 4, 14, z.r * 1.2, .5, '#ffb070', 120); R3.flash(z.x, z.y, 0xff8a40, 3) }
  function slash(x, y, a, ev) {   // kiếm khí xuất chiêu: vệt chém hình vòng cung phía trước
    const g = geos(), m = new T.Mesh(g.crescent, addM(C(ev ? '#ffe9a0' : '#bfe6ff'), .95)); const dx = M.cos(a), dz = M.sin(a);
    m.position.set(x + dx * 26, H(x, y) + 30, y + dz * 26); m.rotation.order = 'YXZ'; m.rotation.y = M.atan2(dx, dz) - PI / 2 - .2; m.rotation.x = -PI / 2 + .35; m.rotation.z = 0; m.scale.set(30, 30, 30); m.renderOrder = 6; put(m); let t = 0;
    return add(dt => { t += dt; const u = t / .22; m.scale.setScalar(30 + 22 * ease(u)); m.material.opacity = (1 - u) * .95; if (u >= 1) { kill(m); return false } return true });
  }
  function ult(P) {   // Tuyệt kỹ: pháp trận 2 lớp xoay + hoa sen + trụ sáng + sóng + vòng kiếm
    const g = geos(), q = Q(), Rr = 310, T_ = q === 0 ? 1.2 : 1.9, x = P.x, y = P.y, grp = new T.Group(); grp.position.set(x, H(x, y), y); put(grp);
    const r1 = R3.runeDecal('#ffc94a', Rr, .6), r2 = R3.runeDecal('#ffdf8a', Rr * .62, .5); r1.position.y = 2; r2.position.y = 2.6; grp.add(r1, r2);
    const pil = []; const NP_ = [6, 12, 20][q]; for (let i = 0; i < NP_; i++) { const a = i / NP_ * TAU, m = new T.Mesh(g.cyl, addM(C('#ffc860'), .62, beamTex())); m.position.set(M.cos(a) * Rr * .86, 0, M.sin(a) * Rr * .86); m.userData.d = i / NP_; grp.add(m); pil.push(m) }
    const arcs = []; for (let i = 0; i < 3; i++) { const m = new T.Mesh(g.arc, addM(C('#ffd67a'), .7)); m.rotation.x = -PI / 2; m.position.y = 34 + i * 10; grp.add(m); arcs.push(m) }
    ring(x, y, Rr * 1.15, .9, '#ffe27a'); ring(x, y, Rr, 1.2, '#ffc050', 1, .15); lotus(x, y, 120, T_ * .8, '#ffd070', 12, .1); flashDome(x, y, Rr * .5, .6, '#ffd070', .45); R3.flash(x, y, 0xffe08a, 8);
    burst(x, y, 10, 40, 260, 1, '#ffe27a', 220); let t = 0;
    return add(dt => {
      t += dt; const u = clamp(t / T_, 0, 1), op = u < .12 ? u / .12 : u > .7 ? (1 - u) / .3 : 1, o = ease3(M.min(1, u * 3));
      r1.rotation.y = t * 1.1; r2.rotation.y = -t * 1.7; r1.scale.set(Rr * (.4 + .6 * o), 1, Rr * (.4 + .6 * o)); r2.scale.set(Rr * .62 * (.4 + .6 * o), 1, Rr * .62 * (.4 + .6 * o)); r1.material.opacity = .9 * op; r2.material.opacity = .8 * op;
      for (const m of pil) { const k = clamp((u - m.userData.d * .35) * 4, 0, 1); m.scale.set(8, 360 * ease3(k), 8); m.material.opacity = .85 * op * (1 - u * .5) }
      arcs.forEach((m, i) => { m.rotation.z = t * (4 + i * 2) * (i % 2 ? -1 : 1); const s = Rr * (.35 + .2 * i) * (.3 + .7 * o); m.scale.set(s, s, s); m.material.opacity = .9 * op });
      if (q > 0 && R() < .8) { const a = R() * TAU, r = R() * Rr * .9; emit(x + M.cos(a) * r, y + M.sin(a) * r, 4, 0, 0, 90 + R() * 120, 1, R() < .5 ? '#ffe27a' : '#fff6cf', -10) }
      if (u >= 1) { kill(grp); return false } return true;
    });
  }
  function bossDie(e) { const r = e.r || 40; for (let i = 0; i < 3; i++) ring(e.x, e.y, r * (4 + i * 2.5), .9 + i * .25, i % 2 ? '#ffe27a' : '#ff7a4a', 1, i * .18); pillar(e.x, e.y, 420, r * .6, '#ffd070', 1.2, .85); flashDome(e.x, e.y, r * 5, .9, '#fff0b0', .7); R3.flash(e.x, e.y, 0xffe0a0, 9); burst(e.x, e.y, 20, 70, r * 8, 1.4, '#ffd070', 300) }
  function hitFx(e, src, cr) { if (!e) return; const n = cr ? 9 : 4; burst(e.x, e.y, (e.r || 11) * 1.4, n, cr ? 190 : 110, .35, cr ? '#ffc83c' : '#ffffff', 70, 200) }
  R3.fxKill = sn => {
    const k = sn.k, acc = k && k.P ? k.P.acc : '#ff8a5a', cl = k && k.P ? k.P.cloth : '#aa4a3a', r = sn.r || 11;
    burst(sn.x, sn.y, r * 1.8, sn.boss ? 40 : sn.rigged ? 18 : 8, 150 + r * 4, .6, cl, 120, 280); burst(sn.x, sn.y, r * 1.8, sn.rigged ? 12 : 4, 90, .8, acc, 160, 100);
    emit(sn.x, sn.y, r * 2, 0, 0, 90, 1.1, '#cfe8ff', -40);
    if (sn.rigged && !sn.boss) ring(sn.x, sn.y, r * 3.4, .5, acc);
  };
  R3.fxSpawn = (e, k) => { const acc = k && k.P ? k.P.acc : '#ff8a5a', r = e.r || 11; if (e.boss || e.mb) { ring(e.x, e.y, r * 3, .8, acc); pillar(e.x, e.y, 200, r * .5, acc, .8, .6) } else if (Q() > 0) { ring(e.x, e.y, r * 1.8, .45, acc); pillar(e.x, e.y, 60, r * .5, acc, .45, .5) } };

  /* ---------- đạn, kiếm xoay, đạn địch ---------- */
  function pooled(name, make, n) { const L = F.pool[name] || (F.pool[name] = { a: [], used: 0 }); while (L.a.length < n) { const o = make(); o.visible = false; put(o); L.a.push(o) } return L }
  function mkBlade() { const g = geos(), grp = new T.Group(); const c = new T.Mesh(g.crescent, addM(0xcfeaff, .95)); c.rotation.set(-PI / 2, 0, -PI / 2 - 1.05); c.scale.setScalar(15); grp.add(c); const c2 = new T.Mesh(g.crescent, addM(0x4aa8ff, .5)); c2.rotation.copy(c.rotation); c2.scale.setScalar(19); grp.add(c2); const s = R3.glowSprite(0x9ad0ff, 36, .6); grp.add(s); return grp }
  function mkEP() { const grp = new T.Group(); grp.add(new T.Mesh(geos().sph, addM(0xff6a4a, .95))); grp.children[0].scale.setScalar(5); grp.add(R3.glowSprite(0xff5a3a, 30, .75)); return grp }
  function mkSword() { const g = geos(), grp = new T.Group(); const b = new T.Mesh(g.cone, addM(0xbfe3ff, .95)); b.scale.set(2.2, 22, .8); b.rotation.x = PI / 2; grp.add(b); const h = new T.Mesh(g.box, addM(0xe8b84a, 1)); h.scale.set(7, 2, 2); h.position.z = -3; grp.add(h); grp.add(R3.glowSprite(0x8ac8ff, 26, .5)); return grp }
  function updShots(S, G, dt) {
    const P = G.p, pl = pooled('pr', mkBlade, 0), n = G.pr.length; const L = pooled('pr', mkBlade, M.min(48, n)); let u = 0;
    for (const p of G.pr) { if (u >= L.a.length) break; const o = L.a[u++]; o.visible = true; o.position.set(p.x, H(p.x, p.y) + 26, p.y); o.rotation.y = M.atan2(p.vx, p.vy); if (R() < .6 && Q()) emit(p.x, p.y, 24 + R() * 6, -p.vx * .08, -p.vy * .08, 10, .3, '#aee0ff', 0) } for (let i = u; i < L.a.length; i++) L.a[i].visible = false;
    const E = pooled('ep', mkEP, M.min(100, G.ep.length)); u = 0; for (const p of G.ep) { if (u >= E.a.length) break; const o = E.a[u++]; o.visible = true; o.position.set(p.x, H(p.x, p.y) + 18, p.y); o.scale.setScalar(1 + .15 * M.sin(S.t * 18 + u)) } for (let i = u; i < E.a.length; i++) E.a[i].visible = false;
    // kiếm xoay quanh (Phi Kiếm)
    const nph = G.sk && G.sk.phi ? M.min(9, G.sk.phi + 1 + (G.evo && G.evo.phi ? 2 : 0)) : 0, W = pooled('phi', mkSword, nph);
    for (let i = 0; i < W.a.length; i++) { const o = W.a[i]; if (i >= nph) { o.visible = false; continue } o.visible = true; const a = G.orbit + i / nph * TAU; o.position.set(P.x + M.cos(a) * 62, H(P.x, P.y) + 26 + M.sin(S.t * 3 + i) * 3, P.y + M.sin(a) * 62); o.rotation.y = M.atan2(-M.sin(a), M.cos(a)) + PI / 2 * 0 + PI / 2; }
  }

  /* ---------- cảnh báo vùng đánh (G.tz, E.hz) + vạch lao của quái ---------- */
  function mkTz() {
    const g = geos(), grp = new T.Group(); const fill = new T.Mesh(g.disc, addM(0xff3a2a, .2)), ring = new T.Mesh(g.ring, addM(0xff5a3a, .9)), inner = new T.Mesh(g.ring, addM(0xffa08a, .8)); fill.position.y = ring.position.y = inner.position.y = 1.4; fill.renderOrder = ring.renderOrder = inner.renderOrder = 3; grp.add(fill, ring, inner);
    const fall = new T.Group(); fall.add(new T.Mesh(g.sph, addM(0xff7a2a, .95))); fall.children[0].scale.setScalar(12); fall.add(R3.glowSprite(0xff8a3a, 70, .8)); grp.add(fall);
    const tail = new T.Mesh(g.cylS, addM(0xff9a4a, .55)); grp.add(tail); grp.userData = { fill, ring, inner, fall, tail }; return grp;
  }
  function tzVis(o, x, y, r, p, col, kind, fall) {
    const u = o.userData, c = C(col); o.visible = true; o.position.set(x, H(x, y), y); p = clamp(p, 0, 1);
    u.fill.material.color.copy(c); u.ring.material.color.copy(c); u.inner.material.color.copy(c).lerp(_c.set(0xffffff), .4); u.fill.scale.set(r, 1, r); u.ring.scale.set(r, 1, r); u.fill.material.opacity = .1 + .25 * p; u.ring.material.opacity = .9; u.inner.scale.set(r * (p + .02), 1, r * (p + .02)); u.inner.material.opacity = .8;
    const fq = (kind === 'm' || fall) ? M.max(0, (p - .55) / .45) : -1;
    if (fq >= 0) { const hh = (1 - fq) * (1 - fq) * 340; u.fall.visible = true; u.fall.position.set((1 - fq) * 90, hh + 14, 0); u.tail.visible = true; u.tail.position.set(0, 0, 0); const dx = (1 - fq) * 90, L = M.hypot(dx, hh); u.tail.scale.set(5, L + 1, 5); u.tail.position.set(0, 0, 0); u.tail.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx, hh, 0).normalize()); u.fall.children[0].material.color.copy(fall === 'ice' ? _c.set(0xaee8ff) : fall === 'rock' ? _c.set(0x8a7860) : _c.set(0xff7a2a)) } else { u.fall.visible = false; u.tail.visible = false }
  }
  function updTz(S, G) {
    const E = S.E, hz = E && E.hz ? E.hz : [], n = M.min(40, G.tz.length + hz.length), L = pooled('tz', mkTz, n); let u = 0;
    for (const z of G.tz) { if (u >= L.a.length) break; tzVis(L.a[u++], z.x, z.y, z.r, 1 - z.t / z.T, z.k === 's' ? '#ff4a3a' : '#ff7a2a', z.k); }
    for (const z of hz) { if (u >= L.a.length) break; if (z.t > z.T) { continue } const o = L.a[u++]; tzVis(o, z.x, z.y, z.r, 1 - z.t / z.T, z.col || '255,90,60', z.k, z.fall); }
    for (let i = u; i < L.a.length; i++) L.a[i].visible = false;
    // vạch báo lao của quái
    const TL = pooled('tel', () => { const m = new T.Mesh(geos().box, addM(0xff4630, .5)); m.renderOrder = 3; return m }, 6); let k = 0;
    for (const e of G.en) { if (!(e.tel > 0) || e.dead || k >= TL.a.length) continue; const o = TL.a[k++], P = G.p, dx = P.x - e.x, dz = P.y - e.y, L2 = M.hypot(dx, dz) || 1; o.visible = true; o.position.set((e.x + P.x) / 2, H(e.x, e.y) + 2, (e.y + P.y) / 2); o.scale.set(4, .6, L2); o.rotation.set(0, M.atan2(dx, dz), 0); o.material.opacity = .35 + .25 * M.sin(S.t * 30) } for (let i = k; i < TL.a.length; i++) TL.a[i].visible = false;
    // vòng sóng hazard đã nổ
    for (const f of (E && E.fx) || []) { if (f.r3) continue; f.r3 = 1; if (f.sk === 'ring') ring(f.x, f.y, f.r, f.T, f.col || '#ffd070'); else { ring(f.x, f.y, f.r || 60, .4, f.col || '#ff9a3a'); burst(f.x, f.y, 6, 12, 120, .5, f.col || '#ffb070', 110) } }
  }

  /* ---------- vật rơi: vàng · EXP · bình hồi · CỘT SÁNG ---------- */
  const TIERS = {
    L: { col: '#d45aff', core: '#ffeaff', h: 300, w: 12, item: 'chest' },
    E: { col: '#50ffaa', core: '#e0fff0', h: 200, w: 8, item: 'orb' },
    R: { col: '#4a9bff', core: '#dcecff', h: 230, w: 9, item: 'gem' }
  };
  const CAPB = [2, 4, 10];
  function mkBeam(k) {
    const g = geos(), T_ = TIERS[k], grp = new T.Group(), b1 = new T.Mesh(g.cyl, addM(C(T_.col), .75, beamTex())), b2 = new T.Mesh(g.cyl, addM(C(T_.core), .9, beamTex()));
    b1.scale.set(T_.w, T_.h, T_.w); b2.scale.set(T_.w * .35, T_.h, T_.w * .35); grp.add(b1, b2); const base = new T.Mesh(g.disc, addM(C(T_.col), .6)); base.scale.set(T_.w * 2.6, 1, T_.w * 2.6); base.position.y = 1.6; base.renderOrder = 4; grp.add(base);
    let it; if (T_.item === 'chest') { it = new T.Group(); const body = new T.Mesh(g.box, new T.MeshBasicMaterial({ color: 0xc88a2a })); body.scale.set(14, 9, 9); const lid = new T.Mesh(g.box, new T.MeshBasicMaterial({ color: 0xffd25a })); lid.scale.set(15, 5, 10); lid.position.y = 7; const lock = new T.Mesh(g.box, new T.MeshBasicMaterial({ color: 0xfff3a8 })); lock.scale.set(3, 4, 1); lock.position.set(0, 3, 5.2); it.add(body, lid, lock) } else if (T_.item === 'orb') { it = new T.Mesh(g.sph, new T.MeshBasicMaterial({ color: 0xaaffd8 })); it.scale.setScalar(7) } else { it = new T.Mesh(g.oct, new T.MeshBasicMaterial({ color: 0xbfe0ff })); it.scale.set(6, 9, 6) }
    it.position.y = 34; grp.add(it); const sp = R3.glowSprite(C(T_.col), 46, .8); sp.position.y = 34; grp.add(sp); grp.userData = { b1, b2, base, it, sp, k, a: 0 }; return grp;
  }
  function updOrbs(S, G, dt) {
    const g = geos(), P = G.p, q = Q(), t = S.t;
    if (!F.coin) {
      F.coin = new T.InstancedMesh(g.coin, new T.MeshLambertMaterial({ color: 0xf5c542, emissive: 0x6a4400 }), 320); F.exp = new T.InstancedMesh(g.oct, new T.MeshBasicMaterial({ color: 0xffffff }), 220);
      F.coin.frustumCulled = F.exp.frustumCulled = false; S.fxG.add(F.coin, F.exp); F.coin.count = F.exp.count = 0;
    }
    let nc = 0, ne = 0, nh = 0; const gold = [], big = [], heal = [];
    for (const o of G.orb) {
      const dx = o.x - P.x, dy = o.y - P.y; if (dx * dx + dy * dy > 1500 * 1500) continue;
      if (o.h) { heal.push(o); continue } const h0 = H(o.x, o.y);
      const lp = R3.lootPop ? R3.lootPop(o, t) : { h: 0, s: 1 };   // Phase 22: nảy theo cung cùng quầng sáng
      if (o.g) { gold.push(o); if (nc < 320) { _e.set(0, t * 3 + o.x, 0); _q.setFromEuler(_e); _m.compose(_p.set(o.x, h0 + 9 + lp.h + M.sin(t * 4 + o.y) * 1.6, o.y), _q, _s.set(5.8 * lp.s, 5.8 * lp.s, 5.8 * lp.s)); F.coin.setMatrixAt(nc++, _m) } }
      else if (ne < 220) { const v = o.v || 1, s = (v >= 20 ? 11 : 5.4 + M.min(2.4, v * .06)) * lp.s; if (v >= 20) big.push(o); _e.set(t * 2, t * 3, 0); _q.setFromEuler(_e); _m.compose(_p.set(o.x, h0 + 10 + lp.h + s * .3 + M.sin(t * 4 + o.x) * 1.4, o.y), _q, _s.set(s, s * 1.4, s)); F.exp.setMatrixAt(ne, _m); if (R3.lootCol) F.exp.setColorAt(ne, R3.lootCol(o)); ne++ }
    }
    F.coin.count = nc; F.exp.count = ne; F.coin.instanceMatrix.needsUpdate = F.exp.instanceMatrix.needsUpdate = true; if (F.exp.instanceColor) F.exp.instanceColor.needsUpdate = true;
    // bình hồi
    const HL = pooled('heal', () => { const grp = new T.Group(), s = new T.Mesh(g.sph, addM(0x5dff9a, .9)); s.scale.setScalar(8); const a = new T.Mesh(g.box, new T.MeshBasicMaterial({ color: 0xffffff })); a.scale.set(3, 12, 3); const b = new T.Mesh(g.box, new T.MeshBasicMaterial({ color: 0xffffff })); b.scale.set(12, 3, 3); grp.add(s, a, b, R3.glowSprite(0x5dff9a, 44, .6)); return grp }, M.min(10, heal.length)); let hu = 0;
    for (const o of heal) { if (hu >= HL.a.length) break; const m = HL.a[hu++]; m.visible = true; m.position.set(o.x, H(o.x, o.y) + 16 + M.sin(t * 3 + o.x) * 3, o.y); m.rotation.y = t * 2 } for (let i = hu; i < HL.a.length; i++) HL.a[i].visible = false;
    // cột sáng theo phẩm chất (suy ra từ vật rơi có thật)
    const want = []; for (const o of big) want.push({ k: 'L', x: o.x, y: o.y, id: o }); for (const o of heal) want.push({ k: 'E', x: o.x, y: o.y, id: o });
    if (q >= 0) { const cl = new Map(); for (const o of gold) { const key = M.floor(o.x / 110) + ',' + M.floor(o.y / 110); let c = cl.get(key); if (!c) { c = { n: 0, x: 0, y: 0 }; cl.set(key, c) } c.n++; c.x += o.x; c.y += o.y } for (const [key, c] of cl) if (c.n >= 8) want.push({ k: 'R', x: c.x / c.n, y: c.y / c.n, id: key, n: c.n }) }
    const cap = CAPB[q], allow = q === 0 ? 'L' : q === 1 ? 'LE' : 'LER'; const sel = want.filter(w => allow.indexOf(w.k) >= 0).sort((a, b) => (a.x - P.x) ** 2 + (a.y - P.y) ** 2 - (b.x - P.x) ** 2 - (b.y - P.y) ** 2).slice(0, cap);
    const cur = new Map(); for (const w of sel) { const key = w.k + (typeof w.id === 'string' ? w.id : ''); let list = cur.get(w.k) || []; list.push(w); cur.set(w.k, list) }
    for (const b of F.beams) b.use = 0;
    for (const w of sel) {
      let b = F.beams.find(x => !x.use && x.k === w.k && x.free); if (!b) { const m = mkBeam(w.k); S.fxG.add(m); b = { k: w.k, m, use: 0, free: true, a: 0 }; F.beams.push(b); R3.fxAppear && 0 }
      b.use = 1; b.free = false; const u = b.m.userData; b.m.visible = true; b.m.position.set(w.x, H(w.x, w.y), w.y); b.a = M.min(1, b.a + dt / .3);
      const h = TIERS[w.k].h * ease(b.a); u.b1.scale.y = h; u.b2.scale.y = h; const pul = 1 + .08 * M.sin(t * 5); u.b1.scale.x = u.b1.scale.z = TIERS[w.k].w * pul; u.it.position.y = 34 + M.sin(t * 2.4) * 4; u.it.rotation.y = t * 1.8; u.sp.position.y = u.it.position.y; u.sp.material.opacity = .6 + .2 * M.sin(t * 6); u.base.rotation.y = t; if (q > 0 && R() < .35) emit(w.x + (R() - .5) * 18, w.y + (R() - .5) * 18, 3, 0, 0, 60 + R() * 60, 1.1, TIERS[w.k].col, -10);
      if (b.a < .05) { ring(w.x, w.y, 60, .6, TIERS[w.k].col) }
    }
    for (const b of F.beams) if (!b.use) { if (b.m.visible) { burst(b.m.position.x, b.m.position.z, 4, 8, 60, .5, TIERS[b.k].col, 140); } b.m.visible = false; b.a = 0; b.free = true }
  }

  R3.reg({
    init(S) {
      F.S = S; geos(); initParticles(S);
      const V = window.DV_VFX; if (V && !V.__r3) {
        V.__r3 = 1; const w = (n, f) => { const o = V[n]; if (typeof o !== 'function') return; V[n] = function () { if (R3.active()) { try { f.apply(null, arguments) } catch (e) { console.warn('[r3d fx]', n, e) } } return o.apply(this, arguments) } };
        w('palm', palm); w('bolt', bolt); w('boom', boom); w('ult', ult); w('heal', heal); w('zoneHit', zoneHit); w('bossDie', bossDie); w('cast', (k, x, y, a, ev) => { if (k === 'kiem' && !R3.wux) slash(x, y, a, ev) })   /* Phase 21: có r3d_wuxia.js thì dùng chuỗi Combo mới */; w('onHit', (e, src, cr) => hitFx(e, src, cr));
      }
    },
    begin(S, G) { F.S = S; reset(S) },
    update(S, G, dt) {
      for (const f of G.fx) { if (f.r3) continue; f.r3 = 1; if (f.k === 'r') ring(f.x, f.y, f.R, f.T, '#ffbe46') }
      updShots(S, G, dt); updTz(S, G); updOrbs(S, G, dt); updParticles(G, dt);
      for (let i = F.list.length - 1; i >= 0; i--) if (!F.list[i](dt)) F.list.splice(i, 1);
    },
    end(S) { reset(S) }
  });
  Object.assign(F, { ring, pillar, flashDome, lotus, burst, boom, bolt, add, put, kill, geos, addM, C, H, beamTex, ease, ease3, clamp });
  function reset(S) {
    for (const fn of F.list) { } F.list.length = 0; F.own.length = 0;
    for (const k in F.pool) { for (const o of F.pool[k].a) kill(o) } F.pool = {};
    for (const b of F.beams) kill(b.m); F.beams.length = 0;
    if (F.coin) { S.fxG.remove(F.coin, F.exp); F.coin.dispose(); F.exp.dispose(); F.coin = F.exp = null }
    if (S.fxG) for (const c of [...S.fxG.children]) { kill(c) }
    if (F.pt) F.pt.geometry.setDrawRange(0, 0);
  }
})();
