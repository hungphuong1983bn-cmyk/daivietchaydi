/* DV_HOME — giao diện Main Menu võ hiệp Q版 (module độc lập, không đụng logic game).
   API: DV_HOME.init({onTalk}) · DV_HOME.sync({c,name,desc,hue,done,total}) · DV_HOME.talk() · DV_HOME.loading(c,name,hue,cb) */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),el=(h)=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const LINES=['Giang hồ rộng lớn, ta đã sẵn sàng!','Kiếm trong tay, đạo trong tim.','Hôm nay lại là một ngày đẹp để xuất quân.','Đừng chạm vào ta… nhột lắm!','Võ công tinh tiến, không ngại đường xa.','Gió đã nổi — đi thôi!'];
const TIPS=['Đạt đủ ★ tổng để mở chương mới.','Hạ Boss cuối chương để mở chương kế tiếp.','Võ công đạt Lv.5 cùng võ hỗ trợ sẽ Tiến Hoá.','Thức Tỉnh tướng giúp đổi diện mạo và tăng chỉ số.','Kéo ngón tay để né — võ công tự động tấn công.','Tuyệt Kỹ có thể đảo ngược thế trận khi đại chiến.','Nhận thưởng đăng nhập mỗi ngày để không bỏ lỡ.'];

const CSS=`
#menu>#hscene{position:absolute!important;inset:0;width:auto!important;height:auto!important;overflow:hidden;z-index:0!important;pointer-events:none;--hue:30;--px:0;--py:0;background:linear-gradient(hsl(calc(var(--hue)*1deg),70%,62%) 0,hsl(calc(var(--hue)*1deg + 340deg),55%,40%) 34%,#2a1f45 58%,#0b1020 100%)}
#hscene .ly{position:absolute;left:-8%;right:-8%;bottom:0;will-change:transform;transition:transform .25s ease-out}
#hscene .sun{position:absolute;left:58%;top:9%;width:19vmin;height:19vmin;border-radius:50%;background:radial-gradient(#fff6c8 0,#ffd978 40%,rgba(255,180,80,0) 70%);animation:hsun 6s ease-in-out infinite;transform:translate(calc(var(--px)*4px),calc(var(--py)*3px))}
@keyframes hsun{50%{opacity:.78;transform:translate(calc(var(--px)*4px),calc(var(--py)*3px)) scale(1.07)}}
#hscene .cl{position:absolute;height:5vmin;border-radius:50px;background:rgba(255,240,225,.55);filter:blur(1px);animation:hcl linear infinite}
#hscene .cl::before,#hscene .cl::after{content:'';position:absolute;border-radius:50%;background:inherit}
#hscene .cl::before{width:45%;height:160%;left:12%;bottom:30%}#hscene .cl::after{width:35%;height:120%;right:14%;bottom:40%}
@keyframes hcl{from{transform:translateX(-30vw)}to{transform:translateX(130vw)}}
#hscene .l1{top:14%;height:34%;transform:translate(calc(var(--px)*-6px),calc(var(--py)*-2px))}
#hscene .l2{top:22%;height:36%;transform:translate(calc(var(--px)*-12px),calc(var(--py)*-3px))}
#hscene .l3{bottom:0;height:46%;transform:translate(calc(var(--px)*-20px),0)}
#hscene svg{width:100%;height:100%;display:block}
#hscene .gl{position:absolute;inset:auto 0 0;height:30%;background:linear-gradient(transparent,rgba(11,16,32,.85));}
#hscene .vg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 45%,rgba(5,8,20,.65))}
#hscene .fx{position:absolute;top:-6%;width:11px;height:7px;border-radius:70% 0 70% 0;background:#9bd36a;opacity:.85;animation:hlf linear infinite}
@keyframes hlf{from{transform:translate(0,0) rotate(0)}to{transform:translate(-70vw,110vh) rotate(720deg)}}
#hscene .bm{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,230,160,.16) 45%,transparent 60%);animation:hbm 9s ease-in-out infinite alternate}
@keyframes hbm{to{transform:translateX(18%)}}
#hchap{position:relative;z-index:2;align-self:flex-start;margin:2px 0 0;padding:6px 14px 7px 12px;min-width:0;max-width:78%;border:1px solid #a8802f;border-left:5px solid #c9302c;border-radius:4px 14px 14px 4px;background:linear-gradient(100deg,rgba(60,14,16,.92),rgba(14,10,30,.86));box-shadow:0 0 14px rgba(201,48,44,.35);animation:hch .6s .15s both cubic-bezier(.2,.9,.3,1.2)}
@keyframes hch{from{opacity:0;transform:translateX(-30px)}}
#hchap small{display:block;font-size:11px;letter-spacing:2px;color:#e8b84a}
#hchap b{display:block;font-size:17px;line-height:1.15;color:#fff3d0;text-shadow:0 1px 3px #000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#hchap .pg{display:flex;gap:3px;margin-top:5px}#hchap .pg i{flex:1;height:5px;border-radius:3px;background:#3a2f55}#hchap .pg i.d{background:linear-gradient(#ffe48f,#e3881c);box-shadow:0 0 5px #ffb62e}
#hsay{position:absolute;left:50%;top:6%;z-index:6;transform:translateX(-50%) scale(.6);opacity:0;max-width:84%;padding:8px 12px;border-radius:14px;background:#fff3d0;color:#3a1a12;font-weight:700;font-size:13px;text-align:center;border:2px solid #a8802f;box-shadow:0 4px 14px rgba(0,0,0,.5);pointer-events:none}
#hsay::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-7px;border:7px solid transparent;border-top:9px solid #a8802f;border-bottom:0}
#hsay.on{animation:hsy 2.4s both}@keyframes hsy{8%{opacity:1;transform:translateX(-50%) scale(1.06)}14%,86%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-10px) scale(.95)}}
#hhero img{-webkit-mask:radial-gradient(ellipse 60% 55% at 50% 47%,#000 62%,transparent 100%);mask:radial-gradient(ellipse 60% 55% at 50% 47%,#000 62%,transparent 100%)}
#hstage .ring{position:absolute;bottom:4%;left:50%;width:58%;aspect-ratio:3/1;margin-left:-29%;border-radius:50%;border:2px solid rgba(255,217,120,.55);box-shadow:0 0 18px rgba(255,190,70,.5),inset 0 0 14px rgba(255,190,70,.35);transform:scaleY(.5);animation:hrg 3.6s ease-in-out infinite;z-index:1}
@keyframes hrg{50%{transform:scaleY(.5) scale(1.08);opacity:.55}}
#hhero.tap{animation:htp .55s cubic-bezier(.3,1.6,.5,1)!important}@keyframes htp{30%{transform:scale(1.1,.9)}60%{transform:translateY(-14px) scale(.96,1.06)}}
#b-fight{position:relative;overflow:hidden;font-weight:900;letter-spacing:1px;background:linear-gradient(#ff6a4a,#c9302c 55%,#8f1713)!important;border:2px solid #ffd978!important;color:#fff3d0!important;text-shadow:0 2px 4px #4a0a08;box-shadow:0 0 18px rgba(255,120,60,.75),inset 0 1px 0 rgba(255,255,255,.4)!important;animation:hbt 1.8s ease-in-out infinite!important;flex-direction:column;gap:0;line-height:1.1}
#b-fight small{font-size:11px;font-weight:700;letter-spacing:.5px;color:#ffe9b0;opacity:.9}
#b-fight::after{content:'';position:absolute;top:0;bottom:0;width:36%;left:-50%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);animation:hsh 3s 1s infinite}
@keyframes hbt{50%{transform:scale(1.025);box-shadow:0 0 30px rgba(255,150,70,.95),inset 0 1px 0 rgba(255,255,255,.4)}}@keyframes hsh{to{left:130%}}
#b-fight:active{transform:scale(.96)!important;filter:brightness(1.2)}#b-fight.go{animation:hgo .4s both!important}@keyframes hgo{to{transform:scale(1.06);filter:brightness(1.8)}}
#menu .ib:active{transform:scale(.92)}#menu .ib{transition:transform .12s,filter .12s}
#hpwr{display:inline-flex;gap:3px;align-items:center}
#hload{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:18px 22px calc(env(safe-area-inset-bottom) + 30px);--hue:30;background:linear-gradient(hsl(calc(var(--hue)*1deg),60%,34%),#0b1020 70%);animation:hld .25s both}
@keyframes hld{from{opacity:0}}#hload.out{animation:hlo .3s both}@keyframes hlo{to{opacity:0}}
#hload .art{position:absolute;left:50%;top:6%;height:56%;transform:translateX(-50%);animation:idle 3s ease-in-out infinite;filter:drop-shadow(0 8px 14px #000)}
#hload .art img{height:100%;display:block}
#hload .nm{font-size:13px;color:#e8b84a;letter-spacing:3px}#hload h3{margin:2px 0 14px;font-size:22px;color:#fff3d0;text-shadow:0 2px 6px #000;text-align:center}
#hload .pb{width:100%;max-width:340px;height:14px;border-radius:8px;border:2px solid #a8802f;background:#150f26;overflow:hidden}
#hload .pb i{display:block;height:100%;width:0;background:linear-gradient(#ffe48f,#e3881c);box-shadow:0 0 10px #ffb62e}
#hload .tp{margin-top:12px;font-size:13px;color:#f3e3b8;text-align:center;min-height:36px;max-width:340px}
@media (max-height:640px){#hchap b{font-size:15px}#hscene .sun{display:none}}
@media (orientation:landscape) and (max-height:520px){#hchap{max-width:40%}}
@media (prefers-reduced-motion:reduce){#hscene *,#b-fight,#b-fight::after,#hhero img{-webkit-mask:radial-gradient(ellipse 60% 55% at 50% 47%,#000 62%,transparent 100%);mask:radial-gradient(ellipse 60% 55% at 50% 47%,#000 62%,transparent 100%)}
#hstage .ring{animation:none!important}}
#menu.lo #hscene .fx,#menu.lo #hscene .cl{display:none}
`;

const mtn=(c,y,a)=>`<svg viewBox="0 0 400 200" preserveAspectRatio="none"><path fill="${c}" d="M0 200V${y}L40 ${y-a*.5}L85 ${y+a*.2}L140 ${y-a}L200 ${y+a*.3}L255 ${y-a*.8}L310 ${y+a*.1}L360 ${y-a*.6}L400 ${y}V200Z"/></svg>`;
const castle=`<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice"><g fill="#2b2147"><path d="M0 200V150L50 138L110 150L170 132L230 150L300 128L360 146L400 138V200Z" fill="#33284f"/><g transform="translate(250 82)"><rect x="0" y="48" width="86" height="36"/><path d="M-10 48Q43 20 96 48Z"/><rect x="18" y="20" width="50" height="28"/><path d="M8 20Q43 -6 78 20Z"/><rect x="36" y="2" width="14" height="18"/><path d="M30 2Q43 -14 56 2Z"/></g></g><g fill="#c9302c" opacity=".8"><rect x="272" y="104" width="6" height="8"/><rect x="296" y="104" width="6" height="8"/></g></svg>`;
const bamboo=(()=>{let s='<svg viewBox="0 0 400 220" preserveAspectRatio="none">';for(let i=0;i<14;i++){const x=i*30+(i%3)*5,h=90+(i*37%110),w=5+(i%3);s+=`<rect x="${x}" y="${220-h}" width="${w}" height="${h}" fill="${i%2?'#1c3a38':'#14302f'}"/>`;for(let k=0;k<5;k++)s+=`<rect x="${x-1}" y="${220-h+k*(h/5)}" width="${w+2}" height="2" fill="#0d2120"/>`;s+=`<path d="M${x} ${230-h} q22 -4 34 10 q-20 4 -34 -4Z" fill="#2d6a4f" opacity=".85"/>`}return s+'</svg>'})();

let built=0,scene,say,chap,st={px:0,py:0};
function build(){
  if(built)return;built=1;
  const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
  const menu=$('#menu');if(!menu)return;
  let h='<div class="sun"></div>';
  [[8,.55,46,0],[22,.4,60,-14],[30,.5,38,-30]].forEach(c=>h+=`<i class="cl" style="top:${c[0]}%;width:${c[2]}vmin;animation-duration:${70+c[2]}s;animation-delay:${c[3]}s;opacity:${c[1]+.3}"></i>`);
  h+=`<div class="ly l1">${mtn('rgba(120,90,140,.55)',120,60)}</div><div class="ly l2">${mtn('#4a3a6a',130,50)}${castle}</div><div class="ly l3">${bamboo}</div><div class="bm"></div><div class="gl"></div><div class="vg"></div>`;
  if(!RM)for(let i=0;i<9;i++)h+=`<i class="fx" style="left:${20+i*11}%;animation-duration:${9+i%4*3}s;animation-delay:-${i*2.1}s"></i>`;
  scene=el(`<div id="hscene" aria-hidden="true">${h}</div>`);
  menu.insertBefore(scene,menu.firstChild);
  const art=$('#mart');if(art)art.style.opacity='.0';
  const hs=$('#hstage');
  if(hs){hs.insertAdjacentHTML('afterbegin','<i class="ring"></i>');say=el('<div id="hsay"></div>');hs.appendChild(say)}
  chap=el('<div id="hchap"><small></small><b></b><div class="pg"></div></div>');
  const top=$('#htop');if(top&&top.nextSibling)menu.insertBefore(chap,top.nextSibling);
  // parallax theo con trỏ / chạm / nghiêng máy
  const mv=(x,y)=>{st.px=(x/innerWidth-.5)*2;st.py=(y/innerHeight-.5)*2;scene.style.setProperty('--px',st.px.toFixed(2));scene.style.setProperty('--py',st.py.toFixed(2))};
  if(!RM){menu.addEventListener('pointermove',e=>mv(e.clientX,e.clientY),{passive:true});
    addEventListener('deviceorientation',e=>{if(e.gamma==null||!menu.classList.contains('on'))return;mv(innerWidth*(.5+Math.max(-20,Math.min(20,e.gamma))/40),innerHeight*(.5+Math.max(-20,Math.min(20,(e.beta||45)-45))/40))},{passive:true})}
}
function talk(){
  if(!say)return;
  const h=$('#hhero');if(h){h.classList.remove('tap');void h.offsetWidth;h.classList.add('tap');setTimeout(()=>h.classList.remove('tap'),600)}
  say.textContent=LINES[Math.random()*LINES.length|0];say.classList.remove('on');void say.offsetWidth;say.classList.add('on');
}
function sync(o){
  build();if(!chap)return;
  scene.style.setProperty('--hue',o.hue==null?30:o.hue);
  chap.firstChild.textContent='CHƯƠNG '+(o.c+1)+' / 52';
  chap.children[1].textContent=o.name;chap.children[1].title=o.desc||'';
  const pg=chap.lastChild,n=o.total||6;
  if(pg.children.length!==n)pg.innerHTML='<i></i>'.repeat(n);
  [...pg.children].forEach((i,k)=>i.classList.toggle('d',k<o.done));
  const b=$('#b-fight');if(b){const t=o.allDone?'CHƠI LẠI / ÔN LUYỆN':'VÀO GIANG HỒ';const sub=o.next?'Màn '+(o.c+1)+'-'+String(o.next).padStart(2,'0')+' · '+o.name:o.name;
    if(b.dataset.k!==t+sub){b.dataset.k=t+sub;b.innerHTML=`<span>⚔ ${t}</span><small>${sub}</small>`}}
}
function loading(c,name,hue,cb){
  build();const app=$('#app')||document.body,old=$('#hload');if(old)old.remove();
  const L=el(`<div id="hload" style="--hue:${hue==null?30:hue}"><div class="art"><img src="assets/hero.png" alt=""></div><div class="nm">CHƯƠNG ${c+1}</div><h3>${name}</h3><div class="pb"><i></i></div><div class="tp">💡 ${TIPS[(Math.random()*TIPS.length)|0]}</div></div>`);
  app.appendChild(L);const bar=$('i',L),t0=performance.now(),D=RM?250:900;
  (function f(t){const p=Math.min(1,(t-t0)/D);bar.style.width=(p*100)+'%';if(p<1)requestAnimationFrame(f);else{try{cb()}finally{L.classList.add('out');setTimeout(()=>L.remove(),320)}}})(t0);
}
window.DV_HOME={sync,talk,loading,init:build};
})();
