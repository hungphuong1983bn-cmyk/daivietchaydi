/* DV_RIFT — Giao diện Phase 12 · Part 4: BÍ CẢNH · THỬ LUYỆN SINH TỒN · BOSS THẾ GIỚI.
   Mọi thao tác đi qua B (RFB do index.html cung cấp); số liệu ở DV_DATA.realm.
   DV_RIFT.bind(B) · open(tab:'rift'|'trial'|'boss') · close() · refresh() · badge() · mixPool(pool,G) · cardHtml(key,i) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), M = Math;
  let B = null, root = null, tab = 'rift', sel = null, selT = null;
  const R = () => window.DV_DATA && DV_DATA.realm;
  const fm = n => (n | 0).toLocaleString('vi');
  const CSS = `
#hrf{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;overflow:hidden;color:#f3e3b8;background:radial-gradient(ellipse at 50% 0,#2a1d4a 0,#0b1020 70%);animation:si .25s both}
#hrf .tb{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 8px) 12px 4px}
#hrf .tb b{flex:1;text-align:center;font-size:16px;letter-spacing:2px;color:#ffe9b0;text-shadow:0 2px 6px #000}
#hrf .rb{font:inherit;min-width:42px;min-height:42px;border-radius:12px;border:1px solid #a8802f;background:rgba(10,10,28,.85);color:#f3e3b8;font-size:14px;cursor:pointer;padding:0 10px}
#hrf .rs{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;font-size:12px;padding:0 12px 4px;color:#ffe9b0}
#hrf .tbs{display:flex;margin:0 10px;border:1px solid #a8802f;border-bottom:0;border-radius:14px 14px 0 0;background:rgba(10,10,28,.8)}
#hrf .tbs button{flex:1;font:inherit;font-size:13px;min-height:44px;border:0;background:none;color:#b9a77a;cursor:pointer;border-bottom:2px solid transparent;position:relative}
#hrf .tbs button.on{color:#ffe9b0;border-color:#ffd978}
#hrf .tbs u{position:absolute;top:6px;right:calc(50% - 30px);width:8px;height:8px;border-radius:50%;background:#e33}
#hrf .pb{flex:1;min-height:0;overflow:auto;margin:0 10px;padding:8px 10px calc(env(safe-area-inset-bottom) + 16px);font-size:12px;border:1px solid #a8802f;border-top:0;background:linear-gradient(rgba(26,18,48,.94),rgba(10,10,28,.97));-webkit-overflow-scrolling:touch}
#hrf .hint{font-size:11px;opacity:.8;margin:2px 0 8px;line-height:1.35}
#hrf .cd{margin:7px 0;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #3b4468;border-left:4px solid var(--c,#a8802f)}
#hrf .cd.lk{filter:grayscale(.85);opacity:.6}#hrf .cd.now{border-color:#ffd978;box-shadow:0 0 12px rgba(255,217,120,.25)}
#hrf .rw{display:flex;align-items:center;gap:9px}
#hrf .ic{flex:none;width:46px;height:46px;border-radius:12px;border:2px solid var(--c,#555);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);font-size:24px}
#hrf .mid{flex:1;min-width:0}#hrf .mid b{font-size:13px}#hrf .mid small{display:block;opacity:.85;margin-top:2px;font-size:11px;line-height:1.3}
#hrf .bt{font:inherit;font-size:12px;min-height:36px;padding:5px 11px;border-radius:10px;border:1px solid #a8802f;background:linear-gradient(#6b4a1c,#3d2a10);color:#ffe9b0;cursor:pointer;white-space:nowrap}
#hrf .bt.g{background:linear-gradient(#a8802f,#6b4a1c);color:#fff3d0;font-weight:700}
#hrf .bt.of{filter:grayscale(.9);opacity:.55}#hrf .bt:active{transform:scale(.96)}
#hrf .bw{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
#hrf .chip{display:inline-block;font-size:10px;padding:1px 7px;margin:2px 3px 0 0;border-radius:9px;border:1px solid #6b5326;background:rgba(0,0,0,.3)}
#hrf .bar{height:7px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:4px}#hrf .bar i{display:block;height:100%;background:linear-gradient(#ffe48f,#e3881c)}
#hrf .tr{display:flex;justify-content:space-between;gap:8px;padding:5px 2px;border-bottom:1px dashed rgba(255,255,255,.1)}
#hrf .tr.me{color:#ffd978;font-weight:700}#hrf .tr.on{color:#7dff9a}
#hrf h4{margin:12px 0 4px;font-size:13px;color:#ffd978;letter-spacing:1px}`;
  function css() { if ($('#hrf-css')) return; const s = document.createElement('style'); s.id = 'hrf-css'; s.textContent = CSS; document.head.appendChild(s) }

  /* ── đầu trang ── */
  function top() {
    const s = B.sv();
    return `<span>⚡ ${B.sta()}/${B.SM()}</span><span>🪙 ${fm(s.gold)}</span><span>⚙ ${fm(s.mt || 0)}</span><span>🔮 ${fm(s.hon || 0)}</span><span>💎 ${fm(s.gem)}</span><span>🔶 ${fm(s.rs || 0)}</span>`;
  }
  const focusTxt = (t, r) => ({ tinh: '⚙ ' + r.tinh, hon: '🔮 ' + r.hon, gold: '🪙 ' + fm(r.gold), exp: 'EXP ' + fm(r.exp), gear: '🎁 ×' + r.drops, rs: '🔶 ' + r.rs, gem: '💎 ' + r.gem }[t.focus] || '');

  /* ── Tab Bí Cảnh ── */
  function tRift() {
    const D = R(), RR = D.rules.rift, s = B.sv();
    if (sel) return floors(sel);
    let h = `<div class="hint">Mỗi Bí Cảnh có <b>${RR.floors} tầng</b>, mỗi tầng ~${RR.dur}s, Thủ Hộ xuất hiện lúc ${RR.bossAt}s. Vào tầng: ⚡${RR.stamina} · tối đa <b>${RR.daily} lượt/ngày</b> mỗi Bí Cảnh · tầng đã qua có thể <b>QUÉT</b> (⚡${RR.sweepStamina}). Quái và thưởng mạnh dần theo tầng, tầng 5 và 10 có Boss. Cấp quái theo chương cao nhất bạn đã mở (${B.chName(B.ref())}).</div>`;
    for (const t of D.types) {
      const open = B.open(t.id), best = B.best(t.id), left = B.left(t.id);
      h += `<div class="cd ${open ? '' : 'lk'}" data-a="${open ? 'sel' : 'lock'}" data-t="${t.id}" data-n="${t.need}" style="--c:${t.col};cursor:pointer"><div class="rw"><div class="ic">${t.i}</div><div class="mid"><b>${t.n}</b><small>${t.d}</small>`
        + (open ? `<small>Kỷ lục: tầng <b>${best}</b>/${RR.floors} · Lượt hôm nay: <b style="color:${left ? '#7dff9a' : '#ff8a6a'}">${left}</b>/${RR.daily}</small><div class="bar"><i style="width:${best / RR.floors * 100}%"></i></div>` : `<small>🔒 Mở khi bạn mở tới chương ${t.need + 1} (hạ Boss chương ${t.need})</small>`)
        + `</div><div style="font-size:18px;opacity:.7">›</div></div></div>`;
    }
    return h;
  }
  function floors(tid) {
    const D = R(), RR = D.rules.rift, T = D.type(tid), best = B.best(tid), left = B.left(tid), c = B.ref(), pw = B.pwr(), sta = B.sta();
    let h = `<button class="bt" data-a="back" style="margin-bottom:6px">‹ Danh sách Bí Cảnh</button><div class="cd" style="--c:${T.col}"><div class="rw"><div class="ic">${T.i}</div><div class="mid"><b>${T.n}</b><small>${T.d}</small><small>Kỷ lục tầng <b>${best}</b>/${RR.floors} · Lượt còn <b style="color:${left ? '#7dff9a' : '#ff8a6a'}">${left}</b>/${RR.daily} · ⚡ ${sta}</small></div></div></div>`;
    for (let f = 1; f <= RR.floors; f++) {
      const st = D.buildRift({ x: 'rift', r: tid, f, c }), rw = D.riftReward(tid, f, c, true, { first: f > best }), can = f <= best + 1, cleared = f <= best, bossF = D.isBossFloor(f);
      const nsw = M.max(1, M.min(RR.maxBatch, left, (sta / RR.sweepStamina) | 0));
      h += `<div class="cd ${can ? '' : 'lk'} ${f === best + 1 ? 'now' : ''}" style="--c:${bossF ? '#ff5a4a' : T.col}"><div class="rw"><div class="ic" style="font-size:16px;font-weight:700">${bossF ? '👑' : f}</div><div class="mid"><b>Tầng ${f}${bossF ? ' · BOSS' : ''} ${cleared ? '✅' : ''}</b>`
        + `<small>${st.rift.aff.length ? st.rift.aff.map(a => { const q = D.affOf(a); return `<span class="chip" title="${q.d}">${q.i} ${q.n}</span>` }).join('') : '<span class="chip">Không có luật đặc biệt</span>'}</small>`
        + `<small>⚔ LC khuyến nghị <b style="color:${pw >= st.recommendedPower ? '#7dff9a' : '#ff8a6a'}">${fm(st.recommendedPower)}</b> · Thưởng: ${focusTxt(T, rw)}${f > best ? ' · 🎉 lần đầu +💎' + (rw.gem) : ''}</small></div></div>`
        + `<div class="bw">${can ? `<button class="bt g ${left && sta >= RR.stamina ? '' : 'of'}" data-a="go" data-t="${tid}" data-f="${f}">⚔ VÀO · ⚡${RR.stamina}</button>` : '<span style="opacity:.7;font-size:11px">🔒 Qua tầng ' + (f - 1) + ' để mở</span>'}`
        + (cleared ? `<button class="bt ${left && sta >= RR.sweepStamina ? '' : 'of'}" data-a="sw" data-t="${tid}" data-f="${f}" data-n="1">QUÉT ×1</button>` + (nsw > 1 ? `<button class="bt ${left && sta >= RR.sweepStamina * nsw ? '' : 'of'}" data-a="sw" data-t="${tid}" data-f="${f}" data-n="${nsw}">QUÉT ×${nsw}</button>` : '') : '') + `</div></div>`;
    }
    return h;
  }

  /* ── Tab Thử Luyện ── */
  function tTrial() {
    const D = R(), s = B.sv(), best = s.tr.best, Rt = D.rules.trial;
    if (selT == null) { selT = 0; for (let i = 0; i < D.tiers.length; i++) if (D.tierOpen(i, best)) selT = i }
    let h = `<div class="hint">Sống sót càng lâu càng tốt — <b>không giới hạn thời gian</b>, quái mạnh dần theo từng phút, kết thúc khi bạn gục ngã (hoặc <b>Rút lui</b> trong menu tạm dừng vẫn nhận thưởng). Mỗi lần lên cấp bạn rút <b>thẻ nâng cấp % ngẫu nhiên</b> riêng của chế độ này. Vào: ⚡${Rt.stamina}.</div>`;
    D.tiers.forEach((T, i) => {
      const open = D.tierOpen(i, best), b = best[i] | 0;
      h += `<div class="cd ${open ? '' : 'lk'} ${selT === i ? 'now' : ''}" style="--c:${T.col}" data-a="${open ? 'tsel' : 'tlock'}" data-i="${i}"><div class="rw"><div class="ic">${T.i}</div><div class="mid"><b>Cấp ${T.n}</b><small>Quái HP ×${T.hp} · ST ×${T.dmg} · Thưởng ×${T.rw}</small><small>${open ? '🏆 Kỷ lục: <b>' + B.fmt(b) + '</b>' : '🔒 Sống ≥ ' + B.fmt(Rt.unlockBest[i]) + ' ở cấp ' + D.tiers[i - 1].n}</small></div>${open ? `<button class="bt g ${B.sta() >= Rt.stamina ? '' : 'of'}" data-a="trial" data-i="${i}">VÀO ⚡${Rt.stamina}</button>` : ''}</div></div>`;
    });
    const b = best[selT] | 0;
    h += `<h4>🌟 MỐC THƯỞNG LẦN ĐẦU · CẤP ${D.tiers[selT].n.toUpperCase()}</h4>` + D.mile.map(([sec, gem]) => `<div class="tr ${b >= sec ? 'on' : ''}"><span>${b >= sec ? '✔' : '○'} Sống sót ${B.fmt(sec)}</span><b>💎 ${M.round(gem * D.tiers[selT].rw)}</b></div>`).join('');
    h += `<h4>🎲 BẢNG NÂNG CẤP % NGẪU NHIÊN</h4><div class="hint">Mỗi lần lên cấp: thẻ võ công xen lẫn thẻ %. Độ hiếm: ${D.pct.def.rar.map(r => `<span style="color:${r.c}">${r.n}</span>`).join(' · ')} (lên cấp cao dễ ra hiếm hơn).</div>`
      + D.pct.def.stats.map(t => `<div class="tr"><span>${t.i} ${t.n}</span><small>+${t.fine ? (t.v[0] * 100).toFixed(1) : t.v[0] * 100}% … +${t.fine ? (t.v[3] * 100).toFixed(1) : t.v[3] * 100}%${t.fine ? '/s' : ''}</small></div>`).join('');
    return h;
  }

  /* ── Tab Boss Thế Giới ── */
  function tBoss() {
    const D = R(), W = D.wboss, s = B.sv(), r = B.wbToday(), rk = W.rankOf(r.td, s.un), rkAll = W.rankOf((s.ev.wb || {}).b | 0, s.un), nx = W.rankNext(r.td, s.un);
    let h = `<div class="cd" style="--c:#ff4a4a"><div class="rw"><div class="ic">🐲</div><div class="mid"><b>HẮC LONG · BOSS THẾ GIỚI</b><small>${D.rules.wboss.tl}s để gây nhiều sát thương nhất · ⚡${D.rules.wboss.stamina}/lượt · Boss mạnh theo chương bạn đã mở</small>`
      + `<small>Hôm nay: <b>${r.n}</b> lượt · tốt nhất <b>${fm(r.td)}</b> · Kỷ lục: <b>${fm((s.ev.wb || {}).b | 0)}</b> (${W.ranks[rkAll].i} ${W.ranks[rkAll].n})</small></div></div><div class="bw"><button class="bt g ${B.sta() >= D.rules.wboss.stamina ? '' : 'of'}" data-a="wb">⚔ ĐÁNH BOSS · ⚡${D.rules.wboss.stamina}</button></div></div>`;
    h += `<h4>🔥 3 GIAI ĐOẠN</h4>` + W.phases.map((p, i) => `<div class="tr"><span style="color:${p.c}">GĐ${i + 1} · ${p.n}</span><small>${B.fmt(D.rules.wboss.phaseAt[i])}+</small></div>`).join('')
      + `<div class="hint" style="margin-top:6px">GĐ1: đạn tỏa + vòng đạn · GĐ2: <b>vùng nguy hiểm</b> (vòng đỏ rơi xuống, đập đất) + triệu hồi · GĐ3: đạn xoắn, lao tới, mưa vùng đỏ dày, cuồng nộ. Đứng yên là chết — né vòng đỏ để đánh lâu hơn.</div>`;
    h += `<h4>🏅 HẠNG HÔM NAY: ${W.ranks[rk].i} ${W.ranks[rk].n}</h4>`;
    if (nx) h += `<div class="hint">Còn <b>${fm(nx.need)}</b> sát thương để lên ${W.ranks[nx.r].i} ${W.ranks[nx.r].n}.</div>`;
    const can = r.n > 0 && !r.c;
    h += `<button class="bt g ${can ? '' : 'of'}" data-a="claim" style="width:100%">${r.c ? '✔ Đã nhận thưởng hạng hôm nay' : r.n ? 'NHẬN THƯỞNG HẠNG ' + W.ranks[rk].n.toUpperCase() : 'Đánh Boss để nhận thưởng hạng'}</button>`;
    h += W.ranks.map((x, i) => { const w = x.rw; return `<div class="tr ${i === rk && r.n ? 'me' : ''}"><span>${x.i} ${x.n} · ≥${fm(W.rankMin(i, s.un))}</span><small>🪙${fm(w.g)}${w.m ? ' 💎' + w.m : ''}${w.t ? ' ⚙' + w.t : ''}${w.rs ? ' 🔶' + w.rs : ''}</small></div>` }).join('');
    h += `<h4>🏆 BẢNG XẾP HẠNG</h4>` + B.board().slice(0, 10).map((x, i) => `<div class="tr ${x.me ? 'me' : ''}"><span>${i + 1}. ${x.n}</span><b>${fm(x.v)}</b></div>`).join('') + `<div class="hint" style="margin-top:4px">Bảng xếp hạng là mô phỏng cục bộ (chưa có máy chủ).</div>`;
    return h;
  }

  /* ── khung ── */
  const TABS = [['rift', '🌀 Bí Cảnh'], ['trial', '⚔ Thử Luyện'], ['boss', '🐲 Boss']];
  function tabDot(t) { const s = B.sv(), D = R(); if (t === 'rift') return D.types.some(x => B.open(x.id) && B.used(x.id) === 0); if (t === 'boss') { const r = B.wbToday(); return r.n > 0 && !r.c } return false }
  function render() {
    if (!root) return; const pb = $('.pb', root), keep = pb ? pb.scrollTop : 0;
    $('.rs', root).innerHTML = top();
    root.querySelectorAll('.tbs button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); const u = b.querySelector('u'); if (u) u.style.display = tabDot(b.dataset.t) ? '' : 'none' });
    $('.pb', root).innerHTML = tab === 'rift' ? tRift() : tab === 'trial' ? tTrial() : tBoss();
    $('.pb', root).scrollTop = keep;
  }
  function act(a, d) {
    const D = R();
    switch (a) {
      case 'tab': tab = d.t; sel = null; render(); $('.pb', root).scrollTop = 0; return;
      case 'sel': sel = d.t; $('.pb', root).scrollTop = 0; return render();
      case 'back': sel = null; return render();
      case 'lock': return B.toast('🔒 Mở khi bạn mở tới chương ' + ((+d.n) + 1));
      case 'go': { if (!B.left(d.t)) return B.toast('🌀 Hết lượt Bí Cảnh hôm nay'); if (B.go(d.t, +d.f)) close(); return render() }
      case 'sw': return B.sweep(d.t, +d.f, +d.n);
      case 'tsel': selT = +d.i; return render();
      case 'tlock': return B.toast('🔒 Sống ≥ ' + B.fmt(D.rules.trial.unlockBest[+d.i]) + ' ở cấp ' + D.tiers[+d.i - 1].n);
      case 'trial': { if (B.trial(+d.i)) close(); return render() }
      case 'wb': { if (B.sta() < D.rules.wboss.stamina) return B.toast('⚡ Không đủ thể lực (cần ' + D.rules.wboss.stamina + ')'); close(); return B.wbGo() }
      case 'claim': B.wbClaim(); return render();
    }
  }
  function close() { if (root) { root.remove(); root = null } B && B.home && B.home() }
  function open(t) {
    if (!B || !R()) return false; css(); if (root) root.remove(); tab = t || 'rift'; sel = null; selT = null;
    root = document.createElement('div'); root.id = 'hrf';
    root.innerHTML = `<div class="tb"><button class="rb" data-a="x">‹</button><b>BÍ CẢNH · THỬ LUYỆN</b><span style="min-width:42px"></span></div><div class="rs"></div><div class="tbs">${TABS.map(x => `<button data-a="tab" data-t="${x[0]}">${x[1]}<u style="display:none"></u></button>`).join('')}</div><div class="pb"></div>`;
    root.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el) return; if (el.dataset.a === 'x') return close(); act(el.dataset.a, el.dataset) });
    $('#app').appendChild(root); render(); return true;
  }

  /* ── thẻ nâng cấp % trong ván Thử Luyện ── */
  function mixPool(pool, G) {
    const D = R(), ev = pool.filter(k => k.startsWith('evo:')), pl = pool.filter(k => k !== 'heal' && !k.startsWith('evo:')), out = ev.slice(0, 1);
    if (pl.length) out.push(pl[0]); if (pl.length > 1 && out.length < 2 && Math.random() < .4) out.push(pl[1]);
    for (const k of D.pct.roll(Math.random, G.p.lv, 3)) { if (out.length >= 3) break; out.push(k) }
    return out;
  }
  function cardHtml(k, i) {
    const D = R(), [, sk, r0] = k.split(':'), r = +r0 | 0, st = D.pct.stat(sk), ra = D.pct.def.rar[r], n = (window.__dvG && 0) || 0;
    return `<button class="card" style="--c:${ra.c};--i:${i}" data-k="${k}"><div class="ic">${st.i}</div><div class="n">${st.n}</div><div class="l">${D.pct.text(sk, r)}</div><div class="d">${st.d}<br>🎲 Thẻ % của Thử Luyện</div><div class="r">${ra.n}</div></button>`;
  }
  /* chấm đỏ nút Bí cảnh: còn Bí Cảnh đã mở chưa vào hôm nay, hoặc có thưởng hạng Boss chưa nhận */
  function badge() { try { if (!B || !R()) return 0; const r = B.wbToday(); return R().types.filter(t => B.open(t.id) && B.used(t.id) === 0).length + (r.n > 0 && !r.c ? 1 : 0) } catch (e) { return 0 } }
  window.DV_RIFT = { bind(b) { B = b }, open, close: () => { if (root) { root.remove(); root = null } }, refresh() { if (root) render() }, badge, mixPool, cardHtml };
})();
