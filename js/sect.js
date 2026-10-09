/* DV_SECT — Giao diện Phase 12 · Part 6: MÔN PHÁI + CẢNH GIỚI (10 bậc). Số liệu: DV_DATA.sect (data/sect.js).
   Mọi thao tác trạng thái đi qua B (SCB do index.html cung cấp: sv, put, sfx, toast, home, dk, qd, heroes, pw, hn, spend, cgBreak, ctx).
   DV_SECT.bind(B) · open(tab:'sect'|'skill'|'realm', heroId?) · close() · refresh() · badge() */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), M = Math;
  let B = null, root = null, tab = 'sect', hid = null;
  const X = () => window.DV_DATA && DV_DATA.sect;
  const fm = n => (n | 0).toLocaleString('vi');
  const TABS = [['sect', '🏯 Môn Phái'], ['skill', '📜 Tuyệt Học'], ['realm', '☁ Cảnh Giới']];
  const CSS = `
#hsc{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;overflow:hidden;color:#f3e3b8;background:radial-gradient(ellipse at 50% 0,#33224f 0,#0b1020 70%);animation:si .25s both}
#hsc .tb{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 8px) 12px 4px}
#hsc .tb b{flex:1;text-align:center;font-size:16px;letter-spacing:2px;color:#ffe9b0;text-shadow:0 2px 6px #000}
#hsc .rb{font:inherit;min-width:42px;min-height:42px;border-radius:12px;border:1px solid #a8802f;background:rgba(10,10,28,.85);color:#f3e3b8;font-size:14px;cursor:pointer;padding:0 10px}
#hsc .rs{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;font-size:12px;padding:0 12px 4px;color:#ffe9b0}
#hsc .tbs{display:flex;margin:0 10px;border:1px solid #a8802f;border-bottom:0;border-radius:14px 14px 0 0;background:rgba(10,10,28,.8)}
#hsc .tbs button{flex:1;font:inherit;font-size:13px;min-height:44px;border:0;background:none;color:#b9a77a;cursor:pointer;border-bottom:2px solid transparent;position:relative}
#hsc .tbs button.on{color:#ffe9b0;border-color:#ffd978}
#hsc .tbs u{position:absolute;top:6px;right:calc(50% - 40px);width:8px;height:8px;border-radius:50%;background:#e33}
#hsc .pb{flex:1;min-height:0;overflow:auto;margin:0 10px;padding:8px 10px calc(env(safe-area-inset-bottom) + 16px);font-size:12px;border:1px solid #a8802f;border-top:0;background:linear-gradient(rgba(26,18,48,.94),rgba(10,10,28,.97));-webkit-overflow-scrolling:touch}
#hsc .hint{font-size:11px;opacity:.8;margin:2px 0 8px;line-height:1.35}
#hsc .cd{margin:7px 0;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #3b4468;border-left:4px solid var(--c,#a8802f)}
#hsc .cd.lk{filter:grayscale(.85);opacity:.6}#hsc .cd.now{border-color:#ffd978;box-shadow:0 0 12px rgba(255,217,120,.25)}#hsc .cd.ok{border-color:#4fa86a}
#hsc .rw{display:flex;align-items:center;gap:9px}
#hsc .ic{flex:none;width:46px;height:46px;border-radius:12px;border:2px solid var(--c,#555);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);font-size:24px}
#hsc .ic.sm{width:34px;height:34px;font-size:18px;border-radius:9px}
#hsc .mid{flex:1;min-width:0}#hsc .mid b{font-size:13px}#hsc .mid small{display:block;opacity:.85;margin-top:2px;font-size:11px;line-height:1.3}
#hsc .bt{font:inherit;font-size:12px;min-height:36px;padding:5px 11px;border-radius:10px;border:1px solid #a8802f;background:linear-gradient(#6b4a1c,#3d2a10);color:#ffe9b0;cursor:pointer;white-space:nowrap}
#hsc .bt.g{background:linear-gradient(#a8802f,#6b4a1c);color:#fff3d0;font-weight:700}
#hsc .bt.of{filter:grayscale(.9);opacity:.55}#hsc .bt:active{transform:scale(.96)}
#hsc .bt.wide{width:100%;min-height:44px;font-size:14px;margin-top:8px}
#hsc .bw{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
#hsc .chip{display:inline-block;font-size:10px;padding:1px 7px;margin:2px 3px 0 0;border-radius:9px;border:1px solid #6b5326;background:rgba(0,0,0,.3)}
#hsc .chip.r{border-color:#3d7a8f;color:#9fe8ff}#hsc .chip.g{border-color:#4fa86a;color:#9dffb4}
#hsc .bar{height:7px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:4px}#hsc .bar i{display:block;height:100%;background:linear-gradient(#ffe48f,#e3881c)}
#hsc .hs{display:flex;align-items:center;gap:8px;margin-bottom:6px}#hsc .hs .cd{flex:1;margin:0}
#hsc h4{margin:12px 0 4px;font-size:13px;color:#ffd978;letter-spacing:1px}
#hsc .rq{display:flex;justify-content:space-between;padding:3px 2px;border-bottom:1px dashed rgba(255,255,255,.1)}#hsc .rq.y{color:#7dff9a}#hsc .rq.n{color:#ff8a6a}
#hsc .lad{display:flex;align-items:center;gap:8px;padding:6px 6px;margin:3px 0;border-radius:10px;border:1px solid #2c3354;background:rgba(255,255,255,.03)}
#hsc .lad.done{border-color:#4fa86a;background:rgba(79,168,106,.08)}#hsc .lad.nxt{border-color:#ffd978}#hsc .lad.lk{opacity:.5}
#hsc .fl{position:absolute;inset:0;z-index:9;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(255,236,160,.55),rgba(10,10,28,.85));pointer-events:none;animation:scFl 1.7s both}
#hsc .fl b{font-size:30px;letter-spacing:4px;color:#fff3c4;text-shadow:0 0 18px var(--c,#ffd978),0 3px 8px #000}#hsc .fl span{font-size:60px}
@keyframes scFl{0%{opacity:0;transform:scale(.7)}18%{opacity:1;transform:scale(1.08)}80%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){#hsc .fl{animation:none}}`;
  function css() { if ($('#hsc-css')) return; const s = document.createElement('style'); s.id = 'hsc-css'; s.textContent = CSS; document.head.appendChild(s) }

  /* ── trạng thái ── */
  const SC = () => B.sv().sc;
  const P = id => { const sc = SC(); return sc.p[id] || (sc.p[id] = { t: 0, c: 0, l: {} }) };
  /** Trạng thái trong ngày (không ghi) */
  function dv() { const sc = SC(), fresh = sc.d !== B.dk(); return { ci: fresh ? 0 : sc.ci, cl: fresh ? {} : sc.cl, dn: fresh ? 0 : sc.dn } }
  function day() { const sc = SC(); if (sc.d !== B.dk()) { sc.d = B.dk(); sc.ci = 0; sc.cl = {}; sc.dn = 0 } return sc }
  function give(n) { const sc = SC(), p = P(sc.id), l0 = X().level(p.t); p.t += n; p.c += n; const l1 = X().level(p.t); if (l1 > l0) B.toast('🏯 Môn phái lên cấp ' + l1 + '!'); }
  const chips = (e, c) => X().fmt(e).split(', ').filter(Boolean).map(t => `<span class="chip ${c || ''}">${t}</span>`).join('');
  const top = () => { const s = B.sv(); return `<span>🪙 ${fm(s.gold)}</span><span>⚙ ${fm(s.mt || 0)}</span><span>🔮 ${fm(s.hon || 0)}</span><span>💎 ${fm(s.gem)}</span>` };

  /* ── Tab Môn Phái ── */
  function tSect() {
    const D = X(), R = D.rules, s = B.sv(), sc = SC();
    if ((s.un | 0) < R.joinUn) return `<div class="cd lk"><div class="rw"><div class="ic">🔒</div><div class="mid"><b>Môn phái chưa mở</b><small>Mở khi bạn mở tới chương ${R.joinUn + 1} (hạ Boss chương ${R.joinUn}).</small></div></div></div>`;
    const cur = sc.id ? D.sect(sc.id) : null;
    let h = '';
    if (!cur) {
      h += `<div class="hint">Chọn <b>một môn phái</b> để gia nhập (miễn phí lần đầu). Mỗi phái cộng chỉ số cho <b>mọi tướng</b>; tướng <b>hợp phái</b> được ×${R.aff}. Tích <b>Cống Hiến</b> để lên cấp phái và học 4 Tuyệt Học. Tiến độ mỗi phái được <b>giữ riêng</b> khi đổi phái.</div>`;
      for (const S of D.sects) h += sectCard(S, 'join', 'GIA NHẬP');
      return h;
    }
    const p = P(cur.id), lp = D.lvProg(p.t), d = dv(), hero = B.sv().hs, bon = D.sectBonus(sc, hero), aff = D.isAff(cur.id, hero);
    h += `<div class="cd now" style="--c:${cur.col}"><div class="rw"><div class="ic" style="font-size:28px">${cur.i}</div><div class="mid"><b style="font-size:15px">${cur.n}</b><small>${cur.d}</small><small>Cấp phái <b style="color:#ffd978">${lp.l}</b>/10 · Cống Hiến hiện có: <b style="color:#7dff9a">${fm(p.c)}</b> · Tổng ${fm(p.t)}</small></div></div>`
      + `<div class="bar"><i style="width:${lp.pct}%"></i></div><small style="opacity:.8">${lp.max ? 'Đã đạt cấp tối đa' : `Còn ${fm(lp.need - lp.cur)} Cống Hiến để lên cấp ${lp.l + 1}`}</small>`
      + `<div style="margin-top:6px"><b style="font-size:11px">Thưởng cho ${B.hn(hero)}${aff ? ' <span style="color:#7dff9a">(hợp phái ×' + R.aff + ')</span>' : ''}:</b><br>${chips(bon) || '<span class="chip">Chưa có</span>'}</div>`
      + (cur.aff.length ? `<small>Tướng hợp phái: ${cur.aff.map(B.hn).join(', ')}</small>` : `<small>Phái hỗ trợ — không có tướng hợp phái riêng.</small>`) + `</div>`;
    h += `<h4>NHIỆM VỤ NGÀY</h4>`;
    h += `<div class="cd ${d.ci ? 'ok' : ''}"><div class="rw"><div class="ic sm">🙏</div><div class="mid"><b>Điểm danh môn phái</b><small>+${R.checkin} Cống Hiến mỗi ngày</small></div><button class="bt ${d.ci ? 'of' : 'g'}" data-a="ci">${d.ci ? '✔ Đã nhận' : 'NHẬN'}</button></div></div>`;
    const qd = B.qd();
    R.tasks.forEach((t, i) => {
      const v = M.min(qd[t.k] | 0, t.n), done = v >= t.n, got = d.cl[i];
      h += `<div class="cd ${got ? 'ok' : ''}"><div class="rw"><div class="ic sm">${['⚔', '🏆', '👹'][i] || '📜'}</div><div class="mid"><b>${t.t}</b><small>${v}/${t.n} · +${t.ch} Cống Hiến</small><div class="bar"><i style="width:${v / t.n * 100}%"></i></div></div><button class="bt ${got ? 'of' : done ? 'g' : 'of'}" data-a="tk" data-i="${i}">${got ? '✔ Đã nhận' : done ? 'NHẬN' : 'Chưa xong'}</button></div></div>`;
    });
    const left = R.donate.max - d.dn;
    h += `<div class="cd"><div class="rw"><div class="ic sm">🪙</div><div class="mid"><b>Quyên góp</b><small>${fm(R.donate.g)} 🪙 → +${R.donate.ch} Cống Hiến · còn <b style="color:${left ? '#7dff9a' : '#ff8a6a'}">${left}</b>/${R.donate.max} lượt hôm nay</small></div><button class="bt ${left && s.gold >= R.donate.g ? 'g' : 'of'}" data-a="dn">GÓP</button></div></div>`;
    h += `<h4>ĐỔI MÔN PHÁI</h4><div class="hint">Đổi phái tốn 💎${R.switchGem}. Cống Hiến và Tuyệt Học của phái cũ được giữ nguyên, quay lại không mất gì.</div>`;
    for (const S of D.sects) if (S.id !== cur.id) h += sectCard(S, 'join', '💎 ' + R.switchGem + ' · ĐỔI');
    return h;
  }
  function sectCard(S, a, label) {
    const D = X(), p = (SC().p || {})[S.id], lv = p ? D.level(p.t) : 0;
    return `<div class="cd" style="--c:${S.col}"><div class="rw"><div class="ic">${S.i}</div><div class="mid"><b>${S.n}</b><small>${S.d}</small><small>Sở trường: ${S.f}${S.aff.length ? ' · Hợp: ' + S.aff.map(B.hn).join(', ') : ''}</small>${p ? `<small>Đã tu: cấp ${lv} · ${fm(p.t)} Cống Hiến</small>` : ''}</div><button class="bt g" data-a="${a}" data-id="${S.id}">${label}</button></div></div>`;
  }

  /* ── Tab Tuyệt Học ── */
  function tSkill() {
    const D = X(), sc = SC();
    if (!sc.id) return `<div class="cd lk"><div class="rw"><div class="ic">📜</div><div class="mid"><b>Chưa có môn phái</b><small>Gia nhập một môn phái ở tab 🏯 để học Tuyệt Học.</small></div></div></div><button class="bt g wide" data-a="tab" data-t="sect">Đi chọn môn phái</button>`;
    const S = D.sect(sc.id), p = P(S.id), lp = D.lvProg(p.t);
    let h = `<div class="hint"><b>${S.i} ${S.n}</b> · Cấp ${lp.l} · Cống Hiến: <b style="color:#7dff9a">${fm(p.c)}</b>. Học <b>tuần tự</b> từng tầng. Hiệu ứng "trong ván" chỉ có tác dụng khi chiến đấu.</div>`;
    S.sk.forEach((k, j) => {
      const learned = p.l[j], cl = D.canLearn(SC(), j);
      h += `<div class="cd ${learned ? 'ok' : ''}" style="--c:${S.col}"><div class="rw"><div class="ic sm">${['①', '②', '③', '④'][j]}</div><div class="mid"><b>${k.n}</b><small>${k.d}</small>${learned ? '' : `<small>Cần phái cấp <b>${k.lv}</b> · ${fm(k.c)} Cống Hiến</small>`}</div>`
        + `<button class="bt ${learned ? 'of' : cl.ok ? 'g' : 'of'}" data-a="${cl.ok ? 'lr' : 'nl'}" data-j="${j}" data-w="${cl.why}">${learned ? '✔ Đã học' : cl.ok ? 'HỌC' : 'Khoá'}</button></div></div>`;
    });
    const run = D.sectRun(sc), hasRun = Object.keys(run).length;
    h += `<h4>HIỆU ỨNG TRONG VÁN (phái)</h4><div>${hasRun ? chips({ rgn: run.rgn, xg: run.xg, mg: run.mg, ec: run.ec, dr: run.dr }, 'r') : '<span class="chip">Chưa có</span>'}</div>`;
    return h;
  }

  /* ── Tab Cảnh Giới ── */
  function tRealm() {
    const D = X(), hs = B.heroes();
    if (!hs.length) return `<div class="cd lk"><div class="mid"><b>Chưa có tướng</b></div></div>`;
    if (!hs.some(x => x.id === hid)) hid = hs.some(x => x.id === B.sv().hs) ? B.sv().hs : hs[0].id;
    const H = hs.find(x => x.id === hid), idx = hs.indexOf(H), st = H.cg, R = D.realm(st), ck = D.breakCheck(st, B.ctx(hid)), bn = D.realmBonus(st), rn = D.realmRun(st);
    let h = `<div class="hs"><button class="rb" data-a="hp">‹</button><div class="cd" style="--c:${H.qc}"><div class="rw"><div class="ic sm">${H.i}</div><div class="mid"><b>${H.n}</b> <span style="color:${H.qc}">[${H.q}]</span><small>Lv.${H.l}/${H.cap} · ⚔ LC ${fm(H.pw)} · ${idx + 1}/${hs.length}</small></div></div></div><button class="rb" data-a="hn">›</button></div>`;
    h += `<div class="cd now" style="--c:${R.col}"><div class="rw"><div class="ic" style="font-size:28px">${R.i}</div><div class="mid"><b style="font-size:15px;color:${R.col}">${R.n}</b><small>Bậc ${st}/${D.MAXR} · ${R.d}</small></div></div>`
      + `<div style="margin-top:6px">${chips(bn) || '<span class="chip">Chưa có thưởng cảnh giới</span>'}${Object.keys(rn).length ? chips({ rgn: rn.rgn, xg: rn.xg, mg: rn.mg, ec: rn.ec, dr: rn.dr }, 'r') : ''}</div></div>`;
    if (ck.max) h += `<div class="cd ok"><div class="mid"><b>👑 Đã đạt Độ Kiếp — cảnh giới tối cao</b><small>Tướng này đã đạt đỉnh tu luyện.</small></div></div>`;
    else {
      const N = ck.next, f = ck.flags, c = N.c;
      const rq = (ok, t, v) => `<div class="rq ${ok ? 'y' : 'n'}"><span>${ok ? '✔' : '✖'} ${t}</span><b>${v}</b></div>`;
      h += `<h4>ĐỘT PHÁ → ${N.i} ${N.n}</h4><div class="cd" style="--c:${N.col}"><small style="margin-bottom:4px;display:block">${N.d}</small>`
        + `<div>${chips(N.e, 'g')}${N.r ? chips(N.r, 'r') : ''}</div><div style="margin-top:6px">`
        + rq(f.lv, 'Cấp tướng', `${H.l}/${N.lv}`) + rq(f.un, 'Mở chương', `${M.min(B.sv().un | 0, N.un) + 1}/${N.un + 1}`)
        + rq(f.g, '🪙 Vàng', `${fm(B.sv().gold)}/${fm(c.g)}`) + rq(f.t, '⚙ Tinh thiết', `${fm(B.sv().mt || 0)}/${fm(c.t)}`) + (c.h ? rq(f.h, '🔮 Hồn tướng', `${fm(B.sv().hon || 0)}/${fm(c.h)}`) : '')
        + `</div><button class="bt ${ck.ok ? 'g' : 'of'} wide" data-a="bk">${ck.ok ? '✨ ĐỘT PHÁ' : 'Chưa đủ điều kiện'}</button></div>`;
    }
    h += `<h4>THANG CẢNH GIỚI</h4>`;
    D.realms.forEach((r, i) => {
      const cls = i <= st ? 'done' : i === st + 1 ? 'nxt' : 'lk';
      h += `<div class="lad ${cls}" style="--c:${r.col}"><div class="ic sm">${r.i}</div><div class="mid"><b style="color:${r.col}">${r.n}</b>${r.big ? ' <span class="chip">đại cảnh giới</span>' : ''}<small>${i ? D.fmt(r.e) + (r.r ? ' · ' + D.fmt(r.r) : '') + ' · Cấp ' + r.lv : 'Khởi điểm'}</small></div><span>${i <= st ? '✔' : i === st + 1 ? '▶' : '🔒'}</span></div>`;
    });
    return h;
  }

  /* ── dựng + sự kiện ── */
  function render() {
    if (!root) return; const D = X();
    $('.rs', root).innerHTML = top();
    root.querySelectorAll('.tbs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const dots = { sect: false, skill: false, realm: false };
    try {
      const sc = SC(), d = dv(); if (!sc.id) dots.sect = (B.sv().un | 0) >= D.rules.joinUn; else { dots.sect = !d.ci || D.rules.tasks.some((t, i) => !d.cl[i] && (B.qd()[t.k] | 0) >= t.n); dots.skill = D.sect(sc.id).sk.some((k, j) => D.canLearn(sc, j).ok) }
      dots.realm = B.heroes().some(x => D.breakCheck(x.cg, B.ctx(x.id)).ok);
    } catch (e) { }
    root.querySelectorAll('.tbs button').forEach(b => { b.querySelector('u').style.display = dots[b.dataset.t] ? 'block' : 'none' });
    const pb = $('.pb', root), sy = pb.scrollTop;
    pb.innerHTML = tab === 'sect' ? tSect() : tab === 'skill' ? tSkill() : tRealm();
    pb.scrollTop = sy;
  }
  function flash(R) {
    const f = document.createElement('div'); f.className = 'fl'; f.style.setProperty('--c', R.col); f.innerHTML = `<span>${R.i}</span><b>ĐỘT PHÁ!</b><b style="font-size:20px;margin-top:6px">${R.n}</b>`; root.appendChild(f); setTimeout(() => f.remove(), 1750);
  }
  function act(a, d) {
    const D = X(), R = D.rules, s = B.sv();
    switch (a) {
      case 'tab': tab = d.t; render(); $('.pb', root).scrollTop = 0; return;
      case 'join': {
        if ((s.un | 0) < R.joinUn) return B.toast('🔒 Chưa mở môn phái');
        const sc = SC(); if (sc.id === d.id) return;
        if (sc.id) { if (s.gem < R.switchGem) return B.toast('Thiếu 💎 Kim cương (cần ' + R.switchGem + ')'); s.gem -= R.switchGem }
        sc.id = d.id; sc.sw = (sc.sw | 0) + 1; P(d.id); B.put(); B.sfx('win'); B.toast('🏯 Đã gia nhập ' + D.sect(d.id).n); return render();
      }
      case 'ci': { const sc = day(); if (sc.ci) return; sc.ci = 1; give(R.checkin); B.put(); B.sfx('u'); return render() }
      case 'tk': { const sc = day(), i = +d.i, t = R.tasks[i]; if (!t || sc.cl[i] || (B.qd()[t.k] | 0) < t.n) return; sc.cl[i] = 1; give(t.ch); B.put(); B.sfx('u'); return render() }
      case 'dn': { const sc = day(); if (sc.dn >= R.donate.max) return B.toast('Hôm nay đã quyên góp tối đa'); if (s.gold < R.donate.g) return B.toast('Thiếu 🪙 Vàng'); B.spend(R.donate.g); sc.dn++; give(R.donate.ch); B.put(); B.sfx('u'); return render() }
      case 'nl': return B.toast(d.w || 'Chưa đủ điều kiện');
      case 'lr': { const sc = SC(), j = +d.j, cl = D.canLearn(sc, j); if (!cl.ok) return B.toast(cl.why); const S = D.sect(sc.id), p = P(S.id); p.c -= S.sk[j].c; p.l[j] = 1; B.put(); B.sfx('win'); B.toast('📜 Đã học ' + S.sk[j].n); return render() }
      case 'hp': case 'hn': { const hs = B.heroes(), i = hs.findIndex(x => x.id === hid); hid = hs[(i + (a === 'hn' ? 1 : hs.length - 1)) % hs.length].id; return render() }
      case 'bk': {
        const r0 = B.pw(hid), res = B.cgBreak(hid);
        if (!res.ok) return B.toast('Chưa đủ: ' + res.miss.join(' · '));
        flash(res.next); const r1 = B.pw(hid); B.toast(`${res.next.i} ${res.next.n} · ⚔ LC +${fm(r1 - r0)}`); return render();
      }
    }
  }
  function close() { if (root) { root.remove(); root = null } B && B.home && B.home() }
  function open(t, id) {
    if (!B || !X()) return false; css(); if (root) root.remove(); tab = t || 'sect'; hid = id || null;
    root = document.createElement('div'); root.id = 'hsc';
    root.innerHTML = `<div class="tb"><button class="rb" data-a="x">‹</button><b>MÔN PHÁI · CẢNH GIỚI</b><span style="min-width:42px"></span></div><div class="rs"></div><div class="tbs">${TABS.map(x => `<button data-a="tab" data-t="${x[0]}">${x[1]}<u style="display:none"></u></button>`).join('')}</div><div class="pb"></div>`;
    root.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el) return; if (el.dataset.a === 'x') return close(); act(el.dataset.a, el.dataset) });
    $('#app').appendChild(root); render(); return true;
  }
  /* chấm đỏ nút Môn phái: có thể gia nhập / nhận điểm danh / nhiệm vụ / học Tuyệt Học / đột phá được */
  function badge() {
    try {
      const D = X(); if (!B || !D) return 0; const s = B.sv(), sc = s.sc, d = dv(); let n = 0;
      if (!sc.id) { if ((s.un | 0) >= D.rules.joinUn) n++ }
      else { if (!d.ci) n++; D.rules.tasks.forEach((t, i) => { if (!d.cl[i] && (B.qd()[t.k] | 0) >= t.n) n++ }); D.sect(sc.id).sk.forEach((k, j) => { if (D.canLearn(sc, j).ok) n++ }) }
      if (B.heroes().some(h => D.breakCheck(h.cg, B.ctx(h.id)).ok)) n++;
      return n;
    } catch (e) { return 0 }
  }
  window.DV_SECT = { bind(b) { B = b }, open, close: () => { if (root) { root.remove(); root = null } }, refresh() { if (root) render() }, badge };
})();
