/* Phase 22 — MÀN HÌNH CHÍNH CAO CẤP (chỉ giao diện: CSS ghi đè + dời thẻ thông tin tướng; KHÔNG đổi logic các nút / dữ liệu).
   Mục tiêu: gọn, cân đối, cùng một ngôn ngữ thiết kế (kính tối viền vàng), NHÂN VẬT HIỆN ĐỦ TOÀN THÂN:
   · Thẻ thông tin tướng (#hpn, trước đây đè lên chân/kiếm nhân vật) được dời xuống DƯỚI sân khấu nhân vật.
   · Bỏ nút trùng lặp (Tướng/Túi đã có ở thanh dưới, Triệu hồi đã có ở cột phải) → lưới chức năng còn 5 ô gọn; hàng ô trang bị ẩn (xem ở "Trang bị").
   · Sân khấu không cắt hiệu ứng (aura, hạt, bong bóng thoại), có bệ sáng dưới chân.  Tự co theo chiều cao màn hình (≤740 / ≤640 / ngang). */
(function () {
  'use strict';
  if (window.__homePro) return; window.__homePro = 1;
  const CSS = `
:root{--hp-gold:#e8b84a;--hp-gold2:rgba(232,184,74,.5);--hp-glass:linear-gradient(180deg,rgba(30,22,52,.78),rgba(10,9,26,.86));--hp-hi:inset 0 1px 0 rgba(255,236,190,.16),inset 0 0 0 1px rgba(255,220,140,.05)}
#menu{gap:7px!important;padding:max(8px,env(safe-area-inset-top)) 12px max(6px,env(safe-area-inset-bottom))!important}
/* ===== thanh trên ===== */
#menu #htop{gap:9px;padding:6px 9px;border-radius:16px;border:1px solid var(--hp-gold2);background:var(--hp-glass);box-shadow:var(--hp-hi),0 4px 14px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
#menu #htop .av{width:42px;height:42px;flex:none;font-size:16px;box-shadow:0 0 0 2px #1a1230,0 0 0 3px var(--hp-gold),0 0 10px rgba(232,184,74,.45)}
#menu #htop .hb{flex:1;min-width:0}#menu #htop .hb>b{font-size:14px;letter-spacing:.2px;text-shadow:0 1px 3px #000}
#menu #htop .cur{flex:none;width:auto;display:grid;grid-template-columns:auto auto;gap:3px 5px;align-items:center}
#menu #htop .cur>span{display:inline-flex;align-items:center;justify-content:center;gap:3px;height:20px;padding:0 8px;border-radius:10px;background:rgba(0,0,0,.38);border:1px solid rgba(232,184,74,.28);font-size:11px;font-weight:700;white-space:nowrap;line-height:1;margin:0}
/* ===== biểu ngữ chương ===== */
#menu #hchap{max-width:100%;padding:5px 14px 6px 12px;border-radius:5px 14px 14px 5px;display:flex;align-items:center;gap:12px;flex-wrap:nowrap}
#menu #hchap small{flex:none;font-size:10px;letter-spacing:1.5px}#menu #hchap b{flex:1;min-width:0;font-size:15px}
#menu #hchap .pg{flex:none;width:34%;margin:0}
/* ===== sân khấu nhân vật ===== */
#menu #hmid{gap:6px;min-height:200px;align-items:stretch}
#menu #hstage{overflow:visible!important;align-items:flex-end}
#menu #hstage .ring{bottom:5%;width:70%;margin-left:-35%;border-color:rgba(255,217,120,.75);box-shadow:0 0 22px rgba(255,190,70,.6),inset 0 0 18px rgba(255,190,70,.4)}
#menu #hstage::before{content:'';position:absolute;left:50%;bottom:3%;width:84%;height:20%;margin-left:-42%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(255,206,110,.34),rgba(255,160,60,.12) 50%,transparent 72%);pointer-events:none;z-index:0}
#menu .hcol{width:58px;gap:8px;justify-content:center}
#menu #hmid .ib{min-height:56px;border-radius:16px;border:1px solid var(--hp-gold2);background:var(--hp-glass);box-shadow:var(--hp-hi),0 3px 10px rgba(0,0,0,.35);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
#menu #hmid .ib .i{font-size:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}#menu #hmid .ib em{font-size:9.5px;color:#f3e3b8;margin-top:3px}
#menu #hmid .ib.has{border-color:#ffd978;box-shadow:var(--hp-hi),0 0 14px rgba(255,200,80,.55)}
/* ===== thẻ thông tin tướng (đã dời xuống dưới sân khấu) ===== */
#menu>#hpn{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;width:100%;z-index:2;padding:7px 10px 8px;border-radius:16px;border:1px solid var(--hp-gold2);background:var(--hp-glass);box-shadow:var(--hp-hi),0 4px 14px rgba(0,0,0,.4);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
#menu>#hpn .r1 b{font-size:15px}#menu>#hpn .gp{display:none!important}#menu>#hpn .r3{margin-top:0}
#menu>#hpn .xp{margin:4px 0}#menu>#hpn .st{font-size:11px;padding:0 2px}
#menu>#hpn .bt{margin-top:6px;gap:6px}#menu>#hpn button{min-height:36px;border-radius:11px}
/* ===== chip nhanh / ô trang bị / lưới chức năng ===== */
#menu #hdash{gap:6px}#menu .dc{min-height:26px;padding:2px 4px;border-radius:13px;font-size:10.5px;background:var(--hp-glass);border:1px solid var(--hp-gold2)}
#menu #hdeq{display:none!important}
#menu #hgrid{grid-template-columns:repeat(5,1fr);gap:6px}
#menu #hgrid .ib[data-m="hero"],#menu #hgrid .ib[data-m="inv"],#menu #hgrid .ib[data-m="sum"]{display:none}
#menu #hgrid .ib{min-height:52px;border-radius:14px;border:1px solid var(--hp-gold2);background:var(--hp-glass);box-shadow:var(--hp-hi);flex-direction:column}
#menu #hgrid .ib .i{font-size:21px}#menu #hgrid .ib em{font-size:10px;margin-top:2px}
/* ===== nút vào trận + thanh dưới ===== */
#menu #b-fight{min-height:58px;font-size:20px;border-radius:18px;margin-top:1px}
#menu #hnav{border-radius:18px;border:1px solid var(--hp-gold2);background:linear-gradient(180deg,rgba(26,20,46,.94),rgba(8,8,22,.97));box-shadow:var(--hp-hi),0 -2px 14px rgba(0,0,0,.35)}
#menu #hnav button{min-height:50px;font-size:10px;letter-spacing:.4px}#menu #hnav button.on{border-radius:14px;margin:3px;min-height:44px;box-shadow:0 0 12px rgba(255,200,80,.5)}
#menu .ver{font-size:10px;opacity:.55;margin-top:-2px!important}
/* ===== co theo màn hình ===== */
@media (max-height:760px){#menu #hdash{display:none}#menu .ver{display:none}#menu #hmid{min-height:170px}}
@media (max-height:660px){#menu{gap:5px!important}#menu #hchap{display:none}#menu>#hpn .st,#menu>#hpn .r3{display:none}#menu .hcol{gap:5px}#menu #hmid .ib{min-height:43px;border-radius:13px}#menu #hmid .ib .i{font-size:19px}#menu #hmid .ib em{display:none}#menu #hgrid .ib{min-height:44px}#menu #hgrid .ib em{display:none}#menu #b-fight{min-height:50px;font-size:18px}#menu #hnav button{min-height:42px}}
@media (orientation:landscape) and (max-height:520px){#menu>#hpn .st{display:none}}
`;
  function move() {   // dời thẻ tướng ra khỏi sân khấu (heroshow.js giữ tham chiếu nên vẫn cập nhật bình thường)
    const pn = document.getElementById('hpn'), mid = document.getElementById('hmid'); if (!pn || !mid) return;
    if (pn.parentNode !== mid.parentNode || pn.previousElementSibling !== mid) mid.insertAdjacentElement('afterend', pn);
  }
  function init() {
    if (!document.getElementById('hp-css')) { const s = document.createElement('style'); s.id = 'hp-css'; s.textContent = CSS; document.head.appendChild(s) }
    move();
    const st = document.getElementById('hstage'), menu = document.getElementById('menu');
    if (menu) new MutationObserver(move).observe(menu, { childList: true });
    if (st) new MutationObserver(move).observe(st, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(move, 600); setTimeout(move, 2000);
})();
