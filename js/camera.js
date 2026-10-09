/* Phase 13 — CAMERA CONTROLLER  (window.DV_CAM)
   Zoom chiến đấu: người chơi tự zoom (lăn chuột / kẹp 2 ngón / nút ＋ － / phím - = 0) + camera TỰ ĐỘNG thông minh.
   Hệ số zoom z < 1 = nhìn được vùng rộng hơn (zoom out). index.html vẽ thế giới với kích thước ảo W/z × H/z nên thấy THÊM quái thật sự
   (không phải chỉ thu nhỏ hình), spawn/quái bị bỏ xa cũng tính theo vùng nhìn ảo.
   Mục tiêu zoom tự động = min( mật độ quái, Boss, kỹ năng diện rộng, cảnh Boss xuất hiện ) × zoom người chơi, rồi kẹp trong [min,max].
     ít quái → 100% · nhiều quái → ~90–85% · Boss lớn → 80–90% · Tuyệt kỹ phạm vi lớn → zoom out nhẹ rồi trả lại
   Chuyển động mượt (zoom out nhanh hơn zoom in để không bị mất tầm nhìn), có giới hạn min/max để không lỗi.
   API: init({store,put,size,stop}) · update(dt,G) · zoom() · skill(src,G,R) · wide(R,dur) · bossIntro(boss) · setUser(v) · step(d) · reset() · stats() · settingsHtml() */
(function () {
  'use strict';
  const M = Math, C = { min: .62, max: 1.25, uMin: .7, uMax: 1.2, crowd: .84, wide: .78, boss: .8, lo: 22, hi: 75 };
  const S = { z: 1, tz: 1, user: 1, cn: 0, scan: 0, wide: 0, wideT: 0, intro: 0, introT: 2.4, cfg: null, pin: null, ptr: new Map(), lab: null };
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const store = () => (S.cfg && S.cfg.store && S.cfg.store()) || {};
  const autoOn = () => store().cama !== 0;

  function init(c) {
    S.cfg = c; const s = store();
    if (s.cama == null) s.cama = 1;
    S.user = cl(+s.camu || 1, C.uMin, C.uMax); S.z = S.tz = 1;
    bind(); buildUI();
  }
  function reset() { S.z = S.tz = 1; S.cn = 0; S.wide = 0; S.wideT = 0; S.intro = 0; label() }

  /* ----- điều khiển của người chơi ----- */
  function setUser(v) {
    S.user = cl(v, C.uMin, C.uMax); const s = store(); s.camu = M.round(S.user * 100) / 100; if (S.cfg && S.cfg.put) S.cfg.put(); label();
  }
  const step = d => setUser(S.user + d);
  function bind() {
    if (bind.k) return; bind.k = 1;
    const cv = document.getElementById('cv') || document.querySelector('canvas');
    if (cv) {
      cv.addEventListener('wheel', e => { e.preventDefault(); step(-e.deltaY * .0012) }, { passive: false });
      const dist = () => { const p = [...S.ptr.values()]; return M.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1 };
      cv.addEventListener('pointerdown', e => {
        S.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (S.ptr.size === 2) { S.pin = { d: dist(), u: S.user }; if (S.cfg && S.cfg.stop) S.cfg.stop() }
      });
      cv.addEventListener('pointermove', e => {
        if (!S.ptr.has(e.pointerId)) return; S.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (S.pin && S.ptr.size >= 2) setUser(S.pin.u * dist() / S.pin.d);
      });
      const up = e => { S.ptr.delete(e.pointerId); if (S.ptr.size < 2) S.pin = null };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    }
    addEventListener('keydown', e => {
      if (e.key === '-' || e.key === '_') step(-.1); else if (e.key === '=' || e.key === '+') step(.1); else if (e.key === '0') setUser(1);
    });
  }
  function buildUI() {
    if (document.getElementById('zm')) return;
    const hud = document.getElementById('hud'); if (!hud) return;
    const st = document.createElement('style');
    st.textContent = '#zm{pointer-events:auto;position:absolute;right:16px;bottom:calc(env(safe-area-inset-bottom) + 172px);display:flex;flex-direction:column;align-items:center;gap:4px;z-index:6;user-select:none}' +
      '#zm button{width:36px;height:36px;border-radius:50%;border:2px solid #a8802f;background:rgba(20,26,50,.78);color:#ffe9a8;font:700 18px/1 Georgia,serif;cursor:pointer;padding:0;touch-action:manipulation}' +
      '#zm button:active{transform:scale(.92)}#zm small{font-size:10px;color:#ffe9a8;text-shadow:0 1px 2px #000;opacity:.9}';
    document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'zm';
    d.innerHTML = '<button id="zin" aria-label="Phóng to">＋</button><small id="zl">100%</small><button id="zout" aria-label="Thu nhỏ">－</button>';
    hud.appendChild(d); S.lab = d.querySelector('#zl');
    d.querySelector('#zin').onclick = () => step(.1); d.querySelector('#zout').onclick = () => step(-.1);
    d.querySelector('#zl').onclick = () => setUser(1);
    ['pointerdown', 'touchstart'].forEach(ev => d.addEventListener(ev, e => e.stopPropagation()));
    label();
  }
  const label = () => { if (S.lab) S.lab.textContent = M.round(S.z * 100) + '%' };

  /* ----- đếm quái trong vùng nhìn ----- */
  function count(G, W, H) {
    const P = G.p, R0 = M.hypot(W, H) * .62; let n = 0;
    for (const e of G.en) { if (e.dead) continue; const dx = e.x - P.x, dy = e.y - P.y; if (dx * dx + dy * dy < R0 * R0) n += e.boss ? 6 : e.mb ? 4 : 1 }
    S.cn += (n - S.cn) * .4;
  }

  /* ----- sự kiện camera ----- */
  function wide(R, dur) { if (R > S.wide || S.wideT <= 0) S.wide = R; S.wideT = M.max(S.wideT, dur || .9) }
  function bossIntro(b) { S.intro = S.introT; S.ib = b }
  function skill(src, G, R) {
    const f = window.DV_DATA && DV_DATA.skillfx, s = f && f.resolve ? f.resolve(src, G) : null, ce = (s && s.cameraEffect) || {};
    const r = M.max(R || 0, ce.wide || 0);
    if (r >= 150) wide(r + 20, src === 'ult' ? 1.15 : .8);
    if (!window.DV_VFX && ce.shake && G) G.shake = M.max(G.shake || 0, ce.shake);
  }

  function update(dt, G) {
    const W = S.cfg.size()[0], H = S.cfg.size()[1], P = G.p;
    S.scan -= dt; if (S.scan <= 0) { S.scan = .2; count(G, W, H) }
    let t = 1;
    if (autoOn()) {
      const n = S.cn; t = M.min(t, n <= C.lo ? 1 : n >= C.hi ? C.crowd : 1 - (1 - C.crowd) * (n - C.lo) / (C.hi - C.lo));
      const b = G.boss;
      if (b && !b.dead) {
        const d = M.hypot(b.x - P.x, b.y - P.y), half = M.min(W, H) / 2, fit = half / (d + b.r * 1.4 + 40), bf = b.r >= 28 ? .84 : .9;
        t = M.min(t, M.max(C.boss, M.min(bf, fit)));
      }
      if (S.intro > 0) {
        S.intro -= dt; const u = 1 - S.intro / S.introT, k = u < .25 ? u / .25 : u > .75 ? (1 - u) / .25 : 1;   /* ra – giữ – về */
        const b2 = S.ib && !S.ib.dead ? S.ib : null, fit = b2 ? M.min(W, H) / 2 / (M.hypot(b2.x - P.x, b2.y - P.y) + b2.r * 1.4 + 40) : .85;
        t = M.min(t, 1 - (1 - M.max(C.boss, M.min(.86, fit))) * k);
      }
      if (S.wideT > 0) { S.wideT -= dt; t = M.min(t, cl(M.min(W, H) / 2 / (S.wide * 1.12), C.wide, 1)) }
    } else { S.intro = M.max(0, S.intro - dt); S.wideT = M.max(0, S.wideT - dt) }
    S.tz = cl(t * S.user, C.min, C.max);
    S.z += (S.tz - S.z) * (1 - M.exp(-(S.tz < S.z ? 3.4 : 1.5) * dt));
    S.z = cl(S.z, C.min, C.max);
    if (!update.l || (update.l -= dt) <= 0) { update.l = .25; label() }
  }
  const settingsHtml = () => `<div class="row"><span>🎥 Camera tự động zoom</span><b data-set="cama" style="cursor:pointer;color:#ffd978">${autoOn() ? 'BẬT' : 'TẮT'}</b></div><div class="row"><span>🔍 Zoom hiện tại</span><b style="color:#ffd978">${M.round(S.user * 100)}% <small style="font-weight:400;opacity:.8">(＋ － · lăn chuột · kẹp 2 ngón)</small></b></div>`;

  window.DV_CAM = {
    ok: () => true, init, update, reset, zoom: () => S.z, skill, wide, bossIntro, setUser, step, settingsHtml,
    stats: () => ({ z: S.z, tz: S.tz, user: S.user, auto: autoOn(), crowd: S.cn, wideT: S.wideT, intro: S.intro }), CFG: C
  };
})();
