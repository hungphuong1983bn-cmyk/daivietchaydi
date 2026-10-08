/* DV_UP — Màn NÂNG CẤP TƯỚNG (Phase 12 · Part 3). Module giao diện độc lập; mọi thao tác đi qua ctx do index.html cung cấp.
   4 tab, TẤT CẢ theo từng tướng đang xem (vuốt/bấm ‹ › để đổi tướng, không đổi tướng chính):
     Tướng · Trang bị (7 ô + Set) · Võ học · Phù Văn
   DV_UP.bind(B) · DV_UP.open({tab:'hero'|'gear'|'mart'|'rune', id}) · DV_UP.close() */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), M = Math;
  const RMO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CSS = `
#hup{position:absolute;inset:0;z-index:12;display:flex;flex-direction:column;overflow:hidden;color:#f3e3b8;background:#0b1020;animation:si .25s both;--c:#2f5aa8}
#hup .bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 22%,color-mix(in srgb,var(--c) 60%,#fff 8%) 0,color-mix(in srgb,var(--c) 30%,#0b1020) 40%,#0b1020 78%)}
#hup>*{position:relative}#hup>.bg{position:absolute}
#hup .tb{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 8px) 12px 4px}
#hup .tb b{flex:1;text-align:center;font-size:16px;letter-spacing:2px;color:#ffe9b0;text-shadow:0 2px 6px #000}
#hup .rb{font:inherit;min-width:42px;min-height:42px;border-radius:12px;border:1px solid #a8802f;background:rgba(10,10,28,.85);color:#f3e3b8;font-size:13px;cursor:pointer;padding:0 10px}
#hup .rs{display:flex;gap:10px;justify-content:center;font-size:12px;padding:0 12px 2px;color:#ffe9b0}
#hup .stg{flex:0 0 22%;min-height:120px;max-height:190px;position:relative;cursor:grab;user-select:none;touch-action:pan-y}
#hup .stg canvas{position:absolute;inset:0;width:100%;height:100%}
#hup .ar{position:absolute;top:34%;font-size:26px;color:#ffd978;opacity:.85;background:none;border:0;cursor:pointer;padding:10px;z-index:3;text-shadow:0 0 8px #000}
#hup .ar.l{left:0}#hup .ar.r{right:0}
#hup .nm{text-align:center;padding:0 12px}
#hup .nm h2{margin:0;font-size:20px;color:#fff3d0;text-shadow:0 2px 8px #000;line-height:1.1}
#hup .tg{display:flex;gap:6px;justify-content:center;margin-top:4px;flex-wrap:wrap;font-size:11px}
#hup .tg i{font-style:normal;padding:2px 9px;border-radius:10px;border:1px solid #a8802f;background:rgba(10,10,28,.7)}
#hup .pn{flex:1 1 0;margin:8px 10px 0;border:1px solid #a8802f;border-radius:14px 14px 0 0;background:linear-gradient(rgba(26,18,48,.94),rgba(10,10,28,.97));display:flex;flex-direction:column;min-height:0}
#hup .tbs{display:flex}#hup .tbs button{flex:1;font:inherit;font-size:13px;min-height:42px;border:0;background:none;color:#b9a77a;cursor:pointer;border-bottom:2px solid transparent;position:relative}
#hup .tbs button.on{color:#ffe9b0;border-color:#ffd978}
#hup .tbs u{position:absolute;top:5px;right:calc(50% - 22px);width:8px;height:8px;border-radius:50%;background:#e33;text-decoration:none}
#hup .pb{overflow:auto;padding:8px 12px calc(env(safe-area-inset-bottom) + 14px);font-size:12px;-webkit-overflow-scrolling:touch;min-height:0;flex:1}
#hup .cd{margin:6px 0;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid #3b4468}
#hup .cd.hl{border-color:#a8802f}
#hup .rw{display:flex;align-items:center;gap:9px}
#hup .ic{flex:none;width:44px;height:44px;border-radius:10px;border:2px solid #555;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);font-size:22px;position:relative}
#hup .ic img{width:100%;height:100%;object-fit:contain}
#hup .ic small{position:absolute;right:2px;bottom:0;font-size:9px;color:#fff;text-shadow:0 0 3px #000}
#hup .mid{flex:1;min-width:0}#hup .mid b{font-size:13px}#hup .mid small{display:block;opacity:.85;margin-top:1px;font-size:11px}
#hup .bt{font:inherit;font-size:12px;min-height:38px;min-width:64px;padding:6px 10px;border-radius:10px;border:1px solid #a8802f;background:linear-gradient(#6b4a1c,#3d2a10);color:#ffe9b0;cursor:pointer;white-space:nowrap}
#hup .bt.sm{min-height:30px;min-width:0;padding:3px 9px;font-size:11px}
#hup .bt.of{filter:grayscale(.9);opacity:.55}#hup .bt.gh{background:rgba(255,255,255,.06);border-color:#6b5326}
#hup .bt:active{transform:scale(.95)}
#hup .bar{height:10px;border-radius:6px;background:#201a38;overflow:hidden;margin:5px 0}#hup .bar i{display:block;height:100%;background:linear-gradient(90deg,#2a6fd6,#6ec6ff)}
#hup .sr{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.08)}#hup .sr b{color:#ffd978}
#hup .gd{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:6px}
#hup .sl{aspect-ratio:1;border-radius:9px;border:2px solid #555;background:rgba(0,0,0,.3);position:relative;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer}
#hup .sl.on{outline:2px solid #ffd978}#hup .sl img{width:100%;height:100%;object-fit:contain}
#hup .sl small{position:absolute;right:2px;bottom:0;font-size:9px;text-shadow:0 0 3px #000}
#hup .sl small.o{left:3px;right:auto;top:0;bottom:auto;font-size:12px}
#hup .ok{color:#7dff9a}#hup .no{opacity:.55}#hup .gx{color:#ffd978}
#hup h4{margin:10px 0 4px;color:#ffd978;font-size:13px}
#hup .tier{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:4px 0;border-top:1px dashed rgba(255,255,255,.08)}
#hup .rsl{display:flex;gap:8px;justify-content:center;margin:6px 0 4px}
#hup .rsl .sl{width:62px;aspect-ratio:auto;height:62px;font-size:24px;border-color:#a8802f}
#hup .rsl .sl.lk{filter:grayscale(1);opacity:.5;cursor:default;font-size:11px;text-align:center;flex-direction:column}
#hup .tag{font-size:10px;padding:1px 7px;border-radius:9px;background:#a8802f;color:#1a1020;margin-left:6px;font-weight:700}
@media (orientation:landscape) and (max-height:520px){#hup .stg{display:none}}
`;
  let B = null, root = null, ids = [], idx = 0, tab = 'hero', open_ = null, selU = null, raf = 0, clock = 0, drag = null, stT = 0, state = 'idle';
  const bind = c => { B = c };
  const css = () => { if (document.getElementById('hup-css')) return; const s = document.createElement('style'); s.id = 'hup-css'; s.textContent = CSS; document.head.appendChild(s) };
  const U = () => window.DV_DATA && DV_DATA.upg;
  const fm = n => (n | 0).toLocaleString('vi');
  const cur = () => ids[idx];
  const rcol = i => B.RAR[B.RC[i.r]][1], rnm = i => B.RAR[B.RC[i.r]][0];

  /* ── Tab: Tướng ─────────────────────────────────────────────── */
  function tHero(id) {
    const o = B.heroInfo(id), b = o.b, s = B.sv();
    const need = o.need, pct = o.max ? 100 : M.min(100, o.exp / o.expNext * 100);
    let h = `<div class="cd"><div class="rw"><div class="mid"><b>${'★'.repeat(o.star) || '☆'} Cấp ${o.l}/${o.cap}</b><small>${o.max ? 'Đã đạt trần cấp — tăng ★ (Triệu hồi trùng tướng) để mở thêm 5 cấp' : 'EXP ' + fm(o.exp) + '/' + fm(o.expNext) + ' · cần thêm ' + fm(need) + ' EXP'}</small></div></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="rw" style="gap:8px"><button class="bt ${o.max || s.gold < o.cost ? 'of' : ''}" style="flex:1" data-a="lv1">${o.max ? 'TRẦN CẤP' : 'LÊN 1 CẤP · 🪙' + fm(o.cost)}</button><button class="bt gh ${o.max || s.gold < o.cost ? 'of' : ''}" style="flex:1" data-a="lvx">LÊN TỐI ĐA</button></div></div>`;
    h += `<div class="cd"><div class="sr"><span>⚔ Chiến lực</span><b>${fm(o.pw)}</b></div>
      <div class="sr"><span>❤ Sinh lực</span><b>${fm(100 + b.hp)}</b></div><div class="sr"><span>🗡 Công</span><b>${M.round(b.am * 100)}</b></div>
      <div class="sr"><span>💨 Tốc độ</span><b>${M.round(130 * (1 + b.sp))}</b></div><div class="sr"><span>💥 Bạo kích</span><b>${M.round(b.cr * 100)}%</b></div>
      <div class="sr"><span>🔥 ST bạo kích</span><b>${M.round(b.cm * 100)}%</b></div><div class="sr"><span>🌀 Né đòn</span><b>${M.round(b.dg * 1000) / 10}%</b></div></div>
      <div class="cd"><div class="sr"><span>🎽 Trang bị đang mặc</span><b>${o.eqN}/7</b></div><div class="sr"><span>🧩 Set đang kích hoạt</span><b>${o.setN}</b></div>
      <div class="sr"><span>📖 Võ học đã học</span><b>${o.vhN}/${o.vhT}</b></div><div class="sr"><span>🔮 Phù Văn đã gắn</span><b>${o.rnN}/${o.rnS}</b></div></div>
      <div class="rw" style="gap:8px"><button class="bt gh" style="flex:1" data-a="prof">📜 Hồ sơ · Tiến hoá</button><button class="bt ${o.sel ? 'of' : ''}" style="flex:1" data-a="pick">${o.sel ? '✔ ĐANG DÙNG' : 'CHỌN LÀM TƯỚNG CHÍNH'}</button></div>`;
    return h;
  }

  /* ── Tab: Trang bị ─────────────────────────────────────────── */
  const ORDER = ['w', 'a', 'h', 'n', 'b', 'r', 'f'];
  function setPanel(id) {
    const L = B.setInfo(id); if (!L) return '';
    return '<h4>Bộ trang bị</h4>' + L.map(S => `<div class="cd ${S.tiers.some(t => t.on) ? 'hl' : ''}"><div class="rw"><b class="${S.have >= 3 ? 'gx' : 'no'}">${S.n}</b><small style="margin-left:auto">${S.have}/7 món từ ${B.RAR[B.RC[S.t]][0]} trở lên</small></div>${S.tiers.map(t => `<small class="${t.on ? 'ok' : 'no'}" style="display:block">${t.on ? '✔' : '○'} ${t.n} món: ${t.d}</small>`).join('')}</div>`).join('');
  }
  function bagGrid(id, k) {
    const L = B.bag(k); if (!L.length) return '<small class="no">Túi chưa có trang bị loại này.</small>';
    return '<div class="gd">' + L.map(i => { const ow = B.owner(i.u); const oh = ow && ow !== id ? B.hero(ow) : null;
      return `<div class="sl ${i.u === selU ? 'on' : ''}" style="border-color:${rcol(i)}" data-a="pick_it" data-u="${i.u}">${B.iimg(i)}<small>Lv.${i.l}</small>${ow === id ? '<small class="o ok">E</small>' : oh ? `<small class="o">${oh.i}</small>` : ''}</div>` }).join('') + '</div>';
  }
  function itemDetail(id, i) {
    if (!i) return ''; const S = B.SLOT[i.s], ow = B.owner(i.u), mine = ow === id, c = B.upCost(i), can = B.sv().gold >= c && i.l < 10, cu = B.eqi(id, i.s);
    const cmp = cu && !mine ? `<small>Đang mặc: ${cu.n} (${S.f(B.pv(cu))})</small>` : '';
    const oh = ow && !mine ? B.hero(ow) : null;
    return `<div class="cd hl" style="border-color:${rcol(i)}"><b style="color:${rcol(i)}">${S.i} ${i.n}</b> <small style="display:inline">${rnm(i)} · Lv.${i.l}/10 ${'★'.repeat(i.rf || 0)}</small>
      <small>${S.f(B.pv(i))}${i.l < 10 ? ' → <b class="ok">' + S.f(B.pv({ ...i, l: i.l + 1 })) + '</b>' : ' · Tối đa'}</small>${cmp}${oh ? `<small class="gx">Đang do ${oh.n} mặc — mặc cho tướng này sẽ chuyển sang.</small>` : ''}
      <div class="rw" style="gap:6px;margin-top:6px;flex-wrap:wrap">${mine ? `<button class="bt sm gh" data-a="unequip" data-k="${i.s}">THÁO</button>` : `<button class="bt sm" data-a="equip" data-u="${i.u}">${oh ? 'CHUYỂN & MẶC' : 'MẶC'}</button>`}
      <button class="bt sm ${can ? '' : 'of'}" data-a="upg" data-u="${i.u}">${i.l >= 10 ? 'TỐI ĐA' : '⬆ 🪙' + fm(c)}</button>
      <button class="bt sm ${(i.rf || 0) >= 5 ? 'of' : ''}" data-a="rf" data-u="${i.u}">${(i.rf || 0) >= 5 ? 'TL MAX' : 'Tinh luyện ⚙' + B.rfc(i) + ' 🪙' + fm(B.rfg(i))}</button>
      ${ow ? '' : `<button class="bt sm gh" data-a="sell" data-u="${i.u}">BÁN 🪙${fm(B.sell(i))}</button>`}</div></div>`;
  }
  function tGear(id) {
    let h = `<div class="rw" style="gap:8px"><button class="bt" style="flex:1" data-a="auto">⚡ TỰ ĐỘNG MẶC TỐT NHẤT</button></div><h4>Trang bị của tướng (7 ô)</h4>`;
    for (const k of ORDER) {
      const S = B.SLOT[k], i = B.eqi(id, k), op = open_ === k;
      if (!i) h += `<div class="cd"><div class="rw"><div class="ic" style="border-style:dashed">＋</div><div class="mid"><b>Ô ${S.t} trống</b><small>Chọn từ túi đồ</small></div><button class="bt sm" data-a="open" data-k="${k}">${op ? 'ĐÓNG' : 'CHỌN'}</button></div>${op ? bagGrid(id, k) + itemDetail(id, B.byU(selU)) : ''}</div>`;
      else { const c = B.upCost(i), can = B.sv().gold >= c && i.l < 10;
        h += `<div class="cd ${op ? 'hl' : ''}" style="border-color:${op ? rcol(i) : ''}"><div class="rw"><div class="ic" style="border-color:${rcol(i)}">${B.iimg(i)}<small>Lv.${i.l}</small></div><div class="mid"><b>${i.n}</b> <small style="display:inline;color:${rcol(i)}">${rnm(i)} ${'★'.repeat(i.rf || 0)}</small><small>${S.f(B.pv(i))}${i.l < 10 ? ' → ' + S.f(B.pv({ ...i, l: i.l + 1 })) : ' · Tối đa'}</small></div>
        <div style="display:flex;flex-direction:column;gap:4px"><button class="bt sm ${can ? '' : 'of'}" data-a="upg" data-u="${i.u}">${i.l >= 10 ? 'MAX' : '⬆ 🪙' + fm(c)}</button><button class="bt sm gh" data-a="open" data-k="${k}">${op ? 'ĐÓNG' : 'ĐỔI'}</button></div></div>${op ? bagGrid(id, k) + itemDetail(id, B.byU(selU) || i) : ''}</div>`; }
    }
    return h + setPanel(id);
  }

  /* ── Tab: Võ học ───────────────────────────────────────────── */
  function tMart(id) {
    const u = U(), s = B.sv(), V = B.vhOf(id), hn = B.hero(id).n; if (!u) return '<div class="cd">Thiếu dữ liệu.</div>';
    let h = `<div class="cd"><small>🪙 ${fm(s.gold)} · Võ học là của <b class="gx">${hn}</b>, học tuần tự từng tầng. Sách <b class="gx">sở trường</b> có hiệu ứng ×${u.martial.affMul}.</small></div>`;
    for (const b of u.martial.books) {
      const af = u.mAff(id, b.k), mul = af ? u.martial.affMul : 1, done = b.n.filter((_, j) => V[b.k + j]).length;
      h += `<div class="cd ${af ? 'hl' : ''}"><div class="rw"><div class="ic">${b.i}</div><div class="mid"><b>${b.t}</b>${af ? '<span class="tag">SỞ TRƯỜNG</span>' : ''}<small>${done}/${b.n.length} tầng</small></div></div>`;
      b.n.forEach((n, j) => { const ok = V[b.k + j], lk = j && !V[b.k + j - 1], poor = s.gold < n.c, e = {}; for (const x in n.e) e[x] = n.e[x] * mul;
        h += `<div class="tier"><span class="${ok ? 'ok' : lk ? 'no' : ''}">Tầng ${j + 1}: ${u.fmt(e)}</span>${ok ? '<b class="ok">✔ Đã học</b>' : `<button class="bt sm ${lk || poor ? 'of' : ''}" data-a="learn" data-v="${b.k}${j}">${lk ? '🔒' : '🪙' + fm(n.c)}</button>`}</div>` });
      h += '</div>';
    }
    return h;
  }

  /* ── Tab: Phù Văn ─────────────────────────────────────────── */
  function tRune(id) {
    const u = U(), s = B.sv(), r = B.runeOf(id), o = B.heroInfo(id), R = u.rune, ns = u.runeSlots(o.l);
    let h = `<div class="cd"><small>🪙 ${fm(s.gold)} · ⚙ ${fm(s.mt || 0)} · Phù Văn của <b class="gx">${B.hero(id).n}</b>. Ô mở theo cấp tướng: ${R.slotAt.map((n, i) => 'ô ' + (i + 1) + ' Lv.' + n).join(' · ')}.</small></div><div class="rsl">`;
    R.slotAt.forEach((n, i) => { const k = r.eq[i], t = k && u.rt(k);
      h += i >= ns ? `<div class="sl lk">🔒<small style="position:static">Lv.${n}</small></div>` : t && (r.lv[k] | 0) > 0 ? `<div class="sl" data-a="rtake" data-i="${i}" title="Tháo">${t.i}<small>Lv.${r.lv[k]}</small></div>` : `<div class="sl no" style="border-style:dashed">＋</div>` });
    h += '</div>';
    for (const t of R.types) {
      const l = r.lv[t.k] | 0, mx = l >= R.maxLv, c = R.cost[l], eqd = r.eq.slice(0, ns).includes(t.k), free = r.eq.slice(0, ns).includes(null) || r.eq.slice(0, ns).some(x => !x), can = c && s.gold >= c.g && (s.mt || 0) >= c.t;
      h += `<div class="cd ${eqd ? 'hl' : ''}"><div class="rw"><div class="ic">${t.i}<small>${l ? 'Lv.' + l : ''}</small></div><div class="mid"><b>${t.n}</b> <small style="display:inline">${l}/${R.maxLv}</small><small>${l ? u.runeFmt(t.k, l) : 'Chưa học'}${mx ? '' : ' → <b class="ok">' + u.runeFmt(t.k, l + 1) + '</b>'}</small></div>
        <div style="display:flex;flex-direction:column;gap:4px"><button class="bt sm ${mx || !can ? 'of' : ''}" data-a="rup" data-k="${t.k}">${mx ? 'MAX' : (l ? '⬆ ' : 'HỌC ') + '🪙' + fm(c.g) + ' ⚙' + c.t}</button>${l ? `<button class="bt sm gh ${!eqd && !free ? 'of' : ''}" data-a="${eqd ? 'runeoff' : 'rset'}" data-k="${t.k}">${eqd ? 'THÁO' : 'GẮN'}</button>` : ''}</div></div></div>`;
    }
    return h;
  }

  const TABS = [['hero', 'Tướng'], ['gear', 'Trang bị'], ['mart', 'Võ học'], ['rune', 'Phù Văn']];
  function badge(t, id) { try { return B.badge(t, id) } catch (e) { return 0 } }
  function render() {
    if (!root) return; const id = cur(), h = B.hero(id), pb = $('.pb', root), top = pb ? pb.scrollTop : 0, s = B.sv();
    root.style.setProperty('--c', h.col || '#2f5aa8');
    $('.rs', root).innerHTML = `<span>🪙 ${fm(s.gold)}</span><span>⚙ ${fm(s.mt || 0)}</span><span>🔮 ${fm(s.hon || 0)}</span><span>💎 ${fm(s.gem)}</span>`;
    const o = B.heroInfo(id);
    $('.nm', root).innerHTML = `<h2>${h.i} ${h.n}</h2><div class="tg"><i style="color:${h.qc};border-color:${h.qc}">${h.q}</i><i>${'★'.repeat(o.star) || '☆'} Lv.${o.l}/${o.cap}</i><i>⚔ LC ${fm(o.pw)}</i>${o.sel ? '<i>✔ Tướng chính</i>' : ''}</div>`;
    root.querySelectorAll('.tbs button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); const u = b.querySelector('u'); if (u) u.style.display = badge(b.dataset.t, id) ? '' : 'none' });
    $('.pb', root).innerHTML = tab === 'gear' ? tGear(id) : tab === 'mart' ? tMart(id) : tab === 'rune' ? tRune(id) : tHero(id);
    $('.pb', root).scrollTop = top;
  }

  function act(a, d) {
    const id = cur(), r = (f) => { const v = f(); render(); return v };
    switch (a) {
      case 'lv1': return r(() => B.levelUp(id, false));
      case 'lvx': return r(() => B.levelUp(id, true));
      case 'prof': close(); return B.profile(id);
      case 'pick': return r(() => B.pick(id));
      case 'auto': return r(() => B.auto(id));
      case 'open': open_ = open_ === d.k ? null : d.k; selU = null; return render();
      case 'pick_it': selU = selU === d.u ? null : d.u; return render();
      case 'equip': return r(() => B.equip(id, d.u));
      case 'unequip': selU = null; return r(() => B.unequip(id, d.k));
      case 'upg': return r(() => B.upgrade(d.u));
      case 'rf': return r(() => B.refine(d.u));
      case 'sell': selU = null; return r(() => B.sellItem(d.u));
      case 'learn': return r(() => B.learn(id, d.v));
      case 'rup': return r(() => B.runeUp(id, d.k));
      case 'rset': return r(() => B.runeSet(id, d.k));
      case 'runeoff': return r(() => B.runeOff(id, d.k));
      case 'rtake': return r(() => B.runeTake(id, +d.i));
    }
  }

  function go(dv) { if (ids.length < 2) return; idx = (idx + dv + ids.length) % ids.length; open_ = null; selU = null; state = 'idle'; stT = 0; render() }
  function loop(now) {
    const cv = $('canvas', root); if (!cv || !root || !root.isConnected) return;
    const dpr = M.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect(), W = M.max(1, r.width | 0), H = M.max(1, r.height | 0);
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr }
    const c = cv.getContext('2d'), dt = M.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; clock += dt; stT += dt;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(W / 2, H * .92, H * .22, H * .05, 0, 0, 7); c.fill();
    const id = cur(), CH = window.DV_CHAR;
    if (CH && CH.ok() && CH.get(id)) {
      const lk = B.look(id), A = window.DV_DATA && DV_DATA.charRules && DV_DATA.charRules.anim, a = A && A[state];
      if (a && !a.loop && stT > a.dur + .1) { state = 'idle'; stT = 0 }
      CH.draw(c, id, { x: W / 2, y: H * .92, scale: H / 190 * (window.DV_CHIBI ? 1.55 : 2), f: 1, t: clock, state, st: stT, aw: lk.aw, asc: lk.asc, max: lk.max, q: RMO ? 1 : 2, evo: 0 });
    } else { c.font = H * .5 + 'px serif'; c.textAlign = 'center'; c.fillText(B.hero(id).i || '🧙', W / 2, H * .75) }
    raf = requestAnimationFrame(loop);
  }
  function close() { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); if (root) { root.remove(); root = null } }
  function key(e) { if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'Escape') { close(); B.close && B.close() } }

  function openUp(o) {
    if (!B) return false; o = o || {}; css(); close(); ids = B.ids(); if (!ids.length) return false;
    idx = M.max(0, ids.indexOf(o.id || B.sv().hs)); tab = TABS.some(t => t[0] === o.tab) ? o.tab : 'hero'; open_ = null; selU = null; state = 'idle'; stT = 0;
    root = document.createElement('section'); root.id = 'hup';
    root.innerHTML = `<div class="bg"></div><div class="tb"><button class="rb" data-x="1" aria-label="Đóng">✕</button><b>NÂNG CẤP TƯỚNG</b><span style="min-width:42px"></span></div><div class="rs"></div>
      <div class="stg"><canvas></canvas><button class="ar l" aria-label="Trước">‹</button><button class="ar r" aria-label="Sau">›</button></div><div class="nm"></div>
      <div class="pn"><div class="tbs">${TABS.map(t => `<button data-t="${t[0]}">${t[1]}<u style="display:none"></u></button>`).join('')}</div><div class="pb"></div></div>`;
    ($('#app') || document.body).appendChild(root);
    $('[data-x]', root).onclick = () => { close(); B.close && B.close() };
    $('.ar.l', root).onclick = () => go(-1); $('.ar.r', root).onclick = () => go(1);
    root.querySelectorAll('.tbs button').forEach(b => b.onclick = () => { tab = b.dataset.t; open_ = null; selU = null; render(); $('.pb', root).scrollTop = 0 });
    $('.pb', root).addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (t) act(t.dataset.a, t.dataset) });
    const sg = $('.stg', root);
    sg.addEventListener('pointerdown', e => { drag = { x: e.clientX, m: 0 }; sg.setPointerCapture(e.pointerId) });
    sg.addEventListener('pointermove', e => { if (drag) drag.m = M.max(drag.m, M.abs(e.clientX - drag.x)) });
    const up = e => { if (!drag) return; const dx = e.clientX - drag.x, m = drag.m; drag = null; if (M.abs(dx) > 45) go(dx < 0 ? 1 : -1); else if (m < 8) { state = ['attack', 'skill', 'hit'][M.random() * 3 | 0]; stT = 0 } };
    sg.addEventListener('pointerup', up); sg.addEventListener('pointercancel', up);
    document.addEventListener('keydown', key); render(); loop.l = 0; raf = requestAnimationFrame(loop); return true;
  }
  window.DV_UP = { bind, open: openUp, close, go, _render: render, state: () => ({ tab, id: root ? cur() : null, open: !!root }) };
})();
