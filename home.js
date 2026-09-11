/* home.js : comportements propres à la page d'accueil (carrousel de pôles,
   hero vidéo + réseau de particules, compteur de chiffres clés, thème).
   Port vanilla du composant React d'origine, comportement identique. */
(function () {

  /* ---------- thème (jour/nuit) ---------- */
  window.INNOVA_toggleTheme = function () {
    var night = !(window.INNOVA_NIGHT && window.INNOVA_NIGHT());
    if (window.INNOVA_SET_NIGHT) window.INNOVA_SET_NIGHT(night);
    document.querySelectorAll('[data-theme-glyph]').forEach(function (el) {
      el.textContent = night ? '☀' : '☾';
    });
  };

  window.INNOVA_scrollToTop = function () {
    var boxes = [document.scrollingElement, document.body, document.documentElement];
    var box = boxes.find(function (el) { return el && el.scrollTop > 0; });
    (box || window).scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.addEventListener('DOMContentLoaded', function () {
    var glyph = document.querySelector('[data-theme-glyph]');
    if (glyph && window.INNOVA_NIGHT) glyph.textContent = window.INNOVA_NIGHT() ? '☀' : '☾';
  });

  /* ---------- carrousel des 6 pôles (auto-défilement + survol + clic) ---------- */
  function setupPoleCards() {
    var cards = Array.from(document.querySelectorAll('[data-pole-card]'));
    if (!cards.length) return;
    var n = cards.length;

    function setActive(i) {
      cards.forEach(function (c, k) { c.toggleAttribute('data-active', k === i); });
    }

    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () { setActive(i); });
      card.addEventListener('focus', function () { setActive(i); });
      card.addEventListener('click', function (e) {
        if (!card.hasAttribute('data-active')) {
          e.preventDefault();
          setActive(i);
        }
        // sinon : déjà actif -> laisser le lien naviguer normalement
      });
    });

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var hover = false, visible = true, cur = 0;
    var wrap = document.querySelector('[data-pole-cards]');
    var timer = setInterval(function () {
      if (hover || !visible) return;
      cur = (cur + 1) % n;
      setActive(cur);
    }, 3800);
    if (wrap) {
      wrap.addEventListener('mouseenter', function () { hover = true; });
      wrap.addEventListener('mouseleave', function () { hover = false; });
      wrap.addEventListener('focusin', function () { hover = true; });
      wrap.addEventListener('focusout', function () { hover = false; });
      if (typeof IntersectionObserver === 'function') {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.2 }).observe(wrap);
      }
    }
    // garder cur synchronisé si l'utilisateur survole une carte manuellement
    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () { cur = i; });
    });
  }

  /* ---------- compteur animé des chiffres clés ---------- */
  function setupStatCount() {
    var nodes = Array.from(document.querySelectorAll('[data-stat-value]'));
    if (!nodes.length) return;
    function run(el) {
      var final = el.getAttribute('data-final') || el.textContent;
      var m = final.match(/^([^0-9]*)([0-9]+(?:[.,][0-9]+)?)(.*)$/);
      if (!m) return;
      var pre = m[1], numStr = m[2], post = m[3];
      var target = parseFloat(numStr.replace(',', '.'));
      var dec = (numStr.split(/[.,]/)[1] || '').length;
      var t0 = performance.now(), dur = 1500;
      function tick(t) {
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + (target * e).toFixed(dec) + post;
        if (k < 1) requestAnimationFrame(tick); else el.textContent = final;
      }
      el.textContent = pre + (0).toFixed(dec) + post;
      requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !en.target.dataset.counted) {
          en.target.dataset.counted = '1';
          run(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- hero : slideshow vidéo (5 scènes, 9s, grain au changement) ---------- */
  var heroVisible = true;
  function setupHeroSlideshow() {
    var slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
    if (!slides.length) return;
    var grain = document.querySelector('[data-hero-grain]');
    var i = 0, timer = 0;

    var kick = function () {
      if (heroVisible === false) { slides.forEach(function (v) { if (!v.paused) v.pause(); }); return; }
      var active = slides.find(function (v) { return v.hasAttribute('data-active'); });
      slides.forEach(function (v) { if (v !== active && !v.paused) v.pause(); });
      if (!active || !active.paused) return;
      var p = active.play();
      if (p && p.catch) p.catch(function () {});
    };

    var show = function (n) {
      if (grain) { grain.style.opacity = '0.62'; setTimeout(function () { grain.style.opacity = '0.16'; }, 2000); }
      slides.forEach(function (v, k) {
        if (k === n) { v.preload = 'auto'; v.setAttribute('data-active', ''); }
        else { v.removeAttribute('data-active'); setTimeout(function () { if (!v.hasAttribute('data-active')) v.pause(); }, 2700); }
      });
      var next = slides[(n + 1) % slides.length];
      next.preload = 'auto';
      if (next.readyState < 2) next.load();
      kick();
    };

    slides.forEach(function (v) {
      v.addEventListener('canplay', kick);
      v.addEventListener('suspend', kick);
      v.addEventListener('pause', kick);
    });
    setInterval(kick, 2000);
    window.addEventListener('pointerdown', kick, { passive: true });
    window.addEventListener('scroll', kick, { passive: true });
    slides.forEach(function (v, k) { if (k !== 0) v.pause(); });

    show(0);
    var advance = function () {
      if (heroVisible === false) { timer = setTimeout(advance, 3000); return; }
      i = (i + 1) % slides.length;
      show(i);
      timer = setTimeout(advance, 9000);
    };
    timer = setTimeout(advance, 9000);

    var box = document.querySelector('[data-hero-slideshow]');
    if (box && typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        slides.forEach(function (v) {
          if (!heroVisible) { if (!v.paused) v.pause(); return; }
          if (v.hasAttribute('data-active') && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        });
      }, { threshold: 0.01 }).observe(box);
    }
    slides.forEach(function (v) { v.loop = true; v.muted = true; v.volume = 0.7; });
  }

  /* ---------- hero : réseau de particules interactif (canvas) ---------- */
  function setupHeroNetwork() {
    var canvas = document.querySelector('[data-hero-net]');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var LINE = '138,77,255', ACCENT = '185,140,255', NODE = '#C4A6FF';
    var W = 0, H = 0, DPR = 1, parts = [];
    var mouse = { x: null, y: null, r: 150 };
    var rand = function (a, b) { return a + Math.random() * (b - a); };

    function init() {
      parts = [];
      var n = Math.min(120, Math.round((W * H) / 12000));
      for (var i = 0; i < n; i++) {
        var size = rand(1.1, 2.6);
        parts.push({ x: rand(size * 2, W - size * 2), y: rand(size * 2, H - size * 2), vx: rand(-0.22, 0.22), vy: rand(-0.22, 0.22), size: size, accent: Math.random() < 0.14 });
      }
    }
    function resize() {
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); init();
    }
    function drawNode(p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7);
      if (p.accent) { ctx.fillStyle = 'rgba(' + ACCENT + ',.95)'; ctx.shadowColor = 'rgba(' + ACCENT + ',.8)'; ctx.shadowBlur = 8; }
      else { ctx.fillStyle = NODE; ctx.shadowColor = 'rgba(' + LINE + ',.7)'; ctx.shadowBlur = 5; }
      ctx.fill(); ctx.shadowBlur = 0;
    }
    function connect() {
      var maxD = (W / 7) * (H / 7);
      for (var a = 0; a < parts.length; a++) {
        for (var b = a + 1; b < parts.length; b++) {
          var dx = parts[a].x - parts[b].x, dy = parts[a].y - parts[b].y, d = dx * dx + dy * dy;
          if (d < maxD) {
            var op = 1 - d / 22000; if (op <= 0) continue;
            var near = false;
            if (mouse.x != null) { var mx = parts[a].x - mouse.x, my = parts[a].y - mouse.y; near = (mx * mx + my * my) < mouse.r * mouse.r; }
            ctx.strokeStyle = near ? 'rgba(' + ACCENT + ',' + (op * .9) + ')' : 'rgba(' + LINE + ',' + (op * .55) + ')';
            ctx.lineWidth = near ? 1.4 : 0.9;
            ctx.beginPath(); ctx.moveTo(parts[a].x, parts[a].y); ctx.lineTo(parts[b].x, parts[b].y); ctx.stroke();
          }
        }
      }
    }
    function step(move) {
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        if (move) {
          if (p.x > W || p.x < 0) p.vx = -p.vx;
          if (p.y > H || p.y < 0) p.vy = -p.vy;
          if (mouse.x != null) {
            var dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.hypot(dx, dy);
            if (dist < mouse.r + p.size && dist > 0) {
              var f = (mouse.r - dist) / mouse.r;
              p.x -= (dx / dist) * f * 4; p.y -= (dy / dist) * f * 4;
            }
          }
          p.x += p.vx; p.y += p.vy;
        }
        drawNode(p);
      }
      connect();
    }
    addEventListener('resize', resize);
    addEventListener('mousemove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    addEventListener('mouseout', function () { mouse.x = null; mouse.y = null; });
    resize();
    if (reduced) { step(false); return; }
    (function loop() { step(true); requestAnimationFrame(loop); })();
  }

  function boot() {
    setupPoleCards();
    setupStatCount();
    setupHeroSlideshow();
    setupHeroNetwork();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
