/* DV_MAP — bản đồ võ lâm 52 chương.
   DV_MAP.open(ctx) · ctx={ data():{list:[{c,name,place,act,hue,st:'lock'|'cur'|'open'|'done',stars,max,rank,power,gem,boss,why}],cur,stars}, pick(c), close() } */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const RH=118; // chiều cao mỗi hàng chương
const CSS=`
#hmap{position:absolute;inset:0;z-index:12;display:flex;flex-direction:column;color:#f3e3b8;background:#0b1020;animation:si .25s both}
#hmap .tb{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 8px) 12px 8px;background:linear-gradient(rgba(10,8,24,.98),rgba(10,8,24,.8));border-bottom:1px solid #a8802f;z-index:3}
#hmap .tb b{flex:1;text-align:center;font-size:16px;letter-spacing:2px;color:#ffe9b0}#hmap .tb small{display:block;font-size:11px;letter-spacing:0;color:#9fd0ff;font-weight:400}
#hmap .rb{font:inherit;min-width:42px;min-height:42px;border-radius:12px;border:1px solid #a8802f;background:rgba(10,10,28,.85);color:#f3e3b8;font-size:13px;cursor:pointer;padding:0 10px}
#hmap .sc{flex:1;overflow-y:auto;overflow-x:hidden;position:relative;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scroll-behavior:smooth}
#hmap .cv{position:relative;width:100%;max-width:520px;margin:0 auto}
#hmap .sky{position:absolute;inset:0;pointer-events:none}
#hmap svg.pt{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#hmap .act{position:absolute;left:0;right:0;text-align:center;z-index:1;pointer-events:none}
#hmap .act span{display:inline-block;padding:3px 18px;font-size:12px;letter-spacing:3px;color:#ffe9b0;background:linear-gradient(90deg,transparent,rgba(120,30,30,.85),transparent);text-shadow:0 1px 3px #000}
#hmap .nd{position:absolute;width:0;height:0;z-index:2}
#hmap .bt{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:3px solid var(--k);background:radial-gradient(circle at 35% 30%,var(--b2),var(--b1));color:#fff3d0;font:inherit;font-weight:900;font-size:20px;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 10px rgba(0,0,0,.6),0 0 14px var(--g);transition:transform .12s}
#hmap .bt:active{transform:scale(.9)}
#hmap .nd.lock .bt{filter:grayscale(.9) brightness(.65);cursor:default}
#hmap .nd.cur .bt{width:72px;height:72px;left:-36px;top:-36px;font-size:24px;animation:hmc 1.6s ease-in-out infinite}
@keyframes hmc{50%{transform:scale(1.08);box-shadow:0 4px 10px rgba(0,0,0,.6),0 0 30px var(--g)}}
#hmap .nd.cur::before{content:'';position:absolute;left:-52px;top:-52px;width:104px;height:104px;border-radius:50%;border:2px solid #ff8a5a;animation:hmr 1.8s ease-out infinite}
@keyframes hmr{from{transform:scale(.7);opacity:1}to{transform:scale(1.25);opacity:0}}
#hmap .nd .tag{position:absolute;left:-30px;top:-52px;width:60px;text-align:center;font-size:10px;font-weight:800;color:#fff;background:#c9302c;border-radius:8px;padding:1px 0}
#hmap .nd.cur .tag{top:-62px}
#hmap .st3{position:absolute;left:-30px;top:30px;width:60px;text-align:center;font-size:11px;line-height:1;color:#ffd34a;text-shadow:0 1px 2px #000;white-space:nowrap}
#hmap .nd.cur .st3{top:36px}
#hmap .lb{position:absolute;top:-30px;width:min(36vw,150px);padding:6px 9px;border-radius:10px;border:1px solid rgba(168,128,47,.8);background:linear-gradient(rgba(30,20,52,.92),rgba(10,10,28,.92));font-size:11px;line-height:1.3;box-shadow:0 2px 8px rgba(0,0,0,.5)}
#hmap .nd.R .lb{left:44px}#hmap .nd.L .lb{right:44px;text-align:right}#hmap .nd.cur.R .lb{left:52px}#hmap .nd.cur.L .lb{right:52px}
#hmap .lb small{display:block;color:#e8b84a;letter-spacing:1px;font-size:10px}#hmap .lb b{display:block;font-size:13px;color:#fff3d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hmap .lb em{font-style:normal;opacity:.85}#hmap .lb .rk{display:inline-block;min-width:16px;text-align:center;border-radius:5px;background:#e8b84a;color:#2a1a08;font-weight:900;margin-right:3px;padding:0 3px}
#hmap .nd.lock .lb{opacity:.7}
#hmap .ft{padding:8px 10px calc(env(safe-area-inset-bottom) + 10px);background:rgba(8,10,24,.96);border-top:1px solid #a8802f;z-index:3}
#hmap .ft .btn{max-width:none;justify-content:center;min-height:48px;font-weight:800;width:100%}
#hmap .jmp{position:absolute;right:10px;bottom:84px;z-index:4;font-size:12px}
@media (prefers-reduced-motion:reduce){#hmap .nd .bt,#hmap .nd.cur::before{animation:none!important}#hmap .sc{scroll-behavior:auto}}
`;
let root,ctx,D;
const css=()=>{if(document.getElementById('hmap-css'))return;const s=document.createElement('style');s.id='hmap-css';s.textContent=CSS;document.head.appendChild(s)};
const col=n=>n.st==='done'?['#7ac36a','#3d9a5a','#1c5a34','rgba(90,200,120,.5)']:n.st==='cur'?['#ffd978','#ff6a4a','#a8201a','rgba(255,120,70,.9)']:n.st==='open'?['#ffd978','#d8962a','#7a4a10','rgba(255,200,80,.5)']:['#555','#444a5a','#20222c','rgba(0,0,0,0)'];
const X=i=>50+22*Math.sin(i*1.05)*(i%2?1:.92); // % ngang, uốn lượn
function render(){
  const L=D.list,N=L.length,H=N*RH+170,Y=i=>H-90-i*RH; // chương 1 ở dưới cùng
  let path='';
  for(let i=0;i<N;i++){const x=X(i)*5.2,y=Y(i);const seg=(i?`Q${(X(i-1)*5.2+x)/2+(i%2?40:-40)} ${(Y(i-1)+y)/2} ${x} ${y}`:`M${x} ${y}`);path+=seg;}
  // đường vàng = các đoạn đã mở
  let gold='',unl=L.filter(n=>n.st!=='lock').length;
  for(let i=0;i<Math.max(1,unl);i++){const x=X(i)*5.2,y=Y(i);gold+=i?`Q${(X(i-1)*5.2+x)/2+(i%2?40:-40)} ${(Y(i-1)+y)/2} ${x} ${y}`:`M${x} ${y}`}
  let h=`<div class="cv" style="height:${H}px"><div class="sky" style="background:linear-gradient(#150f2e 0,#2a1f45 18%,#3a2a5a 40%,#2b4a4a 70%,#1e3a2a 100%)"></div>
  <svg class="pt" viewBox="0 0 520 ${H}" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="#4a4262" stroke-width="6" stroke-dasharray="3 12" stroke-linecap="round"/><path d="${gold}" fill="none" stroke="#e8b84a" stroke-width="7" stroke-linecap="round" style="filter:drop-shadow(0 0 5px #ffb62e)"/></svg>`;
  let pa=null;
  L.forEach((n,i)=>{ if(n.act!==pa){pa=n.act;h+=`<div class="act" style="top:${Y(i)+RH*.5-8}px"><span>— ${n.act} —</span></div>`}
    const k=col(n),x=X(i),side=x>=50?'L':'R',ic=n.st==='lock'?'🔒':n.st==='done'?'✓':n.c+1;
    h+=`<div class="nd ${n.st} ${side}" style="left:${x}%;top:${Y(i)}px;--k:${k[0]};--b2:${k[1]};--b1:${k[2]};--g:${k[3]}">${n.st==='cur'?'<div class="tag">HIỆN TẠI</div>':''}<button class="bt" data-c="${n.c}" aria-label="Chương ${n.c+1} ${n.name}">${ic}</button>${n.st==='done'||n.st==='cur'||n.st==='open'?`<div class="st3">${'★'.repeat(Math.min(3,Math.floor(n.stars/Math.max(1,n.max/3))))}${'☆'.repeat(3-Math.min(3,Math.floor(n.stars/Math.max(1,n.max/3))))}</div>`:''}
    <div class="lb"><small>CHƯƠNG ${n.c+1}</small><b>${n.name}</b>${n.st==='lock'?`<em>🔒 ${n.why}</em>`:`<em>${n.rank!=='–'?`<span class="rk">${n.rank}</span>`:''}${n.stars}/${n.max}★ · ⚔${n.power.toLocaleString('vi')}</em><br><em>${n.st==='done'?'✅ Hoàn thành':'🎁 💎'+n.gem+' · '+n.boss}</em>`}</div></div>`});
  root.querySelector('.sc').innerHTML=h+'</div>';
}
function toCur(smooth){const sc=$('.sc',root),n=$('.nd.cur',root)||$('.nd.open',root);if(!n)return;sc.style.scrollBehavior=smooth&&!RM?'smooth':'auto';sc.scrollTop=n.offsetTop-sc.clientHeight/2;}
function close(){if(root){root.remove();root=null}}
function open(c){
  ctx=c;css();close();D=ctx.data();root=document.createElement('section');root.id='hmap';
  root.innerHTML=`<div class="tb"><button class="rb" id="hm-x" aria-label="Đóng">✕</button><b>BẢN ĐỒ VÕ LÂM<small>★ ${D.stars} · Chương ${D.cur+1}/${D.list.length}</small></b><button class="rb" id="hm-j">◎ Hiện tại</button></div><div class="sc"></div><div class="ft"><button class="btn gold" id="hm-go">⚔ VÀO CHƯƠNG ${D.cur+1} · ${D.list[D.cur].name.toUpperCase()}</button></div>`;
  ($('#app')||document.body).appendChild(root);render();
  $('#hm-x',root).onclick=()=>{close();ctx.close&&ctx.close()};
  $('#hm-j',root).onclick=()=>toCur(true);
  $('#hm-go',root).onclick=()=>{close();ctx.pick(D.cur)};
  root.addEventListener('click',e=>{const b=e.target.closest('.bt');if(!b)return;const n=D.list[+b.dataset.c];if(n.st==='lock'){ctx.toast&&ctx.toast('🔒 '+n.why);b.animate&&b.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],200);return}close();ctx.pick(n.c)});
  requestAnimationFrame(()=>toCur(false));
}
window.DV_MAP={open,close};
})();
