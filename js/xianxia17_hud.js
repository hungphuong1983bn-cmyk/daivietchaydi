/* Phase 17 · Phần 6 — HUD VIỀN VÀNG KIM (DV_XIAN17H)
 * Chỉ đổi giao diện (CSS) của HUD trong trận. KHÔNG đổi bố cục/kích thước ô, logic cập nhật của hud(), vị trí nút bấm, dữ liệu lưu.
 * Mọi khung vàng dùng box-shadow/outline/pseudo-element nên không làm xô lệch bố cục cũ.
 * Gỡ: xoá thẻ <script src="js/xianxia17_hud.js"> hoặc DV_XIAN17H.enabled=false (gỡ <style>, HUD về Phase 17 phần 4).
 *
 *  - Huy hiệu cấp (avatar): vòng vàng kim 2 lớp, đinh tán 4 góc, bóng sáng.
 *  - 3 thanh HP / Năng lượng / EXP: khung vàng kim bo góc, vạch đo 25/50/75%, vệt sáng bóng trên mặt thanh; HP < 30% đỏ nhấp nháy.
 *  - Bảng chỉ số (vàng, đá quý, màn, thời gian, hạ gục): nền tối trong mờ, viền vàng kim + 4 góc trang trí.
 *  - Nút Tuyệt Kỹ: vòng vàng kim, mép răng cưa nhẹ; sẵn sàng thì toả sáng. Nút Tạm dừng: vòng vàng kim.
 *  Tôn trọng prefers-reduced-motion (không nhấp nháy/chuyển động). Thấp = bỏ bóng đổ mờ, vệt sáng bóng (rẻ nhất cho GPU điện thoại yếu).
 */
(function () {
  'use strict';
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const $ = (id) => document.getElementById(id);
  const S = { G: null, low: false, q: 2, lastQ: -1 };
  const GOLD = 'linear-gradient(135deg,#fff1b8 0%,#e8b84a 28%,#9a6a14 52%,#f2cf6a 76%,#fff1b8 100%)';

  const css = `
/* ===== Phase 17.6 · HUD viền vàng kim ===== */
#hud .av{border:3px solid transparent!important;
 background:url(assets/hero.png) 52% 4%/270% auto no-repeat padding-box,${GOLD} border-box #1b2850!important;
 box-shadow:0 0 0 2px #2a1a05,0 0 14px rgba(255,200,80,.55),inset 0 0 8px #000!important;position:relative;color:#fff6d0}
#hud .av::after{content:"";position:absolute;inset:-7px;border-radius:50%;pointer-events:none;border:1px solid rgba(255,225,140,.55);
 background:
  radial-gradient(circle at 50% 0,#ffe9a8 0 2.2px,transparent 3px),radial-gradient(circle at 50% 100%,#ffe9a8 0 2.2px,transparent 3px),
  radial-gradient(circle at 0 50%,#ffe9a8 0 2.2px,transparent 3px),radial-gradient(circle at 100% 50%,#ffe9a8 0 2.2px,transparent 3px)}
#hud .bars .bar{border:2px solid transparent!important;border-radius:5px!important;overflow:hidden;
 background:linear-gradient(#150a0c,#150a0c) padding-box,${GOLD} border-box!important;
 box-shadow:0 0 0 1px #2a1a05,0 0 8px rgba(255,190,70,.3),inset 0 2px 4px rgba(0,0,0,.85)!important}
#hud .bars .bar::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
 background:linear-gradient(90deg,transparent calc(25% - .5px),rgba(255,235,170,.4) 25%,transparent calc(25% + .5px),transparent calc(50% - .5px),rgba(255,235,170,.4) 50%,transparent calc(50% + .5px),transparent calc(75% - .5px),rgba(255,235,170,.4) 75%,transparent calc(75% + .5px)),
  linear-gradient(180deg,rgba(255,255,255,.28),transparent 45%)}
#hud .bars .bar b{z-index:3;text-shadow:0 1px 2px #000,0 0 4px #000}
#hud .bars .bar.x17lo i{animation:x17h .55s ease-in-out infinite alternate}
@keyframes x17h{from{filter:brightness(1)}to{filter:brightness(1.7) saturate(1.3)}}
#hud .hrow .stat{padding:5px 8px 5px 9px;border-radius:6px;border:2px solid #d9ab45;position:relative;font-weight:700;color:#fff1c8;
 background:linear-gradient(rgba(8,10,26,.68),rgba(8,10,26,.68));box-shadow:0 0 0 1px #2a1a05,inset 0 0 0 1px rgba(255,236,170,.4),0 0 10px rgba(255,190,70,.25)}
#hud .hrow .stat::before,#hud .hrow .stat::after{content:"";position:absolute;width:9px;height:9px;pointer-events:none;border:2px solid #ffe9a8}
#hud .hrow .stat::before{left:-4px;top:-4px;border-right:0;border-bottom:0;border-radius:3px 0 0 0}
#hud .hrow .stat::after{right:-4px;bottom:-4px;border-left:0;border-top:0;border-radius:0 0 3px 0}
#hud #ult{border:3px solid transparent!important;
 background:radial-gradient(#26305e 58%,transparent 60%) padding-box,conic-gradient(#ffd34a var(--p,0deg),#2a2418 0) padding-box,${GOLD} border-box!important;
 box-shadow:0 0 0 2px #2a1a05,0 0 10px rgba(255,190,70,.35),inset 0 0 6px #000}
#hud #ult::after{content:"";position:absolute;inset:-6px;border-radius:50%;pointer-events:none;border:2px dotted rgba(255,225,140,.6)}
#hud #ult.rd{box-shadow:0 0 0 2px #2a1a05,0 0 26px #ffb62e,0 0 46px rgba(255,210,90,.55)!important}
#hud #ult.rd::after{border-color:#fff1b8;${RM ? '' : 'animation:x17r 6s linear infinite'}}
@keyframes x17r{to{transform:rotate(360deg)}}
#hud #pz{border:2px solid transparent!important;background:linear-gradient(#0a0e20,#0a0e20) padding-box,${GOLD} border-box!important;box-shadow:0 0 0 1px #2a1a05,0 0 8px rgba(255,190,70,.3)}
#hud.x17hlow .bars .bar:first-child{box-shadow:0 0 0 1px #2a1a05,0 0 10px rgba(255,70,50,.7),inset 0 2px 4px rgba(0,0,0,.85)!important}
/* chất lượng Thấp: bỏ toàn bộ bóng sáng mờ + vệt bóng (rẻ cho GPU) */
#hud.x17lq .av,#hud.x17lq .hrow .stat,#hud.x17lq #ult,#hud.x17lq #pz,#hud.x17lq .bars .bar{box-shadow:0 0 0 1px #2a1a05!important}
#hud.x17lq .bars .bar::after{background:linear-gradient(90deg,transparent calc(50% - .5px),rgba(255,235,170,.4) 50%,transparent calc(50% + .5px))}
#hud.x17lq .av::after,#hud.x17lq #ult::after,#hud.x17lq .hrow .stat::before,#hud.x17lq .hrow .stat::after{display:none}
#hud.x17lq #ult.rd{animation:none}
${RM ? '#hud .bars .bar.x17lo i{animation:none}#hud #ult.rd{animation:none}' : ''}`;

  function style() {
    let st = $('x17hs');
    if (!st) { st = document.createElement('style'); st.id = 'x17hs'; st.textContent = css; document.head.appendChild(st) }
    st.disabled = !DV_XIAN17H.enabled;
  }

  // mỗi khung: chỉ đổi class khi trạng thái thay đổi (rẻ, không đụng style trực tiếp)
  const ENV = window.DV_ENV;
  if (ENV && ENV.drawAfter) {
    const oA = ENV.drawAfter;
    ENV.drawAfter = function () {
      oA.apply(this, arguments);
      const G = S.G; if (!G || !G.p || !DV_XIAN17H.enabled) return;
      try {
        const hud = $('hud'), bar = $('hpb') && $('hpb').parentNode; if (!hud || !bar) return;
        const low = G.p.hp < G.p.mhp * .3;
        if (low !== S.low) { S.low = low; bar.classList.toggle('x17lo', low); hud.classList.toggle('x17hlow', low) }
        const x = window.DV_XIAN17, q = x && x.state ? x.state().q : 2;
        if (q !== S.lastQ) { S.lastQ = q; hud.classList.toggle('x17lq', q === 0) }
      } catch (e) { }
    };
  }

  window.DV_XIAN17H = {
    ok: () => true, stats: {}, state: () => S,
    begin(G) { S.G = G; S.low = false; S.lastQ = -1; try { style() } catch (e) { } },
    end() { S.G = null; const h = $('hud'); if (h) h.classList.remove('x17hlow', 'x17lq'); const b = $('hpb') && $('hpb').parentNode; if (b) b.classList.remove('x17lo') }
  };
  Object.defineProperty(window.DV_XIAN17H, 'enabled', { configurable: true, get() { return this._e !== false }, set(v) { this._e = !!v; const st = $('x17hs'); if (st) st.disabled = !v } });
  // dựng CSS ngay khi tải (HUD đang ẩn nên không tốn gì) để lần vào trận đầu không bị nháy
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { try { style() } catch (e) { } }); else try { style() } catch (e) { }
})();
