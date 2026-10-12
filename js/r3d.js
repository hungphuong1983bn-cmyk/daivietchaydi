/* Phase 18 — RENDERER 3D THẬT (window.DV_R3D)  ·  nền: Three.js (vendor/three.bundle.js, đóng gói sẵn để chạy offline/APK)
   LÕI: renderer WebGL, camera phối cảnh nghiêng bám người chơi, ánh sáng + sương theo buổi trong ngày, địa hình có độ cao
   (chia chunk, nạp/huỷ theo tầm nhìn), vành núi xa, chướng ngại 3D (instancing), đấu trường Boss, thời tiết.
   KHÔNG đổi logic game: chỉ ĐỌC `G` (toạ độ thế giới x,y → 3D x,z) và dữ liệu DV_ENV; game vẫn chạy đúng như bản 2D.
   Module con (đăng ký bằng R3.reg): r3d_actors.js (nhân vật/quái/Boss) · r3d_fx.js (kỹ năng, đạn, rơi đồ, cảnh báo, hạt) · r3d_home.js (màn hình chính).
   Công tắc: sv.r3d = 0 → về đồ hoạ 2D cũ · tự về 2D nếu thiết bị không có WebGL.  Gỡ hẳn: xoá các thẻ <script> r3d*.js (index.html có if(window.DV_R3D)). */
(function () {
  'use strict';
  const T = window.THREE;
  const R3 = window.DV_R3D = { ok: () => false, live: false, S: null, reg: () => { }, mods: [] };
  if (!T) { console.warn('[r3d] thiếu three.bundle.js'); return }
  const M = Math, PI = M.PI, TAU = PI * 2, R = Math.random, BG = T.BufferGeometryUtils;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
  const S = R3.S = {
    host: null, ren: null, scene: null, cam: null, cv: null, on: false, q: 1, W: 0, H: 0, dpr: 1, t: 0, last: 0,
    tx: 0, tz: 0, ty: 0, env: null, E: null, G: null, chunks: new Map(), props: new Map(), pgx: 1e9, pgy: 1e9, pt: -9,
    cfg: { tilt: 55 * PI / 180, fov: 38 }, shake: 0, camDist: 1200, theme: null, tod: 'day', mat: {}, rimC: new T.Vector2(), rimP: new T.Vector3(700, 1250, 260),
    arena: null, weather: null, fps: 60, fpsT: 0, fpsN: 0, stats: { draws: 0, tris: 0, fps: 60 }, _frameMs: 0
  };

  /* ================= 1) NHIỄU + ĐỘ CAO ĐỊA HÌNH ================= */
  const h2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 };
  function vnoise(x, y) { const ix = M.floor(x), iy = M.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v }
  function fbm(x, y) { return vnoise(x, y) * .55 + vnoise(x * 2.1 + 7, y * 2.1 + 3) * .3 + vnoise(x * 4.3 + 11, y * 4.3 + 17) * .15 }
  const WATERK = { water: 1 };
  function terrainH(x, z) {
    const amp = S.theme ? S.theme.amp : 1;
    let h = (fbm(x * .0021 + S.seed, z * .0021) - .5) * 70 * amp + (vnoise(x * .011, z * .011 + S.seed) - .5) * 9 * amp;
    return h;
  }
  R3.height = (x, z) => terrainH(x, z) + (S.waterAt ? S.waterAt(x, z) : 0);

  /* ================= 2) KHỞI TẠO RENDERER ================= */
  function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch (e) { return false } }
  let initDone = false, initFail = false;
  function init() {
    if (initDone) return !initFail; initDone = true;
    try {
      if (!webglOK()) throw new Error('no webgl');
      const app = document.getElementById('app') || document.body, cv = document.createElement('canvas');
      cv.id = 'cv3'; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none;touch-action:none';
      app.insertBefore(cv, document.getElementById('cv')); S.cv = cv;
      const q = S.host.Q();
      S.ren = new T.WebGLRenderer({ canvas: cv, antialias: q > 0, alpha: false, powerPreference: 'high-performance', stencil: false });
      S.ren.outputColorSpace = T.SRGBColorSpace;
      S.scene = new T.Scene();
      S.cam = new T.PerspectiveCamera(S.cfg.fov, 1, 20, 6000);
      S.hemi = new T.HemisphereLight(0x8a9ad0, 0x2a2030, .8); S.scene.add(S.hemi);
      S.sun = new T.DirectionalLight(0xffe2b0, 1.3); S.sun.position.set(-300, 520, 260); S.sun.castShadow = true; S.scene.add(S.sun); S.scene.add(S.sun.target);
      S.rimL = new T.DirectionalLight(0x7a6aff, .45); S.rimL.position.set(300, 220, -420); S.scene.add(S.rimL);
      S.hl = new T.PointLight(0xffd27a, 1.4, 340, 1.5); S.scene.add(S.hl);
      S.fxl = new T.PointLight(0xffe08a, 0, 520, 1.5); S.scene.add(S.fxl);
      S.world = new T.Group(); S.scene.add(S.world);
      S.terrain = new T.Group(); S.world.add(S.terrain);
      S.propsG = new T.Group(); S.world.add(S.propsG);
      S.fxG = new T.Group(); S.world.add(S.fxG);
      S.mat.ground = groundMat();
      R3.live = true; R3.ok = () => R3.live && !initFail;
      for (const m of R3.mods) if (m.init) m.init(S);
      return true;
    } catch (e) { initFail = true; R3.live = false; console.warn('[r3d] không khởi tạo được, dùng đồ hoạ 2D:', e && e.message); return false }
  }
  R3.initOK = () => init();
  R3.reg = m => { R3.mods.push(m); if (S.ren && m.init) m.init(S) };
  R3.bind = host => { S.host = host; S.seed = 0 };
  R3.enabled = () => { const sv = S.host && S.host.sv(); return !(sv && sv.r3d === 0) && !initFail && (initDone || webglOK()) };

  function applyQuality() {
    const q = S.host.Q(); S.q = q;
    S.dpr = M.min(window.devicePixelRatio || 1, [1, 1.5, 2][q]);
    S.ren.setPixelRatio(S.dpr);
    S.ren.toneMapping = q > 0 ? T.ACESFilmicToneMapping : T.NoToneMapping; S.ren.toneMappingExposure = 1.05;
    S.ren.shadowMap.enabled = q > 0; S.ren.shadowMap.type = q > 1 ? T.PCFSoftShadowMap : T.PCFShadowMap;
    const sz = q > 1 ? 2048 : 1024; S.sun.castShadow = q > 0;
    if (S.sun.shadow.mapSize.x !== sz) { S.sun.shadow.mapSize.set(sz, sz); if (S.sun.shadow.map) { S.sun.shadow.map.dispose(); S.sun.shadow.map = null } }
    const sc = S.sun.shadow.camera; sc.left = -620; sc.right = 620; sc.top = 620; sc.bottom = -620; sc.near = 50; sc.far = 1800; sc.updateProjectionMatrix();
    S.sun.shadow.bias = -.0006; S.sun.shadow.normalBias = 2;
    S.hl.visible = q > 0; postSetup();
  }
  /* hậu kỳ (chỉ mức Cao): phát sáng (bloom) cho hiệu ứng cộng sáng + tối góc nhẹ. Thiếu EffectComposer / lỗi → vẽ thẳng như cũ. */
  function postSetup() {
    const q = S.q, want = q > 1 && T.EffectComposer && !(S.host.sv() && S.host.sv().bloom === 0);
    if (!want) { if (S.comp) { try { S.comp.dispose() } catch (e) { } S.comp = null } return }
    if (S.comp) { return }
    try {
      const W = S.host.cv.clientWidth || 360, H = S.host.cv.clientHeight || 640, rt = new T.WebGLRenderTarget(W * S.dpr, H * S.dpr, { type: T.HalfFloatType, samples: 4 });
      const c = new T.EffectComposer(S.ren, rt); c.setPixelRatio(S.dpr); c.setSize(W, H);
      c.addPass(new T.RenderPass(S.scene, S.cam));
      S.bloom = new T.UnrealBloomPass(new T.Vector2(W, H), .3, .5, 1.1); c.addPass(S.bloom);
      c.addPass(new T.ShaderPass({ uniforms: { tDiffuse: { value: null }, uTint: { value: new T.Vector3(1, 1, 1) }, uSat: { value: 1.06 } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: 'uniform sampler2D tDiffuse;uniform vec3 uTint;uniform float uSat;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 d=vUv-.5;float v=smoothstep(.85,.25,length(d*vec2(1.,1.25)));c.rgb*=mix(.72,1.,v);float l=dot(c.rgb,vec3(.299,.587,.114));c.rgb=mix(vec3(l),c.rgb,uSat)*uTint;gl_FragColor=c;}' })); S.gradePass = c.passes[c.passes.length - 1];
      c.addPass(new T.OutputPass()); S.comp = c; if (S.tint) S.gradePass.uniforms.uTint.value.set(S.tint[0], S.tint[1], S.tint[2]);
    } catch (e) { console.warn('[r3d] post-process tắt:', e); S.comp = null }
  }
  function resize() {
    if (!S.ren) return; const cv = S.host.cv, W = cv.clientWidth || 360, H = cv.clientHeight || 640;
    S.W = W; S.H = H; S.ren.setSize(W, H, false); S.cam.aspect = W / H; S.cam.updateProjectionMatrix(); if (S.comp) { S.comp.setPixelRatio(S.dpr); S.comp.setSize(W, H) }
  }
  R3.resize = () => { if (S.on) resize() };
  window.addEventListener('resize', () => { if (S.on) resize() });

  /* ================= 3) VẬT LIỆU ĐẤT ================= */
  function detailTex(deco) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#d4d4d4'; g.fillRect(0, 0, 128, 128);
    const rr = (() => { let s = 12345; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 })();
    for (let i = 0; i < 420; i++) { const v = 200 + rr() * 55 | 0; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(rr() * 128, rr() * 128, 1 + rr() * 3, 1 + rr() * 3) }
    for (let i = 0; i < 160; i++) { const v = 140 + rr() * 50 | 0; g.fillStyle = `rgba(${v},${v},${v},.3)`; g.fillRect(rr() * 128, rr() * 128, 1 + rr() * 2, 1 + rr() * 2) }
    if (deco === 'grass' || deco === 'leaf') { g.strokeStyle = 'rgba(235,235,235,.5)'; g.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = rr() * 128, y = rr() * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rr() - .5) * 3, y - 4 - rr() * 5); g.stroke() } }
    if (deco === 'water') { g.strokeStyle = 'rgba(250,250,250,.4)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(rr() * 128, rr() * 128, 5 + rr() * 11, .2, 2.4); g.stroke() } }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function groundMat() {
    const m = new T.MeshLambertMaterial({ vertexColors: true, map: null });
    m.onBeforeCompile = sh => {
      sh.uniforms.uC = { value: S.rimC }; sh.uniforms.uRim = { value: S.rimP };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
uniform vec2 uC; uniform vec3 uRim; varying float vRim;
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1.,0.)),f.x),mix(hh(i+vec2(0.,1.)),hh(i+vec2(1.,1.)),f.x),f.y);}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vec2 wp=(modelMatrix*vec4(position,1.)).xy; wp=(modelMatrix*vec4(position,1.)).xz;
float dd=length(wp-uC); float kk=smoothstep(uRim.x,uRim.y,dd); float nn=vn(wp*.0042)*.6+vn(wp*.012)*.4;
transformed.y+=kk*uRim.z*(.2+.8*nn); vRim=kk;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRim;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=mix(1.,.5,vRim);');
    };
    m.customProgramCacheKey = () => 'dvgnd';
    return m;
  }

  /* ================= 4) CHUNK ĐỊA HÌNH ================= */
  const CHS = 512, SEG = 32, CHUNK_R = 2;
  const ZCOL = { mud: [74, 58, 40], water: [36, 92, 140], ice: [190, 232, 255], lava: [255, 96, 28], poison: [110, 158, 58], sand: [200, 168, 96], holy: [255, 240, 176], rift: [106, 58, 154] };
  const tmpC = new T.Color();
  function groundColor(x, z, out) {
    const th = S.theme, n1 = vnoise(x * .02, z * .02), n2 = vnoise(x * .06 + 9, z * .06 + 4), n3 = vnoise(x * .0045 + 33, z * .0045);
    const hh = th.h + (n3 - .5) * th.hv * 1.4, ll = th.l + 12 + (n1 - .5) * th.lv * 3 + (n2 - .5) * th.lv * 1.5;
    tmpC.setHSL(((hh % 360) + 360) % 360 / 360, clamp(th.s / 100 * 1.35, 0, 1), clamp(ll / 100, .08, .8));
    out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b;
    const ENV = S.host.ENV;
    if (ENV && th.zones) {
      const z0 = ENV.zoneAt(x, z);
      if (z0 && ZCOL[z0]) {
        const c = ZCOL[z0]; tmpC.setRGB(c[0] / 255, c[1] / 255, c[2] / 255, T.SRGBColorSpace);
        const k = z0 === 'lava' ? .9 : z0 === 'water' ? .85 : .7;
        out[0] += (tmpC.r - out[0]) * k; out[1] += (tmpC.g - out[1]) * k; out[2] += (tmpC.b - out[2]) * k;
        if (z0 === 'lava') { const g = .6 + .4 * vnoise(x * .05, z * .05); out[0] *= g * 1.2; out[1] *= g; out[2] *= g * .8 }
      }
    }
  }
  function zoneKind(x, z) { const ENV = S.host.ENV; return ENV ? ENV.zoneAt(x, z) : 0 }
  S.waterAt = (x, z) => { const k = zoneKind(x, z); return k === 'water' ? -7 : k === 'lava' ? -4 : k === 'mud' ? -2.5 : 0 };
  function mkChunk(ci, cj) {
    const g = new T.PlaneGeometry(CHS, CHS, SEG, SEG); g.rotateX(-PI / 2);
    const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3), uv = g.attributes.uv, nor = g.attributes.normal;
    const ox = ci * CHS + CHS / 2, oz = cj * CHS + CHS / 2, c = [0, 0, 0], e = 6;
    for (let i = 0; i < n; i++) {
      const lx = pos.getX(i), lz = pos.getZ(i), wx = ox + lx, wz = oz + lz;
      const hv = R3.height(wx, wz); pos.setY(i, hv);
      const hx = R3.height(wx + e, wz) - R3.height(wx - e, wz), hz = R3.height(wx, wz + e) - R3.height(wx, wz - e);
      const nx = -hx / (2 * e), nz = -hz / (2 * e), il = 1 / M.hypot(nx, 1, nz); nor.setXYZ(i, nx * il, il, nz * il);
      groundColor(wx, wz, c); const sh = 1 + (hv / 70) * .5; col[i * 3] = c[0] * sh; col[i * 3 + 1] = c[1] * sh; col[i * 3 + 2] = c[2] * sh;
      uv.setXY(i, wx / 72, wz / 72);
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.Mesh(g, S.mat.ground); m.position.set(ox, 0, oz); m.receiveShadow = true; m.frustumCulled = false; S.terrain.add(m);
    return m;
  }
  function syncChunks(maxNew) {
    const ci = M.floor(S.tx / CHS), cj = M.floor(S.tz / CHS); let made = 0;
    for (let d = 0; d <= CHUNK_R; d++) for (let a = -d; a <= d; a++) for (let b = -d; b <= d; b++) {
      if (M.max(M.abs(a), M.abs(b)) !== d) continue;
      const k = (ci + a) + ',' + (cj + b); if (S.chunks.has(k)) continue;
      if (made >= maxNew) return; S.chunks.set(k, mkChunk(ci + a, cj + b)); made++;
    }
    for (const [k, m] of S.chunks) { const p = k.split(','); if (M.abs(+p[0] - ci) > CHUNK_R + 1 || M.abs(+p[1] - cj) > CHUNK_R + 1) { S.terrain.remove(m); m.geometry.dispose(); S.chunks.delete(k) } }
  }
  function clearChunks() { for (const m of S.chunks.values()) { S.terrain.remove(m); m.geometry.dispose() } S.chunks.clear() }

  /* ================= 5) CHƯỚNG NGẠI 3D (dựng bằng hình khối, gộp + instancing) ================= */
  const P_ = {};   // hình khối gốc dùng chung
  function prim() {
    if (P_.cone) return;
    P_.cone = new T.ConeGeometry(1, 1, 7, 1); P_.cone.translate(0, .5, 0);
    P_.cone5 = new T.ConeGeometry(1, 1, 5, 1); P_.cone5.translate(0, .5, 0);
    P_.cyl = new T.CylinderGeometry(1, 1, 1, 7, 1); P_.cyl.translate(0, .5, 0);
    P_.ico = new T.IcosahedronGeometry(1, 0); P_.ico1 = new T.IcosahedronGeometry(1, 1);
    P_.box = new T.BoxGeometry(1, 1, 1); P_.box.translate(0, .5, 0);
    P_.oct = new T.OctahedronGeometry(1, 0); P_.sph = new T.SphereGeometry(1, 8, 6);
    P_.tor = new T.TorusGeometry(1, .12, 5, 14);
  }
  const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3(), _c = new T.Color();
  function Builder(seed) {
    const L = [], Gl = [], r = (() => { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 })();
    const b = {
      r,
      add(geo, col, x, y, z, sx, sy, sz, rx, ry, rz, glow, jit) {
        let g = geo.index ? geo.toNonIndexed() : geo.clone();
        g.deleteAttribute('uv');
        if (jit) { const p = g.attributes.position, map = new Map(); for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); let j = map.get(k); if (!j) { j = [(r() - .5) * jit, (r() - .5) * jit, (r() - .5) * jit]; map.set(k, j) } p.setXYZ(i, p.getX(i) + j[0], p.getY(i) + j[1], p.getZ(i) + j[2]) } }
        _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _m4.compose(_v.set(x, y, z), _q, _s.set(sx, sy == null ? sx : sy, sz == null ? sx : sz)); g.applyMatrix4(_m4);
        _c.set(col); const n = g.attributes.position.count, ca = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { ca[i * 3] = _c.r; ca[i * 3 + 1] = _c.g; ca[i * 3 + 2] = _c.b }
        g.setAttribute('color', new T.BufferAttribute(ca, 3)); if (g.attributes.normal) g.deleteAttribute('normal'); (glow ? Gl : L).push(g); return b;
      },
      done() { const f = a => { if (!a.length) return null; const g = BG.mergeGeometries(a, false); g.computeVertexNormals(); for (const x of a) x.dispose(); return g }; return { lit: f(L), glow: f(Gl) } }
    };
    return b;
  }
  R3.Builder = Builder; R3.prim = () => { prim(); return P_ };
  const shade = (hex, f) => { _c.set(hex); _c.multiplyScalar(f); return '#' + _c.getHexString() };
  const mixc = (a, b, t) => { const x = new T.Color(a), y = new T.Color(b); return '#' + x.lerp(y, t).getHexString() };
  /* mỗi hàm dựng một loại chướng ngại cao ~ 40–120 đơn vị (1 đơn vị ≈ 1 px thế giới) */
  const PK = {
    rock(b, c, v) { b.add(P_.ico, c[0], 0, 6, 0, 14 + v * 2, 9 + v, 12 + v * 2, 0, v, 0, 0, .5); b.add(P_.ico, shade(c[0], .8), 9, 3, 6, 6, 4, 5, 0, 1, 0, 0, .4) },
    boulder(b, c, v) { b.add(P_.ico1, c[0], 0, 10, 0, 21, 16 + v * 2, 19, 0, v, .1, 0, 1.1); b.add(P_.ico, shade(c[0], .75), 16, 4, 8, 8, 6, 7, 0, 2, 0, 0, .5); b.add(P_.ico, shade(c[0], 1.15), -4, 22, -2, 8, 4, 8, 0, 0, 0, 0, .5) },
    bush(b, c, v) { for (let i = 0; i < 4; i++) b.add(P_.ico1, shade(c[1], .8 + i * .12), M.cos(i * 1.7 + v) * 8, 7 + (i % 2) * 3, M.sin(i * 1.7 + v) * 8, 10 - i, 8, 10 - i, 0, i, 0, 0, .8); b.add(P_.sph, '#e84a6a', 3, 14, 6, 1.6, 1.6, 1.6) },
    oak(b, c, v) { b.add(P_.cyl, c[2], 0, 0, 0, 5, 36, 5, 0, 0, .06); b.add(P_.cyl, shade(c[2], .8), 6, 24, 0, 2.6, 22, 2.6, 0, 0, -.9); for (let i = 0; i < 5; i++) b.add(P_.ico1, shade(c[1], .75 + i * .1), M.cos(i * 1.3 + v) * 18, 48 + (i % 3) * 9, M.sin(i * 1.3 + v) * 16, 20 - i * 1.2, 16, 20 - i * 1.2, 0, i, 0, 0, 1.4) },
    pine(b, c, v) { b.add(P_.cyl, c[2], 0, 0, 0, 4, 20, 4); for (let i = 0; i < 4; i++) b.add(P_.cone, shade(c[1], .7 + i * .13), 0, 14 + i * 20, 0, 22 - i * 4.4, 30 - i * 3, 22 - i * 4.4, 0, i * .7, 0, 0, .8) },
    willow(b, c, v) { b.add(P_.cyl, c[2], 0, 0, 0, 5, 42, 5, 0, 0, .08); b.add(P_.ico1, shade(c[1], 1.05), 0, 54, 0, 26, 14, 26, 0, 0, 0, 0, 1); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; b.add(P_.cone, shade(c[1], .8 + (i % 3) * .12), M.cos(a) * 22, 58, M.sin(a) * 22, 2.6, -40, 2.6, 0, 0, 0) } },
    reed(b, c, v) { for (let i = 0; i < 12; i++) { const a = b.r() * TAU, d = b.r() * 11; b.add(P_.cone, shade(c[1], .8 + b.r() * .4), M.cos(a) * d, 0, M.sin(a) * d, 1.4, 28 + b.r() * 22, 1.4, (b.r() - .5) * .3, 0, (b.r() - .5) * .3); if (i % 4 === 0) b.add(P_.cyl, c[2], M.cos(a) * d, 36, M.sin(a) * d, 1.6, 8, 1.6) } },
    mangrove(b, c, v) { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; b.add(P_.cyl, c[2], M.cos(a) * 4, 0, M.sin(a) * 4, 1.8, 26, 1.8, M.sin(a) * .6, 0, -M.cos(a) * .6) } b.add(P_.cyl, c[2], 0, 14, 0, 4, 30, 4); for (let i = 0; i < 4; i++) b.add(P_.ico1, shade(c[1], .7 + i * .12), M.cos(i * 1.6) * 14, 48 + i * 4, M.sin(i * 1.6) * 14, 16, 12, 16, 0, i, 0, 0, 1) },
    deadtree(b, c, v) { b.add(P_.cyl, shade(c[2], .7), 0, 0, 0, 4, 44, 3, 0, 0, .05); for (let i = 0; i < 5; i++) { const a = i * 1.4 + v; b.add(P_.cyl, shade(c[2], .65), 0, 20 + i * 6, 0, 1.6, 22 - i * 2, 1.6, M.cos(a) * .9, 0, M.sin(a) * .9) } },
    palm(b, c, v) { for (let i = 0; i < 6; i++) b.add(P_.cyl, c[2], i * 1.4, i * 9, 0, 3.4 - i * .25, 10, 3.4 - i * .25, 0, 0, -i * .06); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; b.add(P_.cone5, shade(c[1], .8 + (i % 2) * .25), 8, 56, 0, 4, 34, 1.4, M.sin(a) * 1.25, 0, -M.cos(a) * 1.25 + 1.57) } },
    cactus(b, c, v) { const g = shade(c[1], 1); b.add(P_.cyl, g, 0, 0, 0, 5, 46, 5); b.add(P_.sph, g, 0, 46, 0, 5, 5, 5); b.add(P_.cyl, g, 5, 20, 0, 2.6, 12, 2.6, 0, 0, -1.4); b.add(P_.cyl, g, 11, 22, 0, 2.6, 14, 2.6); b.add(P_.cyl, g, -5, 28, 0, 2.6, 10, 2.6, 0, 0, 1.4); b.add(P_.cyl, g, -11, 30, 0, 2.6, 12, 2.6) },
    pillar(b, c, v) { b.add(P_.box, shade(c[0], .85), 0, 0, 0, 20, 6, 20); b.add(P_.cyl, c[0], 0, 6, 0, 8, 56 - v * 6, 8, 0, 0, 0); b.add(P_.box, shade(c[0], 1.1), 0, 62 - v * 6, 0, 18, 6, 18); if (v === 1) b.add(P_.ico, shade(c[0], .7), 8, 4, 8, 7, 4, 6) },
    ruin(b, c, v) { b.add(P_.box, c[0], 0, 0, 0, 32, 24 + v * 6, 8); b.add(P_.box, shade(c[0], .8), -14, 0, 4, 8, 40, 8); b.add(P_.box, shade(c[0], 1.1), 12, 24 + v * 6, 0, 10, 6, 8, 0, 0, .2); b.add(P_.ico, shade(c[0], .7), 16, 3, 10, 6, 4, 6) },
    crystal(b, c, v) { const cc = mixc(c[1] || c[0], '#9fd8ff', .5); for (let i = 0; i < 5; i++) b.add(P_.oct, i % 2 ? shade(cc, 1.25) : cc, M.cos(i * 1.3) * 9, 14 + i * 4, M.sin(i * 1.3) * 9, 4 + (i % 3), 18 + i * 5, 4 + (i % 3), M.sin(i) * .25, i, M.cos(i) * .25, i > 1) },
    stalag(b, c, v) { b.add(P_.cone, c[0], 0, 0, 0, 12, 52 + v * 8, 12, 0, 0, 0, 0, .8); b.add(P_.cone, shade(c[0], .8), 12, 0, 6, 6, 28, 6, 0, 0, 0, 0, .5) },
    coral(b, c, v) { for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; b.add(P_.cone, mixc(c[1], '#ff7aa8', .5 + (i % 3) * .15), M.cos(a) * 8, 0, M.sin(a) * 8, 3.4, 26 + (i % 3) * 8, 3.4, M.cos(a) * .5, 0, M.sin(a) * .5) } },
    lavarock(b, c, v) { b.add(P_.ico1, shade(c[0], .5), 0, 9, 0, 17, 14, 15, 0, v, 0, 0, 1.4); b.add(P_.ico, '#ff7a22', 3, 17, 0, 6, 1.6, 8, 0, 0, 0, true); b.add(P_.cone, '#ff9a3a', -6, 14, 5, 1.4, 12, 1.4, 0, 0, 0, true) },
    bones(b, c, v) { const w = '#d9d2bf'; for (let i = 0; i < 4; i++) b.add(P_.tor, w, -12 + i * 8, 2, 0, 9, 9, 9, 0, 0, 0, 0); b.add(P_.cyl, w, -16, 0, 0, 1.8, 36, 1.8, 0, 0, 1.57); b.add(P_.sph, w, 22, 6, 4, 6, 5, 5) },
    tomb(b, c, v) { b.add(P_.box, c[0], 0, 0, 0, 20, 32, 7); b.add(P_.cyl, c[0], 0, 32, 0, 10, 7, 7, 1.57, 0, 0); b.add(P_.box, shade(c[0], .7), 0, 0, 8, 26, 4, 14); b.add(P_.box, '#8fe0c0', 0, 18, 4, 2, 10, 1, 0, 0, 0, true); b.add(P_.box, '#8fe0c0', 0, 22, 4, 8, 2, 1, 0, 0, 0, true) },
    spire(b, c, v) { b.add(P_.cone5, shade(c[0], .75), 0, 0, 0, 10, 96, 10, 0, 0, 0, 0, .8); b.add(P_.cone5, shade(c[0], .6), 11, 0, 4, 6, 54, 6); b.add(P_.oct, c[2] || '#ffe08a', 0, 92, 0, 3.2, 6, 3.2, 0, 0, 0, true) },
    icecrys(b, c, v) { for (let i = 0; i < 6; i++) b.add(P_.oct, i % 2 ? '#e8f8ff' : '#aee8ff', M.cos(i * 1.1) * 8, 12 + i * 3, M.sin(i * 1.1) * 8, 4, 18 + i * 5, 4, M.sin(i) * .3, i, M.cos(i) * .3, i === 2) },
    cloudcol(b, c, v) { b.add(P_.cyl, '#eaeaf6', 0, 0, 0, 7, 54, 7); for (let i = 0; i < 4; i++) b.add(P_.ico1, '#ffffff', M.cos(i * 1.6) * 8, 56 + (i % 2) * 5, M.sin(i * 1.6) * 8, 12 - i, 8, 12 - i, 0, i, 0, 0, 1) },
    voidrock(b, c, v) { b.add(P_.ico1, shade(c[0], .6), 0, 28, 0, 15, 20, 14, 0, v, 0, 0, 1.4); b.add(P_.tor, '#c06aff', 0, 28, 0, 24, 24, 24, 1.57, 0, 0, true); b.add(P_.oct, '#e0a8ff', 0, 28, 0, 4, 4, 4, 0, 0, 0, true) },
    brazier(b, c, v) { b.add(P_.cyl, '#3a3028', 0, 0, 0, 3, 22, 3); b.add(P_.cone, '#4a3a2c', 0, 22, 0, 10, 8, 10, PI, 0, 0); b.add(P_.cone, '#ffb02e', 0, 24, 0, 6, 18, 6, 0, 0, 0, true); b.add(P_.cone, '#fff0a0', 0, 24, 0, 3, 12, 3, 0, 0, 0, true) },
    totem(b, c, v) { for (let i = 0; i < 4; i++) { b.add(P_.box, shade(c[0], .8 + i * .08), 0, i * 18, 0, 16 - i * 2, 18, 16 - i * 2); b.add(P_.box, c[2] || '#ffd24a', -3, 6 + i * 18, 8 - i, 2.4, 2.4, 1, 0, 0, 0, true); b.add(P_.box, c[2] || '#ffd24a', 3, 6 + i * 18, 8 - i, 2.4, 2.4, 1, 0, 0, 0, true) } },
    banner(b, c, v) { b.add(P_.cyl, '#4a3a2a', 0, 0, 0, 2, 70, 2); b.add(P_.sph, c[2] || '#ffd24a', 0, 72, 0, 3, 3, 3, 0, 0, 0, true); b.add(P_.box, shade(c[1] || '#a33', 1.1), 11, 36, 0, 22, 32, 1.5, 0, 0, 0, 0, 0); b.add(P_.box, c[2] || '#ffd24a', 11, 48, .8, 14, 3, .6, 0, 0, 0, true) },
    tsolid() { }, tpost(b, c) { b.add(P_.cyl, '#5a4630', 0, 0, 0, 3, 24, 3) }
  };
  const PROP_GEO = new Map();
  function propGeo(kind, v, E) {
    const key = kind + '|' + v; let g = PROP_GEO.get(key); if (g) return g;
    prim(); const f = PK[kind]; const b = Builder(hashStr(kind) + v * 977 + (E ? E.seed : 0));
    const col = (E && E.T && E.T.ob && E.T.ob.c) || ['#6d6a62', '#3f7a3a', '#8a5a34'];
    if (f) f(b, col, v); g = b.done(); PROP_GEO.set(key, g); return g;
  }
  function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0 }
  function propMats() {
    if (S.mat.prop) return;
    S.mat.prop = new T.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    S.mat.glow = new T.MeshBasicMaterial({ vertexColors: true, fog: true });
  }
  const PMAX = 140;
  function getInst(key, kind, v) {
    let r = S.props.get(key); if (r) return r; propMats();
    const g = propGeo(kind, v, S.E); r = { lit: null, glow: null, n: 0 };
    if (g.lit) { r.lit = new T.InstancedMesh(g.lit, S.mat.prop, PMAX); r.lit.castShadow = S.q > 0; r.lit.receiveShadow = true; r.lit.frustumCulled = false; S.propsG.add(r.lit) }
    if (g.glow) { r.glow = new T.InstancedMesh(g.glow, S.mat.glow, PMAX); r.glow.frustumCulled = false; S.propsG.add(r.glow) }
    S.props.set(key, r); return r;
  }
  const PL = [];
  function syncProps(force) {
    const ENV = S.host.ENV, G = S.G; if (!ENV || !S.E) return; const P = G.p;
    const gx = M.floor(P.x / 64), gy = M.floor(P.y / 64);
    if (!force && gx === S.pgx && gy === S.pgy && S.t - S.pt < .35) return; S.pgx = gx; S.pgy = gy; S.pt = S.t;
    PL.length = 0; ENV.props(P.x - 780, P.y - 900, 1560, 1800, PL);
    for (const r of S.props.values()) r.n = 0;
    const names = ENV.kinds;
    for (const o of PL) {
      if (o.tw) { if (S.townProp) S.townProp(o); continue }
      const name = names[o.k - 1]; if (!name || name === 'tsolid') continue; const v = o.v | 0, r = getInst(name + '|' + v, name, v);
      const hh = h2(o.x | 0, o.y | 0), sc = (o.sc || 1) * (.86 + hh * .32), y = R3.height(o.x, o.y);
      _e.set(0, hh * TAU, 0); _q.setFromEuler(_e); _m4.compose(_v.set(o.x, y - 1, o.y), _q, _s.set(sc, sc, sc));
      if (r.lit && r.n < PMAX) r.lit.setMatrixAt(r.n, _m4); if (r.glow && r.n < PMAX) r.glow.setMatrixAt(r.n, _m4); if (r.n < PMAX) r.n++;
    }
    ENV.recycle(PL);
    for (const r of S.props.values()) { if (r.lit) { r.lit.count = r.n; r.lit.instanceMatrix.needsUpdate = true } if (r.glow) { r.glow.count = r.n; r.glow.instanceMatrix.needsUpdate = true } }
  }
  function clearProps() { for (const r of S.props.values()) { if (r.lit) { S.propsG.remove(r.lit); r.lit.dispose() } if (r.glow) { S.propsG.remove(r.glow); r.glow.dispose() } } S.props.clear(); for (const g of PROP_GEO.values()) { if (g.lit) g.lit.dispose(); if (g.glow) g.glow.dispose() } PROP_GEO.clear() }

  /* ================= 6) ĐẤU TRƯỜNG BOSS ================= */
  function arenaSync(dt) {
    const ENV = S.host.ENV, E = S.E, a = E && E.arena, A = S.arenaG;
    if (!a) { if (A) { A.visible = false } return }
    if (!A || A.userData.a !== a) {
      if (A) { S.fxG.remove(A); A.traverse(o => { if (o.geometry) o.geometry.dispose() }) }
      const g = new T.Group(); g.userData.a = a; const st = E.T.arena, fl0 = new T.Color(st.floor[0]), fl1 = new T.Color(st.floor[1]), rune = st.rune, wall = st.wall;
      const cvs = document.createElement('canvas'); cvs.width = cvs.height = 512; const c = cvs.getContext('2d');
      const gr = c.createRadialGradient(256, 256, 20, 256, 256, 256); gr.addColorStop(0, st.floor[0]); gr.addColorStop(1, st.floor[1]); c.fillStyle = gr; c.beginPath(); c.arc(256, 256, 256, 0, TAU); c.fill();
      c.strokeStyle = rune; c.lineWidth = 5; c.globalAlpha = .9; for (const r of [250, 214, 120]) { c.beginPath(); c.arc(256, 256, r, 0, TAU); c.stroke() }
      c.lineWidth = 3; for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; c.beginPath(); c.moveTo(256 + M.cos(an) * 120, 256 + M.sin(an) * 120); c.lineTo(256 + M.cos(an) * 214, 256 + M.sin(an) * 214); c.stroke() }
      c.beginPath(); for (let i = 0; i <= 6; i++) { const an = i / 6 * TAU * 2 % TAU + PI / 2, x = 256 + M.cos(an) * 190, y = 256 + M.sin(an) * 190; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke();
      const tx = new T.CanvasTexture(cvs); tx.colorSpace = T.SRGBColorSpace;
      const fg = new T.RingGeometry(.5, a.R, 64, 18); fg.rotateX(-PI / 2); { const ps = fg.attributes.position; for (let i = 0; i < ps.count; i++) ps.setY(i, R3.height(a.x + ps.getX(i), a.y + ps.getZ(i)) - R3.height(a.x, a.y)) } const fm = new T.Mesh(fg, new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      fm.position.set(a.x, R3.height(a.x, a.y) + 1.2, a.y); fm.renderOrder = 1; g.add(fm); g.userData.floor = fm;
      const wg = new T.CylinderGeometry(a.R, a.R, 150, 64, 1, true); wg.translate(0, 75, 0);
      const wc = document.createElement('canvas'); wc.width = 4; wc.height = 128; const wx = wc.getContext('2d'), wgr = wx.createLinearGradient(0, 128, 0, 0); const wcol = new T.Color(wall); const rgb = `${wcol.r * 255 | 0},${wcol.g * 255 | 0},${wcol.b * 255 | 0}`; wgr.addColorStop(0, `rgba(255,255,255,.95)`); wgr.addColorStop(.25, `rgba(255,255,255,.45)`); wgr.addColorStop(1, 'rgba(255,255,255,0)'); wx.fillStyle = wgr; wx.fillRect(0, 0, 4, 128);
      const wt = new T.CanvasTexture(wc), wm = new T.Mesh(wg, new T.MeshBasicMaterial({ map: wt, color: wall, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
      wm.position.set(a.x, R3.height(a.x, a.y), a.y); wm.renderOrder = 2; g.add(wm); g.userData.wall = wm;
      S.fxG.add(g); S.arenaG = g;
    }
    const g = S.arenaG; g.visible = true; const k = a.closing ? a.fade : a.p;
    g.userData.wall.scale.set(1, .15 + .85 * k, 1); g.userData.wall.material.opacity = (.55 + .2 * M.sin(S.t * 3)) * k; g.userData.floor.material.opacity = clamp(a.p * 1.3, 0, 1) * (a.closing ? a.fade : 1);
  }

  /* ================= 7) ÁNH SÁNG · SƯƠNG · THỜI TIẾT ================= */
  const TOD3 = {
    day: { sky: 0xbcd2ff, gnd: 0x6a5a40, hemi: .95, sun: 0xfff0cc, sunI: 1.55, fog: 0xa8bcd4, rim: 0xaad0ff, rimI: .3, exp: 1.0 },
    dawn: { sky: 0xffc2a8, gnd: 0x4a3050, hemi: .75, sun: 0xffb27a, sunI: 1.3, fog: 0xc89aa0, rim: 0xff9ac0, rimI: .4, exp: 1.0 },
    dusk: { sky: 0xff9a78, gnd: 0x35244a, hemi: .62, sun: 0xff7a48, sunI: 1.15, fog: 0x7a4a68, rim: 0x8a6aff, rimI: .5, exp: 1.0 },
    night: { sky: 0x3a4a9a, gnd: 0x161024, hemi: .55, sun: 0x9ab4ff, sunI: .85, fog: 0x0e1230, rim: 0x7a5aff, rimI: .55, exp: 1.12 }
  };
  const FOGT = { swamp: 0x56622c, shadow: 0x2a1e44, cave: 0x261c40, river: 0x6a8aa0, snow: 0xcfdce8, volcano: 0x4a2418, heaven: 0xf4e8c0, void: 0x2c1850, sea: 0x5a8aa0, forest: 0x3a5a40 };
  function setupEnvLook() {
    const E = S.E, th = E.T, tk = E.todK || 'day', t3 = TOD3[tk] || TOD3.day, fogH = FOGT[E.tk];
    const g = th.ground || {}; S.theme = { h: E.hue, s: g.s || 36, l: g.l || 26, hv: g.hv || 14, lv: g.lv || 4, deco: g.deco || 'grass', zones: true, amp: /heaven|void/.test(E.tk) ? .8 : /mountain|valley|volcano|snow|cave/.test(E.tk) ? 1.5 : 1 };
    S.seed = (E.seed % 997) / 7; S.tod = tk;
    S.hemi.color.setHex(t3.sky); S.hemi.groundColor.setHex(t3.gnd); S.hemi.intensity = t3.hemi * .55 * PI;
    S.sun.color.setHex(t3.sun); S.sun.intensity = t3.sunI * .5 * PI; S.rimL.color.setHex(t3.rim); S.rimL.intensity = t3.rimI * .6 * PI;
    const fc = new T.Color(t3.fog); if (fogH != null) fc.lerp(new T.Color(fogH), tk === 'night' ? .55 : .65);
    S.fogColor = fc; S.scene.background = fc; S.scene.fog = new T.Fog(fc, 1000, 3000);
    S.ren.toneMappingExposure = t3.exp * 1.05;
    { const TN = { night: [.86, .93, 1.12], dusk: [1.08, .95, .9], dawn: [1.06, .98, .96] }, tn = TN[tk] || (/volcano|lava/.test(E.tk) ? [1.12, .94, .88] : /snow|ice/.test(E.tk) ? [.96, 1, 1.07] : /void|shadow/.test(E.tk) ? [1.02, .92, 1.12] : /heaven/.test(E.tk) ? [1.06, 1.02, .9] : [1, 1, 1]); S.tint = tn; if (S.gradePass) S.gradePass.uniforms.uTint.value.set(tn[0], tn[1], tn[2]) }
    S.mat.ground.map = detailTex(S.theme.deco); S.mat.ground.needsUpdate = true;
    S.hl.color.setHex(tk === 'day' ? 0xffe8b0 : 0xffd27a); S.hl.intensity = (tk === 'day' ? .7 : 1.6) * PI * 1.5;
    PROP_GEO.clear();
  }
  /* thời tiết: hạt 3D quanh người chơi */
  const WT = {
    rain: { c: 0xaec8ff, s: 3, vy: -900, vx: -110, n: 700, sz: 2.4, stretch: 1 }, storm: { c: 0xaec8ff, s: 3, vy: -1100, vx: -380, n: 900, sz: 2.4, stretch: 1 },
    snow: { c: 0xffffff, s: 3, vy: -70, vx: 12, n: 500, sz: 5, sway: 1 }, blizzard: { c: 0xffffff, s: 3, vy: -140, vx: -330, n: 800, sz: 4.5, sway: 1 },
    petals: { c: 0xf8a8c0, s: 3, vy: -34, vx: 24, n: 160, sz: 6, sway: 1 }, sand: { c: 0xe0c080, s: 3, vy: -8, vx: -420, n: 520, sz: 3.5 },
    ash: { c: 0x8a8890, s: 3, vy: -26, vx: 30, n: 300, sz: 4, sway: 1 }, ember: { c: 0xff9a3a, s: 3, vy: 62, vx: 14, n: 260, sz: 4, sway: 1, glow: 1 },
    spore: { c: 0xb8e870, s: 3, vy: 24, vx: 10, n: 180, sz: 5, sway: 1, glow: 1 }, motes: { c: 0xffe08a, s: 3, vy: 18, vx: 8, n: 200, sz: 4.5, sway: 1, glow: 1 },
    spray: { c: 0xcfe8ff, s: 3, vy: 30, vx: 120, n: 200, sz: 3.5 }
  };
  function sparkTex() {
    if (S.mat.spark) return S.mat.spark; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return S.mat.spark = t;
  }
  R3.sparkTex = sparkTex;
  function setupWeather() {
    if (S.weather) { S.world.remove(S.weather.pts); S.weather.pts.geometry.dispose(); S.weather = null }
    const E = S.E, k = E.wk, d = WT[k]; if (!d || S.q === 0 && !/rain|storm|snow|blizzard/.test(k)) return;
    const n = M.round(d.n * [.35, .7, 1][S.q] * (E.wi ? .5 + E.wi * .3 : .6)), pos = new Float32Array(n * 3), ph = new Float32Array(n);
    const BX = 1100, BY = 520, BZ = 1000;
    for (let i = 0; i < n; i++) { pos[i * 3] = (R() - .5) * BX; pos[i * 3 + 1] = R() * BY; pos[i * 3 + 2] = (R() - .5) * BZ; ph[i] = R() * TAU }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    const m = new T.PointsMaterial({ color: d.c, size: d.sz * 3.2, map: sparkTex(), transparent: true, opacity: d.glow ? .95 : .6, depthWrite: false, blending: d.glow ? T.AdditiveBlending : T.NormalBlending, sizeAttenuation: true, fog: true });
    const pts = new T.Points(g, m); pts.frustumCulled = false; S.world.add(pts); S.weather = { pts, d, ph, n, BX, BY, BZ };
  }
  function weatherUpdate(dt) {
    const w = S.weather; if (!w) return; const p = w.pts.geometry.attributes.position, a = p.array, d = w.d, t = S.t;
    for (let i = 0; i < w.n; i++) {
      let x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
      x += (d.vx + (d.sway ? M.sin(t * 1.3 + w.ph[i]) * 22 : 0)) * dt; y += d.vy * dt; z += (d.sway ? M.cos(t * 1.1 + w.ph[i]) * 18 : 0) * dt;
      const hx = w.BX / 2, hz = w.BZ / 2;
      if (x < -hx) x += w.BX; else if (x > hx) x -= w.BX; if (z < -hz) z += w.BZ; else if (z > hz) z -= w.BZ;
      if (y < 0) y += w.BY; else if (y > w.BY) y -= w.BY; a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    p.needsUpdate = true; w.pts.position.set(S.tx, S.ty, S.tz + 120);
  }

  /* ================= 8) VÒNG ĐỜI ================= */
  R3.begin = function (G) {
    if (!R3.enabled()) return false; if (!init()) return false;
    if (R3.homeEnd) R3.homeEnd();
    S.G = G; S.E = S.host.ENV && S.host.ENV.state ? S.host.ENV.state() : null;
    if (!S.E) { S.on = false; return false }
    applyQuality(); S.on = true; S.cv.style.display = 'block'; S.host.cv.style.background = 'transparent';
    S.t = 0; S.last = performance.now(); S.shake = 0; S.arenaG = null; S.pgx = S.pgy = 1e9;
    clearChunks(); clearProps(); S.fxG.clear && S.fxG.clear();
    setupEnvLook(); resize();
    S.tx = G.p.x; S.tz = G.p.y; S.ty = 0; S.camD = null;
    syncChunks(99); syncProps(true); setupWeather();
    for (const m of R3.mods) if (m.begin) m.begin(S, G);
    return true;
  };
  R3.end = function () {
    if (!S.on) return; S.on = false; if (S.cv) S.cv.style.display = 'none'; if (S.host && S.host.cv) S.host.cv.style.background = '';
    for (const m of R3.mods) if (m.end) m.end(S);
    clearChunks(); clearProps(); if (S.weather) { S.world.remove(S.weather.pts); S.weather.pts.geometry.dispose(); S.weather = null }
    if (S.arenaG) { S.fxG.remove(S.arenaG); S.arenaG = null }
    S.ren.renderLists && S.ren.renderLists.dispose();
  };
  R3.active = () => S.on;
  R3.project = function (x, y, z, out) {   // thế giới (x,y)+độ cao z → pixel CSS trên màn hình
    out = out || {}; _v.set(x, R3.height(x, y) + (z || 0), y).project(S.cam); out.x = (_v.x * .5 + .5) * S.W; out.y = (-_v.y * .5 + .5) * S.H; out.vis = _v.z < 1 && _v.z > -1; out.d = _v.z; return out;
  };
  R3.pxScale = function (x, y) {   // số px màn hình ứng với 1 đơn vị thế giới tại (x,y) — để vẽ số sát thương/thanh máu theo khoảng cách
    const a = R3.project(x, y, 0, R3._a || (R3._a = {})), b = R3.project(x + 10, y, 0, R3._b || (R3._b = {})); return M.hypot(b.x - a.x, b.y - a.y) / 10;
  };
  R3.addMesh = m => { S.fxG.add(m); return m };
  R3.ovl = R3.ovl || [];
  R3.overlay = (ctx, G, W, H) => { for (const f of R3.ovl) f(ctx, G, W, H) };

  function camUpdate(dt, G) {
    const P = G.p, host = S.host, CAM = host.CAM, Zc = CAM ? CAM.zoom() : 1, zm = 1 + (G.zm || 0);
    const sh = G.shake * 7, tilt = S.cfg.tilt, vf = S.cfg.fov * PI / 180;
    const d = (S.H / (Zc * zm)) / (2 * M.tan(vf / 2)) * 1.02;
    S.camD = S.camD == null ? d : S.camD + (d - S.camD) * M.min(1, dt * 8);
    S.tx = P.x; S.tz = P.y; S.ty = R3.height(P.x, P.y) * .6 + 20;
    const cd = S.camD, ch = M.sin(tilt) * cd, cz = M.cos(tilt) * cd;
    S.cam.position.set(S.tx + (R() - .5) * sh, S.ty + ch + (R() - .5) * sh * .6, S.tz + cz);
    S.cam.lookAt(S.tx, S.ty, S.tz); S.cam.fov = S.cfg.fov; S.cam.updateProjectionMatrix();
    S.rimC.set(S.tx, S.tz); S.rimP.set(cd * .62, cd * 1.15, cd * .24);
    S.scene.fog.near = cd * 1.1; S.scene.fog.far = cd * 3.1;
    // đèn mặt trời / trăng bám người chơi để bóng đổ luôn quanh nhân vật
    S.sun.position.set(S.tx - 380, S.ty + 640, S.tz + 300); S.sun.target.position.set(S.tx, S.ty, S.tz);
    S.rimL.position.set(S.tx + 320, S.ty + 240, S.tz - 460);
    S.hl.position.set(P.x, R3.height(P.x, P.y) + 48, P.y);
  }

  R3.frame = function (G, dtIn) {
    if (!S.on) return;
    const now = performance.now(), dt = dtIn != null ? dtIn : M.min(.05, (now - S.last) / 1000); S.last = now; S.t += dt; S.G = G;
    S.E = S.host.ENV.state();
    camUpdate(dt, G); syncChunks(2); syncProps(false); weatherUpdate(dt); arenaSync(dt);
    for (const m of R3.mods) if (m.update) m.update(S, G, dt);
    S.fxl.intensity *= M.max(0, 1 - dt * 6);
    if (S.comp) S.ren.info.autoReset = false; else S.ren.info.autoReset = true;
    if (S.comp) { try { S.comp.render(dt) } catch (e) { console.warn('[r3d] post lỗi → tắt', e); S.comp = null; S.ren.render(S.scene, S.cam) } } else S.ren.render(S.scene, S.cam);
    const info = S.ren.info.render; S.stats.draws = info.calls; S.stats.tris = info.triangles; if (S.comp) S.ren.info.reset(); S.fpsN++; S.fpsT += dt; if (S.fpsT > 1) { S.stats.fps = S.fpsN / S.fpsT; S.fpsN = 0; S.fpsT = 0 }
  };
  R3.flash = (x, y, col, I) => { S.fxl.position.set(x, R3.height(x, y) + 60, y); S.fxl.color.set(col || 0xffe08a); S.fxl.intensity = M.max(S.fxl.intensity, I || 3) };
  R3.dispose = () => { R3.end() };
})();
