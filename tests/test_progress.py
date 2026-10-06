import os, json
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
os.environ['PLAYWRIGHT_BROWSERS_PATH']='/opt/pw-browsers'
from playwright.sync_api import sync_playwright
from run_stage import BOT
ok=True
def chk(name,cond,info=''):
    global ok; ok&=bool(cond); print(('PASS' if cond else 'FAIL'),'-',name,info,flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':420,'height':800}); pg.set_default_timeout(0)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(500)
    pg.add_script_tag(content="window.__bot="+BOT)
    snap=lambda:pg.evaluate("()=>{const s=__dv.sv();return {gold:s.gold,gem:s.gem,mt:s.mt,hon:s.hon||0,inv:s.inv.length,un:s.un,cl:Object.keys(s.cl).length,sr:JSON.stringify(s.sr),stars:__dv.starsTot()}}")
    ok_s=lambda c,i:pg.evaluate(f"__dv.okS({c},{i})")
    chk('Màn 1-2 khoá khi chưa clear 1-1', not ok_s(0,2))
    chk('Màn 1-1 mở sẵn', ok_s(0,1))
    prev=snap()
    r=pg.evaluate("o=>__bot(o)",{'c':1,'i':1,'mode':'god'})
    s1=snap()
    chk('Thắng 1-1 & màn kết thúc hiện', r['win'] and r['end'])
    chk('1-2 mở sau khi clear 1-1', ok_s(0,2))
    chk('Lưu 3 sao 1-1 (bitmask)', json.loads(s1['sr']).get('0-1',0)==r['stageBits'], f"bits={r['stageBits']}")
    chk('Nhận Tinh thiết + Hồn tướng + vàng + ngọc', s1['mt']>prev['mt'] and s1['hon']>prev['hon'] and s1['gold']>prev['gold'] and s1['gem']>prev['gem'], f"mt {prev['mt']}→{s1['mt']} hon {prev['hon']}→{s1['hon']} gem {prev['gem']}→{s1['gem']}")
    er=pg.evaluate("document.querySelector('#er').innerText"); chk('Màn kết thúc có mục Tinh thiết/Hồn tướng/điều kiện sao', ('Hồn' in er) and ('★' in er or '☆' in er), repr(er[:160]))
    # chơi lại 1-1: không nhận thưởng lần đầu nữa
    pg.evaluate("document.querySelector('#end').classList.remove('on')")
    r2=pg.evaluate("o=>__bot(o)",{'c':1,'i':1,'mode':'god'}); s2=snap()
    g1=s1['gem']-prev['gem']; g2=s2['gem']-s1['gem']
    chk('Chơi lại 1-1: thưởng ngọc nhỏ hơn lần đầu (không nhận first-clear)', g2<g1, f'gem lần đầu +{g1}, lần hai +{g2}')
    # chuỗi 1-2..1-6
    for i in range(2,7):
        chk(f'1-{i} mở trước khi chơi', ok_s(0,i))
        pg.evaluate("document.querySelector('#end').classList.remove('on')")
        rr=pg.evaluate("o=>__bot(o)",{'c':1,'i':i,'mode':'god'}); chk(f'Thắng 1-{i}', rr['win'], f"t={rr['t']} bits={rr['stageBits']}")
    s6=snap(); chk('Hạ boss chương 1 → mở chương 2 (sv.un=1)', s6['un']>=1, f"un={s6['un']}")
    chk('Đủ 6 màn chương 1 đã clear', pg.evaluate("[1,2,3,4,5,6].every(i=>__dv.sv().cl['0-'+i])"))
    # khoá theo sao
    pg.evaluate("()=>{const s=__dv.sv();s.un=51;s.sr={}}")
    chk('Chương 10 khoá nếu chưa đủ sao', pg.evaluate("__dv.chLk(9)"), 'cần ★ theo unlockCondition')
    pg.evaluate("()=>{const s=__dv.sv();for(let i=1;i<=6;i++)s.sr['0-'+i]=7}")
    chk('Chương 10 mở khi đủ sao', not pg.evaluate("__dv.chLk(9)"), f"stars={pg.evaluate('__dv.starsTot()')}")
    chk('Chương 52 khoá khi sao quá ít', pg.evaluate("__dv.chLk(51)"))
    chk('Không có lỗi JS', not errs, str(errs[:2]))
    b.close()
print('\nALL PASS' if ok else '\nSOME FAILED')
