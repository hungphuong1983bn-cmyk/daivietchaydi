/* Phase 16 — Khu mẫu "Cổ Trấn Thác Ngàn" (window.DV_TOWN)
 * Bản đồ dựng tay (set-piece) đặt trong thế giới vô hạn của js/environment.js: sông có CẦU GỖ, THÁC NƯỚC, CỔ TRẤN.
 * Toạ độ tác giả tính theo ô 64px; gốc (0,0) = điểm xuất phát (đồng cỏ phía nam), sông chảy ngang ở y≈-6 ô, trấn ở phía bắc.
 *
 * Gắn vào engine bằng vài hook nhỏ (đánh dấu "Phase 16" trong environment.js):
 *   create(id,E,H)  tạo khu từ dữ liệu envAreas[...][9]          ob(gx,gy)  va chạm theo ô (undefined = ngoài khu → dùng sinh ngẫu nhiên)
 *   collect(...)    đẩy vật thể y-sort vào danh sách vẽ           drawProp   vẽ vật thể + phần động (đèn lồng, thác, thuyền)
 *   drawGround      nền bake theo mảnh 512px + nước chảy         update/foe tốc độ khi lội nước (cầu gỗ thì không chậm)
 *   lights          nguồn sáng đèn lồng cho lớp ánh sáng đêm/hoàng hôn
 * Không đổi sát thương, AI, quái, điều kiện qua màn. Bỏ phần tử thứ 10 của envAreas hoặc xoá thẻ <script> là game về như cũ.
 */
(function () {
  'use strict';
  const ART = window.DV_TOWN_ART; if (!ART) return;
  const M = Math, TAU = M.PI * 2, C = 64, CH = 512;
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const NL = { night: 1, dusk: .85, dawn: .55, day: .3 };
  const REG = {};

  /* ======================= BỐ CỤC "cotran" (đơn vị: ô) ======================= */
  REG.cotran = {
    name: 'Cổ Trấn Thác Ngàn',
    box: [-21, -27, 27, -1.5],                               // vùng khu mẫu: [x0,y0,x1,y1] — trong vùng này tắt sinh đá/cây/vùng bùn ngẫu nhiên
    river: [[-14, -9.3, 3.0], [-11, -8.9, 3.8], [-8, -8, 3.1], [-5, -6.9, 2.8], [-2.5, -6.2, 2.6], [0, -6, 2.6], [3, -6.2, 2.6], [6.5, -6.9, 2.7],
      [10.5, -6.3, 2.9], [14.5, -5.4, 3.0], [18.5, -5.6, 3.1], [23, -6.4, 3.2]],
    pool: [-13, -9.4, 3.2, 1.9],                             // hồ dưới chân thác: x, y, rx, ry
    bridge: { x: 0, y0: -8, y1: -4, hw: 56 / C },            // cầu gỗ bắc ngang sông (trục bắc–nam)
    cliff: { x: -13, y: -10 },                               // chân vách thác
    keBank: [-6.5, 17],                                      // đoạn kè đá bờ bắc (x từ–đến)
    street: [[[0, -4.6], [0, -9.5]], [[0, -9.5], [0, -22]]], // đường lát đá chính (rộng 3.6 ô)
    cross: [[-11.5, -15.2], [13.5, -15.2]],
    plaza: [0, -15.2, 3.3],
    dirt: [[[0, 0.4], [.15, -1.8], [-.1, -3.4], [0, -4.6]], [[.1, -2], [4.5, -2.6], [8.5, -3.6], [11, -4.4]], [[-.1, -2.3], [-4.5, -2.9], [-8.5, -3.8]]],
    objects: [
      /* [asset, x, baseY, biến thể, tùy chọn] — baseY = mép chân sprite */
      ['gate', 0, -9.3, 0],
      ['dinh', 0, -22.6, 0, { sw: 5 }],
      ['pagoda', 13.6, -18.2, 0],
      ['well', 0, -15.2, 0],
      ['shop', -4.9, -11.2, 0], ['shop', 4.9, -11.2, 2], ['shop', -4.9, -14.4, 1], ['shop', 4.9, -14.4, 0], ['shop', -4.9, -17.8, 2], ['shop', 4.9, -17.8, 1],
      ['wide', -10, -12.6, 0], ['wide', 10.2, -12.6, 1], ['wide', -10.2, -17.4, 1], ['wide', 9.6, -22, 0], ['wide', -9.8, -22.4, 0],
      ['stall', -2.3, -13, 0], ['stall', 2.4, -13.1, 1], ['stall', -2.6, -17.6, 2], ['stall', 2.6, -17.7, 0],
      ['lamp', -2.5, -10.2], ['lamp', 2.5, -10.2], ['lamp', -2.5, -12.4], ['lamp', 2.5, -12.4], ['lamp', -3.4, -15.2], ['lamp', 3.4, -15.2], ['lamp', 0, -18.4], ['lamp', -2.6, -20.8], ['lamp', 2.6, -20.8],
      ['peach', -7.2, -14.9, 0], ['peach', 7.4, -15, 1], ['peach', -3.4, -19.9, 1], ['peach', 3.5, -20, 0], ['peach', 12.4, -13, 0], ['peach', -13.2, -15.8, 1],
      ['bamboo', -6.7, -9.3, 0], ['bamboo', -8.2, -10.4, 1], ['bamboo', -5.6, -10.1, 1], ['bamboo', 16.8, -9.8, 0], ['bamboo', 18.4, -10.6, 1], ['bamboo', 15.4, -10.3, 1], ['bamboo', -15.5, -13, 0],
      ['boat', 5.6, -6, 0], ['cliff', -13, -10, 0],
      ['stall', 7.8, -8.6, 2], ['lamp', 6.9, -8.3], ['lamp', -3.9, -8.4]
    ],
    trees: [                                                 // cây có sẵn của engine (liễu/sồi/bụi) đặt theo ô — ['willow', gx, gy]
      ['willow', -5, -9], ['willow', -2.6, -8.6], ['willow', 3, -8.6], ['willow', 5.6, -8.6], ['willow', 9.4, -8.2], ['willow', 12.6, -7.6], ['willow', 15.5, -7.2],
      ['willow', -4.2, -4.6], ['willow', 4.2, -4.2], ['willow', 7.6, -4.6], ['willow', 13, -3.6], ['willow', -11, -6.6],
      ['oak', -7.2, -2.8], ['oak', 8.6, -2.6], ['oak', -14, -3.6], ['oak', 18, -3.4], ['oak', 22, -9.5], ['oak', -19.5, -8.2],
      ['bush', -2.6, -3.4], ['bush', 2.9, -3.2], ['bush', 6.2, -2.4], ['bush', -9.5, -3.1], ['bush', 10.8, -2.2], ['bush', -11.8, -4.6], ['bush', 20.2, -3.1],
      ['rock', -13.5, -7.2], ['rock', -12.6, -7.0], ['boulder', -16.8, -8.8], ['rock', 21, -4.4], ['rock', 3.7, -2.0]
    ]
  };

  /* ======================= tiện ích dùng chung ======================= */
  let COBBLE = null;
  function cobblePattern(ctx) {
    if (!COBBLE) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#4e4840'; g.fillRect(0, 0, 64, 64);
      let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let j = 0; j < 4; j++) for (let i = -1; i < 5; i++) {
        const x = i * 16 - (j % 2) * 8, y = j * 16, l = 54 + r() * 10, ins = 1 + r() * 1.2;
        g.fillStyle = `hsl(${36 + r() * 14},${8 + r() * 8}%,${l}%)`; g.beginPath(); g.moveTo(x + ins + 3, y + ins); g.arcTo(x + 16 - ins, y + ins, x + 16 - ins, y + 15, 3.5); g.arcTo(x + 16 - ins, y + 16 - ins, x + ins, y + 16 - ins, 3.5); g.arcTo(x + ins, y + 16 - ins, x + ins, y + ins, 3.5); g.arcTo(x + ins, y + ins, x + 16 - ins, y + ins, 3.5); g.fill();
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + ins + 2, y + ins, 12 - ins, 1.4); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + ins + 2, y + 14 - ins, 12 - ins, 1.4);
      }
      COBBLE = c;
    }
    return ctx.createPattern(COBBLE, 'repeat');
  }

  /* ======================= tạo khu ======================= */
  function create(id, E, H) {
    const SP = REG[id]; if (!SP) return null;
    const rnd = H.rng(H.hs(77, 1601));
    const T = { id, SP, E, H, deco: [], lamps: [], cells: new Map(), chunks: new Map(), bakes: 0, dpr: 0, ks: 1, ver: 1 };
    const cellKey = (gx, gy) => (gx + 4096) * 8192 + (gy + 4096);
    const KI = H.KI;

    /* --- hộp khu --- */
    const bx = SP.box; T.gx0 = M.floor(bx[0]); T.gy0 = M.floor(bx[1]); T.gx1 = M.ceil(bx[2]); T.gy1 = M.ceil(bx[3]);
    T.px0 = bx[0] * C; T.py0 = bx[1] * C; T.px1 = bx[2] * C; T.py1 = bx[3] * C;

    /* --- sông: nội suy Catmull-Rom → điểm dày (px) + pháp tuyến --- */
    const P = SP.river.map(p => [p[0] * C, p[1] * C, p[2] * C]), R = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[M.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[M.min(P.length - 1, i + 2)];
      for (let s = 0; s < 10; s++) {
        const t = s / 10, t2 = t * t, t3 = t2 * t, f = k => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        R.push({ x: f(0), y: f(1), w: f(2) });
      }
    }
    R.push({ x: P[P.length - 1][0], y: P[P.length - 1][1], w: P[P.length - 1][2] });
    R.forEach((p, i) => { const a = R[M.max(0, i - 1)], b = R[M.min(R.length - 1, i + 1)]; let dx = b.x - a.x, dy = b.y - a.y; const L = M.hypot(dx, dy) || 1; p.nx = -dy / L; p.ny = dx / L });
    T.R = R; T.minY = M.min(...R.map(p => p.y)) - 260; T.maxY = M.max(...R.map(p => p.y)) + 260;
    const pl = SP.pool; T.pool = { x: pl[0] * C, y: pl[1] * C, rx: pl[2] * C, ry: pl[3] * C };
    const br = SP.bridge; T.br = { x: br.x * C, y0: br.y0 * C, y1: br.y1 * C, hw: br.hw * C };
    const cl = SP.cliff; T.cx = cl.x * C; T.cy = cl.y * C;
    T.fall = { x: T.cx, y: T.cy + 20 };
    T.ke = [SP.keBank[0] * C, SP.keBank[1] * C];

    /* --- vật thể y-sort + ô va chạm --- */
    const solid = (gx, gy, k) => { T.cells.set(cellKey(gx, gy), k) };
    const addSolid = (x, y, w, d, k) => {                     // chân vật thể rộng w ô, sâu d hàng, canh giữa x
      const gy0 = M.floor((y - 26) / C);
      for (let i = 0; i < w; i++) { const gx = M.floor((x - (w - 1) * 32 + i * 64) / C); for (let j = 0; j < d; j++) solid(gx, gy0 - j, k) }
    };
    const OVR = { stall: [2, 1, 'tsolid'], well: [1, 1, 'tsolid'], lamp: [1, 1, 'tpost'], bamboo: [1, 1, 'tpost'], peach: [1, 1, 'tpost'], boat: null, post: null };
    for (const d of SP.objects) {
      const name = d[0], x = d[1] * C, y = d[2] * C, v = d[3] | 0, a = ART.list[name]; if (!a) continue;
      const o = { tw: 1, ob: 2, k: 0, t: name, v, x, y, sc: 1, arena: 0, a, cw: a.w * .5 + 60, ch: a.h + 30, ph: (x * .013 + y * .007) };
      T.deco.push(o);
      let s = OVR[name] !== undefined ? OVR[name] : [a.solid[0], a.solid[1], 'tsolid'];
      if (name === 'gate') { addSolid(x - 154, y, 1, 1, KI.tsolid); addSolid(x + 154, y, 1, 1, KI.tsolid); s = null }
      if (s && s[0]) addSolid(x, y, s[0], s[1], KI[s[2]]);
      for (const l of a.lan) T.lamps.push({ x: x - a.ax + l[0], y: y - a.ay + l[1], s: l[2], ph: o.ph + l[0] * .1, o });
    }
    for (const q of SP.trees) { const k = KI[q[0]]; if (k) solid(M.floor(q[1]), M.floor(q[2]), k) }
    /* cầu gỗ: cột lan can hai bên (không va chạm) + đèn ở đầu cầu */
    { const hw = T.br.hw + 6; let idx = 0;
      for (const sx of [-1, 1]) for (let y = T.br.y0 + 6; y <= T.br.y1 + 1; y += 36, idx++) {
        const a = ART.list.post, o = { tw: 1, ob: 2, k: 0, t: 'post', v: 0, x: T.br.x + sx * hw, y: y + 30, sc: 1, arena: 0, a, cw: 60, ch: 100, beam: 36, ph: idx, lantern: (y < T.br.y0 + 8 || y + 36 > T.br.y1 + 1) };
        T.deco.push(o); if (o.lantern) T.lamps.push({ x: o.x, y: o.y - 58, s: 1, ph: idx, o, dy: 0 });
      }
      for (const sx of [-1, 1]) { const a = ART.list.post; for (const yy of [T.br.y0 + 10, T.br.y1 + 28]) T.deco.push({ tw: 1, ob: 2, k: 0, t: 'pier', v: 0, x: T.br.x + sx * (T.br.hw - 4), y: yy, sc: 1, arena: 0, a, cw: 40, ch: 60 }) } }
    /* thác: sương mù đặt phía trước chân thác để người chơi đi qua vẫn bị phủ sương */
    T.deco.push({ tw: 1, ob: 2, k: 0, t: 'mist', v: 0, x: T.fall.x, y: T.fall.y + 56, sc: 1, arena: 0, a: { w: 360, h: 300, ax: 180, ay: 280 }, cw: 260, ch: 70 });
    T.deco.sort((p, q) => p.y - q.y);

    /* --- đồ trang trí nền (bake trong mảnh): sỏi, lau sậy, hoa súng, sỏi đường đất --- */
    const decals = [], dk = (k, x, y, r, o) => decals.push(Object.assign({ k, x, y, r }, o || {}));
    R.forEach((p, i) => {
      for (let n = 0; n < 4; n++) {
        const side = rnd() < .5 ? -1 : 1, off = p.w / 2 + 4 + rnd() * 20, x = p.x + p.nx * off * side, y = p.y + p.ny * off * side;
        if (side < 0 && p.x > T.ke[0] && p.x < T.ke[1] && rnd() < .85) continue;
        dk('peb', x + (rnd() - .5) * 8, y + (rnd() - .5) * 8, 1.6 + rnd() * 4, { h: rnd() });
      }
      if (rnd() < .5) { const side = 1, off = p.w / 2 - 6 + rnd() * 8; dk('reed', p.x + p.nx * off * side, p.y + p.ny * off * side, 12, { h: rnd() }) }
      if (rnd() < .42 && p.x > -300) dk('lily', p.x + (rnd() - .5) * p.w * .6, p.y + (rnd() - .5) * p.w * .5, 6 + rnd() * 7, { h: rnd() });
      if (rnd() < .22) dk('stone', p.x + (rnd() - .5) * p.w * .6, p.y + (rnd() - .5) * p.w * .5, 5 + rnd() * 6, { h: rnd() });
    });
    for (const path of SP.dirt) for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], n = M.ceil(M.hypot(b[0] - a[0], b[1] - a[1]) * 3);
      for (let k = 0; k < n; k++) { const t = rnd(), x = (a[0] + (b[0] - a[0]) * t) * C + (rnd() - .5) * 90, y = (a[1] + (b[1] - a[1]) * t) * C + (rnd() - .5) * 60; dk(rnd() < .5 ? 'peb' : 'tuft', x, y, 1.5 + rnd() * 3, { h: rnd() }) }
    }
    T.bucket = new Map();
    for (const d of decals) { const x0 = M.floor((d.x - 20) / CH), x1 = M.floor((d.x + 20) / CH), y0 = M.floor((d.y - 20) / CH), y1 = M.floor((d.y + 20) / CH); for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) { const k = i * 4096 + j; let b = T.bucket.get(k); if (!b) T.bucket.set(k, b = []); b.push(d) } }

    Object.assign(T, API);
    T.prebake();
    return T;
  }

  /* ======================= API instance ======================= */
  const API = {
    /* --- va chạm theo ô: undefined = ngoài khu (dùng sinh ngẫu nhiên của engine); 0 = trống (tắt đá ngẫu nhiên trong khu) --- */
    ob(gx, gy) {
      if (gx < this.gx0 || gx > this.gx1 || gy < this.gy0 || gy > this.gy1) return undefined;
      return this.cells.get((gx + 4096) * 8192 + (gy + 4096)) || 0;
    },
    near(x, y, r) { return x > this.px0 - r && x < this.px1 + r && y > this.py0 - r && y < this.py1 + r },
    onBridge(x, y) { const b = this.br; return x > b.x - b.hw - 6 && x < b.x + b.hw + 6 && y > b.y0 - 8 && y < b.y1 + 8 },
    inWater(x, y) {
      if (y < this.minY || y > this.maxY || x < this.px0 || x > this.px1) return false;
      const p = this.pool; { const dx = (x - p.x) / (p.rx * .86), dy = (y - p.y) / (p.ry * .86); if (dx * dx + dy * dy < 1) return true }
      const R = this.R;
      for (let i = 0; i < R.length - 1; i++) {
        const a = R[i], b = R[i + 1]; if ((x < a.x - 140 && x < b.x - 140) || (x > a.x + 140 && x > b.x + 140)) continue;
        const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1; let t = ((x - a.x) * dx + (y - a.y) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = a.x + dx * t - x, qy = a.y + dy * t - y, hw = (a.w + (b.w - a.w) * t) * .43; if (qx * qx + qy * qy < hw * hw) return true;
      }
      return false;
    },
    spd(x, y) { return this.near(x, y, 0) && !this.onBridge(x, y) && this.inWater(x, y) ? .62 : 1 },
    update(dt, G) { const P = G.p; return this.spd(P.x, P.y + 6) },
    foe(x, y) { const s = this.spd(x, y); return s < 1 ? 1 - (1 - s) * .6 : 1 },
    collect(cx, cy, W, Hh, L) {
      const a = this.E.arena;
      for (const o of this.deco) {
        const sx = o.x - cx, sy = o.y - cy; if (sx < -o.cw || sx > W + o.cw || sy < -10 || sy > Hh + o.ch) continue;
        if (a) { const dx = o.x - a.x, dy = o.y - a.y, r = a.R + 24; if (dx * dx + dy * dy < r * r) continue }
        L.push(o);
      }
    },
    lights(L, cx, cy, W, Hh, t) {
      const nl = NL[this.E.todK] || .5, a = this.E.arena;
      for (const l of this.lamps) {
        const x = l.x - cx, y = l.y - cy; if (x < -150 || x > W + 150 || y < -150 || y > Hh + 150) continue;
        if (a) { const dx = l.x - a.x, dy = l.y - a.y; if (dx * dx + dy * dy < (a.R + 24) * (a.R + 24)) continue }
        L(x, y + 14, 120 * l.s, .75 + .1 * M.sin(t * 7 + l.ph));
      }
      const f = this.fall; L(f.x - cx, f.y - cy - 30, 150, .25 * nl);
    },

    /* --- vẽ vật thể --- */
    spr(o) { const k = this.H.dpr() > 1 ? 2 : 1; return ART.bake(o.t, o.v, k) },
    lantern(ctx, x, y, s, t, ph, nl, halo) {
      const sw = RM ? 0 : M.sin(t * 1.7 + ph) * 3 * s, bx = x + sw, by = y + 15 * s;
      ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(bx, by - 8 * s); ctx.stroke();
      ctx.fillStyle = '#7a1a14'; ctx.beginPath(); ctx.ellipse(bx, by, 6.6 * s, 8.4 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,${120 + 70 * nl | 0},60,${.55 + .4 * nl})`; ctx.beginPath(); ctx.ellipse(bx, by, 5.2 * s, 7 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,236,170,.55)'; ctx.beginPath(); ctx.ellipse(bx - 1.6 * s, by - 2 * s, 1.8 * s, 3 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8b84a'; ctx.fillRect(bx - 3.6 * s, by - 9.4 * s, 7.2 * s, 2.2 * s); ctx.fillRect(bx - 3.6 * s, by + 7.4 * s, 7.2 * s, 2.2 * s);
      ctx.strokeStyle = '#c0302a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by + 9.6 * s); ctx.lineTo(bx + sw * .3, by + 15 * s); ctx.stroke();
      halo.push(bx, by, s);
    },
    drawProp(ctx, o, sx, sy) {
      const E = this.E, t = E.t, nl = NL[E.todK] || .5;
      if (o.t === 'mist') return this.drawMist(ctx, o, sx, sy, t, nl);
      if (o.t === 'pier') { const w = 10; ctx.fillStyle = '#3a2418'; ctx.fillRect(sx - w / 2, sy - 6, w, 18); ctx.fillStyle = 'rgba(220,240,250,.5)'; ctx.beginPath(); ctx.ellipse(sx, sy + 12, 11 + 2 * M.sin(t * 2 + o.x), 3.4, 0, 0, TAU); ctx.fill(); return }
      const a = o.a, c = this.spr(o), s = o.sc || 1; let yy = sy;
      if (o.t === 'boat') yy += RM ? 0 : M.sin(t * 1.3 + o.x * .01) * 1.6;
      if (o.t === 'post') {
        ctx.drawImage(c, sx - a.ax, yy - a.ay, a.w, a.h);
        ctx.fillStyle = '#7a3a22'; ctx.fillRect(sx - 2.5, yy - 56, 5, o.beam); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(sx - 2.5, yy - 56, 1.6, o.beam);
        ctx.fillStyle = '#6a2a1c'; ctx.fillRect(sx - 2, yy - 40, 4, o.beam); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(sx + .5, yy - 40, 1.5, o.beam);
        if (o.lantern) { const h = []; this.lantern(ctx, sx, yy - 58, 1, t, o.ph, nl, h); this.halo(ctx, h, nl, t) }
        return;
      }
      ctx.drawImage(c, sx - a.ax * s, yy - a.ay * s, a.w * s, a.h * s);
      if (o.t === 'cliff') this.drawFall(ctx, o, sx, yy, t, nl);
      if (a.lan && a.lan.length) {
        const h = []; for (const l of a.lan) this.lantern(ctx, sx - a.ax * s + l[0] * s, yy - a.ay * s + l[1] * s, l[2] * s, t, o.ph + l[0] * .1, nl, h);
        this.halo(ctx, h, nl, t);
      }
    },
    halo(ctx, h, nl, t) {
      if (!h.length) return; const sp = this.H.soft('255,150,60'); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < h.length; i += 3) { const r = 52 * h[i + 2]; ctx.globalAlpha = (.22 + .5 * nl) * (.92 + .08 * M.sin(t * 9 + i)); ctx.drawImage(sp, h[i] - r, h[i + 1] - r, r * 2, r * 2) }
      ctx.restore();
    },
    drawFall(ctx, o, sx, sy, t, nl) {
      const topY = sy - 296, botY = sy - 6, wT = 150, wB = 186, N = this.H.q() ? 30 : 16;
      ctx.save();
      const gr = ctx.createLinearGradient(0, topY, 0, botY); gr.addColorStop(0, 'rgba(238,250,255,.95)'); gr.addColorStop(.6, 'rgba(196,230,244,.9)'); gr.addColorStop(1, 'rgba(176,216,236,.9)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx - wT / 2, topY + 6);
      for (let i = 0; i <= 8; i++) { const u = i / 8; ctx.lineTo(sx - wT / 2 - (wB - wT) / 2 * u + M.sin(i * 2.1) * 3, topY + 6 + (botY - topY - 6) * u) }
      ctx.lineTo(sx + wB / 2 + 6, botY); for (let i = 8; i >= 0; i--) { const u = i / 8; ctx.lineTo(sx + wT / 2 + (wB - wT) / 2 * u + M.sin(i * 1.7 + 2) * 3, topY + 6 + (botY - topY - 6) * u) } ctx.closePath(); ctx.fill();
      ctx.clip();
      const h = botY - topY, sp = RM ? 0 : t;
      for (let i = 0; i < N; i++) {
        const u = (i + .5) / N, hv = ((i * 7919) % 97) / 97, x = sx - wB / 2 + u * wB, len = 34 + hv * 70, v = 150 + hv * 130, y = ((sp * v + hv * 997) % (h + len)) - len + topY;
        ctx.strokeStyle = `rgba(255,255,255,${.28 + hv * .35})`; ctx.lineWidth = 1.6 + hv * 2.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (u - .5) * 6, y + len); ctx.stroke();
        if (i % 3 === 0) { ctx.strokeStyle = 'rgba(120,180,210,.25)'; ctx.lineWidth = 2.4; const y2 = ((sp * v * .7 + hv * 313) % (h + len)) - len + topY; ctx.beginPath(); ctx.moveTo(x + 4, y2); ctx.lineTo(x + 4, y2 + len * .8); ctx.stroke() }
      }
      const sh = ctx.createLinearGradient(sx - wB / 2, 0, sx + wB / 2, 0); sh.addColorStop(0, 'rgba(60,110,140,.35)'); sh.addColorStop(.18, 'rgba(60,110,140,0)'); sh.addColorStop(.82, 'rgba(60,110,140,0)'); sh.addColorStop(1, 'rgba(60,110,140,.35)'); ctx.fillStyle = sh; ctx.fillRect(sx - wB / 2 - 8, topY, wB + 16, h);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(sx, topY + 6, wT / 2 + 6, 7, 0, 0, TAU); ctx.fill();
      const pu = .5 + .5 * M.sin(t * 3);
      ctx.fillStyle = `rgba(255,255,255,${.5 + .15 * pu})`; ctx.beginPath(); ctx.ellipse(sx, botY + 12, wB / 2 + 22, 20 + 2 * pu, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const ph = (t * .5 + i / 3) % 1; ctx.globalAlpha = (1 - ph) * .8; ctx.beginPath(); ctx.ellipse(sx, botY + 16, wB / 2 + 10 + ph * 80, 16 + ph * 26, 0, 0, TAU); ctx.stroke() }
      ctx.globalAlpha = 1;
    },
    drawMist(ctx, o, sx, sy, t, nl) {
      const sp = this.H.soft('238,248,255'), n = this.H.q() ? 9 : 5, day = this.E.todK === 'day' || this.E.todK === 'dawn';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const ph = ((RM ? 0 : t) * .16 + i / n) % 1, x = sx + M.sin(i * 2.7 + t * .3) * 90, y = sy - 20 - ph * 110, r = 54 + ph * 62;
        ctx.globalAlpha = M.sin(ph * M.PI) * (.3 - .1 * nl); ctx.drawImage(sp, x - r, y - r * .7, r * 2, r * 1.4);
      }
      if (day && this.H.q()) {                                   // cầu vồng mờ trong sương (chỉ ban ngày / bình minh)
        ctx.globalCompositeOperation = 'source-over'; const cols = ['255,90,90', '255,170,70', '255,238,110', '110,220,130', '100,170,255', '170,120,255'];
        for (let i = 0; i < cols.length; i++) { ctx.strokeStyle = `rgba(${cols[i]},${.07 + .015 * M.sin(t * .7)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sx + 70, sy - 90, 150 - i * 6, M.PI * 1.05, M.PI * 1.95); ctx.stroke() }
      }
      ctx.restore();
    },

    /* --- nền: bake theo mảnh 512px, nước chảy vẽ động --- */
    prebake() { this.syncScale(); for (let i = -1; i <= 0; i++) for (let j = -2; j <= -1; j++) this.chunk(i, j, true) },
    syncScale() { const d = this.H.dpr(), ks = d >= 1.5 ? 1.5 : 1; if (this.ks !== ks) { this.chunks.clear(); this.ks = ks } },
    chunk(i, j, force) {
      const key = i * 4096 + j; let c = this.chunks.get(key);
      if (c) { this.chunks.delete(key); this.chunks.set(key, c); return c }
      if (!force && this.bakes >= 3) return null; this.bakes++;
      const k = this.ks, cv = document.createElement('canvas'); cv.width = cv.height = M.ceil(CH * k); const g = cv.getContext('2d');
      g.setTransform(k, 0, 0, k, -i * CH * k, -j * CH * k); g.beginPath(); g.rect(i * CH, j * CH, CH, CH); g.clip();
      try { this.paint(g, i * CH, j * CH, i, j) } catch (e) { console.warn('DV_TOWN chunk', e) }
      this.chunks.set(key, cv); if (this.chunks.size > 40) this.chunks.delete(this.chunks.keys().next().value);
      return cv;
    },
    ribbon(g, ex, fill, x0, x1) {
      const R = this.R; let a = 0, b = R.length - 1; while (a < b && R[a + 1].x < x0 - 200) a++; while (b > a && R[b - 1].x > x1 + 200) b--;
      g.beginPath(); for (let i = a; i <= b; i++) { const p = R[i], h = p.w / 2 + ex; i === a ? g.moveTo(p.x + p.nx * h, p.y + p.ny * h) : g.lineTo(p.x + p.nx * h, p.y + p.ny * h) }
      for (let i = b; i >= a; i--) { const p = R[i], h = p.w / 2 + ex; g.lineTo(p.x - p.nx * h, p.y - p.ny * h) } g.closePath(); g.fillStyle = fill; g.fill();
    },
    stroke(g, pts, w, col, cap) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = cap || 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, n) => n ? g.lineTo(p[0] * C, p[1] * C) : g.moveTo(p[0] * C, p[1] * C)); g.stroke() },
    paint(g, ox, oy, ci, cj) {
      const SP = this.SP, x0 = ox, x1 = ox + CH, y0 = oy, y1 = oy + CH, R = this.R, B = this.br, hit = (ax, ay, bx, by) => !(bx < x0 - 40 || ax > x1 + 40 || by < y0 - 40 || ay > y1 + 40);
      /* 1) đường đất từ điểm xuất phát tới cầu */
      for (const p of SP.dirt) { this.stroke(g, p, 96, 'rgba(120,96,56,.16)'); this.stroke(g, p, 78, 'rgba(150,120,72,.5)'); this.stroke(g, p, 60, 'rgba(184,152,98,.9)'); this.stroke(g, p, 34, 'rgba(204,174,120,.55)') }
      /* 2) bờ sông ướt + lòng sông + nước */
      const pool = this.pool;
      this.ribbon(g, 38, 'rgba(76,62,40,.20)', x0, x1); this.ribbon(g, 24, 'rgba(70,58,40,.34)', x0, x1); this.ribbon(g, 12, 'rgba(60,76,70,.55)', x0, x1);
      g.fillStyle = 'rgba(70,58,40,.2)'; g.beginPath(); g.ellipse(pool.x, pool.y, pool.rx + 34, pool.ry + 30, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(60,76,70,.55)'; g.beginPath(); g.ellipse(pool.x, pool.y, pool.rx + 10, pool.ry + 9, 0, 0, TAU); g.fill();
      this.ribbon(g, 3, '#2e6074', x0, x1); g.fillStyle = '#2e6074'; g.beginPath(); g.ellipse(pool.x, pool.y, pool.rx + 2, pool.ry + 2, 0, 0, TAU); g.fill();
      this.ribbon(g, -2, '#3f86a6', x0, x1); g.fillStyle = '#3f86a6'; g.beginPath(); g.ellipse(pool.x, pool.y, pool.rx - 3, pool.ry - 3, 0, 0, TAU); g.fill();
      for (const [e, col] of [[-.22, '#4b9ab8'], [-.4, '#5cadc8'], [-.58, 'rgba(120,200,224,.8)']]) {
        const R2 = R.map(p => ({ x: p.x, y: p.y, nx: p.nx, ny: p.ny, w: p.w * (1 + e) })); const sv = this.R; this.R = R2; this.ribbon(g, -2, col, x0, x1); this.R = sv;
        g.fillStyle = col; g.beginPath(); g.ellipse(pool.x, pool.y, (pool.rx - 3) * (1 + e), (pool.ry - 3) * (1 + e), 0, 0, TAU); g.fill();
      }
      /* 3) kè đá bờ bắc */
      { const ke = this.ke; g.beginPath(); let first = true; const pts = [];
        for (const p of R) if (p.x >= ke[0] && p.x <= ke[1] && p.x > x0 - 100 && p.x < x1 + 100) pts.push(p);
        if (pts.length > 1) {
          const edge = (e, s) => pts.map(p => [p.x - p.nx * (p.w / 2 + e) * s, p.y - p.ny * (p.w / 2 + e) * s]);
          const a = edge(-1, 1), b = edge(15, 1); g.beginPath(); a.forEach((q, n) => n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); for (let n = b.length - 1; n >= 0; n--) g.lineTo(b[n][0], b[n][1]); g.closePath();
          const gr = g.createLinearGradient(0, pts[0].y - 40, 0, pts[0].y + 40); g.fillStyle = '#8e887c'; g.fill();
          g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; g.beginPath(); for (let n = 0; n < pts.length; n += 2) { const p = pts[n]; g.moveTo(p.x - p.nx * (p.w / 2 - 1), p.y - p.ny * (p.w / 2 - 1)); g.lineTo(p.x - p.nx * (p.w / 2 + 15), p.y - p.ny * (p.w / 2 + 15)) } g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2; g.beginPath(); b.forEach((q, n) => n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
          g.strokeStyle = 'rgba(30,24,18,.5)'; g.lineWidth = 2.4; g.beginPath(); a.forEach((q, n) => n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
          g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; g.beginPath(); const m = edge(7, 1); m.forEach((q, n) => n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
        }
      }
      /* 4) đường lát đá + quảng trường */
      const pat = cobblePattern(g);
      for (const s of SP.street) { this.stroke(g, s, 3.9 * C, 'rgba(40,34,28,.55)', 'butt'); this.stroke(g, s, 3.6 * C, pat, 'butt') }
      { const c = SP.cross; this.stroke(g, c, 2.5 * C, 'rgba(40,34,28,.55)', 'butt'); this.stroke(g, c, 2.2 * C, pat, 'butt') }
      { const p = SP.plaza, px = p[0] * C, py = p[1] * C, r = p[2] * C;
        g.fillStyle = 'rgba(40,34,28,.55)'; g.beginPath(); g.arc(px, py, r + 8, 0, TAU); g.fill(); g.fillStyle = pat; g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(48,40,32,.6)'; g.lineWidth = 5; g.beginPath(); g.arc(px, py, r * .74, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(210,196,160,.4)'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, r * .74 + 4, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(48,40,32,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, r * .36, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(48,40,32,.4)'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.moveTo(px + M.cos(a) * r * .42, py + M.sin(a) * r * .42); g.lineTo(px + M.cos(a) * r * .74, py + M.sin(a) * r * .74) } g.stroke();
        g.fillStyle = 'rgba(200,64,48,.35)'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; g.beginPath(); g.ellipse(px + M.cos(a) * r * .88, py + M.sin(a) * r * .88, 9, 4, a, 0, TAU); g.fill() } }
      /* 5) bậc thềm trước nhà + sân */
      for (const o of this.deco) {
        if (o.t === 'shop' || o.t === 'wide' || o.t === 'stall') {
          const w = o.a.w * (o.t === 'stall' ? .7 : .8), x = o.x - w / 2, y = o.y - 2; if (!hit(x, y, x + w, y + 18)) continue;
          g.fillStyle = 'rgba(30,24,18,.35)'; g.fillRect(x - 1, y + 16, w + 2, 3); g.fillStyle = '#8e887c'; g.fillRect(x, y, w, 17); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x, y, w, 1.6); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; g.beginPath(); for (let i = 16; i < w; i += 22) { g.moveTo(x + i, y); g.lineTo(x + i, y + 17) } g.stroke();
        }
      }
      /* 6) cầu gỗ: bóng trên nước + dầm + mặt ván */
      if (hit(B.x - B.hw - 20, B.y0 - 30, B.x + B.hw + 40, B.y1 + 40)) {
        const w = B.hw * 2, x = B.x - B.hw, h = B.y1 - B.y0;
        g.fillStyle = 'rgba(8,24,36,.32)'; g.fillRect(x + 8, B.y0 + 12, w, h + 10); g.fillStyle = 'rgba(8,24,36,.16)'; g.fillRect(x + 14, B.y0 + 20, w, h + 18);
        g.fillStyle = '#4a2416'; g.fillRect(x - 7, B.y0 - 8, 9, h + 16); g.fillRect(x + w - 2, B.y0 - 8, 9, h + 16); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - 7, B.y0 - 8, 2, h + 16); g.fillRect(x + w - 2, B.y0 - 8, 2, h + 16);
        let n = 0; for (let y = B.y0 - 6; y < B.y1 + 8; y += 11, n++) {
          const tone = 138 + ((n * 37) % 5) * 7; g.fillStyle = `rgb(${tone},${tone * .66 | 0},${tone * .42 | 0})`; g.fillRect(x, y, w, 10); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y + 9, w, 1.4); g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x, y, w, 1.2);
          g.fillStyle = 'rgba(40,20,10,.55)'; g.fillRect(x + 4, y + 4, 2, 2); g.fillRect(x + w - 6, y + 4, 2, 2); if (n % 3 === 0) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + w * (.2 + (n % 5) * .12), y, 1.2, 10) }
        }
        g.fillStyle = 'rgba(20,10,4,.35)'; g.fillRect(x, B.y0 - 6, w, 3); g.fillRect(x, B.y1 + 5, w, 3);
        g.fillStyle = 'rgba(90,140,60,.35)'; for (let i = 0; i < 12; i++) g.fillRect(x + (i * 53 % w), B.y0 + (i * 71 % h), 8, 3);
        for (const sx of [x - 2, x + w - 4]) for (let k = 0; k < 3; k++) { g.fillStyle = '#9a9488'; g.fillRect(sx - 4, B.y0 - 14 - k * 4, 14, 4); g.fillRect(sx - 4, B.y1 + 10 + k * 4, 14, 4) }
      }
      /* 7) sỏi / lau sậy / hoa súng / cỏ */
      const bk = this.bucket.get(ci * 4096 + cj);
      if (bk) for (const d of bk) {
        if (d.k === 'peb') { g.fillStyle = `hsl(${30 + d.h * 20},${6 + d.h * 8}%,${44 + d.h * 22}%)`; g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * .72, d.h * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(d.x - d.r * .2, d.y - d.r * .25, d.r * .45, d.r * .25, 0, 0, TAU); g.fill() }
        else if (d.k === 'stone') { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(d.x + 2, d.y + 3, d.r, d.r * .6, 0, 0, TAU); g.fill(); g.fillStyle = `hsl(210,8%,${42 + d.h * 14}%)`; g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * .7, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(d.x - d.r * .25, d.y - d.r * .25, d.r * .5, d.r * .28, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.beginPath(); g.ellipse(d.x, d.y + 2, d.r + 3, d.r * .6 + 2, 0, 0, TAU); g.stroke() }
        else if (d.k === 'lily') { g.fillStyle = `hsl(${110 + d.h * 30},44%,${30 + d.h * 12}%)`; g.beginPath(); g.ellipse(d.x, d.y, d.r, d.r * .62, 0, .35, TAU - .1); g.lineTo(d.x, d.y); g.fill(); if (d.h > .6) { g.fillStyle = '#f6b4cc'; g.beginPath(); g.ellipse(d.x + 1, d.y - 1, d.r * .34, d.r * .26, 0, 0, TAU); g.fill(); g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(d.x + 1, d.y - 1, 1.4, 0, TAU); g.fill() } }
        else if (d.k === 'reed') { g.strokeStyle = `hsl(${74 + d.h * 30},40%,${28 + d.h * 12}%)`; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); for (let n = 0; n < 5; n++) { const bx = d.x + (n - 2) * 3, h = 16 + ((n * 7 + d.h * 20) % 14); g.moveTo(bx, d.y + 4); g.quadraticCurveTo(bx + (n - 2) * 2, d.y - h * .5, bx + (n - 2) * 4, d.y - h) } g.stroke(); g.fillStyle = '#6a4a2a'; for (let n = 1; n < 4; n++) { g.beginPath(); g.ellipse(d.x + (n - 2) * 3.4, d.y - 18 - n, 1.4, 4, 0, 0, TAU); g.fill() } }
        else if (d.k === 'tuft') { g.strokeStyle = `hsl(${88 + d.h * 20},46%,${30 + d.h * 14}%)`; g.lineWidth = 1.3; g.beginPath(); for (let n = -1; n <= 1; n++) { g.moveTo(d.x + n * 2, d.y + 2); g.lineTo(d.x + n * 3.4, d.y - 5 - d.h * 4) } g.stroke() }
      }
    },
    drawGround(ctx, cx, cy, W, Hh) {
      const E = this.E, t = E.t; this.syncScale(); this.bakes = 0;
      if (cx + W < this.px0 - 80 || cx > this.px1 + 80 || cy + Hh < this.py0 - 80 || cy > this.py1 + 80) return;
      const m = 192, i0 = M.floor((cx - m) / CH), i1 = M.floor((cx + W + m) / CH), j0 = M.floor((cy - m) / CH), j1 = M.floor((cy + Hh + m) / CH);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const x = i * CH, y = j * CH; if (x + CH < this.px0 || x > this.px1 || y + CH < this.py0 || y > this.py1) continue;
        const c = this.chunk(i, j, false); if (!c) continue;
        if (x + CH < cx || x > cx + W || y + CH < cy || y > cy + Hh) continue;
        ctx.drawImage(c, x - cx - .5, y - cy - .5, CH + 1, CH + 1);
      }
      this.water(ctx, cx, cy, W, Hh, t);
    },
    water(ctx, cx, cy, W, Hh, t) {
      const R = this.R, q = this.H.q(); let a = 0, b = R.length - 1; while (a < b && R[a + 1].x < cx - 160) a++; while (b > a && R[b - 1].x > cx + W + 160) b--;
      const poolVis = this.pool.x + this.pool.rx > cx && this.pool.x - this.pool.rx < cx + W && this.pool.y + this.pool.ry > cy && this.pool.y - this.pool.ry < cy + Hh;
      if (b - a < 1 && !poolVis) return;
      const lanes = q ? [-.38, -.19, 0, .19, .38] : [-.2, .2]; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([26, 54]);
      if (b - a >= 1) lanes.forEach((u, li) => {
        ctx.strokeStyle = `rgba(255,255,255,${.2 + (li % 2) * .08})`; ctx.lineWidth = 1.8; ctx.lineDashOffset = RM ? 0 : -(t * (20 + li * 5) + li * 17);
        ctx.beginPath(); for (let i = a; i <= b; i++) { const p = R[i], x = p.x + p.nx * p.w * u * .9 + M.sin(i * .5 + li) * 3, y = p.y + p.ny * p.w * u * .9; i === a ? ctx.moveTo(x - cx, y - cy) : ctx.lineTo(x - cx, y - cy) } ctx.stroke();
      });
      ctx.setLineDash([]);
      if (q && b - a >= 1) { ctx.fillStyle = '#fff'; for (let n = 0; n < 26; n++) { const i = a + ((n * 37) % M.max(1, b - a)), p = R[i], u = ((n * 13) % 9) / 9 - .5, ph = M.max(0, M.sin(t * 1.8 + n * 1.7)); if (ph < .6) continue; const x = p.x + p.nx * p.w * u * .8 - cx, y = p.y + p.ny * p.w * u * .8 - cy; ctx.globalAlpha = (ph - .6) * 2; ctx.fillRect(x - 3, y - .5, 6, 1); ctx.fillRect(x - .5, y - 3, 1, 6) } ctx.globalAlpha = 1 }
      if (poolVis) { const p = this.pool; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { const ph = ((RM ? 0 : t) * .35 + i / 3) % 1; ctx.globalAlpha = (1 - ph) * .9; ctx.beginPath(); ctx.ellipse(p.x - cx, p.y + 18 - cy, 40 + ph * (p.rx - 50), 12 + ph * (p.ry - 18), 0, 0, TAU); ctx.stroke() } ctx.globalAlpha = 1 }
      const G = this.H.G(), P = G && G.p;
      if (P && this.near(P.x, P.y, 0) && !this.onBridge(P.x, P.y) && this.inWater(P.x, P.y + 6)) {
        ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { const ph = (t * 1.1 + i / 3) % 1; ctx.globalAlpha = (1 - ph) * .85; ctx.beginPath(); ctx.ellipse(P.x - cx, P.y + 8 - cy, 8 + ph * 24, 3 + ph * 9, 0, 0, TAU); ctx.stroke() } ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
    free() { this.chunks.clear() }
  };

  window.DV_TOWN = { create, ids: () => Object.keys(REG), spec: id => REG[id], art: ART };
})();
