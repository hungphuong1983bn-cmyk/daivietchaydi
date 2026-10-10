"""Kiểm thử Phase 15 (nâng cấp đồ hoạ màn chơi, js/map15.js). Cần Playwright.
   python3 tests/map15_test.py            → kiểm tra logic 15 chủ đề + hiệu năng
   python3 tests/map15_test.py shots DIR  → thêm ảnh chụp từng chủ đề (thường + Boss) vào DIR
"""
import os, sys, json
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SHOTS = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == 'shots' else None
# chương đại diện cho 15 chủ đề (chỉ số 0-based): plain river valley forest citadel shadow mountain swamp sea cave snow desert volcano void heaven
THEMES = {'plain': 0, 'river': 1, 'valley': 2, 'forest': 3, 'citadel': 4, 'shadow': 5, 'mountain': 8, 'swamp': 10, 'sea': 12, 'cave': 27, 'snow': 33, 'desert': 34, 'volcano': 35, 'void': 45, 'heaven': 46}

PRE = """async (a)=>{const [c,i,kind,q]=a,d=__dv;d.sv().snd=0;d.sv().q=q;const G0=d.G();d.begin(c,i);
 for(let k=0;k<100&&(d.G()===G0||!d.G());k++)await new Promise(r=>setTimeout(r,100));
 d.run(false);const g=d.G(),P=g.p,M15=window.DV_MAP15;
 const step=(s)=>{for(let k=0;k<s/.05;k++){P.hp=P.mhp;d.upd(.05);if(g.paused){const b=document.querySelector('#cards .card');if(b)d.pick(b.dataset.k);else g.paused=false}}};
 document.querySelector('#hud').classList.add('on');
 P.x=900+c*37;P.y=700+c*23;
 const out={banner:!!document.getElementById('m15i')};
 if(kind==='boss'){const st=DV_DATA.getStage(c,6);g.t=st.bossAt-.1;step(3.2)}else step(6);
 g.fl&&(g.fl.length=0);
 const bad=[];
 for(let k=0;k<12;k++)d.draw();
 const S=M15.stats;out.fg=S.fg;out.part=S.part;out.glow=S.glow;out.aura=S.aura;out.boss=!!g.boss;out.on=M15.enabled;
 return out}"""
PERF = """async (a)=>{const [c,q]=a,d=__dv;d.sv().q=q;const g=d.G();const M15=window.DV_MAP15;const r={};
 for(const en of [false,true]){M15.enabled=en;for(let k=0;k<20;k++)d.draw();const t0=performance.now();for(let k=0;k<120;k++)d.draw();r[en?'on':'off']=(performance.now()-t0)/120}
 M15.enabled=true;return r}"""
FIN = """async ()=>{const d=__dv,g=d.G();g.win=true;d.finish();const M15=window.DV_MAP15,S=M15.state();
 await new Promise(r=>setTimeout(r,300));
 return {win:!!document.getElementById('m15w'),macro:S.macro===null,fg:S.fg===null,part:S.part.length,G:S.G===null}}"""

with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(60000)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append('console:' + m.text) if m.type in ('error', 'warning') and 'DV_MAP15' in m.text else None)
    pg.goto('file://' + ROOT + '/index.html?debug'); pg.wait_for_timeout(800)
    bad = []; rows = []
    if SHOTS: os.makedirs(SHOTS, exist_ok=True)
    for name, c in THEMES.items():
        for kind, i in (('n', 2), ('boss', 6)):
            try:
                r = pg.evaluate(PRE, [c, i, kind, 2]); rows.append((name, kind, r))
                if not r['on']: bad.append(f'{name}/{kind}: module tự tắt do lỗi')
                if not r['banner']: bad.append(f'{name}/{kind}: không có banner tên màn')
                if kind == 'boss' and r['boss'] and not r['aura']: bad.append(f'{name}/{kind}: có Boss nhưng không có hào quang')
                if kind == 'boss' and not r['boss']: bad.append(f'{name}/{kind}: Boss không xuất hiện (kiểm thử)')
                if SHOTS:
                    pg.wait_for_timeout(1500); pg.evaluate('()=>__dv.draw()'); pg.locator('#cv').screenshot(path=f'{SHOTS}/{name}_{kind}.png')
            except Exception as e:
                bad.append(f'{name}/{kind}: EXC {str(e)[:150]}')
            pg.evaluate("()=>{__dv.run(false);document.querySelector('#end').classList.remove('on')}")
    # hiệu năng (khu tuyết, chạy trên CPU phần mềm nên chỉ so sánh tương đối bật/tắt)
    perf = {}
    for q in (0, 1, 2):
        pg.evaluate(PRE, [33, 2, 'n', q]); perf[q] = pg.evaluate(PERF, [33, q])
    # thắng ải: hiệu ứng + dọn tài nguyên
    pg.evaluate(PRE, [0, 2, 'n', 2]); fin = pg.evaluate(FIN)
    if not fin['win']: bad.append('không có hiệu ứng hoàn thành ải')
    if not (fin['macro'] and fin['fg'] and fin['G'] and fin['part'] == 0): bad.append('chưa dọn tài nguyên khi rời màn: ' + json.dumps(fin))
    # bắt đầu ván mới sau khi dọn: không lỗi
    r = pg.evaluate(PRE, [4, 6, 'boss', 1]); fin2 = r['on'] and r['banner']
    if not fin2: bad.append('ván mới sau khi dọn bị lỗi')
    print(json.dumps({'nbad': len(bad), 'bad': bad, 'jsErrors': errs[:6], 'fin': fin,
                      'perf_ms_per_frame': {k: {a: round(v, 2) for a, v in d.items()} for k, d in perf.items()},
                      'fg_avg': round(sum(r['fg'] for n,k,r in rows)/len(rows),2), 'fg_zero': [n+'/'+k for n,k,r in rows if r['fg']==0]}, ensure_ascii=False, indent=1))
    b.close()
