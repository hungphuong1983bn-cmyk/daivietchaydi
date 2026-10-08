/* Phase 12 · Part 3 — Dữ liệu Nâng cấp Tướng / Trang bị / Võ học / Phù Văn (thuần dữ liệu + hàm thuần).
   Thiếu file này → game dùng cấu hình dự phòng trong index.html (3 sách Võ học × 3 tầng, không Set, không Phù Văn).

   Quy ước khoá hiệu ứng (khớp bon() trong index.html):
     am = công (%)  ·  hp = sinh lực  ·  sp = tốc độ (%)  ·  cr = bạo kích  ·  dg = né đòn  ·  cm = sát thương bạo kích

   TRANG BỊ  — theo TỪNG TƯỚNG (7 ô: w,a,h,n,b,r,f), túi đồ dùng chung, mỗi món chỉ một tướng mặc tại một thời điểm.
   VÕ HỌC    — theo TỪNG TƯỚNG, học tuần tự từng tầng; mỗi tướng có 1 sách "sở trường" (hiệu ứng ×affMul).
   PHÙ VĂN   — theo TỪNG TƯỚNG: 3 ô (mở theo cấp tướng), mỗi loại Phù Văn có cấp riêng 1–5 cho từng tướng.
*/
window.DV_DATA = window.DV_DATA || {};
DV_DATA.upg = (() => {
  const martial = {
    affMul: 1.25,
    books: [
      { k: 'kp', t: 'Kiếm Pháp', i: '⚔️', n: [{ c: 500, e: { am: .05 }, d: 'Công +5%' }, { c: 1500, e: { am: .08 }, d: 'Công +8%' }, { c: 4000, e: { cr: .06 }, d: 'Bạo kích +6%' }, { c: 9000, e: { am: .10 }, d: 'Công +10%' }, { c: 18000, e: { cr: .08 }, d: 'Bạo kích +8%' }] },
      { k: 'nc', t: 'Nội Công', i: '🧘', n: [{ c: 400, e: { hp: 30 }, d: 'Sinh lực +30' }, { c: 1200, e: { hp: 50 }, d: 'Sinh lực +50' }, { c: 3500, e: { hp: 80 }, d: 'Sinh lực +80' }, { c: 8000, e: { hp: 110 }, d: 'Sinh lực +110' }, { c: 16000, e: { hp: 150 }, d: 'Sinh lực +150' }] },
      { k: 'kc', t: 'Khinh Công', i: '🍃', n: [{ c: 600, e: { sp: .04 }, d: 'Tốc độ +4%' }, { c: 1800, e: { sp: .06 }, d: 'Tốc độ +6%' }, { c: 4500, e: { dg: .05 }, d: 'Né đòn +5%' }, { c: 9000, e: { sp: .06 }, d: 'Tốc độ +6%' }, { c: 18000, e: { dg: .05 }, d: 'Né đòn +5%' }] },
      { k: 'tp', t: 'Tâm Pháp', i: '📿', n: [{ c: 700, e: { cm: .10 }, d: 'ST bạo kích +10%' }, { c: 2000, e: { cm: .15 }, d: 'ST bạo kích +15%' }, { c: 5000, e: { cm: .20 }, d: 'ST bạo kích +20%' }, { c: 10000, e: { cm: .25 }, d: 'ST bạo kích +25%' }, { c: 20000, e: { cm: .30 }, d: 'ST bạo kích +30%' }] }
    ],
    // Sách sở trường của từng tướng (hiệu ứng ×affMul). Tướng ngoài bảng → không có sở trường.
    aff: { dbl: 'kp', lh: 'nc', nq: 'kc', thd: 'tp', dl: 'kc', nb: 'nc', ltk: 'kp' }
  };

  // ── Set trang bị: đếm số món đang mặc có phẩm chất ≥ bậc t (r: 0 Thường, 1 Hiếm, 2 Sử Thi, 3 Huyền Thoại). Bậc 0 không có Set.
  const sets = [null,
    { n: 'Long Tuyền', th: { 3: { hp: 20 }, 5: { am: .03 }, 7: { cr: .03 } } },
    { n: 'Huyền Thiết', th: { 3: { hp: 40 }, 5: { am: .05, sp: .02 }, 7: { cr: .05, cm: .10 } } },
    { n: 'Hoàng Long', th: { 3: { hp: 70, am: .03 }, 5: { am: .08, cr: .03 }, 7: { cr: .06, cm: .20, dg: .03 } } }];
  const EK = { am: ['Công', 1], hp: ['Sinh lực', 0], sp: ['Tốc độ', 1], cr: ['Bạo kích', 1], dg: ['Né đòn', 1], cm: ['ST bạo kích', 1] };
  const fmt = e => Object.keys(e).map(k => EK[k][0] + ' +' + (EK[k][1] ? Math.round(e[k] * 1000) / 10 + '%' : Math.round(e[k]))).join(', ');
  const add = (o, e, m) => { for (const k in e) o[k] = (o[k] || 0) + e[k] * (m || 1) };

  /** rs: mảng phẩm chất các món đang mặc → {tot:{…}, list:[{t,n,have,tiers:[{n,on,d}]}]} */
  function setBonus(rs) {
    const tot = {}, list = [];
    for (let t = 1; t < sets.length; t++) {
      const S = sets[t], have = rs.filter(r => r >= t).length, tiers = [];
      for (const n of Object.keys(S.th).map(Number).sort((a, b) => a - b)) {
        const on = have >= n; tiers.push({ n, on, d: fmt(S.th[n]) }); if (on) add(tot, S.th[n]);
      }
      list.push({ t, n: S.n, have, tiers });
    }
    return { tot, list };
  }

  // ── Phù Văn
  const rune = {
    maxLv: 5, slotAt: [1, 10, 20],
    cost: [{ g: 600, t: 2 }, { g: 1500, t: 5 }, { g: 3500, t: 10 }, { g: 8000, t: 20 }, { g: 16000, t: 40 }],   // chi phí để ĐẠT cấp 1…5
    types: [
      { k: 'cg', n: 'Công Văn', i: '🔴', e: 'am', v: [.02, .04, .06, .08, .10] },
      { k: 'hv', n: 'Hộ Văn', i: '🟢', e: 'hp', v: [15, 30, 50, 75, 110] },
      { k: 'pv', n: 'Phong Văn', i: '🔵', e: 'sp', v: [.02, .03, .04, .05, .07] },
      { k: 'bv', n: 'Bạo Văn', i: '🟡', e: 'cr', v: [.02, .03, .045, .06, .08] },
      { k: 'av', n: 'Ảnh Văn', i: '🟣', e: 'dg', v: [.01, .02, .03, .04, .05] },
      { k: 'tv', n: 'Tâm Văn', i: '⚪', e: 'cm', v: [.05, .10, .15, .22, .30] }]
  };
  const rt = k => rune.types.find(t => t.k === k) || null;
  const runeVal = (k, l) => { const t = rt(k); return t && l > 0 ? { [t.e]: t.v[Math.min(l, rune.maxLv) - 1] } : {} };
  const runeSlots = lv => rune.slotAt.filter(n => lv >= n).length;
  /** rn = {eq:[k,k,k], lv:{k:cấp}}, lv = cấp tướng → tổng hiệu ứng (chỉ các ô đã mở, rune đã học, không trùng) */
  function runeBonus(rn, lv) {
    const tot = {}; if (!rn) return tot; const n = runeSlots(lv | 0), seen = {};
    (rn.eq || []).slice(0, n).forEach(k => { if (!k || seen[k]) return; seen[k] = 1; add(tot, runeVal(k, (rn.lv || {})[k] | 0)) });
    return tot;
  }
  const runeFmt = (k, l) => fmt(runeVal(k, l));

  const mBook = k => martial.books.find(b => b.k === k);
  const mAff = (id, bk) => martial.aff[id] === bk;

  return { martial, sets, setBonus, rune, rt, runeVal, runeSlots, runeBonus, runeFmt, fmt, mBook, mAff, EK, maxEquipLv: 10 };
})();
