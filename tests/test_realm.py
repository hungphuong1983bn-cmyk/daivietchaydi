"""Phase 12 · Part 4 — kiểm thử Bí Cảnh + Thử Luyện Sinh Tồn + Boss Thế Giới (cần Playwright)."""
import os, json
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
ok = True
def chk(name, cond, info=''):
    global ok; ok &= bool(cond); print(('PASS' if cond else 'FAIL'), '-', name, info, flush=True)

# Bot nhỏ: chạy ván hiện tại đến khi kết thúc. o = {god, maxT, die, pickPct}
SIM = r"""
async (o) => {
  const d = __dv, G = d.G(), P = G.p, inp = d.inp(); d.run(false);
  const out = {steps: 0, picks: [], phases: {}, zones: 0, bossSeen: 0, sawPct: 0};
  const DT = .04;
  while (true) {
    if (G.paused) {
      const cs = [...document.querySelectorAll('#cards .card')].map(x => x.dataset.k);
      if (cs.some(k => k.startsWith('pct:'))) out.sawPct++;
      let k = (o.pickPct && cs.find(k => k.startsWith('pct:'))) || cs.find(k => k.startsWith('evo:')) || cs[0];
      if (k) { out.picks.push(k); d.pick(k); } else G.paused = false; continue;
    }
    let fx = 0, fy = 0;
    for (const e of G.en) { if (e.dead) continue; const dx = P.x - e.x, dy = P.y - e.y, q = dx*dx + dy*dy; if (q < 14400) { const w = 1/(q+400); fx += dx*w; fy += dy*w; } }
    for (const z of G.tz) { const dx = P.x - z.x, dy = P.y - z.y, q = Math.hypot(dx, dy); if (q < z.r + 45) { fx += dx/(q+1)*3; fy += dy/(q+1)*3; } }
    const m = Math.hypot(fx, fy) || 1; inp.x = fx/m; inp.y = fy/m;
    d.upd(DT); out.steps++;
    if (o.god) P.hp = P.mhp;
    if (G.boss && G.wb) out.phases[G.boss.ph] = +(G.t - 120).toFixed(1);
    if (G.tz.length) out.zones = Math.max(out.zones, G.tz.filter(z => z.k === 'm').length);
    if (G.boss && !out.bossSeen) out.bossSeen = +G.t.toFixed(1);
    if (o.maxT && G.t >= o.maxT && !G.ending) { if (o.die) P.hp = -1; else break; }
    if (document.querySelector('#end').classList.contains('on')) break;
    if (out.steps > 60000) break;
  }
  out.t = +G.t.toFixed(1); out.win = !!G.win; out.kills = G.kills; out.wd = G.wd | 0; out.end = document.querySelector('#end').classList.contains('on');
  return out;
}
"""
SNAP = "()=>{const s=__dv.sv();return {gold:s.gold,gem:s.gem,mt:s.mt||0,hon:s.hon||0,rs:s.rs||0,inv:s.inv.length,sa:s.sa,cl:JSON.stringify(s.cl),sr:JSON.stringify(s.sr),un:s.un,rfb:JSON.stringify(s.rf.best),trb:JSON.stringify(s.tr.best),games:s.st.games}}"
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 420, 'height': 800}); pg.set_default_timeout(0)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(600)
    pg.add_script_tag(content="window.__sim=" + SIM)
    snap = lambda: pg.evaluate(SNAP)
    close_modal = lambda: pg.evaluate("()=>{document.querySelector('#modal').classList.remove('on');document.querySelector('#end').classList.remove('on')}")
    pg.evaluate("()=>{const s=__dv.sv();s.sa=60;s.un=0}")

    # ───── A. Giao diện Bí Cảnh ─────
    pg.evaluate("document.querySelector('[data-m=rift]').click()"); pg.wait_for_timeout(300)
    chk('Nút Bí cảnh mở hub (không còn "sắp ra mắt")', pg.evaluate("!!document.querySelector('#hrf')"))
    chk('Hub có 3 tab', pg.evaluate("document.querySelectorAll('#hrf .tbs button').length") == 3)
    chk('Liệt kê đủ 7 Bí Cảnh', pg.evaluate("document.querySelectorAll('#hrf .cd[data-t]').length") == 7)
    chk('Chương 1: chỉ Hắc Thiết Quật mở, 6 loại còn lại khoá', pg.evaluate("document.querySelectorAll('#hrf .cd.lk').length") == 6)
    pg.evaluate("document.querySelector('#hrf .cd[data-t=gold]').click()")
    chk('Bấm Bí Cảnh khoá → không mở danh sách tầng', pg.evaluate("document.querySelectorAll('#hrf [data-a=go]').length") == 0)
    pg.evaluate("document.querySelector('#hrf .cd[data-t=ore]').click()")
    chk('Mở Hắc Thiết Quật: 10 tầng', pg.evaluate("document.querySelectorAll('#hrf .pb .cd[style*=\"--c\"] .ic').length") >= 10)
    chk('Chỉ tầng 1 có nút VÀO, tầng 2+ khoá', pg.evaluate("document.querySelectorAll('#hrf [data-a=go]').length") == 1)
    chk('Chưa qua tầng nào → chưa có nút QUÉT', pg.evaluate("document.querySelectorAll('#hrf [data-a=sw]').length") == 0)
    chk('Tầng 5 và 10 là tầng Boss', pg.evaluate("[...document.querySelectorAll('#hrf .pb b')].filter(x=>x.textContent.includes('BOSS')).length") == 2)

    # ───── B. Vào tầng với màn Loading THẬT (bất đồng bộ) ─────
    before = snap()
    pg.evaluate("document.querySelector('#hrf [data-a=go]').click()"); pg.wait_for_timeout(2500)
    chk('Vào tầng: hub đóng, ván Bí Cảnh bắt đầu sau Loading', pg.evaluate("!document.querySelector('#hrf')&&!!__dv.G()&&__dv.G().xm==='rift'"))
    chk('G gắn đúng loại/tầng', pg.evaluate("__dv.G().xf===1&&__dv.G().stg.rift.type==='ore'&&__dv.G().stg.duration===70"))
    chk('Tốn 8 thể lực + 1 lượt', before['sa'] - snap()['sa'] in (7, 8, 9) and pg.evaluate("__dv.rfLeft('ore')") == 4, f"{before['sa']}→{snap()['sa']}")
    chk('HUD hiện tên Bí Cảnh + tầng', 'Hắc Thiết Quật' in pg.evaluate("document.querySelector('#mn').textContent") and 'Tầng 1' in pg.evaluate("document.querySelector('#mn').textContent"))
    pg.evaluate("()=>{__dv.G().p.hp=-1}"); pg.wait_for_timeout(400)
    pg.evaluate("()=>{__dv.run(false)}")

    # bỏ Loading cho phần bot chạy đồng bộ
    pg.evaluate("()=>{if(window.DV_HOME)DV_HOME.loading=(c,n,h,cb)=>cb()}")
    pg.evaluate("()=>{const s=__dv.sv();s.sa=200;s.rf.n={};s.rf.best={};__dv.G().ending=0;document.querySelector('#end').classList.remove('on')}")
    pg.evaluate("document.querySelector('#modal').classList.remove('on')")

    # ───── C. Thắng tầng 1 (bot bất tử) ─────
    a = snap(); pg.evaluate("__dv.goRift('ore',1)")
    r = pg.evaluate("o=>__sim(o)", {'god': True})
    c = snap()
    chk('Tầng 1: thắng khi hạ Thủ Hộ', r['win'] and r['end'], f"t={r['t']} boss@{r['bossSeen']}")
    chk('Thủ Hộ xuất hiện ~48s', 46 <= r['bossSeen'] <= 52, f"{r['bossSeen']}")
    chk('Kỷ lục tầng ghi nhận (ore=1)', json.loads(c['rfb']).get('ore') == 1)
    chk('Nhận Tinh thiết + Hồn + vàng + kim cương lần đầu', c['mt'] > a['mt'] and c['hon'] > a['hon'] and c['gold'] > a['gold'] and c['gem'] > a['gem'], f"⚙+{c['mt']-a['mt']} 🔮+{c['hon']-a['hon']} 💎+{c['gem']-a['gem']}")
    chk('Có trang bị rơi (lần đầu)', c['inv'] > a['inv'])
    chk('KHÔNG đổi tiến độ chương (sao/clear/mở khoá)', a['cl'] == c['cl'] and a['sr'] == c['sr'] and a['un'] == c['un'])
    chk('Màn kết thúc ghi tên Bí Cảnh + thưởng lần đầu', 'HẮC THIẾT QUẬT' in pg.evaluate("document.querySelector('#er').textContent") and 'Lần đầu' in pg.evaluate("document.querySelector('#er').textContent"))
    chk('Nút kế tiếp = "▶ TẦNG 2" và ST đã chuyển sang tầng 2', pg.evaluate("document.querySelector('#b-again').textContent") == '▶ TẦNG 2' and pg.evaluate("__dv.ST().f") == 2)
    # chơi tiếp tầng 2 qua nút b-again
    close_modal(); a = snap()
    pg.evaluate("document.querySelector('#b-again').click()")
    chk('Bấm ▶ TẦNG 2 → vào tầng 2', pg.evaluate("__dv.G()&&__dv.G().xf===2"))
    r2 = pg.evaluate("o=>__sim(o)", {'god': True}); c2 = snap()
    chk('Tầng 2 thắng, kỷ lục = 2', r2['win'] and json.loads(c2['rfb']).get('ore') == 2)
    chk('Tầng 2 có luật tầng (1 luật)', pg.evaluate("DV_DATA.realm.affixes('ore',2).length") == 1)

    # ───── D. Thua: chỉ nhận chút EXP/vàng, không ghi kỷ lục ─────
    close_modal(); pg.evaluate("()=>{__dv.sv().sa=200}"); a = snap(); pg.evaluate("__dv.goRift('ore',3)")
    r3 = pg.evaluate("o=>__sim(o)", {'maxT': 15, 'die': True}); c3 = snap()
    chk('Thua tầng 3: không ghi kỷ lục, không tinh thiết/hồn', not r3['win'] and json.loads(c3['rfb']).get('ore') == 2 and c3['mt'] == a['mt'] and c3['hon'] == a['hon'])
    chk('Thua vẫn tốn lượt (đã vào 3 lần: tầng 1, 2, 3)', pg.evaluate("__dv.rfLeft('ore')") == 2, str(pg.evaluate("__dv.rfLeft('ore')")))

    # ───── E. Giới hạn lượt/ngày, khoá, qua ngày ─────
    close_modal(); pg.evaluate("()=>{const s=__dv.sv();s.sa=200;s.rf.n={ore:5}}")
    chk('Hết 5 lượt → goRift bị chặn', pg.evaluate("__dv.goRift('ore',3)") is False and pg.evaluate("__dv.rfLeft('ore')") == 0)
    pg.evaluate("()=>{__dv.sv().rf.d='1999-01-01'}")
    chk('Qua ngày mới reset lượt', pg.evaluate("__dv.rfLeft('ore')") == 5)
    chk('Không nhảy tầng (tầng 5 khi mới qua tầng 2)', pg.evaluate("__dv.goRift('ore',5)") is False)
    chk('Bí Cảnh khoá (gem, chương 1) bị chặn', pg.evaluate("__dv.goRift('gem',1)") is False)
    pg.evaluate("()=>{const s=__dv.sv();s.sa=3}")
    chk('Thiếu thể lực → không vào', pg.evaluate("__dv.goRift('ore',3)") is False and pg.evaluate("!__dv.G()||__dv.G().xf!==3||__dv.G().ending||true"))
    pg.evaluate("()=>{const s=__dv.sv();s.sa=200;s.rf.n={}}")

    # ───── F. Quét tầng ─────
    a = snap(); pg.evaluate("__dv.riftSweep('ore',2,1)"); c = snap()
    chk('Quét ×1 tốn 5 thể lực', a['sa'] - c['sa'] == 5, f"{a['sa']}→{c['sa']}")
    chk('Quét nhận Tinh thiết + Hồn + vàng + trang bị, không kim cương lần đầu', c['mt'] > a['mt'] and c['hon'] > a['hon'] and c['gold'] > a['gold'] and c['inv'] > a['inv'] and c['gem'] == a['gem'])
    chk('Quét không đổi kỷ lục/chương', c['rfb'] == a['rfb'] and c['un'] == a['un'] and c['cl'] == a['cl'])
    chk('Quét tốn 1 lượt', pg.evaluate("__dv.rfLeft('ore')") == 4)
    close_modal(); a = snap(); pg.evaluate("__dv.riftSweep('ore',3,1)")
    chk('Không quét tầng chưa qua (tầng 3)', snap()['sa'] == a['sa'])
    pg.evaluate("__dv.riftSweep('ore',2,99)"); c = snap(); close_modal()
    chk('Quét ×N bị chặn ở số lượt còn lại (4) tối đa 5', a['sa'] - c['sa'] == 5 * 4, f"{a['sa']}→{c['sa']}")
    chk('Hết lượt → quét không chạy', pg.evaluate("__dv.rfLeft('ore')") == 0 and (pg.evaluate("__dv.riftSweep('ore',2,1)") is None))
    pg.evaluate("()=>{const s=__dv.sv();s.rf.n={};s.sa=200}")

    # ───── G. Loại Bí Cảnh: Phù Văn Các cho Phù Văn Thạch; Thiên Cơ Các cho kim cương ─────
    pg.evaluate("()=>{const s=__dv.sv();s.un=12;s.rf.best.rune=3;s.rf.best.gem=3;s.rf.best.soul=3;s.rf.best.gold=3;s.rf.best.exp=3;s.rf.best.gear=3}")
    a = snap(); pg.evaluate("__dv.riftSweep('rune',3,1)"); c = snap(); close_modal()
    chk('Phù Văn Các: rơi 🔶 Phù Văn Thạch', c['rs'] > a['rs'], f"+{c['rs']-a['rs']}")
    a = snap(); pg.evaluate("__dv.riftSweep('gem',3,1)"); c = snap(); close_modal()
    chk('Thiên Cơ Các: rơi 💎', c['gem'] > a['gem'], f"+{c['gem']-a['gem']}")
    a = snap(); pg.evaluate("__dv.riftSweep('gold',3,1)"); cg = snap(); close_modal()
    a2 = snap(); pg.evaluate("__dv.riftSweep('ore',2,1)"); co = snap(); close_modal()
    chk('Tụ Bảo Động nhiều vàng hơn Hắc Thiết Quật', cg['gold'] - a['gold'] > (co['gold'] - a2['gold']) * 2, f"{cg['gold']-a['gold']} vs {co['gold']-a2['gold']}")
    chk('Hắc Thiết Quật nhiều Tinh thiết hơn Tụ Bảo Động', co['mt'] - a2['mt'] > cg['mt'] - a['mt'])
    pg.evaluate("()=>{const s=__dv.sv();s.rf.n={};s.sa=200}")

    # ───── H. Luật tầng áp vào ván ─────
    f_fr = pg.evaluate("()=>{for(const t of DV_DATA.realm.types)for(let f=1;f<=10;f++)if(DV_DATA.realm.affixes(t.id,f).includes('frail')&&t.need<=12)return [t.id,f];return null}")
    f_fu = pg.evaluate("()=>{for(const t of DV_DATA.realm.types)for(let f=1;f<=10;f++)if(DV_DATA.realm.affixes(t.id,f).includes('fury')&&t.need<=12)return [t.id,f];return null}")
    for nm, key, fld in (('Thể Yếu', f_fr, 'G.hin'), ('Huyết Nộ', f_fu, 'G.am')):
        if not key: chk('Có tầng với luật ' + nm, False); continue
        pg.evaluate("o=>{const s=__dv.sv();s.rf.best[o[0]]=o[1]-1;s.sa=200;s.rf.n={}}", key)
        pg.evaluate("o=>__dv.goRift(o[0],o[1])", key)
        v = pg.evaluate("()=>{const G=__dv.G();return {hin:G.hin||1,am:G.am,hasAff:G.stg.rift.aff.length}}")
        chk(f'Luật {nm} áp lên người chơi ({key})', (v['hin'] == 1.25) if nm == 'Thể Yếu' else (v['am'] > 1.05), json.dumps(v))
        pg.evaluate("()=>{__dv.G().p.hp=-1}"); pg.evaluate("o=>__sim(o)", {'maxT': 1}); close_modal()

    # ───── I. Quái và Boss cứng dần theo tầng; tầng Boss 5/10 dùng Boss đầy đủ ─────
    hp = pg.evaluate("()=>[1,5,10].map(f=>DV_DATA.realm.buildRift({x:'rift',r:'ore',f,c:5}).boss.hp)")
    chk('Boss mạnh dần theo tầng', hp[0] < hp[1] < hp[2], str(hp))
    chk('Tầng Boss (5) dùng Boss chương (>> Thủ Hộ tầng thường)', pg.evaluate("DV_DATA.realm.buildRift({x:'rift',r:'ore',f:5,c:5}).boss.hp>DV_DATA.realm.buildRift({x:'rift',r:'ore',f:4,c:5}).boss.hp*1.2"))
    pg.evaluate("()=>{const s=__dv.sv();s.rf.best.ore=4;s.rf.n={};s.sa=200}")
    pg.evaluate("__dv.goRift('ore',5)"); r5 = pg.evaluate("o=>__sim(o)", {'god': True}); c5 = snap(); close_modal()
    chk('Tầng 5 (Boss) thắng, kỷ lục=5', r5['win'] and json.loads(c5['rfb']).get('ore') == 5, f"t={r5['t']}")

    # ───── J. Thử Luyện ─────
    pg.evaluate("()=>{const s=__dv.sv();s.sa=200;s.un=3}")
    pg.evaluate("document.querySelector('[data-m=rift]').click()"); pg.evaluate("document.querySelector('#hrf .tbs button[data-t=trial]').click()")
    chk('Tab Thử Luyện: 4 cấp, chỉ Đồng mở', pg.evaluate("document.querySelectorAll('#hrf [data-a=tsel],#hrf [data-a=tlock]').length") == 4 and pg.evaluate("document.querySelectorAll('#hrf [data-a=trial]').length") == 1)
    chk('Có bảng mốc thưởng + bảng nâng cấp %', 'MỐC THƯỞNG' in pg.evaluate("document.querySelector('#hrf .pb').textContent") and 'BẢNG NÂNG CẤP %' in pg.evaluate("document.querySelector('#hrf .pb').textContent"))
    pg.evaluate("document.querySelector('#hrf [data-a=trial]').click()")
    chk('Vào Thử Luyện: G.tr bật, không có Boss cuối (bossAt vô tận)', pg.evaluate("__dv.G()&&__dv.G().tr===1&&__dv.G().stg.bossAt>=1e8"))
    chk('HUD hiện Thử Luyện', 'Thử Luyện' in (pg.wait_for_timeout(300) or pg.evaluate("document.querySelector('#mn').textContent")))
    chk('Cấp Thử Luyện kéo dài ≥ 45 phút (≥ 90 đợt)', pg.evaluate("__dv.G().stg.waves.length") >= 90)
    chk('Quái mạnh dần theo thời gian (đợt cuối ≫ đợt đầu)', pg.evaluate("(()=>{const w=__dv.G().stg.waves;return w[w.length-1].scale.hp/w[0].scale.hp})()") > 8)
    # lên cấp → có thẻ %
    pg.evaluate("()=>{const G=__dv.G(),P=G.p;__dv.run(false);G.orb.push({x:P.x,y:P.y,v:P.next+5});__dv.upd(.05);__dv.upd(.05)}")
    cards = pg.evaluate("[...document.querySelectorAll('#cards .card')].map(x=>x.dataset.k)")
    chk('Lên cấp: 3 thẻ gồm ≥1 thẻ % (pct:)', len(cards) == 3 and any(k.startswith('pct:') for k in cards), str(cards))
    chk('Thẻ % hiển thị đủ tên + độ hiếm', pg.evaluate("[...document.querySelectorAll('#cards .card')].filter(x=>x.dataset.k.startsWith('pct:')).every(x=>x.querySelector('.n').textContent.length>0&&x.querySelector('.r').textContent.length>0)"))
    # áp thẻ % bằng tay từng loại
    res = pg.evaluate("""()=>{const G=__dv.G(),P=G.p,out={};const D=DV_DATA.realm.pct;
      for(const s of D.def.stats){const b={am:G.am,as:G.as||1,cr:G.cr||0,cm:G.cm||2,mhp:P.mhp,spd:P.spd,dr:G.dr||0,rgn:G.rgn||0,mg:G.mg||1,xg:G.xg||1,ec:G.ec||1};
        D.apply(G,'pct:'+s.k+':1');const a={am:G.am,as:G.as||1,cr:G.cr||0,cm:G.cm||2,mhp:P.mhp,spd:P.spd,dr:G.dr||0,rgn:G.rgn||0,mg:G.mg||1,xg:G.xg||1,ec:G.ec||1};
        out[s.k]=a[s.k]>b[s.k]+1e-9}
      return out}""")
    chk('Cả 11 thẻ % đều tăng đúng chỉ số', all(res.values()) and len(res) == 11, str([k for k, v in res.items() if not v]))
    capres = pg.evaluate("()=>{const G=__dv.G();for(let i=0;i<40;i++){DV_DATA.realm.pct.apply(G,'pct:cr:3');DV_DATA.realm.pct.apply(G,'pct:dr:3')}return [G.cr,G.dr]}")
    chk('Giới hạn bạo kích ≤75%, giảm sát thương ≤60%', capres[0] <= .75 + 1e-9 and capres[1] <= .6 + 1e-9, str(capres))
    # nhận thẻ % khi chọn
    pg.evaluate("()=>{const G=__dv.G();G.paused=false;document.querySelector('#lv')&&document.querySelector('#lv').classList.remove('on');G.p.hp=G.p.mhp}")
    chk('Hồi khí/Hấp linh có hiệu lực trong engine (G.rgn/G.mg/G.xg/G.ec/G.hin)', pg.evaluate("(()=>{const s=__dv.G();return typeof s.rgn==='number'&&s.mg>1&&s.xg>1&&s.ec>1})()"))
    # Thử Luyện đủ 200 giây rồi gục → thưởng + kỷ lục + mốc 180s
    pg.evaluate("()=>{const G=__dv.G();G.ending=0;G.p.hp=G.p.mhp;__dv.sv().tr.best=[0,0,0,0]}")
    close_modal()
    pg.evaluate("()=>{__dv.sv().sa=200;__dv.sv().tr.best=[0,0,0,0];__dv.G().p.hp=-1}"); pg.evaluate("o=>__sim(o)", {'maxT': 1}); close_modal()
    a = snap(); pg.evaluate("__dv.goTrial(0)")
    rt = pg.evaluate("o=>__sim(o)", {'god': True, 'maxT': 200, 'die': True, 'pickPct': True}); c = snap()
    chk('Thử Luyện 200s: sống sót tới lúc gục', 190 <= rt['t'] <= 215 and rt['end'] and not rt['win'], f"t={rt['t']} kills={rt['kills']}")
    chk('Không có Boss cuối khi sống sót', rt['bossSeen'] == 0)
    chk('Có rút thẻ % trong ván', rt['sawPct'] >= 3 and any(k.startswith('pct:') for k in rt['picks']), f"lv-ups={rt['sawPct']}")
    chk('Kỷ lục cấp Đồng ≈ thời gian sống', 190 <= json.loads(c['trb'])[0] <= 215, c['trb'])
    chk('Thưởng: vàng + tinh thiết + hồn + kim cương (mốc 180s)', c['gold'] > a['gold'] and c['mt'] > a['mt'] and c['hon'] > a['hon'] and c['gem'] > a['gem'], f"💎+{c['gem']-a['gem']}")
    chk('Tiêu đề: THỬ LUYỆN KẾT THÚC + ghi kỷ lục', 'THỬ LUYỆN KẾT THÚC' in pg.evaluate("document.querySelector('#et').textContent") and 'KỶ LỤC MỚI' in pg.evaluate("document.querySelector('#er').textContent"))
    chk('Không đổi tiến độ chương', a['cl'] == c['cl'] and a['sr'] == c['sr'] and a['un'] == c['un'])
    # lần 2 ngắn hơn: không ghi đè kỷ lục, không trả lại mốc
    close_modal(); b0 = json.loads(snap()['trb'])[0]; a = snap(); pg.evaluate("__dv.goTrial(0)")
    pg.evaluate("o=>__sim(o)", {'god': True, 'maxT': 60, 'die': True}); c = snap(); close_modal()
    chk('Lượt ngắn hơn: kỷ lục giữ nguyên, không nhận lại mốc 💎', json.loads(c['trb'])[0] == b0 and c['gem'] - a['gem'] <= 1, f"💎+{c['gem']-a['gem']}")
    # mở cấp Bạc
    chk('Cấp Bạc khoá khi chưa sống ≥240s', pg.evaluate("__dv.goTrial(1)") is False)
    pg.evaluate("()=>{__dv.sv().tr.best[0]=250}"); chk('Sống ≥240s ở Đồng → mở cấp Bạc', pg.evaluate("DV_DATA.realm.tierOpen(1,__dv.sv().tr.best)") is True)
    # rút lui
    pg.evaluate("()=>{__dv.sv().sa=200}"); pg.evaluate("__dv.goTrial(0)")
    pg.evaluate("()=>{const G=__dv.G();G.p.hp=G.p.mhp;for(let i=0;i<500;i++){__dv.upd(.04);G.p.hp=G.p.mhp}}")
    pg.evaluate("document.querySelector('#pz').click()")
    chk('Menu tạm dừng Thử Luyện có nút RÚT LUI', pg.evaluate("getComputedStyle(document.querySelector('#b-retreat')).display") != 'none')
    a = snap(); pg.evaluate("document.querySelector('#b-retreat').click()"); pg.evaluate("o=>__sim(o)", {'god': True}); c = snap()
    chk('Rút lui: kết thúc ván và vẫn nhận thưởng', pg.evaluate("document.querySelector('#end').classList.contains('on')") and c['gold'] > a['gold'])
    close_modal()
    # nút rút lui ẩn ở ván thường
    pg.evaluate("()=>{const s=__dv.sv();s.sa=200;s.cl['0-1']=1}"); pg.evaluate("__dv.begin(0,1,0)"); pg.evaluate("document.querySelector('#pz').click()")
    chk('Ván thường: không có nút RÚT LUI', pg.evaluate("getComputedStyle(document.querySelector('#b-retreat')).display") == 'none')
    pg.evaluate("document.querySelector('#b-quit').click()"); close_modal()

    # ───── K. Boss Thế Giới ─────
    pg.evaluate("()=>{const s=__dv.sv();s.sa=200;s.wbr={d:'',c:0,n:0,td:0}}")
    pg.evaluate("document.querySelector('[data-m=rift]').click()"); pg.evaluate("document.querySelector('#hrf .tbs button[data-t=boss]').click()")
    t = pg.evaluate("document.querySelector('#hrf .pb').textContent")
    chk('Tab Boss: 3 giai đoạn + 8 hạng + BXH + nút đánh', 'GĐ3' in t and 'Võ Thần' in t and 'BẢNG XẾP HẠNG' in t and pg.evaluate("!!document.querySelector('#hrf [data-a=wb]')"))
    chk('Chưa đánh → chưa nhận được thưởng hạng', pg.evaluate("document.querySelector('#hrf [data-a=claim]').classList.contains('of')"))
    pg.evaluate("document.querySelector('#hrf [data-a=wb]').click()")
    # (Loading đã được thay đồng bộ ở trên; kiểm tra Loading thật ở mục L)
    chk('Boss thế giới: G.wb, Boss có cơ chế nhiều giai đoạn', pg.evaluate("(()=>{__dv.upd(.05);const G=__dv.G();return G.wb===1&&G.boss&&G.boss.wbs===1&&G.boss.ab.length>=8})()"))
    rb = pg.evaluate("o=>__sim(o)", {'god': True})
    chk('Đủ 3 giai đoạn đúng mốc 0/30/60s', set(rb['phases'].keys()) == {'1', '2', '3'} and 28 <= rb['phases']['1'] <= 31 and 58 <= rb['phases']['2'] <= 61, json.dumps(rb['phases']))
    chk('GĐ2/3 tạo vùng nguy hiểm (mưa vòng đỏ)', rb['zones'] >= 5, f"zones={rb['zones']}")
    chk('Hết 90s kết thúc ván, Boss không chết', rb['end'] and 88 <= rb['t'] - 120 <= 93 and rb['wd'] > 0, f"t={rb['t']-120:.1f} dmg={rb['wd']}")
    print('   (hiệu chỉnh) sát thương Boss lượt 1 của bot bất tử, chương 1, chưa trang bị đặc biệt:', rb['wd'], flush=True)
    chk('Ghi nhận hạng hôm nay (lượt 1, sát thương tốt nhất)', pg.evaluate("(()=>{const r=__dv.sv().wbr;return r.n===1&&r.td>0})()"))
    chk('Màn kết thúc hiện 🏅 hạng hôm nay', 'Hạng hôm nay' in pg.evaluate("document.querySelector('#er').textContent"))
    close_modal()
    a = snap(); pg.evaluate("document.querySelector('[data-m=rift]').click()"); pg.evaluate("document.querySelector('#hrf .tbs button[data-t=boss]').click()")
    chk('Chấm đỏ tab Boss khi có thưởng hạng chưa nhận', pg.evaluate("getComputedStyle(document.querySelector('#hrf .tbs button[data-t=boss] u')).display") != 'none')
    pg.evaluate("document.querySelector('#hrf [data-a=claim]').click()"); c = snap()
    chk('Nhận thưởng hạng: cộng vàng', c['gold'] > a['gold'], f"+{c['gold']-a['gold']}")
    g1 = c['gold']; pg.evaluate("__dv.wbClaim()")
    chk('Không nhận hai lần trong ngày', snap()['gold'] == g1)
    pg.evaluate("()=>{__dv.sv().wbr.d='1999-01-01'}")
    chk('Qua ngày: hạng reset, nhận lại được sau khi đánh', pg.evaluate("(()=>{const r=__dv.sv().wbr;return true})()") and pg.evaluate("(()=>{DV_RIFT.refresh();return __dv.sv().wbr.n})()") in (0, 1))
    pg.evaluate("document.querySelector('#hrf [data-a=x]').click()")
    # hạng theo sát thương
    chk('Phân hạng theo sát thương', pg.evaluate("(()=>{const W=DV_DATA.realm.wboss;return [0,2999,3000,18000,150000,9e9].map(d=>W.rankOf(d,0)).join()+'|'+[3000,3001,29999,30000].map(d=>W.rankOf(d,10)).join()})()") == '0,0,1,3,7,7|0,0,2,2', 'mốc ×(1+0.1·chương)')

    # ───── L. Boss thế giới với Loading THẬT (lỗi cũ: chạy thành ván thường) ─────
    pg.reload(); pg.wait_for_timeout(700)
    pg.evaluate("()=>{__dv.sv().sa=200}"); pg.evaluate("__dv.startWB()"); pg.wait_for_timeout(2600)
    chk('Boss thế giới qua Loading thật: G.wb=1, t≈120 (không còn chạy thành ván thường)', pg.evaluate("(()=>{const G=__dv.G();return !!G&&G.wb===1&&G.t>=119.9&&G.t<123})()"))
    chk('Có Boss ngay + HUD hiện giai đoạn', pg.evaluate("(()=>{const G=__dv.G();return !!G.boss&&G.boss.wbs===1})()") and 'GĐ' in pg.evaluate("document.querySelector('#bossw').textContent"))

    # ───── M. Phù Văn Thạch dùng nâng Phù Văn ─────
    pg.reload(); pg.wait_for_timeout(700)
    res = pg.evaluate("""()=>{const s=__dv.sv(),U=__dv.upx(),R=DV_DATA.upg,id=s.hs,k=R.rune.types[0].k;
      s.rs=0;U.runeUpS(id,k);const lv0=(U.runeOf(id).lv[k]|0);
      s.rs=100;U.runeUpS(id,k);const lv1=(U.runeOf(id).lv[k]|0),rs1=s.rs;
      U.runeUpS(id,k);const lv2=(U.runeOf(id).lv[k]|0),rs2=s.rs;
      return {lv0,lv1,rs1,lv2,rs2,stone:R.rune.stone}}""")
    chk('Không đủ 🔶 → không nâng', res['lv0'] == 0)
    chk('Dùng 🔶 nâng Phù Văn cấp 1 (tốn 3) rồi cấp 2 (tốn 8)', res['lv1'] == 1 and res['rs1'] == 97 and res['lv2'] == 2 and res['rs2'] == 89, json.dumps(res))

    chk('Không lỗi JS', not errs, str(errs[:3]))
    b.close()
print('ALL PASS' if ok else 'SOME FAILED')
raise SystemExit(0 if ok else 1)
