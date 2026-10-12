/* Phase 18 — BẢN ĐỒ CHƯƠNG 3D (module của DV_R3D)
   Dựng sau lưng DV_MAP (chmap.js): bầu trời chuyển màu theo tiến độ cuộn (hạ giới → thiên giới), nhiều tầng mây có chiều sâu thật (trước/sau đường),
   đảo núi nổi + tháp theo hue từng chương, dòng sông vàng (đoạn đã mở, có dòng chảy + đom đóm) và đường tím mờ (đoạn còn khoá),
   pháp trận xoay dưới từng nút chương, tia sáng ở chương hiện tại. Mặt phẳng z=0 khớp 1:1 với pixel của DOM nên nút bấm/nhãn 2D vẫn đúng chỗ;
   camera phối cảnh chỉ trượt theo scrollTop → các lớp xa/gần có thị sai. Dữ liệu (trạng thái, hue, sao) lấy từ ctx.data() thật của chmap.
   Không có WebGL / sv.r3d=0 → DV_MAP giữ nguyên giao diện 2D cũ. */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T || !window.DV_MAP) return;
  const M = Math, PI = M.PI, TAU = PI * 2;
  const RH = 118, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const Xp = i => 50 + 22 * M.sin(i * 1.05) * (i % 2 ? 1 : .92);
  let st = null, seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const css = `#hmap.r3{background:transparent!important}#hmap.r3 .sky,#hmap.r3 svg.pt{display:none}#hmap.r3 .sc{background:transparent}body.hm3 #menu{visibility:hidden}`;
  let cssOn = 0;
  const c3 = new T.Color(), hsl = (h, s, l) => c3.setHSL(((h % 360) + 360) % 360 / 360, s, l).clone();
  let cloudTex = null;
  function getCloud() {
    if (cloudTex) return cloudTex; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 9; i++) { const x = 64 + (M.sin(i * 2.3) * 26), y = 64 + M.cos(i * 1.7) * 14, r = 26 + (i % 3) * 8, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128) }
    cloudTex = new T.CanvasTexture(c); cloudTex.colorSpace = T.SRGBColorSpace; return cloudTex;
  }
  /* dải (ribbon) bám theo chuỗi điểm */
  function ribbon(pts, w, mat) {
    const n = pts.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; let len = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[M.max(0, i - 1)], b = pts[M.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = M.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      if (i) len += M.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      pos.set([pts[i].x + nx * w, pts[i].y + ny * w, 0, pts[i].x - nx * w, pts[i].y - ny * w, 0], i * 6); uv.set([len, 0, len, 1], i * 4);
      if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2) }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new T.Mesh(g, mat); m.frustumCulled = false; return m;
  }
  const flowMat = (col, op, flow, dash) => new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uT: { value: 0 }, uC: { value: new T.Color(col) }, uO: { value: op } },
    vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vU;uniform float uT,uO;uniform vec3 uC;void main(){float e=1.-abs(vU.y-.5)*2.;e=pow(clamp(e,0.,1.),' + (flow ? '1.6' : '1.2') + ');float f=' + (flow ? '.72+.28*sin(vU.x*.045-uT*2.6)' : '1.') + ';' + (dash ? 'if(fract(vU.x/18.)>.45)discard;' : '') + 'gl_FragColor=vec4(uC*f*(.6+e*.9),e*uO*f);}'
  });

  function begin(root, ctx) {
    end(); if (!R3.enabled() || !R3.initOK()) return; const S = R3.S, D = ctx.data(), L = D.list, N = L.length;
    if (!cssOn) { cssOn = 1; const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s) }
    const H = N * RH + 170, Y = i => H - 90 - i * RH;
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, 10, 6000), grp = new T.Group(); scene.add(grp);
    const hemi = new T.HemisphereLight(0xcfd8ff, 0x3a2a55, 1.5), sun = new T.DirectionalLight(0xffe2b0, 2.4); sun.position.set(-300, 500, 700); scene.add(hemi, sun);
    const bgc = document.createElement('canvas'); bgc.width = 4; bgc.height = 128; const bgt = new T.CanvasTexture(bgc); bgt.colorSpace = T.SRGBColorSpace; scene.background = bgt;
    st = { root, ctx, D, scene, cam, grp, H, N, Y, L, bgc, bgt, bgk: -1, t: 0, last: performance.now(), W: 0, Hc: 0, anim: [], clouds: [], nodes: [], cvW: 0, raf: 0, flows: [] };
    st.was = S.cv.style.display; S.cv.style.display = 'block'; S.ren.setClearColor(0x0b1020);
    layout(); build(); root.classList.add('r3'); document.body.classList.add('hm3'); R3.mapOn = true; st.raf = requestAnimationFrame(frame);
  }
  function layout() {
    const s = st, sc = s.root.querySelector('.sc'), cv = s.root.querySelector('.cv'); if (!sc || !cv) return false; s.cvW = cv.clientWidth || 360; return true;
  }
  function build() {
    const s = st, W = s.cvW, k = W / 520, pts = [], gold = [], N = s.N, L = s.L, unl = M.max(1, L.filter(n => n.st !== 'lock').length), cx = W / 2; seed = 7;
    s.k = k;
    const nodeP = i => ({ x: Xp(i) * W / 100, y: -s.Y(i) });
    let lockedPts = []; if (unl === 1) s.lockStart = 0;
    for (let i = 0; i < N; i++) {
      const p = nodeP(i); if (!i) { pts.push(p); gold.push(p); continue }
      const q = nodeP(i - 1), cp = { x: (q.x + p.x) / 2 + (i % 2 ? 40 : -40) * k, y: (q.y + p.y) / 2 };
      for (let j = 1; j <= 14; j++) { const t = j / 14, u = 1 - t, b = { x: u * u * q.x + 2 * u * t * cp.x + t * t * p.x, y: u * u * q.y + 2 * u * t * cp.y + t * t * p.y }; pts.push(b); if (i < unl) gold.push(b); }
      if (i === unl - 1) s.lockStart = pts.length - 1;
    }
    s.pts = pts; s.gold = gold; const lk = pts.slice(s.lockStart != null ? s.lockStart : pts.length - 1);
    // offset x: canvas pixel = cvLeft + x → cập nhật mỗi frame bằng group.position.x
    const gm = flowMat('#ffc94a', .95, true), gm2 = flowMat('#ff9a2e', .35, true), lm = flowMat('#8a7ac8', .55, false, true);
    s.mats = [gm, gm2, lm]; s.grp.add(ribbon(gold, 13, gm2), ribbon(gold, 5, gm)); if (lk.length > 2) s.grp.add(ribbon(lk, 4, lm));
    // đảo nổi
    const rockM = new T.MeshStandardMaterial({ color: 0x6a5a7a, flatShading: true, roughness: 1 });
    for (let i = 0; i < M.floor(s.H / 260); i++) {
      const yy = -(s.H - 120 - i * 260 - rnd() * 100), ci = clamp(M.round((s.H - 90 + yy) / RH), 0, N - 1), hue = L[ci] ? L[ci].hue : 30, side = i % 2 ? 1 : -1;
      const z = -(120 + rnd() * 380), xo = cx + side * (W * (.42 + rnd() * .35)), sz = (46 + rnd() * 50) * (1 + (-z) / 900);
      const g = new T.Group(), top = new T.MeshStandardMaterial({ color: hsl(hue, .38, .38), flatShading: true, roughness: 1 });
      const rock = new T.Mesh(new T.ConeGeometry(sz, sz * 1.5, 6, 1), rockM); rock.rotation.x = PI; rock.position.y = -sz * .75;
      const land = new T.Mesh(new T.CylinderGeometry(sz * 1.02, sz * .9, sz * .22, 6), top); land.position.y = sz * .02;
      g.add(rock, land);
      for (let j = 0; j < 3; j++) { const tr = new T.Mesh(new T.ConeGeometry(sz * .13, sz * .45, 5), new T.MeshStandardMaterial({ color: hsl(hue + 20, .45, .26), flatShading: true })); tr.position.set((rnd() - .5) * sz * 1.1, sz * .3, (rnd() - .5) * sz * .8); g.add(tr) }
      if (i % 3 === 1) { for (let f = 0; f < 3; f++) { const b = new T.Mesh(new T.BoxGeometry(sz * (.5 - f * .12), sz * .13, sz * (.5 - f * .12)), new T.MeshStandardMaterial({ color: 0xb04030, flatShading: true })); b.position.y = sz * .2 + f * sz * .2; const rf = new T.Mesh(new T.ConeGeometry(sz * (.42 - f * .08), sz * .12, 4), new T.MeshStandardMaterial({ color: 0xe8b84a, flatShading: true })); rf.rotation.y = PI / 4; rf.position.y = sz * .3 + f * sz * .2; g.add(b, rf) } }
      g.position.set(xo, yy, z); g.rotation.y = rnd() * 6; s.grp.add(g); s.anim.push({ g, y0: yy, ph: rnd() * 6, sp: .4 + rnd() * .5, ry: (rnd() - .5) * .3 });
    }
    // mây nhiều tầng
    const cm = getCloud();
    for (let i = 0; i < 70; i++) {
      const z = i % 5 === 0 ? 60 + rnd() * 120 : -(100 + rnd() * 650), sp = new T.Sprite(new T.SpriteMaterial({ map: cm, transparent: true, opacity: z > 0 ? .16 : .22 + rnd() * .2, depthWrite: false, color: new T.Color().setHSL(.95 + rnd() * .1, .25, .85) }));
      const sc = 260 + rnd() * 380; sp.scale.set(sc, sc * .5, 1); sp.position.set(rnd() * W * 1.6 - W * .3, -rnd() * s.H, z); s.grp.add(sp); s.clouds.push({ sp, v: 4 + rnd() * 10 });
    }
    // pháp trận dưới nút + tia sáng chương hiện tại
    for (let i = 0; i < N; i++) {
      const n = L[i], p = nodeP(i), col = n.st === 'lock' ? '#6a6a88' : n.st === 'done' ? '#7ae0a0' : '#ffc94a', cur = n.st === 'cur', r = cur ? 74 : 46;
      const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: R3.runeTex(col), transparent: true, opacity: n.st === 'lock' ? .3 : .85, blending: T.AdditiveBlending, depthWrite: false }));
      m.scale.set(r * 2, r * 2, 1); m.position.set(p.x, p.y, -4); s.grp.add(m); s.anim.push({ rot: m, sp: (i % 2 ? 1 : -1) * (cur ? .6 : .25) });
      if (cur) { const gl = R3.glowSprite(0xff9a5a, 260, .75); gl.position.set(p.x, p.y, 10); s.grp.add(gl); s.anim.push({ pulse: gl, base: 260 }); const bm = R3.glowSprite(0xffb060, 1, .3); bm.scale.set(70, 520, 1); bm.position.set(p.x, p.y + 240, -2); s.grp.add(bm) }
    }
    // đom đóm chạy dọc đường vàng
    const FN = 46, fp = new Float32Array(FN * 3), fg = new T.BufferGeometry(); fg.setAttribute('position', new T.BufferAttribute(fp, 3));
    s.fire = new T.Points(fg, new T.PointsMaterial({ map: R3.sparkTex(), color: 0xffe08a, size: 14, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false })); s.fire.frustumCulled = false; s.grp.add(s.fire); s.fn = FN; s.fph = Array.from({ length: FN }, () => rnd());
  }
  function sky(prog) {
    const s = st, k = M.round(prog * 40); if (k === s.bgk) return; s.bgk = k; const g = s.bgc.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
    const t = prog, top = hsl(lerp(255, 270, t), .45, lerp(.1, .28, t)), mid = hsl(lerp(270, 330, t), .4, lerp(.2, .5, t)), bot = hsl(lerp(150, 42, t), .5, lerp(.14, .6, t));
    gr.addColorStop(0, '#' + top.getHexString()); gr.addColorStop(.55, '#' + mid.getHexString()); gr.addColorStop(1, '#' + bot.getHexString()); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); s.bgt.needsUpdate = true;
  }
  function frame(ts) {
    const s = st; if (!s) return; if (!document.getElementById('hmap') || document.getElementById('hmap') !== s.root) { end(); return }
    s.raf = requestAnimationFrame(frame); const S = R3.S, dt = M.min(.05, (ts - s.last) / 1000 || .016); s.last = ts; s.t += dt;
    if (S.q === 0 && dt < .03) { /* giảm tải máy yếu: vẫn vẽ nhưng nhẹ */ }
    const el = S.host.cv, Wc = el.clientWidth || 360, Hc = el.clientHeight || 640;
    if (Wc !== s.W || Hc !== s.Hc) { s.W = Wc; s.Hc = Hc; S.ren.setSize(Wc, Hc, false); s.cam.aspect = Wc / Hc; s.cam.updateProjectionMatrix() }
    const sc = s.root.querySelector('.sc'), cv = s.root.querySelector('.cv'); if (!sc || !cv) return;
    const W = cv.clientWidth; if (W && M.abs(W - s.cvW) > 2) { s.cvW = W; s.grp.clear(); s.anim.length = 0; s.clouds.length = 0; build() }
    const a = el.getBoundingClientRect(), b = sc.getBoundingClientRect(), c = cv.getBoundingClientRect();
    const dd = 900; s.cam.fov = 2 * M.atan(Hc / 2 / dd) * 180 / PI; s.cam.updateProjectionMatrix();
    const left = c.left - a.left, scTop = b.top - a.top, camY = -(sc.scrollTop - scTop + Hc / 2);
    s.cam.position.set(Wc / 2 - left, camY, dd); s.cam.lookAt(Wc / 2 - left, camY, 0);
    sky(clamp(1 - (sc.scrollTop + sc.clientHeight / 2) / M.max(1, s.H), 0, 1));
    s.mats.forEach(m => m.uniforms.uT.value = s.t);
    for (const o of s.anim) { if (o.g) { o.g.position.y = o.y0 + M.sin(s.t * o.sp + o.ph) * 8; o.g.rotation.y += o.ry * dt } else if (o.rot) o.rot.rotation.z += o.sp * dt; else if (o.pulse) { const k = 1 + .12 * M.sin(s.t * 3); o.pulse.scale.set(o.base * k, o.base * k, 1) } }
    for (const q of s.clouds) { q.sp.position.x += q.v * dt; if (q.sp.position.x > W * 1.4) q.sp.position.x = -W * .5 }
    const pa = s.fire.geometry.attributes.position.array, g = s.gold, gl = g.length - 1; for (let i = 0; i < s.fn; i++) { const u = (s.fph[i] + s.t * .03 * (.6 + (i % 5) * .15)) % 1, f = u * gl, j = f | 0, p0 = g[j], p1 = g[M.min(gl, j + 1)], tt = f - j; pa[i * 3] = lerp(p0.x, p1.x, tt) + M.sin(s.t * 2 + i) * 7; pa[i * 3 + 1] = lerp(p0.y, p1.y, tt) + M.cos(s.t * 1.7 + i) * 7; pa[i * 3 + 2] = 12 }
    s.fire.geometry.attributes.position.needsUpdate = true;
    S.ren.render(s.scene, s.cam);
  }
  function end() {
    if (!st) return; const s = st; st = null; cancelAnimationFrame(s.raf); R3.mapOn = false; document.body.classList.remove('hm3'); if (s.root) s.root.classList.remove('r3');
    s.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material.map) o.material.dispose() }); s.bgt.dispose();
    const S = R3.S; if (S.cv && !S.on && !(R3.home && R3.home.on)) S.cv.style.display = s.was || 'none'; if (R3.home) R3.home.W = 0;
  }
  const o = DV_MAP.open; DV_MAP.open = function (c) { const r = o.apply(this, arguments); try { const root = document.getElementById('hmap'); if (root) begin(root, c) } catch (e) { console.warn('r3d map', e); end() } return r };
  R3.mapEnd = end;
})();
