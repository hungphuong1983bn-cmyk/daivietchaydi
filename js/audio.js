/* Phase 13 — AUDIO ENGINE  (window.DV_AUDIO)
   Toàn bộ âm thanh được TỔNG HỢP bằng WebAudio (không cần file âm thanh) và chia theo nhóm:
     Kiếm · Đao · Quyền · Chưởng · Hỏa · Băng · Lôi · Độc · Phong  (+ chất liệu quái: người / giáp / đá / thú / boss)
   Mixer 8 bus: music · sfx · skill · hit · boss · ui · env · voice — mỗi bus chỉnh riêng, qua bộ nén (limiter) nên không bị vỡ tiếng.
   Chống rối: giới hạn số giọng đồng thời theo bus + ưu tiên (đòn thường < chí mạng < nặng < tuyệt kỹ/boss),
              ngân sách đòn trúng theo khung 70ms, giãn cách tối thiểu theo tên, biến thiên cao độ/pha nhiễu nhỏ để đòn lặp không giống hệt.
   Ducking: Tuyệt kỹ/Boss xuất hiện → nhạc nền hạ nhẹ, bus Kỹ năng nổi, sau đó nhạc trở lại.
   API: init({ctx,snd,mus,store,put}) · play(name,opt) · hit(info) · stage(stage,src,G,opt) · ult(G) · combo(tier) · enemy(e,k) · bossAppear() · legacy(k,gap)
        tone(bus,f,d,type,v,f2) · setVol(bus,v) · getVol(bus) · duck(depth,hold,rel) · stats() · list() · validate() · render(name) */
(function () {
  'use strict';
  const M = Math, R = Math.random;
  const BUS = ['music', 'sfx', 'skill', 'hit', 'boss', 'ui', 'env', 'voice'];
  const CAP = { music: 3, sfx: 8, skill: 7, hit: 9, boss: 4, ui: 6, env: 5, voice: 3 }, HARD = 26;
  const DEF = { music: .30, sfx: .80, skill: .90, hit: .85, boss: 1, ui: .60, env: .50, voice: .80 };
  let cfg = null, gr = null, noiseBuf = null;
  const st = { active: 0, by: {}, dropped: 0, played: 0, last: {}, win: { t: 0, n: 0 }, react: 0 };
  BUS.forEach(b => st.by[b] = 0);
  const fx = () => window.DV_DATA && DV_DATA.skillfx;

  /* ---------- đồ thị âm thanh ---------- */
  function mkNoise(c) {
    const n = c.sampleRate * 2.5 | 0, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = R() * 2 - 1;
    return b;
  }
  function build(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 10; comp.attack.value = .003; comp.release.value = .22;
    const master = c.createGain(); master.gain.value = .9;
    master.connect(comp); comp.connect(c.destination);
    const g = { c, comp, master, bus: {}, nb: mkNoise(c) };
    for (const b of BUS) { const n = c.createGain(); n.gain.value = busGain(b); n.connect(master); g.bus[b] = n }
    return g;
  }
  const vol = b => { const s = cfg && cfg.store && cfg.store(); const v = s && s.mix && s.mix[b]; return v == null ? ((fx() && fx().mix && fx().mix[b] != null) ? fx().mix[b] : DEF[b]) : v };
  const busGain = b => vol(b) * (b === 'music' ? 3.2 : 1);   /* nhạc nền synth rất nhỏ → bù để mức 30% ≈ mức cũ */
  function ensure() {
    if (!cfg) return false;
    const c = cfg.ctx(); if (!c) return false;
    if (!gr || gr.c !== c) { gr = build(c); noiseBuf = gr.nb }
    return true;
  }
  const ready = () => cfg && cfg.snd() && ensure();

  /* ---------- bộ dựng âm: osc / noise / ring ---------- */
  function env(p, t, a, d, v) { p.setValueAtTime(.0001, t); p.linearRampToValueAtTime(v, t + a); p.exponentialRampToValueAtTime(.0001, t + a + d) }
  function osc(o, s) {
    const c = o.c, t = o.t + (s.dt || 0), n = c.createOscillator(), g = c.createGain(), a = s.a || .004, d = s.d || .1;
    n.type = s.ty || 'sine'; n.frequency.setValueAtTime(s.f * o.p, t);
    if (s.f2) n.frequency.exponentialRampToValueAtTime(M.max(18, s.f2 * o.p), t + a + d);
    if (s.det) n.detune.value = s.det;
    let lfo = null;
    if (s.vib) { lfo = c.createOscillator(); const lg = c.createGain(); lfo.frequency.value = s.vib[0]; lg.gain.value = s.vib[1]; lfo.connect(lg); lg.connect(n.frequency); lfo.start(t); lfo.stop(t + a + d + .05) }
    env(g.gain, t, a, d, (s.v || .3) * o.v); n.connect(g);
    let last = g; if (s.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = s.lp; g.connect(f); last = f }
    last.connect(o.out); n.start(t); n.stop(t + a + d + .05);
  }
  function nz(o, s) {
    const c = o.c, t = o.t + (s.dt || 0), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), a = s.a || .003, d = s.d || .1;
    src.buffer = noiseBuf; src.loop = true;
    f.type = s.ty || 'bandpass'; f.Q.value = s.q || 1; f.frequency.setValueAtTime(s.f * o.p, t);
    if (s.f2) f.frequency.exponentialRampToValueAtTime(M.max(30, s.f2 * o.p), t + a + d);
    env(g.gain, t, a, d, (s.v || .3) * o.v); src.connect(f); f.connect(g); g.connect(o.out);
    src.start(t, R() * 1.8); src.stop(t + a + d + .05);
  }
  /* chuỗi âm kim loại / pha lê: nhiều thành phần cao độ không hài hoà */
  function ring(o, fs, s) { s = s || {}; fs.forEach((f, i) => osc(o, { f, ty: 'sine', a: .002, d: (s.d || .25) / (1 + i * .35), v: (s.v || .1) / (1 + i * .45), dt: (s.dt || 0) + (s.sp || 0) * i })) }
  const crackle = (o, n, f, v, span) => { for (let i = 0; i < n; i++) nz(o, { ty: 'highpass', f: f * (.7 + R() * .7), d: .012 + R() * .014, v: v * (.4 + R() * .6), dt: R() * span }) }
  const bubbles = (o, n, v) => { for (let i = 0; i < n; i++) { const f = 240 + R() * 260; osc(o, { f, f2: f * 2.4, d: .07, v: v || .12, dt: i * .05 + R() * .03, a: .006 }) } }

  /* ---------- công thức âm thanh (tên ↔ DV_DATA.skillfx) ---------- */
  const REC = {};
  const def = (name, bus, pri, dur, fn, gap, vr) => { REC[name] = { bus, pri, dur, fn, gap: gap || 0, var: vr } };
  const alias = (n, from, extra) => { const r = REC[from]; REC[n] = Object.assign({}, r, extra || {}) };

  /* KIẾM */
  def('kiem.cast', 'skill', 1, .3, o => { nz(o, { f: 1400, f2: 5200, q: .8, a: .01, d: .11, v: .22 }); osc(o, { f: 1900, f2: 700, d: .1, v: .05 }); ring(o, [2600, 3900], { d: .14, v: .05, dt: .05 }) }, 60);
  def('kiem.cast2', 'skill', 1, .6, o => { REC['kiem.cast'].fn(o); nz(o, { f: 1000, f2: 4200, q: .7, a: .02, d: .16, v: .16, dt: .06 }); ring(o, [1800, 2700, 4300], { d: .3, v: .08, dt: .08 }); osc(o, { f: 150, f2: 70, d: .22, v: .22 }) }, 120);
  def('kiem.travel', 'skill', 0, .4, o => { nz(o, { f: 3000, f2: 1100, q: .6, a: .06, d: .28, v: .09 }); osc(o, { ty: 'triangle', f: 1400, f2: 900, a: .05, d: .3, v: .025, vib: [18, 40] }) }, 180);
  def('kiem.hit', 'hit', 0, .14, o => { nz(o, { f: 3600, f2: 1500, q: 1.2, a: .002, d: .07, v: .28 }); osc(o, { ty: 'triangle', f: 320, f2: 130, d: .08, v: .2 }); nz(o, { ty: 'highpass', f: 6000, d: .02, v: .12 }) }, 40, .09);
  def('kiem.impact', 'hit', 1, .35, o => { ring(o, [1800, 2760, 4100], { d: .22, v: .12 }); nz(o, { f: 5000, d: .03, v: .15 }) }, 50);
  def('kiem.impact2', 'hit', 2, .6, o => { ring(o, [1200, 1830, 2750, 4200], { d: .4, v: .14 }); osc(o, { f: 90, f2: 45, d: .25, v: .3 }); nz(o, { ty: 'highpass', f: 3000, d: .12, v: .14 }) }, 80);
  def('crit.kiem', 'hit', 2, .5, o => { ring(o, [2400, 3600, 5400], { d: .35, v: .14 }); osc(o, { f: 140, f2: 60, d: .2, v: .34 }); nz(o, { ty: 'highpass', f: 5000, d: .06, v: .2 }) }, 70);

  /* LÔI */
  def('loi.charge', 'skill', 1, .6, o => { osc(o, { ty: 'sawtooth', f: 70, f2: 260, a: .3, d: .2, v: .1, lp: 900 }); for (let i = 0; i < 7; i++) nz(o, { ty: 'highpass', f: 2500, d: .025, v: .15, dt: i * .06 + R() * .03 }) }, 250);
  def('loi.crack', 'hit', 1, .3, o => { nz(o, { ty: 'highpass', f: 900, f2: 2500, a: .002, d: .05, v: .4 }); nz(o, { f: 2500, q: 1, d: .16, v: .2, dt: .02 }); osc(o, { ty: 'square', f: 1500, f2: 180, d: .14, v: .09 }) }, 55);
  def('loi.thunder', 'skill', 2, 1, o => { nz(o, { ty: 'highpass', f: 1200, d: .06, v: .3 }); nz(o, { ty: 'lowpass', f: 700, f2: 90, q: .7, a: .01, d: .8, v: .45, dt: .02 }); osc(o, { f: 60, f2: 32, d: .6, v: .4, dt: .02 }) }, 90);
  def('loi.thunder2', 'skill', 2, 1.2, o => { REC['loi.thunder'].fn(o); nz(o, { ty: 'lowpass', f: 500, f2: 70, a: .04, d: .9, v: .3, dt: .18 }); osc(o, { f: 48, f2: 28, d: .8, v: .35, dt: .1 }); osc(o, { ty: 'square', f: 1800, f2: 220, d: .12, v: .07, dt: .05 }) }, 120);
  def('crit.loi', 'hit', 2, .5, o => { REC['loi.crack'].fn(o); ring(o, [3200, 4800], { d: .2, v: .08, dt: .03 }); osc(o, { f: 110, f2: 45, d: .25, v: .3 }) }, 70);

  /* CHƯỞNG / QUYỀN */
  def('chuong.charge', 'skill', 1, .45, o => { osc(o, { f: 120, f2: 420, a: .22, d: .1, v: .18 }); nz(o, { f: 300, f2: 900, a: .2, d: .12, v: .1 }) }, 200);
  def('chuong.cast', 'skill', 1, .4, o => { nz(o, { f: 350, f2: 1500, q: .7, a: .02, d: .2, v: .25 }); osc(o, { f: 220, f2: 110, d: .2, v: .2 }) }, 100);
  def('chuong.hit', 'hit', 1, .25, o => { osc(o, { f: 160, f2: 55, d: .12, v: .38 }); nz(o, { ty: 'lowpass', f: 1200, f2: 400, d: .07, v: .22 }); osc(o, { ty: 'triangle', f: 480, f2: 260, d: .06, v: .08 }) }, 45, .08);
  def('chuong.impact', 'skill', 2, .7, o => { osc(o, { f: 110, f2: 32, d: .45, v: .5 }); nz(o, { ty: 'lowpass', f: 2200, f2: 180, a: .01, d: .4, v: .35 }); ring(o, [880, 1320], { d: .3, v: .05 }) }, 110);
  def('crit.chuong', 'hit', 2, .45, o => { REC['chuong.hit'].fn(o); ring(o, [1500, 2250, 3000], { d: .3, v: .1 }); nz(o, { ty: 'highpass', f: 4000, d: .05, v: .15 }) }, 70);
  def('quyen.hit', 'hit', 1, .25, o => { osc(o, { f: 140, f2: 50, d: .14, v: .5 }); nz(o, { ty: 'lowpass', f: 900, d: .06, v: .25 }); osc(o, { ty: 'triangle', f: 300, f2: 120, d: .05, v: .1 }) }, 45, .08);
  def('quyen.shock', 'skill', 2, .8, o => { osc(o, { f: 80, f2: 26, d: .55, v: .55 }); nz(o, { ty: 'lowpass', f: 1500, f2: 120, d: .5, v: .35 }); osc(o, { ty: 'sawtooth', f: 60, f2: 30, d: .4, v: .1, lp: 300 }); nz(o, { f: 2000, f2: 600, d: .15, v: .1 }) }, 110);

  /* HỎA */
  def('hoa.whoosh', 'skill', 1, .45, o => { nz(o, { f: 500, f2: 1900, q: .5, a: .05, d: .3, v: .26 }); nz(o, { ty: 'lowpass', f: 1200, d: .35, v: .12 }); osc(o, { ty: 'sawtooth', f: 180, f2: 320, d: .25, v: .04, lp: 700 }) }, 100);
  def('hoa.burn', 'env', 0, .5, o => { crackle(o, 8, 3200, .22, .4) }, 200);
  def('hoa.hit', 'hit', 1, .3, o => { crackle(o, 4, 3200, .2, .12); osc(o, { f: 150, f2: 60, d: .1, v: .3 }); nz(o, { f: 1500, f2: 600, d: .1, v: .2 }) }, 50, .09);
  def('hoa.explode', 'skill', 2, .8, o => { nz(o, { ty: 'lowpass', f: 3500, f2: 130, a: .008, d: .6, v: .5 }); osc(o, { f: 95, f2: 30, d: .55, v: .55 }); nz(o, { ty: 'highpass', f: 2000, d: .1, v: .2 }); crackle(o, 5, 2800, .2, .35) }, 110);
  def('crit.hoa', 'hit', 2, .55, o => { REC['hoa.hit'].fn(o); nz(o, { ty: 'lowpass', f: 2600, f2: 200, d: .3, v: .35 }); ring(o, [2000, 3000], { d: .15, v: .06 }) }, 70);

  /* PHONG */
  def('phong.whoosh', 'skill', 0, .4, o => { nz(o, { f: 800, f2: 2600, q: .45, a: .06, d: .26, v: .22 }); nz(o, { ty: 'highpass', f: 4000, d: .18, v: .05 }) }, 90);
  def('phong.slash', 'hit', 0, .15, o => { nz(o, { ty: 'highpass', f: 3500, f2: 7500, q: .5, a: .002, d: .07, v: .24 }); osc(o, { f: 1800, f2: 900, d: .07, v: .04 }) }, 40, .1);
  def('phong.burst', 'hit', 1, .3, o => { nz(o, { ty: 'lowpass', f: 2000, f2: 300, d: .18, v: .28 }); osc(o, { f: 260, f2: 110, d: .14, v: .2 }) }, 60);
  def('crit.phong', 'hit', 2, .4, o => { REC['phong.slash'].fn(o); ring(o, [3000, 4500], { d: .2, v: .07 }); osc(o, { f: 130, f2: 55, d: .2, v: .3 }) }, 70);

  /* ĐAO */
  def('dao.swing', 'skill', 1, .4, o => { nz(o, { ty: 'lowpass', f: 1500, f2: 280, q: .6, a: .03, d: .26, v: .3 }); osc(o, { ty: 'sawtooth', f: 150, f2: 62, d: .22, v: .1, lp: 500 }) }, 100);
  def('dao.hit', 'hit', 1, .35, o => { nz(o, { f: 1200, f2: 300, d: .1, v: .35 }); osc(o, { f: 125, f2: 42, d: .24, v: .5 }); osc(o, { ty: 'square', f: 90, f2: 50, d: .12, v: .08, lp: 400 }); nz(o, { ty: 'highpass', f: 4000, d: .02, v: .15 }) }, 45, .08);
  def('dao.shock', 'skill', 2, .8, o => { nz(o, { ty: 'lowpass', f: 900, f2: 90, d: .55, v: .4 }); osc(o, { f: 70, f2: 24, d: .6, v: .55 }) }, 110);
  def('crit.dao', 'hit', 2, .5, o => { REC['dao.hit'].fn(o); ring(o, [1100, 1650], { d: .3, v: .08 }); osc(o, { f: 58, f2: 34, d: .4, v: .4 }) }, 70);

  /* BĂNG */
  def('bang.freeze', 'skill', 1, .5, o => { nz(o, { ty: 'highpass', f: 5500, f2: 2000, q: .4, d: .35, v: .14 }); osc(o, { f: 2200, f2: 900, d: .35, v: .08, vib: [9, 60] }); ring(o, [2093, 3136], { d: .3, v: .05 }) }, 100);
  def('bang.crack', 'hit', 1, .25, o => { for (let i = 0; i < 3; i++)nz(o, { f: 3800, q: 6, d: .02, v: .22, dt: i * .03 + R() * .01 }); osc(o, { f: 2400, f2: 1800, d: .05, v: .05 }) }, 50, .08);
  def('bang.shatter', 'skill', 2, .6, o => { nz(o, { ty: 'highpass', f: 4500, d: .18, v: .28 }); for (let i = 0; i < 4; i++)osc(o, { f: 3500 + R() * 3000, d: .2, v: .07, dt: i * .015, a: .002 }); osc(o, { f: 600, f2: 200, d: .1, v: .12 }) }, 90);
  def('bang.crystal', 'env', 0, .8, o => { ring(o, [2093, 2637, 3136, 4186], { d: .6, v: .06, sp: .03 }) }, 150);
  def('crit.bang', 'hit', 2, .5, o => { REC['bang.shatter'].fn(o); REC['bang.crystal'].fn(o) }, 70);

  /* ĐỘC */
  def('doc.energy', 'skill', 1, .5, o => { osc(o, { f: 210, f2: 300, a: .1, d: .35, v: .14, vib: [7, 25] }); osc(o, { ty: 'sawtooth', f: 140, det: 15, a: .1, d: .35, v: .07, lp: 600 }); nz(o, { f: 700, q: 2, d: .3, v: .08 }) }, 100);
  def('doc.bubble', 'env', 0, .4, o => { bubbles(o, 4, .13) }, 120);
  def('doc.burst', 'hit', 1, .3, o => { nz(o, { f: 1100, f2: 500, q: 1.2, d: .14, v: .25 }); bubbles(o, 3, .12); osc(o, { f: 200, f2: 70, d: .1, v: .2 }) }, 50, .1);
  def('doc.toxic', 'skill', 2, .6, o => { osc(o, { f: 170, f2: 230, a: .05, d: .3, v: .12, vib: [6, 20] }); nz(o, { ty: 'lowpass', f: 600, d: .3, v: .2 }); osc(o, { ty: 'sawtooth', f: 90, f2: 55, d: .3, v: .18, lp: 350 }); bubbles(o, 4, .1) }, 110);
  def('crit.doc', 'hit', 2, .45, o => { REC['doc.burst'].fn(o); ring(o, [1200, 1530, 2200], { d: .25, v: .07 }) }, 70);

  /* HIỆU ỨNG CHUNG */
  def('fx.riser', 'skill', 2, .55, o => { nz(o, { f: 250, f2: 4500, q: .9, a: .38, d: .08, v: .28 }); osc(o, { ty: 'sawtooth', f: 90, f2: 500, a: .38, d: .08, v: .1, lp: 1500 }); ring(o, [1800, 2700], { dt: .3, d: .2, v: .04 }) }, 300);
  def('fx.cine', 'skill', 2, 1.3, o => { osc(o, { f: 48, f2: 22, d: 1.1, v: .7 }); nz(o, { ty: 'lowpass', f: 1400, f2: 70, d: 1, v: .5 }); [110, 165, 220].forEach(f => osc(o, { ty: 'sawtooth', f, a: .02, d: .7, v: .05, lp: 600 })); nz(o, { ty: 'highpass', f: 3000, d: .2, v: .15 }) }, 400);
  def('fx.heavy', 'hit', 2, .5, o => { osc(o, { f: 58, f2: 34, d: .4, v: .55 }); nz(o, { ty: 'lowpass', f: 220, d: .22, v: .25 }) }, 90);
  def('fx.crit', 'hit', 2, .3, o => { ring(o, [2800, 4200], { d: .2, v: .1 }); osc(o, { f: 160, f2: 70, d: .14, v: .28 }); nz(o, { ty: 'highpass', f: 5500, d: .04, v: .15 }) }, 70);

  /* CHẤT LIỆU QUÁI */
  def('mat.flesh', 'hit', 0, .15, o => { osc(o, { f: 190, f2: 85, d: .07, v: .25 }); nz(o, { ty: 'lowpass', f: 900, d: .045, v: .2 }) }, 40, .12);
  def('mat.metal', 'hit', 1, .3, o => { ring(o, [740, 1190, 1780, 2430], { d: .22, v: .1 }); nz(o, { f: 3000, d: .025, v: .2 }); osc(o, { f: 260, f2: 180, d: .06, v: .1 }) }, 45, .1);
  def('mat.stone', 'hit', 1, .3, o => { nz(o, { f: 420, q: .7, d: .1, v: .35 }); osc(o, { f: 105, f2: 58, d: .13, v: .3 }); for (let i = 0; i < 2; i++)nz(o, { ty: 'highpass', f: 2500, d: .03, v: .12, dt: .03 + i * .03 }) }, 50, .1);
  def('mat.beast', 'hit', 1, .35, o => { osc(o, { f: 135, f2: 68, d: .1, v: .3 }); osc(o, { ty: 'sawtooth', f: 120, f2: 60, a: .02, d: .22, v: .14, lp: 520 }); nz(o, { ty: 'lowpass', f: 700, d: .05, v: .15 }) }, 60, .14);
  def('mat.boss', 'boss', 2, .5, o => { osc(o, { f: 65, f2: 30, d: .4, v: .55 }); nz(o, { ty: 'lowpass', f: 450, f2: 120, d: .3, v: .3 }); ring(o, [330, 520, 780], { d: .3, v: .05 }) }, 60, .05);

  /* BOSS */
  def('boss.react', 'boss', 2, .5, o => { osc(o, { ty: 'sawtooth', f: 105, f2: 52, a: .03, d: .4, v: .2, lp: 700 }); nz(o, { ty: 'lowpass', f: 600, f2: 150, d: .3, v: .15 }) }, 500, .05);
  def('boss.roar', 'boss', 2, .9, o => { osc(o, { ty: 'sawtooth', f: 85, f2: 45, a: .08, d: .7, v: .28, lp: 900 }); osc(o, { ty: 'sawtooth', f: 90, f2: 48, det: 20, d: .7, v: .16, lp: 700 }); nz(o, { f: 500, f2: 200, d: .6, v: .2 }) }, 700, .05);
  def('boss.shoot', 'boss', 1, .3, o => { nz(o, { f: 900, f2: 2400, d: .15, v: .18 }); osc(o, { ty: 'triangle', f: 400, f2: 180, d: .15, v: .12 }) }, 120);
  def('boss.nova', 'boss', 2, .8, o => { osc(o, { ty: 'sawtooth', f: 70, f2: 210, a: .2, d: .2, v: .22, lp: 900 }); nz(o, { f: 300, f2: 1500, a: .2, d: .35, v: .2 }); osc(o, { f: 55, f2: 35, d: .3, v: .4, dt: .2 }) }, 400);
  def('boss.spiral', 'boss', 1, .6, o => { osc(o, { f: 330, f2: 500, a: .05, d: .5, v: .12, vib: [14, 90] }); nz(o, { f: 1200, d: .4, v: .08 }) }, 500);
  def('boss.dash', 'boss', 1, .4, o => { nz(o, { f: 400, f2: 2800, a: .05, d: .3, v: .26 }); osc(o, { ty: 'sawtooth', f: 100, f2: 250, d: .25, v: .1, lp: 700 }) }, 150);
  def('boss.warn', 'boss', 1, .6, o => { osc(o, { ty: 'sawtooth', f: 90, f2: 140, a: .3, d: .2, v: .12, lp: 500 }); osc(o, { ty: 'square', f: 220, d: .4, v: .04, vib: [10, 20], lp: 600 }) }, 300);
  def('boss.slam', 'boss', 2, .8, o => { osc(o, { f: 55, f2: 24, d: .5, v: .65 }); nz(o, { ty: 'lowpass', f: 800, f2: 80, d: .45, v: .4 }); osc(o, { f: 90, f2: 50, d: .2, v: .25 }) }, 200);
  def('boss.rain', 'boss', 1, .6, o => { nz(o, { f: 1000, f2: 300, d: .4, v: .2 }); osc(o, { f: 1400, f2: 400, d: .4, v: .05 }) }, 300);
  def('boss.summon', 'boss', 2, 1, o => { osc(o, { ty: 'sawtooth', f: 120, f2: 60, d: .7, v: .14, lp: 600, vib: [5, 10] }); ring(o, [330, 495, 660], { dt: .1, d: .5, v: .05 }); nz(o, { f: 500, f2: 1500, a: .3, d: .4, v: .08 }) }, 500);
  def('boss.heal', 'sfx', 0, .6, o => { ring(o, [880, 1175, 1568], { d: .5, v: .06, sp: .08 }) }, 400);
  def('boss.shield', 'boss', 1, .7, o => { ring(o, [440, 660, 990], { d: .6, v: .07 }); osc(o, { f: 300, f2: 600, d: .2, v: .08 }) }, 400);
  def('boss.appear', 'boss', 2, 1.8, o => { osc(o, { ty: 'sawtooth', f: 65, f2: 50, a: .3, d: 1.3, v: .3, lp: 450 }); osc(o, { ty: 'sawtooth', f: 98, f2: 73, a: .3, d: 1.2, v: .22, lp: 500, dt: .35 }); nz(o, { ty: 'lowpass', f: 200, f2: 700, a: .6, d: .8, v: .14 }); osc(o, { f: 40, d: 1.4, v: .4 }) }, 1500, .02);
  def('boss.die', 'boss', 2, 1.6, o => { REC['fx.cine'].fn(o); REC['fx.crit'].fn(o); REC['boss.roar'].fn(o) }, 1500);

  /* COMBO */
  const PEN = [523, 587, 659, 784, 880, 988, 1175, 1318];
  [0, 1, 2, 3, 4].forEach(i => def('combo.' + (i + 1), 'sfx', 1, .9, o => {
    const n = 3 + i, b = i * 1; for (let k = 0; k < n; k++)osc(o, { ty: 'triangle', f: PEN[M.min(7, b + k)], d: .25, a: .004, v: .12, dt: k * .06 });
    if (i >= 2) osc(o, { f: 70, f2: 38, d: .3, v: .35 }); if (i >= 3) ring(o, [1568, 2093, 2637], { d: .5, v: .06, dt: n * .06 });
    if (i >= 4) { [220, 277, 330].forEach(f => osc(o, { ty: 'sawtooth', f, d: .7, v: .05, lp: 700, dt: .1 })) }
  }, 200));

  /* GIAO DIỆN (thay các tiếng "beep" cũ) */
  def('ui.pick', 'ui', 0, .15, o => { osc(o, { f: 880, f2: 1320, d: .07, v: .1 }) }, 40, .02);
  def('ui.levelup', 'ui', 1, .9, o => { [523, 659, 784, 1047].forEach((f, i) => osc(o, { ty: 'triangle', f, d: .22, v: .12, dt: i * .09 })); ring(o, [2093, 3136], { dt: .25, d: .4, v: .04 }); nz(o, { f: 600, f2: 3000, a: .2, d: .15, v: .05 }) }, 150, .01);
  def('ui.win', 'ui', 1, 1.1, o => { [523, 659, 784, 1047, 1319].forEach((f, i) => osc(o, { ty: 'triangle', f, d: .28, v: .13, dt: i * .1 })); ring(o, [2093, 2637, 3136], { dt: .45, d: .6, v: .05 }) }, 200, .01);
  def('ui.lose', 'ui', 1, 1.1, o => { [392, 330, 262, 196].forEach((f, i) => osc(o, { ty: 'sawtooth', f, d: .3, v: .07, dt: i * .12, lp: 900 })) }, 200, .01);
  def('ui.hurt', 'hit', 1, .3, o => { osc(o, { f: 150, f2: 55, d: .2, v: .4 }); nz(o, { ty: 'lowpass', f: 700, d: .1, v: .2 }) }, 100, .06);

  const LEG = { s: 'kiem.cast', z: 'loi.charge', b: 'chuong.cast', h: 'mat.flesh', p: 'ui.pick', u: 'ui.levelup', d: 'ui.hurt', w: 'boss.appear', win: 'ui.win', lose: 'ui.lose' };

  /* ---------- phát âm ---------- */
  function slot(bus, pri) {
    if (st.active >= HARD) return false;
    if (st.by[bus] >= CAP[bus]) { if (pri < 2 || st.by[bus] >= CAP[bus] + 2) return false }
    return true;
  }
  function play(name, opt) {
    opt = opt || {};
    const r = REC[name]; if (!r || !ready()) return false;
    const bus = opt.bus || r.bus, pri = opt.pri != null ? opt.pri : r.pri, now = performance.now();
    if (!opt.force && r.gap && now - (st.last[name] || 0) < r.gap) return false;
    if (!opt.force && !slot(bus, pri)) { st.dropped++; return false }
    st.last[name] = now; st.active++; st.by[bus]++; st.played++;
    const vr = r.var != null ? r.var : .06, dl = opt.delay || 0;
    r.fn({ c: gr.c, out: gr.bus[bus], t: gr.c.currentTime + dl + .004, p: (opt.p || 1) * (1 + (R() * 2 - 1) * vr), v: opt.v || 1 });
    setTimeout(() => { st.active--; st.by[bus]-- }, (r.dur + dl) * 1000 + 40);
    return true;
  }

  /* tone tự do (nhạc nền): đi qua bus được chỉ định */
  function tone(bus, f, d, ty, v, f2) {
    if (!cfg || !cfg.snd() || !ensure()) return;
    const c = gr.c, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = ty || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v || .06, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(gr.bus[bus || 'sfx']); o.start(t); o.stop(t + d + .02);
  }

  /* ---------- ducking / nhấn nhạ ---------- */
  function duck(depth, hold, rel) {
    if (!ensure()) return;
    const g = gr.bus.music.gain, t = gr.c.currentTime, base = busGain('music');
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(base * depth, t + .08);
    g.setValueAtTime(base * depth, t + hold); g.linearRampToValueAtTime(base, t + hold + rel);
  }
  function boost(bus, k, hold) {
    if (!ensure()) return;
    const g = gr.bus[bus].gain, t = gr.c.currentTime, base = busGain(bus);
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(base * k, t + .06);
    g.setValueAtTime(base * k, t + hold); g.linearRampToValueAtTime(base, t + hold + .6);
  }

  /* ---------- lớp cao: kỹ năng / va chạm / tuyệt kỹ / boss ---------- */
  const SFXD = (src, G) => { const f = fx(); return f && f.resolve ? f.resolve(src, G) : null };
  function stage(name, src, G, opt) {           /* name: cast|charge|travel|impact|critical|ultimate */
    const s = SFXD(src, G); if (!s) return false;
    const k = s[name + 'SFX']; if (!k) return false;
    return play(k, Object.assign({ bus: 'skill' }, opt));
  }
  /* ĐÒN TRÚNG: info = { src, e, crit, dmg, G, theme } */
  function hit(info) {
    if (!ready()) return;
    const e = info.e, G = info.G, f = fx(), s = SFXD(info.src, G), boss = !!(e.boss || e.mb), ult = info.src === 'ult';
    const heavy = info.dmg >= M.max(60, e.mhp * .14) || ult, crit = !!info.crit, now = performance.now();
    if (now - st.win.t > 70) { st.win.t = now; st.win.n = 0 }
    const must = crit || heavy || boss;
    if (!must && st.win.n >= 2) return;          /* ngân sách: đòn thường tối đa 2 giọng / 70ms */
    if (must && st.win.n >= 5) return;
    st.win.n++;
    const mat = f && f.materialOf ? f.materialOf(e, info.theme) : 'flesh';
    const big = boss ? 1.15 : 1;
    if (s && s.hitSFX && (!ult || st.win.n <= 1)) play(s.hitSFX, { v: ult ? .6 : 1 });
    if (!(ult && st.win.n > 2)) play('mat.' + (mat === 'boss' ? 'boss' : mat), { v: big, delay: .01 });
    if (crit) play(s && s.criticalSFX || 'fx.crit', { delay: .005 });
    if (heavy && !ult) play('fx.heavy', { v: boss ? 1.1 : .9, delay: .015 });
    if (boss && (crit || heavy) && now - st.react > 650) {      /* Boss phản ứng khi dính đòn mạnh */
      st.react = now; const rb = f && f.bossReact || {};
      play(rb[s && s.element] || rb.default || 'boss.react', { delay: .05 });
    }
  }
  function ult(G) {                              /* chuỗi điện ảnh: tụ lực → tung chiêu → chạm đất */
    if (!ready()) return;
    const s = SFXD('ult', G); if (!s) return;
    duck(.35, 1.5, .9); boost('skill', 1.15, 1.6);
    play(s.chargeSFX || 'fx.riser', { force: true });
    play(s.castSFX, { delay: .26, force: true });
    play(s.impactSFX, { delay: .36, force: true, pri: 2 });
    play(s.ultimateSFX || 'fx.cine', { delay: .38, force: true });
  }
  function bossAppear() { if (!ready()) return; duck(.5, 1.5, .9); play('boss.appear', { force: true }) }
  function enemy(e, k) {
    if (!ready()) return;
    const m = fx() && fx().enemyAbility; const n = m && m[k]; if (!n) return;
    const big = e.boss || e.mb;
    if (!big && (k === 'summon' || k === 'heal' || k === 'shield' || k === 'shoot') && st.by.boss > 1) return;   /* quái thường: nhỏ tiếng, nhường Boss */
    play(n, { v: big ? 1 : .5, pri: big ? 2 : 0, bus: big ? 'boss' : 'sfx' });
  }
  function combo(tier) { if (!ready()) return; play('combo.' + M.min(5, M.max(1, tier)), { force: true }); if (tier >= 4) duck(.6, .6, .5) }

  /* ---------- tương thích âm thanh cũ ---------- */
  function legacy(k, gap) {
    if (!cfg) return false;
    if (!cfg.snd()) return true;
    const n = LEG[k]; if (!n || !ensure()) return false;
    const now = performance.now(), key = 'L' + k;
    if (gap && now - (st.last[key] || 0) < gap) return true;
    st.last[key] = now; play(n); return true;
  }

  /* ---------- cài đặt âm lượng ---------- */
  function setVol(b, v) {
    v = M.max(0, M.min(1, v)); const s = cfg && cfg.store && cfg.store(); if (!s) return;
    s.mix = s.mix || {}; s.mix[b] = v; if (gr && gr.bus[b]) { const t = gr.c.currentTime; gr.bus[b].gain.cancelScheduledValues(t); gr.bus[b].gain.setTargetAtTime(busGain(b), t, .03) }
    if (cfg.put) cfg.put();
  }
  const getVol = b => vol(b);
  function settingsHtml() {
    const L = (fx() && fx().mixLabel) || {};
    return BUS.filter(b => b !== 'voice' && b !== 'env').map(b => `<div class="row" style="padding:5px 0;gap:8px"><span style="min-width:104px">${L[b] || b}</span><input type="range" min="0" max="100" step="5" value="${M.round(vol(b) * 100)}" data-vol="${b}" style="flex:1;accent-color:#ffd978"><b data-volv="${b}" style="min-width:34px;text-align:right;color:#ffd978">${M.round(vol(b) * 100)}%</b></div>`).join('');
  }
  function bindUI() {
    if (bindUI.k) return; bindUI.k = 1;
    document.addEventListener('input', e => {
      const t = e.target; if (!t || !t.dataset || !t.dataset.vol) return;
      setVol(t.dataset.vol, t.value / 100);
      const l = document.querySelector('[data-volv="' + t.dataset.vol + '"]'); if (l) l.textContent = t.value + '%';
      if (t.dataset.vol !== 'music') { clearTimeout(bindUI.t); bindUI.t = setTimeout(() => play(t.dataset.vol === 'ui' ? 'ui.pick' : t.dataset.vol === 'boss' ? 'boss.react' : t.dataset.vol === 'hit' ? 'chuong.hit' : t.dataset.vol === 'skill' ? 'kiem.cast' : 'kiem.hit', { force: true }), 120) }
    });
  }

  /* ---------- kiểm tra / dựng thử ngoại tuyến ---------- */
  function list() { return Object.keys(REC) }
  function validate() {                          /* mọi tên SFX trong SkillData đều phải có công thức */
    const f = fx(), miss = [], seen = new Set(), chk = (o, w) => { for (const k in o) if (/SFX$/.test(k) && o[k] && !REC[o[k]] && !seen.has(o[k])) { seen.add(o[k]); miss.push(w + ':' + o[k]) } };
    if (!f) return ['no skillfx'];
    for (const id in f.skills) { chk(f.skills[id], id); if (f.skills[id].evo) chk(f.skills[id].evo, id + '.evo') }
    for (const id in f.ults) chk(f.ults[id], 'ult.' + id);
    for (const k in f.bossReact) if (!REC[f.bossReact[k]]) miss.push('bossReact:' + f.bossReact[k]);
    for (const k in f.enemyAbility) if (!REC[f.enemyAbility[k]]) miss.push('ability:' + f.enemyAbility[k]);
    ['mat.flesh', 'mat.metal', 'mat.stone', 'mat.beast', 'mat.boss'].forEach(n => { if (!REC[n]) miss.push(n) });
    return miss;
  }
  async function render(name, opt) {            /* dựng một âm ra mảng mẫu (không phát ra loa) — dùng cho test */
    const sr = 22050, len = sr * 2, oc = new OfflineAudioContext(1, len, sr), save = gr, g = build(oc);
    gr = g; noiseBuf = g.nb; const r = REC[name]; if (!r) { gr = save; noiseBuf = save && save.nb; return null }
    r.fn({ c: oc, out: g.bus[r.bus], t: .01, p: 1, v: (opt && opt.v) || 1 });
    const buf = await oc.startRendering(); gr = save; noiseBuf = save && save.nb;
    return buf.getChannelData(0);
  }

  window.DV_AUDIO = {
    ok: () => true, init: c => { cfg = c }, play, hit, stage, ult, combo, enemy, bossAppear, legacy, tone, duck, boost,
    setVol, getVol, settingsHtml, bindUI, list, validate, render, BUS,
    stats: () => ({ active: st.active, by: Object.assign({}, st.by), dropped: st.dropped, played: st.played }),
    recipes: REC
  };
})();
