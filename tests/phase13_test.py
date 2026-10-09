"""Phase 13 test: python3 tests/phase13_test.py OUT"""
import os, sys, json
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/opt/pw-browsers'
from playwright.sync_api import sync_playwright
PAGE='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))+'?debug'
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/p13'; os.makedirs(OUT,exist_ok=True)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg=b.new_page(viewport={'width':430,'height':860})
    pg.on('pageerror',lambda e:errs.append('PAGE '+str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(PAGE); pg.wait_for_timeout(800)
    print('validate',pg.evaluate("DV_AUDIO.validate()"))
    # audio spectral identity
    r=pg.evaluate("""async()=>{const out={};for(const n of DV_AUDIO.list()){const d=await DV_AUDIO.render(n);let pk=0,zc=0,e=0;for(let i=0;i<d.length;i++){const a=Math.abs(d[i]);if(a>pk)pk=a;e+=d[i]*d[i];if(i&&d[i]*d[i-1]<0)zc++}out[n]=[+pk.toFixed(2),Math.round(zc/2),+Math.sqrt(e/d.length).toFixed(3)]}return out}""")
    print('recipes',len(r),'max peak',max(v[0] for v in r.values()),'silent',[k for k,v in r.items() if v[0]<.01])
    for k in ['kiem.hit','dao.hit','quyen.hit','hoa.explode','bang.shatter','loi.thunder','doc.burst','phong.slash','fx.cine','boss.appear']: print(k,r[k])
    # loading info per scenario
    for lab,st in [('ch1',{'c':0,'i':1,'t':'n'}),('ch25boss',{'c':24,'i':6,'t':'b'}),('ch35',{'c':34,'i':2,'t':'n'}),('wb',{'c':0,'i':0,'t':'n','wb':1}),('rift',{'c':3,'i':1,'t':'n','x':'rift','r':'gem','f':3}),('trial',{'c':0,'i':1,'t':'n','x':'trial','tier':2})]:
        i=pg.evaluate("(s)=>{const o=DV_LOAD.info(s);return {mode:o.mode,title:o.title,name:o.name,theme:o.theme,boss:o.boss&&o.boss.name,sk:o.boss&&o.boss.skills.map(x=>x.n),en:o.enemies.map(e=>e.name),rw:o.rewards.map(r=>r[1]+r[2]),pow:o.power,tips:o.tips.length}}",st); print(lab,json.dumps(i,ensure_ascii=False))
    # visual loading shots
    for lab,st in [('ch1',{'c':0,'i':1,'t':'n'}),('ch25boss',{'c':24,'i':6,'t':'b'}),('ch35snow',{'c':33,'i':2,'t':'n'}),('ch40volc',{'c':35,'i':6,'t':'b'}),('wb',{'c':0,'i':0,'t':'n','wb':1}),('trial',{'c':0,'i':1,'t':'n','x':'trial','tier':2}),('forest',{'c':3,'i':1,'t':'n'}),('shadow',{'c':44,'i':6,'t':'b'})]:
        pg.evaluate("(s)=>DV_LOAD.show(s,()=>{})",st); pg.wait_for_timeout(1300); pg.screenshot(path=f'{OUT}/load_{lab}.png'); pg.wait_for_timeout(1500)
    # combat: camera + audio
    pg.evaluate("document.querySelectorAll('#dvld').forEach(x=>x.remove())")
    pg.evaluate("()=>{const d=__dv;d.sv().snd=1;d.begin(24,6)}"); pg.wait_for_timeout(3200)
    print('combat started',pg.evaluate("!!__dv.G()"))
    res=pg.evaluate("""async()=>{const d=__dv;d.run(false);const G=d.G(),P=G.p;P.hp=P.mhp=1e9;const out={};
      const z=()=>DV_CAM.stats().z;
      for(let i=0;i<120;i++){G.paused=false;d.upd(.05)} out.zFew=z();
      for(let i=0;i<60;i++){for(let k=0;k<3;k++){const a=Math.random()*6.28;G.en.length<110&&G.en.push({id:++G.id,tid:'grunt',x:P.x+Math.cos(a)*300,y:P.y+Math.sin(a)*300,hp:1e9,mhp:1e9,sp:0,r:11,dmg:0,c:'#733',exp:0,vx:0,vy:0,fl:0,pc:0,dead:0,boss:0,mb:0,el:0,gold:0,arm:0,ab:null,sc:{hp:1,dmg:1,sp:1,exp:1},ds:1,tel:0,dsh:0,shd:0,spt:0,ph:1,bm:0,kid:0,born:G.t})}d.upd(.05)}
      for(let i=0;i<80;i++)d.upd(.05); out.zMany=z(); out.n=G.en.length;
      G.en.length=0;for(let i=0;i<120;i++)d.upd(.05); out.zBack=z();
      return out}""")
    print('camera',res)
    pg.evaluate("()=>{const d=__dv,G=d.G();for(let i=0;i<40;i++){const a=i*.7;G.en.push({id:++G.id,tid:'grunt',x:G.p.x+Math.cos(a)*(120+i*5),y:G.p.y+Math.sin(a)*(120+i*5),hp:1e9,mhp:1e9,sp:0,r:11,dmg:0,c:'#733',exp:0,vx:0,vy:0,fl:0,pc:0,dead:0,boss:0,mb:0,el:0,gold:0,arm:0,ab:null,sc:{hp:1,dmg:1,sp:1,exp:1},ds:1,tel:0,dsh:0,shd:0,spt:0,ph:1,bm:0,kid:0,born:G.t})}}")
    for lab,h,sk,evo in [('kiem','dbl',{'kiem':5},[]),('loi','thd',{'loi':4},[]),('hang_hoa','lh',{'hang':5},['hang']),('phi','nq',{'phi':4},[])]:
        pg.evaluate("(o)=>{const d=__dv,G=d.G();d.sv().hs=o.h;G.sk=o.sk;G.evo={};o.evo.forEach(k=>G.evo[k]=1);G.cd={};G.p.hp=1e9;G.en.forEach(e=>{if(!e.boss)e.hp=e.mhp=1e9})}",{'h':h,'sk':sk,'evo':evo})
        pg.evaluate("()=>{const d=__dv;for(let i=0;i<14;i++)d.upd(.03);d.draw()}"); pg.screenshot(path=f'{OUT}/fx_{lab}.png')
    for h in ['lh','nq','thd','dl','nb']:
        pg.evaluate("(h)=>{const d=__dv,G=d.G();G.e=100;d.run(true);d.ult();d.run(false)}",h)
        pg.evaluate("()=>{const d=__dv;for(let i=0;i<8;i++)d.upd(.03);d.draw()}"); pg.screenshot(path=f'{OUT}/ult_{h}.png')
        pg.evaluate("()=>{const d=__dv;for(let i=0;i<60;i++)d.upd(.03)}")
    print('zoom ult',pg.evaluate("DV_CAM.stats()"),'vfx2',pg.evaluate("DV_VFX2.stats()"),'audio',pg.evaluate("DV_AUDIO.stats()"))
    print('ERRORS',errs[:12])
    b.close()
