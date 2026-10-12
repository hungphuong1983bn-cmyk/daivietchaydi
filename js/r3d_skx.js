/* Phase 19 — HIỆU ỨNG 3D CHO VÕ CÔNG MỞ RỘNG (module của DV_R3D, dùng bộ dựng của r3d_fx.js qua DV_R3D.F)
   Đọc G.skx (thực thể sống lâu của js/skills_ext.js) và G.skxe (sự kiện một lần). Mỗi thực thể có mesh riêng dựng bằng hình khối 3D + vật liệu cộng sáng;
   mesh tạo khi thực thể xuất hiện, cập nhật mỗi khung, giải phóng khi thực thể hết hạn. Không có dữ liệu game nào bị sửa ở đây. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T || !R3.F) return;
  const F = R3.F, M = Math, PI = M.PI, TAU = PI * 2, R = Math.random;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const H = (x, y) => R3.height(x, y);
  const V = new Map();   // thực thể → {grp, upd}
  let lathe = null;
  const Q = () => F.S ? F.S.q : 1;
  const mesh = (geo, col, op, map) => new T.Mesh(geo, F.addM(col, op, map));
  const nmesh = (geo, col, op) => new T.Mesh(geo, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, fog: false }));

  /* ---------- dựng từng loại ---------- */
  function mkFire(o) {
    const g = F.geos(), grp = new T.Group(), body = mesh(g.sph, 0xff8a2a, .95); body.scale.setScalar(6); grp.add(body);
    const core = mesh(g.sph, 0xfff1b0, 1); core.scale.setScalar(3.2); grp.add(core);
    const wings = []; for (const s of [-1, 1]) { const w = mesh(g.petal, o.evo ? 0xffe27a : 0xff5a1a, .85); w.scale.set(16, 16, 16); w.rotation.y = s * PI / 2; w.position.x = s * 3; grp.add(w); wings.push([w, s]) }
    const tail = mesh(g.cone, 0xff6a2a, .7); tail.rotation.x = -PI / 2; tail.scale.set(5, 44, 5); grp.add(tail);
    const tail2 = mesh(g.cone, 0xffd070, .7); tail2.rotation.x = -PI / 2; tail2.rotation.z = .25; tail2.scale.set(3, 30, 3); grp.add(tail2);
    grp.add(R3.glowSprite(0xff7a2a, o.evo ? 90 : 64, .85));
    return { grp, upd(o, dt, S) {
      grp.position.set(o.x, H(o.x, o.y) + 24 + M.sin(o.t * 8) * 3, o.y); grp.rotation.y = M.atan2(M.cos(o.a), M.sin(o.a));
      for (const [w, s] of wings) w.rotation.z = s * M.sin(o.t * 18) * .7;
      if (Q()) { F.burst(o.x, o.y, 22, 1, 30, .45, R() < .5 ? '#ff9a3a' : '#ffd070', 20, -10) }
    } };
  }
  function mkZone(o) {
    const g = F.geos(), grp = new T.Group(), stake = o.st === 'stake', ice = o.st === 'ice' || stake, col = o.col || (stake ? '#c9a070' : ice ? '#8fe4ff' : '#7aff6a');
    const rune = R3.runeDecal(stake ? '#d9b070' : o.col ? o.col : ice ? '#3a9ae8' : col, 1, .85); grp.add(rune); const disc = nmesh(g.disc, stake ? 0x8a6a3a : o.col ? new T.Color(o.col).multiplyScalar(.6) : ice ? 0x3a8ad8 : 0x2a8a2a, .3); disc.position.y = .6; grp.add(disc);
    const parts = [];
    const n = stake ? 26 : ice ? 16 : 9;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + R() * .3, rr = ice ? .55 + R() * .4 : R() * .8, h = ice ? 14 + R() * 30 : 5 + R() * 7;
      const m = ice ? nmesh(g.cone, stake ? (i % 2 ? 0x9a7a4a : 0xc9a070) : o.col ? new T.Color(o.col).lerp(new T.Color(0xffffff), i % 3 ? .2 : .7) : i % 3 ? 0x7ac8f8 : 0xdff4ff, .85) : nmesh(g.sph, i % 2 ? 0x4ac83a : 0x8aff70, .6);
      m.userData = { a, rr, h, ph: R() * 6 }; if (ice) m.rotation.set((R() - .5) * .3, 0, (R() - .5) * .3); grp.add(m); parts.push(m)
    }
    if (!ice) for (let i = 0; i < 5; i++) { const c = R3.glowSprite(0x2aca3a, 110, .5); c.userData = { a: R() * TAU, rr: R() * .6, ph: R() * 6, cloud: 1 }; grp.add(c); parts.push(c) }
    return { grp, upd(o, dt, S) {
      const u = o.t / o.T, fade = clamp(M.min(o.t / .35, (1 - u) / .2), 0, 1), r = o.r; grp.position.set(o.x, H(o.x, o.y) + 1.5, o.y);
      rune.scale.set(r * 1.05, 1, r * 1.05); rune.rotation.y = o.t * (ice ? .3 : -.2); rune.material.opacity = .85 * fade; disc.scale.set(r, 1, r); disc.material.opacity = .3 * fade;
      for (const m of parts) { const d = m.userData, ax = M.cos(d.a + (d.cloud ? o.t * .3 : 0)) * d.rr * r, az = M.sin(d.a + (d.cloud ? o.t * .3 : 0)) * d.rr * r;
        if (ice) { const k = clamp(o.t * 3 - d.a * .1, 0, 1) * fade; m.position.set(ax, 0, az); m.scale.set(4 + d.h * .12, d.h * k, 4 + d.h * .12); m.material.opacity = .85 * fade }
        else if (d.cloud) { m.position.set(ax, 14 + M.sin(o.t + d.ph) * 4, az); m.material.opacity = .3 * fade } else { m.position.set(ax, ((o.t * 14 + d.ph * 9) % 40), az); const s = d.h * (1 - ((o.t * 14 + d.ph * 9) % 40) / 50); m.scale.setScalar(M.max(1, s)); m.material.opacity = .55 * fade } }
      if (Q() && R() < dt * 14) { const a = R() * TAU, rr = M.sqrt(R()) * r; F.burst(o.x + M.cos(a) * rr, o.y + M.sin(a) * rr, 6, 1, 10, ice ? .9 : .7, ice ? '#e6fbff' : '#8aff70', ice ? 30 : 50, ice ? -20 : -35) }
    } };
  }
  function mkTwr(o) {
    const g = F.geos(), grp = new T.Group(), rings = [], N = 7; const tg = new T.TorusGeometry(1, .09, 6, 28); tg.rotateX(PI / 2);
    for (let i = 0; i < N; i++) { const m = new T.Mesh(tg, F.addM(i % 2 ? 0xe6faff : 0x9ad8ff, .55)); m.userData = { i }; grp.add(m); rings.push(m) }
    const core = mesh(g.cyl, 0xcfeeff, .16); grp.add(core); const base = R3.glowSprite(0xbfe8ff, 150, .4); grp.add(base);
    return { grp, upd(o, dt, S) {
      const r = o.r, fade = clamp(M.min(o.t / .3, (o.T - o.t) / .5), 0, 1); grp.position.set(o.x, H(o.x, o.y), o.y);
      rings.forEach((m, i) => { const k = i / (N - 1), rr = r * (.28 + .78 * k); m.position.set(M.sin(o.t * 3 + i) * 4, 4 + k * r * 1.5, M.cos(o.t * 3 + i) * 4); m.scale.set(rr, rr, rr); m.rotation.y = o.t * (4 + i * .8); m.material.opacity = .55 * fade });
      core.scale.set(r * .55, r * 1.6, r * .55); core.material.opacity = .16 * fade; base.position.y = 6; base.material.opacity = .4 * fade;
      if (Q() && R() < dt * 30) { const a = R() * TAU; F.burst(o.x + M.cos(a) * r * .7, o.y + M.sin(a) * r * .7, 4 + R() * 60, 1, 60, .6, '#dff6ff', 120, -30) }
    } };
  }
  function mkMet(o) {
    const g = F.geos(), grp = new T.Group(), tele = mesh(g.ring, 0xff5a2a, .9), disc = mesh(g.disc, 0xff4a1a, .18), rune = R3.runeDecal('#ff7a3a', 1, .6);
    const ball = new T.Group(); const rock = new T.Mesh(g.oct, new T.MeshBasicMaterial({ color: 0xffa050, fog: false })); rock.scale.setScalar(13); ball.add(rock); const core = mesh(g.sph, 0xfff0c0, .9); core.scale.setScalar(9); ball.add(core);
    const tail = mesh(g.cone, 0xff6a2a, .6); tail.scale.set(11, 120, 11); ball.add(tail); ball.add(R3.glowSprite(0xff8a3a, 110, .85)); grp.add(tele, disc, rune, ball);
    return { grp, upd(o, dt, S) {
      const f = clamp(1 - o.t / o.T, 0, 1), r = o.r; grp.position.set(o.x, H(o.x, o.y) + 1.6, o.y);
      const s = r * (.35 + .65 * (1 - f)); tele.scale.set(r, 1, r); disc.scale.set(r * (1 - f * .5), 1, r * (1 - f * .5)); disc.material.opacity = .1 + .22 * (1 - f); rune.scale.set(s, 1, s); rune.rotation.y = o.t * 3;
      ball.position.set(-(o.ox || 0) * f, 14 + 380 * f * f + 20 * f, 0); ball.rotation.y += dt * 5; tele.material.opacity = .5 + .5 * M.sin(o.t * 24);
      const tdir = new T.Vector3(o.ox || 0, 380, 0).normalize(); tail.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tdir); tail.position.set(0, 0, 0);
      if (Q() && R() < .8) F.burst(o.x - (o.ox || 0) * f, o.y, 14 + 380 * f * f, 1, 25, .5, '#ff9a3a', 10, -20);
    } };
  }
  function mkSwd(o) {
    const g = F.geos(), grp = new T.Group(), sw = new T.Group();
    const blade = mesh(g.cone, 0xfff0c0, .95); blade.rotation.x = PI; blade.position.y = 130; blade.scale.set(11, 130, 3); sw.add(blade);
    const edge = mesh(g.cone, 0xffd070, .55); edge.rotation.x = PI; edge.position.y = 130; edge.scale.set(16, 134, 6); sw.add(edge);
    const guard = mesh(g.box, 0xe8b84a, 1); guard.position.y = 136; guard.scale.set(36, 5, 6); sw.add(guard); const grip = mesh(g.cylS, 0xb04030, 1); grip.position.y = 138; grip.scale.set(3.5, 40, 3.5); sw.add(grip);
    const halo = R3.glowSprite(0xffd070, 150, .7); halo.position.y = 90; sw.add(halo); const tele = mesh(g.ring, 0xffd070, .9), rune = R3.runeDecal('#ffd070', 1, .8); grp.add(sw, tele, rune);
    return { grp, upd(o, dt, S) {
      const f = clamp(1 - o.t / o.T, 0, 1), r = o.r; grp.position.set(o.x, H(o.x, o.y) + 1.5, o.y); sw.position.y = 520 * f * f; sw.rotation.y = o.t * 6;
      tele.scale.set(r, 1, r); tele.material.opacity = .4 + .6 * (1 - f); rune.scale.set(r * (.4 + .6 * (1 - f)), 1, r * (.4 + .6 * (1 - f))); rune.rotation.y = -o.t * 2; halo.material.opacity = .4 + .5 * (1 - f);
      if (Q() && R() < .7) F.burst(o.x, o.y, 520 * f * f + 60, 1, 20, .4, '#ffe9a0', 0, 0);
    } };
  }
  function mkBld(o) {
    const g = F.geos(), grp = new T.Group(); const c = new T.Mesh(g.crescent, F.addM(o.ev ? 0xffe9a0 : 0xffd8ee, .95)); c.rotation.set(-PI / 2, 0, -PI / 2 - 1.05); c.scale.setScalar(12); grp.add(c);
    const c2 = new T.Mesh(g.crescent, F.addM(o.ev ? 0xffa030 : 0xff7ab8, .5)); c2.rotation.copy(c.rotation); c2.scale.setScalar(16); grp.add(c2); grp.add(R3.glowSprite(o.ev ? 0xffd070 : 0xff9ac8, 34, .6));
    return { grp, upd(o, dt, S) { const f = clamp((o.T - o.t) / .25, 0, 1); grp.position.set(o.x, H(o.x, o.y) + 22, o.y); grp.rotation.y = M.atan2(M.cos(o.a), M.sin(o.a)); grp.scale.setScalar((.7 + .5 * f) * (o.sc || 1)); if (Q() && R() < .5) F.burst(o.x, o.y, 22, 1, 20, .35, '#ffc0e0', 10, 0) } };
  }
  function mkDome(o) {
    const g = F.geos(), grp = new T.Group();
    if (!lathe) { const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14; pts.push(new T.Vector2(M.sin(k * 1.5) * (1 - k * .15) * 1.0 + .06, (1 - k) * 1.25 - .1 + (k > .9 ? .05 : 0))) } lathe = new T.LatheGeometry(pts, 24) }
    const dc = o.col != null ? o.col : 0xffd070, bell = new T.Mesh(lathe, F.addM(dc, .32, null, T.DoubleSide)); bell.scale.set(46, 46, 46); bell.position.y = 6; grp.add(bell);
    const shell = new T.Mesh(g.sph, F.addM(0xffe9a0, .12, null, T.BackSide)); shell.scale.set(52, 40, 52); shell.position.y = 22; grp.add(shell);
    const hx = '#' + new T.Color(dc).getHexString(), r1 = R3.runeDecal(hx, 60, .8), r2 = R3.runeDecal('#fff0b0', 40, .6); grp.add(r1, r2);
    return { grp, upd(o, dt, S) {
      const fade = clamp(M.min(o.t / .2, (o.T - o.t) / .3), 0, 1), P = F.G ? F.G.p : null; grp.position.set(o.x, H(o.x, o.y) + 2, o.y); bell.rotation.y = o.t * 1.5; bell.material.opacity = .32 * fade; shell.material.opacity = .12 * fade; shell.scale.y = 40 + M.sin(o.t * 6) * 2;
      r1.rotation.y = o.t * .9; r2.rotation.y = -o.t * 1.4; r1.material.opacity = .8 * fade; r2.material.opacity = .6 * fade;
    } };
  }
  function mkShrine(o) {
    const g = F.geos(), grp = new T.Group(), r1 = R3.runeDecal('#7dff9a', 1, .85), r2 = R3.runeDecal('#ffe9a0', 1, .6); grp.add(r1, r2);
    const pil = mesh(g.cyl, 0x9dffb5, .3, F.beamTex()); grp.add(pil); const pet = []; for (let i = 0; i < 8; i++) { const p = mesh(g.petal, i % 2 ? 0xfff1b0 : 0x9dffb5, .7); p.rotation.y = i / 8 * TAU; p.rotation.x = -.35; grp.add(p); pet.push(p) }
    const gl = R3.glowSprite(0x9dffb5, 200, .35); gl.position.y = 20; grp.add(gl);
    return { grp, upd(o, dt, S) {
      const fade = clamp(M.min(o.t / .6, (o.T - o.t) / 1), 0, 1), r = o.r; grp.position.set(o.x, H(o.x, o.y) + 1.8, o.y);
      r1.scale.set(r, 1, r); r1.rotation.y = o.t * .5; r1.material.opacity = .85 * fade; r2.scale.set(r * .62, 1, r * .62); r2.rotation.y = -o.t * .9; r2.material.opacity = .6 * fade;
      pil.scale.set(16, 150 * fade, 16); pil.material.opacity = .3 * fade; pet.forEach((p, i) => { const k = r * .32 * (.9 + .1 * M.sin(o.t * 2 + i)); p.scale.set(k * .5, k, k); p.rotation.y = i / 8 * TAU + o.t * .4 });
      gl.material.opacity = .35 * fade; if (Q() && R() < dt * 10) F.burst(o.x + (R() - .5) * r, o.y + (R() - .5) * r, 6, 1, 8, 1.2, '#b8ffc8', 50, -15);
    } };
  }
  function mkWave(o) {
    const g = F.geos(), grp = new T.Group(); for (let i = 0; i < 3; i++) { const c = new T.Mesh(g.crescent, F.addM(i ? 0x7ad8ff : 0xe6fbff, i ? .6 : .9)); c.rotation.set(-PI / 2, 0, -PI / 2 - 1.05); c.scale.setScalar(o.r * (1 - i * .18)); c.position.z = -i * 14; c.position.y = 6 + i * 3; grp.add(c) } grp.add(R3.glowSprite(0x6ac8ff, 160, .35));
    return { grp, upd(o, dt, S) { grp.position.set(o.x, H(o.x, o.y) + 8, o.y); grp.rotation.y = M.atan2(M.cos(o.a), M.sin(o.a)); grp.scale.setScalar(.8 + .3 * M.min(1, o.t * 3)); if (Q() && R() < .8) F.burst(o.x, o.y, 8, 1, 50, .5, '#cfeeff', 60, -40) } };
  }
  function mkArw(o) {
    const g = F.geos(), grp = new T.Group(), sh = mesh(g.cone, 0xeaffd0, .95); sh.rotation.x = PI / 2; sh.scale.set(1.8, 34, 1.8); sh.position.z = -14; grp.add(sh); const tip = mesh(g.cone, 0xffffff, 1); tip.rotation.x = PI / 2; tip.scale.set(3.5, 9, 3.5); tip.position.z = 16; grp.add(tip); grp.add(R3.glowSprite(0x9dffb5, 40, .5));
    return { grp, upd(o, dt, S) { grp.position.set(o.x, H(o.x, o.y) + 22, o.y); grp.rotation.y = M.atan2(M.cos(o.a), M.sin(o.a)) } };
  }
  function mkArwf(o) {
    const g = F.geos(), grp = new T.Group(), sh = mesh(g.cone, 0xeaffd0, .95); sh.rotation.x = PI; sh.scale.set(2, 40, 2); sh.position.y = 40; grp.add(sh); const tele = mesh(g.ring, 0x9dffb5, .8); tele.scale.set(44, 1, 44); grp.add(tele);
    return { grp, upd(o, dt, S) { const f = clamp(1 - o.t / o.T, 0, 1); grp.position.set(o.x, H(o.x, o.y) + 1.5, o.y); sh.position.y = 40 + 330 * f * f; tele.material.opacity = .8 * (1 - f) } };
  }
  const MK = { wave: mkWave, arw: mkArw, arwf: mkArwf, shrine: mkShrine, fire: mkFire, zone: mkZone, twr: mkTwr, met: mkMet, swd: mkSwd, bld: mkBld, dome: mkDome };

  /* ---------- sự kiện một lần ---------- */
  function onEvent(e) {
    const x = e.x, y = e.y, r = e.r || 60;
    switch (e.e) {
      case 'ice': F.ring(x, y, r, .55, e.col || '#9fe6ff'); F.ring(x, y, r * .6, .45, '#ffffff', 1, .08); F.flashDome(x, y, r * .8, .4, e.col || '#bff0ff', .45); F.burst(x, y, 8, 22, r * 1.4, .7, e.col || '#e6fbff', 120); R3.flash(x, y, 0x9fe6ff, 4); break;
      case 'fireboom': F.boom(x, y, r); F.ring(x, y, r * .6, .5, '#ffe27a', 1, .05); F.burst(x, y, 12, 14, r * 1.6, .8, '#ffd070', 200, 120); break;
      case 'meteor': F.boom(x, y, r * 1.2); F.ring(x, y, r * 1.6, .6, '#ff5a2a'); F.flashDome(x, y, r * 1.1, .5, '#ffcf80', .6); F.burst(x, y, 6, 26, r * 2.2, .9, '#5a4a40', 140, 160); F.pillar(x, y, 190, r * .3, '#ff9a3a', .5, .7); R3.flash(x, y, 0xff9a40, 7); break;
      case 'sword': F.ring(x, y, r * 1.2, .6, '#ffe9a0'); F.ring(x, y, r * .7, .5, '#fff', 1, .06); F.ring(x, y, r * 1.8, .8, '#ffd070', 1, .12); F.pillar(x, y, 340, r * .25, '#fff0c0', .6, .9); F.flashDome(x, y, r, .55, '#ffe9a0', .65); F.burst(x, y, 10, 34, r * 2.4, .9, '#ffe9a0', 220, 160); R3.flash(x, y, 0xffe9a0, 9); break;
      case 'arc': { const sp = e.span || 2, geo = new T.RingGeometry(.78, 1, 40, 1, -(e.a || 0) - sp / 2, sp); geo.rotateX(-PI / 2); const m = new T.Mesh(geo, F.addM(F.C(e.col || "#ffffff"), .6, null, T.DoubleSide)); m.position.set(x, H(x, y) + 3, y); m.renderOrder = 5; F.put(m); let t = 0;
        F.add(dt => { t += dt; const u = clamp(t / .38, 0, 1), k = r * (.55 + .45 * F.ease(u)); m.scale.set(k, 1, k); if (e.spin) m.rotation.y = u * 6.28 * 1.5; m.material.opacity = (1 - u) * .6; if (u >= 1) { F.kill(m); geo.dispose(); return false } return true });
        F.ring(x, y, r * .9, .35, e.col || '#ffffff'); F.burst(x, y, 8, 10, r * 1.6, .4, e.col || '#ffffff', 60); break }
      case 'cmd': F.ring(x, y, r, .6, e.col || '#ffd070'); F.ring(x, y, r * .6, .5, '#ffffff', 1, .06); F.pillar(x, y, 140, r * .22, e.col || '#ffd070', .6, .6); F.burst(x, y, 6, 10, r * 1.2, .6, e.col || '#ffd070', 90); break;
      case 'trail': { const sp = R3.glowSprite(new T.Color(e.col || '#ffffff').getHex(), 60, .8); sp.position.set(x, H(x, y) + 22, y); F.put(sp); let t = -(e.d || 0); F.add(dt => { t += dt; sp.visible = t >= 0; const u = clamp(t / .35, 0, 1); sp.material.opacity = (1 - u) * .8; sp.scale.setScalar(60 * (1 - u * .4)); if (u >= 1) { F.kill(sp); return false } return true }); break }
      case 'bolt': F.bolt(x, y, r, false); break;
      case 'arrowhit': F.ring(x, y, r, .3, '#9dffb5'); F.burst(x, y, 4, 8, 90, .35, '#eaffd0', 80); break;
      case 'bloom': F.lotus(x, y, r, .8, '#ff9ac8', 10); F.ring(x, y, r * 1.3, .5, '#ffc0e0'); F.burst(x, y, 12, 14, 160, .6, '#ffc0e0', 80); break;
      case 'gong': F.ring(x, y, r, .55, '#ffd070'); F.ring(x, y, r * .6, .5, '#fff0b0', 1, .08); F.flashDome(x, y, r * .9, .45, '#ffe9a0', .5); F.burst(x, y, 12, 18, r * 1.5, .6, '#ffe9a0', 100); R3.flash(x, y, 0xffd070, 5); break;
      case 'mote': for (let i = 0; i < 6; i++) { const a = R() * TAU, rr = 8 + R() * 26; R3.emit(x + M.cos(a) * rr, y + M.sin(a) * rr, 4, 0, 0, 60 + R() * 40, 1, '#9dffb5', -10) } break;
    }
  }

  R3.reg({
    init(S) { },
    begin(S, G) { for (const v of V.values()) F.kill(v.grp); V.clear() },
    update(S, G, dt) {
      F.G = G; const L = G.skx, seen = new Set();
      if (L) for (const o of L) {
        if (o.t < 0) continue; seen.add(o); let v = V.get(o);
        if (!v) { const mk = MK[o.k]; if (!mk) continue; v = mk(o); F.put(v.grp); V.set(o, v) }
        try { v.upd(o, dt, S) } catch (er) { console.warn('[r3d skx]', o.k, er); V.delete(o); F.kill(v.grp) }
      }
      for (const [o, v] of V) if (!seen.has(o)) { F.kill(v.grp); V.delete(o) }
      const Ev = G.skxe; if (Ev && Ev.length) { for (const e of Ev) { try { onEvent(e) } catch (er) { console.warn('[r3d skx ev]', er) } } Ev.length = 0 }
    },
    end(S) { for (const v of V.values()) F.kill(v.grp); V.clear() }
  });
})();
