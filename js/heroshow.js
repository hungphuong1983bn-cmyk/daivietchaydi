/* DV_SHOW — Hero Showcase trên Main Menu.
   MỘT nguồn dữ liệu duy nhất: sv.hs → HEROES → DV_CHAR (hình, animation, Thức Tỉnh/Thăng Giai) → trang bị đang mặc (sv.eqp/inv) → bon() (chỉ số thật dùng trong trận).
   Không có artwork cố định. Mọi thay đổi dữ liệu (sau ván, triệu hồi, Hồ sơ, đổi tướng, đổi trang bị, học võ) được nhận bằng cách so sánh ảnh chụp dữ liệu
   → tự phát hiệu ứng tương ứng (hoãn tới khi lớp phủ/modal đóng để người chơi thật sự nhìn thấy).
   API: DV_SHOW.bind({sv,HEROES,HQ,hexp,cap,hxUp,put,sfx,toast,home,pwr,bon,vh:{books,learn}}) · DV_SHOW.unlock(ids,done) · DV_SHOW.thumbs(root) · DV_SHOW.cur() */
(function () {
'use strict';
const M = Math, TAU = M.PI * 2, R = Math.random, $ = (s, r = document) => r.querySelector(s), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => M.max(a, M.min(b, v)), ease = t => 1 - (1 - t) * (1 - t) * (1 - t);
const QC = { C: '#8aa0a8', B: '#35c46a', A: '#3a8dff', S: '#a64bff', SS: '#ff9a2e', SSR: '#ff4a6a' }, QI = { C: 0, B: 1, A: 2, S: 3, SS: 4, SSR: 5 };
const GC = { 0: '#35c46a', 1: '#3a8dff', 2: '#a64bff', 3: '#ffb62e' }, EQC = { 1: '#3a8dff', 2: '#a64bff', 3: '#ffb62e' }, EQN = { 0: 'Thường', 1: 'Hiếm', 2: 'Sử Thi', 3: 'Huyền Thoại' };
const SLOTS = [['w', '🗡️'], ['a', '🥋'], ['h', '💎'], ['b', '🏹'], ['n', '🧤'], ['f', '👢'], ['r', '💍']];
const LINES = {
  dbl: ['Kiếm này, ta giữ cho non sông!', 'Vạn Thắng Vương không lùi bước.', 'Phong khởi — xuất kiếm!'],
  lh: ['Đao khí của ta, quân giặc nào đỡ nổi?', 'Thập đạo tướng quân sẵn sàng!', 'Lửa chiến đã bùng cháy.'],
  nq: ['Cọc nhọn Bạch Đằng đang chờ giặc.', 'Thủy triều lên rồi!', 'Nhanh như sóng, lạnh như băng.'],
  thd: ['Hịch tướng sĩ — nghe lệnh ta!', 'Sấm sét là quân lệnh của ta.', 'Dù trăm trận, đánh trăm lần thắng.'],
  dl: ['Tên của ta không bao giờ trượt!', 'Rừng này ta thuộc như lòng bàn tay.', 'Đừng coi thường tân binh nha!'],
  nb: ['Khiên ta vững như thành đồng.', 'Ai muốn qua, bước qua ta trước.', 'Thép già vẫn còn cứng lắm.'],
  ltk: ['Nam quốc sơn hà Nam đế cư!', 'Song kiếm hợp bích, thiên hạ vô song.', 'Ánh sáng sẽ dẫn đường.']
};
const GEN = ['Giang hồ rộng lớn, ta đã sẵn sàng!', 'Hôm nay lại xuất quân thôi!'], REW = ['Thu hoạch không tệ!', 'Của cải đầy túi rồi!', 'Phần thưởng xứng đáng!'];
/* Hiệu ứng nền theo hệ (design.aura.kind của tướng): tuyết/nước, tia sét, tàn lửa, lá, bụi vàng, tia sáng, gió */
const AMB = {
  wind: { c: '#cfe8ff', d: [1, -.12], sp: .2, sh: 'streak' }, dragon: { c: '#ff8a3a', d: [0, -1], sp: .15, sh: 'ember' },
  tide: { c: '#e4f4ff', d: [.08, 1], sp: .07, sh: 'flake' }, thunder: { c: '#d6b8ff', d: [0, 0], sp: 0, sh: 'spark' },
  leaf: { c: '#9bd36a', d: [.22, 1], sp: .08, sh: 'leaf' }, guard: { c: '#ffd978', d: [0, -1], sp: .06, sh: 'mote' }, sun: { c: '#fff1a8', d: [0, -1], sp: .1, sh: 'ray' }
};
/* Thời lượng chuỗi hiệu ứng; hold = tỉ lệ giai đoạn TÍCH TỤ (trước khi bùng nổ, lúc đó số liệu còn giữ nguyên) */
const SEQ = { lvl: { T: 2.0, hold: .42, st: 'victory' }, star: { T: 2.2, hold: .42, st: 'victory' }, realm: { T: 3.8, hold: .62, st: 'ultimate' }, skill: { T: 1.8, hold: .3, st: 'skill' }, eq: { T: 1.1, hold: 0, st: 'skill' } };

const STYLE = `
#hhero{width:100%;animation:none!important}#hhero canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#hhero.atk::after{display:none}#hstage .aur,#hstage .shd,#hstage .pr,#hstage .gl{display:none}
#hpn{position:absolute;left:3px;right:3px;bottom:3px;z-index:5;padding:5px 7px 6px;border:1px solid #a8802f;border-radius:13px;background:linear-gradient(rgba(30,18,46,.9),rgba(10,10,28,.94));color:#f3e3b8;font-size:11px;line-height:1.25;box-shadow:0 0 14px rgba(0,0,0,.6)}
#hpn .r1{display:flex;align-items:center;gap:5px}#hpn .r1 b{font-size:15px;color:#fff3d0;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hpn .q{padding:0 6px;border-radius:9px;border:1px solid;font-weight:800;font-size:10px}
#hpn .r2{display:flex;align-items:center;justify-content:space-between;margin-top:1px}#hpn .sr{color:#ffd34a;letter-spacing:0;font-size:12px;white-space:nowrap}
#hpn .sr i{font-style:normal;opacity:.3}#hpn .sr i.on{opacity:1}#hpn .sr.fx i.on{animation:hsr .5s both;animation-delay:calc(var(--k)*.24s)}@keyframes hsr{from{transform:scale(2.6);opacity:0;filter:brightness(3)}}
#hpn .r3{display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:1px}#hpn .rl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.95}#hpn .rl b{color:#ffd978}
#hpn .gp{display:flex;gap:2px;flex:none}#hpn .gp i{width:11px;height:11px;border-radius:3px;border:1px solid #4a4262;background:#150f26;font-size:0}#hpn .gp i.on{box-shadow:0 0 5px var(--c)}
#hpn .xp{position:relative;height:13px;margin:3px 0;border-radius:7px;border:1px solid #6b5326;background:#150f26;overflow:hidden}
#hpn .xp i{display:block;height:100%;background:linear-gradient(#8fd8ff,#2a6fd6);transition:width .6s}#hpn .xp b{position:absolute;inset:0;text-align:center;font-size:9.5px;line-height:12px;text-shadow:0 1px 2px #000}
#hpn .st{display:flex;justify-content:space-between;gap:2px;font-size:10.5px}#hpn .st span{white-space:nowrap}#hpn .st span.up,#hpn .r2 b.up{display:inline-block;animation:hup 1.4s both}@keyframes hup{20%,60%{color:#7dff9a;text-shadow:0 0 8px #7dff9a;transform:scale(1.18)}}
#hpn .bt{display:flex;gap:4px;margin-top:5px}#hpn button{flex:1;min-width:0;min-height:38px;padding:0 2px;font:inherit;font-weight:800;font-size:11px;line-height:1.1;border-radius:9px;border:1px solid #ffd978;color:#3a1a12;background:linear-gradient(#ffe48f,#e3881c);cursor:pointer}
#hpn button.bk{background:linear-gradient(#d9b3ff,#7a3ad6);color:#fff}#hpn button.vh{background:linear-gradient(#aef0d0,#1f9d6a);color:#06301f}
#hpn button.off{filter:grayscale(.85);opacity:.62}#hpn button:active{transform:scale(.94)}#hpn button small{display:block;font-weight:600;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hskb{position:absolute;right:3px;top:3px;z-index:5;width:34px;height:34px;border-radius:50%;border:1px solid #a8802f;background:rgba(10,10,28,.8);font-size:17px;cursor:pointer;padding:0}#hskb:active{transform:scale(.9)}
#hfx{position:absolute;left:-30%;right:-30%;top:12%;z-index:6;text-align:center;pointer-events:none;font-weight:900;font-size:28px;letter-spacing:3px;color:#fff3b0;text-shadow:0 0 14px #ffb62e,0 3px 6px #000;opacity:0;white-space:nowrap}
#hfx small{display:block;font-size:13px;letter-spacing:2px;color:#ffd978}#hfx span{font-size:34px;display:block}#hfx.on{animation:hfx 1.9s both}@keyframes hfx{10%{opacity:1;transform:scale(1.3)}22%,78%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-16px)}}
#menu>#hdim{position:absolute!important;inset:0;width:auto!important;z-index:0!important;background:radial-gradient(ellipse at 50% 48%,rgba(10,0,30,.1),rgba(0,0,10,.86));opacity:0;pointer-events:none;transition:opacity .5s}#hdim.on{opacity:1}
#hscene .ht{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 52%,var(--ha,transparent) 0,transparent 62%);opacity:.32;mix-blend-mode:screen}
#menu>#hsh{position:absolute!important;inset:0;width:auto!important;z-index:20!important;display:none;align-items:flex-end;background:rgba(3,4,12,.62)}#menu>#hsh.on{display:flex;animation:hshi .2s both}@keyframes hshi{from{opacity:0}}
#hsh .bx{width:100%;max-height:82%;overflow:auto;padding:12px 14px calc(env(safe-area-inset-bottom) + 14px);border-top:2px solid #a8802f;border-radius:18px 18px 0 0;background:linear-gradient(#241a3c,#0d0b20);color:#f3e3b8;font-size:13px;animation:hshu .25s both}@keyframes hshu{from{transform:translateY(40px)}}
#hsh h4{margin:0 0 6px;text-align:center;font-size:16px;letter-spacing:2px;color:#ffe9b0}#hsh .hd{display:flex;justify-content:space-between;align-items:baseline;font-size:15px}#hsh .hd em{font-style:normal;color:#7dff9a;font-weight:800}
#hsh .xp{position:relative;height:16px;margin:7px 0 3px;border-radius:8px;border:1px solid #6b5326;background:#150f26;overflow:hidden}#hsh .xp i{display:block;height:100%;background:linear-gradient(#8fd8ff,#2a6fd6)}#hsh .xp b{position:absolute;inset:0;text-align:center;font-size:11px;line-height:15px;text-shadow:0 1px 2px #000}
#hsh .cs{margin:5px 0 8px;display:flex;justify-content:space-between}#hsh .bad{color:#ff7a7a;font-weight:800}
#hsh table{width:100%;border-collapse:collapse;margin-bottom:10px}#hsh td{padding:5px 4px;border-bottom:1px solid rgba(168,128,47,.3)}#hsh td:nth-child(n+2){text-align:right}#hsh .dn{color:#7dff9a;font-weight:800}#hsh .eq{opacity:.55}
#hsh .bb{display:flex;gap:8px}#hsh .bb button{flex:1;min-height:44px;font:inherit;font-weight:800;font-size:13px;border-radius:12px;border:1px solid #ffd978;color:#3a1a12;background:linear-gradient(#ffe48f,#e3881c);cursor:pointer}
#hsh .bb button.cn{background:rgba(255,255,255,.08);color:#f3e3b8;border-color:#6b5326}#hsh .bb button.off{filter:grayscale(.85);opacity:.55}#hsh .bb button:active{transform:scale(.96)}
#hsh .vr{display:flex;gap:9px;align-items:center;padding:8px;margin-bottom:7px;border:1px solid #6b5326;border-radius:12px;background:rgba(255,255,255,.04)}#hsh .vr .ic{font-size:30px;width:42px;text-align:center}
#hsh .vr .tx{flex:1;min-width:0}#hsh .vr .tx small{display:block;opacity:.85;font-size:11.5px}#hsh .vr button{min-width:74px;min-height:40px;font:inherit;font-weight:800;font-size:12px;border-radius:10px;border:1px solid #ffd978;color:#3a1a12;background:linear-gradient(#ffe48f,#e3881c);cursor:pointer}#hsh .vr button.off{filter:grayscale(.85);opacity:.55}
#hsh .pl{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}#hsh .pl button{flex:1 1 40%;min-height:44px;font:inherit;font-size:12px;font-weight:700;border-radius:12px;border:1px solid #6b5326;background:rgba(255,255,255,.06);color:#f3e3b8;cursor:pointer}#hsh .pl button.on{border-color:#ffd978;background:linear-gradient(#ffe48f,#e3881c);color:#3a1a12}
#hun{position:absolute;inset:0;z-index:40;background:#05030c;animation:hshi .3s both;cursor:pointer;overflow:hidden}#hun canvas{position:absolute;inset:0;width:100%;height:100%}
#hun .un{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 7%);text-align:center;color:#fff3d0;pointer-events:none}
#hun .un small{display:block;letter-spacing:4px;font-size:13px;color:#ffd978;opacity:0}#hun .un h2{margin:2px 0;font-size:30px;text-shadow:0 0 18px var(--c),0 3px 8px #000;opacity:0;transform:translateY(14px)}
#hun .un p{margin:0;font-size:13px;opacity:0;color:#e8d8b0}#hun .un .rt{display:inline-block;margin-top:8px;padding:2px 16px;border-radius:14px;border:2px solid var(--c);color:var(--c);font-weight:900;font-size:18px;letter-spacing:2px;opacity:0;background:rgba(0,0,0,.45)}
#hun .un .tp{margin-top:14px;font-size:12px;opacity:0;color:#b9a77a}#hun.s1 small,#hun.s1 h2{opacity:1;transform:none;transition:.5s}#hun.s2 p,#hun.s2 .rt{opacity:1;transition:.5s}#hun.s3 .tp{opacity:.9;transition:.6s;animation:hbl 1.4s infinite}@keyframes hbl{50%{opacity:.35}}`;

let B, cv, cx, pn, fx, dim, hh, sh, skb, tint, snap, key = '', clock = 0, st = 'idle', stT = 0, last = 0, seq = null, swap = 1, ps = [], cv_ = [], zoom = 1, say, sheet = null, lastSt = {}, ambK = '';
const CH = () => window.DV_CHAR && DV_CHAR.ok() ? DV_CHAR : null, sv = () => B.sv();
const eqSig = () => { const s = sv(); return SLOTS.map(([k]) => { const i = s.inv.find(x => x.u === s.eqp[k]); return i ? k + i.r + '.' + i.l : k }).join(); };
const eqR = k => { const s = sv(), i = s.inv.find(x => x.u === s.eqp[k]); return i ? i.r : -1 };
const eqTop = () => M.max(0, ...SLOTS.map(([k]) => eqR(k)));
const vhKeys = () => Object.keys(sv().vh || {}).filter(k => sv().vh[k]).sort().join();

/* Chuỗi diện mạo đã mở của tướng: Dạng gốc → Thức Tỉnh 1..3 → Thăng Giai 1..5 → Cực Hạn. Phần tử cuối LUÔN là trạng thái thật của tướng. */
function forms(id, p, mx, c) {
  const L = [{ aw: 0, asc: 0, max: 0, n: 'Dạng gốc' }]; if (!c) return L;
  for (let i = 1; i <= p.aw; i++)L.push({ aw: i, asc: 0, max: 0, n: (c.awakening[i - 1] || {}).name || 'Thức Tỉnh ' + i });
  for (let i = 1; i <= p.asc; i++)L.push({ aw: p.aw, asc: i, max: 0, n: (c.ascension[i - 1] || {}).name || 'Thăng Giai ' + i });
  if (mx) L.push({ aw: p.aw, asc: p.asc, max: 1, n: 'Cực Hạn' });
  return L;
}
function cur() {
  const s = sv(), h = B.HEROES.find(x => x.id === s.hs) || B.HEROES[0], C = CH(), p = C ? C.prog(h.id) : { l: 1, s: 0, aw: 0, asc: 0 }, H = s.hx[h.id] || { l: 1, e: 0 };
  const mx = C ? C.isMax(h.id, p) : false, c = C && C.get(h.id), F = forms(h.id, p, mx, c), si = H.skin != null && H.skin >= 0 && H.skin < F.length - 1 ? H.skin : F.length - 1;
  return { id: h.id, h, p, H, mx, c, F, si, form: F[si], q: B.HQ ? B.HQ[h.q] : [h.q, QC[h.q]] };
}
const realmName = o => { const c = o.c; if (!c) return 'Dạng gốc'; if (o.mx) return 'Cực Hạn'; const a = c.ascension[o.p.asc - 1], w = c.awakening[o.p.aw - 1]; return (o.p.asc && a && a.name) || (o.p.aw && w && w.name) || 'Dạng gốc'; };
/* Chỉ số hiệu lực — chính là số liệu chiến đấu dùng (hero + trang bị + võ học). Cơ sở lấy từ charRules, không hard-code riêng. */
function fin(o) {
  const b = B.bon(), C = CH(), S = C && C.stats(o.id), rb = (window.DV_DATA && DV_DATA.charRules && DV_DATA.charRules.base) || { attack: 100, speed: 130 };
  return { hp: M.round(100 + b.hp), atk: M.round(rb.attack * b.am), def: S ? S.defense : 0, crit: b.cr, spd: M.round(rb.speed * (1 + b.sp)), pw: B.pwr() };
}
const SD = [['hp', '❤', 'Sinh lực', v => v], ['atk', '⚔', 'Công kích', v => v], ['def', '🛡', 'Phòng thủ', v => v], ['crit', '💥', 'Bạo kích', v => M.round(v * 100) + '%'], ['spd', '👟', 'Tốc độ', v => v], ['pw', '🏯', 'Lực chiến', v => v.toLocaleString('vi')]];
/* Xem trước chỉ số nếu áp một thay đổi tạm lên dữ liệu thật (luôn khôi phục) */
function preview(o, fn, undo) { const a = fin(o); fn(); let b; try { b = fin(o) } finally { undo() } return { a, b } }
const lvCost = o => { const need = B.hexp(o.p.l) - o.H.e, rate = (window.DV_DATA && DV_DATA.prog && DV_DATA.prog.trainRate) || 2; return { need, cost: M.ceil(M.max(0, need) / rate) } };

/* ---------- phát hiện thay đổi dữ liệu → chọn hiệu ứng ---------- */
function play(k, label, sub, o2) {
  const d = SEQ[k]; seq = { k, t: 0, T: d.T * (RM ? .5 : 1), hold: RM ? 0 : d.hold, col: o2 && o2.col, seed: R() * 9 }; cv_.length = 0;
  fx.innerHTML = (o2 && o2.ico ? '<span>' + o2.ico + '</span>' : '') + label + (sub ? '<small>' + sub + '</small>' : ''); fx.classList.remove('on'); void fx.offsetWidth;
  fx.style.animationDelay = (seq.hold * seq.T) + 's'; fx.classList.add('on');
  if (k === 'realm') { dim.classList.add('on'); setTimeout(() => dim.classList.remove('on'), seq.T * 1000 - 200) }
  st = d.st; stT = 0; B.sfx && B.sfx('u');
}
const overlay = () => { const m = $('#modal'); return (m && m.classList.contains('on')) || $('#hsel') || $('#sm') || $('#hun') || $('#hsh.on') || $('#hload') || $('#cmap') || $('#hch') };
function detect(o) {
  const s = sv(), cur_ = { id: o.id, l: o.p.l, s: o.p.s, aw: o.p.aw, asc: o.p.asc, e: eqSig(), vh: vhKeys(), si: o.si + '/' + o.F.length, g: s.gold + s.gem };
  if (snap) {
    if (cur_.id !== snap.id) { B.home(); swap = 0; st = 'idle'; ps.length = 0; seq = null; key = '' }
    else if (cur_.aw > snap.aw || cur_.asc > snap.asc) { play('realm', 'ĐỘT PHÁ!', realmName(o)); delete o.H.skin }
    else if (cur_.s > snap.s) { play('star', '★ ' + cur_.s + ' SAO', 'Chỉ số tăng'); pn.dataset.star = 1 }
    else if (cur_.l > snap.l) play('lvl', 'LEVEL UP!', 'Lv.' + snap.l + ' → Lv.' + cur_.l);
    else if (cur_.vh !== snap.vh) {
      const nk = cur_.vh.split(',').find(k => k && snap.vh.split(',').indexOf(k) < 0) || '', bk = B.vh.books().find(b => b.k === nk.slice(0, 2)), j = +nk.slice(2) || 0;
      play('skill', 'SKILL UPGRADED', bk ? bk.t + ' · Tầng ' + (j + 1) + ' — ' + bk.n[j].d : '', { ico: bk ? bk.i : '📖', col: '#7dffc0' });
    }
    else if (cur_.e !== snap.e) { const er = eqTop(); play('eq', '', '', { col: EQC[er] }); fx.classList.remove('on') }
    else if (cur_.si !== snap.si) { swap = .3 }
    else if (cur_.g > snap.g && !seq) { st = 'victory'; stT = 0; speak(REW[R() * REW.length | 0]) }
  }
  snap = cur_;
}

/* ---------- bảng thông tin ---------- */
function panel(o) {
  const s = sv(), C = CH(), cap = B.cap(o.p.s), need = B.hexp(o.p.l), full = o.p.l >= cap, q = o.q;
  const kind = C && o.p.aw < 3 ? 'aw' : 'asc', rq = C && s.hu[o.id] ? C.req(o.id, kind) : null;
  const k = [o.id, o.p.l, o.H.e, o.p.s, o.p.aw, o.p.asc, o.mx, s.gold, s.hon, s.mt, eqSig(), vhKeys(), o.si, pn.dataset.star].join(); if (k === key) return; key = k;
  const f = fin(o), pv = lastSt[o.id] || f, up = n => f[n] > pv[n] ? 'up' : '';
  const stars = [1, 2, 3, 4, 5].map((n, i) => `<i class="${n <= o.p.s ? 'on' : ''}" style="--k:${i}">★</i>`).join('');
  const gp = SLOTS.map(([sl, ic]) => { const r = eqR(sl); return `<i class="${r >= 0 ? 'on' : ''}" title="${ic} ${r >= 0 ? EQN[r] : 'Trống'}" style="--c:${GC[r] || '#8aa0a8'};border-color:${r >= 0 ? GC[r] : ''};background:${r >= 0 ? GC[r] + '66' : ''}">.</i>` }).join('');
  const vn = B.vh.next(), bk = !C ? '' : rq && rq.done ? `<button class="bk off">CỰC HẠN</button>` : `<button class="bk ${rq && rq.ok ? '' : 'off'}" data-a="bk">ĐỘT PHÁ<small>${rq && rq.st && rq.st.name ? rq.st.name : ''}</small></button>`;
  pn.innerHTML = `<div class="r1"><b>${o.h.n}</b><span class="q" style="color:${q[1]};border-color:${q[1]}">${q[0]}</span></div>
<div class="r2"><span class="sr ${pn.dataset.star ? 'fx' : ''}">${stars}</span><span>⚔ LC <b class="${up('pw')}" style="color:#fff3d0">${f.pw.toLocaleString('vi')}</b></span></div>
<div class="r3"><span class="rl">Cảnh giới: <b>${realmName(o)}</b></span><span class="gp">${gp}</span></div>
<div class="xp"><i style="width:${full ? 100 : M.min(100, o.H.e / need * 100)}%"></i><b>Lv.${o.p.l}/${cap} · ${full ? 'EXP MAX' : o.H.e + '/' + need}</b></div>
<div class="st"><span class="${up('hp')}">❤${f.hp}</span><span class="${up('atk')}">⚔${f.atk}</span><span class="${up('def')}">🛡${f.def}</span><span class="${up('crit')}">💥${M.round(f.crit * 100)}%</span><span class="${up('spd')}">👟${f.spd}</span></div>
<div class="bt"><button data-a="lv" class="${full ? 'off' : ''}">${full ? 'TRẦN CẤP' : 'NÂNG CẤP'}<small>${full ? 'Tăng ★' : '→ Lv.' + (o.p.l + 1)}</small></button>${bk}<button class="vh ${vn ? '' : 'off'}" data-a="vh">VÕ HỌC<small>${vn ? '🪙' + vn.n.c : 'Đã đủ'}</small></button></div>`;
  lastSt[o.id] = f; pn.dataset.star = '';
  skb.style.display = o.F.length > 1 ? '' : 'none';
}

/* ---------- bảng chi tiết (nâng cấp / võ học / diện mạo) ---------- */
function rows(a, b) { return SD.map(([k, ic, nm, fm]) => { const d = b[k] - a[k]; return `<tr class="${d ? '' : 'eq'}"><td>${ic} ${nm}</td><td>${fm(a[k])}</td><td class="${d > 0 ? 'dn' : ''}">${fm(b[k])}${d > 0 ? ' ▲' : ''}</td></tr>` }).join('') }
function renderSheet() {
  const o = cur(), s = sv(); let h = '';
  if (sheet === 'lv') {
    const cap = B.cap(o.p.s), full = o.p.l >= cap, { need, cost } = lvCost(o), ok = !full && s.gold >= cost;
    if (full) h = `<h4>NÂNG CẤP TƯỚNG</h4><div class="hd"><b>${o.h.n}</b><span>Lv.${o.p.l}/${cap}</span></div><p style="text-align:center">Đã đạt trần cấp. Tăng ★ (triệu hồi trùng tướng) để mở thêm trần cấp.</p><div class="bb"><button class="cn" data-a="x">ĐÓNG</button></div>`;
    else {
      const hx = s.hx[o.id] || (s.hx[o.id] = { l: 1, e: 0 }), l0 = hx.l, e0 = hx.e, { a, b } = preview(o, () => { hx.l = l0 + 1; hx.e = 0 }, () => { hx.l = l0; hx.e = e0 });
      h = `<h4>NÂNG CẤP TƯỚNG</h4><div class="hd"><b>${o.h.n}</b><span>Lv.${o.p.l} → <em>Lv.${o.p.l + 1}</em></span></div>
<div class="xp"><i style="width:${M.min(100, o.H.e / B.hexp(o.p.l) * 100)}%"></i><b>EXP hiện tại ${o.H.e} / cần ${B.hexp(o.p.l)}</b></div>
<div class="cs"><span>Còn thiếu ${need} EXP (quy đổi vàng)</span><span class="${ok ? '' : 'bad'}">Chi phí 🪙 ${cost} (có ${s.gold})</span></div>
<table><tr style="opacity:.7"><td>Chỉ số</td><td>Trước nâng</td><td>Sau nâng</td></tr>${rows(a, b)}</table>
<div class="bb"><button class="cn" data-a="x">ĐÓNG</button><button class="${ok ? '' : 'off'}" data-a="lvok">${ok ? 'NÂNG CẤP' : 'THIẾU VÀNG'}</button></div>`;
    }
  } else if (sheet === 'vh') {
    const L = B.vh.books().map(b => { let j = 0; while (j < b.n.length && s.vh[b.k + j]) j++; if (j >= b.n.length) return { b, done: 1 }; const n = b.n[j], id = b.k + j, p = preview(o, () => { s.vh[id] = 1 }, () => { delete s.vh[id] }); return { b, j, n, id, p } });
    h = `<h4>NÂNG CẤP VÕ HỌC</h4><div style="font-size:12px;opacity:.8;margin-bottom:8px">🪙 ${s.gold} · Võ học tăng chỉ số thật của tướng trong trận.</div>` + L.map(r => {
      if (r.done) return `<div class="vr"><div class="ic">${r.b.i}</div><div class="tx"><b>${r.b.t}</b><small>Đã học đủ ${r.b.n.length} tầng</small></div></div>`;
      const ch = SD.filter(([k]) => r.p.b[k] > r.p.a[k] && k !== 'pw').map(([k, ic, , fm]) => ic + fm(r.p.a[k]) + '→' + fm(r.p.b[k])).join(' · '), ok = s.gold >= r.n.c;
      return `<div class="vr"><div class="ic">${r.b.i}</div><div class="tx"><b>${r.b.t}</b> · Tầng ${r.j} → <b style="color:#7dff9a">${r.j + 1}</b><small>${r.n.d}</small><small>${ch} · LC ${r.p.a.pw}→${r.p.b.pw}</small></div><button class="${ok ? '' : 'off'}" data-a="vhok" data-v="${r.id}">HỌC<br>🪙${r.n.c}</button></div>`
    }).join('') + `<div class="bb"><button class="cn" data-a="x">ĐÓNG</button></div>`;
  } else if (sheet === 'skin') {
    h = `<h4>DIỆN MẠO — ${o.h.n}</h4><div style="font-size:12px;opacity:.8;margin-bottom:8px;text-align:center">Chọn hình dạng đã mở. Main Menu hiển thị ngay.</div><div class="pl">` + o.F.map((f, i) => `<button class="${i === o.si ? 'on' : ''}" data-a="skin" data-v="${i}">${f.n}</button>`).join('') + `</div><div class="bb"><button class="cn" data-a="x">XONG</button></div>`;
  }
  sh.firstChild.innerHTML = h;
}
function openSheet(m) { sheet = m; renderSheet(); sh.classList.add('on') }
function closeSheet() { sheet = null; sh.classList.remove('on') }
function act(a, v) {
  const o = cur(), s = sv(), C = CH();
  if (a === 'lv') { if (o.p.l >= B.cap(o.p.s)) { B.toast('Đã đạt trần cấp — tăng ★ để mở thêm'); return } openSheet('lv') }
  else if (a === 'vh') openSheet('vh');
  else if (a === 'skinb') openSheet('skin');
  else if (a === 'x') closeSheet();
  else if (a === 'lvok') {
    const { need, cost } = lvCost(o); if (o.p.l >= B.cap(o.p.s)) return; if (s.gold < cost) { B.toast('Thiếu 🪙 Vàng (' + s.gold + '/' + cost + ')'); return }
    closeSheet(); s.gold -= cost; const H = s.hx[o.id] || (s.hx[o.id] = { l: 1, e: 0 }); H.e += need; B.hxUp(H); B.put(); B.home();
  } else if (a === 'vhok') { const r = B.vh.learn(v); if (!r) B.toast('Chưa đủ điều kiện / thiếu 🪙 Vàng'); else { closeSheet(); B.home() } }
  else if (a === 'skin') { const H = s.hx[o.id] || (s.hx[o.id] = { l: 1, e: 0 }), i = +v; if (i >= o.F.length - 1) delete H.skin; else H.skin = i; B.put(); B.home(); renderSheet() }
  else if (a === 'bk' && C) {
    const kind = o.p.aw < 3 ? 'aw' : 'asc', rq = C.req(o.id, kind); if (!rq.ok) { B.toast(rq.why || 'Chưa đủ điều kiện'); return }
    C.upgrade(o.id, kind); B.home();
  }
}

/* ---------- hiệu ứng nền theo hệ + trang bị ---------- */
function ambient(dt, W, Hh, A, col, n) {
  if (ps.length > n) ps.length = n; while (ps.length < n) ps.push({ x: R(), y: R(), v: .6 + R() * .8, p: R() * 6, s: 1 + R() * 2.2, l: R() });
  cx.save();
  for (const p of ps) {
    p.p += dt * 2; p.x += (A.d[0] * A.sp * p.v + M.sin(p.p) * (A.sh === 'leaf' ? .03 : .012)) * dt; p.y += A.d[1] * A.sp * p.v * dt;
    if (A.sh === 'spark') { p.l -= dt * 2.6; if (p.l < 0) { p.l = 1; p.x = .15 + R() * .7; p.y = .1 + R() * .7 } }
    else { if (p.y < -.05) { p.y = 1.02; p.x = R() } if (p.y > 1.05) { p.y = -.02; p.x = R() } if (p.x > 1.05) p.x = -.05; if (p.x < -.05) p.x = 1.05 }
    const x = p.x * W, y = p.y * Hh, a = A.sh === 'spark' ? clamp(p.l, 0, 1) : clamp(M.min(1, p.y * 1.4) * (1 - M.max(0, p.y - .9) * 8), 0, 1) * .85, c = p.s > 2.4 && col ? col : A.c;
    cx.globalAlpha = a; cx.fillStyle = cx.strokeStyle = c;
    if (A.sh === 'streak') { cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 10 * p.s, y + 2); cx.stroke() }
    else if (A.sh === 'spark') { cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(x, y); let px = x, py = y; for (let i = 0; i < 3; i++) { px += (R() - .5) * 12; py += 6 + R() * 5; cx.lineTo(px, py) } cx.stroke() }
    else if (A.sh === 'leaf') { cx.save(); cx.translate(x, y); cx.rotate(p.p); cx.beginPath(); cx.ellipse(0, 0, 4 + p.s, 2, 0, 0, TAU); cx.fill(); cx.restore() }
    else if (A.sh === 'mote') { cx.save(); cx.translate(x, y); cx.rotate(M.PI / 4); cx.fillRect(-p.s, -p.s, p.s * 2, p.s * 2); cx.restore() }
    else if (A.sh === 'ray') { cx.beginPath(); cx.arc(x, y, p.s * .9, 0, TAU); cx.fill(); cx.lineWidth = .8; cx.beginPath(); cx.moveTo(x, y - p.s * 3.5); cx.lineTo(x, y + p.s * 3.5); cx.moveTo(x - p.s * 3.5, y); cx.lineTo(x + p.s * 3.5, y); cx.stroke() }
    else { cx.beginPath(); cx.arc(x, y, p.s * (A.sh === 'ember' ? .85 : .95), 0, TAU); cx.fill() }
  }
  cx.restore(); cx.globalAlpha = 1;
}
function speak(t) { if (!say) return; say.textContent = t; say.classList.remove('on'); void say.offsetWidth; say.classList.add('on') }

/* ---------- vòng lặp vẽ ---------- */
function frame(now) {
  requestAnimationFrame(frame);
  const menu = $('#menu'); if (!B || !menu || !menu.classList.contains('on') || document.hidden) { last = 0; return }
  const dt = M.min(.05, (now - (last || now)) / 1000); last = now; clock += dt; stT += dt;
  const o = cur(), busy = overlay();
  if (!busy) { detect(o); if (!(seq && seq.k !== 'eq' && seq.t / seq.T < seq.hold)) panel(o) }
  if (seq) seq.t += dt;
  const r = hh.getBoundingClientRect(), dpr = M.min(2, devicePixelRatio || 1), W = M.max(1, r.width | 0), H = M.max(1, r.height | 0);
  if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr }
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
  swap = M.min(1, swap + dt / .35);
  const C = CH(), q = o.q[1], er = eqTop(), d = C && C.get(o.id) ? C.resolve(o.id, o.form.aw, o.form.asc, o.form.max) : null, ak = d ? d.aura.kind : '', acol = d ? d.aura.color : q;
  const main = (d && d.palette.main) || o.h.col || '#c9a020', A = AMB[ak] || { c: main, d: [0, -1], sp: .1, sh: 'mote' };
  if (ak !== ambK) { ambK = ak; ps.length = 0; if (tint) tint.style.setProperty('--ha', acol) }
  /* khung hiển thị: tướng đứng trên bảng thông tin, không bị che */
  const ph = pn.offsetHeight || 140, free = M.max(90, H - ph - 4), fy = free - 4, S = M.min(free / 92, W / 118) * (RM ? 1 : 1);
  const u = seq ? seq.t / seq.T : 0, cu = seq ? (seq.hold ? clamp(u / seq.hold, 0, 1) : 1) : 0, bu = seq && seq.hold ? clamp((u - seq.hold) / (1 - seq.hold), 0, .999) : seq ? clamp(u, 0, .999) : 0;
  zoom += ((seq && seq.k === 'realm' && u < .85 && !RM ? 1.2 : 1) - zoom) * M.min(1, dt * 4.5);
  const ac = seq && seq.col ? seq.col : EQC[er] || q, g = cx.createRadialGradient(W / 2, fy - 30 * S, 4, W / 2, fy - 30 * S, free * .62); g.addColorStop(0, ac + '70'); g.addColorStop(1, ac + '00');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  if (!RM) ambient(dt, W, free, A, EQC[er], [10, 14, 18][1] + 2 * QI[o.h.q] + er * 4);
  cx.save(); cx.translate(W / 2, fy); cx.scale(zoom, zoom); cx.translate(-W / 2, -fy);
  const bodyY = fy - 30 * S; let flash = 0;
  /* GIAI ĐOẠN TÍCH TỤ: năng lượng hội tụ, ánh sáng tăng dần, vòng/pháp trận dưới chân */
  if (seq && seq.k !== 'eq' && cu > 0 && bu === 0 || seq && seq.k !== 'eq' && bu > 0) {
    const rl = seq.k === 'realm', cc = rl ? '#c79bff' : seq.k === 'skill' ? '#7dffc0' : '#ffd978', k = bu > 0 ? 1 - bu : cu, ru = bu > 0 ? 1 : cu;
    const gl = cx.createLinearGradient(0, fy, 0, fy - 100 * S); gl.addColorStop(0, cc + 'cc'); gl.addColorStop(1, cc + '00'); cx.globalAlpha = (rl ? .55 : .42) * k * (bu > 0 ? 1 : ru); cx.fillStyle = gl; cx.fillRect(W / 2 - 22 * S * (.5 + ru * .5), fy - 100 * S, 44 * S * (.5 + ru * .5), 100 * S); cx.globalAlpha = 1;
    cx.save(); cx.translate(W / 2, fy + 2); cx.scale(1, .32); const Rr = (rl ? .3 : .22) * H * (.55 + .45 * ease(ru)) * (1 + .1 * M.sin(clock * 6)); cx.strokeStyle = cc; cx.lineWidth = rl ? 3 : 2.5; cx.globalAlpha = k;
    cx.setLineDash([10, 6]); cx.lineDashOffset = -clock * 50; cx.beginPath(); cx.arc(0, 0, Rr, 0, TAU); cx.stroke(); cx.setLineDash([]); cx.rotate(clock * (rl ? 1.2 : 1.6)); cx.beginPath(); cx.arc(0, 0, Rr * .68, 0, TAU); cx.stroke();
    if (rl) { for (let t = 0; t < 2; t++) { cx.rotate(t ? M.PI / 3 : 0); cx.beginPath(); for (let i = 0; i < 3; i++) { const a = i * TAU / 3 - M.PI / 2; i ? cx.lineTo(M.cos(a) * Rr, M.sin(a) * Rr) : cx.moveTo(M.cos(a) * Rr, M.sin(a) * Rr) } cx.closePath(); cx.stroke() } for (let i = 0; i < 12; i++) { const a = i * TAU / 12; cx.beginPath(); cx.moveTo(M.cos(a) * Rr * 1.04, M.sin(a) * Rr * 1.04); cx.lineTo(M.cos(a) * Rr * 1.16, M.sin(a) * Rr * 1.16); cx.stroke() } }
    cx.restore();
    if (!cv_.length) for (let i = 0; i < (RM ? 0 : rl ? 30 : 20); i++)cv_.push({ a: R() * TAU, r: .5 + R() * .5, v: .7 + R() * .6, w: R() });
    const cr = M.min(W, free) * .55, ec = ease(clamp(ru, 0, 1));
    if (bu === 0) cv_.forEach(p => { const k2 = clamp(ec * p.v, 0, 1), rr = cr * p.r * (1 - k2), a = p.a + (rl ? k2 * 2.4 : 0), x = W / 2 + M.cos(a) * rr, y = bodyY + M.sin(a) * rr * .8; cx.globalAlpha = (.3 + .7 * k2) * .95; cx.strokeStyle = cx.fillStyle = p.w > .5 ? '#ffffff' : cc; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + M.cos(a) * 9 * (1 - k2), y + M.sin(a) * 9 * (1 - k2) * .8); cx.stroke(); cx.beginPath(); cx.arc(x, y, 1.6 + 1.6 * k2, 0, TAU); cx.fill() });
    cx.globalAlpha = 1; flash = bu > 0 ? .75 * (1 - bu) : .55 * ec;
  }
  let drawn = false;
  if (C && C.get(o.id)) {
    const a = DV_DATA.charRules.anim[st]; if (seq && seq.k === 'realm' && u < .8 && a) stT = M.min(stT, a.dur * .85); if (a && !a.loop && stT > a.dur + .1) { st = 'idle'; stT = 0 }
    drawn = C.draw(cx, o.id, { x: W / 2, y: fy, scale: S, f: 1, t: clock, state: st, st: stT, aw: o.form.aw, asc: o.form.asc, max: !!o.form.max, q: RM ? 1 : 2, evo: 0, alpha: swap, flash }) !== false;
    /* GIAI ĐOẠN BÙNG NỔ */
    if (seq && bu > 0 && window.DV_CHIBI) {
      const pal = d.palette, kk = seq.k === 'star' ? 'realm' : seq.k === 'eq' ? 'skl' : seq.k; cx.save(); cx.translate(W / 2, fy); cx.scale(S * 1.3, S * 1.3);
      DV_CHIBI.burst(cx, kk, bu, pal, RM ? 0 : 2, clock, seq.col || EQC[er] || q); if (seq.k === 'realm' && bu > .3) DV_CHIBI.burst(cx, 'realm', clamp((bu - .3) / .7, 0, .999), pal, 2, clock, q); cx.restore();
      if (seq.k === 'realm' && bu > .05) for (let i = 0; i < 2; i++) { const k = clamp(bu * 1.5 - i * .18, 0, 1); cx.strokeStyle = i ? '#c79bff' : '#fff'; cx.globalAlpha = (1 - k) * .9; cx.lineWidth = 6 * (1 - k) + 1; cx.beginPath(); cx.ellipse(W / 2, fy - 18 * S, k * W * .62, k * W * .2, 0, 0, TAU); cx.stroke() }
      cx.globalAlpha = 1;
    }
    if (seq && u >= 1) { seq = null; cv_.length = 0 }
  }
  if (!drawn) { cx.font = free * .4 + 'px serif'; cx.textAlign = 'center'; cx.fillText(o.h.i || '🧙', W / 2, fy) } // tướng chưa có model: vẫn đúng icon của CHÍNH tướng đó
  cx.restore();
}
function talk() {
  const o = cur(); st = ['attack', 'skill'][R() * 2 | 0]; stT = 0; const L = LINES[o.id] || (o.c && o.c.quotes) || GEN; speak(L[R() * L.length | 0]);
}

/* ---------- cinematic mở khoá tướng mới (đúng model/phẩm chất/aura của tướng nhận được) ---------- */
function unlock(ids, done) {
  const C = CH(); ids = (ids || []).filter(id => C && C.get(id)); if (!ids.length) { done && done(); return }
  const app = $('#app') || document.body, el = document.createElement('div'); el.id = 'hun';
  el.innerHTML = '<canvas></canvas><div class="un"><small>✦ TƯỚNG MỚI ✦</small><h2></h2><p></p><div class="rt"></div><div class="tp">Chạm để tiếp tục</div></div>'; app.appendChild(el);
  const c = el.firstChild, g = c.getContext('2d'), nm = $('h2', el), ds = $('p', el), rt = $('.rt', el); let i = -1, t0 = 0, alive = true, id, hd, cd, qc, pg;
  const next = () => { i++; if (i >= ids.length) { alive = false; el.remove(); done && done(); return }
    id = ids[i]; hd = B.HEROES.find(x => x.id === id) || {}; cd = C.get(id); pg = C.prog(id); const qq = B.HQ ? B.HQ[hd.q] : [hd.q, QC[hd.q]]; qc = qq[1]; el.style.setProperty('--c', qc); el.className = '';
    nm.textContent = hd.n || cd.name; ds.textContent = [cd.title, cd.class].filter(Boolean).join(' · '); rt.textContent = qq[0]; t0 = performance.now(); };
  el.onclick = () => { if ((performance.now() - t0) / 1000 > (RM ? .5 : 1.8)) next() };
  next();
  (function loop(now) {
    if (!alive) return; requestAnimationFrame(loop); if (!hd) return; const t = (now - t0) / 1000, dpr = M.min(2, devicePixelRatio || 1), W = el.clientWidth | 0, H = el.clientHeight | 0; if (!W) return;
    if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr } g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const qi = QI[hd.q] || 0, zm = 1 + (RM ? 0 : .32 * ease(clamp(t / 2.4, 0, 1))), S = M.min(H / 250, W / 190) * zm, fy = H * .68, ap = ease(clamp(t / .7, 0, 1));
    const bg = g.createRadialGradient(W / 2, fy - 60 * S, 10, W / 2, fy - 60 * S, M.max(W, H) * .7); bg.addColorStop(0, qc + 'aa'); bg.addColorStop(.45, qc + '33'); bg.addColorStop(1, '#05030c00'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, fy - 60 * S); const nr = 10 + qi * 3; for (let k = 0; k < nr; k++) { const a = k * TAU / nr + clock * .25; g.globalAlpha = ap * (k % 2 ? .1 : .2); g.fillStyle = qc; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, M.max(W, H), a, a + .07); g.closePath(); g.fill() } g.restore(); g.globalAlpha = 1;
    for (let k = 0; k < 14 + qi * 6; k++) { const ph = (clock * (.12 + (k % 5) * .03) + k * .137) % 1; g.globalAlpha = (1 - ph) * ap * .9; g.fillStyle = k % 3 ? '#fff' : qc; g.beginPath(); g.arc((.12 + (k * .173) % .76) * W + M.sin(clock + k) * 8, fy - ph * H * .6, 1.4 + (k % 3), 0, TAU); g.fill() } g.globalAlpha = 1;
    const stt = t < 1.3 ? 'idle' : t < 2.6 ? 'skill' : 'idle', stS = t < 1.3 ? t : t < 2.6 ? t - 1.3 : t;
    C.draw(g, id, { x: W / 2, y: fy, scale: S, f: 1, t: clock, state: stt, st: stS, aw: pg.aw, asc: pg.asc, max: false, q: RM ? 1 : 2, evo: RM ? 0 : M.max(0, 1 - t / 1.2), alpha: ap });
    el.classList.toggle('s1', t > .9); el.classList.toggle('s2', t > 1.25); el.classList.toggle('s3', t > (RM ? .5 : 1.8));
  })(performance.now());
}
/* ảnh thu nhỏ đúng model của từng tướng (dùng cho kết quả Triệu hồi) */
function thumbs(root) {
  const C = CH(); if (!C || !root) return;
  root.querySelectorAll('[data-hid]').forEach(e => { const id = e.dataset.hid; if (!C.get(id)) return; const p = C.prog(id), cv2 = document.createElement('canvas'), dpr = M.min(2, devicePixelRatio || 1), w = 64, h = 74;
    cv2.width = w * dpr; cv2.height = h * dpr; cv2.style.cssText = `width:${w}px;height:${h}px;display:block;margin:0 auto`; const g = cv2.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    C.draw(g, id, { x: w / 2, y: h - 6, scale: h / 74 * .95, f: 1, t: .5, state: 'idle', st: .5, aw: p.aw, asc: p.asc, max: C.isMax(id, p), q: 1 }); e.textContent = ''; e.appendChild(cv2) });
}

function bind(b) {
  if (B) return; B = b; const s = document.createElement('style'); s.textContent = STYLE; document.head.appendChild(s);
  hh = $('#hhero'); const stage = $('#hstage'), menu = $('#menu'); if (!hh || !stage || !menu) return;
  hh.innerHTML = '<canvas></canvas>'; cv = hh.firstChild; cx = cv.getContext('2d');
  pn = document.createElement('div'); pn.id = 'hpn'; fx = document.createElement('div'); fx.id = 'hfx'; dim = document.createElement('div'); dim.id = 'hdim';
  skb = document.createElement('button'); skb.id = 'hskb'; skb.textContent = '👘'; skb.dataset.a = 'skinb'; skb.title = 'Diện mạo'; skb.setAttribute('aria-label', 'Diện mạo'); skb.style.display = 'none';
  sh = document.createElement('div'); sh.id = 'hsh'; sh.innerHTML = '<div class="bx"></div>';
  stage.append(fx, pn, skb); const sc = $('#hscene'); if (sc) { menu.insertBefore(dim, sc.nextSibling); tint = document.createElement('div'); tint.className = 'ht'; sc.appendChild(tint) } else menu.appendChild(dim);
  menu.appendChild(sh); say = $('#hsay');
  const click = e => { const t = e.target.closest('[data-a]'); if (t) act(t.dataset.a, t.dataset.v) };
  pn.addEventListener('click', click); sh.addEventListener('click', e => { if (e.target === sh) closeSheet(); else click(e) }); skb.addEventListener('click', click);
  hh.addEventListener('click', () => setTimeout(talk, 0));
  requestAnimationFrame(frame);
}
window.DV_SHOW = { bind, cur, play, unlock, thumbs, lines: LINES };
})();
