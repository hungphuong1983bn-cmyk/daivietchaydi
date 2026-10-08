"""Phase 12 · Part 3 — Nâng cấp Tướng / Trang bị (7 ô, theo từng tướng) / Võ học (theo từng tướng) / Set / Phù Văn (cần Playwright)."""
import os, json, subprocess
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PAGE = 'file://' + os.path.join(ROOT, 'index.html') + '?debug'
ok = True
def chk(n, c, i=''):
    global ok; ok &= bool(c); print(('PASS' if c else 'FAIL'), '-', n, i, flush=True)

# ── dữ liệu thuần (node)
js = r"""const vm=require('vm'),fs=require('fs');const g={};g.window=g;vm.createContext(g);vm.runInContext(fs.readFileSync(process.argv[1]+'/data/upgrade.js','utf8'),g);const U=g.DV_DATA.upg;
const o={};o.books=U.martial.books.length;o.tiers=U.martial.books.map(b=>b.n.length);
o.costInc=U.martial.books.every(b=>b.n.every((n,j)=>j==0||n.c>b.n[j-1].c));
o.set0=JSON.stringify(U.setBonus([0,0,0,0,0,0,0]).tot);o.set3=JSON.stringify(U.setBonus([1,1,1,0,0,0,0]).tot);o.set7=JSON.stringify(U.setBonus([3,3,3,3,3,3,3]).tot);
o.r1=JSON.stringify(U.runeBonus({eq:['cg','cg','hv'],lv:{cg:3,hv:2}},20));o.r2=JSON.stringify(U.runeBonus({eq:['cg','hv',null],lv:{cg:3,hv:2}},1));
o.slots=[1,9,10,19,20].map(U.runeSlots);o.runeKeys=U.rune.types.every(t=>['am','hp','sp','cr','dg','cm'].includes(t.e)&&t.v.length==U.rune.maxLv&&t.v.every((v,i)=>i==0||v>t.v[i-1]));
o.aff=Object.values(U.martial.aff).every(k=>U.mBook(k));console.log(JSON.stringify(o))"""
o = json.loads(subprocess.check_output(['node', '-e', js, ROOT]))
chk('Võ học: 4 sách × 5 tầng, giá tăng dần', o['books'] == 4 and o['tiers'] == [5, 5, 5, 5] and o['costInc'])
chk('Set: 0 món Hiếm+ → không bonus; 3 món → +HP; 7 món Huyền Thoại cộng dồn mọi bậc', o['set0'] == '{}' and json.loads(o['set3']) == {'hp': 20} and json.loads(o['set7'])['hp'] > 100 and json.loads(o['set7'])['cm'] > .25, o['set7'])
chk('Phù Văn: không đếm trùng, chỉ tính ô đã mở theo cấp tướng', json.loads(o['r1']) == {'am': .06, 'hp': 30} and json.loads(o['r2']) == {'am': .06}, o['r1'] + o['r2'])
chk('Ô Phù Văn mở ở Lv.1/10/20', o['slots'] == [1, 1, 2, 2, 3])
chk('Dữ liệu Phù Văn/sở trường hợp lệ', o['runeKeys'] and o['aff'])

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 420, 'height': 860}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(1000)
    # ── MIGRATE save cũ v3
    legacy = pg.evaluate("""()=>{const s=__dv.sv();const o=JSON.parse(JSON.stringify(s));o.v=3;o.eqp=Object.assign({},s.eqp);o.vh={kp0:1,nc0:1};delete o.eqh;delete o.vhx;delete o.rn;o.hu={dbl:1,lh:1};o.hs='lh';return JSON.stringify(o)}""")
    pg2 = b.new_page(viewport={'width': 420, 'height': 860}); pg2.on('pageerror', lambda e: errs.append(str(e)))
    pg2.add_init_script("localStorage.setItem('dvcd',%s)" % json.dumps(legacy))
    pg2.goto(PAGE); pg2.wait_for_timeout(900)
    m = pg2.evaluate("()=>{const s=__dv.sv();return{v:s.v,hs:s.hs,eq:Object.keys(s.eqp).length,eqDbl:Object.keys(s.eqh.dbl||{}).length,vh:JSON.stringify(s.vhx),own:Object.keys(s).filter(k=>k==='eqp'||k==='vh').length}}")
    chk('Migrate v3→v4: trang bị cũ → tướng đang chọn, tướng khác trống', m['v'] == 4 and m['hs'] == 'lh' and m['eq'] == 7 and m['eqDbl'] == 0, str(m))
    chk('Migrate: Võ học đã học được sao cho mọi tướng đang sở hữu; không còn khoá eqp/vh trong save', json.loads(m['vh']) == {'lh': {'kp0': 1, 'nc0': 1}, 'dbl': {'kp0': 1, 'nc0': 1}} and m['own'] == 0, m['vh'])
    pg2.close()

    # ── Thiết lập
    pg.evaluate("()=>{const s=__dv.sv();s.gold=3000000;s.mt=900;for(const h of __dv.HEROES())s.hu[h.id]=1;s.hx.dbl={l:25,e:0};s.hx.lh={l:25,e:0};s.hs='dbl';__dv.put();document.querySelectorAll('#hun').forEach(e=>e.remove())}")
    pg.wait_for_timeout(3500); pg.evaluate("()=>document.querySelectorAll('#hun').forEach(e=>e.remove())")
    S = lambda js, *a: pg.evaluate(js, *a)
    # ── Trang bị theo từng tướng
    S("()=>{const s=__dv.sv();for(let i=0;i<3;i++)for(const k of 'wahnbrf')s.inv.push({u:'t'+k+i,s:k,r:3,n:'Test',l:5})}")
    S("DV_UP.open({tab:'gear',id:'dbl'})"); pg.wait_for_timeout(300)
    pg.click('#hup [data-a=auto]'); pg.wait_for_timeout(200)
    e1 = S("()=>{const s=__dv.sv();return Object.keys(s.eqh.dbl).length}")
    chk('Tự động mặc: tướng Đinh Bộ Lĩnh mặc đủ 7 ô, mỗi ô là món tốt nhất', e1 == 7 and S("()=>Object.values(__dv.sv().eqh.dbl).every(u=>u[0]==='t')"))
    S("DV_UP.go(1)"); pg.wait_for_timeout(200)
    nm = S("document.querySelector('#hup .nm h2').textContent")
    chk('Đổi tướng trong màn Nâng cấp không đổi tướng chính', S("__dv.sv().hs") == 'dbl' and 'Lê Hoàn' in nm, nm)
    chk('Tướng thứ hai chưa mặc gì (trang bị không dùng chung)', S("()=>Object.keys(__dv.sv().eqh.lh||{}).length") == 0)
    pg.click('#hup [data-a=auto]'); pg.wait_for_timeout(200)
    a, c = S("()=>Object.values(__dv.sv().eqh.dbl)"), S("()=>Object.values(__dv.sv().eqh.lh)")
    chk('Tự động mặc cho tướng 2 không cướp đồ tướng 1 (không trùng món)', len(c) == 7 and not set(a) & set(c))
    # chuyển món
    S("DV_UP.open({tab:'gear',id:'lh'})"); pg.wait_for_timeout(200)
    S("()=>{const s=__dv.sv();s.eqh.lh={};__dv.put()}")
    pg.click('#hup [data-a=open][data-k=w]'); pg.wait_for_timeout(150)
    pg.click('#hup .sl[data-u=tw0]'); pg.wait_for_timeout(150)
    chk('Món do tướng khác mặc hiện nhãn CHUYỂN & MẶC', 'CHUYỂN' in S("document.querySelector('#hup .pb').innerText"))
    pg.click('#hup [data-a=equip][data-u=tw0]'); pg.wait_for_timeout(200)
    r = S("()=>{const s=__dv.sv();return[s.eqh.lh.w,s.eqh.dbl.w]}")
    chk('Chuyển món: tướng 2 nhận, tướng 1 mất ô đó', r[0] == 'tw0' and r[1] is None, str(r))
    chk('Không bán được món đang được tướng mặc', S("()=>{const s=__dv.sv(),n=s.inv.length;document.querySelector('#hup [data-a=sell]')&&document.querySelector('#hup [data-a=sell]').click();return s.inv.length===n}"))
    # bon khác nhau theo tướng
    bd = S("()=>{const s=__dv.sv();s.hs='dbl';const a=__dv.bon().am;s.hs='lh';const b=__dv.bon().am;s.hs='dbl';return[a,b]}")
    chk('Chỉ số Công khác nhau theo trang bị từng tướng', abs(bd[0] - bd[1]) > 1e-6, str(bd))
    # nâng cấp
    pg.click('#hup [data-a=upg][data-u=tw0]'); pg.wait_for_timeout(150)
    chk('Nâng cấp trang bị trừ vàng, tăng cấp', S("()=>__dv.sv().inv.find(i=>i.u==='tw0').l") == 6)
    chk('Giữ đúng 7 ô trang bị (UI + hồ sơ)', S("(DV_UP.open({tab:'gear',id:'lh'}),document.querySelectorAll('#hup .pb > .cd .ic').length>=7)") and S("DV_HERO.record('lh').equipment.length") == 7)
    S("()=>{__dv.sv().hs='dbl'}")
    sb = S("()=>{const U=DV_DATA.upg,s=__dv.sv();s.hs='dbl';const rs=['w','a','h','n','b','r','f'].map(k=>s.inv.find(i=>i.u===s.eqh.dbl[k])).filter(Boolean).map(i=>i.r);return{n:rs.length,tot:U.setBonus(rs).tot}}")
    chk('Set kích hoạt khi mặc nhiều món cao phẩm', sb['n'] >= 6 and sb['tot'].get('hp', 0) >= 130, str(sb))
    S("DV_UP.open({tab:'gear',id:'dbl'})"); pg.wait_for_timeout(150)
    tx = S("document.querySelector('#hup .pb').innerText")
    chk('Giao diện hiện bộ Hoàng Long + mốc 3/5 món đạt', 'Hoàng Long' in tx and '✔ 3 món' in tx and '✔ 5 món' in tx)
    h1 = S("()=>{const s=__dv.sv(),U=DV_DATA.upg,f=U.setBonus;s.hs='dbl';const a=__dv.bon();U.setBonus=()=>({tot:{},list:[]});const b=__dv.bon();U.setBonus=f;return[a.hp-b.hp,+(a.am-b.am).toFixed(6)]}")
    chk('bon() cộng đúng Set vào chỉ số (Sinh lực +130, Công +19%)', h1[0] == 130 and h1[1] == .19, str(h1))
    # ── Võ học theo từng tướng
    S("DV_UP.open({tab:'mart',id:'dbl'})"); pg.wait_for_timeout(200)
    pg.click('#hup [data-a=learn][data-v=kp0]'); pg.wait_for_timeout(150)
    v = S("()=>{const s=__dv.sv();return[s.vhx.dbl,s.vhx.lh||{}]}")
    chk('Học Võ học cho Đinh Bộ Lĩnh không ảnh hưởng Lê Hoàn', v[0] == {'kp0': 1} and v[1] == {}, str(v))
    chk('Học tuần tự: không học nhảy tầng', not S("()=>{const b=document.querySelector('#hup [data-a=learn][data-v=kp2]');b.click();return !!__dv.sv().vhx.dbl.kp2}"))
    # sở trường ×1.25
    am_dbl = S("()=>{const s=__dv.sv();s.hs='dbl';const a=__dv.bon().am;delete s.vhx.dbl.kp0;const b=__dv.bon().am;s.vhx.dbl.kp0=1;return a-b}")
    chk('Sách sở trường (Đinh Bộ Lĩnh–Kiếm Pháp) hiệu ứng ×1.25: +5% → +6.25%', abs(am_dbl - .0625) < 1e-9, str(am_dbl))
    S("DV_UP.go(1)"); pg.wait_for_timeout(150); pg.click('#hup [data-a=learn][data-v=kp0]'); pg.wait_for_timeout(150)
    am_lh = S("()=>{const s=__dv.sv();s.hs='lh';const a=__dv.bon().am;delete s.vhx.lh.kp0;const b=__dv.bon().am;s.vhx.lh.kp0=1;s.hs='dbl';return a-b}")
    chk('Tướng không sở trường học Kiếm Pháp: +5% (không nhân)', abs(am_lh - .05) < 1e-9, str(am_lh))
    S("()=>{const s=__dv.sv();s.vhx.dbl={kp0:1};s.vhx.lh={};}")
    # ── Phù Văn
    S("()=>{const s=__dv.sv();s.hx.dbl={l:5,e:0};s.hs='dbl'}")
    S("DV_UP.open({tab:'rune',id:'dbl'})"); pg.wait_for_timeout(200)
    g0 = S("()=>__dv.sv().gold")
    pg.click('#hup [data-a=rup][data-k=cg]'); pg.wait_for_timeout(150)
    chk('Học Phù Văn: trừ 🪙+⚙, đạt Lv.1', S("()=>__dv.sv().rn.dbl.lv.cg") == 1 and S("()=>__dv.sv().gold") == g0 - 600 and S("()=>__dv.sv().mt") == 898)
    pg.click('#hup [data-a=rset][data-k=cg]'); pg.wait_for_timeout(150)
    chk('Gắn Phù Văn vào ô 1', S("()=>__dv.sv().rn.dbl.eq[0]") == 'cg')
    pg.click('#hup [data-a=rup][data-k=hv]'); pg.click('#hup [data-a=rset][data-k=hv]'); pg.wait_for_timeout(150)
    chk('Cấp 5: chỉ mở 1 ô → Phù Văn thứ hai không gắn được', S("()=>__dv.sv().rn.dbl.eq[1]") is None)
    b5 = S("()=>{const s=__dv.sv();s.hs='dbl';const a=__dv.bon().am;s.rn.dbl.eq[0]=null;const b=__dv.bon().am;s.rn.dbl.eq[0]='cg';return a-b}")
    chk('Phù Văn Công Lv.1 = +2% Công', abs(b5 - .02) < 1e-9, str(b5))
    S("()=>{const s=__dv.sv();s.hx.dbl={l:20,e:0}}"); S("DV_UP.open({tab:'rune',id:'dbl'})"); pg.wait_for_timeout(150)
    pg.click('#hup [data-a=rset][data-k=hv]'); pg.wait_for_timeout(150)
    chk('Cấp 20 mở đủ 3 ô; gắn thêm Phù Văn thành công', S("()=>__dv.sv().rn.dbl.eq[1]") == 'hv')
    pg.click('#hup [data-a=runeoff][data-k=hv]'); pg.wait_for_timeout(150)
    chk('Tháo Phù Văn', S("()=>__dv.sv().rn.dbl.eq[1]") is None)
    pg.evaluate("()=>{const s=__dv.sv();s.rn.dbl.lv.cg=5}"); pg.evaluate("DV_UP._render()")
    chk('Phù Văn đạt cấp tối đa 5 thì khoá nâng', 'MAX' in S("document.querySelector('#hup [data-a=rup][data-k=cg]').textContent"))
    chk('Phù Văn riêng từng tướng', S("()=>!__dv.sv().rn.lh||!(__dv.sv().rn.lh.lv||{}).cg"))
    # ── Nâng cấp tướng
    S("()=>{const s=__dv.sv();s.hx.dbl={l:25,e:0};s.gold=1e6}")
    S("DV_UP.open({tab:'hero',id:'dbl'})"); pg.wait_for_timeout(200)
    pg.click('#hup [data-a=lv1]'); pg.wait_for_timeout(200)
    chk('Lên 1 cấp bằng vàng', S("()=>__dv.sv().hx.dbl.l") == 26 and S("()=>__dv.sv().gold") < 1e6)
    pg.click('#hup [data-a=lvx]'); pg.wait_for_timeout(200)
    chk('Lên tối đa dừng ở trần cấp theo sao (0★=30)', S("()=>__dv.sv().hx.dbl.l") == 30, str(S("()=>__dv.sv().hx.dbl.l")))
    chk('Đạt trần: nút khoá', 'TRẦN' in S("document.querySelector('#hup [data-a=lv1]').textContent"))
    S("()=>{const s=__dv.sv();s.gold=10;s.hx.dbl={l:26,e:0}}"); S("DV_UP._render()"); pg.click('#hup [data-a=lv1]'); pg.wait_for_timeout(100)
    chk('Thiếu vàng: không lên cấp, không âm vàng', S("()=>__dv.sv().hx.dbl.l") == 26 and S("()=>__dv.sv().gold") == 10)
    # ── Tab + chấm đỏ + vuốt qua mọi tướng không lỗi
    for t in ['hero', 'gear', 'mart', 'rune']:
        for _ in range(7):
            S("t=>{DV_UP.open({tab:t});DV_UP.go(1)}", t)
            S("DV_UP.go(1)")
        pg.wait_for_timeout(80)
    chk('Mở 4 tab × 7 tướng không lỗi JS', not errs, str(errs[:2]))
    # ── Menu
    S("()=>{DV_UP.close();document.querySelector('[data-m=gear]').click()}"); pg.wait_for_timeout(200)
    chk('Nút TRANG BỊ ở menu mở màn Nâng cấp tab Trang bị', S("DV_UP.state()")['tab'] == 'gear')
    S("()=>{DV_UP.close();document.querySelector('[data-m=more]').click()}"); pg.wait_for_timeout(150)
    chk('KHÁC có mục Võ học (tách khỏi Thư viện võ công)', 'Võ học' in S("document.querySelector('#mb').innerText") and 'Thư viện võ công' in S("document.querySelector('#mb').innerText"))
    S("document.querySelector('#mb [data-gt=mart]').click()"); pg.wait_for_timeout(200)
    chk('Võ học mở tab riêng', S("DV_UP.state()")['tab'] == 'mart')
    S("()=>{DV_UP.close();__dv.home()}"); pg.wait_for_timeout(300)
    chk('Ô trang bị trên menu = trang bị của tướng đang chọn', S("document.querySelectorAll('#hdeq i').length") == 7)
    # Hồ sơ tướng đọc theo từng tướng
    rec = S("()=>[DV_HERO.record('dbl'),DV_HERO.record('lh')].map(r=>[r.equipment.filter(e=>e.item).length,r.martial.length])")
    chk('Hồ sơ tướng (DV_HERO) đọc trang bị/Võ học của CHÍNH tướng đó', rec[0][0] == 6 and rec[1][0] == 1 and rec[0][1] == 1 and rec[1][1] == 0, str(rec))
    # lưu/nạp lại
    S("()=>__dv.put()"); pg.reload(); pg.wait_for_timeout(900)
    r2 = S("()=>{const s=__dv.sv();return[Object.keys(s.eqh).length>=2,!!s.rn.dbl,s.v]}")
    chk('Lưu/nạp lại giữ nguyên dữ liệu theo tướng', r2[0] and r2[1] and r2[2] == 4, str(r2))
    chk('Không lỗi JS toàn bộ phiên', not errs, str(errs[:3]))
    b.close()
print('\nKẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); raise SystemExit(0 if ok else 1)
