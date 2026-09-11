/* HeroNet : même base que l'animation du hero d'accueil (particules, liens de
   proximité, répulsion et illumination au curseur), plus un motif propre à
   chaque page dessiné par-dessus.
   Usage : <canvas data-hero-anim="radar"> : montage automatique. */
(function () {
  const LINE = '138,77,255', ACC = '185,140,255', NODE = '#C4A6FF', WHT = '255,255,255';
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const O = {};   // motifs par page (données dans s.o)

  /* ---------- Conseil : balayage de diagnostic ---------- */
  O.radar = {
    density: 13000,
    init(s) {
      s.o.cx = s.W * 0.74; s.o.cy = s.H * 0.52; s.o.R = Math.min(s.W * 0.36, s.H * 0.62);
    },
    /* liens révélés par le balayage */
    linkOp(s, A) {
      const ang = Math.atan2(A.y - s.o.cy, A.x - s.o.cx), sw = s.t * 0.011;
      let diff = Math.abs(((ang - sw) % TAU + TAU) % TAU);
      if (diff > Math.PI) diff = TAU - diff;
      return 0.3 + 0.7 * Math.max(0, 1 - diff / 0.8);
    },
    draw(s) {
      const { ctx, o } = s, ang = s.t * 0.011;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = 'rgba(' + LINE + ',' + (0.26 - i * 0.04) + ')';
        ctx.beginPath(); ctx.arc(o.cx, o.cy, o.R * (i / 4), 0, TAU); ctx.stroke();
      }
      const g = ctx.createLinearGradient(o.cx, o.cy, o.cx + Math.cos(ang) * o.R, o.cy + Math.sin(ang) * o.R);
      g.addColorStop(0, 'rgba(' + ACC + ',0.16)'); g.addColorStop(1, 'rgba(' + ACC + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(o.cx, o.cy); ctx.arc(o.cx, o.cy, o.R, ang - 0.3, ang + 0.02); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(' + ACC + ',0.5)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(o.cx, o.cy); ctx.lineTo(o.cx + Math.cos(ang) * o.R, o.cy + Math.sin(ang) * o.R); ctx.stroke();
    }
  };

  /* ---------- Digital : paquets de données sur les liens ---------- */
  O.circuit = {
    density: 11000,
    init(s) {
      s.o.pk = [];
      for (let i = 0; i < 12; i++) s.o.pk.push({ a: 0, b: 1, t: Math.random(), v: rand(0.004, 0.011) });
    },
    draw(s) {
      const { ctx, o, parts } = s;
      for (const k of o.pk) {
        k.t += k.v;
        if (k.t > 1) { k.t = 0; k.a = (Math.random() * parts.length) | 0; k.b = (Math.random() * parts.length) | 0; }
        const A = parts[k.a], B = parts[k.b];
        if (!A || !B) continue;
        const x = A.x + (B.x - A.x) * k.t, y = A.y + (B.y - A.y) * k.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 22);
        g.addColorStop(0, 'rgba(' + ACC + ',0.85)'); g.addColorStop(1, 'rgba(' + ACC + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(' + WHT + ',0.9)'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
      }
    }
  };

  /* ---------- IA : particules organisées en couches + activation ---------- */
  O.neural = {
    density: 16000,
    place(s, p, i) {                       // particules rangées en 4 colonnes
      const col = i % 4;
      p.layer = col;
      p.x = s.W * (0.36 + 0.19 * col) + rand(-s.W * 0.02, s.W * 0.02);
      p.y = rand(s.H * 0.12, s.H * 0.88);
      p.vx = rand(-0.05, 0.05); p.vy = rand(-0.16, 0.16);
    },
    linkAllow(s, A, B) { return Math.abs(A.layer - B.layer) === 1; },
    pulseX(s) { return s.W * (0.34 + 0.62 * ((s.t * 0.005) % 1)); },
    draw(s) {
      const { ctx } = s, x = this.pulseX(s);
      const g = ctx.createLinearGradient(x - 100, 0, x + 100, 0);
      g.addColorStop(0, 'rgba(' + ACC + ',0)'); g.addColorStop(0.5, 'rgba(' + ACC + ',0.12)'); g.addColorStop(1, 'rgba(' + ACC + ',0)');
      ctx.fillStyle = g; ctx.fillRect(x - 100, 0, 200, s.H);
    }
  };

  /* ---------- Graphisme : facettes géométriques dans le réseau ---------- */
  O.facets = {
    density: 15000, mesh: true,
    init(s) {
      s.o.sh = [];
      const n = Math.max(5, Math.round((s.W * s.H) / 190000));
      for (let i = 0; i < n; i++) s.o.sh.push({
        x: rand(0.1, 0.94) * s.W, y: rand(0.12, 0.9) * s.H, r: rand(30, 92),
        sides: 3 + ((Math.random() * 4) | 0), a: rand(0, TAU), va: rand(-0.005, 0.005), depth: rand(0.3, 1)
      });
    },
    draw(s) {
      const { ctx, o, mouse } = s;
      for (const sh of o.sh) {
        sh.a += sh.va;
        const ox = mouse.x != null ? (mouse.x - s.W / 2) * 0.025 * sh.depth : 0;
        const oy = mouse.y != null ? (mouse.y - s.H / 2) * 0.025 * sh.depth : 0;
        ctx.beginPath();
        for (let i = 0; i < sh.sides; i++) {
          const a = sh.a + (i / sh.sides) * TAU;
          const x = sh.x + ox + Math.cos(a) * sh.r, y = sh.y + oy + Math.sin(a) * sh.r;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(' + LINE + ',0.05)'; ctx.fill();
        ctx.strokeStyle = 'rgba(' + ACC + ',' + (0.14 + sh.depth * 0.2) + ')'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  };

  /* ---------- Mobile : ondes de signal ---------- */
  O.signal = {
    density: 15000,
    init(s) { s.o.w = []; s.o.cx = s.W * 0.5; s.o.cy = s.H * 1.02; },
    draw(s) {
      const { ctx, o } = s;
      if (s.t % 46 === 0) o.w.push({ r: 10 });
      ctx.lineWidth = 1.2;
      for (let i = o.w.length - 1; i >= 0; i--) {
        const w = o.w[i]; w.r += 1.9;
        const op = Math.max(0, 1 - w.r / (Math.max(s.W, s.H) * 0.95));
        if (op <= 0) { o.w.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(' + ACC + ',' + (op * 0.4) + ')';
        ctx.beginPath(); ctx.arc(o.cx, o.cy, w.r, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      }
    }
  };

  /* ---------- Formation : le réseau se tisse, jalons de progression ---------- */
  O.curve = {
    density: 13000,
    init(s) {
      s.o.pts = []; s.o.prog = 0; s.o.grow = 0;
      const n = 8;
      for (let i = 0; i < n; i++) s.o.pts.push({
        x: s.W * (0.06 + (i / (n - 1)) * 0.88),
        y: s.H * (0.82 - Math.pow(i / (n - 1), 1.5) * 0.55)
      });
    },
    linkOp(s, A) {                          // liens révélés depuis la gauche
      const r = (s.o.grow / 300) * s.W * 1.2;
      const d = A.x;
      if (d > r) return 0;
      return Math.min(1, (r - d) / 140);
    },
    draw(s) {
      const { ctx, o } = s;
      o.grow += 1; if (o.grow > 420) o.grow = 0;
      o.prog += 0.0022; if (o.prog > 1.3) o.prog = 0;
      const p = Math.min(1, o.prog), seg = p * (o.pts.length - 1), k = Math.floor(seg), f = seg - k;
      ctx.strokeStyle = 'rgba(' + LINE + ',0.26)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(o.pts[0].x, o.pts[0].y);
      o.pts.forEach((pt) => ctx.lineTo(pt.x, pt.y)); ctx.stroke();
      ctx.strokeStyle = 'rgba(' + ACC + ',0.85)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(o.pts[0].x, o.pts[0].y);
      for (let i = 1; i <= k; i++) ctx.lineTo(o.pts[i].x, o.pts[i].y);
      let hx = o.pts[k].x, hy = o.pts[k].y;
      if (o.pts[k + 1]) { hx += (o.pts[k + 1].x - o.pts[k].x) * f; hy += (o.pts[k + 1].y - o.pts[k].y) * f; ctx.lineTo(hx, hy); }
      ctx.stroke();
      o.pts.forEach((pt, i) => {
        const done = i <= k;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, done ? 5 : 3.2, 0, TAU);
        ctx.fillStyle = done ? 'rgba(' + ACC + ',1)' : 'rgba(' + LINE + ',0.5)';
        ctx.shadowColor = 'rgba(' + ACC + ',0.7)'; ctx.shadowBlur = done ? 12 : 0; ctx.fill(); ctx.shadowBlur = 0;
      });
    }
  };

  /* ---------- Méthode Alpha : chaîne des 4 étapes ---------- */
  O.steps = {
    density: 17000,
    init(s) {
      s.o.n = [];
      for (let i = 0; i < 4; i++) s.o.n.push({ x: s.W * (0.14 + i * 0.24), y: s.H * (0.5 + (i % 2 ? -0.12 : 0.12)) });
    },
    draw(s) {
      const { ctx, o } = s;
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(' + LINE + ',0.42)';
      for (let i = 0; i < o.n.length - 1; i++) { ctx.beginPath(); ctx.moveTo(o.n[i].x, o.n[i].y); ctx.lineTo(o.n[i + 1].x, o.n[i + 1].y); ctx.stroke(); }
      const seg = (s.t * 0.0035) % (o.n.length - 1), i = Math.floor(seg), f = seg - i;
      const A = o.n[i], B = o.n[i + 1];
      const x = A.x + (B.x - A.x) * f, y = A.y + (B.y - A.y) * f;
      ctx.strokeStyle = 'rgba(' + ACC + ',0.95)'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU);
      ctx.fillStyle = 'rgba(' + WHT + ',1)'; ctx.shadowColor = 'rgba(' + ACC + ',0.9)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
      o.n.forEach((c, k) => {
        const on = k <= i;
        ctx.beginPath(); ctx.arc(c.x, c.y, on ? 8.5 : 6, 0, TAU);
        ctx.fillStyle = on ? 'rgba(' + ACC + ',0.95)' : 'rgba(' + LINE + ',0.5)'; ctx.fill();
        ctx.strokeStyle = 'rgba(' + WHT + ',0.32)'; ctx.lineWidth = 1; ctx.stroke();
      });
    }
  };

  /* ---------- Réalisations : réseau sur trame de tuiles ---------- */
  O.tiles = {
    density: 15000, ortho: true,
    init(s) { s.o.S = 78; s.o.lit = new Float32Array(400); },
    draw(s) {
      const { ctx, o, mouse } = s, S = o.S;
      const cols = Math.ceil(s.W / S) + 1, rows = Math.ceil(s.H / S) + 1;
      if (Math.random() < 0.3) o.lit[(Math.random() * Math.min(o.lit.length, cols * rows)) | 0] = 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) % o.lit.length, x = c * S, y = r * S;
        let v = o.lit[i] *= 0.976;
        if (mouse.x != null) {
          const dist = Math.hypot(mouse.x - (x + S / 2), mouse.y - (y + S / 2));
          if (dist < 150) v = Math.max(v, 1 - dist / 150);
        }
        ctx.strokeStyle = 'rgba(' + LINE + ',' + (0.07 + v * 0.4) + ')';
        ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, S, S);
        if (v > 0.03) { ctx.fillStyle = 'rgba(' + LINE + ',' + (v * 0.12) + ')'; ctx.fillRect(x, y, S, S); }
      }
    }
  };

  /* ---------- À propos : constellation, scintillement et filante ---------- */
  O.stars = {
    density: 11000, twinkle: true,
    init(s) { s.o.sh = null; },
    draw(s) {
      const { ctx, o } = s;
      if (!o.sh && Math.random() < 0.008) o.sh = { x: rand(0, s.W * 0.6), y: rand(0, s.H * 0.5), t: 0, len: rand(90, 170), ang: rand(0.3, 0.7) };
      if (o.sh) {
        const sh = o.sh; sh.t += 0.02;
        if (sh.t > 1) { o.sh = null; return; }
        const x = sh.x + Math.cos(sh.ang) * sh.t * s.W * 0.5, y = sh.y + Math.sin(sh.ang) * sh.t * s.W * 0.5;
        const g = ctx.createLinearGradient(x - Math.cos(sh.ang) * sh.len, y - Math.sin(sh.ang) * sh.len, x, y);
        g.addColorStop(0, 'rgba(' + ACC + ',0)'); g.addColorStop(1, 'rgba(' + ACC + ',' + (0.8 * (1 - sh.t)) + ')');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(sh.ang) * sh.len, y - Math.sin(sh.ang) * sh.len); ctx.lineTo(x, y); ctx.stroke();
      }
    }
  };

  /* ---------- Tarifs : réseau qui monte, colonnes en bas ---------- */
  O.bars = {
    density: 14000,
    place(s, p) { p.vy = -rand(0.16, 0.42); p.vx = rand(-0.06, 0.06); p.rise = true; },
    init(s) { s.o.w = 26; s.o.ph = []; for (let i = 0; i < 120; i++) s.o.ph.push(rand(0, TAU)); },
    draw(s) {
      const { ctx, o } = s, n = Math.ceil(s.W / o.w) + 1;
      for (let i = 0; i < n; i++) {
        const h = s.H * (0.08 + 0.22 * (0.5 + 0.5 * Math.sin(s.t * 0.011 + o.ph[i % o.ph.length] + i * 0.28)));
        const x = i * o.w + 4, w = o.w - 8;
        const g = ctx.createLinearGradient(0, s.H, 0, s.H - h);
        g.addColorStop(0, 'rgba(' + LINE + ',0.26)'); g.addColorStop(1, 'rgba(' + ACC + ',0.02)');
        ctx.fillStyle = g; ctx.fillRect(x, s.H - h, w, h);
        ctx.fillStyle = 'rgba(' + ACC + ',0.6)'; ctx.fillRect(x, s.H - h, w, 2);
      }
    }
  };

  /* ---------- Contact : ondes de convergence vers le curseur ---------- */
  O.ripple = {
    density: 14000,
    init(s) { s.o.w = []; },
    move(s, p) {                            // les particules convergent
      const cx = s.mouse.x != null ? s.mouse.x : s.W * 0.74, cy = s.mouse.y != null ? s.mouse.y : s.H * 0.5;
      const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1;
      p.vx += (dx / d) * 0.02 - p.vx * 0.03;
      p.vy += (dy / d) * 0.02 - p.vy * 0.03;
      p.x += p.vx; p.y += p.vy;
      if (d < 26) { p.x = rand(0, s.W); p.y = rand(0, s.H); p.vx = p.vy = 0; }
    },
    draw(s) {
      const { ctx, o, mouse } = s;
      const cx = mouse.x != null ? mouse.x : s.W * 0.74, cy = mouse.y != null ? mouse.y : s.H * 0.5;
      if (s.t % 42 === 0) o.w.push({ x: cx, y: cy, r: 4 });
      for (let i = o.w.length - 1; i >= 0; i--) {
        const w = o.w[i]; w.r += 2.1;
        const op = Math.max(0, 1 - w.r / 380);
        if (op <= 0) { o.w.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(' + ACC + ',' + (op * 0.4) + ')'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, TAU); ctx.stroke();
      }
    }
  };

  function mount(canvas, variant) {
    const cfg = O[variant] || O.stars;
    if (!canvas || canvas.__heroNet) return function () {};
    const ctx = canvas.getContext('2d');
    if (!ctx) return function () {};
    canvas.__heroNet = true;
    const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = matchMedia('(pointer: coarse)').matches;
    let reduced = mqReduce.matches;
    const s = { ctx, W: 0, H: 0, t: 0, o: {}, parts: [], mouse: { x: null, y: null, tx: null, ty: null, r: 150 } };
    let raf = 0, visible = true, light = false, tick = 0;

    function initParts() {
      s.parts = [];
      let n = Math.round((s.W * s.H) / (cfg.density || 12000));
      if (light) n = Math.round(n * 0.55);
      n = Math.max(light ? 16 : 26, Math.min(light ? 54 : 120, n));
      for (let i = 0; i < n; i++) {
        const size = rand(1.1, 2.6);
        const p = {
          x: rand(size * 2, s.W - size * 2), y: rand(size * 2, s.H - size * 2),
          vx: rand(-0.22, 0.22), vy: rand(-0.22, 0.22),
          size, accent: Math.random() < 0.14, ph: rand(0, TAU), layer: 0
        };
        if (cfg.place) cfg.place(s, p, i);
        s.parts.push(p);
      }
    }
    function resize() {
      s.W = canvas.clientWidth; s.H = canvas.clientHeight;
      if (!s.W || !s.H) return;
      light = s.W < 760 || coarse;
      s.mouse.r = Math.max(96, Math.min(180, s.W * 0.13));
      const DPR = Math.min(devicePixelRatio || 1, light ? 1.5 : 2);
      canvas.width = Math.round(s.W * DPR); canvas.height = Math.round(s.H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      s.o = {}; initParts(); if (cfg.init) cfg.init(s);
    }
    const nearMouse = (p) => {
      if (s.mouse.x == null) return false;
      const dx = p.x - s.mouse.x, dy = p.y - s.mouse.y;
      return (dx * dx + dy * dy) < s.mouse.r * s.mouse.r;
    };
    function connect() {
      const maxD = (s.W / 7) * (s.H / 7);
      for (let a = 0; a < s.parts.length; a++) {
        for (let b = a + 1; b < s.parts.length; b++) {
          const A = s.parts[a], B = s.parts[b];
          if (cfg.linkAllow && !cfg.linkAllow(s, A, B)) continue;
          const dx = A.x - B.x, dy = A.y - B.y, d = dx * dx + dy * dy;
          if (d >= maxD) continue;
          let op = 1 - d / 22000; if (op <= 0) continue;
          if (cfg.linkOp) { op *= cfg.linkOp(s, A, B); if (op <= 0.001) continue; }
          const near = nearMouse(A) || nearMouse(B);
          ctx.strokeStyle = near ? 'rgba(' + ACC + ',' + (op * .9) + ')' : 'rgba(' + LINE + ',' + (op * .55) + ')';
          ctx.lineWidth = near ? 1.4 : 0.9;
          ctx.beginPath();
          if (cfg.ortho) { ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, A.y); ctx.lineTo(B.x, B.y); }
          else { ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); }
          ctx.stroke();
          if (cfg.mesh && d < maxD * 0.4) {
            ctx.fillStyle = 'rgba(' + LINE + ',' + (op * 0.05) + ')';
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
            ctx.lineTo((A.x + B.x) / 2 + (A.y - B.y) * 0.26, (A.y + B.y) / 2 - (A.x - B.x) * 0.26);
            ctx.closePath(); ctx.fill();
          }
        }
      }
    }
    function drawNode(p, boost) {
      let a = 0.95;
      if (cfg.twinkle) a = 0.42 + 0.5 * (0.5 + 0.5 * Math.sin(s.t * 0.026 + p.ph));
      const size = boost ? p.size * 1.7 : p.size;
      ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, TAU);
      if (p.accent || boost) { ctx.fillStyle = 'rgba(' + ACC + ',' + a + ')'; ctx.shadowColor = 'rgba(' + ACC + ',.8)'; ctx.shadowBlur = boost ? 14 : 8; }
      else { ctx.fillStyle = NODE; ctx.globalAlpha = a; ctx.shadowColor = 'rgba(' + LINE + ',.7)'; ctx.shadowBlur = 5; }
      ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    function frame(move) {
      ctx.clearRect(0, 0, s.W, s.H);
      if (s.mouse.tx == null) { s.mouse.x = null; s.mouse.y = null; }
      else if (s.mouse.x == null) { s.mouse.x = s.mouse.tx; s.mouse.y = s.mouse.ty; }
      else { s.mouse.x += (s.mouse.tx - s.mouse.x) * 0.16; s.mouse.y += (s.mouse.ty - s.mouse.y) * 0.16; }
      for (const p of s.parts) {
        if (!move) continue;
        if (cfg.move) { cfg.move(s, p); continue; }
        if (p.rise) {
          p.y += p.vy; p.x += p.vx;
          if (p.y < -6) { p.y = s.H + 6; p.x = rand(0, s.W); }
          continue;
        }
        if (p.x > s.W || p.x < 0) p.vx = -p.vx;
        if (p.y > s.H || p.y < 0) p.vy = -p.vy;
        if (s.mouse.x != null) {                        // répulsion au curseur
          const dx = s.mouse.x - p.x, dy = s.mouse.y - p.y, dist = Math.hypot(dx, dy);
          if (dist < s.mouse.r + p.size && dist > 0) {
            const f = (s.mouse.r - dist) / s.mouse.r;
            p.x -= (dx / dist) * f * 4; p.y -= (dy / dist) * f * 4;
          }
        }
        p.x += p.vx; p.y += p.vy;
      }
      if (cfg.draw && cfg.under !== false) { /* motif dessiné après les liens */ }
      connect();
      const px = cfg.pulseX ? cfg.pulseX(s) : null;
      for (const p of s.parts) drawNode(p, px != null && Math.abs(p.x - px) < 70);
      if (cfg.draw) cfg.draw(s);
      s.t += 1;
    }

    const onResize = () => resize();
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      s.mouse.tx = e.clientX - r.left; s.mouse.ty = e.clientY - r.top;
    };
    const onOut = () => { s.mouse.tx = null; s.mouse.ty = null; };
    addEventListener('resize', onResize);
    if (!coarse) {
      addEventListener('mousemove', onMove, { passive: true });
      addEventListener('mouseout', onOut);
    }

    let io = null;
    if (typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 });
      io.observe(canvas);
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (light && (tick++ & 1)) return;      // ~30 fps sur mobile
      frame(true);
    }
    function start() {
      cancelAnimationFrame(raf);
      if (reduced) { frame(false); return; }
      loop();
    }
    const onReduce = () => { reduced = mqReduce.matches; start(); };
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', onReduce);

    resize();
    start();

    return function cleanup() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      removeEventListener('mousemove', onMove);
      removeEventListener('mouseout', onOut);
      if (mqReduce.removeEventListener) mqReduce.removeEventListener('change', onReduce);
      if (io) io.disconnect();
      canvas.__heroNet = false;
    };
  }

  window.HeroNet = { mount: mount, variants: Object.keys(O) };

  let tries = 0;
  (function boot() {
    document.querySelectorAll('canvas[data-hero-anim]').forEach((c) => {
      if (!c.__heroNet && c.clientWidth) mount(c, c.getAttribute('data-hero-anim'));
    });
    if (++tries < 40) setTimeout(boot, 250);
  })();
})();
