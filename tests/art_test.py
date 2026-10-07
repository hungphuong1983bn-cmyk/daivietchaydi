import os, sys, json
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
from playwright.sync_api import sync_playwright
PAGE = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html')) + '?debug'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/art'
CH = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 and sys.argv[2] not in ('','auto') else None
T = float(sys.argv[3]) if len(sys.argv) > 3 else 30
os.makedirs(OUT, exist_ok=True)
STEP = r"""
async (o) => {
  const d = __dv, c0 = o.c - 1, i = o.i; d.sv().hs = d.sv().hs || 'dbl';
  const G0 = d.G(); d.begin(c0, i); for (let k = 0; k < 100 && (d.G() === G0 || !d.G()); k++) await new Promise(r => setTimeout(r, 100)); d.run(false); const G = d.G(), P = G.p;
  P.hp = P.mhp = 1e9; let t = 0;
  while (G.t < o.t) { if (G.paused) { const cs=[...document.querySelectorAll('#cards .card')].map(x=>x.dataset.k); if (cs.length) d.pick(cs[0]); G.paused=false; continue }
    P.hp = 1e9; d.upd(0.04); t++; if (t > 4000) break }
  d.draw();
  return { t: G.t, en: G.en.length, theme: G.ch && G.ch.theme, cid: G.ch && G.ch.chapterId, kinds: [...new Set(G.en.map(e => e.tid))] };
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 560, 'height': 860}, device_scale_factor=2)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(PAGE); pg.wait_for_timeout(600)
    if CH is None:
        CH = pg.evaluate("(()=>{const seen={},o=[];DV_DATA.db.chapters.forEach(c=>{if(!seen[c.theme]){seen[c.theme]=1;o.push(c.chapterId)}});return o})()")
    for c in CH:
        pg.evaluate("document.querySelectorAll('.ov,#home,#loading').forEach(x=>x.style.display='none')")
        r = pg.evaluate(STEP, {'c': c, 'i': 1, 't': T})
        pg.wait_for_timeout(100)
        pg.locator('canvas').first.screenshot(path=f'{OUT}/ch{c:02d}.png'); print(c, r)
    print('ERRS', errs[:6]); b.close()
