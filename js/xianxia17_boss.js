/* Phase 17 · Phần 4 — BOSS & QUÁI: viền sáng + thanh máu Boss lớn (DV_XIAN17B)
 * Chỉ thêm lớp hình ảnh. Không đổi máu, sát thương, AI, kỹ năng Boss, rơi đồ, dữ liệu lưu; hud() của game vẫn là nơi cập nhật máu Boss.
 * Gỡ: xoá thẻ <script src="js/xianxia17_boss.js"> hoặc DV_XIAN17B.enabled=false (thanh máu về giao diện cũ).
 *  - Viền sáng: Boss vàng cam (dưới 50% máu chuyển đỏ cam) · Tiểu Boss tím · Tinh Anh vàng/đỏ (khớp màu vòng chân cũ).
 *    Làm bằng bóng sáng (shadowBlur) bọc quanh nét vẽ của quái nên đúng theo hình dạng, nhịp thở nhẹ. Giới hạn số quái có viền mỗi khung theo chất lượng.
 *  - Thanh máu Boss: to, huy hiệu quỷ bên trái, viền vàng kim, vạch mốc 25/50/75%, thanh "máu vừa mất" tụt dần, hiển thị %.
 */
(function () {
  'use strict';
  const M = Math;
  const S = { G: null, used: 0, lag: 1, last: 0, stats: { rim: 0 } };
  const CAP = [0, 3, 8];                                       // số quái thường (Elite/Mini) có viền / khung; Boss luôn có
  const q = () => { const x = window.DV_XIAN17; return x && x.state ? x.state().q : 2 };
  const $ = (id) => document.getElementById(id);

  /* ---------- viền sáng: bọc MA.body (hàm vẽ thân quái của Phase 9) ---------- */
  const MA = window.DV_MART;
  if (MA && MA.body) {
    const oBody = MA.body;
    MA.body = function (ctx, e) {
      if (!DV_XIAN17B.enabled || !(e.boss || e.mb || e.el)) return oBody.apply(this, arguments);
      const Q = q();
      if (!e.boss && S.used >= CAP[Q]) return oBody.apply(this, arguments);
      let c, a, blur;
      const G = S.G, t = G ? G.t : 0, pul = .5 + .5 * M.sin(t * 4 + (e.id || 0));
      if (e.boss) { c = e.hp < e.mhp * .5 ? '255,90,50' : '255,190,70'; a = .7 + .3 * pul; blur = 22 }
      else if (e.mb) { c = '190,110,255'; a = .65 + .3 * pul; blur = 16 }
      else { c = e.el > 1 ? '255,70,100' : '255,211,74'; a = .55 + .3 * pul; blur = 11 }
      if (!e.boss) S.used++; S.stats.rim++;
      const dpr = window.devicePixelRatio || 1;
      ctx.save(); ctx.shadowColor = `rgba(${c},${a})`; ctx.shadowBlur = blur * (Q === 0 ? .6 : 1) * M.min(dpr, 2);
      const r = oBody.apply(this, arguments); ctx.restore(); return r;
    };
  }

  /* ---------- thanh máu Boss ---------- */
  const css = `
#hud #bossw{max-width:min(94vw,440px)!important;position:relative;text-align:left!important;padding:0 0 0 54px!important;margin-top:8px!important;background:none!important;border:0!important;box-shadow:none!important;border-radius:0!important;font:900 15px/1.15 Georgia,serif!important;color:#ffe9a8;letter-spacing:.5px;text-shadow:0 2px 3px #000,0 0 10px rgba(255,150,40,.7)}
#hud #bossw::before{content:"👹";position:absolute;left:0;top:-4px;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;letter-spacing:0;color:#fff;text-shadow:none;
 background:radial-gradient(circle at 35% 30%,#a02a22,#3a0808 70%);border:3px solid #d6a73c;box-shadow:0 0 0 2px #2a1a05,0 0 14px rgba(255,120,40,.7),inset 0 0 8px rgba(0,0,0,.7)}
#hud #bossw .bar{height:19px!important;border:2px solid #d6a73c!important;border-radius:4px!important;background:#120608!important;margin:4px 0 0!important;
 box-shadow:0 0 0 1px #2a1a05,0 0 12px rgba(255,170,60,.45),inset 0 2px 5px rgba(0,0,0,.8)}
#hud #bossw .bar::after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(90deg,transparent calc(25% - 1px),rgba(255,230,160,.55) 25%,transparent calc(25% + 1px),transparent calc(50% - 1px),rgba(255,230,160,.55) 50%,transparent calc(50% + 1px),transparent calc(75% - 1px),rgba(255,230,160,.55) 75%,transparent calc(75% + 1px))}
#hud #bossw #bossb{position:relative;z-index:2;background:linear-gradient(180deg,#ff6a52 0%,#d21f1f 45%,#7a0a0a 100%)!important;transition:width .1s linear;box-shadow:inset 0 1px 0 rgba(255,255,255,.35)}
#hud #bossw #bossl{position:absolute;left:0;top:0;height:100%;z-index:1;background:linear-gradient(180deg,#fff0c0,#ffb24a);width:100%}
#hud #bossw #bossp{position:absolute;inset:0 7px 0 auto;width:auto;z-index:4;font:900 11px/15px Georgia,serif;color:#fff;text-shadow:0 1px 2px #000;text-align:right}
#hud #bossw.x17lo #bossb{animation:x17p .6s ease-in-out infinite alternate}
@keyframes x17p{from{filter:brightness(1)}to{filter:brightness(1.45)}}`;
  function dom() {
    if (!$('x17bs')) { const st = document.createElement('style'); st.id = 'x17bs'; st.textContent = css; document.head.appendChild(st) }
    const w = $('bossw'), bar = w && w.querySelector('.bar'); if (!bar) return null;
    if (!$('bossl')) { const u = document.createElement('u'); u.id = 'bossl'; bar.insertBefore(u, bar.firstChild) }
    if (!$('bossp')) { const b = document.createElement('b'); b.id = 'bossp'; bar.appendChild(b) }
    return w;
  }
  function bar(G, now) {
    const b = G && G.boss; if (!b) { S.lag = 1; return }
    const w = dom(); if (!w) return;
    const dt = M.min(.1, M.max(0, (now - S.last) / 1000)); S.last = now;
    const f = M.max(0, M.min(1, b.hp / M.max(1, b.mhp)));
    S.lag = M.max(f, S.lag - dt * .22);                       // thanh "máu vừa mất" tụt dần về máu thật
    $('bossl').style.width = (S.lag * 100).toFixed(1) + '%';
    $('bossp').textContent = M.ceil(f * 100) + '%';
    w.classList.toggle('x17lo', f < .3);
  }

  /* ---------- móc vào vòng vẽ (sau khung hình: cập nhật thanh máu, reset hạn mức viền) ---------- */
  const ENV = window.DV_ENV;
  if (ENV && ENV.drawAfter) { const oA = ENV.drawAfter; ENV.drawAfter = function () { oA.apply(this, arguments); S.used = 0; if (DV_XIAN17B.enabled) try { bar(S.G, performance.now()) } catch (e) { } }; }

  window.DV_XIAN17B = {
    ok: () => true, enabled: true, stats: S.stats, state: () => S,
    begin(G) { S.G = G; S.lag = 1; S.last = performance.now(); try { dom() } catch (e) { } },
    end() { S.G = null; const w = $('bossw'); if (w) w.classList.remove('x17lo') },
    set on(v) { this.enabled = !!v }
  };
  // tắt: trả thanh máu về giao diện cũ (gỡ <style>)
  Object.defineProperty(window.DV_XIAN17B, 'enabled', { configurable: true, get() { return this._e !== false }, set(v) { this._e = !!v; const st = $('x17bs'); if (st) st.disabled = !v } });
})();
