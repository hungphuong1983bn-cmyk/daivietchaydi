/* Phase 22 — HIỆU ỨNG ÔM SÁT ĐỊA HÌNH (module của DV_R3D).
   Lỗi cũ: vòng sóng, rune, vùng lửa/băng, vùng báo đòn là MẶT PHẲNG đặt ở một độ cao duy nhất (độ cao tại tâm). Địa hình cao thấp hàng chục đơn vị
   → chỗ đồi cao nhô lên che mất một phần hiệu ứng, chỗ trũng thì lơ lửng.
   Cách sửa: giữ "bản đồ độ cao" 160×160 quanh nhân vật (texture half-float, dựng từ R3.height, làm mới theo từng lát mỗi khung) và vá vertex shader của
   các vật liệu hiệu ứng (R3.drape(mat)): mọi đỉnh nằm sát mặt phẳng cục bộ (position.y<.6, pháp tuyến hướng lên) được nâng/hạ theo độ cao địa hình tại CHÍNH đỉnh đó
   (so với độ cao tại tâm vật thể). Hiệu ứng thẳng đứng (cột sáng, mái vòm, cầu) không bị ảnh hưởng. Không đổi vùng sát thương (logic vẫn ở toạ độ 2D). */
(function () {
  'use strict';
  const R3 = window.DV_R3D, T = window.THREE; if (!R3 || !T || !T.DataUtils) return;
  const N = 160, SIZE = 2400, CELL = SIZE / N, ROWS = 16, REBUILD = 420, M = Math;
  const data = new Uint16Array(N * N), tex = new T.DataTexture(data, N, N, T.RedFormat, T.HalfFloatType);
  tex.minFilter = tex.magFilter = T.LinearFilter; tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  const U = { uDvH: { value: tex }, uDvB: { value: new T.Vector4(0, 0, SIZE, 0) } };   // xy = góc nhỏ nhất, z = cạnh, w = đã sẵn sàng
  const job = { ox: 0, oz: 0, row: 0, buf: new Uint16Array(N * N), on: false }, toH = T.DataUtils.toHalfFloat;
  let cx = 1e9, cz = 1e9;

  function rows(n) {   // dựng n hàng của bản đồ đang xây
    const h = R3.height, b = job.buf;
    for (let k = 0; k < n && job.row < N; k++, job.row++) { const z = job.oz + (job.row + .5) * CELL, o = job.row * N; for (let i = 0; i < N; i++) b[o + i] = toH(M.max(-200, M.min(200, h(job.ox + (i + .5) * CELL, z)))) }
    if (job.row >= N) { data.set(b); tex.needsUpdate = true; U.uDvB.value.set(job.ox, job.oz, SIZE, 1); job.on = false }
  }
  function start(px, pz) { job.ox = px - SIZE / 2; job.oz = pz - SIZE / 2; job.row = 0; job.on = true; cx = px; cz = pz }
  R3.dvDrapeReady = () => U.uDvB.value.w > .5;

  /* vá vật liệu: dùng cho mọi decal nằm trên mặt đất */
  R3.drape = function (mat) {
    if (!mat || mat.userData.dvd) return mat; mat.userData.dvd = 1; const prev = mat.onBeforeCompile;
    mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
    mat.onBeforeCompile = function (sh, rn) {
      if (prev) prev.call(this, sh, rn); sh.uniforms.uDvH = U.uDvH; sh.uniforms.uDvB = U.uDvB;
      sh.vertexShader = 'uniform sampler2D uDvH;uniform vec4 uDvB;\nfloat dvH(vec2 p){vec2 u=clamp((p-uDvB.xy)/uDvB.z,0.,1.);return texture2D(uDvH,u).r;}\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nif(uDvB.w>.5&&position.y<.6&&normal.y>.9){vec3 dvw=(modelMatrix*vec4(transformed,1.)).xyz;vec3 dvo=modelMatrix[3].xyz;float dvs=max(length(modelMatrix[1].xyz),1e-3);transformed.y+=(dvH(dvw.xz)-dvH(dvo.xz))/dvs;}');
    };
    const k = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : null; mat.customProgramCacheKey = () => 'dvd' + (k ? k() : '');
    return mat;
  };

  R3.reg({
    begin(S, G) { U.uDvB.value.w = 0; job.on = false; cx = cz = 1e9 },
    end() { U.uDvB.value.w = 0; job.on = false; cx = cz = 1e9 },
    update(S, G, dt) {
      const P = G && G.p; if (!P) return;
      if (job.on) rows(U.uDvB.value.w > .5 ? ROWS : N);   // lần đầu dựng một mạch (≈35 ms); các lần sau chia lát
      else if (M.hypot(P.x - cx, P.y - cz) > REBUILD || U.uDvB.value.w < .5) { start(P.x, P.y); rows(U.uDvB.value.w > .5 ? ROWS : N) }
    }
  });
})();
