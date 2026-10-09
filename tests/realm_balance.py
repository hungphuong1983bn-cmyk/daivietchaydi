"""Thăm dò cân bằng Bí Cảnh / Thử Luyện / Boss thế giới: bot KHÔNG bất tử, trang bị = lực chiến khuyến nghị × powMul."""
import os, sys, json
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
SETPOW = r"""(want)=>{const d=__dv,sv=d.sv();const setG=(r,l)=>{for(const k in sv.eqp){const it=sv.inv.find(x=>x.u===sv.eqp[k]);it.r=r;it.l=l}};
 let done=false;for(let r=0;r<4&&!done;r++)for(let l=1;l<=80;l++){setG(r,l);if(d.pwr()>=want){done=true;break}}return d.pwr()}"""
SIM = r"""
async (o) => {
  const d = __dv, G = d.G(), P = G.p, inp = d.inp(); d.run(false); const out = {steps:0,hpMin:1,dmg:0}; const DT=.04;
  while (true) {
    if (G.paused) { const cs=[...document.querySelectorAll('#cards .card')].map(x=>x.dataset.k); const atk=['kiem','loi','hang','phi'];
      const sc=x=>x.startsWith('evo:')?99:atk.includes(x)?10+(G.sk[x]||0)*2-atk.indexOf(x)*.1:x.startsWith('pct:')?(x.includes(':am:')||x.includes(':as:')?8:5):x==='ho'?3:1;
      const k=cs.sort((a,b)=>sc(b)-sc(a))[0]; if(k)d.pick(k); else G.paused=false; continue }
    let fx=0,fy=0,boss=null,near=1e9; for(const e of G.en){if(e.dead)continue;if(e.boss)boss=e;const dx=P.x-e.x,dy=P.y-e.y,q=dx*dx+dy*dy;if(q<14400){const w=1/(q+400);fx+=dx*w;fy+=dy*w}if(q<near)near=q}
    for(const p of G.ep){const rx=P.x-p.x,ry=P.y-p.y,v2=p.vx*p.vx+p.vy*p.vy||1,tca=Math.max(0,(rx*p.vx+ry*p.vy)/v2);if(tca<1.1){const cx=rx-p.vx*tca,cy=ry-p.vy*tca,dm=Math.hypot(cx,cy);if(dm<48){const w=.9/(tca+.25);fx+=cx/(dm+1)*w;fy+=cy/(dm+1)*w}}}
    for(const z of G.tz){const dx=P.x-z.x,dy=P.y-z.y,q=Math.hypot(dx,dy);if(q<z.r+45){fx+=dx/(q+1)*3;fy+=dy/(q+1)*3}}
    let best=null,bd=1e9;for(const ob of G.orb){const q=(ob.x-P.x)**2+(ob.y-P.y)**2;if(q<bd&&q<640000){bd=q;best=ob}}
    if(best){const l=Math.sqrt(bd)+1,w=near>14400?.05:.012;fx+=(best.x-P.x)/l*w;fy+=(best.y-P.y)/l*w}
    if(boss){const dx=boss.x-P.x,dy=boss.y-P.y,l=Math.hypot(dx,dy)+1;if(l>130){fx+=dx/l*.02;fy+=dy/l*.02}else{fx+=-dy/l*.012;fy+=dx/l*.012}}
    const m=Math.hypot(fx,fy)||1;inp.x=fx/m;inp.y=fy/m; d.upd(DT);out.steps++; out.hpMin=Math.min(out.hpMin,P.hp/P.mhp);
    if(o.maxT&&G.t>=o.maxT&&!G.ending){break}
    if(document.querySelector('#end').classList.contains('on'))break; if(out.steps>90000)break; }
  out.t=+G.t.toFixed(1);out.win=!!G.win;out.kills=G.kills;out.lv=P.lv;out.wd=G.wd|0;out.end=document.querySelector('#end').classList.contains('on');return out }
"""
def run(un, kind, a, b=None, powMul=1.0, n=1):
    res = []
    with sync_playwright() as p:
        br = p.chromium.launch(); pg = br.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(0)
        pg.goto(PAGE); pg.wait_for_timeout(500); pg.add_script_tag(content="window.__sim=" + SIM); pg.add_script_tag(content="window.__setpow=" + SETPOW)
        pg.evaluate("()=>{if(window.DV_HOME)DV_HOME.loading=(c,n,h,cb)=>cb()}")
        for i in range(n):
            pg.evaluate("u=>{const s=__dv.sv();s.un=u;s.sa=900;s.rf.n={};for(const t of DV_DATA.realm.types)s.rf.best[t.id]=9;s.tr.best=[0,0,0,0]}", un)
            if kind == 'rift':
                want = pg.evaluate("([t,f,u])=>Math.round(DV_DATA.realm.buildRift({x:'rift',r:t,f,c:u}).recommendedPower)", [a, b, un])
                pg.evaluate("([t,f])=>{__dv.sv().rf.best[t]=f-1}", [a, b])
                mp = pg.evaluate("w=>__setpow(w)", int(want * powMul)); pg.evaluate("([t,f])=>__dv.goRift(t,f)", [a, b])
                r = pg.evaluate("o=>__sim(o)", {}); r['pw'] = mp; r['rec'] = want
            elif kind == 'wb':
                want = pg.evaluate("u=>Math.round(DV_DATA.getStage(u,3).recommendedPower)", un)
                mp = pg.evaluate("w=>__setpow(w)", int(want * powMul)); pg.evaluate("__dv.startWB()")
                r = pg.evaluate("o=>__sim(o)", {}); r['pw'] = mp; r['rec'] = want
            else:
                want = pg.evaluate("([u,ti])=>Math.round(DV_DATA.realm.buildTrial({x:'trial',tier:ti,c:u}).recommendedPower)", [un, a])
                mp = pg.evaluate("w=>__setpow(w)", int(want * powMul)); pg.evaluate("t=>__dv.goTrial(t)", a)
                r = pg.evaluate("o=>__sim(o)", {'maxT': b or 1500}); r['pw'] = mp; r['rec'] = want
            res.append(r); pg.evaluate("()=>{document.querySelector('#end').classList.remove('on');document.querySelector('#modal').classList.remove('on')}")
        br.close()
    return res
if __name__ == '__main__':
    un = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    for f in (1, 5, 10):
        for pm in (1.0,):
            r = run(un, 'rift', 'ore', f, pm)[0]
            print(f"BÍ CẢNH ore tầng {f:2d} (chương {un+1}) pow {r['pw']}/{r['rec']}: thắng={r['win']} t={r['t']}s hpMin={r['hpMin']:.2f} kills={r['kills']} lv={r['lv']}", flush=True)
    r = run(un, 'wb', None)[0]; print(f"BOSS TG (chương {un+1}) pow {r['pw']}/{r['rec']}: sống {r['t']-120:.0f}s hpMin={r['hpMin']:.2f} sát thương={r['wd']}", flush=True)
    for ti in (0, 1):
        r = run(un, 'trial', ti, 900)[0]; print(f"THỬ LUYỆN cấp {ti} (chương {un+1}) pow {r['pw']}/{r['rec']}: sống {r['t']:.0f}s (tối đa 900) kills={r['kills']} lv={r['lv']}", flush=True)
