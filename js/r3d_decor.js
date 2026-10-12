/* Phase 19 — PHỦ CẢNH MÀN CHƠI 3D (module của DV_R3D)
   Lớp cỏ/hoa/tinh thể/nấm/than hồng nhỏ phủ quanh người chơi, đung đưa theo gió (shader), đổi kiểu theo chủ đề màn (E.tk, màu theo hue nền).
   Lưới ô cố định theo thế giới (ô 96px, bán kính ~10 ô), tái sử dụng ô khi người chơi di chuyển → luôn đúng chỗ, không tốn thêm khi đứng yên.
   Tránh vùng nước/dung nham. Mức chất lượng Thấp: tắt; Vừa: ít; Cao: dày + vật thể phát sáng. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T) return;
  const M = Math, PI = M.PI, CELL = 96, NR = 10, NN = NR * 2 + 1;
  const D = { grp: null, blades: null, acc: null, key: '', cells: null, uT: { value: 0 }, K: 0, kind: null };
  const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + (c || 0) * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 };
  const hsl = (h, s, l) => new T.Color().setHSL(((h % 360) + 360) % 360 / 360, M.max(0, M.min(1, s)), M.max(0, M.min(1, l)));

  /* hình khối */
  function tuftGeo(tall, n) {   // chùm lá: n lá cong, mỗi lá là 1 tam giác thon
    const pos = [], idx = []; let v = 0;
    for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + i * .7, c = M.cos(a), s = M.sin(a), h = tall * (.7 + .3 * ((i * 37) % 5) / 4), w = tall * .12, lean = tall * .25;
      pos.push(-c * w * 0 + s * w, 0, -c * w, -s * w, 0, c * w, c * lean, h, s * lean); idx.push(v, v + 1, v + 2, v + 2, v + 1, v); v += 3 }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function crystalGeo(h) { const g = new T.OctahedronGeometry(1, 0); g.scale(h * .22, h * .5, h * .22); g.translate(0, h * .5, 0); return g }
  function flowerGeo(h) { const st = new T.CylinderGeometry(.5, .5, h, 4); st.translate(0, h / 2, 0); const hd = new T.IcosahedronGeometry(h * .22, 0); hd.translate(0, h, 0); return T.BufferGeometryUtils.mergeGeometries([st, hd].map(g => { const c = g.index ? g.toNonIndexed() : g; c.deleteAttribute('uv'); return c })) }
  function mushGeo(h) { const st = new T.CylinderGeometry(h * .06, h * .09, h * .6, 5); st.translate(0, h * .3, 0); const cap = new T.SphereGeometry(h * .28, 7, 4, 0, PI * 2, 0, PI / 2); cap.translate(0, h * .6, 0); return T.BufferGeometryUtils.mergeGeometries([st, cap].map(g => { const c = g.index ? g.toNonIndexed() : g; c.deleteAttribute('uv'); return c })) }
  function rockGeo(h) { const g = new T.DodecahedronGeometry(h * .3, 0); g.scale(1.3, .7, 1); g.translate(0, h * .15, 0); return g }

  /* cấu hình theo chủ đề */
  function pick(E, th) {
    const tk = E.tk || '', h = th.h, s = th.s / 100, l = th.l / 100;
    const base = { blade: [h + 28, M.max(.42, s * 1.1), l * 1.25 + .1], bv: 22, tall: 12, n: 4, acc: 'flower', ac: [[330, .6, .75], [50, .8, .65], [0, 0, .95]], glow: 0, dens: 1 };
    if (/snow|ice/.test(tk)) return Object.assign(base, { blade: [200, .25, .78], bv: 8, tall: 11, acc: 'crystal', ac: [[195, .8, .75], [210, .6, .85]], glow: .5, dens: .8 });
    if (/volcano|lava/.test(tk)) return Object.assign(base, { blade: [10, .45, .12], bv: 10, tall: 12, acc: 'rock', ac: [[18, 1, .5], [30, 1, .55]], glow: 1.2, dens: .9 });
    if (/heaven/.test(tk)) return Object.assign(base, { blade: [45, .55, .6], bv: 10, tall: 14, acc: 'crystal', ac: [[45, 1, .75], [330, .7, .85]], glow: .8 });
    if (/void|shadow/.test(tk)) return Object.assign(base, { blade: [265, .4, .22], bv: 20, tall: 17, acc: 'crystal', ac: [[275, .9, .6], [300, .8, .6]], glow: 1.1, dens: .9 });
    if (/cave/.test(tk)) return Object.assign(base, { blade: [255, .25, .2], bv: 15, tall: 10, acc: 'mush', ac: [[180, .9, .6], [200, .9, .65]], glow: 1, dens: .7 });
    if (/swamp/.test(tk)) return Object.assign(base, { blade: [78, .45, .24], bv: 14, tall: 22, n: 4, acc: 'mush', ac: [[85, .9, .6], [60, .9, .6]], glow: .7 });
    if (/river|sea|water/.test(tk)) return Object.assign(base, { blade: [95, .4, .33], bv: 12, tall: 20, n: 4, acc: 'flower', ac: [[200, .6, .85], [330, .5, .85]] });
    if (/sand|desert/.test(tk)) return Object.assign(base, { blade: [42, .4, .45], bv: 8, tall: 10, acc: 'rock', ac: [[35, .35, .45]], glow: 0, dens: .5 });
    return base;
  }

  function clear() {
    if (D.grp) { D.grp.parent && D.grp.parent.remove(D.grp); D.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose() }) }
    D.grp = D.blades = D.acc = null; D.cells = null; D.key = '';
  }
  function sway(mat) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.uT = D.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat sw=position.y*.07;transformed.x+=sin(uT*1.7+instanceMatrix[3].x*.031+instanceMatrix[3].z*.017)*sw*3.2;transformed.z+=cos(uT*1.4+instanceMatrix[3].z*.029)*sw*2.4;');
    };
  }
  function build(S) {
    clear(); const q = S.q; if (q < 1) return; const E = S.E, th = S.theme, cfg = pick(E, th); D.cfg = cfg; D.K = q > 1 ? 5 : 3; const nc = NN * NN;
    D.grp = new T.Group(); D.grp.frustumCulled = false;
    const bm = new T.MeshLambertMaterial({ color: 0xffffff, side: T.DoubleSide }); sway(bm);
    D.blades = new T.InstancedMesh(tuftGeo(cfg.tall, cfg.n), bm, nc * D.K); D.blades.frustumCulled = false; D.blades.receiveShadow = false;
    D.blades.instanceMatrix.setUsage(T.DynamicDrawUsage);
    const ag = cfg.acc === 'crystal' ? crystalGeo(cfg.tall * 1.2) : cfg.acc === 'mush' ? mushGeo(cfg.tall * 1.3) : cfg.acc === 'rock' ? rockGeo(cfg.tall) : flowerGeo(cfg.tall * .9);
    const am = new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 }); if (cfg.acc === 'flower') sway(am);
    D.acc = new T.InstancedMesh(ag, am, nc); D.acc.frustumCulled = false; D.acc.instanceMatrix.setUsage(T.DynamicDrawUsage);
    const zero = new T.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < nc * D.K; i++) { D.blades.setMatrixAt(i, zero); D.blades.setColorAt(i, new T.Color(1, 1, 1)) } for (let i = 0; i < nc; i++) { D.acc.setMatrixAt(i, zero); D.acc.setColorAt(i, new T.Color(1, 1, 1)) }
    D.grp.add(D.blades, D.acc); S.world.add(D.grp); D.cells = new Int32Array(nc * 2).fill(1e9); D.key = (E.tk || '') + '|' + (E.hue | 0) + '|' + q; D.cx = D.cz = 1e9;
    D.emis = cfg.glow; D.m = new T.Matrix4(); D.pos = new T.Vector3(); D.quat = new T.Quaternion(); D.sc = new T.Vector3(); D.eul = new T.Euler(); D.col = new T.Color();
  }
  function fillCell(S, ci, cj, slot) {
    const cfg = D.cfg, th = S.theme, ENV = S.host.ENV, K = D.K, q = S.q;
    for (let k = 0; k < K; k++) {
      const i = slot * K + k, r1 = hash(ci, cj, k * 3 + 1), r2 = hash(ci, cj, k * 3 + 2), r3 = hash(ci, cj, k * 3 + 3), x = (ci + r1) * CELL, z = (cj + r2) * CELL;
      const zk = ENV ? ENV.zoneAt(x, z) : 0; if ((zk === 'water' || zk === 'lava') || r3 > cfg.dens) { D.m.makeScale(0, 0, 0); D.blades.setMatrixAt(i, D.m); continue }
      const sc = .7 + r3 * .9; D.pos.set(x, R3.height(x, z) - .5, z); D.quat.setFromEuler(D.eul.set(0, r1 * 6.28, 0)); D.sc.set(sc, sc * (.8 + r2 * .6), sc); D.m.compose(D.pos, D.quat, D.sc); D.blades.setMatrixAt(i, D.m);
      const b = cfg.blade; D.col.copy(hsl(b[0] + (r2 - .5) * cfg.bv, b[1], b[2] + (r1 - .5) * .12)); D.blades.setColorAt(i, D.col);
    }
    const ra = hash(ci, cj, 77), rb = hash(ci, cj, 91), rc = hash(ci, cj, 55), a = D.acc;
    if (ra < (q > 1 ? .55 : .3) && q >= 1) {
      const x = (ci + rb) * CELL, z = (cj + rc) * CELL, zk = ENV ? ENV.zoneAt(x, z) : 0;
      if (zk === 'water' || zk === 'lava') { D.m.makeScale(0, 0, 0); a.setMatrixAt(slot, D.m) } else {
        const sc = .8 + rc * .9; D.pos.set(x, R3.height(x, z) - .3, z); D.quat.setFromEuler(D.eul.set((rb - .5) * .3, rc * 6.28, (ra - .5) * .3)); D.sc.set(sc, sc, sc); D.m.compose(D.pos, D.quat, D.sc); a.setMatrixAt(slot, D.m);
        const c = cfg.ac[(rc * cfg.ac.length) | 0]; D.col.copy(hsl(c[0], c[1], c[2])); a.setColorAt(slot, D.col)
      }
    } else { D.m.makeScale(0, 0, 0); a.setMatrixAt(slot, D.m) }
  }
  function sync(S, force) {
    const P = S.G && S.G.p; if (!P || !D.blades) return; const ci = M.floor(P.x / CELL), cj = M.floor(P.y / CELL); if (!force && ci === D.cx && cj === D.cz) return; D.cx = ci; D.cz = cj; let ch = 0;
    for (let a = -NR; a <= NR; a++) for (let b = -NR; b <= NR; b++) {
      const gi = ci + a, gj = cj + b, sx = ((gi % NN) + NN) % NN, sz = ((gj % NN) + NN) % NN, slot = sx * NN + sz;
      if (D.cells[slot * 2] === gi && D.cells[slot * 2 + 1] === gj) continue; D.cells[slot * 2] = gi; D.cells[slot * 2 + 1] = gj; fillCell(S, gi, gj, slot); ch++;
    }
    if (ch) { D.blades.instanceMatrix.needsUpdate = true; if (D.blades.instanceColor) D.blades.instanceColor.needsUpdate = true; D.acc.instanceMatrix.needsUpdate = true; if (D.acc.instanceColor) D.acc.instanceColor.needsUpdate = true }
  }
  R3.reg({
    init() { },
    begin(S, G) { D.key = ''; clear() },
    update(S, G, dt) {
      if (S.q < 1) { if (D.grp) clear(); return } const key = (S.E.tk || '') + '|' + (S.E.hue | 0) + '|' + S.q;
      if (key !== D.key || !D.grp) { build(S); if (!D.blades) return; sync(S, true) } else sync(S, false);
      D.uT.value = S.t; const e = D.emis || 0; if (D.acc) D.acc.material.emissiveIntensity = e * (S.tod === 'day' ? .45 : 1) * (S.q > 1 ? 1 : .7); if (D.acc && e) D.acc.material.emissive.setHex(0xffffff);
    },
    end(S) { clear() }
  });
})();
