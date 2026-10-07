/* DV_SEL — màn chọn nhân vật vuốt ngang.
   DV_SEL.open(ctx) · ctx={ data():{heroes,sel}, hero(id):info, pick(id), profile(id), list(), close() } */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const CSS=`
#hsel{position:absolute;inset:0;z-index:12;display:flex;flex-direction:column;overflow:hidden;color:#f3e3b8;background:#0b1020;animation:si .25s both;--c:#2f5aa8;touch-action:pan-y}
#hsel .bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,color-mix(in srgb,var(--c) 70%,#fff 10%) 0,color-mix(in srgb,var(--c) 35%,#0b1020) 42%,#0b1020 80%);transition:background .4s}
#hsel .bg::after{content:'';position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% 40%,rgba(255,230,160,.07) 0 6deg,transparent 6deg 18deg);animation:hrot 40s linear infinite}
@keyframes hrot{to{transform:rotate(360deg)}}
#hsel>*{position:relative}#hsel>.bg{position:absolute}
#hsel .tb{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 8px) 12px 4px}
#hsel .tb b{flex:1;text-align:center;font-size:16px;letter-spacing:2px;color:#ffe9b0;text-shadow:0 2px 6px #000}
#hsel .rb{font:inherit;min-width:42px;min-height:42px;border-radius:12px;border:1px solid #a8802f;background:rgba(10,10,28,.85);color:#f3e3b8;font-size:13px;cursor:pointer;padding:0 10px}
#hsel .rb:active{transform:scale(.93)}
#hsel .stg{flex:1 1 40%;min-height:190px;position:relative;cursor:grab;user-select:none}
#hsel .stg canvas{position:absolute;inset:0;width:100%;height:100%;transition:transform .28s cubic-bezier(.2,.8,.3,1),opacity .28s;will-change:transform}
#hsel .stg.lk canvas{filter:brightness(.3) grayscale(1)}
#hsel .ar{position:absolute;top:44%;font-size:26px;color:#ffd978;opacity:.8;background:none;border:0;cursor:pointer;padding:10px;z-index:3;text-shadow:0 0 8px #000}
#hsel .ar.l{left:0}#hsel .ar.r{right:0}
#hsel .nm{text-align:center;padding:0 12px}
#hsel .nm h2{margin:0;font-size:24px;color:#fff3d0;text-shadow:0 2px 8px #000;line-height:1.1}
#hsel .nm small{display:block;margin-top:2px;font-size:12px;color:#ffd978}
#hsel .tg{display:flex;gap:6px;justify-content:center;margin-top:5px;flex-wrap:wrap;font-size:11px}
#hsel .tg i{font-style:normal;padding:2px 9px;border-radius:10px;border:1px solid #a8802f;background:rgba(10,10,28,.7)}
#hsel .dots{display:flex;gap:6px;justify-content:center;margin:7px 0 4px}#hsel .dots i{width:7px;height:7px;border-radius:50%;background:#4a4262;transition:.2s}#hsel .dots i.on{width:20px;border-radius:5px;background:#ffd978}
#hsel .pn{flex:0 1 auto;max-height:42%;overflow:hidden;margin:0 10px;border:1px solid #a8802f;border-radius:14px 14px 0 0;background:linear-gradient(rgba(26,18,48,.94),rgba(10,10,28,.97));display:flex;flex-direction:column;min-height:0}
#hsel .tbs{display:flex}#hsel .tbs button{flex:1;font:inherit;font-size:13px;min-height:38px;border:0;background:none;color:#b9a77a;cursor:pointer;border-bottom:2px solid transparent}
#hsel .tbs button.on{color:#ffe9b0;border-color:#ffd978}
#hsel .pb{overflow:auto;padding:8px 12px;font-size:12px;-webkit-overflow-scrolling:touch;min-height:0;flex:1}
#hsel .sr{display:flex;align-items:center;gap:8px;margin:4px 0}#hsel .sr span{width:62px;opacity:.85}#hsel .sr .t{flex:1;height:8px;border-radius:5px;background:#201a38;overflow:hidden}#hsel .sr .t i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,var(--c),#ffd978);transition:width .5s}#hsel .sr b{width:56px;text-align:right}
#hsel .it{margin:5px 0;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05)}#hsel .it b{color:#ffd978}#hsel .it small{display:block;opacity:.8;margin-top:1px}
#hsel .eq{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;text-align:center}#hsel .eq div{padding:6px 2px;border:1px solid #6b5326;border-radius:10px;background:rgba(255,255,255,.04)}#hsel .eq .i{font-size:22px}#hsel .eq small{display:block;font-size:9.5px;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#hsel .ft{display:flex;gap:8px;padding:8px 10px calc(env(safe-area-inset-bottom) + 10px);background:rgba(8,10,24,.96);border-top:1px solid #a8802f}
#hsel .ft .btn{flex:1;max-width:none;justify-content:center;min-height:48px;font-weight:800}
#hsel .ft .btn[disabled]{filter:grayscale(.8);opacity:.6}
#hsel .tp{position:absolute;left:0;right:0;top:10px;text-align:center;font-size:11px;opacity:.6;pointer-events:none}
@media (orientation:landscape) and (max-height:520px){#hsel{flex-direction:row;flex-wrap:wrap}#hsel .tb{width:100%;padding-bottom:0}#hsel .stg{flex:1 1 38%;min-height:0;height:calc(100% - 100px)}#hsel .side{flex:1 1 55%;display:flex;flex-direction:column;min-height:0}#hsel .pn{max-height:none;flex:1}}
`;
let root,st,ctx,idx=0,tab=0,raf=0,state='idle',stT=0,clock=0,drag=null,busy=0,ids=[];
function css(){if(document.getElementById('hsel-css'))return;const s=document.createElement('style');s.id='hsel-css';s.textContent=CSS;document.head.appendChild(s)}
const row=(n,v,max,t)=>`<div class="sr"><span>${n}</span><div class="t"><i style="width:${Math.min(100,v/max*100)}%"></i></div><b>${t==null?v:t}</b></div>`;
function panel(h){
  if(tab===0){const s=h.stats;return s?row('Sinh lực',s.hp,260,s.hp)+row('Công',s.attack,260,s.attack)+row('Tốc độ',s.speed,260,s.speed)+row('Bạo kích',s.crit,.6,Math.round(s.crit*100)+'%')+row('Phòng thủ',s.defense,60,s.defense)+row('Tầm đánh',s.range,520,s.range)+row('Tốc đánh',s.attackSpeed,1.6,s.attackSpeed)
    :`<div class="it"><b>${h.st}</b></div><div class="it">HP +${h.hp} · Công +${Math.round(h.am*1000)/10}% · Tốc +${Math.round(h.sp*1000)/10}% · Bạo +${Math.round(h.cr*1000)/10}%</div>`}
  if(tab===1){const c=h.prof;if(!c)return`<div class="it"><b>Võ công khởi đầu</b><small>${h.st}</small></div><div class="it"><b>Nội tại</b><small>${h.pa}</small></div>`;
    return`<div class="it"><b>⚔ ${c.weapon.name}</b><small>${c.weapon.d}</small></div><div class="it"><b>🌀 Nội tại · ${c.passive.name}</b><small>${c.passive.d}</small></div>`+c.skills.map((k,i)=>`<div class="it"><b>${i+1}. ${k.name}</b><small>${k.d}</small></div>`).join('')+`<div class="it"><b>🐉 Tuyệt kỹ · ${c.ultimate.name}</b><small>${c.ultimate.d}</small></div>`}
  return'<div class="eq">'+h.eq.map(e=>`<div><div class="i">${e.i}</div><small>${e.n}</small></div>`).join('')+'</div><div class="it" style="margin-top:8px"><small>Trang bị dùng chung cho mọi tướng. Thay đổi trong mục Trang bị / Túi.</small></div>'}
function fill(){
  const id=ids[idx],h=ctx.hero(id);root.style.setProperty('--c',h.col||'#2f5aa8');
  $('.stg',root).classList.toggle('lk',!h.un);
  $('.nm',root).innerHTML=`<h2>${h.n}</h2><small>${h.title||''}</small><div class="tg"><i style="color:${h.qc};border-color:${h.qc}">${h.q}</i><i>${h.cls||''}</i><i>${'★'.repeat(h.s)||'☆'} Lv.${h.l}/${h.cap}</i><i>⚔ LC ${h.pw.toLocaleString('vi')}</i></div><div class="tg"><i>Cảnh giới: ${h.realm}</i></div>`;
  $('.dots',root).innerHTML=ids.map((_,i)=>`<i class="${i===idx?'on':''}"></i>`).join('');
  $('.pb',root).innerHTML=panel(h);
  [...root.querySelectorAll('.tbs button')].forEach((b,i)=>b.classList.toggle('on',i===tab));
  const b=$('#hs-pick',root);b.textContent=h.sel?'✔ ĐANG DÙNG':h.un?'CHỌN NHÂN VẬT':('MUA · '+(h.cost||''));b.disabled=!!h.sel||(!h.un&&!h.buy);
  b.dataset.mode=h.un?'pick':'buy';
  $('#hs-prof',root).style.display=h.prof?'':'none';
}
function loop(now){
  const cv=$('canvas',root);if(!cv||!root.isConnected)return;const dpr=Math.min(2,devicePixelRatio||1),r=cv.getBoundingClientRect(),W=Math.max(1,r.width|0),H=Math.max(1,r.height|0);
  if(cv.width!==W*dpr||cv.height!==H*dpr){cv.width=W*dpr;cv.height=H*dpr}
  const c=cv.getContext('2d'),dt=Math.min(.05,(now-(loop.l||now))/1000);loop.l=now;clock+=dt;stT+=dt;
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  const g=c.createRadialGradient(W/2,H*.9,4,W/2,H*.9,H*.7);g.addColorStop(0,'rgba(255,230,160,.35)');g.addColorStop(1,'rgba(255,230,160,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(W/2,H*.9,H*.2,H*.045,0,0,7);c.fill();
  const id=ids[idx],h=ctx.hero(id),CH=window.DV_CHAR;
  if(CH&&CH.ok()&&CH.get(id)){
    const R=DV_DATA.charRules,a=R.anim[state];if(a&&!a.loop&&stT>a.dur+.1){state='idle';stT=0}
    CH.draw(c,id,{x:W/2,y:H*.9,scale:H/190*2.05,f:1,t:clock,state,st:stT,aw:h.aw,asc:h.asc,max:h.max,q:RM?1:2,evo:0})
  }else{c.font=H*.5+'px serif';c.textAlign='center';c.fillText(h.i||'🧙',W/2,H*.7)}
  raf=requestAnimationFrame(loop);
}
function go(d){
  if(busy||ids.length<2)return;busy=1;const cv=$('canvas',root);
  cv.style.transition='transform .18s ease-in,opacity .18s';cv.style.transform=`translateX(${-d*60}%)`;cv.style.opacity=0;
  setTimeout(()=>{idx=(idx+d+ids.length)%ids.length;fill();state='idle';stT=0;cv.style.transition='none';cv.style.transform=`translateX(${d*60}%)`;void cv.offsetWidth;cv.style.transition='transform .28s cubic-bezier(.2,.8,.3,1),opacity .28s';cv.style.transform='';cv.style.opacity=1;setTimeout(()=>busy=0,200)},RM?0:180);
}
function close(){cancelAnimationFrame(raf);if(root){root.remove();root=null}document.removeEventListener('keydown',key)}
function key(e){if(e.key==='ArrowLeft')go(-1);else if(e.key==='ArrowRight')go(1);else if(e.key==='Escape')close()}
function open(c){
  ctx=c;css();close();const d=ctx.data();ids=d.heroes;idx=Math.max(0,ids.indexOf(d.sel));tab=0;state='idle';
  root=document.createElement('section');root.id='hsel';
  root.innerHTML=`<div class="bg"></div><div class="tb"><button class="rb" id="hs-x" aria-label="Đóng">✕</button><b>NHÂN VẬT</b><button class="rb" id="hs-ls">☰ Danh sách</button></div>
  <div class="stg"><canvas></canvas><button class="ar l" aria-label="Trước">‹</button><button class="ar r" aria-label="Sau">›</button></div>
  <div class="side"><div class="nm"></div><div class="dots"></div><div class="pn"><div class="tbs"><button>Thuộc tính</button><button>Võ công</button><button>Trang bị</button></div><div class="pb"></div></div></div>
  <div class="ft"><button class="btn" id="hs-prof">📜 Hồ sơ</button><button class="btn gold" id="hs-pick"></button></div>`;
  ($('#app')||document.body).appendChild(root);
  $('#hs-x',root).onclick=()=>{close();ctx.close&&ctx.close()};
  $('#hs-ls',root).onclick=()=>{close();ctx.list()};
  $('.ar.l',root).onclick=()=>go(-1);$('.ar.r',root).onclick=()=>go(1);
  root.querySelectorAll('.tbs button').forEach((b,i)=>b.onclick=()=>{tab=i;fill()});
  $('#hs-prof',root).onclick=()=>{close();ctx.profile(ids[idx])};
  $('#hs-pick',root).onclick=e=>{const id=ids[idx],h=ctx.hero(id);if(e.currentTarget.dataset.mode==='pick'){if(!h.sel){ctx.pick(id);fill();const a=$('#hs-pick',root);a.animate&&a.animate([{transform:'scale(1.08)'},{transform:'scale(1)'}],200)}}else{close();ctx.list()}};
  const sg=$('.stg',root);
  sg.addEventListener('pointerdown',e=>{drag={x:e.clientX,t:performance.now(),m:0};sg.setPointerCapture(e.pointerId)});
  sg.addEventListener('pointermove',e=>{if(!drag||busy)return;const dx=e.clientX-drag.x;drag.m=Math.max(drag.m,Math.abs(dx));const cv=$('canvas',root);cv.style.transition='none';cv.style.transform=`translateX(${dx*.6}px)`;cv.style.opacity=1-Math.min(.5,Math.abs(dx)/400)});
  const up=e=>{if(!drag)return;const dx=e.clientX-drag.x,m=drag.m;drag=null;const cv=$('canvas',root);cv.style.transition='';cv.style.transform='';cv.style.opacity=1;
    if(Math.abs(dx)>45)go(dx<0?1:-1);else if(m<8){state=['attack','skill','hit'][Math.random()*3|0];stT=0}};
  sg.addEventListener('pointerup',up);sg.addEventListener('pointercancel',up);
  document.addEventListener('keydown',key);fill();loop.l=0;raf=requestAnimationFrame(loop);
}
window.DV_SEL={open,close};
})();
