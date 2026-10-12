/* Phase 18 — MÀN HÌNH CHÍNH 3D (module của DV_R3D)
   Cảnh tiên môn dựng bằng hình khối 3D thật: bầu trời + mặt trời/trăng, 3 lớp núi xa có sương, đảo nổi, cổ thụ hoa đỏ, đền nhiều tầng, thác nước, mây trôi,
   bục đá có pháp trận và NHÂN VẬT 3D đang chọn (đứng chờ, thở, tóc/áo bay, linh khí; chạm vào thì ra đòn). Camera lệch nhẹ theo con trỏ/chạm (parallax thật).
   Giao diện 2D (nút, tiền, nhiệm vụ…) giữ nguyên và nằm đè lên cảnh: chỉ làm trong suốt nền #menu và ẩn ảnh/canvas nhân vật 2D khi 3D chạy.
   Màu cảnh lấy theo `hue` của chương đang chọn (DV_HOME.sync).   Tự tắt/giải phóng khi vào trận; sv.r3d=0 → về menu 2D cũ. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T) return;
  const M = Math, PI = M.PI, TAU = PI * 2, R = Math.random;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const Hm = { on: false, built: false, hue: -1, c: 0, scene: null, cam: null, t: 0, last: 0, px: 0, py: 0, tpx: 0, tpy: 0, hero: null, heroKey: '', grp: null, clouds: [], petals: null, fall: null, sp: null, raf: 0, lastCheck: 0, paused: false, tap: 0 };
  R3.home = Hm;
  const css = `#menu.r3{background:transparent!important}#menu.r3 #hscene,#menu.r3 #mart{display:none!important}#menu.r3 #hhero img,#menu.r3 #hhero svg,#menu.r3 #hhero canvas{opacity:0!important}#menu.r3 .fog{opacity:.35}`;
  const _c = new T.Color();
  const hsl = (h, s, l) => { _c.setHSL(((h % 360) + 360) % 360 / 360, clamp(s, 0, 1), clamp(l, 0, 1)); return '#' + _c.getHexString() };
  const mixh = (a, b, t) => { const x = new T.Color(a); return '#' + x.lerp(new T.Color(b), t).getHexString() };
  let P_ = null;

  function skyTex(h) {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0a1030'); gr.addColorStop(.32, hsl(h + 215, .45, .2)); gr.addColorStop(.62, hsl(h + 330, .4, .34)); gr.addColorStop(.82, hsl(h, .6, .52)); gr.addColorStop(1, hsl(h + 8, .7, .66)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function streakTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.25 + R() * .6})`; g.fillRect(R() * 62, R() * 256, 1 + R() * 3, 20 + R() * 90) }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, 2); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function cloudTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 14; i++) { const x = 40 + R() * 176, y = 50 + R() * 34, r = 22 + R() * 30, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128) }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }

  /* ---------- dựng cảnh theo hue của chương ---------- */
  function build(hue, S) {
    if (Hm.grp) { Hm.scene.remove(Hm.grp); Hm.grp.traverse(o => { if (o.geometry && !isPrim(o.geometry)) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose() }) }
    P_ = R3.prim(); const sc = Hm.scene, grp = new T.Group(); Hm.grp = grp; sc.add(grp); Hm.hue = hue;
    const hor = hsl(hue + 8, .55, .5), q = S.q;
    sc.background = skyTex(hue); sc.fog = new T.Fog(hsl(hue + 330, .38, .42), 500, 3000);
    // ánh sáng
    Hm.hemi.color.set(hsl(hue + 220, .5, .62)); Hm.hemi.groundColor.set(hsl(hue + 320, .4, .2)); Hm.hemi.intensity = .55 * PI * .6;
    Hm.sun.color.set(hsl(hue + 12, .9, .78)); Hm.sun.intensity = 1.05 * PI * .6; Hm.rim.color.set(hsl(hue + 250, .8, .7)); Hm.rim.intensity = .7 * PI * .6;
    const mat = new T.MeshLambertMaterial({ vertexColors: true, flatShading: true }), glow = new T.MeshBasicMaterial({ vertexColors: true });
    const add = (b, x, y, z, ry) => { const g = b.done(); if (g.lit) { const m = new T.Mesh(g.lit, mat); m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = q > 0; m.receiveShadow = true; grp.add(m) } if (g.glow) { const m = new T.Mesh(g.glow, glow); m.position.set(x, y, z); m.rotation.y = ry || 0; grp.add(m) } };
    // 3 lớp núi xa (màu nhạt dần theo khoảng cách → chiều sâu không khí)
    const layers = [{ z: -620, n: 7, hh: [260, 460], w: 190, c: .0 }, { z: -1150, n: 9, hh: [420, 760], w: 260, c: .45 }, { z: -1900, n: 9, hh: [600, 1100], w: 380, c: .75 }];
    layers.forEach((L, li) => {
      const b = R3.Builder(77 + li * 13 + hue | 0); const base = hsl(250 + li * 12, .42, .2 + li * .05);
      for (let i = 0; i < L.n; i++) {
        const x = (i / (L.n - 1) - .5) * (L.w * L.n * .72) + (b.r() - .5) * 120, hgt = lerpr(L.hh, b.r()), w = L.w * (.7 + b.r() * .7), col = mixh(base, hor, L.c * .45 + b.r() * .05);
        b.add(P_.cone, col, x, -80, (b.r() - .5) * 120, w, hgt, w * .8, 0, b.r() * 3, 0, 0, .35); b.add(P_.cone5, mixh(col, '#ffffff', .12), x + w * .3, -80, 60, w * .55, hgt * .62, w * .5, 0, b.r() * 3, 0, 0, .3);
        if (li === 0 && i % 2 === 0) b.add(P_.cone, mixh('#ffffff', hor, .35), x, -80 + hgt * .72, 0, w * .26, hgt * .3, w * .22, 0, 0, 0, 0, 0);   // đỉnh tuyết
      }
      add(b, 0, 0, L.z);
    });
    // đảo nổi (xianxia)
    const isl = R3.Builder(901); for (let i = 0; i < 4; i++) { const x = [-330, 300, -90, 420][i], y = [210, 260, 360, 120][i], z = [-380, -520, -900, -300][i], s = [1, 1.2, 1.7, .8][i]; isl.add(P_.cone, '#4a3e5e', x, y, z, 70 * s, -90 * s, 70 * s, 0, i, 0, 0, .5); isl.add(P_.cyl, hsl(hue + 100, .35, .34), x, y, z, 72 * s, 10 * s, 72 * s, 0, 0, 0, 0, .1); isl.add(P_.cone, hsl(hue + 130, .4, .22), x + 10 * s, y + 10 * s, z, 12 * s, 40 * s, 12 * s); isl.add(P_.cone, hsl(hue + 130, .4, .28), x - 22 * s, y + 10 * s, z + 10, 9 * s, 30 * s, 9 * s) } add(isl, 0, 0, 0);
    // bục đá của nhân vật + cổ thụ + đền + thác nước
    const st = R3.Builder(5); st.add(P_.cyl, '#5a5266', 0, -14, 0, 150, 14, 150, 0, 0, 0, 0, 0); st.add(P_.cyl, '#7a7088', 0, -2, 0, 138, 4, 138); st.add(P_.cyl, '#463e54', 0, -60, 0, 120, 48, 120, 0, 0, 0, 0, .12);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; st.add(P_.box, '#8a8098', M.cos(a) * 146, -2, M.sin(a) * 146, 10, 10, 10, 0, a, 0) } for (let i = 0; i < 6; i++) st.add(P_.ico, '#5a5266', -90 + i * 40, -64, 70, 40 - i * 4, 50, 30, 0, i, 0, 0, .25); add(st, 0, 0, 0);
    const tr = R3.Builder(12); const tc = '#4a3226';
    tr.add(P_.cyl, tc, -230, -10, -90, 20, 120, 20, 0, 0, .1, 0, .08); tr.add(P_.cyl, tc, -222, 100, -90, 14, 90, 14, 0, 0, -.35); tr.add(P_.cyl, tc, -250, 90, -90, 10, 90, 10, 0, 0, .8); tr.add(P_.cyl, tc, -200, 150, -90, 8, 70, 8, .3, 0, -1.0);
    const pk = [hsl(hue * 0 + 345, .7, .6), hsl(350, .65, .52), hsl(338, .6, .68), hsl(355, .75, .45)]; for (let i = 0; i < 11; i++) { const a = i * 1.1; tr.add(P_.ico1, pk[i % 4], -215 + M.cos(a) * (60 + (i % 3) * 22), 200 + M.sin(i * 2.3) * 28, -90 + M.sin(a) * 40, 42 + (i % 4) * 8, 24 + (i % 3) * 5, 40 + (i % 4) * 6, 0, i, 0, 0, .2) } add(tr, 0, 0, 0);
    const pg = R3.Builder(33), pc = '#3a2a3a', rc = '#a8322e', gd = '#e8b84a'; pg.add(P_.cyl, '#4a3e58', 260, -20, -250, 90, 22, 90); for (let i = 0; i < 4; i++) { const y = i * 52, w = 74 - i * 14; pg.add(P_.box, '#d9c8a0', 260, y + 2, -250, w * .6, 34, w * .6); pg.add(P_.cone5, rc, 260, y + 30, -250, w * 1.35, 26, w * 1.35, 0, PI / 4, 0, 0, 3); pg.add(P_.cone5, gd, 260, y + 52, -250, w * .2, 7, w * .2, 0, 0, 0, true) } pg.add(P_.cone, gd, 260, 214, -250, 4, 40, 4, 0, 0, 0, true); pg.add(P_.sph, '#ffe9a8', 260, 258, -250, 5, 5, 5, 0, 0, 0, true); add(pg, 0, 0, 0);
    // thác nước: vách đá + dải nước chảy (texture cuộn) + sương
    const cl = R3.Builder(21); cl.add(P_.box, '#3a3048', 420, -60, -560, 170, 520, 120, 0, 0, 0, 0, .1); cl.add(P_.ico1, '#4a3e5a', 420, 420, -560, 130, 70, 100, 0, 0, 0, 0, .25); add(cl, 0, 0, 0);
    Hm.fall = new T.Mesh(new T.PlaneGeometry(42, 470), new T.MeshBasicMaterial({ map: streakTex(), transparent: true, opacity: .85, blending: T.AdditiveBlending, depthWrite: false, fog: false })); Hm.fall.position.set(402, 180, -495); grp.add(Hm.fall);
    // mây
    Hm.clouds.length = 0; const ct = cloudTex(); for (let i = 0; i < 16; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: ct, transparent: true, opacity: .5 + R() * .3, depthWrite: false, color: mixh('#ffffff', hor, .25) })); const z = -300 - R() * 1500; s.position.set((R() - .5) * 2000, 40 + R() * 520, z); const k = 260 + R() * 360; s.scale.set(k * 2, k, 1); s.userData = { v: 6 + R() * 10, z }; grp.add(s); Hm.clouds.push(s) }
    // mặt trời + tia sáng
    const sun = R3.glowSprite(new T.Color(hsl(hue + 10, .95, .75)), 760, .85); sun.position.set(300, 380, -1700); sun.material.fog = false; grp.add(sun); const sun2 = R3.glowSprite(0xfff1b8, 240, .95); sun2.position.copy(sun.position); grp.add(sun2); Hm.sunS = sun;
    // hạt: cánh hoa/linh khí bay quanh + đom đóm
    const n = [30, 80, 160][q], pos = new Float32Array(n * 3), geo = new T.BufferGeometry(); for (let i = 0; i < n; i++) { pos[i * 3] = (R() - .5) * 700; pos[i * 3 + 1] = R() * 420; pos[i * 3 + 2] = -300 + R() * 520 } geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    Hm.petals = new T.Points(geo, new T.PointsMaterial({ color: 0xffb8c8, size: 9, map: R3.sparkTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .9, fog: false })); Hm.petals.frustumCulled = false; grp.add(Hm.petals); Hm.pn = n;
    const lan = [[-140, 110, 90], [150, 150, 40], [-60, 190, 140], [110, 80, 150]]; Hm.lan = lan.map(l => { const s = R3.glowSprite(0xffc866, 30, .95); s.position.set(l[0], l[1], l[2]); grp.add(s); return s });
    Hm.ring = R3.runeDecal('#ffd978', 118, .8); Hm.ring.position.y = 3; grp.add(Hm.ring); Hm.ring2 = R3.runeDecal('#fff0b8', 78, .6); Hm.ring2.position.y = 3.4; grp.add(Hm.ring2);
    Hm.sc = sc;
  }
  const isPrim = g => { for (const k in P_) if (P_[k] === g) return true; return false };
  const lerpr = (a, t) => a[0] + (a[1] - a[0]) * t;

  function ensureHero(S) {
    const hr = S.host.HR(), key = hr.id + hr.col; if (Hm.hero && Hm.heroKey === key) return;
    if (Hm.hero) { Hm.scene.remove(Hm.hero.g); Hm.hero.g.traverse(o => { if (o.material && o.material.dispose) o.material.dispose() }) }
    Hm.hero = R3.buildHero(hr.id, hr.col); Hm.heroKey = key; Hm.hero.g.scale.setScalar(1.55); Hm.scene.add(Hm.hero.g);
  }
  function heroPose(S, dt) {
    const r = Hm.hero, t = Hm.t; if (!r) return;
    const hh = $('#hhero'); const atk = hh && hh.classList.contains('atk'); if (atk && !Hm.tapOn) { Hm.tapOn = 1; Hm.tapT = 0 } if (!atk) Hm.tapOn = 0; if (Hm.tapOn) Hm.tapT += dt;
    r.g.position.set(0, 0, 0); r.g.rotation.y = lerp(r.g.rotation.y, .35 + Hm.px * .35, M.min(1, dt * 3));
    let aR = -.25 + M.sin(t * 1.6) * .03, aL = .12 + M.sin(t * 1.6 + 1) * .03, wpx = 1.2, tw = 0, yy = M.sin(t * 1.8) * .7;
    if (Hm.tapOn && Hm.tapT < .7) { const k = Hm.tapT / .7; if (k < .3) { aR = lerp(-.25, -2.5, k / .3); tw = .5 * k / .3 } else { const u = 1 - (1 - (k - .3) / .7) ** 2; aR = lerp(-2.5, -.4, u); tw = .5 - 1.0 * u; wpx = 1.2 + .5 * u } yy += M.sin(k * PI) * 3 }
    r.hip.position.y = 20 + yy; r.legL.rotation.x = r.legR.rotation.x = 0; r.tor.rotation.set(M.sin(t * 1.8) * .015, tw, 0); r.armR.rotation.x = lerp(r.armR.rotation.x, aR, .25); r.armL.rotation.x = lerp(r.armL.rotation.x, aL, .25); r.armR.rotation.z = -.12; r.armL.rotation.z = .12; r.wp.rotation.x = wpx;
    if (r.cape) r.cape.rotation.x = .2 + M.sin(t * 2.2) * .08; if (r.hair) r.hair.rotation.x = PI - .25 + M.sin(t * 2.6) * .1;
    r.aura.visible = false; r.glow.material.opacity = .22 + .06 * M.sin(t * 2); r.orbs.forEach((o, i) => { const a = t * 1.1 + i * TAU / 5, rr = 24 + M.sin(t + i) * 4; o.position.set(M.cos(a) * rr, 6 + ((t * 14 + i * 12) % 62), M.sin(a) * rr); o.material.opacity = .85 * M.sin(((t * 14 + i * 12) % 62) / 62 * PI) });
  }
  const $ = s => document.querySelector(s);

  function frame(ts) {
    if (!Hm.on) return; Hm.raf = requestAnimationFrame(frame); if (R3.mapOn) return;
    const S = R3.S; if (ts - Hm.lastCheck > 500) { Hm.lastCheck = ts; const open = document.querySelectorAll('.scr.on').length; const menu = $('#menu'); Hm.paused = !menu || !menu.classList.contains('on') || open > 1 || document.hidden; if (Hm.hue !== Hm.wantHue && Hm.wantHue != null) build(Hm.wantHue, S); ensureHero(S); layout() }
    if (Hm.paused) { Hm.last = ts; return }
    if (S.q === 0 && (ts - Hm.last) < 30) return;
    const dt = M.min(.05, (ts - Hm.last) / 1000 || .016); Hm.last = ts; Hm.t += dt;
    const el = S.host.cv, W = el.clientWidth || 360, H = el.clientHeight || 640; if (W !== Hm.W || H !== Hm.H) { Hm.W = W; Hm.H = H; S.ren.setSize(W, H, false); Hm.cam.aspect = W / H; Hm.cam.updateProjectionMatrix(); layout() }
    Hm.px = lerp(Hm.px, Hm.tpx, M.min(1, dt * 3)); Hm.py = lerp(Hm.py, Hm.tpy, M.min(1, dt * 3));
    const az = Hm.px * .22 + M.sin(Hm.t * .1) * .05, d = Hm.dist || 400;
    Hm.cam.position.set(M.sin(az) * d, 70 + Hm.py * 18, M.cos(az) * d); Hm.cam.lookAt(0, 48, 0); if (Hm.dbg) { Hm.cam.position.set(...Hm.dbg); Hm.cam.lookAt(0, 120, 0) }
    heroPose(S, dt);
    for (const c of Hm.clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 1300) c.position.x = -1300 }
    if (Hm.fall) Hm.fall.material.map.offset.y -= dt * 1.6;
    if (Hm.petals) { const a = Hm.petals.geometry.attributes.position.array; for (let i = 0; i < Hm.pn; i++) { a[i * 3] += M.sin(Hm.t + i) * 6 * dt - 10 * dt; a[i * 3 + 1] -= (14 + (i % 5) * 4) * dt; if (a[i * 3 + 1] < -10) { a[i * 3 + 1] = 420; a[i * 3] = (R() - .5) * 700 } if (a[i * 3] < -380) a[i * 3] = 380 } Hm.petals.geometry.attributes.position.needsUpdate = true }
    Hm.ring.rotation.y = Hm.t * .5; Hm.ring2.rotation.y = -Hm.t * .8; Hm.lan.forEach((l, i) => { l.position.y += M.sin(Hm.t * 1.2 + i) * .15; l.material.opacity = .8 + .15 * M.sin(Hm.t * 3 + i * 2) });
    S.ren.render(Hm.scene, Hm.cam);
  }
  /* đặt nhân vật 3D đúng vị trí khung #hstage của giao diện 2D (lệch điểm chính của camera) */
  function layout() {
    const st = $('#hstage'), el = R3.S.host.cv; if (!st || !Hm.W) return; const a = st.getBoundingClientRect(), b = el.getBoundingClientRect();
    const tx = a.left + a.width / 2 - b.left, ty = a.top + a.height * .5 - b.top, dx = Hm.W / 2 - tx, dy = Hm.H / 2 - ty;
    Hm.stH = a.height; Hm.dist = M.max(260, M.min(900, Hm.H * 88 / (2 * M.tan(20 * PI / 180) * .66 * M.max(60, a.height))));
    Hm.cam.setViewOffset(Hm.W, Hm.H, dx, dy, Hm.W, Hm.H); Hm.cam.updateProjectionMatrix();
  }
  R3.homeLayout = () => { if (Hm.on) layout() };

  R3.homeBegin = function () {
    if (!R3.enabled()) return false; const S = R3.S; if (!R3.initOK()) return false;
    if (Hm.on) { return true }
    if (!Hm.built) {
      Hm.built = true; const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      Hm.scene = new T.Scene(); Hm.cam = new T.PerspectiveCamera(40, 1, 5, 6000);
      Hm.hemi = new T.HemisphereLight(0xaab8ff, 0x302040, 1); Hm.sun = new T.DirectionalLight(0xffd9a0, 2); Hm.sun.position.set(220, 360, 240); Hm.rim = new T.DirectionalLight(0x8a7aff, .6); Hm.rim.position.set(-260, 200, -300);
      Hm.sun.castShadow = true; Hm.sun.shadow.mapSize.set(1024, 1024); const c = Hm.sun.shadow.camera; c.left = -260; c.right = 260; c.top = 260; c.bottom = -260; c.near = 50; c.far = 1200; Hm.sun.shadow.bias = -.001;
      Hm.scene.add(Hm.hemi, Hm.sun, Hm.rim);
      addEventListener('pointermove', e => { if (!Hm.on) return; Hm.tpx = (e.clientX / innerWidth - .5) * 2; Hm.tpy = (e.clientY / innerHeight - .5) * 2 }, { passive: true });
      addEventListener('resize', () => { Hm.W = 0 });
    }
    S.q = S.host.Q(); S.ren.setPixelRatio(M.min(window.devicePixelRatio || 1, [1, 1.5, 2][S.q])); S.ren.toneMapping = T.ACESFilmicToneMapping; S.ren.toneMappingExposure = .95; S.ren.shadowMap.enabled = S.q > 0; S.ren.shadowMap.type = T.PCFSoftShadowMap; Hm.sun.castShadow = S.q > 0;
    S.cv.style.display = 'block'; S.host.cv.style.background = 'transparent'; const menu = $('#menu'); if (menu) menu.classList.add('r3');
    S.ren.setClearColor(0x0b1020); build(Hm.wantHue != null ? Hm.wantHue : 30, S); Hm.hero = null; Hm.heroKey = ''; ensureHero(S);
    Hm.on = true; Hm.W = 0; Hm.last = performance.now(); Hm.raf = requestAnimationFrame(frame); return true;
  };
  R3.homeEnd = function () {
    if (!Hm.on) return; Hm.on = false; cancelAnimationFrame(Hm.raf); const menu = $('#menu'); if (menu) menu.classList.remove('r3');
    if (Hm.cam) Hm.cam.clearViewOffset();
    if (Hm.hero) { Hm.scene.remove(Hm.hero.g); Hm.hero = null; Hm.heroKey = '' }
    if (Hm.grp) { Hm.scene.remove(Hm.grp); Hm.grp.traverse(o => { if (o.geometry && !isPrim(o.geometry)) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose() }); Hm.grp = null; Hm.hue = -1 }
    const S = R3.S; if (S.cv && !S.on) S.cv.style.display = 'none'; if (S.host && S.host.cv && !S.on) S.host.cv.style.background = '';
  };
  // hue của chương đang chọn (do DV_HOME.sync truyền vào)
  if (window.DV_HOME && DV_HOME.sync && !DV_HOME.__r3) { DV_HOME.__r3 = 1; const o = DV_HOME.sync; DV_HOME.sync = function (d) { if (d && d.hue != null) Hm.wantHue = d.hue; const r = o.apply(this, arguments); if (Hm.on) { Hm.W = 0 } return r } }
})();
